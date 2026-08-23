/**
 * The arithmetic behind "ล่าช่องว่างภาษี".
 *
 * Every function here is pure: give it a Profile and a TaxYearRules and it
 * hands back numbers. Nothing reads the DOM, nothing reads storage, and no
 * function mutates its arguments — which is what makes it safe for the UI to
 * recompute the whole board on every keystroke.
 *
 * The one thing worth knowing before reading: a slot's ceiling is never a
 * single number. It is the smallest of a flat cap in the law, a share of gross
 * income, and whatever is left in a pot shared with other slots. `headroomFor`
 * keeps all three and reports which one is doing the squeezing, because "RMF
 * 30%, of what exactly?" is the question this whole game exists to answer.
 */
import { rulesFor } from './rules';
import type {
  Headroom,
  BindingCap,
  Profile,
  Score,
  SlotDef,
  SlotId,
  TaxResult,
  TaxYearRules,
} from './types';

/** Money is whole baht everywhere. Half-baht answers help nobody. */
const baht = (n: number): number => Math.round(n);

const clamp = (n: number, lo: number, hi: number): number => Math.min(Math.max(n, lo), hi);

/** เงินได้พึงประเมิน: gross employment income for the year, before anything. */
export function assessableIncome(profile: Profile): number {
  return baht(Math.max(0, profile.monthlySalary) * 12 + Math.max(0, profile.bonus));
}

/**
 * Employee social-security contribution for the year, derived rather than
 * asked for: it is 5% of monthly wage capped at a 15,000 wage, so 750 a month
 * for anyone earning that or more. Most people never claim it because it never
 * occurred to them that the line on their payslip was a deduction.
 */
export function socialSecurityPaid(profile: Profile, rules: TaxYearRules): number {
  const { rate, monthlyWageCap, yearlyCap } = rules.socialSecurity;
  const monthly = Math.min(Math.max(0, profile.monthlySalary), monthlyWageCap) * rate;
  return baht(Math.min(monthly * 12, yearlyCap));
}

/**
 * What sits in every slot before any ceiling is applied: the facts of the
 * player's life filled in for them, plus whatever they have chosen to buy.
 *
 * Anything derivable is derived here rather than being another box to fill in.
 * That is the whole "กรอกไม่เยอะ" promise: one salary figure and a handful of
 * toggles produce a complete return.
 */
export function rawAmounts(profile: Profile, rules: TaxYearRules): Record<SlotId, number> {
  const perHead = (id: SlotId, heads: number): number => {
    const slot = rules.slots.find((s) => s.id === id);
    if (!slot?.perHead) return 0;
    return slot.perHead.amount * clamp(Math.floor(heads), 0, slot.perHead.maxHeads);
  };
  const chosen = (id: SlotId): number => Math.max(0, profile.amounts[id] ?? 0);

  return {
    personal: 60_000,
    spouse: profile.hasSpouseNoIncome ? 60_000 : 0,
    children: perHead('children', profile.childrenBefore2561),
    childrenLater: perHead('childrenLater', profile.childrenFrom2561),
    maternity: chosen('maternity'),
    parents: perHead('parents', profile.parentsInCare),
    disabled: perHead('disabled', profile.disabledInCare),
    socialSecurity: socialSecurityPaid(profile, rules),
    homeLoanInterest: chosen('homeLoanInterest'),
    rmf: chosen('rmf'),
    pvd: chosen('pvd'),
    nsf: chosen('nsf'),
    pensionInsurance: chosen('pensionInsurance'),
    thaiEsg: chosen('thaiEsg'),
    lifeInsurance: chosen('lifeInsurance'),
    healthInsurance: chosen('healthInsurance'),
    parentHealthInsurance: chosen('parentHealthInsurance'),
    socialEnterprise: chosen('socialEnterprise'),
    politicalDonation: chosen('politicalDonation'),
  };
}

/**
 * The two ceilings that depend on nothing but the slot, the income, and how
 * many heads the player has.
 *
 * A slot counted by head has no ceiling the player could aim at: the law gives
 * 30,000 per parent, so the ceiling for someone caring for two parents is
 * 60,000 and there is no way to buy a third. Reporting the theoretical maximum
 * for that slot instead would print a headroom the player can never use.
 */
function ownCaps(
  slot: SlotDef,
  gross: number,
  claimed: number,
): { statutoryCap: number; incomeCap: number } {
  const statutoryCap = slot.perHead ? claimed : (slot.statutory ?? Infinity);
  const incomeCap = slot.incomeShare === undefined ? Infinity : baht(slot.incomeShare * gross);
  return { statutoryCap, incomeCap };
}

