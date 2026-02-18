const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 3001,
  path: '/health',
  method: 'GET'
};

console.log('Testing connection to 127.0.0.1:3001...');

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (e) => {
  console.error(`ERROR: ${e.message}`);
});

req.end();
