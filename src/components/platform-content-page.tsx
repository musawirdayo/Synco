import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PlatformContentKey = "privacy_policy" | "terms_of_service" | "contact_page";

type PlatformContent = {
  content_key: PlatformContentKey;
  title: string;
  summary: string | null;
  body: string;
  updated_at: string;
};

const fallbackContent: Record<PlatformContentKey, PlatformContent> = {
  privacy_policy: {
    content_key: "privacy_policy",
    title: "Privacy policy",
    summary:
      "This Privacy Policy explains how Synco handles account, class, survey, result, feedback, and operational data.",
    updated_at: "2026-06-25T00:00:00.000Z",
    body: `## 1. What this policy covers
This Privacy Policy explains how Synco collects, uses, shares, stores, and deletes information when people use the platform to create classes, join classes, answer team questions, and view team results.

Synco is built for class team formation. We try to collect only the information needed to help a class make fairer teams and explain those teams in plain language.

## 2. Information we collect
- Account information: name, email address, password handled through authentication tools, profile role, and login details needed to keep your account working.
- Class information: class name, invite code, expected class size, team size, class settings, and whether joining is limited to certain identifiers.
- Join information: display name, roll number, email, student ID, or similar identifier if the class requires it.
- Survey answers: answers about free time, work habits, class goals, skills, preferred teammates, do-not-pair names, friends in class, and similar team-forming details.
- Team results: team assignments, match scores, match reasons, people to work well with, people to be careful with, and version history for shared results.
- Feedback: simple feedback choices or comments about whether a result was useful.
- Technical information: device, browser, app logs, error logs, security events, and basic usage data needed to run, protect, and improve Synco.
- Admin operation information: recent activity such as last seen time, recent page path, and browser details so platform admins can monitor security, support issues, and service health.

## 3. How we use information
- To create accounts and let people sign in.
- To let class leads create classes and classmates join the correct class.
- To collect answers and make team suggestions.
- To explain why a team or match was suggested.
- To show each person their own results and team information.
- To help class leads manage class membership, missing responses, late responses, and shared results.
- To prevent abuse, protect accounts, fix bugs, and keep the platform reliable.
- To let authorized platform admins review activity, investigate problems, handle support, and remove abusive or broken data.
- To respond to support requests and improve Synco.

## 4. Who can see what
Classmates do not see each other's raw survey answers. Results shown to classmates focus on their own team, teammates, match reasons, and any personal match lists made available by the app.

A class lead may see class membership, display names, identifiers used for joining, submission status, team assignments, shared result summaries, and other class management information.

A small number of authorized platform admins may see account, class, survey, result, feedback, activity, and audit details across the platform to operate and protect Synco. Admin actions may be logged.

## 5. How information is shared
We do not sell personal information. We do not use student answers for third-party advertising.

We may share information with service providers that help run Synco, such as hosting, database, authentication, email, security, analytics, or error logging providers. They may process information only to provide those services to Synco.

We may share information if required by law, to protect people, to investigate abuse, to secure the service, or to respond to a valid legal request.

## 6. Student and minor privacy
Synco may be used by students. If a class includes minors, the class lead or school should make sure they have the right permission before inviting students and collecting answers.

Children under 13 should not use Synco unless a school, parent, guardian, or other authorized adult has approved the use.

## 7. How long we keep information
Synco keeps information for as long as needed to provide the class, show results, maintain accounts, protect the service, comply with legal duties, and handle support or disputes.

Class data may be deleted when a class lead deletes the class, when an account is removed, or when Synco no longer needs the data. Some copies may remain for a limited time in backups, logs, security records, or legal records.

## 8. Your choices
- You can choose not to join a class or not to submit answers, but that may mean you cannot be included in team results.
- You can ask the class lead to correct your name, identifier, or class membership if it is wrong.
- You can ask for your account or class data to be deleted through the available support contact.
- If your school controls the class, you may need to make access, correction, or deletion requests through the school or class lead.

## 9. Security
Synco uses reasonable technical and organizational measures to protect information, including access controls, authentication, database security rules, and limited access to class data.

No online service can promise perfect security. If you think your account or class data has been exposed, tell the class lead or Synco support as soon as possible.

## 10. Changes to this policy
We may update this Privacy Policy as Synco changes. If the changes are important, we will try to give notice in the app or by another reasonable method.

## 11. Contact
For privacy questions, use the support contact provided in the app, class invite, or contact page.`,
  },
  terms_of_service: {
    content_key: "terms_of_service",
    title: "Terms of service",
    summary:
      "These terms explain how Synco may be used for class team formation, student results, and platform administration.",
    updated_at: "2026-06-25T00:00:00.000Z",
    body: `## 1. What Synco does
Synco helps a class make student teams. A class lead creates a class, shares a code, classmates answer a short form, and Synco suggests teams with short reasons.

Synco is a planning tool. It does not make final school, grading, discipline, safety, or legal decisions. A real person should review the team plan before using it in class.

## 2. Who can use Synco
You may use Synco if you can legally agree to these terms, or if a school, parent, guardian, or class lead has allowed you to use it for a class.

If you are under 13, you may use Synco only when your school, parent, guardian, or another authorized adult has approved that use.

If you create a class for other people, you are responsible for making sure you have permission to invite them and collect their class responses.

## 3. Accounts and class roles
- Keep your login details private and do not share another person's account.
- Use your real class name or display name when a class requires it.
- A class lead can create a class, set a team size, manage who joins, view submitted class responses as allowed by the app, generate team results, and share those results.
- A class member can join a class, submit answers, see their own results, and see the team information made available to them.
- Authorized platform admins can review accounts, classes, survey records, team results, feedback, activity records, and audit logs to operate Synco, investigate problems, and protect the service.

## 4. Your content and class data
Your content includes names, class details, join identifiers, form answers, do-not-pair notes, friend or work-with requests, team results, feedback, and any other information added to Synco.

You keep any rights you already have in your content. By adding content to Synco, you allow Synco to use it only to run the service, create teams, show results, protect the service, fix problems, and provide support.

Do not add private information that is not needed for making teams. Do not add home addresses, medical details, government ID numbers, passwords, payment details, or other sensitive information unless Synco clearly asks for it.

## 5. Team suggestions and results
Synco uses answers and class rules to suggest teams. The result may be useful, but it may not be perfect.

Team reasons are meant to explain the suggestion in simple terms. They should not be treated as a complete judgment of a person's ability, character, effort, or value.

If a team result looks wrong, unfair, unsafe, or based on bad data, the class lead should review it before using it.

## 6. Things you must not do
- Do not use Synco to bully, harass, shame, threaten, or single out another person.
- Do not submit false answers to manipulate team results.
- Do not try to view a class, answer, account, or result you are not allowed to see.
- Do not upload malware, attack the app, scrape private data, or try to bypass security.
- Do not use Synco for illegal activity or in a way that breaks school rules that apply to you.
- Do not use team results as the only basis for grading, punishment, formal complaints, or other serious decisions.

## 7. Privacy
The Privacy Policy explains what information Synco collects, how it is used, who may see it, and how deletion requests work. By using Synco, you agree that your information will be handled as described there.

## 8. School and class responsibilities
If Synco is used for a school class, the school or class lead may have separate duties under school policy or student privacy laws. Synco does not replace those duties.

Class leads are responsible for choosing an appropriate team size, checking results before sharing them, handling late answers fairly, and responding to student concerns.

## 9. Service availability
Synco may change, pause, or stop parts of the service. We try to keep it working, but we do not promise that it will always be available, error-free, or fit every class situation.

## 10. Third-party services
Synco may use trusted service providers for hosting, login, database storage, email, analytics, error logging, and similar operations.

## 11. Ending use and deleting data
You can stop using Synco at any time. A class lead may delete a class, and account or data deletion requests can be sent through the available support contact.

Some information may remain for a limited time in backups, logs, security records, or records needed to comply with law, prevent abuse, or resolve disputes.

## 12. Intellectual property
Synco, including its name, design, code, text, and product experience, belongs to its owner or licensors. You may not copy, resell, or rebuild the service without permission.

## 13. Disclaimers
Synco is provided as-is and as-available. To the fullest extent allowed by law, we disclaim implied warranties, including warranties of merchantability, fitness for a particular purpose, and non-infringement.

## 14. Limitation of liability
To the fullest extent allowed by law, Synco will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost data, lost work, lost grades, or class disputes caused by use of the service.

## 15. Changes to these terms
We may update these terms as Synco changes. If changes are important, we will try to give notice in the app or by another reasonable method.

## 16. Contact
For questions about these terms, use the support contact provided in the app, class invite, or contact page.`,
  },
  contact_page: {
    content_key: "contact_page",
    title: "Contact Synco",
    summary:
      "Need help with a class, a student account, privacy, or platform feedback? Use the contact details below.",
    updated_at: "2026-06-28T00:00:00.000Z",
    body: `## Support
For account, class, or result issues, contact Synco support at abdulmusawirdayo35@gmail.com.

## What to include
- Your name
- Your class name or invite code, if the issue is about a class
- The email you used for Synco
- A short explanation of what happened

## Privacy or deletion requests
For privacy questions, account deletion, or class-data deletion, mention "privacy request" in your message so it can be handled carefully.

## Response time
Synco is early-stage, so response times may vary. Urgent class issues should also be shared with the class lead or instructor.`,
  },
};

