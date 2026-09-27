// หน้าการขาย — Sales Recording & Receipt Component
import { appState } from '../state.js';
import { formatThaiDate, formatBaht, showToast, openGlobalModal, closeGlobalModal } from '../helpers.js';

// ---- LocalStorage key for direct product sales ----
const DIRECT_SALES_KEY = 'herb_enterprise_direct_sales_v1';

function getDirectSales() {
  try {
    return JSON.parse(localStorage.getItem(DIRECT_SALES_KEY)) || [];
  } catch { return []; }
}

function saveDirectSales(sales) {
  localStorage.setItem(DIRECT_SALES_KEY, JSON.stringify(sales));
}

function generateSaleId() {
  const sales = getDirectSales();
  const maxNum = sales.reduce((max, s) => {
    const n = parseInt((s.id || '').replace('SALE-DS-', '')) || 0;
    return n > max ? n : max;
  }, 0);
  return `SALE-DS-${String(maxNum + 1).padStart(4, '0')}`;
}

// ---- Thai helpers ----
const THAI_MONTHS = ['','มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

function toThaiDateLong(dateStr) {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d)} ${THAI_MONTHS[parseInt(m)]} พ.ศ. ${parseInt(y) + 543}`;
}

function toThaiDateTime(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  const date = toThaiDateLong(d.toISOString().split('T')[0]);
  const h = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${date}  เวลา ${h}:${mi} น.`;
}

