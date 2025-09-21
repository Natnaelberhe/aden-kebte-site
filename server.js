const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.xml':  'application/xml; charset=utf-8',
  '.txt':  'text/plain; charset=utf-8',
};

http.createServer((req, res) => {
  let filePath = '.' + decodeURI(req.url.split('?')[0]);
  if (filePath === './') filePath = './index.html';
  const ext = path.extname(filePath).toLowerCase();
  const type = mime[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
}).listen(port, () => console.log(`Serving on http://localhost:${port}`));