/**
 * How much of a shared pot the other members have already taken.
 *
 * Members are served in the order `pot.members` lists them, so the answer is
 * deterministic: a slot competes only with the members ahead of it. On screen
 * this is the mechanic — push RMF up and the pension-insurance bar visibly
 * shrinks, because RMF is served first.
 */
function potTakenBefore(
  slot: SlotDef,
  rules: TaxYearRules,
  gross: number,
  raw: Record<SlotId, number>,
): number {
  const pot = rules.pots.find((p) => p.id === slot.pot);
  if (!pot) return 0;
  let taken = 0;
  for (const memberId of pot.members) {
    if (memberId === slot.id) break;
    const member = rules.slots.find((s) => s.id === memberId);
    if (!member) continue;
    const { statutoryCap, incomeCap } = ownCaps(member, gross, raw[memberId]);
    const room = Math.max(0, pot.cap - taken);
    taken += Math.min(raw[memberId], statutoryCap, incomeCap, room);
  }
  return taken;
}

/** The three ceilings, the winner, and what is left, for one slot. */
export function headroomFor(
  slot: SlotDef,
  profile: Profile,
  rules: TaxYearRules,
  raw: Record<SlotId, number>,
): Headroom {
  const gross = assessableIncome(profile);
  const { statutoryCap, incomeCap } = ownCaps(slot, gross, raw[slot.id]);
  const pot = rules.pots.find((p) => p.id === slot.pot);
  const potCap = pot ? Math.max(0, pot.cap - potTakenBefore(slot, rules, gross, raw)) : Infinity;

  const effectiveCap = Math.min(statutoryCap, incomeCap, potCap);
  // Ties are common and the order matters: a life-insurance premium whose
  // statutory ceiling and untouched shared pot are both 100,000 must not be
  // reported as pot-limited, or the player goes hunting for a competitor that
  // is not there. Blame the pot only when it is genuinely the tightest.
  let binding: BindingCap = 'none';
  if (effectiveCap === incomeCap && slot.incomeShare !== undefined) binding = 'income';
  else if (effectiveCap === statutoryCap && Number.isFinite(statutoryCap)) binding = 'statutory';
  else if (effectiveCap === potCap && pot) binding = 'pot';

  const used = Math.min(raw[slot.id], effectiveCap);
  return {
    slot,
    statutoryCap,
    incomeCap,
    potCap,
    effectiveCap,
    binding,
    used,
    left: Math.max(0, effectiveCap - used),
  };
}

/** Every slot's readout, in the order the rules table lists them. */
export function allHeadroom(profile: Profile, rules: TaxYearRules): Headroom[] {
  const raw = rawAmounts(profile, rules);
  return rules.slots.map((slot) => headroomFor(slot, profile, rules, raw));
}

/** Tax on a net income, walked step by step so the ladder can be drawn. */
export function taxOn(netIncome: number, rules: TaxYearRules): TaxResult['steps'] {
  const steps: TaxResult['steps'] = [];
  let floor = 0;
  for (const bracket of rules.brackets) {
    const taxable = Math.max(0, Math.min(netIncome, bracket.upTo) - floor);
    steps.push({
      from: floor,
      to: bracket.upTo,
      rate: bracket.rate,
      taxable,
      tax: baht(taxable * bracket.rate),
    });
    floor = bracket.upTo;
    if (netIncome <= bracket.upTo) break;
  }
  return steps;
}

/** The rate the next baht of deduction would claw back. */
export function marginalRate(netIncome: number, rules: TaxYearRules): number {
  let floor = 0;
  for (const bracket of rules.brackets) {
    if (netIncome > floor && netIncome <= bracket.upTo) return bracket.rate;
    floor = bracket.upTo;
  }
  return 0;
}

/**
 * Cost one profile end to end.
 *
 * Order matters in exactly one place and it is easy to get backwards:
 * donations are capped at 10% of income *after* the expense deduction and
 * every other allowance, so they have to be settled last. Give the donation
 * its cap too early and the answer comes out too generous.
 */
export function computeTax(profile: Profile, rules: TaxYearRules = rulesFor(profile.year)): TaxResult {
  const gross = assessableIncome(profile);
  const employmentExpense = baht(
    Math.min(gross * rules.employmentExpense.share, rules.employmentExpense.cap),
  );

  const allowances = allHeadroom(profile, rules).reduce((sum, h) => sum + h.used, 0);
  const donationBase = Math.max(0, gross - employmentExpense - allowances);
  const donationCap = baht(donationBase * rules.donationShareOfBase);
  const donationClaimed =
    Math.max(0, profile.donationGeneral) +
    Math.max(0, profile.donationEDonation) * rules.donationMultiplierEDonation;
  const donationAllowed = Math.min(donationClaimed, donationCap);

  const netIncome = Math.max(0, donationBase - donationAllowed);
  const steps = taxOn(netIncome, rules);
  const tax = steps.reduce((sum, s) => sum + s.tax, 0);

  return {
    assessableIncome: gross,
    employmentExpense,
    allowances,
    donationBase,
    donationCap,
    donationAllowed,
    netIncome,
    tax,
    marginalRate: marginalRate(netIncome, rules),
    steps,
  };
}

