/**
 * Rules engine for "หนีหนู".
 *
 * Everything here is pure-ish: functions take the mutable `GameState`, change
 * it, append a log line, and return nothing. The UI re-renders from the state
 * after each call, so the board never holds truth of its own.
 */
import {
  FAST_BOARD,
  RAT_BOARD,
  dealById,
  deals,
  doodadById,
  doodads,
  dreamById,
  fastById,
  fastCards,
  marketById,
  marketCards,
  professionById,
} from '../../data/neeNoo';
import type {
  Asset,
  DealCard,
  Debt,
  DebtKey,
  DoodadCard,
  FastCard,
  GameState,
  Loc,
  MarketCard,
  Profession,
} from './types';

export const SAVE_VERSION = 1;
/** monthly payment on the emergency bank loan, as a share of the balance */
export const LOAN_RATE = 0.1;
export const LOAN_STEP = 10000;
/** the bank stops lending past this multiple of the monthly salary */
export const LOAN_SALARY_CAP = 20;
/** fire-sale price, as a share of the sticker price */
export const FIRE_SALE_RATE = 0.5;
/** fast-track cash granted at the escape, as a multiple of monthly passive income */
export const ESCAPE_MULTIPLE = 100;
/** extra monthly income needed to win on the fast track */
export const FAST_GOAL = 300000;
export const MAX_CHILDREN = 3;
/** monthly interest on the debt a profession starts with, and on asset mortgages */
export const DEBT_RATE: Record<DebtKey, number> = {
  home: 0.0035,
  car: 0.005,
  card: 0.015,
  retail: 0.01,
  student: 0.002,
  bank: LOAN_RATE,
};
export const MORTGAGE_RATE = 0.0035;
/** generosity needed before a friend will step in during a cash crisis */
export const FRIEND_HELP_KARMA = 3;
export const FRIEND_HELP_AMOUNT = 150000;
/** monthly passive income, above the level at escape, for the professional tier */
export const TIER5_INCOME = 300000;
/** total monthly passive income for the top tier, alongside owning the dream */
export const TIER6_INCOME = 1000000;

export const TIER_NAMES: Loc[] = [
  { th: 'มนุษย์เงินเดือน', en: 'Salary earner' },
  { th: 'มือใหม่หัดลงทุน', en: 'First-time investor' },
  { th: 'คนที่หนีออกมาได้', en: 'Off the wheel' },
  { th: 'เจ้าของพอร์ต', en: 'Debt-free owner' },
  { th: 'นักลงทุนอาชีพ', en: 'Professional investor' },
  { th: 'นายทุน', en: 'Capitalist' },
];

/* ------------------------------------------------------------------- random */

function rand(s: GameState): number {
  s.seed = (s.seed + 0x6d2b79f5) | 0;
  let t = s.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function shuffled(s: GameState, ids: string[]): string[] {
  const out = ids.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand(s) * (i + 1));
    const a = out[i];
    const b = out[j];
    if (a !== undefined && b !== undefined) {
      out[i] = b;
      out[j] = a;
    }
  }
  return out;
}

function draw(s: GameState, deck: string[], refill: string[]): string {
  if (deck.length === 0) deck.push(...shuffled(s, refill));
  const id = deck.pop();
  return id ?? (refill[0] ?? '');
}

function uid(s: GameState, cardId: string): string {
  return `${cardId}-${Math.floor(rand(s) * 1e9).toString(36)}`;
}

/* -------------------------------------------------------------- derivations */

export function profession(s: GameState): Profession {
  const p = professionById.get(s.professionId);
  if (!p) throw new Error(`unknown profession: ${s.professionId}`);
  return p;
}

export function assetCashflow(a: Asset): number {
  return a.cashflowPerUnit * a.qty;
}

export function passiveIncome(s: GameState): number {
  return s.assets.reduce((sum, a) => sum + assetCashflow(a), 0);
}

export function salary(s: GameState): number {
  return s.quit ? 0 : profession(s).salary;
}

export function totalIncome(s: GameState): number {
  return salary(s) + passiveIncome(s);
}

/** Everything owed each month across the balance sheet, mortgages included. */
export function mortgagePayments(s: GameState): number {
  return s.assets.reduce((sum, a) => sum + a.mortgagePay * (a.debt > 0 ? 1 : 0), 0);
}

/** Which tier the player has earned right now, 1..6. */
export function tierOf(s: GameState): number {
  const passive = passiveIncome(s);
  if (s.dreamBought && passive >= TIER6_INCOME) return 6;
  if (s.quit && passive - s.escapeIncome >= TIER5_INCOME) return 5;
  if (s.quit && s.debts.length === 0 && s.assets.every((a) => a.debt <= 0) && netWorth(s) > 0) return 4;
  if (s.quit) return 3;
  if (s.assets.some((a) => a.cashflowPerUnit > 0)) return 2;
  return 1;
}

/** True once passive income covers the bills, i.e. the job is optional. */
export function canQuit(s: GameState): boolean {
  return !s.quit && passiveIncome(s) >= totalExpenses(s);
}

export function childExpense(s: GameState): number {
  return profession(s).childCost * s.children;
}

export function debtPayments(s: GameState): number {
  return s.debts.reduce((sum, d) => sum + d.payment, 0);
}

export function totalExpenses(s: GameState): number {
  const p = profession(s);
  return p.taxes + p.otherExpenses + childExpense(s) + debtPayments(s);
}

