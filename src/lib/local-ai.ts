type CountMap = Record<string, number | undefined>;

export type LocalAiInsight = {
  action: string;
  body: string;
  id: string;
  priority: "high" | "medium" | "low";
  signal: string;
  title: string;
};

type RecentClassSignal = {
  completed_count?: number;
  expected_count?: number;
  is_published?: boolean;
  member_count?: number;
  name?: string | null;
};

type PlatformBrainInput = {
  contentPages?: number;
  counts?: CountMap;
  recentClasses?: RecentClassSignal[];
};

export function generatePlatformBrainInsights(input: PlatformBrainInput): LocalAiInsight[] {
  const counts = input.counts ?? {};
  const insights: LocalAiInsight[] = [];
  const surveyResponses = counts.survey_responses ?? 0;
  const completedSurveys = counts.completed_surveys ?? 0;
  const classes = counts.classes ?? 0;
  const publishedClasses = counts.published_classes ?? 0;
  const feedbackTotal = counts.feedback_total ?? 0;
  const feedbackUseful = counts.feedback_useful ?? 0;
  const feedbackNotUseful = counts.feedback_not_useful ?? 0;
  const activeFiveMinutes = counts.active_5m ?? 0;

  if (classes === 0) {
    insights.push({
      id: "first-class",
      priority: "high",
      title: "Your next growth move is one real class",
      body: "The platform is ready, but the learning loop starts only when a class rep creates a class and students submit real surveys.",
      action: "Personally onboard one class rep and watch where students slow down.",
      signal: "0 classes found",
    });
  }

  if (classes > 0 && publishedClasses < classes) {
    const waiting = classes - publishedClasses;
    insights.push({
      id: "publish-gap",
      priority: waiting >= 3 ? "high" : "medium",
      title: "Some classes have not reached the payoff moment",
      body: "Students only feel the value after results are published. Unpublished classes are likely stuck at invite, survey, or lead-review stage.",
      action:
        "Open recent classes and help leads publish or republish once enough students submit.",
      signal: `${waiting} unpublished class${waiting === 1 ? "" : "es"}`,
    });
  }

  if (surveyResponses > 0) {
    const completionRate = Math.round((completedSurveys / surveyResponses) * 100);
    if (completionRate < 70) {
      insights.push({
        id: "survey-friction",
        priority: completionRate < 50 ? "high" : "medium",
        title: "Survey completion needs attention",
        body: "Students are starting the survey but not enough are finishing it. That usually means wording, length, or trust needs work.",
        action:
          "Review the survey intro, simplify any heavy question, and ask one student where they got bored.",
        signal: `${completionRate}% completion`,
      });
    } else {
      insights.push({
        id: "survey-health",
        priority: "low",
        title: "Survey completion looks healthy",
        body: "Enough students are finishing the flow for the matching engine to learn from real classroom behavior.",
        action: "Keep watching completion after every copy or UI change.",
        signal: `${completionRate}% completion`,
      });
    }
  }

  if (feedbackTotal >= 3 && feedbackNotUseful >= feedbackUseful) {
    insights.push({
      id: "feedback-risk",
      priority: "high",
      title: "Result feedback is warning you",
      body: "Students are saying results are not useful as often as they say useful. That is the strongest signal to inspect explanations, not only scores.",
      action:
        "Open recent classes, compare the top and avoid lists, and improve the proof text before changing weights.",
      signal: `${feedbackNotUseful}/${feedbackTotal} not useful`,
    });
  }

  const classNeedingResponses = (input.recentClasses ?? []).find((item) => {
    const expected = item.expected_count ?? 0;
    const completed = item.completed_count ?? 0;
    return expected > 0 && completed > 0 && completed < expected && !item.is_published;
  });

  if (classNeedingResponses) {
    insights.push({
      id: "response-nudge",
      priority: "medium",
      title: "A class may need a response nudge",
      body: "A class has some survey submissions but not enough to publish confidently. This is a good moment for a class-rep reminder message.",
      action: "Send the class lead a short reminder copy they can paste into the class group.",
      signal: `${classNeedingResponses.completed_count}/${classNeedingResponses.expected_count} completed in ${classNeedingResponses.name ?? "a recent class"}`,
    });
  }

  if ((input.contentPages ?? 0) < 3) {
    insights.push({
      id: "content-control",
      priority: "medium",
      title: "Public page controls are not fully ready",
      body: "Contact, Privacy, and Terms should all be editable from Master Control before you rely on the platform without code help.",
      action:
        "Apply the latest migration and confirm all three pages appear in Dev Content Control.",
      signal: `${input.contentPages ?? 0}/3 content pages loaded`,
    });
  }

  if (activeFiveMinutes > 0) {
    insights.push({
      id: "live-traffic",
      priority: "low",
      title: "People are active right now",
      body: "Live activity means this is a good time to observe the flow carefully. Confusion usually shows up while users are moving through join, survey, or results.",
      action: "Watch Live Activity and recent survey writes for the next few minutes.",
      signal: `${activeFiveMinutes} active in 5 minutes`,
    });
  }

  insights.push({
    id: "local-first-ai",
    priority: "low",
    title: "AI mode is local-first",
    body: "This brain reads platform signals already inside Synco and turns them into operating advice. No student data is sent to an outside AI provider.",
    action: "Use this for decisions and monitoring; keep matching changes reviewable and tested.",
    signal: "privacy-safe intelligence",
  });

  return insights.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority)).slice(0, 5);
}

function priorityRank(priority: LocalAiInsight["priority"]) {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  return 2;
}
