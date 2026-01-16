const os = require('os');
const fs = require('fs');

setInterval(() => {
  const log = `
Time: ${new Date().toISOString()}
Platform: ${os.platform()}
CPU: ${os.cpus()[0].model}
Free Memory: ${os.freemem()}
---------------------------
`;

  fs.appendFileSync('system.log', log);
  console.log('System info logged');
}, 5000);
