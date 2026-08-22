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
  /**
   * Monthly cash flow per unit at full occupancy (can be 0 for capital-gain
   * plays). What actually arrives is this less whatever is standing empty, and
   * `assetCashflow` is the one place that subtraction happens.
   */
  cashflowPerUnit: number;
  /**
   * How many separate tenancies one unit holds: 1 for a condo, 12 for an
   * apartment block, 24 for a student dorm. Absent on anything nobody rents
   * (shares, gold, land, a business you run yourself), which is also how the
   * game knows this holding can stand empty at all.
   */
  tenants?: number;
  /** average months a tenant stays before giving notice */
  tenantStay?: number;
  /** chance per month that an empty tenancy finds somebody new */
  reletChance?: number;
  /** tenancies currently empty, counted across the whole holding */
  vacant?: number;
  /** the player moved into one of these units, so it earns nothing and pays no rent */
  livedIn?: boolean;
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
  /**
   * This business has shut down for good.
   *
   * Zero cash flow used to be the only marker, and for a business bought while
   * profitable that works, because the drift is multiplicative and zero times
   * anything is still zero. A business bought *underwater* steps by a fixed
   * slice of its own size instead, so the month after it folded the same drift
   * moved it off zero again and the shop reopened by itself. Measured on the
   * new-cafe card, 74% of them folded at some point in thirty years and only 6%
   * were still shut at the end.
   */
  closed?: boolean;
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
export type CareerRisk = 'grounded' | 'layoff' | 'slump' | 'gig' | 'steady' | 'normal';

