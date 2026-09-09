# ============================================================
#   script.js — เปลี่ยนมาใช้ API รายรายการ (แทนการส่งทั้งก้อน)
 #  ============================================================ */
const api = async (url, method = 'GET', body) => {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || 'HTTP ' + res.status);
  return data;
};

## ---------- ปรับสต๊อก: optimistic UI + rollback ---------- */
async function adjustStock( id, delta) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  const prev = p.stock;
  if (prev + delta < 0) return toast('สต๊อกน้อยกว่า 0 ไม่ได้', 'err');

  p.stock = prev + delta;                       // อัปเดตจอทันที
  renderProducts(); renderAlerts();

  try {
    const r = await api(`/api/product/${id}`, 'PATCH', { delta });
    Object.assign(p, r.product);
    if (r.low) toast(`⚠ ${p.name} เหลือ ${p.stock} ชิ้น`, 'err');
    setSync('ok');
  } catch (e) {
    p.stock = prev;                             // rollback
    renderProducts(); renderAlerts();
    toast('ซิงก์ไม่สำเร็จ: ' + e.message, 'err');
    setSync('pending');
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

# ---------- บันทึกสินค้า (เพิ่ม/แก้ไข) ---------- */
async function saveProduct() {
  const name  = document.getElementById('f-name').value.trim();
  const stock = parseInt(document.getElementById('f-stock').value, 10);
  const min   = parseInt(document.getElementById('f-min').value, 10);
  const exp   = document.getElementById('f-exp').value;
  const price = parseFloat(document.getElementById('f-price').value);

  if (!name) return toast('กรุณากรอกชื่อสินค้า', 'err');
  if (!Number.isFinite(stock) || stock < 0) return toast('จำนวนสต๊อกไม่ถูกต้อง', 'err');
  if (!Number.isFinite(min) || min < 1)     return toast('เกณฑ์แจ้งเตือนต้องมากกว่า 0', 'err');
  if (!Number.isFinite(price) || price < 0) return toast('ราคาไม่ถูกต้อง', 'err');

  const payload = { name, stock, min, exp, price };
  try {
    if (editingId) {
      const r = await api(`/api/product/${editingId}`, 'PATCH', payload);
      Object.assign(state.products.find(x => x.id === editingId), r.product);
      toast('บันทึกการแก้ไขแล้ว', 'ok');
    } else {
      const r = await api('/api/product', 'POST', { ...payload, cat: currentCat });
      state.products.push(r.product);
      toast('เพิ่มสินค้าเรียบร้อย', 'ok');
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    closeModal(); renderProducts(); renderAlerts(); setSync('ok');
  } catch (e) {
    toast('บันทึกไม่สำเร็จ: ' + e.message, 'err');
    setSync('pending');
  }
}

# ---------- ลบสินค้า ---------- */
async function deleteProduct() {
  if (!editingId) return;
  const p = state.products.find(x => x.id === editingId);
  if (!confirm(`ลบ "${p?.name}" ใช่หรือไม่?`)) return;
  try {
    await api(`/api/product/${editingId}`, 'DELETE');
    state.products = state.products.filter(x => x.id !== editingId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    closeModal(); renderProducts(); renderAlerts();
    toast('ลบสินค้าแล้ว', 'ok');
  } catch (e) {
    toast('ลบไม่สำเร็จ: ' + e.message, 'err');
  }
}

Object.assign(window, { adjustStock, saveProduct, deleteProduct });