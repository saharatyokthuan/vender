# 🥤 Vending Stock Manager

ระบบจัดการสต๊อกตู้จำหน่ายสินค้าอัตโนมัติ — ทำงานแบบ **Offline-first** บนเบราว์เซอร์
เก็บข้อมูลในเครื่องผ่าน `localStorage` ไม่ต้องติดตั้ง ไม่ต้องใช้เซิร์ฟเวอร์ (ไม่มี build step และไม่มี package ที่ต้องติดตั้ง)

🔗 **ใช้งานออนไลน์:** https://saharatyokthuan.github.io/vender/

---

## ✨ ฟีเจอร์

| ฟีเจอร์ | รายละเอียด |
|---|---|
| 📦 จัดการสินค้า | เพิ่ม / แก้ไข / ลบ พร้อมปุ่ม `＋` `－` ปรับสต๊อกเร็ว |
| 🗂️ หมวดหมู่ | เพิ่ม / แก้ไข / ลบหมวดหมู่ (ชื่อ + ไอคอน emoji) แสดงจำนวนรายการและจำนวนสินค้าใกล้หมดในแต่ละหมวด (ลบหมวดได้เมื่อไม่มีสินค้าในหมวดนั้น) |
| ⚠️ แจ้งเตือนอัตโนมัติ | สต๊อกต่ำกว่าหรือเท่ากับเกณฑ์ที่ตั้งไว้ (รวมกรณีสต๊อกหมด) · หมดอายุแล้ว |
| 📊 สรุปยอด | จำนวนชิ้นของสินค้าแต่ละรายการ รวมต่อหมวด และสต๊อกทั้งหมด |
| 💾 สำรอง / กู้คืน | Export & Import ไฟล์ JSON (`vending-stock-backup.json`) |
| 📱 Responsive | ออกแบบสำหรับมือถือ (max-width 420px) |

---

## 📁 โครงสร้างไฟล์

```
vender/
├── index.html          # หน้าเว็บหลัก (หน้าหมวดหมู่ / สินค้า / สรุปยอด และ modal)
├── script.js           # ตรรกะทั้งหมดของแอป (เก็บข้อมูลใน localStorage)
├── style.css           # สไตล์ และโหลดฟอนต์จาก Google Fonts
├── server.py           # ไม่ได้ถูกใช้งาน — ดูหมายเหตุด้านล่าง
├── .github/workflows/
│   └── datadog-synthetics.yml  # GitHub Actions รัน Datadog Synthetic tests
└── README.md           # ไฟล์นี้
```

> **หมายเหตุเรื่อง `server.py`:** แม้นามสกุลเป็น `.py` แต่เนื้อหาเป็นโค้ด JavaScript (ฟังก์ชัน `api()` เรียก `fetch` ไปที่ `/api/product`)
> ซึ่งรันเป็น Python ไม่ได้ และ `index.html` ไม่ได้โหลดไฟล์นี้ (โหลดเฉพาะ `style.css` และ `script.js`) จึงไม่มีผลต่อการทำงานของแอป
> และแอปไม่เรียก API ใด ๆ

---

## 🚀 วิธีใช้งาน

### ออนไลน์
เปิด https://saharatyokthuan.github.io/vender/

### ในเครื่อง
เปิดไฟล์ `index.html` ในเบราว์เซอร์ได้ทันที — หรือรันผ่าน local server:

```bash
python -m http.server 8000
# → http://localhost:8000
```

(คำสั่งนี้ใช้เซิร์ฟเวอร์สำเร็จรูปของ Python เพื่อเสิร์ฟไฟล์ static เท่านั้น ไม่เกี่ยวกับ `server.py`)

---

## 🛠 เทคโนโลยี

- HTML / CSS / JavaScript (vanilla) — ไม่มี framework
- `localStorage` สำหรับเก็บข้อมูล (key: `vending_stock_data_v1`)
- Google Fonts (โหลดผ่าน `@import` ใน `style.css`): Niramit, Pattaya, BBH Bogle, Orbitron, Share Tech Mono — ต้องมีอินเทอร์เน็ตจึงจะโหลดฟอนต์ได้ (ถ้าไม่มี แอปยังทำงานได้ด้วยฟอนต์สำรอง)