export function monthlyCashflow(s: GameState): number {
  return totalIncome(s) - totalExpenses(s);
}

export function assetValue(a: Asset): number {
  return a.pricePerUnit * a.qty;
}

export function netWorth(s: GameState): number {
  const assets = s.assets.reduce((sum, a) => sum + assetValue(a) - a.debt, 0);
  const debts = s.debts.reduce((sum, d) => sum + d.balance, 0);
  return s.cash + assets - debts;
}

export function loanCeiling(s: GameState): number {
  return profession(s).salary * LOAN_SALARY_CAP;
}

export function bankBalance(s: GameState): number {
  return s.debts.find((d) => d.key === 'bank')?.balance ?? 0;
}

/** How far along the escape is, 0..1 — passive income against total expenses. */
export function escapeProgress(s: GameState): number {
  const exp = totalExpenses(s);
  if (exp <= 0) return 1;
  return Math.min(1, passiveIncome(s) / exp);
}

/** Monthly income built since leaving the wheel — the fast-track scoreboard. */
export function fastAdded(s: GameState): number {
  return Math.max(0, passiveIncome(s) - s.escapeIncome);
}

export function fastProgress(s: GameState): number {
  return Math.min(1, fastAdded(s) / FAST_GOAL);
}

/* --------------------------------------------------------------------- log */

function note(s: GameState, text: Loc, tone: 'good' | 'bad' | 'plain' = 'plain'): void {
  s.log.unshift({ turn: s.turn, text, tone });
  if (s.log.length > 60) s.log.length = 60;
}

const money = (n: number): string => `฿${Math.round(n).toLocaleString('en-US')}`;

/* ------------------------------------------------------------------- setup */

export function createGame(professionId: string, dreamId: string, seed: number): GameState {
  const p = professionById.get(professionId);
  if (!p) throw new Error(`unknown profession: ${professionId}`);

  const prices: Record<string, number> = {};
  for (const d of deals) {
    if (d.symbol) prices[d.symbol] = d.price;
  }

  const s: GameState = {
    version: SAVE_VERSION,
    phase: 'rat',
    professionId,
    dreamId,
    cash: p.cash,
    children: 0,
    assets: [],
    debts: p.debts.map((d) => ({ ...d, rate: DEBT_RATE[d.key] })),
    quit: false,
    tier: 1,
    karma: 0,
    friendHelpUsed: false,
    endedByChoice: false,
    prices,
    pos: 0,
    fastPos: 0,
    turn: 1,
    months: 0,
    skipTurns: 0,
    charityTurns: 0,
    escapeIncome: 0,
    dreamBought: false,
    lastRoll: [],
    walking: 0,
    pending: null,
    decks: { small: [], big: [], market: [], doodad: [], fastDeal: [], fastBonus: [], fastSetback: [] },
    seed: seed | 0,
    log: [],
  };

  refillAll(s);
  note(s, {
    th: `เริ่มเกมในบทบาท "${p.name.th}" กระแสเงินสดตั้งต้นเดือนละ ${money(monthlyCashflow(s))}`,
    en: `Starting as "${p.name.en}" with ${money(monthlyCashflow(s))} of monthly cash flow.`,
  });
  return s;
}

function refillAll(s: GameState): void {
  s.decks.small = shuffled(s, deals.filter((d) => d.size === 'small').map((d) => d.id));
  s.decks.big = shuffled(s, deals.filter((d) => d.size === 'big').map((d) => d.id));
  s.decks.market = shuffled(s, marketCards.map((c) => c.id));
  s.decks.doodad = shuffled(s, doodads.map((c) => c.id));
  s.decks.fastDeal = shuffled(s, fastCards.filter((c) => c.type === 'deal').map((c) => c.id));
  s.decks.fastBonus = shuffled(s, fastCards.filter((c) => c.type === 'bonus').map((c) => c.id));
  s.decks.fastSetback = shuffled(s, fastCards.filter((c) => c.type === 'setback').map((c) => c.id));
}

/* -------------------------------------------------------------------- turn */

export function canRoll(s: GameState): boolean {
  return (s.phase === 'rat' || s.phase === 'fast') && s.pending === null && s.walking === 0;
}

export function rollDice(s: GameState, dice: number): void {
  if (!canRoll(s)) return;

  if (s.skipTurns > 0) {
    // Being out of work is not "sit still for two turns": the bills keep coming
    // with no salary behind them. Passive income is the only thing that softens
    // it, which is the whole point of the game.
    s.skipTurns -= 1;
    s.turn += 1;
    s.months += 1;
    const gap = totalExpenses(s) - passiveIncome(s);
    s.cash -= gap;
    note(
      s,
      {
        th: `ว่างงานอีกหนึ่งเดือน ไม่มีเงินเดือนเข้า จ่ายรายจ่าย ${money(totalExpenses(s))} เงินไหลเข้าช่วยไว้ ${money(passiveIncome(s))} สุทธิ ${money(-gap)} (เหลืออีก ${s.skipTurns} ตา)`,
        en: `Another month out of work: no salary, ${money(totalExpenses(s))} of expenses, ${money(passiveIncome(s))} covered by passive income, net ${money(-gap)} (${s.skipTurns} turns to go).`,
      },
      'bad',
    );
    checkTrouble(s);
    return;
  }

  const count = s.charityTurns > 0 ? Math.min(2, Math.max(1, dice)) : 1;
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) rolls.push(1 + Math.floor(rand(s) * 6));
  s.lastRoll = rolls;
  if (s.charityTurns > 0) s.charityTurns -= 1;

  // The walk is left for the caller to advance one tile at a time, so the board
  // can show the token travelling and the money landing instead of teleporting
  // the whole turn into a single frame. Call stepMove until walking hits zero
  // (or finishMove to skip the animation).
  s.walking = rolls.reduce((a, b) => a + b, 0);
  s.turn += 1;
}

