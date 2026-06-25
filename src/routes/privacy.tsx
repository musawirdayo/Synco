import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/privacy")({ component: Privacy });

const updated = "June 25, 2026";

const privacySections = [
  {
    title: "1. What this policy covers",
    body: [
      "This Privacy Policy explains how Synco collects, uses, shares, stores, and deletes information when people use the platform to create classes, join classes, answer team questions, and view team results.",
      "Synco is built for class team formation. We try to collect only the information needed to help a class make fairer teams and explain those teams in plain language.",
    ],
  },
  {
    title: "2. Information we collect",
    items: [
      "Account information: name, email address, password handled through authentication tools, profile role, and login details needed to keep your account working.",
      "Class information: class name, invite code, expected class size, team size, class settings, and whether joining is limited to certain identifiers.",
      "Join information: display name, roll number, email, student ID, or similar identifier if the class requires it.",
      "Survey answers: answers about free time, work habits, class goals, skills, preferred teammates, do-not-pair names, friends in class, and similar team-forming details.",
      "Team results: team assignments, match scores, match reasons, people to work well with, people to be careful with, and version history for shared results.",
      "Feedback: simple feedback choices or comments about whether a result was useful.",
      "Technical information: device, browser, app logs, error logs, security events, and basic usage data needed to run, protect, and improve Synco.",
      "Admin operation information: for signed-in users, Synco may record recent activity such as last seen time, recent page path, and browser details so platform admins can monitor security, support issues, and service health.",
    ],
  },
  {
    title: "3. How we use information",
    items: [
      "To create accounts and let people sign in.",
      "To let class leads create classes and classmates join the correct class.",
      "To collect answers and make team suggestions.",
      "To explain why a team or match was suggested.",
      "To show each person their own results and team information.",
      "To help class leads manage class membership, missing responses, late responses, and shared results.",
      "To prevent abuse, protect accounts, fix bugs, and keep the platform reliable.",
      "To let authorized platform admins review activity, investigate problems, handle support, and remove abusive or broken data.",
      "To respond to support requests and improve Synco.",
    ],
  },
  {
    title: "4. Who can see what",
    body: [
      "Classmates do not see each other's raw survey answers. Results shown to classmates focus on their own team, teammates, match reasons, and any personal match lists made available by the app.",
      "A class lead may see class membership, display names, identifiers used for joining, submission status, team assignments, shared result summaries, and other class management information.",
      "Depending on the class settings and app view, a class lead may be able to review submitted answers or reports needed to check team results. Class leads should use that access only for the class purpose.",
      "A small number of authorized platform admins may see account, class, survey, result, feedback, activity, and audit details across the platform to operate and protect Synco. Admin actions may be logged.",
    ],
  },
  {
    title: "5. How information is shared",
    body: [
      "We do not sell personal information. We do not use student answers for third-party advertising.",
      "We may share information with service providers that help run Synco, such as hosting, database, authentication, email, security, analytics, or error logging providers. They may process information only to provide those services to Synco.",
      "We may share information if required by law, to protect people, to investigate abuse, to secure the service, or to respond to a valid legal request.",
      "If Synco is used through a school, class, or organization, that school, class, or organization may control parts of the class data and may have its own privacy rules.",
    ],
  },
  {
    title: "6. Student and minor privacy",
    body: [
      "Synco may be used by students. If a class includes minors, the class lead or school should make sure they have the right permission before inviting students and collecting answers.",
      "Children under 13 should not use Synco unless a school, parent, guardian, or other authorized adult has approved the use. Synco should not be used to collect more information from children than needed to make class teams.",
      "If a parent, guardian, student, or school believes information was collected without permission, they should contact the class lead or Synco support so the issue can be reviewed.",
    ],
  },
  {
    title: "7. How long we keep information",
    body: [
      "Synco keeps information for as long as needed to provide the class, show results, maintain accounts, protect the service, comply with legal duties, and handle support or disputes.",
      "Class data may be deleted when a class lead deletes the class, when an account is removed, or when Synco no longer needs the data. Some copies may remain for a limited time in backups, logs, security records, or legal records.",
    ],
  },
  {
    title: "8. Your choices",
    items: [
      "You can choose not to join a class or not to submit answers, but that may mean you cannot be included in team results.",
      "You can ask the class lead to correct your name, identifier, or class membership if it is wrong.",
      "You can ask for your account or class data to be deleted through the available support contact.",
      "If your school controls the class, you may need to make access, correction, or deletion requests through the school or class lead.",
    ],
  },
  {
    title: "9. Security",
    body: [
      "Synco uses reasonable technical and organizational measures to protect information, including access controls, authentication, database security rules, and limited access to class data.",
      "No online service can promise perfect security. If you think your account or class data has been exposed, tell the class lead or Synco support as soon as possible.",
    ],
  },
  {
    title: "10. International use",
    body: [
      "Synco may be hosted or supported in countries different from where you live. By using Synco, you understand that information may be processed in those locations, subject to this policy and applicable law.",
    ],
  },
  {
    title: "11. Changes to this policy",
    body: [
      "We may update this Privacy Policy as Synco changes. If the changes are important, we will try to give notice in the app or by another reasonable method. The date at the top shows when this policy was last updated.",
    ],
  },
  {
    title: "12. Contact",
    body: [
      "For privacy questions, use the support contact provided in the app, class invite, or project materials. Before public launch, Synco should add a dedicated privacy email here.",
    ],
  },
];

function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PolicyHeader />
      <main className="px-4 py-8 sm:px-6 md:px-12">
        <motion.article
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mx-auto max-w-3xl"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Privacy</p>
          <h1 className="mt-3 font-sans text-3xl font-semibold tracking-normal sm:text-4xl">
            Privacy policy
          </h1>
          <p className="mt-3 text-sm text-muted">Last updated: {updated}</p>
          <div className="mt-6 rounded-[8px] border border-border bg-card p-4 text-sm leading-7 text-muted">
            This policy is written for Synco's current class team-forming product. It should be
            reviewed by a qualified privacy professional before public launch, school-wide use, or
            use with children.
          </div>

          <div className="mt-10 space-y-9">
            {privacySections.map((section) => (
              <section key={section.title}>
                <h2 className="font-sans text-xl font-semibold tracking-normal">{section.title}</h2>
                {section.body ? (
                  <div className="mt-3 space-y-3 text-sm leading-7 text-muted">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                ) : null}
                {section.items ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-muted">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </motion.article>
      </main>
    </div>
  );
}

function PolicyHeader() {
  return (
    <header className="border-b border-border/70 px-4 py-5 sm:px-6 md:px-12">
      <Link to="/" className="inline-flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-[8px] bg-primary text-sm font-semibold text-primary-foreground">
          S
        </div>
        <span className="text-base font-semibold">Synco</span>
      </Link>
    </header>
  );
}
