// new_methods.js
// Modern SaaS UI
export const renderFunctions = `
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
    const pricePerJar = appState.getProductPrice(selectedPool.herb, 'กระปุก');
    const products = appState.getProducts();
    const cannedProduct = products.find(p => (p.unit === 'กระปุก' || p.unit === 'กระป๋อง') && (p.category.includes(selectedPool.herb) || p.name.includes(selectedPool.herb))) || {
      id: selectedPool.isChrys ? 'PRD-003' : 'PRD-004',
      name: selectedPool.isChrys ? 'เก๊กฮวยกระป๋อง (50 G)' : 'คาโมมายล์กระป๋อง (50 G)',
      stock: selectedPool.isChrys ? 100 : 50,
      price: pricePerJar
    };
    const currentJarsInStock = cannedProduct.stock || 0;
    const availableDryKg = selectedPool.actualDryKg;
    const potentialJars = Math.floor(availableDryKg * 20);
    const potentialJarsValue = potentialJars * pricePerJar;

    return \`
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
            \${herbTypes.map(h => \`
              <button data-herb="\${h}" class="fresh-herb-pill-btn px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer \${
                h === currentSelectedHerb 
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }">
                \${h}
              </button>
            \`).join('')}
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
                <span class="text-3xl font-light text-slate-900 tracking-tight">\${selectedPool.pendingFreshKg.toFixed(1)}</span>
                <span class="text-sm text-slate-500">กก.</span>
              </div>
              <div class="text-xs text-slate-500 mt-1.5 font-medium">
                \${cropsForHerb.filter(c => !c.isProcessed).length} แปลงเพาะปลูก
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
                <span class="text-3xl font-light text-slate-900 tracking-tight">\${selectedPool.actualDryKg.toFixed(1)}</span>
                <span class="text-sm text-slate-500">กก.</span>
              </div>
              <div class="text-xs text-slate-500 mt-1.5 font-medium">
                มูลค่า ~\${formatBaht(selectedPool.actualDryKg * pricePerKg)}
              </div>
            </div>
          </div>

          <!-- Card 3 -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-slate-300 transition-colors">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">สินค้ากระปุก 50G</span>
              <i class="fa-solid fa-jar text-slate-300 group-hover:text-slate-500 transition-colors"></i>
            </div>
            <div>
              <div class="flex items-baseline gap-1.5">
                <span class="text-3xl font-light text-slate-900 tracking-tight">\${currentJarsInStock}</span>
                <span class="text-sm text-slate-500">กระปุก</span>
              </div>
              <div class="text-xs text-slate-500 mt-1.5 font-medium">
                มูลค่า ~\${formatBaht(currentJarsInStock * pricePerJar)}
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
            <button data-tab="drying" class="fresh-tab-btn whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors \${
              this.activeTab === 'drying'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }">
              1. อบแห้ง (สด ➔ แห้ง)
            </button>
            <button data-tab="canning" class="fresh-tab-btn whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors \${
              this.activeTab === 'canning'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }">
              2. แปรรูปบรรจุกระปุก
            </button>
            <button data-tab="history" class="fresh-tab-btn whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors \${
              this.activeTab === 'history'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }">
              3. ประวัติย้อนหลัง (\${filteredBatches.length + filteredPackBatches.length} รอบ)
            </button>
          </nav>
        </div>

        <!-- 4. Tab Content Area -->
        <div class="pt-2">
          \${this.activeTab === 'drying' ? \`
            <!-- ===== TAB 1: อบแห้ง ===== -->
            <div class="space-y-6">
              
              <!-- Clean Process Pipeline Card -->
              \${this.renderProcessFlowCard(selectedPool)}

              <!-- Data Table -->
              <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 class="text-base font-semibold text-slate-900">รายการแปลงเก็บเกี่ยว (สด)</h3>
                    <p class="text-sm text-slate-500 mt-0.5">รวม \${cropsForHerb.length} แปลง · ยอดสดรวม \${(selectedPool.pendingFreshKg + selectedPool.processedFreshKg).toFixed(1)} กก.</p>
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
                      \${cropsForHerb.length === 0 ? \`
                        <tr>
                          <td colspan="5" class="px-6 py-12 text-center text-slate-400 font-medium">
                            ไม่มีข้อมูลผลผลิตสดในระบบ
                          </td>
                        </tr>
                      \` : cropsForHerb.map(c => {
                        const plot = plots.find(p => p.id === c.plotId);
                        const members = appState.getMembers();
                        const owner = plot ? members.find(m => (plot.memberIds && plot.memberIds.includes(m.id)) || plot.memberId === m.id) : null;
                        const yieldNum = parseFloat(c.yield) || 0;
                        return \`
                          <tr class="hover:bg-slate-50/50 transition-colors">
                            <td class="px-6 py-4 whitespace-nowrap text-slate-600">
                              \${formatThaiDate(c.harvestDateActual || c.harvestDateEst)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="text-slate-900 font-semibold">\${c.id}</div>
                              <div class="text-xs text-slate-400 font-normal mt-0.5">\${plot ? plot.name : '-'}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              \${owner ? owner.name : '-'}
                            </td>
                            <td class="px-6 py-4 text-right whitespace-nowrap font-mono text-slate-900">
                              \${yieldNum.toFixed(1)}
                            </td>
                            <td class="px-6 py-4 text-center whitespace-nowrap">
                              \${c.isProcessed ? \`
                                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  อบแล้ว
                                </span>
                              \` : \`
                                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                                  <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                  รออบ
                                </span>
                              \`}
                            </td>
                          </tr>
                        \`;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          \` : this.activeTab === 'canning' ? \`
            <!-- ===== TAB 2: แปรรูปบรรจุกระปุก ===== -->
            <div class="space-y-6">
              
              <!-- Clean Process Pipeline Card -->
              \${this.renderCanningProcessCard(selectedPool)}

              <!-- Specification Layout -->
              <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-base font-semibold text-slate-900">ข้อมูลมาตรฐานผลิตภัณฑ์</h3>
                  <span class="px-3 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                    1 กก. = 20 กระปุก
                  </span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  <div class="pt-4 md:pt-0 md:px-6 first:pt-0 first:pl-0 last:pr-0">
                    <div class="text-sm text-slate-500 mb-1">ขนาดบรรจุภัณฑ์</div>
                    <div class="text-lg font-semibold text-slate-900">50 กรัม / กระปุก</div>
                    <div class="text-xs text-slate-400 mt-2">กระปุกมาตรฐานพร้อมฝาดึง</div>
                  </div>
                  <div class="pt-4 md:pt-0 md:px-6">
                    <div class="text-sm text-slate-500 mb-1">ราคาจำหน่าย</div>
                    <div class="text-lg font-semibold text-slate-900">\${pricePerJar} บาท</div>
                    <div class="text-xs text-slate-400 mt-2">ราคากลางวิสาหกิจชุมชน</div>
                  </div>
                  <div class="pt-4 md:pt-0 md:px-6">
                    <div class="text-sm text-slate-500 mb-1">ศักยภาพผลิตปัจจุบัน</div>
                    <div class="text-lg font-semibold text-slate-900">~\${potentialJars} กระปุก</div>
                    <div class="text-xs text-slate-400 mt-2">จากสต็อกดอกแห้งที่มี</div>
                  </div>
                </div>
              </div>
            </div>
          \` : \`
            <!-- ===== TAB 3: ประวัติย้อนหลัง ===== -->
            <div class="space-y-6">
              
              <!-- Subtab Switcher -->
              <div class="flex items-center gap-2 mb-4">
                <button data-subtab="drying" class="fresh-hist-subtab-btn px-4 py-2 rounded-lg text-sm font-medium transition-all \${
                  this.historySubTab === 'drying' ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }">
                  รอบการอบแห้ง (\${filteredBatches.length})
                </button>
                <button data-subtab="canning" class="fresh-hist-subtab-btn px-4 py-2 rounded-lg text-sm font-medium transition-all \${
                  this.historySubTab === 'canning' ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }">
                  ประวัติบรรจุกระปุก (\${filteredPackBatches.length})
                </button>
              </div>

              \${this.historySubTab === 'drying' ? \`
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
                        \${filteredBatches.length === 0 ? \`
                          <tr>
                            <td colspan="5" class="px-6 py-12 text-center text-slate-400 font-medium">ไม่มีประวัติการอบแห้ง</td>
                          </tr>
                        \` : filteredBatches.map(b => {
                          const freshUsed = parseFloat(b.freshWeightKg) || 0;
                          const dryYield = parseFloat(b.dryWeightKg) || 0;
                          const ratioStr = b.ratioActual || (freshUsed / (dryYield || 1)).toFixed(2);
                          return \`
                            <tr class="hover:bg-slate-50/50 transition-colors">
                              <td class="px-6 py-4 whitespace-nowrap text-slate-600">\${formatThaiDate(b.processedDate)}</td>
                              <td class="px-6 py-4 text-right whitespace-nowrap font-mono">\${freshUsed.toFixed(1)}</td>
                              <td class="px-6 py-4 text-right whitespace-nowrap font-mono text-slate-900 font-semibold">\${dryYield.toFixed(1)}</td>
                              <td class="px-6 py-4 text-center whitespace-nowrap text-slate-500">\${ratioStr} : 1</td>
                              <td class="px-6 py-4 text-slate-500">\${b.note || '-'}</td>
                            </tr>
                          \`;
                        }).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              \` : \`
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                      <thead class="bg-white border-b border-slate-200 text-xs font-semibold text-slate-500 tracking-wider">
                        <tr>
                          <th class="px-6 py-4 whitespace-nowrap">วันที่บรรจุ</th>
                          <th class="px-6 py-4 whitespace-nowrap">รหัสล็อต</th>
                          <th class="px-6 py-4 whitespace-nowrap text-right">ดอกแห้งใช้ไป (กก.)</th>
                          <th class="px-6 py-4 whitespace-nowrap text-right">ได้กระปุก</th>
                          <th class="px-6 py-4 whitespace-nowrap">ผู้บันทึก</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                        \${filteredPackBatches.length === 0 ? \`
                          <tr>
                            <td colspan="5" class="px-6 py-12 text-center text-slate-400 font-medium">ไม่มีประวัติการบรรจุ</td>
                          </tr>
                        \` : filteredPackBatches.map(b => {
                          return \`
                            <tr class="hover:bg-slate-50/50 transition-colors">
                              <td class="px-6 py-4 whitespace-nowrap text-slate-600">\${formatThaiDate(b.processedDate)}</td>
                              <td class="px-6 py-4 whitespace-nowrap font-mono">\${b.id}</td>
                              <td class="px-6 py-4 text-right whitespace-nowrap font-mono">\${(parseFloat(b.dryUsedKg) || 0).toFixed(1)}</td>
                              <td class="px-6 py-4 text-right whitespace-nowrap font-mono text-slate-900 font-semibold">\${b.jarsProduced}</td>
                              <td class="px-6 py-4 text-slate-500">\${b.operatorName || '-'}</td>
                            </tr>
                          \`;
                        }).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              \`}
            </div>
          \`}
        </div>
      </div>
    \`;
  },

  renderProcessFlowCard(pool) {
    const isReadyToDry = pool.pendingFreshKg > 0;
    return \`
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
        
        <!-- Left: Fresh -->
        <div class="flex flex-col items-center flex-1 text-center">
          <div class="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 shadow-sm">
            <i class="fa-solid fa-leaf text-2xl text-slate-400"></i>
          </div>
          <div class="text-sm font-medium text-slate-500 mb-1">ผลผลิตสดรออบ</div>
          <div class="text-3xl font-light text-slate-900 tracking-tight font-mono">\${pool.pendingFreshKg.toFixed(1)} <span class="text-base text-slate-500 font-normal">กก.</span></div>
        </div>

        <!-- Middle: Action -->
        <div class="flex flex-col items-center flex-1 w-full md:w-auto relative">
          <div class="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-slate-200 -z-10" style="width: 150%; left: -25%;"></div>
          
          <button data-herb="\${pool.herb}" class="start-drying-pool-btn bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 \${!isReadyToDry ? 'opacity-50 cursor-not-allowed' : ''}" \${!isReadyToDry ? 'disabled' : ''}>
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
          <div class="text-3xl font-light text-slate-900 tracking-tight font-mono">\${pool.actualDryKg.toFixed(1)} <span class="text-base text-slate-500 font-normal">กก.</span></div>
        </div>

      </div>
    \`;
  },

  renderCanningProcessCard(pool) {
    const isReadyToPack = pool.actualDryKg > 0;
    return \`
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
        
        <!-- Left: Dry -->
        <div class="flex flex-col items-center flex-1 text-center">
          <div class="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 shadow-sm">
            <i class="fa-solid fa-box text-2xl text-slate-400"></i>
          </div>
          <div class="text-sm font-medium text-slate-500 mb-1">วัตถุดิบดอกแห้ง</div>
          <div class="text-3xl font-light text-slate-900 tracking-tight font-mono">\${pool.actualDryKg.toFixed(1)} <span class="text-base text-slate-500 font-normal">กก.</span></div>
        </div>

        <!-- Middle: Action -->
        <div class="flex flex-col items-center flex-1 w-full md:w-auto relative">
          <div class="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-slate-200 -z-10" style="width: 150%; left: -25%;"></div>
          
          <button data-herb="\${pool.herb}" class="start-canning-pool-btn bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 \${!isReadyToPack ? 'opacity-50 cursor-not-allowed' : ''}" \${!isReadyToPack ? 'disabled' : ''}>
            แปรรูปบรรจุกระปุก
          </button>
          <div class="text-xs text-slate-400 font-medium mt-3 bg-white px-2">1 กก. = 20 กระปุก</div>
        </div>

        <!-- Right: Jars -->
        <div class="flex flex-col items-center flex-1 text-center">
          <div class="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 shadow-sm">
            <i class="fa-solid fa-jar text-2xl text-slate-400"></i>
          </div>
          <div class="text-sm font-medium text-slate-500 mb-1">กระปุก 50G สำเร็จ</div>
          <div class="text-3xl font-light text-slate-900 tracking-tight font-mono">\${Math.floor(pool.actualDryKg * 20)} <span class="text-base text-slate-500 font-normal">กป.</span></div>
        </div>

      </div>
    \`;
  },
`;
