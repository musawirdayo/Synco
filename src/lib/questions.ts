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
    placeholder: "Names or identifiers, separated by commas. Leave blank if none.",
    hint: "Mutual requests are prioritized when teams are formed.",
  },
  {
    id: "friendsInClass",
    label: "Friends in this class",
    placeholder: "Names or identifiers, separated by commas. Leave blank if none.",
    hint: "We'll check if the data agrees with you.",
  },
  {
    id: "doNotPairWith",
    label: "Do not pair me with",
    placeholder: "Names or identifiers, separated by commas. Leave blank if none.",
    hint: "This is treated as a hard constraint before scores are calculated.",
  },
];

export const QUESTIONS: SurveyQuestion[] = [
  {
    id: "q1",
    framing: "Think about the first day of a group project.",
    question: "What helps you start useful work?",
    low: "Clear tasks and a simple plan before I begin",
    high: "A rough goal is enough - I can shape the plan",
  },
  {
    id: "q2",
    framing: "Think about team messages during an active project.",
    question: "What communication rhythm feels easiest to keep up with?",
    low: "Short updates often",
    high: "Fewer, deeper updates",
  },
  {
    id: "q3",
    framing: "Think about the last time you had a deadline.",
    question: "When do you usually finish your part?",
    low: "Early, with buffer time",
    high: "Close to the deadline, in a focused push",
  },
  {
    id: "q4",
    framing: "Think about doing your share of team work.",
    question: "What kind of environment helps you produce your best work?",
    low: "Quiet focus with few interruptions",
    high: "Active rooms, quick changes, and switching tasks",
  },
  {
    id: "q5",
    framing: "Think about solving a difficult part of a project.",
    question: "How do you usually understand the work?",
    low: "Step by step, making each part clear",
    high: "Big picture first, then fill the gaps",
  },
  {
    id: "q6",
    framing: "Think about a teammate getting stuck.",
    question: "How comfortable are you helping them understand something you know?",
    low: "Not very - I worry I will explain it badly",
    high: "Comfortable - explaining helps me too",
  },
  {
    id: "q7",
    framing: "Think about a team with no clear next step.",
    question: "What do you usually do when the group loses momentum?",
    low: "I wait for someone else to take charge",
    high: "I start organizing the next move",
  },
  {
    id: "q8",
    framing: "Think about receiving your part of the project.",
    question: "How do you usually begin a task?",
    low: "Plan carefully, then follow the steps",
    high: "Start quickly, then adjust as I learn",
  },
  {
    id: "q9",
    framing: "Think about a project with limited time.",
    question: "What tradeoff feels more natural?",
    low: "Do fewer things, but do them carefully",
    high: "Cover more ground, even if it is less polished",
  },
  {
    id: "q10",
    framing: "Think about the next few weeks.",
    question: "How predictable is your schedule?",
    low: "Predictable - I can commit to fixed times",
    high: "Variable - I need flexibility",
  },
  {
    id: "q11",
    framing: "Think about dividing work inside a team.",
    question: "What setup helps you contribute best?",
    low: "Highly structured: clear roles and defined tasks",
    high: "Flexible: shared tasks and changing roles",
  },
  {
    id: "q12",
    framing: "Think about getting stuck on your assigned work.",
    question: "What do you usually do first?",
    low: "Keep trying alone until I figure it out",
    high: "Ask for help early so time is not wasted",
  },
  {
    id: "q13",
    framing: "Think about disagreeing with a teammate.",
    question: "How do you usually handle it?",
    low: "Say my view clearly and push for the best option",
    high: "Keep peace first, even if I step back",
  },
  {
    id: "q14",
    framing: "Think about live meetings outside normal class time.",
    question: "How easy is it for you to meet nearby?",
    low: "Hard without careful planning",
    high: "Easy enough most weeks",
  },
  {
    id: "q15",
    framing: "Think about class or lab sessions.",
    question: "How predictable is your presence?",
    low: "It changes from week to week",
    high: "I am usually present at the same sessions",
  },
  {
    id: "q16",
    framing: "Think about online calls or shared documents.",
    question: "How reliable is your setup for online teamwork?",
    low: "It can be unreliable",
    high: "It is reliable enough for team work",
  },
  {
    id: "q17",
    framing: "Think about being teamed with someone new.",
    question: "How comfortable are you making the first move?",
    low: "I need an introduction and a clear first step",
    high: "I can reach out directly",
  },
  {
    id: "q18",
    framing: "Think about the standard you want from the team.",
    question: "What level of push helps you do good work?",
    low: "Gentle support and a steady pace",
    high: "High standards and active follow-through",
  },
  {
    id: "q19",
    framing: "Think about explaining an idea to your group.",
    question: "What style feels most natural?",
    low: "Use exact class terms and stay precise",
    high: "Use examples, comparisons, or simpler wording",
  },
  {
    id: "q20",
    framing: "Think about your time after class.",
    question: "How protected is your project work time?",
    low: "Often affected by home, work, travel, or other responsibilities",
    high: "Usually under my control",
  },
  {
    id: "q21",
    framing: "Think about follow-up from teammates.",
    question: "What kind of accountability keeps you moving?",
    low: "Gentle reminders work better for me",
    high: "Strict deadlines and direct follow-up work better for me",
  },
  {
    id: "q22",
    framing: "Think about where teammate support would be most useful.",
    question: "What should your teamwork focus on?",
    low: "Quick practice, revision, and finishing tasks",
    high: "Projects, assignments, and deeper concepts",
  },
];
