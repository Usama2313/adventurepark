// routes/game.js
// Simple router for game-specific endpoints (Spider-Man MVP)
// Handles: POST /api/game/:hero/start, POST /api/game/:hero/action, GET /api/game/:hero/state

const url = require('url');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'adventure_park_db.json');

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading DB in game router:', err.message);
  }
  return {};
}

function saveDB(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing DB in game router:', err.message);
  }
}

function sendJSON(res, status, obj) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
  });
  res.end(JSON.stringify(obj));
}

function getRequestBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', chunk => (body += chunk.toString()));
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { resolve({}); }
    });
  });
}

async function handle(req, res) {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const method = req.method;

  const parts = pathname.split('/').filter(Boolean);
  if (parts.length < 4) {
    return sendJSON(res, 404, { error: 'Invalid game endpoint' });
  }
  const hero = parts[2];
  const action = parts[3];

  const db = loadDB();
  if (!db.games) db.games = { sessions: [] };
  let session = db.games.sessions.find(s => s.hero === hero);
  if (!session) {
    session = { hero, state: { powerMode: 'normal', position: { x: 0, y: 0, z: 0 }, capturedThieves: [] } };
    db.games.sessions.push(session);
    saveDB(db);
  }

  if (method === 'POST' && action === 'start') {
    session.state = { powerMode: 'normal', position: { x: 0, y: 0, z: 0 }, capturedThieves: [] };
    saveDB(db);
    return sendJSON(res, 200, { message: `${hero} session started`, state: session.state });
  }

  if (method === 'POST' && action === 'action') {
    const body = await getRequestBody(req);
    const { type, payload } = body;
    if (type === 'move' && payload && payload.position) {
      session.state.position = payload.position;
    } else if (type === 'power' && payload && payload.mode) {
      if (['normal', 'red', 'black'].includes(payload.mode)) {
        session.state.powerMode = payload.mode;
      }
    } else if (type === 'capture' && payload && payload.thiefId) {
      if (!session.state.capturedThieves.includes(payload.thiefId)) {
        session.state.capturedThieves.push(payload.thiefId);
      }
    }
    saveDB(db);
    return sendJSON(res, 200, { message: 'Action processed', state: session.state });
  }

  if (method === 'GET' && action === 'state') {
    return sendJSON(res, 200, { hero, state: session.state });
  }

  return sendJSON(res, 400, { error: 'Unsupported method or action' });
}

module.exports = { handle };
