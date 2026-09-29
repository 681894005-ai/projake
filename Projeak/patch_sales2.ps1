$file = "c:\Users\PC\Documents\Projeak\js\components\sales.js"
$content = Get-Content $file -Raw -Encoding UTF8

$methodsRegex = '(?s)  _bindForm\(\) \{.*?(?=  _bindTableActions\(\) \{)'

$newMethods = @'
  _bindForm() {
    const totalDisplay = document.getElementById('sale-total-display');
    const unitDisplay  = document.getElementById('sale-unit-display');
    const productSel   = document.getElementById('sale-product-id');
    const qtyInput     = document.getElementById('sale-quantity');
    const priceInput   = document.getElementById('sale-unit-price');
    const stockWarning = document.getElementById('sale-stock-warning');

    const updateCalc = () => {
      const q = parseFloat(qtyInput?.value) || 0;
      const p = parseFloat(priceInput?.value) || 0;
      if (totalDisplay) totalDisplay.textContent = (q * p).toLocaleString('th-TH', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' บาท';
    };

    if (qtyInput) qtyInput.addEventListener('input', updateCalc);
    if (priceInput) priceInput.addEventListener('input', updateCalc);

    if (productSel) {
      productSel.addEventListener('change', () => {
        const opt = productSel.selectedOptions[0];
        if (opt && opt.value) {
          if (priceInput) priceInput.value = opt.getAttribute('data-price') || '';
          if (unitDisplay) unitDisplay.textContent = opt.getAttribute('data-unit') || 'หน่วย';
          
          const stock = parseFloat(opt.getAttribute('data-stock')) || 0;
          if (stockWarning) {
              if (stock <= 5) {
                stockWarning.classList.remove('hidden');
                stockWarning.innerHTML = `<i class="fas fa-exclamation-triangle"></i> สินค้าในสต็อกเหลือ ${stock} ${opt.getAttribute('data-unit')}`;
              } else {
                stockWarning.classList.add('hidden');
              }
          }
          updateCalc();
        } else {
          if (priceInput) priceInput.value = '';
          if (unitDisplay) unitDisplay.textContent = 'หน่วย';
          if (stockWarning) stockWarning.classList.add('hidden');
          updateCalc();
        }
      });
    }
    
    const addBtn = document.getElementById('add-to-cart-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            this._handleAddToCart();
        });
    }

    const form = document.getElementById('direct-sale-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this._handleSubmit(form);
      });

      form.addEventListener('reset', () => {
        setTimeout(() => {
          this.currentCart = [];
          this._renderCartItems();
          if (totalDisplay) totalDisplay.textContent = '0.00 บาท';
          if (unitDisplay)  unitDisplay.textContent = 'หน่วย';
          if (stockWarning) stockWarning.classList.add('hidden');
        }, 0);
      });
    }
  },

  _handleAddToCart() {
      const productSel = document.getElementById('sale-product-id');
      const opt = productSel?.selectedOptions[0];
      if (!opt || !opt.value) { showToast('กรุณาเลือกสินค้า', 'error'); return; }
  
      const productId   = opt.value;
      const product     = appState.getProductById(productId);
      const productName = product ? product.name : (opt.text || 'สินค้า');
      const unit        = opt.getAttribute('data-unit') || (product ? product.unit : 'หน่วย');
      const quantity    = parseFloat(document.getElementById('sale-quantity')?.value) || 0;
      const unitPrice   = parseFloat(document.getElementById('sale-unit-price')?.value) || 0;
      const stock       = parseFloat(opt.getAttribute('data-stock')) || 0;

      if (quantity <= 0) { showToast('กรุณาระบุจำนวน', 'error'); return; }
      if (unitPrice < 0) { showToast('กรุณาระบุราคาต่อหน่วย', 'error'); return; }
      
      const existingQty = this.currentCart.reduce((sum, item) => item.productId === productId ? sum + item.quantity : sum, 0);
      if (product && (existingQty + quantity) > stock) {
          showToast(`สต็อกไม่พอ! (ในสต็อกมี ${stock} ${unit})`, 'error');
          return;
      }

      this.currentCart.push({
          productId, productName, unit, quantity, unitPrice, totalPrice: quantity * unitPrice
      });

      productSel.value = '';
      if (document.getElementById('sale-quantity')) document.getElementById('sale-quantity').value = '';
      if (document.getElementById('sale-unit-price')) document.getElementById('sale-unit-price').value = '';
      if (document.getElementById('sale-total-display')) document.getElementById('sale-total-display').textContent = '0.00 บาท';
      if (document.getElementById('sale-stock-warning')) document.getElementById('sale-stock-warning').classList.add('hidden');

      this._renderCartItems();
  },

  _renderCartItems() {
      const tbody = document.getElementById('cart-items-tbody');
      const summaryTotal = document.getElementById('cart-summary-total');
      const wrapper = document.getElementById('cart-items-wrapper');
      const countB = document.getElementById('cart-count');
      
      if (!tbody) return;

      if (!this.currentCart || this.currentCart.length === 0) {
          if(wrapper) wrapper.classList.add('hidden');
          return;
      }
      
      if(wrapper) wrapper.classList.remove('hidden');
      if(countB) countB.textContent = this.currentCart.length + ' รายการ';
      
      let html = '';
      let grandTotal = 0;
      this.currentCart.forEach((item, idx) => {
          grandTotal += item.totalPrice;
          html += `
            <tr class="border-b border-gray-100 last:border-0 hover:bg-slate-50">
              <td class="py-2 px-3 text-sm font-bold text-gray-800">${item.productName}</td>
              <td class="py-2 px-3 text-center text-sm font-bold text-emerald-700">${item.quantity.toLocaleString()} ${item.unit}</td>
              <td class="py-2 px-3 text-right text-sm text-gray-600">${item.unitPrice.toLocaleString('th-TH', {minimumFractionDigits:2})}</td>
              <td class="py-2 px-3 text-right text-sm font-black text-gray-900">${item.totalPrice.toLocaleString('th-TH', {minimumFractionDigits:2})}</td>
              <td class="py-2 px-3 text-right">
                <button type="button" class="remove-cart-item-btn text-rose-500 hover:text-rose-700 p-1" data-index="${idx}">
                  <i class="fas fa-times"></i>
                </button>
              </td>
            </tr>
          `;
      });
      tbody.innerHTML = html;
      if (summaryTotal) summaryTotal.textContent = `${grandTotal.toLocaleString('th-TH', {minimumFractionDigits:2, maximumFractionDigits:2})} บาท`;
      
      const removeBtns = tbody.querySelectorAll('.remove-cart-item-btn');
      removeBtns.forEach(btn => {
          btn.addEventListener('click', (e) => {
              const idx = parseInt(e.currentTarget.getAttribute('data-index'));
              this.currentCart.splice(idx, 1);
              this._renderCartItems();
          });
      });
  },

  _handleSubmit(form) {
    if (!this.currentCart || this.currentCart.length === 0) {
        showToast('กรุณาเพิ่มสินค้าลงบิลอย่างน้อย 1 รายการ', 'error');
        return;
    }

    const date        = document.getElementById('sale-date')?.value || new Date().toISOString().split('T')[0];
    const sellerName  = document.getElementById('sale-seller-name')?.value?.trim();
    const customerName= document.getElementById('sale-customer-name')?.value?.trim();
    const customerSel = document.getElementById('sale-customer-select');
    const customerId  = customerSel ? customerSel.value : null;
    const payment     = document.getElementById('sale-payment')?.value || 'เงินสด';
    const note        = document.getElementById('sale-note')?.value?.trim();

    if (!sellerName)   { showToast('กรุณาระบุชื่อผู้ขาย', 'error'); return; }
    if (!customerName) { showToast('กรุณาระบุชื่อผู้ซื้อ', 'error'); return; }

    const receiptNo = 'REC-' + Date.now();
    const sales = getDirectSales();
    const newSales = [];
    let grandTotal = 0;

    // Process each item in cart
    for (const item of this.currentCart) {
        let recordedSaleId = generateSaleId();
        let remainingStock = 0;
        
        try {
          const deductResult = appState.deductProductStock(item.productId, item.quantity, customerName, item.unitPrice, date, customerId);
          if (deductResult && deductResult.product) {
            remainingStock = deductResult.product.stock;
          }
          if (deductResult && deductResult.sale && deductResult.sale.id) {
            recordedSaleId = deductResult.sale.id;
          }
        } catch (e) {
          const product = appState.getProductById(item.productId);
          if (product) {
            const newStock = Math.max(0, parseFloat((product.stock - item.quantity).toFixed(2)));
            appState.updateProduct(item.productId, { stock: newStock });
            remainingStock = newStock;
          }
        }

        // ⚡ Deduct bulk dry herbs from inventory if selling in กก.
        if (item.unit === 'กก.' || item.unit === 'kg') {
          try {
            const inventory = appState.getInventory();
            const targetHerb = item.productName.includes('เก๊กฮวย') ? 'เก๊กฮวย' : (item.productName.includes('คาโมมายล์') ? 'คาโมมายล์' : '');
            if (targetHerb) {
              const dryRecords = inventory.filter(i => i.type === 'dry' && i.herb === targetHerb && i.remainingKg > 0);
              dryRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
              
              let needed = item.quantity;
              for (const rec of dryRecords) {
                if (needed <= 0) break;
                if (rec.remainingKg >= needed) {
                  rec.remainingKg = parseFloat((rec.remainingKg - needed).toFixed(2));
                  needed = 0;
                } else {
                  needed = parseFloat((needed - rec.remainingKg).toFixed(2));
                  rec.remainingKg = 0;
                }
              }
              appState.saveInventory(inventory);
            }
          } catch (e) {
            console.error('Failed to deduct bulk inventory:', e);
          }
        }

        const newSale = {
          id: recordedSaleId,
          receiptNo: receiptNo,
          productId: item.productId,
          productName: item.productName,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          date,
          sellerName,
          customerName,
          payment,
          note,
          createdAt: new Date().toISOString()
        };
        
        newSales.push(newSale);
        sales.unshift(newSale);
        grandTotal += item.totalPrice;
    }

    saveDirectSales(sales);

    form.reset();
    showToast(`บันทึกการขายสำเร็จ! (รวม ${this.currentCart.length} รายการ ยอด ${formatBaht(grandTotal)})`, 'success');
    this.refreshView();

    setTimeout(() => this._openReceipt(newSales[0].id), 300);
  }
