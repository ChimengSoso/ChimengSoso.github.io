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
