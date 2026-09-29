$file = "c:\\Users\\PC\\Documents\\Projeak\\js\\components\\sales.js"
$content = Get-Content $file -Raw -Encoding UTF8

$submitRegex = '(?s)_handleSubmit\(form\) \{.*?(?=  _bindTableActions\(\) \{)'
$newSubmit = @'
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
              const invItem = inventory.find(i => (i.herbType && i.herbType.includes(targetHerb)));
              if (invItem && invItem.dryStockKg >= item.quantity) {
                invItem.dryStockKg = Math.max(0, parseFloat((invItem.dryStockKg - item.quantity).toFixed(2)));
                localStorage.setItem('herb_enterprise_inventory', JSON.stringify(inventory));
              }
            }
          } catch (e) {
            console.error("Inventory sync error:", e);
          }
        }

        const newSale = {
          id: recordedSaleId,
          receiptNo: receiptNo,
          date, productId: item.productId, productName: item.productName, unit: item.unit,
          quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: item.totalPrice,
          sellerName, customerName, payment, note,
          remainingStockAfterSale: remainingStock,
          createdAt: new Date().toISOString()
        };
        
        grandTotal += item.totalPrice;
        newSales.push(newSale);
        
        // Mock increment the global counter to avoid duplicate IDs in loop
        sales.push(newSale);
    }

    saveDirectSales(sales);
    
    // Clear cart and reset form
    this.currentCart = [];
    form.reset();
    
    showToast(`✅ บันทึกรายการขายสำเร็จ! (ยอดรวม ${grandTotal.toLocaleString()} บาท)`, 'success');
    this.refreshView();

    // Auto-open receipt for the first item (receipt logic will group by receiptNo)
    setTimeout(() => this._openReceipt(newSales[0].id), 300);
  },

'@

$content = $content -replace $submitRegex, $newSubmit
[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Output "Patched handleSubmit!"
