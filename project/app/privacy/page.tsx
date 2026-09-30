import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalDocument, type LegalSection } from '@/components/legal/legal-document';
import { B, Callout, H3, LI, P, Table, UL } from '@/components/legal/legal-primitives';
import { LEGAL } from '@/lib/legal-config';

export const metadata: Metadata = {
  title: 'Privacy Policy — SCN Jobs',
  description:
    'How SCN Global Pvt Ltd (SCNJOBS) collects, uses, shares and protects your personal data, and the rights you have over it.',
};

const link = 'font-medium text-primary hover:underline';
const go = LEGAL.grievanceOfficer;

const sections: LegalSection[] = [
  {
    id: 'introduction',
    title: 'Introduction and scope',
    body: (
      <>
        <P>
          This Privacy Policy explains how <B>{LEGAL.company}</B> (“<B>{LEGAL.brand}</B>”, “we”, “us”, “our”) collects,
          uses, stores, shares and protects personal data when you use {LEGAL.domain} and any related websites,
          dashboards, notifications and services (together, the “<B>Platform</B>”).
        </P>
        <P>
          It applies to everyone who uses the Platform: job seekers (“<B>Workers</B>”), hiring organisations and
          recruiters (“<B>Recruiters</B>”), and visitors. For the personal data described in this policy, we act as the
          “Data Fiduciary” under the Digital Personal Data Protection Act, 2023 (“<B>DPDP Act</B>”), and as the “body
          corporate” under the Information Technology Act, 2000 and the rules made under it.
        </P>
        <Callout title="The short version">
          <UL>
            <LI>We collect only what we need to run a job portal: your account, profile, applications and basic technical data.</LI>
            <LI>Your profile and applications are shared with Recruiters so they can consider you for jobs. That is the core purpose of the Platform.</LI>
            <LI>We do not sell your personal data.</LI>
            <LI>You can view, correct, download or delete your data, and withdraw consent, at any time. See <a href="#your-rights" className={link}>Your rights</a>.</LI>
          </UL>
        </Callout>
        <P>
          By creating an account or using the Platform you confirm that you have read this policy. Where the law
          requires your consent for a specific use of your data, we ask for it separately (for example by a checkbox at
          sign-up) and you can withdraw it later.
        </P>
      </>
    ),
  },
  {
    id: 'data-we-collect',
    title: 'Personal data we collect',
    body: (
      <>
        <P>What we collect depends on how you use the Platform.</P>
        <Table
          head={['Category', 'Examples', 'Who it concerns']}
          rows={[
            [
              'Account & identity',
              'Name, email address, mobile number, password (stored only as a one-way hash), account role, OTP verification status',
              'Workers, Recruiters',
            ],
            [
              'Profile information',
              'Profile photo, headline, summary, date of birth, gender, marital status, social category, current city/state/locality, alternate phone or WhatsApp number',
              'Workers',
            ],
            [
              'Career information',
              'Education, work experience, skills, languages, total experience, resume/CV file, employment status, notice period, availability',
              'Workers',
            ],
            [
              'Job preferences',
              'Preferred industries, departments, job roles and locations, expected salary range, job type and shift preferences',
              'Workers',
            ],
            [
              'Applications & activity',
              'Jobs you viewed or applied to, application status and timeline, notifications you received, saved items',
              'Workers',
            ],
            [
              'Recruiter & company information',
              'Recruiter name, designation, company name, business contact details, job postings, hiring activity, shortlisting and status updates',
              'Recruiters',
            ],
            [
              'Communications',
              'Messages you send through the contact form, support requests, call or WhatsApp interactions with our team, feedback and complaints',
              'Everyone',
            ],
            [
              'Technical data',
              'IP address, browser and device type, pages viewed, timestamps, error logs, security and authentication logs',
              'Everyone',
            ],
          ]}
        />
        <H3>Sensitive or protected details</H3>
        <P>
          Some profile fields (for example social category, marital status, gender and date of birth) are personal in
          nature. Where a field is not mandatory on the form you may leave it blank. If you provide it, we use it only
          for the purposes in this policy, such as completing your profile and letting Recruiters assess whether you
          meet the requirements of a specific job where the law permits. We do <B>not</B> ask for Aadhaar, PAN,
          bank-account or card details to create a Worker profile.
        </P>
        <H3>Information about other people</H3>
        <P>
          If you give us another person’s details (for example a reference or an alternate contact), you confirm you
          have the right to do so and that they know their details are being shared with us.
        </P>
        <H3>Assisted registration</H3>
        <P>
          Our team may create or update a profile on behalf of a candidate at that candidate’s request or with their
          consent (for example, during recruitment drives or telephonic assistance). In those cases we treat the data
          exactly as if you had entered it yourself, and you can ask us to correct or delete it.
        </P>
      </>
    ),
  },
  {
    id: 'how-we-collect',
    title: 'How we collect data',
    body: (
      <UL>
        <LI><B>From you directly</B>: when you register, verify your OTP, complete onboarding, edit your profile, upload a resume or photo, apply for a job, post a job or contact us.</LI>
        <LI><B>Automatically</B>: through your browser or device when you use the Platform (for example through browser storage, described in the “Cookies and local storage” section below).</LI>
        <LI><B>From Recruiters and our team</B>: for example, the status of your application, or details updated by our administrators when you ask for help.</LI>
        <LI><B>From service providers</B>: for example delivery or failure status of an SMS OTP or email.</LI>
      </UL>
    ),
  },
  {
    id: 'purposes',
    title: 'Why we use your data',
    body: (
      <>
        <P>We process personal data only for specified purposes and on a lawful basis under the DPDP Act.</P>
        <Table
          head={['Purpose', 'What we do', 'Basis']}
          rows={[
            ['Create and secure your account', 'Register you, verify your phone/email by OTP, authenticate logins, prevent account takeover', 'Consent; security'],
            ['Provide the job-portal service', 'Show your profile to Recruiters, process applications, show job listings and recommendations, send application updates', 'Consent (you chose to use the service)'],
            ['Communicate with you', 'Send OTPs, account and application notifications, service announcements, and replies to your queries', 'Consent; service delivery'],
            ['Match jobs and candidates', 'Use your skills, location, experience and preferences to suggest relevant jobs to you and relevant candidates to Recruiters', 'Consent'],
            ['Verify and moderate', 'Review Recruiter accounts and job postings, investigate reports of fraud or misuse, enforce our Terms', 'Legitimate uses; legal obligation'],
            ['Improve and protect the Platform', 'Debug errors, monitor performance, detect abuse and security incidents, produce aggregated statistics', 'Legitimate uses'],
            ['Comply with law', 'Respond to lawful orders, maintain records required by law, handle grievances', 'Legal obligation'],
          ]}
        />
        <P>
          We will not use your personal data for a materially different purpose without telling you and, where required,
          obtaining your fresh consent.
        </P>
        <H3>Automated matching</H3>
        <P>
          We may use automated rules to rank or recommend jobs and candidates. These tools only assist; we do not make
          final hiring decisions, and no decision with legal or similarly significant effect on you is taken solely by
          automated means. Hiring decisions are made by Recruiters.
        </P>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'Who we share data with',
    body: (
      <>
        <P><B>We do not sell your personal data.</B> We share it only as described below.</P>
        <H3>1. Recruiters (Workers’ data)</H3>
        <P>
          When you apply for a job, the Recruiter who posted it can see your application and the profile information
          attached to it (including your contact details and resume) so that they can contact and evaluate you. Verified
          Recruiters may also search candidate profiles on the Platform. Please share only what you are comfortable
          with; you can edit or remove optional fields at any time.
        </P>
        <H3>2. Service providers (processors)</H3>
        <P>
          We use trusted providers who process data on our behalf and only under our instructions, including for cloud
          hosting and databases, file and resume storage, SMS/OTP delivery, email delivery, and error monitoring. Our
          current providers include hosting and deployment platforms, a file-upload and storage service, and SMS and
          email delivery services. They are bound by confidentiality and data-protection obligations.
        </P>
        <H3>3. Legal and safety</H3>
        <P>
          We may disclose data where required by law, court order or a lawful request from a government or regulatory
          authority, or where reasonably necessary to protect the rights, property or safety of our users, the public
          or ourselves, or to prevent fraud or abuse.
        </P>
        <H3>4. Business changes</H3>
        <P>
          If we merge with, are acquired by, or transfer assets to another entity, your data may be transferred to it,
          subject to this policy or a policy no less protective. We will notify you of material changes.
        </P>
        <H3>5. With your consent</H3>
        <P>We will share data in other ways only when you ask us to or agree to it.</P>
        <H3>What Recruiters must do</H3>
        <P>
          Recruiters may use candidate data only to evaluate and contact candidates for genuine job openings, and must
          comply with our <Link href="/terms#recruiters" className={link}>Terms of Service</Link> and applicable data
          protection law. If you believe a Recruiter has misused your data, report it to us (see{' '}
          <a href="#grievance" className={link}>Grievance Officer</a>).
        </P>
      </>
    ),
  },
  {
    id: 'transfers',
    title: 'Storage and transfers outside India',
    body: (
      <P>
        We aim to store your data on secure infrastructure, but some of our service providers operate servers outside
        India. By using the Platform you understand your data may be processed in other countries. We will transfer
        personal data outside India only in accordance with the DPDP Act and any restrictions notified by the Government
        of India, and we require providers to apply appropriate safeguards.
      </P>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep your data',
    body: (
      <>
        <P>We keep personal data only for as long as needed for the purpose it was collected for, and as the law requires.</P>
        <Table
          head={['Data', 'Retention']}
          rows={[
            ['Account, profile, resume and applications', 'While your account is active. When you delete your account or withdraw consent, we erase or anonymise it, except where we must retain it by law.'],
            ['Inactive accounts', `If you have not signed in for ${LEGAL.retention.inactiveAccountMonths} months we will give you notice and then erase or anonymise the account, unless you tell us to keep it.`],
            ['Backups', `Deleted data may remain in encrypted backups for up to ${LEGAL.retention.backupDays} days before being overwritten.`],
            ['Support, contact and grievance records', `Up to ${LEGAL.retention.supportRecordsMonths} months after the matter is closed, or longer if needed to defend legal claims.`],
            ['Security and access logs', 'For a limited period needed to detect and investigate abuse, and any period the law requires.'],
            ['Data already shared with Recruiters', 'Once a Recruiter has received your application, a copy may be held by that Recruiter under their own policies. We cannot delete data in their possession, but you can ask them (or us) to do so.'],
          ]}
        />
      </>
    ),
  },
  {
    id: 'security',
    title: 'How we protect your data',
    body: (
      <>
        <P>We use reasonable security practices and procedures appropriate to the nature of the data, including:</P>
        <UL>
          <LI>Encryption in transit (HTTPS/TLS) for traffic between your device and the Platform.</LI>
          <LI>Passwords stored only as salted one-way hashes; we cannot read your password.</LI>
          <LI>OTP verification of phone and email, and signed, expiring session tokens.</LI>
          <LI>Role-based access so Workers, Recruiters and administrators see only what their role needs.</LI>
          <LI>Restricted internal access to production data, and secure handling of secrets and credentials.</LI>
          <LI>Regular review of logs, dependencies and configurations for vulnerabilities.</LI>
        </UL>
        <P>
          No system is completely secure. You are responsible for keeping your password and OTPs confidential and for
          signing out on shared devices. If you suspect unauthorised access, contact us immediately. If a personal data
          breach occurs, we will notify the Data Protection Board of India and affected users as required by law.
        </P>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your rights',
    body: (
      <>
        <P>Under the DPDP Act you have the right to:</P>
        <UL>
          <LI><B>Access</B>: obtain a summary of the personal data we hold about you and the processing we do, and the identities of entities we have shared it with.</LI>
          <LI><B>Correction and updating</B>: correct inaccurate data and complete or update it. Most profile fields can be edited directly in your dashboard.</LI>
          <LI><B>Erasure</B>: ask us to delete your personal data, unless we need to keep it for a legal purpose.</LI>
          <LI><B>Withdraw consent</B>: at any time, as easily as you gave it. Withdrawal does not affect processing done before it, and may mean we can no longer provide some features.</LI>
          <LI><B>Grievance redressal</B>: raise a complaint with us and, if unresolved, with the Data Protection Board of India.</LI>
          <LI><B>Nominate</B>: name another person to exercise these rights on your behalf if you die or become incapacitated.</LI>
        </UL>
        <H3>How to exercise your rights</H3>
        <UL>
          <LI>Edit your data directly from your dashboard profile page.</LI>
          <LI>
            Email{' '}
            <a href={`mailto:${LEGAL.emails.privacy}`} className={link}>{LEGAL.emails.privacy}</a>{' '}
            from your registered email address, or call {LEGAL.phone}, stating your request.
          </LI>
        </UL>
        <P>
          We may need to verify your identity before acting on a request. We aim to respond within 15 days and in any
          case within the period prescribed by law. You do not have to pay to exercise these rights.
        </P>
        <H3>Communication preferences</H3>
        <P>
          Service messages (OTPs, security alerts, application updates) are necessary to operate your account. You can
          opt out of promotional or job-alert messages at any time by following the instructions in the message or by
          contacting us.
        </P>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    body: (
      <P>
        The Platform is intended for people aged 18 and over. We do not knowingly collect personal data of children. If
        we learn that an account belongs to a person under 18, we will delete it and the associated data. If you believe
        a child has registered, please contact us.
      </P>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and local storage',
    body: (
      <P>
        We use browser storage that is strictly necessary to keep you signed in and to remember your theme preference.
        We do not use advertising or cross-site tracking cookies. You can clear this storage at any time from your
        browser settings, but you may then need to sign in again.
      </P>
    ),
  },
  {
    id: 'third-party',
    title: 'Third-party links',
    body: (
      <P>
        Job postings and the Platform may link to websites operated by others (for example a Recruiter’s company site).
        We do not control them and are not responsible for their privacy practices. Read their policies before sharing
        data with them.
      </P>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <P>
        We may update this policy from time to time. The “last updated” date and version at the top show when it last
        changed. For material changes we will notify you through the Platform, by email or by SMS, and where the law
        requires your consent we will ask for it again. Continued use after the effective date means you accept the
        updated policy, except where the law requires fresh consent.
      </P>
    ),
  },
  {
    id: 'grievance',
    title: 'Grievance Officer and contact',
    body: (
      <>
        <P>
          If you have a question, complaint or request about your personal data or this policy, contact our Grievance
          Officer, appointed under the Information Technology (Intermediary Guidelines and Digital Media Ethics Code)
          Rules, 2021 and the DPDP Act:
        </P>
        <div className="rounded-xl border border-border bg-card p-5 text-[15px] leading-7 text-muted-foreground">
          <p className="font-semibold text-foreground">
            {go.name ? `${go.name}, ` : ''}
            {go.designation}
          </p>
          <p>{LEGAL.company}</p>
          {LEGAL.registeredAddress && <p>{LEGAL.registeredAddress}</p>}
          <p>
            Email: <a href={`mailto:${go.email}`} className={link}>{go.email}</a>
          </p>
          <p>Phone: {go.phone}</p>
          <p>Hours: {LEGAL.supportHours}</p>
        </div>
        <P>
          We will acknowledge your complaint within <B>24 hours</B> and aim to resolve it within <B>15 days</B> of
          receipt. If you are not satisfied with our response, you may approach the Data Protection Board of India once
          it is operational, or any other authority competent under applicable law.
        </P>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      current="privacy"
      title="Privacy Policy"
      summary="How we collect, use, share and protect your personal data, and the choices and rights you have."
      sections={sections}
    />
  );
}