/** Advance the token exactly one tile. Returns true while the walk continues. */
export function stepMove(s: GameState): boolean {
  if (s.walking <= 0) return false;
  const onFast = s.phase === 'fast';
  const board = onFast ? FAST_BOARD : RAT_BOARD;

  if (onFast) s.fastPos = (s.fastPos + 1) % board.length;
  else s.pos = (s.pos + 1) % board.length;
  s.walking -= 1;

  if (s.walking === 0) {
    if (onFast) landFast(s);
    else landRat(s);
    return false;
  }

  // Passing (not just landing on) a payday tile still pays, which is what makes
  // a long roll worth something even when it ends on a doodad.
  const tile = board[onFast ? s.fastPos : s.pos];
  if (tile === 'payday' || tile === 'fastpay') {
    if (onFast) fastPayday(s);
    else payday(s);
    // Escaping mid-walk changes which board the token is standing on, so the
    // rest of the roll is forfeited rather than continued on the wrong ring.
    if (!onFast && s.phase !== 'rat') {
      s.walking = 0;
      return false;
    }
    // A rescue raised while still moving would be overwritten by the landing
    // tile anyway; the caller re-checks solvency once the turn is over.
    if (s.pending?.kind === 'rescue') s.pending = null;
  }
  return s.walking > 0;
}

/** Run the rest of the walk with no animation (used on load and by tests). */
export function finishMove(s: GameState): void {
  let guard = 0;
  while (s.walking > 0 && guard++ < 64) stepMove(s);
  s.walking = 0;
}

function landRat(s: GameState): void {
  const tile = RAT_BOARD[s.pos];
  switch (tile) {
    case 'payday':
      payday(s);
      break;
    case 'deal':
      s.pending = { kind: 'dealChoice' };
      break;
    case 'market':
      s.pending = { kind: 'market', cardId: draw(s, s.decks.market, marketCards.map((c) => c.id)) };
      // A quoted price is news, not an offer: it re-values the holding whether
      // or not the player decides to sell.
      applyMarketPrice(s);
      break;
    case 'doodad':
      s.pending = { kind: 'doodad', cardId: draw(s, s.decks.doodad, doodads.map((c) => c.id)) };
      break;
    case 'baby':
      s.pending = { kind: 'baby' };
      break;
    case 'downsized':
      s.pending = { kind: 'downsized' };
      break;
    case 'charity':
      s.pending = { kind: 'charity' };
      break;
    default:
      break;
  }
}

/**
 * One month of debt service. Interest is the cost of carrying the balance; the
 * rest of the payment eats into the principal, so ordinary debts really do
 * shrink and eventually vanish. The emergency loan is interest-only and never
 * shrinks on its own, which is exactly why it hurts.
 */
export function amortize(s: GameState): void {
  for (const d of s.debts) {
    if (d.interestOnly) continue;
    const principal = Math.max(0, d.payment - d.balance * d.rate);
    d.balance = Math.max(0, d.balance - principal);
  }
  for (const a of s.assets) {
    if (a.debt <= 0) continue;
    const principal = Math.max(0, a.mortgagePay - a.debt * MORTGAGE_RATE);
    a.debt = Math.max(0, a.debt - principal);
    if (a.debt <= 0) {
      // The mortgage is gone, so the payment it was eating comes back as income.
      a.cashflowPerUnit += a.mortgagePay / a.qty;
      note(
        s,
        {
          th: `ผ่อน ${a.name.th} หมดแล้ว เงินไหลเข้าเพิ่มเดือนละ ${money(a.mortgagePay)}`,
          en: `${a.name.en} is paid off: ${money(a.mortgagePay)} more coming in every month.`,
        },
        'good',
      );
    }
  }
  const cleared = s.debts.filter((d) => d.balance <= 0);
  for (const d of cleared) {
    note(
      s,
      { th: `ผ่อน${debtLabel(d.key).th}หมดแล้ว รายจ่ายลดลง ${money(d.payment)}`, en: `${debtLabel(d.key).en} cleared: ${money(d.payment)} off the monthly bill.` },
      'good',
    );
  }
  s.debts = s.debts.filter((d) => d.balance > 0);
}

function payday(s: GameState): void {
  const cf = monthlyCashflow(s);
  s.cash += cf;
  s.months += 1;
  note(
    s,
    {
      th: `วันเงินเดือน กระแสเงินสด ${cf >= 0 ? '+' : ''}${money(cf)}`,
      en: `Payday: cash flow ${cf >= 0 ? '+' : ''}${money(cf)}`,
    },
    cf >= 0 ? 'good' : 'bad',
  );
  amortize(s);
  checkEscape(s);
  checkTrouble(s);
}

