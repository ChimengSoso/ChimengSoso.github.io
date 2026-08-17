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
  /**
   * Held by the company rather than by the player personally. Absent means
   * personal, so every save written before the company existed reads correctly.
   * The distinction is the whole point of incorporating: a company's rent is the
   * company's income, taxed at the company's rate, and it stays in the company
   * until the player takes it out and pays again to do so.
   */
  owner?: 'corp';
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
  // No `taxes` field: it used to be a hand-written figure per job and it had
  // drifted a long way from the real ladder (a ฿22,000 salary was billed ฿900 a
  // month when it actually owes nothing at all). Tax is computed from income
  // now, by category, in `taxBill`.
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
  /**
   * The page out of the annual report that a share card shows before it is
   * bought. Buying blind is how most people buy their first share, and the
   * point of printing the numbers is that the two cheap-looking shares in this
   * deck are cheap for opposite reasons: one earns and pays out, the other
   * loses money and is priced on a story.
   */
  books?: Fundamentals;
}

/**
 * A listed company's headline figures, in the units the exchange uses: revenue
 * and profit in millions of baht a year, the rest as plain ratios. Everything
 * here is invented for the game.
 */
export interface Fundamentals {
  /** yearly revenue, ฿m */
  revenue: number;
  /** yearly net profit, ฿m — negative means it is burning money */
  profit: number;
  /** revenue growth against last year, as a share */
  growth: number;
  /** debt against equity; above ~2 is a company the bank part-owns */
  gearing: number;
  /** price against yearly earnings per share; 0 when there are no earnings */
  pe: number;
  /** one line on what the numbers add up to */
  note: Loc;
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
  /** only happens to somebody who owns a car; skipped entirely for those who do not */
  needsCar?: boolean;
  /** the bill is for the animal in the house, so its name belongs in the words */
  pet?: boolean;
  /** paying it means the player started writing, which may pay off years later */
  writes?: boolean;
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
/**
 * What a fast-track card's story assumes the player actually owns. A card whose
 * story is about your tenants, your staff or your land is only dealt to someone
 * who has them: "the state took an old plot of yours" reads as a bug when you
 * never bought a plot, and it read as free money that could be collected over
 * and over from land nobody owned.
 */
export type FastNeed = 'shares' | 'business' | 'property' | 'tenants' | 'land' | 'debt' | 'insured' | 'book';

/** Cards that do something to a specific holding rather than paying a multiple. */
export type FastEffect = 'expropriate';

export type FastCard =
  | { id: string; type: 'bonus'; title: Loc; story: Loc; months: number; needs?: FastNeed; effect?: FastEffect }
  | {
      id: string;
      type: 'setback';
      title: Loc;
      story: Loc;
      months: number;
      incomeLossPct?: number;
      needs?: FastNeed;
    };

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
  | { kind: 'graduated' }
  | { kind: 'reward' }
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
   * How old the player was on the first turn. Held here rather than read from
   * the current profession, because retraining changes the profession and a
   * teacher who became an engineer would otherwise turn 32 on graduation day
   * while a doctor who became a teacher would get four years back.
   */
  startAge: number;
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
  /**
   * The month the last salary was paid, or null while one still is. The pension
   * formulas count contribution years, so they need to know when the paying
   * stopped rather than how old the player is now.
   */
  workEndMonth: number | null;
  /** owed to the employer that paid for the licence, worked off month by month */
  bondMonths: number;
  /** a self-employed slump: months left, and the share of takings it removes */
  slumpMonths: number;
  slumpCut: number;
  /** months of car cover still in force; renewing buys another twelve */
  carCoverMonths: number;
  /**
   * The month the next renewal notice falls due. Cover used to be offered only
   * when its card happened to come out of a thirteen-card deck, which measured
   * out at one offer every 56 months against twelve months of cover: even a
   * player who bought it every single time was uninsured for 86% of the repair
   * bills, and the first offer arrived at a median of month 44. A policy renews
   * on a date in real life, so it does here too, starting at the first year.
   */
  coverRenewMonth: number;
  coverDue: boolean;
  /** started writing back in the rat race, which the fast track can pay off */
  wroteBook: boolean;
  /**
   * The animal in the house, rolled at the start of the game. The vet bill used
   * to arrive for a creature with no species and no name, which is a bill
   * nobody can feel. A named cat is complained about; "a pet" is not.
   */
  pet: { speciesId: string; name: Loc } | null;
  /**
   * Whether the game began with a car and a home of one's own. Every job used
   * to hand both over on the first turn with the loans already signed, which is
   * the one decision most people actually get to make. Saying no clears the
   * debt and buys the alternative instead: rent that never ends, and getting to
   * work the hard way.
   */
  hasCar: boolean;
  hasHome: boolean;
  /**
   * What the car and the house were worth on day one.
   *
   * They were never on the balance sheet at all: the loans were, so every
   * player began the game a million baht in the hole for owning two ordinary
   * things. The values are kept from the start rather than tracked from the
   * loan, because a house that is paid off is still a house, and they move
   * apart from here: one drifts up with prices, the other loses a seventh of
   * itself every year and spends its first years worth less than what is owed
   * on it.
   */
  ownValue: { home: number; car: number };
  /**
   * The month the bank will look at an application again. A refusal is not a
   * "no" the player can click past: it stands for a while, which is what makes
   * the ceiling worth staying under in the first place.
   */
  loanBlockedUntil: number;
  /**
   * The file the bank keeps on you. Months that closed with the bills paid,
   * months that closed short, and loans seen through to the end: the three
   * things an underwriter can actually look up about somebody.
   */
  credit: { onTime: number; late: number; cleared: number; refused: number };
  /**
   * Decisions the calendar has raised and the player has not answered yet. They
   * are flags rather than pendings because a card is only ever a card: a payday
   * passed in the middle of a roll used to raise one of these and the tile the
   * token finally stopped on would overwrite it, so a birthday could be charged
   * to nobody and a retirement could happen with no notice at all. A flag
   * survives that, and `claimDue` turns it back into a card at the next moment
   * the board is idle.
   */
  birthdayDue: boolean;
  schoolDue: boolean;
  /** the salary has ended by age and the player has not been told yet */
  retireDue: boolean;
  /** a course is finished and its licence fee is still unanswered */
  licenceDue: { routeId: string; targetId: string } | null;
  /**
   * The profession left behind on graduation day, held until the player has
   * been shown what changed. Without a card the whole switch happened in one
   * log line that scrolled away, and the board never says what your job is, so
   * finishing a course looked exactly like nothing happening.
   */
  graduatedFrom: string | null;
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
  /** a company exists and holds part of the portfolio */
  incorporated: boolean;
  /**
   * The company's own bank account. It is not the player's money: getting it
   * out costs tax, which is the trade the whole structure is about.
   */
  corpCash: number;
  /**
   * เงินเดือนกรรมการ, set by the player. The company deducts it before its own
   * tax, and the player pays personal tax on it as 40(1) income. Paying
   * yourself more moves money from the company's 15% to your own ladder; paying
   * yourself less leaves it compounding inside the company and taxed once.
   */
  corpDraw: number;
  /** sum assured on the life policy; the premium is a monthly expense */
  insuranceCover: number;
  // No `impact` here: it was a running total that nothing ever added to and
  // nothing ever read. The lives-touched figure shown on the statement is summed
  // from the holdings themselves (`Asset.impact`), which is the only copy.
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
