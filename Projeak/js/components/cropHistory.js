// Plot Information & Planting History Component (ข้อมูลแปลงปลูกและประวัติรอบการผลิต)
import { appState } from '../state.js';
import { formatThaiDate, formatBaht, formatThaiArea, openGlobalModal, closeGlobalModal } from '../helpers.js';

export const CropHistoryComponent = {
  searchQuery: '',
  yearFilter: '',
  cycleFilter: 'all', // 'all', '1', '2', '3', 'other'
  activeTab: 'planting', // 'planting' | 'sales'
  selectedCropId: null,

  // Helper to get scenic plot photo based on herb type or plot data
  getPlotPhoto(plot, herbType) {
    if (plot && plot.photoUrl) return plot.photoUrl;
    const herb = (herbType || (plot ? plot.plantType : '') || '').toLowerCase();
    if (herb.includes('เก๊กฮวย')) {
      return 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=800&q=80';
    } else if (herb.includes('คาโมมายล์')) {
      return 'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=800&q=80';
    }
    return 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=800&q=80';
  },

  render() {
    const currentUser = appState.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'Member';

    let plots = appState.getPlots();
    if (isMember) {
      plots = plots.filter(p => p.memberIds && p.memberIds.includes(currentUser.memberId));
    }
    const plotIds = plots.map(p => p.id);
    const allCrops = appState.getCrops().filter(c => plotIds.includes(c.plotId));
    const members = appState.getMembers();
    const enterprise = appState.getEnterprise();

    // Extract available crop years for filter dropdown
    const availableYears = [...new Set(allCrops.map(c => c.cropYear).filter(Boolean))].sort((a, b) => b - a);

    // Filter crops based on Cycle Filter and Year Filter
    const filterCropMatch = (crop) => {
      // 1. Year Filter
      if (this.yearFilter && String(crop.cropYear) !== String(this.yearFilter)) {
        return false;
      }
      // 2. Cycle Filter
      if (this.cycleFilter !== 'all') {
        const cycleNum = Number(crop.cropCycle || 1);
        if (this.cycleFilter === '1' && cycleNum !== 1) return false;
        if (this.cycleFilter === '2' && cycleNum !== 2) return false;
        if (this.cycleFilter === '3' && cycleNum !== 3) return false;
        if (this.cycleFilter === 'other' && (cycleNum >= 1 && cycleNum <= 3)) return false;
      }
      return true;
    };

    // Filter plots based on Search Query and whether plot has matching crops (or matches plot info)
    const query = (this.searchQuery || '').toLowerCase().trim();
    const isFilterActive = Boolean(query || this.yearFilter || this.cycleFilter !== 'all');

    const filteredPlots = plots.filter(plot => {
      const owners = members.filter(m => (plot.memberIds && plot.memberIds.includes(m.id)) || plot.memberId === m.id);
      const ownersNames = owners.map(o => o.name).join(' ');
      const ownersPhones = owners.map(o => o.phone).join(' ');
      const herbType = plot.plantType || '';

      const plotCrops = allCrops.filter(c => c.plotId === plot.id);
      const matchingCrops = plotCrops.filter(filterCropMatch);

      // Search match in plot metadata or any of its crops
      const matchesSearch = !query ||
        plot.id.toLowerCase().includes(query) ||
        plot.name.toLowerCase().includes(query) ||
        ownersNames.toLowerCase().includes(query) ||
        ownersPhones.includes(query) ||
        herbType.toLowerCase().includes(query) ||
        plotCrops.some(c => (c.id || '').toLowerCase().includes(query) || (c.seedlingSource || '').toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // If specific cycle or year filter is selected, plot must have matching crops
      if (this.cycleFilter !== 'all' || this.yearFilter) {
        return matchingCrops.length > 0;
      }

      return true;
    });

    // Calculate Global Summary Stats
    const totalAreaRai = plots.reduce((sum, p) => sum + (parseFloat(p.sizeRai) || 0) + ((parseFloat(p.sizeNgan) || 0) / 4) + ((parseFloat(p.sizeSqWah) || 0) / 400), 0);
    const totalHarvestedCrops = allCrops.filter(c => c.status === 'harvested');
    const totalFreshYield = totalHarvestedCrops.reduce((sum, c) => sum + (parseFloat(c.yield) || 0), 0);
    const totalDryYield = totalHarvestedCrops.reduce((sum, c) => sum + (parseFloat(c.dryWeight) || 0), 0);

    // Sales History computation
    const DIRECT_SALES_KEY = 'herb_enterprise_direct_sales_v1';
    let directSalesList = [];
    try {
      directSalesList = JSON.parse(localStorage.getItem(DIRECT_SALES_KEY)) || [];
    } catch (e) {}
    const stateSalesList = appState.getSales() || [];
    const salesMap = new Map();
    directSalesList.forEach(s => salesMap.set(s.id, s));
    stateSalesList.forEach(s => {
      if (!salesMap.has(s.id)) {
        salesMap.set(s.id, {
          id: s.id,
          date: s.date,
          productId: s.cropId,
          productName: s.cropId && s.cropId.startsWith('PRD') ? (appState.getProductById(s.cropId)?.name || s.cropId) : `ผลผลิตรอบ ${s.cropId}`,
          unit: s.saleType === 'jar' ? 'กระปุก' : 'กก.',
          quantity: s.amount || s.amountKg || 0,
          unitPrice: s.price || s.pricePerKg || 0,
          totalPrice: s.totalPrice || 0,
          customerName: s.customer || 'ทั่วไป/ไม่ระบุชื่อ',
          sellerName: 'ผู้ดูแลระบบ',
          payment: 'เงินสด',
          remainingStockAfterSale: null,
          createdAt: s.date
        });
      }
    });

    const allSalesList = Array.from(salesMap.values()).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    
    // Filter sales list if search query present
    const filteredSales = allSalesList.filter(s => {
      if (!query) return true;
      const sId = (s.id || '').toLowerCase();
      const sCust = (s.customerName || '').toLowerCase();
      const sProd = (s.productName || '').toLowerCase();
      return sId.includes(query) || sCust.includes(query) || sProd.includes(query);
    });

    const totalSalesRev = allSalesList.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
    const totalSalesQty = allSalesList.reduce((sum, s) => sum + (s.quantity || 0), 0);

    const salesTableRowsHtml = filteredSales.length === 0
      ? `<tr><td colspan="7" class="py-12 text-center text-gray-400 font-bold text-xs"><i class="fas fa-receipt text-3xl opacity-30 block mb-2"></i>ไม่พบรายการประวัติการขายตามเงื่อนไขที่ค้นหา</td></tr>`
      : filteredSales.map(s => {
          const isCan = s.unit === 'กระปุก' || s.unit === 'กระป๋อง';
          const unitBadge = isCan ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200';
          return `
            <tr class="border-b border-gray-100 last:border-0 hover:bg-emerald-50/20 transition-colors">
              <td class="py-3 px-4 whitespace-nowrap">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-mono font-bold text-xs border border-emerald-200">
                  <i class="fas fa-receipt text-[10px] text-emerald-600"></i> ${s.id}
                </span>
                <div class="text-[10px] text-gray-400 mt-0.5">${formatThaiDate(s.date)}</div>
              </td>
              <td class="py-3 px-4">
                <div class="font-bold text-gray-900 text-xs sm:text-sm">${s.productName}</div>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded border ${unitBadge}">${s.unit}</span>
              </td>
              <td class="py-3 px-4 text-center">
                <span class="font-black text-gray-800 text-sm font-mono">${s.quantity.toLocaleString()}</span>
                <span class="text-[10px] text-gray-500 ml-0.5">${s.unit}</span>
              </td>
              <td class="py-3 px-4 text-right">
                <span class="font-bold text-gray-600 text-xs sm:text-sm font-mono">${formatBaht(s.unitPrice)}</span>
              </td>
              <td class="py-3 px-4 text-right">
                <span class="text-sm sm:text-base font-black text-emerald-700 font-mono">${formatBaht(s.totalPrice)}</span>
              </td>
              <td class="py-3 px-4">
                <div class="font-bold text-gray-800 text-xs">${s.customerName || '-'}</div>
                <div class="text-[10px] text-gray-400">${s.sellerName ? 'ผู้ขาย: ' + s.sellerName : ''}</div>
              </td>
              <td class="py-3 px-4 text-center">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <i class="fas fa-circle-check text-emerald-600 text-[10px]"></i> ตัดสต็อกแล้ว
                </span>
              </td>
            </tr>
          `;
        }).join('');

    // Build Plot Cards HTML
    const plotCardsHtml = filteredPlots.length === 0
      ? `
        <div class="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs space-y-4">
          <div class="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl">
            <i class="fa-solid fa-folder-open"></i>
          </div>
          <h3 class="text-base font-bold text-gray-800">ไม่พบข้อมูลแปลงปลูกตามเงื่อนไขที่ระบุ</h3>
          <p class="text-xs text-gray-500 max-w-md mx-auto">ลองเปลี่ยนเงื่อนไขการค้นหา รอบการปลูก หรือปีเพาะปลูก เพื่อค้นหาแปลงและประวัติที่ต้องการ</p>
          <button id="history-reset-btn" class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition">
            <i class="fas fa-rotate-left mr-1"></i> ล้างตัวกรองทั้งหมด
          </button>
        </div>
      `
      : filteredPlots.map(plot => {
          const owners = members.filter(m => (plot.memberIds && plot.memberIds.includes(m.id)) || plot.memberId === m.id);
          const primaryOwner = owners[0] || { name: 'ยังไม่ได้ระบุชื่อเกษตรกร', role: 'สมาชิกกลุ่ม', phone: '-', houseNumber: '-' };
          const ownersNames = owners.map(o => o.name).join(', ') || '-';
          const ownersPhones = owners.map(o => o.phone).filter(Boolean).join(', ') || '-';
          const areaFormatted = formatThaiArea(plot.sizeRai, plot.sizeNgan, plot.sizeSqWah);
          const herbType = plot.plantType || 'เก๊กฮวย';
          const isChrys = herbType.includes('เก๊กฮวย');

          // Plot crops (filtered by active filters)
          const plotCrops = allCrops.filter(c => c.plotId === plot.id);
          const matchingCrops = plotCrops.filter(filterCropMatch).sort((a, b) => {
            // Sort by cropYear desc, then cropCycle desc
            if (b.cropYear !== a.cropYear) return (b.cropYear || 0) - (a.cropYear || 0);
            return (b.cropCycle || 0) - (a.cropCycle || 0);
          });

          // Plot accumulated totals
          const plotFreshTotal = matchingCrops.reduce((sum, c) => sum + (parseFloat(c.yield) || 0), 0);
          const plotDryTotal = matchingCrops.reduce((sum, c) => sum + (parseFloat(c.dryWeight) || 0), 0);
          const plotCostTotal = matchingCrops.reduce((sum, c) => {
            const baseCost = parseFloat(c.cost) || 0;
            const fertCost = (c.fertilizingLog || []).reduce((fSum, f) => fSum + (parseFloat(f.cost) || 0), 0);
            return sum + baseCost + fertCost;
          }, 0);

          const photoUrl = this.getPlotPhoto(plot, herbType);
          const mapsUrl = `https://www.google.com/maps?q=${plot.lat || 18.9142},${plot.lng || 98.9442}`;
          const cleanPhone = primaryOwner.phone ? primaryOwner.phone.replace(/[^0-9]/g, '') : '';

          // Table Rows of Crop Seasons for this Plot
          const cropsTableRows = matchingCrops.length === 0
            ? `<tr><td colspan="7" class="px-6 py-6 text-center text-xs text-gray-400 bg-gray-50/50">แปลงนี้ยังไม่มีข้อมูลรอบการปลูกที่ตรงกับตัวกรองที่เลือก (รอบ/ปี)</td></tr>`
            : matchingCrops.map(c => {
                const totalCost = (parseFloat(c.cost) || 0) + (c.fertilizingLog || []).reduce((sum, f) => sum + (parseFloat(f.cost) || 0), 0);
                const isHarvested = c.status === 'harvested';
                const isProcessed = Boolean(c.isProcessed || c.dryWeight);

                let cycleBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                if (c.cropCycle === 2) cycleBadgeColor = 'bg-teal-100 text-teal-800 border-teal-200';
                if (c.cropCycle === 3) cycleBadgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
                if (c.cropCycle >= 4) cycleBadgeColor = 'bg-purple-100 text-purple-800 border-purple-200';

                return `
                  <tr class="hover:bg-emerald-50/40 border-b border-gray-100 last:border-0 transition-colors text-xs">
                    <td class="px-5 py-3.5 whitespace-nowrap">
                      <div class="font-extrabold text-emerald-900">${c.id}</div>
                      <div class="text-[10px] text-gray-400">บันทึก: ${formatThaiDate(c.plantDate)}</div>
                    </td>
                    <td class="px-5 py-3.5 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cycleBadgeColor}">
                        <i class="fa-solid fa-rotate mr-1 text-[9px]"></i> รอบที่ ${c.cropCycle || 1}
                      </span>
                    </td>
                    <td class="px-5 py-3.5 whitespace-nowrap font-medium text-gray-700">
                      พ.ศ. ${c.cropYear || '-'}
                    </td>
                    <td class="px-5 py-3.5 whitespace-nowrap text-gray-600">
                      <div>เริ่ม: <span class="font-semibold text-gray-800">${formatThaiDate(c.plantDate)}</span></div>
                      <div>เก็บ: <span class="font-semibold text-gray-800">${c.harvestDateActual ? formatThaiDate(c.harvestDateActual) : (c.harvestDateEst ? `${formatThaiDate(c.harvestDateEst)} (ประมาณ)` : '-')}</span></div>
                    </td>
                    <td class="px-5 py-3.5 whitespace-nowrap">
                      ${isHarvested ? `
                        <div class="font-black text-amber-900">${(parseFloat(c.yield) || 0).toFixed(2)} <span class="text-[10px] font-semibold text-amber-700">กก.สด</span></div>
                        ${isProcessed ? `
                          <div class="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                            <i class="fa-solid fa-fire text-amber-500"></i> อบแห้งได้ ${(parseFloat(c.dryWeight) || 0).toFixed(2)} กก.
                          </div>
                        ` : `
                          <div class="text-[10px] text-amber-600 font-semibold mt-0.5">
                            <i class="fa-regular fa-clock"></i> รอคิวอบแห้ง
                          </div>
                        `}
                      ` : `
                        <span class="text-[11px] font-medium text-gray-400 italic">อยู่ระหว่างปลูก</span>
                      `}
                    </td>
                    <td class="px-5 py-3.5 whitespace-nowrap">
                      <div class="font-bold text-gray-800">${formatBaht(totalCost)}</div>
                      <div class="text-[10px] text-gray-400">บำรุง ${(c.fertilizingLog || []).length} ครั้ง</div>
                    </td>
                    <td class="px-5 py-3.5 whitespace-nowrap text-center">
                      <button data-crop-id="${c.id}" class="view-history-detail-btn px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5">
                        <i class="fas fa-eye text-emerald-600"></i> ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                `;
              }).join('');

          return `
            <!-- Plot Card -->
            <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
              
              <!-- Plot Top Header -->
              <div class="p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-[#163819] to-emerald-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-start sm:items-center gap-3.5">
                  <div class="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300 text-xl font-black shrink-0 shadow-inner">
                    <i class="fa-solid fa-map-location-dot"></i>
                  </div>
                  <div>
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="px-2.5 py-0.5 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                        ${plot.id}
                      </span>
                      <h2 class="text-lg sm:text-xl font-extrabold text-white tracking-wide">
                        ${plot.name}
                      </h2>
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isChrys ? 'bg-amber-400/20 text-amber-200 border border-amber-300/30' : 'bg-sky-400/20 text-sky-200 border border-sky-300/30'
                      }">
                        <i class="fa-solid fa-leaf mr-1"></i> ${herbType}
                      </span>
                    </div>
                    <p class="text-xs text-emerald-200/80 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span><i class="fa-solid fa-chart-area mr-1 text-emerald-400"></i> ขนาดพื้นที่: <b>${areaFormatted}</b></span>
                      <span><i class="fa-solid fa-user-check mr-1 text-emerald-400"></i> สมาชิกผู้ดูแล: <b>${ownersNames}</b></span>
                    </p>
                  </div>
                </div>

                <!-- Plot Quick Stats Badges -->
                <div class="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div class="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs text-right">
                    <span class="text-[10px] text-emerald-300 font-bold block uppercase">รอบที่บันทึก</span>
                    <span class="text-sm sm:text-base font-black text-white">${matchingCrops.length} รอบ</span>
                  </div>
                  <div class="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs text-right">
                    <span class="text-[10px] text-amber-300 font-bold block uppercase">ผลผลิตสดรวม</span>
                    <span class="text-sm sm:text-base font-black text-amber-300">${plotFreshTotal.toFixed(1)} กก.</span>
                  </div>
                  ${plotDryTotal > 0 ? `
                    <div class="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs text-right">
                      <span class="text-[10px] text-emerald-300 font-bold block uppercase">ผลผลิตแห้งรวม</span>
                      <span class="text-sm sm:text-base font-black text-emerald-200">${plotDryTotal.toFixed(1)} กก.</span>
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- Plot Middle: Crop Seasons Table (ประวัติการปลูกแยกตามรอบของแปลงนี้) -->
              <div class="p-5 sm:p-6 space-y-3">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs sm:text-sm font-bold text-gray-700 flex items-center gap-1.5">
                    <i class="fa-solid fa-clock-rotate-left text-emerald-700"></i>
                    ประวัติรอบการปลูกของแปลงนี้ (${matchingCrops.length} รอบ)
                  </h3>
                  <span class="text-[11px] text-gray-400">เรียงตามปีและรอบเพาะปลูกล่าสุด</span>
                </div>

                <div class="border border-gray-100 rounded-2xl overflow-hidden shadow-2xs">
                  <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                      <thead>
                        <tr class="bg-gray-50 text-[11px] font-bold text-gray-500 border-b border-gray-100 uppercase tracking-wider">
                          <th class="px-5 py-3">รหัสรอบปลูก</th>
                          <th class="px-5 py-3">รอบที่</th>
                          <th class="px-5 py-3">ปีเพาะปลูก</th>
                          <th class="px-5 py-3">ระยะเวลาเพาะปลูก</th>
                          <th class="px-5 py-3">ผลผลิตสด / อบแห้ง</th>
                          <th class="px-5 py-3">ต้นทุนสะสมรวม</th>
                          <th class="px-5 py-3 text-center">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${cropsTableRows}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Plot Bottom: Requirement 4 "เพิ่มตำแหน่ง + รูป + ชื่ออะไร + เบอร์โทรอยู่ด้านล่าง" -->
              <div class="px-5 sm:px-6 pb-6 pt-1">
                <div class="bg-gradient-to-br from-emerald-50/70 via-gray-50 to-teal-50/50 rounded-2xl p-4 sm:p-5 border border-emerald-100/80 shadow-2xs">
                  <div class="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-emerald-100/60">
                    <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <h4 class="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                      ข้อมูลผู้ดูแลและพิกัดแปลงเพาะปลูก (ข้อมูลด้านล่างแปลง)
                    </h4>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    
                    <!-- 1. รูปภาพแปลงปลูก (รูป) -->
                    <div class="md:col-span-4 lg:col-span-3">
                      <div class="relative group rounded-xl overflow-hidden border border-emerald-200/80 shadow-xs bg-gray-100 aspect-video md:aspect-4/3">
                        <img src="${photoUrl}" 
                          alt="ภาพแปลง ${plot.name}" 
                          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=800&q=80';"
                        />
                        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 flex flex-col justify-between p-2.5">
                          <span class="self-start px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 text-emerald-900 shadow-2xs">
                            <i class="fa-solid fa-camera mr-0.5"></i> ภาพแปลงจริง
                          </span>
                          <button data-img="${photoUrl}" data-title="ภาพถ่ายแปลง ${plot.name} (${plot.id})" class="preview-plot-photo-btn self-end px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-800/90 hover:bg-emerald-900 text-white backdrop-blur-xs transition flex items-center gap-1 shadow-xs cursor-pointer">
                            <i class="fa-solid fa-magnifying-glass-plus"></i> ขยายรูป
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- 2. ชื่อเกษตรกร (ชื่ออะไร) + 3. เบอร์โทร (เบอร์โทร) + 4. ตำแหน่งพิกัด (ตำแหน่ง) -->
                    <div class="md:col-span-8 lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      
                      <!-- Caretaker & Contact Section -->
                      <div class="space-y-3 bg-white p-3.5 rounded-xl border border-emerald-100/60 shadow-2xs">
                        <div class="flex items-start gap-2.5">
                          <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
                            <i class="fa-solid fa-user"></i>
                          </div>
                          <div class="flex-1 min-w-0">
                            <span class="text-[10px] font-bold text-gray-400 block uppercase">ชื่อเกษตรกรผู้รับผิดชอบ (ชื่ออะไร)</span>
                            <span class="font-extrabold text-gray-900 text-sm block truncate">${primaryOwner.name}</span>
                            <span class="text-[11px] text-emerald-700 font-semibold inline-block bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5">
                              ${primaryOwner.role || 'สมาชิกกลุ่ม'} (${primaryOwner.id || 'MEM'})
                            </span>
                            <div class="text-[11px] text-gray-500 mt-1">
                              บ้านเลขที่ ${primaryOwner.houseNumber || '-'} ${primaryOwner.villageNumber || ''} ต.${enterprise.subdistrict}
                            </div>
                          </div>
                        </div>

                        <!-- เบอร์โทรศัพท์ -->
                        <div class="pt-2 border-t border-gray-100 flex items-center justify-between">
                          <div>
                            <span class="text-[10px] font-bold text-gray-400 block uppercase">เบอร์โทรติดต่อ (เบอร์โทร)</span>
                            <span class="font-bold text-gray-800 text-xs sm:text-sm font-mono">${primaryOwner.phone || '-'}</span>
                          </div>
                          ${cleanPhone ? `
                            <a href="tel:${cleanPhone}" class="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5">
                              <i class="fa-solid fa-phone text-xs"></i> โทรติดต่อ
                            </a>
                          ` : ''}
                        </div>
                      </div>

                      <!-- Location Coordinates & Google Maps Section -->
                      <div class="space-y-3 bg-white p-3.5 rounded-xl border border-emerald-100/60 shadow-2xs">
                        <div class="flex items-start gap-2.5">
                          <div class="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm shrink-0">
                            <i class="fa-solid fa-location-dot"></i>
                          </div>
                          <div class="flex-1 min-w-0">
                            <span class="text-[10px] font-bold text-gray-400 block uppercase">ตำแหน่งที่ตั้งแปลงปลูก (ตำแหน่ง)</span>
                            <div class="font-mono font-bold text-gray-800 text-xs mt-0.5">
                              Lat: ${(parseFloat(plot.lat) || 0).toFixed(5)}, Lng: ${(parseFloat(plot.lng) || 0).toFixed(5)}
                            </div>
                            <div class="text-[11px] text-gray-500 mt-0.5">
                              ${enterprise.village} ต.${enterprise.subdistrict} อ.${enterprise.district} จ.${enterprise.province}
                            </div>
                          </div>
                        </div>

                        <!-- Maps Navigation Button -->
                        <div class="pt-2 border-t border-gray-100 flex items-center justify-between">
                          <span class="text-[10px] text-gray-400">ระบบพิกัดดาวเทียม WGS84</span>
                          <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5">
                            <i class="fa-solid fa-map-location-dot text-xs"></i> เปิด Google Maps
                          </a>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

            </div>
          `;
        }).join('');

    return `
      <div class="fade-in space-y-6">
        
        <!-- Top Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-extrabold text-gray-900 flex items-center gap-2.5">
              <span class="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-sm">
                <i class="fa-solid fa-clock-rotate-left text-lg"></i>
              </span>
              <span>8. ประวัติการขาย / ประวัติการปลูก</span>
            </h1>
            <p class="text-xs sm:text-sm text-gray-500 mt-1">
              ระบบบันทึกประวัติการขายสินค้า (การตัดสต็อกอัตโนมัติ) และประวัติรอบการปลูกแยกตามรายแปลง
            </p>
          </div>

          <!-- Quick Actions / Navigation -->
          <div class="flex items-center gap-2">
            <a href="#sales" class="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition shadow-xs flex items-center gap-1.5">
              <i class="fa-solid fa-receipt text-emerald-200"></i> จัดการขาย / ออกใบเสร็จ
            </a>
            <a href="#inventory" class="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-xl transition shadow-2xs flex items-center gap-1.5">
              <i class="fa-solid fa-boxes-stacked text-emerald-600"></i> สต็อกรวม
            </a>
          </div>
        </div>

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
                <span>บันทึกประวัติการขายและประวัติการปลูกตลอดวงจร</span>
                <span class="text-xs font-normal text-amber-300">(สด 150 kg ➔ แห้ง 15 kg ➔ สต็อก ➔ ขาย ➔ ประวัติ)</span>
              </h2>
              <p class="text-xs text-gray-300 mt-1 max-w-2xl">
                วงจรเชื่อมโยง: <b>เก็บเกี่ยว (รอบที่ 1) ➔ อบ/ตากแห้ง ➔ เข้าสต็อก ➔ [ ขาย ↩ ตัดสต็อกอัตโนมัติ ] ➔ เก็บเป็นประวัติการขาย</b>
              </p>
            </div>
            <div class="shrink-0 flex items-center gap-2 text-xs">
              <span class="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-emerald-200">
                <i class="fas fa-check-circle text-emerald-400 mr-1"></i> ออดิทบันทึกอัตโนมัติ
              </span>
            </div>
          </div>

          <!-- Flow Steps Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
            <div class="p-2.5 rounded-xl bg-white/10 border border-white/10 flex flex-col justify-between">
              <span class="text-[10px] text-emerald-400 font-bold">ขั้นตอนที่ 1</span>
              <div class="font-black text-white text-xs mt-0.5">🌾 เก็บเกี่ยว (รอบที่ 1)</div>
              <div class="text-[10px] text-gray-300 mt-1">ชั่งน้ำหนักสด เช่น 150 กก.</div>
            </div>
            <div class="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30 flex flex-col justify-between">
              <span class="text-[10px] text-amber-300 font-bold">ขั้นตอนที่ 2 (สูตร 10:1)</span>
              <div class="font-black text-amber-200 text-xs mt-0.5">☀️ อบ / ตากแห้ง</div>
              <div class="text-[10px] text-amber-100/90 mt-1 font-bold">สด 150 kg ➔ แห้ง 15 kg</div>
            </div>
            <div class="p-2.5 rounded-xl bg-sky-500/20 border border-sky-400/30 flex flex-col justify-between relative">
              <span class="text-[10px] text-sky-300 font-bold">ขั้นตอนที่ 3</span>
              <div class="font-black text-sky-200 text-xs mt-0.5">📦 เข้าสต็อกรวม</div>
              <div class="text-[10px] text-sky-100/80 mt-1">ดอกแห้ง / กระป๋อง 50G</div>
              <div class="text-[9px] text-rose-300 font-bold mt-1 bg-rose-950/70 px-1.5 py-0.5 rounded border border-rose-500/50">
                ↩ ถูกหักลบอัตโนมัติ
              </div>
            </div>
            <div class="p-2.5 rounded-xl bg-emerald-600/30 border border-emerald-400/40 flex flex-col justify-between">
              <span class="text-[10px] text-emerald-300 font-bold">ขั้นตอนที่ 4</span>
              <div class="font-black text-emerald-200 text-xs mt-0.5">💰 จัดการขาย</div>
              <div class="text-[10px] text-emerald-100/80 mt-1 font-bold">⚡ ตัดสต็อกอัตโนมัติ</div>
            </div>
            <div class="p-2.5 rounded-xl bg-purple-500/20 border-2 border-purple-400 flex flex-col justify-between shadow">
              <span class="text-[10px] text-purple-300 font-bold">ขั้นตอนที่ 5 (หน้านี้)</span>
              <div class="font-black text-purple-100 text-xs mt-0.5">📜 ประวัติการขาย</div>
              <div class="text-[10px] text-purple-200 mt-1 font-bold">บันทึกธุรกรรมย้อนหลัง</div>
            </div>
          </div>
        </div>

        <!-- Navigation Tabs: สลับดู ประวัติการขาย (บันทึกการตัดสต็อก) vs ข้อมูลแปลง & ประวัติการปลูก -->
        <div class="flex items-center gap-2 border-b border-gray-200 pb-3 flex-wrap">
          <button type="button" id="history-tab-sales-btn" class="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
            this.activeTab === 'sales'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
          }">
            <i class="fas fa-receipt"></i>
            <span>📜 ประวัติการขาย (บันทึกการตัดสต็อก)</span>
            <span class="px-2 py-0.5 rounded-full text-xs font-bold ${this.activeTab === 'sales' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}">
              ${allSalesList.length} รายการ
            </span>
          </button>

          <button type="button" id="history-tab-planting-btn" class="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
            this.activeTab === 'planting'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
          }">
            <i class="fa-solid fa-leaf"></i>
            <span>🌱 ข้อมูลแปลง & ประวัติการปลูก</span>
            <span class="px-2 py-0.5 rounded-full text-xs font-bold ${this.activeTab === 'planting' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}">
              ${plots.length} แปลง
            </span>
          </button>
        </div>

        ${this.activeTab === 'sales' ? `
          <!-- ===== VIEW 1: SALES & STOCK DEDUCTION HISTORY ===== -->
          <div class="space-y-6">
            
            <!-- Summary KPI Cards for Sales -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="rounded-2xl bg-emerald-700 text-white p-5 flex items-start justify-between shadow-md">
                <div>
                  <span class="text-xs font-bold opacity-75 uppercase tracking-wider block">รายได้ยอดขายสะสม</span>
                  <div class="text-3xl font-black mt-1 tabular-nums">${formatBaht(totalSalesRev)}</div>
                  <span class="text-xs opacity-75">${allSalesList.length} รายการขายทั้งหมด</span>
                </div>
                <div class="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-xl"><i class="fas fa-coins"></i></div>
              </div>

              <div class="rounded-2xl bg-teal-700 text-white p-5 flex items-start justify-between shadow-md">
                <div>
                  <span class="text-xs font-bold opacity-75 uppercase tracking-wider block">ปริมาณสินค้าที่ตัดสต็อกไปแล้ว</span>
                  <div class="text-3xl font-black mt-1 tabular-nums">${totalSalesQty.toLocaleString()}</div>
                  <span class="text-xs opacity-75">หน่วย (กระปุก 50G / กิโลกรัม)</span>
                </div>
                <div class="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-xl"><i class="fas fa-cart-arrow-down"></i></div>
              </div>

              <div class="rounded-2xl bg-indigo-700 text-white p-5 flex items-start justify-between shadow-md">
                <div>
                  <span class="text-xs font-bold opacity-75 uppercase tracking-wider block">สถานะการตัดสต็อกสินค้า</span>
                  <div class="text-2xl font-black mt-1">อัตโนมัติ 100%</div>
                  <span class="text-xs opacity-75">หักลบออกจากคลังสินค้าทันทีเมื่อขาย</span>
                </div>
                <div class="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-xl"><i class="fas fa-bolt"></i></div>
              </div>
            </div>

            <!-- Search and Controls for Sales -->
            <div class="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="relative flex-1 max-w-md">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                  <i class="fas fa-search text-xs"></i>
                </span>
                <input type="text" id="history-search-input" value="${this.searchQuery}" 
                  placeholder="ค้นหาเลขที่บิล, ชื่อสินค้า, หรือชื่อลูกค้า..." 
                  class="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50 hover:bg-white transition"
                />
              </div>
              <div class="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                แสดงผล ${filteredSales.length} จาก ${allSalesList.length} รายการ
              </div>
            </div>

            <!-- Sales History Table -->
            <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center text-sm">
                    <i class="fas fa-list-check"></i>
                  </div>
                  <div>
                    <h2 class="text-sm font-black text-gray-900">ตารางบันทึกประวัติการขาย (รายการตัดสต็อก)</h2>
                    <p class="text-[10px] text-gray-400">รายการขายที่ตัดสต็อกออกจากคลังสินค้าเรียบร้อยแล้ว</p>
                  </div>
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead class="bg-gray-50 text-[11px] font-black text-gray-500 uppercase border-b border-gray-100">
                    <tr>
                      <th class="py-3 px-4">เลขที่บิล / วันที่</th>
                      <th class="py-3 px-4">สินค้า</th>
                      <th class="py-3 px-4 text-center">จำนวนที่ตัดสต็อก</th>
                      <th class="py-3 px-4 text-right">ราคาต่อหน่วย</th>
                      <th class="py-3 px-4 text-right">ยอดรวม</th>
                      <th class="py-3 px-4">ผู้ซื้อ / ผู้ขาย</th>
                      <th class="py-3 px-4 text-center">สถานะตัดสต็อก</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${salesTableRowsHtml}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ` : `
          <!-- ===== VIEW 2: PLANTING HISTORY & PLOTS ===== -->
          <div class="space-y-6">

            <!-- Global Summary KPI Cards -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              
              <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl shrink-0">
                  <i class="fa-solid fa-map"></i>
                </div>
                <div>
                  <span class="text-[11px] font-bold text-gray-400 block uppercase">แปลงปลูกทั้งหมด</span>
                  <div class="text-lg sm:text-xl font-black text-gray-800">${plots.length} <span class="text-xs font-semibold text-gray-500">แปลง</span></div>
                </div>
              </div>

              <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center text-xl shrink-0">
                  <i class="fa-solid fa-chart-area"></i>
                </div>
                <div>
                  <span class="text-[11px] font-bold text-gray-400 block uppercase">พื้นที่รวมแปลง</span>
                  <div class="text-lg sm:text-xl font-black text-gray-800">${totalAreaRai.toFixed(1)} <span class="text-xs font-semibold text-gray-500">ไร่</span></div>
                </div>
              </div>

              <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl shrink-0">
                  <i class="fa-solid fa-leaf"></i>
                </div>
                <div>
                  <span class="text-[11px] font-bold text-gray-400 block uppercase">ผลผลิตสดรวม</span>
                  <div class="text-lg sm:text-xl font-black text-amber-900">${totalFreshYield.toFixed(1)} <span class="text-xs font-semibold text-amber-700">กก.</span></div>
                </div>
              </div>

              <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-xl shrink-0">
                  <i class="fa-solid fa-boxes-stacked"></i>
                </div>
                <div>
                  <span class="text-[11px] font-bold text-gray-400 block uppercase">รอบที่บันทึกไว้</span>
                  <div class="text-lg sm:text-xl font-black text-emerald-800">${allCrops.length} <span class="text-xs font-semibold text-gray-500">รอบ</span></div>
                </div>
              </div>

            </div>

            <!-- Controls: Search & Filters (Cycle Filter, Year Filter, Search Box) -->
            <div class="bg-white rounded-3xl border border-gray-100 p-4 sm:p-5 shadow-sm space-y-3">
              <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                
                <!-- 1. Search Box -->
                <div class="relative flex-1 max-w-lg">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <i class="fas fa-search text-xs"></i>
                  </span>
                  <input type="text" id="history-search-input" value="${this.searchQuery}" 
                    placeholder="ค้นหารหัสแปลง (P - 001), ชื่อแปลง, ชื่อเกษตรกร หรือชนิดพืช..." 
                    class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50 hover:bg-white transition"
                  />
                </div>

                <!-- 2. Cycle Filter & Year Filter Dropdowns -->
                <div class="flex flex-wrap items-center gap-2.5">
                  
                  <!-- Cycle Filter (ตัวกรองเป็นรอบที่ 1 รอบที่ 2 และอื่นๆ) -->
                  <div class="flex items-center gap-1.5">
                    <label for="history-cycle-filter" class="text-xs font-bold text-gray-600 whitespace-nowrap">
                      <i class="fa-solid fa-rotate text-emerald-700 mr-0.5"></i> รอบการปลูก:
                    </label>
                    <select id="history-cycle-filter" class="px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs">
                      <option value="all" ${this.cycleFilter === 'all' ? 'selected' : ''}>ทุกรอบการปลูก (ทั้งหมด)</option>
                      <option value="1" ${this.cycleFilter === '1' ? 'selected' : ''}>รอบที่ 1</option>
                      <option value="2" ${this.cycleFilter === '2' ? 'selected' : ''}>รอบที่ 2</option>
                      <option value="3" ${this.cycleFilter === '3' ? 'selected' : ''}>รอบที่ 3</option>
                      <option value="other" ${this.cycleFilter === 'other' ? 'selected' : ''}>รอบอื่นๆ (รอบที่ 4+)</option>
                    </select>
                  </div>

                  <!-- Year Filter (ปีการปลูก) -->
                  <div class="flex items-center gap-1.5">
                    <label for="history-year-filter" class="text-xs font-bold text-gray-600 whitespace-nowrap">
                      <i class="fa-regular fa-calendar text-emerald-700 mr-0.5"></i> ปี:
                    </label>
                    <select id="history-year-filter" class="px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs">
                      <option value="">ทุกปีเพาะปลูก</option>
                      ${availableYears.map(y => `<option value="${y}" ${String(this.yearFilter) === String(y) ? 'selected' : ''}>พ.ศ. ${y}</option>`).join('')}
                    </select>
                  </div>

                  ${isFilterActive ? `
                    <button id="history-clear-filters-btn" class="px-3 py-2 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition flex items-center gap-1 shadow-2xs" title="ล้างตัวกรอง">
                      <i class="fas fa-times text-gray-400"></i> ล้างตัวกรอง
                    </button>
                  ` : ''}

                </div>

              </div>

              <!-- Active Filter Description Status -->
              <div class="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-50">
                <span>แสดงข้อมูลแปลงปลูก: <b>${filteredPlots.length} แปลง</b> (จากทั้งหมด ${plots.length} แปลง)</span>
                ${this.cycleFilter !== 'all' ? `
                  <span class="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    <i class="fa-solid fa-filter mr-1"></i> ตัวกรอง: รอบที่ ${this.cycleFilter === 'other' ? 'อื่นๆ' : this.cycleFilter}
                  </span>
                ` : ''}
              </div>
            </div>

            <!-- Plots List Grouped by Plot (แยกตามแปลง) -->
            <div class="space-y-6">
              ${plotCardsHtml}
            </div>

          </div>
        `}

      </div>
    `;
  },

  init() {
    // 0. Tab switching events
    const tabPlantingBtn = document.getElementById('history-tab-planting-btn');
    if (tabPlantingBtn) {
      tabPlantingBtn.addEventListener('click', () => {
        this.activeTab = 'planting';
        this.refreshView();
      });
    }

    const tabSalesBtn = document.getElementById('history-tab-sales-btn');
    if (tabSalesBtn) {
      tabSalesBtn.addEventListener('click', () => {
        this.activeTab = 'sales';
        this.refreshView();
      });
    }

    // 1. Search input event
    const searchInput = document.getElementById('history-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.refreshView();
      });
    }

    // 2. Cycle filter event
    const cycleSelect = document.getElementById('history-cycle-filter');
    if (cycleSelect) {
      cycleSelect.addEventListener('change', (e) => {
        this.cycleFilter = e.target.value;
        this.refreshView();
      });
    }

    // 3. Year filter event
    const yearSelect = document.getElementById('history-year-filter');
    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        this.yearFilter = e.target.value;
        this.refreshView();
      });
    }

    // 4. Clear filters button
    const clearBtn = document.getElementById('history-clear-filters-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.searchQuery = '';
        this.yearFilter = '';
        this.cycleFilter = 'all';
        this.refreshView();
      });
    }

    // 5. Reset button on empty state
    const resetBtn = document.getElementById('history-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.searchQuery = '';
        this.yearFilter = '';
        this.cycleFilter = 'all';
        this.refreshView();
      });
    }

    // 6. View detail modal buttons
    const detailBtns = document.querySelectorAll('.view-history-detail-btn');
    detailBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const cropId = btn.getAttribute('data-crop-id');
        this.showHistoryDetailModal(cropId);
      });
    });

    // 7. Preview plot photo modal
    const photoBtns = document.querySelectorAll('.preview-plot-photo-btn');
    photoBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const imgUrl = btn.getAttribute('data-img');
        const title = btn.getAttribute('data-title');
        this.showPlotPhotoModal(imgUrl, title);
      });
    });
  },

  showPlotPhotoModal(imgUrl, title) {
    const content = `
      <div class="p-6 space-y-4">
        <div class="rounded-2xl overflow-hidden border border-gray-100 shadow-sm max-h-[70vh] flex items-center justify-center bg-black/5">
          <img src="${imgUrl}" alt="${title}" class="max-w-full max-h-[65vh] object-contain rounded-xl" />
        </div>
        <div class="flex items-center justify-between text-xs text-gray-500 pt-2">
          <span><i class="fa-solid fa-camera mr-1 text-emerald-600"></i> ${title}</span>
          <button type="button" class="close-global-modal-btn px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    `;

    openGlobalModal({
      title: title || 'ภาพถ่ายแปลงเพาะปลูกจริง',
      icon: 'fa-solid fa-image',
      size: 'max-w-3xl',
      headerColor: 'bg-[#163819]',
      content: content
    });
  },

  showHistoryDetailModal(cropId) {
    const selectedCrop = appState.getCropById(cropId);
    if (!selectedCrop) return;

    const plot = appState.getPlotById(selectedCrop.plotId);
    const members = appState.getMembers();
    const owners = members.filter(m => plot && ((plot.memberIds && plot.memberIds.includes(m.id)) || plot.memberId === m.id));
    const ownersNames = owners.map(o => o.name).join(', ') || '-';
    const ownersPhones = owners.map(o => o.phone).filter(Boolean).join(', ') || '-';

    const fertCost = (selectedCrop.fertilizingLog || []).reduce((sum, f) => sum + (f.cost || 0), 0);
    const totalCost = (selectedCrop.cost || 0) + fertCost;

    const logsHtml = (selectedCrop.fertilizingLog && selectedCrop.fertilizingLog.length > 0)
      ? selectedCrop.fertilizingLog.map((log) => `
          <div class="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs border border-gray-100">
            <div>
              <span class="font-bold text-gray-800">${log.type || log.fertilizerType || 'การบำรุง/ใส่ปุ๋ย'}</span>
              <span class="text-gray-400 block text-[10px] mt-0.5">${formatThaiDate(log.date)} ${log.note ? `• ${log.note}` : ''}</span>
            </div>
            <div class="text-right">
              <span class="text-emerald-700 font-bold block">${log.amount || `${log.amountKg || 0} กก.`}</span>
              <span class="text-gray-400 text-[10px]">${log.cost ? `${log.cost.toLocaleString()} บาท` : 'ไม่มีค่าใช้จ่าย'}</span>
            </div>
          </div>
        `).join('')
      : `<p class="text-xs text-gray-400 py-2">ไม่มีประวัติการใส่ปุ๋ยในรอบนี้</p>`;

    const traceUrl = `${window.location.origin}${window.location.pathname}#trace/${selectedCrop.id}`;
    const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(traceUrl)}`;

    const detailContent = `
      <div class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
          <div class="flex justify-between items-start border-b border-gray-100 pb-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  รอบที่ ${selectedCrop.cropCycle || 1}
                </span>
                <span class="text-xs font-bold text-gray-400">ปีเพาะปลูก พ.ศ. ${selectedCrop.cropYear || '-'}</span>
              </div>
              <h4 class="text-lg font-bold text-emerald-900 mt-1">${plot ? plot.name : '-'} (${selectedCrop.plotId})</h4>
              <p class="text-xs text-gray-500 mt-0.5">เกษตรกรผู้ดูแล: <b>${ownersNames}</b> | โทร: <b>${ownersPhones}</b></p>
            </div>
            <span class="px-3 py-1 text-xs font-bold rounded-full ${
              selectedCrop.status === 'harvested' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
            }">
              ${selectedCrop.status === 'harvested' ? 'เก็บเกี่ยวแล้ว' : 'กำลังเพาะปลูก'}
            </span>
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div class="p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <span class="text-xs text-amber-700 font-bold block">ผลผลิตสดที่ได้</span>
              <span class="text-2xl font-black text-amber-900 mt-0.5 block">${(selectedCrop.yield || 0).toFixed(2)} กก.</span>
            </div>
            <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span class="text-xs text-emerald-700 font-bold block">จำนวนต้นกล้า</span>
              <span class="text-2xl font-black text-emerald-900 mt-0.5 block">${selectedCrop.seedlingCount || 0} ต้น</span>
            </div>
            <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <span class="text-xs text-gray-500 font-bold block">ต้นทุนสะสมรวม</span>
              <span class="text-2xl font-black text-emerald-800 mt-0.5 block">${formatBaht(totalCost)}</span>
            </div>
          </div>

          ${(selectedCrop.isProcessed || selectedCrop.dryWeight) ? `
            <div class="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 rounded-2xl border border-emerald-300 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-1.5">
                  <i class="fas fa-fire-alt text-amber-600"></i> ข้อมูลการอบแห้ง (แปรรูปเข้าคลังเรียบร้อย)
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-200 text-emerald-900 border border-emerald-300">
                  อบแห้งเสร็จสิ้น
                </span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-center">
                <div class="p-2.5 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                  <span class="text-[11px] text-gray-500 font-bold block">วันที่อบ</span>
                  <span class="text-xs sm:text-sm font-black text-gray-900 mt-0.5 block">${formatThaiDate(selectedCrop.dryingDate || selectedCrop.harvestDateActual)}</span>
                </div>
                <div class="p-2.5 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                  <span class="text-[11px] text-gray-500 font-bold block">ใช้ผลผลิตสด</span>
                  <span class="text-xs sm:text-sm font-black text-amber-950 mt-0.5 block">${parseFloat(selectedCrop.freshUsed || selectedCrop.yield || 0).toFixed(2)} กก.</span>
                  <span class="text-[10px] text-gray-500 block">จากทั้งหมด ${parseFloat(selectedCrop.yield || 0).toFixed(2)} กก.</span>
                </div>
                <div class="p-2.5 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                  <span class="text-[11px] text-gray-500 font-bold block">ได้หลังอบเสร็จ</span>
                  <span class="text-sm sm:text-base font-black text-emerald-800 mt-0.5 block">${parseFloat(selectedCrop.dryWeight || 0).toFixed(2)} กก.</span>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Planting Dates & Remarks -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 bg-gray-50 rounded-2xl text-xs space-y-2 border border-gray-100">
              <span class="font-bold text-gray-700 block">ช่วงเวลาเพาะปลูก</span>
              <div class="flex justify-between text-gray-600">
                <span>วันที่ลงต้นกล้าเริ่มปลูก:</span>
                <span class="font-bold text-gray-800">${formatThaiDate(selectedCrop.plantDate)}</span>
              </div>
              <div class="flex justify-between text-gray-600">
                <span>วันที่เก็บเกี่ยวผลผลิตจริง:</span>
                <span class="font-bold text-gray-800">${selectedCrop.harvestDateActual ? formatThaiDate(selectedCrop.harvestDateActual) : (selectedCrop.harvestDateEst ? `${formatThaiDate(selectedCrop.harvestDateEst)} (ประมาณ)` : '-')}</span>
              </div>
            </div>

            <div class="p-4 bg-gray-50 rounded-2xl text-xs space-y-2 border border-gray-100">
              <span class="font-bold text-gray-700 block">บันทึกและหมายเหตุ</span>
              <div class="text-gray-600">
                <span>หมายเหตุรอบปลูก:</span>
                <span class="font-medium text-gray-800 ml-1">${selectedCrop.note || '-'}</span>
              </div>
              <div class="text-gray-600">
                <span>หมายเหตุเก็บเกี่ยว:</span>
                <span class="font-medium text-emerald-700 ml-1">${selectedCrop.harvestNote || '-'}</span>
              </div>
            </div>
          </div>

          <!-- Fertilizing & Care Logs -->
          <div class="space-y-2">
            <span class="text-xs font-bold text-gray-700 block">ประวัติการใส่ปุ๋ยและการบำรุง (${(selectedCrop.fertilizingLog || []).length} รายการ)</span>
            <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
              ${logsHtml}
            </div>
          </div>

          <!-- Traceability Section -->
          <div class="p-4 border border-dashed border-emerald-300 rounded-2xl bg-emerald-50/50 flex items-center justify-between gap-4">
            <div class="space-y-1 flex-1">
              <span class="text-xs font-bold text-emerald-800 block">รหัสตรวจสอบย้อนกลับ (Traceability)</span>
              <p class="text-[11px] text-gray-500">สามารถใช้ QR Code เพื่อให้ผู้บริโภคสแกนตรวจที่มาผลผลิต</p>
              <button data-id="${selectedCrop.id}" class="global-test-trace-btn text-xs font-bold text-emerald-700 hover:text-emerald-950 underline pt-1 block">
                <i class="fas fa-external-link-alt"></i> เปิดหน้าจอตรวจสอบย้อนกลับ
              </button>
            </div>
            <img src="${qrCodeApiUrl}" alt="QR" class="w-16 h-16 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          </div>
        </div>

        <!-- Footer (Fixed) -->
        <div class="p-4 md:px-6 bg-gray-50 border-t border-gray-100 text-right flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-6 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    `;

    openGlobalModal({
      title: `รายละเอียดรอบการปลูก ${selectedCrop.id}`,
      icon: 'fas fa-clipboard-check',
      size: 'max-w-5xl',
      headerColor: 'bg-[#163819]',
      content: detailContent,
      onRender: (dialog) => {
        const testTraceBtn = dialog.querySelector('.global-test-trace-btn');
        if (testTraceBtn) {
          testTraceBtn.addEventListener('click', () => {
            closeGlobalModal();
            window.location.hash = `#trace/${selectedCrop.id}`;
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
