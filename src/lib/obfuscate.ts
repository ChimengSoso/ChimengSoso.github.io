/**
 * ตัวห่อค่าใน localStorage ให้อ่านไม่ออกด้วยตาเปล่า
 *
 * **นี่คือ obfuscation ไม่ใช่ security** ห้ามเขียนว่า encrypted ที่ไหนในโค้ดนี้
 * ทั้งตัวถอดและกุญแจ XOR เดินทางไปกับ bundle อยู่แล้ว ใครตั้งใจแกะก็แกะได้เสมอ
 * สิ่งที่มันทำได้จริงมีอย่างเดียวคือ ยกระดับการโกงจาก "ดับเบิลคลิกแล้วพิมพ์เลขใหม่ใน devtools"
 * ไปเป็น "ต้องอ่านซอร์ส เข้าใจรูปแบบ แล้วเขียนตัวเข้ารหัสเอง" ซึ่งเป็นระดับที่ยอมรับได้
 * สำหรับเว็บ static ที่ไม่มีเซิร์ฟเวอร์คอยตัดสิน
 *
 *   เขียน: ข้อความ -> Huffman -> XOR ทั้งก้อน (รวมตาราง) -> base64 -> + "." + checksum
 *   อ่าน : ตรวจ checksum ก่อน ไม่ตรง = ทิ้งทั้งก้อน -> base64 -> XOR -> Huffman -> ข้อความ
 *
 * กุญแจ XOR ผูกกับ "เนมสเปซ" ของแต่ละที่เก็บ ก้อนของเกมหนึ่งจึงเอาไปวางในคีย์ของอีกเกมไม่ได้
 * (checksum จะผ่าน แต่ XOR คนละชุดทำให้ถอด Huffman ไม่ออก และจบที่ null เหมือนข้อมูลเสีย)
 *
 * ห้าม export ฟังก์ชันในไฟล์นี้ขึ้น window เด็ดขาด ไม่งั้นโกงได้จากคอนโซลโดยไม่ต้องแกะโค้ดเลย
 */
import { huffmanDecode, huffmanEncode } from './huffman';

/** กุญแจฐาน ไม่ต้องพยายามซ่อนเป็นพิเศษ เพราะซ่อนยังไงก็อยู่ใน bundle */
const BASE_KEY = Uint8Array.from([0x5a, 0x93, 0x2c, 0xe7, 0x11, 0xb8, 0x4f, 0x6d]);

/** FNV-1a 32 บิต พอสำหรับจับ "มีคนแก้ค่ามือ" ซึ่งเป็นสิ่งเดียวที่ checksum นี้ต้องจับ */
function fnv1a(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function checksum(text: string): string {
  return fnv1a(text).toString(16).padStart(8, '0');
}

/** กุญแจของที่เก็บหนึ่ง ๆ = กุญแจฐาน XOR กับ hash ของชื่อเนมสเปซ */
function keyFor(namespace: string): Uint8Array {
  const h = fnv1a(namespace);
  const key = new Uint8Array(BASE_KEY.length);
  for (let i = 0; i < key.length; i++) {
    key[i] = (BASE_KEY[i] ^ ((h >>> ((i % 4) * 8)) & 0xff)) & 0xff;
  }
  return key;
}

function xorInPlace(bytes: Uint8Array, key: Uint8Array): Uint8Array {
  for (let i = 0; i < bytes.length; i++) bytes[i] ^= key[i % key.length];
  return bytes;
}

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromBase64(text: string): Uint8Array {
  const s = atob(text);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

/** ห่อข้อความหนึ่งก้อน (ปกติคือ JSON.stringify มาแล้ว) ให้พร้อมเขียนลง localStorage */
export function packStore(namespace: string, text: string): string {
  const packed = huffmanEncode(new TextEncoder().encode(text));
  const payload = toBase64(xorInPlace(packed, keyFor(namespace)));
  return `${payload}.${checksum(payload)}`;
}

/**
 * คลายก้อนกลับเป็นข้อความเดิม
 * คืน null เมื่อค่าหาย เสีย ถูกแก้มือ หรือมาจากเนมสเปซอื่น ทุกกรณีแปลว่า "ไม่มีข้อมูล"
 */
export function unpackStore(namespace: string, blob: string | null): string | null {
  if (!blob) return null;
  const dot = blob.lastIndexOf('.');
  if (dot < 1) return null;

  const payload = blob.slice(0, dot);
  if (checksum(payload) !== blob.slice(dot + 1)) return null;

  try {
    return new TextDecoder().decode(huffmanDecode(xorInPlace(fromBase64(payload), keyFor(namespace))));
  } catch {
    return null;
  }
}

/**
 * อ่านค่าจาก localStorage แบบรองรับของเก่าที่ยังเป็นข้อความดิบ
 *
 * ค่าที่บันทึกไว้ก่อนหน้านี้ทั้งหมดเป็น JSON ล้วน การทิ้งมันไปเฉย ๆ เท่ากับลบเซฟของคนที่เล่นค้างไว้
 * จึงลองคลายก่อน ถ้าไม่ผ่านค่อยรับของเก่าไปหนึ่งครั้ง แล้วปล่อยให้การเซฟครั้งถัดไปเขียนทับเป็นแบบใหม่เอง
 */
export function readStore(namespace: string, key: string): string | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return null; // โหมดส่วนตัวของบางเบราว์เซอร์โยน error ตอนแตะ localStorage
  }
  if (!raw) return null;
  const unpacked = unpackStore(namespace, raw);
  if (unpacked !== null) return unpacked;
  // ของเก่า: ยอมรับเฉพาะที่หน้าตาเป็น JSON จริง ๆ กันไม่ให้ค่าที่คนพิมพ์มั่วผ่านเข้าไป
  const trimmed = raw.trim();
  const looksLikeJson =
    (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'));
  return looksLikeJson ? raw : null;
}

/** เขียนค่าลง localStorage แบบห่อแล้ว เขียนไม่ได้ก็เงียบ ไม่ควรทำให้หน้าเว็บพัง */
export function writeStore(namespace: string, key: string, text: string): void {
  try {
    localStorage.setItem(key, packStore(namespace, text));
  } catch {
    /* พื้นที่เต็มหรือถูกบล็อก ไม่คุ้มที่จะขัดจังหวะผู้ใช้ */
  }
}
