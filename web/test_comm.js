const https = require('https');

const data = JSON.stringify({
  type: 'notice',
  title: 'Test',
  message: 'Test message',
  recipient: 'All',
  sender: 'Admin'
});

const options = {
  hostname: 'paul-school.vercel.app',
  path: '/api/communications',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
