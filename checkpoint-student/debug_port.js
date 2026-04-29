const net = require('net');
const address = require('address');

console.log('Testing port detection on 3001...');

function listen(port, hostname) {
  return new Promise((resolve, reject) => {
    const label = `listen(${port}, ${hostname})`;
    console.log(`  START: ${label}`);
    const server = new net.Server();
    const timeout = setTimeout(() => {
      console.log(`  TIMEOUT: ${label} - HUNG!`);
      server.close();
      resolve('TIMEOUT');
    }, 5000);
    server.on('error', err => {
      clearTimeout(timeout);
      console.log(`  ERROR: ${label}: ${err.code}`);
      server.close();
      resolve('ERROR:' + err.code);
    });
    server.listen(port, hostname, () => {
      clearTimeout(timeout);
      const p = server.address().port;
      console.log(`  OK: ${label} -> port ${p}`);
      server.close();
      resolve('OK');
    });
  });
}

async function main() {
  // Step 1: host = 0.0.0.0
  await listen(3001, '0.0.0.0');
  // Step 2: host = null 
  await listen(3001, null);
  // Step 3: host = localhost
  await listen(3001, 'localhost');
  // Step 4: host = current IP
  let ip;
  try {
    ip = address.ip();
    console.log('  Current IP:', ip);
  } catch(e) {
    console.log('  address.ip() failed:', e.message);
  }
  if (ip) {
    await listen(3001, ip);
  }
  console.log('ALL DONE');
}

main();
