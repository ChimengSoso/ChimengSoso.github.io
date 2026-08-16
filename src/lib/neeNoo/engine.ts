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
  dreams,
  fastById,
  fastCards,
  childStages,
  marketById,
  marketCards,
  professionById,
  professions,
  studyRouteById,
  studyRoutes,
} from '../../data/neeNoo';
import type {
  Asset,
  DealCard,
  DealSize,
  Decks,
  Debt,
  DebtKey,
  DoodadCard,
  Dream,
  FastCard,
  GameState,
  LicencePlan,
  Loc,
  MarketCard,
  Profession,
  StudyRoute,
} from './types';

export const SAVE_VERSION = 1;
/** monthly payment on the emergency bank loan, as a share of the amount drawn */
export const LOAN_RATE = 0.1;
export const LOAN_STEP = 10000;
/**
 * The bank stops lending past this many months of expenses. Real underwriting
 * asks whether the borrower can service the debt, so the ceiling follows the
 * bills rather than the payslip: at three months of expenses the payment lands
 * near 30% of them, which every profession's cash flow can still carry. The
 * old ceiling of twenty months of salary was a button that guaranteed
 * bankruptcy, and in testing it was the cause of every single loss.
 */
export const LOAN_EXPENSE_CAP = 3;
/** fire-sale price, as a share of the sticker price */
export const FIRE_SALE_RATE = 0.5;
/** fast-track cash granted at the escape, as a multiple of monthly passive income */
export const ESCAPE_MULTIPLE = 100;
/**
 * Extra monthly income needed to reach the professional-investor tier, as a
 * multiple of whatever the player was earning the day they quit. A flat figure
 * meant the office worker had to build eighteen times their escape income while
 * the pilot needed under three, so the fast track scales like everything else.
 */
export const FAST_GOAL_MULTIPLE = 8;
export const MAX_CHILDREN = 3;
/** months a sponsored licence is worked off for, and the cut taken meanwhile */
export const BOND_MONTHS = 36;
export const BOND_CUT = 0.25;
/** monthly interest on the debt a profession starts with, and on asset mortgages */
export const DEBT_RATE: Record<DebtKey, number> = {
  home: 0.0035,
  car: 0.005,
  card: 0.015,
  retail: 0.01,
  student: 0.002,
  /** 2% a month, around 24% a year: an unsecured personal loan, not a mortgage */
  bank: 0.02,
};
export const MORTGAGE_RATE = 0.0035;
/** generosity needed before a friend will step in during a cash crisis */
export const FRIEND_HELP_KARMA = 3;
export const FRIEND_HELP_AMOUNT = 150000;
/** total monthly passive income for the top tier, as a multiple of the escape level */
export const TIER6_MULTIPLE = 25;

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

/**
 * A birthday present for children you do not have is not a small bill, it is a
 * card that should never have been dealt. Cards priced per child are held back
 * until there is at least one, and come back into the deck the moment there is.
 */
function drawDoodad(s: GameState): string {
  const pool = doodads.filter((c) => !c.perChild || s.children > 0).map((c) => c.id);
  const allowed = new Set(pool);
  s.decks.doodad = s.decks.doodad.filter((id) => allowed.has(id));
  return draw(s, s.decks.doodad, pool);
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
  if (noMoreSalary(s)) return 0;
  // A full-time course means no wage at all while it runs.
  if (s.study && studyRouteById.get(s.study.routeId)?.fullTime) return 0;
  let base = profession(s).salary * payLevel(s) * s.entryPay;
  if (s.bondMonths > 0) base *= 1 - BOND_CUT;
  if (s.slumpMonths > 0) base *= 1 - s.slumpCut;
  return Math.round(base);
}

export function totalIncome(s: GameState): number {
  return salary(s) + pensionIncome(s) + passiveIncome(s);
}

/** Tuition due each month the enrolment is running, averaged over its terms. */
export function tuitionMonthly(s: GameState): number {
  if (!s.study || s.study.termsLeft <= 0) return 0;
  return Math.round(s.study.perTerm / s.study.termEvery);
}

/** Everything owed each month across the balance sheet, mortgages included. */
export function mortgagePayments(s: GameState): number {
  return s.assets.reduce((sum, a) => sum + a.mortgagePay * (a.debt > 0 ? 1 : 0), 0);
}

/** Extra monthly income the fast track is asking this player to build. */
export function fastGoal(s: GameState): number {
  return Math.round((s.escapeIncome * FAST_GOAL_MULTIPLE) / 1000) * 1000;
}

/** Which tier the player has earned right now, 1..6. */
export function tierOf(s: GameState): number {
  const passive = passiveIncome(s);
  if (s.dreamsOwned.length > 0 && passive >= s.escapeIncome * TIER6_MULTIPLE) return 6;
  if (s.quit && passive - s.escapeIncome >= fastGoal(s)) return 5;
  if (s.quit && s.debts.length === 0 && s.assets.every((a) => a.debt <= 0) && netWorth(s) > 0) return 4;
  if (s.quit) return 3;
  if (s.assets.some((a) => a.cashflowPerUnit > 0)) return 2;
  return 1;
}

/**
 * True once passive income covers the bills, i.e. the job is optional.
 *
 * Not while out of work, though. There is no job to resign from during those
 * months, and the salary is already zero, so quitting then would cost nothing
 * and still pay the escape bonus: the layoff would become the cheapest possible
 * moment to leave, which is the opposite of what the card is for. The offer
 * comes back by itself on the first turn back at work.
 */
export function canQuit(s: GameState): boolean {
  return !s.quit && s.skipTurns === 0 && passiveIncome(s) >= totalExpenses(s);
}

/* -------------------------------------------------------------- the clock */

/**
 * Thailand's long-run average since 1977 is 3.71% a year, and the last two
 * years were near zero. 3% sits between the two and is high enough to be felt
 * across a game without being a number nobody would recognise.
 */
export const INFLATION = 0.03;
/**
 * Rents chase inflation but never quite catch it: a lease is fixed until it is
 * renewed, and a tenant who is asked for the whole increase leaves.
 */
export const RENT_FOLLOW = 0.7;

export function yearsElapsed(s: GameState): number {
  return Math.floor(s.months / 12);
}

/** Everything a household buys, indexed to the year the game has reached. */
export function priceLevel(s: GameState): number {
  return Math.pow(1 + INFLATION, yearsElapsed(s));
}

/** Pay rises compound too, and for most jobs they lose the race on purpose. */
export function payLevel(s: GameState): number {
  return Math.pow(1 + profession(s).raise, yearsElapsed(s));
}

export function livingCost(s: GameState): number {
  return Math.round(profession(s).otherExpenses * priceLevel(s));
}

export function ageMonths(s: GameState): number {
  return profession(s).startAge * 12 + s.months;
}

export function ageYears(s: GameState): number {
  return Math.floor(ageMonths(s) / 12);
}

/** Months of salary left before the job ends by age. Infinite for self-employment. */
export function monthsToRetire(s: GameState): number {
  const p = profession(s);
  if (p.retireAge <= 0) return Number.POSITIVE_INFINITY;
  return Math.max(0, p.retireAge * 12 - ageMonths(s));
}

export function retiredByAge(s: GameState): boolean {
  return monthsToRetire(s) <= 0;
}

/** No salary from here: the age came, or the career ended some other way. */
export function noMoreSalary(s: GameState): boolean {
  return s.quit || s.careerOver || retiredByAge(s);
}

/**
 * What the state pays once the salary stops, and the three answers are not
 * close to each other. A civil servant collects a share of their own salary. An
 * employee collects a share of a ฿15,000 ceiling no matter what they earned, so
 * the bigger the salary the more brutal the drop. Someone who worked for
 * themselves collects the old-age allowance that every Thai over 60 receives.
 */
