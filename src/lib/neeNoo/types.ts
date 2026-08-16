/**
 * "หนีหนู" (Nee Noo) — an original Thai financial-literacy board game played
 * entirely in the browser. Shapes only; the numbers live in src/data/neeNoo.ts
 * and the rules in ./engine.ts.
 *
 * Every player-visible string is a `Loc` so the whole game can switch between
 * Thai and English at runtime without a rebuild.
 */

export type Lang = 'th' | 'en';

export interface Loc {
  th: string;
  en: string;
}

export const say = (l: Loc, lang: Lang): string => l[lang];

/* ------------------------------------------------------------------ assets */

export type AssetKind = 'stock' | 'property' | 'business' | 'gold';

/** A holding on the player's balance sheet. */
export interface Asset {
  uid: string;
  /** id of the deal card it came from (used to match market offers) */
  cardId: string;
  kind: AssetKind;
  name: Loc;
  /** stocks/gold trade by symbol; property/business match market offers by tag */
  symbol?: string;
  tag?: string;
  qty: number;
  /** cash actually paid per unit (down payment for leveraged property) */
  costPerUnit: number;
  /** sticker price per unit, = costPerUnit when nothing was borrowed */
  pricePerUnit: number;
  /** debt attached to the whole holding */
  debt: number;
  /**
   * Monthly mortgage payment on that debt. `cashflowPerUnit` is already net of
   * it, so clearing the debt hands this amount back as extra monthly income.
   */
  mortgagePay: number;
  /** monthly cash flow per unit (can be 0 for capital-gain plays) */
  cashflowPerUnit: number;
  /** see DealCard.volatility; carried so the holding keeps swinging after purchase */
  volatility?: number;
  /** cash flow the day it was bought, used to cap how far a swing can run */
  baseCashflow?: number;
  impact?: number;
}

/* ------------------------------------------------------------- liabilities */

export type DebtKey = 'home' | 'car' | 'card' | 'retail' | 'student' | 'bank';

export interface Debt {
  key: DebtKey;
  balance: number;
  /** monthly payment; disappears from the expense sheet once the debt is paid off */
  payment: number;
  /**
   * Monthly interest rate. Whatever the payment covers beyond the interest goes
   * to principal, so every debt shrinks on its own each payday and eventually
   * ends. The emergency loan is the harshest of them: a big payment against a
   * short balance, which is exactly what an unsecured loan feels like.
   */
  rate: number;
  /**
   * Legacy flag from the interest-only emergency loan. Kept so saves written
   * before the loan was made amortising still parse; nothing sets it any more.
   */
  interestOnly?: boolean;
}

/* ------------------------------------------------------------- professions */

/**
 * What waits after the salary stops. The three Thai systems pay wildly
 * different amounts for the same working life, which is the point of modelling
 * them at all: a civil servant retires on most of their salary, an employee on
 * a slice of a ฿15,000 ceiling no matter what they earned, and someone who
 * worked for themselves on the old-age allowance everybody gets.
 */
export type PensionKind = 'civil' | 'sso' | 'none';

/**
 * The shock this career can take. High pay comes with the fragile ones: a pilot
 * who fails a medical is finished flying that day, while the teacher's salary is
 * the dullest and safest number in the game.
 */
export type CareerRisk = 'grounded' | 'layoff' | 'slump' | 'steady' | 'normal';

export interface Profession {
  id: string;
  name: Loc;
  blurb: Loc;
  salary: number;
  taxes: number;
  /** food, transport, phone… everything not itemised as a debt payment */
  otherExpenses: number;
  childCost: number;
  cash: number;
  /** interest rates are filled in from DEBT_RATE when the game starts */
  debts: Omit<Debt, 'rate'>[];
  /** age the player is when they start this career in the game */
  startAge: number;
  /** age the salary stops; 0 means this work has no fixed end */
  retireAge: number;
  pension: PensionKind;
  /** annual pay rise as a share — deliberately below inflation for most jobs */
  raise: number;
  risk: CareerRisk;
  /** true when the job legally needs a degree, so a short course cannot reach it */
  licensed?: boolean;
}

/**
 * A way into a different job. Thailand's three real routes differ on far more
 * than price: the cheap fast one only opens unlicensed work, the long one opens
 * everything while you keep working, and the expensive one takes you out of the
 * workforce entirely and hands back the biggest salary in the game.
 */
export interface StudyRoute {
  id: string;
  title: Loc;
  story: Loc;
  /** months from enrolment to graduation */
  months: number;
  /** total tuition, charged over `terms` instalments rather than up front */
  tuition: number;
  terms: number;
  /** the player stops working and stops rolling for the duration */
  fullTime: boolean;
  /** professions this route can lead to; empty means anything unlicensed */
  opensLicensed: boolean;
  /** a separate professional licence fee due on graduation */
  licenceFee: number;
  /** salary on the first day of the new job, as a share of its normal salary */
  entrySalary: number;
}

/** How a licence fee gets paid for. Each way costs something different. */
export type LicencePlan = 'cash' | 'loan' | 'bond';

