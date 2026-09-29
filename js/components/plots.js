// Plots Management Component with Leaflet Map Pinning & Modal Form
import { appState } from '../state.js';
import { formatThaiArea, showToast, openGlobalModal, closeGlobalModal } from '../helpers.js';

let mapInstance = null;
let modalMapInstance = null;
let modalMarker = null;

export const PlotsComponent = {
  editingPlotId: null,

  render() {
    const currentUser = appState.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'Member';

    let plots = appState.getPlots();
    if (isMember) {
      plots = plots.filter(p => p.memberIds && p.memberIds.includes(currentUser.memberId));
    }
    const members = appState.getMembers();

    // Generate member options for single owner selection (used in the Modal)
    const memberOptions = members
      .filter(m => m.status === 'active')
      .map(m => {
        const isSelf = isMember && m.id === currentUser.memberId;
        return `<option value="${m.id}" ${isSelf ? 'selected' : ''}>${m.name} (${m.id}) - บ้านเลขที่ ${m.houseNumber || '-'}</option>`;
      })
      .join('');

    // Generate table rows for plots
    const rowsHtml = plots.length === 0 
      ? `<tr><td colspan="7" class="px-6 py-6 text-center text-sm text-gray-500">ยังไม่มีการบันทึกแปลงปลูกในระบบ</td></tr>`
      : plots.map(p => {
          const owner = members.find(m => (p.memberIds && p.memberIds.includes(m.id)) || p.memberId === m.id);
          const ownerName = owner ? owner.name : 'ไม่พบชื่อเจ้าของ';
          const areaFormatted = formatThaiArea(p.sizeRai, p.sizeNgan, p.sizeSqWah);
          return `
            <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
              <td class="px-6 py-3.5 text-sm font-semibold text-emerald-800">${p.id}</td>
              <td class="px-6 py-3.5 text-sm font-medium text-gray-900">${p.name}</td>
              <td class="px-6 py-3.5 text-sm text-gray-600">${ownerName}</td>
              <td class="px-6 py-3.5 text-sm text-gray-600">${areaFormatted}</td>
              <td class="px-6 py-3.5 text-xs font-mono text-gray-500">
                ${(parseFloat(p.lat) || 0).toFixed(4)}, ${(parseFloat(p.lng) || 0).toFixed(4)}
              </td>
              <td class="px-6 py-3.5 text-sm text-right space-x-1">
                <button data-id="${p.id}" class="add-crop-from-plot-btn text-amber-600 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 p-2 rounded-lg transition-colors" title="เริ่มปลูก (สร้างรอบการปลูกใหม่)">
                  <i class="fas fa-seedling"></i>
                </button>
                <button data-id="${p.id}" class="pan-to-plot-btn text-emerald-600 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 p-2 rounded-lg transition-colors" title="ดูแผนที่">
                  <i class="fas fa-map-marker-alt"></i>
                </button>
                <button data-id="${p.id}" class="edit-plot-btn text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors" title="แก้ไข">
                  <i class="fas fa-edit"></i>
                </button>
                <button data-id="${p.id}" class="delete-plot-btn text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors" title="ลบ">
                  <i class="fas fa-trash-alt"></i>
                </button>
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
              <i class="fa-solid fa-map-location-dot text-emerald-700"></i>
              ระบบจัดการพื้นที่แปลงปลูกสมุนไพร
            </h1>
            <p class="text-sm text-gray-500 mt-1">แผนที่ปักหมุดแปลงเกษตรกรรมและขนาดพื้นที่ของสมาชิกในวิสาหกิจชุมชน</p>
          </div>
          <div>
            <button id="open-add-plot-btn" class="px-4 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all flex items-center gap-1.5 shadow-sm">
              <i class="fas fa-plus-circle"></i> ลงทะเบียนแปลงปลูกใหม่
            </button>
          </div>
        </div>

        <!-- Full Width Layout -->
        <div class="space-y-6">
          <!-- Main Map Card -->
          <div class="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
            <div class="flex items-center justify-between mb-3 px-2">
              <h3 class="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                <i class="fas fa-globe text-emerald-600"></i> แผนที่ตำแหน่งแปลงปลูกวิสาหกิจชุมชนทั้งหมด
              </h3>
              <span class="text-xs text-gray-400">ปักหมุดแสดงพิกัดที่ตั้งแปลงเกษตรกรทั้งหมด</span>
            </div>
            <!-- Map Div -->
            <div id="plots-map" class="map-container h-[400px] w-full rounded-2xl overflow-hidden border border-gray-100 shadow-inner"></div>
          </div>

          <!-- Plots Table Card -->
          <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h3 class="font-bold text-gray-800 text-sm">รายการแปลงปลูกลงทะเบียน</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">
                    <th class="px-6 py-3.5">รหัสแปลง</th>
                    <th class="px-6 py-3.5">ชื่อแปลง</th>
                    <th class="px-6 py-3.5">เจ้าของแปลง</th>
                    <th class="px-6 py-3.5">ขนาดพื้นที่</th>
                    <th class="px-6 py-3.5">พิกัด Lat, Lng</th>
                    <th class="px-6 py-3.5 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  init() {
    try {
      this.initMainMap();
    } catch (e) {
      console.error("Main map initialization error:", e);
    }
    this.bindEvents();
  },

  initMainMap() {
    if (typeof L === 'undefined') {
      console.error('Leaflet is not loaded');
      return;
    }

    if (mapInstance !== null) {
      try {
        mapInstance.remove();
      } catch (e) {
        console.warn("Main map remove warning:", e);
      }
      mapInstance = null;
    }

    const plots = appState.getPlots();
    const centerLat = 18.9142;
    const centerLng = 98.9442;

    mapInstance = L.map('plots-map').setView([centerLat, centerLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    const plotPinIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center bg-emerald-600 text-white font-bold"><i class="fas fa-seedling"></i></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    const members = appState.getMembers();

    plots.forEach(p => {
      const owners = members.filter(m => p.memberIds && p.memberIds.includes(m.id));
      const ownersNames = owners.map(o => o.name).join(', ') || '-';
      
      const latVal = parseFloat(p.lat);
      const lngVal = parseFloat(p.lng);
      if (isNaN(latVal) || isNaN(lngVal)) return;

      const marker = L.marker([latVal, lngVal], { icon: plotPinIcon }).addTo(mapInstance);
      
      const popupContent = `
        <div class="p-1 leading-normal font-sans">
          <span class="text-xs font-bold text-gray-500">${p.id}</span>
          <h4 class="text-sm font-bold text-gray-900 mt-0.5">${p.name}</h4>
          <p class="text-xs text-gray-600 mt-1"><b>เจ้าของแปลง:</b> ${ownersNames}</p>
          <p class="text-xs text-gray-600"><b>ขนาดพื้นที่:</b> ${formatThaiArea(p.sizeRai, p.sizeNgan, p.sizeSqWah)}</p>
          <p class="text-[10px] text-gray-400 mt-1">พิกัด: ${latVal.toFixed(5)}, ${lngVal.toFixed(5)}</p>
        </div>
      `;

      marker.bindPopup(popupContent);
    });
  },

  bindEvents() {
    // Open Modal button
    const openAddBtn = document.getElementById('open-add-plot-btn');
    if (openAddBtn) {
      openAddBtn.addEventListener('click', () => {
        this.openPlotModal(null);
      });
    }

    // Edit plot details
    const editBtns = document.querySelectorAll('.edit-plot-btn');
    editBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openPlotModal(id);
      });
    });

    // Delete plot details
    const deleteBtns = document.querySelectorAll('.delete-plot-btn');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const plot = appState.getPlotById(id);
        if (confirm(`คุณต้องการลบแปลงปลูก "${plot.name}" (${id}) ใช่หรือไม่?`)) {
          try {
            appState.deletePlot(id);
            showToast(`ลบแปลงปลูก ${id} สำเร็จ`);
            this.refreshView();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });

    // Add crop from plot shortcut
    const addCropBtns = document.querySelectorAll('.add-crop-from-plot-btn');
    addCropBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        window.location.hash = '#crops'; // Navigate to crops view
        // Import crops component and trigger modal open
        import('./crops.js').then(module => {
          if (module.CropsComponent) {
            // Need a slight delay to ensure view is fully loaded by router
            setTimeout(() => {
              module.CropsComponent.openStep1Modal(id);
            }, 300);
          }
        }).catch(err => {
          console.error("Failed to load crops component:", err);
          showToast('ไม่สามารถเปิดหน้าบันทึกการปลูกได้', 'error');
        });
      });
    });

    // Pan to plot marker on main map
    const panBtns = document.querySelectorAll('.pan-to-plot-btn');
    panBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const plot = appState.getPlotById(id);
        if (plot && mapInstance && typeof plot.lat === 'number' && typeof plot.lng === 'number' && !isNaN(plot.lat) && !isNaN(plot.lng)) {
          mapInstance.setView([plot.lat, plot.lng], 16);
          
          // Open marker popup dynamically
          mapInstance.eachLayer(layer => {
            if (layer instanceof L.Marker && layer.getLatLng) {
              const latLng = layer.getLatLng();
              if (Math.abs(latLng.lat - plot.lat) < 0.0001 && Math.abs(latLng.lng - plot.lng) < 0.0001) {
                layer.openPopup();
              }
            }
          });

          // Scroll map into view if on mobile
          const mapEl = document.getElementById('plots-map');
          if (mapEl) {
            mapEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  },

  openPlotModal(id = null) {
    const currentUser = appState.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'Member';
    this.editingPlotId = id;

    const members = appState.getMembers();
    const memberOptions = members
      .filter(m => m.status === 'active')
      .map(m => {
        const isCurrent = isMember && m.id === currentUser.memberId;
        return `<option value="${m.id}" ${isCurrent ? 'selected' : ''}>${m.name} (${m.villageNumber || 'หมู่ 4'})</option>`;
      })
      .join('');

    let defaultLat = 18.9142;
    let defaultLng = 98.9442;
    let zoomLevel = 14;
    let hasMarker = false;

    let plot = null;
    if (id) {
      plot = appState.getPlotById(id);
      if (plot) {
        const latVal = parseFloat(plot.lat);
        const lngVal = parseFloat(plot.lng);
        if (!isNaN(latVal) && !isNaN(lngVal)) {
          defaultLat = latVal;
          defaultLng = lngVal;
          zoomLevel = 16;
          hasMarker = true;
        }
      }
    }

    const title = id ? `แก้ไขข้อมูลแปลงปลูก (${id})` : 'ลงทะเบียนแปลงปลูกใหม่';
    const currentOwnerId = plot ? ((plot.memberIds && plot.memberIds[0]) || plot.memberId || '') : (isMember ? currentUser.memberId : '');

    const formHtml = `
      <form id="global-plot-modal-form" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 md:p-8 overflow-y-auto flex-1">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- Left Column: Form Inputs -->
            <div class="space-y-4">
              <!-- Owner Member Selection -->
              <div>
                <label for="modal-plot-ownerId" class="block text-xs font-semibold text-gray-500 uppercase mb-1">เจ้าของแปลง *</label>
                <select id="modal-plot-ownerId" name="ownerId" required ${isMember ? 'disabled' : ''}
                  class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">-- เลือกเจ้าของแปลง --</option>
                  ${memberOptions}
                </select>
              </div>

              <!-- Plot Name -->
              <div>
                <label for="modal-plot-name" class="block text-xs font-semibold text-gray-500 uppercase mb-1">ชื่อเรียกแปลงปลูก *</label>
                <input type="text" id="modal-plot-name" name="name" required value="${plot ? (plot.name || '') : ''}" placeholder="เช่น แปลง 1 ข้างบ้านป้าใจดี"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>

              <!-- Area Size Inputs -->
              <div>
                <span class="block text-xs font-semibold text-gray-500 uppercase mb-1">ขนาดพื้นที่แปลงปลูก *</span>
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <input type="number" id="modal-plot-rai" name="sizeRai" min="0" value="${plot ? (plot.sizeRai || 0) : 0}" required
                      class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <span class="block text-[10px] text-center text-gray-400 mt-1">ไร่</span>
                  </div>
                  <div>
                    <input type="number" id="modal-plot-ngan" name="sizeNgan" min="0" max="3" value="${plot ? (plot.sizeNgan || 0) : 0}" required
                      class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <span class="block text-[10px] text-center text-gray-400 mt-1">งาน</span>
                  </div>
                  <div>
                    <input type="number" id="modal-plot-sqWah" name="sizeSqWah" min="0" max="99" value="${plot ? (plot.sizeSqWah || 0) : 0}" required
                      class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <span class="block text-[10px] text-center text-gray-400 mt-1">ตร.ว.</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column: Map Selection -->
            <div class="flex flex-col h-full space-y-3">
              <div>
                <span class="block text-xs font-semibold text-gray-500 uppercase mb-1">ปักหมุดตำแหน่งพิกัดแปลง *</span>
                <div class="text-[10px] text-gray-450 leading-normal">
                  <i class="fas fa-info-circle text-emerald-600 mr-0.5"></i>
                  คลิกบนแผนที่เพื่ออัปเดตละติจูดและลองจิจูดลงฟอร์มอัตโนมัติ
                </div>
              </div>
              
              <!-- Modal Map Container -->
              <div id="modal-plots-map" class="w-full flex-grow h-48 md:h-64 rounded-2xl border border-gray-200 overflow-hidden shadow-inner"></div>

              <!-- Lat/Lng Inputs -->
              <div class="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label for="modal-plot-lat" class="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Latitude *</label>
                  <input type="number" id="modal-plot-lat" name="lat" step="any" required value="${plot && plot.lat !== undefined ? plot.lat : ''}" placeholder="18.9142"
                    class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500">
                </div>
                <div>
                  <label for="modal-plot-lng" class="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Longitude *</label>
                  <input type="number" id="modal-plot-lng" name="lng" step="any" required value="${plot && plot.lng !== undefined ? plot.lng : ''}" placeholder="98.9442"
                    class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500">
                </div>
              <div class="mt-4">
                <button type="button" id="btn-current-location" class="w-full py-3.5 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all flex items-center justify-center gap-2.5 border-2 border-blue-400 transform hover:-translate-y-0.5">
                  <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <i class="fas fa-map-marker-alt text-lg animate-bounce mt-1"></i>
                  </div>
                  <span class="text-sm font-bold tracking-wide">ดึงพิกัด GPS ปัจจุบัน</span>
                </button>
              </div>
            </div>
            
          </div>
        </div>

        <!-- Modal Footer Buttons (Fixed) -->
        <div class="flex justify-end gap-2 p-4 md:px-6 bg-gray-50 border-t border-gray-100 flex-shrink-0">
          <button type="button" class="close-global-modal-btn px-5 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button type="submit" class="px-7 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 font-bold">
            <i class="fas fa-save"></i> บันทึกข้อมูลแปลง
          </button>
        </div>
      </form>
    `;

    openGlobalModal({
      title,
      icon: 'fas fa-map-pin',
      size: 'max-w-5xl',
      content: formHtml,
      onRender: (dialog) => {
        const ownerSelect = dialog.querySelector('#modal-plot-ownerId');
        if (ownerSelect && currentOwnerId) {
          ownerSelect.value = currentOwnerId;
        }

        const form = dialog.querySelector('#global-plot-modal-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const selectedOwnerId = isMember ? currentUser.memberId : (ownerSelect ? ownerSelect.value : '');

            if (!selectedOwnerId) {
              showToast('กรุณาเลือกเจ้าของแปลง', 'error');
              return;
            }

            const data = {
              memberIds: [selectedOwnerId],
              memberId: selectedOwnerId,
              name: dialog.querySelector('#modal-plot-name').value,
              sizeRai: parseInt(dialog.querySelector('#modal-plot-rai').value) || 0,
              sizeNgan: parseInt(dialog.querySelector('#modal-plot-ngan').value) || 0,
              sizeSqWah: parseInt(dialog.querySelector('#modal-plot-sqWah').value) || 0,
              lat: parseFloat(dialog.querySelector('#modal-plot-lat').value),
              lng: parseFloat(dialog.querySelector('#modal-plot-lng').value),
              status: 'active'
            };

            try {
              if (this.editingPlotId) {
                appState.updatePlot(this.editingPlotId, data);
                showToast('อัปเดตข้อมูลแปลงปลูกสำเร็จ');
              } else {
                appState.addPlot(data);
                showToast('ลงทะเบียนแปลงปลูกใหม่สำเร็จ');
              }
              closeGlobalModal();
              this.refreshView();
            } catch (err) {
              showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูลแปลงปลูก', 'error');
            }
          });
        }

        // Initialize Leaflet map inside global modal
        setTimeout(() => {
          this.initModalMap(defaultLat, defaultLng, zoomLevel, hasMarker);
        }, 80);

        const btnCurrentLocation = dialog.querySelector('#btn-current-location');
        if (btnCurrentLocation) {
          btnCurrentLocation.addEventListener('click', () => {
            if (navigator.geolocation) {
              const originalText = btnCurrentLocation.innerHTML;
              btnCurrentLocation.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังค้นหา...';
              btnCurrentLocation.disabled = true;

              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const lat = position.coords.latitude;
                  const lng = position.coords.longitude;
                  
                  const latInput = dialog.querySelector('#modal-plot-lat');
                  const lngInput = dialog.querySelector('#modal-plot-lng');
                  if (latInput) latInput.value = lat.toFixed(6);
                  if (lngInput) lngInput.value = lng.toFixed(6);
                  
                  if (modalMapInstance) {
                    modalMapInstance.setView([lat, lng], 18);
                    if (modalMarker) {
                      modalMarker.setLatLng([lat, lng]);
                    } else {
                      const pinIcon = L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div class="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center bg-emerald-600 text-white pulse-emerald"><i class="fas fa-map-pin"></i></div>`,
                        iconSize: [32, 32],
                        iconAnchor: [16, 32]
                      });
                      modalMarker = L.marker([lat, lng], { icon: pinIcon }).addTo(modalMapInstance);
                    }
                  }
                  
                  btnCurrentLocation.innerHTML = originalText;
                  btnCurrentLocation.disabled = false;
                  showToast('ดึงตำแหน่งปัจจุบันสำเร็จ');
                },
                (error) => {
                  btnCurrentLocation.innerHTML = originalText;
                  btnCurrentLocation.disabled = false;
                  showToast('ไม่สามารถดึงตำแหน่งปัจจุบันได้ กรุณาเปิดอนุญาต GPS', 'error');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
              );
            } else {
              showToast('เบราว์เซอร์ของคุณไม่รองรับการดึงตำแหน่ง GPS', 'error');
            }
          });
        }
      },
      onClose: () => {
        if (modalMapInstance !== null) {
          try {
            modalMapInstance.remove();
          } catch (e) {}
          modalMapInstance = null;
          modalMarker = null;
        }
      }
    });
  },

  initModalMap(lat, lng, zoom, hasMarker) {
    if (typeof L === 'undefined') {
      console.error('Leaflet is not loaded');
      return;
    }

    if (modalMapInstance !== null) {
      try {
        modalMapInstance.remove();
      } catch (e) {
        console.warn("Modal map remove warning:", e);
      }
      modalMapInstance = null;
      modalMarker = null;
    }

    const mapContainer = document.getElementById('modal-plots-map');
    if (!mapContainer) return;

    modalMapInstance = L.map('modal-plots-map').setView([lat, lng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors'
    }).addTo(modalMapInstance);

    const pinIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center bg-emerald-600 text-white pulse-emerald"><i class="fas fa-map-pin"></i></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    if (hasMarker) {
      modalMarker = L.marker([lat, lng], { icon: pinIcon }).addTo(modalMapInstance);
    }

    modalMapInstance.on('click', (e) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      const latInput = document.getElementById('modal-plot-lat');
      const lngInput = document.getElementById('modal-plot-lng');
      if (latInput) latInput.value = clickLat.toFixed(6);
      if (lngInput) lngInput.value = clickLng.toFixed(6);

      if (modalMarker === null) {
        modalMarker = L.marker([clickLat, clickLng], { icon: pinIcon }).addTo(modalMapInstance);
      } else {
        modalMarker.setLatLng([clickLat, clickLng]);
      }
    });

    modalMapInstance.invalidateSize();
  },

  refreshView() {
    const main = document.getElementById('app-view');
    if (main) {
      main.innerHTML = this.render();
      this.init(); // rebind map and events
    }
  }
};
