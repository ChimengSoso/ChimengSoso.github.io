# ChimengSoso.github.io

เว็บไซต์ส่วนตัวของ ChimengSoso — เว็บ: https://chimengsoso.github.io

ภายในมีหน้าโปรไฟล์ส่วนตัว และหมวด "ความรู้" (`/knowledge`) ที่รวมเรื่องเล่าจากสายพัฒนา และเกร็ดความรู้อื่น ๆ ที่แวะเวียนผ่านมาเป็นภาษาไทย

## วิธีใช้งาน (รันบนเครื่องตัวเอง)

```bash
npm install
npm run dev
```

แล้วเปิด `http://localhost:4321`

คำสั่งอื่น ๆ:
- `npm run build` — build เว็บสำหรับ production
- `npm run preview` — เปิดดูผลลัพธ์หลัง build

## การ deploy

Push/merge เข้า branch `master` แล้วเว็บจะ deploy ขึ้น GitHub Pages ให้อัตโนมัติผ่าน GitHub Actions งานประจำวันให้ทำบน branch `develop` แล้วค่อยเปิด PR ไป `master` ตอนพร้อมเผยแพร่