/** An enrolment in progress. */
export interface StudyProgress {
  routeId: string;
  /** the job waiting on the other side */
  targetId: string;
  monthsLeft: number;
  termsLeft: number;
  /** tuition due each time a term falls, already divided out */
  perTerm: number;
  /** months between term bills */
  termEvery: number;
  /** months since the last term was paid */
  sinceTerm: number;
  /** total months the course runs, kept so the UI can say "year 2 of 4" */
  totalMonths: number;
}

/* ------------------------------------------------------------------- cards */

/**
 * `small`/`big` are the two rat-race decks; `fast` and `mega` are their
 * fast-track counterparts. Sharing one card type means the fast track gets
 * traded paper, leverage and quantities for free, instead of the flat
 * price-and-yield cards it used to have.
 */
export type DealSize = 'small' | 'big' | 'fast' | 'mega';

export interface DealCard {
  id: string;
  size: DealSize;
  kind: AssetKind;
  title: Loc;
  story: Loc;
  symbol?: string;
  tag?: string;
  /** sticker price per unit */
  price: number;
  /** cash needed per unit */
  down: number;
  /** debt taken on per unit */
  debt: number;
  /** monthly mortgage payment per unit, already deducted from `cashflow` */
  mortgagePay?: number;
  /** monthly cash flow per unit */
  cashflow: number;
  maxQty: number;
  /**
   * A young business does not sit still. Each month there is a chance its cash
   * flow steps up or down by this share, and a small chance it folds outright.
   * Only set on the cards where that volatility is the point (startups, and the
   * businesses whose fortunes swing with a trend).
   */
  volatility?: number;
  /** the country notices this one: counts toward the capitalist's legacy */
  impact?: number;
}

export type MarketCard =
  /** a quoted price for one traded symbol — sell (or top up) at this price */
  | { id: string; type: 'price'; symbol: string; price: number; title: Loc; story: Loc }
  /** a buyer for property/land matching `tag`, paying sticker price × multiplier */
  | { id: string; type: 'offer'; tag: string; multiplier: number; title: Loc; story: Loc }
  /** a buyer for any business, paying its monthly cash flow × `monthsMultiple` */
  | { id: string; type: 'bizOffer'; monthsMultiple: number; title: Loc; story: Loc };

export interface DoodadCard {
  id: string;
  title: Loc;
  story: Loc;
  /**
   * Cost as a multiple of the profession's other living costs, not a flat baht
   * figure: a pilot's broken air conditioner costs a pilot's kind of money. A
   * flat cost would quietly punish the low-salary jobs several times harder.
   */
  scale: number;
  /** multiply the cost by the number of children (0 children ⇒ nothing happens) */
  perChild?: boolean;
  /** the player may decline it */
  optional?: boolean;
  /** it involves other people, so saying yes or no moves the generosity counter */
  social?: boolean;
  /** instead of paying cash, it can be put on an instalment plan (also scaled) */
  instalment?: { balanceScale: number; paymentScale: number };
  /** a bill car insurance would have covered, if there is any in force */
  insurable?: boolean;
  /**
   * Comes round on the calendar rather than out of the deck. Birthdays and
   * school fees arrive on a date, not on a dice roll, so these cards keep their
   * words but are dealt by the clock.
   */
  annual?: boolean;
  /** what saying no to this one really costs, when the cost is not money */
  declineNote?: Loc;
}

/**
 * Fast-track amounts are sized against the player rather than in flat baht: out
 * here one player lives on ฿20,000 a month and another on ฿400,000, so a fixed
 * ฿400,000 windfall is either a fortune or a rounding error. `months` is a
 * multiple of current monthly passive income, and `incomeLossPct` a share of it.
 */
export type FastCard =
  | { id: string; type: 'bonus'; title: Loc; story: Loc; months: number }
  | { id: string; type: 'setback'; title: Loc; story: Loc; months: number; incomeLossPct?: number };

export interface Dream {
  id: string;
  title: Loc;
  story: Loc;
  cost: number;
}

/* ------------------------------------------------------------------- board */

export type RatTile = 'payday' | 'deal' | 'market' | 'doodad' | 'baby' | 'downsized' | 'charity';
/**
 * `dream` does double duty: once every dream is achieved it becomes the legacy
 * tile, which is the only thing left worth landing on out here.
 */
export type FastTile = 'fastpay' | 'fastdeal' | 'fastmarket' | 'dream' | 'bonus' | 'setback';

/* ------------------------------------------------------------------- state */

