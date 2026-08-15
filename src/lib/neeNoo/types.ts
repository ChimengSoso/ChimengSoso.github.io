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
  /** monthly cash flow per unit (can be 0 for capital-gain plays) */
  cashflowPerUnit: number;
}

/* ------------------------------------------------------------- liabilities */

export type DebtKey = 'home' | 'car' | 'card' | 'retail' | 'student' | 'bank';

export interface Debt {
  key: DebtKey;
  balance: number;
  /** monthly payment; disappears from the expense sheet once the debt is paid off */
  payment: number;
}

/* ------------------------------------------------------------- professions */

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
  debts: Debt[];
}

/* ------------------------------------------------------------------- cards */

export interface DealCard {
  id: string;
  size: 'small' | 'big';
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
  /** monthly cash flow per unit */
  cashflow: number;
  maxQty: number;
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
  /** instead of paying cash, it can be put on an instalment plan (also scaled) */
  instalment?: { balanceScale: number; paymentScale: number };
}

export type FastCard =
  | { id: string; type: 'deal'; title: Loc; story: Loc; price: number; cashflow: number }
  | { id: string; type: 'bonus'; title: Loc; story: Loc; amount: number }
  | { id: string; type: 'setback'; title: Loc; story: Loc; amount: number; incomeLoss?: number };

export interface Dream {
  id: string;
  title: Loc;
  story: Loc;
  cost: number;
}

/* ------------------------------------------------------------------- board */

export type RatTile = 'payday' | 'deal' | 'market' | 'doodad' | 'baby' | 'downsized' | 'charity';
export type FastTile = 'fastpay' | 'fastdeal' | 'dream' | 'bonus' | 'setback';

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
  | { kind: 'rescue' };

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
  dreamBought: boolean;
  lastRoll: number[];
  /** tiles still to walk this turn; the UI advances them one at a time */
  walking: number;
  pending: Pending | null;
  decks: Decks;
  seed: number;
  log: LogEntry[];
}
