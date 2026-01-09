const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

const DATA_FILE = path.join(__dirname, 'users.json');
const SPONSORS_FILE = path.join(__dirname, 'sponsors.json');
const REQUESTS_FILE = path.join(__dirname, 'requests.json');
const VIDEOS_FILE = path.join(__dirname, 'videos.json');

const crypto = require('crypto');
const multer = require('multer');

// simple disk storage for demo: store uploads under ./uploads
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const id = `intro-${Date.now()}-${Math.round(Math.random()*1e6)}${path.extname(file.originalname)}`;
    cb(null, id);
  }
});
// Server-side upload limits and MIME whitelist
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100MB
// Allow common images, videos and document types (pdf, docx, pptx, txt)
const ALLOWED_MIMETYPES = new Set([
  // images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/jfif',
  'image/heic',
  'image/heif',
  'image/bmp',
  // videos
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  // documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/octet-stream' // allow generic streams for certain browsers
]);

function fileFilter(req, file, cb) {
  // Defensive logging to help debug client-side mime/extension mismatches
  const orig = file && file.originalname ? file.originalname : '<unknown name>';
  const mime = file && file.mimetype ? file.mimetype : '<no-mime>';
  console.debug(`fileFilter: originalname=${orig} mimetype=${mime}`);

  if (!file) return cb(new Error('Invalid file'));

  // Accept any image/* mime type (covers varied image mime labels)
  if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);

  // Accept explicit allowed mimetypes
  if (file.mimetype && ALLOWED_MIMETYPES.has(file.mimetype)) return cb(null, true);

  // Fallback to extension check for clients that don't provide accurate mimetypes
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExts = ['.mp4', '.webm', '.mov', '.mkv', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.zip'];
  const extraExts = ['.jfif', '.heic', '.heif', '.bmp'];
  allowedExts.push(...extraExts);
  if (ext && allowedExts.includes(ext)) return cb(null, true);

  // As a last resort, if there is no mimetype but the filename has an extension, accept it
  if ((!file.mimetype || file.mimetype === '') && ext) {
    console.warn('fileFilter: accepting file with missing mimetype but valid extension', orig, ext);
    return cb(null, true);
  }

  console.warn('fileFilter: rejecting file', { originalname: orig, mimetype: mime, ext });
  return cb(new Error('Unsupported file type'));
}

const upload = multer({ storage, limits: { fileSize: MAX_UPLOAD_BYTES }, fileFilter });

function readUsers() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('readUsers error', err);
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function readSponsors() {
  try {
    if (!fs.existsSync(SPONSORS_FILE)) return [];
    const raw = fs.readFileSync(SPONSORS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('readSponsors error', err);
    return [];
  }
}

function writeSponsors(sponsors) {
  fs.writeFileSync(SPONSORS_FILE, JSON.stringify(sponsors, null, 2), 'utf8');
}

function updateStreak(userId) {
  if (!userId || userId === 'anonymous') return;
  try {
    const users = readUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return;

    const user = users[idx];
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    let streak = user.streak || 0;
    const lastDate = user.lastStreakDate || null;

    if (lastDate === today) {
      return; // Already counted today
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastDate === yesterdayStr) {
      streak += 1;
    } else {
      streak = 1; // Reset if missed a day or new
    }

    users[idx] = { ...user, streak, lastStreakDate: today };
    writeUsers(users);
    console.log(`Updated streak for user ${userId}: ${streak}`);
  } catch (err) {
    console.error('updateStreak error', err);
  }
}

function readRequests() {
  try {
    if (!fs.existsSync(REQUESTS_FILE)) return [];
    const raw = fs.readFileSync(REQUESTS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('readRequests error', err);
    return [];
  }
}

function writeRequests(requests) {
  try {
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf8');
  } catch (err) {
    console.error('writeRequests error', err);
  }
}

// Comments persistence
const COMMENTS_FILE = path.join(__dirname, 'comments.json');
function readComments() {
  try {
    if (!fs.existsSync(COMMENTS_FILE)) return [];
    const raw = fs.readFileSync(COMMENTS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) { console.error('readComments error', err); return []; }
}
function writeComments(comments) {
  try { fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2), 'utf8'); } catch (err) { console.error('writeComments error', err); }
}

function readVideos() {
  try {
    if (!fs.existsSync(VIDEOS_FILE)) return [];
    const raw = fs.readFileSync(VIDEOS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('readVideos error', err);
    return [];
  }
}

function writeVideos(videos) {
  try {
    fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2), 'utf8');
  } catch (err) {
    console.error('writeVideos error', err);
  }
}

const PRODUCTS_FILE = path.join(__dirname, 'products.json');
function readProducts() {
  try {
    if (!fs.existsSync(PRODUCTS_FILE)) return [];
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('readProducts error', err);
    return [];
  }
}

function writeProducts(products) {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
  } catch (err) {
    console.error('writeProducts error', err);
  }
}

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Regaarder backend running' });
});