function fastPayday(s: GameState): void {
  // No salary out here, but the bills did not stop, so a fast-track month is
  // passive income minus expenses just like any other month.
  const cf = monthlyCashflow(s);
  s.cash += cf;
  s.months += 1;
  note(
    s,
    {
      th: `เงินไหลเข้า ${money(passiveIncome(s))} หักรายจ่าย ${money(totalExpenses(s))} เหลือ ${cf >= 0 ? '+' : ''}${money(cf)}`,
      en: `${money(passiveIncome(s))} in, ${money(totalExpenses(s))} of expenses, leaving ${cf >= 0 ? '+' : ''}${money(cf)}`,
    },
    cf >= 0 ? 'good' : 'bad',
  );
  amortize(s);
  checkTier(s);
}

function landFast(s: GameState): void {
  const tile = FAST_BOARD[s.fastPos];
  switch (tile) {
    case 'fastpay':
      fastPayday(s);
      break;
    case 'fastdeal':
      s.pending = { kind: 'fastdeal', cardId: draw(s, s.decks.fastDeal, fastCards.filter((c) => c.type === 'deal').map((c) => c.id)) };
      break;
    case 'bonus':
      s.pending = { kind: 'fastbonus', cardId: draw(s, s.decks.fastBonus, fastCards.filter((c) => c.type === 'bonus').map((c) => c.id)) };
      break;
    case 'setback':
      s.pending = { kind: 'fastsetback', cardId: draw(s, s.decks.fastSetback, fastCards.filter((c) => c.type === 'setback').map((c) => c.id)) };
      break;
    case 'dream':
      s.pending = { kind: 'dream' };
      break;
    default:
      break;
  }
}

/* --------------------------------------------------------------- rat tiles */

export function chooseDeal(s: GameState, size: 'small' | 'big'): void {
  if (s.pending?.kind !== 'dealChoice') return;
  const cardId =
    size === 'small'
      ? draw(s, s.decks.small, deals.filter((d) => d.size === 'small').map((d) => d.id))
      : draw(s, s.decks.big, deals.filter((d) => d.size === 'big').map((d) => d.id));
  s.pending = { kind: 'deal', cardId };
}

export function dealPrice(s: GameState, card: DealCard): number {
  if (card.symbol) return s.prices[card.symbol] ?? card.price;
  return card.price;
}

/** Cash needed per unit of a deal, using the live price for traded symbols. */
export function dealDown(s: GameState, card: DealCard): number {
  return card.symbol ? dealPrice(s, card) : card.down;
}

export function maxAffordable(s: GameState, card: DealCard): number {
  const per = dealDown(s, card);
  if (per <= 0) return card.maxQty;
  return Math.max(0, Math.min(card.maxQty, Math.floor(s.cash / per)));
}

export function buyDeal(s: GameState, qty: number): void {
  if (s.pending?.kind !== 'deal') return;
  const card = dealById.get(s.pending.cardId);
  if (!card) return;
  const n = Math.max(0, Math.min(qty, maxAffordable(s, card)));
  if (n === 0) return;

  const per = dealDown(s, card);
  const price = dealPrice(s, card);
  s.cash -= per * n;
  if (card.symbol) s.prices[card.symbol] = price;

  // Only traded symbols stack into one holding; two condos stay two condos.
  const existing = card.symbol ? s.assets.find((a) => a.cardId === card.id && a.symbol === card.symbol) : undefined;
  if (existing) {
    const totalCost = existing.costPerUnit * existing.qty + per * n;
    existing.qty += n;
    existing.costPerUnit = totalCost / existing.qty;
    existing.pricePerUnit = price;
  } else {
    const asset: Asset = {
      uid: uid(s, card.id),
      cardId: card.id,
      kind: card.kind,
      name: card.title,
      qty: n,
      costPerUnit: per,
      pricePerUnit: price,
      debt: card.debt * n,
      mortgagePay: (card.mortgagePay ?? 0) * n,
      cashflowPerUnit: card.cashflow,
    };
    if (card.symbol !== undefined) asset.symbol = card.symbol;
    if (card.tag !== undefined) asset.tag = card.tag;
    s.assets.push(asset);
  }

  note(
    s,
    {
      th: `ซื้อ ${card.title.th} ${n > 1 ? `จำนวน ${n} หน่วย ` : ''}จ่ายเงินสด ${money(per * n)}${card.cashflow ? ` ได้เงินไหลเข้าเพิ่มเดือนละ ${money(card.cashflow * n)}` : ''}`,
      en: `Bought ${card.title.en}${n > 1 ? ` ×${n}` : ''} for ${money(per * n)}${card.cashflow ? `, adding ${money(card.cashflow * n)} a month` : ''}.`,
    },
    'good',
  );
  s.pending = null;
  checkEscape(s);
  checkTrouble(s);
}

export function passDeal(s: GameState): void {
  if (s.pending?.kind !== 'deal' && s.pending?.kind !== 'dealChoice') return;
  s.pending = null;
}

export function marketMatches(s: GameState, card: MarketCard): Asset[] {
  if (card.type === 'price') return s.assets.filter((a) => a.symbol === card.symbol);
  if (card.type === 'offer') return s.assets.filter((a) => a.tag === card.tag);
  return s.assets.filter((a) => a.kind === 'business' && a.cashflowPerUnit > 0);
}

export function marketUnitPrice(card: MarketCard, a: Asset): number {
  if (card.type === 'price') return card.price;
  if (card.type === 'offer') return a.pricePerUnit * card.multiplier;
  return a.cashflowPerUnit * card.monthsMultiple;
}

