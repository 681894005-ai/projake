// Warehouse / Product Inventory Table Component (คลังสินค้า - ตารางสินค้าและสต็อกคงเหลือ)
import { appState } from '../state.js';
import { formatThaiDate, formatBaht, showToast, openGlobalModal, closeGlobalModal } from '../helpers.js';

const THAI_MONTHS_SELECT = [
  { val: '01', name: 'มกราคม' },
  { val: '02', name: 'กุมภาพันธ์' },
  { val: '03', name: 'มีนาคม' },
  { val: '04', name: 'เมษายน' },
  { val: '05', name: 'พฤษภาคม' },
  { val: '06', name: 'มิถุนายน' },
  { val: '07', name: 'กรกฎาคม' },
  { val: '08', name: 'สิงหาคม' },
  { val: '09', name: 'กันยายน' },
  { val: '10', name: 'ตุลาคม' },
  { val: '11', name: 'พฤศจิกายน' },
  { val: '12', name: 'ธันวาคม' }
];

export const InventoryComponent = {
  searchQuery: '',
  unitFilter: 'all',
  monthFilter: 'all',
  yearFilter: 'all',

  render() {
    const currentUser = appState.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'Member';

    const allProducts = appState.getProducts();

    // Collect all distinct years from products
    const availableYears = [...new Set(allProducts.map(p => (p.updatedDate || '').substring(0, 4)).filter(Boolean))];
    if (!availableYears.includes('2026')) availableYears.push('2026');
    if (!availableYears.includes('2025')) availableYears.push('2025');
    availableYears.sort().reverse();

    // 1. Calculate Summary Totals grouped by Unit
    const unitTotals = {};
    allProducts.forEach(p => {
      const u = p.unit || 'ชิ้น';
      if (!unitTotals[u]) unitTotals[u] = 0;
      unitTotals[u] += (parseFloat(p.stock) || 0);
    });

    const activeUnits = Object.keys(unitTotals);

    // 2. Filter products based on search query, unit filter, month filter, and year filter
    let filteredProducts = allProducts.filter(p => {
      if (this.unitFilter !== 'all' && p.unit !== this.unitFilter) {
        return false;
      }

      const dateStr = p.updatedDate || '';
      const pYear = dateStr.substring(0, 4);
      const pMonth = dateStr.substring(5, 7);

      if (this.yearFilter !== 'all' && pYear !== this.yearFilter) {
        return false;
      }

      if (this.monthFilter !== 'all' && pMonth !== this.monthFilter) {
        return false;
      }

      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase().trim();
        const idMatch = (p.id || '').toLowerCase().includes(q);
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const catMatch = (p.category || '').toLowerCase().includes(q);
        return idMatch || nameMatch || catMatch;
      }
      return true;
    });

    // 3. Generate Summary Cards (แยกสรุปตามหน่วยเรียกชัดเจน)
    const summaryCardsHtml = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(activeUnits.length + 1, 4)} gap-4">
        ${activeUnits.map(unit => {
          const totalVal = unitTotals[unit];
          const isKg = unit === 'กก.';
          const isJar = unit === 'กระปุก';
          const isPouch = unit === 'ซอง';

          let icon = 'fas fa-boxes-stacked';
          let iconBg = 'bg-emerald-50 text-emerald-700';
          let textColor = 'text-emerald-900';

          if (isKg) {
            icon = 'fas fa-weight-hanging';
            iconBg = 'bg-emerald-100/70 text-emerald-800';
            textColor = 'text-emerald-950';
          } else if (isJar) {
            icon = 'fas fa-box-archive';
            iconBg = 'bg-sky-100 text-sky-800';
            textColor = 'text-sky-950';
          } else if (isPouch) {
            icon = 'fas fa-cube';
            iconBg = 'bg-amber-100 text-amber-800';
            textColor = 'text-amber-950';
          }

          const displayValue = isKg ? totalVal.toFixed(2) : totalVal.toLocaleString();

          return `
            <div class="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center justify-between transition-all hover:shadow-md">
              <div class="space-y-1">
                <span class="text-xs font-semibold text-gray-500 block">สินค้ารวมทั้งหมด (หน่วย: ${unit})</span>
                <div class="flex items-baseline gap-1.5">
                  <span class="text-3xl font-black ${textColor}">${displayValue}</span>
                  <span class="text-xs font-bold text-gray-500">${unit}</span>
                </div>
                <span class="text-[10px] text-gray-400 block">นับรวมสินค้าพร้อมจำหน่ายทั้งหมด</span>
              </div>
              <div class="w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center text-xl shrink-0 shadow-2xs">
                <i class="${icon}"></i>
              </div>
            </div>
          `;
        }).join('')}

        <div class="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center justify-between transition-all hover:shadow-md">
          <div class="space-y-1">
            <span class="text-xs font-semibold text-gray-500 block">จำนวนรายการสินค้าในคลัง</span>
            <div class="flex items-baseline gap-1.5">
              <span class="text-3xl font-black text-gray-800">${allProducts.length}</span>
              <span class="text-xs font-bold text-gray-500">รายการ</span>
            </div>
            <span class="text-[10px] text-emerald-700 font-medium">ครอบคลุม ${activeUnits.length} หน่วยเรียก</span>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center text-xl shrink-0 shadow-2xs">
            <i class="fas fa-list-check"></i>
          </div>
        </div>
      </div>
    `;

    // 3.5 Generate Standard Price Reference Bar (เกณฑ์ราคาขายผลผลิตมาตรฐานวิสาหกิจ)
    const prdChrysBulk = allProducts.find(p => p.id === 'PRD-001') || { id: 'PRD-001', name: 'ดอกเก๊กฮวยอบแห้ง (1 กก.)', price: 250, unit: 'กก.', stock: 0 };
    const prdChamBulk = allProducts.find(p => p.id === 'PRD-002') || { id: 'PRD-002', name: 'ดอกคาโมมายล์อบแห้ง (1 กก.)', price: 450, unit: 'กก.', stock: 0 };
    const prdChrysJar = allProducts.find(p => p.id === 'PRD-003') || { id: 'PRD-003', name: 'เก๊กฮวยกระป๋อง (50 G)', price: 150, unit: 'กระปุก', stock: 100 };
    const prdChamJar = allProducts.find(p => p.id === 'PRD-004') || { id: 'PRD-004', name: 'คาโมมายล์กระป๋อง (50 G)', price: 100, unit: 'กระปุก', stock: 50 };

    const standardPriceItems = [
      {
        id: prdChamJar.id,
        name: prdChamJar.name || 'คาโมมายล์กระป๋อง (50 G)',
        spec: 'ขนาด 50 G / กระปุก',
        price: prdChamJar.price,
        unit: 'กระปุก',
        stock: prdChamJar.stock,
        icon: '🌿',
        stripe: 'bg-sky-500',
        cardBorder: 'border-sky-200',
        iconBg: 'bg-sky-50',
        badgeBg: 'bg-sky-100 text-sky-900 border-sky-300',
        priceColor: 'text-sky-700',
        editBtnStyle: 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-300'
      },
      {
        id: prdChrysJar.id,
        name: prdChrysJar.name || 'เก๊กฮวยกระป๋อง (50 G)',
        spec: 'ขนาด 50 G / กระปุก',
        price: prdChrysJar.price,
        unit: 'กระปุก',
        stock: prdChrysJar.stock,
        icon: '🌼',
        stripe: 'bg-amber-400',
        cardBorder: 'border-amber-200',
        iconBg: 'bg-amber-50',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        priceColor: 'text-amber-700',
        editBtnStyle: 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
      },
      {
        id: prdChrysBulk.id,
        name: 'เก๊กฮวยอบแห้ง (1 กก.)',
        spec: 'สมุนไพรอบแห้ง 1 กิโลกรัม',
        price: prdChrysBulk.price,
        unit: 'กก.',
        stock: prdChrysBulk.stock,
        icon: '🌼',
        stripe: 'bg-yellow-400',
        cardBorder: 'border-yellow-200',
        iconBg: 'bg-yellow-50',
        badgeBg: 'bg-yellow-100 text-yellow-900 border-yellow-300',
        priceColor: 'text-yellow-700',
        editBtnStyle: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-300'
      },
      {
        id: prdChamBulk.id,
        name: 'คาโมมายล์อบแห้ง (1 กก.)',
        spec: 'สมุนไพรอบแห้ง 1 กิโลกรัม',
        price: prdChamBulk.price,
        unit: 'กก.',
        stock: prdChamBulk.stock,
        icon: '🌿',
        stripe: 'bg-emerald-500',
        cardBorder: 'border-emerald-200',
        iconBg: 'bg-emerald-50',
        badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        priceColor: 'text-emerald-700',
        editBtnStyle: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
      }
    ];

    const standardPriceBarHtml = `
      <div class="rounded-2xl border border-emerald-800/20 shadow-md overflow-hidden">

        <!-- Header bar -->
        <div class="bg-emerald-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/15 text-white flex items-center justify-center text-lg shrink-0">
              <i class="fas fa-tags"></i>
            </div>
            <div>
              <h2 class="text-base sm:text-lg font-black text-white tracking-wide">
                เกณฑ์ราคาจำหน่ายผลผลิต — วิสาหกิจชุมชน
              </h2>
              <p class="text-xs text-emerald-200 mt-0.5">
                กดปุ่ม <b class="text-white">"✏ แก้ไขราคา"</b> บนการ์ดเพื่อปรับราคาได้ทันที · ราคาเชื่อมโยงกับทุกส่วนในระบบ
              </p>
            </div>
          </div>
          <span class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-emerald-100 self-start sm:self-auto shrink-0">
            <i class="fas fa-link text-emerald-300"></i> เชื่อมโยงระบบคำนวณมูลค่าอัตโนมัติ
          </span>
        </div>

        <!-- Price cards grid -->
        <div class="bg-gradient-to-b from-emerald-50/60 to-white p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          ${standardPriceItems.map(item => `
            <div class="group relative bg-white rounded-2xl border-2 ${item.cardBorder} shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden">

              <!-- Colored top stripe -->
              <div class="h-1.5 w-full ${item.stripe}"></div>

              <div class="p-4 flex flex-col flex-1">
                <!-- Icon + spec badge -->
                <div class="flex items-start justify-between mb-3">
                  <div class="w-11 h-11 rounded-xl ${item.iconBg} flex items-center justify-center text-2xl shadow-xs shrink-0">
                    ${item.icon}
                  </div>
                  <span class="text-[10px] font-bold px-2 py-1 rounded-lg border ${item.badgeBg} leading-tight text-center max-w-[90px]">
                    ${item.spec}
                  </span>
                </div>

                <!-- Product name -->
                <h3 class="text-sm font-black text-gray-900 leading-snug mb-0.5">${item.name}</h3>
                <span class="text-[10px] text-gray-400 font-medium mb-3">รหัส: <span class="font-black text-gray-600">${item.id}</span></span>

                <!-- Price display -->
                <div class="mt-auto pt-3 border-t-2 border-dashed border-gray-100">
                  <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">ราคาขายปัจจุบัน</span>
                  <div class="flex items-baseline gap-1 mb-1">
                    <span class="text-3xl font-black ${item.priceColor} tabular-nums">${item.price.toLocaleString()}</span>
                    <span class="text-sm font-bold text-gray-500">บาท</span>
                    <span class="text-xs text-gray-400 font-medium">/ ${item.unit}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] text-gray-400">คงเหลือ: <b class="text-gray-600">${typeof item.stock === 'number' ? (item.unit === 'กก.' ? item.stock.toFixed(2) : item.stock.toLocaleString()) : item.stock}</b> ${item.unit}</span>
                    <button class="quick-edit-price-btn inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl ${item.editBtnStyle} text-xs font-bold transition-all shadow-xs hover:shadow-sm active:scale-95 border"
                      data-id="${item.id}" title="แก้ไขราคาขายนี้">
                      <i class="fas fa-pen-to-square text-[10px]"></i>
                      <span>แก้ไขราคา</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // 4.5 ตารางสินค้ากระป๋อง (dedicated section)
    const canProducts = allProducts.filter(p => {
      if (p.unit !== 'กระป๋อง') return false;
      const dateStr = p.updatedDate || '';
      const pYear = dateStr.substring(0, 4);
      const pMonth = dateStr.substring(5, 7);
      if (this.yearFilter !== 'all' && pYear !== this.yearFilter) return false;
      if (this.monthFilter !== 'all' && pMonth !== this.monthFilter) return false;
      return true;
    });
    const totalCanStock = canProducts.reduce((s, p) => s + (parseFloat(p.stock) || 0), 0);
    const totalCanValue = canProducts.reduce((s, p) => s + ((parseFloat(p.stock) || 0) * p.price), 0);

    const canTableRowsHtml = canProducts.length === 0
      ? `<tr><td colspan="6" class="py-10 text-center text-sm text-gray-400">
           <div class="w-10 h-10 rounded-xl bg-gray-50 text-gray-300 flex items-center justify-center mx-auto text-xl mb-2"><i class="fas fa-jar"></i></div>
           ยังไม่มีสินค้ากระป๋อง — กดปุ่ม "เพิ่มสินค้ากระป๋องใหม่" ด้านบน
         </td></tr>`
      : canProducts.map(p => {
          const isChrys = (p.category || p.name || '').includes('เก๊กฮวย');
          const emoji   = isChrys ? '🌼' : '🌿';
          const stripeBg = isChrys ? 'bg-amber-400' : 'bg-sky-500';
          const badgeStyle = isChrys
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-sky-50 text-sky-800 border-sky-200';
          const stockNum = parseFloat(p.stock) || 0;
          const canValue = stockNum * p.price;
          const isLow = stockNum < 10 && stockNum > 0;
          const stockColor = stockNum === 0 ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-gray-900';
          const stockBadge = stockNum === 0
            ? `<span class="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-md">หมดสต็อก</span>`
            : isLow
              ? `<span class="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-md">เหลือน้อย</span>`
              : `<span class="text-[10px] font-medium text-emerald-600">พร้อมจำหน่าย</span>`;
          return `
            <tr class="border-b border-gray-100 last:border-0 hover:bg-teal-50/20 transition-colors group">
              <td class="py-4 px-4 text-center align-middle w-10">
                <div class="w-2 h-10 rounded-full ${stripeBg} mx-auto opacity-80"></div>
              </td>
              <td class="py-4 px-4 align-middle w-28">
                <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 font-bold text-gray-700 text-xs">
                  <i class="fas fa-barcode text-[10px] text-gray-400"></i> ${p.id}
                </span>
              </td>
              <td class="py-4 px-4 align-middle">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">${emoji}</span>
                  <div>
                    <div class="font-black text-gray-900 text-sm leading-snug">${p.name}</div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeStyle} mt-0.5 inline-block">${p.category || 'ทั่วไป'}</span>
                  </div>
                </div>
              </td>
              <td class="py-4 px-4 text-right align-middle">
                <div class="inline-flex items-center gap-1">
                  <span class="text-lg font-black text-emerald-700">${p.price.toLocaleString()}</span>
                  <span class="text-xs text-gray-400 font-medium">บาท/กระป๋อง</span>
                  <button class="quick-edit-price-btn ml-1 p-1 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-colors border border-transparent hover:border-emerald-200 opacity-0 group-hover:opacity-100"
                    data-id="${p.id}" title="แก้ไขราคา"><i class="fas fa-pen-to-square text-xs"></i>
                  </button>
                </div>
              </td>
              <td class="py-4 px-4 text-center align-middle">
                <div class="flex flex-col items-center gap-0.5">
                  <div class="flex items-baseline gap-1">
                    <span class="text-2xl font-black ${stockColor} tabular-nums">${stockNum.toLocaleString()}</span>
                    <span class="text-xs font-bold text-gray-500">กระป๋อง</span>
                  </div>
                  ${stockBadge}
                  <div class="text-[10px] text-indigo-600 font-medium">~${formatBaht(canValue)}</div>
                </div>
              </td>
              <td class="py-4 px-4 text-right align-middle">
                <div class="flex items-center justify-end gap-1.5">
                  <button class="deduct-stock-btn px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                    data-id="${p.id}"><i class="fas fa-cart-arrow-down text-[11px]"></i><span>ตัดสต็อก</span>
                  </button>
                  <button class="edit-product-btn px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all flex items-center gap-1"
                    data-id="${p.id}"><i class="fas fa-edit text-[11px] text-amber-700"></i><span>แก้ไข</span>
                  </button>
                  <button class="delete-product-btn p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-all"
                    data-id="${p.id}"><i class="fas fa-trash text-xs"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');

    const canProductsSectionHtml = `
      <div class="rounded-2xl border border-teal-700/20 shadow-md overflow-hidden">
        <div class="bg-teal-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/15 text-white flex items-center justify-center text-lg shrink-0">
              <i class="fas fa-jar"></i>
            </div>
            <div>
              <h2 class="text-base sm:text-lg font-black text-white tracking-wide">
                ตารางสินค้ากระป๋อง — ผลผลิตสมุนไพรอบแห้ง
              </h2>
              <p class="text-xs text-teal-200 mt-0.5">
                ${canProducts.length} รายการ · คงเหลือ <b class="text-white">${totalCanStock.toLocaleString()}</b> กระป๋อง · มูลค่ารวม <b class="text-white">${formatBaht(totalCanValue)}</b>
              </p>
            </div>
          </div>
          <button id="open-add-can-product-btn"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-bold transition-all shadow-xs self-start sm:self-auto shrink-0">
            <i class="fas fa-plus"></i> + เพิ่มสินค้ากระป๋องใหม่
          </button>
        </div>

        <div class="bg-white overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-teal-50 text-[11px] font-black text-teal-900 uppercase tracking-wide border-b-2 border-teal-200">
                <th class="py-3.5 px-4 w-10"></th>
                <th class="py-3.5 px-4 w-28">รหัสสินค้า</th>
                <th class="py-3.5 px-4">ชื่อสินค้า / ประเภท</th>
                <th class="py-3.5 px-4 text-right">ราคาขาย</th>
                <th class="py-3.5 px-4 text-center">คงเหลือในคลัง</th>
                <th class="py-3.5 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>${canTableRowsHtml}</tbody>
            ${canProducts.length > 0 ? `
            <tfoot>
              <tr class="bg-teal-50/70 border-t-2 border-teal-600 font-black text-sm">
                <td colspan="4" class="py-3 px-4 text-right text-teal-900">รวมทั้งหมด (${canProducts.length} รายการ):</td>
                <td class="py-3 px-4 text-center text-teal-800 text-base">${totalCanStock.toLocaleString()} <span class="text-xs font-medium">กระป๋อง</span></td>
                <td class="py-3 px-4 text-right text-emerald-700">${formatBaht(totalCanValue)}</td>
              </tr>
            </tfoot>` : ''}
          </table>
        </div>

        <div class="bg-teal-50/60 border-t border-teal-100 px-6 py-2.5 flex items-center gap-2 text-[11px] text-teal-700">
          <i class="fas fa-circle-info text-teal-500"></i>
          <span>เพิ่มสินค้ากระป๋องรูปแบบใหม่ได้ทุกเมื่อ · กด <b>"+ เพิ่มสินค้ากระป๋องใหม่"</b> แล้วตั้งหน่วยเป็น <b>กระป๋อง</b> · ระบบจะแสดงที่นี่โดยอัตโนมัติ</span>
        </div>
      </div>
    `;

    // 5. Generate Rows for the 5-Column Table (All Products)
    const tableRowsHtml = filteredProducts.length === 0
      ? `
        <tr>
          <td colspan="5" class="py-12 px-6 text-center text-sm text-gray-400 bg-white">
            <div class="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto text-xl mb-2">
              <i class="fas fa-box-open"></i>
            </div>
            <p class="font-bold text-gray-600">ไม่พบรายการสินค้าที่ตรงกับเงื่อนไขการค้นหา</p>
            <p class="text-xs text-gray-400 mt-1">สามารถกดปุ่ม "+ เพิ่มรายการสินค้าใหม่" ด้านบนเพื่อเพิ่มสินค้าเข้าสู่คลัง</p>
          </td>
        </tr>
      `
      : filteredProducts.map(p => {
          const isKg = p.unit === 'กก.';
          const isJar = p.unit === 'กระปุก';
          const isPouch = p.unit === 'ซอง';

          let unitBadgeStyle = 'bg-gray-100 text-gray-700 border-gray-200';
          if (isKg) unitBadgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
          else if (isJar) unitBadgeStyle = 'bg-sky-50 text-sky-800 border-sky-200';
          else if (isPouch) unitBadgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';

          const stockDisplay = isKg ? parseFloat(p.stock || 0).toFixed(2) : (p.stock || 0).toLocaleString();

          return `
            <tr class="border-b border-gray-100 last:border-0 even:bg-gray-50/60 hover:bg-emerald-50/40 transition-colors">
              <!-- คอลัมน์ที่ 1: รหัสสินค้า -->
              <td class="py-4 px-6 text-left align-middle font-bold text-emerald-800 text-base tracking-wide">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80">
                  <i class="fas fa-barcode text-xs text-emerald-600"></i>
                  ${p.id}
                </span>
              </td>

              <!-- คอลัมน์ที่ 2: สินค้า -->
              <td class="py-4 px-6 text-left align-middle">
                <div class="text-base font-bold text-gray-900 leading-snug">${p.name}</div>
                <div class="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                  <span>หมวด: <b class="text-gray-600 font-medium">${p.category || 'ทั่วไป'}</b></span>
                  <span class="text-gray-300">•</span>
                  <span>อัปเดต: ${formatThaiDate(p.updatedDate)}</span>
                </div>
              </td>

              <!-- คอลัมน์ที่ 3: ราคา พร้อมปุ่มแก้ไขราคาด่วน -->
              <td class="py-4 px-6 text-right align-middle">
                <div class="inline-flex flex-col items-end">
                  <div class="flex items-center gap-1.5 justify-end">
                    <span class="text-base font-black text-emerald-800">${formatBaht(p.price)}</span>
                    <button class="quick-edit-price-btn p-1.5 rounded-lg text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100 transition-colors border border-transparent hover:border-emerald-200"
                      data-id="${p.id}" title="แก้ไขราคาขายนี้">
                      <i class="fas fa-pen-to-square text-xs"></i>
                    </button>
                  </div>
                  <span class="text-xs text-gray-500 font-medium block mt-0.5">ต่อ ${p.unit}</span>
                </div>
              </td>

              <!-- คอลัมน์ที่ 4: หน่วยเรียก -->
              <td class="py-4 px-6 text-center align-middle">
                <span class="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border ${unitBadgeStyle}">
                  ${p.unit}
                </span>
              </td>

              <!-- คอลัมน์ที่ 5: จำนวนที่มีอยู่ พร้อมปุ่มจัดการตัดสต็อก/แก้ไข -->
              <td class="py-4 px-6 text-right align-middle">
                <div class="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-3">
                  <!-- ตัวเลขสต็อก -->
                  <div class="text-right">
                    <span class="text-lg font-black text-gray-900">${stockDisplay}</span>
                    <span class="text-xs font-bold text-gray-500 ml-0.5">${p.unit}</span>
                  </div>

                  <!-- ปุ่มจัดการ (ตัดสต็อก, แก้ไข, ลบ) -->
                  <div class="flex items-center gap-1.5 shrink-0">
                    <button class="deduct-stock-btn px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1"
                      data-id="${p.id}" title="บันทึกจำหน่าย / ตัดสต็อก">
                      <i class="fas fa-cart-arrow-down text-[11px]"></i>
                      <span>ตัดสต็อก</span>
                    </button>

                    <button class="edit-product-btn px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all flex items-center gap-1"
                      data-id="${p.id}" title="แก้ไขข้อมูลสินค้า / ปรับปรุงจำนวนสต็อก">
                      <i class="fas fa-edit text-[11px] text-amber-700"></i>
                      <span>แก้ไข</span>
                    </button>

                    <button class="delete-product-btn p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-all"
                      data-id="${p.id}" title="ลบรายการสินค้านี้">
                      <i class="fas fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          `;
        }).join('');

    return `
      <div class="fade-in space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <i class="fa-solid fa-boxes-stacked text-emerald-700"></i>
              คลังสินค้า
            </h1>
            <p class="text-sm text-gray-500 mt-1">บริหารจัดการรายการสินค้า สต็อกคงเหลือ และบันทึกตัดสต็อกจำหน่าย</p>
          </div>

          <div class="flex items-center gap-2.5 flex-wrap">
            <button id="open-add-product-btn" class="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-sm">
              <i class="fas fa-plus"></i>
              <span>+ เพิ่มรายการสินค้าใหม่</span>
            </button>

            <a href="#fresh-produce" class="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs">
              <i class="fa-solid fa-box-open text-amber-600"></i>
              <span>ผลผลิตดอกสด &rarr;</span>
            </a>
            <a href="#finance" class="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs">
              <i class="fa-solid fa-hand-holding-dollar text-emerald-600"></i>
              <span>การเงินรายสมาชิก &rarr;</span>
            </a>
          </div>
        </div>

        <!-- กล่องสรุปภาพรวม: แสดงจำนวนสินค้ารวมทั้งหมดในคลัง แยกตามหน่วยเรียกชัดเจน -->
        ${summaryCardsHtml}

        <!-- ===== Enterprise Lifecycle Flow Banner (วงจรการทำงาน & อัตราส่วนแปรรูป 10:1) ===== -->
        <div class="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white p-5 shadow-lg relative overflow-hidden">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-amber-950 uppercase tracking-wide">
                  <i class="fas fa-arrows-spin mr-1"></i> วงจรการทำงานวิสาหกิจ
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  <i class="fas fa-scale-balanced mr-1"></i> อัตราส่วนมาตรฐาน 10:1 (สด 150 kg ➔ แห้ง 15 kg)
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <i class="fas fa-bolt mr-1"></i> ระบบตัดสต็อกอัตโนมัติ (Auto-Deduction)
                </span>
              </div>
              <h2 class="text-base sm:text-lg font-black text-white mt-1.5 flex items-center gap-2 flex-wrap">
                <span>ความสัมพันธ์ของการแปรรูป & การตัดสต็อกสินค้า</span>
                <span class="text-xs font-normal text-amber-300">(ผลผลิตสด 10 กก. = ผลผลิตแห้ง 1 กก. · Yield 10%)</span>
              </h2>
              <p class="text-xs text-gray-300 mt-1 max-w-2xl">
                ระบบจัดการคลังสต็อกเชื่อมต่ออัตโนมัติ: เมื่อใดที่มีการบันทึกการขาย ระบบจะ <b class="text-amber-300 underline underline-offset-2">"หักลบตัวเลขออกจากสต็อก"</b> ทันทีโดยไม่ต้องแก้ข้อมูลด้วยตนเอง
              </p>
            </div>
            <div class="shrink-0 flex items-center gap-2 text-xs">
              <a href="#sales" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5 shadow">
                <i class="fas fa-cash-register"></i> บันทึกการขาย (ตัดสต็อก)
              </a>
              <a href="#fresh-produce" class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 font-bold transition flex items-center gap-1 border border-white/10">
                <i class="fas fa-fire-alt text-amber-400"></i> โรงอบแห้ง
              </a>
            </div>
          </div>

          <!-- Flow Steps Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
            <!-- 1. เก็บเกี่ยว -->
            <div class="p-2.5 rounded-xl bg-white/10 border border-white/10 flex flex-col justify-between">
              <span class="text-[10px] text-emerald-400 font-bold">ขั้นตอนที่ 1</span>
              <div class="font-black text-white text-xs mt-0.5">🌾 เก็บเกี่ยว (รอบที่ 1)</div>
              <div class="text-[10px] text-gray-300 mt-1">ชั่งน้ำหนักสด เช่น 150 กก.</div>
            </div>
            <!-- 2. อบ/ตากแห้ง -->
            <div class="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30 flex flex-col justify-between">
              <span class="text-[10px] text-amber-300 font-bold">ขั้นตอนที่ 2 (สูตร 10:1)</span>
              <div class="font-black text-amber-200 text-xs mt-0.5">☀️ อบ / ตากแห้ง</div>
              <div class="text-[10px] text-amber-100/90 mt-1 font-bold">สด 150 kg ➔ แห้ง 15 kg</div>
            </div>
            <!-- 3. เข้าสต็อก -->
            <div class="p-2.5 rounded-xl bg-sky-500/20 border-2 border-sky-400 flex flex-col justify-between relative shadow">
              <span class="text-[10px] text-sky-300 font-bold">ขั้นตอนที่ 3 (หน้านี้)</span>
              <div class="font-black text-sky-100 text-xs mt-0.5">📦 เข้าสต็อกรวม</div>
              <div class="text-[10px] text-sky-200 mt-1">คลังดอกแห้ง & กระป๋อง 50G</div>
              <div class="text-[9px] text-rose-300 font-bold mt-1 bg-rose-950/70 px-1.5 py-0.5 rounded border border-rose-500/50">
                ↩ ถูกหักลบอัตโนมัติเมื่อขาย
              </div>
            </div>
            <!-- 4. ขาย -->
            <div class="p-2.5 rounded-xl bg-emerald-600/30 border border-emerald-400/40 flex flex-col justify-between">
              <span class="text-[10px] text-emerald-300 font-bold">ขั้นตอนที่ 4</span>
              <div class="font-black text-emerald-200 text-xs mt-0.5">💰 จัดการขาย</div>
              <div class="text-[10px] text-emerald-100/80 mt-1 font-bold">⚡ ตัดสต็อกอัตโนมัติ</div>
            </div>
            <!-- 5. ประวัติการขาย -->
            <div class="p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30 flex flex-col justify-between">
              <span class="text-[10px] text-purple-300 font-bold">ขั้นตอนที่ 5</span>
              <div class="font-black text-purple-200 text-xs mt-0.5">📜 ประวัติการขาย</div>
              <div class="text-[10px] text-purple-100/80 mt-1">บันทึกธุรกรรมย้อนหลัง</div>
            </div>
          </div>
        </div>

        <!-- แถบเกณฑ์ราคาจำหน่ายผลผลิตมาตรฐานวิสาหกิจชุมชน -->
        ${standardPriceBarHtml}

        <!-- ===== ตารางสินค้ากระป๋อง ===== -->
        ${canProductsSectionHtml}

        <!-- Search and Filter Bar (พร้อมตัวกรองเดือนและปี) -->
        <div class="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm space-y-3">
          <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            
            <!-- Search Input -->
            <div class="relative flex-1 min-w-[240px]">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <i class="fas fa-search text-xs"></i>
              </span>
              <input type="text" id="inventory-search-input" value="${this.searchQuery}" placeholder="ค้นหารหัสสินค้า (PRD-XXX) หรือชื่อสินค้า..." 
                class="w-full pl-9 pr-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <!-- Filter Controls Group: Unit, Month, Year -->
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Unit Filter -->
              <div class="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                <span class="text-[11px] font-bold text-gray-500 whitespace-nowrap"><i class="fas fa-filter text-emerald-600 mr-1"></i>หน่วย:</span>
                <select id="inventory-unit-filter" class="px-1.5 py-0.5 rounded-lg border-0 text-xs font-bold text-gray-700 bg-transparent focus:outline-none cursor-pointer">
                  <option value="all" ${this.unitFilter === 'all' ? 'selected' : ''}>ทุกหน่วย (${allProducts.length})</option>
                  ${activeUnits.map(u => `
                    <option value="${u}" ${this.unitFilter === u ? 'selected' : ''}>${u}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Month Filter (ตัวกรองเดือน) -->
              <div class="flex items-center gap-1.5 bg-emerald-50/70 px-3 py-1.5 rounded-xl border border-emerald-200/80">
                <span class="text-[11px] font-bold text-emerald-800 whitespace-nowrap"><i class="fas fa-calendar-days text-emerald-600 mr-1"></i>เดือน:</span>
                <select id="inventory-month-filter" class="px-1.5 py-0.5 rounded-lg border-0 text-xs font-black text-emerald-900 bg-transparent focus:outline-none cursor-pointer">
                  <option value="all" ${this.monthFilter === 'all' ? 'selected' : ''}>ทุกเดือน</option>
                  ${THAI_MONTHS_SELECT.map(m => `
                    <option value="${m.val}" ${this.monthFilter === m.val ? 'selected' : ''}>${m.name}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Year Filter (ตัวกรองปี) -->
              <div class="flex items-center gap-1.5 bg-emerald-50/70 px-3 py-1.5 rounded-xl border border-emerald-200/80">
                <span class="text-[11px] font-bold text-emerald-800 whitespace-nowrap"><i class="fas fa-calendar text-emerald-600 mr-1"></i>ปี:</span>
                <select id="inventory-year-filter" class="px-1.5 py-0.5 rounded-lg border-0 text-xs font-black text-emerald-900 bg-transparent focus:outline-none cursor-pointer">
                  <option value="all" ${this.yearFilter === 'all' ? 'selected' : ''}>ทุกปี</option>
                  ${availableYears.map(y => `
                    <option value="${y}" ${this.yearFilter === y ? 'selected' : ''}>พ.ศ. ${parseInt(y) + 543} (${y})</option>
                  `).join('')}
                </select>
              </div>

              <!-- Reset Filters Button -->
              ${(this.unitFilter !== 'all' || this.monthFilter !== 'all' || this.yearFilter !== 'all' || this.searchQuery) ? `
                <button id="inventory-reset-filters-btn" class="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95" title="ล้างตัวกรองทั้งหมด">
                  <i class="fas fa-rotate-left text-[11px] text-gray-500"></i>
                  <span>ล้างตัวกรอง</span>
                </button>
              ` : ''}
            </div>

          </div>

          <!-- Active Filter Status Line -->
          <div class="flex items-center justify-between text-xs text-gray-500 pt-2.5 border-t border-gray-100 flex-wrap gap-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-medium text-gray-400">สถานะตัวกรอง:</span>
              <span class="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-[11px]">
                ${this.yearFilter === 'all' ? 'ทุกปี' : `ปี พ.ศ. ${parseInt(this.yearFilter)+543}`} · 
                ${this.monthFilter === 'all' ? 'ทุกเดือน' : `เดือน${THAI_MONTHS_SELECT.find(m => m.val === this.monthFilter)?.name || this.monthFilter}`} · 
                ${this.unitFilter === 'all' ? 'ทุกหน่วยเรียก' : `หน่วย ${this.unitFilter}`}
              </span>
            </div>
            <div class="text-right">
              แสดงผล <b>${filteredProducts.length}</b> จากทั้งหมด <b>${allProducts.length}</b> รายการ
            </div>
          </div>
        </div>


        <!-- ตารางคลังสินค้า 5 คอลัมน์ (Strict 5-Column Table) -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 text-xs font-bold text-gray-600 border-b border-gray-200">
                  <th class="py-4 px-6 text-left w-36 uppercase tracking-wider">คอลัมน์ที่ 1: รหัสสินค้า</th>
                  <th class="py-4 px-6 text-left uppercase tracking-wider">คอลัมน์ที่ 2: สินค้า</th>
                  <th class="py-4 px-6 text-right w-44 uppercase tracking-wider">คอลัมน์ที่ 3: ราคา</th>
                  <th class="py-4 px-6 text-center w-36 uppercase tracking-wider">คอลัมน์ที่ 4: หน่วยเรียก</th>
                  <th class="py-4 px-6 text-right w-72 uppercase tracking-wider">คอลัมน์ที่ 5: จำนวนที่มีอยู่</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  init() {
    // 1. Button + เพิ่มรายการสินค้าใหม่
    const addProductBtn = document.getElementById('open-add-product-btn');
    if (addProductBtn) {
      addProductBtn.addEventListener('click', () => {
        this.openAddProductModal();
      });
    }

    // 1b. Button + เพิ่มสินค้ากระป๋องใหม่ (pre-fill unit as กระป๋อง)
    const addCanProductBtn = document.getElementById('open-add-can-product-btn');
    if (addCanProductBtn) {
      addCanProductBtn.addEventListener('click', () => {
        this.openAddProductModal('กระป๋อง');
      });
    }

    // 2. Search input
    const searchInput = document.getElementById('inventory-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.refreshView();
      });
    }

    // 3. Unit filter dropdown
    const unitFilter = document.getElementById('inventory-unit-filter');
    if (unitFilter) {
      unitFilter.addEventListener('change', (e) => {
        this.unitFilter = e.target.value;
        this.refreshView();
      });
    }

    // 3b. Month filter dropdown (ตัวกรองเดือน)
    const monthFilter = document.getElementById('inventory-month-filter');
    if (monthFilter) {
      monthFilter.addEventListener('change', (e) => {
        this.monthFilter = e.target.value;
        this.refreshView();
      });
    }

    // 3c. Year filter dropdown (ตัวกรองปี)
    const yearFilter = document.getElementById('inventory-year-filter');
    if (yearFilter) {
      yearFilter.addEventListener('change', (e) => {
        this.yearFilter = e.target.value;
        this.refreshView();
      });
    }

    // 3d. Reset filters button
    const resetBtn = document.getElementById('inventory-reset-filters-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.searchQuery = '';
        this.unitFilter = 'all';
        this.monthFilter = 'all';
        this.yearFilter = 'all';
        this.refreshView();
      });
    }

    // 4. Action buttons: ตัดสต็อก
    const deductBtns = document.querySelectorAll('.deduct-stock-btn');
    deductBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openDeductStockModal(id);
      });
    });

    // 5. Action buttons: แก้ไข
    const editBtns = document.querySelectorAll('.edit-product-btn');
    editBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openEditProductModal(id);
      });
    });

    // 6. Action buttons: ลบ
    const deleteBtns = document.querySelectorAll('.delete-product-btn');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openDeleteProductModal(id);
      });
    });

    // 7. Action buttons: แก้ไขราคาด่วน (Quick Edit Price)
    const quickPriceBtns = document.querySelectorAll('.quick-edit-price-btn');
    quickPriceBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.openQuickEditPriceModal(id);
      });
    });
  },

  openQuickEditPriceModal(productId) {
    const product = appState.getProductById(productId);
    if (!product) return;

    const modalHtml = `
      <form id="global-quick-price-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-5">
          <!-- Product Info Header Box -->
          <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div class="space-y-0.5">
              <span class="text-xs font-bold text-emerald-800 uppercase block">กำหนดราคาจำหน่ายผลผลิต</span>
              <h3 class="text-base font-black text-emerald-950">${product.name}</h3>
              <span class="text-xs text-emerald-700 font-medium">รหัสสินค้า: <b>${product.id}</b> | หมวดหมู่: <b>${product.category || 'ทั่วไป'}</b></span>
            </div>
            <div class="text-right">
              <span class="text-xs text-gray-500 block">ราคาปัจจุบัน:</span>
              <span class="text-xl font-black text-emerald-800">${formatBaht(product.price)}</span>
              <span class="text-xs text-gray-500 font-medium block">ต่อ ${product.unit}</span>
            </div>
          </div>

          <!-- Price Input Field -->
          <div class="space-y-1.5">
            <label for="quick-price-input" class="block text-xs font-bold text-gray-700 uppercase">
              ระบุราคาขายใหม่ (บาท / ${product.unit}) *
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 font-bold text-base">฿</span>
              <input type="number" id="quick-price-input" name="price" required min="0" step="any" value="${product.price}"
                class="w-full pl-9 pr-16 py-3 rounded-xl border-2 border-emerald-400 text-2xl font-black text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono">
              <span class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-bold text-gray-500 pointer-events-none">
                บาท / ${product.unit}
              </span>
            </div>
            <p class="text-xs text-gray-400">
              ราคาที่แก้ไขจะถูกนำไปใช้อ้างอิงการตัดสต็อก การคำนวณมูลค่าในคลัง และการสรุปรายงานการเงินโดยอัตโนมัติ
            </p>
          </div>

          <!-- Live Calculation Preview Card -->
          <div class="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
            <span class="text-xs font-bold text-gray-700 block uppercase">
              <i class="fas fa-calculator text-emerald-700 mr-1"></i> ตัวอย่างการคำนวณมูลค่าตามราคาใหม่
            </span>
            <div id="quick-price-preview-calc" class="grid grid-cols-3 gap-2.5 pt-1 text-center">
              ${this.renderPriceCalculationGrid(product.unit, product.price)}
            </div>
          </div>
        </div>

        <div class="flex justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2.5 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 active:scale-95">
            <i class="fas fa-save"></i> บันทึกราคาใหม่
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: `แก้ไขราคาขาย: ${product.name}`,
      icon: 'fas fa-pen-to-square',
      size: 'max-w-lg',
      headerColor: 'bg-emerald-700',
      content: modalHtml,
      onRender: (dialog) => {
        const priceInput = dialog.querySelector('#quick-price-input');
        const previewContainer = dialog.querySelector('#quick-price-preview-calc');
        if (priceInput && previewContainer) {
          priceInput.addEventListener('input', () => {
            const p = parseFloat(priceInput.value) || 0;
            previewContainer.innerHTML = this.renderPriceCalculationGrid(product.unit, p);
          });
        }

        const form = dialog.querySelector('#global-quick-price-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const newPrice = parseFloat(priceInput ? priceInput.value : 0);
            if (isNaN(newPrice) || newPrice < 0) {
              showToast('กรุณาระบุราคาที่ถูกต้องและไม่ติดลบ', 'error');
              return;
            }

            try {
              appState.updateProductPrice(productId, newPrice);
              closeGlobalModal();
              showToast(`อัปเดตราคาขาย ${product.name} เป็น ${formatBaht(newPrice)} / ${product.unit} เรียบร้อยแล้ว`, 'success');
              this.refreshView();
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        }
      }
    });
  },

  renderPriceCalculationGrid(unit, price) {
    const isKg = unit === 'กก.' || unit === 'kg';
    if (isKg) {
      return `
        <div class="p-2.5 bg-white rounded-xl border border-gray-200">
          <span class="text-[11px] text-gray-500 font-semibold block">1 กก.</span>
          <span class="text-sm font-black text-emerald-800 font-mono">${(price * 1).toLocaleString()} บ.</span>
        </div>
        <div class="p-2.5 bg-white rounded-xl border border-gray-200">
          <span class="text-[11px] text-gray-500 font-semibold block">5 กก.</span>
          <span class="text-sm font-black text-emerald-800 font-mono">${(price * 5).toLocaleString()} บ.</span>
        </div>
        <div class="p-2.5 bg-white rounded-xl border border-gray-200">
          <span class="text-[11px] text-gray-500 font-semibold block">10 กก.</span>
          <span class="text-sm font-black text-emerald-800 font-mono">${(price * 10).toLocaleString()} บ.</span>
        </div>
      `;
    } else {
      return `
        <div class="p-2.5 bg-white rounded-xl border border-gray-200">
          <span class="text-[11px] text-gray-500 font-semibold block">1 กระปุก</span>
          <span class="text-sm font-black text-emerald-800 font-mono">${(price * 1).toLocaleString()} บ.</span>
        </div>
        <div class="p-2.5 bg-white rounded-xl border border-gray-200">
          <span class="text-[11px] text-gray-500 font-semibold block">5 กระปุก</span>
          <span class="text-sm font-black text-emerald-800 font-mono">${(price * 5).toLocaleString()} บ.</span>
        </div>
        <div class="p-2.5 bg-white rounded-xl border border-gray-200">
          <span class="text-[11px] text-gray-500 font-semibold block">20 กระปุก (~1 กก.)</span>
          <span class="text-sm font-black text-emerald-800 font-mono">${(price * 20).toLocaleString()} บ.</span>
        </div>
      `;
    }
  },

  openAddProductModal(defaultUnit = 'กก.') {
    const products = appState.getProducts();
    const maxIdNum = products.reduce((max, p) => {
      const parts = (p.id || '').split('-');
      const num = parseInt(parts[1]);
      return (!isNaN(num) && num > max) ? num : max;
    }, 0);
    const nextId = `PRD-${String(maxIdNum + 1).padStart(3, '0')}`;

    const formHtml = `
      <form id="global-add-product-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="prod-id" class="block text-xs font-semibold text-gray-500 uppercase mb-1">รหัสสินค้า *</label>
              <input type="text" id="prod-id" name="id" required value="${nextId}" placeholder="เช่น PRD-001"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-base font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <span class="text-[10px] text-gray-400 block mt-0.5">ระบบรันรหัสอัตโนมัติให้ สามารถปรับเปลี่ยนได้</span>
            </div>

            <div>
              <label for="prod-category" class="block text-xs font-semibold text-gray-500 uppercase mb-1">หมวดหมู่พืช / ประเภทสินค้า</label>
              <select id="prod-category" name="category"
                class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="เก๊กฮวย">เก๊กฮวย</option>
                <option value="คาโมมายล์">คาโมมายล์</option>
                <option value="สมุนไพรรวม">สมุนไพรรวม</option>
                <option value="แปรรูปบรรจุภัณฑ์">แปรรูปบรรจุภัณฑ์</option>
              </select>
            </div>

            <div class="md:col-span-2">
              <label for="prod-name" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ชื่อสินค้า *</label>
              <input type="text" id="prod-name" name="name" required placeholder="เช่น ดอกเก๊กฮวยอบแห้ง, ชาคาโมมายล์แบบกระป๋อง"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-base font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label for="prod-price" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ราคาขายต่อหน่วย (บาท) *</label>
              <input type="number" id="prod-price" name="price" required min="0" step="any" placeholder="เช่น 120, 450"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-base font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label for="prod-unit" class="block text-xs font-semibold text-gray-500 uppercase mb-1">หน่วยเรียก *</label>
              <div class="flex items-center gap-2">
                <select id="prod-unit-select" class="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="กก." ${defaultUnit === 'กก.' ? 'selected' : ''}>กก.</option>
                  <option value="กระป๋อง" ${defaultUnit === 'กระป๋อง' ? 'selected' : ''}>กระป๋อง</option>
                  <option value="ซอง" ${defaultUnit === 'ซอง' ? 'selected' : ''}>ซอง</option>
                  <option value="กล่อง" ${defaultUnit === 'กล่อง' ? 'selected' : ''}>กล่อง</option>
                  <option value="ขวด" ${defaultUnit === 'ขวด' ? 'selected' : ''}>ขวด</option>
                  <option value="custom">-- ระบุเอง --</option>
                </select>
                <input type="text" id="prod-unit" name="unit" required value="${defaultUnit}" placeholder="เช่น กก., กระป๋อง"
                  class="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>
            </div>


            <div class="md:col-span-2">
              <label for="prod-stock" class="block text-xs font-semibold text-gray-500 uppercase mb-1">จำนวนสต็อกเริ่มต้นที่มีอยู่ *</label>
              <input type="number" id="prod-stock" name="stock" required min="0" step="any" value="0" placeholder="เช่น 125, 15.5"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-base font-black text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <span class="text-[10px] text-gray-400 block mt-0.5">ระบุยอดสินค้าที่มีอยู่จริงในคลังสินค้า</span>
            </div>
          </div>
        </div>

        <div class="flex justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2.5 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5">
            <i class="fas fa-save"></i> บันทึกรายการสินค้า
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: 'เพิ่มรายการสินค้าใหม่ในคลัง',
      icon: 'fas fa-plus',
      size: 'max-w-2xl',
      headerColor: 'bg-[#1e4620]',
      content: formHtml,
      onRender: (dialog) => {
        const unitSelect = dialog.querySelector('#prod-unit-select');
        const unitInput = dialog.querySelector('#prod-unit');
        if (unitSelect && unitInput) {
          unitSelect.addEventListener('change', () => {
            if (unitSelect.value !== 'custom') {
              unitInput.value = unitSelect.value;
            } else {
              unitInput.value = '';
              unitInput.focus();
            }
          });
        }

        const form = dialog.querySelector('#global-add-product-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {
              id: formData.get('id'),
              name: formData.get('name'),
              category: formData.get('category'),
              price: formData.get('price'),
              unit: formData.get('unit'),
              stock: formData.get('stock')
            };

            try {
              appState.addProduct(data);
              closeGlobalModal();
              showToast(`เพิ่มสินค้า "${data.name}" (${data.id}) เข้าคลังเรียบร้อยแล้ว`, 'success');
              this.refreshView();
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        }
      }
    });
  },

  openEditProductModal(productId) {
    const product = appState.getProductById(productId);
    if (!product) return;

    const formHtml = `
      <form id="global-edit-product-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-4">
          <div class="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold text-emerald-800 uppercase block">รหัสสินค้า</span>
              <span class="text-lg font-black text-emerald-950 mt-0.5 block">${product.id}</span>
            </div>
            <span class="text-xs font-bold text-emerald-700 bg-white px-3 py-1 rounded-xl border border-emerald-200">
              หมวดหมู่: ${product.category || 'ทั่วไป'}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label for="edit-prod-name" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ชื่อสินค้า *</label>
              <input type="text" id="edit-prod-name" name="name" required value="${product.name}"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-base font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label for="edit-prod-price" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ราคาขายต่อหน่วย (บาท) *</label>
              <input type="number" id="edit-prod-price" name="price" required min="0" step="any" value="${product.price}"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-base font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label for="edit-prod-unit" class="block text-xs font-semibold text-gray-500 uppercase mb-1">หน่วยเรียก *</label>
              <input type="text" id="edit-prod-unit" name="unit" required value="${product.unit}"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div class="md:col-span-2">
              <label for="edit-prod-stock" class="block text-xs font-semibold text-gray-500 uppercase mb-1">จำนวนสต็อกคงเหลือปัจจุบัน (${product.unit}) *</label>
              <input type="number" id="edit-prod-stock" name="stock" required min="0" step="any" value="${product.stock}"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xl font-black text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <span class="text-[10px] text-gray-400 block mt-0.5">การปรับยอดจำนวนที่นี่จะอัปเดตสต็อกคงเหลือของคลังสินค้าโดยตรง</span>
            </div>
          </div>
        </div>

        <div class="flex justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2.5 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5">
            <i class="fas fa-save"></i> บันทึกการแก้ไข
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: `แก้ไขข้อมูลสินค้า ${product.id}`,
      icon: 'fas fa-edit',
      size: 'max-w-2xl',
      headerColor: 'bg-amber-600',
      content: formHtml,
      onRender: (dialog) => {
        const form = dialog.querySelector('#global-edit-product-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {
              name: formData.get('name'),
              price: formData.get('price'),
              unit: formData.get('unit'),
              stock: formData.get('stock')
            };

            try {
              appState.updateProduct(productId, data);
              closeGlobalModal();
              showToast(`อัปเดตข้อมูลสินค้า ${productId} เรียบร้อยแล้ว`, 'success');
              this.refreshView();
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        }
      }
    });
  },

  openDeductStockModal(productId) {
    const product = appState.getProductById(productId);
    if (!product) return;

    const customers = appState.getCustomers();
    const todayStr = new Date().toISOString().split('T')[0];

    const custOptionsHtml = customers.map(c => `
      <option value="${c.id}">${c.name} (${c.customerType})</option>
    `).join('');

    const formHtml = `
      <form id="global-deduct-stock-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-4">
          <!-- Product Info Bar -->
          <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold text-emerald-800 uppercase block">ตัดสต็อกสินค้า</span>
              <span class="text-base font-black text-emerald-950 mt-0.5 block">${product.name} (${product.id})</span>
            </div>
            <div class="text-right">
              <span class="text-xs text-gray-500 block">คงเหลือปัจจุบัน:</span>
              <span class="text-xl font-black text-emerald-800">${product.stock} <span class="text-xs font-bold text-gray-500">${product.unit}</span></span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="deduct-amount" class="block text-xs font-semibold text-gray-500 uppercase mb-1">จำนวนที่ตัดสต็อก (${product.unit}) *</label>
              <input type="number" id="deduct-amount" name="amount" required min="0.01" max="${product.stock}" step="any" placeholder="เช่น 5"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-base font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label for="deduct-price" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ราคาจำหน่ายต่อหน่วย (บาท) *</label>
              <input type="number" id="deduct-price" name="price" required min="0" step="any" value="${product.price}"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-base font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label for="deduct-date" class="block text-xs font-semibold text-gray-500 uppercase mb-1">วันที่ทำรายการ *</label>
              <input type="date" id="deduct-date" name="date" required value="${todayStr}"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label for="deduct-customer-select" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ลูกค้าผู้ซื้อ / ช่องทางจำหน่าย</label>
              <select id="deduct-customer-select" name="customerId"
                class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">-- ลูกค้าทั่วไป / ไม่ระบุชื่อ --</option>
                ${custOptionsHtml}
              </select>
            </div>

            <div class="md:col-span-2 p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
              <span class="text-xs font-medium text-gray-600">รวมยอดเงินทั้งสิ้น:</span>
              <span id="deduct-total-price" class="text-xl font-black text-emerald-800">0.00 บาท</span>
            </div>
          </div>
        </div>

        <div class="flex justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2.5 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5">
            <i class="fas fa-check"></i> ยืนยันการตัดสต็อก
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: `ตัดสต็อกจำหน่าย: ${product.name}`,
      icon: 'fas fa-cart-arrow-down',
      size: 'max-w-2xl',
      headerColor: 'bg-emerald-700',
      content: formHtml,
      onRender: (dialog) => {
        const amountInput = dialog.querySelector('#deduct-amount');
        const priceInput = dialog.querySelector('#deduct-price');
        const totalSpan = dialog.querySelector('#deduct-total-price');

        const updateTotal = () => {
          const amt = parseFloat(amountInput ? amountInput.value : 0) || 0;
          const prc = parseFloat(priceInput ? priceInput.value : 0) || 0;
          if (totalSpan) totalSpan.textContent = formatBaht(amt * prc);
        };

        if (amountInput) amountInput.addEventListener('input', updateTotal);
        if (priceInput) priceInput.addEventListener('input', updateTotal);

        const form = dialog.querySelector('#global-deduct-stock-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const amount = parseFloat(formData.get('amount')) || 0;
            const price = parseFloat(formData.get('price')) || 0;
            const date = formData.get('date');
            const custId = formData.get('customerId');
            
            let custName = 'ลูกค้าทั่วไป / ไม่ระบุชื่อ';
            if (custId) {
              const cust = appState.getCustomerById(custId);
              if (cust) custName = cust.name;
            }

            try {
              appState.deductProductStock(productId, amount, custName, price, date, custId || null);
              closeGlobalModal();
              showToast(`ตัดสต็อก ${product.name} จำนวน ${amount} ${product.unit} สำเร็จ (บันทึกลงบัญชีเรียบร้อย)`, 'success');
              this.refreshView();
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        }
      }
    });
  },

  openDeleteProductModal(productId) {
    const product = appState.getProductById(productId);
    if (!product) return;

    const contentHtml = `
      <div class="p-6 md:p-8 space-y-4 text-center">
        <div class="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-2xl shadow-sm">
          <i class="fas fa-trash-alt"></i>
        </div>
        <div>
          <h4 class="text-lg font-bold text-gray-900">ยืนยันการลบรายการสินค้า</h4>
          <p class="text-sm text-gray-500 mt-1">
            คุณต้องการลบสินค้า <b>"${product.name}"</b> (รหัส: <b class="text-emerald-700">${product.id}</b>) ออกจากคลังสินค้าหรือไม่?
          </p>
          <div class="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500">
            จำนวนสต็อกคงเหลือปัจจุบัน: <b>${product.stock} ${product.unit}</b>
          </div>
        </div>

        <div class="flex justify-center gap-3 pt-4 border-t border-gray-100">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button type="button" id="confirm-delete-product-btn" class="px-6 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5">
            <i class="fas fa-trash-alt"></i> ยืนยันการลบ
          </button>
        </div>
      </div>
    `;

    openGlobalModal({
      title: `ลบรายการสินค้า ${product.id}`,
      icon: 'fas fa-trash-alt',
      size: 'max-w-md',
      headerColor: 'bg-rose-700',
      content: contentHtml,
      onRender: (dialog) => {
        const confirmBtn = dialog.querySelector('#confirm-delete-product-btn');
        if (confirmBtn) {
          confirmBtn.addEventListener('click', () => {
            try {
              appState.deleteProduct(productId);
              closeGlobalModal();
              showToast(`ลบรายการสินค้า ${product.name} เรียบร้อยแล้ว`, 'success');
              this.refreshView();
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        }
      }
    });
  },

  refreshView() {
    const main = document.getElementById('app-view');
    if (main) {
      main.innerHTML = this.render();
      this.init();
    }
  }
};
