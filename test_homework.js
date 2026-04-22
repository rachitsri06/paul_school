const https = require('https');

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjZHd4Y3JjamRtdGlwdWJ4b3Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTcyMDg5MCwiZXhwIjoyMDkxMjk2ODkwfQ.Q_E2pd6EOj_BUlrK-HLSZZrLkzFapveI9SnZOPIQ_oI';

const payload = JSON.stringify({
  title: 'Test Essay',
  subject: 'English',
  class_name: '1st',
  due_date: '2026-04-29',
  description: 'Test description',
  assigned_by: 'Test Teacher'
});

const options = {
  hostname: 'ucdwxcrcjdmtipubxovz.supabase.co',
  path: '/rest/v1/homework',
  method: 'POST',
  headers: {
    'apikey': KEY,
    'Authorization': 'Bearer ' + KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    'Content-Length': Buffer.byteLength(payload),
  },
};

const r = https.request(options, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', d);
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('\n✅ Homework insert works!');
      // Clean up - delete the test row
      const parsed = JSON.parse(d);
      const id = Array.isArray(parsed) ? parsed[0]?.id : parsed?.id;
      if (id) {
        const del = https.request({
          hostname: 'ucdwxcrcjdmtipubxovz.supabase.co',
          path: `/rest/v1/homework?id=eq.${id}`,
          method: 'DELETE',
          headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY },
        }, () => console.log('Test row cleaned up.'));
        del.end();
      }
    } else {
      console.log('\n❌ Insert failed - check the error above');
    }
  });
});
r.on('error', e => console.error(e));
r.write(payload);
r.end();
