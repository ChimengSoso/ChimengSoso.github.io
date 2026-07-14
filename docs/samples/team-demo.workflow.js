export const meta = {
  name: 'team-demo',
  description: 'Boss delegates a tiny coding task to a dev, a QA agent reviews, loop feedback until approved, boss hands off',
  phases: [
    { title: 'Plan', detail: 'boss breaks the task into a spec' },
    { title: 'Build+QA', detail: 'dev writes code, QA reviews, loop until approved' },
    { title: 'Handoff', detail: 'boss summarizes the delivery' },
  ],
}

// The task the "boss" is given. Small, self-contained, but riddled with edge cases
// a first-pass implementation typically misses — so the QA feedback loop has teeth.
const TASK = `Write a single JavaScript module (ES modules) exporting one pure function:
- formatThousands(n): takes a JavaScript number and returns a string with commas as
  thousands separators. It MUST correctly handle: positive integers (1234567 -> "1,234,567"),
  NEGATIVE numbers (the minus sign stays in front: -1234 -> "-1,234"), and DECIMALS
  (only the integer part is grouped, the fractional part is left untouched:
  1234.5678 -> "1,234.5678"). Zero -> "0".
Include inline console.assert tests at the bottom covering all of the above, including a
negative decimal like -1234567.89 -> "-1,234,567.89".`

const SPEC_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: 'one-line restatement of the goal' },
    acceptance: { type: 'array', items: { type: 'string' }, description: '3-5 concrete acceptance criteria the QA will check' },
    devBrief: { type: 'string', description: 'a short brief handed to the dev agent' },
  },
  required: ['summary', 'acceptance', 'devBrief'],
}

const QA_SCHEMA = {
  type: 'object',
  properties: {
    approved: { type: 'boolean' },
    verdict: { type: 'string', description: 'one-line overall verdict' },
    issues: { type: 'array', items: { type: 'string' }, description: 'concrete problems found; empty if approved' },
  },
  required: ['approved', 'verdict', 'issues'],
}

// --- Phase 1: Boss plans ---
phase('Plan')
const spec = await agent(
  `You are the TEAM LEAD. A stakeholder asked for this task:\n\n${TASK}\n\n` +
  `Restate the goal in one line, list 3-5 concrete acceptance criteria your QA teammate will verify, ` +
  `and write a short brief for your dev teammate. Do not write the code yourself.`,
  { label: 'boss:plan', phase: 'Plan', schema: SPEC_SCHEMA, effort: 'low' }
)
log(`Boss set ${spec.acceptance.length} acceptance criteria`)

// --- Phase 2: dev -> QA feedback loop ---
phase('Build+QA')
let code = ''
let lastQa = null
const rounds = []
const MAX_ROUNDS = 3

for (let round = 1; round <= MAX_ROUNDS; round++) {
  const feedbackBlock = lastQa
    ? `\n\nYour previous attempt was REJECTED by QA. Fix these issues:\n- ${lastQa.issues.join('\n- ')}\n\nHere is your previous code:\n${code}`
    : ''

  // Round 1 is a rushed first draft (realistic dev-under-deadline behavior), so the
  // QA feedback loop has something genuine to catch. Later rounds fix it properly.
  const draftMode = round === 1
    ? `\n\nIMPORTANT: This is a QUICK FIRST DRAFT under time pressure. Write the SIMPLEST ` +
      `possible one-liner: apply the comma regex directly to String(n). Do NOT special-case ` +
      `the minus sign or the decimal part yet — just ship the fast naive version now and let QA ` +
      `tell you what breaks. Only write the tests for positive integers for now.`
    : `\n\nNow implement it PROPERLY and robustly, addressing every issue QA raised.`

  code = await agent(
    `You are the DEV. Implement this brief:\n${spec.devBrief}\n\n` +
    `Acceptance criteria:\n- ${spec.acceptance.join('\n- ')}` +
    draftMode +
    feedbackBlock +
    `\n\nReturn ONLY the complete JavaScript module source, no prose, no markdown fences.`,
    { label: `dev:round${round}`, phase: 'Build+QA', effort: 'low' }
  )

  lastQa = await agent(
    `You are a STRICT QA / tester. Review this JavaScript against the acceptance criteria.\n` +
    `Criteria:\n- ${spec.acceptance.join('\n- ')}\n\nCode under review:\n${code}\n\n` +
    `Mentally EXECUTE the code on each of these exact inputs and compare to the expected output: ` +
    `1234567, -1234, 1234.5678, 0, and especially -1234567.89 (expected "-1,234,567.89"). ` +
    `Common bug: a naive comma-insertion regex mangles the minus sign or inserts commas into the ` +
    `decimal part — check for that specifically. Approve ONLY if every single input produces the ` +
    `exact expected string. If any input is wrong, REJECT with the concrete failing input(s).`,
    { label: `qa:round${round}`, phase: 'Build+QA', schema: QA_SCHEMA, effort: 'low' }
  )

  rounds.push({ round, approved: lastQa.approved, verdict: lastQa.verdict, issues: lastQa.issues })
  log(`Round ${round}: QA ${lastQa.approved ? 'APPROVED ✓' : 'REJECTED ✗'} — ${lastQa.verdict}`)
  if (lastQa.approved) break
}

// --- Phase 3: Boss hands off ---
phase('Handoff')
const handoff = await agent(
  `You are the TEAM LEAD. Your dev and QA finished after ${rounds.length} round(s). ` +
  `Final QA verdict: ${lastQa.approved ? 'APPROVED' : 'NOT APPROVED after max rounds'}.\n` +
  `QA history: ${JSON.stringify(rounds)}\n\n` +
  `Write a short Thai handoff note to the stakeholder (Chi): what was built, whether it passed QA, ` +
  `how many feedback rounds it took, and any caveat. Friendly, concise.`,
  { label: 'boss:handoff', phase: 'Handoff', effort: 'low' }
)

return { spec, rounds, approved: lastQa.approved, finalCode: code, handoff }
