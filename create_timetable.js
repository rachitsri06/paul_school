const https = require('https');

const SUPABASE_URL = 'ucdwxcrcjdmtipubxovz.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjZHd4Y3JjamRtdGlwdWJ4b3Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTcyMDg5MCwiZXhwIjoyMDkxMjk2ODkwfQ.Q_E2pd6EOj_BUlrK-HLSZZrLkzFapveI9SnZOPIQ_oI';

const sql = `
create table if not exists timetable (
  id uuid primary key default gen_random_uuid(),
  class_name text,
  day text,
  period text,
  subject text,
  teacher text,
  color text,
  created_at timestamptz default now()
);
`.trim();

const body = JSON.stringify({ query: sql });

const options = {
  hostname: SUPABASE_URL,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    if (res.statusCode === 200 || res.statusCode === 204) {
      console.log('\n✅ timetable table created successfully!');
    } else {
      // Try direct SQL via pg endpoint
      console.log('\nTrying via SQL endpoint...');
      runViaSQLEndpoint();
    }
  });
});
req.on('error', e => { console.error('Error:', e); runViaSQLEndpoint(); });
req.write(body);
req.end();

function runViaSQLEndpoint() {
  // Use the Supabase management API or just confirm table check
  const checkBody = JSON.stringify([]);
  const checkOptions = {
    hostname: SUPABASE_URL,
    path: '/rest/v1/timetable?limit=1',
    method: 'GET',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  };
  const r = https.request(checkOptions, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      console.log('Table check status:', res.statusCode);
      console.log('Table check response:', d);
      if (res.statusCode === 200) {
        console.log('\n✅ timetable table already exists and is accessible!');
      } else {
        console.log('\n❌ Table does not exist yet. Manual SQL needed.');
      }
    });
  });
  r.on('error', e => console.error(e));
  r.end();
}
