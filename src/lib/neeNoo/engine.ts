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
  petNames,
  petSpecies,
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
/**
 * The age past which the tile stops offering a first child. Forty is where the
 * decision realistically closes for most players, and a game that kept asking
 * at sixty was asking a question nobody recognised.
 */
export const BABY_MAX_AGE = 40;
/** the reward the tile becomes afterwards, as a share of a month's living cost */
export const REWARD_EXAM_SCALE = 0.7;
export const REWARD_PET_SCALE = 0.55;
/** months a sponsored licence is worked off for, and the cut taken meanwhile */
export const BOND_MONTHS = 36;
export const BOND_CUT = 0.25;
/**
 * Comprehensive cover pays the garage; the excess is what the driver still
 * hands over. A tenth of the bill is close enough to the real ค่าเสียหายส่วนแรก
 * to teach the shape of the trade without pretending to quote a policy.
 */
export const INSURED_SHARE = 0.1;
export const COVER_MONTHS = 12;
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
 * The random pile, minus anything the calendar deals instead. Birthdays and
 * school fees used to sit in here, which meant a family could go seven years
 * without one and a childless player could be handed a bill for ฿0.
 */
function drawDoodad(s: GameState): string {
  // The renewal notice is not in the deck at all: it arrives on its own
  // anniversary, the way a real policy does.
  // Nothing happens to a car that was never bought, so a player who declined
  // one is never billed for a clutch, a crash or a policy.
  const pool = doodads
    .filter(
      (c) =>
        !c.annual
        && c.id !== 'x-insurance'
        && (s.hasCar || !c.needsCar)
        && (!c.needsChild || s.children > 0)
        && (!c.needsPartner || s.partner)
        // Nobody is offered cover they already hold.
        && (!c.buysChildCover || !s.childInsured),
    )
    .map((c) => c.id);
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

/**
 * Cash flow from the holdings the player owns personally. Anything sitting in
 * the company earns for the company, not for them, and is counted by
 * `corpRevenue` instead. `householdIncome` puts the two back together for the
 * questions that are about the household rather than about one pocket.
 */
export function passiveIncome(s: GameState): number {
  return s.assets.filter((a) => !isCorpAsset(a)).reduce((sum, a) => sum + assetCashflow(a), 0);
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
  return salary(s) + pensionIncome(s) + passiveIncome(s) + drawTaken(s);
}

/* ----------------------------------------------------------------- company */

/**
 * อัตราภาษีเงินได้นิติบุคคลสำหรับ SME: nothing on the first ฿300,000 of profit,
 * 15% up to ฿3M, 20% above. A company small enough to be the player's is small
 * enough to qualify, so the game only models the SME table.
 */
export const CORP_BRACKETS: { size: number; rate: number }[] = [
  { size: 300000, rate: 0 },
  { size: 2700000, rate: 0.15 },
  { size: Number.POSITIVE_INFINITY, rate: 0.2 },
];

export function corpTax(profitYear: number): number {
  let left = Math.max(0, profitYear);
  let owed = 0;
  for (const b of CORP_BRACKETS) {
    if (left <= 0) break;
    const slice = Math.min(left, b.size);
    owed += slice * b.rate;
    left -= slice;
  }
  return owed;
}

export const isCorpAsset = (a: Asset): boolean => a.owner === 'corp';

/**
 * Money in or out of the account that owns a holding. Selling a company
 * building pays the company, not the player; letting the proceeds land in the
 * player's pocket would be a tax-free way to empty the company.
 */
function settle(s: GameState, a: Asset, amount: number): void {
  if (isCorpAsset(a)) s.corpCash += amount;
  else s.cash += amount;
}

/** The account a holding's own bills are paid from. */
export function purseFor(s: GameState, a: Asset): number {
  return isCorpAsset(a) ? s.corpCash : s.cash;
}

/** Monthly rent and trading profit belonging to the company. */
export function corpRevenue(s: GameState): number {
  return s.assets.filter(isCorpAsset).reduce((sum, a) => sum + assetCashflow(a), 0);
}

/** The director's salary actually being paid, which needs a company to pay it. */
export function drawTaken(s: GameState): number {
  return s.incorporated ? Math.max(0, Math.round(s.corpDraw)) : 0;
}

/** Company profit before its own tax: revenue, less the accountant and the draw. */
export function corpProfit(s: GameState): number {
  if (!s.incorporated) return 0;
  return corpRevenue(s) - CORP_MONTHLY_COST - drawTaken(s);
}

export function corpTaxMonthly(s: GameState): number {
  if (!s.incorporated) return 0;
  return Math.round(corpTax(corpProfit(s) * 12) / 12);
}

/** What the company keeps each month once it has paid everything it owes. */
export function corpRetained(s: GameState): number {
  if (!s.incorporated) return 0;
  return corpProfit(s) - corpTaxMonthly(s);
}

/**
 * What the company could hand over each month if the player took no salary from
 * it at all. Measured with the draw at zero on purpose: whether the household
 * has escaped should not change because the player moved a number between two
 * of their own pockets.
 */
export function corpDistributable(s: GameState): number {
  if (!s.incorporated) return 0;
  const profit = corpRevenue(s) - CORP_MONTHLY_COST;
  return profit - Math.round(corpTax(profit * 12) / 12);
}

/**
 * Everything the household lives on, wherever it happens to sit. The escape bar
 * and the tier ladder read this rather than personal passive income, because a
 * player who moves their buildings into a company has not become poorer and
 * must not be told they are back on the wheel.
 */
export function householdIncome(s: GameState): number {
  return passiveIncome(s) + corpDistributable(s);
}

/** The company's own balance sheet, which is what the player's shares are worth. */
export function corpEquity(s: GameState): number {
  const assets = s.assets
    .filter(isCorpAsset)
    .reduce((sum, a) => sum + assetValue(a) - a.debt, 0);
  return s.corpCash + assets;
}

/**
 * What the next term will cost, and how many months away it is.
 *
 * Tuition is charged as a lump the month a term falls due (see advanceStudy),
 * so it is deliberately NOT part of `totalExpenses`. It used to be both: the
 * averaged figure was subtracted every month through the cash-flow line and the
 * lump was taken again on top, which billed a ฿260,000 degree at ฿487,500 and a
 * ฿2.2M pilot course at nearly ฿4M. The statement shows this as a bill that is
 * coming rather than a bill that is running.
 */
export function tuitionNext(s: GameState): { amount: number; inMonths: number } | null {
  if (!s.study || s.study.termsLeft <= 0) return null;
  return { amount: s.study.perTerm, inMonths: Math.max(0, s.study.termEvery - s.study.sinceTerm) };
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
  // Household, not personal: moving the buildings into a company must not read
  // as losing them.
  const passive = householdIncome(s);
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
  return !s.quit && s.skipTurns === 0 && householdIncome(s) >= totalExpenses(s);
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

/**
 * Renting the same roof costs more every month than paying the loan on it, and
 * unlike the loan it never ends. That is the whole trade: no debt, no transfer
 * fee and no repairs, against a bill that is still there in thirty years.
 */
export const RENT_VS_MORTGAGE = 1.05;
/** Ride-hailing, taxis on the days it rains, and the hours the bus costs instead. */
export const COMMUTE_VS_CAR = 0.62;

/** What the profession would have been paying on the loan that was declined. */
function skippedPayment(s: GameState, key: 'home' | 'car'): number {
  return profession(s).debts.find((d) => d.key === key)?.payment ?? 0;
}

export function rentCost(s: GameState): number {
  return s.hasHome ? 0 : Math.round(skippedPayment(s, 'home') * RENT_VS_MORTGAGE * priceLevel(s));
}

export function commuteCost(s: GameState): number {
  return s.hasCar ? 0 : Math.round(skippedPayment(s, 'car') * COMMUTE_VS_CAR * priceLevel(s));
}

/** The bills that stand in for the things the player chose not to buy. */
export function housingCost(s: GameState): number {
  return rentCost(s) + commuteCost(s);
}

/**
 * The two lines a household has that a single person does not.
 *
 * A child in Thailand costs an ordinary family somewhere between ฿5,000 and
 * ฿10,000 a month and a comfortable one several times that, which is what
 * `childCost` now carries. These two are what that figure does not: the person
 * the child arrived with, and the policy that stands between a fever at two in
 * the morning and a bill nobody budgeted for.
 */
export const PARTNER_SHARE = 0.12;
export const CHILD_PREMIUM_RATE = 0.25;
/**
 * The share of the children's bills that lands on this player rather than on
 * the other adult in the house. Every figure the game charges for a child is
 * the household's real figure, and half of it is what appears on this
 * statement: a two-earner household is what raising children in Thailand
 * actually looks like, and pretending otherwise made the numbers either
 * dishonest or unplayable.
 */
export const HOUSEHOLD_SHARE = 0.5;

export function partnerCost(s: GameState): number {
  return s.partner ? Math.round(livingCost(s) * PARTNER_SHARE) : 0;
}

export function childPremium(s: GameState): number {
  if (!s.childInsured || s.children === 0) return 0;
  return Math.round(profession(s).childCost * priceLevel(s) * CHILD_PREMIUM_RATE * s.children * HOUSEHOLD_SHARE);
}

/** The household's own figure, before the other adult takes their half. */
export function childExpenseGross(s: GameState): number {
  const per = profession(s).childCost * priceLevel(s);
  return Math.round(s.childBorn.reduce((sum, born) => sum + per * childStage(s, born).scale, 0));
}

export function ageMonths(s: GameState): number {
  return s.startAge * 12 + s.months;
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
  if (!noMoreSalary(s)) return 0;
  const p = profession(s);
  // Nothing pays out early. Social security's old-age benefit starts at 55, the
  // civil pension and the old-age allowance at 60, so a career that ended at 43
  // means twelve years of paying the bills out of whatever you built.
  const claimAge = p.pension === 'sso' ? 55 : 60;
  if (ageYears(s) < claimAge) return 0;
  const finalSalary = Math.round(p.salary * payLevel(s));
  // Career length assumes the player started work at 22, which is what the
  // contribution-year part of both formulas is counting, and it stops counting
  // the day the salary did. Leaving at 40 still earns a pension at 60, just a
  // much smaller one than staying to 60 would have: the years you did not work
  // are years nobody paid contributions for.
  const stopAge = s.workEndMonth === null ? ageYears(s) : Math.floor((s.startAge * 12 + s.workEndMonth) / 12);
  const served = Math.max(0, stopAge - 22);
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
  return Math.round(childExpenseGross(s) * HOUSEHOLD_SHARE);
}

/* ------------------------------------------------------------- income tax */

/**
 * เงินได้สุทธิ run through มาตรา 48(1). The first ฿150,000 is exempt rather than
 * zero-rated, which comes to the same thing here.
 */
export const TAX_BRACKETS: { size: number; rate: number }[] = [
  { size: 150000, rate: 0 },
  { size: 150000, rate: 0.05 },
  { size: 200000, rate: 0.1 },
  { size: 250000, rate: 0.15 },
  { size: 250000, rate: 0.2 },
  { size: 1000000, rate: 0.25 },
  { size: 3000000, rate: 0.3 },
  { size: Number.POSITIVE_INFINITY, rate: 0.35 },
];
/** ค่าลดหย่อนส่วนตัว and ค่าลดหย่อนบุตร, the two every player has */
/* ----------------------------------------------- what the payslip really does */

/**
 * Social security, the deduction nobody reads on their own payslip.
 *
 * Section 33 takes 5% of the wage with the wage itself capped at ฿15,000, so
 * every employee in the country pays at most ฿750 a month and the highest
 * earners pay the same as somebody on ฿15,000. The employer pays a matching
 * amount that the employee never sees. The game already paid out the old-age
 * benefit at sixty; it had simply never charged anybody for it.
 */
export const SSO_RATE = 0.05;
export const SSO_WAGE_CAP = 15000;
/** Civil servants are outside section 33 and pay into กบข. instead. */
export const GPF_RATE = 0.03;

export function ssoContribution(s: GameState): number {
  if (salary(s) <= 0) return 0;
  const p = profession(s);
  if (p.pension === 'civil') return Math.round(salary(s) * GPF_RATE);
  // Self-employment is outside the system entirely, which is why it gets no
  // pension at sixty either.
  if (p.pension === 'none') return 0;
  return Math.round(Math.min(salary(s), SSO_WAGE_CAP) * SSO_RATE);
}

/**
 * The provident fund: the best return available to a Thai employee and the one
 * most of them leave on the table.
 *
 * Whatever share of the wage the player puts in, the employer puts in the same,
 * so the money doubles the moment it lands. It is locked until they leave the
 * job, it compounds at a fund's rate rather than a bank's, and the contribution
 * comes off taxable income on the way in. There is no other button in this game
 * that pays 100% on the first day.
 */
export const PF_RATES = [0, 0.03, 0.05, 0.1] as const;
export const PF_RETURN = 0.05;
/** Deductible up to 15% of the wage, and the ladder is where that lands. */
export const PF_DEDUCT_CAP_RATE = 0.15;
export const PF_DEDUCT_CAP = 500000;
/** Taken out before 55: the employer's half and the growth are taxed. */
export const PF_EARLY_TAX = 0.1;
export const PF_VEST_AGE = 55;

/**
 * True where this job comes with a fund the player can choose the size of.
 * A civil servant's 3% already goes to กบข., which is a fund of the same kind
 * with the rate fixed by law, so they are not asked twice; the self-employed
 * have neither, which is the same reason they have no pension at sixty.
 */
export function hasProvidentFund(s: GameState): boolean {
  return profession(s).pension === 'sso';
}

export function pfContribution(s: GameState): number {
  if (!hasProvidentFund(s) || salary(s) <= 0) return 0;
  return Math.round(salary(s) * s.pfRate);
}

/** The employer's side, which costs the player nothing and is theirs anyway. */
export function pfMatch(s: GameState): number {
  return pfContribution(s);
}

export function pfPot(s: GameState): number {
  return Math.round(s.pfPot);
}

/** What the pot is worth in the hand, once the taxman has had his look. */
export function pfCashOut(s: GameState): number {
  const gross = s.pfPot;
  if (gross <= 0) return 0;
  return Math.round(ageYears(s) >= PF_VEST_AGE ? gross : gross * (1 - PF_EARLY_TAX));
}

/** The rates a scheme will actually let somebody pick, as a plain array. */
export function pfRateOptions(): number[] {
  return [...PF_RATES];
}

export function setPfRate(s: GameState, rate: number): void {
  if (!hasProvidentFund(s)) return;
  const allowed = PF_RATES.includes(rate as (typeof PF_RATES)[number]) ? rate : 0;
  if (allowed === s.pfRate) return;
  s.pfRate = allowed;
  note(
    s,
    {
      th: `ตั้งเงินสะสมกองทุนสำรองเลี้ยงชีพเป็น ${Math.round(allowed * 100)}% ของเงินเดือน เดือนละ ${money(pfContribution(s))} และนายจ้างสมทบให้อีกเท่ากัน`,
      en: `Provident fund set to ${Math.round(allowed * 100)}% of the wage: ${money(pfContribution(s))} a month, matched baht for baht by the employer.`,
    },
    'good',
  );
  checkEscape(s);
}

/** Paid in, matched, and grown, once a month. */
function pfMonth(s: GameState): void {
  s.pfPot *= 1 + PF_RETURN / 12;
  const own = pfContribution(s);
  if (own > 0) s.pfPot += own + pfMatch(s);
}

/**
 * Leaving the job hands the pot over. Before 55 the taxman takes his share of
 * everything that was not the player's own contribution, which is the price of
 * treating a retirement fund as a savings account.
 */
export function pfPayout(s: GameState): void {
  if (s.pfPot <= 0) return;
  const paid = pfCashOut(s);
  const lost = Math.round(s.pfPot) - paid;
  s.cash += paid;
  s.pfPot = 0;
  s.pfRate = 0;
  note(
    s,
    {
      th: `ได้รับเงินกองทุนสำรองเลี้ยงชีพ ${money(paid)}${lost > 0 ? ` (ถูกหักภาษี ${money(lost)} เพราะออกก่อนอายุ ${PF_VEST_AGE})` : ' ปลอดภาษีเพราะออกหลังอายุ 55'}`,
      en: `The provident fund paid out ${money(paid)}${lost > 0 ? `, with ${money(lost)} withheld for leaving before ${PF_VEST_AGE}` : ', tax free at 55'}.`,
    },
    paid > 0 ? 'good' : 'plain',
  );
}

/* -------------------------------------------- the fund everybody buys in December */

/**
 * SSF, RMF and Thai ESG: the one place where investing and the tax ladder meet.
 *
 * Every December the country buys funds it does not otherwise think about,
 * because the money comes off taxable income at whatever the player's top
 * bracket happens to be. Somebody in the 20% band gets a fifth of it back; the
 * office worker who owes no tax at all gets nothing back and should not be
 * buying these at all. Both of those are lessons, and the second one is the one
 * nobody ever says out loud.
 *
 * The lock is the price: RMF cannot be sold until 55, SSF for ten years. Here
 * they are one holding with one rule, because the difference between them is
 * paperwork and the difference that matters is the lock itself.
 */
export const TAXFUND_RETURN = 0.06;
export const TAXFUND_LOCK_YEARS = 10;
export const TAXFUND_CAP_RATE = 0.3;
export const TAXFUND_CAP = 500000;
/** the smallest order the game will take, so the December card is not noise */
export const TAXFUND_STEP = 10000;

/** How much of a purchase this year would still come off taxable income. */
export function taxFundRoom(s: GameState): number {
  const payYear = (salary(s) + drawTaken(s)) * 12;
  const cap = Math.min(payYear * TAXFUND_CAP_RATE, TAXFUND_CAP);
  return Math.max(0, Math.floor((cap - s.taxFundYear) / TAXFUND_STEP) * TAXFUND_STEP);
}

/** What the taxman would hand back for one more baht put in. */
export function taxFundRefundRate(s: GameState): number {
  return marginalRate(taxBill(s).net);
}

export function taxFundValue(s: GameState): number {
  return Math.round(s.taxFundPot);
}

/** Sellable once the lock is up, or at 55, whichever comes first. */
export function taxFundUnlocked(s: GameState): boolean {
  return (
    s.taxFundPot > 0
    && (ageYears(s) >= PF_VEST_AGE
      || (s.taxFundFirst !== null && s.months - s.taxFundFirst >= TAXFUND_LOCK_YEARS * 12))
  );
}

export function buyTaxFund(s: GameState, amount: number): void {
  const value = Math.min(
    Math.floor(amount / TAXFUND_STEP) * TAXFUND_STEP,
    taxFundRoom(s),
    Math.floor(s.cash / TAXFUND_STEP) * TAXFUND_STEP,
  );
  if (value <= 0) return;
  const rate = taxFundRefundRate(s);
  const refund = Math.round(value * rate);
  s.cash -= value;
  s.taxFundPot += value;
  s.taxFundYear += value;
  if (s.taxFundFirst === null) s.taxFundFirst = s.months;
  // The refund lands with the filing rather than at the till, which is close
  // enough to how it feels: the money comes back, months later, as a lump.
  s.cash += refund;
  s.taxFundDue = false;
  s.pending = null;
  note(
    s,
    {
      th: `ซื้อกองทุนลดหย่อนภาษี ${money(value)} ได้ภาษีคืน ${money(refund)} (ฐานภาษีขั้นบนสุด ${Math.round(rate * 100)}%) เงินก้อนนี้ขายไม่ได้อีก ${TAXFUND_LOCK_YEARS} ปี`,
      en: `Put ${money(value)} into a tax-deductible fund and got ${money(refund)} back at the ${Math.round(rate * 100)}% band. It cannot be sold for ${TAXFUND_LOCK_YEARS} years.`,
    },
    refund > 0 ? 'good' : 'plain',
  );
  checkEscape(s);
}

export function sellTaxFund(s: GameState): void {
  if (!taxFundUnlocked(s)) return;
  const value = taxFundValue(s);
  s.cash += value;
  s.taxFundPot = 0;
  s.taxFundFirst = null;
  note(
    s,
    { th: `ขายกองทุนลดหย่อนภาษีที่ครบกำหนดแล้ว ได้เงินสด ${money(value)}`, en: `Sold the matured tax fund for ${money(value)}.` },
    'good',
  );
  checkEscape(s);
}

export function declineTaxFund(s: GameState): void {
  s.taxFundDue = false;
  s.pending = null;
}

/* ------------------------------------------ the boring one that wins anyway */

/**
 * A broad index fund bought by standing order every month.
 *
 * Everything else in this game is bought in lumps, when a card happens to
 * offer it, which is exactly how most people invest and exactly why most people
 * are not invested. This is the other way: a small amount leaves the account on
 * payday whether or not anything interesting happened that month, and the
 * compounding does the work. It pays no monthly income at all, so it never
 * moves the escape line by a single baht; it only ever shows up in what the
 * player is worth. That contrast is the whole point of putting it in.
 */
export const DCA_RETURN = 0.07;
/** How far a year can land from the average, either way. */
export const DCA_SWING = 0.18;
export const DCA_STEP = 1000;

export function dcaValue(s: GameState): number {
  return Math.round(s.dcaPot);
}

/** Every baht ever put in, so the gain can be read off against it. */
export function dcaPaidIn(s: GameState): number {
  return Math.round(s.dcaPaid);
}

export function dcaGain(s: GameState): number {
  return Math.round(s.dcaPot - s.dcaPaid);
}

export function setDcaMonthly(s: GameState, amount: number): void {
  const value = Math.max(0, Math.floor(amount / DCA_STEP) * DCA_STEP);
  if (value === s.dcaMonthly) return;
  s.dcaMonthly = value;
  note(
    s,
    value > 0
      ? {
          th: `ตั้งโอนซื้อกองทุนดัชนีอัตโนมัติเดือนละ ${money(value)} หักทุกวันเงินเดือนโดยไม่ต้องตัดสินใจใหม่ทุกครั้ง`,
          en: `A standing order of ${money(value)} a month into the index fund, taken on payday without the decision being made again.`,
        }
      : { th: 'ยกเลิกการโอนซื้อกองทุนดัชนีอัตโนมัติแล้ว', en: 'The standing order into the index fund has been cancelled.' },
    value > 0 ? 'good' : 'plain',
  );
}

/**
 * One month of the standing order. It skips itself when the account cannot
 * take it, because a transfer that overdraws somebody is not a plan, and the
 * card that follows would have been the bank's.
 */
function dcaMonth(s: GameState): void {
  // The market's own year, drawn once and then applied smoothly, so a run of
  // months does not look like a coin being flipped every payday.
  const drift = 1 + (DCA_RETURN + (rand(s) - 0.5) * DCA_SWING) / 12;
  s.dcaPot *= drift;
  if (s.dcaMonthly <= 0) return;
  if (s.cash < s.dcaMonthly) return;
  s.cash -= s.dcaMonthly;
  s.dcaPot += s.dcaMonthly;
  s.dcaPaid += s.dcaMonthly;
}

export function sellDca(s: GameState, amount?: number): void {
  const value = Math.min(s.dcaPot, amount === undefined ? s.dcaPot : Math.max(0, amount));
  if (value <= 0) return;
  const share = s.dcaPot > 0 ? value / s.dcaPot : 1;
  const gain = Math.round(value - s.dcaPaid * share);
  s.cash += Math.round(value);
  s.dcaPaid = Math.max(0, s.dcaPaid - s.dcaPaid * share);
  s.dcaPot -= value;
  note(
    s,
    {
      th: `ขายกองทุนดัชนี ${money(value)} (${gain >= 0 ? 'กำไร' : 'ขาดทุน'} ${money(Math.abs(gain))}) กำไรจากกองทุนรวมในไทยไม่เสียภาษี`,
      en: `Sold ${money(value)} of the index fund (${gain >= 0 ? 'gain' : 'loss'} ${money(Math.abs(gain))}). Mutual-fund gains are not taxed in Thailand.`,
    },
    gain >= 0 ? 'good' : 'bad',
  );
  checkEscape(s);
}

export const ALLOWANCE_SELF = 60000;
export const ALLOWANCE_CHILD = 30000;
/** 40(1): half the pay, capped, which is why big salaries lose this race */
export const SALARY_DEDUCT_RATE = 0.5;
export const SALARY_DEDUCT_CAP = 100000;
/** 40(5) flat deduction for buildings and land let out */
export const RENT_DEDUCT = 0.3;
/** 40(8) flat deduction for a trade */
export const BIZ_DEDUCT = 0.6;
/** 40(4) dividends: withheld at source and the taxpayer may stop there */
export const DIVIDEND_TAX = 0.1;

export interface TaxSlice {
  gross: number;
  deduct: number;
  taxable: number;
}

export interface TaxBill {
  /** 40(1): the payslip, and a civil-service pension, which is taxed like one */
  salary: TaxSlice;
  /** 40(5): rent from property */
  rent: TaxSlice;
  /** 40(8): profit from a trade */
  business: TaxSlice;
  /** 40(4): dividends and interest, settled at source and off the ladder */
  dividendGross: number;
  allowance: number;
  net: number;
  ladderYear: number;
  dividendYear: number;
  corpYear: number;
  year: number;
  month: number;
}

/** Tax on เงินได้สุทธิ for one year, walked bracket by bracket. */
export function ladderTax(net: number): number {
  let left = Math.max(0, net);
  let owed = 0;
  for (const b of TAX_BRACKETS) {
    if (left <= 0) break;
    const slice = Math.min(left, b.size);
    owed += slice * b.rate;
    left -= slice;
  }
  return owed;
}

/** The marginal rate the next baht of ladder income would meet. */
export function marginalRate(net: number): number {
  let left = Math.max(0, net);
  let rate = 0;
  for (const b of TAX_BRACKETS) {
    rate = b.rate;
    if (left < b.size) break;
    left -= b.size;
  }
  return rate;
}

const taxSlice = (gross: number, deduct: number): TaxSlice => ({
  gross,
  deduct,
  taxable: Math.max(0, gross - deduct),
});

/**
 * Monthly cash flow from the personally held assets in one category. Anything
 * the company owns is the company's income and is taxed on the company's own
 * ladder, so it never appears on this bill.
 */
function incomeFrom(s: GameState, pick: (a: Asset) => boolean): number {
  return Math.max(
    0,
    s.assets.filter((a) => !isCorpAsset(a) && pick(a)).reduce((sum, a) => sum + assetCashflow(a), 0),
  );
}

/**
 * The whole bill, by category, because in Thailand the category is the point.
 *
 * The same ฿50,000 a month is taxed three different ways depending on where it
 * came from: a payslip climbs the ladder with a deduction capped at ฿100,000 a
 * year, rent climbs the same ladder but only 70% of it is counted, a trade only
 * 40%, and dividends leave the ladder entirely at a flat 10%. Which one is
 * cheapest changes as the player climbs, which is the argument the whole game
 * is making, and it was invisible while passive income was taxed at nothing at
 * all until the day you quit.
 */
export function taxBill(s: GameState): TaxBill {
  const p = profession(s);
  // A civil-service pension is 40(1) income like any wage. The social-security
  // old-age benefit and the state's ฿600 allowance are both exempt, so neither
  // of those ever reaches this line.
  // The director's salary is 40(1) income like any other wage, which is exactly
  // why paying yourself out of the company is not free.
  const payYear = (salary(s) + drawTaken(s) + (p.pension === 'civil' ? pensionIncome(s) : 0)) * 12;
  const salaryLine = taxSlice(payYear, Math.min(payYear * SALARY_DEDUCT_RATE, SALARY_DEDUCT_CAP));

  const rentYear = incomeFrom(s, (a) => a.kind === 'property') * 12;
  const bizYear = incomeFrom(s, (a) => a.kind === 'business') * 12;
  const divYear = incomeFrom(s, (a) => a.kind === 'stock' || a.kind === 'gold') * 12;

  const rentLine = taxSlice(rentYear, rentYear * RENT_DEDUCT);
  const bizLine = taxSlice(bizYear, bizYear * BIZ_DEDUCT);
  // Shown on the same bill for honesty, but charged to the company, not to the
  // player: it is already out of the money before any of it reaches them.
  const corpYear = corpTaxMonthly(s) * 12;

  // Both payroll deductions come off the taxable side, which is why raising the
  // provident-fund rate lowers this month's tax as well as building the pot.
  const ssoYear = Math.min(ssoContribution(s) * 12, 9000);
  const pfYear = Math.min(pfContribution(s) * 12, payYear * PF_DEDUCT_CAP_RATE, PF_DEDUCT_CAP);
  const allowance = ALLOWANCE_SELF + s.children * ALLOWANCE_CHILD + ssoYear + pfYear + s.taxFundYear;
  const net = Math.max(0, salaryLine.taxable + rentLine.taxable + bizLine.taxable - allowance);
  const ladderYear = ladderTax(net);
  const dividendYear = divYear * DIVIDEND_TAX;
  // The company's tax is deliberately NOT in here. It is paid out of the
  // company's own account before anything reaches the player, so adding it to
  // the personal expense line would charge it twice.
  const year = ladderYear + dividendYear;

  return {
    salary: salaryLine,
    rent: rentLine,
    business: bizLine,
    dividendGross: divYear,
    allowance,
    net,
    ladderYear,
    dividendYear,
    corpYear,
    year,
    month: Math.round(year / 12),
  };
}

export function taxes(s: GameState): number {
  return taxBill(s).month;
}

/** The tax a profession's starting salary alone would attract, for the setup screen. */
export function startingTax(p: Profession): number {
  const payYear = p.salary * 12;
  const taxable = Math.max(0, payYear - Math.min(payYear * SALARY_DEDUCT_RATE, SALARY_DEDUCT_CAP));
  return Math.round(ladderTax(Math.max(0, taxable - ALLOWANCE_SELF)) / 12);
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

/**
 * What leaves the player's own account every month. The accountant's fee is not
 * here any more: it is a cost of running the company and is paid out of the
 * company's account, before the company works out what it owes.
 */
export function totalExpenses(s: GameState): number {
  return (
    taxes(s) + ssoContribution(s) + pfContribution(s) + livingCost(s) + housingCost(s)
    + partnerCost(s) + childExpense(s) + childPremium(s) + debtPayments(s) + insurancePremium(s)
  );
}

export function monthlyCashflow(s: GameState): number {
  return totalIncome(s) - totalExpenses(s);
}

export function assetValue(a: Asset): number {
  return a.pricePerUnit * a.qty;
}

/**
 * A house does not stop being worth money because the loan on it is on the
 * other page. Both figures come from the day the game started: property is
 * carried up with prices, and a car loses a seventh of what is left of it every
 * year, which is why a three-year-old car and a five-year loan are such a
 * familiar combination of numbers.
 */
export const CAR_DEPRECIATION = 0.86;
export const HOME_DRIFT = 0.025;

export function homeValue(s: GameState): number {
  if (!s.hasHome) return 0;
  return Math.round(s.ownValue.home * Math.pow(1 + HOME_DRIFT, yearsElapsed(s)));
}

export function carValue(s: GameState): number {
  if (!s.hasCar) return 0;
  return Math.round(s.ownValue.car * Math.max(0.1, Math.pow(CAR_DEPRECIATION, yearsElapsed(s))));
}

/** What the player owns outright, with nothing of the company's counted. */
export function personalWorth(s: GameState): number {
  const assets = s.assets
    .filter((a) => !isCorpAsset(a))
    .reduce((sum, a) => sum + assetValue(a) - a.debt, 0);
  const debts = s.debts.reduce((sum, d) => sum + d.balance, 0);
  // The provident fund is counted at what it would actually pay out, not at its
  // balance: before 55 a slice of it belongs to the taxman.
  return s.cash + assets + homeValue(s) + carValue(s) + pfCashOut(s) + taxFundValue(s) + dcaValue(s) - debts;
}

/**
 * Everything the player is worth, personally and through the company.
 *
 * Owning 100% of the shares means the shares are worth whatever the company's
 * net assets are, so company equity is simply added. It is deliberately not
 * discounted here: it really is theirs. What it costs to convert into spendable
 * money is a separate question, answered by `worthAfterWindingUp`.
 */
export function netWorth(s: GameState): number {
  return personalWorth(s) + corpEquity(s);
}

/**
 * The same wealth, valued as cash in hand today. Everything inside the company
 * has to come out as a dividend to be spent, and the taxman takes his 10% on
 * the way. The gap between this and `netWorth` is the bill the structure has
 * been deferring, not a bill it cancelled.
 */
export function worthAfterWindingUp(s: GameState): number {
  const equity = corpEquity(s);
  return personalWorth(s) + (equity > 0 ? Math.round(equity * (1 - DIVIDEND_TAX)) : equity);
}

export function bankBalance(s: GameState): number {
  return s.debts.find((d) => d.key === 'bank')?.balance ?? 0;
}

/** How far along the escape is, 0..1 — passive income against total expenses. */
export function escapeProgress(s: GameState): number {
  const exp = totalExpenses(s);
  if (exp <= 0) return 1;
  return Math.min(1, householdIncome(s) / exp);
}

/** Monthly income built since leaving the wheel — the fast-track scoreboard. */
export function fastAdded(s: GameState): number {
  return Math.max(0, householdIncome(s) - s.escapeIncome);
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

/**
 * The two things every player used to be handed with the paperwork already
 * signed. Leaving them out is a real option with a real price, not a discount.
 */
export interface StartChoices {
  car: boolean;
  home: boolean;
}

export function createGame(
  professionId: string,
  dreamId: string,
  seed: number,
  choices: StartChoices = { car: true, home: true },
): GameState {
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
    debts: p.debts
      .filter((d) => (d.key === 'car' ? choices.car : d.key === 'home' ? choices.home : true))
      .map((d) => ({ ...d, rate: DEBT_RATE[d.key] })),
    hasCar: choices.car && p.debts.some((d) => d.key === 'car'),
    hasHome: choices.home && p.debts.some((d) => d.key === 'home'),
    // A loan is written against most of the value, not all of it: the house is
    // worth more than what is owed on it from the first day, the car is worth
    // only a little more and stops being so within a year.
    ownValue: {
      home: Math.round((p.debts.find((d) => d.key === 'home')?.balance ?? 0) * 1.25),
      car: Math.round((p.debts.find((d) => d.key === 'car')?.balance ?? 0) * 1.15),
    },
    loanBlockedUntil: 0,
    credit: { onTime: 0, late: 0, cleared: 0, refused: 0 },
    pet: null,
    quit: false,
    quitOffered: false,
    tier: 1,
    karma: 0,
    donated: 0,
    incorporated: false,
    corpCash: 0,
    corpDraw: 0,
    insuranceCover: 0,
    friendHelpUsed: false,
    endedByChoice: false,
    prices,
    pos: 0,
    fastPos: 0,
    turn: 1,
    months: 0,
    startAge: p.startAge,
    childBorn: [],
    study: null,
    careerOver: false,
    workEndMonth: null,
    bondMonths: 0,
    slumpMonths: 0,
    slumpCut: 0,
    carCoverMonths: 0,
    // Every profession starts the game with a car loan, so every player already
    // owns a car and already has this decision to make. Waiting for the deck to
    // raise it took a median of 44 months, by which time most of the repair
    // bills in a run had already been paid at full price by somebody who would
    // happily have bought a policy.
    coverRenewMonth: COVER_MONTHS,
    coverDue: false,
    wroteBook: false,
    partner: false,
    childInsured: false,
    // Most people are defaulted into the smallest contribution their scheme
    // allows and never touch it again, so that is where the game starts them.
    pfRate: professionById.get(professionId)?.pension === 'none' ? 0 : 0.03,
    pfPot: 0,
    dcaMonthly: 0,
    dcaPot: 0,
    dcaPaid: 0,
    taxFundPot: 0,
    taxFundYear: 0,
    taxFundFirst: null,
    taxFundDue: false,
    birthdayDue: false,
    schoolDue: false,
    retireDue: false,
    licenceDue: null,
    graduatedFrom: null,
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
  s.pet = rollPet(s);
  note(s, {
    th: `เริ่มเกมในบทบาท "${p.name.th}" กระแสเงินสดตั้งต้นเดือนละ ${money(monthlyCashflow(s))}`,
    en: `Starting as "${p.name.en}" with ${money(monthlyCashflow(s))} of monthly cash flow.`,
  });
  if (!choices.car || !choices.home) {
    const lines: string[] = [];
    const linesEn: string[] = [];
    if (!choices.car && commuteCost(s) > 0) {
      lines.push(`ไม่เอารถ ไม่มีค่างวด แต่ค่าเดินทางเดือนละ ${money(commuteCost(s))}`);
      linesEn.push(`no car and no instalment, but ${money(commuteCost(s))} a month to get around`);
    }
    if (!choices.home && rentCost(s) > 0) {
      lines.push(`ไม่ซื้อบ้าน ไม่มีหนี้บ้าน แต่ค่าเช่าเดือนละ ${money(rentCost(s))} ที่ไม่มีวันหมด`);
      linesEn.push(`no house and no mortgage, but ${money(rentCost(s))} a month of rent that never ends`);
    }
    if (lines.length) note(s, { th: lines.join(' · '), en: linesEn.join(' · ') }, 'plain');
  }
  if (s.pet) {
    note(
      s,
      {
        th: `ที่บ้านมี${petSpeciesLabel(s).th}อยู่หนึ่งตัว ชื่อ${s.pet.name.th}`,
        en: `There is a ${petSpeciesLabel(s).en} at home called ${s.pet.name.en}.`,
      },
      'plain',
    );
  }
  return s;
}

/* ------------------------------------------------------------------ the pet */

function rollPet(s: GameState): { speciesId: string; name: Loc } {
  const species = petSpecies[Math.floor(rand(s) * petSpecies.length)] ?? petSpecies[0];
  const name = petNames[Math.floor(rand(s) * petNames.length)] ?? petNames[0];
  return { speciesId: species?.id ?? 'dog', name: name ?? { th: 'ข้าวปั้น', en: 'Khao Pan' } };
}

export function petSpeciesLabel(s: GameState): Loc {
  const found = petSpecies.find((x) => x.id === s.pet?.speciesId);
  return found?.label ?? { th: 'สัตว์เลี้ยง', en: 'pet' };
}

/** "แมวชื่อโมจิ" — the creature as it should read inside a sentence. */
export function petPhrase(s: GameState): Loc {
  if (!s.pet) return { th: 'สัตว์เลี้ยง', en: 'the pet' };
  const kind = petSpeciesLabel(s);
  return { th: `${kind.th}ชื่อ${s.pet.name.th}`, en: `${s.pet.name.en} the ${kind.en}` };
}

/**
 * Cards are written with a `{pet}` hole in them rather than with a species, so
 * one vet bill can belong to whichever animal this particular game rolled.
 */
export function fillCard(s: GameState, text: Loc): Loc {
  if (!text.th.includes('{pet') && !text.en.includes('{pet')) return text;
  const pet = petPhrase(s);
  // `{pet}` introduces the animal ("the cat called ปุยฝ้าย"); `{petName}` is for
  // headings, where the species has already been said and the name alone reads
  // like a name rather than a form field.
  const name = s.pet?.name ?? { th: 'สัตว์เลี้ยง', en: 'the pet' };
  return {
    th: text.th.replaceAll('{petName}', name.th).replaceAll('{pet}', pet.th),
    en: text.en.replaceAll('{petName}', name.en).replaceAll('{pet}', pet.en),
  };
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
  // Anything the calendar raised and the board swallowed is answered first. The
  // turn is not spent on it: the roll happens once the card is closed.
  if (claimDue(s)) return;

  if (s.skipTurns > 0) {
    // Being out of work is not "sit still for two turns": the bills keep coming
    // with no salary behind them. Passive income is the only thing that softens
    // it, which is the whole point of the game.
    s.skipTurns -= 1;
    s.turn += 1;
    monthPassed(s);
    const gap = totalExpenses(s) - passiveIncome(s);
    s.cash -= gap;
    const studying = !!s.study;
    note(
      s,
      studying
        ? {
            th: `อีกหนึ่งเดือนในห้องเรียน ไม่มีเงินเดือนเข้า จ่ายรายจ่าย ${money(totalExpenses(s))} เงินไหลเข้าช่วยไว้ ${money(passiveIncome(s))} สุทธิ ${money(-gap)} (เหลืออีก ${s.skipTurns} เดือน)`,
            en: `Another month in the classroom: no salary, ${money(totalExpenses(s))} of expenses, ${money(passiveIncome(s))} covered by passive income, net ${money(-gap)} (${s.skipTurns} months to go).`,
          }
        : {
            th: `ว่างงานอีกหนึ่งเดือน ไม่มีเงินเดือนเข้า จ่ายรายจ่าย ${money(totalExpenses(s))} เงินไหลเข้าช่วยไว้ ${money(passiveIncome(s))} สุทธิ ${money(-gap)} (เหลืออีก ${s.skipTurns} ตา)`,
            en: `Another month out of work: no salary, ${money(totalExpenses(s))} of expenses, ${money(passiveIncome(s))} covered by passive income, net ${money(-gap)} (${s.skipTurns} turns to go).`,
          },
      'bad',
    );
    // A month without a job is still a month of instalments. Skipping this left
    // the payments charged and the balances frozen, so being laid off quietly
    // paused every loan in the game.
    amortize(s);
    driftBusinesses(s);
    checkTrouble(s);
    // Months out of work are still months, so an anniversary that falls during
    // one is dealt here rather than waiting for the job to come back.
    claimDue(s);
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
      // Past forty the tile stops asking about a first child and starts asking
      // what the money is for now: a reward for the children who are already
      // here, or the animal that fills the same place for anyone without them.
      s.pending = ageYears(s) >= BABY_MAX_AGE ? { kind: 'reward' } : { kind: 'baby' };
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
    s.credit.cleared += 1;
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
    // Recorded as owed rather than shown as a card, so a fee worth more than the
    // course itself cannot be lost to whatever tile the token lands on.
    s.licenceDue = { routeId: route.id, targetId: st.targetId };
    return;
  }
  switchCareer(s, st.targetId, route);
}

/** Walk into the new job. The wage starts below what the veterans there earn. */
export function switchCareer(s: GameState, targetId: string, route: StudyRoute): void {
  const next = professionById.get(targetId);
  if (!next) return;
  const before = profession(s).name.th;
  s.graduatedFrom = s.professionId;
  s.professionId = targetId;
  s.careerOver = false;
  s.workEndMonth = null;
  s.skipTurns = 0;
  // The slump belonged to the shop that is no longer yours, so it does not
  // follow you into a salaried job.
  s.slumpMonths = 0;
  s.slumpCut = 0;
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
  s.licenceDue = null;
  s.pending = null;
  switchCareer(s, targetId, route);
}

/* ------------------------------------------------------- the family calendar */

/** Children old enough for a school to be charging for them. */
export function schoolChildren(s: GameState): { years: number; scale: number; label: Loc }[] {
  return s.childBorn.map((b) => childStage(s, b)).filter((c) => c.years >= 3);
}

/**
 * One card a year for the whole family rather than one per child. Three
 * children would otherwise mean six interruptions a year, which buys realism
 * with an amount of clicking nobody asked for.
 */
export function birthdayCost(s: GameState): number {
  const card = doodadById.get('x-gift');
  if (!card || s.childBorn.length === 0) return 0;
  const per = card.scale * livingCost(s) * HOUSEHOLD_SHARE;
  return Math.round(s.childBorn.reduce((sum, b) => sum + per * childStage(s, b).scale, 0) / 100) * 100;
}

/** School bills only the children who are actually at school, and by stage. */
export function schoolFee(s: GameState): number {
  const card = doodadById.get('x-school');
  const kids = schoolChildren(s);
  if (!card || kids.length === 0) return 0;
  const per = card.scale * livingCost(s) * HOUSEHOLD_SHARE;
  return Math.round(kids.reduce((sum, c) => sum + per * c.scale, 0) / 100) * 100;
}

/**
 * Anniversaries measured from the first child's arrival. School fees are held
 * half a year away from the birthday so the two never land in the same month.
 */
function markAnnual(s: GameState): void {
  // A policy comes up for renewal on its anniversary whether or not the deck
  // feels like mentioning it. Somebody with no car has nothing to insure.
  if (s.hasCar && s.months >= s.coverRenewMonth) s.coverDue = true;
  const first = s.childBorn[0];
  if (first === undefined) return;
  const since = s.months - first;
  if (since > 0 && since % 12 === 0) s.birthdayDue = true;
  if (since > 6 && (since - 6) % 12 === 0 && schoolChildren(s).length > 0) s.schoolDue = true;
}

/**
 * Turn a waiting decision into a card, but only when the board is otherwise
 * idle, and without clearing the flag. The flag is cleared by whoever answers
 * the card, so a decision raised on a payday that the token merely passed
 * through survives the tile it lands on and comes back at the next opportunity
 * instead of vanishing with the money still uncharged.
 *
 * Order is by weight: losing a salary matters more than a birthday present.
 */
export function claimDue(s: GameState): boolean {
  if (s.pending !== null) return false;
  if (s.retireDue) {
    s.pending = { kind: 'retired' };
    return true;
  }
  if (s.licenceDue) {
    s.pending = { kind: 'licence', routeId: s.licenceDue.routeId, targetId: s.licenceDue.targetId };
    return true;
  }
  if (s.graduatedFrom) {
    s.pending = { kind: 'graduated' };
    return true;
  }
  if (s.coverDue) {
    s.pending = { kind: 'doodad', cardId: 'x-insurance' };
    return true;
  }
  if (s.birthdayDue) {
    s.pending = { kind: 'birthday' };
    return true;
  }
  if (s.schoolDue) {
    s.pending = { kind: 'schoolfee' };
    return true;
  }
  // Last in the queue: it is the only one of these that is an opportunity
  // rather than a bill, so it never pushes ahead of something that is owed.
  if (s.taxFundDue) {
    s.pending = { kind: 'taxfund' };
    return true;
  }
  return false;
}

export function payBirthday(s: GameState): void {
  if (s.pending?.kind !== 'birthday') return;
  const cost = birthdayCost(s);
  s.birthdayDue = false;
  s.cash -= cost;
  note(
    s,
    {
      th: `วันเกิดลูก จ่ายไป ${money(cost)}`,
      en: `Birthdays: ${money(cost)} spent.`,
    },
    'bad',
  );
  s.pending = null;
  checkTrouble(s);
}

export function declineBirthday(s: GameState): void {
  if (s.pending?.kind !== 'birthday') return;
  const card = doodadById.get('x-gift');
  s.birthdayDue = false;
  if (card?.declineNote) note(s, card.declineNote, 'plain');
  s.pending = null;
}

export function paySchool(s: GameState): void {
  if (s.pending?.kind !== 'schoolfee') return;
  const cost = schoolFee(s);
  s.schoolDue = false;
  s.cash -= cost;
  note(
    s,
    {
      th: `เปิดเทอมใหม่ ค่าเทอมลูก ${schoolChildren(s).length} คน รวม ${money(cost)}`,
      en: `A new school year: ${money(cost)} for ${schoolChildren(s).length} at school.`,
    },
    'bad',
  );
  s.pending = null;
  checkTrouble(s);
}

/* --------------------------------------------------- one month of calendar */

/**
 * Everything that happens because a month went by rather than because the
 * player did something. Both paydays and the jobless months go through here, so
 * the calendar advances at one rate no matter what the player is doing.
 */
/**
 * The company's month, run before the player's. It collects its own rent, pays
 * its accountant and its director, settles its own tax, and keeps the rest. The
 * money it keeps is not the player's money yet, which is the entire lesson of
 * the structure.
 */
function corpMonth(s: GameState): void {
  if (!s.incorporated) return;
  const kept = corpRetained(s);
  s.corpCash += kept;
  // The draw is paid whether or not the company earned it, exactly as a real
  // payroll runs. If that empties the account the player sees it go negative
  // and has to either cut their own salary or put money back in.
  if (s.months % 12 === 0 && s.months > 0) {
    note(
      s,
      {
        th: `สรุปปีของบริษัท รายรับ ${money(corpRevenue(s) * 12)} จ่ายเงินเดือนกรรมการ ${money(drawTaken(s) * 12)} ค่าบัญชี ${money(CORP_MONTHLY_COST * 12)} ภาษีนิติบุคคล ${money(corpTaxMonthly(s) * 12)} เหลือสะสมในบริษัท ${money(s.corpCash)}`,
        en: `The company's year: ${money(corpRevenue(s) * 12)} in, ${money(drawTaken(s) * 12)} of director's salary, ${money(CORP_MONTHLY_COST * 12)} of accounting, ${money(corpTaxMonthly(s) * 12)} of corporate tax, and ${money(s.corpCash)} sitting in its account.`,
      },
      kept >= 0 ? 'plain' : 'bad',
    );
  }
}

function monthPassed(s: GameState): void {
  s.months += 1;
  pfMonth(s);
  s.taxFundPot *= 1 + TAXFUND_RETURN / 12;
  dcaMonth(s);
  // December, when the whole country remembers this at once.
  if (s.months > 0 && s.months % 12 === 0) {
    s.taxFundYear = 0;
    if (salary(s) > 0 && taxBill(s).net > 0) s.taxFundDue = true;
  }
  // The bank's file is written one month at a time. A month that closed with
  // money still in the account is a month the bills were met; one that closed
  // overdrawn is the line an underwriter will find years later.
  if (s.cash >= 0) s.credit.onTime += 1;
  else s.credit.late += 1;
  corpMonth(s);
  if (s.bondMonths > 0) s.bondMonths -= 1;
  if (s.slumpMonths > 0) s.slumpMonths -= 1;
  if (s.carCoverMonths > 0) s.carCoverMonths -= 1;
  markAnnual(s);
  advanceStudy(s);
  // Rents are renegotiated once a year and recover only part of what inflation
  // took. Fixed-rate loan payments are not touched at all, which is the quiet
  // gift inflation hands to anyone holding long debt.
  if (s.months % 12 === 0) {
    const step = 1 + INFLATION * RENT_FOLLOW;
    let moved = 0;
    for (const a of s.assets) {
      if (a.kind !== 'property' && a.kind !== 'business') continue;
      // Only something already collecting rent has a rent to raise. Indexing a
      // holding that loses money simply made the loss 3% worse every year and
      // then reported it as "no rent to raise yet".
      if (a.cashflowPerUnit <= 0) continue;
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
  s.workEndMonth = s.months;
  s.retireDue = true;
  pfPayout(s);
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
  // Businesses live on both boards. Running this only on the fast track meant a
  // venture bought during the rat race never grew, never failed and never
  // climbed out of a loss, so the loss-making deals were a trap with no way out.
  driftBusinesses(s);
  checkEscape(s);
  checkTrouble(s);
  checkTier(s);
  claimDue(s);
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
  claimDue(s);
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
      s.pending = { kind: 'fastbonus', cardId: drawFast(s, 'bonus') };
      break;
    case 'setback':
      s.pending = { kind: 'fastsetback', cardId: drawFast(s, 'setback') };
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

/** Which pocket a purchase is being made from. */
export type Buyer = 'me' | 'corp';

export function purseOf(s: GameState, by: Buyer): number {
  return by === 'corp' ? s.corpCash : s.cash;
}

export function maxAffordable(s: GameState, card: DealCard, by: Buyer = 'me'): number {
  const per = dealDown(s, card);
  if (per <= 0) return card.maxQty;
  return Math.max(0, Math.min(card.maxQty, Math.floor(purseOf(s, by) / per)));
}

/** True where a company buying this would actually be the sensible move. */
export function canBuyAsCorp(s: GameState, card: DealCard): boolean {
  return s.incorporated && (card.kind === 'property' || card.kind === 'business');
}

export function buyDeal(s: GameState, qty: number, by: Buyer = 'me'): void {
  if (s.pending?.kind !== 'deal') return;
  const card = dealById.get(s.pending.cardId);
  if (!card) return;
  const buyer: Buyer = by === 'corp' && canBuyAsCorp(s, card) ? 'corp' : 'me';
  const n = Math.max(0, Math.min(qty, maxAffordable(s, card, buyer)));
  if (n === 0) return;

  const per = dealDown(s, card);
  const price = dealPrice(s, card);
  if (buyer === 'corp') s.corpCash -= per * n;
  else s.cash -= per * n;
  if (card.symbol) s.prices[card.symbol] = price;

  // Only traded symbols stack into one holding; two condos stay two condos. A
  // company's holding never stacks onto a personal one: they are two different
  // owners, and merging them would quietly move money between the pockets.
  const existing = card.symbol
    ? s.assets.find(
        (a) => a.cardId === card.id && a.symbol === card.symbol && (a.owner === 'corp') === (buyer === 'corp'),
      )
    : undefined;
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
    if (buyer === 'corp') asset.owner = 'corp';
    s.assets.push(asset);
  }

  const inName = buyer === 'corp' ? { th: 'ในนามบริษัท ', en: ' in the company’s name' } : { th: '', en: '' };
  note(
    s,
    {
      th: `ซื้อ ${card.title.th} ${inName.th}${n > 1 ? `จำนวน ${n} หน่วย ` : ''}จ่ายเงินสด ${money(per * n)}${card.cashflow ? ` ได้เงินไหลเข้าเพิ่มเดือนละ ${money(card.cashflow * n)}` : ''}`,
      en: `Bought ${card.title.en}${n > 1 ? ` ×${n}` : ''}${inName.en} for ${money(per * n)}${card.cashflow ? `, adding ${money(card.cashflow * n)} a month` : ''}.`,
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
  settle(s, a, proceeds);
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

  settle(s, a, proceeds);
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

  settle(s, a, proceeds);
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
  let base = Math.round((card.scale * livingCost(s)) / 100) * 100;
  // The month the gamble is settled. Cover turns a ruinous garage bill into an
  // annoying one, and its absence turns an annoying one into a ruinous one.
  if (card.insurable && s.carCoverMonths > 0) base = Math.round((base * INSURED_SHARE) / 100) * 100;
  if (card.insurableChild && s.childInsured) base = Math.round((base * INSURED_SHARE) / 100) * 100;
  return card.perChild ? Math.round(base * s.children * HOUSEHOLD_SHARE) : base;
}

/** True when this bill is landing on somebody who paid for cover in time. */
export function coveredNow(s: GameState, card: DoodadCard): boolean {
  return (!!card.insurable && s.carCoverMonths > 0) || (!!card.insurableChild && s.childInsured);
}

/** What the bill would have been without a policy, for the dialog to show. */
export function uninsuredCost(s: GameState, card: DoodadCard): number {
  const base = Math.round((card.scale * livingCost(s)) / 100) * 100;
  return card.perChild ? Math.round(base * s.children * HOUSEHOLD_SHARE) : base;
}

export function payDoodad(s: GameState): void {
  if (s.pending?.kind !== 'doodad') return;
  const card = doodadById.get(s.pending.cardId);
  if (!card) return;
  const cost = doodadCost(s, card);
  if (card.social) s.karma += 1;
  if (card.writes) s.wroteBook = true;
  if (card.id === 'x-insurance') {
    s.carCoverMonths = COVER_MONTHS;
    s.coverRenewMonth = s.months + COVER_MONTHS;
    s.coverDue = false;
  }
  // Child cover is a standing premium rather than a year bought at a time: it
  // joins the monthly bill and stays there, which is both how the policies work
  // and the only way a player feels it between the nights it matters.
  if (card.buysChildCover) {
    s.childInsured = true;
    note(
      s,
      {
        th: `ทำประกันสุขภาพให้ลูกแล้ว เบี้ยเดือนละ ${money(profession(s).childCost * priceLevel(s) * CHILD_PREMIUM_RATE * s.children)} จากนี้ค่ารักษาลูกเหลือให้จ่ายเองแค่เศษเดียว`,
        en: `The children are covered, at ${money(profession(s).childCost * priceLevel(s) * CHILD_PREMIUM_RATE * s.children)} a month. From here a hospital night costs a fraction of what it would have.`,
      },
      'plain',
    );
  }
  // The card's own words go through the same filling the dialog uses: a log
  // line is read by the same person, and "ค่ารักษา{petName}" is the kind of
  // thing that only ever shows up once the game is being played.
  const named = fillCard(s, card.title);
  if (cost > 0) {
    s.cash -= cost;
    note(s, { th: `${named.th} จ่ายไป ${money(cost)}`, en: `${named.en}: paid ${money(cost)}.` }, 'bad');
  } else {
    note(s, { th: `${named.th} รอบนี้ไม่มีค่าใช้จ่าย`, en: `${named.en}: nothing to pay this time.` });
  }
  s.pending = null;
  checkTrouble(s);
}

export function takeInstalment(s: GameState): void {
  if (s.pending?.kind !== 'doodad') return;
  const card = doodadById.get(s.pending.cardId);
  if (!card?.instalment) return;
  // Indexed like every other price in the game, or a television quietly became
  // the one thing inflation never touched.
  const other = livingCost(s);
  const balance = Math.round((card.instalment.balanceScale * other) / 100) * 100;
  const payment = Math.round((card.instalment.paymentScale * other) / 100) * 100;
  addDebt(s, 'retail', balance, payment);
  note(
    s,
    {
      th: `ผ่อน ${fillCard(s, card.title).th} หนี้เพิ่ม ${money(balance)} รายจ่ายเพิ่มเดือนละ ${money(payment)}`,
      en: `${fillCard(s, card.title).en} on instalments: ${money(balance)} of debt, ${money(payment)} more per month.`,
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
  if (card.id === 'x-insurance') {
    // Saying no is a decision for this year, not for good: the notice comes
    // again on the same date next year, by which time the gamble may look
    // different.
    s.carCoverMonths = 0;
    s.coverRenewMonth = s.months + COVER_MONTHS;
    s.coverDue = false;
  }
  note(
    s,
    {
      th: `ปฏิเสธ ${fillCard(s, card.title).th} ไม่เสียเงินสักบาท${card.social ? ' แต่น้ำใจลดลง 1' : ''}`,
      en: `Declined ${fillCard(s, card.title).en}: not a baht spent${card.social ? ', but generosity drops by 1' : ''}.`,
    },
    'good',
  );
  if (card.declineNote) note(s, card.declineNote, 'plain');
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

/* ------------------------------------------------- the tile after forty */

/** Which version of the reward this household is looking at. */
export function rewardKind(s: GameState): 'exam' | 'pet' {
  return s.childBorn.length > 0 ? 'exam' : 'pet';
}

/**
 * A one-off, and a happy one for once. The exam version scales with how many
 * children there are to be proud of; the pet version does not, because one dog
 * costs what one dog costs.
 */
export function rewardCost(s: GameState): number {
  const kind = rewardKind(s);
  const base = livingCost(s) * (kind === 'exam' ? REWARD_EXAM_SCALE : REWARD_PET_SCALE);
  const units = kind === 'exam' ? Math.max(1, s.childBorn.length) : 1;
  return Math.round((base * units) / 100) * 100;
}

export function payReward(s: GameState): void {
  if (s.pending?.kind !== 'reward') return;
  const cost = rewardCost(s);
  s.cash -= cost;
  note(
    s,
    rewardKind(s) === 'exam'
      ? { th: `ให้รางวัลลูกที่สอบได้ดี จ่ายไป ${money(cost)}`, en: `A reward for the exam results: ${money(cost)} spent.` }
      : { th: `พา${petPhrase(s).th}ไปหาหมอและซื้อของให้ จ่ายไป ${money(cost)}`, en: `The vet and a few treats for ${petPhrase(s).en}: ${money(cost)} spent.` },
    'bad',
  );
  s.pending = null;
  checkTrouble(s);
}

export function declineReward(s: GameState): void {
  if (s.pending?.kind !== 'reward') return;
  note(
    s,
    rewardKind(s) === 'exam'
      ? {
          th: 'เดือนนี้ยังไม่ไหว บอกลูกไปตรง ๆ ว่าเก่งมากแต่ขอเลื่อนไปก่อน เงินยังอยู่ในบัญชีครบ',
          en: 'Not this month. You tell them straight that you are proud and it will have to wait, and the money stays where it is.',
        }
      : {
          th: 'เดือนนี้ยังไม่ไหว มันคงไม่รู้หรอกว่าเราคิดอะไรอยู่ เงินยังอยู่ในบัญชีครบ',
          en: 'Not this month. It will never know what you were weighing up, and the money stays where it is.',
        },
    'plain',
  );
  s.pending = null;
}

/** What one more child would add to the monthly bill at today's prices. */
/** The household's figure for one more child, and the half of it that is yours. */
export function nextChildCost(s: GameState): number {
  return Math.round(profession(s).childCost * priceLevel(s) * HOUSEHOLD_SHARE);
}

export function nextChildCostGross(s: GameState): number {
  return Math.round(profession(s).childCost * priceLevel(s));
}

export function acceptBaby(s: GameState): void {
  if (s.pending?.kind !== 'baby') return;
  if (s.children >= MAX_CHILDREN) {
    note(s, { th: 'ลูก ๆ โตกันหมดแล้ว รายจ่ายไม่เพิ่ม', en: 'The children are grown; expenses do not change.' });
  } else {
    const first = s.children === 0;
    s.children += 1;
    s.childBorn.push(s.months);
    // The game had been quietly assuming this all along: birthdays, school
    // runs and a household of more than one. It says so now, and it costs what
    // it costs.
    if (first) s.partner = true;
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
  // Nobody can be laid off twice. A player whose salary already ended used to
  // land here and be told they had lost a job they no longer had, complete with
  // ฿0 of severance and turns skipped for a wage that was not coming anyway.
  // What the tile is really offering them is the way back in.
  if (noMoreSalary(s)) {
    const canStudy = studyRoutes.some((r) => canEnrol(s, r));
    note(
      s,
      canStudy
        ? {
            th: 'ข่าวเลิกจ้างรอบนี้ไม่เกี่ยวกับคุณ คุณไม่มีเงินเดือนให้เสียแล้ว ที่ยังเลือกได้คือจะกลับไปเรียนเพื่อมีรายได้ประจำอีกครั้งไหม',
            en: 'This round of layoffs has nothing to take from you: there is no salary left to lose. What is still open is whether to go back and study for another one.',
          }
        : {
            th: 'ข่าวเลิกจ้างรอบนี้ไม่เกี่ยวกับคุณ คุณไม่มีเงินเดือนให้เสียแล้ว และตอนนี้เงินสดยังไม่พอค่าเทอมของหลักสูตรไหนเลย',
            en: 'This round of layoffs has nothing to take from you: there is no salary left to lose, and right now there is not enough cash for the first term of any course.',
          },
      'plain',
    );
    s.pending = canStudy ? { kind: 'career' } : null;
    return;
  }
  // The bill for being jobless is charged month by month over the two skipped
  // turns (see rollDice), not as one lump here, so the player watches it happen.
  // The severance lands up front, which is exactly how it feels: a cushion that
  // looks generous on the day and is gone before the job comes back.
  const shock = careerShock(s, rand(s) < groundingRisk(s));
  const pay = severance(s);
  s.cash += pay;
  if (shock.ends) {
    s.careerOver = true;
    s.workEndMonth = s.months;
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
  s.retireDue = false;
  s.pending = studyRoutes.some((r) => canEnrol(s, r)) ? { kind: 'career' } : null;
}

/** Close the graduation card. The job has already changed; this is the notice. */
export function acceptGraduation(s: GameState): void {
  if (s.pending?.kind !== 'graduated') return;
  s.graduatedFrom = null;
  s.pending = null;
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
  return Math.round((householdIncome(s) * months) / 1000) * 1000;
}

/** The state pays above the assessed value, which is the only good part of it. */
export const EXPROPRIATE_PREMIUM = 1.3;

/** Land held right now, biggest first: what an expropriation would actually take. */
export function landHeld(s: GameState): Asset[] {
  return s.assets
    .filter((a) => a.tag === 'land' && a.qty > 0)
    .sort((a, b) => assetValue(b) - assetValue(a));
}

/**
 * Whether the player owns the thing a card's story is about. A story that
 * assumes tenants, staff or a plot of land is a lie told to anyone who has
 * none, and in the case of the expropriation it was a lie that paid: the same
 * land could be taken again every time the tile came round, whether or not it
 * had ever been bought.
 */
export function fastCardFits(s: GameState, card: FastCard): boolean {
  switch (card.needs) {
    case undefined:
      return true;
    case 'shares':
      return s.assets.some((a) => a.kind === 'stock' && a.qty > 0);
    case 'business':
      return s.assets.some((a) => a.kind === 'business' && a.qty > 0);
    case 'property':
      return s.assets.some((a) => a.kind === 'property' && a.qty > 0);
    case 'tenants':
      return s.assets.some((a) => a.kind === 'property' && a.qty > 0 && a.cashflowPerUnit > 0);
    case 'land':
      return landHeld(s).length > 0;
    case 'debt':
      return totalDebt(s) > 0;
    // The card's own words are "the premiums you paid for years finally proved
    // themselves", which only means anything to somebody who paid them.
    case 'insured':
      return s.carCoverMonths > 0 || s.insuranceCover > 0;
    case 'book':
      return s.wroteBook;
    default:
      return true;
  }
}

/** Draw from a fast deck, skipping any card whose story does not fit this player. */
function drawFast(s: GameState, type: 'bonus' | 'setback'): string {
  const pool = fastCards.filter((c) => c.type === type && fastCardFits(s, c)).map((c) => c.id);
  const allowed = new Set(pool);
  const deck = type === 'bonus' ? s.decks.fastBonus : s.decks.fastSetback;
  const kept = deck.filter((id) => allowed.has(id));
  if (type === 'bonus') s.decks.fastBonus = kept;
  else s.decks.fastSetback = kept;
  return draw(s, kept, pool);
}

/** What a card is worth in cash to this player, so the dialog and the effect agree. */
export function fastCardCash(s: GameState, card: FastCard): number {
  if (card.type === 'bonus' && card.effect === 'expropriate') {
    const plot = landHeld(s)[0];
    if (!plot) return 0;
    return Math.max(0, Math.round(assetValue(plot) * EXPROPRIATE_PREMIUM - plot.debt));
  }
  return fastAmount(s, card.months);
}

/** How much monthly income a setback takes away, as a share of what comes in. */
export function fastIncomeLoss(s: GameState, pct: number): number {
  return Math.round((householdIncome(s) * pct) / 100) * 100;
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
    if (card && card.type === 'bonus' && card.effect === 'expropriate') {
      // Compulsory purchase is a sale you did not agree to. The cheque is real
      // and so is the hole it leaves in the balance sheet.
      const plot = landHeld(s)[0];
      const gain = fastCardCash(s, card);
      if (plot) {
        s.cash += gain;
        s.assets = s.assets.filter((a) => a.uid !== plot.uid);
        note(
          s,
          {
            th: `${card.title.th} รัฐเวนคืน ${plot.name.th} จ่ายค่าทดแทน ${money(gain)} (${Math.round((EXPROPRIATE_PREMIUM - 1) * 100)}% เหนือราคาประเมิน${plot.debt > 0 ? ` และหักหนี้ที่ติดมากับที่ดิน ${money(plot.debt)} ให้แล้ว` : ''}) ที่ดินแปลงนี้ออกจากงบของคุณ`,
            en: `${card.title.en}: ${plot.name.en} was taken for ${money(gain)}, ${Math.round((EXPROPRIATE_PREMIUM - 1) * 100)}% above the assessed value${plot.debt > 0 ? `, with its ${money(plot.debt)} of debt settled out of the payment` : ''}. The plot is off your statement.`,
          },
          'good',
        );
      }
    } else if (card && card.type === 'bonus') {
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
/** Top rate a company pays; the bands that lead up to it are in CORP_BRACKETS. */
export const CORP_TAX_RATE = 0.2;
/** registration, paid-up capital paperwork and the professional fees around it */
export const CORP_SETUP_COST = 50000;
/**
 * Moving a building into a company is a sale to a different legal person, and
 * the Land Department charges for it. This is the toll nobody budgets for, and
 * on a portfolio of any size it dwarfs the registration fee.
 */
export const CORP_TRANSFER_RATE = 0.02;
/**
 * Bookkeeping, the annual audit and the filings, spread over the year. A small
 * company's books run about ฿3,000 a month with the audit and the returns on
 * top, so ฿8,000 covers a company with several properties in it. The old figure
 * here was ฿45,000, set when incorporating was a flat tax swap rather than a
 * structure, and at that price the company could never be worth opening.
 */
export const CORP_MONTHLY_COST = 8000;
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
/** Holdings that would move across on incorporation: the ones a company can run. */
export function transferable(s: GameState): Asset[] {
  return s.assets.filter((a) => !isCorpAsset(a) && (a.kind === 'property' || a.kind === 'business'));
}

/**
 * The monthly difference incorporating would make, computed by actually running
 * both worlds rather than by guessing at a rate.
 *
 * Two things are compared: what the household keeps today, and what it would
 * keep with the buildings and the shops inside a company, paying the player the
 * same salary they draw now. Everything the structure costs is in there: the
 * accountant every month, the company's own tax, and the personal tax on the
 * salary the player takes back out.
 */
export function corpSaving(s: GameState): number {
  if (s.incorporated) return 0;
  const now = passiveIncome(s) - taxes(s);
  const after: GameState = {
    ...s,
    incorporated: true,
    corpDraw: suggestedDraw(s),
    assets: s.assets.map((a) =>
      a.kind === 'property' || a.kind === 'business' ? { ...a, owner: 'corp' as const } : a,
    ),
  };
  // What the household would actually keep: the company's retained profit plus
  // the salary drawn out of it, less the personal tax on that salary. Measured
  // against `corpDistributable` instead this read far worse than the truth,
  // because that figure deliberately assumes the player draws nothing.
  const then = corpRetained(after) + drawTaken(after) + passiveIncome(after) - taxes(after);
  return Math.round(then - now);
}

/**
 * A starting director's salary: enough to cover the life the player is already
 * living, rounded to something a payroll would actually pay. Incorporating and
 * then quietly starving because every baht went into the company is not a
 * lesson, it is a trap.
 */
export function suggestedDraw(s: GameState): number {
  const need = livingCost(s) + housingCost(s) + partnerCost(s) + childExpense(s) + childPremium(s) + debtPayments(s) + insurancePremium(s);
  return Math.ceil(need / 1000) * 1000;
}

/** Registration plus the transfer fees on everything that moves across. */
export function corpSetupTotal(s: GameState): number {
  const moving = transferable(s).reduce((sum, a) => sum + assetValue(a), 0);
  return CORP_SETUP_COST + Math.round(moving * CORP_TRANSFER_RATE);
}

export function incorporate(s: GameState): void {
  const bill = corpSetupTotal(s);
  if (s.incorporated || s.cash < bill) return;
  const moved = transferable(s);
  s.cash -= bill;
  s.incorporated = true;
  s.corpDraw = suggestedDraw(s);
  // Buildings and shops move across, because that is what the company is for.
  // Listed shares stay personal: their dividends are already settled at a flat
  // 10% and a company would only add a second layer of tax on the way out.
  for (const a of moved) a.owner = 'corp';
  s.pending = null;
  note(
    s,
    {
      th: `จดนิติบุคคลแล้ว จ่ายไป ${money(bill)} (ค่าจดทะเบียน ${money(CORP_SETUP_COST)} กับค่าธรรมเนียมโอนทรัพย์สิน ${Math.round(CORP_TRANSFER_RATE * 100)}% อีก ${money(bill - CORP_SETUP_COST)}) โอนทรัพย์สิน ${moved.length} รายการเข้าบริษัท ตั้งเงินเดือนกรรมการไว้ที่ ${money(s.corpDraw)} ปรับได้ตลอด`,
      en: `Incorporated for ${money(bill)}: ${money(CORP_SETUP_COST)} to register and ${money(bill - CORP_SETUP_COST)} of ${Math.round(CORP_TRANSFER_RATE * 100)}% transfer fees on the way in. ${moved.length} holdings moved across, and the director's salary starts at ${money(s.corpDraw)} and can be changed at any time.`,
    },
    'plain',
  );
  checkEscape(s);
  checkTier(s);
}

/** Change the director's salary. The one lever the whole structure turns on. */
export function setDraw(s: GameState, amount: number): void {
  if (!s.incorporated) return;
  s.corpDraw = Math.max(0, Math.round(amount / 1000) * 1000);
  note(
    s,
    {
      th: `ตั้งเงินเดือนกรรมการเป็น ${money(s.corpDraw)} ต่อเดือน ก้อนนี้บริษัทหักเป็นค่าใช้จ่ายได้ แต่คุณต้องเอาไปรวมในเงินได้ประเภท 1 ของตัวเอง`,
      en: `Director's salary set to ${money(s.corpDraw)} a month. The company deducts it before its own tax, and you declare it as type 1 income on yours.`,
    },
    'plain',
  );
  checkEscape(s);
}

/**
 * Take a lump out as a dividend. Unlike the salary, the company cannot deduct
 * it, so this money has already paid corporate tax and pays 10% again on the
 * way out. That second layer is the price of everything the structure saved.
 */
export function payDividend(s: GameState, amount: number): void {
  if (!s.incorporated) return;
  const gross = Math.min(Math.max(0, Math.floor(amount)), Math.floor(Math.max(0, s.corpCash)));
  if (gross <= 0) return;
  const tax = Math.round(gross * DIVIDEND_TAX);
  s.corpCash -= gross;
  s.cash += gross - tax;
  note(
    s,
    {
      th: `จ่ายปันผลจากบริษัทให้ตัวเอง ${money(gross)} หักภาษี ณ ที่จ่าย ${Math.round(DIVIDEND_TAX * 100)}% เป็นเงิน ${money(tax)} เข้ากระเป๋าจริง ${money(gross - tax)} เงินก้อนนี้เสียภาษีมาแล้วสองชั้น`,
      en: `Paid yourself a ${money(gross)} dividend. ${Math.round(DIVIDEND_TAX * 100)}% withheld (${money(tax)}), so ${money(gross - tax)} actually lands in your pocket. This money has now been taxed twice.`,
    },
    'plain',
  );
  checkTier(s);
}

/** Put personal cash into the company, so it can buy something bigger. */
export function fundCompany(s: GameState, amount: number): void {
  if (!s.incorporated) return;
  const value = Math.min(Math.max(0, Math.floor(amount)), Math.floor(Math.max(0, s.cash)));
  if (value <= 0) return;
  s.cash -= value;
  s.corpCash += value;
  note(
    s,
    {
      th: `ใส่เงินเพิ่มทุนเข้าบริษัท ${money(value)} ขาออกไม่เสียภาษี แต่ขากลับเสีย`,
      en: `Put ${money(value)} into the company. Nothing is taxed on the way in; the way out is another matter.`,
    },
    'plain',
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

/* ------------------------------------------------------- the bank's own view */

/**
 * Income a lender will actually put on the form. A payslip is worth its face
 * value; rent and dividends are taken at a haircut, because a tenant can leave
 * and a business can have a bad year, and the underwriter has seen both.
 */
export const PASSIVE_HAIRCUT = 0.7;
/** Debt service the bank will not lend past, as a share of documented income. */
export const DSR_LIMIT = 0.7;
/** Below this nobody in the branch even pauses. */
export const DSR_COMFORT = 0.4;
/** Months a refusal stands before they will look at the file again. */
export const LOAN_COOLDOWN = 2;

export function documentedIncome(s: GameState): number {
  const payslip = salary(s) + pensionIncome(s) + drawTaken(s);
  const rest = (passiveIncome(s) + Math.max(0, corpRetained(s))) * PASSIVE_HAIRCUT;
  return Math.max(0, Math.round(payslip + rest));
}

/**
 * The ceiling is whichever binds first: three months of the bills, or the
 * payment that would take total debt service to the regulatory line. The
 * second one is what makes a big salary worth something at the counter.
 */
export function loanCeiling(s: GameState): number {
  const bank = s.debts.find((d) => d.key === 'bank');
  const byExpenses = (totalExpenses(s) - (bank?.payment ?? 0)) * LOAN_EXPENSE_CAP;
  const room = DSR_LIMIT * documentedIncome(s) - (totalDebtService(s) - (bank?.payment ?? 0));
  const byIncome = Math.max(0, room / LOAN_RATE);
  return Math.round(Math.min(byExpenses, byIncome) / LOAN_STEP) * LOAN_STEP;
}

export function maxBorrow(s: GameState): number {
  return Math.max(0, loanCeiling(s) - bankBalance(s));
}

/** The application is open at all: they have room and are not still refused. */
export function canApplyForLoan(s: GameState): boolean {
  return maxBorrow(s) >= LOAN_STEP && s.months >= s.loanBlockedUntil;
}

export type CreditVerdict = 'good' | 'fair' | 'poor';
export interface CreditFactor {
  id: 'income' | 'dsr' | 'history' | 'buffer';
  verdict: CreditVerdict;
  /** how much of the decision this line moved, in percentage points */
  weight: number;
}
export interface CreditReview {
  income: number;
  /** monthly debt service if this loan were granted */
  service: number;
  dsr: number;
  ceiling: number;
  /** what they would actually hand over today, which may be less than asked */
  offer: number;
  chance: number;
  factors: CreditFactor[];
}

/**
 * The credit decision, from the other side of the desk.
 *
 * Nothing here is a dice roll dressed up as a rule: every line is something the
 * player did and can see. How much documented income there is, how much of it
 * is already committed to debt, how the last few months of bills actually went,
 * and whether the application is being made from an overdrawn account. The dice
 * only decide the marginal cases, which is also how it works in real life.
 */
export function creditReview(s: GameState, amount: number): CreditReview {
  const income = documentedIncome(s);
  const wanted = Math.max(LOAN_STEP, Math.floor(amount / LOAN_STEP) * LOAN_STEP);
  const offer = Math.min(wanted, maxBorrow(s));
  const service = totalDebtService(s) + offer * LOAN_RATE;
  const dsr = income > 0 ? service / income : 1;
  const factors: CreditFactor[] = [];

  let chance = 0.95;
  const bite = (id: CreditFactor['id'], delta: number, good: number, fair: number): void => {
    chance += delta;
    factors.push({ id, weight: Math.round(delta * 100), verdict: delta >= good ? 'good' : delta >= fair ? 'fair' : 'poor' });
  };

  // A payslip is the first thing they look for, and its absence is the loudest
  // thing on the file. Built income softens it: enough of it and the branch is
  // looking at a landlord rather than at somebody with no job.
  const covered = income > 0 && income >= service * 1.8;
  bite('income', noMoreSalary(s) ? (covered ? -0.1 : -0.3) : 0, 0, -0.15);
  bite('dsr', dsr <= DSR_COMFORT ? 0 : -Math.min(0.5, (dsr - DSR_COMFORT) * 1.4), 0, -0.2);

  const late = s.credit.late;
  const record = Math.min(0.1, s.credit.onTime / 150) + Math.min(0.12, s.credit.cleared * 0.06) - Math.min(0.45, late * 0.14);
  bite('history', record, 0.03, -0.1);

  // Applying from an overdrawn account is the worst moment to ask, which is of
  // course exactly when most people ask.
  const buffer = s.cash < 0 ? -0.28 : s.cash >= totalExpenses(s) * 2 ? 0.05 : 0;
  bite('buffer', buffer, 0.01, -0.1);

  return { income, service, dsr, ceiling: loanCeiling(s), offer, chance: Math.min(0.98, Math.max(0.04, chance)), factors };
}

export type LoanOutcome = 'approved' | 'partial' | 'refused' | 'closed';

/**
 * Ask the bank. Approval is not automatic any more: the branch either grants
 * what was asked for, grants the part it is comfortable with, or says no and
 * means it for a couple of months.
 */
export function applyForLoan(s: GameState, amount: number): LoanOutcome {
  if (!canApplyForLoan(s)) return 'closed';
  const review = creditReview(s, amount);
  const wanted = Math.max(LOAN_STEP, Math.floor(amount / LOAN_STEP) * LOAN_STEP);
  if (rand(s) > review.chance) {
    s.credit.refused += 1;
    s.loanBlockedUntil = s.months + LOAN_COOLDOWN;
    note(
      s,
      {
        th: `ธนาคารไม่อนุมัติสินเชื่อ ${money(wanted)} ภาระหนี้ต่อรายได้อยู่ที่ ${Math.round(review.dsr * 100)}% ยื่นใหม่ได้อีกครั้งในอีก ${LOAN_COOLDOWN} เดือน`,
        en: `The bank declined ฿${wanted.toLocaleString('en-US')}. Debt service would have been ${Math.round(review.dsr * 100)}% of documented income. They will look again in ${LOAN_COOLDOWN} months.`,
      },
      'bad',
    );
    checkTrouble(s);
    return 'refused';
  }

  const value = review.offer;
  if (value <= 0) return 'closed';
  s.cash += value;
  addDebt(s, 'bank', value, value * LOAN_RATE);
  note(
    s,
    {
      // Thirteen, not eleven: at 2% a month on the balance, the first payment is
      // only 8% principal and the loan outlives the arithmetic people do in
      // their heads.
      th: `ธนาคารอนุมัติ ${money(value)}${value < wanted ? ` จากที่ขอ ${money(wanted)}` : ''} ผ่อนเดือนละ ${money(value * LOAN_RATE)} ประมาณ 13 เดือนจึงหมด`,
      en: `Approved: ${money(value)}${value < wanted ? ` of the ${money(wanted)} asked for` : ''}, at ${money(value * LOAN_RATE)} a month, clearing in about thirteen months.`,
    },
    'bad',
  );
  checkEscape(s);
  checkTrouble(s);
  return value < wanted ? 'partial' : 'approved';
}

/* --------------------------------------- selling the roof and the wheels */

/**
 * The house and the car can be sold too, and in a bad month they are usually
 * the largest things anybody owns. Leaving them out of the rescue would have
 * the game declare bankruptcy at somebody whose own statement says they own a
 * million baht of property, which is the kind of contradiction a player is
 * right to shout at. Selling the roof means renting from the next month; the
 * car means paying to get about. Both are what really happens.
 */
export type OwnKind = 'home' | 'car';

export function ownsThing(s: GameState, kind: OwnKind): boolean {
  return kind === 'home' ? s.hasHome && homeValue(s) > 0 : s.hasCar && carValue(s) > 0;
}

/**
 * A forced sale of a home or a car does not fetch half price the way a
 * distressed stake in somebody's laundromat does: these are ordinary markets
 * with real buyers, and the discount is the cost of needing the money this
 * month rather than next year.
 */
export const OWN_FIRE_RATE: Record<OwnKind, number> = { home: 0.8, car: 0.75 };

export function ownSale(s: GameState, kind: OwnKind): { price: number; debt: number; raise: number; shortfall: number; newCost: number } {
  const price = kind === 'home' ? homeValue(s) : carValue(s);
  const half = Math.round(price * OWN_FIRE_RATE[kind]);
  const debt = s.debts.find((d) => d.key === kind)?.balance ?? 0;
  // What the alternative will cost from next month, which is the part of this
  // decision that outlives the panic.
  const pay = profession(s).debts.find((d) => d.key === kind)?.payment ?? 0;
  const newCost = Math.round(pay * (kind === 'home' ? RENT_VS_MORTGAGE : COMMUTE_VS_CAR) * priceLevel(s));
  return { price: half, debt, raise: Math.max(0, half - debt), shortfall: Math.max(0, debt - half), newCost };
}

export function sellOwn(s: GameState, kind: OwnKind): void {
  if (!ownsThing(s, kind)) return;
  const { price, raise, shortfall, newCost } = ownSale(s, kind);
  const label = debtLabel(kind);
  s.cash += raise;
  s.debts = s.debts.filter((d) => d.key !== kind);
  if (kind === 'home') s.hasHome = false;
  else {
    s.hasCar = false;
    // No car, no policy, and no renewal notice on its anniversary either.
    s.carCoverMonths = 0;
    s.coverDue = false;
  }
  if (shortfall > 0) {
    const payment = Math.round(shortfall * DEFICIENCY_PAY_RATE);
    addDebt(s, 'bank', shortfall, payment);
  }
  note(
    s,
    {
      th: `ขาย${label.th.replace('ผ่อน', '')}ด่วนได้ ${money(price)}${shortfall > 0 ? ` หักหนี้แล้วยังขาดอีก ${money(shortfall)} ที่ต้องตามใช้ต่อ` : ` เหลือเข้ากระเป๋า ${money(raise)}`} จากนี้มีรายจ่ายใหม่เดือนละ ${money(newCost)}`,
      en: `Sold the ${kind === 'home' ? 'house' : 'car'} in a hurry for ${money(price)}${shortfall > 0 ? `, still ${money(shortfall)} short after the loan` : `, leaving ${money(raise)}`}. From now there is ${money(newCost)} a month to pay instead.`,
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
  if (d.balance <= 0) {
    // A loan seen all the way to the end is the one thing on the file that says
    // more than a payslip does.
    s.credit.cleared += 1;
    s.debts = s.debts.filter((x) => x.key !== key);
  }

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
  return !!a && a.debt > 0 && purseFor(s, a) >= a.debt;
}

export function clearMortgage(s: GameState, assetUid: string): void {
  const a = s.assets.find((x) => x.uid === assetUid);
  if (!a || a.debt <= 0 || purseFor(s, a) < a.debt) return;
  const paid = a.debt;
  settle(s, a, -paid);
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

/**
 * Monthly payment on a deficiency balance, as a share of it. Gentler than the
 * emergency loan on purpose: this is not money anybody chose to borrow, and a
 * tenth of it every month would end the game on the spot rather than teach
 * anything. At 3% against 2% monthly interest it takes about five years, which
 * is roughly how long a real deficiency judgment hangs around.
 */
export const DEFICIENCY_PAY_RATE = 0.03;

export function fireSaleValue(a: Asset, qty: number): number {
  const debtShare = a.qty > 0 ? (a.debt / a.qty) * qty : 0;
  return Math.max(0, a.pricePerUnit * FIRE_SALE_RATE * qty - debtShare);
}

/**
 * What is still owed after the sale, which the bank keeps chasing.
 *
 * Selling a ฿950,000 townhouse carrying ฿902,000 of debt at half price raises
 * ฿475,000. The lender takes all of it and is still ฿427,000 short. The game
 * used to hand the seller ฿0 and delete the whole ฿902,000, which quietly made
 * a fire sale the cheapest way in the game to erase a mortgage.
 */
export function fireSaleShortfall(a: Asset, qty: number): number {
  const debtShare = a.qty > 0 ? (a.debt / a.qty) * qty : 0;
  return Math.max(0, debtShare - a.pricePerUnit * FIRE_SALE_RATE * qty);
}

export function fireSale(s: GameState, assetUid: string, qty: number): void {
  const a = s.assets.find((x) => x.uid === assetUid);
  if (!a) return;
  const n = Math.max(1, Math.min(qty, a.qty));
  const proceeds = fireSaleValue(a, n);
  const shortfall = Math.round(fireSaleShortfall(a, n));
  const debtShare = a.qty > 0 ? (a.debt / a.qty) * n : 0;

  // Selling the company's building pays the company. Getting that money into a
  // personal account still costs a dividend, which is the point: a company is
  // not a wallet you can reach into during a bad month.
  settle(s, a, proceeds);
  a.qty -= n;
  a.debt -= debtShare;
  if (a.qty <= 0) s.assets = s.assets.filter((x) => x.uid !== a.uid);

  const name = { th: a.name.th, en: a.name.en };
  if (shortfall > 0) {
    const payment = Math.round(shortfall * DEFICIENCY_PAY_RATE);
    addDebt(s, 'bank', shortfall, payment);
    note(
      s,
      {
        th: `ขายทอดตลาด ${name.th}${n > 1 ? ` ${n} หน่วย` : ''} ได้ ${money(a.pricePerUnit * FIRE_SALE_RATE * n)} ธนาคารรับไปหักหนี้ทั้งก้อนแต่ยังไม่พอ เหลือส่วนต่างที่ต้องตามใช้ต่อ ${money(shortfall)} ผ่อนเดือนละ ${money(payment)} ทรัพย์ไม่อยู่แล้วแต่หนี้ยังอยู่`,
        en: `${name.en}${n > 1 ? ` ×${n}` : ''} went under the hammer for ${money(a.pricePerUnit * FIRE_SALE_RATE * n)}. The lender took all of it and is still ${money(shortfall)} short, now owed at ${money(payment)} a month. The asset is gone and the debt is not.`,
      },
      'bad',
    );
  } else {
    note(
      s,
      {
        th: `ขายด่วน ${name.th}${n > 1 ? ` ${n} หน่วย` : ''} ที่ครึ่งราคา ได้เงินสด ${money(proceeds)}`,
        en: `Fire-sold ${name.en}${n > 1 ? ` ×${n}` : ''} at half price for ${money(proceeds)}.`,
      },
      'bad',
    );
  }
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
  // The roof and the wheels are sellable too, so nobody is declared bankrupt
  // while their own statement shows a house they could have put on the market.
  const canFireSale = s.assets.length > 0 || ownsThing(s, 'home') || ownsThing(s, 'car');
  // A refusal that still leaves the borrow button working is not a refusal.
  const canBorrowMore = canApplyForLoan(s);
  // Money sitting in the company is still a way out, just an expensive one, so
  // nobody is declared bankrupt while their own company is solvent.
  const canDrawDown = s.incorporated && s.corpCash > 0;
  if (!canFireSale && !canBorrowMore && !canDrawDown) {
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
  const passive = householdIncome(s);
  const hadJob = !noMoreSalary(s);
  // Leaving the job releases the fund, which is the moment most people first
  // find out what it grew into, and what leaving early costs them.
  pfPayout(s);
  s.quit = true;
  s.quitOffered = true;
  if (hadJob) s.workEndMonth = s.months;
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
    hadJob
      ? {
          th: `ลาออกจากงานประจำแล้ว ไม่มีเงินเดือนอีกต่อไป อยู่ด้วยเงินไหลเข้าเดือนละ ${money(passive)} รับเงินก้อนตั้งต้น ${money(bonus)}`,
          en: `You quit. No salary from here, just ${money(passive)} a month of passive income, plus ${money(bonus)} to start with.`,
        }
      : {
          // Nobody to resign to: the salary ended a while ago and the portfolio
          // caught up with the bills on its own.
          th: `ไม่มีงานประจำให้ลาออกอยู่แล้ว แต่เงินไหลเข้าเดือนละ ${money(passive)} เลี้ยงชีวิตคุณได้เองแล้ว ออกจากวงล้อพร้อมเงินก้อนตั้งต้น ${money(bonus)}`,
          en: `There was no job left to resign from. The ${money(passive)} a month you built now covers the life it is paying for, and you leave the wheel with ${money(bonus)} in hand.`,
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
  // Saves from before the company had books of its own. An older save that had
  // already "incorporated" only ever held a flag, so it starts with an empty
  // account and its holdings still in the player's own name; the company's
  // offer to take them over comes round again.
  if (!Number.isFinite(game.corpCash)) game.corpCash = 0;
  if (!Number.isFinite(game.corpDraw) || game.corpDraw < 0) game.corpDraw = 0;
  for (const a of game.assets) {
    if (a.owner !== 'corp') delete a.owner;
  }
  if (!Number.isFinite(game.insuranceCover)) game.insuranceCover = 0;
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
      (stuck.kind === 'deal' && !dealById.has(stuck.cardId)) ||
      (stuck.kind === 'market' && !marketById.has(stuck.cardId)) ||
      (stuck.kind === 'doodad' && !doodadById.has(stuck.cardId)) ||
      ((stuck.kind === 'fastbonus' || stuck.kind === 'fastsetback') && !fastById.has(stuck.cardId));
    if (missing) game.pending = null;
  }
  // The fast track used to have decks and a `payday` card of its own. Nothing
  // raises either any more and neither has a dialog left, so a save paused on
  // one would sit on a card the board cannot draw and cannot dismiss.
  const stale = game.pending as { kind?: string } | null;
  if (stale && (stale.kind === 'fastdeal' || stale.kind === 'payday')) game.pending = null;
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
  if (!Number.isFinite(game.carCoverMonths)) game.carCoverMonths = 0;
  // A save with cover already running keeps it and joins the renewal calendar
  // from where it stands; one that never bought a policy waits for the deck.
  if (!Number.isFinite(game.coverRenewMonth)) {
    game.coverRenewMonth = game.months + Math.max(1, game.carCoverMonths);
  }
  if (typeof game.coverDue !== 'boolean') game.coverDue = false;
  if (typeof game.wroteBook !== 'boolean') game.wroteBook = false;
  // A save with children in it was already living this life; it simply had no
  // word for the other person in the house.
  if (typeof game.partner !== 'boolean') game.partner = game.children > 0;
  if (typeof game.childInsured !== 'boolean') game.childInsured = false;
  if (!Number.isFinite(game.pfRate) || game.pfRate < 0) game.pfRate = 0;
  if (!Number.isFinite(game.pfPot) || game.pfPot < 0) game.pfPot = 0;
  if (!Number.isFinite(game.dcaMonthly) || game.dcaMonthly < 0) game.dcaMonthly = 0;
  if (!Number.isFinite(game.dcaPot) || game.dcaPot < 0) game.dcaPot = 0;
  if (!Number.isFinite(game.dcaPaid) || game.dcaPaid < 0) game.dcaPaid = 0;
  if (!Number.isFinite(game.taxFundPot) || game.taxFundPot < 0) game.taxFundPot = 0;
  if (!Number.isFinite(game.taxFundYear) || game.taxFundYear < 0) game.taxFundYear = 0;
  if (game.taxFundFirst === undefined) game.taxFundFirst = game.taxFundPot > 0 ? game.months : null;
  if (typeof game.taxFundDue !== 'boolean') game.taxFundDue = false;
  if (typeof game.birthdayDue !== 'boolean') game.birthdayDue = false;
  if (typeof game.schoolDue !== 'boolean') game.schoolDue = false;
  if (typeof game.retireDue !== 'boolean') game.retireDue = false;
  if (typeof game.licenceDue !== 'object' || game.licenceDue === null) {
    game.licenceDue = null;
    // A save paused on the old licence card keeps its decision, now as a flag.
    const held = game.pending;
    if (held?.kind === 'licence') game.licenceDue = { routeId: held.routeId, targetId: held.targetId };
  }
  if (typeof game.graduatedFrom !== 'string' || !professionById.has(game.graduatedFrom)) {
    game.graduatedFrom = null;
  }
  // A save from before age had its own field: read it back from whatever the
  // player is doing now, which is right for everyone who never retrained.
  if (!Number.isFinite(game.startAge) || game.startAge <= 0) {
    game.startAge = professionById.get(game.professionId)?.startAge ?? 30;
  }
  // Saves written before the game recorded when the salary stopped. A career
  // that has already ended is treated as having ended at the current month,
  // which is the only guess available and the generous one.
  if (game.workEndMonth === undefined) {
    game.workEndMonth = game.careerOver || game.quit ? game.months : null;
  }
  if (!Number.isFinite(game.entryPay) || game.entryPay <= 0) game.entryPay = 1;
  // Saves from before the car and the house were a choice: they were handed to
  // everybody, so a save that has either loan on it still owns the thing, and
  // one whose loans are already paid off keeps them too rather than suddenly
  // being charged rent for a house it owns outright.
  if (typeof game.hasCar !== 'boolean') {
    game.hasCar = professionById.get(game.professionId)?.debts.some((d) => d.key === 'car') ?? false;
  }
  if (typeof game.hasHome !== 'boolean') {
    game.hasHome = professionById.get(game.professionId)?.debts.some((d) => d.key === 'home') ?? false;
  }
  if (!Number.isFinite(game.loanBlockedUntil)) game.loanBlockedUntil = 0;
  const own = game.ownValue as Partial<GameState['ownValue']> | undefined;
  if (!Number.isFinite(own?.home) || !Number.isFinite(own?.car)) {
    // An old save never recorded what the two things were worth, so they are
    // read back from the loans the profession started with.
    const started = professionById.get(game.professionId)?.debts ?? [];
    game.ownValue = {
      home: game.hasHome ? Math.round((started.find((d) => d.key === 'home')?.balance ?? 0) * 1.25) : 0,
      car: game.hasCar ? Math.round((started.find((d) => d.key === 'car')?.balance ?? 0) * 1.15) : 0,
    };
  }
  const file = game.credit as Partial<GameState['credit']> | undefined;
  game.credit = {
    // An old save has a payment record; it simply was not being written down.
    // Crediting the months already survived is the honest reading of it.
    onTime: Number.isFinite(file?.onTime) ? (file?.onTime ?? 0) : game.months,
    late: Number.isFinite(file?.late) ? (file?.late ?? 0) : 0,
    cleared: Number.isFinite(file?.cleared) ? (file?.cleared ?? 0) : 0,
    refused: Number.isFinite(file?.refused) ? (file?.refused ?? 0) : 0,
  };
  const pet = game.pet as { speciesId?: unknown; name?: { th?: unknown; en?: unknown } } | null | undefined;
  if (!pet || typeof pet.speciesId !== 'string' || typeof pet.name?.th !== 'string' || typeof pet.name?.en !== 'string') {
    game.pet = rollPet(game);
  }
  if (!Array.isArray(game.lastRoll)) game.lastRoll = [];
  if (typeof game.prices !== 'object' || game.prices === null) game.prices = {};
  return game;
}