export function sellToMarket(s: GameState, assetUid: string, qty: number): void {
  if (s.pending?.kind !== 'market') return;
  const card = marketById.get(s.pending.cardId);
  if (!card) return;
  const a = s.assets.find((x) => x.uid === assetUid);
  if (!a) return;
  const n = Math.max(1, Math.min(qty, a.qty));
  const unit = marketUnitPrice(card, a);
  // Debt travels with the units being sold.
  const debtShare = a.qty > 0 ? (a.debt / a.qty) * n : 0;
  const proceeds = unit * n - debtShare;
  const gain = proceeds - (a.costPerUnit * n);

  s.cash += proceeds;
  a.qty -= n;
  a.debt -= debtShare;
  if (a.qty <= 0) s.assets = s.assets.filter((x) => x.uid !== a.uid);

  note(
    s,
    {
      th: `ขาย ${a.name.th}${n > 1 ? ` ${n} หน่วย` : ''} ได้เงินสด ${money(proceeds)} (${gain >= 0 ? 'กำไร' : 'ขาดทุน'} ${money(Math.abs(gain))})`,
      en: `Sold ${a.name.en}${n > 1 ? ` ×${n}` : ''} for ${money(proceeds)} (${gain >= 0 ? 'gain' : 'loss'} ${money(Math.abs(gain))}).`,
    },
    gain >= 0 ? 'good' : 'bad',
  );
  checkEscape(s);
  checkTrouble(s);
}

export function applyMarketPrice(s: GameState): void {
  if (s.pending?.kind !== 'market') return;
  const card = marketById.get(s.pending.cardId);
  if (card && card.type === 'price') {
    s.prices[card.symbol] = card.price;
    for (const a of s.assets) {
      if (a.symbol === card.symbol) a.pricePerUnit = card.price;
    }
  }
}

export function closeMarket(s: GameState): void {
  if (s.pending?.kind !== 'market') return;
  s.pending = null;
}

export function doodadCost(s: GameState, card: DoodadCard): number {
  const base = Math.round((card.scale * profession(s).otherExpenses) / 100) * 100;
  return card.perChild ? base * s.children : base;
}

export function payDoodad(s: GameState): void {
  if (s.pending?.kind !== 'doodad') return;
  const card = doodadById.get(s.pending.cardId);
  if (!card) return;
  const cost = doodadCost(s, card);
  if (card.social) s.karma += 1;
  if (cost > 0) {
    s.cash -= cost;
    note(s, { th: `${card.title.th} จ่ายไป ${money(cost)}`, en: `${card.title.en}: paid ${money(cost)}.` }, 'bad');
  } else {
    note(s, { th: `${card.title.th} รอบนี้ไม่มีค่าใช้จ่าย`, en: `${card.title.en}: nothing to pay this time.` });
  }
  s.pending = null;
  checkTrouble(s);
}

export function takeInstalment(s: GameState): void {
  if (s.pending?.kind !== 'doodad') return;
  const card = doodadById.get(s.pending.cardId);
  if (!card?.instalment) return;
  const other = profession(s).otherExpenses;
  const balance = Math.round((card.instalment.balanceScale * other) / 100) * 100;
  const payment = Math.round((card.instalment.paymentScale * other) / 100) * 100;
  addDebt(s, 'retail', balance, payment);
  note(
    s,
    {
      th: `ผ่อน ${card.title.th} หนี้เพิ่ม ${money(balance)} รายจ่ายเพิ่มเดือนละ ${money(payment)}`,
      en: `${card.title.en} on instalments: ${money(balance)} of debt, ${money(payment)} more per month.`,
    },
    'bad',
  );
  s.pending = null;
  checkEscape(s);
}

export function declineDoodad(s: GameState): void {
  if (s.pending?.kind !== 'doodad') return;
  const card = doodadById.get(s.pending.cardId);
  if (!card?.optional) return;
  if (card.social) s.karma -= 1;
  note(
    s,
    {
      th: `ปฏิเสธ ${card.title.th} ไม่เสียเงินสักบาท${card.social ? ' แต่น้ำใจลดลง 1' : ''}`,
      en: `Declined ${card.title.en}: not a baht spent${card.social ? ', but generosity drops by 1' : ''}.`,
    },
    'good',
  );
  s.pending = null;
}

export function acceptBaby(s: GameState): void {
  if (s.pending?.kind !== 'baby') return;
  if (s.children >= MAX_CHILDREN) {
    note(s, { th: 'ลูก ๆ โตกันหมดแล้ว รายจ่ายไม่เพิ่ม', en: 'The children are grown; expenses do not change.' });
  } else {
    s.children += 1;
    note(
      s,
      {
        th: `มีลูกเพิ่มหนึ่งคน รายจ่ายเพิ่มเดือนละ ${money(profession(s).childCost)}`,
        en: `A new child: ${money(profession(s).childCost)} more every month.`,
      },
      'bad',
    );
  }
  s.pending = null;
  checkEscape(s);
}

export function acceptDownsized(s: GameState): void {
  if (s.pending?.kind !== 'downsized') return;
  // The bill for being jobless is charged month by month over the two skipped
  // turns (see rollDice), not as one lump here, so the player watches it happen.
  s.skipTurns = 2;
  note(
    s,
    {
      th: 'ตกงาน ไม่มีเงินเดือนเข้าอีก 2 เดือน แต่รายจ่ายยังเดินต่อทุกเดือน',
      en: 'Downsized: no salary for two months, while the expenses carry on regardless.',
    },
    'bad',
  );
  s.pending = null;
  checkTrouble(s);
}

