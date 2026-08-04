const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const ROOT = path.join(__dirname, '..');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.yaml': 'application/x-yaml; charset=utf-8',
  '.yml': 'application/x-yaml; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8'
};

function sendResponse(res, status, content, type) {
  res.writeHead(status, { 'Content-Type': type });
  res.end(content);
}

function notFound(res) {
  sendResponse(res, 404, 'Not Found', 'text/plain; charset=utf-8');
}

function serveFile(res, filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return notFound(res);
  }
  const ext = path.extname(filePath).toLowerCase();
  const type = mimeTypes[ext] || 'application/octet-stream';
  const content = fs.readFileSync(filePath);
  sendResponse(res, 200, content, type);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = url.pathname;

  if (pathname === '/') {
    pathname = '/swagger.html';
  }

  const allowed = ['/swagger.html', '/openapi.yaml'];
  if (!allowed.includes(pathname)) {
    return notFound(res);
  }

  const filePath = path.join(ROOT, pathname);
  serveFile(res, filePath);
});

server.listen(PORT, () => {
  console.log(`Swagger UI server started at http://localhost:${PORT}`);
  console.log('Open this URL in your browser to view the API documentation.');
});

process.on('SIGINT', () => server.close(() => process.exit(0)));
