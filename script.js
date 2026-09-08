/* ===== OFFLINE DATA LAYER (localStorage — works as a plain file, no backend) ===== */
const STORAGE_KEY = 'vending_stock_data_v1';
let hasPersistence = false;

let categories = [
  {id:1,name:'เครื่องดื่ม',icon:'🥤'},
  {id:2,name:'ขนม',icon:'🍪'},
  {id:3,name:'บะหมี่กึ่งสำเร็จรูป',icon:'🍜'},
  {id:4,name:'ของใช้',icon:'🧴'},
  {id:5,name:'ขนมหวาน',icon:'🍭'},
];
let products = [
  {id:1,category_id:1,name:'น้ำเปล่า 600ml',stock:24,min_stock:6,expiry_date:'2026-12-01',price:7},
  {id:2,category_id:1,name:'ชาเขียวโออิชิ',stock:5,min_stock:6,expiry_date:'2026-08-20',price:20},
  {id:3,category_id:2,name:'เลย์รสดั้งเดิม',stock:12,min_stock:5,expiry_date:'2026-09-15',price:20},
  {id:4,category_id:3,name:'มาม่าต้มยำกุ้ง',stock:2,min_stock:5,expiry_date:'2026-07-20',price:8},
  {id:5,category_id:4,name:'ทิชชู่เปียก',stock:8,min_stock:3,expiry_date:null,price:15}
];
let currentCatId=null,editingProdId=null,editingCatId=null;

function nextId(list){ return list.length ? Math.max(...list.map(x=>x.id))+1 : 1; }

async function loadData(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const d = JSON.parse(raw);
      if(d.categories) categories = d.categories;
      if(d.products) products = d.products;
    }
    hasPersistence = true;
    document.getElementById('hdr-status').textContent = 'OFFLINE • บันทึกอัตโนมัติ';
  }catch(e){
    // localStorage unavailable (e.g. some in-app browsers) — runs in-memory only for this session
    hasPersistence = false;
    document.getElementById('hdr-status').textContent = 'OFFLINE • ข้อมูลชั่วคราว';
  }
}
async function saveData(){
  if(!hasPersistence) return;
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify({categories,products}));
  }catch(e){ /* silently ignore — data still lives in memory for this session */ }
}

function decorateProduct(p){
  const today = new Date().toISOString().slice(0,10);
  return {...p, is_expired: !!(p.expiry_date && p.expiry_date < today), is_low: p.stock <= p.min_stock};
}
function getCategoriesStats(){
  return categories.map(c=>{
    const cp = products.filter(p=>p.category_id===c.id).map(decorateProduct);
    return {...c, total: cp.length, low_stock: cp.filter(p=>p.is_low).length};
  });
}
function getProducts(catId){
  let list = catId==null ? products : products.filter(p=>p.category_id===catId);
  return list.map(decorateProduct);
}
function getAlerts(){
  const d = products.map(decorateProduct);
  return { low_stock: d.filter(p=>p.is_low && !p.is_expired), expiring: d.filter(p=>p.is_expired) };
}

/* ===== UI ===== */
let _tt;
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(_tt);_tt=setTimeout(()=>t.classList.remove('show'),2000)}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active')}

async function goHome(){showScreen('screen-home');loadCategories();loadAlerts()}

function loadCategories(){
  const cats = getCategoriesStats();
  const grid = document.getElementById('cat-grid');
  if(!cats.length){grid.innerHTML='<div class="loading" style="grid-column:1/-1">ยังไม่มีหมวดหมู่ กด + เพิ่มหมวดหมู่</div>';return}
  grid.innerHTML = cats.map(c=>`<div class="cat-btn" onclick="goProducts(${c.id})">
    <button class="cat-edit-btn" onclick="event.stopPropagation();openEditCategoryModal(${c.id})">✏</button>
    <span class="cat-icon">${c.icon}</span><span class="cat-name">${c.name}</span><span class="cat-count">${c.total} รายการ</span>${c.low_stock>0?`<span class="cat-warn">⚠ ใกล้หมด ${c.low_stock}</span>`:''}
  </div>`).join('');
}