export function charityCost(s: GameState): number {
  return Math.round(totalIncome(s) * 0.1);
}

export function giveCharity(s: GameState): void {
  if (s.pending?.kind !== 'charity') return;
  const cost = charityCost(s);
  if (s.cash < cost) return;
  s.cash -= cost;
  s.charityTurns = 3;
  note(
    s,
    {
      th: `บริจาค ${money(cost)} สามตาถัดไปเลือกทอยได้ 1 หรือ 2 ลูก`,
      en: `Donated ${money(cost)}. For the next three turns you may roll one die or two.`,
    },
    'good',
  );
  s.pending = null;
  checkTrouble(s);
}

export function skipCharity(s: GameState): void {
  if (s.pending?.kind !== 'charity') return;
  s.pending = null;
}

/* -------------------------------------------------------------- fast tiles */

export function buyFastDeal(s: GameState): void {
  if (s.pending?.kind !== 'fastdeal') return;
  const card = fastById.get(s.pending.cardId);
  if (!card || card.type !== 'deal' || s.cash < card.price) return;
  s.cash -= card.price;
  s.assets.push({
    uid: uid(s, card.id),
    cardId: card.id,
    kind: 'business',
    name: card.title,
    tag: 'fasttrack',
    qty: 1,
    costPerUnit: card.price,
    pricePerUnit: card.price,
    debt: 0,
    mortgagePay: 0,
    cashflowPerUnit: card.cashflow,
  });
  note(
    s,
    {
      th: `ลงทุน ${card.title.th} จ่าย ${money(card.price)} รายได้ทางด่วนเพิ่มเดือนละ ${money(card.cashflow)}`,
      en: `Invested in ${card.title.en} for ${money(card.price)}: ${money(card.cashflow)} more per month.`,
    },
    'good',
  );
  s.pending = null;
  checkWin(s);
}

/**
 * A setback that costs monthly income takes it out of the biggest earner the
 * player owns, which is where a rent renegotiation would actually land.
 */
function shaveIncome(s: GameState, amount: number): void {
  let left = amount;
  const earners = s.assets.filter((a) => assetCashflow(a) > 0).sort((a, b) => assetCashflow(b) - assetCashflow(a));
  for (const a of earners) {
    if (left <= 0) break;
    const take = Math.min(left, assetCashflow(a));
    a.cashflowPerUnit -= take / a.qty;
    left -= take;
  }
}

export function resolveFastCard(s: GameState): void {
  const p = s.pending;
  if (!p) return;
  if (p.kind === 'fastdeal') {
    s.pending = null;
    return;
  }
  if (p.kind === 'fastbonus' || p.kind === 'fastsetback') {
    const card: FastCard | undefined = fastById.get(p.cardId);
    if (card && card.type === 'bonus') {
      s.cash += card.amount;
      note(s, { th: `${card.title.th} +${money(card.amount)}`, en: `${card.title.en}: +${money(card.amount)}` }, 'good');
    } else if (card && card.type === 'setback') {
      s.cash -= card.amount;
      if (card.incomeLoss) shaveIncome(s, card.incomeLoss);
      note(
        s,
        {
          th: `${card.title.th} ${card.amount ? `จ่าย ${money(card.amount)}` : ''}${card.incomeLoss ? ` รายได้ต่อเดือนหายไป ${money(card.incomeLoss)}` : ''}`,
          en: `${card.title.en}${card.amount ? `: paid ${money(card.amount)}` : ''}${card.incomeLoss ? `, monthly income down ${money(card.incomeLoss)}` : ''}`,
        },
        'bad',
      );
    }
    s.pending = null;
    checkTrouble(s);
  }
}

export function buyDream(s: GameState): void {
  if (s.pending?.kind !== 'dream') return;
  const dream = dreamById.get(s.dreamId);
  if (!dream || s.cash < dream.cost) return;
  s.cash -= dream.cost;
  s.dreamBought = true;
  note(s, { th: `ซื้อความฝัน: ${dream.title.th}`, en: `Dream purchased: ${dream.title.en}` }, 'good');
  s.pending = null;
  checkWin(s);
}

export function skipDream(s: GameState): void {
  if (s.pending?.kind !== 'dream') return;
  s.pending = null;
}

/* --------------------------------------------------------------- debt desk */

function addDebt(s: GameState, key: DebtKey, balance: number, payment: number, interestOnly = false): void {
  const existing = s.debts.find((d) => d.key === key);
  if (existing) {
    existing.balance += balance;
    existing.payment += payment;
  } else {
    const d: Debt = { key, balance, payment, rate: DEBT_RATE[key] };
    if (interestOnly) d.interestOnly = true;
    s.debts.push(d);
  }
}

export function maxBorrow(s: GameState): number {
  return Math.max(0, loanCeiling(s) - bankBalance(s));
}

export function borrow(s: GameState, amount: number): void {
  const steps = Math.floor(amount / LOAN_STEP);
  const value = Math.min(steps * LOAN_STEP, maxBorrow(s));
  if (value <= 0) return;
  s.cash += value;
  addDebt(s, 'bank', value, value * LOAN_RATE, true);
  note(
    s,
    {
      th: `กู้ธนาคาร ${money(value)} รายจ่ายเพิ่มเดือนละ ${money(value * LOAN_RATE)}`,
      en: `Borrowed ${money(value)}, adding ${money(value * LOAN_RATE)} to monthly expenses.`,
    },
    'bad',
  );
  checkEscape(s);
  checkTrouble(s);
}

