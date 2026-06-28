export type SurveyQuestion = {
  id: string;
  framing: string;
  question: string;
  low: string;
  high: string;
};

export type OptionalTextSurveyField = {
  id: "wantToWorkWith" | "friendsInClass" | "doNotPairWith";
  label: string;
  placeholder: string;
  hint: string;
};

export const OPTIONAL_TEXT_SURVEY_FIELDS: OptionalTextSurveyField[] = [
  {
    id: "wantToWorkWith",
    label: "Would like to work with (optional)",
    placeholder: "Names or roll numbers, separated by commas. Leave blank if none.",
    hint: "If both people choose each other, Synco tries harder to keep them together.",
  },
  {
    id: "friendsInClass",
    label: "Friends in this class",
    placeholder: "Names or roll numbers, separated by commas. Leave blank if none.",
    hint: "Synco checks if the match data agrees with the friendship.",
  },
  {
    id: "doNotPairWith",
    label: "Do not pair me with",
    placeholder: "Names or roll numbers, separated by commas. Leave blank if none.",
    hint: "Synco will avoid this pairing. Use roll numbers if two people have the same name.",
  },
];

export const QUESTIONS: SurveyQuestion[] = [
  {
    id: "q1",
    framing: "Starting a group project",
    question: "What helps you get started?",
    low: "Clear tasks first",
    high: "A rough goal is enough",
  },
  {
    id: "q2",
    framing: "Team messages",
    question: "What message style is easier for you?",
    low: "Short updates often",
    high: "Fewer longer updates",
  },
  {
    id: "q3",
    framing: "Deadlines",
    question: "When do you usually finish your part?",
    low: "Early",
    high: "Near the deadline",
  },
  {
    id: "q4",
    framing: "Focus",
    question: "Where do you work best?",
    low: "Quiet and focused",
    high: "Active and fast moving",
  },
  {
    id: "q5",
    framing: "Understanding work",
    question: "How do you understand a hard task?",
    low: "Step by step",
    high: "Big picture first",
  },
  {
    id: "q6",
    framing: "Helping others",
    question: "How comfortable are you explaining things?",
    low: "Not very comfortable",
    high: "Very comfortable",
  },
  {
    id: "q7",
    framing: "When the team slows down",
    question: "What do you usually do?",
    low: "Wait for direction",
    high: "Help set the next move",
  },
  {
    id: "q8",
    framing: "Starting your own task",
    question: "How do you begin?",
    low: "Plan first",
    high: "Start and adjust",
  },
  {
    id: "q9",
    framing: "Limited time",
    question: "What feels more natural?",
    low: "Do less, carefully",
    high: "Cover more, faster",
  },
  {
    id: "q10",
    framing: "Your weekly schedule",
    question: "How predictable is your schedule?",
    low: "Predictable",
    high: "Changes a lot",
  },
  {
    id: "q11",
    framing: "Dividing team work",
    question: "What setup helps you contribute?",
    low: "Clear roles",
    high: "Flexible roles",
  },
  {
    id: "q12",
    framing: "Getting stuck",
    question: "What do you usually do first?",
    low: "Try alone longer",
    high: "Ask early",
  },
  {
    id: "q13",
    framing: "Disagreement",
    question: "How do you usually handle it?",
    low: "Say my view directly",
    high: "Keep peace first",
  },
  {
    id: "q14",
    framing: "Meeting outside class",
    question: "How easy is it to meet in person?",
    low: "Hard",
    high: "Easy most weeks",
  },
  {
    id: "q15",
    framing: "Class or lab sessions",
    question: "How predictable is your presence?",
    low: "Changes often",
    high: "Usually the same",
  },
  {
    id: "q16",
    framing: "Online teamwork",
    question: "How reliable is your internet/device setup?",
    low: "Sometimes unreliable",
    high: "Reliable",
  },
  {
    id: "q17",
    framing: "New teammates",
    question: "How comfortable are you starting the first chat?",
    low: "I need a clear intro",
    high: "I can reach out",
  },
  {
    id: "q18",
    framing: "Team standards",
    question: "What kind of push helps you do good work?",
    low: "Gentle support",
    high: "High standards",
  },
  {
    id: "q19",
    framing: "Explaining ideas",
    question: "What explanation style feels natural?",
    low: "Precise terms",
    high: "Simple examples",
  },
  {
    id: "q20",
    framing: "Time after class",
    question: "How safe is your project time?",
    low: "Often interrupted",
    high: "Mostly under my control",
  },
  {
    id: "q21",
    framing: "Follow-up",
    question: "What keeps you moving?",
    low: "Gentle reminders",
    high: "Strict deadlines",
  },
  {
    id: "q22",
    framing: "Team support",
    question: "What should teamwork help with most?",
    low: "Practice and finishing",
    high: "Projects and deeper ideas",
  },
];
