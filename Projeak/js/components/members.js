// Members Management Component
import { appState } from '../state.js';
import { formatThaiDate, showToast, openGlobalModal, closeGlobalModal } from '../helpers.js';

export const MembersComponent = {
  currentPage: 1,
  pageSize: 10,
  searchQuery: '',
  roleFilter: '',
  statusFilter: '',
  editingMemberId: null,
  activeDetailMemberId: null,
  currentPhotoBase64: '',

  render() {
    const currentUser = appState.getCurrentUser();
    const isOfficer = currentUser && currentUser.role === 'Officer';
    const allMembers = appState.getMembers();
    
    // Apply filters and search
    let filtered = allMembers.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                          m.id.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                          m.phone.includes(this.searchQuery);
      
      const matchRole = this.roleFilter ? m.role === this.roleFilter : true;

      return matchSearch && matchRole;
    });

    // Pagination calculations
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, totalItems);
    const paginated = filtered.slice(startIndex, startIndex + this.pageSize);

    // Build role filter options
    const roles = [...new Set(allMembers.map(m => m.role))];
    const roleOptions = roles.map(r => `
      <option value="${r}" ${this.roleFilter === r ? 'selected' : ''}>${r}</option>
    `).join('');

    // Table rows
    const rowsHtml = paginated.length === 0 
      ? `<tr><td colspan="6" class="px-6 py-8 text-center text-sm text-gray-500">ไม่พบข้อมูลสมาชิกตามที่ระบุ</td></tr>`
      : paginated.map(m => {
          const avatarHtml = m.photo 
            ? `<img src="${m.photo}" class="w-10 h-10 rounded-full object-cover border border-emerald-100 shadow-sm flex-shrink-0">`
            : `<div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-100 shadow-sm flex-shrink-0">${m.name.charAt(0) || 'M'}</div>`;

          return `
            <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
              <td class="px-6 py-4 text-sm font-semibold text-emerald-850">
                <button data-id="${m.id}" class="view-member-detail-btn font-extrabold text-emerald-800 hover:text-emerald-600 hover:underline transition-colors focus:outline-none">
                  ${m.id}
                </button>
              </td>
              <td class="px-6 py-4 flex items-center gap-3">
                ${avatarHtml}
                <div class="view-member-detail-btn cursor-pointer group" data-id="${m.id}">
                  <div class="text-sm font-bold text-gray-900 group-hover:text-emerald-700 group-hover:underline transition-colors">${m.name}</div>
                  <div class="text-xs text-gray-400">บทบาท: ${m.role}</div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">${m.phone}</td>
              <td class="px-6 py-4 text-sm text-gray-600">${m.villageNumber || '-'}</td>
              <td class="px-6 py-4 text-sm text-gray-500">${formatThaiDate(m.joinDate)}</td>
              <td class="px-6 py-4 text-sm font-medium text-right space-x-1">
                ${isOfficer ? `
                  <span class="text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-150 px-2.5 py-1 rounded-full">Read-Only</span>
                ` : `
                  <button data-id="${m.id}" class="edit-member-btn text-emerald-600 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 p-2 rounded-lg transition-colors" title="แก้ไขข้อมูล">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button data-id="${m.id}" class="delete-member-btn text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors" title="ลบสมาชิก">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                `}
              </td>
            </tr>
          `;
        }).join('');

    return `
      <div class="fade-in space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <i class="fa-solid fa-id-card-clip text-emerald-700"></i>
              จัดการข้อมูลสมาชิกวิสาหกิจชุมชน
            </h1>
            <p class="text-sm text-gray-500 mt-1">ทะเบียนประวัติเกษตรกรผู้ปลูกสมุนไพรอบแห้งจำลอง (ยอดรวมทั้งหมด ${allMembers.length} ราย)</p>
          </div>
          <div class="flex flex-wrap gap-2">
            ${isOfficer ? '' : `
              <button id="quick-mock-member-btn" class="px-4 py-2.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all flex items-center gap-1.5 shadow-sm">
                <i class="fas fa-magic"></i> สุ่มจำลองสมาชิกเพิ่ม
              </button>
              <button id="add-member-btn" class="px-4 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-all flex items-center gap-1.5 shadow-sm">
                <i class="fas fa-user-plus"></i> เพิ่มสมาชิกใหม่
              </button>
            `}
          </div>
        </div>

        <!-- Filters & Search Card -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Search input -->
          <div class="md:col-span-2 relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <i class="fas fa-search"></i>
            </span>
            <input type="text" id="member-search" value="${this.searchQuery}" placeholder="ค้นหา ชื่อ, รหัสสมาชิก หรือเบอร์โทรศัพท์..." 
              class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
          </div>

          <!-- Role Filter -->
          <div>
            <select id="member-role-filter" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">ทุกบทบาทหน้าที่</option>
              ${roleOptions}
            </select>
          </div>
        </div>

        <!-- Table Card -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">
                  <th class="px-6 py-4">รหัสสมาชิก</th>
                  <th class="px-6 py-4">ชื่อ - นามสกุล</th>
                  <th class="px-6 py-4">เบอร์โทรศัพท์</th>
                  <th class="px-6 py-4">หมู่บ้าน</th>
                  <th class="px-6 py-4">วันที่ลงทะเบียน</th>
                  <th class="px-6 py-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="text-xs text-gray-500">
              กำลังแสดงรายการที่ <span class="font-bold">${totalItems === 0 ? 0 : startIndex + 1}</span> ถึง <span class="font-bold">${endIndex}</span> จากทั้งหมด <span class="font-bold">${totalItems}</span> รายการ
            </div>
            
            <div class="flex items-center gap-2">
              <button id="prev-page-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
                class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors">
                <i class="fas fa-chevron-left mr-1"></i> ก่อนหน้า
              </button>
              
              <span class="text-xs text-gray-600 font-medium">หน้า ${this.currentPage} / ${totalPages}</span>

              <button id="next-page-btn" ${this.currentPage === totalPages ? 'disabled' : ''} 
                class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors">
                ถัดไป <i class="fas fa-chevron-right ml-1"></i>
              </button>
          </div>
        </div>
      </div>
      
    </div> <!-- Close .fade-in container -->
    `;
  },

  init() {
    this.bindSearchAndFilters();
    this.bindPagination();
    this.bindMemberActions();
    this.bindQuickMock();
  },

  bindSearchAndFilters() {
    const searchInput = document.getElementById('member-search');
    const roleFilter = document.getElementById('member-role-filter');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.currentPage = 1;
        this.refreshView();
      });
    }

    if (roleFilter) {
      roleFilter.addEventListener('change', (e) => {
        this.roleFilter = e.target.value;
        this.currentPage = 1;
        this.refreshView();
      });
    }
  },

  bindPagination() {
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.refreshView();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentPage++;
        this.refreshView();
      });
    }
  },

  bindMemberActions() {
    // Add Member Button
    const addBtn = document.getElementById('add-member-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.openMemberFormModal(null);
      });
    }

    // View Member Details
    const viewDetailBtns = document.querySelectorAll('.view-member-detail-btn');
    viewDetailBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.activeDetailMemberId = id;
        this.showMemberDetailModal(id);
      });
    });

    // Edit actions from table
    const editBtns = document.querySelectorAll('.edit-member-btn');
    editBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openMemberFormModal(id);
      });
    });

    // Delete actions
    const deleteBtns = document.querySelectorAll('.delete-member-btn');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const member = appState.getMemberById(id);
        if (confirm(`คุณต้องการลบข้อมูลของ "${member ? member.name : id}" ใช่หรือไม่?`)) {
          try {
            appState.deleteMember(id);
            showToast(`ลบข้อมูลสมาชิก ${id} สำเร็จ`);
            this.refreshView();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });
  },

  openMemberFormModal(id = null) {
    this.editingMemberId = id;
    const member = id ? appState.getMemberById(id) : null;
    this.currentPhotoBase64 = member && member.photo ? member.photo : '';

    const isEdit = !!member;
    const title = isEdit ? `แก้ไขข้อมูลสมาชิก (${id})` : 'เพิ่มสมาชิกใหม่';
    const icon = isEdit ? 'fas fa-user-edit' : 'fas fa-user-plus';

    const photoPreviewHtml = this.currentPhotoBase64 
      ? `<img src="${this.currentPhotoBase64}" class="w-full h-full object-cover">`
      : `<i class="fas fa-user-circle text-emerald-500 text-4xl"></i>`;

    const formHtml = `
      <form id="global-member-modal-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 space-y-5">
          <!-- Photo Upload Field -->
          <div class="flex items-center gap-4 p-4 bg-emerald-50/60 rounded-2xl border border-dashed border-emerald-200">
            <div id="mem-photo-preview" class="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 text-xl font-bold overflow-hidden flex-shrink-0">
              ${photoPreviewHtml}
            </div>
            <div class="space-y-1">
              <label for="mem-photo" class="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl cursor-pointer transition-colors shadow-sm inline-block">
                <i class="fas fa-camera mr-1"></i> เลือกรูปถ่ายสมาชิก
              </label>
              <input type="file" id="mem-photo" accept="image/*" class="hidden">
              <p class="text-[11px] text-gray-400">แนะนำรูปจัตุรัส ขนาดไม่เกิน 1GB</p>
              <button type="button" id="remove-mem-photo-btn" class="${this.currentPhotoBase64 ? '' : 'hidden'} text-[11px] text-red-500 hover:underline font-semibold block">
                <i class="fas fa-trash-alt mr-0.5"></i> ลบรูปถ่าย
              </button>
            </div>
          </div>

          <!-- Form Inputs Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            
            <!-- Left Column -->
            <div class="space-y-4">
              <!-- Name -->
              <div>
                <label for="mem-name" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ชื่อ-นามสกุลสมาชิก *</label>
                <input type="text" id="mem-name" name="name" required value="${member ? member.name : ''}" placeholder="เช่น นายเกษตร มั่นคง"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>

              <!-- Role -->
              <div>
                <label for="mem-role" class="block text-xs font-semibold text-gray-500 uppercase mb-1">บทบาทหน้าที่ *</label>
                <select id="mem-role" name="role" required 
                  class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="สมาชิกทั่วไป" ${member && member.role === 'สมาชิกทั่วไป' ? 'selected' : ''}>สมาชิกทั่วไป</option>
                  <option value="กรรมการ" ${member && member.role === 'กรรมการ' ? 'selected' : ''}>กรรมการ</option>
                  <option value="เลขานุการ" ${member && member.role === 'เลขานุการ' ? 'selected' : ''}>เลขานุการ</option>
                  <option value="เหรัญญิก" ${member && member.role === 'เหรัญญิก' ? 'selected' : ''}>เหรัญญิก</option>
                  <option value="รองประธาน" ${member && member.role === 'รองประธาน' ? 'selected' : ''}>รองประธาน</option>
                  <option value="ประธานกลุ่ม" ${member && member.role === 'ประธานกลุ่ม' ? 'selected' : ''}>ประธานกลุ่ม</option>
                </select>
              </div>

              <!-- Address (House + Village) -->
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">ที่อยู่ (เลขที่บ้าน และ หมู่ที่) *</label>
                <div class="flex gap-2">
                  <input type="text" id="mem-houseNumber" name="houseNumber" required value="${member ? (member.houseNumber || '') : ''}" placeholder="เลขที่บ้าน (เช่น 12/4)"
                    class="w-1/2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <input type="text" id="mem-village" name="villageNumber" required value="${member ? member.villageNumber : 'หมู่ 4'}" placeholder="หมู่ที่ (เช่น หมู่ 4)"
                    class="w-1/2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                </div>
                <span class="block text-[10px] text-gray-400 mt-1">ใช้เลขที่บ้านในการเข้าสู่ระบบ (Username)</span>
              </div>
            </div>

            <!-- Right Column -->
            <div class="space-y-4">

              <!-- Phone -->
              <div>
                <label for="mem-phone" class="block text-xs font-semibold text-gray-500 uppercase mb-1">เบอร์โทรศัพท์ *</label>
                <input type="text" id="mem-phone" name="phone" required value="${member ? member.phone : ''}" placeholder="08X-XXX-XXXX"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>

              <!-- Join Date -->
              <div>
                <label for="mem-joindate" class="block text-xs font-semibold text-gray-500 uppercase mb-1">วันที่เข้าร่วมเป็นสมาชิก (วัน/เดือน/ปี) *</label>
                <input type="date" id="mem-joindate" name="joinDate" required value="${member ? member.joinDate : new Date().toISOString().split('T')[0]}"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>
            </div>

          </div>
        </div>

        <!-- Footer Buttons (Fixed) -->
        <div class="flex justify-end p-4 md:px-6 bg-gray-50 border-t border-gray-100 gap-2.5 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5">
            <i class="fas fa-save"></i> บันทึกข้อมูล
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title,
      icon,
      size: 'max-w-4xl',
      content: formHtml,
      onRender: (dialog) => {
        const photoInput = dialog.querySelector('#mem-photo');
        const photoPreview = dialog.querySelector('#mem-photo-preview');
        const removePhotoBtn = dialog.querySelector('#remove-mem-photo-btn');
        const form = dialog.querySelector('#global-member-modal-form');

        if (photoInput) {
          photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
              if (file.size > 1.2 * 1024 * 1024 * 1024) {
                showToast('ไฟล์รูปภาพมีขนาดใหญ่เกินไป (แนะนำไม่เกิน 1GB)', 'warning');
                photoInput.value = '';
                return;
              }
              const reader = new FileReader();
              reader.onload = (event) => {
                this.currentPhotoBase64 = event.target.result;
                if (photoPreview) {
                  photoPreview.innerHTML = `<img src="${this.currentPhotoBase64}" class="w-full h-full object-cover">`;
                }
                if (removePhotoBtn) {
                  removePhotoBtn.classList.remove('hidden');
                }
              };
              reader.readAsDataURL(file);
            }
          });
        }

        if (removePhotoBtn) {
          removePhotoBtn.addEventListener('click', () => {
            this.currentPhotoBase64 = '';
            if (photoInput) photoInput.value = '';
            if (photoPreview) {
              photoPreview.innerHTML = `<i class="fas fa-user-circle text-emerald-500 text-4xl"></i>`;
            }
            removePhotoBtn.classList.add('hidden');
          });
        }

        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const houseVal = formData.get('houseNumber').trim();

            if (!houseVal) {
              showToast('กรุณาระบุเลขที่บ้าน', 'warning');
              return;
            }

            const data = {
              name: formData.get('name'),
              houseNumber: houseVal,
              role: formData.get('role'),
              phone: formData.get('phone'),
              villageNumber: formData.get('villageNumber'),
              status: 'active',
              joinDate: formData.get('joinDate'),
              photo: this.currentPhotoBase64 || null
            };

            try {
              if (this.editingMemberId) {
                appState.updateMember(this.editingMemberId, data);
                showToast('อัปเดตข้อมูลสมาชิกเรียบร้อยแล้ว');
              } else {
                appState.addMember(data);
                showToast('เพิ่มสมาชิกรายใหม่สำเร็จ');
              }
              closeGlobalModal();
              this.refreshView();
            } catch (err) {
              showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
            }
          });
        }
      }
    });
  },

  showMemberDetailModal(id) {
    const m = appState.getMemberById(id);
    if (!m) return;

    const currentUser = appState.getCurrentUser();
    const isOfficer = currentUser && currentUser.role === 'Officer';

    const mPlots = appState.getPlotsByMemberId(id);
    const mPlotIds = mPlots.map(p => p.id);
    const mCrops = appState.getCrops().filter(c => mPlotIds.includes(c.plotId));
    const mCropIds = mCrops.map(c => c.id);
    const mSales = appState.getSales().filter(s => mCropIds.includes(s.cropId));
    const mInventory = appState.getInventory().filter(i => mCropIds.includes(i.cropId));

    const totalCost = mCrops.reduce((sum, c) => {
      const fertCost = (c.fertilizingLog || []).reduce((fSum, f) => fSum + (f.cost || 0), 0);
      return sum + (c.cost || 0) + fertCost;
    }, 0);
    const totalRevenue = mSales.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
    const netProfit = totalRevenue - totalCost;
    const totalDryStock = mInventory.reduce((sum, i) => sum + (i.dryStockKg || 0), 0);

    const houseNumber = m.houseNumber || '-';

    const avatarHtml = m.photo
      ? `<img src="${m.photo}" class="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mx-auto">`
      : `<div class="w-24 h-24 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-2xl flex items-center justify-center border-4 border-white shadow-md mx-auto">${m.name.charAt(0) || 'M'}</div>`;

    const detailContent = `
      <div class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1 bg-gray-50/50 space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <!-- Left Column: Personal info card (4 cols) -->
            <div class="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm text-center space-y-5">
              <div class="relative">
                ${avatarHtml}
                <span class="absolute bottom-0 right-1/2 translate-x-12 px-3 py-1 text-[10px] font-extrabold text-white bg-emerald-700 rounded-full border border-white shadow-md">
                  ${m.id}
                </span>
              </div>
              <div>
                <h4 class="text-lg font-extrabold text-gray-900 leading-snug">${m.name}</h4>
                <span class="px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full mt-1.5 inline-block">${m.role}</span>
              </div>

              <div class="border-t border-gray-100 pt-4 text-left space-y-3.5 text-xs text-gray-600">
                <div>
                  <span class="block text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">เลขที่บ้าน</span>
                  <span id="detail-house-number" class="font-bold text-gray-800 text-sm mt-0.5 block">${houseNumber}</span>
                </div>
                <div>
                  <span class="block text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">เบอร์โทรศัพท์</span>
                  <span class="font-bold text-gray-800 text-sm mt-0.5 block">${m.phone}</span>
                </div>
                <div>
                  <span class="block text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">ที่อยู่ / หมู่บ้าน</span>
                  <span class="font-bold text-gray-800 text-sm mt-0.5 block">${m.villageNumber || '-'}</span>
                </div>
                <div>
                  <span class="block text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">วันที่ลงทะเบียนเข้าร่วม</span>
                  <span class="font-bold text-gray-800 text-sm mt-0.5 block">${formatThaiDate(m.joinDate)}</span>
                </div>
                <div>
                  <span class="block text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1">สถานะสมาชิก</span>
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${
                    m.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'
                  }">
                    <span class="w-2 h-2 rounded-full ${m.status === 'active' ? 'bg-green-500' : 'bg-gray-405'}"></span>
                    ${m.status === 'active' ? 'กำลังมีกิจกรรม' : 'พักการปลูก'}
                  </span>
                </div>
              </div>
            </div>

            <!-- Right Column: Stats & Plots lists (8 cols) -->
            <div class="lg:col-span-8 space-y-6 flex flex-col justify-between">
              
              <!-- Statistics Cards Grid (4 cols on desktop) -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div class="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <span class="text-[10px] text-gray-400 font-extrabold block uppercase mb-1">แปลงปลูกทั้งหมด</span>
                  <span class="text-2xl font-extrabold text-emerald-800">${mPlots.length} <span class="text-xs text-gray-550 font-semibold">แปลง</span></span>
                </div>
                <div class="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <span class="text-[10px] text-gray-400 font-extrabold block uppercase mb-1">รอบการเพาะปลูก</span>
                  <span class="text-2xl font-extrabold text-emerald-800">${mCrops.length} <span class="text-xs text-gray-550 font-semibold">รอบ</span></span>
                </div>
                <div class="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <span class="text-[10px] text-gray-400 font-extrabold block uppercase mb-1">อบแห้งในคลัง</span>
                  <span class="text-2xl font-extrabold text-emerald-800">${totalDryStock.toFixed(2)} <span class="text-xs text-gray-550 font-semibold">กก.</span></span>
                </div>
                <div class="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <span class="text-[10px] text-gray-400 font-extrabold block uppercase mb-1">กำไรสุทธิสะสม</span>
                  <span class="text-2xl font-extrabold ${netProfit >= 0 ? 'text-green-700' : 'text-red-600'}">${netProfit.toLocaleString()} <span class="text-xs text-gray-550 font-semibold">บาท</span></span>
                </div>
              </div>

              <!-- Plot Details List -->
              <div class="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-3 text-left">
                <h5 class="text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <i class="fas fa-map-marked-alt text-emerald-700"></i> รายชื่อแปลงปลูกสมุนไพรในสังกัด (${mPlots.length})
                </h5>
                
                ${mPlots.length === 0 
                  ? `<p class="text-xs text-gray-400 text-center py-3">ยังไม่มีแปลงปลูกลงทะเบียนในระบบ</p>` 
                  : `
                    <div class="divide-y divide-gray-100 max-h-48 overflow-y-auto pr-1">
                      ${mPlots.map(p => `
                        <div class="py-2.5 flex justify-between items-center text-xs">
                          <div>
                            <span class="font-bold text-gray-800">${p.name}</span>
                            <span class="text-gray-400 text-[10px] block mt-0.5">รหัสแปลง: ${p.id}</span>
                          </div>
                          <div class="text-right">
                            <span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              p.plantType === 'เก๊กฮวย' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }">${p.plantType}</span>
                            <span class="text-gray-500 block mt-0.5 font-medium">${p.sizeRai ? `${p.sizeRai} ไร่ ` : ''}${p.sizeNgan ? `${p.sizeNgan} งาน ` : ''}${p.sizeSqWah ? `${p.sizeSqWah} ตร.ว.` : ''}</span>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  `
                }
              </div>
            </div>
            
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center flex-shrink-0">
          ${isOfficer ? '<div></div>' : `
            <button type="button" id="global-detail-edit-member-btn" class="px-4 py-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all flex items-center gap-1.5 shadow-sm">
              <i class="fas fa-edit"></i> แก้ไขข้อมูลสมาชิก
            </button>
          `}
          <button type="button" class="close-global-modal-btn px-5 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    `;

    openGlobalModal({
      title: 'รายละเอียดประวัติสมาชิกวิสาหกิจชุมชน',
      icon: 'fa-solid fa-id-card-clip',
      size: 'max-w-6xl',
      headerColor: 'bg-[#0f2e15]',
      content: detailContent,
      onRender: (dialog) => {
        const editBtn = dialog.querySelector('#global-detail-edit-member-btn');
        if (editBtn) {
          editBtn.addEventListener('click', () => {
            this.openMemberFormModal(id);
          });
        }
      }
    });
  },

  bindQuickMock() {
    const quickBtn = document.getElementById('quick-mock-member-btn');
    if (quickBtn) {
      quickBtn.addEventListener('click', () => {
        const mockFirstNames = ['ทองดี', 'สมคิด', 'ประสิทธิ์', 'กิตติ', 'อรทัย', 'ดวงใจ', 'สุวรรณ', 'ชลธิชา', 'ธีรพล', 'จิราภรณ์'];
        const mockLastNames = ['รักดี', 'เกษตรไพร', 'ศรีสมุนไพร', 'ทองมี', 'พึ่งตน', 'มั่นคง', 'ยอดเกษตร', 'สมบูรณ์', 'ดินดี', 'สุขใจ'];
        const mockRoles = ['สมาชิกทั่วไป', 'สมาชิกทั่วไป', 'สมาชิกทั่วไป', 'กรรมการ'];
        
        const randomName = `${mockFirstNames[Math.floor(Math.random() * mockFirstNames.length)]} ${mockLastNames[Math.floor(Math.random() * mockLastNames.length)]}`;
        const randomRole = mockRoles[Math.floor(Math.random() * mockRoles.length)];
        const randomPhone = `08${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
        const randomVillage = `หมู่ ${Math.floor(Math.random() * 5) + 1}`;
        const randomJoinDate = `2024-${String(Math.floor(Math.random() * 6) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
        const randomHouseNumber = `${Math.floor(Math.random() * 150) + 1}/${Math.floor(Math.random() * 5) + 1}`;

        const newMember = {
          name: randomName,
          houseNumber: randomHouseNumber,
          role: randomRole,
          phone: randomPhone,
          villageNumber: randomVillage,
          status: 'active',
          joinDate: randomJoinDate
        };

        try {
          const added = appState.addMember(newMember);
          showToast(`จำลองสมาชิกใหม่สำเร็จ: ${added.name} (${added.id})`);
          this.refreshView();
        } catch (err) {
          showToast('เกิดข้อผิดพลาดในการจำลองข้อมูล', 'error');
        }
      });
    }
  },

  refreshView() {
    const main = document.getElementById('app-view');
    if (main) {
      main.innerHTML = this.render();
      this.init(); // rebind events
    }
  }
};
