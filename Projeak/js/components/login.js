// Login Component for Authentication
import { appState } from '../state.js';
import { showToast } from '../helpers.js';

export const LoginComponent = {
  render() {
    const enterprise = appState.getEnterprise();
    const demoUsers = appState.getDemoUsers();

    return `
      <div class="fade-in max-w-xl mx-auto py-6 md:py-12">
        <div class="glass-card bg-white rounded-3xl p-6 md:p-10 shadow-2xl border border-emerald-100/80 relative overflow-hidden">
          
          <!-- Decorative Top Accent Banner -->
          <div class="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-800 via-emerald-600 to-teal-500"></div>

          <!-- Header Logo & Branding -->
          <div class="text-center space-y-3 mb-8 pt-2">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-900/20 border border-white/20">
              <i class="fas fa-leaf text-3xl text-green-300"></i>
            </div>
            <div>
              <span class="text-xs font-extrabold text-emerald-700 tracking-wider uppercase block">ระบบบริหารจัดการและบัญชี</span>
              <h1 class="text-2xl md:text-3xl font-extrabold text-gray-900 mt-1">${enterprise.name}</h1>
              <p class="text-xs text-gray-500 mt-1">กรุณาล็อกอินด้วยบัญชีผู้ใช้งานเพื่อเข้าถึงระบบจัดการวิสาหกิจ</p>
            </div>
          </div>

          <!-- Alert error banner (Hidden by default) -->
          <div id="login-error-alert" class="hidden mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-3">
            <i class="fas fa-exclamation-circle text-lg text-red-500 flex-shrink-0"></i>
            <span id="login-error-msg">ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง</span>
          </div>

          <!-- Login Form -->
          <form id="login-form" class="space-y-5">
            <!-- Username Input -->
            <div>
              <label for="login-username" class="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1.5">
                <i class="fas fa-home text-emerald-700"></i> เลขที่บ้าน (เลขที่บ้านผู้ใช้งาน) *
              </label>
              <div class="relative">
                <input type="text" id="login-username" name="username" required placeholder="เช่น 12/4 หรือ 45/1"
                  class="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-gray-50/50 focus:bg-white">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                  <i class="fas fa-home text-base"></i>
                </span>
              </div>
            </div>

            <!-- Password Input -->
            <div>
              <label for="login-password" class="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center justify-between">
                <span class="flex items-center gap-1.5"><i class="fas fa-phone text-emerald-700"></i> เบอร์โทรศัพท์ (รหัสผ่าน) *</span>
              </label>
              <div class="relative">
                <input type="password" id="login-password" name="password" required placeholder="เบอร์โทรศัพท์มือถือ 10 หลัก"
                  class="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-gray-50/50 focus:bg-white">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                  <i class="fas fa-lock text-base"></i>
                </span>
                <button type="button" id="toggle-password-btn" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none">
                  <i class="fas fa-eye text-sm" id="toggle-password-icon"></i>
                </button>
              </div>
            </div>

            <!-- Submit Button -->
            <button type="submit" id="login-submit-btn"
              class="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-900 hover:to-emerald-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group">
              <span>เข้าสู่ระบบ (Login)</span>
              <i class="fas fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
            </button>
          </form>

          <!-- Divider -->
          <div class="relative my-8 text-center">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-200"></div></div>
            <span class="relative bg-white px-4 text-xs font-semibold text-gray-400">หรือ ทดสอบเข้าใช้งานด้วยบัญชีสาธิต 1-Click</span>
          </div>

          <!-- Quick 1-Click Demo Login Buttons -->
          <div class="space-y-2.5">
            <span class="block text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">คลิกเลือกบทบาทเพื่อล็อกอินทันที</span>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              <!-- Admin Demo Button -->
              <button type="button" data-demo-user="12/4" data-demo-pass="0812345600"
                class="demo-login-btn p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-left transition-all group flex flex-col justify-between">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-extrabold text-emerald-900">👑 ประธาน/Admin</span>
                  <i class="fas fa-chevron-right text-[10px] text-emerald-600 group-hover:translate-x-0.5 transition-transform"></i>
                </div>
                <span class="text-[10px] text-emerald-700 block mt-1">เลขที่บ้าน: <b>12/4</b></span>
              </button>

              <!-- Officer Demo Button -->
              <button type="button" data-demo-user="45/1" data-demo-pass="0812345699"
                class="demo-login-btn p-3 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100 text-left transition-all group flex flex-col justify-between">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-extrabold text-amber-900">💰 เหรัญญิก/Officer</span>
                  <i class="fas fa-chevron-right text-[10px] text-amber-600 group-hover:translate-x-0.5 transition-transform"></i>
                </div>
                <span class="text-[10px] text-amber-700 block mt-1">เลขที่บ้าน: <b>45/1</b></span>
              </button>

              <!-- Member Demo Button -->
              <button type="button" data-demo-user="12/5" data-demo-pass="0812345602"
                class="demo-login-btn p-3 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-left transition-all group flex flex-col justify-between">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-extrabold text-blue-900">🌾 เกษตรกร (MEM-002)</span>
                  <i class="fas fa-chevron-right text-[10px] text-blue-600 group-hover:translate-x-0.5 transition-transform"></i>
                </div>
                <span class="text-[10px] text-blue-700 block mt-1">เลขที่บ้าน: <b>12/5</b></span>
              </button>

            </div>
          </div>

          <!-- Public Consumer Note -->
          <div class="mt-8 pt-4 border-t border-gray-100 text-center">
            <p class="text-[11px] text-gray-400">
              <i class="fas fa-qrcode mr-1 text-emerald-600"></i>
              ผู้บริโภคทั่วไปที่สแกน QR Code เพื่อตรวจสอบย้อนกลับสินค้า สามารถดูข้อมูลได้ทันทีโดยไม่ต้องเข้าสู่ระบบ
            </p>
          </div>

        </div>
      </div>
    `;
  },

  init() {
    const form = document.getElementById('login-form');
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const togglePassBtn = document.getElementById('toggle-password-btn');
    const togglePassIcon = document.getElementById('toggle-password-icon');
    const errorAlert = document.getElementById('login-error-alert');
    const errorMsg = document.getElementById('login-error-msg');
    const demoBtns = document.querySelectorAll('.demo-login-btn');

    // Show/Hide password toggle
    if (togglePassBtn && passwordInput && togglePassIcon) {
      togglePassBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassIcon.className = type === 'password' ? 'fas fa-eye text-sm' : 'fas fa-eye-slash text-sm text-emerald-700';
      });
    }

    // Process Login Form Submission
    const performLogin = (username, password) => {
      if (errorAlert) errorAlert.classList.add('hidden');

      try {
        const user = appState.login(username, password);
        showToast(`ยินดีต้อนรับ ${user.name} (${user.role}) เข้าสู่ระบบ`);
        window.location.hash = '#dashboard';
      } catch (err) {
        if (errorAlert && errorMsg) {
          errorMsg.textContent = err.message;
          errorAlert.classList.remove('hidden');
        } else {
          showToast(err.message, 'error');
        }
      }
    };

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput ? usernameInput.value : '';
        const password = passwordInput ? passwordInput.value : '';
        performLogin(username, password);
      });
    }

    // Bind 1-Click Demo Login Buttons
    demoBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const u = btn.getAttribute('data-demo-user');
        const p = btn.getAttribute('data-demo-pass');
        if (usernameInput) usernameInput.value = u;
        if (passwordInput) passwordInput.value = p;
        performLogin(u, p);
      });
    });
  }
};