export function canRepay(s: GameState, key: string): boolean {
  const d = s.debts.find((x) => x.key === key);
  if (!d) return false;
  return key === 'bank' ? s.cash >= Math.min(LOAN_STEP, d.balance) : s.cash >= d.balance;
}

export function repay(s: GameState, key: string, amount?: number): void {
  const d = s.debts.find((x) => x.key === key);
  if (!d) return;
  const value =
    key === 'bank'
      ? Math.min(d.balance, Math.floor((amount ?? d.balance) / LOAN_STEP) * LOAN_STEP, Math.floor(s.cash / LOAN_STEP) * LOAN_STEP)
      : d.balance;
  if (value <= 0 || s.cash < value) return;

  s.cash -= value;
  const label = debtLabel(d.key);
  const freed = key === 'bank' ? value * LOAN_RATE : d.payment;
  d.balance -= value;
  d.payment = key === 'bank' ? d.balance * LOAN_RATE : 0;
  if (d.balance <= 0) s.debts = s.debts.filter((x) => x.key !== key);

  note(
    s,
    {
      th: `ปิดหนี้ ${label.th} ${money(value)} รายจ่ายลดลงเดือนละ ${money(freed)}`,
      en: `Paid down ${label.en} by ${money(value)}, cutting ${money(freed)} from monthly expenses.`,
    },
    'good',
  );
  checkEscape(s);
}

export const debtLabel = (key: DebtKey): Loc =>
  ({
    home: { th: 'ผ่อนบ้าน', en: 'Home loan' },
    car: { th: 'ผ่อนรถ', en: 'Car loan' },
    card: { th: 'บัตรเครดิต', en: 'Credit card' },
    retail: { th: 'ผ่อนสินค้า/กิจการ', en: 'Instalments' },
    student: { th: 'กู้เรียน (กยศ.)', en: 'Student loan' },
    bank: { th: 'เงินกู้ฉุกเฉิน', en: 'Emergency loan' },
  })[key];

/* ------------------------------------------------------------- fire sale */

export function fireSaleValue(a: Asset, qty: number): number {
  const debtShare = a.qty > 0 ? (a.debt / a.qty) * qty : 0;
  return Math.max(0, a.pricePerUnit * FIRE_SALE_RATE * qty - debtShare);
}

export function fireSale(s: GameState, assetUid: string, qty: number): void {
  const a = s.assets.find((x) => x.uid === assetUid);
  if (!a) return;
  const n = Math.max(1, Math.min(qty, a.qty));
  const proceeds = fireSaleValue(a, n);
  const debtShare = a.qty > 0 ? (a.debt / a.qty) * n : 0;

  s.cash += proceeds;
  a.qty -= n;
  a.debt -= debtShare;
  if (a.qty <= 0) s.assets = s.assets.filter((x) => x.uid !== a.uid);

  note(
    s,
    {
      th: `ขายด่วน ${a.name.th}${n > 1 ? ` ${n} หน่วย` : ''} ที่ครึ่งราคา ได้เงินสด ${money(proceeds)}`,
      en: `Fire-sold ${a.name.en}${n > 1 ? ` ×${n}` : ''} at half price for ${money(proceeds)}.`,
    },
    'bad',
  );
  checkEscape(s);
  checkTrouble(s);
}

/* --------------------------------------------------------------- outcomes */

export function checkTrouble(s: GameState): void {
  // Only the wheel can bankrupt you. On the fast track a bad card can push cash
  // below zero, but the next income tile always refills it and every purchase
  // already checks the balance, so there is nothing to rescue.
  if (s.phase !== 'rat') return;
  if (s.cash >= 0) {
    if (s.pending?.kind === 'rescue') s.pending = null;
    return;
  }
  if (!s.friendHelpUsed && s.karma >= FRIEND_HELP_KARMA) {
    s.pending = { kind: 'friend' };
    return;
  }
  const canFireSale = s.assets.length > 0;
  const canBorrowMore = maxBorrow(s) >= LOAN_STEP;
  if (!canFireSale && !canBorrowMore) {
    s.phase = 'lost';
    s.pending = null;
    note(
      s,
      {
        th: 'เงินสดติดลบ ไม่มีสินทรัพย์ให้ขายและกู้เพิ่มไม่ได้แล้ว จบเกมด้วยการล้มละลาย',
        en: 'Cash is negative, nothing left to sell and no more credit. The game ends in bankruptcy.',
      },
      'bad',
    );
    return;
  }
  s.pending = { kind: 'rescue' };
}

/**
 * Crossing the line no longer quits the job for the player: it offers the
 * choice. Plenty of people keep the salary a while longer to build a buffer,
 * and the decision is the most interesting moment in the game.
 */
export function acceptFriendHelp(s: GameState): void {
  if (s.pending?.kind !== 'friend') return;
  s.friendHelpUsed = true;
  s.karma -= FRIEND_HELP_KARMA;
  s.cash += FRIEND_HELP_AMOUNT;
  s.pending = null;
  note(
    s,
    {
      th: `เพื่อนที่คุณเคยช่วยไว้โอนมาให้ ${money(FRIEND_HELP_AMOUNT)} ไม่คิดดอกเบี้ย ไม่มีกำหนดคืน`,
      en: `A friend you once helped sends ${money(FRIEND_HELP_AMOUNT)}, no interest and no deadline.`,
    },
    'good',
  );
  checkTrouble(s);
}

