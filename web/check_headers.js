const xlsx = require('xlsx');
const path = require('path');

try {
  const filePath = path.join(__dirname, '../students_data.xlsx');
  const wb = xlsx.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
  
  console.log('\n--- YOUR EXCEL HEADERS EXACTLY AS THEY APPEAR ---');
  console.log(rows[0]);
  console.log('-------------------------------------------------\n');
} catch (e) {
  console.error("Error reading file:", e.message);
}
