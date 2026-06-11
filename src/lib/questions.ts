export type SurveyQuestion = {
  id: string;
  framing: string;
  question: string;
  low: string;
  high: string;
};

export const QUESTIONS: SurveyQuestion[] = [
  {
    id: "q1",
    framing: "Think about how you usually start group work.",
    question: "When beginning a project, what feels most natural?",
    low: "I need clear assigned tasks before I start",
    high: "I can start from ambiguity and shape the plan",
  },
  {
    id: "q2",
    framing: "Think about staying in touch during a project.",
    question: "How do you prefer to communicate with teammates?",
    low: "Quick, frequent check-ins",
    high: "Fewer, longer sync sessions",
  },
  {
    id: "q3",
    framing: "Think about your last group deadline.",
    question: "How do you usually handle deadlines?",
    low: "I submit early — buffer time feels important",
    high: "I work right up to the deadline — pressure helps",
  },
  {
    id: "q4",
    framing: "Think about where you do your best work.",
    question: "What describes your focus style?",
    low: "I need quiet and no interruptions",
    high: "I work fine in noisy, switching environments",
  },
  {
    id: "q5",
    framing: "Think about learning new material in a course.",
    question: "What's more true for you?",
    low: "I understand each part fully before moving on",
    high: "I prefer the big picture first, fill gaps later",
  },
  {
    id: "q6",
    framing: "Think about a time someone asked you for help.",
    question: "How comfortable are you explaining difficult concepts?",
    low: "I prefer not to — I worry I'll explain it wrong",
    high: "I enjoy it — teaching helps me understand too",
  },
  {
    id: "q7",
    framing: "Think about group projects with no assigned leader.",
    question: "What do you usually do when no one steps up?",
    low: "I wait for someone else to take charge",
    high: "I naturally start organizing things",
  },
  {
    id: "q8",
    framing: "Think about your process when you have a task.",
    question: "How do you usually tackle your tasks?",
    low: "I plan carefully and follow the steps in order",
    high: "I start quickly and make adjustments as I go",
  },
  {
    id: "q9",
    framing: "Think about balancing quality and time.",
    question: "When time is limited, what do you prioritize?",
    low: "Fewer things, done deeply",
    high: "More ground covered, even if less thorough",
  },
  {
    id: "q10",
    framing: "Think about your week-to-week availability.",
    question: "How consistent is your schedule?",
    low: "Very consistent — I can commit to fixed meeting times",
    high: "Quite variable — I need scheduling flexibility",
  },
  {
    id: "q11",
    framing: "Think about how you work best on a team.",
    question: "What kind of team environment works best for you?",
    low: "Highly structured: clear roles and defined tasks",
    high: "Flexible and collaborative: shared tasks and fluid roles",
  },
  {
    id: "q12",
    framing: "Think about when you get stuck on a problem.",
    question: "What do you most often do?",
    low: "I keep trying on my own until I figure it out",
    high: "I ask for help early — it's more efficient",
  },
  {
    id: "q13",
    framing: "Think about disagreements in group work.",
    question: "When your opinion differs from a teammate's, you usually:",
    low: "Voice my view clearly and advocate for it",
    high: "Tend to defer — keeping harmony feels more important",
  },
  {
    id: "q14",
    framing: "Think about meeting after class or outside normal hours.",
    question: "How easy is it for you to meet around campus or nearby?",
    low: "I usually need careful planning around travel or timing",
    high: "I can stay back or meet nearby without much trouble",
  },
  {
    id: "q15",
    framing: "Think about your usual attendance pattern.",
    question: "How predictable is your presence in class or lab sessions?",
    low: "It changes week to week",
    high: "I am usually present at the same sessions",
  },
  {
    id: "q16",
    framing: "Think about online study sessions.",
    question: "How reliable is your device and internet setup for calls or shared work?",
    low: "It can be unreliable",
    high: "I can join online sessions reliably",
  },
  {
    id: "q17",
    framing: "Think about being paired with someone you do not already know.",
    question: "How comfortable are you starting with a new classmate?",
    low: "I need an introduction and a clear first step",
    high: "I am comfortable reaching out directly",
  },
  {
    id: "q18",
    framing: "Think about the level of drive you want from a study partner.",
    question: "What kind of motivation style helps you perform best?",
    low: "Gentle support and a relaxed, steady pace",
    high: "High standards and active, mutual encouragement",
  },
  {
    id: "q19",
    framing: "Think about how you explain ideas during a discussion.",
    question: "How do you prefer to explain difficult concepts?",
    low: "I prefer staying with the exact terms from class",
    high: "I like using analogies, different terms, or other languages",
  },
  {
    id: "q20",
    framing: "Think about your time outside class.",
    question: "How predictable is your study time after classes end?",
    low: "Often affected by home, work, travel, or other responsibilities",
    high: "Usually under my control",
  },
  {
    id: "q21",
    framing: "Think about accountability.",
    question: "What kind of follow-up keeps you on track?",
    low: "Gentle reminders work better for me",
    high: "Strict deadlines and direct follow-up work better for me",
  },
  {
    id: "q22",
    framing: "Think about what you need most from peer study.",
    question: "What should your study sessions focus on?",
    low: "Exam practice, past papers, and quick revision",
    high: "Assignments, projects, and deeper concepts",
  },
];