export function checkEscape(s: GameState): void {
  if (s.phase !== 'rat' || s.pending !== null) return;
  if (canQuit(s)) s.pending = { kind: 'quit' };
}

export function quitJob(s: GameState): void {
  if (!canQuit(s)) return;
  const passive = passiveIncome(s);
  s.quit = true;
  s.phase = 'fast';
  s.escapeIncome = passive;
  const bonus = passive * ESCAPE_MULTIPLE;
  s.cash += bonus;
  s.fastPos = 0;
  s.pending = null;
  note(
    s,
    {
      th: `ลาออกจากงานประจำแล้ว ไม่มีเงินเดือนอีกต่อไป อยู่ด้วยเงินไหลเข้าเดือนละ ${money(passive)} รับเงินก้อนตั้งต้น ${money(bonus)}`,
      en: `You quit. No salary from here, just ${money(passive)} a month of passive income, plus ${money(bonus)} to start with.`,
    },
    'good',
  );
  checkTier(s);
}

export function stayEmployed(s: GameState): void {
  if (s.pending?.kind !== 'quit') return;
  s.pending = null;
  note(
    s,
    { th: 'ยังไม่ลาออก เก็บเงินเดือนไว้สะสมกันชนก่อน', en: 'Not yet: the salary stays while the buffer grows.' },
    'plain',
  );
}

/** Promote the player if they have earned a new tier, and say so. */
export function checkTier(s: GameState): void {
  const now = tierOf(s);
  if (now <= s.tier) return;
  s.tier = now;
  if (s.pending === null) s.pending = { kind: 'tierUp', tier: now };
  const name = TIER_NAMES[now - 1];
  if (name) {
    note(s, { th: `เลื่อนขั้นเป็น "${name.th}"`, en: `New tier reached: "${name.en}"` }, 'good');
  }
}

/** The player decides the run is over; nothing else ends it but bankruptcy. */
export function callItADay(s: GameState): void {
  if (s.phase !== 'rat' && s.phase !== 'fast') return;
  s.phase = 'won';
  s.endedByChoice = true;
  s.pending = null;
}

export function checkWin(s: GameState): void {
  checkTier(s);
}

/* ------------------------------------------------------------ save / load */

function isDebt(v: unknown): v is Debt {
  if (typeof v !== 'object' || v === null) return false;
  const d = v as Record<string, unknown>;
  return typeof d.key === 'string' && typeof d.balance === 'number' && typeof d.payment === 'number';
}

function isAsset(v: unknown): v is Asset {
  if (typeof v !== 'object' || v === null) return false;
  const a = v as Record<string, unknown>;
  return (
    typeof a.uid === 'string' &&
    typeof a.cardId === 'string' &&
    typeof a.qty === 'number' &&
    typeof a.costPerUnit === 'number' &&
    typeof a.pricePerUnit === 'number' &&
    typeof a.debt === 'number' &&
    typeof a.cashflowPerUnit === 'number'
  );
}

export function parseSave(raw: string): GameState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const s = parsed as Record<string, unknown>;
  if (s.version !== SAVE_VERSION) return null;
  if (typeof s.professionId !== 'string' || !professionById.has(s.professionId)) return null;
  if (typeof s.dreamId !== 'string' || !dreamById.has(s.dreamId)) return null;
  if (typeof s.cash !== 'number' || typeof s.pos !== 'number' || typeof s.turn !== 'number') return null;
  if (!Array.isArray(s.assets) || !s.assets.every(isAsset)) return null;
  if (!Array.isArray(s.debts) || !s.debts.every(isDebt)) return null;
  if (!Array.isArray(s.log)) return null;

  const game = parsed as GameState;
  // Fields added after saves were already out in the wild get defaulted rather
  // than thrown away, so a game in progress survives a deploy. A missing
  // `walking` used to read as undefined and left `canRoll` false forever, i.e.
  // a board nobody could roll on again.
  if (!Number.isFinite(game.walking)) game.walking = 0;
  if (typeof game.quit !== 'boolean') game.quit = game.phase === 'fast' || game.phase === 'won';
  if (!Number.isFinite(game.karma)) game.karma = 0;
  if (typeof game.friendHelpUsed !== 'boolean') game.friendHelpUsed = false;
  if (typeof game.endedByChoice !== 'boolean') game.endedByChoice = false;
  for (const d of game.debts) {
    if (!Number.isFinite(d.rate)) d.rate = DEBT_RATE[d.key] ?? 0;
    if (d.key === 'bank') d.interestOnly = true;
  }
  for (const a of game.assets) if (!Number.isFinite(a.mortgagePay)) a.mortgagePay = 0;
  if (!Number.isFinite(game.tier)) game.tier = tierOf(game);
  if (!Number.isFinite(game.escapeIncome)) game.escapeIncome = 0;
  if (!Number.isFinite(game.charityTurns)) game.charityTurns = 0;
  if (!Number.isFinite(game.skipTurns)) game.skipTurns = 0;
  if (!Array.isArray(game.lastRoll)) game.lastRoll = [];
  if (typeof game.prices !== 'object' || game.prices === null) game.prices = {};
  return game;
}
