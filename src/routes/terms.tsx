import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/terms")({ component: Terms });

const updated = "June 25, 2026";

const termsSections = [
  {
    title: "1. What Synco does",
    body: [
      "Synco helps a class make student teams. A class lead creates a class, shares a code, classmates answer a short form, and Synco suggests teams with short reasons.",
      "Synco is a planning tool. It does not make final school, grading, discipline, safety, or legal decisions. A real person should review the team plan before using it in class.",
    ],
  },
  {
    title: "2. Who can use Synco",
    body: [
      "You may use Synco if you can legally agree to these terms, or if a school, parent, guardian, or class lead has allowed you to use it for a class.",
      "If you are under 13, you may use Synco only when your school, parent, guardian, or another authorized adult has approved that use. Do not create an account on your own if you are not allowed to do so.",
      "If you create a class for other people, you are responsible for making sure you have permission to invite them and collect their class responses.",
    ],
  },
  {
    title: "3. Accounts and class roles",
    items: [
      "Keep your login details private and do not share another person's account.",
      "Use your real class name or display name when a class requires it.",
      "A class lead can create a class, set a team size, manage who joins, view submitted class responses as allowed by the app, generate team results, and share those results.",
      "A class member can join a class, submit answers, see their own results, and see the team information made available to them.",
      "Authorized platform admins can review accounts, classes, survey records, team results, feedback, activity records, and audit logs to operate Synco, investigate problems, and protect the service.",
      "Tell the class lead or Synco operator if you think someone joined the wrong class or used the wrong name.",
    ],
  },
  {
    title: "4. Your content and class data",
    body: [
      "Your content includes names, class details, join identifiers, form answers, do-not-pair notes, friend or work-with requests, team results, feedback, and any other information added to Synco.",
      "You keep any rights you already have in your content. By adding content to Synco, you allow Synco to use it only to run the service, create teams, show results, protect the service, fix problems, and provide support.",
      "Do not add private information that is not needed for making teams. Do not add home addresses, medical details, government ID numbers, passwords, payment details, or other sensitive information unless Synco clearly asks for it, which it normally should not.",
    ],
  },
  {
    title: "5. Team suggestions and results",
    body: [
      "Synco uses answers and class rules to suggest teams. The result may be useful, but it may not be perfect.",
      "Team reasons are meant to explain the suggestion in simple terms. They should not be treated as a complete judgment of a person's ability, character, effort, or value.",
      "If a team result looks wrong, unfair, unsafe, or based on bad data, the class lead should review it before using it.",
    ],
  },
  {
    title: "6. Things you must not do",
    items: [
      "Do not use Synco to bully, harass, shame, threaten, or single out another person.",
      "Do not submit false answers to manipulate team results.",
      "Do not try to view a class, answer, account, or result you are not allowed to see.",
      "Do not upload malware, attack the app, scrape private data, or try to bypass security.",
      "Do not use Synco for illegal activity or in a way that breaks school rules that apply to you.",
      "Do not use team results as the only basis for grading, punishment, formal complaints, or other serious decisions.",
    ],
  },
  {
    title: "7. Privacy",
    body: [
      "The Privacy Policy explains what information Synco collects, how it is used, who may see it, and how deletion requests work. By using Synco, you agree that your information will be handled as described there.",
      "Class leads should not invite people to Synco unless they have permission to collect the information needed for team formation.",
      "Synco may record operational activity such as recent page paths and last seen time for signed-in users so authorized platform admins can monitor service health and security.",
    ],
  },
  {
    title: "8. School and class responsibilities",
    body: [
      "If Synco is used for a school class, the school or class lead may have separate duties under school policy or student privacy laws. Synco does not replace those duties.",
      "Class leads are responsible for choosing an appropriate team size, checking results before sharing them, handling late answers fairly, and responding to student concerns.",
    ],
  },
  {
    title: "9. Service availability",
    body: [
      "Synco may change, pause, or stop parts of the service. We try to keep it working, but we do not promise that it will always be available, error-free, or fit every class situation.",
      "You should keep your own copy of anything your class needs outside Synco, especially if the class depends on team results for an important deadline.",
    ],
  },
  {
    title: "10. Third-party services",
    body: [
      "Synco may use trusted service providers for hosting, login, database storage, email, analytics, error logging, and similar operations. Those providers may process information only so Synco can work and be protected.",
      "Synco is not responsible for third-party websites or services linked from the app that are not controlled by Synco.",
    ],
  },
  {
    title: "11. Ending use and deleting data",
    body: [
      "You can stop using Synco at any time. A class lead may delete a class, and account or data deletion requests can be sent through the available support contact.",
      "Some information may remain for a limited time in backups, logs, security records, or records needed to comply with law, prevent abuse, or resolve disputes.",
    ],
  },
  {
    title: "12. Intellectual property",
    body: [
      "Synco, including its name, design, code, text, and product experience, belongs to its owner or licensors. You may not copy, resell, or rebuild the service without permission.",
      "You may use class results for the class or project they were created for, as long as you respect the privacy and rights of classmates.",
    ],
  },
  {
    title: "13. Disclaimers",
    body: [
      "Synco is provided as-is and as-available. To the fullest extent allowed by law, we disclaim implied warranties, including warranties of merchantability, fitness for a particular purpose, and non-infringement.",
      "Some places do not allow certain disclaimers, so some of this section may not apply to you.",
    ],
  },
  {
    title: "14. Limitation of liability",
    body: [
      "To the fullest extent allowed by law, Synco will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost data, lost work, lost grades, or class disputes caused by use of the service.",
      "If liability cannot be fully limited, Synco's total liability will be limited to the amount you paid to use Synco in the three months before the issue, or 100 USD if you paid nothing.",
    ],
  },
  {
    title: "15. Changes to these terms",
    body: [
      "We may update these terms as Synco changes. If changes are important, we will try to give notice in the app or by another reasonable method. Continuing to use Synco after changes means you accept the updated terms.",
    ],
  },
  {
    title: "16. Contact",
    body: [
      "For questions about these terms, use the support contact provided in the app, class invite, or project materials. Before public launch, Synco should add a dedicated support email here.",
    ],
  },
];

function Terms() {
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
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Terms</p>
          <h1 className="mt-3 font-sans text-3xl font-semibold tracking-normal sm:text-4xl">
            Terms of service
          </h1>
          <p className="mt-3 text-sm text-muted">Last updated: {updated}</p>
          <div className="mt-6 rounded-[8px] border border-border bg-card p-4 text-sm leading-7 text-muted">
            These terms are written in plain language for Synco users. They should be reviewed by a
            qualified lawyer before the platform is relied on for a public launch, school-wide use,
            or paid service.
          </div>

          <div className="mt-10 space-y-9">
            {termsSections.map((section) => (
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
