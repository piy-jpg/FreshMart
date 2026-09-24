/**
 * Real-time SSE (Server-Sent Events) Broadcaster & Hub
 */
const clients = new Set();

function addClient(res, req) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform, no-store',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no'
  });

  res.write('retry: 15000\n\n');
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

  clients.add(res);

  const keepAlive = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch (e) {
      clearInterval(keepAlive);
      clients.delete(res);
    }
  }, 5000);

  let vercelCloseTimer = null;
  if (process.env.VERCEL || process.env.NOW_REGION) {
    vercelCloseTimer = setTimeout(() => {
      clearInterval(keepAlive);
      clients.delete(res);
      try {
        res.write(': refresh\n\n');
        res.end();
      } catch (e) {}
    }, 10000);
  }

  req.on('close', () => {
    clearInterval(keepAlive);
    if (vercelCloseTimer) clearTimeout(vercelCloseTimer);
    clients.delete(res);
  });
}

function broadcastEvent(eventType, payload) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    try {
      client.write(message);
    } catch (e) {
      clients.delete(client);
    }
  }
}

function getActiveClientsCount() {
  return clients.size;
}

module.exports = {
  addClient,
  broadcastEvent,
  getActiveClientsCount
};