export const SalesComponent = {
  searchQuery: '',
  filterMonth: '',

  render() {
    const currentUser = appState.getCurrentUser();
    const enterprise = appState.getEnterprise();
    const products = appState.getProducts();
    const customers = appState.getCustomers ? appState.getCustomers() : [];
    const members   = appState.getMembers();
    const sales = getDirectSales();

    // Filter
    let filtered = sales.filter(s => {
      const q = this.searchQuery.toLowerCase();
      if (q && !(
        (s.id||'').toLowerCase().includes(q) ||
        (s.customerName||'').toLowerCase().includes(q) ||
        (s.sellerName||'').toLowerCase().includes(q) ||
        (s.productName||'').toLowerCase().includes(q)
      )) return false;
      if (this.filterMonth && !(s.date||'').startsWith(this.filterMonth)) return false;
      return true;
    });

    // Totals
    const totalRevenue = filtered.reduce((s, x) => s + (x.totalPrice || 0), 0);
    const totalQty     = filtered.reduce((s, x) => s + (x.quantity || 0), 0);

    // Summary cards
    const todaySales = sales.filter(s => s.date === new Date().toISOString().split('T')[0]);
    const todayRevenue = todaySales.reduce((s, x) => s + (x.totalPrice || 0), 0);
    const allRevenue   = sales.reduce((s, x) => s + (x.totalPrice || 0), 0);

    const summaryHtml = `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="rounded-2xl bg-emerald-700 text-white p-5 flex items-start justify-between shadow-md">
          <div>
            <span class="text-xs font-bold opacity-75 uppercase tracking-wider block">รายได้วันนี้</span>
            <div class="text-3xl font-black mt-1 tabular-nums">${formatBaht(todayRevenue)}</div>
            <span class="text-xs opacity-70">${todaySales.length} รายการ</span>
          </div>
          <div class="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-xl"><i class="fas fa-sun"></i></div>
        </div>
        <div class="rounded-2xl bg-sky-700 text-white p-5 flex items-start justify-between shadow-md">
          <div>
            <span class="text-xs font-bold opacity-75 uppercase tracking-wider block">รายได้รวมทั้งหมด</span>
            <div class="text-3xl font-black mt-1 tabular-nums">${formatBaht(allRevenue)}</div>
            <span class="text-xs opacity-70">${sales.length} รายการทั้งหมด</span>
          </div>
          <div class="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-xl"><i class="fas fa-cash-register"></i></div>
        </div>
        <div class="rounded-2xl bg-indigo-700 text-white p-5 flex items-start justify-between shadow-md">
          <div>
            <span class="text-xs font-bold opacity-75 uppercase tracking-wider block">สินค้าในคลัง</span>
            <div class="text-3xl font-black mt-1 tabular-nums">${products.length}</div>
            <span class="text-xs opacity-70">รายการสินค้าพร้อมขาย</span>
          </div>
          <div class="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-xl"><i class="fas fa-boxes-stacked"></i></div>
        </div>
      </div>
    `;

    // Product options
    const productOptions = products.map(p =>
      `<option value="${p.id}" data-price="${p.price}" data-unit="${p.unit}" data-stock="${p.stock}">
        ${p.name} (${p.price.toLocaleString()} บาท/${p.unit}) — คงเหลือ ${p.unit === 'กก.' ? p.stock.toFixed(2) : p.stock} ${p.unit}
      </option>`
    ).join('');

    // Customer options
    const customerOptions = customers.map(c =>
      `<option value="${c.name}">${c.name} (${c.customerType || ''})</option>`
    ).join('');

    // Member options for seller
    const sellerOptions = members.map(m =>
      `<option value="${m.name}" ${currentUser && currentUser.name === m.name ? 'selected' : ''}>${m.name} (${m.role})</option>`
    ).join('');

    // Today's date
    const today = new Date().toISOString().split('T')[0];

    // Unique months for filter
    const months = [...new Set(sales.map(s => (s.date||'').substring(0,7)))].sort().reverse();

    // Table rows
    const tableRowsHtml = filtered.length === 0
      ? `<tr><td colspan="7" class="py-14 text-center">
           <div class="flex flex-col items-center gap-2 text-gray-400">
             <i class="fas fa-receipt text-4xl opacity-30"></i>
             <p class="text-sm font-bold text-gray-500">ยังไม่มีรายการขาย</p>
             <p class="text-xs">กรอกแบบฟอร์มด้านบนเพื่อบันทึกการขายครั้งแรก</p>
           </div>
         </td></tr>`
      : [...filtered].reverse().map(s => {
          const isCan  = (s.unit === 'กระป๋อง');
          const isKg   = (s.unit === 'กก.');
          const unitColor = isCan ? 'bg-teal-50 text-teal-800 border-teal-200' : isKg ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200';
          return `
            <tr class="border-b border-gray-100 last:border-0 hover:bg-emerald-50/20 transition-colors group">
              <td class="py-3.5 px-4">
                <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 font-black text-emerald-700 text-xs">
                  <i class="fas fa-hashtag text-[10px]"></i>${s.id}
                </span>
              </td>
              <td class="py-3.5 px-4">
                <div class="text-sm font-bold text-gray-900">${toThaiDateLong(s.date)}</div>
                <div class="text-[10px] text-gray-400">${s.createdAt ? new Date(s.createdAt).toLocaleTimeString('th-TH', {hour:'2-digit',minute:'2-digit'}) + ' น.' : ''}</div>
              </td>
              <td class="py-3.5 px-4">
                <div class="font-bold text-gray-900 text-sm">${s.productName}</div>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded border ${unitColor}">${s.unit}</span>
              </td>
              <td class="py-3.5 px-4 text-center">
                <div class="font-black text-gray-800 text-base tabular-nums">${s.quantity.toLocaleString()}</div>
                <div class="text-[10px] text-gray-400">${s.unit}</div>
              </td>
              <td class="py-3.5 px-4 text-right">
                <div class="font-bold text-gray-600 text-sm">${formatBaht(s.unitPrice)}/${s.unit}</div>
              </td>
              <td class="py-3.5 px-4 text-right">
                <div class="text-lg font-black text-emerald-700 tabular-nums">${formatBaht(s.totalPrice)}</div>
              </td>
              <td class="py-3.5 px-4">
                <div class="font-bold text-gray-800 text-sm">${s.customerName || '-'}</div>
                <div class="text-[10px] text-gray-400">${s.sellerName ? 'โดย: '+s.sellerName : ''}</div>
              </td>
              <td class="py-3.5 px-4 text-right">
                <div class="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button class="download-direct-sale-pdf-btn px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1 transition-all"
                    data-id="${s.id}" title="ดาวน์โหลดเป็นไฟล์ PDF">
                    <i class="fas fa-file-pdf text-red-600 text-[11px]"></i> PDF
                  </button>
                  <button class="view-direct-sale-btn px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-all"
                    data-id="${s.id}" title="เปิดดูใบเสร็จ">
                    <i class="fas fa-receipt text-[11px]"></i> ใบเสร็จ
                  </button>
                  <button class="delete-direct-sale-btn p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs transition-all"
                    data-id="${s.id}" title="ลบรายการขายนี้"><i class="fas fa-trash text-xs"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');

    return `
      <div class="fade-in space-y-6">

        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 class="text-2xl font-black text-gray-900 flex items-center gap-2.5">
              <span class="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center text-lg shadow">
                <i class="fas fa-store"></i>
              </span>
              หน้าจอการขาย
            </h1>
            <p class="text-sm text-gray-500 mt-1 ml-1">บันทึกรายการขายสินค้า · ออกใบเสร็จรับเงิน · ติดตามรายได้</p>
          </div>
          <a href="#inventory" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all shadow-xs self-start sm:self-auto">
            <i class="fas fa-boxes-stacked"></i> คลังสินค้า →
          </a>
        </div>

        <!-- Summary Cards -->
        ${summaryHtml}

        <!-- ===== Enterprise Lifecycle Flow Banner (วงจรการทำงาน & การตัดสต็อกอัตโนมัติ) ===== -->
        <div class="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white p-5 shadow-lg relative overflow-hidden">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-amber-950 uppercase tracking-wide">
                  <i class="fas fa-arrows-spin mr-1"></i> วงจรการทำงานวิสาหกิจ
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <i class="fas fa-bolt mr-1"></i> ระบบตัดสต็อกอัตโนมัติ (Auto-Deduction)
                </span>
              </div>
              <h2 class="text-base sm:text-lg font-black text-white mt-1.5 flex items-center gap-2 flex-wrap">
                <span>วงจรการแปรรูปและจำหน่ายสมุนไพร</span>
                <span class="text-xs font-normal text-amber-300">(อัตราส่วนอบแห้ง 10:1 · สด 150 kg ➔ แห้ง 15 kg)</span>
              </h2>
              <p class="text-xs text-gray-300 mt-1 max-w-2xl">
                เมื่อใดที่มีการบันทึกการขาย ระบบจะทำการ <b class="text-amber-300 underline underline-offset-2">"หักลบตัวเลขออกจากสต็อก"</b> โดยอัตโนมัติ พร้อมส่งข้อมูลไปเก็บในประวัติการขาย
              </p>
            </div>
            <div class="shrink-0 flex items-center gap-2 text-xs">
              <span class="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-emerald-200">
                <i class="fas fa-cube text-amber-400 mr-1"></i> สต็อกคงเหลือตัดทันที
              </span>
              <span class="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-sky-200">
                <i class="fas fa-file-invoice text-sky-400 mr-1"></i> ออกบิล & บันทึกประวัติ
              </span>
            </div>
          </div>

          <!-- Flow Steps Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
            <!-- 1. เก็บเกี่ยว -->
            <div class="p-2.5 rounded-xl bg-white/10 border border-white/10 flex flex-col justify-between">
              <span class="text-[10px] text-emerald-400 font-bold">ขั้นตอนที่ 1</span>
              <div class="font-black text-white text-xs mt-0.5">🌾 เก็บเกี่ยว (รอบที่ 1)</div>
              <div class="text-[10px] text-gray-300 mt-1">รับผลผลิตสด เช่น 150 กก.</div>
            </div>
            <!-- 2. อบ/ตากแห้ง -->
            <div class="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30 flex flex-col justify-between">
              <span class="text-[10px] text-amber-300 font-bold">ขั้นตอนที่ 2 (สูตร 10:1)</span>
              <div class="font-black text-amber-200 text-xs mt-0.5">☀️ อบ / ตากแห้ง</div>
              <div class="text-[10px] text-amber-100/90 mt-1 font-bold">สด 150 kg ➔ แห้ง 15 kg</div>
            </div>
            <!-- 3. เข้าสต็อก -->
            <div class="p-2.5 rounded-xl bg-sky-500/20 border border-sky-400/30 flex flex-col justify-between relative">
              <span class="text-[10px] text-sky-300 font-bold">ขั้นตอนที่ 3 (คลังสินค้า)</span>
              <div class="font-black text-sky-200 text-xs mt-0.5">📦 เข้าสต็อกรวม</div>
              <div class="text-[10px] text-sky-100/80 mt-1">ดอกแห้ง / กระป๋อง 50G</div>
              <div class="text-[9px] text-rose-300 font-bold mt-1 bg-rose-950/70 px-1.5 py-0.5 rounded border border-rose-500/50">
                ↩ ถูกหักลบเมื่อขาย
              </div>
            </div>
            <!-- 4. ขาย -->
            <div class="p-2.5 rounded-xl bg-emerald-600/30 border-2 border-emerald-400 flex flex-col justify-between shadow">
              <span class="text-[10px] text-emerald-300 font-bold">ขั้นตอนที่ 4 (หน้านี้)</span>
              <div class="font-black text-emerald-100 text-xs mt-0.5">💰 จัดการขาย</div>
              <div class="text-[10px] text-emerald-200 mt-1 font-bold">⚡ ตัดสต็อกอัตโนมัติ</div>
            </div>
            <!-- 5. ประวัติการขาย -->
            <div class="p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30 flex flex-col justify-between">
              <span class="text-[10px] text-purple-300 font-bold">ขั้นตอนที่ 5</span>
              <div class="font-black text-purple-200 text-xs mt-0.5">📜 ประวัติการขาย</div>
              <div class="text-[10px] text-purple-100/80 mt-1">บันทึกธุรกรรมย้อนหลัง</div>
            </div>
          </div>
        </div>

        <!-- ===== Sale Recording Form ===== -->
        <div class="rounded-2xl border border-emerald-800/20 shadow-md overflow-hidden">
          <div class="bg-emerald-800 px-6 py-4 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center text-base shrink-0">
                <i class="fas fa-pen-to-square"></i>
              </div>
              <div>
                <h2 class="text-base font-black text-white">บันทึกรายการขายใหม่</h2>
                <p class="text-xs text-emerald-200">กรอกข้อมูลครบแล้วกด "บันทึกการขายและออกใบเสร็จ" (ระบบจะตัดสต็อกอัตโนมัติ)</p>
              </div>
            </div>
            <span class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-900/60 border border-emerald-700 text-emerald-200 text-xs font-bold">
              <i class="fas fa-shield-halved text-emerald-400"></i> สต็อกซิงก์เรียลไทม์
            </span>
          </div>

          <form id="direct-sale-form" class="bg-white p-6 space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              <!-- วันที่ขาย -->
              <div>
                <label class="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1.5">
                  <i class="fas fa-calendar-day text-emerald-600 mr-1"></i>วันที่ขาย *
                </label>
                <input type="date" id="sale-date" name="date" required value="${today}"
                  class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm font-bold text-gray-800 bg-white">
              </div>

              <!-- ชื่อสินค้า -->
              <div class="lg:col-span-2">
                <label class="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1.5">
                  <i class="fas fa-box text-emerald-600 mr-1"></i>สินค้าที่ขาย *
                </label>
                <select id="sale-product-id" name="productId" required
                  class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm font-bold text-gray-800 bg-white">
                  <option value="">— เลือกสินค้า —</option>
                  ${productOptions}
                </select>
              </div>

              <!-- จำนวน -->
              <div>
                <label class="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1.5">
                  <i class="fas fa-sort-numeric-up text-emerald-600 mr-1"></i>จำนวนที่ขาย *
                </label>
                <div class="flex items-center gap-2">
                  <input type="number" id="sale-quantity" name="quantity" required min="0.01" step="any" placeholder="0"
                    class="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-base font-black text-gray-800 tabular-nums">
                  <span id="sale-unit-display" class="text-sm font-bold text-gray-500 whitespace-nowrap min-w-[40px]">หน่วย</span>
                </div>
              </div>

              <!-- ราคาต่อหน่วย -->
              <div>
                <label class="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1.5">
                  <i class="fas fa-tag text-emerald-600 mr-1"></i>ราคาต่อหน่วย (บาท) *
                </label>
                <input type="number" id="sale-unit-price" name="unitPrice" required min="0" step="any" placeholder="0"
                  class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-base font-black text-emerald-700 tabular-nums">
              </div>

              <!-- ยอดรวม (auto) -->
              <div>
                <label class="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1.5">
                  <i class="fas fa-coins text-amber-500 mr-1"></i>ยอดรวมสุทธิ
                </label>
                <div class="w-full px-4 py-2.5 rounded-xl border-2 border-amber-200 bg-amber-50 text-base font-black text-amber-800 tabular-nums" id="sale-total-display">
                  0.00 บาท
                </div>
              </div>

              <!-- ชื่อผู้ขาย -->
              <div>
                <label class="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1.5">
                  <i class="fas fa-user-tie text-emerald-600 mr-1"></i>ชื่อผู้บันทึก/ผู้ขาย *
                </label>
                <div class="flex gap-2">
                  <select id="sale-seller-select"
                    class="flex-1 px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm font-bold text-gray-800 bg-white">
                    <option value="">— เลือกจากสมาชิก —</option>
                    ${sellerOptions}
                  </select>
                </div>
                <input type="text" id="sale-seller-name" name="sellerName" required placeholder="หรือพิมพ์ชื่อผู้ขาย..."
                  value="${currentUser ? currentUser.name : ''}"
                  class="w-full mt-2 px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm font-bold text-gray-800">
              </div>

              <!-- ชื่อลูกค้า -->
              <div>
                <label class="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1.5">
                  <i class="fas fa-user text-emerald-600 mr-1"></i>ชื่อผู้ซื้อ / ลูกค้า *
                </label>
                <div class="flex gap-2">
                  <select id="sale-customer-select"
                    class="flex-1 px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm font-bold text-gray-800 bg-white">
                    <option value="">— เลือกจากรายชื่อลูกค้า —</option>
                    ${customerOptions}
                  </select>
                </div>
                <input type="text" id="sale-customer-name" name="customerName" required placeholder="หรือพิมพ์ชื่อผู้ซื้อ..."
                  class="w-full mt-2 px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm font-bold text-gray-800">
              </div>

              <!-- ช่องทางชำระเงิน -->
              <div>
                <label class="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1.5">
                  <i class="fas fa-credit-card text-emerald-600 mr-1"></i>ช่องทางชำระเงิน
                </label>
                <select id="sale-payment" name="payment"
                  class="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm font-bold text-gray-800 bg-white">
                  <option value="เงินสด">💵 เงินสด</option>
                  <option value="โอนเงิน">📱 โอนเงิน (พร้อมเพย์)</option>
                  <option value="บัตรเครดิต">💳 บัตรเครดิต/เดบิต</option>
                  <option value="อื่นๆ">📝 อื่นๆ</option>
                </select>
              </div>

              <!-- หมายเหตุ -->
              <div class="md:col-span-2 lg:col-span-3">
                <label class="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1.5">
                  <i class="fas fa-note-sticky text-gray-400 mr-1"></i>หมายเหตุ (ถ้ามี)
                </label>
                <input type="text" id="sale-note" name="note" placeholder="เช่น สั่งพิเศษ, ส่งออก, ซื้อยกล็อต..."
                  class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm text-gray-700">
              </div>
            </div>

            <!-- Submit -->
            <div class="flex items-center justify-between pt-4 border-t border-gray-100 gap-4 flex-wrap">
              <div id="sale-stock-warning" class="text-sm text-orange-600 font-bold hidden">
                <i class="fas fa-triangle-exclamation mr-1"></i><span></span>
              </div>
              <div class="flex gap-3 ml-auto">
                <button type="reset" class="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold transition-all">
                  ล้างแบบฟอร์ม
                </button>
                <button type="submit" id="submit-direct-sale-btn"
                  class="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-black transition-all shadow flex items-center gap-2 active:scale-95">
                  <i class="fas fa-receipt"></i>
                  บันทึกการขายและออกใบเสร็จ
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- ===== Sales History Table ===== -->
        <div class="rounded-2xl border border-gray-200 shadow-sm overflow-hidden bg-white">
          <!-- Table Header -->
          <div class="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-sky-700 text-white flex items-center justify-center text-sm">
                <i class="fas fa-list-ul"></i>
              </div>
              <div>
                <h2 class="text-sm font-black text-gray-900">ประวัติรายการขายทั้งหมด</h2>
                <p class="text-[10px] text-gray-400">กดปุ่ม "ใบเสร็จ" เพื่อดูและพิมพ์ใบเสร็จรับเงิน</p>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Month filter -->
              <select id="sale-month-filter" class="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">ทุกเดือน</option>
                ${months.map(m => {
                  const [y, mo] = m.split('-');
                  return `<option value="${m}" ${this.filterMonth === m ? 'selected' : ''}>${THAI_MONTHS[parseInt(mo)]} ${parseInt(y)+543}</option>`;
                }).join('')}
              </select>
              <!-- Search -->
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400"><i class="fas fa-search text-xs"></i></span>
                <input type="text" id="sale-history-search" value="${this.searchQuery}" placeholder="ค้นหา..."
                  class="pl-7 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 w-40">
              </div>
              <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                ${filtered.length} รายการ · ${formatBaht(totalRevenue)}
              </span>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 text-[11px] font-black text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th class="py-3.5 px-4">เลขที่ใบเสร็จ</th>
                  <th class="py-3.5 px-4">วันที่ขาย</th>
                  <th class="py-3.5 px-4">สินค้า</th>
                  <th class="py-3.5 px-4 text-center">จำนวน</th>
                  <th class="py-3.5 px-4 text-right">ราคาต่อหน่วย</th>
                  <th class="py-3.5 px-4 text-right">ยอดรวม</th>
                  <th class="py-3.5 px-4">ผู้ซื้อ / ผู้ขาย</th>
                  <th class="py-3.5 px-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>${tableRowsHtml}</tbody>
              ${filtered.length > 0 ? `
              <tfoot>
                <tr class="bg-emerald-50 border-t-2 border-emerald-600 font-black text-sm">
                  <td colspan="3" class="py-3 px-4 text-right text-emerald-900">รวม (${filtered.length} รายการ):</td>
                  <td class="py-3 px-4 text-center text-emerald-800">${totalQty.toLocaleString()}</td>
                  <td colspan="2" class="py-3 px-4 text-right text-emerald-800 text-base">${formatBaht(totalRevenue)}</td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>` : ''}
            </table>
          </div>
        </div>

      </div>
    `;
  },

  init() {
    this._bindForm();
    this._bindTableActions();
    this._bindSearch();
  },

  _bindForm() {
    const productSel   = document.getElementById('sale-product-id');
    const qtyInput     = document.getElementById('sale-quantity');
    const priceInput   = document.getElementById('sale-unit-price');
    const totalDisplay = document.getElementById('sale-total-display');
    const unitDisplay  = document.getElementById('sale-unit-display');
    const stockWarning = document.getElementById('sale-stock-warning');
    const sellerSel    = document.getElementById('sale-seller-select');
    const customerSel  = document.getElementById('sale-customer-select');
    const sellerInput  = document.getElementById('sale-seller-name');
    const customerInput= document.getElementById('sale-customer-name');

    const updateTotal = () => {
      const qty   = parseFloat(qtyInput?.value) || 0;
      const price = parseFloat(priceInput?.value) || 0;
      const total = qty * price;
      if (totalDisplay) totalDisplay.textContent = `${total.toLocaleString('th-TH', {minimumFractionDigits:2, maximumFractionDigits:2})} บาท`;
    };

    if (productSel) {
      productSel.addEventListener('change', () => {
        const opt = productSel.selectedOptions[0];
        if (opt && opt.value) {
          const price = parseFloat(opt.getAttribute('data-price')) || 0;
          const unit  = opt.getAttribute('data-unit') || 'หน่วย';
          const stock = parseFloat(opt.getAttribute('data-stock')) || 0;
          if (priceInput) priceInput.value = price;
          if (unitDisplay) unitDisplay.textContent = unit;
          if (stockWarning) {
            const warning = stockWarning.querySelector('span');
            if (stock === 0) {
              stockWarning.classList.remove('hidden');
              if (warning) warning.textContent = `สินค้านี้หมดสต็อก! คงเหลือ 0 ${unit}`;
            } else if (stock < 10) {
              stockWarning.classList.remove('hidden');
              if (warning) warning.textContent = `เหลือน้อย! คงเหลือ ${stock} ${unit} เท่านั้น`;
            } else {
              stockWarning.classList.add('hidden');
            }
          }
          updateTotal();
        }
      });
    }
    if (qtyInput)   qtyInput.addEventListener('input', updateTotal);
    if (priceInput) priceInput.addEventListener('input', updateTotal);

    if (sellerSel) {
      sellerSel.addEventListener('change', () => {
        if (sellerSel.value && sellerInput) sellerInput.value = sellerSel.value;
      });
    }
    if (customerSel) {
      customerSel.addEventListener('change', () => {
        if (customerSel.value && customerInput) customerInput.value = customerSel.value;
      });
    }

    const form = document.getElementById('direct-sale-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this._handleSubmit(form);
      });

      form.addEventListener('reset', () => {
        setTimeout(() => {
          if (totalDisplay) totalDisplay.textContent = '0.00 บาท';
          if (unitDisplay)  unitDisplay.textContent = 'หน่วย';
          if (stockWarning) stockWarning.classList.add('hidden');
        }, 0);
      });
    }
  },

  _handleSubmit(form) {
    const data = new FormData(form);
    const productSel = document.getElementById('sale-product-id');
    const opt = productSel?.selectedOptions[0];
    if (!opt || !opt.value) { showToast('กรุณาเลือกสินค้าที่ต้องการขาย', 'error'); return; }

    const productId   = opt.value;
    const product     = appState.getProductById(productId);
    const productName = product ? product.name : (opt.text || 'สินค้า');
    const unit        = opt.getAttribute('data-unit') || (product ? product.unit : 'หน่วย');
    const quantity    = parseFloat(document.getElementById('sale-quantity')?.value) || 0;
    const unitPrice   = parseFloat(document.getElementById('sale-unit-price')?.value) || 0;
    const totalPrice  = quantity * unitPrice;
    const date        = document.getElementById('sale-date')?.value || new Date().toISOString().split('T')[0];
    const sellerName  = document.getElementById('sale-seller-name')?.value?.trim();
    const customerName= document.getElementById('sale-customer-name')?.value?.trim();
    const customerSel = document.getElementById('sale-customer-select');
    const customerId  = customerSel ? customerSel.value : null;
    const payment     = document.getElementById('sale-payment')?.value || 'เงินสด';
    const note        = document.getElementById('sale-note')?.value?.trim();

    if (quantity <= 0) { showToast('กรุณาระบุจำนวนที่ขาย', 'error'); return; }
    if (unitPrice < 0) { showToast('กรุณาระบุราคาต่อหน่วย', 'error'); return; }
    if (!sellerName)   { showToast('กรุณาระบุชื่อผู้ขาย', 'error'); return; }
    if (!customerName) { showToast('กรุณาระบุชื่อผู้ซื้อ', 'error'); return; }

    // ⚡ Automatic Stock Check
    if (product) {
      if (product.stock < quantity) {
        showToast(`❌ สต็อกสินค้าไม่เพียงพอ! คงเหลือเพียง ${product.stock} ${unit} (ต้องการขาย ${quantity} ${unit})`, 'error');
        return;
      }
    }

    // ⚡ 1. Deduct stock automatically using appState.deductProductStock
    let recordedSaleId = generateSaleId();
    let remainingStock = 0;
    try {
      const deductResult = appState.deductProductStock(productId, quantity, customerName, unitPrice, date, customerId);
      if (deductResult && deductResult.product) {
        remainingStock = deductResult.product.stock;
      }
      if (deductResult && deductResult.sale && deductResult.sale.id) {
        recordedSaleId = deductResult.sale.id;
      }
    } catch (e) {
      // Fallback deduction
      if (product) {
        const newStock = Math.max(0, parseFloat((product.stock - quantity).toFixed(2)));
        appState.updateProduct(productId, { stock: newStock });
        remainingStock = newStock;
      }
    }

    // ⚡ 2. Deduct bulk dry herbs from inventory if selling in กก.
    if (unit === 'กก.' || unit === 'kg') {
      try {
        const inventory = appState.getInventory();
        const targetHerb = productName.includes('เก๊กฮวย') ? 'เก๊กฮวย' : (productName.includes('คาโมมายล์') ? 'คาโมมายล์' : '');
        if (targetHerb) {
          const invItem = inventory.find(i => (i.herbType && i.herbType.includes(targetHerb)));
          if (invItem && invItem.dryStockKg >= quantity) {
            invItem.dryStockKg = Math.max(0, parseFloat((invItem.dryStockKg - quantity).toFixed(2)));
            localStorage.setItem('herb_enterprise_inventory', JSON.stringify(inventory));
          }
        }
      } catch (e) {
        console.error("Inventory sync error:", e);
      }
    }

    const newSale = {
      id: recordedSaleId,
      date, productId, productName, unit,
      quantity, unitPrice, totalPrice,
      sellerName, customerName, payment, note,
      remainingStockAfterSale: remainingStock,
      createdAt: new Date().toISOString()
    };

    const sales = getDirectSales();
    sales.push(newSale);
    saveDirectSales(sales);

    showToast(`✅ บันทึกการขายสำเร็จ! หักลบสต็อกสินค้าออก ${quantity} ${unit} อัตโนมัติ (คงเหลือในคลัง ${remainingStock} ${unit})`, 'success');
    this.refreshView();

    // Auto-open receipt
    setTimeout(() => this._openReceipt(newSale.id), 300);
  },

  _bindTableActions() {
    document.querySelectorAll('.view-direct-sale-btn').forEach(btn => {
      btn.addEventListener('click', () => this._openReceipt(btn.getAttribute('data-id')));
    });
    document.querySelectorAll('.download-direct-sale-pdf-btn').forEach(btn => {
      btn.addEventListener('click', () => this._downloadReceiptPdf(btn.getAttribute('data-id')));
    });
    document.querySelectorAll('.delete-direct-sale-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const sales = getDirectSales();
        const saleToDelete = sales.find(s => s.id === id);
        if (!saleToDelete) return;

        if (confirm(`คุณต้องการยกเลิกและลบรายการขาย #${id} หรือไม่?\n\n⚡ ระบบจะทำการ "คืนสต็อกจำนวน ${saleToDelete.quantity} ${saleToDelete.unit}" กลับเข้าสู่คลังสินค้าโดยอัตโนมัติ`)) {
          // 1. Restore stock to product
          if (saleToDelete.productId) {
            const product = appState.getProductById(saleToDelete.productId);
            if (product) {
              const restoredStock = parseFloat((product.stock + saleToDelete.quantity).toFixed(2));
              appState.updateProduct(product.id, { stock: restoredStock });
            }
          }
          // 2. Also restore to inventory if kg
          if (saleToDelete.unit === 'กก.' || saleToDelete.unit === 'kg') {
            try {
              const inventory = appState.getInventory();
              const targetHerb = (saleToDelete.productName || '').includes('เก๊กฮวย') ? 'เก๊กฮวย' : ((saleToDelete.productName || '').includes('คาโมมายล์') ? 'คาโมมายล์' : '');
              if (targetHerb) {
                const invItem = inventory.find(i => (i.herbType && i.herbType.includes(targetHerb)));
                if (invItem) {
                  invItem.dryStockKg = parseFloat((invItem.dryStockKg + saleToDelete.quantity).toFixed(2));
                  localStorage.setItem('herb_enterprise_inventory', JSON.stringify(inventory));
                }
              }
            } catch (e) {
              console.error("Inventory restore error:", e);
            }
          }
          // 3. Remove from appState.sales if present
          try {
            appState.deleteSale(id, false);
          } catch (e) {}

          // 4. Remove from direct sales
          const filtered = sales.filter(s => s.id !== id);
          saveDirectSales(filtered);
          showToast(`ลบรายการขาย #${id} เรียบร้อยแล้ว และคืนสต็อก ${saleToDelete.quantity} ${saleToDelete.unit} กลับเข้าคลังสินค้า`, 'success');
          this.refreshView();
        }
      });
    });
  },

  _bindSearch() {
    const search = document.getElementById('sale-history-search');
    if (search) {
      search.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.refreshView();
      });
    }
    const monthFilter = document.getElementById('sale-month-filter');
    if (monthFilter) {
      monthFilter.addEventListener('change', (e) => {
        this.filterMonth = e.target.value;
        this.refreshView();
      });
    }
  },

  /**
   * สร้าง HTML ใบเสร็จรับเงินที่สมจริง ถูกต้องตามหลักการค้าวิสาหกิจชุมชน
   */
  _getReceiptContentHtml(s) {
    const enterprise = appState.getEnterprise() || {};
    const printDate  = toThaiDateTime(s.createdAt || new Date().toISOString());
    const saleDate   = toThaiDateLong(s.date);
    const subtotal   = parseFloat(s.totalPrice) || 0;
    const grand      = subtotal;
    const barDigits  = (s.id || '').replace(/\D/g, '').padStart(12, '0');

    return `
      <div id="printable-receipt" class="receipt-paper max-w-xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-gray-300 shadow-md">

        <!-- Top Header: Logo + Enterprise Details -->
        <div class="flex items-start justify-between pb-4 border-b-2 border-emerald-900/80 gap-3">
          <div class="flex items-start gap-3.5">
            <div class="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center text-2xl shadow-sm shrink-0 mt-0.5 border border-emerald-700">
              <i class="fas fa-leaf"></i>
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest block">วิสาหกิจชุมชนมาตรฐานทางการ</span>
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">OTOP</span>
              </div>
              <h1 class="text-base sm:text-lg font-black text-gray-900 leading-tight">${enterprise.name || 'วิสาหกิจชุมชนสมุนไพรอบแห้ง'}</h1>
              <p class="text-[11px] text-gray-600 mt-1 leading-snug">
                ${enterprise.village || ''} ต.${enterprise.subdistrict || ''} อ.${enterprise.district || ''} จ.${enterprise.province || ''} ${enterprise.postalCode || '57150'}
              </p>
              <div class="text-[10px] text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>${enterprise.phone ? `โทร. ${enterprise.phone}` : 'โทร. 081-234-5678'}</span>
                <span>•</span>
                <span>รหัสทะเบียน: <b>5-50-08-01/1-0023</b></span>
              </div>
            </div>
          </div>

          <div class="text-right shrink-0">
            <span class="inline-block px-2.5 py-1 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
              ต้นฉบับ / ORIGINAL
            </span>
            <div class="mt-2 text-right">
              <span class="text-sm font-black text-gray-900 block leading-tight">ใบเสร็จรับเงิน</span>
              <span class="text-[9px] font-bold text-gray-400 block tracking-wider uppercase">RECEIPT / CASH SALE</span>
            </div>
          </div>
        </div>

        <!-- Document Meta & Customer Info Grid -->
        <div class="grid grid-cols-2 gap-3 py-3.5 border-b border-gray-200 text-xs">
          <!-- Left Column: Customer Details -->
          <div class="space-y-1.5 bg-gray-50/90 p-3 rounded-xl border border-gray-200">
            <div class="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <i class="fas fa-user text-emerald-700"></i> ข้อมูลลูกค้า / ผู้ซื้อ (CUSTOMER)
            </div>
            <div class="font-black text-gray-900 text-sm leading-tight">${s.customerName}</div>
            <div class="text-[11px] text-gray-600 flex items-center gap-1">
              <span class="text-gray-400">วิธีชำระ:</span>
              <span class="font-bold text-emerald-800">${s.payment || 'เงินสด'}</span>
            </div>
            ${s.note ? `<div class="text-[10px] text-gray-500 truncate" title="${s.note}"><span class="text-gray-400">หมายเหตุ:</span> ${s.note}</div>` : ''}
          </div>

          <!-- Right Column: Document Details -->
          <div class="space-y-1.5 bg-gray-50/90 p-3 rounded-xl border border-gray-200 text-right">
            <div class="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center justify-end gap-1">
              <i class="fas fa-file-invoice text-emerald-700"></i> ข้อมูลเอกสาร (INVOICE INFO)
            </div>
            <div class="font-mono font-black text-emerald-800 text-sm">${s.id}</div>
            <div class="text-[11px] text-gray-600">
              <span class="text-gray-400">วันที่ขาย:</span> <span class="font-bold text-gray-800">${saleDate}</span>
            </div>
            <div class="text-[10px] text-gray-500">
              <span class="text-gray-400">ผู้รับเงิน / แคชเชียร์:</span> <span class="font-bold text-gray-700">${s.sellerName}</span>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="py-3">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-emerald-900 text-white font-bold text-[11px]">
                <th class="py-2.5 px-3 text-center w-8 rounded-l-lg">#</th>
                <th class="py-2.5 px-3">รายการสินค้า / Description</th>
                <th class="py-2.5 px-3 text-center w-20">หน่วย</th>
                <th class="py-2.5 px-3 text-center w-16">จำนวน</th>
                <th class="py-2.5 px-3 text-right w-24">ราคา/หน่วย</th>
                <th class="py-2.5 px-3 text-right w-28 rounded-r-lg">จำนวนเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-gray-200">
                <td class="py-3 px-3 text-center text-gray-500 font-bold">1</td>
                <td class="py-3 px-3">
                  <div class="font-black text-gray-900 text-sm leading-snug">${s.productName}</div>
                  <div class="text-[10px] text-gray-400 font-mono mt-0.5">รหัสสินค้า: ${s.productId}</div>
                </td>
                <td class="py-3 px-3 text-center text-gray-600 font-medium">${s.unit}</td>
                <td class="py-3 px-3 text-center font-black text-gray-900 tabular-nums">${s.quantity.toLocaleString()}</td>
                <td class="py-3 px-3 text-right text-gray-700 font-bold tabular-nums">${s.unitPrice.toLocaleString('th-TH', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                <td class="py-3 px-3 text-right font-black text-gray-900 text-sm tabular-nums">${s.totalPrice.toLocaleString('th-TH', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Financial Summary Breakdown -->
        <div class="border-t border-gray-200 pt-3">
          <div class="flex items-start justify-between gap-4">
            <!-- Left Side: Thai Text + Rubber Stamp -->
            <div class="flex-1 space-y-3">
              <div class="p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                <span class="text-[10px] text-gray-500 font-bold block mb-0.5">จำนวนเงินตัวอักษร:</span>
                <span class="font-black text-emerald-900 text-xs tracking-tight">${numberToThaiText(grand)}</span>
              </div>

              <!-- Authentic Official Rubber Stamp -->
              <div class="rubber-stamp">
                <i class="fas fa-check-circle mr-1"></i> PAID / ชำระแล้ว
              </div>
            </div>

            <!-- Right Side: Numerical Summary -->
            <div class="w-64 space-y-1.5 text-xs text-right shrink-0">
              <div class="flex justify-between py-1 text-gray-600">
                <span>รวมมูลค่าสินค้า:</span>
                <span class="font-bold tabular-nums">${subtotal.toLocaleString('th-TH', {minimumFractionDigits:2, maximumFractionDigits:2})} บาท</span>
              </div>
              <div class="flex justify-between py-1 text-gray-500 text-[11px]">
                <span>ภาษีมูลค่าเพิ่ม (VAT 0% ได้รับยกเว้น):</span>
                <span class="font-bold tabular-nums">0.00 บาท</span>
              </div>
              <div class="flex justify-between py-2 border-t-2 border-b-2 border-emerald-800 bg-emerald-50 px-2.5 rounded-lg text-emerald-950 font-black">
                <span class="text-sm">ยอดเงินสุทธิทั้งสิ้น:</span>
                <span class="text-lg font-black tabular-nums">${grand.toLocaleString('th-TH', {minimumFractionDigits:2, maximumFractionDigits:2})} บาท</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Dual Signature Section -->
        <div class="mt-6 pt-4 border-t border-dashed border-gray-300">
          <div class="grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div class="border-b border-gray-400 h-10 w-44 mx-auto mb-1"></div>
              <div class="font-bold text-gray-800">ผู้รับของ / ผู้ซื้อ</div>
              <div class="text-[10px] text-gray-500 mt-0.5">(${s.customerName})</div>
              <div class="text-[9px] text-gray-400">วันที่ ........../........../..........</div>
            </div>
            <div>
              <div class="border-b border-gray-400 h-10 w-44 mx-auto mb-1"></div>
              <div class="font-bold text-gray-800">ผู้รับเงิน / พนักงานขาย</div>
              <div class="text-[10px] text-gray-500 mt-0.5">(${s.sellerName})</div>
              <div class="text-[9px] text-gray-400">วันที่ ${saleDate}</div>
            </div>
          </div>
        </div>

        <!-- Bottom Barcode & Verification -->
        <div class="mt-5 pt-3 border-t border-gray-200 text-center">
          <div class="flex items-end justify-center gap-px h-8 mx-auto max-w-[240px] overflow-hidden">
            ${generateBarcode(barDigits)}
          </div>
          <div class="text-[9px] font-mono text-gray-400 tracking-widest mt-1">${barDigits.match(/.{1,4}/g)?.join(' ')}</div>
          <div class="text-[9px] text-gray-400 mt-1">
            เอกสารออกโดยระบบวิสาหกิจชุมชนสมุนไพรอบแห้ง · หากพบสินค้ามีปัญหาสามารถติดต่อขอเปลี่ยนคืนได้ภายใน 7 วัน
          </div>
        </div>

      </div>
    `;
  },

  /**
   * เปิด Modal แสดงใบเสร็จรับเงิน พร้อมปุ่มดาวน์โหลดเป็น PDF และสั่งพิมพ์
   */
  _openReceipt(saleId) {
    const sales = getDirectSales();
    const s = sales.find(x => x.id === saleId);
    if (!s) return;

    const receiptHtml = `
      <div class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 bg-slate-50/50">
          ${this._getReceiptContentHtml(s)}
        </div>

        <!-- Action Buttons -->
        <div class="p-4 md:px-6 bg-white border-t border-gray-200 flex justify-between items-center flex-shrink-0 gap-3">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ปิดหน้าต่าง
          </button>
          <div class="flex items-center gap-2.5">
            <button type="button" id="download-receipt-pdf-btn"
              class="px-5 py-2.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all shadow-xs flex items-center gap-2 active:scale-95">
              <i class="fas fa-file-pdf text-red-600 text-sm"></i>
              <span>ดาวน์โหลดเป็น PDF</span>
            </button>
            <button type="button" id="print-receipt-btn"
              class="px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all shadow-xs flex items-center gap-2 active:scale-95">
              <i class="fas fa-print"></i>
              <span>พิมพ์ใบเสร็จ</span>
            </button>
          </div>
        </div>
      </div>
    `;

    openGlobalModal({
      title: `ใบเสร็จรับเงิน — ${s.id}`,
      icon: 'fas fa-receipt',
      size: 'max-w-2xl',
      headerColor: 'bg-emerald-800',
      content: receiptHtml,
      onRender: (dialog) => {
        const printBtn = dialog.querySelector('#print-receipt-btn');
        if (printBtn) {
          printBtn.addEventListener('click', () => window.print());
        }

        const downloadPdfBtn = dialog.querySelector('#download-receipt-pdf-btn');
        if (downloadPdfBtn) {
          downloadPdfBtn.addEventListener('click', () => {
            this._downloadReceiptPdf(saleId, downloadPdfBtn);
          });
        }
      }
    });
  },

  /**
   * ดาวน์โหลดใบเสร็จรับเงินเป็นไฟล์ PDF โดยตรง
   */
  _downloadReceiptPdf(saleId, buttonElement = null) {
    const sales = getDirectSales();
    const s = sales.find(x => x.id === saleId);
    if (!s) return;

    let receiptElement = document.getElementById('printable-receipt');
    let isTemp = false;

    // ถ้ายังไม่ได้เปิด modal ให้สร้าง DOM ชั่วคราวเพื่อเรนเดอร์ PDF
    if (!receiptElement) {
      isTemp = true;
      receiptElement = document.createElement('div');
      receiptElement.id = 'temp-pdf-receipt';
      receiptElement.style.position = 'fixed';
      receiptElement.style.left = '-9999px';
      receiptElement.style.top = '0';
      receiptElement.style.width = '600px';
      receiptElement.style.background = '#ffffff';
      receiptElement.innerHTML = this._getReceiptContentHtml(s);
      document.body.appendChild(receiptElement);
    }

    const originalButtonHtml = buttonElement ? buttonElement.innerHTML : null;
    if (buttonElement) {
      buttonElement.disabled = true;
      buttonElement.innerHTML = '<i class="fas fa-circle-notch fa-spin text-sm"></i> กำลังสร้าง PDF...';
    }

    showToast('กำลังเตรียมไฟล์ PDF ใบเสร็จ...', 'info');

    const cleanCustomerName = (s.customerName || 'ลูกค้า').replace(/[\\/:*?"<>|]/g, '');
    const opt = {
      margin:       [8, 6, 8, 6],
      filename:     `ใบเสร็จรับเงิน_${s.id}_${cleanCustomerName}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2.5, useCORS: true, logging: false, backgroundColor: '#ffffff' },
      jsPDF:        { unit: 'mm', format: 'a5', orientation: 'portrait' }
    };

    const cleanup = () => {
      if (isTemp && receiptElement && receiptElement.parentNode) {
        receiptElement.parentNode.removeChild(receiptElement);
      }
      if (buttonElement && originalButtonHtml) {
        buttonElement.disabled = false;
        buttonElement.innerHTML = originalButtonHtml;
      }
    };

    if (window.html2pdf) {
      window.html2pdf().set(opt).from(receiptElement).save().then(() => {
        cleanup();
        showToast(`ดาวน์โหลดไฟล์ PDF ใบเสร็จ #${s.id} สำเร็จแล้ว`, 'success');
      }).catch(err => {
        console.error('PDF error:', err);
        cleanup();
        showToast('ไม่สามารถสร้าง PDF ได้ กำลังเปิดหน้าต่างพิมพ์แทน...', 'warning');
        this._openReceipt(saleId);
        setTimeout(() => window.print(), 400);
      });
    } else {
      cleanup();
      showToast('ระบบจะพิมพ์ผ่านเบราว์เซอร์แทน (สามารถเลือก Save as PDF ได้)', 'info');
      this._openReceipt(saleId);
      setTimeout(() => window.print(), 400);
    }
  },

  refreshView() {
    const container = document.getElementById('app-view');
    if (container) {
      container.innerHTML = this.render();
      this.init();
    }
  }
};

