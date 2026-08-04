const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const TEST_FILE = path.join(__dirname, '..', 'data', 'test-telemetry.json');

function createServer() {
  const payload = fs.readFileSync(TEST_FILE, 'utf8');

  return http.createServer((req, res) => {
    if (req.url === '/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(payload);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`Test telemetry server listening on http://localhost:${PORT}/status`);
  });
  process.on('SIGINT', () => server.close(() => process.exit(0)));
}

module.exports = { createServer };