'@

$content = $content -replace $methodsRegex, $newMethods

# Inject HTML Cart
$htmlTarget = '(?s)            <!-- Submit -->.*?<div class="flex justify-end pt-4 border-t border-gray-100">'
$htmlNew = @'
            <!-- Add Item Button -->
            <div class="flex justify-end pt-2 pb-4">
               <button type="button" id="add-to-cart-btn" class="px-5 py-2.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-sm font-bold transition-all flex items-center gap-2">
                 <i class="fas fa-plus"></i> เพิ่มรายการสินค้าลงบิล
               </button>
            </div>

            <!-- Cart Items Table -->
            <div id="cart-items-wrapper" class="hidden border border-gray-200 rounded-2xl overflow-hidden mb-6 bg-white shadow-sm">
                <div class="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                    <span class="text-xs font-bold text-gray-700"><i class="fas fa-shopping-cart text-emerald-600 mr-1.5"></i> รายการสินค้าในบิล</span>
                    <span class="text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200" id="cart-count"></span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-white text-[10px] font-black text-gray-400 uppercase tracking-wide border-b border-gray-100">
                                <th class="py-2.5 px-3">สินค้า</th>
                                <th class="py-2.5 px-3 text-center">จำนวน</th>
                                <th class="py-2.5 px-3 text-right">ราคา/หน่วย</th>
                                <th class="py-2.5 px-3 text-right">รวมสุทธิ</th>
                                <th class="py-2.5 px-3 text-right w-12">ลบ</th>
                            </tr>
                        </thead>
                        <tbody id="cart-items-tbody"></tbody>
                        <tfoot>
                            <tr class="bg-emerald-50/50 border-t border-emerald-100 font-bold">
                                <td colspan="3" class="py-3 px-3 text-right text-xs text-emerald-800">ยอดรวมทั้งบิล (Grand Total):</td>
                                <td colspan="2" class="py-3 px-3 text-right text-base text-emerald-700 font-black" id="cart-summary-total">0.00 บาท</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- Submit -->
            <div class="flex justify-end pt-4 border-t border-gray-100">