export function PlatformContentPage({
  contentKey,
  eyebrow,
}: {
  contentKey: PlatformContentKey;
  eyebrow: string;
}) {
  const [content, setContent] = useState<PlatformContent>(fallbackContent[contentKey]);
  const [loadedFromAdmin, setLoadedFromAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      const { data, error } = await supabase
        .from("platform_content")
        .select("content_key,title,summary,body,updated_at")
        .eq("content_key", contentKey)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        console.error(`Failed to load ${contentKey}:`, error);
        return;
      }

      if (data?.body && isPlatformContentKey(data.content_key)) {
        setContent({
          content_key: data.content_key,
          title: data.title,
          summary: data.summary,
          body: data.body,
          updated_at: data.updated_at,
        });
        setLoadedFromAdmin(true);
      }
    }

    void loadContent();

    return () => {
      cancelled = true;
    };
  }, [contentKey]);

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
          <p className="text-xs font-medium uppercase tracking-wider text-muted">{eyebrow}</p>
          <h1 className="mt-3 font-sans text-3xl font-semibold tracking-normal sm:text-4xl">
            {content.title}
          </h1>
          <p className="mt-3 text-sm text-muted">Last updated: {formatDate(content.updated_at)}</p>
          {content.summary ? (
            <div className="mt-6 rounded-[8px] border border-border bg-card p-4 text-sm leading-7 text-muted">
              {content.summary}
            </div>
          ) : null}

          <MarkdownContent body={content.body} />

          {!loadedFromAdmin ? (
            <p className="mt-10 rounded-[8px] border border-border bg-secondary p-4 text-xs leading-6 text-muted">
              Showing built-in fallback content. Platform admins can edit this page from Master
              Control after the content migration is applied.
            </p>
          ) : null}
        </motion.article>
      </main>
    </div>
  );
}