/**
 * The same player, before they spent anything this year.
 *
 * Only the slots the budget pays for are cleared. Interest already handed to a
 * bank, or a child already born, is not part of the decision being scored, and
 * clearing it would move the yardstick: the comparison would credit the plan
 * for a deduction the player already had, and the exempt band would appear
 * further away than it really is.
 */
function beforeSpending(profile: Profile, rules: TaxYearRules): Profile {
  const amounts: Profile['amounts'] = {};
  for (const slot of rules.slots) {
    if (!slot.costsCash && profile.amounts[slot.id]) {
      amounts[slot.id] = profile.amounts[slot.id];
      continue;
    }
    // A fund bought in March is spent money too. It belongs on the same side
    // of the line as the mortgage interest: part of where the player already
    // stands, not part of the decision being scored.
    const already = paidInto(profile, slot.id);
    if (already > 0) amounts[slot.id] = already;
  }
  return { ...profile, amounts, donationGeneral: 0, donationEDonation: 0 };
}

/** What a slot already held before this planning session, never more than it holds now. */
function paidInto(profile: Profile, id: SlotId): number {
  return clamp(Math.max(0, profile.paid?.[id] ?? 0), 0, Math.max(0, profile.amounts[id] ?? 0));
}

/** Slots the player pays for out of this year's budget. */
export function buyableSlots(rules: TaxYearRules): SlotDef[] {
  return rules.slots.filter((s) => s.costsCash);
}

/**
 * The most deduction that is worth buying at all.
 *
 * Deductions push net income down one baht at a time, so once net income
 * reaches the top of the exempt band the next baht saves nothing. Any cash
 * committed past that point is simply spent. This is the line the plan stops
 * at, and it is why a large budget on a modest salary is left partly unspent.
 */
function usefulDeduction(profile: Profile, rules: TaxYearRules): number {
  const exemptTop = rules.brackets.filter((b) => b.rate === 0).pop()?.upTo ?? 0;
  return Math.max(0, computeTax(profile, rules).netIncome - exemptTop);
}

/**
 * The best the budget could possibly have done.
 *
 * For tax alone the answer is dull and worth saying out loud: every deductible
 * baht is worth exactly the same, whichever slot it goes in, so the most tax a
 * budget can save is simply the tax on deploying min(budget, total headroom).
 * That is why the game does not score slot choice against tax at all.
 *
 * What separates a good move from a bad one is what is left of the money
 * afterwards, so par fills the highest-retention slots first: RMF units stay
 * yours, an insurance premium mostly does not. The returned plan is the
 * allocation that hits par while keeping the most capital.
 *
 * It also refuses to spend past `usefulDeduction`. A button labelled "the best
 * you could do" that talks the player into a premium after their tax already
 * hit zero is giving bad advice, however good the arithmetic underneath is.
 */
export function bestPlan(
  profile: Profile,
  rules: TaxYearRules = rulesFor(profile.year),
): { plan: Partial<Record<SlotId, number>>; deployed: number; retained: number } {
  // Seeded with what the player already holds, so a fund bought in March is a
  // floor the plan builds on instead of an allocation it is free to undo.
  const plan: Partial<Record<SlotId, number>> = { ...profile.amounts };
  let budgetLeft = Math.min(Math.max(0, profile.budget), usefulDeduction(profile, rules));
  let deployed = 0;
  let retained = 0;

  const order = [...buyableSlots(rules)].sort(
    (a, b) => (b.retention ?? 0) - (a.retention ?? 0),
  );

  // Headroom is recomputed after each slot is filled, so a shared pot drains as
  // the plan is built instead of being counted twice.
  for (const slot of order) {
    if (budgetLeft <= 0) break;
    const trial: Profile = { ...profile, amounts: { ...plan } };
    const raw = rawAmounts(trial, rules);
    const room = headroomFor(slot, trial, rules, raw).left;
    const put = Math.min(room, budgetLeft);
    if (put <= 0) continue;
    plan[slot.id] = (plan[slot.id] ?? 0) + put;
    budgetLeft -= put;
    deployed += put;
    retained += put * (slot.retention ?? 0);
  }

  return { plan, deployed, retained: baht(retained) };
}

