const MONTHS: readonly string[] = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const MONTHS_SHORT: readonly string[] = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
  'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.',
  'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

function parseISO(iso: string): { day: number; month: number; year: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { day: d, month: m, year: y };
}

/** "1 กรกฎาคม 2026" — full Thai month name, CE year. */
export function formatThaiDate(iso: string): string {
  const { day, month, year } = parseISO(iso);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** "1 ก.ค. 2026" — abbreviated Thai month, CE year. */
export function formatThaiDateShort(iso: string): string {
  const { day, month, year } = parseISO(iso);
  return `${day} ${MONTHS_SHORT[month - 1]} ${year}`;
}

/** true เมื่อเป็นวันที่ที่มีอยู่จริงในรูป YYYY-MM-DD (กัน 2026-02-31 ที่ Date.parse ยอมรับ) */
export function isISODate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const { day, month, year } = parseISO(iso);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

/**
 * ตรวจคู่วันที่เผยแพร่/อัปเดตของหนึ่งรายการตอน build: ทั้งคู่ต้องเป็นวันที่จริง
 * และวันอัปเดตต้องไม่มาก่อนวันเผยแพร่ `at` คือชื่อรายการสำหรับข้อความ error
 */
export function assertDatePair(at: string, dateISO: string, updatedISO?: string): void {
  if (!isISODate(dateISO))
    throw new Error(`${at}: dateISO "${dateISO}" ต้องเป็นวันที่จริงในรูป YYYY-MM-DD`);
  if (updatedISO === undefined) return;
  if (!isISODate(updatedISO))
    throw new Error(`${at}: updatedISO "${updatedISO}" ต้องเป็นวันที่จริงในรูป YYYY-MM-DD`);
  if (updatedISO < dateISO)
    throw new Error(`${at}: updatedISO ${updatedISO} มาก่อน dateISO ${dateISO} วันอัปเดตต้องไม่ก่อนวันเผยแพร่`);
}