/** What the board is waiting for the player to decide. */
export type Pending =
  | { kind: 'dealChoice' }
  | { kind: 'deal'; cardId: string }
  | { kind: 'market'; cardId: string }
  | { kind: 'doodad'; cardId: string }
  | { kind: 'baby' }
  | { kind: 'downsized' }
  | { kind: 'charity' }
  | { kind: 'payday' }
  | { kind: 'fastdeal'; cardId: string }
  | { kind: 'fastbonus'; cardId: string }
  | { kind: 'fastsetback'; cardId: string }
  | { kind: 'dream' }
  /** the current dream is already achieved, so choose the next one to chase */
  | { kind: 'dreamPick' }
  /** every dream is done: the question stops being what to buy and becomes what to leave */
  | { kind: 'legacy' }
  /** picking a small or a country-sized deal, the fast track's version of dealChoice */
  | { kind: 'fastChoice' }
  /** out of work and deciding whether to go back to the same job or retrain */
  | { kind: 'career' }
  /** graduation day: the licence still has to be paid for somehow */
  | { kind: 'licence'; routeId: string; targetId: string }
  /** the salary has stopped for good, whether by age or by a failed medical */
  | { kind: 'retired' }
  /** a year has gone by and the children are a year older */
  | { kind: 'birthday' }
  /** the school year has come round for whichever children are old enough */
  | { kind: 'schoolfee' }
  | { kind: 'rescue' }
  /** passive income now covers the bills: quit the job, or keep the salary */
  | { kind: 'quit' }
  /** a friend steps in because the player has been generous before */
  | { kind: 'friend' }
  | { kind: 'tierUp'; tier: number };

export type Phase = 'rat' | 'fast' | 'won' | 'lost';

export interface LogEntry {
  turn: number;
  text: Loc;
  tone: 'good' | 'bad' | 'plain';
}

export interface Decks {
  small: string[];
  big: string[];
  market: string[];
  doodad: string[];
  fastDeal: string[];
  fastMega: string[];
  fastBonus: string[];
  fastSetback: string[];
}

export interface GameState {
  version: number;
  phase: Phase;
  professionId: string;
  dreamId: string;
  cash: number;
  children: number;
  assets: Asset[];
  debts: Debt[];
  /** live market price per traded symbol, seeded from each deal's sticker price */
  prices: Record<string, number>;
  pos: number;
  fastPos: number;
  turn: number;
  months: number;
  /**
   * The month each child was born, so the statement can charge what that age
   * actually costs. `children` stays as the count because every rule that only
   * needs "how many" reads it, and the two are written together.
   */
  childBorn: number[];
  /** enrolled in something, with terms still to pay and months still to sit */
  study: StudyProgress | null;
  /**
   * The salary has ended for good: retirement age, or a career that ended on
   * its own terms. Only retraining brings a wage back.
   */
  careerOver: boolean;
  /** owed to the employer that paid for the licence, worked off month by month */
  bondMonths: number;
  /** a self-employed slump: months left, and the share of takings it removes */
  slumpMonths: number;
  slumpCut: number;
  /** months of car cover still in force; renewing buys another twelve */
  carCoverMonths: number;
  /**
   * Annual family events waiting to be shown. They are flags rather than
   * pendings so a birthday that falls in the same month as a tier promotion is
   * queued instead of quietly overwritten.
   */
  birthdayDue: boolean;
  schoolDue: boolean;
  /**
   * Pay as a share of what this job normally pays. It is 1 for the career you
   * started in and less than 1 after retraining, because walking into a new
   * field means walking in at the bottom of it.
   */
  entryPay: number;
  skipTurns: number;
  /** turns left on the "give and it comes back" charity bonus (choose 1 or 2 dice) */
  charityTurns: number;
  /**
   * Monthly passive income at the moment of escape. Fast-track progress is
   * measured as today's passive income minus this baseline, so a fast-track
   * business is a normal asset on the balance sheet rather than a second,
   * parallel pot of income.
   */
  escapeIncome: number;
  /**
   * Dreams already achieved, oldest first. Buying the same one twice was never
   * the point: each dream is bought once, and landing on the tile again offers
   * the pick of the ones still on the shelf. The collection is the scoreboard.
   */
  dreamsOwned: string[];
  /** the salary is gone once the player chooses to quit; expenses carry on */
  quit: boolean;
  /**
   * The quit decision has already been put to the player once. Without this the
   * offer would reappear every single payday for the rest of the game; the
   * button under the board is how they change their mind later.
   */
  quitOffered: boolean;
  /** highest investor tier reached so far, 1..6 */
  tier: number;
  /** generosity: earned by saying yes to people, spent when they return the favour */
  karma: number;

  /* --------------------------------------------------------------- legacy */
  /**
   * Money given away for good. It leaves the balance sheet completely, which is
   * the point: it is the one number that only goes up by costing you something.
   */
  donated: number;
  /** the portfolio has been moved into a company: flat tax, fixed running cost */
  incorporated: boolean;
  /** sum assured on the life policy; the premium is a monthly expense */
  insuranceCover: number;
  /** lives touched by the schools, hospitals and banks on the balance sheet */
  impact: number;
  friendHelpUsed: boolean;
  /** the player called it a day themselves rather than going bankrupt */
  endedByChoice: boolean;
  lastRoll: number[];
  /** tiles still to walk this turn; the UI advances them one at a time */
  walking: number;
  pending: Pending | null;
  decks: Decks;
  seed: number;
  log: LogEntry[];
}