// ---- helpers ----
function generateBarcode(digits) {
  const bars = [];
  for (let i = 0; i < 80; i++) {
    const d = parseInt(digits[i % digits.length]) || 0;
    const h = 20 + (d * 8);
    const w = (i % 3 === 0) ? 3 : 2;
    const dark = (i + d) % 3 !== 2;
    bars.push(`<div style="width:${w}px;height:${h}px;background:${dark ? '#1a1a1a' : '#e5e7eb'};flex-shrink:0"></div>`);
  }
  return bars.join('');
}

function numberToThaiText(amount) {
  if (amount === 0) return 'ศูนย์บาทถ้วน';
  const integer = Math.floor(amount);
  const decimal = Math.round((amount - integer) * 100);
  const ones = ['','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
  const tens = ['','สิบ','ยี่สิบ','สามสิบ','สี่สิบ','ห้าสิบ','หกสิบ','เจ็ดสิบ','แปดสิบ','เก้าสิบ'];
  const places = ['','สิบ','ร้อย','พัน','หมื่น','แสน','ล้าน'];

  function convert(n) {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 100) {
      const t = Math.floor(n / 10), o = n % 10;
      return (tens[t] || '') + (o ? ones[o] : '');
    }
    const digits = String(n).split('').reverse();
    return digits.reduceRight((acc, d, i) => {
      return acc + (parseInt(d) ? ones[parseInt(d)] + places[i] : '');
    }, '');
  }

  const intText = convert(integer) + 'บาท';
  const decText = decimal > 0 ? convert(decimal) + 'สตางค์' : 'ถ้วน';
  return intText + decText;
}