export interface Profession {
  id: string;
  name: Loc;
  blurb: Loc;
  salary: number;
  // No `taxes` field: it used to be a hand-written figure per job and it had
  // drifted a long way from the real ladder (a ฿22,000 salary was billed ฿900 a
  // month when it actually owes nothing at all). Tax is computed from income
  // now, by category, in `taxBill`.
  /** food, transport, phone… everything not itemised as a debt payment, and never a roof */
  otherExpenses: number;
  /**
   * What this person pays a landlord in the months they do not own the roof
   * they sleep under. Every profession has one, whether or not the game hands
   * them a mortgage: the two jobs that start without a house were living rent
   * free, which is the one thing nobody in Thailand does. For the jobs that do
   * start with a mortgage this is that instalment plus a bit, because the same
   * roof always costs more to rent than to owe money on.
   */
  rent: number;
  /**
   * What one child costs this household every month, day to day, before school
   * fees and before anything the cards charge separately. It is the whole
   * household's figure: half of it lands on the player's statement, because
   * there is somebody else in the house paying the other half.
   */
  childCost: number;
  cash: number;
  /** interest rates are filled in from DEBT_RATE when the game starts */
  debts: Omit<Debt, 'rate'>[];
  /** age the player is when they start this career in the game */
  startAge: number;
  /** age the salary stops; 0 means this work has no fixed end */
  retireAge: number;
  pension: PensionKind;
  /**
   * Annual pay rise, as a share of the current wage.
   *
   * Read these against INFLATION rather than against zero: what the player
   * feels is the gap between the two. They used to run 0% to 4% against 3%
   * inflation, which meant a career of falling real pay for nearly everybody
   * and a 59% real pay cut over thirty years for the rider and the cafe owner.
   * Thailand has not done that: nominal wage growth has run a little ahead of
   * prices, the civil service revises its base pay every few years, and a shop
   * owner puts the menu up the same week the beans do. So the rates sit around
   * inflation now, spread across it in the order the jobs deserve, and the
   * rider is the only one still losing ground.
   *
   * None of this makes the game easier to *win*: a salary never counts towards
   * passive income, so a rise moves how fast assets can be bought and never
   * moves the finish line by a baht.
   */
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
  /** monthly cash flow per unit, with every tenancy filled */
  cashflow: number;
  maxQty: number;
  /**
   * Nobody rents a building forever. `tenants` is how many separate tenancies
   * one unit holds, `tenantStay` how long the average one lasts, `reletChance`
   * how likely an empty one is filled in a given month. Together they decide
   * how much of `cashflow` actually turns up, and how lumpy it is: a single
   * condo is all or nothing, a 24-room dorm loses a room at a time.
   *
   * Set on tenanted property only. Anything without `tenants` never stands
   * empty, which is right for shares, gold, bare land, and a business the
   * player runs themselves.
   */
  tenants?: number;
  tenantStay?: number;
  reletChance?: number;
  /** somewhere a person could actually live, so the player may move in */
  livable?: boolean;
  /**
   * A young business does not sit still. Each month there is a chance its cash
   * flow steps up or down by this share, and a small chance it folds outright.
   * Only set on the cards where that volatility is the point (startups, and the
   * businesses whose fortunes swing with a trend).
   */
  volatility?: number;
  /**
   * The chance, in any one month, that this business closes for good.
   *
   * **Read this as a thirty-year number, not a monthly one.** The rate is
   * applied every single month and a closed business never reopens, so the
   * figure that matters is `1 - (1 - failRate) ** 360`. The first pass at these
   * numbers was picked to look sensible per year and came out at 96% to 99%
   * certain closure across a career: a milk-tea shop that survived thirty years
   * was a one-in-twenty-five event. The values here are worked backwards from a
   * target survival rate instead, and any new one should be too.
   *
   * Left unset it falls back to the old rule, where anything at or above 0.25
   * volatility folded on a 4% monthly roll.
   */
  failRate?: number;
  /**
   * How much of the price survives as saleable stuff when a business stops
   * earning: second-hand equipment, the fit-out, the lease. Defaults to
   * `BIZ_SALVAGE_RATE`. A shop being opened from scratch is nearly all fit-out
   * and no goodwill, so it carries a much higher figure than a going concern
   * bought for its takings.
   */
  salvage?: number;
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
  /**
   * News that moves one traded symbol, as a multiple of whatever it is trading
   * at when the card comes up. It used to carry an absolute price, which made
   * the card a reset button: gold could climb for thirty years and a single
   * draw would drop it back to a number written in 2026. `move` is the size of
   * the jump, and the title fills in the resulting price with `{price}`.
   */
  | { id: string; type: 'price'; symbol: string; move: number; title: Loc; story: Loc }
  /** a buyer for property/land matching `tag`, paying sticker price × multiplier */
  | { id: string; type: 'offer'; tag: string; multiplier: number; title: Loc; story: Loc }
  /** a buyer for any business, bidding `share` of what it is worth today */
  | { id: string; type: 'bizOffer'; share: number; title: Loc; story: Loc };

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
  /** only reaches a household with children in it */
  needsChild?: boolean;
  /** only reaches somebody who has a partner to have it with */
  needsPartner?: boolean;
  /** a bill the children's health cover would have paid most of */
  insurableChild?: boolean;
  /** saying yes to this one starts the children's health cover */
  buysChildCover?: boolean;
  /** a ticket, settled on the spot against the real odds */
  lottery?: boolean;
  /** a savings circle: money out now, a larger sum back later, on trust alone */
  chair?: boolean;
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
  /** December, and the only tax decision the player gets to make all year */
  | { kind: 'taxfund' }
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
  | { kind: 'tierUp'; tier: number }
  /** the index fund has had a bad year and the standing order is still running */
  | { kind: 'crash' };

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
   * There is somebody else in this life. It arrives with the first child, on
   * the grounds that the game was already assuming one: a household with
   * children in it has anniversaries, birthdays that are not yours, and meals
   * that cost more than the food. Their own income is deliberately not
   * modelled; what is modelled is only what leaves your side of the table.
   */
  partner: boolean;
  /** the children's health cover is in force, and its premium is being paid */
  childInsured: boolean;
  /**
   * Share of the wage going into the provident fund, matched baht for baht by
   * the employer. The pot is locked until the job ends and compounds while it
   * waits, which makes it the only holding in the game that grows without ever
   * being landed on.
   */
  pfRate: number;
  pfPot: number;
  /**
   * The December fund. `taxFundYear` is what has been bought against this
   * year's cap, `taxFundFirst` the month the first unit was bought, which is
   * where the ten-year lock is counted from.
   */
  /**
   * The standing order into a broad index fund, what it has grown into, and
   * what was actually paid in. The last one is kept so the gain can be shown
   * against the money rather than against a share price nobody watched.
   */
  /**
   * How far the floating reference rate has moved from where the game started.
   * Held on the state rather than on each loan so every mortgage moves together,
   * the way one bank's MRR moves every borrower at once.
   */
  /**
   * The tally the ending report is built from. None of these change how the
   * game plays; they are what the player did, kept so the last screen can say
   * something more useful than whether the dice were kind.
   */
  /** tickets bought and prizes taken, kept so the ending can print the ratio */
  lotterySpent: number;
  lotteryWon: number;
  /** money in a savings circle, and the month it is supposed to come back */
  chairIn: number;
  chairDue: number | null;
  interestPaid: number;
  monthsUnderwater: number;
  fireSales: number;
  investedTotal: number;
  incomeBought: number;
  /** every baht ever invested, grown in a broad fund instead, for comparison */
  shadowPot: number;
  /** rent and profit those holdings have paid out over the whole game */
  incomeReceived: number;
  taxPaid: number;
  refundsTaken: number;
  rateDrift: number;
  /** the card is being paid the smallest amount it will take */
  cardMinimum: boolean;
  dcaMonthly: number;
  dcaPot: number;
  dcaPaid: number;
  /**
   * The return the index fund is having *this* year, drawn once every twelve
   * months and then spread smoothly across them.
   *
   * It used to be redrawn every single month around a 7% average, which sounds
   * volatile and is not: twelve independent draws average out, so the worst
   * year the fund could possibly have was about -2%. A market does not work
   * that way. One draw a year, from a distribution with a real left tail, is
   * what makes a crash something the player has to sit through rather than
   * something the arithmetic quietly cancels.
   */
  marketYear: number;
  /** a bad market year has been drawn and the player has not been told yet */
  crashDue: boolean;
  taxFundPot: number;
  taxFundYear: number;
  taxFundFirst: number | null;
  taxFundDue: boolean;
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
  /**
   * The month `entryPay` was last set. Starting over means starting at the
   * bottom, but not staying there for life: the gap closes a little every year
   * from here, which is what actually happens to somebody who changes field and
   * turns out to be good at the new one.
   */
  entryPayFrom: number | null;
  /**
   * Months still to wait before the new licensed job actually starts. The
   * licence is the cheap part; the queue for a seat is the part that ends
   * careers before they begin.
   */
  jobWait: number;
  /**
   * Years the employer withheld the annual rise. Subtracted from the compounding
   * in `payLevel`, so a frozen year is not caught up later: the whole ladder
   * stays one rung shorter for the rest of the career.
   */
  payFreezeYears: number;
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
