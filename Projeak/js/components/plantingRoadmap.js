// Planting Roadmap Component (แผนการปลูกสมุนไพร)
import { appState } from '../state.js';
import { showToast, openGlobalModal, closeGlobalModal } from '../helpers.js';

export const PlantingRoadmapComponent = {
  selectedHerb: 'เก๊กฮวย',
  viewMode: 'table', // 'table' | 'timeline'

  render() {
    const roadmaps = appState.getRoadmaps();
    const herbsList = Object.keys(roadmaps);
    
    // Ensure valid selectedHerb
    if (!roadmaps[this.selectedHerb] && herbsList.length > 0) {
      this.selectedHerb = herbsList[0];
    }
    
    const currentRoadmap = roadmaps[this.selectedHerb] || {
      name: this.selectedHerb,
      icon: '🌿',
      description: 'แผนการปลูกสมุนไพรมาตรฐาน',
      durationDays: 90,
      cycleText: 'ระยะเวลาประมาณ 90 วัน',
      steps: []
    };

    const steps = currentRoadmap.steps || [];
    const currentUser = appState.getCurrentUser();
    const isAdminOrOfficer = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Officer' || !currentUser.role);

    return `
      <div class="space-y-6 pb-12">
        
        <!-- Header & Top Navigation Bar -->
        <div class="bg-gradient-to-r from-[#0b2414] via-[#0f341d] to-[#164e2b] rounded-3xl p-6 md:p-8 text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
          <!-- Decorative Background Circles -->
          <div class="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none"></div>
          <div class="absolute right-32 -top-12 w-36 h-36 rounded-full bg-emerald-400/10 pointer-events-none"></div>

          <div class="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-emerald-200 text-xs font-bold uppercase tracking-wider mb-3 border border-white/10">
                <i class="fas fa-calendar-check text-emerald-300"></i>
                <span>คู่มือมาตรฐานการปลูกวิสาหกิจชุมชน</span>
              </div>
              <h1 class="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                <i class="fa-solid fa-route text-emerald-300"></i>
                <span>แผนการปลูก</span>
              </h1>
              <p class="text-sm md:text-base text-emerald-100 mt-2 max-w-2xl leading-relaxed">
                กำหนดการดูแล ใส่ปุ๋ย และเก็บเกี่ยวตามรอบวัน เพื่อให้สมาชิกเกษตรกรได้ผลผลิตคุณภาพสูง มาตรฐานเกษตรอินทรีย์ปลอดสารพิษ
              </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap items-center gap-3">
              <button id="header-add-herb-btn" class="px-5 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-black text-sm md:text-base transition-all flex items-center gap-2 border border-white/25 backdrop-blur-md cursor-pointer shadow-md transform hover:-translate-y-0.5" title="เพิ่มชนิดพืชสมุนไพรใหม่">
                <i class="fas fa-seedling text-emerald-300"></i>
                <span>+ เพิ่มพืช</span>
              </button>

              <button id="add-step-btn" class="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-sm md:text-base shadow-md transition-all flex items-center gap-2 transform hover:-translate-y-0.5 cursor-pointer">
                <i class="fas fa-plus-circle text-lg"></i>
                <span>+ เพิ่ม/แก้ไขขั้นตอน</span>
              </button>

              <button id="reset-roadmap-btn" class="px-3.5 py-3 rounded-xl bg-white/10 hover:bg-red-500/80 text-white/80 hover:text-white text-xs font-semibold transition-all border border-white/15 cursor-pointer" title="คืนค่าเริ่มต้นมาตรฐานของระบบ">
                <i class="fas fa-rotate-left mr-1"></i>คืนค่าเริ่มต้น
              </button>
            </div>
          </div>
        </div>

        <!-- Plant Selection Pill Tabs & View Toggle -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-emerald-100">
          
          <!-- Herb Selection Tabs -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
            <span class="text-xs font-bold text-gray-400 uppercase tracking-wider pl-2 pr-1 shrink-0">
              <i class="fas fa-leaf text-emerald-600 mr-1"></i>เลือกชนิดพืช:
            </span>
            ${herbsList.map(h => {
              const isActive = h === this.selectedHerb;
              return `
                <button data-herb="${h}" class="herb-pill-tab px-5 py-2.5 rounded-xl font-bold text-base transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  isActive 
                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20 scale-102 ring-2 ring-emerald-600 ring-offset-1' 
                    : 'bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 border border-gray-200/80'
                }">
                  <span>${h}</span>
                  ${isActive ? `<span class="w-2 h-2 rounded-full bg-emerald-300 ml-1 animate-ping"></span>` : ''}
                </button>
              `;
            }).join('')}

            <button id="add-herb-btn" class="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-dashed border-emerald-300 font-bold text-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer" title="เพิ่มชนิดพืชใหม่">
              <i class="fas fa-plus text-xs"></i>
              <span>เพิ่มพืช</span>
            </button>
          </div>

          <!-- View Mode Toggle (Table / Timeline) -->
          <div class="flex items-center gap-1 bg-gray-100 p-1.5 rounded-xl self-end sm:self-auto shrink-0 border border-gray-200">
            <button id="view-table-btn" class="px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              this.viewMode === 'table' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }">
              <i class="fas fa-table-list"></i>
              <span>ตารางแผนงาน</span>
            </button>
            <button id="view-timeline-btn" class="px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              this.viewMode === 'timeline' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }">
              <i class="fas fa-timeline"></i>
              <span>ไทม์ไลน์ภาพ</span>
            </button>
          </div>
        </div>

        <!-- Herb Info Banner & Summary Highlights -->
        <div class="bg-gradient-to-r from-emerald-50 via-white to-emerald-50/40 rounded-2xl p-5 md:p-6 border border-emerald-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-xl md:text-2xl font-black text-gray-900">${currentRoadmap.name}</h2>
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                ${steps.length} ขั้นตอนหลัก
              </span>
            </div>
            <p class="text-sm md:text-base text-gray-600 mt-0.5">
              ${currentRoadmap.description || 'แนวทางการเพาะปลูกและการดูแลรักษา'}
            </p>
          </div>

          <!-- Highlight Badges -->
          <div class="flex flex-wrap items-center gap-3 text-xs md:text-sm">
            <div class="px-4 py-2 bg-white rounded-xl border border-emerald-200 shadow-2xs flex items-center gap-2.5">
              <i class="fas fa-clock text-emerald-700 text-base"></i>
              <div>
                <span class="text-[11px] text-gray-400 block font-semibold leading-tight">ระยะเวลาปลูกรวม</span>
                <span class="text-sm md:text-base font-black text-emerald-900">${currentRoadmap.durationDays || 90} วัน</span>
              </div>
            </div>

            <div class="px-4 py-2 bg-white rounded-xl border border-emerald-200 shadow-2xs flex items-center gap-2.5">
              <i class="fas fa-certificate text-amber-500 text-base"></i>
              <div>
                <span class="text-[11px] text-gray-400 block font-semibold leading-tight">มาตรฐานคุณภาพ</span>
                <span class="text-sm md:text-base font-black text-gray-800">อินทรีย์ 100%</span>
              </div>
            </div>

            <div class="px-4 py-2 bg-white rounded-xl border border-emerald-200 shadow-2xs flex items-center gap-2.5">
              <i class="fas fa-temperature-arrow-up text-rose-500 text-base"></i>
              <div>
                <span class="text-[11px] text-gray-400 block font-semibold leading-tight">ปลายทางผลผลิต</span>
                <span class="text-sm md:text-base font-black text-gray-800">ส่งโรงอบแห้ง</span>
              </div>
            </div>

            ${herbsList.length > 1 && this.selectedHerb !== 'เก๊กฮวย' && this.selectedHerb !== 'คาโมมายล์' ? `
              <button id="delete-current-herb-btn" class="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer" title="ลบชนิดพืชนี้ออกจากระบบ">
                <i class="fas fa-trash-can"></i>
                <span>ลบพืช ${this.selectedHerb}</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Main Content Area: Table View or Timeline View -->
        ${this.viewMode === 'table' ? this.renderTableView(steps) : this.renderTimelineView(steps)}

        <!-- Bottom Guidance Card for Elders & Farmers -->
        <div class="bg-amber-50/80 rounded-2xl p-5 md:p-6 border border-amber-200 shadow-sm flex flex-col md:flex-row items-start gap-4 text-amber-950">
          <div class="w-12 h-12 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center text-2xl shrink-0 shadow-xs">
            <i class="fas fa-lightbulb"></i>
          </div>
          <div class="flex-1 space-y-1">
            <h4 class="text-base md:text-lg font-bold text-amber-950 flex items-center gap-2">
              <span>คำแนะนำสำคัญสำหรับสมาชิกเกษตรกร</span>
              <span class="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">เพื่อผลผลิตเกรด A</span>
            </h4>
            <p class="text-sm md:text-base text-amber-900 leading-relaxed">
              • ควรสื่อสารกับประธานกลุ่มหรือเจ้าหน้าที่โรงอบล่วงหน้า <strong>3-5 วันก่อนเก็บเกี่ยว</strong> เพื่อจัดคิวเตาอบแห้งให้ทันท่วงที<br>
              • หากสภาพอากาศเปลี่ยนแปลง เช่น ฝนตกชุก ให้ตรวจดูระบบระบายน้ำของแปลงเพื่อป้องกันน้ำท่วมขังและโรครากเน่า<br>
              • ประธานกลุ่มหรือผู้ดูแลสามารถปรับเปลี่ยนจำนวนวันและสูตรปุ๋ยของแต่ละชนิดพืชได้ตลอดเวลาผ่านปุ่ม "+ เพิ่ม/แก้ไขขั้นตอน"
            </p>
          </div>
          <a href="#crops" class="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shrink-0 shadow-sm transition-all flex items-center gap-2 self-start md:self-center">
            <i class="fas fa-arrow-right"></i>
            <span>ไปที่บันทึกรอบปลูก</span>
          </a>
        </div>

      </div>
    `;
  },

  // 1. Table View (Planting Schedule Table)
  renderTableView(steps) {
    if (!steps || steps.length === 0) {
      return `
        <div class="bg-white rounded-2xl p-12 text-center border border-emerald-100 shadow-sm">
          <i class="fas fa-calendar-xmark text-5xl text-gray-300 mb-3"></i>
          <h3 class="text-xl font-bold text-gray-700">ยังไม่มีขั้นตอนแผนการปลูกสำหรับ "${this.selectedHerb}"</h3>
          <p class="text-gray-500 text-base mt-1">ท่านสามารถเริ่มกำหนดขั้นตอนการดูแลด้วยตนเองได้ทันที</p>
          <button class="add-step-empty-btn mt-5 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-sm md:text-base shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5">
            <i class="fas fa-plus-circle text-lg"></i>
            <span>+ เพิ่มขั้นตอนแรก</span>
          </button>
        </div>
      `;
    }

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <!-- Table Header Notice -->
        <div class="px-6 py-4 bg-emerald-900/5 border-b border-emerald-100 flex items-center justify-between">
          <div class="flex items-center gap-2 text-emerald-950 font-bold text-base md:text-lg">
            <i class="fas fa-list-check text-emerald-700"></i>
            <span>ตารางขั้นตอนแผนการปลูก: ${this.selectedHerb}</span>
          </div>
          <span class="text-xs text-gray-500 hidden sm:inline">
            * คลิกปุ่มแก้ไขเพื่อปรับจำนวนวันหรือข้อความแนะนำ
          </span>
        </div>

        <!-- Table Responsive Container -->
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/80 border-b border-gray-200 text-gray-600 text-sm md:text-base font-extrabold">
                <th class="py-4 px-4 md:px-6 w-24 text-center">ลำดับ</th>
                <th class="py-4 px-4 md:px-6 min-w-[240px]">รายการกิจกรรม</th>
                <th class="py-4 px-4 md:px-6 min-w-[180px]">ระยะเวลา / รอบวัน</th>
                <th class="py-4 px-4 md:px-6 min-w-[260px]">คำแนะนำ / หมายเหตุ</th>
                <th class="py-4 px-4 md:px-6 w-28 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              ${steps.map((step, index) => {
                const stepColors = this.getStepTheme(step.color || 'emerald');
                const prevStep = index > 0 ? steps[index - 1] : null;
                const intervalDays = prevStep ? (step.dayNumber - prevStep.dayNumber) : 0;

                return `
                  <tr class="hover:bg-emerald-50/40 transition-colors group">
                    
                    <!-- Column 1: Step Badge Number -->
                    <td class="py-5 px-4 md:px-6 text-center align-top">
                      <div class="w-12 h-12 md:w-14 md:h-14 rounded-2xl ${stepColors.badgeBg} text-white font-black text-xl md:text-2xl flex items-center justify-center mx-auto shadow-sm ring-4 ${stepColors.ring}">
                        ${step.stepNo}
                      </div>
                      ${index < steps.length - 1 ? `
                        <div class="w-0.5 h-6 bg-emerald-200 mx-auto mt-2 hidden sm:block"></div>
                      ` : ''}
                    </td>

                    <!-- Column 2: Activity Details -->
                    <td class="py-5 px-4 md:px-6 align-top">
                      <div>
                        <h3 class="text-base md:text-lg font-black text-gray-900 leading-snug">
                          ${step.title}
                        </h3>
                      </div>
                    </td>

                    <!-- Column 3: Day / Duration -->
                    <td class="py-5 px-4 md:px-6 align-top">
                      <div class="inline-flex flex-col gap-1.5">
                        <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl ${stepColors.pillBg} ${stepColors.pillText} font-black text-base md:text-lg border ${stepColors.pillBorder} shadow-2xs">
                          <i class="fas fa-calendar-day text-sm"></i>
                          <span>${step.dayLabel || `วันที่ ${step.dayNumber}`}</span>
                        </span>
                        
                        ${intervalDays > 0 ? `
                          <span class="text-xs text-gray-500 font-semibold pl-1 flex items-center gap-1">
                            <i class="fas fa-clock-rotate-left text-[10px] text-emerald-600"></i>
                            ห่างจากขั้นก่อน ${intervalDays} วัน
                          </span>
                        ` : `
                          <span class="text-xs text-emerald-700 font-bold pl-1">
                            • จุดเริ่มต้นรอบการปลูก
                          </span>
                        `}
                      </div>
                    </td>

                    <!-- Column 4: Activity Advice / Guidance / Note -->
                    <td class="py-5 px-4 md:px-6 align-top">
                      ${step.advice ? `
                        <div class="p-3.5 rounded-xl ${stepColors.adviceBg} border ${stepColors.adviceBorder}">
                          <div class="flex items-center gap-2 font-black text-sm md:text-base ${stepColors.adviceTitle}">
                            <i class="fas fa-lightbulb"></i>
                            <span>${step.advice}</span>
                          </div>
                          ${step.detail ? `
                            <div class="text-xs md:text-sm text-gray-700 mt-1 font-medium leading-relaxed">
                              ${step.detail}
                            </div>
                          ` : ''}
                        </div>
                      ` : (step.detail ? `
                        <div class="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 text-gray-700 text-xs md:text-sm leading-relaxed">
                          <span class="font-bold text-gray-500 block mb-0.5">หมายเหตุ:</span>
                          ${step.detail}
                        </div>
                      ` : `
                        <span class="text-gray-400 text-sm font-medium">-</span>
                      `)}
                    </td>

                    <!-- Column 5: Actions -->
                    <td class="py-5 px-4 md:px-6 text-center align-middle">
                      <div class="flex items-center justify-center gap-2">
                        <button data-step-no="${step.stepNo}" class="edit-step-btn p-2.5 rounded-xl bg-gray-100 hover:bg-emerald-600 text-gray-600 hover:text-white transition-all shadow-2xs cursor-pointer" title="แก้ไขขั้นตอนนี้">
                          <i class="fas fa-pencil text-sm"></i>
                        </button>
                        <button data-step-no="${step.stepNo}" class="delete-step-btn p-2.5 rounded-xl bg-gray-100 hover:bg-red-500 text-gray-500 hover:text-white transition-all shadow-2xs cursor-pointer" title="ลบขั้นตอนนี้">
                          <i class="fas fa-trash-can text-sm"></i>
                        </button>
                      </div>
                    </td>

                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 2. Timeline View (Interactive Step Timeline Cards)
  renderTimelineView(steps) {
    if (!steps || steps.length === 0) {
      return this.renderTableView(steps);
    }

    return `
      <div class="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-emerald-100">
        <div class="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
          <div>
            <h3 class="text-lg md:text-xl font-black text-gray-900 flex items-center gap-2">
              <i class="fas fa-route text-emerald-700"></i>
              <span>เส้นทางการเติบโตและเก็บเกี่ยว: ${this.selectedHerb}</span>
            </h3>
            <p class="text-sm text-gray-500 mt-0.5">ไล่เรียงตามลำดับเวลาตั้งแต่วันเริ่มต้นจนถึงวันส่งโรงอบ</p>
          </div>
          <span class="text-sm font-black text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            รวม ${steps.length} หมุดหมาย
          </span>
        </div>

        <div class="relative">
          <!-- Central Connecting Vertical Line -->
          <div class="absolute left-6 md:left-8 top-6 bottom-6 w-1 bg-gradient-to-b from-emerald-500 via-teal-500 to-emerald-700 rounded-full"></div>

          <div class="space-y-8 relative">
            ${steps.map((step, index) => {
              const stepColors = this.getStepTheme(step.color || 'emerald');
              return `
                <div class="flex items-start gap-4 md:gap-6 group">
                  
                  <!-- Milestone Circle Marker -->
                  <div class="w-12 h-12 md:w-16 md:h-16 rounded-2xl ${stepColors.badgeBg} text-white font-black text-xl md:text-2xl flex items-center justify-center shrink-0 z-10 shadow-md ring-4 ${stepColors.ring}">
                    ${step.stepNo}
                  </div>

                  <!-- Timeline Card Content -->
                  <div class="flex-1 bg-gradient-to-br from-white to-gray-50/80 rounded-2xl p-5 md:p-6 border border-gray-200/80 hover:border-emerald-300 shadow-2xs hover:shadow-md transition-all">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                      <div class="flex items-center gap-3">
                        <h4 class="text-lg md:text-xl font-black text-gray-900">${step.title}</h4>
                      </div>

                      <div class="flex items-center gap-3">
                        <span class="px-3 py-1 rounded-xl ${stepColors.pillBg} ${stepColors.pillText} font-black text-sm md:text-base border ${stepColors.pillBorder}">
                          <i class="fas fa-calendar-day mr-1.5"></i>${step.dayLabel || `วันที่ ${step.dayNumber}`}
                        </span>
                        <button data-step-no="${step.stepNo}" class="edit-step-btn text-xs font-bold text-gray-500 hover:text-emerald-700 underline cursor-pointer">
                          แก้ไข
                        </button>
                      </div>
                    </div>

                    <div class="${step.advice ? 'grid grid-cols-1 lg:grid-cols-3 gap-4' : ''} mt-4">
                      <!-- Detail / Note -->
                      <div class="${step.advice ? 'lg:col-span-2' : ''}">
                        <span class="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">หมายเหตุ:</span>
                        <p class="text-base text-gray-700 leading-relaxed font-normal">
                          ${step.detail || '-'}
                        </p>
                      </div>

                      ${step.advice ? `
                        <!-- Advice Card -->
                        <div class="p-4 rounded-xl ${stepColors.adviceBg} border ${stepColors.adviceBorder}">
                          <div class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">แนวทางสำคัญ:</div>
                          <div class="font-black text-base ${stepColors.adviceTitle} flex items-center gap-1.5">
                            <i class="fas fa-check-circle"></i>
                            <span>${step.advice}</span>
                          </div>
                          <p class="text-xs text-gray-600 mt-1">
                            ${this.getAdviceHelperText(step.advice, step.detail)}
                          </p>
                        </div>
                      ` : ''}
                    </div>
                  </div>

                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // Helpers for Color Themes
  getStepTheme(color) {
    switch (color) {
      case 'teal':
        return {
          badgeBg: 'bg-gradient-to-br from-teal-500 to-teal-700',
          ring: 'ring-teal-100',
          iconBg: 'bg-teal-100',
          iconText: 'text-teal-800',
          pillBg: 'bg-teal-50',
          pillText: 'text-teal-900',
          pillBorder: 'border-teal-200',
          adviceBg: 'bg-teal-50/70',
          adviceBorder: 'border-teal-200',
          adviceTitle: 'text-teal-900'
        };
      case 'amber':
        return {
          badgeBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
          ring: 'ring-amber-100',
          iconBg: 'bg-amber-100',
          iconText: 'text-amber-800',
          pillBg: 'bg-amber-50',
          pillText: 'text-amber-900',
          pillBorder: 'border-amber-200',
          adviceBg: 'bg-amber-50/70',
          adviceBorder: 'border-amber-200',
          adviceTitle: 'text-amber-900'
        };
      case 'rose':
        return {
          badgeBg: 'bg-gradient-to-br from-rose-500 to-rose-700',
          ring: 'ring-rose-100',
          iconBg: 'bg-rose-100',
          iconText: 'text-rose-800',
          pillBg: 'bg-rose-50',
          pillText: 'text-rose-900',
          pillBorder: 'border-rose-200',
          adviceBg: 'bg-rose-50/70',
          adviceBorder: 'border-rose-200',
          adviceTitle: 'text-rose-900'
        };
      case 'emerald':
      default:
        return {
          badgeBg: 'bg-gradient-to-br from-emerald-600 to-[#1e4620]',
          ring: 'ring-emerald-100',
          iconBg: 'bg-emerald-100',
          iconText: 'text-emerald-800',
          pillBg: 'bg-emerald-50',
          pillText: 'text-emerald-950',
          pillBorder: 'border-emerald-200',
          adviceBg: 'bg-emerald-50/70',
          adviceBorder: 'border-emerald-200',
          adviceTitle: 'text-emerald-900'
        };
    }
  },

  getAdviceHelperText(advice, detail) {
    if (!advice) return 'ปฏิบัติตามมาตรฐานอินทรีย์';
    if (advice.includes('รองก้นหลุม') || advice.includes('เริ่มปลูก')) {
      return 'เน้นการเตรียมดินให้โปร่ง ระบายน้ำดี คลุมฟางรักษาความชื้น รดน้ำให้สม่ำเสมอ';
    }
    if (advice.includes('เร่งต้น') || advice.includes('ใบ') || advice.includes('ราก')) {
      return 'เสริมสร้างการเจริญเติบโตของกิ่งก้าน พรวนดินรอบโคนต้นเพื่อเพิ่มออกซิเจนให้ราก';
    }
    if (advice.includes('เร่งตาดอก')) {
      return 'เสริมธาตุฟอสฟอรัสและโพแทสเซียมอินทรีย์ ป้องกันโรคราน้ำค้าง รักษาระดับความชื้นให้พอเหมาะ';
    }
    if (advice.includes('เก็บเกี่ยว') || advice.includes('โรงอบ')) {
      return 'คัดดอกสมบูรณ์ เก็บช่วงเช้าไร้น้ำค้าง รีบส่งเข้าตู้อบแห้งเพื่อรักษาสารสำคัญและกลิ่นหอม';
    }
    return detail ? detail.substring(0, 70) + '...' : 'ตรวจสอบคุณภาพและความสมบูรณ์ของต้นสมุนไพร';
  },

  init() {
    // 1. Bind Herb Tabs Click
    const herbTabs = document.querySelectorAll('.herb-pill-tab');
    herbTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const herb = tab.getAttribute('data-herb');
        if (herb) {
          this.selectedHerb = herb;
          this.refresh();
        }
      });
    });

    // 2. View Mode Toggle
    const tableBtn = document.getElementById('view-table-btn');
    const timelineBtn = document.getElementById('view-timeline-btn');
    if (tableBtn && timelineBtn) {
      tableBtn.addEventListener('click', () => {
        this.viewMode = 'table';
        this.refresh();
      });
      timelineBtn.addEventListener('click', () => {
        this.viewMode = 'timeline';
        this.refresh();
      });
    }

    // 3. Add / Edit Step Master Button
    const addStepBtn = document.getElementById('add-step-btn');
    if (addStepBtn) {
      addStepBtn.addEventListener('click', () => {
        this.openStepModal(null);
      });
    }

    // 3.1 Add First Step from Empty State
    const emptyStepBtns = document.querySelectorAll('.add-step-empty-btn');
    emptyStepBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.openStepModal(null);
      });
    });

    // 4. Edit Step Buttons on rows
    const editBtns = document.querySelectorAll('.edit-step-btn');
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const stepNo = Number(btn.getAttribute('data-step-no'));
        const roadmaps = appState.getRoadmaps();
        const steps = (roadmaps[this.selectedHerb] || {}).steps || [];
        const step = steps.find(s => s.stepNo === stepNo);
        if (step) {
          this.openStepModal(step);
        }
      });
    });

    // 5. Delete Step Buttons
    const deleteBtns = document.querySelectorAll('.delete-step-btn');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const stepNo = Number(btn.getAttribute('data-step-no'));
        if (confirm(`คุณต้องการลบขั้นตอนที่ ${stepNo} ของ "${this.selectedHerb}" ใช่หรือไม่?`)) {
          appState.deleteHerbStep(this.selectedHerb, stepNo);
          showToast(`ลบขั้นตอนที่ ${stepNo} เรียบร้อยแล้ว`, 'success');
          this.refresh();
        }
      });
    });

    // 6. Reset Roadmap to default
    const resetBtn = document.getElementById('reset-roadmap-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('คุณต้องการคืนค่าแผนการปลูกทั้งหมดกลับสู่ค่าเริ่มต้นของระบบใช่หรือไม่? ข้อมูลขั้นตอนที่ปรับแต่งไว้จะถูกรีเซ็ต')) {
          appState.resetDefaultRoadmaps();
          showToast('คืนค่าแผนการปลูกเริ่มต้นเรียบร้อยแล้ว', 'info');
          this.refresh();
        }
      });
    }

    // 7. Add Herb Buttons (Header & Tabs)
    const headerAddHerbBtn = document.getElementById('header-add-herb-btn');
    if (headerAddHerbBtn) {
      headerAddHerbBtn.addEventListener('click', () => {
        this.openAddHerbModal();
      });
    }

    const addHerbBtn = document.getElementById('add-herb-btn');
    if (addHerbBtn) {
      addHerbBtn.addEventListener('click', () => {
        this.openAddHerbModal();
      });
    }

    // 8. Delete Current Custom Herb Button
    const deleteHerbBtn = document.getElementById('delete-current-herb-btn');
    if (deleteHerbBtn) {
      deleteHerbBtn.addEventListener('click', () => {
        if (confirm(`คุณต้องการลบชนิดพืช "${this.selectedHerb}" ออกจากแผนการปลูกใช่หรือไม่?`)) {
          const herbToDelete = this.selectedHerb;
          appState.deleteHerbRoadmap(herbToDelete);
          const roadmaps = appState.getRoadmaps();
          this.selectedHerb = Object.keys(roadmaps)[0] || 'เก๊กฮวย';
          showToast(`ลบชนิดพืช "${herbToDelete}" เรียบร้อยแล้ว`, 'info');
          this.refresh();
        }
      });
    }
  },

  refresh() {
    const container = document.getElementById('app-view');
    if (container) {
      container.innerHTML = this.render();
      this.init();
    }
  },

  // Modal: Add or Edit Step
  openStepModal(step = null) {
    const isEdit = !!step;
    const roadmaps = appState.getRoadmaps();
    const currentHerbRoadmap = roadmaps[this.selectedHerb] || { steps: [] };
    const nextStepNo = isEdit ? step.stepNo : (currentHerbRoadmap.steps.length + 1);
    const defaultDay = isEdit ? step.dayNumber : (nextStepNo === 1 ? 1 : nextStepNo * 25);

    const formHtml = `
      <form id="step-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-4 text-sm">
          <input type="hidden" id="modal-original-step-no" value="${isEdit ? step.stepNo : ''}">

          <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
            <span class="text-xs font-bold text-emerald-800 uppercase">
              <i class="fas fa-leaf mr-1"></i>พืชสมุนไพร: <b class="text-sm text-emerald-950">${this.selectedHerb}</b>
            </span>
            <span class="text-xs text-gray-500 font-semibold">
              ${isEdit ? `แก้ไขขั้นตอนที่ ${step.stepNo}` : `เพิ่มเป็นขั้นตอนที่ ${nextStepNo}`}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1.5">ลำดับขั้นตอน *</label>
              <input type="number" id="modal-step-no" min="1" max="20" required
                value="${nextStepNo}"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-base">
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1.5">รอบวัน (วันที่เท่าไหร่) *</label>
              <div class="relative">
                <span class="absolute left-3 top-2.5 text-gray-400 text-xs">วันที่</span>
                <input type="number" id="modal-day-number" min="1" max="365" required
                  value="${defaultDay}"
                  class="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-black text-base text-emerald-900">
              </div>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1.5">ชื่อกิจกรรมหลัก *</label>
            <input type="text" id="modal-step-title" required
              value="${isEdit ? step.title : ''}"
              placeholder="เช่น ใส่ปุ๋ยบำรุงครั้งที่ 1, ตัดแต่งกิ่ง, เก็บเกี่ยวผลผลิต"
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-base">
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1.5">
              หมายเหตุ <span class="text-gray-400 font-normal">(จะใส่หรือไม่ใส่ก็ได้)</span>
            </label>
            <textarea id="modal-step-detail" rows="3"
              placeholder="ระบุหมายเหตุหรือข้อควรระวังเพิ่มเติม (ถ้ามี)..."
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm leading-relaxed">${isEdit ? (step.detail || '') : ''}</textarea>
          </div>
        </div>

        <div class="p-4 md:px-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold transition-all cursor-pointer">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black shadow-md transition-all flex items-center gap-2 cursor-pointer">
            <i class="fas fa-save"></i>
            <span>${isEdit ? 'บันทึกการแก้ไข' : 'บันทึกขั้นตอนใหม่'}</span>
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: isEdit ? `แก้ไขขั้นตอน: ${step.title}` : `เพิ่มขั้นตอนแผนการปลูก (${this.selectedHerb})`,
      icon: isEdit ? 'fas fa-pen-to-square' : 'fas fa-plus-circle',
      size: 'max-w-2xl',
      headerColor: 'bg-[#1e4620]',
      content: formHtml,
      onRender: (dialog) => {
        // Form Submit
        const form = dialog.querySelector('#step-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const stepNo = Number(dialog.querySelector('#modal-step-no').value);
            const originalStepNo = dialog.querySelector('#modal-original-step-no').value;
            const dayNumber = Number(dialog.querySelector('#modal-day-number').value);
            const title = dialog.querySelector('#modal-step-title').value.trim();
            const advice = isEdit ? (step.advice || '') : '';
            const detail = (dialog.querySelector('#modal-step-detail')?.value || '').trim();

            // Auto-assign step color theme automatically without manual input
            const autoColor = (() => {
              if (isEdit && step.color) return step.color;
              const t = (title + ' ' + detail).toLowerCase();
              if (t.includes('เก็บเกี่ยว') || t.includes('โรงอบ') || t.includes('ตัดดอก') || t.includes('ผลผลิต')) return 'rose';
              if (t.includes('ดอก') || t.includes('ตาดอก') || t.includes('ช่อ')) return 'amber';
              if (t.includes('ปุ๋ย') || t.includes('น้ำ') || t.includes('บำรุง') || t.includes('กิ่ง') || t.includes('ใบ') || t.includes('พรวน')) return 'teal';
              if (t.includes('ปลูก') || t.includes('กล้า') || t.includes('ดิน') || t.includes('ย้าย')) return 'emerald';
              const palette = ['emerald', 'teal', 'amber', 'rose'];
              return palette[(Math.max(1, stepNo) - 1) % palette.length] || 'emerald';
            })();
            const color = autoColor;

            const autoIcon = (() => {
              if (isEdit && step.icon) return step.icon;
              if (color === 'rose') return 'fa-basket-shopping';
              if (color === 'amber') return 'fa-spa';
              if (color === 'teal') return 'fa-water';
              return 'fa-seedling';
            })();
            const icon = autoIcon;

            appState.saveHerbStep(this.selectedHerb, {
              stepNo,
              originalStepNo,
              dayNumber,
              dayLabel: `วันที่ ${dayNumber}`,
              title,
              advice,
              detail,
              color,
              icon
            });

            closeGlobalModal();
            showToast(`บันทึกขั้นตอนแผนการปลูกของ "${this.selectedHerb}" เรียบร้อยแล้ว`, 'success');
            this.refresh();
          });
        }
      }
    });
  },

  // Modal: Add New Herb (เพิ่มชนิดพืชสมุนไพร)
  openAddHerbModal() {
    const formHtml = `
      <form id="add-herb-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-5 text-sm">
          
          <div>
            <label class="block text-sm font-bold text-gray-800 mb-1.5">ชื่อพืชสมุนไพร *</label>
            <input type="text" id="modal-herb-name" required placeholder="เช่น อัญชัน, ฟ้าทะลายโจร, หญ้าหวาน, ขมิ้นชัน"
              class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-base text-gray-900 shadow-2xs">
          </div>

          <div>
            <label class="block text-sm font-bold text-gray-800 mb-1.5">ระยะเวลาเพาะปลูกรวม (วัน) *</label>
            <div class="relative">
              <input type="number" id="modal-herb-duration" min="1" max="365" value="90" required
                class="w-full pl-4 pr-16 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-black text-lg text-emerald-900 shadow-2xs">
              <span class="absolute right-4 top-3 text-gray-500 text-base font-bold">วัน</span>
            </div>
            <p class="text-xs text-gray-500 mt-1.5 font-medium">
              💡 ระบบจะสร้างกำหนดการใส่ปุ๋ยและเก็บเกี่ยวอัตโนมัติตามประเภทที่เลือก
            </p>
          </div>

          <div>
            <label class="block text-sm font-bold text-gray-800 mb-2">ประเภทพืช *</label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label class="flex items-center gap-2 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors">
                <input type="radio" name="plantType" value="plant" class="w-4 h-4 text-emerald-600 focus:ring-emerald-500" checked>
                <span class="font-bold text-gray-700 text-sm">🌿 พืชทั่วไป</span>
              </label>
              <label class="flex items-center gap-2 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors">
                <input type="radio" name="plantType" value="tea" class="w-4 h-4 text-emerald-600 focus:ring-emerald-500">
                <span class="font-bold text-gray-700 text-sm">🍵 ชา</span>
              </label>
              <label class="flex items-center gap-2 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors">
                <input type="radio" name="plantType" value="other" class="w-4 h-4 text-emerald-600 focus:ring-emerald-500">
                <span class="font-bold text-gray-700 text-sm">✨ อื่นๆ (กำหนดเอง)</span>
              </label>
            </div>
            <p class="text-[10px] text-gray-400 mt-2">
              * หากเลือก "อื่นๆ" ระบบจะไม่สร้างกำหนดการให้ ท่านจะต้องเพิ่มขั้นตอนด้วยตนเอง
            </p>
          </div>

        </div>

        <div class="p-4 md:px-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold transition-all cursor-pointer">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black shadow-md transition-all flex items-center gap-2 cursor-pointer">
            <i class="fas fa-plus-circle"></i>
            <span>บันทึกชนิดพืช</span>
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title: 'เพิ่มชนิดพืชสมุนไพร',
      icon: 'fas fa-seedling',
      size: 'max-w-md',
      headerColor: 'bg-[#1e4620]',
      content: formHtml,
      onRender: (dialog) => {
        const form = dialog.querySelector('#add-herb-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = dialog.querySelector('#modal-herb-name').value.trim();
            const duration = Number(dialog.querySelector('#modal-herb-duration').value) || 90;
            const plantTypeInput = dialog.querySelector('input[name="plantType"]:checked');
            const plantType = plantTypeInput ? plantTypeInput.value : 'plant';

            if (!name) return;

            // Generate automatic steps based on plant type
            const autoSteps = [];
            if (plantType === 'tea') {
              autoSteps.push({
                stepNo: 1, dayNumber: 1, dayLabel: 'วันที่ 1',
                title: 'เตรียมดินและลงต้นกล้าชา', advice: 'ใช้ดินร่วนซุย ระบายน้ำดี', detail: 'ย้ายต้นกล้าลงแปลง รดน้ำให้ชุ่ม', color: 'emerald', icon: 'fa-seedling'
              });
              autoSteps.push({
                stepNo: 2, dayNumber: Math.max(2, Math.floor(duration * 0.2)), dayLabel: `วันที่ ${Math.floor(duration * 0.2)}`,
                title: 'ใส่ปุ๋ยบำรุงใบชาครั้งที่ 1', advice: 'เน้นไนโตรเจนอินทรีย์', detail: 'ใส่ปุ๋ยหมักรอบโคนต้น เพื่อเร่งการแตกยอดอ่อน', color: 'teal', icon: 'fa-water'
              });
              autoSteps.push({
                stepNo: 3, dayNumber: Math.max(3, Math.floor(duration * 0.5)), dayLabel: `วันที่ ${Math.floor(duration * 0.5)}`,
                title: 'ใส่ปุ๋ยบำรุงใบชาครั้งที่ 2 และตัดแต่งกิ่ง', advice: 'รักษาทรงพุ่ม', detail: 'บำรุงด้วยปุ๋ยคอก ตัดแต่งกิ่งให้โปร่งรับแสงแดด', color: 'teal', icon: 'fa-water'
              });
              autoSteps.push({
                stepNo: 4, dayNumber: duration, dayLabel: `วันที่ ${duration}`,
                title: 'เก็บเกี่ยวยอดชา', advice: 'เก็บเฉพาะยอดอ่อน 1 ยอด 2 ใบ', detail: 'เก็บเกี่ยวในช่วงเช้า เพื่อคงคุณภาพกลิ่นและรสชาติ', color: 'rose', icon: 'fa-basket-shopping'
              });
            } else if (plantType === 'plant') {
              // Standard Plant
              autoSteps.push({
                stepNo: 1, dayNumber: 1, dayLabel: 'วันที่ 1',
                title: 'เตรียมดินและเริ่มปลูก', advice: 'เตรียมดินให้ร่วนซุย', detail: 'เริ่มเพาะเมล็ดหรือลงกล้า', color: 'emerald', icon: 'fa-seedling'
              });
              autoSteps.push({
                stepNo: 2, dayNumber: Math.max(2, Math.floor(duration * 0.2)), dayLabel: `วันที่ ${Math.floor(duration * 0.2)}`,
                title: 'ใส่ปุ๋ยบำรุงรอบแรก', advice: 'เร่งรากและใบ', detail: 'ใส่ปุ๋ยหมักหรือปุ๋ยคอก', color: 'teal', icon: 'fa-water'
              });
              autoSteps.push({
                stepNo: 3, dayNumber: Math.max(3, Math.floor(duration * 0.6)), dayLabel: `วันที่ ${Math.floor(duration * 0.6)}`,
                title: 'ใส่ปุ๋ยบำรุงรอบสอง', advice: 'เร่งดอกและผลผลิต', detail: 'เสริมธาตุอาหารหลักก่อนเก็บเกี่ยว', color: 'amber', icon: 'fa-spa'
              });
              autoSteps.push({
                stepNo: 4, dayNumber: duration, dayLabel: `วันที่ ${duration}`,
                title: 'เก็บเกี่ยวผลผลิต', advice: 'เก็บเกี่ยวในช่วงเวลาที่เหมาะสม', detail: 'รีบจัดส่งหรือเข้าโรงอบเพื่อรักษาคุณภาพ', color: 'rose', icon: 'fa-basket-shopping'
              });
            }

            appState.saveHerbRoadmap(name, {
              name,
              icon: plantType === 'tea' ? '🍵' : (plantType === 'plant' ? '🌿' : '✨'),
              description: `แผนการเพาะปลูกและกำหนดการดูแลรักษาสำหรับ ${name}`,
              durationDays: duration,
              cycleText: `ระยะเวลาเพาะปลูกรวมประมาณ ${duration} วัน`,
              steps: autoSteps
            });

            this.selectedHerb = name;
            closeGlobalModal();
            showToast(`เพิ่มพืช "${name}" เรียบร้อยแล้ว ท่านสามารถกดเพิ่มขั้นตอนได้ทันที`, 'success');
            this.refresh();
          });
        }
      }
    });
  }
};