export function pensionIncome(s: GameState): number {
  if (!noMoreSalary(s) || s.quit) return 0;
  const p = profession(s);
  // Nothing pays out early. Social security's old-age benefit starts at 55, the
  // civil pension and the old-age allowance at 60, so a career that ended at 43
  // means twelve years of paying the bills out of whatever you built.
  const claimAge = p.pension === 'sso' ? 55 : 60;
  if (ageYears(s) < claimAge) return 0;
  const finalSalary = Math.round(p.salary * payLevel(s));
  // Career length assumes the player started work at 22, which is what the
  // contribution-year part of both formulas is counting.
  const served = Math.max(0, ageYears(s) - 22);
  if (p.pension === 'civil') {
    // อายุราชการ × เงินเดือนเฉลี่ย ÷ 50, capped at 70% of that salary.
    return Math.round(Math.min(finalSalary * 0.7, (finalSalary * served) / 50));
  }
  if (p.pension === 'sso') {
    // 20% of the capped wage base at 15 years, plus 1.5% for every year beyond.
    const rate = 0.2 + 0.015 * Math.max(0, served - 15);
    return Math.round(Math.min(15000, finalSalary) * rate);
  }
  // The old-age allowance, which is all a self-employed player ever gets.
  return ageYears(s) >= 60 ? 600 : 0;
}

/* ------------------------------------------------------------------ family */

/**
 * A child costs what its age costs. The tiers come from the real shape of the
 * bill: milk and nappies, then kindergarten fees, then school, then tutoring.
 */
export function childStage(s: GameState, bornMonth: number): { years: number; scale: number; label: Loc } {
  const years = Math.max(0, Math.floor((s.months - bornMonth) / 12));
  let stage = childStages[0];
  for (const t of childStages) if (years >= t.fromAge) stage = t;
  return { years, scale: stage.scale, label: stage.label };
}

export function childExpense(s: GameState): number {
  const per = profession(s).childCost * priceLevel(s);
  return Math.round(s.childBorn.reduce((sum, born) => sum + per * childStage(s, born).scale, 0));
}

/**
 * Income tax follows the income. Once the salary is gone there is no payslip to
 * tax, so the line is recomputed at the same effective rate against what is
 * actually coming in. It shrinks at the moment of quitting and grows again as
 * the portfolio does, which is what makes the fast track breathable.
 */
export function taxes(s: GameState): number {
  const p = profession(s);
  if (!s.quit) return Math.round(p.taxes * payLevel(s) * (salary(s) > 0 ? 1 : 0));
  // Inside a company the rate is flat and only the half taken out as salary or
  // dividend is taxed personally; the rest is left to compound in the company.
  if (s.incorporated) return Math.round(passiveIncome(s) * CORP_TAX_RATE * 0.5);
  const rate = p.salary > 0 ? p.taxes / p.salary : 0;
  return Math.round(passiveIncome(s) * rate);
}

export function debtPayments(s: GameState): number {
  return s.debts.reduce((sum, d) => sum + d.payment, 0);
}

/**
 * Debt riding on the balance sheet rather than sitting in the liabilities list.
 * A leveraged condo hides ฿1.1M inside its own row, so a player with six of
 * them could read "liabilities" as a number that left out almost everything
 * they actually owe.
 */
export function assetDebt(s: GameState): number {
  return s.assets.reduce((sum, a) => sum + a.debt, 0);
}

export function personalDebt(s: GameState): number {
  return s.debts.reduce((sum, d) => sum + d.balance, 0);
}

export function totalDebt(s: GameState): number {
  return personalDebt(s) + assetDebt(s);
}

/** Everything leaving the account each month to service debt, both kinds. */
export function totalDebtService(s: GameState): number {
  return debtPayments(s) + mortgagePayments(s);
}

