/**
 * Single source of truth for everything the legal pages say about "who we are".
 * Edit ONLY this file when company details change. The Privacy, Terms and
 * Cookie pages all read from here.
 *
 * Items marked  ⚠ REQUIRED  must be filled in before you go live.
 */

export const LEGAL = {
  brand: 'SCNJOBS',
  company: 'SCN Global Pvt Ltd',
  website: 'https://scnjobs.com',
  domain: 'scnjobs.com',

  // ⚠ REQUIRED: registered office address exactly as in your incorporation documents.
  registeredAddress: '',

  phone: '+91 8588892236',
  supportHours: 'Monday to Saturday, 9:30 AM – 6:30 PM IST',

  // ⚠ REQUIRED: make sure these mailboxes actually exist and are monitored.
  emails: {
    support: 'support@scnjobs.com',
    privacy: 'privacy@scnjobs.com',
    legal: 'legal@scnjobs.com',
  },

  /**
   * ⚠ REQUIRED under Rule 3(2) of the Information Technology (Intermediary
   * Guidelines and Digital Media Ethics Code) Rules, 2021: the name and contact
   * details of the Grievance Officer must be published on the platform.
   */
  grievanceOfficer: {
    name: '', // e.g. 'Mr. / Ms. Full Name'
    designation: 'Grievance Officer',
    email: 'grievance@scnjobs.com',
    phone: '+91 8588892236',
  },

  /** City whose courts / arbitration seat apply, e.g. 'New Delhi'. Leave '' to keep it generic. */
  jurisdictionCity: '',

  /** Bump `version` and `lastUpdated` every time you materially change a document. */
  version: '1.0',
  lastUpdated: '2026-09-30',
  effectiveDate: '2026-09-30',

  /** Retention periods quoted in the Privacy Policy. Keep in sync with what your backend really does. */
  retention: {
    inactiveAccountMonths: 36,
    backupDays: 30,
    supportRecordsMonths: 24,
  },
} as const;

export function formatLegalDate(iso: string): string {
  return new Date(`${iso}T00:00:00+05:30`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}