/**
 * PolyFit Master Constants & Configuration
 * East Africa / Rwanda Corporate Wellness Network
 */

export interface RwandanBank {
  name: string;
  swift: string;
}

export const RWANDAN_BANKS: RwandanBank[] = [
  { name: 'Bank of Kigali (BK)', swift: 'BKIGRWRW' },
  { name: 'I&M Bank Rwanda', swift: 'BCRWRWRW' },
  { name: 'Equity Bank Rwanda', swift: 'EQBLRWRW' },
  { name: 'BPR Bank Rwanda (Atlas Mara)', swift: 'BPRWRWRW' },
  { name: 'Ecobank Rwanda', swift: 'ECOCRWRW' },
  { name: 'Cogebanque (Equity)', swift: 'COGBRWRW' },
  { name: 'NCBA Bank Rwanda', swift: 'NCBARWRW' },
  { name: 'Access Bank Rwanda', swift: 'ACCERWRW' }
];

export const RWANDA_TAX_RATES = {
  WITHHOLDING_TAX_WITH_TIN: 0.15,    // 15% standard withholding tax with valid RRA TIN
  WITHHOLDING_TAX_NO_TIN: 0.30       // 30% punitive withholding without registered TIN
} as const;

export const POLYFIT_SETTLEMENT_RULES = {
  PAYOUT_DAY_OF_MONTH: 15,          // 15th of the month
  CLAIMS_CUTOFF_DAY_OF_MONTH: 2,    // 2nd day of the month
  DEFAULT_GATE_RELAY_MS: 3000,      // 3-second NC/NO relay trigger
  CHECKIN_EXPIRATION_MINUTES: 20    // 20-minute validation SLA
} as const;

/**
 * Enterprise Canonical Structure Schema (Empty by default in production)
 * Real data must be populated from PostgreSQL database via authenticated APIs.
 */
export const TECHCORP_CANONICAL_DATA = {
  organization: null,
  plans: [],
  invoices: [],
  economics: {
    currentBalance: 0,
    currentInvoiceRwf: 0,
    invoiceStatus: 'none',
    invoiceNumber: '',
    overdueAmount: 0,
    overdueInvoiceNumber: '',
    hasOverdue: false,
    overdueDays: 0,
    dueDateStr: '',
    ytdTotalSpent: 0,
    ytdTotalVisits: 0,
    pmpmSpendRwf: 0,
    avgCostPerVisit: 0,
    citTaxShieldRwf: 0,
  },
  wellness: {
    wellnessHour: 'No activity yet',
    peakDay: 'No activity yet',
    categories: { gym: 0, pool: 0, studio: 0, clinic: 0 },
  },
  funnel: {
    totalEligible: 0,
    registeredEmployees: 0,
    activeBeneficiaries: 0,
    totalVisits: 0,
    newEmployees30d: 0,
    newBeneficiaries30d: 0,
    avgVisitsPerActive: 0,
  },
  employees: [],
};
