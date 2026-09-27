// Public Traceability and Product Authentication Page
import { appState } from '../state.js';
import { formatThaiDate } from '../helpers.js';

let traceMapInstance = null;

export const TraceabilityComponent = {
  currentCropId: null,

  render() {
    const cropId = this.currentCropId || window.location.hash.split('/')[1] || 'CROP-003';
    const crop = appState.getCropById(cropId);
    const plots = appState.getPlots();
    const members = appState.getMembers();
    const enterprise = appState.getEnterprise();

    if (!crop) {
      return `
        <div class="fade-in max-w-xl mx-auto py-12 text-center space-y-4">
          <i class="fas fa-exclamation-triangle text-6xl text-red-400"></i>
          <h2 class="text-xl font-bold text-gray-800">ไม่พบล็อตผลผลิตสมุนไพรอบแห้งนี้</h2>
          <p class="text-sm text-gray-500">กรุณาตรวจสอบรหัสสแกนตรวจสอบย้อนกลับ หรือคิวอาร์โค้ดบนบรรจุภัณฑ์อีกครั้ง</p>
          <a href="#" class="inline-block mt-4 px-5 py-2.5 bg-emerald-800 text-white text-sm font-semibold rounded-xl">กลับสู่แดชบอร์ดหลัก</a>
        </div>
      `;
    }

    const plot = plots.find(p => p.id === crop.plotId);
    const owners = plot ? members.filter(m => plot.memberIds && plot.memberIds.includes(m.id)) : [];
    const ownersNames = owners.map(o => o.name).join(', ') || '-';
    const ownersVillages = owners.map(o => o.villageNumber).filter((v, idx, self) => self.indexOf(v) === idx).join('/') || '-';
    const isChrys = plot && plot.plantType === 'เก๊กฮวย';

    const ratio = isChrys ? 8 : 6;
    const dryWeight = crop.yield ? (crop.yield / ratio).toFixed(2) : '-';

    // Fertilizing history logs for trace-back
    const logsHtml = (crop.fertilizingLog || []).map(f => `
      <div class="relative pl-8 pb-5 last:pb-0 border-l-2 border-dashed border-emerald-200 last:border-transparent">
        <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center">
          <i class="fas fa-check text-[8px] text-white"></i>
        </div>
        <div class="text-xs font-semibold text-emerald-800">${formatThaiDate(f.date)}</div>
        <div class="text-sm font-bold text-gray-800 mt-0.5">${f.type}</div>
        <div class="text-xs text-gray-500">ปริมาณการใช้งาน: ${f.amount}</div>
      </div>
    `).join('');

    return `
      <div class="fade-in max-w-2xl mx-auto space-y-6 pb-12">
        
        <!-- Navigation bar to return to dashboard -->
        <div class="flex items-center justify-between px-1">
          <a href="#dashboard" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold transition-all shadow-xs border border-gray-200">
            <i class="fas fa-arrow-left"></i> กลับสู่ระบบหลัก (Dashboard)
          </a>
          <span class="text-xs font-bold text-gray-500 bg-white px-3 py-1.5 rounded-xl border border-gray-200">
            <i class="fas fa-qrcode text-emerald-600 mr-1"></i> สายตรวจสอบ (Traceability Step F)
          </span>
        </div>

        <!-- Standalone Public Header (Certified badge) -->
        <div class="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-center relative overflow-hidden">
          <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full translate-x-8 -translate-y-8"></div>
          
          <div class="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center border-4 border-emerald-100 text-emerald-700 text-2xl mb-3 pulse-emerald">
            <i class="fas fa-shield-alt"></i>
          </div>
          
          <span class="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-1">ใบรับรองการผลิตออร์แกนิก</span>
          <h1 class="text-xl font-extrabold text-gray-800">ระบบตรวจสอบย้อนกลับวิสาหกิจชุมชน</h1>
          <p class="text-xs text-gray-400 mt-1">${enterprise.name}</p>

          <div class="mt-4 px-4 py-2 bg-emerald-50 text-emerald-900 rounded-full text-xs font-bold border border-emerald-100 inline-block">
            <i class="fas fa-check-circle mr-1 text-emerald-600"></i> ล็อตผลผลิตนี้ผ่านการรับรองและสามารถยืนยันความปลอดภัยได้จริง
          </div>
        </div>

        <!-- Product Lot details card -->
        <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <span class="text-xs font-mono font-bold text-gray-400">รหัสตรวจสอบ: ${crop.id} | ปีการเพาะปลูก พ.ศ. ${crop.cropYear || '-'}</span>
            <span class="px-2.5 py-1 text-xs font-bold rounded-full ${
              isChrys ? 'badge-chrysanthemum' : 'badge-chamomile'
            }">
              ${plot ? plot.plantType : '-'}อบแห้ง
            </span>
          </div>

          <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4 border-b border-gray-100 pb-4">
              <div>
                <span class="text-[10px] text-gray-400 block uppercase font-bold">เกษตรกรผู้ปลูก</span>
                <span class="text-sm font-bold text-gray-800">${ownersNames}</span>
                <span class="text-xs text-gray-500 block">${ownersVillages} ต.${enterprise.subdistrict}</span>
              </div>
              <div>
                <span class="text-[10px] text-gray-400 block uppercase font-bold">แปลงเพาะปลูก</span>
                <span class="text-sm font-bold text-gray-800">${plot ? plot.name : '-'}</span>
                <span class="text-xs text-gray-500 block">ขนาด ${plot ? formatThaiDate(crop.plantDate) : '-'}</span>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="p-3 bg-gray-50 rounded-2xl">
                <span class="text-[9px] text-gray-400 block">วันเริ่มเพาะปลูก</span>
                <span class="text-xs font-bold text-gray-800">${formatThaiDate(crop.plantDate)}</span>
              </div>
              <div class="p-3 bg-gray-50 rounded-2xl">
                <span class="text-[9px] text-gray-400 block">วันเก็บเกี่ยว</span>
                <span class="text-xs font-bold text-gray-800">${formatThaiDate(crop.harvestDateActual)}</span>
              </div>
              <div class="p-3 bg-gray-50 rounded-2xl">
                <span class="text-[9px] text-gray-400 block">ผลผลิตรวมแปรรูป</span>
                <span class="text-xs font-bold text-emerald-800">${dryWeight} กก. (แห้ง)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- interactive map for customer trace verification -->
        <div class="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
          <h4 class="text-xs font-bold text-gray-500 uppercase px-2 mb-2 flex items-center gap-1">
            <i class="fas fa-map-marked-alt text-emerald-600"></i> แผนที่ตั้งทางภูมิศาสตร์ของแปลงปลูกต้นทาง
          </h4>
          <div id="trace-map" class="small-map-container"></div>
        </div>

        <!-- timelines logs of care and fertilizing -->
        <div class="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h4 class="text-sm font-bold text-gray-700 border-b border-gray-100 pb-2">
            <i class="fas fa-tasks text-emerald-600 mr-1.5"></i>
            ไทม์ไลน์บันทึกกิจกรรมทางการเกษตรปลอดสารพิษ
          </h4>

          <div class="space-y-1 mt-4">
            <!-- Starting planting -->
            <div class="relative pl-8 pb-5 border-l-2 border-emerald-200">
              <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-800 border-2 border-white flex items-center justify-center">
                <i class="fas fa-seedling text-[8px] text-white"></i>
              </div>
              <div class="text-xs font-semibold text-emerald-800">${formatThaiDate(crop.plantDate)}</div>
              <div class="text-sm font-bold text-gray-800 mt-0.5">เริ่มลงกล้าและเตรียมดินเพาะปลูก</div>
              <div class="text-xs text-gray-500">ใช้ดินชีวภาพผสมมูลปุ๋ยอินทรีย์ ปราศจากสารเคมีเร่งเคมีทางเคมีทุกประเภท</div>
            </div>

            <!-- Caring/Fertilizing logs dynamically rendered -->
            ${logsHtml}

            <!-- Harvesting -->
            <div class="relative pl-8 pb-5 border-l-2 border-emerald-200">
              <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center">
                <i class="fas fa-shopping-basket text-[8px] text-white"></i>
              </div>
              <div class="text-xs font-semibold text-emerald-800">${formatThaiDate(crop.harvestDateActual)}</div>
              <div class="text-sm font-bold text-gray-800 mt-0.5">เก็บเกี่ยวดอกสมุนไพรสด</div>
              <div class="text-xs text-gray-500">คัดเลือกเฉพาะดอกตูมเต็มวัยด้วยมือ ปริมาณเก็บเกี่ยวสดรวม ${crop.yield || '-'} กก.</div>
            </div>

            <!-- Drying process -->
            <div class="relative pl-8">
              <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center">
                <i class="fas fa-fire text-[8px] text-white"></i>
              </div>
              <div class="text-xs font-semibold text-emerald-800">${formatThaiDate(crop.harvestDateActual)} (วันเดียวกัน)</div>
              <div class="text-sm font-bold text-gray-800 mt-0.5">เข้าตู้อบลมร้อนความชื้นต่ำและคัดแยกเกรดบรรจุ</div>
              <div class="text-xs text-gray-500">อบด้วยอุณหภูมิควบคุมไม่เกิน 50°C เพื่อคงความหอมและปริมาณน้ำมันหอมระเหยให้สูงสุด ได้น้ำหนักอบแห้งสุทธิ ${dryWeight} กก.</div>
            </div>
          </div>
        </div>

        <!-- Chemical free guarantee seal -->
        <div class="p-5 bg-emerald-800 rounded-3xl text-white text-center flex flex-col items-center justify-center space-y-2 shadow-lg">
          <i class="fas fa-seedling text-3xl text-green-300"></i>
          <h4 class="font-extrabold text-sm uppercase tracking-wider">ใบรับรองมาตรฐานกลุ่มวิสาหกิจ</h4>
          <p class="text-xs text-emerald-100 max-w-sm leading-relaxed">
            ผลผลิตล็อตนี้ผลิตขึ้นภายใต้กระบวนการเกษตรอินทรีย์ ได้มาตรฐานกลุ่มวิสาหกิจ ปราศจากยาฆ่าแมลง สารเคมีกำจัดศัตรูพืช และการอาบน้ำยาซัลเฟอร์ 100%
          </p>
        </div>

        <!-- Back link -->
        <div class="text-center pt-2">
          <a href="#" class="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center justify-center gap-1">
            <i class="fas fa-chevron-left text-[10px]"></i> กลับเข้าสู่หน้าแดชบอร์ดหลัก (เจ้าหน้าที่)
          </a>
        </div>

      </div>
    `;
  },

  init() {
    this.initTraceMap();
  },

  initTraceMap() {
    if (typeof L === 'undefined') {
      console.error('Leaflet is not loaded for Trace page');
      return;
    }

    if (traceMapInstance !== null) {
      traceMapInstance.remove();
      traceMapInstance = null;
    }

    const cropId = this.currentCropId || window.location.hash.split('/')[1] || 'CROP-003';
    const crop = appState.getCropById(cropId);
    if (!crop) return;

    const plots = appState.getPlots();
    const plot = plots.find(p => p.id === crop.plotId);
    if (!plot) return;

    const lat = plot.lat;
    const lng = plot.lng;

    // Initialize Map for traceback
    traceMapInstance = L.map('trace-map', {
      zoomControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false
    }).setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OSM'
    }).addTo(traceMapInstance);

    // Marker div
    const traceIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center bg-emerald-800 text-white font-bold pulse-emerald"><i class="fas fa-shield-alt"></i></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    L.marker([lat, lng], { icon: traceIcon }).addTo(traceMapInstance);
  }
};