// Get all marketplace products
app.get('/products', (req, res) => {
  try {
    const products = readProducts();
    return res.json({ success: true, products });
  } catch (err) {
    console.error('get products error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Add a new product to marketplace
app.post('/products', authMiddleware, (req, res) => {
  try {
    const body = req.body || {};
    const products = readProducts();
    const newProduct = {
      ...body,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      creatorId: req.user.id,
      creatorName: req.user.name || 'Anonymous'
    };
    products.unshift(newProduct);
    writeProducts(products);
    return res.json({ success: true, product: newProduct });
  } catch (err) {
    console.error('add product error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/signup', async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password || !name) return res.status(400).json({ error: 'Missing email, password or name' });
  const emailLower = String(email).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) return res.status(400).json({ error: 'Invalid email format' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const users = readUsers();
  if (users.find(u => u.email === emailLower)) return res.status(409).json({ error: 'Account already exists for this email' });

  const hash = await bcrypt.hash(password, 10);
  const token = crypto.randomBytes(16).toString('hex');
  const user = { id: `user-${Date.now()}`, email: emailLower, name, passwordHash: hash, createdAt: new Date().toISOString(), passwordChangedAt: new Date().toISOString(), token };
  users.push(user);
  writeUsers(users);

  const { passwordHash, ...publicUser } = user;
  res.json({ user: publicUser, token });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  const emailLower = String(email).toLowerCase();

  const users = readUsers();
  const user = users.find(u => u.email === emailLower);
  if (!user) return res.status(404).json({ error: 'No account found for this email' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Incorrect password' });

  // create/rotate token for the session
  const token = crypto.randomBytes(16).toString('hex');
  const updated = { ...user, token };
  const idx = users.findIndex(u => u.email === emailLower);
  if (idx !== -1) users[idx] = updated;
  writeUsers(users);

  const { passwordHash, ...publicUser } = updated;
  res.json({ user: publicUser, token });
});

// Simple auth middleware that validates Bearer token against users.json
function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.slice(7).trim();
    const users = readUsers();
    const user = users.find(u => u.token === token);
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    req.user = { id: user.id, email: user.email, name: user.name };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Playback persistence helpers (simple file-backed store)
const PLAYBACK_FILE = path.join(__dirname, 'playback.json');
function readPlayback() {
  try {
    if (!fs.existsSync(PLAYBACK_FILE)) return {};
    const raw = fs.readFileSync(PLAYBACK_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (err) { console.error('readPlayback error', err); return {}; }
}
function writePlayback(data) {
  try { fs.writeFileSync(PLAYBACK_FILE, JSON.stringify(data, null, 2), 'utf8'); } catch (err) { console.error('writePlayback error', err); }
}

// Save playback position (authenticated preferred, anonymous fallback)
app.post('/api/playback', (req, res) => {
  try {
    const body = req.body || {};
    const { videoId, currentTime } = body;
    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });

    const playback = readPlayback();
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      // try to resolve user
      const token = req.headers.authorization.slice(7).trim();
      const users = readUsers();
      const user = users.find(u => u.token === token);
      if (user) {
        playback[user.id] = { videoId, currentTime: Number(currentTime) || 0, updatedAt: new Date().toISOString() };
        writePlayback(playback);
        return res.json({ ok: true });
      }
    }

    // anonymous: store under special key using a client-provided anonId if present, else 'anonymous'
    const anonKey = body.anonId || 'anonymous';
    playback[anonKey] = { videoId, currentTime: Number(currentTime) || 0, updatedAt: new Date().toISOString() };
    writePlayback(playback);
    return res.json({ ok: true });
  } catch (err) {
    console.error('playback post error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get playback position for current user/anon
app.get('/api/playback', (req, res) => {
  try {
    const playback = readPlayback();
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const token = req.headers.authorization.slice(7).trim();
      const users = readUsers();
      const user = users.find(u => u.token === token);
      if (user && playback[user.id]) return res.json(playback[user.id]);
      return res.json({});
    }
    const anonKey = req.query.anonId || 'anonymous';
    return res.json(playback[anonKey] || {});
  } catch (err) {
    console.error('playback get error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Claim endpoint: requires authentication
app.post('/claim', authMiddleware, (req, res) => {
  const { requestId } = req.body || {};
  if (!requestId) return res.status(400).json({ error: 'Missing requestId' });
  
  try {
    const requests = readRequests();
    const request = requests.find(r => r.id === requestId);
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (request.claimed) {
      return res.status(400).json({ error: 'Request already claimed', claimedBy: request.claimedBy });
    }
    
    // Update request with claim info
    request.claimed = true;
    request.claimedBy = {
      id: req.user.id,
      name: req.user.name || req.user.email
    };
    request.claimedAt = new Date().toISOString();
    
    writeRequests(requests);
    
    return res.json({ 
      success: true, 
      requestId, 
      claimedBy: request.claimedBy,
      claimedAt: request.claimedAt
    });
  } catch (err) {
    console.error('claim error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Create sponsor profile (protected). Links sponsor to current user (1:Many)
app.post('/sponsors', authMiddleware, (req, res) => {
  try {
    const body = req.body || {};
    const { name, brief, assets } = body;
    if (!name) return res.status(400).json({ error: 'Missing sponsor name' });

    const sponsors = readSponsors();
    const id = `sponsor-${Date.now()}`;
    const sponsor = {
      id,
      ownerId: req.user.id,
      name,
      brief: brief || '',
      assets: assets || {},
      createdAt: new Date().toISOString()
    };
    sponsors.push(sponsor);
    writeSponsors(sponsors);

    return res.json({ success: true, sponsor });
  } catch (err) {
    console.error('create sponsor error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get sponsors for current authenticated user
app.get('/sponsors/me', authMiddleware, (req, res) => {
  try {
    const sponsors = readSponsors().filter(s => s.ownerId === req.user.id);
    return res.json({ sponsors });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Advertiser dashboard endpoint: only owner can access their dashboard data
app.get('/advertiser/dashboard', authMiddleware, (req, res) => {
  try {
    const sponsors = readSponsors().filter(s => s.ownerId === req.user.id);
    // For demo purposes, also include recent campaigns from local file if present
    let campaigns = [];
    const campaignsFile = path.join(__dirname, 'advertiser_campaigns.json');
    if (fs.existsSync(campaignsFile)) {
      try { campaigns = JSON.parse(fs.readFileSync(campaignsFile, 'utf8') || '[]').filter(c => c.ownerId === req.user.id); } catch (e) { campaigns = []; }
    }
    return res.json({ sponsors, campaigns });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get a sponsor by id and ensure only owner can access
app.get('/sponsors/:id', authMiddleware, (req, res) => {
  try {
    const id = req.params.id;
    const sponsors = readSponsors();
    const s = sponsors.find(x => x.id === id);
    if (!s) return res.status(404).json({ error: 'Sponsor not found' });
    if (s.ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    return res.json({ sponsor: s });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Bookmark endpoint: requires authentication
app.post('/bookmark', authMiddleware, (req, res) => {
  try {
    const { requestId, action, title } = req.body || {};
    console.log('POST /bookmark - userId:', req.user.id, 'requestId:', requestId, 'action:', action);
    if (!requestId || !action) return res.status(400).json({ error: 'Missing requestId or action' });
    const all = readBookmarks();
    // add or remove request bookmark for current user
    if (action === 'add') {
      const exists = (all.requests || []).some(b => String(b.userId || 'anonymous') === String(req.user.id) && String(b.requestId) === String(requestId));
      if (!exists) {
        const b = { id: `req_${Date.now()}`, userId: req.user.id, requestId, title: title || '', createdAt: new Date().toISOString() };
        console.log('Saving bookmark:', b);
        all.requests.unshift(b);
        if (all.requests.length > 1000) all.requests.splice(1000);
        writeBookmarks(all);
      } else {
        console.log('Bookmark already exists');
      }
    } else if (action === 'remove') {
      all.requests = (all.requests || []).filter(b => !(String(b.userId || 'anonymous') === String(req.user.id) && String(b.requestId) === String(requestId)));
      writeBookmarks(all);
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
    return res.json({ success: true, requestId, action });
  } catch (err) {
    console.error('bookmark error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Add request bookmark (auth optional; uses token if present, else anonymous)
app.post('/bookmarks/requests', (req, res) => {
  try {
    const userId = getUserIdOrAnon(req);
    const { requestId, title } = req.body || {};
    if (!requestId) return res.status(400).json({ error: 'Missing requestId' });
    const all = readBookmarks();
    const exists = (all.requests || []).some(b => String(b.userId || 'anonymous') === String(userId) && String(b.requestId) === String(requestId));
    if (!exists) {
      const b = { id: `req_${Date.now()}`, userId, requestId, title: title || '', createdAt: new Date().toISOString() };
      all.requests.unshift(b);
      if (all.requests.length > 1000) all.requests.splice(1000);
      writeBookmarks(all);
    }
    return res.json({ success: true, requestId, action: 'add', userId });
  } catch (err) { console.error('POST /bookmarks/requests error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Remove request bookmark (auth optional; uses token if present, else anonymous)
app.delete('/bookmarks/requests', (req, res) => {
  try {
    const userId = getUserIdOrAnon(req);
    const { requestId } = req.body || {};
    if (!requestId) return res.status(400).json({ error: 'Missing requestId' });
    const all = readBookmarks();
    const before = (all.requests || []).length;
    all.requests = (all.requests || []).filter(b => !(String(b.userId || 'anonymous') === String(userId) && String(b.requestId) === String(requestId)));
    writeBookmarks(all);
    return res.json({ success: true, removed: before - all.requests.length, requestId, userId });
  } catch (err) { console.error('DELETE /bookmarks/requests error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Suggestion endpoint: requires authentication (persisted for notifications)
    app.post('/suggestion', authMiddleware, (req, res) => {
      try {
        const { requestId, text, targetCreatorId, targetCreatorHandle, videoUrl, videoTitle, type, parentId } = req.body || {};
        if (!text) return res.status(400).json({ error: 'Missing text' });
    
        // Resolve target creator id: prefer explicit, else derive from requestId or handle/name
        let toId = targetCreatorId || null;
        try {
          if (!toId && requestId) {
            const reqs = readRequests();
            const r = reqs.find(x => String(x.id) === String(requestId));
            if (r && r.creator && r.creator.id) {
                // If the current user is the creator, send to the requester (if known)
                if (r.creator.id === req.user.id && r.createdBy) {
                    toId = r.createdBy;
                } else {
                    toId = r.creator.id;
                }
            }
          }
        } catch {}
        
        // If type is reply, we might want to ensure we reply to the 'from' of the parent or target specific user
        if (type === 'reply' && targetCreatorId) {
            toId = targetCreatorId;
        }
    
        try {
          if (!toId && targetCreatorHandle) {
            const users = readUsers();
            const h = String(targetCreatorHandle).trim().toLowerCase();
            const u = users.find(x => (x.handle && String(x.handle).toLowerCase() === h)
              || (x.tag && String(x.tag).toLowerCase() === h)
              || (x.name && String(x.name).toLowerCase() === h)
              || (x.email && String(x.email).split('@')[0].toLowerCase() === h));
            if (u) toId = u.id;
          }
        } catch {}
    
        const suggestion = {
          id: `s-${Date.now()}`,
          requestId: requestId || null,
          text,
          from: { id: req.user.id, name: req.user.name || req.user.email },
          to: toId ? { id: toId } : null,
          video: { url: videoUrl || null, title: videoTitle || null },
          type: type || 'suggestion',
          parentId: parentId || null,
          createdAt: new Date().toISOString()
        };
    
        // Persist to suggestions.json
        const SUG_FILE = path.join(__dirname, 'suggestions.json');
        let arr = [];
        try { if (fs.existsSync(SUG_FILE)) arr = JSON.parse(fs.readFileSync(SUG_FILE, 'utf8') || '[]'); } catch {}
        arr.unshift(suggestion);
        try { fs.writeFileSync(SUG_FILE, JSON.stringify(arr, null, 2), 'utf8'); } catch {}
    
        return res.json({ success: true, suggestion });
      } catch (err) {
        console.error('suggestion error', err);
        return res.status(500).json({ error: 'Server error' });
      }
    });
    
    // Get suggestions for a specific request
    app.get('/requests/:id/suggestions', (req, res) => {
      try {
        const requestId = req.params.id;
        const SUG_FILE = path.join(__dirname, 'suggestions.json');
        let arr = [];
        try { if (fs.existsSync(SUG_FILE)) arr = JSON.parse(fs.readFileSync(SUG_FILE, 'utf8') || '[]'); } catch {}
        
        // Filter suggestions for this request
        // Also map to match frontend expectation (userName, timestamp)
        const suggestions = arr
            .filter(s => String(s.requestId) === String(requestId))
            .map(s => ({
                id: s.id,
                text: s.text,
                userName: s.from ? s.from.name : 'Anonymous',
                timestamp: s.createdAt,
                userId: s.from ? s.from.id : null // helpful for UI to identify own suggestions
            }))
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        return res.json({ success: true, suggestions });
      } catch (err) {
        console.error('get request suggestions error', err);
        return res.status(500).json({ error: 'Server error' });
      }
    });

    // Suggestions for current user (creator notifications)
    // Modified to return threaded conversations:
    // 1. Get all suggestions where user is sender OR receiver
    // 2. Client will group them
    app.get('/suggestions/me', authMiddleware, (req, res) => {
      try {
        const SUG_FILE = path.join(__dirname, 'suggestions.json');
        let arr = [];
        try { if (fs.existsSync(SUG_FILE)) arr = JSON.parse(fs.readFileSync(SUG_FILE, 'utf8') || '[]'); } catch {}
        
        const mine = arr.filter(s => 
            (s.to && s.to.id === req.user.id) || 
            (s.from && s.from.id === req.user.id)
        );
        return res.json({ success: true, suggestions: mine, userId: req.user.id });
      } catch (err) {
        console.error('get suggestions error', err);
        return res.status(500).json({ error: 'Server error' });
      }
    });
    
    // Alias: notifications for current user (same logic)
    app.get('/notifications', authMiddleware, (req, res) => {
      try {
        const SUG_FILE = path.join(__dirname, 'suggestions.json');
        let arr = [];
        try { if (fs.existsSync(SUG_FILE)) arr = JSON.parse(fs.readFileSync(SUG_FILE, 'utf8') || '[]'); } catch {}
        
        const mine = arr.filter(s => 
            (s.to && s.to.id === req.user.id) || 
            (s.from && s.from.id === req.user.id)
        );
        return res.json({ success: true, notifications: mine, userId: req.user.id });
      } catch (err) {
        return res.status(500).json({ error: 'Server error' });
      }
    });

    // Delete a notification (suggestion)
    app.delete('/notifications/:id', authMiddleware, (req, res) => {
      try {
        const id = req.params.id;
        const SUG_FILE = path.join(__dirname, 'suggestions.json');
        let arr = [];
        try { if (fs.existsSync(SUG_FILE)) arr = JSON.parse(fs.readFileSync(SUG_FILE, 'utf8') || '[]'); } catch {}
        
        const before = arr.length;
        // Allow deleting if user is sender or receiver
        arr = arr.filter(s => {
            if (String(s.id) !== String(id)) return true;
            // Check ownership
            const isMine = (s.to && s.to.id === req.user.id) || (s.from && s.from.id === req.user.id);
            return !isMine; // Keep if not mine (i.e. remove if mine)
        });
        
        try { fs.writeFileSync(SUG_FILE, JSON.stringify(arr, null, 2), 'utf8'); } catch {}
        
        return res.json({ success: true, deleted: before - arr.length });
      } catch (e) {
        return res.status(500).json({ error: 'Server error' });
      }
    });

// Boost endpoint: requires authentication
app.post('/boost', authMiddleware, (req, res) => {
  const { requestId, amount, provider } = req.body || {};
  if (!requestId || !amount) return res.status(400).json({ error: 'Missing requestId or amount' });
  // demo: accept boost and return success
  return res.json({ success: true, requestId, amount, provider: provider || 'unknown', creditedTo: req.user });
});

app.get('/users', (req, res) => {
  try {
    const users = readUsers();
    const q = (req.query.query || req.query.q || '').trim().toLowerCase();
    const creatorsOnly = req.query.creatorsOnly === '1' || req.query.creatorsOnly === 'true';
    let results = users.map(({ passwordHash, token, ...u }) => u);
    if (creatorsOnly) results = results.filter(u => u.isCreator);
    if (q) {
      results = results.filter(u => {
        const name = (u.name || '').toLowerCase();
        const handle = (u.handle || u.tag || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(q) || handle.includes(q) || email.includes(q);
      });
    }
    return res.json({ users: results });
  } catch (err) {
    console.error('get users error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get current authenticated user profile (full details)
app.get('/users/me', authMiddleware, (req, res) => {
  try {
    const users = readUsers();
    const u = users.find(x => x.id === req.user.id);
    if (!u) return res.status(404).json({ error: 'User not found' });
    const { passwordHash, token, ...publicUser } = u;
    return res.json({ user: publicUser });
  } catch (err) {
    console.error('get me error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Generic user update (name, bio, handle, interests, etc.)
app.post('/users/update', authMiddleware, (req, res) => {
  try {
    const body = req.body || {};
    const allowed = ['name', 'handle', 'bio', 'interests', 'image', 'email', 'social'];
    const users = readUsers();
    const idx = users.findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    
    const updated = { ...users[idx] };
    allowed.forEach(k => { if (typeof body[k] !== 'undefined') updated[k] = body[k]; });
    
    // Ensure handle/tag consistency if handle is updated
    if (body.handle) {
        updated.handle = body.handle;
        updated.tag = body.handle; // Keep tag in sync for legacy compatibility
    }

    users[idx] = updated;
    writeUsers(users);
    
    const { passwordHash, ...publicUser } = updated;
    return res.json({ success: true, user: publicUser });
  } catch (err) {
    console.error('user update error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get user by id (public view) - does not require auth
app.get('/users/:id', (req, res) => {
  try {
    const id = req.params.id;
    const users = readUsers();
    const u = users.find(x => x.id === id);
    if (!u) return res.status(404).json({ error: 'User not found' });
    const { passwordHash, token, ...publicUser } = u;
    return res.json({ user: publicUser });
  } catch (err) {
    console.error('get user by id error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get user by handle/tag (public view)
app.get('/users/handle/:handle', (req, res) => {
  try {
    let handle = String(req.params.handle || '').trim();
    if (handle.startsWith('@')) handle = handle.slice(1);
    if (!handle) return res.status(400).json({ error: 'Missing handle' });
    const users = readUsers();
    const u = users.find(x => (x.tag && String(x.tag).toLowerCase() === handle.toLowerCase()) || (x.handle && String(x.handle).toLowerCase() === handle.toLowerCase()) || (x.name && String(x.name).toLowerCase() === handle.toLowerCase()));
    if (!u) return res.status(404).json({ error: 'User not found' });
    const { passwordHash, token, ...publicUser } = u;
    return res.json({ user: publicUser });
  } catch (err) {
    console.error('get user by handle error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Requests endpoints: list and create
app.get('/requests', (req, res) => {
  try {
    let requests = readRequests();
    const users = readUsers();
    
    // Enrich first (needed for some scores)
    requests = requests.map(r => {
       try {
         const copy = { ...r };
         if (copy.creator && copy.creator.id) {
           const u = users.find(x => x.id === copy.creator.id);
           if (u) {
             copy.creator = { id: u.id, name: u.name || 'Anonymous', image: u.image || '' };
             if ((!copy.imageUrl || copy.imageUrl === '') && u.image) copy.imageUrl = u.image;
           }
         } else {
            // Fallback enrichment
             if (!copy.creator) copy.creator = { id: null, name: 'Anonymous', image: '' };
         }
         return copy;
       } catch (e) { return r; }
    });

    const feed = req.query.feed || 'recommended';
    
    // --- Algorithm Implementation ---
    const now = Date.now();
    
    // Helpers
    const getAgeHours = (r) => Math.max(0.1, (now - new Date(r.createdAt).getTime()) / (1000 * 60 * 60));
    const isFresh = (r) => getAgeHours(r) < 48; // Less than 48 hours old

    if (feed === 'trending') {
        // Trending: Engagement Velocity
        // Score = (Likes + Comments*2 + Boosts*3) / Age^1.2
        requests = requests.map(r => {
            const likes = parseInt(r.likes || 0);
            const comments = parseInt(r.comments || 0);
            const boosts = parseInt(r.boosts || 0);
            const funding = parseInt(r.funding || r.amount || 0);
            
            // Funding also contributes slightly to "trending" as it indicates serious interest
            const engagement = likes + (comments * 2) + (boosts * 3) + (funding * 0.01);
            const score = engagement / Math.pow(getAgeHours(r) + 2, 1.2);
            return { ...r, score, isTrending: score > 10 }; // Set isTrending flag dynamically if desired
        }).sort((a, b) => b.score - a.score);
        
    } else if (feed === 'recommended' || feed === 'discovery') {
        // Recommended / Discovery: "Diamond in the rough" logic
        // Prioritize: High value (funding), Freshness, and Unclaimed status
        // Add Randomness to ensure discovery of new/low-engagement items
        
        requests = requests.map(r => {
            let score = 0;
            const funding = parseInt(r.funding || r.amount || 0);
            const likes = parseInt(r.likes || 0);
            
            // 1. Value Signal
            score += Math.log10(funding + 1) * 20; 
            
            // 2. Freshness Boost
            if (isFresh(r)) score += 50;
            
            // 3. Opportunity Signal (Unclaimed gets huge boost for creators)
            if (!r.claimed) score += 30;
            else score -= 20; // Downrank claimed requests in discovery feed
            
            // 4. Social Proof (diminishing returns)
            score += Math.min(likes, 100) * 0.5;
            
            // 5. Random Discovery Factor (Originality/Diversity)
            // Adds a random jitter to shuffle equivalent items
            score += Math.random() * 15;
            
            return { ...r, score };
        }).sort((a, b) => b.score - a.score);
        
    } else if (feed === 'fresh') {
        // Pure reverse chronological
        requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
    } else if (feed === 'funded') {
        // Top Funded
        requests.sort((a, b) => (b.funding || b.amount || 0) - (a.funding || a.amount || 0));
        
    } else if (feed === 'completed') {
        // Completed: Only show requests where the video is published or marked complete
        // Steps: 1=Received, 2=Review, 3=Production, 4=Preview, 5=Published, 6=Completed
        requests = requests.filter(r => r.isCompleted === true || (r.currentStep && r.currentStep >= 5));
        requests.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    }

    // Apply other filters if present
    if (req.query.category && req.query.category !== 'All') {
        requests = requests.filter(r => r.category === req.query.category);
    }

    return res.json({ requests });
  } catch (err) {
    console.error('get requests error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// --- Comment reactions storage ---
const COMMENT_REACTIONS_FILE = path.join(__dirname, 'comment_reactions.json');
function readCommentReactions() {
  try { if (!fs.existsSync(COMMENT_REACTIONS_FILE)) return { likes: {}, dislikes: {} }; const raw = fs.readFileSync(COMMENT_REACTIONS_FILE, 'utf8'); const j = JSON.parse(raw || '{}'); return { likes: j.likes || {}, dislikes: j.dislikes || {} }; } catch (e) { return { likes: {}, dislikes: {} }; }
}
function writeCommentReactions(data) {
  try { const safe = { likes: data.likes || {}, dislikes: data.dislikes || {} }; fs.writeFileSync(COMMENT_REACTIONS_FILE, JSON.stringify(safe, null, 2), 'utf8'); } catch (e) {}
}

// Persist comment reactions and aggregate counts
app.post('/comments/react', authMiddleware, (req, res) => {
  try {
    const { commentId, action, requestId } = req.body || {};
    if (!commentId || !action) return res.status(400).json({ error: 'Missing commentId or action' });
    
    const userId = req.user.id;
    const reactions = readCommentReactions();
    const comments = readComments();
    const idx = comments.findIndex(c => String(c.id) === String(commentId));
    
    if (idx === -1) return res.status(404).json({ error: 'Comment not found' });
    
    // Initialize maps
    reactions.likes[commentId] = reactions.likes[commentId] || {};
    reactions.dislikes[commentId] = reactions.dislikes[commentId] || {};
    
    let likesCount = Number(comments[idx].likesCount || 0);
    let dislikesCount = Number(comments[idx].dislikesCount || 0);
    
    if (action === 'like') {
      if (!reactions.likes[commentId][userId]) {
        reactions.likes[commentId][userId] = true;
        likesCount += 1;
      }
      if (reactions.dislikes[commentId][userId]) {
        delete reactions.dislikes[commentId][userId];
        dislikesCount = Math.max(0, dislikesCount - 1);
      }
    } else if (action === 'unlike') {
      if (reactions.likes[commentId][userId]) {
        delete reactions.likes[commentId][userId];
        likesCount = Math.max(0, likesCount - 1);
      }
    } else if (action === 'dislike') {
      if (!reactions.dislikes[commentId][userId]) {
        reactions.dislikes[commentId][userId] = true;
        dislikesCount += 1;
      }
      if (reactions.likes[commentId][userId]) {
        delete reactions.likes[commentId][userId];
        likesCount = Math.max(0, likesCount - 1);
      }
    } else if (action === 'undislike') {
       if (reactions.dislikes[commentId][userId]) {
         delete reactions.dislikes[commentId][userId];
         dislikesCount = Math.max(0, dislikesCount - 1);
       }
    }
    
    comments[idx].likesCount = likesCount;
    comments[idx].dislikesCount = dislikesCount;
    
    writeComments(comments);
    writeCommentReactions(reactions);
    
    return res.json({ success: true, likesCount, dislikesCount });
  } catch (err) {
    console.error('comment react error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update comments fetch to include reaction state for user
app.get('/requests/:id/comments', (req, res) => {
  try {
    const requestId = req.params.id;
    const all = readComments();
    let filtered = (all || []).filter(c => String(c.requestId) === String(requestId)).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    // If user is authenticated, check their reaction status
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
       try {
         const token = req.headers.authorization.slice(7).trim();
         const users = readUsers();
         const user = users.find(u => u.token === token);
         if (user) {
            const reactions = readCommentReactions();
            filtered = filtered.map(c => ({
                ...c,
                likedByUser: !!(reactions.likes[c.id] && reactions.likes[c.id][user.id]),
                dislikedByUser: !!(reactions.dislikes[c.id] && reactions.dislikes[c.id][user.id])
            }));
         }
       } catch (e) {}
    }
    
    return res.json({ success: true, comments: filtered });
  } catch (err) { console.error('GET /requests/:id/comments error', err); return res.status(500).json({ error: 'Server error' }); }
});

app.post('/requests/:id/comments', authMiddleware, (req, res) => {
  try {
    const requestId = req.params.id;
    const { text, parentId } = req.body || {};
    if (!text || String(text).trim() === '') return res.status(400).json({ error: 'Missing text' });

    const comment = {
      id: `c_${Date.now()}`,
      requestId,
      userId: req.user.id,
      userName: req.user.name || req.user.email,
      text: String(text).trim(),
      parentId: parentId || null,
      likesCount: 0,
      dislikesCount: 0,
      createdAt: new Date().toISOString()
    };

    const all = readComments();
    all.push(comment);
    writeComments(all);

    // increment comment counter on request if present
    try {
      const requests = readRequests();
      const idx = requests.findIndex(r => String(r.id) === String(requestId));
      if (idx !== -1) {
        requests[idx].comments = (Number(requests[idx].comments) || 0) + 1;
        writeRequests(requests);
      }
    } catch (e) {}

    return res.json({ success: true, comment });
  } catch (err) { console.error('POST /requests/:id/comments error', err); return res.status(500).json({ error: 'Server error' }); }
});

app.put('/requests/:id/comments/:cid', authMiddleware, (req, res) => {
  try {
    const requestId = req.params.id;
    const cid = req.params.cid;
    const { text } = req.body || {};
    if (!text) return res.status(400).json({ error: 'Missing text' });

    const all = readComments();
    const idx = all.findIndex(c => String(c.id) === String(cid) && String(c.requestId) === String(requestId));
    if (idx === -1) return res.status(404).json({ error: 'Comment not found' });
    const comment = all[idx];
    if (String(comment.userId) !== String(req.user.id)) return res.status(403).json({ error: 'Forbidden' });

    comment.text = String(text).trim();
    comment.updatedAt = new Date().toISOString();
    all[idx] = comment;
    writeComments(all);
    return res.json({ success: true, comment });
  } catch (err) { console.error('PUT /requests/:id/comments/:cid error', err); return res.status(500).json({ error: 'Server error' }); }
});

app.delete('/requests/:id/comments/:cid', authMiddleware, (req, res) => {
  try {
    const requestId = req.params.id;
    const cid = req.params.cid;
    const all = readComments();
    const idx = all.findIndex(c => String(c.id) === String(cid) && String(c.requestId) === String(requestId));
    if (idx === -1) return res.status(404).json({ error: 'Comment not found' });
    const comment = all[idx];
    if (String(comment.userId) !== String(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
    all.splice(idx, 1);
    writeComments(all);

    // decrement comment counter on request if present
    try {
      const requests = readRequests();
      const ridx = requests.findIndex(r => String(r.id) === String(requestId));
      if (ridx !== -1) {
        requests[ridx].comments = Math.max(0, (Number(requests[ridx].comments) || 0) - 1);
        writeRequests(requests);
      }
    } catch (e) {}

    return res.json({ success: true });
  } catch (err) { console.error('DELETE /requests/:id/comments/:cid error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Get requests created by the logged-in user
app.get('/requests/my', authMiddleware, (req, res) => {
  try {
    const allRequests = readRequests();
    const userRequests = allRequests.filter(r => r.createdBy === req.user.id);
    return res.json({ requests: userRequests });
  } catch (err) {
    console.error('get my requests error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/requests', authMiddleware, (req, res) => {
  try {
    const body = req.body || {};
    if (!body.title || !body.description) return res.status(400).json({ error: 'Missing title or description' });
    const requests = readRequests();
    const id = `req_${Date.now()}`;
    const parsedAmount = (typeof body.amount === 'number') ? body.amount : (body.amount ? Number(body.amount) : 0);
    const newReq = {
      id,
      title: body.title,
      description: body.description,
      likes: 0,
      comments: 0,
      boosts: 0,
      // persist any provided amount/funding so requests show budgets
      amount: parsedAmount || 0,
      funding: (typeof body.funding === 'number' && body.funding > 0) ? body.funding : (parsedAmount || 0),
      isTrending: false,
      isSponsored: false,
      company: body.company || (body.creator && body.creator.name) || req.user.name || 'Community',
      companyInitial: (body.creator && body.creator.name ? String(body.creator.name)[0] : (req.user.name ? String(req.user.name)[0] : 'C')),
      companyColor: body.companyColor || 'bg-gray-400',
      imageUrl: body.imageUrl || '',
      // persist a reference to the creating user (logged-in user)
      creator: { 
        id: req.user.id,
        name: req.user.name,
        email: req.user.email 
      },
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      ...body.meta && { meta: body.meta }
    };
    requests.unshift(newReq);
    writeRequests(requests);
    updateStreak(req.user.id);
    return res.json({ success: true, request: newReq });
  } catch (err) {
    console.error('create request error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update an existing request (only the creator can edit, and only if not claimed)
app.put('/requests/:id', authMiddleware, (req, res) => {
  try {
    const requestId = req.params.id;
    const body = req.body || {};
    const requests = readRequests();
    const idx = requests.findIndex(r => String(r.id) === String(requestId));
    if (idx === -1) return res.status(404).json({ error: 'Request not found' });

    const existing = requests[idx];
    // Only the creating user may edit
    if (!existing.createdBy || existing.createdBy !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    // Do not allow edits once claimed
    if (existing.claimed) return res.status(400).json({ error: 'Cannot edit a claimed request' });

    // Accept a small set of editable fields
    const allowed = ['title', 'description', 'imageUrl', 'funding', 'amount', 'company'];
    allowed.forEach(k => {
      if (typeof body[k] !== 'undefined') requests[idx][k] = body[k];
    });
    requests[idx].updatedAt = new Date().toISOString();
    writeRequests(requests);
    return res.json({ success: true, request: requests[idx] });
  } catch (err) {
    console.error('update request error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Serve uploaded static files
app.use('/uploads', express.static(UPLOAD_DIR));

// Upload intro video for creator profile
app.post('/creator/intro-video', authMiddleware, (req, res) => {
  // Use the multer middleware instance manually so we can handle errors nicely
  upload.single('video')(req, res, function (err) {
    if (err) {
      console.error('upload error', err && err.message ? err.message : err);
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large' });
      if (err.message === 'Unsupported file type') return res.status(415).json({ error: 'Unsupported file type' });
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }

    try {
      if (!req.file) return res.status(400).json({ error: 'Missing file' });
      const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      // For demo, attach to user record
      const users = readUsers();
      const idx = users.findIndex(u => u.id === req.user.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], introVideo: url };
        writeUsers(users);
      }
      return res.json({ success: true, url });
    } catch (err2) {
      console.error('intro-video upload error', err2);
      return res.status(500).json({ error: 'Server error' });
    }
  });
});

// Upload profile image for creator (optional)
app.post('/creator/photo', authMiddleware, (req, res) => {
  // Accept any file field name to be tolerant of client mismatches during debugging
  upload.any()(req, res, function (err) {
    if (err) {
      console.error('photo upload error', err && err.message ? err.message : err);
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large' });
      if (err.message === 'Unsupported file type') return res.status(415).json({ error: 'Unsupported file type' });
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    // Debug: log request metadata to help diagnose Bad Request issues
    try {
      // multer.any() stores files in req.files array
      const foundFile = (req.files && req.files[0]) || req.file || null;
      const fileInfo = foundFile ? { fieldname: foundFile.fieldname, originalname: foundFile.originalname, mimetype: foundFile.mimetype, filename: foundFile.filename, size: foundFile.size } : null;
      console.debug('creator/photo received', { file: fileInfo, auth: req.headers.authorization || null, contentType: req.headers['content-type'], bodyKeys: Object.keys(req.body || {}) });
    } catch (logErr) {
      console.warn('creator/photo debug log failed', logErr);
    }
    try {
      const uploaded = (req.files && req.files[0]) || req.file || null;
      if (!uploaded) return res.status(400).json({ error: 'Missing file' });
      const url = `${req.protocol}://${req.get('host')}/uploads/${uploaded.filename}`;
      const mimeType = uploaded.mimetype || '';
      const users = readUsers();
      const idx = users.findIndex(u => u.id === req.user.id);
      if (idx !== -1) {
        // If uploaded file is an image, store as `image` for avatar; otherwise store under `document`.
        if (mimeType.startsWith('image/')) {
          users[idx] = { ...users[idx], image: url };
        } else {
          users[idx] = { ...users[idx], document: url };
        }
        writeUsers(users);
      }
      return res.json({ success: true, url, mimeType, field: uploaded.fieldname });
    } catch (err2) {
      console.error('photo upload error', err2);
      return res.status(500).json({ error: 'Server error' });
    }
  });
});

// Complete creator onboarding: save profile fields and mark user as creator
app.post('/creator/complete', authMiddleware, (req, res) => {
  try {
    const body = req.body || {};
    const allowed = ['name', 'bio', 'tag', 'introVideo', 'image', 'social', 'price', 'tagline', 'handle', 'pricingType', 'categories'];
    const users = readUsers();
    const idx = users.findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    const updated = { ...users[idx] };
    allowed.forEach(k => { if (typeof body[k] !== 'undefined') updated[k] = body[k]; });
    updated.isCreator = true;
    updated.creatorSince = new Date().toISOString();
    users[idx] = updated;
    writeUsers(users);
    const { passwordHash, ...publicUser } = updated;
    return res.json({ success: true, user: publicUser });
  } catch (err) {
    console.error('creator complete error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get all published videos
app.get('/videos', (req, res) => {
  try {
    let videos = readVideos();
    const feed = req.query.feed; // 'trending' | 'recommended' | undefined
    const category = req.query.category;
    const user = tryGetUser(req); // helper to get user from token if present

    console.log(`GET /videos feed=${feed} category=${category} user=${user ? user.id : 'anon'}`);

    // Filter by category if provided
    if (category && category !== 'All') {
        videos = videos.filter(v => v.category === category);
    }

    if (feed && (feed.toLowerCase() === 'trending' || feed.toLowerCase() === 'trending now')) {
        // Algorithm: Velocity-based trending (Views + Engagement) / Time Decay
        // Customization: Boost fulfilled requests (videos with a requester)
        const now = Date.now();
        videos = videos.map(v => {
            const views = parseInt(v.views || 0);
            const likes = parseInt(v.likes || 0);
            const shares = parseInt(v.shares || 0);
            const comments = parseInt(v.comments || 0);
            const isRequest = v.requester ? 1 : 0; // Boost demand-driven content

            const ageHours = Math.max(0.1, (now - (v.timestamp || now)) / (1000 * 60 * 60));
            
            // Score = (Engagement + Views/10) / Age^1.5
            // Heavy weight on shares and comments (virality)
            const score = ((likes * 2) + (shares * 5) + (comments * 3) + (views * 0.1) + (isRequest * 50)) / Math.pow(ageHours + 2, 1.5);
            return { ...v, score };
        }).sort((a, b) => b.score - a.score);

    } else if (feed && (feed.toLowerCase() === 'recommended')) {
        // Algorithm: Personalized Recommendation
        // 1. Filter out watched videos (optional, maybe just downrank)
        // 2. Boost based on User History (Category/Author affinity)
        // 3. Fallback to trending/fresh for cold start
        
        let watchedIds = new Set();
        let affinity = { authors: {}, categories: {} };

        if (user || req.query.userId) {
             const userId = user ? user.id : (req.query.userId || 'anonymous');
             const history = readWatchHistory().filter(h => String(h.userId) === String(userId));
             
             history.forEach(h => {
                 if (h.isComplete || h.duration > 30 || (h.lastWatchedTime / h.duration) > 0.5) {
                     watchedIds.add(h.videoId);
                 }
                 // Build affinity profile
                 const vid = videos.find(v => v.id === h.videoId || v.videoUrl === h.videoId);
                 if (vid) {
                     if (vid.authorId) affinity.authors[vid.authorId] = (affinity.authors[vid.authorId] || 0) + 1;
                     if (vid.category) affinity.categories[vid.category] = (affinity.categories[vid.category] || 0) + 1;
                 }
             });
        }

        videos = videos.map(v => {
            let score = 0;
            // Base score from popularity (log scale to dampen superstars)
            score += Math.log10(parseInt(v.views || 0) + 1);

            // Personalization boosts
            if (v.authorId && affinity.authors[v.authorId]) score += (affinity.authors[v.authorId] * 5);
            if (v.category && affinity.categories[v.category]) score += (affinity.categories[v.category] * 3);

            // Freshness boost
            const ageHours = Math.max(0, (Date.now() - (v.timestamp || Date.now())) / (1000 * 60 * 60));
            if (ageHours < 24) score += 10;
            else if (ageHours < 48) score += 5;

            // Penalty for already watched (but don't hide completely, just downrank)
            if (watchedIds.has(v.id) || watchedIds.has(v.videoUrl)) score -= 50; 

            return { ...v, score };
        }).sort((a, b) => b.score - a.score);
    }
    
    // Default / fallback: simple sort by date if no feed specified or unknown
    else {
        // Default to reverse chronological
        videos.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }

    return res.json({ success: true, videos });
  } catch (err) {
    console.error('get videos error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Publish a new video
app.post('/videos/publish', (req, res) => {
  try {
    console.log('POST /videos/publish received');
    console.log('Request body:', req.body);
    
    const { title, thumbnail, videoUrl, category, format, time, requester } = req.body;
    
    // Try to get authenticated user, otherwise use default
    let author = 'Anonymous';
    let authorId = 'anonymous';
    
    // Check if user is authenticated
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      const users = readUsers();
      const user = users.find(u => u.token === token);
      if (user) {
        author = user.name || user.email;
        authorId = user.email;
        console.log('Authenticated user:', author);
      }
    }
    
    if (!title) {
      console.log('ERROR: Title is missing');
      return res.status(400).json({ error: 'Title is required' });
    }

    // Validate that URLs are not blob URLs (they won't work across sessions)
    // If blob URLs are provided, use placeholders instead
    let finalThumbnail = thumbnail;
    let finalVideoUrl = videoUrl;
    
    if (thumbnail && thumbnail.startsWith('blob:')) {
      console.log('WARNING: Blob URL provided for thumbnail, using placeholder');
      finalThumbnail = null; // Will use default placeholder in the video object
    }
    
    if (videoUrl && videoUrl.startsWith('blob:')) {
      console.log('WARNING: Blob URL provided for video, setting to null');
      finalVideoUrl = null;
    }

    const videos = readVideos();
    console.log('Current videos count:', videos.length);
    
    // Generate unique ID by combining timestamp with random string
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newVideo = {
      id: uniqueId,
      title,
      author: author,
      authorId: authorId,
      requester: requester || null,
      time: time || '0:00',
      imageUrl: finalThumbnail || 'https://placehold.co/600x400/333333/ffffff?text=Video',
      videoUrl: finalVideoUrl || null,
      date: 'Just now',
      category: category || 'General',
      format: format || 'one-time',
      pinned: false,
      pinnedDays: null,
      bookmarked: false,
      timestamp: Date.now(),
      // Initialize stats at zero
      likes: '0',
      dislikes: '0',
      views: '0',
      comments: '0',
      shares: '0',
      retentionRate: '0',
      retentionPercentage: '0%'
    };

    videos.unshift(newVideo);
    console.log('Writing videos, new count:', videos.length);
    writeVideos(videos);
    
    // Update streak for the author if authenticated
    if (authorId && authorId !== 'anonymous') {
        const users = readUsers(); // Re-read to get ID if we only have email
        const user = users.find(u => u.email === authorId || u.id === authorId);
        if (user) updateStreak(user.id);
    }
    
    console.log('Video published successfully:', newVideo.title);

    return res.json({ success: true, video: newVideo });
  } catch (err) {
    console.error('publish video error', err);
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// Delete a published video
app.delete('/videos/:id', authMiddleware, (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const user = req.user;
    const videos = readVideos();
    
    const videoIndex = videos.findIndex(v => v.id === videoId);
    if (videoIndex === -1) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Only allow the author to delete their own video
    if (videos[videoIndex].authorId !== user.email) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    videos.splice(videoIndex, 1);
    writeVideos(videos);

    return res.json({ success: true });
  } catch (err) {
    console.error('delete video error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Follow a creator
app.post('/follow', authMiddleware, (req, res) => {
  try {
    const { creatorId } = req.body;
    if (!creatorId) return res.status(400).json({ error: 'Missing creatorId' });

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    // Find creator by id, email, or name
    const creator = users.find(u => 
      u.id === creatorId || 
      u.email === creatorId || 
      u.name === creatorId
    );
    if (!creator) return res.status(404).json({ error: 'Creator not found' });

    // Initialize following array if it doesn't exist
    if (!users[userIndex].following) {
      users[userIndex].following = [];
    }

    // Check if already following (use creator's ID for consistency)
    if (users[userIndex].following.includes(creator.id)) {
      return res.status(400).json({ error: 'Already following this creator' });
    }

    // Add to following list (use creator's ID)
    users[userIndex].following.push(creator.id);
    writeUsers(users);

    return res.json({ success: true, creatorId: creator.id });
  } catch (err) {
    console.error('follow error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Unfollow a creator
app.post('/unfollow', authMiddleware, (req, res) => {
  try {
    const { creatorId } = req.body;
    if (!creatorId) return res.status(400).json({ error: 'Missing creatorId' });

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    // Find creator by id, email, or name
    const creator = users.find(u => 
      u.id === creatorId || 
      u.email === creatorId || 
      u.name === creatorId
    );
    if (!creator) return res.status(404).json({ error: 'Creator not found' });

    // Initialize following array if it doesn't exist
    if (!users[userIndex].following) {
      users[userIndex].following = [];
    }

    // Remove from following list (use creator's ID)
    users[userIndex].following = users[userIndex].following.filter(id => id !== creator.id);
    writeUsers(users);

    return res.json({ success: true, creatorId: creator.id });
  } catch (err) {
    console.error('unfollow error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get following list with full creator details
app.get('/following', authMiddleware, (req, res) => {
  try {
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const following = user.following || [];
    const creators = following.map(creatorId => {
      const creator = users.find(u => u.id === creatorId);
      if (!creator) return null;
      
      // Count videos for this creator
      const videos = readVideos();
      const videoCount = videos.filter(v => v.authorId === creator.email || v.authorId === creator.id).length;

      return {
        id: creator.id,
        name: creator.name || 'Anonymous',
        handle: creator.handle || creator.tag || creator.email?.split('@')[0] || 'user',
        videos: videoCount,
        avatar: creator.image || `https://placehold.co/40x40/64748B/FFFFFF?text=${(creator.name || 'U')[0]}`
      };
    }).filter(c => c !== null);

    return res.json({ following: creators });
  } catch (err) {
    console.error('get following error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Check if following a creator
app.get('/following/:creatorId', authMiddleware, (req, res) => {
  try {
    const { creatorId } = req.params;
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const following = user.following || [];
    const isFollowing = following.includes(creatorId);

    return res.json({ isFollowing });
  } catch (err) {
    console.error('check following error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update email for authenticated user
app.post('/me/email', authMiddleware, async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body || {};
    if (!newEmail || !currentPassword) return res.status(400).json({ error: 'Missing newEmail or currentPassword' });
    const emailLower = String(newEmail).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) return res.status(400).json({ error: 'Invalid email format' });

    const users = readUsers();
    const idx = users.findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });

    // Check password
    const ok = await bcrypt.compare(currentPassword, users[idx].passwordHash);
    if (!ok) return res.status(401).json({ error: 'Incorrect password' });

    // Ensure email not taken
    if (users.find(u => u.email === emailLower && u.id !== req.user.id)) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    users[idx] = { ...users[idx], email: emailLower };
    writeUsers(users);
    const { passwordHash, ...publicUser } = users[idx];
    return res.json({ success: true, user: publicUser });
  } catch (err) {
    console.error('change email error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update password for authenticated user
app.post('/me/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing currentPassword or newPassword' });
    if (String(newPassword).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const users = readUsers();
    const idx = users.findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });

    const ok = await bcrypt.compare(currentPassword, users[idx].passwordHash);
    if (!ok) return res.status(401).json({ error: 'Incorrect password' });

    const hash = await bcrypt.hash(newPassword, 10);
    users[idx] = { ...users[idx], passwordHash: hash, passwordChangedAt: new Date().toISOString() };
    writeUsers(users);
    const { passwordHash, ...publicUser } = users[idx];
    return res.json({ success: true, user: publicUser });
  } catch (err) {
    console.error('change password error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// --- Watch History storage ---
const WATCH_FILE = path.join(__dirname, 'watchhistory.json');
function readWatchHistory() {
  try {
    if (!fs.existsSync(WATCH_FILE)) return [];
    const raw = fs.readFileSync(WATCH_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) { console.error('readWatchHistory error', err); return []; }
}
function writeWatchHistory(list) {
  try { fs.writeFileSync(WATCH_FILE, JSON.stringify(list, null, 2), 'utf8'); } catch (err) { console.error('writeWatchHistory error', err); }
}
function tryGetUser(req) {
  try {
    const auth = req.headers.authorization || '';
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.slice(7).trim();
      const users = readUsers();
      const user = users.find(u => u.token === token);
      if (user) return { id: user.id, email: user.email, name: user.name };
    }
  } catch {}
  return null;
}
// Upsert watch progress
app.post('/watch/history', (req, res) => {
  try {
    const { videoId, userId: bodyUserId, lastWatchedTime = 0, duration = 0, timestamp, isComplete = false } = req.body || {};
    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });
    const user = tryGetUser(req);
    const userId = user ? user.id : (bodyUserId || 'anonymous');
    const ts = timestamp ? (typeof timestamp === 'string' ? timestamp : new Date(timestamp).toISOString()) : new Date().toISOString();
    const list = readWatchHistory();
    const idx = list.findIndex(e => String(e.videoId) === String(videoId) && String(e.userId || 'anonymous') === String(userId));
    const entry = { videoId, userId, lastWatchedTime: Number(lastWatchedTime) || 0, duration: Number(duration) || 0, timestamp: ts, isComplete: Boolean(isComplete) };
    if (idx >= 0) list[idx] = { ...list[idx], ...entry }; else list.unshift(entry);
    if (list.length > 2000) list.splice(2000);
    writeWatchHistory(list);
    if (user) updateStreak(user.id);
    return res.json({ success: true });
  } catch (err) {
    console.error('POST /watch/history error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});
// Get watch history for current user (token optional; falls back to anonymous)
app.get('/watch/history', (req, res) => {
  try {
    const user = tryGetUser(req);
    const qUser = req.query.userId || null;
    const userId = user ? user.id : (qUser || 'anonymous');
    const list = readWatchHistory().filter(e => String(e.userId || 'anonymous') === String(userId));
    return res.json({ success: true, history: list });
  } catch (err) {
    console.error('GET /watch/history error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});
// Delete single entry
app.delete('/watch/history/:videoId', (req, res) => {
  try {
    const user = tryGetUser(req);
    const userId = user ? user.id : 'anonymous';
    const vid = req.params.videoId;
    let list = readWatchHistory();
    const before = list.length;
    list = list.filter(e => !(String(e.videoId) === String(vid) && String(e.userId || 'anonymous') === String(userId)));
    writeWatchHistory(list);
    return res.json({ success: true, removed: before - list.length });
  } catch (err) {
    console.error('DELETE /watch/history/:videoId error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});
// Clear all for user
app.delete('/watch/history', (req, res) => {
  try {
    const user = tryGetUser(req);
    const userId = user ? user.id : 'anonymous';
    let list = readWatchHistory();
    const before = list.length;
    list = list.filter(e => String(e.userId || 'anonymous') !== String(userId));
    writeWatchHistory(list);
    return res.json({ success: true, removed: before - list.length });
  } catch (err) {
    console.error('DELETE /watch/history error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// --- Bookmarks storage (per-user) ---
const BOOKMARKS_FILE = path.join(__dirname, 'bookmarks.json');
function readBookmarks() {
  try { if (!fs.existsSync(BOOKMARKS_FILE)) return { segments: [], videos: [], requests: [] }; const raw = fs.readFileSync(BOOKMARKS_FILE, 'utf8'); const j = JSON.parse(raw || '{}'); return { segments: j.segments || [], videos: j.videos || [], requests: j.requests || [] }; } catch (e) { return { segments: [], videos: [], requests: [] }; }
}
function writeBookmarks(data) {
  try { const safe = { segments: data.segments || [], videos: data.videos || [], requests: data.requests || [] }; fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify(safe, null, 2), 'utf8'); } catch (e) {}
}

function getUserIdOrAnon(req) { const u = tryGetUser(req); return u ? u.id : 'anonymous'; }

// Aggregate bookmarks for current user
app.get('/bookmarks', (req, res) => {
  try {
    const userId = getUserIdOrAnon(req);
    console.log('GET /bookmarks - userId:', userId, 'hasAuth:', !!req.headers.authorization);
    const all = readBookmarks();
    console.log('Total bookmarks in file - segments:', all.segments?.length, 'videos:', all.videos?.length, 'requests:', all.requests?.length);
    const segments = (all.segments || []).filter(b => String(b.userId||'anonymous') === String(userId));
    const videos = (all.videos || []).filter(b => String(b.userId||'anonymous') === String(userId));
    const requests = (all.requests || []).filter(b => String(b.userId||'anonymous') === String(userId));
    console.log('Filtered for user', userId, '- segments:', segments.length, 'videos:', videos.length, 'requests:', requests.length);
    if (requests.length > 0) {
      console.log('Returning request bookmarks:', requests.map(r => ({ id: r.id, requestId: r.requestId, userId: r.userId })));
    }
    return res.json({ success: true, segments, videos, requests });
  } catch (err) { console.error('GET /bookmarks error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Save a timestamped segment bookmark
app.post('/bookmarks/segments', (req, res) => {
  try {
    const userId = getUserIdOrAnon(req);
    const { videoUrl, label, startTime, endTime } = req.body || {};
    if (!videoUrl) return res.status(400).json({ error: 'Missing videoUrl' });
    const s = readBookmarks();
    const b = { id: `seg_${Date.now()}`, userId, videoUrl, label: label || '', startTime: Math.max(0, Number(startTime||0)), endTime: Math.max(0, Number(endTime||0)), createdAt: new Date().toISOString() };
    s.segments.unshift(b);
    // cap to reasonable size
    if (s.segments.length > 1000) s.segments.splice(1000);
    writeBookmarks(s);
    return res.json({ success: true, segment: b });
  } catch (err) { console.error('POST /bookmarks/segments error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Save a normal video bookmark
app.post('/bookmarks/videos', (req, res) => {
  try {
    const userId = getUserIdOrAnon(req);
    const { videoUrl, title, label } = req.body || {};
    if (!videoUrl) return res.status(400).json({ error: 'Missing videoUrl' });
    const s = readBookmarks();
    const b = { id: `vid_${Date.now()}`, userId, videoUrl, title: title || label || '', createdAt: new Date().toISOString() };
    s.videos.unshift(b);
    if (s.videos.length > 1000) s.videos.splice(1000);
    writeBookmarks(s);
    return res.json({ success: true, video: b });
  } catch (err) { console.error('POST /bookmarks/videos error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Remove a normal video bookmark for the current user by videoUrl
app.delete('/bookmarks/videos', (req, res) => {
  try {
    const userId = getUserIdOrAnon(req);
    const { videoUrl } = req.body || {};
    if (!videoUrl) return res.status(400).json({ error: 'Missing videoUrl' });
    const s = readBookmarks();
    const before = (s.videos || []).length;
    s.videos = (s.videos || []).filter(b => !(String(b.userId || 'anonymous') === String(userId) && String(b.videoUrl) === String(videoUrl)));
    writeBookmarks(s);
    return res.json({ success: true, removed: Math.max(0, before - (s.videos || []).length) });
  } catch (err) { console.error('DELETE /bookmarks/videos error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Save a request bookmark
app.post('/bookmarks/requests', (req, res) => {
  try {
    const userId = getUserIdOrAnon(req);
    const { requestId, title } = req.body || {};
    if (!requestId) return res.status(400).json({ error: 'Missing requestId' });
    const s = readBookmarks();
    const b = { id: `req_${Date.now()}`, userId, requestId, title: title || '', createdAt: new Date().toISOString() };
    s.requests.unshift(b);
    if (s.requests.length > 1000) s.requests.splice(1000);
    writeBookmarks(s);
    return res.json({ success: true, request: b });
  } catch (err) { console.error('POST /bookmarks/requests error', err); return res.status(500).json({ error: 'Server error' }); }
});

// --- Reactions storage (per-user per-request) ---
const REQUEST_REACTIONS_FILE = path.join(__dirname, 'request_reactions.json');
function readRequestReactions() {
  try { if (!fs.existsSync(REQUEST_REACTIONS_FILE)) return { likes: {}, dislikes: {} }; const raw = fs.readFileSync(REQUEST_REACTIONS_FILE, 'utf8'); const j = JSON.parse(raw || '{}'); return { likes: j.likes || {}, dislikes: j.dislikes || {} }; } catch (e) { return { likes: {}, dislikes: {} }; }
}
function writeRequestReactions(data) {
  try { const safe = { likes: data.likes || {}, dislikes: data.dislikes || {} }; fs.writeFileSync(REQUEST_REACTIONS_FILE, JSON.stringify(safe, null, 2), 'utf8'); } catch (e) {}
}

// Persist request reactions and aggregate counts
app.post('/requests/react', (req, res) => {
  try {
    const { requestId, action } = req.body || {};
    if (!requestId || !action) return res.status(400).json({ error: 'Missing requestId or action' });
    const user = tryGetUser(req);
    const userId = user ? user.id : 'anonymous';
    const reactions = readRequestReactions();
    const requests = readRequests();
    const idx = requests.findIndex(r => String(r.id) === String(requestId));
    if (idx === -1) return res.status(404).json({ error: 'Request not found' });

    // Initialize maps
    reactions.likes[requestId] = reactions.likes[requestId] || {};
    reactions.dislikes[requestId] = reactions.dislikes[requestId] || {};

    let likesCount = Number(requests[idx].likes || 0);

    if (action === 'like') {
      // If previously liked do nothing; if previously disliked, clear it
      if (!reactions.likes[requestId][userId]) {
        reactions.likes[requestId][userId] = true;
        likesCount += 1;
      }
      if (reactions.dislikes[requestId][userId]) {
        delete reactions.dislikes[requestId][userId];
      }
    } else if (action === 'unlike') {
      if (reactions.likes[requestId][userId]) {
        delete reactions.likes[requestId][userId];
        likesCount = Math.max(0, likesCount - 1);
      }
    } else if (action === 'dislike') {
      reactions.dislikes[requestId][userId] = true;
      // If previously liked, undo like
      if (reactions.likes[requestId][userId]) {
        delete reactions.likes[requestId][userId];
        likesCount = Math.max(0, likesCount - 1);
      }
    } else if (action === 'undislike') {
      if (reactions.dislikes[requestId][userId]) delete reactions.dislikes[requestId][userId];
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Update aggregate likes count on the request
    requests[idx].likes = likesCount;
    writeRequests(requests);
    writeRequestReactions(reactions);

    return res.json({ success: true, requestId, action, likes: likesCount });
  } catch (err) {
    console.error('requests react error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get current user's reactions map (requires auth)
app.get('/requests/react/me', authMiddleware, (req, res) => {
  try {
    const reactions = readRequestReactions();
    const userId = req.user.id;
    const map = {};
    // Build compact map per request
    Object.keys(reactions.likes || {}).forEach(reqId => {
      if (reactions.likes[reqId][userId]) {
        map[reqId] = map[reqId] || {};
        map[reqId].isLiked = true;
      }
    });
    Object.keys(reactions.dislikes || {}).forEach(reqId => {
      if (reactions.dislikes[reqId][userId]) {
        map[reqId] = map[reqId] || {};
        map[reqId].isDisliked = true;
      }
    });
    return res.json({ success: true, reactions: map });
  } catch (err) {
    console.error('get reactions error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Payment session stub: update boosts and return success
app.post('/api/pay/create-session', (req, res) => {
  try {
    const { requestId, amount, provider } = req.body || {};
    if (!requestId || !amount) return res.status(400).json({ error: 'Missing requestId or amount' });
    const requests = readRequests();
    const idx = requests.findIndex(r => String(r.id) === String(requestId));
    if (idx === -1) return res.status(404).json({ error: 'Request not found' });
    const prev = Number(requests[idx].boosts || 0);
    requests[idx].boosts = prev + Number(amount);
    writeRequests(requests);
    return res.json({ success: true, provider: provider || 'unknown' });
  } catch (err) {
    console.error('create-session error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update request status and notify requester
app.post('/requests/:id/status', authMiddleware, (req, res) => {
  try {
    const requestId = req.params.id;
    const { step, message } = req.body || {};
    
    const requests = readRequests();
    const idx = requests.findIndex(r => String(r.id) === String(requestId));
    if (idx === -1) return res.status(404).json({ error: 'Request not found' });
    
    const request = requests[idx];
    
    // Check if claimed by current user
    if (!request.claimed || !request.claimedBy || request.claimedBy.id !== req.user.id) {
       return res.status(403).json({ error: 'Not authorized to update this request' });
    }
    
    // Update step
    if (step) request.currentStep = step;
    request.updatedAt = new Date().toISOString();
    writeRequests(requests);
    
    // Notify requester
    if (request.createdBy) {
        // Construct notification message
        // steps are 1-based index in dashboard logic
        const stepsLabels = ['Request Received', 'Under Review', 'In Production', 'Preview Ready', 'Published', 'Completed'];
        const stepLabel = (typeof step === 'number' && step > 0 && step <= stepsLabels.length) ? stepsLabels[step-1] : step;
        
        const notifText = `Update for "${request.title}": ${stepLabel} ${message ? ' - ' + message : ''}`;
        
        const suggestion = {
          id: `n-${Date.now()}`,
          requestId: request.id,
          text: notifText,
          from: { id: req.user.id, name: req.user.name || req.user.email },
          to: { id: request.createdBy }, // Requester ID
          createdAt: new Date().toISOString(),
          type: 'status_update',
          metadata: { step, message }
        };
        
        const SUG_FILE = path.join(__dirname, 'suggestions.json');
        let arr = [];
        try { if (fs.existsSync(SUG_FILE)) arr = JSON.parse(fs.readFileSync(SUG_FILE, 'utf8') || '[]'); } catch {}
        arr.unshift(suggestion);
        try { fs.writeFileSync(SUG_FILE, JSON.stringify(arr, null, 2), 'utf8'); } catch {}
    }

    return res.json({ success: true, currentStep: request.currentStep });
  } catch (err) {
    console.error('update status error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Video reactions storage (likes/dislikes per video per user)
const VIDEO_REACTIONS_FILE = path.join(__dirname, 'video_reactions.json');
function readVideoReactions() { try { if (!fs.existsSync(VIDEO_REACTIONS_FILE)) return { likes: {}, dislikes: {} }; const raw = fs.readFileSync(VIDEO_REACTIONS_FILE, 'utf8'); const j = JSON.parse(raw || '{}'); return { likes: j.likes || {}, dislikes: j.dislikes || {} }; } catch (e) { return { likes: {}, dislikes: {} }; } }
function writeVideoReactions(data) { try { const safe = { likes: data.likes || {}, dislikes: data.dislikes || {} }; fs.writeFileSync(VIDEO_REACTIONS_FILE, JSON.stringify(safe, null, 2), 'utf8'); } catch (e) {} }

// Helper: find video index by flexible id/url/title matching
function findVideoIndexById(videoId) {
  try {
    const videos = readVideos();
    return videos.findIndex(v => String(v.id) === String(videoId) || String(v.url) === String(videoId) || String(v.videoUrl) === String(videoId) || String(v.src) === String(videoId) || String(v.title) === String(videoId));
  } catch (e) { return -1; }
}

// GET like/dislike status for a given video (checks token if provided)
app.get('/likes/status', (req, res) => {
  try {
    const videoId = req.query.videoId || null;
    if (!videoId) return res.json({ liked: false, disliked: false });
    const reactions = readVideoReactions();
    let liked = false;
    let disliked = false;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const token = req.headers.authorization.slice(7).trim();
      const users = readUsers();
      const user = users.find(u => u.token === token);
      if (user) {
        liked = !!(reactions.likes[videoId] && reactions.likes[videoId][user.id]);
        disliked = !!(reactions.dislikes[videoId] && reactions.dislikes[videoId][user.id]);
      }
    }
    return res.json({ liked, disliked });
  } catch (err) { console.error('GET /likes/status error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Like/unlike endpoints (require auth)
app.post('/likes', authMiddleware, (req, res) => {
  try {
    const { videoId } = req.body || {};
    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });
    const userId = req.user.id;
    const reactions = readVideoReactions();
    const videos = readVideos();
    const vidx = findVideoIndexById(videoId);

    reactions.likes[videoId] = reactions.likes[videoId] || {};
    reactions.dislikes[videoId] = reactions.dislikes[videoId] || {};

    let likesCount = Number((vidx !== -1 ? (videos[vidx].likes || 0) : 0)) || 0;
    let dislikesCount = Number((vidx !== -1 ? (videos[vidx].dislikes || 0) : 0)) || 0;

    if (!reactions.likes[videoId][userId]) {
      reactions.likes[videoId][userId] = true;
      likesCount += 1;
    }
    if (reactions.dislikes[videoId][userId]) {
      delete reactions.dislikes[videoId][userId];
      dislikesCount = Math.max(0, dislikesCount - 1);
    }

    writeVideoReactions(reactions);
    if (vidx !== -1) {
      videos[vidx].likes = String(likesCount);
      videos[vidx].dislikes = String(dislikesCount);
      writeVideos(videos);
    }

    return res.json({ success: true, likes: likesCount, dislikes: dislikesCount });
  } catch (err) { console.error('POST /likes error', err); return res.status(500).json({ error: 'Server error' }); }
});

app.delete('/likes', authMiddleware, (req, res) => {
  try {
    const { videoId } = req.body || {};
    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });
    const userId = req.user.id;
    const reactions = readVideoReactions();
    const videos = readVideos();
    const vidx = findVideoIndexById(videoId);

    reactions.likes[videoId] = reactions.likes[videoId] || {};

    let likesCount = Number((vidx !== -1 ? (videos[vidx].likes || 0) : 0)) || 0;

    if (reactions.likes[videoId][userId]) {
      delete reactions.likes[videoId][userId];
      likesCount = Math.max(0, likesCount - 1);
    }

    writeVideoReactions(reactions);
    if (vidx !== -1) {
      videos[vidx].likes = String(likesCount);
      writeVideos(videos);
    }

    return res.json({ success: true, likes: likesCount });
  } catch (err) { console.error('DELETE /likes error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Dislike/un-dislike endpoints (require auth)
app.post('/dislikes', authMiddleware, (req, res) => {
  try {
    const { videoId } = req.body || {};
    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });
    const userId = req.user.id;
    const reactions = readVideoReactions();
    const videos = readVideos();
    const vidx = findVideoIndexById(videoId);

    reactions.likes[videoId] = reactions.likes[videoId] || {};
    reactions.dislikes[videoId] = reactions.dislikes[videoId] || {};

    let likesCount = Number((vidx !== -1 ? (videos[vidx].likes || 0) : 0)) || 0;
    let dislikesCount = Number((vidx !== -1 ? (videos[vidx].dislikes || 0) : 0)) || 0;

    if (!reactions.dislikes[videoId][userId]) {
      reactions.dislikes[videoId][userId] = true;
      dislikesCount += 1;
    }
    if (reactions.likes[videoId][userId]) {
      delete reactions.likes[videoId][userId];
      likesCount = Math.max(0, likesCount - 1);
    }

    writeVideoReactions(reactions);
    if (vidx !== -1) {
      videos[vidx].likes = String(likesCount);
      videos[vidx].dislikes = String(dislikesCount);
      writeVideos(videos);
    }

    return res.json({ success: true, likes: likesCount, dislikes: dislikesCount });
  } catch (err) { console.error('POST /dislikes error', err); return res.status(500).json({ error: 'Server error' }); }
});

app.delete('/dislikes', authMiddleware, (req, res) => {
  try {
    const { videoId } = req.body || {};
    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });
    const userId = req.user.id;
    const reactions = readVideoReactions();
    const videos = readVideos();
    const vidx = findVideoIndexById(videoId);

    reactions.dislikes[videoId] = reactions.dislikes[videoId] || {};

    let dislikesCount = Number((vidx !== -1 ? (videos[vidx].dislikes || 0) : 0)) || 0;

    if (reactions.dislikes[videoId][userId]) {
      delete reactions.dislikes[videoId][userId];
      dislikesCount = Math.max(0, dislikesCount - 1);
    }

    writeVideoReactions(reactions);
    if (vidx !== -1) {
      videos[vidx].dislikes = String(dislikesCount);
      writeVideos(videos);
    }

    return res.json({ success: true, dislikes: dislikesCount });
  } catch (err) { console.error('DELETE /dislikes error', err); return res.status(500).json({ error: 'Server error' }); }
});

app.listen(PORT, () => console.log(`Regaarder backend listening on ${PORT}`));
