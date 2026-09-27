// Settings Component for Enterprise Configuration
import { appState } from '../state.js';
import { showToast } from '../helpers.js';

export const SettingsComponent = {
  render() {
    const profile = appState.getEnterprise();
    
    return `
      <div class="fade-in max-w-4xl mx-auto">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <i class="fa-solid fa-gear text-emerald-700"></i>
              ตั้งค่าข้อมูลวิสาหกิจชุมชน
            </h1>
            <p class="text-sm text-gray-500 mt-1">ตั้งค่าชื่อกลุ่ม ที่อยู่ และข้อมูลพื้นฐานสำหรับใช้งานในระบบให้สอดคล้องกับแต่ละพื้นที่</p>
          </div>
        </div>

        <!-- Form Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <form id="settings-form" class="space-y-6">
            
            <div class="border-b border-gray-100 pb-4">
              <h3 class="text-lg font-medium text-emerald-800 flex items-center gap-2">
                <i class="fas fa-home"></i> ข้อมูลกลุ่มเบื้องต้น
              </h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Name -->
              <div class="md:col-span-2">
                <label for="ent-name" class="block text-sm font-medium text-gray-700 mb-2">ชื่อกลุ่มวิสาหกิจชุมชน *</label>
                <input type="text" id="ent-name" name="name" value="${profile.name}" required
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>

              <!-- Chairman -->
              <div>
                <label for="ent-chairman" class="block text-sm font-medium text-gray-700 mb-2">ประธานวิสาหกิจชุมชน</label>
                <input type="text" id="ent-chairman" name="chairman" value="${profile.chairman || ''}"
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>

              <!-- Phone -->
              <div>
                <label for="ent-phone" class="block text-sm font-medium text-gray-700 mb-2">เบอร์โทรศัพท์ติดต่อ *</label>
                <input type="text" id="ent-phone" name="phone" value="${profile.phone}" required
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>

              <!-- Email -->
              <div class="md:col-span-2">
                <label for="ent-email" class="block text-sm font-medium text-gray-700 mb-2">อีเมลติดต่อ</label>
                <input type="email" id="ent-email" name="email" value="${profile.email || ''}"
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>

              <!-- Description -->
              <div class="md:col-span-2">
                <label for="ent-desc" class="block text-sm font-medium text-gray-700 mb-2">คำอธิบายกลุ่ม / วัตถุประสงค์</label>
                <textarea id="ent-desc" name="description" rows="3"
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">${profile.description || ''}</textarea>
              </div>
            </div>

            <div class="border-b border-gray-100 pb-4 pt-4">
              <h3 class="text-lg font-medium text-emerald-800 flex items-center gap-2">
                <i class="fas fa-map-marker-alt"></i> ที่ตั้งสำนักงานวิสาหกิจ
              </h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- Village -->
              <div>
                <label for="ent-village" class="block text-sm font-medium text-gray-700 mb-2">หมู่บ้าน/หมู่ที่ *</label>
                <input type="text" id="ent-village" name="village" value="${profile.village}" required
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" placeholder="เช่น หมู่ 4 บ้านหนองเขียว">
              </div>

              <!-- Sub-district -->
              <div>
                <label for="ent-subdistrict" class="block text-sm font-medium text-gray-700 mb-2">ตำบล *</label>
                <input type="text" id="ent-subdistrict" name="subdistrict" value="${profile.subdistrict}" required
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>

              <!-- District -->
              <div>
                <label for="ent-district" class="block text-sm font-medium text-gray-700 mb-2">อำเภอ *</label>
                <input type="text" id="ent-district" name="district" value="${profile.district}" required
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>

              <!-- Province -->
              <div>
                <label for="ent-province" class="block text-sm font-medium text-gray-700 mb-2">จังหวัด *</label>
                <input type="text" id="ent-province" name="province" value="${profile.province}" required
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>

              <!-- Zipcode -->
              <div>
                <label for="ent-zipcode" class="block text-sm font-medium text-gray-700 mb-2">รหัสไปรษณีย์ *</label>
                <input type="text" id="ent-zipcode" name="zipcode" value="${profile.zipcode}" required
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
              </div>
            </div>

            <!-- Supabase Database Connection Config -->
            <div class="border-b border-gray-100 pb-4 pt-4">
              <h3 class="text-lg font-medium text-emerald-800 flex items-center gap-2">
                <i class="fas fa-database"></i> เชื่อมต่อฐานข้อมูล Supabase (ระบบคลาวด์ออนไลน์)
              </h3>
            </div>

            <div class="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-xs text-emerald-800 leading-relaxed">
              <i class="fas fa-info-circle mr-1 text-emerald-700"></i>
              เมื่อเชื่อมต่อกับ Supabase ข้อมูลวิสาหกิจทั้งหมดจะซิงค์และบันทึกออนไลน์ร่วมกันทันที หากปล่อยช่องว่างไว้ระบบจะสลับใช้ LocalStorage ของเบราว์เซอร์เครื่องนี้โดยอัตโนมัติ
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Supabase URL -->
              <div class="md:col-span-2">
                <label for="sup-url" class="block text-sm font-medium text-gray-700 mb-2">Supabase Project URL</label>
                <input type="url" id="sup-url" name="supabaseUrl" value="${localStorage.getItem('supabase_url') || ''}" placeholder="เช่น https://xxxxxx.supabase.co"
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-mono">
              </div>

              <!-- Supabase Anon Key -->
              <div class="md:col-span-2">
                <label for="sup-key" class="block text-sm font-medium text-gray-700 mb-2">Supabase Anon Key</label>
                <input type="text" id="sup-key" name="supabaseKey" value="${localStorage.getItem('supabase_key') || ''}" placeholder="เช่น eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-mono">
              </div>
            </div>

            <!-- Demo Simulation Reset Section -->
            <div class="border-t border-gray-100 pt-6">
              <div class="p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 class="text-sm font-bold text-amber-950 flex items-center gap-2">
                    <i class="fas fa-arrows-rotate text-amber-600"></i> จำลองระบบใหม่ทั้งหมด (Reset All Simulation Data)
                  </h4>
                  <p class="text-xs text-amber-800/80 mt-1">รีเซ็ตข้อมูลจำลองทั้งหมดให้กลับสู่ค่าเริ่มต้นล่าสุด (ผลผลิตสด, การอบแห้ง, การบรรจุกระป๋อง 50G, แคตตาล็อกสินค้า และประวัติการขาย)</p>
                </div>
                <button type="button" id="reset-all-sim-btn"
                  class="px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 shrink-0">
                  <i class="fas fa-arrows-rotate"></i> จำลองเว็บใหม่
                </button>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-end pt-4 gap-3">
              <button type="button" id="reset-settings-btn"
                class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none">
                รีเซ็ตเฉพาะข้อมูลกลุ่ม
              </button>
              <button type="submit"
                class="px-6 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-sm focus:outline-none flex items-center gap-2">
                <i class="fas fa-save"></i> บันทึกการเปลี่ยนแปลง
              </button>
            </div>

          </form>
        </div>
      </div>
    `;
  },

  init() {
    const form = document.getElementById('settings-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const updatedProfile = {
        name: formData.get('name'),
        chairman: formData.get('chairman'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        description: formData.get('description'),
        village: formData.get('village'),
        subdistrict: formData.get('subdistrict'),
        district: formData.get('district'),
        province: formData.get('province'),
        zipcode: formData.get('zipcode')
      };

      const supabaseUrlVal = formData.get('supabaseUrl') ? formData.get('supabaseUrl').trim() : '';
      const supabaseKeyVal = formData.get('supabaseKey') ? formData.get('supabaseKey').trim() : '';

      try {
        if (supabaseUrlVal && supabaseKeyVal) {
          localStorage.setItem('supabase_url', supabaseUrlVal);
          localStorage.setItem('supabase_key', supabaseKeyVal);
        } else {
          localStorage.removeItem('supabase_url');
          localStorage.removeItem('supabase_key');
        }

        appState.saveEnterprise(updatedProfile);

        // Re-initialize Supabase connection and sync data!
        showToast('กำลังบันทึกและเชื่อมต่อ Supabase...');
        
        appState.initSupabase();
        
        appState.syncFromSupabase().then(() => {
          showToast('บันทึกข้อมูลวิสาหกิจและซิงค์ฐานข้อมูลสำเร็จ');
          const main = document.getElementById('app-view');
          if (main) {
            main.innerHTML = this.render();
            this.init();
          }
        }).catch(err => {
          showToast('เชื่อมต่อ Supabase สำเร็จ แต่พบข้อผิดพลาดในการโหลดข้อมูล: ' + err.message, 'warning');
        });
      } catch (err) {
        showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message, 'error');
      }
    });

    const resetBtn = document.getElementById('reset-settings-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('คุณต้องการรีเซ็ตค่าระบบตั้งต้นของระบบสาธิตใช่หรือไม่?')) {
          localStorage.removeItem('herb_enterprise_profile');
          appState.init();
          // Reload settings view
          const main = document.getElementById('app-view');
          if (main) {
            main.innerHTML = this.render();
            this.init();
          }
          showToast('รีเซ็ตข้อมูลวิสาหกิจแล้ว');
          
          // Force update main title
          const profile = appState.getEnterprise();
          if (appState.onEnterpriseChange) {
            appState.onEnterpriseChange(profile);
          }
        }
      });
    }

    const resetAllSimBtn = document.getElementById('reset-all-sim-btn');
    if (resetAllSimBtn) {
      resetAllSimBtn.addEventListener('click', () => {
        if (confirm('ต้องการรีเซ็ตและจำลองข้อมูลเว็บใหม่ทั้งหมดใช่หรือไม่? ข้อมูลสาธิตทุกส่วนจะถูกสร้างใหม่ตามการตั้งค่าล่าสุด')) {
          appState.resetAllSimulationData();
          showToast('จำลองข้อมูลระบบใหม่ทั้งหมดสำเร็จ', 'success');
          setTimeout(() => {
            window.location.reload();
          }, 400);
        }
      });
    }
  }
};
