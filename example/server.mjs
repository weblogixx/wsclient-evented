import { readFile } from 'node:fs/promises';
import http from 'node:http';
import { WebSocketServer } from 'ws';

const PORT = 9999;

const files = {
  '/': ['example/index.html', 'text/html'],
  '/wsclientevented.js': ['dist/wsclientevented.js', 'text/javascript'],
};

const server = http.createServer(async (request, response) => {
  const file = files[request.url];

  if (!file) {
    response.writeHead(404).end();
    return;
  }

  response.writeHead(200, { 'content-type': file[1] });
  response.end(await readFile(file[0]));
});

// Answers every message with a "<type>-response" message
new WebSocketServer({ server }).on('connection', (socket) => {
  socket.on('message', (raw) => {
    const { type, payload } = JSON.parse(raw.toString());
    socket.send(JSON.stringify({ type: `${type}-response`, payload }));
  });
});

server.listen(PORT, 'localhost', () => {
  console.log(`Demo running on http://localhost:${PORT}, see the browser console`);
});
