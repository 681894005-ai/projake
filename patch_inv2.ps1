$file = "c:\\Users\\PC\\Documents\\Projeak\\js\\components\\inventory.js"
$content = Get-Content $file -Raw -Encoding UTF8

$addFormRegex = '(?s)<label for="prod-unit" class="block text-xs font-semibold text-gray-500 uppercase mb-1">หน่วยเรียก \*</label>.*?</div>\s*</div>'
$addFormNew = @'
              <label for="prod-unit" class="block text-xs font-semibold text-gray-500 uppercase mb-1">หน่วยเรียก *</label>
              <select id="prod-unit" name="unit" required class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                <option value="กก." ${defaultUnit === 'กก.' ? 'selected' : ''}>กก.</option>
                <option value="กระป๋อง" ${defaultUnit === 'กระป๋อง' ? 'selected' : ''}>กระป๋อง</option>
              </select>
            </div>
'@
$content = $content -replace $addFormRegex, $addFormNew

$jsLogicRegex = '(?s)const unitSelect = dialog\.querySelector\(''#prod-unit-select''\);.*?\}\);\s*\}'
$content = $content -replace $jsLogicRegex, ''

$editFormRegex = '(?s)<label for="edit-prod-unit" class="block text-xs font-semibold text-gray-500 uppercase mb-1">หน่วยเรียก \*</label>\s*<input type="text" id="edit-prod-unit" name="unit" required value="\$\{product\.unit\}"\s*class="w-full px-4 py-2\.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">'
$editFormNew = @'
              <label for="edit-prod-unit" class="block text-xs font-semibold text-gray-500 uppercase mb-1">หน่วยเรียก *</label>
              <select id="edit-prod-unit" name="unit" required class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                <option value="กก." ${product.unit === 'กก.' ? 'selected' : ''}>กก.</option>
                <option value="กระป๋อง" ${product.unit === 'กระป๋อง' ? 'selected' : ''}>กระป๋อง</option>
              </select>
'@
$content = $content -replace $editFormRegex, $editFormNew

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Output "Patched inventory.js unit fields!"