function loadAlerts(){
  const a = getAlerts();
  const total = a.low_stock.length + a.expiring.length;
  const badge = document.getElementById('alert-badge');
  document.getElementById('alert-count').textContent = total;
  badge.style.display = total>0 ? 'block' : 'none';
  const list = document.getElementById('alert-list');
  const rows = [...a.low_stock.map(x=>`<div class="alert-item"><span>${x.name}</span><span class="a-tag">เหลือ ${x.stock}/${x.min_stock}</span></div>`),
                ...a.expiring.map(x=>`<div class="alert-item expired"><span>${x.name}</span><span class="a-tag">หมด ${x.expiry_date}</span></div>`)];
  list.innerHTML = rows.length ? rows.join('') : '<div style="font-size:11px;color:var(--muted)">ไม่มีการแจ้งเตือน ✓</div>';
}
function toggleAlerts(){document.getElementById('alert-panel').classList.toggle('open')}

async function goProducts(catId){
  const cat = categories.find(c=>c.id===catId);
  if(!cat) return;
  currentCatId=catId;
  document.getElementById('prod-eyebrow').textContent=cat.icon+' '+cat.name;
  document.getElementById('prod-title').innerHTML=cat.name+'<span> สต๊อก</span>';
  showScreen('screen-products');loadProducts();
}

function loadProducts(){
  const prods = getProducts(currentCatId);
  const list = document.getElementById('prod-list');
  if(!prods.length){list.innerHTML='<div class="loading">ยังไม่มีสินค้า กด + เพิ่มสินค้า</div>';return}
  list.innerHTML = prods.map(p=>{
    const cls = p.is_expired?'expired':p.is_low?'low':'';
    const numCls = p.stock===0?'critical':p.is_low?'low':'';
    const expCls = p.is_expired?'bad':p.expiry_date?'warn':'ok';
    const expTxt = p.expiry_date?(p.is_expired?' หมดอายุ ':'▶')+p.expiry_date:'—';
    return `<div class="prod-card ${cls}" onclick="openEditModal(${p.id})"><div class="prod-name">${p.name}</div><div class="prod-meta">฿${p.price} &nbsp;<span class="prod-exp ${expCls}">${expTxt}</span></div><div class="stock-ctrl"><button class="s-btn" onclick="event.stopPropagation();changeStock(${p.id},1)">＋</button><div class="stock-num ${numCls}">${p.stock}</div><button class="s-btn" onclick="event.stopPropagation();changeStock(${p.id},-1)">－</button></div></div>`;
  }).join('');
}

async function changeStock(pid,delta){
  const p = products.find(x=>x.id===pid);
  if(!p) return;
  p.stock = Math.max(0, p.stock + delta);
  await saveData();
  loadProducts();loadAlerts();
  toast(delta>0?'＋ เพิ่มสต๊อก':'－ ลดสต๊อก');
}

