const https = require('https');

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjZHd4Y3JjamRtdGlwdWJ4b3Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTcyMDg5MCwiZXhwIjoyMDkxMjk2ODkwfQ.Q_E2pd6EOj_BUlrK-HLSZZrLkzFapveI9SnZOPIQ_oI';

const tables = ['homework', 'users', 'students', 'attendance', 'grades', 'exams', 'timetable', 'fees', 'staff', 'homework'];

let done = 0;
const results = {};

tables.forEach(table => {
  const options = {
    hostname: 'ucdwxcrcjdmtipubxovz.supabase.co',
    path: `/rest/v1/${table}?limit=1`,
    method: 'GET',
    headers: {
      'apikey': KEY,
      'Authorization': 'Bearer ' + KEY,
    },
  };
  const r = https.request(options, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      results[table] = res.statusCode === 200 ? '✅ EXISTS' : '❌ MISSING';
      done++;
      if (done === tables.length) {
        console.log('\n--- Supabase Table Status ---');
        Object.entries(results).forEach(([t, s]) => console.log(`  ${s}  ${t}`));
      }
    });
  });
  r.on('error', e => console.error(e));
  r.end();
});
