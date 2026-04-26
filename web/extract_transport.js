const path = require('path');
const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ucdwxcrcjdmtipubxovz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjZHd4Y3JjamRtdGlwdWJ4b3Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTcyMDg5MCwiZXhwIjoyMDkxMjk2ODkwfQ.Q_E2pd6EOj_BUlrK-HLSZZrLkzFapveI9SnZOPIQ_oI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function extractTransport() {
  console.log('📖 1. Reading Excel file...');
  const filePath = path.join(__dirname, '../students_data.xlsx');
  
  const wb = xlsx.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { defval: null });

  console.log('🚌 2. Analyzing unique transport routes and stops...');
  
  const routeMap = {};

  rows.forEach(r => {
    let route = null;
    let stop = null;

    for (const [key, value] of Object.entries(r)) {
      if (value === null || value === undefined || value === '') continue;
      const lowerKey = key.trim().toLowerCase();
      const valText = typeof value === 'string' ? value.trim() : String(value);

      if (lowerKey.includes('trans') || lowerKey.includes('route')) route = valText;
      else if (lowerKey.includes('stop')) stop = valText;
    }

    if (route) {
      if (!routeMap[route]) {
        routeMap[route] = { stops: new Set(), count: 0 };
      }
      routeMap[route].count += 1;
      if (stop) routeMap[route].stops.add(stop);
    }
  });

  const routesToInsert = Object.entries(routeMap).map(([routeName, data]) => ({
    route_name: routeName,
    bus_number: `BUS-${Math.floor(1000 + Math.random() * 9000)}`, // Auto-generated placeholder
    driver: 'Pending Assignment',
    driver_phone: 'N/A',
    students_count: data.count,
    stops: Array.from(data.stops)
  }));

  console.log(`✅ Found ${routesToInsert.length} unique routes. Pushing to Database...`);

  // First, completely clear any old routes to avoid duplicates
  await supabase.from('transport_routes').delete().neq('route_name', 'ZZZZZ_FAKE');

  if (routesToInsert.length > 0) {
    const { data: inserted, error } = await supabase.from('transport_routes').insert(routesToInsert).select();
    if (error) {
      console.error('❌ Error inserting routes:', error.message);
    } else {
      console.log(`🎉 Success! Uploaded ${inserted.length} routes perfectly. Go check the Transport tab!`);
    }
  } else {
    console.log('No transport routes were found in the excel file.');
  }
}

extractTransport().catch(console.error);
