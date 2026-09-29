// Fresh Produce Management Component (ระบบจัดการผลผลิตดอกสดรวม - Clean & Elderly-Friendly Process Flow)
import { appState } from '../state.js';
import { formatThaiDate, formatBaht, showToast, openGlobalModal, closeGlobalModal } from '../helpers.js';

export const FreshProduceComponent = {
  selectedHerb: 'เก๊กฮวย',
  activeTab: 'drying', // 'drying' | 'canning' | 'history'
  historySubTab: 'drying', // 'drying' | 'canning'

  render() {
    const allCrops = appState.getCrops();
    const plots = appState.getPlots();
    const dryingBatches = appState.getDryingBatches ? appState.getDryingBatches() : [];
    const packagingBatches = appState.getPackagingBatches ? appState.getPackagingBatches() : [];

    const allHarvestedCrops = allCrops.filter(c => c.status === 'harvested');

    const getCropHerb = (c) => {
      const plot = appState.getPlotById(c.plotId);
      const raw = c.seedlingSource || (plot ? plot.plantType : '') || 'เก๊กฮวย';
      if (raw.includes('เก๊กฮวย')) return 'เก๊กฮวย';
      if (raw.includes('คาโมมายล์')) return 'คาโมมายล์';
      return raw.trim() || 'เก๊กฮวย';
    };

    const allRoadmaps = appState.getRoadmaps ? appState.getRoadmaps() : {};
    const roadmapHerbNames = Object.keys(allRoadmaps);
    const plotHerbNames = plots.map(p => p.plantType).filter(Boolean);
    const cropHerbNames = allCrops.map(c => c.seedlingSource).filter(Boolean);
    const batchHerbNames = dryingBatches.map(b => b.herbType).filter(Boolean);

    const rawHerbs = ['เก๊กฮวย', 'คาโมมายล์', ...roadmapHerbNames, ...plotHerbNames, ...cropHerbNames, ...batchHerbNames];
    const herbTypes = [];
    rawHerbs.forEach(raw => {
      let clean = raw.trim();
      if (clean.includes('เก๊กฮวย')) clean = 'เก๊กฮวย';
      else if (clean.includes('คาโมมายล์')) clean = 'คาโมมายล์';
      if (clean && !herbTypes.includes(clean)) {
        herbTypes.push(clean);
      }
    });

    if (!this.selectedHerb || !herbTypes.includes(this.selectedHerb)) {
      this.selectedHerb = herbTypes[0] || 'เก๊กฮวย';
    }
    const currentSelectedHerb = this.selectedHerb;

    const getHerbRatio = (h = '') => {
      if (h.includes('เก๊กฮวย')) return 10;
      if (h.includes('คาโมมายล์')) return 10;
      if (h.includes('ชา')) return 5;
      if (h.includes('ดาวเรือง')) return 10;
      if (h.includes('ฟ้าทะลายโจร')) return 6;
      return 10;
    };

    const herbPools = herbTypes.map(herb => {
      const cropsForHerb = allHarvestedCrops.filter(c => getCropHerb(c) === herb);
      const pendingCrops = cropsForHerb.filter(c => !c.isProcessed);
      const processedCrops = cropsForHerb.filter(c => c.isProcessed);

      const pendingFreshKg = pendingCrops.reduce((sum, c) => sum + (parseFloat(c.yield) || 0), 0);
      const processedFreshKg = processedCrops.reduce((sum, c) => sum + (parseFloat(c.yield) || 0), 0);

      const isChrys = herb === 'เก๊กฮวย' || herb.includes('เก๊กฮวย');
      const isCham = herb === 'คาโมมายล์' || herb.includes('คาโมมายล์');
      const ratio = getHerbRatio(herb);
      const estDryKg = pendingFreshKg > 0 ? (pendingFreshKg / ratio) : 0;

      const herbBatches = dryingBatches.filter(b => {
        if (b.herbType === herb) return true;
        if (isChrys && b.herbType && b.herbType.includes('เก๊กฮวย')) return true;
        if (isCham && b.herbType && b.herbType.includes('คาโมมายล์')) return true;
        return false;
      });
      const actualDryKg = herbBatches.reduce((sum, b) => sum + (parseFloat(b.dryWeightKg) || 0), 0);
      const batchCount = herbBatches.length;

      return {
        herb, isChrys, isCham, ratio, pendingCrops, processedCrops,
        pendingFreshKg, processedFreshKg, estDryKg, actualDryKg, batchCount, herbBatches
      };
    });

    const selectedPool = herbPools.find(p => p.herb === currentSelectedHerb) || herbPools[0];

    const filteredBatches = dryingBatches.filter(b => {
      if (b.herbType === currentSelectedHerb) return true;
      if (selectedPool && selectedPool.isChrys && b.herbType && b.herbType.includes('เก๊กฮวย')) return true;
      if (selectedPool && selectedPool.isCham && b.herbType && b.herbType.includes('คาโมมายล์')) return true;
      return false;
    });
    const filteredFreshDryingSum = filteredBatches.reduce((sum, b) => sum + (parseFloat(b.freshWeightKg) || 0), 0);
    const filteredDryFromBatches = selectedPool ? selectedPool.actualDryKg : 0;
    const cropsForHerb = allHarvestedCrops.filter(c => getCropHerb(c) === currentSelectedHerb);

    const filteredPackBatches = packagingBatches.filter(b => {
      if (b.herbType === currentSelectedHerb) return true;
      if (selectedPool && selectedPool.isChrys && b.herbType && b.herbType.includes('เก๊กฮวย')) return true;
      if (selectedPool && selectedPool.isCham && b.herbType && b.herbType.includes('คาโมมายล์')) return true;
      return false;
    });
    const filteredDryUsedSum = filteredPackBatches.reduce((sum, b) => sum + (parseFloat(b.dryUsedKg) || 0), 0);
    const filteredJarsProducedSum = filteredPackBatches.reduce((sum, b) => sum + (parseInt(b.jarsProduced) || 0), 0);

    const pricePerKg = appState.getProductPrice(selectedPool.herb, 'กก.');
    const pricePerJar = appState.getProductPrice(selectedPool.herb, 'กระป๋อง');
    const products = appState.getProducts();
    const cannedProduct = products.find(p => (p.unit === 'กระป๋อง' || p.unit === 'กระป๋อง') && (p.category.includes(selectedPool.herb) || p.name.includes(selectedPool.herb))) || {
      id: selectedPool.isChrys ? 'PRD-003' : 'PRD-004',
      name: selectedPool.isChrys ? 'เก๊กฮวยกระป๋อง (50 G)' : 'คาโมมายล์กระป๋อง (50 G)',
      stock: selectedPool.isChrys ? 100 : 50,
      price: pricePerJar
    };
    const currentJarsInStock = cannedProduct.stock || 0;
    const availableDryKg = selectedPool.actualDryKg;
    const potentialJars = Math.floor(availableDryKg * 20);
    const potentialJarsValue = potentialJars * pricePerJar;

    return `
      <div class="fade-in space-y-6 pb-12 max-w-7xl mx-auto">
        
        <!-- 1. Executive Header & Segmented Control -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <h1 class="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              กระบวนการแปรรูปสมุนไพร
            </h1>
            <p class="text-sm text-slate-500 mt-1.5 font-medium">
              จัดการผลผลิตสด อบแห้ง และบรรจุภัณฑ์ (สูตรมาตรฐาน 10:1)
            </p>
          </div>

          <!-- Segmented Control (iOS Style) -->
          <div class="flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 shrink-0 shadow-inner">
            ${herbTypes.map(h => `
              <button data-herb="${h}" class="fresh-herb-pill-btn px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                h === currentSelectedHerb 
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }">
                ${h}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 2. Minimalist KPI Summary Cards (4 Cards) -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Card 1 -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-slate-300 transition-colors">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">ดอกสดรออบ</span>
              <i class="fa-solid fa-leaf text-slate-300 group-hover:text-slate-500 transition-colors"></i>
            </div>
            <div>
              <div class="flex items-baseline gap-1.5">
                <span class="text-3xl font-light text-slate-900 tracking-tight">${selectedPool.pendingFreshKg.toFixed(1)}</span>
                <span class="text-sm text-slate-500">กก.</span>
              </div>
              <div class="text-xs text-slate-500 mt-1.5 font-medium">
                ${cropsForHerb.filter(c => !c.isProcessed).length} แปลงเพาะปลูก
              </div>
            </div>
          </div>

          <!-- Card 2 -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-slate-300 transition-colors">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">ดอกแห้งในคลัง (Bulk)</span>
              <i class="fa-solid fa-box text-slate-300 group-hover:text-slate-500 transition-colors"></i>
            </div>
            <div>
              <div class="flex items-baseline gap-1.5">
                <span class="text-3xl font-light text-slate-900 tracking-tight">${selectedPool.actualDryKg.toFixed(1)}</span>
                <span class="text-sm text-slate-500">กก.</span>
              </div>
              <div class="text-xs text-slate-500 mt-1.5 font-medium">
                มูลค่า ~${formatBaht(selectedPool.actualDryKg * pricePerKg)}
              </div>
            </div>
          </div>

          <!-- Card 3 -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-slate-300 transition-colors">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">สินค้ากระป๋อง 50G</span>
              <i class="fa-solid fa-jar text-slate-300 group-hover:text-slate-500 transition-colors"></i>
            </div>
            <div>
              <div class="flex items-baseline gap-1.5">
                <span class="text-3xl font-light text-slate-900 tracking-tight">${currentJarsInStock}</span>
                <span class="text-sm text-slate-500">กระป๋อง</span>
              </div>
              <div class="text-xs text-slate-500 mt-1.5 font-medium">
                มูลค่า ~${formatBaht(currentJarsInStock * pricePerJar)}
              </div>
            </div>
          </div>

          <!-- Card 4 -->
          <div class="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between text-white relative overflow-hidden">
            <div class="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
              <i class="fa-solid fa-scale-balanced text-9xl"></i>
            </div>
            <div class="flex items-center justify-between mb-4 relative z-10">
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">อัตราส่วนแปรรูป</span>
              <i class="fa-solid fa-scale-balanced text-slate-500"></i>
            </div>
            <div class="relative z-10">
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-light tracking-tight">10:1</span>
                <span class="text-sm text-slate-400">Yield 10%</span>
              </div>
              <div class="text-xs text-slate-400 mt-1.5 font-medium">
                สด 150 kg ➔ แห้ง 15 kg
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Sleek Tab Navigation -->
        <div class="border-b border-slate-200">
          <nav class="-mb-px flex space-x-6 sm:space-x-10 overflow-x-auto hide-scrollbar">
            <button data-tab="drying" class="fresh-tab-btn whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
              this.activeTab === 'drying'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }">
              1. อบแห้ง (สด ➔ แห้ง)
            </button>
            <button data-tab="canning" class="fresh-tab-btn whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
              this.activeTab === 'canning'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }">
              2. แปรรูปบรรจุกระป๋อง
            </button>
            <button data-tab="history" class="fresh-tab-btn whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
              this.activeTab === 'history'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }">
              3. ประวัติย้อนหลัง (${filteredBatches.length + filteredPackBatches.length} รอบ)
            </button>
          </nav>
        </div>

        <!-- 4. Tab Content Area -->
        <div class="pt-2">
          ${this.activeTab === 'drying' ? `
            <!-- ===== TAB 1: อบแห้ง ===== -->
            <div class="space-y-6">
              
              <!-- Clean Process Pipeline Card -->
              ${this.renderProcessFlowCard(selectedPool)}

              <!-- Data Table -->
              <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 class="text-base font-semibold text-slate-900">รายการแปลงเก็บเกี่ยว (สด)</h3>
                    <p class="text-sm text-slate-500 mt-0.5">รวม ${cropsForHerb.length} แปลง · ยอดสดรวม ${(selectedPool.pendingFreshKg + selectedPool.processedFreshKg).toFixed(1)} กก.</p>
                  </div>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead class="bg-white border-b border-slate-200 text-xs font-semibold text-slate-500 tracking-wider">
                      <tr>
                        <th class="px-6 py-4 whitespace-nowrap">วันที่เก็บเกี่ยว</th>
                        <th class="px-6 py-4 whitespace-nowrap">รหัสแปลง</th>
                        <th class="px-6 py-4 whitespace-nowrap">เกษตรกร</th>
                        <th class="px-6 py-4 whitespace-nowrap text-right">ปริมาณสด (กก.)</th>
                        <th class="px-6 py-4 whitespace-nowrap text-center">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                      ${cropsForHerb.length === 0 ? `
                        <tr>
                          <td colspan="5" class="px-6 py-12 text-center text-slate-400 font-medium">
                            ไม่มีข้อมูลผลผลิตสดในระบบ
                          </td>
                        </tr>
                      ` : cropsForHerb.map(c => {
                        const plot = plots.find(p => p.id === c.plotId);
                        const members = appState.getMembers();
                        const owner = plot ? members.find(m => (plot.memberIds && plot.memberIds.includes(m.id)) || plot.memberId === m.id) : null;
                        const yieldNum = parseFloat(c.yield) || 0;
                        return `
                          <tr class="hover:bg-slate-50/50 transition-colors">
                            <td class="px-6 py-4 whitespace-nowrap text-slate-600">
                              ${formatThaiDate(c.harvestDateActual || c.harvestDateEst)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="text-slate-900 font-semibold">${c.id}</div>
                              <div class="text-xs text-slate-400 font-normal mt-0.5">${plot ? plot.name : '-'}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              ${owner ? owner.name : '-'}
                            </td>
                            <td class="px-6 py-4 text-right whitespace-nowrap font-mono text-slate-900">
                              ${yieldNum.toFixed(1)}
                            </td>
                            <td class="px-6 py-4 text-center whitespace-nowrap">
                              ${c.isProcessed ? `
                                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  อบแล้ว
                                </span>
                              ` : `
                                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                                  <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                  รออบ
                                </span>
                              `}
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ` : this.activeTab === 'canning' ? `
            <!-- ===== TAB 2: แปรรูปบรรจุกระป๋อง ===== -->
            <div class="space-y-6">
              
              <!-- Clean Process Pipeline Card -->
              ${this.renderCanningProcessCard(selectedPool)}

              <!-- Specification Layout -->
              <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-base font-semibold text-slate-900">ข้อมูลมาตรฐานผลิตภัณฑ์</h3>
                  <span class="px-3 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                    1 กก. = 20 กระป๋อง
                  </span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  <div class="pt-4 md:pt-0 md:px-6 first:pt-0 first:pl-0 last:pr-0">
                    <div class="text-sm text-slate-500 mb-1">ขนาดบรรจุภัณฑ์</div>
                    <div class="text-lg font-semibold text-slate-900">50 กรัม / กระป๋อง</div>
                    <div class="text-xs text-slate-400 mt-2">กระป๋องมาตรฐานพร้อมฝาดึง</div>
                  </div>
                  <div class="pt-4 md:pt-0 md:px-6">
                    <div class="text-sm text-slate-500 mb-1">ราคาจำหน่าย</div>
                    <div class="text-lg font-semibold text-slate-900">${pricePerJar} บาท</div>
                    <div class="text-xs text-slate-400 mt-2">ราคากลางวิสาหกิจชุมชน</div>
                  </div>
                  <div class="pt-4 md:pt-0 md:px-6">
                    <div class="text-sm text-slate-500 mb-1">ศักยภาพผลิตปัจจุบัน</div>
                    <div class="text-lg font-semibold text-slate-900">~${potentialJars} กระป๋อง</div>
                    <div class="text-xs text-slate-400 mt-2">จากสต็อกดอกแห้งที่มี</div>
                  </div>
                </div>
              </div>
            </div>
          ` : `
            <!-- ===== TAB 3: ประวัติย้อนหลัง ===== -->
            <div class="space-y-6">
              
              <!-- Subtab Switcher -->
              <div class="flex items-center gap-2 mb-4">
                <button data-subtab="drying" class="fresh-hist-subtab-btn px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  this.historySubTab === 'drying' ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }">
                  รอบการอบแห้ง (${filteredBatches.length})
                </button>
                <button data-subtab="canning" class="fresh-hist-subtab-btn px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  this.historySubTab === 'canning' ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }">
                  ประวัติบรรจุกระป๋อง (${filteredPackBatches.length})
                </button>
              </div>

              ${this.historySubTab === 'drying' ? `
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                      <thead class="bg-white border-b border-slate-200 text-xs font-semibold text-slate-500 tracking-wider">
                        <tr>
                          <th class="px-6 py-4 whitespace-nowrap">วันที่อบ</th>
                          <th class="px-6 py-4 whitespace-nowrap text-right">สด (กก.)</th>
                          <th class="px-6 py-4 whitespace-nowrap text-right">แห้ง (กก.)</th>
                          <th class="px-6 py-4 whitespace-nowrap text-center">อัตราส่วน</th>
                          <th class="px-6 py-4 whitespace-nowrap">หมายเหตุ</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                        ${filteredBatches.length === 0 ? `
                          <tr>
                            <td colspan="5" class="px-6 py-12 text-center text-slate-400 font-medium">ไม่มีประวัติการอบแห้ง</td>
                          </tr>
                        ` : filteredBatches.map(b => {
                          const freshUsed = parseFloat(b.freshWeightKg) || 0;
                          const dryYield = parseFloat(b.dryWeightKg) || 0;
                          const ratioStr = b.ratioActual || (freshUsed / (dryYield || 1)).toFixed(2);
                          return `
                            <tr class="hover:bg-slate-50/50 transition-colors">
                              <td class="px-6 py-4 whitespace-nowrap text-slate-600">${formatThaiDate(b.processedDate)}</td>
                              <td class="px-6 py-4 text-right whitespace-nowrap font-mono">${freshUsed.toFixed(1)}</td>
                              <td class="px-6 py-4 text-right whitespace-nowrap font-mono text-slate-900 font-semibold">${dryYield.toFixed(1)}</td>
                              <td class="px-6 py-4 text-center whitespace-nowrap text-slate-500">${ratioStr} : 1</td>
                              <td class="px-6 py-4 text-slate-500">${b.note || '-'}</td>
                            </tr>
                          `;
                        }).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              ` : `
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                      <thead class="bg-white border-b border-slate-200 text-xs font-semibold text-slate-500 tracking-wider">
                        <tr>
                          <th class="px-6 py-4 whitespace-nowrap">วันที่บรรจุ</th>
                          <th class="px-6 py-4 whitespace-nowrap">รหัสล็อต</th>
                          <th class="px-6 py-4 whitespace-nowrap text-right">ดอกแห้งใช้ไป (กก.)</th>
                          <th class="px-6 py-4 whitespace-nowrap text-right">ได้กระป๋อง</th>
                          <th class="px-6 py-4 whitespace-nowrap">ผู้บันทึก</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                        ${filteredPackBatches.length === 0 ? `
                          <tr>
                            <td colspan="5" class="px-6 py-12 text-center text-slate-400 font-medium">ไม่มีประวัติการบรรจุ</td>
                          </tr>
                        ` : filteredPackBatches.map(b => {
                          return `
                            <tr class="hover:bg-slate-50/50 transition-colors">
                              <td class="px-6 py-4 whitespace-nowrap text-slate-600">${formatThaiDate(b.processedDate)}</td>
                              <td class="px-6 py-4 whitespace-nowrap font-mono">${b.id}</td>
                              <td class="px-6 py-4 text-right whitespace-nowrap font-mono">${(parseFloat(b.dryUsedKg) || 0).toFixed(1)}</td>
                              <td class="px-6 py-4 text-right whitespace-nowrap font-mono text-slate-900 font-semibold">${b.jarsProduced}</td>
                              <td class="px-6 py-4 text-slate-500">${b.operatorName || '-'}</td>
                            </tr>
                          `;
                        }).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              `}
            </div>
          `}
        </div>
      </div>
    `;
  },

  renderProcessFlowCard(pool) {
    const isReadyToDry = pool.pendingFreshKg > 0;
    return `
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
        
        <!-- Left: Fresh -->
        <div class="flex flex-col items-center flex-1 text-center">
          <div class="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 shadow-sm">
            <i class="fa-solid fa-leaf text-2xl text-slate-400"></i>
          </div>
          <div class="text-sm font-medium text-slate-500 mb-1">ผลผลิตสดรออบ</div>
          <div class="text-3xl font-light text-slate-900 tracking-tight font-mono">${pool.pendingFreshKg.toFixed(1)} <span class="text-base text-slate-500 font-normal">กก.</span></div>
        </div>

        <!-- Middle: Action -->
        <div class="flex flex-col items-center flex-1 w-full md:w-auto relative">
          <div class="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-slate-200 -z-10" style="width: 150%; left: -25%;"></div>
          
          <button data-herb="${pool.herb}" class="start-drying-pool-btn bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 ${!isReadyToDry ? 'opacity-50 cursor-not-allowed' : ''}" ${!isReadyToDry ? 'disabled' : ''}>
            นำเข้าเตาอบ
          </button>
          <div class="text-xs text-slate-400 font-medium mt-3 bg-white px-2">อัตราส่วน 10:1</div>
        </div>

        <!-- Right: Dry -->
        <div class="flex flex-col items-center flex-1 text-center">
          <div class="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 shadow-sm">
            <i class="fa-solid fa-box text-2xl text-slate-400"></i>
          </div>
          <div class="text-sm font-medium text-slate-500 mb-1">ดอกแห้งในคลัง</div>
          <div class="text-3xl font-light text-slate-900 tracking-tight font-mono">${pool.actualDryKg.toFixed(1)} <span class="text-base text-slate-500 font-normal">กก.</span></div>
        </div>

      </div>
    `;
  },

  renderCanningProcessCard(pool) {
    const isReadyToPack = pool.actualDryKg > 0;
    return `
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
        
        <!-- Left: Dry -->
        <div class="flex flex-col items-center flex-1 text-center">
          <div class="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 shadow-sm">
            <i class="fa-solid fa-box text-2xl text-slate-400"></i>
          </div>
          <div class="text-sm font-medium text-slate-500 mb-1">วัตถุดิบดอกแห้ง</div>
          <div class="text-3xl font-light text-slate-900 tracking-tight font-mono">${pool.actualDryKg.toFixed(1)} <span class="text-base text-slate-500 font-normal">กก.</span></div>
        </div>

        <!-- Middle: Action -->
        <div class="flex flex-col items-center flex-1 w-full md:w-auto relative">
          <div class="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-slate-200 -z-10" style="width: 150%; left: -25%;"></div>
          
          <button data-herb="${pool.herb}" class="start-canning-pool-btn bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 ${!isReadyToPack ? 'opacity-50 cursor-not-allowed' : ''}" ${!isReadyToPack ? 'disabled' : ''}>
            แปรรูปบรรจุกระป๋อง
          </button>
          <div class="text-xs text-slate-400 font-medium mt-3 bg-white px-2">1 กก. = 20 กระป๋อง</div>
        </div>

        <!-- Right: Jars -->
        <div class="flex flex-col items-center flex-1 text-center">
          <div class="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 shadow-sm">
            <i class="fa-solid fa-jar text-2xl text-slate-400"></i>
          </div>
          <div class="text-sm font-medium text-slate-500 mb-1">กระป๋อง 50G สำเร็จ</div>
          <div class="text-3xl font-light text-slate-900 tracking-tight font-mono">${Math.floor(pool.actualDryKg * 20)} <span class="text-base text-slate-500 font-normal">กป.</span></div>
        </div>

      </div>
    `;
  },


    init() {
    this.bindEvents();
  },

  bindEvents() {
    // 1. Plant Switcher Pills
    const herbPills = document.querySelectorAll('.fresh-herb-pill-btn');
    herbPills.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const herb = btn.getAttribute('data-herb');
        if (herb && herb !== this.selectedHerb) {
          this.selectedHerb = herb;
          this.refreshView();
        }
      });
    });

    // 2. Tab Navigation
    const tabBtns = document.querySelectorAll('.fresh-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = btn.getAttribute('data-tab');
        if (tab && tab !== this.activeTab) {
          this.activeTab = tab;
          this.refreshView();
        }
      });
    });

    // 3. History Sub-tab Switcher
    const histSubTabBtns = document.querySelectorAll('.fresh-hist-subtab-btn');
    histSubTabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const subtab = btn.getAttribute('data-subtab');
        if (subtab && subtab !== this.historySubTab) {
          this.historySubTab = subtab;
          this.refreshView();
        }
      });
    });

    // 4. Action buttons (Drying)
    const startDryingBtns = document.querySelectorAll('.start-drying-pool-btn');
    startDryingBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const herb = btn.getAttribute('data-herb');
        if (herb) this.openHerbDryingModal(herb);
      });
    });

    // 5. Action buttons (Canning - ดอกแห้ง ➔ แบบกระป๋อง)
    const startCanningBtns = document.querySelectorAll('.start-canning-pool-btn');
    startCanningBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const herb = btn.getAttribute('data-herb');
        if (herb) this.openCanningModal(herb);
      });
    });

    // 6. Edit herb price buttons
    const editPriceBtns = document.querySelectorAll('.edit-herb-price-btn');
    editPriceBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const prodId = btn.getAttribute('data-prodid');
        if (prodId) this.openQuickEditPriceModal(prodId);
      });
    });
  },

  openQuickEditPriceModal(productId) {
    const product = appState.getProductById(productId);
    if (!product) return;

    const modalHtml = `
      <form id="global-quick-price-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-5">
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
          <span class="text-[11px] text-gray-500 font-semibold block">1 กระป๋อง</span>
          <span class="text-sm font-black text-emerald-800 font-mono">${(price * 1).toLocaleString()} บ.</span>
        </div>
        <div class="p-2.5 bg-white rounded-xl border border-gray-200">
          <span class="text-[11px] text-gray-500 font-semibold block">5 กระป๋อง</span>
          <span class="text-sm font-black text-emerald-800 font-mono">${(price * 5).toLocaleString()} บ.</span>
        </div>
        <div class="p-2.5 bg-white rounded-xl border border-gray-200">
          <span class="text-[11px] text-gray-500 font-semibold block">20 กระป๋อง (~1 กก.)</span>
          <span class="text-sm font-black text-emerald-800 font-mono">${(price * 20).toLocaleString()} บ.</span>
        </div>
      `;
    }
  },

  refreshView() {
    const appView = document.getElementById('app-view');
    if (appView) {
      appView.innerHTML = this.render();
      this.init();
    }
  },

  // -------------------------------------------------------------
  // Modal: Send Pooled Fresh Flowers to Drying Kiln
  // (Large fonts, simple layout, instant live calculation)
  // -------------------------------------------------------------
  getHerbRatio(h = '') {
    if (h.includes('เก๊กฮวย')) return 10;
    if (h.includes('คาโมมายล์')) return 10;
    if (h.includes('ชา')) return 5;
    if (h.includes('ดาวเรือง')) return 10;
    if (h.includes('ฟ้าทะลายโจร')) return 6;
    return 10;
  },

  getProducePrefix(h = '') {
    if (h.includes('ชา')) return `ใบ${h}`;
    if (h.includes('ดอก') || h.includes('เก๊กฮวย') || h.includes('คาโมมายล์') || h.includes('ดาวเรือง')) return `ดอก${h}`;
    return `ผลผลิต${h}`;
  },

  // -------------------------------------------------------------
  // Modal: Send Pooled Fresh Produce to Drying Kiln
  // (Clear fields: Drying Date, Fresh Produce Used from Total kg, Dry Weight Obtained)
  // -------------------------------------------------------------
  openHerbDryingModal(herb) {
    const allCrops = appState.getCrops();
    const ratio = this.getHerbRatio(herb);
    const producePrefix = this.getProducePrefix(herb);

    // Get pending fresh crops for this herb
    const pendingCrops = allCrops.filter(c => {
      if (c.status !== 'harvested' || c.isProcessed) return false;
      const plot = appState.getPlotById(c.plotId);
      const cHerb = c.seedlingSource || (plot ? plot.plantType : '') || '';
      return cHerb.includes(herb);
    });

    const pendingFreshWeight = pendingCrops.reduce((sum, c) => sum + (parseFloat(c.yield) || 0), 0);
    if (pendingFreshWeight <= 0) {
      showToast(`ไม่มี${producePrefix}สดรอเข้าเตาอบในขณะนี้`, 'info');
      return;
    }

    const defaultDryWeight = (pendingFreshWeight / ratio).toFixed(2);
    const today = new Date().toISOString().split('T')[0];
    const pricePerKg = appState.getProductPrice(herb, 'กก.');
    const pricePerJar = appState.getProductPrice(herb, 'กระป๋อง');

    const contentHtml = `
      <form id="pool-drying-form" class="p-5 sm:p-6 space-y-4 bg-white text-gray-800 text-sm">
        
        <!-- แถวที่ 1: ข้อมูลทั่วไป (วันที่อบ + พืชอะไร + สูตร) -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 rounded-2xl border border-emerald-200">
          <!-- วันที่อบ -->
          <div class="flex items-center gap-2">
            <label for="dry-input-date" class="text-xs sm:text-sm font-bold text-gray-800 whitespace-nowrap">
              <i class="far fa-calendar-alt text-emerald-700 mr-1"></i> วันที่อบ:
            </label>
            <input type="text" id="dry-input-date" value="${today}" required
              class="w-36 px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-xs sm:text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs">
          </div>

          <!-- พืชอะไร & สูตรอบแห้ง -->
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-3 py-1 rounded-xl text-xs font-bold text-emerald-950 bg-white border border-emerald-300 shadow-2xs">
              🌿 ${producePrefix}
            </span>
            <span class="px-2.5 py-1 rounded-xl text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 shadow-2xs">
              สูตรอบแห้ง ${ratio} : 1
            </span>
          </div>
        </div>

        <!-- แถบอธิบายสูตรมาตรฐานตามเกณฑ์อาจารย์ 10:1 -->
        <div class="p-3 bg-amber-50/90 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2">
          <i class="fas fa-lightbulb text-amber-600 text-sm mt-0.5 shrink-0"></i>
          <div>
            <b class="font-bold">สูตรแปลงน้ำหนัก สด ➔ แห้ง มาตรฐานวิสาหกิจ (อัตราส่วน 10:1):</b>
            <span class="block text-gray-700 mt-0.5">
              รับสมุนไพรสด <b>150 kg</b> เมื่อนำไปอบ/ตากแห้ง จะได้สมุนไพรแห้ง <b>15 kg</b> (Yield 10% ตามที่อาจารย์ระบุ)
            </span>
          </div>
        </div>

        <!-- แถวที่ 2: ตัวเลขการอบ (3 ช่องในแถวเดียว) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          
          <!-- ช่องที่ 1: ผลผลิตสดที่มีทั้งหมด (จากกี่ กก.) -->
          <div class="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 flex flex-col justify-between">
            <div>
              <span class="text-xs font-bold text-amber-900 uppercase block">1. ผลผลิตสดที่มีทั้งหมด</span>
              <span class="text-[11px] text-amber-700">จากแปลงสมาชิกทุกแปลง</span>
            </div>
            <div class="mt-2 text-xl sm:text-2xl font-black text-amber-950 font-mono">
              ${pendingFreshWeight.toFixed(2)} <span class="text-xs font-semibold text-amber-800">กก.</span>
            </div>
          </div>

          <!-- ช่องที่ 2: ใช้ผลผลิตสดเท่าไหร่ (กก.) -->
          <div class="p-3.5 bg-white rounded-2xl border-2 border-emerald-400 shadow-2xs flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <label for="dry-input-fresh-weight" class="text-xs font-bold text-gray-800 uppercase">
                2. ใช้ผลผลิตสดเท่าไหร่ *
              </label>
              <button type="button" id="use-all-fresh-btn" class="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2 py-0.5 rounded-lg cursor-pointer transition-colors">
                ใช้อบทั้งหมด
              </button>
            </div>
            <div class="flex items-center gap-1.5 flex-wrap my-1.5">
              <span class="text-[10px] text-gray-500 font-bold">สูตรด่วน:</span>
              <button type="button" class="preset-fresh-btn px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold transition cursor-pointer" data-kg="150">
                สด 150 กก. (ได้ 15 กก.)
              </button>
              <button type="button" class="preset-fresh-btn px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold transition cursor-pointer" data-kg="300">
                สด 300 กก. (ได้ 30 กก.)
              </button>
            </div>
            <div class="mt-1 relative">
              <input type="number" step="0.1" min="0.1" max="${pendingFreshWeight}" id="dry-input-fresh-weight" value="${pendingFreshWeight.toFixed(2)}" required
                class="w-full pl-3 pr-10 py-1.5 rounded-xl border border-gray-300 text-lg font-black text-amber-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono">
              <span class="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-gray-500 pointer-events-none">
                กก.
              </span>
            </div>
            <span class="text-[10px] text-gray-500 mt-1 block">
              จากทั้งหมด ${pendingFreshWeight.toFixed(2)} กก.
            </span>
          </div>

          <!-- ช่องที่ 3: ได้กี่กิโลกรัมหลังอบเสร็จ -->
          <div class="p-3.5 bg-white rounded-2xl border-2 border-emerald-600 shadow-2xs flex flex-col justify-between">
            <label for="dry-input-dry-weight" class="text-xs font-bold text-gray-800 uppercase">
              3. ได้หลังอบเสร็จกี่ กก. *
            </label>
            <div class="mt-2 relative">
              <input type="number" step="0.05" min="0.01" id="dry-input-dry-weight" value="${defaultDryWeight}" required
                class="w-full pl-3 pr-10 py-1.5 rounded-xl border border-gray-300 text-lg font-black text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono">
              <span class="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-emerald-700 pointer-events-none">
                กก.
              </span>
            </div>
            <span class="text-[10px] text-emerald-700 font-medium mt-1 block">
              น้ำหนักผลผลิตแห้งจริงหลังอบเสร็จ
            </span>
          </div>

        </div>

        <!-- แถวที่ 2.5: กระป๋อง Live Summary สรุปผลการอบและมูลค่าเศรษฐกิจ -->
        <div id="dry-live-summary-box" class="p-3.5 bg-gradient-to-r from-emerald-100/70 via-teal-50 to-amber-50 rounded-2xl border border-emerald-300 shadow-2xs space-y-1">
          <div class="flex items-center justify-between text-xs font-bold text-emerald-950">
            <span class="flex items-center gap-1.5">
              <i class="fas fa-clipboard-check text-emerald-700 text-sm"></i>
              <span>สรุปข้อมูลการอบแห้งและประมาณการมูลค่า:</span>
            </span>
            <span id="dry-live-ratio-badge" class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white text-emerald-900 border border-emerald-200">
              อัตราส่วนจริง: ${ratio.toFixed(2)} : 1
            </span>
          </div>
          <div id="dry-live-summary-text" class="text-xs sm:text-sm font-medium text-gray-800 leading-relaxed pt-0.5">
            <div>
              วันที่ <b>${formatThaiDate(today)}</b>: ใช้<b>${producePrefix}สด</b> <b class="text-amber-950 font-black font-mono">${pendingFreshWeight.toFixed(2)}</b> กก. (จากทั้งหมด <b>${pendingFreshWeight.toFixed(2)}</b> กก.) ➔ ได้หลังอบเสร็จ <b class="text-emerald-900 font-black font-mono text-base">${defaultDryWeight}</b> กก.
            </div>
            <div class="mt-2 pt-2 border-t border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-emerald-950">
              <span class="flex items-center gap-1 font-bold">
                <i class="fas fa-coins text-amber-600"></i>
                <span>ประเมินมูลค่าผลผลิตหลังอบแห้ง:</span>
              </span>
              <div class="flex items-baseline gap-2 font-mono flex-wrap">
                <span class="text-gray-700">ขายแบบแห้ง (${pricePerKg} บ./กก.):</span>
                <b class="text-emerald-800 text-sm font-black">${formatBaht(parseFloat(defaultDryWeight) * pricePerKg)}</b>
                <span class="text-gray-400">|</span>
                <span class="text-gray-700">บรรจุกระป๋อง 50 G (~${Math.floor(parseFloat(defaultDryWeight) * 20)} กป.):</span>
                <b class="text-amber-800 text-sm font-black">${formatBaht(Math.floor(parseFloat(defaultDryWeight) * 20) * pricePerJar)}</b>
              </div>
            </div>
          </div>
        </div>

        <!-- แถวที่ 3: เตาอบ / หมายเหตุ -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
          <label for="dry-input-note" class="text-xs sm:text-sm font-bold text-gray-700 sm:w-28 shrink-0">
            เตาอบ / หมายเหตุ
          </label>
          <input type="text" id="dry-input-note" placeholder="ระบุเตาอบ (เช่น ตู้อบ 1 พลังงานแสงอาทิตย์) หรือรอบการอบ"
            class="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-2xs">
        </div>

        <!-- ปุ่มดำเนินการด้านล่างสุด (Modal Footer) -->
        <div class="pt-3 flex items-center justify-end gap-3 border-t border-gray-200">
          <button type="button" id="cancel-pool-dry-btn" class="px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
            ยกเลิก
          </button>
          <button type="submit" id="submit-pool-dry-btn" class="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs sm:text-sm font-black shadow-sm transition-all cursor-pointer flex items-center gap-1.5">
            <i class="fas fa-fire-alt"></i>
            <span>ยืนยันบันทึกการอบแห้งเข้าคลัง</span>
          </button>
        </div>

      </form>
    `;

    openGlobalModal({
      title: `♨️ บันทึกนำเข้าเตาอบแห้ง (${producePrefix})`,
      icon: '',
      size: 'max-w-2xl',
      headerColor: 'bg-[#1e4620]',
      content: contentHtml,
      onRender: (dialog) => {
        // Initialize Flatpickr for Thai Date
        const dateInput = dialog.querySelector('#dry-input-date');
        let selectedDateStr = today;
        if (dateInput && window.flatpickr) {
          window.flatpickr(dateInput, {
            dateFormat: 'Y-m-d',
            locale: 'th',
            defaultDate: today,
            altInput: true,
            altFormat: 'd/m/Y',
            onChange: (selectedDates, dateStr) => {
              selectedDateStr = dateStr;
              updateSummaryText();
            }
          });
        }

        // Elements
        const freshInput = dialog.querySelector('#dry-input-fresh-weight');
        const dryInput = dialog.querySelector('#dry-input-dry-weight');
        const useAllBtn = dialog.querySelector('#use-all-fresh-btn');
        const noteInput = dialog.querySelector('#dry-input-note');
        const summaryText = dialog.querySelector('#dry-live-summary-text');
        const ratioBadge = dialog.querySelector('#dry-live-ratio-badge');

        const updateSummaryText = () => {
          if (!summaryText) return;
          const freshVal = parseFloat(freshInput ? freshInput.value : 0) || 0;
          const dryVal = parseFloat(dryInput ? dryInput.value : 0) || 0;
          const actualRatio = dryVal > 0 ? (freshVal / dryVal).toFixed(2) : ratio.toFixed(2);
          const estDryVal = dryVal * pricePerKg;
          const estJars = Math.floor(dryVal * 20);
          const estJarsVal = estJars * pricePerJar;
          
          summaryText.innerHTML = `
            <div>
              วันที่ <b>${formatThaiDate(selectedDateStr)}</b>: ใช้<b>${producePrefix}สด</b> <b class="text-amber-950 font-black font-mono">${freshVal.toFixed(2)}</b> กก. (จากทั้งหมด <b>${pendingFreshWeight.toFixed(2)}</b> กก.) ➔ ได้หลังอบเสร็จ <b class="text-emerald-900 font-black font-mono text-base">${dryVal.toFixed(2)}</b> กก.
            </div>
            <div class="mt-2 pt-2 border-t border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-emerald-950">
              <span class="flex items-center gap-1 font-bold">
                <i class="fas fa-coins text-amber-600"></i>
                <span>ประเมินมูลค่าผลผลิตหลังอบแห้ง:</span>
              </span>
              <div class="flex items-baseline gap-2 font-mono flex-wrap">
                <span class="text-gray-700">ขายแบบแห้ง (${pricePerKg} บ./กก.):</span>
                <b class="text-emerald-800 text-sm font-black">${formatBaht(estDryVal)}</b>
                <span class="text-gray-400">|</span>
                <span class="text-gray-700">บรรจุกระป๋อง 50 G (~${estJars} กป.):</span>
                <b class="text-amber-800 text-sm font-black">${formatBaht(estJarsVal)}</b>
              </div>
            </div>
          `;
          if (ratioBadge) {
            ratioBadge.textContent = `อัตราส่วนจริง: ${actualRatio} : 1`;
          }
        };

        // Dynamic Live Ratio Calculation
        const updateDryCalc = () => {
          if (!freshInput || !dryInput) return;
          const val = parseFloat(freshInput.value) || 0;
          const calculated = (val / ratio).toFixed(2);
          dryInput.value = calculated;
          updateSummaryText();
        };

        if (freshInput) {
          freshInput.addEventListener('input', updateDryCalc);
        }

        if (dryInput) {
          dryInput.addEventListener('input', updateSummaryText);
        }

        if (useAllBtn && freshInput) {
          useAllBtn.addEventListener('click', () => {
            freshInput.value = pendingFreshWeight.toFixed(2);
            updateDryCalc();
          });
        }

        dialog.querySelectorAll('.preset-fresh-btn').forEach(pBtn => {
          pBtn.addEventListener('click', () => {
            const kg = parseFloat(pBtn.getAttribute('data-kg')) || 0;
            if (freshInput) {
              freshInput.value = kg;
              updateDryCalc();
            }
          });
        });

        // Cancel Button
        const cancelBtn = dialog.querySelector('#cancel-pool-dry-btn');
        if (cancelBtn) {
          cancelBtn.addEventListener('click', closeGlobalModal);
        }

        // Form Submission
        const form = dialog.querySelector('#pool-drying-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const freshWeight = parseFloat(freshInput ? freshInput.value : 0) || 0;
            const dryWeight = parseFloat(dryInput ? dryInput.value : 0) || 0;
            const date = selectedDateStr || (dateInput ? dateInput.value : '') || today;
            const note = (noteInput ? noteInput.value.trim() : '');

            if (freshWeight <= 0) {
              showToast('กรุณาระบุน้ำหนักผลผลิตสดที่ต้องการอบ', 'error');
              return;
            }
            if (freshWeight > pendingFreshWeight + 0.05) {
              showToast(`น้ำหนักสดที่ระบุ (${freshWeight.toFixed(2)} กก.) เกินกว่ายอดผลผลิตสดรออบ (${pendingFreshWeight.toFixed(2)} กก.)`, 'warning');
              return;
            }
            if (dryWeight <= 0) {
              showToast('กรุณาระบุน้ำหนักแห้งจริงที่ได้หลังอบเสร็จ', 'error');
              return;
            }

            try {
              appState.processPooledHerbDrying(herb, freshWeight, dryWeight, note, date);
              closeGlobalModal();
              showToast(`บันทึกการอบแห้ง${producePrefix}สดสำเร็จ (ใช้วันที่ ${formatThaiDate(date)} สด ${freshWeight.toFixed(2)} กก. ➔ ได้แห้ง ${dryWeight.toFixed(2)} กก. เข้าคลังสินค้าเรียบร้อย)`, 'success');
              this.refreshView();
            } catch (err) {
              console.error(err);
              showToast(err.message || 'เกิดข้อผิดพลาดในการบันทึกการอบแห้ง', 'error');
            }
          });
        }
      }
    });
  },

  // -------------------------------------------------------------
  // Modal: Process Dry Herbs into Canned / Jar Packaging Products
  // (ดอกแห้ง ➔ แบบกระป๋อง: กรอก กก. ดอกแห้ง -> คำนวณจำนวนกระป๋องและมูลค่าทันที)
  // -------------------------------------------------------------
  openCanningModal(herb) {
    const dryingBatches = appState.getDryingBatches ? appState.getDryingBatches() : [];
    const isChrys = herb === 'เก๊กฮวย' || herb.includes('เก๊กฮวย');
    const isCham = herb === 'คาโมมายล์' || herb.includes('คาโมมายล์');

    const herbBatches = dryingBatches.filter(b => {
      if (b.herbType === herb) return true;
      if (isChrys && b.herbType && b.herbType.includes('เก๊กฮวย')) return true;
      if (isCham && b.herbType && b.herbType.includes('คาโมมายล์')) return true;
      return false;
    });
    const totalDryAvailable = herbBatches.reduce((sum, b) => sum + (parseFloat(b.dryWeightKg) || 0), 0);

    if (totalDryAvailable <= 0) {
      showToast(`ไม่มีดอก${herb}แห้งในคลังสำหรับบรรจุกระป๋อง กรุณาทำการอบแห้งก่อน`, 'warning');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const pricePerKg = isChrys ? 250 : (isCham ? 450 : 300);
    const jarPrice50g = appState.getProductPrice(herb, 'กระป๋อง');
    const defaultUsedKg = Math.min(totalDryAvailable, 5.0).toFixed(2);
    const initialJars = Math.floor(parseFloat(defaultUsedKg) * 20);
    const members = appState.getMembers ? appState.getMembers() : [];

    const contentHtml = `
      <form id="pool-canning-form" class="p-5 sm:p-6 space-y-4 bg-white text-gray-800 text-sm">
        
        <!-- แถวที่ 1: ข้อมูลทั่วไป (วันที่บรรจุ + ชนิดพืช + ขนาดบรรจุภัณฑ์) -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 rounded-2xl border border-emerald-200">
          <div class="flex items-center gap-2">
            <label for="canning-input-date" class="text-xs sm:text-sm font-bold text-gray-800 whitespace-nowrap">
              <i class="far fa-calendar-alt text-emerald-700 mr-1"></i> วันที่บรรจุ:
            </label>
            <input type="text" id="canning-input-date" value="${today}" required
              class="w-36 px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-xs sm:text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs">
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-3 py-1 rounded-xl text-xs font-bold text-emerald-950 bg-white border border-emerald-300 shadow-2xs">
              🌼 ดอก${herb}แห้ง ➔ กระป๋อง
            </span>
            <span class="px-2.5 py-1 rounded-xl text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 shadow-2xs">
              สูตร: 50 G (1 กก. = 20 กระป๋อง)
            </span>
          </div>
        </div>

        <!-- แถวที่ 2: ช่องระบุข้อมูลตัวเลข (3 ช่อง) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          
          <!-- ช่องที่ 1: ดอกแห้งที่มีในคลัง -->
          <div class="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 flex flex-col justify-between">
            <div>
              <span class="text-xs font-bold text-amber-900 uppercase block">1. ดอกแห้งที่มีทั้งหมด</span>
              <span class="text-[11px] text-amber-700">จากคลังสินค้าอบแห้ง</span>
            </div>
            <div class="mt-2 text-xl sm:text-2xl font-black text-amber-950 font-mono">
              ${totalDryAvailable.toFixed(2)} <span class="text-xs font-semibold text-amber-800">กก.</span>
            </div>
          </div>

          <!-- ช่องที่ 2: ดอกแห้งที่นำมาบรรจุ (กก.) -->
          <div class="p-3.5 bg-white rounded-2xl border-2 border-emerald-500 shadow-2xs flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <label for="canning-input-used-dry" class="text-xs font-bold text-gray-800 uppercase">
                2. ใช้ดอกแห้งกี่ กก. *
              </label>
              <div class="flex items-center gap-1">
                <button type="button" id="use-1kg-btn" class="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded-lg cursor-pointer transition-colors" title="ใช้ 1 กก. (20 กระป๋อง)">
                  1 กก.
                </button>
                <button type="button" id="use-5kg-btn" class="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded-lg cursor-pointer transition-colors" title="ใช้ 5 กก. (100 กระป๋อง)">
                  5 กก.
                </button>
                <button type="button" id="use-all-dry-btn" class="text-[11px] font-bold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 border border-teal-300 px-1.5 py-0.5 rounded-lg cursor-pointer transition-colors">
                  ทั้งหมด
                </button>
              </div>
            </div>
            <div class="mt-2 relative">
              <input type="number" step="0.1" min="0.05" max="${totalDryAvailable}" id="canning-input-used-dry" value="${defaultUsedKg}" required
                class="w-full pl-3 pr-10 py-1.5 rounded-xl border border-gray-300 text-lg font-black text-amber-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono">
              <span class="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-gray-500 pointer-events-none">
                กก.
              </span>
            </div>
            <span class="text-[10px] text-gray-500 mt-1 block">
              จากคลังทั้งหมด ${totalDryAvailable.toFixed(2)} กก.
            </span>
          </div>

          <!-- ช่องที่ 3: ขนาดบรรจุภัณฑ์ & จำนวนกระป๋องที่ได้ -->
          <div class="p-3.5 bg-white rounded-2xl border-2 border-teal-600 shadow-2xs flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <label for="canning-select-size" class="text-xs font-bold text-gray-800 uppercase">
                3. ขนาด / ได้กี่กระป๋อง *
              </label>
              <select id="canning-select-size" class="text-xs font-bold bg-teal-50 border border-teal-300 text-teal-950 rounded-lg px-2 py-0.5 focus:outline-none">
                <option value="50" selected>50 G (50 กรัม) - มาตรฐาน (${jarPrice50g} บ./กป.)</option>
                <option value="100">100 G (100 กรัม)</option>
              </select>
            </div>
            <div class="mt-2 relative">
              <input type="number" step="1" min="1" id="canning-input-jars-count" value="${initialJars}" required
                class="w-full pl-3 pr-16 py-1.5 rounded-xl border border-gray-300 text-lg font-black text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono">
              <span class="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-teal-700 pointer-events-none">
                กระป๋อง
              </span>
            </div>
            <span class="text-[10px] text-teal-700 font-medium mt-1 block">
              คำนวณอัตโนมัติ (1 กก. = 20 กระป๋อง)
            </span>
          </div>

        </div>

        <!-- แถวที่ 2.5: กระป๋อง Live Summary สรุปผลการบรรจุกระป๋องและมูลค่าเศรษฐกิจ -->
        <div id="canning-live-summary-box" class="p-3.5 bg-gradient-to-r from-teal-50 via-emerald-50 to-amber-50 rounded-2xl border border-teal-300 shadow-2xs space-y-1">
          <div class="flex items-center justify-between text-xs font-bold text-teal-950">
            <span class="flex items-center gap-1.5">
              <i class="fa-solid fa-jar text-teal-700 text-sm"></i>
              <span>สรุปข้อมูลการบรรจุกระป๋องและมูลค่าสินค้าสำเร็จรูป:</span>
            </span>
            <span id="canning-live-unit-price-badge" class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white text-teal-900 border border-teal-200">
              ราคาขาย: ${formatBaht(jarPrice50g)}/กระป๋อง (50 G)
            </span>
          </div>
          <div id="canning-live-summary-text" class="text-xs sm:text-sm font-medium text-gray-800 leading-relaxed pt-0.5">
            <div>
              วันที่ <b>${formatThaiDate(today)}</b>: ใช้<b>ดอก${herb}แห้ง</b> <b class="text-amber-950 font-black font-mono">${defaultUsedKg}</b> กก. ➔ บรรจุได้ <b class="text-teal-900 font-black font-mono text-base">${initialJars}</b> กระป๋อง (ขนาด 50 G)
            </div>
            <div class="mt-2 pt-2 border-t border-teal-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-teal-950">
              <span class="flex items-center gap-1 font-bold">
                <i class="fas fa-coins text-amber-600"></i>
                <span>ประเมินมูลค่าสินค้าบรรจุกระป๋องที่ได้:</span>
              </span>
              <div class="flex items-baseline gap-2 font-mono flex-wrap">
                <span class="text-gray-700">มูลค่าเพิ่มเข้าคลัง:</span>
                <b id="canning-live-total-value" class="text-teal-800 text-base font-black">${formatBaht(initialJars * jarPrice50g)}</b>
                <span class="text-gray-500 font-sans">(@${formatBaht(jarPrice50g)}/กป.)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- แถวที่ 3: ผู้รับผิดชอบ & หมายเหตุ / เลขล็อต -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
          <div>
            <label for="canning-input-operator" class="text-xs font-bold text-gray-700 block mb-1">
              ผู้รับผิดชอบการบรรจุ
            </label>
            <select id="canning-input-operator" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-2xs">
              ${members.map(m => `
                <option value="${m.name}" ${m.role === 'ประธานกลุ่ม' || m.role.includes('ประธาน') ? 'selected' : ''}>
                  ${m.name} (${m.role})
                </option>
              `).join('')}
              <option value="สมาชิกกลุ่มแปรรูป">สมาชิกกลุ่มแปรรูป</option>
            </select>
          </div>

          <div>
            <label for="canning-input-note" class="text-xs font-bold text-gray-700 block mb-1">
              หมายเหตุ / รายละเอียดล็อตบรรจุ
            </label>
            <input type="text" id="canning-input-note" placeholder="เช่น บรรจุกระป๋องซีลฝาดึง ติดสติกเกอร์ฉลาก อย." value="บรรจุกระป๋องมาตรฐาน 50 G ซีลฝาพร้อมจำหน่าย"
              class="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-2xs">
          </div>
        </div>

        <!-- ปุ่มดำเนินการด้านล่างสุด (Modal Footer) -->
        <div class="pt-3 flex items-center justify-end gap-3 border-t border-gray-200">
          <button type="button" id="cancel-pool-canning-btn" class="px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
            ยกเลิก
          </button>
          <button type="submit" id="submit-pool-canning-btn" class="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs sm:text-sm font-black shadow-sm transition-all cursor-pointer flex items-center gap-1.5">
            <i class="fa-solid fa-jar"></i>
            <span>ยืนยันบันทึกการบรรจุกระป๋องเข้าคลัง</span>
          </button>
        </div>

      </form>
    `;

    openGlobalModal({
      title: `🥫 บันทึกกระบวนการบรรจุกระป๋อง (ดอก${herb})`,
      icon: '',
      size: 'max-w-2xl',
      headerColor: 'bg-[#1b4332]',
      content: contentHtml,
      onRender: (dialog) => {
        const dateInput = dialog.querySelector('#canning-input-date');
        let selectedDateStr = today;
        if (dateInput && window.flatpickr) {
          window.flatpickr(dateInput, {
            dateFormat: 'Y-m-d',
            locale: 'th',
            defaultDate: today,
            altInput: true,
            altFormat: 'd/m/Y',
            onChange: (selectedDates, dateStr) => {
              selectedDateStr = dateStr;
              updateSummaryText();
            }
          });
        }

        const dryInput = dialog.querySelector('#canning-input-used-dry');
        const sizeSelect = dialog.querySelector('#canning-select-size');
        const jarsInput = dialog.querySelector('#canning-input-jars-count');
        const use1kgBtn = dialog.querySelector('#use-1kg-btn');
        const use5kgBtn = dialog.querySelector('#use-5kg-btn');
        const useAllBtn = dialog.querySelector('#use-all-dry-btn');
        const operatorSelect = dialog.querySelector('#canning-input-operator');
        const noteInput = dialog.querySelector('#canning-input-note');
        const summaryText = dialog.querySelector('#canning-live-summary-text');
        const unitPriceBadge = dialog.querySelector('#canning-live-unit-price-badge');
        const totalValueEl = dialog.querySelector('#canning-live-total-value');

        const getActiveJarPrice = () => {
          const sz = parseFloat(sizeSelect ? sizeSelect.value : 50) || 50;
          if (sz >= 100) {
            return isChrys ? 280 : 190;
          }
          return jarPrice50g;
        };

        const updateSummaryText = () => {
          if (!summaryText) return;
          const dryVal = parseFloat(dryInput ? dryInput.value : 0) || 0;
          const sz = parseFloat(sizeSelect ? sizeSelect.value : 50) || 50;
          const jarsVal = parseInt(jarsInput ? jarsInput.value : 0) || 0;
          const curPrice = getActiveJarPrice();
          const estVal = jarsVal * curPrice;

          summaryText.innerHTML = `
            <div>
              วันที่ <b>${formatThaiDate(selectedDateStr)}</b>: ใช้<b>ดอก${herb}แห้ง</b> <b class="text-amber-950 font-black font-mono">${dryVal.toFixed(2)}</b> กก. ➔ บรรจุได้ <b class="text-teal-900 font-black font-mono text-base">${jarsVal}</b> กระป๋อง (ขนาด ${sz} G)
            </div>
            <div class="mt-2 pt-2 border-t border-teal-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-teal-950">
              <span class="flex items-center gap-1 font-bold">
                <i class="fas fa-coins text-amber-600"></i>
                <span>ประเมินมูลค่าสินค้าบรรจุกระป๋องที่ได้:</span>
              </span>
              <div class="flex items-baseline gap-2 font-mono flex-wrap">
                <span class="text-gray-700">มูลค่าเพิ่มเข้าคลัง:</span>
                <b class="text-teal-800 text-base font-black">${formatBaht(estVal)}</b>
                <span class="text-gray-500 font-sans">(@${formatBaht(curPrice)}/กป.)</span>
              </div>
            </div>
          `;
          if (unitPriceBadge) {
            unitPriceBadge.textContent = `ราคาขาย: ${formatBaht(curPrice)}/กระป๋อง (${sz} G)`;
          }
        };

        const recalculateJars = () => {
          if (!dryInput || !sizeSelect || !jarsInput) return;
          const dryVal = parseFloat(dryInput.value) || 0;
          const sz = parseFloat(sizeSelect.value) || 50;
          const calcJars = Math.floor((dryVal * 1000) / sz);
          jarsInput.value = calcJars;
          updateSummaryText();
        };

        if (dryInput) {
          dryInput.addEventListener('input', recalculateJars);
        }

        if (sizeSelect) {
          sizeSelect.addEventListener('change', recalculateJars);
        }

        if (jarsInput) {
          jarsInput.addEventListener('input', updateSummaryText);
        }

        if (use1kgBtn && dryInput) {
          use1kgBtn.addEventListener('click', () => {
            dryInput.value = (1.0).toFixed(2);
            recalculateJars();
          });
        }

        if (use5kgBtn && dryInput) {
          use5kgBtn.addEventListener('click', () => {
            dryInput.value = Math.min(totalDryAvailable, 5.0).toFixed(2);
            recalculateJars();
          });
        }

        if (useAllBtn && dryInput) {
          useAllBtn.addEventListener('click', () => {
            dryInput.value = totalDryAvailable.toFixed(2);
            recalculateJars();
          });
        }

        const cancelBtn = dialog.querySelector('#cancel-pool-canning-btn');
        if (cancelBtn) {
          cancelBtn.addEventListener('click', closeGlobalModal);
        }

        const form = dialog.querySelector('#pool-canning-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const dryWeight = parseFloat(dryInput ? dryInput.value : 0) || 0;
            const sz = parseFloat(sizeSelect ? sizeSelect.value : 50) || 50;
            const jarsCount = parseInt(jarsInput ? jarsInput.value : 0) || 0;
            const date = selectedDateStr || today;
            const operator = operatorSelect ? operatorSelect.value : '';
            const note = noteInput ? noteInput.value.trim() : '';

            if (dryWeight <= 0) {
              showToast('กรุณาระบุน้ำหนักดอกแห้งที่ใช้บรรจุ', 'error');
              return;
            }
            if (dryWeight > totalDryAvailable + 0.05) {
              showToast(`น้ำหนักดอกแห้งที่ระบุ (${dryWeight.toFixed(2)} กก.) เกินกว่ายอดในคลัง (${totalDryAvailable.toFixed(2)} กก.)`, 'warning');
              return;
            }
            if (jarsCount <= 0) {
              showToast('จำนวนกระป๋องต้องมากกว่า 0', 'error');
              return;
            }

            try {
              const res = appState.processHerbCanning(herb, dryWeight, `${sz} G`, jarsCount, operator, note, date);
              closeGlobalModal();
              showToast(`บันทึกการบรรจุกระป๋องสำเร็จ! ได้ ${res.productName} จำนวน ${res.jarsProduced} กระป๋อง เข้าคลังสินค้าเรียบร้อย`, 'success');
              this.refreshView();
            } catch (err) {
              console.error(err);
              showToast(err.message || 'เกิดข้อผิดพลาดในการบันทึกการบรรจุกระป๋อง', 'error');
            }
          });
        }
      }
    });
  }
};