function openAddModal(){
  editingProdId=null;
  document.getElementById('modal-title').textContent='+ เพิ่มสินค้า';
  document.getElementById('delete-row').style.display='none';
  ['f-name','f-stock','f-min','f-exp','f-price'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('f-min').value='3';document.getElementById('f-stock').value='0';
  document.getElementById('modal').classList.add('open');
}
function openEditModal(pid){
  const p = products.find(x=>x.id===pid);
  if(!p) return;
  editingProdId=p.id;
  document.getElementById('modal-title').textContent='✏ แก้ไขสินค้า';
  document.getElementById('delete-row').style.display='flex';
  document.getElementById('f-name').value=p.name;
  document.getElementById('f-stock').value=p.stock;
  document.getElementById('f-min').value=p.min_stock;
  document.getElementById('f-exp').value=p.expiry_date||'';
  document.getElementById('f-price').value=p.price;
  document.getElementById('modal').classList.add('open');
}
function closeModal(){document.getElementById('modal').classList.remove('open')}

async function saveProduct(){
  const data = {
    name: document.getElementById('f-name').value.trim(),
    stock: parseInt(document.getElementById('f-stock').value)||0,
    min_stock: parseInt(document.getElementById('f-min').value)||3,
    expiry_date: document.getElementById('f-exp').value||null,
    price: parseFloat(document.getElementById('f-price').value)||0,
    category_id: currentCatId
  };
  if(!data.name){toast('⚠ กรุณาใส่ชื่อสินค้า');return}
  if(editingProdId){
    const idx = products.findIndex(p=>p.id===editingProdId);
    if(idx>-1) products[idx] = {...products[idx], ...data};
    toast('✓ บันทึกแล้ว');
  }else{
    data.id = nextId(products);
    products.push(data);
    toast('✓ เพิ่มสินค้าแล้ว');
  }
  await saveData();
  closeModal();loadProducts();loadAlerts();
}

async function deleteProduct(){
  if(editingProdId==null) return;
  if(!confirm('ยืนยันลบสินค้านี้?')) return;
  products = products.filter(p=>p.id!==editingProdId);
  await saveData();
  closeModal();loadProducts();loadAlerts();
  toast('🗑 ลบสินค้าแล้ว');
}

/* ===== Category CRUD ===== */
function openAddCategoryModal(){
  editingCatId=null;
  document.getElementById('modal-cat-title').textContent='+ เพิ่มหมวดหมู่';
  document.getElementById('delete-cat-row').style.display='none';
  document.getElementById('fc-name').value='';
  document.getElementById('fc-icon').value='';
  document.getElementById('modal-cat').classList.add('open');
}
function openEditCategoryModal(cid){
  const c = categories.find(x=>x.id===cid);
  if(!c) return;
  editingCatId=c.id;
  document.getElementById('modal-cat-title').textContent='✏ แก้ไขหมวดหมู่';
  document.getElementById('delete-cat-row').style.display='flex';
  document.getElementById('fc-name').value=c.name;
  document.getElementById('fc-icon').value=c.icon;
  document.getElementById('modal-cat').classList.add('open');
}
function closeCatModal(){document.getElementById('modal-cat').classList.remove('open')}

async function saveCategory(){
  const name = document.getElementById('fc-name').value.trim();
  const icon = document.getElementById('fc-icon').value.trim() || '📦';
  if(!name){toast('⚠ กรุณาใส่ชื่อหมวดหมู่');return}
  if(editingCatId){
    const idx = categories.findIndex(c=>c.id===editingCatId);
    if(idx>-1) categories[idx] = {...categories[idx], name, icon};
    toast('✓ บันทึกแล้ว');
  }else{
    categories.push({id: nextId(categories), name, icon});
    toast('✓ เพิ่มหมวดหมู่แล้ว');
  }
  await saveData();
  closeCatModal();loadCategories();
}

async function deleteCategory(){
  if(editingCatId==null) return;
  const hasProducts = products.some(p=>p.category_id===editingCatId);
  if(hasProducts){ toast('⚠ ลบสินค้าในหมวดนี้ก่อน'); return; }
  if(!confirm('ยืนยันลบหมวดหมู่นี้?')) return;
  categories = categories.filter(c=>c.id!==editingCatId);
  await saveData();
  closeCatModal();loadCategories();
  toast('🗑 ลบหมวดหมู่แล้ว');
}

async function goSummary(){
  showScreen('screen-summary');
  const cats = getCategoriesStats();
  const prods = getProducts(null);
  const box = document.getElementById('sum-content');
  let total=0;
  const cards = cats.map(c=>{
    const cp = prods.filter(p=>p.category_id===c.id);
    const t = cp.reduce((s,p)=>s+p.stock,0);
    total+=t;
    return `<div class="sum-card"><div class="sum-cat">${c.icon} ${c.name}</div>${cp.map(p=>`<div class="sum-row"><span>${p.name}</span><span style="color:${p.stock<=p.min_stock?'var(--amber)':'var(--text)'}">${p.stock} ชิ้น</span></div>`).join('')}<div class="sum-row total-row"><span>รวม</span><span>${t} ชิ้น</span></div></div>`;
  }).join('');
  box.innerHTML = `<div class="sum-total-box"><div class="sum-total-lbl">สต๊อกทั้งหมด</div><div class="sum-total-num">${total}</div><div style="font-size:10px;color:var(--muted);margin-top:4px;letter-spacing:2px">รายการ</div></div>${cards}`;
}

/* ===== Manual backup / restore ===== */
function exportData(){
  const blob = new Blob([JSON.stringify({categories,products},null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'vending-stock-backup.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('⭳ สำรองข้อมูลแล้ว');
}
function importData(evt){
  const file = evt.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async ()=>{
    try{
      const d = JSON.parse(reader.result);
      if(d.categories) categories = d.categories;
      if(d.products) products = d.products;
      await saveData();
      goHome();
      toast('⭱ นำเข้าข้อมูลแล้ว');
    }catch(e){ toast('⚠ ไฟล์ไม่ถูกต้อง'); }
  };
  reader.readAsText(file);
  evt.target.value='';
}

(async()=>{ await loadData(); goHome(); })();