function MarkdownContent({ body }: { body: string }) {
  const elements: ReactNode[] = [];
  let listItems: string[] = [];

  function flushList() {
    if (!listItems.length) return;
    const items = listItems;
    listItems = [];
    elements.push(
      <ul
        key={`list-${elements.length}`}
        className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-muted"
      >
        {items.map((item) => (
          <li key={item}>{renderInlineLinks(item)}</li>
        ))}
      </ul>,
    );
  }

  body.split("\n").forEach((line) => {
    const text = line.trim();
    if (!text) {
      flushList();
      return;
    }

    if (text.startsWith("## ")) {
      flushList();
      elements.push(
        <h2
          key={`heading-${elements.length}`}
          className="mt-9 font-sans text-xl font-semibold tracking-normal"
        >
          {text.slice(3)}
        </h2>,
      );
      return;
    }

    if (text.startsWith("- ")) {
      listItems.push(text.slice(2));
      return;
    }

    flushList();
    elements.push(
      <p key={`paragraph-${elements.length}`} className="mt-3 text-sm leading-7 text-muted">
        {renderInlineLinks(text)}
      </p>,
    );
  });

  flushList();

  return <div className="mt-10">{elements}</div>;
}

function renderInlineLinks(text: string) {
  const parts = text.split(/(https?:\/\/[^\s)]+|mailto:[^\s)]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/g);
  return parts.map((part, index) => {
    if (!part) return null;
    const isUrl = part.startsWith("http://") || part.startsWith("https://");
    const isMailto = part.startsWith("mailto:");
    const isEmail = /^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(part);

    if (!isUrl && !isMailto && !isEmail) return <span key={`${part}-${index}`}>{part}</span>;

    const href = isEmail ? `mailto:${part}` : part;
    return (
      <a
        key={`${part}-${index}`}
        href={href}
        className="font-medium text-[color:var(--color-primary)] underline-offset-4 hover:underline"
      >
        {isMailto ? part.replace("mailto:", "") : part}
      </a>
    );
  });
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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function isPlatformContentKey(value: string): value is PlatformContentKey {
  return value === "privacy_policy" || value === "terms_of_service" || value === "contact_page";
}
