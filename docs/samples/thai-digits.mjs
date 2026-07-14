const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙';
const ARABIC_DIGITS = '0123456789';
const thaiToArabicMap = {};
const arabicToThaiMap = {};
for (let i = 0; i < THAI_DIGITS.length; i++) {
  thaiToArabicMap[THAI_DIGITS[i]] = ARABIC_DIGITS[i];
  arabicToThaiMap[ARABIC_DIGITS[i]] = THAI_DIGITS[i];
}
export function thaiToArabic(str){return str.replace(/[๐-๙]/g,(d)=>thaiToArabicMap[d]);}
export function arabicToThai(str){return str.replace(/[0-9]/g,(d)=>arabicToThaiMap[d]);}
console.assert(thaiToArabic('')==='','empty');
console.assert(thaiToArabic('ราคา ๑๒๓ บาท (v2)')==='ราคา 123 บาท (v2)','mixed');
console.assert(thaiToArabic('๐๑๒๓๔๕๖๗๘๙')==='0123456789','full');
console.assert(arabicToThai('0123456789')==='๐๑๒๓๔๕๖๗๘๙','full2');
const s='เลข ๙๘๗๖๕๔๓๒๑๐ ปี';
console.assert(arabicToThai(thaiToArabic(s))===s,'roundtrip');
console.log('ALL ASSERTIONS PASSED');