export function totalExpenses(s: GameState): number {
  return (
    taxes(s) +
    livingCost(s) +
    childExpense(s) +
    tuitionMonthly(s) +
    debtPayments(s) +
    (s.incorporated ? CORP_MONTHLY_COST : 0) +
    insurancePremium(s)
  );
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
  // Measured against the bills the loan is not part of, so drawing on it never
  // raises the player's own credit limit.
  const base = totalExpenses(s) - (s.debts.find((d) => d.key === 'bank')?.payment ?? 0);
  return Math.round((base * LOAN_EXPENSE_CAP) / LOAN_STEP) * LOAN_STEP;
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
  const goal = fastGoal(s);
  return goal <= 0 ? 1 : Math.min(1, fastAdded(s) / goal);
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
    quitOffered: false,
    tier: 1,
    karma: 0,
    donated: 0,
    incorporated: false,
    insuranceCover: 0,
    impact: 0,
    friendHelpUsed: false,
    endedByChoice: false,
    prices,
    pos: 0,
    fastPos: 0,
    turn: 1,
    months: 0,
    childBorn: [],
    study: null,
    careerOver: false,
    bondMonths: 0,
    slumpMonths: 0,
    slumpCut: 0,
    entryPay: 1,
    skipTurns: 0,
    charityTurns: 0,
    escapeIncome: 0,
    dreamsOwned: [],
    lastRoll: [],
    walking: 0,
    pending: null,
    decks: { small: [], big: [], market: [], doodad: [], fastDeal: [], fastMega: [], fastBonus: [], fastSetback: [] },
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

export const dealIdsOfSize = (size: DealSize): string[] =>
  deals.filter((d) => d.size === size).map((d) => d.id);

function refillAll(s: GameState): void {
  s.decks.small = shuffled(s, dealIdsOfSize('small'));
  s.decks.big = shuffled(s, dealIdsOfSize('big'));
  s.decks.market = shuffled(s, marketCards.map((c) => c.id));
  s.decks.doodad = shuffled(s, doodads.map((c) => c.id));
  s.decks.fastDeal = shuffled(s, dealIdsOfSize('fast'));
  s.decks.fastMega = shuffled(s, dealIdsOfSize('mega'));
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
    monthPassed(s);
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
      s.pending = { kind: 'doodad', cardId: drawDoodad(s) };
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
 * rest of the payment eats into the principal, so every debt really does shrink
 * and eventually vanish. The emergency loan hurts through the size of its
 * payment rather than by never ending: a tenth of the amount drawn, every
 * month, until it is gone.
 */
export function amortize(s: GameState): void {
  for (const d of s.debts) {
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

/* ---------------------------------------------------------- going back to school */

/** Jobs a route can actually lead to, current one excluded. */
export function routeTargets(s: GameState, route: StudyRoute): Profession[] {
  return professions.filter(
    (p) => p.id !== s.professionId && (route.opensLicensed || !p.licensed) && (route.id !== 'pilot' || p.id === 'pilot'),
  );
}

export function canEnrol(s: GameState, route: StudyRoute): boolean {
  if (s.study || s.quit) return false;
  // The first term is due on enrolment, so it has to be affordable today.
  return s.cash >= Math.round(route.tuition / route.terms) && routeTargets(s, route).length > 0;
}

export function enrol(s: GameState, routeId: string, targetId: string): void {
  const route = studyRouteById.get(routeId);
  if (!route || s.study || !professionById.has(targetId)) return;
  const perTerm = Math.round(route.tuition / route.terms);
  if (s.cash < perTerm) return;
  s.cash -= perTerm;
  s.study = {
    routeId,
    targetId,
    monthsLeft: route.months,
    termsLeft: route.terms - 1,
    perTerm,
    termEvery: Math.max(1, Math.round(route.months / route.terms)),
    sinceTerm: 0,
    totalMonths: route.months,
  };
  // A full-time course takes the player off the board as well as off the payroll.
  if (route.fullTime) s.skipTurns = route.months;
  s.pending = null;
  note(
    s,
    {
      th: `สมัครเรียน ${route.title.th} จ่ายเทอมแรก ${money(perTerm)} เหลืออีก ${route.terms - 1} เทอม ใช้เวลา ${route.months} เดือน${route.fullTime ? ' และไม่มีเงินเดือนเข้าเลยตลอดหลักสูตร' : ' โดยยังทำงานประจำไปด้วยได้'}`,
      en: `Enrolled in ${route.title.en}: ${money(perTerm)} for the first term, ${route.terms - 1} to go, ${route.months} months of it${route.fullTime ? ', and no salary for any of them' : ', with the day job carrying on'}.`,
    },
    'plain',
  );
  checkTrouble(s);
}

/** Years finished so far, for the "year 2 of 4" line under the board. */
export function studyYear(s: GameState): { done: number; total: number } {
  if (!s.study) return { done: 0, total: 0 };
  const passed = s.study.totalMonths - s.study.monthsLeft;
  return { done: Math.floor(passed / 12) + 1, total: Math.ceil(s.study.totalMonths / 12) };
}

/**
 * One month of an enrolment. Tuition falls when a term does, not smoothly and
 * not all at the start, which is how a real bill arrives.
 */
function advanceStudy(s: GameState): void {
  const st = s.study;
  if (!st) return;
  st.monthsLeft -= 1;
  st.sinceTerm += 1;
  if (st.sinceTerm >= st.termEvery && st.termsLeft > 0) {
    st.sinceTerm = 0;
    st.termsLeft -= 1;
    s.cash -= st.perTerm;
    note(
      s,
      {
        th: `ถึงกำหนดค่าเทอม จ่ายไป ${money(st.perTerm)} เหลืออีก ${st.termsLeft} เทอม`,
        en: `A term fell due: ${money(st.perTerm)} paid, ${st.termsLeft} to go.`,
      },
      'bad',
    );
  }
  if (st.monthsLeft > 0) return;

  const route = studyRouteById.get(st.routeId);
  s.study = null;
  if (!route) return;
  if (route.licenceFee > 0) {
    s.pending = { kind: 'licence', routeId: route.id, targetId: st.targetId };
    return;
  }
  switchCareer(s, st.targetId, route);
}

/** Walk into the new job. The wage starts below what the veterans there earn. */
export function switchCareer(s: GameState, targetId: string, route: StudyRoute): void {
  const next = professionById.get(targetId);
  if (!next) return;
  const before = profession(s).name.th;
  s.professionId = targetId;
  s.careerOver = false;
  s.skipTurns = 0;
  // Entry pay is modelled as a permanent haircut against this profession's
  // normal salary, which is what starting over actually feels like.
  s.entryPay = route.entrySalary;
  note(
    s,
    {
      th: `เรียนจบแล้ว เปลี่ยนจาก${before}มาเป็น${next.name.th} เริ่มที่ ${Math.round(route.entrySalary * 100)}% ของเงินเดือนสายนี้ เพราะคุณคือคนใหม่ของที่นี่`,
      en: `Graduated and moved from ${before} to ${next.name.en}, starting at ${Math.round(route.entrySalary * 100)}% of what this job normally pays, because here you are the new one.`,
    },
    'good',
  );
  checkEscape(s);
  checkTrouble(s);
}

/** Settle the licence fee, three ways, each expensive in its own currency. */
export function payLicence(s: GameState, plan: LicencePlan): void {
  if (s.pending?.kind !== 'licence') return;
  const { routeId, targetId } = s.pending;
  const route = studyRouteById.get(routeId);
  if (!route) return;
  const fee = route.licenceFee;
  if (plan === 'cash') {
    if (s.cash < fee) return;
    s.cash -= fee;
    note(s, { th: `จ่ายค่าใบอนุญาต ${money(fee)} ด้วยเงินที่เก็บมาเอง ไม่ติดหนี้ใคร`, en: `Paid the ${money(fee)} licence fee out of savings, owing nobody.` }, 'plain');
  } else if (plan === 'loan') {
    addDebt(s, 'bank', fee, Math.round(fee * LOAN_RATE));
    note(s, { th: `กู้ ${money(fee)} มาจ่ายค่าใบอนุญาต ผ่อนเดือนละ ${money(Math.round(fee * LOAN_RATE))} เริ่มงานใหม่พร้อมหนี้ก้อนใหม่`, en: `Borrowed ${money(fee)} for the licence at ${money(Math.round(fee * LOAN_RATE))} a month: a new job and a new debt on the same day.` }, 'bad');
  } else {
    // The employer pays and buys years of your life at a below-market wage.
    s.bondMonths = BOND_MONTHS;
    note(s, { th: `รับทุนจากสายการบิน ไม่ต้องจ่ายค่าใบอนุญาตเอง แลกกับสัญญาผูกมัด ${BOND_MONTHS} เดือน ระหว่างนั้นเงินเดือนถูกหักไว้ ${Math.round(BOND_CUT * 100)}%`, en: `The airline paid the licence in exchange for a ${BOND_MONTHS}-month bond, during which ${Math.round(BOND_CUT * 100)}% of the salary is held back.` }, 'plain');
  }
  s.pending = null;
  switchCareer(s, targetId, route);
}

/* --------------------------------------------------- one month of calendar */

/**
 * Everything that happens because a month went by rather than because the
 * player did something. Both paydays and the jobless months go through here, so
 * the calendar advances at one rate no matter what the player is doing.
 */
function monthPassed(s: GameState): void {
  s.months += 1;
  if (s.bondMonths > 0) s.bondMonths -= 1;
  if (s.slumpMonths > 0) s.slumpMonths -= 1;
  advanceStudy(s);
  // Rents are renegotiated once a year and recover only part of what inflation
  // took. Fixed-rate loan payments are not touched at all, which is the quiet
  // gift inflation hands to anyone holding long debt.
  if (s.months % 12 === 0) {
    const step = 1 + INFLATION * RENT_FOLLOW;
    let moved = 0;
    for (const a of s.assets) {
      if (a.kind !== 'property' && a.kind !== 'business') continue;
      if (a.cashflowPerUnit === 0) continue;
      const before = a.cashflowPerUnit;
      a.cashflowPerUnit *= step;
      if (a.baseCashflow !== undefined) a.baseCashflow *= step;
      moved += (a.cashflowPerUnit - before) * a.qty;
    }
    note(
      s,
      {
        th: `ผ่านไปอีกหนึ่งปี ค่าครองชีพขึ้น ${Math.round(INFLATION * 100)}% ค่าเช่าขึ้นตามไม่ทัน ${moved > 0 ? `+${money(moved)} ต่อเดือน` : 'ยังไม่มีค่าเช่าให้ขึ้น'} ส่วนค่างวดหนี้เท่าเดิมทุกบาท`,
        en: `Another year gone. Living costs rose ${Math.round(INFLATION * 100)}%, rents followed only part of the way (${moved > 0 ? `+${money(moved)} a month` : 'no rent to raise yet'}), and the loan payments did not move at all.`,
      },
      'plain',
    );
  }
  checkRetirement(s);
}

/**
 * The salary ends on a birthday, and the game does not end with it. Whoever
 * built enough income by then keeps playing on it; whoever did not now watches
 * the pension they actually qualify for try to cover a life it was never sized
 * for. This is the question the whole game has been asking.
 */
export function checkRetirement(s: GameState): void {
  if (s.quit || s.careerOver || !retiredByAge(s)) return;
  s.careerOver = true;
  s.pending = { kind: 'retired' };
  note(
    s,
    {
      th: `อายุครบ ${profession(s).retireAge} ปี เกษียณแล้ว ไม่มีเงินเดือนอีกต่อไป เหลือบำนาญเดือนละ ${money(pensionIncome(s))} กับเงินไหลเข้าที่คุณสร้างไว้เอง ${money(passiveIncome(s))}`,
      en: `You turned ${profession(s).retireAge} and the salary stopped. What is left is a pension of ${money(pensionIncome(s))} a month and the ${money(passiveIncome(s))} you built yourself.`,
    },
    'bad',
  );
}

function payday(s: GameState): void {
  const cf = monthlyCashflow(s);
  s.cash += cf;
  monthPassed(s);
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
  checkTier(s);
}

function fastPayday(s: GameState): void {
  // No salary out here, but the bills did not stop, so a fast-track month is
  // passive income minus expenses just like any other month.
  const cf = monthlyCashflow(s);
  s.cash += cf;
  monthPassed(s);
  note(
    s,
    {
      th: `เงินไหลเข้า ${money(passiveIncome(s))} หักรายจ่าย ${money(totalExpenses(s))} เหลือ ${cf >= 0 ? '+' : ''}${money(cf)}`,
      en: `${money(passiveIncome(s))} in, ${money(totalExpenses(s))} of expenses, leaving ${cf >= 0 ? '+' : ''}${money(cf)}`,
    },
    cf >= 0 ? 'good' : 'bad',
  );
  amortize(s);
  driftBusinesses(s);
  checkTier(s);
}

function landFast(s: GameState): void {
  const tile = FAST_BOARD[s.fastPos];
  switch (tile) {
    case 'fastpay':
      fastPayday(s);
      break;
    case 'fastdeal':
      s.pending = { kind: 'fastChoice' };
      break;
    case 'fastmarket':
      s.pending = { kind: 'market', cardId: draw(s, s.decks.market, marketCards.map((c) => c.id)) };
      applyMarketPrice(s);
      break;
    case 'bonus':
      s.pending = { kind: 'fastbonus', cardId: draw(s, s.decks.fastBonus, fastCards.filter((c) => c.type === 'bonus').map((c) => c.id)) };
      break;
    case 'setback':
      s.pending = { kind: 'fastsetback', cardId: draw(s, s.decks.fastSetback, fastCards.filter((c) => c.type === 'setback').map((c) => c.id)) };
      break;
    case 'dream':
      // Nothing left to buy for yourself: the tile starts asking the other
      // question instead.
      if (dreamsDone(s)) {
        s.pending = { kind: 'legacy' };
      } else if (s.dreamsOwned.includes(s.dreamId)) {
        s.pending = { kind: 'dreamPick' };
      } else {
        s.pending = { kind: 'dream' };
      }
      break;
    default:
      break;
  }
}

/* --------------------------------------------------------------- rat tiles */

export function chooseDeal(s: GameState, size: DealSize): void {
  if (s.pending?.kind !== 'dealChoice' && s.pending?.kind !== 'fastChoice') return;
  const deck =
    size === 'small' ? s.decks.small
    : size === 'big' ? s.decks.big
    : size === 'fast' ? s.decks.fastDeal
    : s.decks.fastMega;
  s.pending = { kind: 'deal', cardId: draw(s, deck, dealIdsOfSize(size)) };
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
    if (card.volatility !== undefined) {
      asset.volatility = card.volatility;
      asset.baseCashflow = card.cashflow;
    }
    if (card.impact !== undefined) asset.impact = card.impact * n;
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
  checkTier(s);
}

export function passDeal(s: GameState): void {
  if (s.pending?.kind !== 'deal' && s.pending?.kind !== 'dealChoice' && s.pending?.kind !== 'fastChoice') return;
  s.pending = null;
}

/* ------------------------------------------------------- living businesses */

/** Ceiling and floor on how far a volatile holding can drift from where it started. */
export const SWING_MAX = 3;
/** Sale price of a business sold privately, as a multiple of its monthly profit. */
export const BIZ_EXIT_MULTIPLE = 18;

/**
 * A month in the life of the businesses that do not sit still. Most months
 * nothing happens; some months the number moves; occasionally one folds. The
 * point is that a business is a living thing with a story, not a bond coupon,
 * so the player has a reason to look at the portfolio and decide what to keep.
 */
export function driftBusinesses(s: GameState): void {
  for (const a of s.assets) {
    if (!a.volatility || a.qty <= 0) continue;
    const roll = rand(s);
    const base = a.baseCashflow ?? a.cashflowPerUnit;
    if (base === 0) continue;

    // A high-volatility venture can fail outright; a steady one never does.
    if (a.volatility >= 0.25 && roll < 0.04 && a.cashflowPerUnit !== 0) {
      a.cashflowPerUnit = 0;
      note(
        s,
        {
          th: `${a.name.th} ไปต่อไม่ไหว ปิดกิจการแล้ว รายได้จากตัวนี้เหลือศูนย์ ขายซากได้จากหน้างบ`,
          en: `${a.name.th} could not carry on and has shut down. Its income is now zero; what is left can be sold from the statement.`,
        },
        'bad',
      );
      continue;
    }
    if (roll > 0.45) continue;

    const up = roll < 0.245;
    // A venture bought underwater steps by a fixed slice of its own size. A
    // multiplicative step cannot work there: multiplying a loss by 1.35 deepens
    // it at the exact moment the business is supposed to be recovering. Such a
    // business may climb all the way into profit, which is the only reason to
    // buy one, and may sink twice as deep first.
    const reach = Math.abs(base) * SWING_MAX;
    const next = base < 0
      ? a.cashflowPerUnit + (up ? 1 : -1) * Math.abs(base) * a.volatility
      : a.cashflowPerUnit * (up ? 1 + a.volatility : 1 - a.volatility);
    const capped = Math.max(base < 0 ? -reach : 0, Math.min(reach, next));
    if (Math.round(capped) === Math.round(a.cashflowPerUnit)) continue;
    const delta = (capped - a.cashflowPerUnit) * a.qty;
    a.cashflowPerUnit = capped;
    note(
      s,
      {
        th: `${a.name.th} ${up ? 'โตขึ้น' : 'แผ่วลง'} เงินไหลเข้าจากตัวนี้ ${delta >= 0 ? '+' : ''}${money(delta)} ต่อเดือน`,
        en: `${a.name.en} ${up ? 'grew' : 'softened'}: ${delta >= 0 ? '+' : ''}${money(delta)} a month from it now.`,
      },
      up ? 'good' : 'bad',
    );
  }
}

/** A business can always be sold privately, at a worse price than a real buyer pays. */
export function canSellBusiness(a: Asset): boolean {
  return a.kind === 'business';
}

export function businessExitValue(a: Asset): number {
  return Math.max(0, Math.round(assetCashflow(a) * BIZ_EXIT_MULTIPLE - a.debt));
}

export function sellBusiness(s: GameState, assetUid: string): void {
  const a = s.assets.find((x) => x.uid === assetUid);
  if (!a || !canSellBusiness(a)) return;
  const proceeds = businessExitValue(a);
  const gain = proceeds - a.costPerUnit * a.qty;
  s.cash += proceeds;
  s.assets = s.assets.filter((x) => x.uid !== a.uid);
  note(
    s,
    {
      th: proceeds > 0
        ? `ขาย ${a.name.th} ให้ผู้ซื้อรายย่อยที่ ${BIZ_EXIT_MULTIPLE} เท่าของกำไรต่อเดือน ได้ ${money(proceeds)} (${gain >= 0 ? 'กำไร' : 'ขาดทุน'} ${money(Math.abs(gain))})`
        : `ปิด ${a.name.th} ทิ้ง ไม่เหลือมูลค่าให้ขาย ขาดทุนเต็มจำนวน ${money(Math.abs(gain))}`,
      en: proceeds > 0
        ? `Sold ${a.name.en} privately at ${BIZ_EXIT_MULTIPLE}x monthly profit for ${money(proceeds)} (${gain >= 0 ? 'gain' : 'loss'} ${money(Math.abs(gain))}).`
        : `Closed ${a.name.en} down with nothing left to sell, for a full loss of ${money(Math.abs(gain))}.`,
    },
    gain >= 0 ? 'good' : 'bad',
  );
  checkEscape(s);
  checkTrouble(s);
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

/**
 * Traded paper can be sold on any turn at the going price, without waiting for
 * a buyer to turn up on a market tile. Shares and gold really are liquid, and
 * the old rule turned gold into a trap: no income while held, and no way out
 * until its one price card happened to be drawn. A building still needs a
 * buyer, which is the difference worth teaching.
 */
export function canSellNow(a: Asset): boolean {
  return (a.kind === 'stock' || a.kind === 'gold') && !!a.symbol;
}

export function livePrice(s: GameState, a: Asset): number {
  return a.symbol ? (s.prices[a.symbol] ?? a.pricePerUnit) : a.pricePerUnit;
}

export function sellPaper(s: GameState, assetUid: string, qty: number): void {
  const a = s.assets.find((x) => x.uid === assetUid);
  if (!a || !canSellNow(a)) return;
  const n = Math.max(1, Math.min(qty, a.qty));
  const unit = livePrice(s, a);
  const proceeds = unit * n;
  const gain = proceeds - a.costPerUnit * n;

  s.cash += proceeds;
  a.qty -= n;
  if (a.qty <= 0) s.assets = s.assets.filter((x) => x.uid !== a.uid);

  note(
    s,
    {
      th: `ขาย ${a.name.th}${n > 1 ? ` ${n} หน่วย` : ''} ที่ราคาตลาด ${money(unit)} ได้เงินสด ${money(proceeds)} (${gain >= 0 ? 'กำไร' : 'ขาดทุน'} ${money(Math.abs(gain))})`,
      en: `Sold ${a.name.en}${n > 1 ? ` ×${n}` : ''} at the market price of ${money(unit)} for ${money(proceeds)} (${gain >= 0 ? 'gain' : 'loss'} ${money(Math.abs(gain))}).`,
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

/**
 * The deal card a traded symbol was introduced by. That card already carries
 * the name, the dividend and the size of a sensible lot, so a purchase made
 * straight off a market card reuses it instead of inventing a second set of
 * numbers. What the player already holds wins the tie, so topping up a position
 * stacks onto it rather than opening a near-identical second row.
 */
export function symbolDeal(s: GameState, symbol: string): DealCard | undefined {
  const held = s.assets.find((a) => a.symbol === symbol);
  const from = held ? dealById.get(held.cardId) : undefined;
  if (from) return from;
  const pool = deals.filter((c) => c.symbol === symbol);
  const outside = s.phase !== 'rat';
  return (
    pool.find((c) => (outside ? c.size === 'fast' || c.size === 'mega' : c.size === 'small' || c.size === 'big')) ??
    pool[0]
  );
}

/**
 * A price card is news, and news cuts both ways: a crash is a discount to
 * anyone holding cash. Offering only the sell button taught the opposite of the
 * intended lesson, so the same card now quotes a price to buy at too. The
 * dividend per unit does not move with the quote, which is the part worth
 * noticing: the same money buys more income while the price is down.
 */
export function marketBuy(s: GameState): { card: DealCard; unit: number; max: number } | null {
  if (s.pending?.kind !== 'market') return null;
  const news = marketById.get(s.pending.cardId);
  if (!news || news.type !== 'price' || news.price <= 0) return null;
  const card = symbolDeal(s, news.symbol);
  if (!card) return null;
  return { card, unit: news.price, max: Math.max(0, Math.min(card.maxQty, Math.floor(s.cash / news.price))) };
}

export function buyFromMarket(s: GameState, qty: number): void {
  const offer = marketBuy(s);
  if (!offer) return;
  const { card, unit } = offer;
  const n = Math.max(0, Math.min(qty, offer.max));
  if (n === 0) return;

  s.cash -= unit * n;
  const existing = s.assets.find((a) => a.cardId === card.id && a.symbol === card.symbol);
  if (existing) {
    const totalCost = existing.costPerUnit * existing.qty + unit * n;
    existing.qty += n;
    existing.costPerUnit = totalCost / existing.qty;
    existing.pricePerUnit = unit;
  } else {
    // Bought with cash on the spot: no bank is lending against a price card.
    const asset: Asset = {
      uid: uid(s, card.id),
      cardId: card.id,
      kind: card.kind,
      name: card.title,
      qty: n,
      costPerUnit: unit,
      pricePerUnit: unit,
      debt: 0,
      mortgagePay: 0,
      cashflowPerUnit: card.cashflow,
    };
    if (card.symbol !== undefined) asset.symbol = card.symbol;
    s.assets.push(asset);
  }

  note(
    s,
    {
      th: `ซื้อ ${card.title.th}${n > 1 ? ` ${n} หน่วย` : ''} ที่ราคาตลาด ${money(unit)} จ่ายเงินสด ${money(unit * n)}${card.cashflow ? ` ได้เงินไหลเข้าเพิ่มเดือนละ ${money(card.cashflow * n)}` : ''}`,
      en: `Bought ${card.title.en}${n > 1 ? ` ×${n}` : ''} at the market price of ${money(unit)} for ${money(unit * n)}${card.cashflow ? `, adding ${money(card.cashflow * n)} a month` : ''}.`,
    },
    'good',
  );
  s.pending = null;
  checkEscape(s);
  checkTrouble(s);
  checkTier(s);
}

export function closeMarket(s: GameState): void {
  if (s.pending?.kind !== 'market') return;
  s.pending = null;
}

export function doodadCost(s: GameState, card: DoodadCard): number {
  const base = Math.round((card.scale * livingCost(s)) / 100) * 100;
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

/**
 * Not everyone wants children, and a game about the cost of a life should not
 * hand anybody a family they did not ask for. Saying no costs nothing and
 * carries no judgement; the tile can come round again later.
 */
export function declineBaby(s: GameState): void {
  if (s.pending?.kind !== 'baby') return;
  note(
    s,
    {
      th: 'ยังไม่ใช่ตอนนี้ ครอบครัวเท่าเดิม รายจ่ายเท่าเดิม',
      en: 'Not now. The family stays the size it is, and so does the monthly bill.',
    },
    'plain',
  );
  s.pending = null;
}

/** What one more child would add to the monthly bill at today's prices. */
export function nextChildCost(s: GameState): number {
  return Math.round(profession(s).childCost * priceLevel(s));
}

export function acceptBaby(s: GameState): void {
  if (s.pending?.kind !== 'baby') return;
  if (s.children >= MAX_CHILDREN) {
    note(s, { th: 'ลูก ๆ โตกันหมดแล้ว รายจ่ายไม่เพิ่ม', en: 'The children are grown; expenses do not change.' });
  } else {
    s.children += 1;
    s.childBorn.push(s.months);
    const per = Math.round(profession(s).childCost * priceLevel(s));
    note(
      s,
      {
        th: `มีลูกเพิ่มหนึ่งคน ตอนนี้รายจ่ายเพิ่มเดือนละ ${money(per)} และจะเพิ่มอีกเมื่อถึงวัยเข้าเรียน`,
        en: `A new child: ${money(per)} more every month for now, and more again once school starts.`,
      },
      'bad',
    );
  }
  s.pending = null;
  checkEscape(s);
}

/** One month of pay, which Thai labour law owes anyone let go after a year. */
export function severance(s: GameState): number {
  return salary(s);
}

/**
 * What being out of work costs this particular career. The shape of the shock
 * is the trade the player made when they picked a job: the biggest salary in
 * the game is the one a doctor can end in an afternoon, and the smallest is the
 * one nothing much ever happens to.
 */
/**
 * The chance this month's check ends the career outright. Medicals get harder
 * to renew with age, so the number the player is quoted grows as they do.
 * Everyone else is on zero: nobody revokes a teacher's licence for turning 50.
 */
export function groundingRisk(s: GameState): number {
  if (profession(s).risk !== 'grounded') return 0;
  return Math.min(0.6, 0.15 + 0.02 * Math.max(0, ageYears(s) - 40));
}

export function careerShock(s: GameState, grounded = false): { months: number; ends: boolean; cut: number; cutMonths: number } {
  switch (profession(s).risk) {
    // A pilot who fails a medical does not get a second opinion and a fortnight
    // off. That licence is how the salary existed, and it is gone. Passing the
    // check is the usual outcome, which is why the job is worth taking at all.
    case 'grounded':
      return grounded
        ? { months: 0, ends: true, cut: 0, cutMonths: 0 }
        : { months: 2, ends: false, cut: 0, cutMonths: 0 };
    case 'layoff':
      return { months: 4, ends: false, cut: 0, cutMonths: 0 };
    // Nobody lays off someone who works for themselves; the takings just fall.
    case 'slump':
      return { months: 0, ends: false, cut: 0.35, cutMonths: 8 };
    case 'steady':
      return { months: 1, ends: false, cut: 0, cutMonths: 0 };
    default:
      return { months: 2, ends: false, cut: 0, cutMonths: 0 };
  }
}

export function acceptDownsized(s: GameState): void {
  if (s.pending?.kind !== 'downsized') return;
  // The bill for being jobless is charged month by month over the two skipped
  // turns (see rollDice), not as one lump here, so the player watches it happen.
  // The severance lands up front, which is exactly how it feels: a cushion that
  // looks generous on the day and is gone before the job comes back.
  const shock = careerShock(s, rand(s) < groundingRisk(s));
  const pay = severance(s);
  s.cash += pay;
  if (shock.ends) {
    s.careerOver = true;
    note(
      s,
      {
        th: `ตรวจร่างกายประจำปีไม่ผ่าน ใบอนุญาตถูกระงับ อาชีพนี้จบลงตรงนี้ ได้ค่าชดเชย ${money(pay)} ก้อนสุดท้าย จากนี้ไม่มีเงินเดือนอีกแล้ว ถ้าจะกลับมามีรายได้ประจำต้องไปเรียนใหม่`,
        en: `You failed the annual medical and the licence is suspended. This career ends here, with ${money(pay)} of final pay and no salary after it. A wage means retraining now.`,
      },
      'bad',
    );
  } else if (shock.cutMonths > 0) {
    s.slumpMonths = shock.cutMonths;
    s.slumpCut = shock.cut;
    note(
      s,
      {
        th: `เศรษฐกิจแถวนี้เงียบไปทั้งย่าน ไม่มีใครเลิกจ้างคุณได้เพราะคุณจ้างตัวเอง แต่รายได้หายไป ${Math.round(shock.cut * 100)}% อีก ${shock.cutMonths} เดือน`,
        en: `The whole street went quiet. Nobody can lay off someone who employs themselves, but takings just fell ${Math.round(shock.cut * 100)}% for ${shock.cutMonths} months.`,
      },
      'bad',
    );
  } else {
    s.skipTurns = shock.months;
    note(
      s,
      {
        th: `ตกงาน ได้ค่าชดเชย ${money(pay)} แต่ไม่มีเงินเดือนเข้าอีก ${shock.months} เดือน ส่วนรายจ่ายยังเดินต่อทุกเดือน`,
        en: `Out of work: ${money(pay)} of severance, then ${shock.months} months with no salary while the expenses carry on regardless.`,
      },
      'bad',
    );
  }
  // Out of work is when people actually retrain, so the offer belongs here.
  s.pending = studyRoutes.some((r) => canEnrol(s, r)) ? { kind: 'career' } : null;
  checkTrouble(s);
}

/** Acknowledge the end of the salary and carry on with what is left. */
export function acceptRetirement(s: GameState): void {
  if (s.pending?.kind !== 'retired') return;
  s.pending = studyRoutes.some((r) => canEnrol(s, r)) ? { kind: 'career' } : null;
}

/** Go back to the same job rather than retraining. */
export function declineCareer(s: GameState): void {
  if (s.pending?.kind !== 'career') return;
  s.pending = null;
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

/** Cash value of a fast-track card, in months of the player's passive income. */
export function fastAmount(s: GameState, months: number): number {
  return Math.round((passiveIncome(s) * months) / 1000) * 1000;
}

/** How much monthly income a setback takes away, as a share of what comes in. */
export function fastIncomeLoss(s: GameState, pct: number): number {
  return Math.round((passiveIncome(s) * pct) / 100) * 100;
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
  if (p.kind === 'fastbonus' || p.kind === 'fastsetback') {
    const card: FastCard | undefined = fastById.get(p.cardId);
    if (card && card.type === 'bonus') {
      const gain = fastAmount(s, card.months);
      s.cash += gain;
      note(s, { th: `${card.title.th} +${money(gain)}`, en: `${card.title.en}: +${money(gain)}` }, 'good');
    } else if (card && card.type === 'setback') {
      const cost = fastAmount(s, card.months);
      const loss = card.incomeLossPct ? fastIncomeLoss(s, card.incomeLossPct) : 0;
      s.cash -= cost;
      if (loss > 0) shaveIncome(s, loss);
      note(
        s,
        {
          th: `${card.title.th}${cost ? ` จ่าย ${money(cost)}` : ''}${loss ? ` รายได้ต่อเดือนหายไป ${money(loss)}` : ''}`,
          en: `${card.title.en}${cost ? `: paid ${money(cost)}` : ''}${loss ? `, monthly income down ${money(loss)}` : ''}`,
        },
        'bad',
      );
    }
    s.pending = null;
    checkTrouble(s);
  }
}

/** Dreams still on the shelf, cheapest first so the ladder reads as a ladder. */
export function remainingDreams(s: GameState): Dream[] {
  return dreams.filter((d) => !s.dreamsOwned.includes(d.id)).sort((a, b) => a.cost - b.cost);
}

export function ownedDreams(s: GameState): Dream[] {
  return s.dreamsOwned.map((id) => dreamById.get(id)).filter((d): d is Dream => !!d);
}

export function dreamsDone(s: GameState): boolean {
  return s.dreamsOwned.length >= dreams.length;
}

export function buyDream(s: GameState): void {
  if (s.pending?.kind !== 'dream') return;
  const dream = dreamById.get(s.dreamId);
  if (!dream || s.cash < dream.cost || s.dreamsOwned.includes(dream.id)) return;
  s.cash -= dream.cost;
  s.dreamsOwned.push(dream.id);
  note(
    s,
    {
      th: `ทำความฝันสำเร็จ: ${dream.title.th} (ครบ ${s.dreamsOwned.length} จาก ${dreams.length} ข้อ)`,
      en: `Dream achieved: ${dream.title.en} (${s.dreamsOwned.length} of ${dreams.length})`,
    },
    'good',
  );
  s.pending = null;
  // Line up the next one automatically, so the tile always has something to be
  // about the next time it comes round.
  const next = remainingDreams(s)[0];
  if (next) s.dreamId = next.id;
  checkWin(s);
}

/** Choose which dream to chase next, from the ones not yet achieved. */
export function pickDream(s: GameState, dreamId: string): void {
  if (s.pending?.kind !== 'dreamPick') return;
  const dream = dreamById.get(dreamId);
  if (!dream || s.dreamsOwned.includes(dreamId)) return;
  s.dreamId = dreamId;
  s.pending = { kind: 'dream' };
  note(
    s,
    { th: `ตั้งความฝันข้อต่อไป: ${dream.title.th}`, en: `Next dream set: ${dream.title.en}` },
    'plain',
  );
}

export function skipDream(s: GameState): void {
  if (s.pending?.kind !== 'dream' && s.pending?.kind !== 'dreamPick') return;
  s.pending = null;
}

/* ------------------------------------------------------------------ legacy */

/**
 * Thailand's inheritance tax only bites above ฿100m from any one estate, at 10%,
 * or 5% where the heirs are the deceased's own parents or descendants. A
 * registered spouse is exempt entirely. The game uses the 5% direct-heir rate,
 * since that is the case almost every player is imagining.
 *
 * These are game mechanics built on the real thresholds, not tax advice; the
 * rules panel says so out loud.
 */
export const ESTATE_FREE = 100000000;
export const ESTATE_RATE = 0.05;
/** company tax, flat, against the personal rate a big portfolio would otherwise pay */
export const CORP_TAX_RATE = 0.2;
export const CORP_SETUP_COST = 250000;
/** accountants, audits and filings, every month, whether or not it saved anything */
export const CORP_MONTHLY_COST = 45000;
/** a policy costs this share of its sum assured every month */
export const INSURANCE_PREMIUM_RATE = 0.0016;
export const INSURANCE_STEP = 10000000;

/**
 * How many people the estate is split between. Thai inheritance tax is charged
 * on the person receiving, not on the estate as a whole, so every heir brings
 * their own exemption with them. A player with no children still has one heir
 * somewhere; the game does not ask who.
 */
export function heirs(s: GameState): number {
  return Math.max(1, s.children);
}

/** The slice of the estate one heir receives, before tax. */
export function heirShare(s: GameState): number {
  return Math.max(0, netWorth(s)) / heirs(s);
}

/**
 * What the heirs would be billed if the estate passed today.
 *
 * The exemption is per recipient, which is the single most useful thing to know
 * about this tax: an estate of ฿300M left to three children is three shares of
 * ฿100M and nobody pays a baht, while the same estate left to one child is
 * taxed on ฿200M of it. Splitting equally is not a rounding detail, it is the
 * whole planning decision.
 */
export function estateTax(s: GameState): number {
  const taxable = Math.max(0, netWorth(s) - ESTATE_FREE * heirs(s));
  return Math.round(taxable * ESTATE_RATE);
}

/** True once the estate is big enough for the tax to exist at all. */
export function estateTaxable(s: GameState): boolean {
  return netWorth(s) > ESTATE_FREE * heirs(s);
}

export function insurancePremium(s: GameState): number {
  return Math.round(s.insuranceCover * INSURANCE_PREMIUM_RATE);
}

/**
 * The number the endgame is really played for: what actually reaches the people
 * and causes the player named, once the taxman has taken his cut. Insurance
 * proceeds are paid straight to the beneficiary rather than into the estate, so
 * they arrive whole, and money already given away can no longer be taxed.
 */
export function legacyTotal(s: GameState): number {
  return Math.max(0, netWorth(s) - estateTax(s)) + s.insuranceCover + s.donated;
}

export function legacyUnlocked(s: GameState): boolean {
  return dreamsDone(s);
}

/** Give a slice away for good. It leaves the balance sheet and never comes back. */
export function donate(s: GameState, amount: number): void {
  const value = Math.min(Math.max(0, Math.floor(amount)), Math.floor(s.cash));
  if (value <= 0) return;
  s.cash -= value;
  s.donated += value;
  s.pending = null;
  note(
    s,
    {
      th: `โอนเข้ามูลนิธิ ${money(value)} เงินก้อนนี้ออกจากงบของคุณถาวร และออกจากฐานภาษีมรดกไปด้วย`,
      en: `${money(value)} moved into the foundation. It leaves your balance sheet for good, and leaves the taxable estate with it.`,
    },
    'good',
  );
  checkTier(s);
}

/**
 * Move the portfolio into a company. Worth it only once the tax saved beats the
 * accountant, which is the whole lesson: a structure that is right for someone
 * bigger than you is simply a cost.
 */
export function corpSaving(s: GameState): number {
  const personal = taxes(s);
  const corporate = Math.round(passiveIncome(s) * CORP_TAX_RATE * 0.5) + CORP_MONTHLY_COST;
  return personal - corporate;
}

export function incorporate(s: GameState): void {
  if (s.incorporated || s.cash < CORP_SETUP_COST) return;
  s.cash -= CORP_SETUP_COST;
  s.incorporated = true;
  s.pending = null;
  note(
    s,
    {
      th: `จดนิติบุคคลแล้ว จ่ายค่าตั้ง ${money(CORP_SETUP_COST)} ภาษีเปลี่ยนเป็นอัตราบริษัท และมีค่าบัญชี ${money(CORP_MONTHLY_COST)} ทุกเดือนไม่ว่าจะประหยัดได้หรือไม่`,
      en: `Incorporated for ${money(CORP_SETUP_COST)}. Tax moves to the company rate, and ${money(CORP_MONTHLY_COST)} of accounting is due every month whether it saves anything or not.`,
    },
    corpSaving(s) > 0 ? 'good' : 'bad',
  );
}

export function buyInsurance(s: GameState, cover: number): void {
  const value = Math.floor(Math.max(0, cover) / INSURANCE_STEP) * INSURANCE_STEP;
  if (value <= 0) return;
  s.insuranceCover += value;
  s.pending = null;
  note(
    s,
    {
      th: `ทำประกันชีวิตทุน ${money(value)} เบี้ยเพิ่มเดือนละ ${money(Math.round(value * INSURANCE_PREMIUM_RATE))} สินไหมจ่ายตรงถึงผู้รับผลประโยชน์ จึงไม่ตกเป็นกองมรดกและไม่ถูกคิดภาษี`,
      en: `Took out ${money(value)} of life cover at ${money(Math.round(value * INSURANCE_PREMIUM_RATE))} a month. The payout goes straight to the beneficiary, so it never enters the estate and is never taxed.`,
    },
    'good',
  );
}

export function closeLegacy(s: GameState): void {
  if (s.pending?.kind !== 'legacy') return;
  s.pending = null;
}

/* --------------------------------------------------------------- debt desk */

function addDebt(s: GameState, key: DebtKey, balance: number, payment: number): void {
  const existing = s.debts.find((d) => d.key === key);
  if (existing) {
    existing.balance += balance;
    existing.payment += payment;
  } else {
    s.debts.push({ key, balance, payment, rate: DEBT_RATE[key] });
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
  addDebt(s, 'bank', value, value * LOAN_RATE);
  note(
    s,
    {
      th: `กู้ธนาคาร ${money(value)} ผ่อนเดือนละ ${money(value * LOAN_RATE)} ประมาณ 11 เดือนจึงหมด`,
      en: `Borrowed ${money(value)} at ${money(value * LOAN_RATE)} a month, clearing in about eleven months.`,
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
  // Paying off part of a loan shortens it rather than stretching it: the
  // payment falls in the same proportion as the balance.
  const share = d.balance > 0 ? value / d.balance : 1;
  const freed = key === 'bank' ? d.payment * share : d.payment;
  d.balance -= value;
  d.payment = key === 'bank' ? Math.max(0, d.payment - freed) : 0;
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

/**
 * Clear the loan attached to one holding. Left to amortise on its own a
 * property mortgage runs about forty years, so this is the only way the
 * payment-becomes-income moment is ever reachable inside a game: spend the
 * cash, stop paying interest, and keep the rent that was covering it.
 */
export function canClearMortgage(s: GameState, assetUid: string): boolean {
  const a = s.assets.find((x) => x.uid === assetUid);
  return !!a && a.debt > 0 && s.cash >= a.debt;
}

export function clearMortgage(s: GameState, assetUid: string): void {
  const a = s.assets.find((x) => x.uid === assetUid);
  if (!a || a.debt <= 0 || s.cash < a.debt) return;
  const paid = a.debt;
  s.cash -= paid;
  a.debt = 0;
  a.cashflowPerUnit += a.mortgagePay / a.qty;
  note(
    s,
    {
      th: `ปิดหนี้ ${a.name.th} ${money(paid)} ค่าผ่อนเดือนละ ${money(a.mortgagePay)} กลายเป็นรายได้ของคุณเต็ม ๆ`,
      en: `Cleared the loan on ${a.name.en} for ${money(paid)}: the ${money(a.mortgagePay)} monthly payment is now income.`,
    },
    'good',
  );
  checkEscape(s);
  checkTrouble(s);
  checkTier(s);
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

/**
 * Put the quit decision to the player, but only the first time they cross the
 * line. Anyone who says "not yet" would otherwise be asked again every payday
 * for the rest of the game; the button under the board is how they change their
 * mind later.
 */
export function checkEscape(s: GameState): void {
  if (s.phase !== 'rat') return;
  // Falling back below the line arms the offer again: crossing it a second time
  // after a new baby or a new debt is a fresh decision, not a repeat of the old.
  if (!canQuit(s)) {
    s.quitOffered = false;
    return;
  }
  if (s.pending !== null || s.quitOffered) return;
  // The flag is only set once the player has actually answered (see quitJob and
  // stayEmployed). Marking it here would lose the offer for good whenever a
  // payday raised it mid-walk and the landing tile's card overwrote it, leaving
  // a board that can never be escaped from.
  s.pending = { kind: 'quit' };
}

export function quitJob(s: GameState): void {
  if (!canQuit(s)) return;
  const passive = passiveIncome(s);
  s.quit = true;
  s.quitOffered = true;
  s.phase = 'fast';
  // Nobody carries a layoff onto the fast track. canQuit already rules this out;
  // the line is here for saves written before it did.
  s.skipTurns = 0;
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
  s.quitOffered = true;
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

/**
 * Take a finished run back off the shelf. Ending the game is the player's call,
 * so un-ending it should be too: pressing "see the summary" must not be a
 * one-way door, and saves written by older builds that declared a winner on the
 * player's behalf would otherwise be stuck on that card forever.
 */
export function resumeAfterEnd(s: GameState): void {
  if (s.phase !== 'won') return;
  s.phase = s.quit ? 'fast' : 'rat';
  s.endedByChoice = false;
  s.pending = null;
  note(
    s,
    { th: 'กลับมาเล่นต่อ ยังไม่มีอะไรจบนอกจากล้มละลาย', en: 'Back in the game: nothing ends this but bankruptcy.' },
    'good',
  );
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
  if (typeof game.quitOffered !== 'boolean') game.quitOffered = game.quit;
  // The old single `dreamBought` flag becomes a one-entry collection.
  if (!Array.isArray(game.dreamsOwned)) {
    const legacy = (parsed as Record<string, unknown>).dreamBought === true;
    game.dreamsOwned = legacy ? [game.dreamId] : [];
  }
  if (!Number.isFinite(game.karma)) game.karma = 0;
  if (typeof game.friendHelpUsed !== 'boolean') game.friendHelpUsed = false;
  if (typeof game.endedByChoice !== 'boolean') game.endedByChoice = false;
  for (const d of game.debts) {
    if (!Number.isFinite(d.rate)) d.rate = DEBT_RATE[d.key] ?? 0;
    // Saves written while the emergency loan was interest-only carry both the
    // flag and the old 10% rate; both are converted so the loan now ends.
    if (d.key === 'bank') {
      delete d.interestOnly;
      d.rate = DEBT_RATE.bank;
    }
  }
  // A mortgaged holding saved before `mortgagePay` existed must get its real
  // payment back from the card it came from, not a zero. Defaulting to zero
  // left a debt whose payment covers nothing: the balance never amortises, and
  // the breakdown reads "interest ฿3,990, principal ฿0" next to ฿3,500 of rent,
  // which looks like the property loses money every month. It does not; the
  // ฿3,500 is already net of a ฿6,300 payment that the save had simply lost.
  for (const a of game.assets) {
    if (Number.isFinite(a.mortgagePay) && a.mortgagePay > 0) continue;
    const card = a.debt > 0 ? dealById.get(a.cardId) : undefined;
    a.mortgagePay = card?.mortgagePay ? card.mortgagePay * a.qty : 0;
  }
  if (!Number.isFinite(game.tier)) game.tier = tierOf(game);
  if (!Number.isFinite(game.escapeIncome)) game.escapeIncome = 0;
  if (!Number.isFinite(game.charityTurns)) game.charityTurns = 0;
  if (!Number.isFinite(game.donated)) game.donated = 0;
  if (typeof game.incorporated !== 'boolean') game.incorporated = false;
  if (!Number.isFinite(game.insuranceCover)) game.insuranceCover = 0;
  if (!Number.isFinite(game.impact)) game.impact = 0;
  if (!Array.isArray(game.decks?.fastMega)) game.decks.fastMega = [];
  // A deck is a list of card ids, and the card list changes between deploys.
  // Anything that no longer exists is dropped here, because drawing a card that
  // cannot be found leaves a pending decision nothing can render and no way to
  // roll again: the board is dead with no error anywhere. Emptied decks refill
  // themselves from the current cards on the next draw.
  const known: Record<keyof Decks, Set<string>> = {
    small: new Set(dealIdsOfSize('small')),
    big: new Set(dealIdsOfSize('big')),
    fastDeal: new Set(dealIdsOfSize('fast')),
    fastMega: new Set(dealIdsOfSize('mega')),
    market: new Set(marketCards.map((c) => c.id)),
    doodad: new Set(doodads.map((c) => c.id)),
    fastBonus: new Set(fastCards.filter((c) => c.type === 'bonus').map((c) => c.id)),
    fastSetback: new Set(fastCards.filter((c) => c.type === 'setback').map((c) => c.id)),
  };
  for (const key of Object.keys(known) as (keyof Decks)[]) {
    const deck = game.decks[key];
    game.decks[key] = Array.isArray(deck) ? deck.filter((id) => known[key].has(id)) : [];
  }
  // The same applies to a card the save was paused on.
  const stuck = game.pending;
  if (stuck) {
    const missing =
      ((stuck.kind === 'deal' || stuck.kind === 'fastdeal') && !dealById.has(stuck.cardId)) ||
      (stuck.kind === 'market' && !marketById.has(stuck.cardId)) ||
      (stuck.kind === 'doodad' && !doodadById.has(stuck.cardId)) ||
      ((stuck.kind === 'fastbonus' || stuck.kind === 'fastsetback') && !fastById.has(stuck.cardId));
    if (missing) game.pending = null;
  }
  // The fast track used to have a deck of its own card type; a save paused on
  // one of those cards has nothing left to render, so the card is dropped.
  const stale = game.pending as { kind?: string } | null;
  if (stale && (stale.kind === 'fastdeal' || stale.kind === 'fastbonus' || stale.kind === 'fastsetback')) {
    if (stale.kind === 'fastdeal') game.pending = null;
  }
  if (!Number.isFinite(game.skipTurns)) game.skipTurns = 0;
  // Saves written before careers had a calendar. A child already on the sheet
  // is treated as born at the start, which is the only honest guess available.
  if (!Array.isArray(game.childBorn)) {
    game.childBorn = Array.from({ length: Math.max(0, game.children | 0) }, () => 0);
  }
  if (game.study === undefined) game.study = null;
  if (typeof game.careerOver !== 'boolean') game.careerOver = false;
  if (!Number.isFinite(game.bondMonths)) game.bondMonths = 0;
  if (!Number.isFinite(game.slumpMonths)) game.slumpMonths = 0;
  if (!Number.isFinite(game.slumpCut)) game.slumpCut = 0;
  if (!Number.isFinite(game.entryPay) || game.entryPay <= 0) game.entryPay = 1;
  if (!Array.isArray(game.lastRoll)) game.lastRoll = [];
  if (typeof game.prices !== 'object' || game.prices === null) game.prices = {};
  return game;
}