/** How the player did, against doing nothing and against playing perfectly. */
export function scoreProfile(profile: Profile, rules: TaxYearRules = rulesFor(profile.year)): Score {
  const unspent = beforeSpending(profile, rules);
  const baseline = computeTax(unspent, rules);
  const played = computeTax(profile, rules);

  const { plan, retained } = bestPlan(unspent, rules);
  const best = computeTax({ ...unspent, amounts: { ...unspent.amounts, ...plan } }, rules);

  // Donations are not slots, but they still come out of the same wallet, so
  // they belong in the budget accounting like anything else the player buys.
  const donated = Math.max(0, profile.donationGeneral) + Math.max(0, profile.donationEDonation);
  // An e-Donation deducts at double what it cost, so its deduction and its
  // price are different numbers. Comparing one against the other lets a
  // doubled donation cancel out real waste somewhere else, so work out how
  // much donation *cash* the cap actually absorbed. The doubled baht buys the
  // most deduction per baht spent, so it fills the cap first.
  const eDonated = Math.max(0, profile.donationEDonation);
  const eDeducted = Math.min(eDonated * rules.donationMultiplierEDonation, played.donationCap);
  const donationCashUsed = baht(
    eDeducted / rules.donationMultiplierEDonation +
      Math.min(Math.max(0, profile.donationGeneral), played.donationCap - eDeducted),
  );
  const cashSpent =
    buyableSlots(rules).reduce((sum, s) => sum + Math.max(0, profile.amounts[s.id] ?? 0), 0) +
    donated;
  // The budget is what is left to commit, so it is only ever charged for money
  // that has not left the account yet.
  const alreadyPaid = buyableSlots(rules).reduce((sum, s) => sum + paidInto(profile, s.id), 0);
  const newCashSpent = Math.max(0, cashSpent - alreadyPaid);
  // Only this year's purchases, because the tax saving it is scored beside is
  // also only this year's. Crediting a fund bought in March on one side of the
  // comparison but not the other would hand out free marks.
  const capitalRetained = baht(
    buyableSlots(rules).reduce(
      (sum, s) =>
        sum +
        Math.max(0, Math.max(0, profile.amounts[s.id] ?? 0) - paidInto(profile, s.id)) *
          (s.retention ?? 0),
      0,
    ),
  );

  const cashRows = allHeadroom(profile, rules).filter((h) => h.slot.costsCash);
  const headroomUnused = cashRows.reduce((sum, h) => sum + h.left, 0);
  // Legal room and useful room are different sizes, and only one of them is
  // worth acting on: past the exempt band the ladder has nothing left to give,
  // so a slot's remaining ceiling stops meaning anything.
  const usefulRoomLeft = Math.min(headroomUnused, usefulDeduction(profile, rules));
  /** Of the cash committed, the deduction the return will actually grant. */
  const deductibleSpent =
    cashRows.reduce((sum, h) => sum + h.used, 0) + played.donationAllowed;
  /** The same thing measured in cash, which is what an over-spend is made of. */
  const cashAccepted = cashRows.reduce((sum, h) => sum + h.used, 0) + donationCashUsed;

  const taxSaved = baseline.tax - played.tax;
  const bestSaving = baseline.tax - best.tax;

  return {
    baselineTax: baseline.tax,
    playedTax: played.tax,
    bestTax: best.tax,
    taxSaved,
    bestSaving,
    cashSpent,
    capitalRetained,
    headroomUnused,
    usefulRoomLeft,
    overBudget: Math.max(0, newCashSpent - Math.max(0, profile.budget)),
    alreadyPaid,
    // Two different leaks, and telling the player the wrong one is worse than
    // telling them nothing: money above a slot's ceiling never becomes a
    // deduction at all, while money below the exempt band is a real deduction
    // that simply has no tax left to remove.
    overCap: Math.max(0, cashSpent - cashAccepted),
    wasted: Math.max(0, deductibleSpent - usefulDeduction(unspent, rules)),
    // Par counts the money kept as well as the tax dodged, so stuffing the
    // budget into a premium the player did not want cannot score full marks.
    percentOfPar:
      bestSaving + retained <= 0
        ? 100
        : clamp(Math.round(((taxSaved + capitalRetained) / (bestSaving + retained)) * 100), 0, 100),
  };
}

/** Thai baht, grouped, no decimals. */
export const money = (n: number): string => Math.round(n).toLocaleString('th-TH');

/** A cap that the law never wrote down reads better as a dash than as ∞. */
export const capText = (n: number): string => (Number.isFinite(n) ? money(n) : 'ไม่จำกัด');
