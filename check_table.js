const https = require('https');

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjZHd4Y3JjamRtdGlwdWJ4b3Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTcyMDg5MCwiZXhwIjoyMDkxMjk2ODkwfQ.Q_E2pd6EOj_BUlrK-HLSZZrLkzFapveI9SnZOPIQ_oI';

const options = {
  hostname: 'ucdwxcrcjdmtipubxovz.supabase.co',
  path: '/rest/v1/timetable?limit=1',
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
    if (res.statusCode === 200) {
      console.log('✅ timetable table exists and is ready!');
    } else {
      console.log('❌ Status:', res.statusCode, d);
    }
  });
});
r.on('error', e => console.error(e));
r.end();
