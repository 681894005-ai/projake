// Member Financial Ledger and Sales Receipts Component
import { appState } from '../state.js';
import { formatThaiDate, formatBaht, showToast, openGlobalModal, closeGlobalModal } from '../helpers.js';

export const FinanceComponent = {
  activeTab: 'ledger', // 'ledger' | 'sales'
  searchMemberQuery: '',
  searchSaleQuery: '',
  selectedSaleIds: [],

  render() {
    const currentUser = appState.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'Member';

    const stats = appState.getStats();
    
    let plots = appState.getPlots();
    let crops = appState.getCrops();
    if (isMember) {
      plots = plots.filter(p => p.memberIds && p.memberIds.includes(currentUser.memberId));
      const plotIds = plots.map(p => p.id);
      crops = crops.filter(c => plotIds.includes(c.plotId));
    }
    const cropIds = crops.map(c => c.id);
    
    const members = appState.getMembers();
    const sales = appState.getSales().filter(s => cropIds.includes(s.cropId));
    const financialReport = appState.getFinancialReport();

    // 1. Filtered report for members tab
    let filteredReport = financialReport.filter(r => 
      r.name.toLowerCase().includes(this.searchMemberQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(this.searchMemberQuery.toLowerCase())
    );
    if (isMember) {
      filteredReport = filteredReport.filter(r => r.id === currentUser.memberId);
    }

    // Financial KPI Totals
    const totalReportRevenue = filteredReport.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
    const totalReportCost = filteredReport.reduce((sum, r) => sum + (r.totalCost || 0), 0);
    const totalReportProfit = filteredReport.reduce((sum, r) => sum + (r.netProfit || 0), 0);

    // 2. Build Finance Ledger Tab HTML
    const ledgerRowsHtml = filteredReport.length === 0
      ? `<tr><td colspan="7" class="px-6 py-8 text-center text-sm text-gray-500 bg-white">ไม่พบรายงานการเงินของสมาชิกรายที่ระบุ</td></tr>`
      : filteredReport.map(r => {
          const statusBadge = r.netProfit > 0 
            ? `<span class="px-2.5 py-1 text-xs font-bold bg-green-50 text-green-700 rounded-full border border-green-200"><i class="fas fa-arrow-up mr-0.5"></i> กำไร</span>`
            : r.netProfit < 0
              ? `<span class="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-700 rounded-full border border-red-200"><i class="fas fa-arrow-down mr-0.5"></i> ขาดทุน</span>`
              : `<span class="px-2.5 py-1 text-xs font-bold bg-gray-50 text-gray-600 rounded-full border border-gray-200">เท่าทุน</span>`;
          
          return `
            <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
              <td class="px-6 py-4 text-sm font-semibold text-emerald-800">${r.id}</td>
              <td class="px-6 py-4">
                <div class="text-sm font-bold text-gray-900">${r.name}</div>
                <div class="text-[10px] text-gray-400">บทบาท: ${r.role} (${r.villageNumber})</div>
              </td>
              <td class="px-6 py-4 text-center text-sm text-gray-700 font-medium">${r.totalCrops} รอบ</td>
              <td class="px-6 py-4 text-sm text-gray-600 font-medium">${formatBaht(r.totalCost)}</td>
              <td class="px-6 py-4 text-sm text-emerald-800 font-bold">${formatBaht(r.totalRevenue)}</td>
              <td class="px-6 py-4 text-sm font-extrabold ${r.netProfit >= 0 ? 'text-green-700' : 'text-red-600'}">
                ${r.netProfit > 0 ? '+' : ''}${formatBaht(r.netProfit)}
              </td>
              <td class="px-6 py-4 text-center">${statusBadge}</td>
            </tr>
          `;
        }).join('');

    const ledgerTabHtml = `
      <div class="space-y-4">
        <!-- Search and filters -->
        <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="relative flex-1 max-w-md">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <i class="fas fa-search text-xs"></i>
            </span>
            <input type="text" id="member-ledger-search" value="${this.searchMemberQuery}" placeholder="ค้นหาชื่อสมาชิกหรือรหัสทะเบียน..." 
              class="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          </div>
          <div class="text-xs text-gray-400">
            * สรุปยอดสะสมคำนวณจาก (รายได้จากการจำหน่ายผลผลิตล็อตสมาชิก) - (ต้นทุนสะสมรอบการเพาะปลูก)
          </div>
        </div>

        <!-- Table Card -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">
                  <th class="px-6 py-4">รหัสสมาชิก</th>
                  <th class="px-6 py-4">ชื่อ - นามสกุล</th>
                  <th class="px-6 py-4 text-center">จำนวนรอบปลูก</th>
                  <th class="px-6 py-4">ต้นทุนสะสม</th>
                  <th class="px-6 py-4">รายได้สะสม</th>
                  <th class="px-6 py-4">กำไรสุทธิสะสม</th>
                  <th class="px-6 py-4 text-center">สถานะการเงิน</th>
                </tr>
              </thead>
              <tbody>
                ${ledgerRowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // 3. Build Sales Log Tab HTML (With Checkbox Batch Management)
    let filteredSales = sales.filter(s => {
      if (!this.searchSaleQuery) return true;
      const q = this.searchSaleQuery.toLowerCase();
      const crop = appState.getCropById(s.cropId);
      const plot = crop ? appState.getPlotById(crop.plotId) : null;
      const plotName = plot ? plot.name.toLowerCase() : '';
      return (
        s.id.toLowerCase().includes(q) ||
        s.cropId.toLowerCase().includes(q) ||
        (s.customer && s.customer.toLowerCase().includes(q)) ||
        (s.customerId && s.customerId.toLowerCase().includes(q)) ||
        (s.date && s.date.includes(q)) ||
        plotName.includes(q)
      );
    });

    // Clean up selectedSaleIds that might no longer exist
    this.selectedSaleIds = this.selectedSaleIds.filter(id => sales.some(s => s.id === id));
    const allSalesChecked = filteredSales.length > 0 && filteredSales.every(s => this.selectedSaleIds.includes(s.id));
    const selectedCount = this.selectedSaleIds.length;
    const selectedTotalPrice = sales
      .filter(s => this.selectedSaleIds.includes(s.id))
      .reduce((sum, s) => sum + (s.totalPrice || 0), 0);

    const salesRowsHtml = filteredSales.length === 0
      ? `<tr><td colspan="11" class="px-6 py-8 text-center text-sm text-gray-500 bg-white">ยังไม่พบข้อมูลการจำหน่ายผลผลิตในระบบ</td></tr>`
      : filteredSales.map(s => {
          const crop = appState.getCropById(s.cropId);
          const plot = crop ? appState.getPlotById(crop.plotId) : null;
          const owners = plot ? members.filter(m => (plot.memberIds && plot.memberIds.includes(m.id)) || plot.memberId === m.id) : [];
          const ownersNames = owners.map(o => o.name).join(', ') || '-';
          const herbType = crop ? (crop.seedlingSource || (plot ? plot.plantType : '-') || '-') : '-';
          const isChrys = herbType === 'เก๊กฮวย' || herbType.includes('เก๊กฮวย');
          const isChecked = this.selectedSaleIds.includes(s.id);
          
          return `
            <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors ${isChecked ? 'bg-emerald-50/50' : ''}">
              <td class="px-4 py-3.5 text-center">
                <input type="checkbox" data-sale-id="${s.id}" ${isChecked ? 'checked' : ''}
                  class="sale-batch-checkbox rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 w-4 h-4 cursor-pointer">
              </td>
              <td class="px-4 py-3.5 text-sm font-semibold text-emerald-800">${s.id}</td>
              <td class="px-4 py-3.5 text-sm font-medium text-emerald-900">${s.cropId}</td>
              <td class="px-4 py-3.5 text-sm text-gray-800">${ownersNames}</td>
              <td class="px-4 py-3.5">
                <span class="px-2.5 py-0.5 text-[10px] font-semibold border rounded-full ${
                  isChrys ? 'badge-chrysanthemum' : 'badge-chamomile'
                }">${herbType}อบแห้ง</span>
              </td>
              <td class="px-4 py-3.5 text-sm text-gray-700 font-bold text-center">
                ${s.saleType === 'jar' ? `${s.amount || s.amountKg} กระปุก` : `${s.amountKg || s.amount} กก.`}
              </td>
              <td class="px-4 py-3.5 text-sm text-gray-500">
                ${s.saleType === 'jar' ? `${formatBaht(s.price || s.pricePerKg)}/กระปุก` : `${formatBaht(s.pricePerKg || s.price)}/กก.`}
              </td>
              <td class="px-4 py-3.5 text-sm font-black text-emerald-800">${formatBaht(s.totalPrice)}</td>
              <td class="px-4 py-3.5 text-sm text-gray-800">
                <div class="font-bold truncate max-w-[140px]" title="${s.customer}">${s.customer}</div>
                ${s.customerId ? `<span class="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">${s.customerId}</span>` : ''}
              </td>
              <td class="px-4 py-3.5 text-xs text-gray-400">${formatThaiDate(s.date)}</td>
              <td class="px-4 py-3.5 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <button class="view-sale-btn text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1" data-sale-id="${s.id}" title="ดูใบเสร็จ">
                    <i class="fas fa-eye text-[10px]"></i> ใบเสร็จ
                  </button>
                  <button class="delete-sale-btn text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 p-1 rounded-lg text-xs font-bold transition-all" data-sale-id="${s.id}" title="ลบรายการขายนี้">
                    <i class="fas fa-trash text-xs"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');

    const salesTabHtml = `
      <div class="space-y-4">
        <!-- Control Header for Batch Sales Management -->
        <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="flex items-center gap-3 flex-wrap">
            <div class="flex items-center gap-2">
              <input type="checkbox" id="select-all-sales-checkbox" ${allSalesChecked ? 'checked' : ''} 
                class="rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 w-4 h-4 cursor-pointer">
              <label for="select-all-sales-checkbox" class="text-xs font-bold text-gray-700 cursor-pointer">
                เลือกทั้งหมด (${selectedCount}/${filteredSales.length} รายการ)
              </label>
            </div>

            ${selectedCount > 0 ? `
              <span class="h-4 w-px bg-gray-200 hidden sm:block"></span>
              <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                รวมยอดขายที่เลือก: ${formatBaht(selectedTotalPrice)}
              </span>
              <button id="clear-selected-sales-btn" class="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer">
                ยกเลิกการเลือก
              </button>
            ` : ''}
          </div>

          <div class="flex items-center gap-2.5 w-full md:w-auto flex-wrap justify-end">
            <!-- Search bar -->
            <div class="relative flex-1 md:w-56">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <i class="fas fa-search text-xs"></i>
              </span>
              <input type="text" id="sales-search-input" value="${this.searchSaleQuery}" placeholder="ค้นหาการขาย/ลูกค้า..." 
                class="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <!-- Print / Summary Button -->
            <button id="batch-summary-sales-btn" ${selectedCount === 0 ? 'disabled' : ''} 
              class="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl border border-emerald-200 transition-all flex items-center gap-1.5 shadow-sm">
              <i class="fas fa-print"></i> พิมพ์ใบสรุป (${selectedCount})
            </button>

            <!-- Batch Delete Button -->
            <button id="batch-delete-sales-btn" ${selectedCount === 0 ? 'disabled' : ''} 
              class="px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all flex items-center gap-1.5 shadow-sm">
              <i class="fas fa-trash-alt"></i> ลบที่เลือก (${selectedCount})
            </button>
          </div>
        </div>

        <!-- Sales Table Card -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">
                  <th class="px-4 py-3.5 text-center w-10">
                    <input type="checkbox" id="header-table-sales-checkbox" ${allSalesChecked ? 'checked' : ''} 
                      class="rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 w-4 h-4 cursor-pointer" title="เลือกทั้งหมด">
                  </th>
                  <th class="px-4 py-3.5">รหัสรายการ</th>
                  <th class="px-4 py-3.5">ล็อตผลผลิต (Crop)</th>
                  <th class="px-4 py-3.5">เกษตรกรเจ้าของ</th>
                  <th class="px-4 py-3.5">ประเภทพืช</th>
                  <th class="px-4 py-3.5 text-center">จำนวนขาย</th>
                  <th class="px-4 py-3.5">ราคาต่อหน่วย</th>
                  <th class="px-4 py-3.5">ยอดรวมเงิน</th>
                  <th class="px-4 py-3.5">ผู้ซื้อ / ลูกค้า</th>
                  <th class="px-4 py-3.5">วันที่จำหน่าย</th>
                  <th class="px-4 py-3.5 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                ${salesRowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    return `
      <div class="fade-in space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <i class="fa-solid fa-hand-holding-dollar text-emerald-700"></i>
              การเงินรายสมาชิก
            </h1>
            <p class="text-sm text-gray-500 mt-1">สรุปบัญชีวิเคราะห์ต้นทุน-กำไรสุทธิรายสมาชิก พร้อมประวัติการจำหน่ายและใบเสร็จ</p>
          </div>

          <div class="flex items-center gap-2">
            <a href="#inventory" class="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs">
              <i class="fa-solid fa-boxes-stacked text-emerald-600"></i>
              <span>ไปที่คลังสินค้า &rarr;</span>
            </a>
          </div>
        </div>

        <!-- Mini Stats Summary Row -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div class="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-xs text-gray-400 block font-medium">รายได้จากการจำหน่ายสะสม</span>
              <span class="text-2xl font-bold text-emerald-800">${formatBaht(totalReportRevenue)}</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center"><i class="fas fa-cash-register"></i></div>
          </div>

          <div class="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-xs text-gray-400 block font-medium">ต้นทุนการผลิตสะสม</span>
              <span class="text-2xl font-bold text-gray-700">${formatBaht(totalReportCost)}</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><i class="fas fa-receipt"></i></div>
          </div>

          <div class="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-xs text-gray-400 block font-medium">กำไรสุทธิสะสมรวม</span>
              <span class="text-2xl font-bold ${totalReportProfit >= 0 ? 'text-green-700' : 'text-red-600'}">
                ${totalReportProfit > 0 ? '+' : ''}${formatBaht(totalReportProfit)}
              </span>
            </div>
            <div class="w-10 h-10 rounded-xl ${totalReportProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'} flex items-center justify-center">
              <i class="fas ${totalReportProfit >= 0 ? 'fa-chart-line' : 'fa-arrow-down'}"></i>
            </div>
          </div>
        </div>

        <!-- Dynamic Navigation Tabs -->
        <div class="flex items-center justify-between border-b border-gray-200 overflow-x-auto gap-2">
          <div class="flex">
            <button id="tab-ledger-btn" class="px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none whitespace-nowrap ${
              this.activeTab === 'ledger' 
                ? 'border-emerald-700 text-emerald-700 font-bold' 
                : 'border-transparent text-gray-500 hover:text-emerald-700 hover:border-gray-300'
            }">
              <i class="fas fa-calculator mr-1.5"></i> สรุปต้นทุน-กำไรรายสมาชิก (${filteredReport.length})
            </button>

            <button id="tab-sales-btn" class="px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none whitespace-nowrap ${
              this.activeTab === 'sales' 
                ? 'border-emerald-700 text-emerald-700 font-bold' 
                : 'border-transparent text-gray-500 hover:text-emerald-700 hover:border-gray-300'
            }">
              <i class="fas fa-clipboard-list mr-1.5"></i> ประวัติการจำหน่ายและใบเสร็จ (${sales.length})
            </button>
          </div>
        </div>

        ${this.activeTab === 'ledger' ? ledgerTabHtml : salesTabHtml}
      </div>
    `;
  },

  init() {
    this.bindTabEvents();
    if (this.activeTab === 'ledger') {
      this.bindLedgerEvents();
    } else if (this.activeTab === 'sales') {
      this.bindSalesEvents();
    }
  },

  bindTabEvents() {
    const ledgerBtn = document.getElementById('tab-ledger-btn');
    const salesBtn = document.getElementById('tab-sales-btn');

    if (ledgerBtn) {
      ledgerBtn.addEventListener('click', () => {
        this.activeTab = 'ledger';
        this.refreshView();
      });
    }

    if (salesBtn) {
      salesBtn.addEventListener('click', () => {
        this.activeTab = 'sales';
        this.refreshView();
      });
    }
  },

  bindLedgerEvents() {
    const searchInput = document.getElementById('member-ledger-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchMemberQuery = e.target.value;
        const currentUser = appState.getCurrentUser();
        const isMember = currentUser && currentUser.role === 'Member';
        const financialReport = appState.getFinancialReport();
        let filteredReport = financialReport.filter(r => 
          r.name.toLowerCase().includes(this.searchMemberQuery.toLowerCase()) ||
          r.id.toLowerCase().includes(this.searchMemberQuery.toLowerCase())
        );
        if (isMember) {
          filteredReport = filteredReport.filter(r => r.id === currentUser.memberId);
        }

        const rowsHtml = filteredReport.length === 0
          ? `<tr><td colspan="7" class="px-6 py-6 text-center text-sm text-gray-500">ไม่พบรายงานการเงินของสมาชิกรายที่ระบุ</td></tr>`
          : filteredReport.map(r => {
              const statusBadge = r.netProfit > 0 
                ? `<span class="px-2.5 py-1 text-xs font-bold bg-green-50 text-green-700 rounded-full border border-green-200"><i class="fas fa-arrow-up mr-0.5"></i> กำไร</span>`
                : r.netProfit < 0
                  ? `<span class="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-700 rounded-full border border-red-200"><i class="fas fa-arrow-down mr-0.5"></i> ขาดทุน</span>`
                  : `<span class="px-2.5 py-1 text-xs font-bold bg-gray-50 text-gray-600 rounded-full border border-gray-200">เท่าทุน</span>`;
              
              return `
                <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
                  <td class="px-6 py-4 text-sm font-semibold text-emerald-800">${r.id}</td>
                  <td class="px-6 py-4">
                    <div class="text-sm font-bold text-gray-900">${r.name}</div>
                    <div class="text-[10px] text-gray-400">บทบาท: ${r.role} (${r.villageNumber})</div>
                  </td>
                  <td class="px-6 py-4 text-center text-sm text-gray-700 font-medium">${r.totalCrops} รอบ</td>
                  <td class="px-6 py-4 text-sm text-gray-600 font-medium">${formatBaht(r.totalCost)}</td>
                  <td class="px-6 py-4 text-sm text-emerald-800 font-bold">${formatBaht(r.totalRevenue)}</td>
                  <td class="px-6 py-4 text-sm font-extrabold ${r.netProfit >= 0 ? 'text-green-700' : 'text-red-600'}">
                    ${r.netProfit > 0 ? '+' : ''}${formatBaht(r.netProfit)}
                  </td>
                  <td class="px-6 py-4 text-center">${statusBadge}</td>
                </tr>
              `;
            }).join('');
        
        const tbody = document.querySelector('table tbody');
        if (tbody) tbody.innerHTML = rowsHtml;
      });
    }
  },

  bindSalesEvents() {
    // 1. Checkboxes per row
    const saleCheckboxes = document.querySelectorAll('.sale-batch-checkbox');
    saleCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const id = cb.getAttribute('data-sale-id');
        if (cb.checked) {
          if (!this.selectedSaleIds.includes(id)) this.selectedSaleIds.push(id);
        } else {
          this.selectedSaleIds = this.selectedSaleIds.filter(i => i !== id);
        }
        this.refreshView();
      });
    });

    // 2. Select All Checkbox (Toolbar and Header)
    const selectAllCb = document.getElementById('select-all-sales-checkbox');
    const headerSelectAllCb = document.getElementById('header-table-sales-checkbox');
    const toggleSelectAll = (checked) => {
      const currentUser = appState.getCurrentUser();
      const isMember = currentUser && currentUser.role === 'Member';
      let plots = appState.getPlots();
      let crops = appState.getCrops();
      if (isMember) {
        plots = plots.filter(p => p.memberIds && p.memberIds.includes(currentUser.memberId));
        const plotIds = plots.map(p => p.id);
        crops = crops.filter(c => plotIds.includes(c.plotId));
      }
      const cropIds = crops.map(c => c.id);
      let sales = appState.getSales().filter(s => cropIds.includes(s.cropId));
      if (this.searchSaleQuery) {
        const q = this.searchSaleQuery.toLowerCase();
        sales = sales.filter(s => {
          const crop = appState.getCropById(s.cropId);
          const plot = crop ? appState.getPlotById(crop.plotId) : null;
          const plotName = plot ? plot.name.toLowerCase() : '';
          return (
            s.id.toLowerCase().includes(q) ||
            s.cropId.toLowerCase().includes(q) ||
            (s.customer && s.customer.toLowerCase().includes(q)) ||
            (s.customerId && s.customerId.toLowerCase().includes(q)) ||
            (s.date && s.date.includes(q)) ||
            plotName.includes(q)
          );
        });
      }

      if (checked) {
        this.selectedSaleIds = sales.map(s => s.id);
      } else {
        this.selectedSaleIds = [];
      }
      this.refreshView();
    };

    if (selectAllCb) {
      selectAllCb.addEventListener('change', (e) => toggleSelectAll(e.target.checked));
    }
    if (headerSelectAllCb) {
      headerSelectAllCb.addEventListener('change', (e) => toggleSelectAll(e.target.checked));
    }

    // 3. Clear selected sales
    const clearBtn = document.getElementById('clear-selected-sales-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.selectedSaleIds = [];
        this.refreshView();
      });
    }

    // 4. Search input
    const searchInput = document.getElementById('sales-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchSaleQuery = e.target.value;
        this.refreshView();
      });
    }

    // 5. Batch Delete Sales Button
    const batchDeleteBtn = document.getElementById('batch-delete-sales-btn');
    if (batchDeleteBtn) {
      batchDeleteBtn.addEventListener('click', () => {
        if (this.selectedSaleIds.length === 0) return;
        this.openConfirmDeleteSalesModal(this.selectedSaleIds);
      });
    }

    // 6. Batch Summary / Print Button
    const batchSummaryBtn = document.getElementById('batch-summary-sales-btn');
    if (batchSummaryBtn) {
      batchSummaryBtn.addEventListener('click', () => {
        if (this.selectedSaleIds.length === 0) return;
        this.openSalesSummaryModal(this.selectedSaleIds);
      });
    }

    // 7. Single Row View Receipt
    const viewSaleBtns = document.querySelectorAll('.view-sale-btn');
    viewSaleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const saleId = btn.getAttribute('data-sale-id');
        this.openSaleDetailModal(saleId);
      });
    });

    // 8. Single Row Delete
    const deleteSaleBtns = document.querySelectorAll('.delete-sale-btn');
    deleteSaleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const saleId = btn.getAttribute('data-sale-id');
        this.openConfirmDeleteSalesModal([saleId]);
      });
    });
  },

  openConfirmDeleteSalesModal(saleIds) {
    const isSingle = saleIds.length === 1;
    const sales = appState.getSales().filter(s => saleIds.includes(s.id));
    const totalAmount = sales.reduce((sum, s) => sum + (s.totalPrice || 0), 0);

    const contentHtml = `
      <form id="confirm-delete-sales-form" class="p-6 md:p-8 space-y-5">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 text-xl">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div>
            <h4 class="text-base font-bold text-gray-900">
              ${isSingle ? `ยืนยันการลบรายการขาย #${saleIds[0]}` : `ยืนยันการลบรายการขายที่เลือก (${saleIds.length} รายการ)`}
            </h4>
            <p class="text-xs text-gray-500 mt-1">
              ยอดรวมเงินทั้งหมด: <b class="text-gray-800">${formatBaht(totalAmount)}</b>
            </p>
          </div>
        </div>

        <div class="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 space-y-2">
          <div class="font-bold flex items-center gap-1.5 text-amber-950">
            <i class="fas fa-info-circle"></i> ผลกระทบของการลบข้อมูล:
          </div>
          <ul class="list-disc pl-5 space-y-1 text-amber-800">
            <li>ยอดจำหน่ายนี้จะถูกตัดออกจากรายงานการเงินและกำไร-ขาดทุนสะสมของสมาชิก</li>
            <li>ประวัติการขายในทะเบียนลูกค้าและคลังสินค้าจะถูกลบออก</li>
          </ul>
        </div>

        <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" id="restore-inventory-checkbox" checked class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer">
            <div class="text-xs">
              <span class="font-bold text-gray-800 block">คืนสต็อกสมุนไพรอบแห้งกลับเข้าคลังสินค้า</span>
              <span class="text-gray-500">คืนจำนวนสมุนไพรตามรายการขายนี้กลับเข้าล็อตผลผลิตเดิมอัตโนมัติ</span>
            </div>
          </label>
        </div>

        <div class="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5">
            <i class="fas fa-trash-alt"></i> ยืนยันการลบ
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: isSingle ? `ลบรายการขาย ${saleIds[0]}` : `ลบรายการขาย (${saleIds.length} รายการ)`,
      icon: 'fas fa-trash-alt',
      size: 'max-w-md',
      headerColor: 'bg-rose-700',
      content: contentHtml,
      onRender: (dialog) => {
        const form = dialog.querySelector('#confirm-delete-sales-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const restoreCheckbox = dialog.querySelector('#restore-inventory-checkbox');
            const restoreStock = restoreCheckbox ? restoreCheckbox.checked : true;

            try {
              const count = appState.deleteSales(saleIds, restoreStock);
              closeGlobalModal();
              this.selectedSaleIds = this.selectedSaleIds.filter(id => !saleIds.includes(id));
              showToast(`ลบรายการบันทึกการขายจำนวน ${count} รายการเรียบร้อยแล้ว${restoreStock ? ' (คืนสต็อกเข้าคลังแล้ว)' : ''}`);
              this.refreshView();
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        }
      }
    });
  },

  openSalesSummaryModal(saleIds) {
    const sales = appState.getSales().filter(s => saleIds.includes(s.id));
    const enterprise = appState.getEnterprise();
    const crops = appState.getCrops();
    const plots = appState.getPlots();

    const totalRevenue = sales.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
    const todayThai = formatThaiDate(new Date().toISOString().split('T')[0]);

    const tableRowsHtml = sales.map((s, idx) => {
      const crop = crops.find(c => c.id === s.cropId);
      const plot = crop ? plots.find(p => p.id === crop.plotId) : null;
      const unitText = s.saleType === 'jar' ? `${s.amount || s.amountKg} กระปุก` : `${s.amountKg || s.amount} กก.`;
      const priceText = s.saleType === 'jar' ? `${formatBaht(s.price || s.pricePerKg)}/กระปุก` : `${formatBaht(s.pricePerKg || s.price)}/กก.`;

      return `
        <tr class="border-b border-gray-200 text-xs">
          <td class="py-2.5 px-3 text-gray-500">${idx + 1}</td>
          <td class="py-2.5 px-3 font-semibold text-gray-800">${s.id}</td>
          <td class="py-2.5 px-3 text-gray-600">${formatThaiDate(s.date)}</td>
          <td class="py-2.5 px-3">
            <span class="font-medium text-gray-800">${s.cropId}</span>
            <span class="text-[10px] text-gray-400 block">${plot ? plot.name : ''}</span>
          </td>
          <td class="py-2.5 px-3 font-medium text-gray-700">${s.customer || '-'}</td>
          <td class="py-2.5 px-3 text-right font-bold text-gray-800">${unitText}</td>
          <td class="py-2.5 px-3 text-right text-gray-600">${priceText}</td>
          <td class="py-2.5 px-3 text-right font-black text-emerald-800">${formatBaht(s.totalPrice)}</td>
        </tr>
      `;
    }).join('');

    const modalContent = `
      <div class="flex flex-col flex-1 overflow-hidden" id="printable-sales-summary">
        <div class="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
          <!-- Header for printing -->
          <div class="border-b border-gray-200 pb-4 text-center">
            <h2 class="text-xl font-extrabold text-gray-800">${enterprise.name}</h2>
            <p class="text-xs text-gray-500 mt-1">${enterprise.village} ต.${enterprise.subdistrict} อ.${enterprise.district} จ.${enterprise.province}</p>
            <h3 class="text-base font-bold text-emerald-800 mt-3 flex items-center justify-center gap-1.5">
              <i class="fas fa-file-invoice-dollar"></i> รายงานสรุปรายการจำหน่ายผลผลิตสมุนไพรอบแห้ง
            </h3>
            <div class="flex justify-between items-center text-xs text-gray-500 mt-3 pt-2 border-t border-dashed border-gray-200">
              <span>จำนวนรายการที่เลือก: <b>${sales.length} รายการ</b></span>
              <span>วันที่พิมพ์: <b>${todayThai}</b></span>
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-100 text-[11px] font-bold text-gray-600 uppercase border-b border-gray-300">
                  <th class="py-2.5 px-3">#</th>
                  <th class="py-2.5 px-3">รหัสการขาย</th>
                  <th class="py-2.5 px-3">วันที่</th>
                  <th class="py-2.5 px-3">ล็อต/แปลง</th>
                  <th class="py-2.5 px-3">ลูกค้า</th>
                  <th class="py-2.5 px-3 text-right">จำนวน</th>
                  <th class="py-2.5 px-3 text-right">ราคาหน่วย</th>
                  <th class="py-2.5 px-3 text-right">ยอดรวม</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
              <tfoot>
                <tr class="bg-emerald-50/70 border-t-2 border-emerald-600 text-sm font-bold">
                  <td colspan="7" class="py-3 px-3 text-right text-emerald-950 font-bold">รวมยอดขายทั้งสิ้น (${sales.length} รายการ):</td>
                  <td class="py-3 px-3 text-right font-black text-emerald-900 text-base">${formatBaht(totalRevenue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="pt-4 border-t border-gray-100 text-xs text-gray-400 flex justify-between items-center">
            <span>พิมพ์จากระบบบริหารจัดการวิสาหกิจชุมชนสมุนไพรอบแห้ง</span>
            <span>ผู้มีอำนาจตรวจสอบ / ผู้บันทึก: .................................................</span>
          </div>
        </div>

        <div class="p-4 md:px-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-xs font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors">
            ปิดหน้าต่าง
          </button>
          <button type="button" id="print-summary-action-btn" class="px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5">
            <i class="fas fa-print"></i> พิมพ์รายงานสรุปนี้
          </button>
        </div>
      </div>
    `;

    openGlobalModal({
      title: `ใบสรุปรายการขาย (${sales.length} รายการ)`,
      icon: 'fas fa-print',
      size: 'max-w-4xl',
      headerColor: 'bg-[#1e4620]',
      content: modalContent,
      onRender: (dialog) => {
        const printBtn = dialog.querySelector('#print-summary-action-btn');
        if (printBtn) {
          printBtn.addEventListener('click', () => {
            window.print();
          });
        }
      }
    });
  },

  openSaleDetailModal(saleId) {
    const sale = appState.getSales().find(s => s.id === saleId);
    if (!sale) return;

    const crops = appState.getCrops();
    const plots = appState.getPlots();
    const members = appState.getMembers();
    const crop = crops.find(c => c.id === sale.cropId);
    const plot = crop ? plots.find(p => p.id === crop.plotId) : null;
    const owners = plot ? members.filter(m => plot.memberIds && plot.memberIds.includes(m.id)) : [];
    const custInfo = sale.customerId ? appState.getCustomerById(sale.customerId) : null;

    const ownersListHtml = owners.map(o => `
      <div class="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-800">
        <i class="fas fa-user-circle text-lg text-emerald-600"></i>
        <div>
          <div class="font-bold text-gray-800">${o.name} (${o.role})</div>
          <div class="text-[10px] text-emerald-600">${o.villageNumber || '-'} | โทร: ${o.phone || '-'}</div>
        </div>
      </div>
    `).join('') || '<div class="text-xs text-gray-500">-</div>';

    const customerHtml = custInfo ? `
      <span class="font-bold text-gray-800">${custInfo.name}</span>
      <span class="text-xs text-gray-500 font-normal block mt-0.5">${custInfo.customerType} | โทร: ${custInfo.phone || '-'}</span>
      ${custInfo.address ? `<span class="text-[11px] text-gray-400 font-normal block">${custInfo.address}</span>` : ''}
    ` : `<span class="font-bold text-gray-800">${sale.customer || '-'}</span>`;

    const detailContent = `
      <div class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
          <div class="flex justify-between items-start border-b border-gray-100 pb-4">
            <div>
              <span class="text-xs text-gray-400 font-bold block">รหัสรายการขาย:</span>
              <span class="text-lg font-black text-emerald-800">${sale.id}</span>
            </div>
            <div class="text-right">
              <span class="text-xs text-gray-400 font-bold block">วันที่จำหน่าย:</span>
              <span class="text-sm font-bold text-gray-700">${formatThaiDate(sale.date)}</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 md:p-6 rounded-2xl border border-gray-100">
            <div class="space-y-4">
              <h4 class="text-xs font-bold text-emerald-800 uppercase tracking-wider border-b border-gray-200 pb-1">
                <i class="fas fa-leaf mr-1"></i> ข้อมูลผลผลิตและแหล่งที่มา
              </h4>
              <div>
                <span class="text-xs text-gray-400 block">ล็อตสินค้า / แหล่งปลูก:</span>
                <span class="text-sm font-bold text-gray-800">${sale.cropId}</span>
                <span class="text-xs text-gray-500 block mt-0.5">${plot ? plot.name : '-'}</span>
              </div>
              <div>
                <span class="text-xs text-gray-400 block">ชนิดสมุนไพร:</span>
                <span class="text-sm font-bold text-emerald-700">${plot ? `${plot.plantType}อบแห้ง` : '-'}</span>
              </div>
              <div>
                <span class="text-xs text-gray-400 block mb-1.5">เกษตรกรเจ้าของแปลง:</span>
                <div class="space-y-2">
                  ${ownersListHtml}
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h4 class="text-xs font-bold text-emerald-800 uppercase tracking-wider border-b border-gray-200 pb-1">
                <i class="fas fa-user-tag mr-1"></i> ข้อมูลการขายและลูกค้า
              </h4>
              <div>
                <span class="text-xs text-gray-400 block">ลูกค้าผู้ซื้อ:</span>
                <div class="text-sm mt-0.5">${customerHtml}</div>
              </div>
              <div>
                <span class="text-xs text-gray-400 block">เลขอ้างอิง / ใบเสร็จ:</span>
                <span class="text-xs font-bold text-gray-600">${sale.invoiceNo || `INV-${sale.id.split('-')[1]}`}</span>
              </div>
            </div>
          </div>

          <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2">
            <div class="flex justify-between items-center text-xs text-gray-600">
              <span>จำนวนที่ขาย:</span>
              <span class="font-bold text-gray-800">${sale.saleType === 'jar' ? `${sale.amount || sale.amountKg} กระปุก` : `${sale.amountKg || sale.amount} กก.`}</span>
            </div>
            <div class="flex justify-between items-center text-xs text-gray-600">
              <span>ราคาต่อหน่วย:</span>
              <span class="font-bold text-gray-800">${sale.saleType === 'jar' ? `${formatBaht(sale.price || sale.pricePerKg)}/กระปุก` : `${formatBaht(sale.pricePerKg || sale.price)}/กก.`}</span>
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
              <span class="text-sm font-bold text-gray-800">ยอดรวมทั้งสิ้น:</span>
              <span class="text-xl font-black text-emerald-800">${formatBaht(sale.totalPrice)}</span>
            </div>
          </div>
        </div>

        <div class="p-4 md:px-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-6 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ปิดหน้าต่าง
          </button>
          <button type="button" onclick="window.print()" class="px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5">
            <i class="fas fa-print"></i> พิมพ์ใบเสร็จนี้
          </button>
        </div>
      </div>
    `;

    openGlobalModal({
      title: 'รายละเอียดใบเสร็จการจำหน่าย',
      icon: 'fas fa-receipt',
      size: 'max-w-4xl',
      headerColor: 'bg-[#1e4620]',
      content: detailContent
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
