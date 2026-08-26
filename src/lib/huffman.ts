/**
 * Huffman encode/decode แบบตารางไดนามิก (ตารางเดินทางไปพร้อมข้อมูล)
 *
 * โมดูลนี้ทำหน้าที่บีบอัดอย่างเดียว **ไม่ใช่ความปลอดภัย** ตัวที่ทำให้อ่านไม่ออกคือ XOR ใน save.ts
 * ที่ทับทั้งก้อนรวมตาราง (ดู src/lib/obfuscate.ts)

 * หมายเหตุ: เกม CV บน branch feature/cv-game มีสำเนาของไฟล์นี้อยู่ที่ src/lib/cvGame/huffman.ts
 * เนื้อในเหมือนกันทุกบรรทัด ตอนเมิร์จสองสายเข้าด้วยกันให้ยุบเหลือไฟล์นี้ไฟล์เดียว
 *
 * รูปแบบก้อนข้อมูล:
 *   [0]        แฟล็กรูปแบบ 0 = เก็บดิบ, 1 = Huffman
 *   ถ้าเป็น Huffman:
 *   [1..2]     จำนวนสัญลักษณ์ (uint16 big-endian)
 *   [..]       คู่ (ค่าไบต์, ความยาวรหัส) ต่อหนึ่งสัญลักษณ์
 *   [..4]      จำนวนบิตของ payload (uint32 big-endian)
 *   [..]       บิตที่แพ็คแล้ว
 *
 * ใช้รหัสแบบ canonical จึงเก็บแค่ "ความยาวรหัส" ของแต่ละสัญลักษณ์ ไม่ต้องเก็บตัวรหัสจริง
 */

/** ยาวเกินนี้แล้วแพ็คใส่ uint32 ไม่ไหว ให้ถอยไปเก็บดิบแทน (เกิดยากมากกับ JSON จริง) */
const MAX_CODE_LEN = 24;

interface Node {
  freq: number;
  symbol?: number;
  left?: Node;
  right?: Node;
}

function codeLengths(bytes: Uint8Array): Map<number, number> {
  const freq = new Map<number, number>();
  for (const b of bytes) freq.set(b, (freq.get(b) ?? 0) + 1);

  const lengths = new Map<number, number>();
  if (freq.size === 1) {
    // สัญลักษณ์เดียวทั้งก้อน: ต้นไม้ไม่มีกิ่ง กำหนดความยาว 1 บิตไปเลย
    for (const symbol of freq.keys()) lengths.set(symbol, 1);
    return lengths;
  }

  const nodes: Node[] = [...freq].map(([symbol, f]) => ({ freq: f, symbol }));
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq);
    const left = nodes.shift() as Node;
    const right = nodes.shift() as Node;
    nodes.push({ freq: left.freq + right.freq, left, right });
  }

  const walk = (node: Node, depth: number): void => {
    if (node.symbol !== undefined) {
      lengths.set(node.symbol, Math.max(1, depth));
      return;
    }
    if (node.left) walk(node.left, depth + 1);
    if (node.right) walk(node.right, depth + 1);
  };
  walk(nodes[0], 0);
  return lengths;
}

/** สร้างรหัส canonical จากความยาว: เรียงตาม (ความยาว, ค่าไบต์) แล้วไล่เลขขึ้นทีละหนึ่ง */
function canonicalCodes(lengths: Map<number, number>): Map<number, number> {
  const entries = [...lengths].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const codes = new Map<number, number>();
  let code = 0;
  let prevLen = entries.length > 0 ? entries[0][1] : 0;
  for (const [symbol, len] of entries) {
    code <<= len - prevLen;
    prevLen = len;
    codes.set(symbol, code);
    code += 1;
  }
  return codes;
}

export function huffmanEncode(input: Uint8Array): Uint8Array {
  if (input.length === 0) return Uint8Array.from([0]);

  const lengths = codeLengths(input);
  let maxLen = 0;
  for (const len of lengths.values()) maxLen = Math.max(maxLen, len);
  if (maxLen > MAX_CODE_LEN) return raw(input);

  const codes = canonicalCodes(lengths);

  let totalBits = 0;
  for (const b of input) totalBits += lengths.get(b) as number;

  const header = 1 + 2 + lengths.size * 2 + 4;
  const out = new Uint8Array(header + Math.ceil(totalBits / 8));
  out[0] = 1;
  out[1] = (lengths.size >> 8) & 0xff;
  out[2] = lengths.size & 0xff;

  let p = 3;
  for (const [symbol, len] of [...lengths].sort((a, b) => a[1] - b[1] || a[0] - b[0])) {
    out[p++] = symbol;
    out[p++] = len;
  }
  out[p++] = (totalBits >>> 24) & 0xff;
  out[p++] = (totalBits >>> 16) & 0xff;
  out[p++] = (totalBits >>> 8) & 0xff;
  out[p++] = totalBits & 0xff;

  let bitPos = 0;
  for (const b of input) {
    const len = lengths.get(b) as number;
    const code = codes.get(b) as number;
    for (let i = len - 1; i >= 0; i--) {
      const bit = (code >> i) & 1;
      if (bit) out[p + (bitPos >> 3)] |= 0x80 >> (bitPos & 7);
      bitPos++;
    }
  }
  return out;
}

function raw(input: Uint8Array): Uint8Array {
  const out = new Uint8Array(input.length + 1);
  out[0] = 0;
  out.set(input, 1);
  return out;
}

export function huffmanDecode(data: Uint8Array): Uint8Array {
  if (data.length === 0) return new Uint8Array(0);
  if (data[0] === 0) return data.slice(1);
  if (data[0] !== 1) throw new Error('รูปแบบก้อนข้อมูลไม่ถูกต้อง');

  const symbolCount = (data[1] << 8) | data[2];
  if (symbolCount === 0) throw new Error('ตารางรหัสว่าง');

  let p = 3;
  const lengths = new Map<number, number>();
  for (let i = 0; i < symbolCount; i++) {
    const symbol = data[p++];
    const len = data[p++];
    if (len === 0 || len > MAX_CODE_LEN) throw new Error('ความยาวรหัสไม่ถูกต้อง');
    lengths.set(symbol, len);
  }

  const totalBits = ((data[p] << 24) | (data[p + 1] << 16) | (data[p + 2] << 8) | data[p + 3]) >>> 0;
  p += 4;

  const codes = canonicalCodes(lengths);
  // ทำแผนที่กลับ: "ความยาว|รหัส" -> สัญลักษณ์ เพื่อไล่ทีละบิตแล้วเทียบได้ตรง ๆ
  const lookup = new Map<string, number>();
  for (const [symbol, code] of codes) lookup.set(`${lengths.get(symbol)}|${code}`, symbol);

  const out: number[] = [];
  let code = 0;
  let len = 0;
  for (let bit = 0; bit < totalBits; bit++) {
    const byte = data[p + (bit >> 3)];
    code = (code << 1) | ((byte >> (7 - (bit & 7))) & 1);
    len++;
    const hit = lookup.get(`${len}|${code}`);
    if (hit !== undefined) {
      out.push(hit);
      code = 0;
      len = 0;
    }
    if (len > MAX_CODE_LEN) throw new Error('ถอดรหัสไม่สำเร็จ ข้อมูลน่าจะเสีย');
  }
  return Uint8Array.from(out);
}