'@

$content = $content -replace $htmlTarget, $htmlNew

# Patch Receipt Logic
$receiptRegex = '(?s)  _getReceiptContentHtml\(s\) \{.*?(?=  _openReceipt\(saleId\) \{)'
$receiptNew = @'
  _getReceiptContentHtml(s) {
    const enterprise = appState.getEnterprise() || {};
    const printDate  = toThaiDateTime(s.createdAt || new Date().toISOString());
    const saleDate   = toThaiDateLong(s.date);
    
    const sales = typeof getDirectSales === 'function' ? getDirectSales() : (JSON.parse(localStorage.getItem('herb_enterprise_direct_sales_v1')) || []);
    const allItems = s.receiptNo ? sales.filter(x => x.receiptNo === s.receiptNo) : [s];
    
    let subtotal = 0;
    let itemsHtml = '';
    
    allItems.forEach((item, index) => {
        subtotal += parseFloat(item.totalPrice) || 0;
        itemsHtml += `
            <tr class="border-b border-dashed border-gray-300 text-gray-800">
                <td class="py-3 px-3 text-center text-gray-500 font-medium">${index + 1}</td>
                <td class="py-3 px-3 font-bold">
                  ${item.productName}
                  <div class="text-[9px] font-normal text-gray-400 mt-0.5">รหัส: ${item.productId}</div>
                </td>
                <td class="py-3 px-3 text-center text-gray-600">${item.unit}</td>
                <td class="py-3 px-3 text-center font-bold tabular-nums">${item.quantity.toLocaleString()}</td>
                <td class="py-3 px-3 text-right text-gray-600 tabular-nums">${formatBaht(item.unitPrice)}</td>
                <td class="py-3 px-3 text-right font-black tabular-nums">${formatBaht(item.totalPrice)}</td>
              </tr>
        `;
    });
    
    const grand      = subtotal;
    const documentId = s.receiptNo || s.id;
    const barDigits  = (documentId || '').replace(/\D/g, '').padStart(12, '0');

    return `
      <div id="printable-receipt" class="receipt-paper max-w-xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-gray-300 shadow-md">

        <!-- Top Header: Logo + Enterprise Details -->
        <div class="flex items-start justify-between pb-4 border-b-2 border-emerald-900/80 gap-3">
          <div class="flex items-start gap-3.5">
            <div class="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center text-2xl shadow-sm shrink-0 mt-0.5 border border-emerald-700">
              <i class="fas fa-leaf"></i>
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest block">วิสาหกิจชุมชนมาตรฐานทางการ</span>
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">OTOP</span>
              </div>
              <h1 class="text-base sm:text-lg font-black text-gray-900 leading-tight">${enterprise.name || 'วิสาหกิจชุมชนสมุนไพรอบแห้ง'}</h1>
              <p class="text-[11px] text-gray-600 mt-1 leading-snug">
                ${enterprise.village || ''} ต.${enterprise.subdistrict || ''} อ.${enterprise.district || ''} จ.${enterprise.province || ''} ${enterprise.postalCode || '57150'}
              </p>
              <div class="text-[10px] text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>${enterprise.phone ? `โทร. ${enterprise.phone}` : 'โทร. 081-234-5678'}</span>
                <span>•</span>
                <span>รหัสทะเบียน: <b>5-50-08-01/1-0023</b></span>
              </div>
            </div>
          </div>

          <div class="text-right shrink-0">
            <span class="inline-block px-2.5 py-1 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
              ต้นฉบับ / ORIGINAL
            </span>
            <div class="mt-2 text-right">
              <span class="text-sm font-black text-gray-900 block leading-tight">ใบเสร็จรับเงิน</span>
              <span class="text-[9px] font-bold text-gray-400 block tracking-wider uppercase">RECEIPT / CASH SALE</span>
            </div>
          </div>
        </div>

        <!-- Document Meta & Customer Info Grid -->
        <div class="grid grid-cols-2 gap-3 py-3.5 border-b border-gray-200 text-xs">
          <!-- Left Column: Customer Details -->
          <div class="space-y-1.5 bg-gray-50/90 p-3 rounded-xl border border-gray-200">
            <div class="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <i class="fas fa-user text-emerald-700"></i> ข้อมูลลูกค้า / ผู้ซื้อ (CUSTOMER)
            </div>
            <div class="font-black text-gray-900 text-sm leading-tight">${s.customerName}</div>
            <div class="text-[11px] text-gray-600 flex items-center gap-1">
              <span class="text-gray-400">วิธีชำระ:</span>
              <span class="font-bold text-emerald-800">${s.payment || 'เงินสด'}</span>
            </div>
            ${s.note ? `<div class="text-[10px] text-gray-500 truncate" title="${s.note}"><span class="text-gray-400">หมายเหตุ:</span> ${s.note}</div>` : ''}
          </div>

          <!-- Right Column: Document Details -->
          <div class="space-y-1.5 bg-gray-50/90 p-3 rounded-xl border border-gray-200 text-right">
            <div class="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center justify-end gap-1">
              <i class="fas fa-file-invoice text-emerald-700"></i> ข้อมูลเอกสาร (INVOICE INFO)
            </div>
            <div class="font-mono font-black text-emerald-800 text-sm">${documentId}</div>
            <div class="text-[11px] text-gray-600">
              <span class="text-gray-400">วันที่ขาย:</span> <span class="font-bold text-gray-800">${saleDate}</span>
            </div>
            <div class="text-[10px] text-gray-500">
              <span class="text-gray-400">ผู้รับเงิน / แคชเชียร์:</span> <span class="font-bold text-gray-700">${s.sellerName}</span>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="py-3">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-emerald-900 text-white font-bold text-[11px]">
                <th class="py-2.5 px-3 text-center w-8 rounded-l-lg">#</th>
                <th class="py-2.5 px-3">รายการสินค้า / Description</th>
                <th class="py-2.5 px-3 text-center w-20">หน่วย</th>
                <th class="py-2.5 px-3 text-center w-16">จำนวน</th>
                <th class="py-2.5 px-3 text-right w-24">ราคา/หน่วย</th>
                <th class="py-2.5 px-3 text-right w-28 rounded-r-lg">จำนวนเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <!-- Totals Summary Grid -->
        <div class="grid grid-cols-2 gap-4 pt-2 pb-5">
          <!-- Left: Receipt Notice & Signatures -->
          <div class="flex flex-col justify-end space-y-4">
            <div class="text-[9px] text-gray-500 leading-relaxed border-l-2 border-amber-400 pl-2">
              • สินค้าซื้อแล้วไม่รับเปลี่ยนหรือคืน<br>
              • ใบเสร็จรับเงินฉบับนี้จะสมบูรณ์เมื่อได้รับเงินครบถ้วน<br>
              • ขอบคุณที่อุดหนุนผลิตภัณฑ์วิสาหกิจชุมชนของเรา
            </div>
            <div class="grid grid-cols-2 gap-3 text-center pt-2">
              <div>
                <div class="border-b border-dashed border-gray-400 pb-4 mb-1"></div>
                <div class="text-[9px] text-gray-500">ผู้จ่ายเงิน</div>
              </div>
              <div>
                <div class="border-b border-dashed border-gray-400 pb-4 mb-1 text-[10px] font-bold text-emerald-800">
                  ${s.sellerName}
                </div>
                <div class="text-[9px] text-gray-500">ผู้รับเงิน</div>
              </div>
            </div>
          </div>

          <!-- Right: Calculations -->
          <div class="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex flex-col justify-center space-y-2">
            <div class="flex justify-between text-xs text-gray-600">
              <span>รวมเป็นเงิน (Sub Total)</span>
              <span class="tabular-nums font-bold">${formatBaht(subtotal)}</span>
            </div>
            <div class="flex justify-between text-xs text-gray-600 pb-2 border-b border-emerald-200/60">
              <span>ส่วนลด (Discount)</span>
              <span class="tabular-nums font-bold">0.00</span>
            </div>
            <div class="flex justify-between items-end pt-1">
              <span class="text-xs font-black text-emerald-900">ยอดเงินสุทธิ (Grand Total)</span>
              <span class="text-xl font-black text-emerald-700 tabular-nums">${formatBaht(grand)}</span>
            </div>
            <div class="text-right text-[10px] text-gray-500 font-medium">บาทถ้วน</div>
          </div>
        </div>

        <!-- Print Footer with Barcode simulation -->
        <div class="border-t border-gray-200 pt-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="h-6 w-32 bg-gray-800 text-transparent flex justify-between" style="background: repeating-linear-gradient(90deg, #1f2937, #1f2937 2px, transparent 2px, transparent 4px, #1f2937 4px, #1f2937 5px, transparent 5px, transparent 7px);">
              <!-- Fake Barcode -->
            </div>
            <span class="text-[9px] font-mono text-gray-500 tracking-widest">${barDigits}</span>
          </div>
          <div class="text-[9px] text-gray-400 flex items-center gap-1.5">
            <i class="fas fa-print"></i> พิมพ์เมื่อ: ${printDate}
          </div>
        </div>
      </div>
    `;
  },
'@

$content = $content -replace $receiptRegex, $receiptNew

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Output "Successfully patched sales.js using native PS regex (no mojibake)"
