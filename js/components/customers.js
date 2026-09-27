// Customers Component for Customer Management & Purchase Tracking (ออกแบบตามหลักสากล CRM)
import { appState } from '../state.js';
import { formatThaiDate, formatBaht, showToast, openGlobalModal, closeGlobalModal } from '../helpers.js';

export const CustomersComponent = {
  searchQuery: '',
  selectedTypeFilter: '',
  viewMode: 'table', // 'table' or 'cards'
  editingCustomerId: null,
  viewingHistoryCustomerId: null,

  // Helper to extract customer initials for avatar
  getInitials(name = '') {
    const clean = name.replace(/^(ร้าน|คุณ|บริษัท|หจก\.|กลุ่ม)/g, '').trim();
    return clean.slice(0, 2) || 'C';
  },

  // Helper for customer type badge and avatar color
  getTypeMeta(type = '') {
    switch (type) {
      case 'ร้านคาเฟ่/ร้านขายของฝาก':
        return {
          badge: 'bg-amber-100 text-amber-900 border-amber-200',
          avatarBg: 'bg-amber-100 text-amber-800 border border-amber-200',
          icon: 'fa-solid fa-mug-saucer'
        };
      case 'ตัวแทนจำหน่าย':
        return {
          badge: 'bg-blue-100 text-blue-900 border-blue-200',
          avatarBg: 'bg-blue-100 text-blue-800 border border-blue-200',
          icon: 'fa-solid fa-store'
        };
      case 'ซื้อส่งโรงงาน':
        return {
          badge: 'bg-purple-100 text-purple-900 border-purple-200',
          avatarBg: 'bg-purple-100 text-purple-800 border border-purple-200',
          icon: 'fa-solid fa-industry'
        };
      case 'ลูกค้าทั่วไป':
      default:
        return {
          badge: 'bg-emerald-100 text-emerald-900 border-emerald-200',
          avatarBg: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
          icon: 'fa-solid fa-user'
        };
    }
  },

  render() {
    const currentUser = appState.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'Member';

    if (isMember) {
      return `
        <div class="p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
          <i class="fas fa-lock text-4xl text-gray-400 mb-3"></i>
          <h2 class="text-base font-bold text-gray-700">สิทธิ์การเข้าถึงถูกจำกัด</h2>
          <p class="text-xs text-gray-400 mt-1">ส่วนงานนี้สำหรับประธานกลุ่มและเจ้าหน้าที่/เหรัญญิกเท่านั้น</p>
        </div>
      `;
    }

    const customers = appState.getCustomers();
    const allSales = appState.getSales();

    // Compute metrics
    const totalCustomers = customers.length;
    const cafeCount = customers.filter(c => c.customerType === 'ร้านคาเฟ่/ร้านขายของฝาก').length;
    const distributorCount = customers.filter(c => c.customerType === 'ตัวแทนจำหน่าย').length;
    const factoryCount = customers.filter(c => c.customerType === 'ซื้อส่งโรงงาน').length;
    const generalCount = customers.filter(c => c.customerType === 'ลูกค้าทั่วไป' || !c.customerType).length;

    // Filter customers
    const filteredCustomers = customers.filter(c => {
      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        (c.id && c.id.toLowerCase().includes(q)) ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.lineId && c.lineId.toLowerCase().includes(q)) ||
        (c.facebook && c.facebook.toLowerCase().includes(q)) ||
        (c.contactChannel && c.contactChannel.toLowerCase().includes(q));

      const matchType = !this.selectedTypeFilter || c.customerType === this.selectedTypeFilter;
      return matchSearch && matchType;
    });

    const getCustomerSalesStats = (cust) => {
      const custSales = allSales.filter(s => s.customerId === cust.id || s.customer === cust.name || (s.customerName && s.customerName === cust.name));
      const totalAmount = custSales.reduce((sum, s) => sum + (parseFloat(s.totalPrice) || 0), 0);
      const orderCount = custSales.length;
      return { orderCount, totalAmount, sales: custSales };
    };

    // Table Rows HTML (แยก คอลัมน์: ชื่อ, ที่อยู่, เบอร์โทร, ไลน์, เฟส ตามหลักสากล)
    const tableRowsHtml = filteredCustomers.length === 0
      ? `<tr><td colspan="7" class="px-6 py-10 text-center text-sm text-gray-500">ไม่พบข้อมูลลูกค้าตรงตามเงื่อนไขการค้นหา</td></tr>`
      : filteredCustomers.map(c => {
          const stats = getCustomerSalesStats(c);
          const meta = this.getTypeMeta(c.customerType);
          const initials = this.getInitials(c.name);
          const cleanPhone = c.phone ? c.phone.replace(/[^0-9]/g, '') : '';
          const lineIdClean = c.lineId ? c.lineId.replace(/^@/, '') : '';
          const fbSearchUrl = c.facebook ? (c.facebook.startsWith('http') ? c.facebook : `https://www.facebook.com/search/top?q=${encodeURIComponent(c.facebook)}`) : '#';

          return `
            <tr class="hover:bg-emerald-50/30 border-b border-gray-100 last:border-0 transition-colors text-xs">
              
              <!-- 1. รหัสและชื่อลูกค้า (Customer & Organization) -->
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-2xl ${meta.avatarBg} flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                    ${initials}
                  </div>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-mono font-black text-emerald-900">${c.id}</span>
                      <span class="px-2 py-0.5 text-[10px] font-bold rounded-full border ${meta.badge}">
                        <i class="${meta.icon} mr-1 text-[9px]"></i>${c.customerType || 'ลูกค้าทั่วไป'}
                      </span>
                    </div>
                    <div class="text-sm font-extrabold text-gray-900 mt-0.5">${c.name}</div>
                  </div>
                </div>
              </td>

              <!-- 2. ที่อยู่จัดส่ง / สถานประกอบการ (Address) -->
              <td class="px-5 py-4 max-w-xs">
                <div class="text-xs text-gray-700 font-medium flex items-start gap-1.5 leading-relaxed">
                  <i class="fa-solid fa-location-dot text-rose-500 mt-0.5 shrink-0 text-xs"></i>
                  <span class="line-clamp-2" title="${c.address || '-'}">
                    ${c.address || '<span class="text-gray-400 italic">ไม่ระบุที่อยู่จัดส่ง</span>'}
                  </span>
                </div>
                ${c.address ? `
                  <button data-text="${c.address}" data-label="ที่อยู่ลูกค้า ${c.name}" class="copy-cust-btn text-[10px] font-bold text-gray-400 hover:text-emerald-700 mt-1 inline-flex items-center gap-1 transition cursor-pointer" title="คัดลอกที่อยู่สำหรับแปะกล่องพัสดุ">
                    <i class="fa-regular fa-copy"></i> คัดลอกที่อยู่
                  </button>
                ` : ''}
              </td>

              <!-- 3. เบอร์โทรศัพท์ (Phone) -->
              <td class="px-5 py-4 whitespace-nowrap">
                ${c.phone ? `
                  <a href="tel:${cleanPhone}" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-emerald-50 text-gray-800 hover:text-emerald-900 border border-gray-200 hover:border-emerald-300 font-bold text-xs transition shadow-2xs" title="คลิกเพื่อโทรออก">
                    <i class="fa-solid fa-phone text-emerald-600 text-[11px]"></i>
                    <span class="font-mono">${c.phone}</span>
                  </a>
                ` : `
                  <span class="text-xs text-gray-400 italic">-</span>
                `}
              </td>

              <!-- 4. ไลน์ (LINE ID) -->
              <td class="px-5 py-4 whitespace-nowrap">
                ${c.lineId ? `
                  <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs">
                    <i class="fa-brands fa-line text-[#06C755] text-base"></i>
                    <span class="font-mono text-gray-800">${c.lineId}</span>
                    <button data-text="${c.lineId}" data-label="LINE ID" class="copy-cust-btn text-gray-400 hover:text-emerald-700 ml-0.5 transition cursor-pointer" title="คัดลอก LINE ID">
                      <i class="fa-regular fa-copy text-[10px]"></i>
                    </button>
                  </div>
                ` : `
                  <span class="text-xs text-gray-400 italic">-</span>
                `}
              </td>

              <!-- 5. เฟสบุ๊ค (Facebook) -->
              <td class="px-5 py-4 whitespace-nowrap">
                ${c.facebook ? `
                  <a href="${fbSearchUrl}" target="_blank" rel="noopener noreferrer" 
                     class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs transition shadow-2xs" title="เปิดหน้า Facebook">
                    <i class="fa-brands fa-facebook text-[#1877F2] text-sm"></i>
                    <span class="truncate max-w-[120px]">${c.facebook}</span>
                    <i class="fa-solid fa-arrow-up-right-from-square text-[9px] opacity-70"></i>
                  </a>
                ` : `
                  <span class="text-xs text-gray-400 italic">-</span>
                `}
              </td>

              <!-- 6. ยอดสั่งซื้อสะสม (Lifetime Value - LTV) -->
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="text-sm font-black text-emerald-900">${formatBaht(stats.totalAmount)}</div>
                <div class="text-[10px] text-gray-400 font-semibold">${stats.orderCount} คำสั่งซื้อ</div>
              </td>

              <!-- 7. จัดการ (Actions) -->
              <td class="px-5 py-4 whitespace-nowrap text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <button data-id="${c.id}" class="view-cust-history-btn px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-2xs flex items-center gap-1" title="ดูประวัติการซื้อ">
                    <i class="fa-solid fa-receipt text-emerald-600"></i> ยอดซื้อ
                  </button>
                  <button data-id="${c.id}" class="edit-cust-btn p-2 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all shadow-2xs" title="แก้ไขข้อมูล">
                    <i class="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button data-id="${c.id}" class="delete-cust-btn p-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-all shadow-2xs" title="ลบลูกค้า">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </td>

            </tr>
          `;
        }).join('');

    // CRM Cards Grid View (มุมมองนามบัตรดิจิทัลตามหลักสากล)
    const cardsHtml = filteredCustomers.length === 0
      ? `<div class="col-span-full py-12 text-center text-sm text-gray-500 bg-white rounded-3xl border border-gray-100">ไม่พบข้อมูลลูกค้าตรงตามเงื่อนไขการค้นหา</div>`
      : filteredCustomers.map(c => {
          const stats = getCustomerSalesStats(c);
          const meta = this.getTypeMeta(c.customerType);
          const initials = this.getInitials(c.name);
          const cleanPhone = c.phone ? c.phone.replace(/[^0-9]/g, '') : '';
          const fbSearchUrl = c.facebook ? (c.facebook.startsWith('http') ? c.facebook : `https://www.facebook.com/search/top?q=${encodeURIComponent(c.facebook)}`) : '#';

          return `
            <div class="bg-white rounded-3xl border border-gray-100 p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4">
              
              <!-- Card Top: Customer Identity -->
              <div>
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl ${meta.avatarBg} flex items-center justify-center font-black text-base shrink-0 shadow-2xs">
                      ${initials}
                    </div>
                    <div>
                      <span class="text-xs font-mono font-black text-emerald-900">${c.id}</span>
                      <h3 class="text-base font-extrabold text-gray-900 leading-snug">${c.name}</h3>
                    </div>
                  </div>
                  <span class="px-2.5 py-1 text-[10px] font-bold rounded-full border ${meta.badge} shrink-0">
                    <i class="${meta.icon} mr-1"></i>${c.customerType || 'ลูกค้าทั่วไป'}
                  </span>
                </div>

                <!-- Structured Channels (แยก ที่อยู่, เบอร์โทร, ไลน์, เฟส) -->
                <div class="mt-4 pt-3.5 border-t border-gray-100 space-y-2.5 text-xs">
                  
                  <!-- ที่อยู่ -->
                  <div class="flex items-start gap-2 bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
                    <i class="fa-solid fa-location-dot text-rose-500 mt-0.5 shrink-0"></i>
                    <div class="flex-1 min-w-0">
                      <span class="text-[10px] font-bold text-gray-400 block uppercase">ที่อยู่จัดส่ง</span>
                      <div class="text-gray-800 line-clamp-2 leading-relaxed">${c.address || '<span class="text-gray-400 italic">ไม่ระบุที่อยู่</span>'}</div>
                    </div>
                    ${c.address ? `
                      <button data-text="${c.address}" data-label="ที่อยู่ลูกค้า" class="copy-cust-btn text-gray-400 hover:text-emerald-700 transition cursor-pointer p-1" title="คัดลอกที่อยู่">
                        <i class="fa-regular fa-copy text-xs"></i>
                      </button>
                    ` : ''}
                  </div>

                  <!-- เบอร์โทร -->
                  <div class="flex items-center justify-between bg-gray-50/70 px-3 py-2 rounded-xl border border-gray-100">
                    <div class="flex items-center gap-2">
                      <i class="fa-solid fa-phone text-emerald-600 text-xs"></i>
                      <span class="text-gray-800 font-bold font-mono">${c.phone || '-'}</span>
                    </div>
                    ${cleanPhone ? `
                      <a href="tel:${cleanPhone}" class="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] shadow-2xs transition flex items-center gap-1">
                        <i class="fa-solid fa-phone text-[9px]"></i> โทร
                      </a>
                    ` : ''}
                  </div>

                  <!-- ไลน์ & เฟสบุ๊ค กริดคู่ -->
                  <div class="grid grid-cols-2 gap-2">
                    
                    <!-- LINE -->
                    <div class="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/80 flex items-center justify-between">
                      <div class="flex items-center gap-1.5 min-w-0">
                        <i class="fa-brands fa-line text-[#06C755] text-lg shrink-0"></i>
                        <div class="truncate">
                          <span class="text-[9px] font-bold text-gray-400 block uppercase">LINE</span>
                          <span class="font-mono font-bold text-gray-800 text-[11px] block truncate">${c.lineId || '-'}</span>
                        </div>
                      </div>
                      ${c.lineId ? `
                        <button data-text="${c.lineId}" data-label="LINE ID" class="copy-cust-btn text-emerald-600 hover:text-emerald-800 p-1 transition cursor-pointer" title="คัดลอก LINE">
                          <i class="fa-regular fa-copy text-xs"></i>
                        </button>
                      ` : ''}
                    </div>

                    <!-- Facebook -->
                    <div class="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/80 flex items-center justify-between">
                      <div class="flex items-center gap-1.5 min-w-0">
                        <i class="fa-brands fa-facebook text-[#1877F2] text-lg shrink-0"></i>
                        <div class="truncate">
                          <span class="text-[9px] font-bold text-gray-400 block uppercase">Facebook</span>
                          <span class="font-bold text-gray-800 text-[11px] block truncate">${c.facebook || '-'}</span>
                        </div>
                      </div>
                      ${c.facebook ? `
                        <a href="${fbSearchUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 p-1 transition" title="เปิดเพจ Facebook">
                          <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                        </a>
                      ` : ''}
                    </div>

                  </div>

                </div>
              </div>

              <!-- Card Bottom: Sales Stats & Action Buttons -->
              <div class="pt-3.5 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span class="text-[10px] text-gray-400 font-bold block uppercase">ยอดซื้อสะสม</span>
                  <span class="text-base font-black text-emerald-900">${formatBaht(stats.totalAmount)}</span>
                  <span class="text-[10px] text-gray-500 font-medium block">(${stats.orderCount} คำสั่งซื้อ)</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <button data-id="${c.id}" class="view-cust-history-btn px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition shadow-2xs flex items-center gap-1">
                    <i class="fa-solid fa-receipt text-emerald-600"></i> ยอดซื้อ
                  </button>
                  <button data-id="${c.id}" class="edit-cust-btn p-2 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl transition shadow-2xs" title="แก้ไข">
                    <i class="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button data-id="${c.id}" class="delete-cust-btn p-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition shadow-2xs" title="ลบ">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>

            </div>
          `;
        }).join('');

    return `
      <div class="fade-in space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-black text-gray-900 flex items-center gap-2.5">
              <span class="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-sm">
                <i class="fa-solid fa-handshake text-lg"></i>
              </span>
              <span>ข้อมูลลูกค้า (Customer Relationship Management)</span>
            </h1>
            <p class="text-xs sm:text-sm text-gray-500 mt-1">
              ระบบทะเบียนฐานข้อมูลลูกค้าและคู่ค้า แยกข้อมูลชื่อ ที่อยู่ เบอร์โทรศัพท์ LINE ID และ Facebook ตามมาตรฐานสากล
            </p>
          </div>
          <div>
            <button id="open-add-cust-modal-btn" class="px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer">
              <i class="fa-solid fa-user-plus"></i> เพิ่มลูกค้าใหม่
            </button>
          </div>
        </div>

        <!-- Metrics Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div class="p-4 bg-white rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-xl shrink-0">
              <i class="fa-solid fa-users"></i>
            </div>
            <div>
              <span class="text-[11px] font-bold text-gray-400 block uppercase">ลูกค้าทั้งหมด</span>
              <span class="text-lg sm:text-xl font-black text-gray-800">${totalCustomers} <span class="text-xs font-semibold text-gray-500">ราย</span></span>
            </div>
          </div>

          <div class="p-4 bg-white rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center text-xl shrink-0">
              <i class="fa-solid fa-mug-saucer"></i>
            </div>
            <div>
              <span class="text-[11px] font-bold text-gray-400 block uppercase">ร้านคาเฟ่ / ของฝาก</span>
              <span class="text-lg sm:text-xl font-black text-amber-800">${cafeCount} <span class="text-xs font-semibold text-gray-500">ราย</span></span>
            </div>
          </div>

          <div class="p-4 bg-white rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center text-xl shrink-0">
              <i class="fa-solid fa-store"></i>
            </div>
            <div>
              <span class="text-[11px] font-bold text-gray-400 block uppercase">ตัวแทนจำหน่าย</span>
              <span class="text-lg sm:text-xl font-black text-blue-800">${distributorCount} <span class="text-xs font-semibold text-gray-500">ราย</span></span>
            </div>
          </div>

          <div class="p-4 bg-white rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-purple-50 text-purple-800 flex items-center justify-center text-xl shrink-0">
              <i class="fa-solid fa-industry"></i>
            </div>
            <div>
              <span class="text-[11px] font-bold text-gray-400 block uppercase">โรงงาน / อื่นๆ</span>
              <span class="text-lg sm:text-xl font-black text-purple-800">${factoryCount + generalCount} <span class="text-xs font-semibold text-gray-500">ราย</span></span>
            </div>
          </div>
        </div>

        <!-- Filter and Search Row + View Toggle -->
        <div class="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <!-- Search box -->
          <div class="relative flex-1 max-w-md">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
              <i class="fas fa-search text-xs"></i>
            </span>
            <input type="text" id="cust-search-input" value="${this.searchQuery}" 
              placeholder="ค้นหาชื่อลูกค้า, ที่อยู่, เบอร์โทร, LINE ID, Facebook..." 
              class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50 hover:bg-white transition"
            />
          </div>

          <!-- Controls: Type Filter & View Mode Toggle -->
          <div class="flex flex-wrap items-center gap-2.5">
            
            <div class="flex items-center gap-1.5">
              <label for="cust-type-filter" class="text-xs font-bold text-gray-500 whitespace-nowrap">ประเภทลูกค้า:</label>
              <select id="cust-type-filter" class="px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs">
                <option value="">ทั้งหมด (${totalCustomers})</option>
                <option value="ลูกค้าทั่วไป" ${this.selectedTypeFilter === 'ลูกค้าทั่วไป' ? 'selected' : ''}>ลูกค้าทั่วไป (${generalCount})</option>
                <option value="ร้านคาเฟ่/ร้านขายของฝาก" ${this.selectedTypeFilter === 'ร้านคาเฟ่/ร้านขายของฝาก' ? 'selected' : ''}>ร้านคาเฟ่/ร้านขายของฝาก (${cafeCount})</option>
                <option value="ตัวแทนจำหน่าย" ${this.selectedTypeFilter === 'ตัวแทนจำหน่าย' ? 'selected' : ''}>ตัวแทนจำหน่าย (${distributorCount})</option>
                <option value="ซื้อส่งโรงงาน" ${this.selectedTypeFilter === 'ซื้อส่งโรงงาน' ? 'selected' : ''}>ซื้อส่งโรงงาน (${factoryCount})</option>
              </select>
            </div>

            <!-- View Switcher (Table vs Cards) -->
            <div class="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button id="view-mode-table-btn" class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                this.viewMode === 'table' ? 'bg-white text-emerald-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }" title="มุมมองตารางมาตรฐาน (Table View)">
                <i class="fa-solid fa-table-list"></i>
                <span class="hidden sm:inline">ตาราง</span>
              </button>
              <button id="view-mode-cards-btn" class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                this.viewMode === 'cards' ? 'bg-white text-emerald-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }" title="มุมมองการ์ดนามบัตร (Cards View)">
                <i class="fa-solid fa-address-card"></i>
                <span class="hidden sm:inline">นามบัตร</span>
              </button>
            </div>

          </div>
        </div>

        <!-- Content Area: Table View OR Cards View -->
        ${this.viewMode === 'table' ? `
          <!-- Table Container -->
          <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-gray-50 text-[11px] font-bold text-gray-500 border-b border-gray-100 uppercase tracking-wider">
                    <th class="px-5 py-3.5">ชื่อลูกค้า / กิจการ</th>
                    <th class="px-5 py-3.5">ที่อยู่จัดส่ง / สถานประกอบการ</th>
                    <th class="px-5 py-3.5">เบอร์โทรศัพท์</th>
                    <th class="px-5 py-3.5">LINE ID</th>
                    <th class="px-5 py-3.5">Facebook</th>
                    <th class="px-5 py-3.5">ยอดซื้อสะสม</th>
                    <th class="px-5 py-3.5 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        ` : `
          <!-- Cards Grid View -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${cardsHtml}
          </div>
        `}

      </div>
    `;
  },

  init() {
    const searchInput = document.getElementById('cust-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.refreshView();
      });
    }

    const typeFilter = document.getElementById('cust-type-filter');
    if (typeFilter) {
      typeFilter.addEventListener('change', (e) => {
        this.selectedTypeFilter = e.target.value;
        this.refreshView();
      });
    }

    // View Mode Toggle
    const tableBtn = document.getElementById('view-mode-table-btn');
    if (tableBtn) {
      tableBtn.addEventListener('click', () => {
        this.viewMode = 'table';
        this.refreshView();
      });
    }

    const cardsBtn = document.getElementById('view-mode-cards-btn');
    if (cardsBtn) {
      cardsBtn.addEventListener('click', () => {
        this.viewMode = 'cards';
        this.refreshView();
      });
    }

    const openAddBtn = document.getElementById('open-add-cust-modal-btn');
    if (openAddBtn) {
      openAddBtn.addEventListener('click', () => {
        this.openCustomerModal(null);
      });
    }

    // Edit button click
    const editBtns = document.querySelectorAll('.edit-cust-btn');
    editBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openCustomerModal(id);
      });
    });

    // Delete button click
    const deleteBtns = document.querySelectorAll('.delete-cust-btn');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`คุณต้องการลบข้อมูลลูกค้ารหัส "${id}" ใช่หรือไม่?`)) {
          try {
            appState.deleteCustomer(id);
            showToast(`ลบข้อมูลลูกค้ารหัส ${id} เรียบร้อยแล้ว`);
            this.refreshView();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });

    // View Sales History button click
    const historyBtns = document.querySelectorAll('.view-cust-history-btn');
    historyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.showCustomerHistoryModal(id);
      });
    });

    // Quick Copy to Clipboard Buttons
    const copyBtns = document.querySelectorAll('.copy-cust-btn');
    copyBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = btn.getAttribute('data-text');
        const label = btn.getAttribute('data-label') || 'ข้อมูล';
        if (text && navigator.clipboard) {
          navigator.clipboard.writeText(text).then(() => {
            showToast(`คัดลอก ${label} เรียบร้อยแล้ว`, 'success');
          }).catch(() => {
            showToast('ไม่สามารถคัดลอกได้', 'error');
          });
        }
      });
    });
  },

  // Modal เพิ่ม/แก้ไขลูกค้า ออกแบบตามหลักสากล แยกข้อมูลชัดเจน
  openCustomerModal(id = null) {
    this.editingCustomerId = id;
    const cust = id ? appState.getCustomerById(id) : null;
    const isEdit = !!cust;

    const title = isEdit ? `แก้ไขข้อมูลลูกค้า (${cust.id})` : 'ลงทะเบียนลูกค้าใหม่ (Customer Profile)';
    const icon = isEdit ? 'fa-solid fa-user-pen' : 'fa-solid fa-user-plus';

    const formHtml = `
      <form id="global-customer-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-5">
          
          <!-- Section 1: ข้อมูลระบุตัวตนและประเภทลูกค้า -->
          <div class="space-y-3">
            <div class="flex items-center gap-2 pb-1.5 border-b border-gray-100">
              <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span class="text-xs font-bold text-gray-600 uppercase tracking-wider">1. ข้อมูลทั่วไปและประเภทลูกค้า</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="cust-name" class="block text-xs font-bold text-gray-700 mb-1">ชื่อลูกค้า / ชื่อร้านค้าหรือองค์กร *</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <i class="fa-solid fa-building text-xs"></i>
                  </span>
                  <input type="text" id="cust-name" name="name" required value="${cust ? cust.name : ''}" 
                    placeholder="เช่น ร้านชาสมุนไพรม่อนแจ่ม, คุณสมหญิง อารีย์พร"
                    class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50 hover:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label for="cust-type" class="block text-xs font-bold text-gray-700 mb-1">กลุ่มประเภทลูกค้า *</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <i class="fa-solid fa-tag text-xs"></i>
                  </span>
                  <select id="cust-type" name="customerType" required
                    class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50 hover:bg-white transition">
                    <option value="ลูกค้าทั่วไป" ${cust && cust.customerType === 'ลูกค้าทั่วไป' ? 'selected' : ''}>ลูกค้าทั่วไป (Retail Consumer)</option>
                    <option value="ร้านคาเฟ่/ร้านขายของฝาก" ${cust && cust.customerType === 'ร้านคาเฟ่/ร้านขายของฝาก' ? 'selected' : ''}>ร้านคาเฟ่/ร้านขายของฝาก (Cafe & Souvenir)</option>
                    <option value="ตัวแทนจำหน่าย" ${cust && cust.customerType === 'ตัวแทนจำหน่าย' ? 'selected' : ''}>ตัวแทนจำหน่าย (Distributor / Agent)</option>
                    <option value="ซื้อส่งโรงงาน" ${cust && cust.customerType === 'ซื้อส่งโรงงาน' ? 'selected' : ''}>ซื้อส่งโรงงาน (Factory / Industrial)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: ช่องทางการติดต่อสื่อสาร แยกตามหลักสากล (เบอร์โทร, ไลน์, เฟส) -->
          <div class="space-y-3">
            <div class="flex items-center gap-2 pb-1.5 border-b border-gray-100">
              <span class="w-2 h-2 rounded-full bg-blue-600"></span>
              <span class="text-xs font-bold text-gray-600 uppercase tracking-wider">2. ช่องทางการติดต่อสื่อสาร (Contact Channels)</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <!-- เบอร์โทรศัพท์ -->
              <div>
                <label for="cust-phone" class="block text-xs font-bold text-gray-700 mb-1">
                  <i class="fa-solid fa-phone text-emerald-600 mr-1"></i> เบอร์โทรศัพท์ *
                </label>
                <input type="text" id="cust-phone" name="phone" required value="${cust ? (cust.phone || '') : ''}" 
                  placeholder="เช่น 081-998-1122"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50 hover:bg-white transition"
                />
              </div>

              <!-- ไลน์ (LINE ID) -->
              <div>
                <label for="cust-line" class="block text-xs font-bold text-gray-700 mb-1">
                  <i class="fa-brands fa-line text-[#06C755] mr-1"></i> LINE ID
                </label>
                <input type="text" id="cust-line" name="lineId" value="${cust ? (cust.lineId || '') : ''}" 
                  placeholder="เช่น @monchamtea หรือ line_id"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50 hover:bg-white transition"
                />
              </div>

              <!-- เฟสบุ๊ค (Facebook) -->
              <div>
                <label for="cust-facebook" class="block text-xs font-bold text-gray-700 mb-1">
                  <i class="fa-brands fa-facebook text-[#1877F2] mr-1"></i> Facebook / ชื่อเพจ
                </label>
                <input type="text" id="cust-facebook" name="facebook" value="${cust ? (cust.facebook || '') : ''}" 
                  placeholder="เช่น ม่อนแจ่ม ชาสมุนไพรแท้"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50 hover:bg-white transition"
                />
              </div>

            </div>
          </div>

          <!-- Section 3: ที่อยู่จัดส่งพัสดุและสถานที่ตั้ง -->
          <div class="space-y-3">
            <div class="flex items-center gap-2 pb-1.5 border-b border-gray-100">
              <span class="w-2 h-2 rounded-full bg-rose-500"></span>
              <span class="text-xs font-bold text-gray-600 uppercase tracking-wider">3. ที่อยู่จัดส่งและสถานที่ตั้ง (Address & Logistics)</span>
            </div>

            <div>
              <label for="cust-address" class="block text-xs font-bold text-gray-700 mb-1">
                <i class="fa-solid fa-location-dot text-rose-500 mr-1"></i> ที่อยู่จัดส่งสินค้า / สถานประกอบการ
              </label>
              <textarea id="cust-address" name="address" rows="3" 
                placeholder="ระบุบ้านเลขที่, หมู่, ถนน, ตำบล, อำเภอ, จังหวัด และรหัสไปรษณีย์ สำหรับพิมพ์แปะกล่องพัสดุจัดส่ง..."
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50 hover:bg-white transition"
              >${cust ? (cust.address || '') : ''}</textarea>
            </div>
          </div>

        </div>

        <!-- Footer (Fixed) -->
        <div class="flex justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2.5 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer">
            <i class="fas fa-save"></i> บันทึกข้อมูลลูกค้า
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title,
      icon,
      size: 'max-w-3xl',
      headerColor: 'bg-[#163819]',
      content: formHtml,
      onRender: (dialog) => {
        const form = dialog.querySelector('#global-customer-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);

            const payload = {
              name: formData.get('name'),
              customerType: formData.get('customerType'),
              phone: formData.get('phone'),
              lineId: formData.get('lineId'),
              facebook: formData.get('facebook'),
              address: formData.get('address')
            };

            try {
              if (id) {
                appState.updateCustomer(id, payload);
                showToast('อัปเดตข้อมูลลูกค้าเรียบร้อยแล้ว');
              } else {
                const added = appState.addCustomer(payload);
                showToast(`เพิ่มลูกค้าใหม่รหัส ${added.id} สำเร็จ`);
              }
              closeGlobalModal();
              this.refreshView();
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        }
      }
    });
  },

  // Modal ดูประวัติยอดซื้อและข้อมูลการติดต่อครบครัน
  showCustomerHistoryModal(id) {
    const cust = appState.getCustomerById(id);
    if (!cust) return;

    const allSales = appState.getSales();
    const customerSales = allSales.filter(s => s.customerId === cust.id || s.customer === cust.name || (s.customerName && s.customerName === cust.name));
    const totalAmount = customerSales.reduce((sum, s) => sum + (parseFloat(s.totalPrice) || 0), 0);
    const meta = this.getTypeMeta(cust.customerType);
    const cleanPhone = cust.phone ? cust.phone.replace(/[^0-9]/g, '') : '';
    const fbSearchUrl = cust.facebook ? (cust.facebook.startsWith('http') ? cust.facebook : `https://www.facebook.com/search/top?q=${encodeURIComponent(cust.facebook)}`) : '#';

    const historyContent = `
      <div class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
          
          <!-- Customer Profile Summary Header -->
          <div class="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-black text-emerald-900">${cust.id}</span>
                <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${meta.badge}">
                  <i class="${meta.icon} mr-1"></i>${cust.customerType || 'ลูกค้าทั่วไป'}
                </span>
              </div>
              <h3 class="text-lg font-black text-gray-900 mt-1">${cust.name}</h3>
              <p class="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                <i class="fa-solid fa-location-dot text-rose-500"></i> ${cust.address || 'ไม่ระบุที่อยู่'}
              </p>
            </div>

            <!-- Quick Contacts Row -->
            <div class="flex flex-wrap items-center gap-2 shrink-0">
              ${cleanPhone ? `
                <a href="tel:${cleanPhone}" class="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-gray-800 hover:text-emerald-900 border border-gray-200 text-xs font-bold shadow-2xs transition flex items-center gap-1.5">
                  <i class="fa-solid fa-phone text-emerald-600"></i> โทร ${cust.phone}
                </a>
              ` : ''}
              ${cust.lineId ? `
                <div class="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs flex items-center gap-1.5">
                  <i class="fa-brands fa-line text-[#06C755] text-sm"></i> LINE: ${cust.lineId}
                </div>
              ` : ''}
              ${cust.facebook ? `
                <a href="${fbSearchUrl}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold shadow-2xs transition flex items-center gap-1.5">
                  <i class="fa-brands fa-facebook text-[#1877F2] text-sm"></i> Facebook
                </a>
              ` : ''}
            </div>
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
              <span class="text-[11px] text-emerald-700 font-bold block">ยอดซื้อสะสมทั้งหมด (LTV)</span>
              <span class="text-xl sm:text-2xl font-black text-emerald-900 mt-1 block">${formatBaht(totalAmount)}</span>
            </div>
            <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
              <span class="text-[11px] text-gray-500 font-bold block">จำนวนครั้งที่สั่งซื้อ</span>
              <span class="text-xl sm:text-2xl font-black text-gray-800 mt-1 block">${customerSales.length} ครั้ง</span>
            </div>
            <div class="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center col-span-2 sm:col-span-1">
              <span class="text-[11px] text-amber-700 font-bold block">ยอดซื้อเฉลี่ยต่อคำสั่งซื้อ</span>
              <span class="text-lg sm:text-xl font-black text-amber-900 mt-1 block">
                ${customerSales.length > 0 ? formatBaht(totalAmount / customerSales.length) : '0 บาท'}
              </span>
            </div>
          </div>

          <!-- Sales Transactions List -->
          <div class="space-y-3">
            <span class="text-xs font-bold text-gray-700 block">รายการประวัติคำสั่งซื้อทั้งหมด (${customerSales.length} รายการ)</span>
            ${customerSales.length === 0 
              ? `<div class="p-8 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">ยังไม่มีประวัติการสั่งซื้อสำหรับลูกค้ารายนี้</div>`
              : `
                <div class="overflow-x-auto rounded-2xl border border-gray-100 shadow-2xs">
                  <table class="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr class="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                        <th class="p-3.5">รหัสคำสั่งซื้อ</th>
                        <th class="p-3.5">รายการสินค้า / ล็อต</th>
                        <th class="p-3.5">ประเภทการขาย</th>
                        <th class="p-3.5 text-right">จำนวน</th>
                        <th class="p-3.5 text-right">ยอดรวม</th>
                        <th class="p-3.5">วันที่ซื้อ</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${customerSales.map(s => {
                        const inv = appState.getInventoryByCropId ? appState.getInventoryByCropId(s.cropId) : null;
                        const herbType = inv ? inv.herbType : (s.productName || 'สมุนไพร');
                        return `
                          <tr class="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                            <td class="p-3.5 font-bold text-emerald-800 font-mono">${s.id}</td>
                            <td class="p-3.5 font-medium text-gray-800">${s.cropId ? `${s.cropId} (${herbType})` : (s.productName || herbType)}</td>
                            <td class="p-3.5">
                              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                s.saleType === 'jar' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }">
                                ${s.saleType === 'jar' ? 'กระปุก' : 'กก. วัตถุดิบ'}
                              </span>
                            </td>
                            <td class="p-3.5 text-right font-bold text-gray-900">${s.amount || s.amountKg || 1} ${s.saleType === 'jar' ? 'กระปุก' : 'กก.'}</td>
                            <td class="p-3.5 text-right font-black text-emerald-800">${formatBaht(s.totalPrice)}</td>
                            <td class="p-3.5 text-gray-500">${formatThaiDate(s.date)}</td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              `}
          </div>
        </div>

        <div class="p-4 md:px-6 bg-gray-50 border-t border-gray-100 text-right flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-6 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    `;

    openGlobalModal({
      title: `ประวัติคำสั่งซื้อ: ${cust.name}`,
      icon: 'fas fa-receipt',
      size: 'max-w-5xl',
      headerColor: 'bg-[#163819]',
      content: historyContent
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