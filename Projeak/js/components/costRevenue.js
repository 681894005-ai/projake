// สรุปต้นทุน-รายได้ วิสาหกิจชุมชน — Cost & Revenue Summary Component
import { appState } from '../state.js';
import { formatThaiDate, formatBaht, showToast, openGlobalModal, closeGlobalModal } from '../helpers.js';

export const CostRevenueComponent = {

  render() {
    const currentUser = appState.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'Member';

    // ---- Raw Data ----
    let plots     = appState.getPlots();
    let crops     = appState.getCrops();
    let members   = appState.getMembers();
    let sales     = appState.getSales();
    let batches   = appState.getDryingBatches ? appState.getDryingBatches() : [];
    let products  = appState.getProducts();

    if (isMember) {
      plots  = plots.filter(p => p.memberIds && p.memberIds.includes(currentUser.memberId));
      const plotIds = plots.map(p => p.id);
      crops  = crops.filter(c => plotIds.includes(c.plotId));
    }
    const cropIds = crops.map(c => c.id);
    sales = sales.filter(s => cropIds.includes(s.cropId));

    // ---- KPI Totals ----
    const totalRevenue = sales.reduce((s, x) => s + (x.totalPrice || 0), 0);
    const totalCost    = crops.reduce((s, c) => s + (parseFloat(c.cost) || 0), 0);
    const totalProfit  = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';

    const totalFreshKg = crops.reduce((s, c) => s + (parseFloat(c.harvestWeight) || 0), 0);
    const totalDryKg   = batches.reduce((s, b) => s + (parseFloat(b.dryWeight) || 0), 0);
    const totalSaleQty = sales.reduce((s, x) => s + (parseFloat(x.amountKg || x.amount) || 0), 0);
    const avgPricePerKg = totalSaleQty > 0 ? (totalRevenue / totalSaleQty).toFixed(0) : 0;

    const kpiCards = [
      {
        label: 'รายได้จากการจำหน่ายรวม',
        value: formatBaht(totalRevenue),
        sub: `${sales.length} รายการขาย`,
        icon: 'fa-cash-register',
        bg: 'bg-emerald-700',
        textColor: 'text-white'
      },
      {
        label: 'ต้นทุนการผลิตรวม',
        value: formatBaht(totalCost),
        sub: `${crops.length} รอบการปลูก`,
        icon: 'fa-seedling',
        bg: 'bg-amber-600',
        textColor: 'text-white'
      },
      {
        label: 'กำไรสุทธิรวม',
        value: (totalProfit >= 0 ? '+' : '') + formatBaht(totalProfit),
        sub: `Margin ${profitMargin}%`,
        icon: totalProfit >= 0 ? 'fa-chart-line' : 'fa-arrow-trend-down',
        bg: totalProfit >= 0 ? 'bg-green-700' : 'bg-red-600',
        textColor: 'text-white'
      },
      {
        label: 'ราคาขายเฉลี่ยต่อ กก.',
        value: `${Number(avgPricePerKg).toLocaleString()} บาท`,
        sub: `จำหน่ายรวม ${totalSaleQty.toFixed(2)} กก.`,
        icon: 'fa-scale-balanced',
        bg: 'bg-sky-700',
        textColor: 'text-white'
      },
      {
        label: 'ผลผลิตดอกสดรวม',
        value: `${totalFreshKg.toFixed(2)} กก.`,
        sub: `อบแห้งได้ ${totalDryKg.toFixed(2)} กก.`,
        icon: 'fa-box-open',
        bg: 'bg-indigo-600',
        textColor: 'text-white'
      },
      {
        label: 'อัตราการอบแห้ง (เฉลี่ย)',
        value: totalFreshKg > 0 ? `${((totalDryKg / totalFreshKg) * 100).toFixed(1)}%` : '-',
        sub: `สด → แห้ง (เป้า ~12.5%)`,
        icon: 'fa-temperature-half',
        bg: 'bg-orange-600',
        textColor: 'text-white'
      }
    ];

    const kpiHtml = kpiCards.map(k => `
      <div class="rounded-2xl ${k.bg} p-5 flex items-start justify-between shadow-md hover:shadow-lg transition-all">
        <div class="space-y-1.5">
          <span class="text-[11px] font-bold ${k.textColor} opacity-80 uppercase tracking-wider block">${k.label}</span>
          <div class="text-2xl sm:text-3xl font-black ${k.textColor} tabular-nums leading-none">${k.value}</div>
          <span class="text-[11px] ${k.textColor} opacity-70 font-medium">${k.sub}</span>
        </div>
        <div class="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-xl ${k.textColor} shrink-0">
          <i class="fas ${k.icon}"></i>
        </div>
      </div>
    `).join('');

    // ---- By Herb Type Breakdown ----
    const herbTypes = ['เก๊กฮวย', 'คาโมมายล์'];
    const herbRows = herbTypes.map(herb => {
      const herbCrops = crops.filter(c => {
        const plot = plots.find(p => p.id === c.plotId);
        const pt = c.seedlingSource || (plot ? plot.plantType : '') || '';
        return pt.includes(herb);
      });
      const herbSales = sales.filter(s => {
        const crop = appState.getCropById(s.cropId);
        const plot = crop ? plots.find(p => p.id === crop.plotId) : null;
        const pt = crop?.seedlingSource || (plot ? plot.plantType : '') || '';
        return pt.includes(herb);
      });
      const rev  = herbSales.reduce((s, x) => s + (x.totalPrice || 0), 0);
      const cost = herbCrops.reduce((s, c) => s + (parseFloat(c.cost) || 0), 0);
      const profit = rev - cost;
      const freshKg = herbCrops.reduce((s, c) => s + (parseFloat(c.harvestWeight) || 0), 0);
      const dryBatches = batches.filter(b => b.herbType && b.herbType.includes(herb));
      const dryKg = dryBatches.reduce((s, b) => s + (parseFloat(b.dryWeight) || 0), 0);
      const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : '0.0';
      const emoji = herb === 'เก๊กฮวย' ? '🌼' : '🌿';

      return { herb, emoji, rev, cost, profit, margin, freshKg, dryKg, crops: herbCrops.length, sales: herbSales.length };
    });

    const herbTableRows = herbRows.map(r => `
      <tr class="border-b border-gray-100 hover:bg-emerald-50/30 transition-colors">
        <td class="py-4 px-5">
          <div class="flex items-center gap-2.5">
            <span class="text-xl">${r.emoji}</span>
            <div>
              <div class="font-black text-gray-900 text-sm">${r.herb}</div>
              <div class="text-[10px] text-gray-400">${r.crops} รอบปลูก · ${r.sales} รายการขาย</div>
            </div>
          </div>
        </td>
        <td class="py-4 px-5 text-right font-bold text-gray-700">${r.freshKg.toFixed(2)} กก.</td>
        <td class="py-4 px-5 text-right font-bold text-indigo-700">${r.dryKg.toFixed(2)} กก.</td>
        <td class="py-4 px-5 text-right font-bold text-amber-700">${formatBaht(r.cost)}</td>
        <td class="py-4 px-5 text-right font-bold text-emerald-700">${formatBaht(r.rev)}</td>
        <td class="py-4 px-5 text-right font-black text-lg ${r.profit >= 0 ? 'text-green-700' : 'text-red-600'}">${r.profit >= 0 ? '+' : ''}${formatBaht(r.profit)}</td>
        <td class="py-4 px-5 text-center">
          <span class="inline-block px-3 py-1 rounded-full text-xs font-bold border ${r.profit >= 0 ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}">
            ${r.margin}%
          </span>
        </td>
      </tr>
    `).join('');

    // ---- Per-Member Analysis ----
    const financialReport = appState.getFinancialReport();
    let reportData = isMember
      ? financialReport.filter(r => r.id === currentUser.memberId)
      : financialReport;

    const memberRows = reportData.length === 0
      ? `<tr><td colspan="6" class="py-8 text-center text-sm text-gray-400">ยังไม่มีข้อมูลการเงินรายสมาชิก</td></tr>`
      : reportData.map(r => {
          const margin = r.totalRevenue > 0 ? ((r.netProfit / r.totalRevenue) * 100).toFixed(1) : '0.0';
          return `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="py-3.5 px-5 text-sm font-bold text-emerald-800">${r.id}</td>
              <td class="py-3.5 px-5">
                <div class="font-bold text-gray-900 text-sm">${r.name}</div>
                <div class="text-[10px] text-gray-400">${r.role} · ${r.villageNumber}</div>
              </td>
              <td class="py-3.5 px-5 text-center text-sm font-medium text-gray-700">${r.totalCrops} รอบ</td>
              <td class="py-3.5 px-5 text-right text-sm font-bold text-amber-700">${formatBaht(r.totalCost)}</td>
              <td class="py-3.5 px-5 text-right text-sm font-bold text-emerald-700">${formatBaht(r.totalRevenue)}</td>
              <td class="py-3.5 px-5 text-right font-black ${r.netProfit >= 0 ? 'text-green-700' : 'text-red-600'} text-sm">
                ${r.netProfit > 0 ? '+' : ''}${formatBaht(r.netProfit)}
                <span class="text-[10px] font-medium text-gray-400 block">${margin}%</span>
              </td>
            </tr>
          `;
        }).join('');

    // ---- Product Profitability (from inventory) ----
    const productRows = products.map(p => {
      const revenue = p.stock * p.price;
      return { ...p, potentialRevenue: revenue };
    }).sort((a, b) => b.potentialRevenue - a.potentialRevenue);

    const productHtml = productRows.map(p => {
      const stockBar = Math.min(100, (p.stock / (p.stock + 1)) * 100); // simple relative bar
      const isKg = p.unit === 'กก.';
      return `
        <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-base">${p.name.includes('เก๊กฮวย') ? '🌼' : p.name.includes('คาโมมายล์') ? '🌿' : '📦'}</span>
              <span class="text-sm font-bold text-gray-900 truncate">${p.name}</span>
            </div>
            <div class="text-[10px] text-gray-400 mt-0.5 ml-6">คงเหลือ: <b class="text-gray-600">${isKg ? p.stock.toFixed(2) : p.stock.toLocaleString()}</b> ${p.unit}</div>
          </div>
          <div class="text-right shrink-0">
            <div class="text-base font-black text-emerald-700">${formatBaht(p.price)}<span class="text-xs font-medium text-gray-400">/${p.unit}</span></div>
            <div class="text-[11px] font-bold text-indigo-600 mt-0.5">มูลค่าคลัง ~${formatBaht(p.potentialRevenue)}</div>
          </div>
        </div>
      `;
    }).join('');

    // ---- Sales by Month ----
    const monthMap = {};
    sales.forEach(s => {
      const d = s.date || '';
      const mo = d.substring(0, 7); // YYYY-MM
      if (!mo) return;
      if (!monthMap[mo]) monthMap[mo] = { revenue: 0, qty: 0, count: 0 };
      monthMap[mo].revenue += (s.totalPrice || 0);
      monthMap[mo].qty     += (parseFloat(s.amountKg || s.amount) || 0);
      monthMap[mo].count   ++;
    });

    const monthKeys = Object.keys(monthMap).sort().reverse().slice(0, 6);
    const monthRowsHtml = monthKeys.length === 0
      ? `<tr><td colspan="4" class="py-6 text-center text-sm text-gray-400">ยังไม่มีข้อมูลการขายรายเดือน</td></tr>`
      : monthKeys.map(mo => {
          const [y, m] = mo.split('-');
          const thMonth = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][parseInt(m)];
          const data = monthMap[mo];
          return `
            <tr class="border-b border-gray-100 hover:bg-emerald-50/30 transition-colors">
              <td class="py-3.5 px-5 font-bold text-gray-700">${thMonth} ${parseInt(y) + 543}</td>
              <td class="py-3.5 px-5 text-right text-gray-600 font-medium">${data.qty.toFixed(2)} กก./กระปุก</td>
              <td class="py-3.5 px-5 text-right font-black text-emerald-700 text-base">${formatBaht(data.revenue)}</td>
              <td class="py-3.5 px-5 text-center">
                <span class="text-xs font-bold text-gray-500">${data.count} รายการ</span>
              </td>
            </tr>
          `;
        }).join('');

        // --- Harvest Report Data ---
    const allPlots = appState.getPlots();
    const allHarvests = appState.getCrops().filter(c => c.status === 'harvested');
    let totalHarvestFresh = 0;
    let totalHarvestDry = 0;
    
    const harvestRowsHtml = allHarvests.length === 0 
      ? '<tr><td colspan="5" class="py-6 text-center text-gray-400 text-sm">ยังไม่มีข้อมูลการเก็บเกี่ยว</td></tr>'
      : allHarvests.map(c => {
          const p = allPlots.find(x => x.id === c.plotId);
          const owner = p ? members.find(m => m.id === p.memberId || (p.memberIds && p.memberIds.includes(m.id))) : null;
          const fresh = parseFloat(c.yield) || 0;
          const dry = parseFloat(c.dryWeight) || parseFloat((fresh/10).toFixed(2));
          totalHarvestFresh += fresh;
          totalHarvestDry += dry;
          return `<tr class="border-b border-gray-100 hover:bg-emerald-50 transition-colors">
            <td class="py-3 px-5 text-sm font-bold text-gray-800">` + (owner ? owner.name : "-") + `</td>
            <td class="py-3 px-5 text-sm text-gray-600">` + c.id + `</td>
            <td class="py-3 px-5 text-sm font-bold text-emerald-800 text-right">` + fresh.toFixed(2) + `</td>
            <td class="py-3 px-5 text-sm font-bold text-amber-700 text-right">` + dry.toFixed(2) + `</td>
          </tr>`;
        }).join('');
    const totalInventoryValue = productRows.reduce((s, p) => s + p.potentialRevenue, 0);

    return `
      <div class="fade-in space-y-7">

        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 class="text-2xl font-black text-gray-900 flex items-center gap-2.5">
              <span class="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center text-lg shadow">
                <i class="fas fa-chart-pie"></i>
              </span>
              สรุปต้นทุน–รายได้
            </h1>
            <p class="text-sm text-gray-500 mt-1 ml-1">
              วิเคราะห์ภาพรวมการเงินวิสาหกิจ · ต้นทุนการผลิต · รายได้ · กำไรสุทธิ · แยกตามพืชและสมาชิก
            </p>
          </div>
          <a href="#finance" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all shadow-xs self-start sm:self-auto">
            <i class="fas fa-hand-holding-dollar"></i> ไปที่การเงินรายสมาชิก →
          </a>
        </div>

        <!-- KPI Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${kpiHtml}
        </div>

        <!-- Section: แยกตามชนิดพืช -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-6 py-4 bg-gradient-to-r from-emerald-800 to-emerald-700 flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white text-base">
              <i class="fas fa-leaf"></i>
            </div>
            <div>
              <h2 class="text-base font-black text-white">วิเคราะห์ต้นทุน-รายได้ แยกตามชนิดพืช</h2>
              <p class="text-xs text-emerald-200">ผลผลิตสด · อบแห้ง · ต้นทุน · รายได้ · กำไร รายพืช</p>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th class="py-3.5 px-5">ชนิดพืช</th>
                  <th class="py-3.5 px-5 text-right">ผลผลิตสด (กก.)</th>
                  <th class="py-3.5 px-5 text-right">อบแห้ง (กก.)</th>
                  <th class="py-3.5 px-5 text-right">ต้นทุนรวม</th>
                  <th class="py-3.5 px-5 text-right">รายได้รวม</th>
                  <th class="py-3.5 px-5 text-right">กำไรสุทธิ</th>
                  <th class="py-3.5 px-5 text-center">Margin</th>
                </tr>
              </thead>
              <tbody>
                ${herbTableRows}
              </tbody>
              <tfoot>
                <tr class="bg-emerald-50 border-t-2 border-emerald-600 font-black text-sm">
                  <td class="py-3.5 px-5 text-emerald-900">รวมทั้งหมด</td>
                  <td class="py-3.5 px-5 text-right text-gray-700">${totalFreshKg.toFixed(2)} กก.</td>
                  <td class="py-3.5 px-5 text-right text-indigo-700">${totalDryKg.toFixed(2)} กก.</td>
                  <td class="py-3.5 px-5 text-right text-amber-700">${formatBaht(totalCost)}</td>
                  <td class="py-3.5 px-5 text-right text-emerald-700">${formatBaht(totalRevenue)}</td>
                  <td class="py-3.5 px-5 text-right ${totalProfit >= 0 ? 'text-green-700' : 'text-red-600'}">${totalProfit >= 0 ? '+' : ''}${formatBaht(totalProfit)}</td>
                  <td class="py-3.5 px-5 text-center text-emerald-800">${profitMargin}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Two-column: Monthly + Inventory Value -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <!-- Monthly Sales Trend -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-sky-700 text-white flex items-center justify-center text-sm">
                <i class="fas fa-calendar-days"></i>
              </div>
              <div>
                <h2 class="text-sm font-black text-gray-900">รายได้จากการขาย รายเดือน</h2>
                <p class="text-[10px] text-gray-400">6 เดือนล่าสุด (เรียงจากใหม่ไปเก่า)</p>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <th class="py-3 px-5">เดือน</th>
                    <th class="py-3 px-5 text-right">ปริมาณ</th>
                    <th class="py-3 px-5 text-right">รายได้</th>
                    <th class="py-3 px-5 text-center">รายการ</th>
                  </tr>
                </thead>
                <tbody>${monthRowsHtml}</tbody>
              </table>
            </div>
          </div>

          <!-- Inventory Value / Product Profitability -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2.5">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm">
                  <i class="fas fa-boxes-stacked"></i>
                </div>
                <div>
                  <h2 class="text-sm font-black text-gray-900">มูลค่าสินค้าคงคลัง</h2>
                  <p class="text-[10px] text-gray-400">ราคาขาย × จำนวนคงเหลือในคลัง</p>
                </div>
              </div>
              <div class="text-right">
                <span class="text-[10px] text-gray-400 block">มูลค่ารวม</span>
                <span class="text-base font-black text-indigo-700">${formatBaht(totalInventoryValue)}</span>
              </div>
            </div>
            <div class="p-5 space-y-1">
              ${productHtml || '<p class="text-sm text-gray-400 text-center py-6">ไม่พบข้อมูลสินค้า</p>'}
            </div>
          </div>

        </div>

        <!-- Per-Member Analysis -->
        ${!isMember ? `
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-6 py-4 bg-gradient-to-r from-amber-700 to-amber-600 flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white text-base">
              <i class="fas fa-users"></i>
            </div>
            <div>
              <h2 class="text-base font-black text-white">วิเคราะห์ต้นทุน-รายได้ รายสมาชิก</h2>
              <p class="text-xs text-amber-100">ต้นทุน · รายได้ · กำไรสุทธิ · Margin รายบุคคล</p>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th class="py-3.5 px-5">รหัสสมาชิก</th>
                  <th class="py-3.5 px-5">ชื่อ-นามสกุล</th>
                  <th class="py-3.5 px-5 text-center">รอบปลูก</th>
                  <th class="py-3.5 px-5 text-right">ต้นทุนสะสม</th>
                  <th class="py-3.5 px-5 text-right">รายได้สะสม</th>
                  <th class="py-3.5 px-5 text-right">กำไรสุทธิ / Margin</th>
                </tr>
              </thead>
              <tbody>${memberRows}</tbody>
            </table>
          </div>
        </div>
        ` : ''}

                  <!-- Harvest & Processing Comprehensive Report -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-200 bg-emerald-50/50">
              <h2 class="text-base font-black text-emerald-900 flex items-center gap-2">
                <i class="fas fa-seedling text-emerald-600"></i> ตารางสรุปการเก็บเกี่ยวและแปรรูป (รายบุคคล)
              </h2>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead class="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <tr>
                    <th class="py-3.5 px-5">ชื่อคนปลูก</th>
                    <th class="py-3.5 px-5">รอบเพาะปลูก</th>
                    <th class="py-3.5 px-5 text-right">น้ำหนักสด (กก.)</th>
                    <th class="py-3.5 px-5 text-right">น้ำหนักแห้ง (กก.)</th>
                  </tr>
                </thead>
                <tbody> + harvestRowsHtml + </tbody>
                <tfoot>
                  <tr class="bg-emerald-50 border-t-2 border-emerald-600 font-black text-sm">
                    <td colspan="2" class="py-3.5 px-5 text-emerald-900 text-right">รวมผลผลิตทั้งหมด:</td>
                    <td class="py-3.5 px-5 text-right text-emerald-800"> + totalHarvestFresh.toFixed(2) +  กก.</td>
                    <td class="py-3.5 px-5 text-right text-amber-700"> + totalHarvestDry.toFixed(2) +  กก.</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Summary Box -->
        <div class="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-6">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-lg shrink-0">
              <i class="fas fa-circle-info"></i>
            </div>
            <div class="space-y-2 text-sm text-emerald-900">
              <h3 class="font-black text-base text-emerald-800">หมายเหตุการคำนวณ</h3>
              <ul class="list-disc pl-4 space-y-1 text-emerald-800/80 text-xs">
                <li><b>รายได้</b> = ยอดขายสุทธิจากรายการจำหน่ายผลผลิตในระบบทั้งหมด</li>
                <li><b>ต้นทุน</b> = ต้นทุนสะสมรอบการเพาะปลูก (บันทึกในหน้าบันทึกรอบเพาะปลูก)</li>
                <li><b>กำไรสุทธิ</b> = รายได้ − ต้นทุน (ยังไม่รวมค่าแรง ค่าไฟ ค่าอบ หากไม่ได้บันทึกในต้นทุน)</li>
                <li><b>มูลค่าคลังสินค้า</b> = ราคาขายปัจจุบัน × จำนวนคงเหลือ (ยังไม่ใช่มูลค่าจริงที่ขายได้)</li>
                <li>สามารถปรับราคาสินค้าได้ที่ <a href="#inventory" class="underline font-bold text-emerald-700">หน้าคลังสินค้า</a></li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    `;
  },

  init() {
    // Navigation links inside the component (e.g. <a href="#inventory">)
    // are handled by the router naturally — no special binding needed
  },

  refreshView() {
    const container = document.getElementById('app-view');
    if (container) {
      container.innerHTML = this.render();
      this.init();
    }
  }
};
