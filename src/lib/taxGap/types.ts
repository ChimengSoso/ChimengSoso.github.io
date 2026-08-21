/**
 * "ล่าช่องว่างภาษี" — a Thai personal-income-tax planner shaped as a game.
 *
 * Shapes only. The legal numbers live in ./rules.ts (one record per tax year,
 * so a change in the law is a new table rather than a hunt through code), the
 * arithmetic lives in ./engine.ts, and the puzzles live in ./levels.ts.
 *
 * Thai only for now: unlike "หนีหนู" this game quotes Thai tax law at the
 * player, and a half-translated legal label is worse than none.
 */

/** Which pot of money a slot draws from, when it shares one with others. */
export type PotId = 'retirement' | 'lifeHealth';

/**
 * Where a slot sits in the UI. `given` items are facts about the player's life
 * that they cannot buy more of this year; `buyable` ones are the actual moves.
 */
export type SlotGroup = 'family' | 'given' | 'invest' | 'protect' | 'property' | 'give';

export type SlotId =
  | 'personal'
  | 'spouse'
  | 'children'
  | 'childrenLater'
  | 'maternity'
  | 'parents'
  | 'disabled'
  | 'socialSecurity'
  | 'rmf'
  | 'pvd'
  | 'nsf'
  | 'pensionInsurance'
  | 'thaiEsg'
  | 'lifeInsurance'
  | 'healthInsurance'
  | 'parentHealthInsurance'
  | 'homeLoanInterest'
  | 'socialEnterprise'
  | 'politicalDonation';

/**
 * One line on the tax return.
 *
 * A slot's real ceiling is the smallest of three numbers, and which one bites
 * is the single most confusing thing about Thai deductions ("RMF 30% of
 * *what*?"), so all three are modelled separately and reported separately
 * rather than being collapsed into one figure the player has to take on faith.
 */
export interface SlotDef {
  id: SlotId;
  group: SlotGroup;
  /** Thai label, as close to the wording on the return as still reads naturally. */
  name: string;
  /** One line on what this actually is. */
  hint: string;
  /** Flat ceiling written into the law, when there is one. */
  statutory?: number;
  /** Ceiling as a share of เงินได้พึงประเมิน (gross, before any deduction). */
  incomeShare?: number;
  /** Shared pot this slot competes for, when it has one. */
  pot?: PotId;
  /**
   * Per-unit ceiling for slots counted by head (children, parents), together
   * with how many heads the law will count.
   */
  perHead?: { amount: number; maxHeads: number };
  /**
   * Money the player commits this year out of their own pocket. Slots without
   * it are facts (a personal allowance, interest already paid) and never
   * compete for the budget.
   */
  costsCash?: boolean;
  /**
   * Share of the committed money that is still the player's asset afterwards.
   * 1 for savings they keep (RMF units), 0 for money that is gone (a donation),
   * and something in between for a premium that buys cover and a little cash
   * value. Tax treats every deductible baht identically; this is the axis on
   * which the choice between slots is actually made.
   */
  retention?: number;
  /** Strings attached, shown next to the input. Absent when there are none. */
  lockIn?: string;
}

/** A ceiling several slots have to share. */
export interface PotDef {
  id: PotId;
  name: string;
  cap: number;
  members: SlotId[];
  /** Why these particular slots share a pot, in one line. */
  note: string;
}

/** One step of the progressive ladder. `upTo` is Infinity on the top step. */
export interface Bracket {
  upTo: number;
  rate: number;
}

/**
 * Everything the law says for one tax year. Swapping years is swapping this
 * record, which is how the pending TISA reform will land when it becomes law.
 */
export interface TaxYearRules {
  /** Buddhist-era tax year, e.g. 2569. */
  year: number;
  brackets: Bracket[];
  /** Flat-rate expense deduction for employment income: share and its cap. */
  employmentExpense: { share: number; cap: number };
  slots: SlotDef[];
  pots: PotDef[];
  /** Ceiling on donations, as a share of income after every other deduction. */
  donationShareOfBase: number;
  /** Multiplier on donations to schools, sport and state hospitals via e-Donation. */
  donationMultiplierEDonation: number;
  /** Employee social-security rate and the monthly wage it is charged on. */
  socialSecurity: { rate: number; monthlyWageCap: number; yearlyCap: number };
  /** Date the numbers above were last checked against the Revenue Department. */
  verifiedOn: string;
  /** Anything in flux that the player deserves to be told about. */
  caveats: string[];
}

/** What the player has told us. Amounts are baht per year unless noted. */
export interface Profile {
  year: number;
  /** Salary per month. The one number the game insists on. */
  monthlySalary: number;
  /** Bonus and any other 40(1)/(2) employment income for the year. */
  bonus: number;
  hasSpouseNoIncome: boolean;
  childrenBefore2561: number;
  childrenFrom2561: number;
  maternity: number;
  /** Parents aged 60+ in the player's care, including a spouse's. */
  parentsInCare: number;
  disabledInCare: number;
  /** Cash the player can genuinely commit this year. */
  budget: number;
  /** What they have put in each slot. Missing means zero. */
  amounts: Partial<Record<SlotId, number>>;
  /** Donations, kept apart because their ceiling is computed last. */
  donationGeneral: number;
  donationEDonation: number;
}

/** Which of the three ceilings is the one actually holding a slot down. */
export type BindingCap = 'statutory' | 'income' | 'pot' | 'none';

/** The three-numbers-and-a-verdict readout for one slot. */
export interface Headroom {
  slot: SlotDef;
  /** Flat ceiling in the law, or Infinity when the law names none. */
  statutoryCap: number;
  /** Ceiling from the share-of-income rule, or Infinity when there is none. */
  incomeCap: number;
  /** What is left in the shared pot after the other members, or Infinity. */
  potCap: number;
  /** The smallest of the three: this player's real ceiling for this slot. */
  effectiveCap: number;
  binding: BindingCap;
  used: number;
  /** Room still going spare. Never negative. */
  left: number;
}

/** A full costing of one profile. */
export interface TaxResult {
  /** เงินได้พึงประเมิน: gross for the year, before anything is taken off. */
  assessableIncome: number;
  employmentExpense: number;
  /** Every slot's contribution, already clamped to its effective ceiling. */
  allowances: number;
  /** Income after expense and allowances: the base the 10% donation cap uses. */
  donationBase: number;
  donationCap: number;
  donationAllowed: number;
  /** เงินได้สุทธิ. */
  netIncome: number;
  tax: number;
  /** Rate the next baht of deduction would claw back. */
  marginalRate: number;
  /** Per-bracket breakdown, for the ladder. */
  steps: { from: number; to: number; rate: number; taxable: number; tax: number }[];
}

/** How well the player played, against what the numbers allowed. */
export interface Score {
  /** Tax with nothing but the unavoidable, automatic allowances. */
  baselineTax: number;
  /** Tax as actually played. */
  playedTax: number;
  /** The least tax the budget could possibly have bought. */
  bestTax: number;
  taxSaved: number;
  bestSaving: number;
  /** Cash committed, and how much of it the player still owns afterwards. */
  cashSpent: number;
  capitalRetained: number;
  /** Deductible room left on the table, ignoring the budget. */
  headroomUnused: number;
  /** 0..100 against par. 100 means the budget could not have done better. */
  percentOfPar: number;
}
