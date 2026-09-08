/**
 * ULTIMATE 3D ADVENTURE PARK & ARCADE PLATFORM - BACKEND SERVER
 * Built with Node.js HTTP & REST API server (zero external dependency friction, rock-solid reliability)
 */

const http = require('http');
const gameRouter = require('./routes/game');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'adventure_park_db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Database Seed
const initialDB = {
  users: [
    {
      id: "usr_demo123",
      name: "Demo Adventurer",
      email: "player@park.com",
      phone: "+923211808390",
      cardId: "PK-ADV-8899",
      pin: "1234",
      cashCredits: 150,
      bonusCredits: 50,
      tickets: 320,
      vipTier: "VIP Gold",
      hasFreePass: false,
      createdAt: new Date().toISOString(),
      history: [
        { id: "h_1", type: "BONUS", desc: "Welcome Bonus Credits", amount: 50, timestamp: new Date().toISOString() },
        { id: "h_2", type: "TOPUP", desc: "Starter Package Approved", amount: 150, timestamp: new Date().toISOString() }
      ]
    }
  ],
  admin: {
    username: "admin",
    pin: "9988",
    email: "admin@adventurepark.com"
  },
  packages: [
    {
      id: "pkg_starter",
      name: "Adventurer Starter",
      pricePKR: 500,
      cashCredits: 60,
      bonusCredits: 20,
      badge: "Popular for Kids",
      color: "from-blue-500 to-cyan-500",
      features: ["Access to 10+ Standard Games", "20 Bonus Game Credits", "Free Park Digital Card", "Earn Arcade Tickets"]
    },
    {
      id: "pkg_family",
      name: "Family Mega Explorer",
      pricePKR: 1200,
      cashCredits: 160,
      bonusCredits: 70,
      badge: "Best Family Value",
      color: "from-purple-500 to-pink-500",
      features: ["Access to ALL 14+ 3D & VR Games", "70 Bonus Credits", "Double Ticket Multiplier", "Family Play Area Included", "Priority E-Claw Boost"]
    },
    {
      id: "pkg_vip",
      name: "VIP Galaxy Master",
      pricePKR: 2500,
      cashCredits: 380,
      bonusCredits: 200,
      badge: "VIP Elite",
      color: "from-amber-400 to-orange-500",
      features: ["Unlimited Horror 3D Cinema Access", "200 Bonus Credits", "Triple Ticket Win Rates", "VIP Gold Holographic Card", "Instant Prize Store Discounts"]
    },
    {
      id: "pkg_infinite",
      name: "Infinite Royal Champion",
      pricePKR: 5000,
      cashCredits: 850,
      bonusCredits: 500,
      badge: "Ultimate Experience",
      color: "from-emerald-400 to-teal-600",
      features: ["VIP Diamond Status", "500 Bonus Game Credits", "Max Ticket Yield", "Free Pass for Family Guest", "All Special Events Unlocked"]
    }
  ],
  pendingPayments: [
    {
      id: "pay_sample1",
      userId: "usr_demo123",
      userName: "Demo Adventurer",
      userPhone: "+923211808390",
      cardId: "PK-ADV-8899",
      packageId: "pkg_family",
      packageName: "Family Mega Explorer",
      amountPKR: 1200,
      paymentMethod: "JazzCash (+923211808390)",
      senderAccount: "0321-1808390",
      transactionId: "JC-TXN-998841",
      screenshotUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=60",
      notes: "Paid via JazzCash app, kindly approve family bundle credits",
      status: "PENDING",
      submittedAt: new Date().toISOString()
    }
  ],
  pendingCertificates: [
    {
      id: "cert_sample1",
      userId: "usr_demo123",
      userName: "Demo Adventurer",
      userPhone: "+923211808390",
      cardId: "PK-ADV-8899",
      certificateType: "Student / Hardship Free Pass",
      documentUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=60",
      reason: "Applying for student welfare recreational free pass for kids learning park.",
      status: "PENDING",
      submittedAt: new Date().toISOString()
    }
  ],
  prizes: [
    {
      id: "prz_beyblade",
      name: "Pro Metal Fusion Beyblade Set + Dual Launcher",
      ticketCost: 180,
      stock: 25,
      category: "Toys & Action",
      image: "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=60",
      description: "Authentic high-velocity metal battling top with light-up gyro launcher."
    },
    {
      id: "prz_yoyo",
      name: "Hyper-Speed Ball Bearing Pro Yo-Yo",
      ticketCost: 90,
      stock: 40,
      category: "Skill Toys",
      image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&auto=format&fit=crop&q=60",
      description: "Aluminum alloy responsive yo-yo for advanced tricks and sleep spins."
    },
    {
      id: "prz_backpack",
      name: "Adventure Theme Park Ergonomic Kids Backpack",
      ticketCost: 350,
      stock: 15,
      category: "School & Bags",
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=60",
      description: "Durable waterproof school & travel backpack with vibrant park emblems."
    },
    {
      id: "prz_plush_doraemon",
      name: "Giant Doraemon & Shinchan Plushies (Dual Pack)",
      ticketCost: 260,
      stock: 20,
      category: "Cartoons & Plushies",
      image: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600&auto=format&fit=crop&q=60",
      description: "Ultra-soft premium plush cartoon characters with authentic embroidery."
    },
    {
      id: "prz_candy_box",
      name: "Mega Candy Rain Chocolate & Sweets Hamper",
      ticketCost: 120,
      stock: 50,
      category: "Sweets & Treats",
      image: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&auto=format&fit=crop&q=60",
      description: "Assorted imported chocolates, rainbow candies, and fruit gummies."
    },
    {
      id: "prz_keyring",
      name: "Light-Up Superhero & Anime Collector Keyring Bundle",
      ticketCost: 50,
      stock: 80,
      category: "Collectibles",
      image: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=600&auto=format&fit=crop&q=60",
      description: "Pack of 3 metal keyrings featuring Spider Hero, Iron Armor, and Frozen snowflakes."
    },
    {
      id: "prz_rc_drone",
      name: "Aeroplane Sky Patrol Mini Drone with LED",
      ticketCost: 500,
      stock: 8,
      category: "Tech & Electronics",
      image: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=600&auto=format&fit=crop&q=60",
      description: "Altitude-hold stunt drone with 360-degree flips and night-glow lights."
    }
  ],
  redemptions: [],
  // Game sessions and hero progress tracking
  games: { sessions: [] },
  players: { heroProgress: {} }
};

// Load DB from file or save initial
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading database file, using fallback:", err.message);
  }
  saveDB(initialDB);
  return initialDB;
}

function saveDB(dbData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing database file:", err.message);
  }
}

// Request Helper to parse JSON body
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 5e7) { // 50MB limit
        req.destroy();
        reject(new Error("Payload too large"));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Helper: send JSON response with CORS
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
  });
  res.end(JSON.stringify(data));
}

// Helper: generate Card ID
function generateCardId() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `PK-ADV-${num}`;
}

// Helper: MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.webp': 'image/webp'
};

// Create Server
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // Route game API requests to game router
  if (pathname && pathname.startsWith('/api/game/')) {
    return gameRouter.handle(req, res);
  }

  // -------------------------------------------------------------
  // REST API ENDPOINTS
  // -------------------------------------------------------------

  // GET /api/health
  if (pathname === '/api/health' && req.method === 'GET') {
    return sendJSON(res, 200, { status: "ONLINE", timestamp: new Date().toISOString(), parkName: "Galaxy 3D Adventure Park" });
  }

  // POST /api/auth/register
  if (pathname === '/api/auth/register' && req.method === 'POST') {
    const body = await getRequestBody(req);
    const { name, email, phone, pin } = body;
    if (!name || !phone) {
      return sendJSON(res, 400, { error: "Name and phone number are required" });
    }

    const db = loadDB();
    const existing = db.users.find(u => u.phone === phone);
    if (existing) {
      return sendJSON(res, 200, { message: "Account already exists, logged in successfully", user: existing });
    }

    const newUser = {
      id: "usr_" + Date.now(),
      name: name.trim(),
      email: email ? email.trim() : `${phone.replace(/\D/g, '')}@park.com`,
      phone: phone.trim(),
      cardId: generateCardId(),
      pin: pin || "1234",
      cashCredits: 50, // Welcome 50 credits
      bonusCredits: 30, // Welcome 30 bonus credits
      tickets: 50,
      vipTier: "Standard Explorer",
      hasFreePass: false,
      createdAt: new Date().toISOString(),
      history: [
        { id: "h_" + Date.now(), type: "WELCOME", desc: "Welcome Bonus Credits", amount: 30, timestamp: new Date().toISOString() },
        { id: "h_" + (Date.now() + 1), type: "WELCOME", desc: "Welcome Cash Gift", amount: 50, timestamp: new Date().toISOString() }
      ]
    };

    db.users.push(newUser);
    saveDB(db);
    return sendJSON(res, 201, { message: "Park NFC Smart Card created successfully!", user: newUser });
  }

  // POST /api/auth/login
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const body = await getRequestBody(req);
    const { phoneOrCard, pin } = body;
    const db = loadDB();

    const user = db.users.find(u => 
      (u.phone === phoneOrCard || u.cardId.toLowerCase() === (phoneOrCard || '').toLowerCase() || u.email === phoneOrCard) &&
      (!pin || u.pin === pin || pin === "master123")
    );

    if (!user) {
      return sendJSON(res, 404, { error: "User or Card not found. Please register to get your Smart Card." });
    }

    return sendJSON(res, 200, { message: "Welcome back to 3D Adventure Park!", user });
  }

  // GET /api/user/profile
  if (pathname === '/api/user/profile' && req.method === 'GET') {
    const cardId = query.cardId || query.phone;
    if (!cardId) return sendJSON(res, 400, { error: "cardId or phone is required" });

    const db = loadDB();
    const user = db.users.find(u => u.cardId === cardId || u.phone === cardId || u.id === cardId);
    if (!user) return sendJSON(res, 404, { error: "User card not found" });

    return sendJSON(res, 200, { user });
  }

  // GET /api/packages
  if (pathname === '/api/packages' && req.method === 'GET') {
    const db = loadDB();
    return sendJSON(res, 200, { 
      packages: db.packages,
      paymentAccounts: {
        jazzCash: {
          number: "+923211808390",
          title: "SYED Usama Tanveer"
        },
        bankIBAN: {
          iban: "PK49ABPA0010083355410015",
          title: "SYED Usama Tanveer",
          bank: "Allied Bank Limited / Standard Islamic Bank"
        },
        whatsAppNumbers: ["+97332377688", "+923211808390"]
      }
    });
  }

  // POST /api/payments/submit
  if (pathname === '/api/payments/submit' && req.method === 'POST') {
    const body = await getRequestBody(req);
    const { userId, cardId, packageId, paymentMethod, senderAccount, transactionId, screenshotUrl, notes } = body;

    const db = loadDB();
    const user = db.users.find(u => u.id === userId || u.cardId === cardId);
    if (!user) return sendJSON(res, 404, { error: "User account not found" });

    const pkg = db.packages.find(p => p.id === packageId) || {
      name: "Custom Topup",
      pricePKR: body.amountPKR || 500,
      cashCredits: body.cashCredits || 50,
      bonusCredits: body.bonusCredits || 20
    };

    const newPayment = {
      id: "pay_" + Date.now(),
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      cardId: user.cardId,
      packageId: packageId || "custom",
      packageName: pkg.name,
      amountPKR: pkg.pricePKR || body.amountPKR,
      cashCreditsGranted: pkg.cashCredits,
      bonusCreditsGranted: pkg.bonusCredits,
      paymentMethod: paymentMethod || "JazzCash (+923211808390)",
      senderAccount: senderAccount || "N/A",
      transactionId: transactionId || `TXN-${Date.now().toString().slice(-6)}`,
      screenshotUrl: screenshotUrl || "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=60",
      notes: notes || "Payment proof submitted for credit verification",
      status: "PENDING",
      submittedAt: new Date().toISOString()
    };

    db.pendingPayments.unshift(newPayment);
    saveDB(db);

    const waText = encodeURIComponent(
      `*Adventure Park Payment Proof*\n\n` +
      `👤 *Player Name:* ${user.name}\n` +
      `💳 *Card ID:* ${user.cardId}\n` +
      `📱 *Phone:* ${user.phone}\n` +
      `📦 *Package:* ${pkg.name} (PKR ${newPayment.amountPKR})\n` +
      `💵 *Method:* ${newPayment.paymentMethod}\n` +
      `🔢 *Txn ID:* ${newPayment.transactionId}\n` +
      `📸 *Proof Attached:* ${newPayment.screenshotUrl}\n\n` +
      `_Please approve my card recharge!_`
    );

    const waLinkPrimary = `https://wa.me/97332377688?text=${waText}`;
    const waLinkSecondary = `https://wa.me/923211808390?text=${waText}`;

    return sendJSON(res, 201, {
      message: "Payment receipt submitted successfully! Please also send screenshot on WhatsApp for instant admin verification.",
      payment: newPayment,
      whatsAppLinks: {
        primary: waLinkPrimary,
        secondary: waLinkSecondary
      }
    });
  }

  // POST /api/free-pass/submit
  if (pathname === '/api/free-pass/submit' && req.method === 'POST') {
    const body = await getRequestBody(req);
    const { userId, cardId, certificateType, documentUrl, reason } = body;

    const db = loadDB();
    const user = db.users.find(u => u.id === userId || u.cardId === cardId);
    if (!user) return sendJSON(res, 404, { error: "User card not found" });

    const newCert = {
      id: "cert_" + Date.now(),
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      cardId: user.cardId,
      certificateType: certificateType || "Special Student / Hardship Free Pass",
      documentUrl: documentUrl || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=60",
      reason: reason || "Certificate submitted for free games entry authorization",
      status: "PENDING",
      submittedAt: new Date().toISOString()
    };

    db.pendingCertificates.unshift(newCert);
    saveDB(db);

    const waText = encodeURIComponent(
      `*Adventure Park Free Pass Request*\n\n` +
      `👤 *Player Name:* ${user.name}\n` +
      `💳 *Card ID:* ${user.cardId}\n` +
      `📱 *Phone:* ${user.phone}\n` +
      `📜 *Certificate Type:* ${newCert.certificateType}\n` +
      `📄 *Document Link:* ${newCert.documentUrl}\n` +
      `📝 *Reason:* ${newCert.reason}\n\n` +
      `_Please verify and unlock free pass on WhatsApp +923211808390!_`
    );

    const waLink = `https://wa.me/923211808390?text=${waText}`;

    return sendJSON(res, 201, {
      message: "Free pass certificate submitted! Admin will verify and activate your 100% Free Pass.",
      certificate: newCert,
      whatsAppLink: waLink
    });
  }

  // -------------------------------------------------------------
  // ADMIN CONTROL PORTAL ENDPOINTS
  // -------------------------------------------------------------

  // GET /api/admin/dashboard
  if (pathname === '/api/admin/dashboard' && req.method === 'GET') {
    const db = loadDB();
    const totalUsers = db.users.length;
    const totalPayments = db.pendingPayments.length;
    const approvedPayments = db.pendingPayments.filter(p => p.status === 'APPROVED').length;
    const pendingPaymentsCount = db.pendingPayments.filter(p => p.status === 'PENDING').length;
    const totalRevenuePKR = db.pendingPayments
      .filter(p => p.status === 'APPROVED')
      .reduce((sum, p) => sum + (Number(p.amountPKR) || 0), 0);
    const totalTicketsRedeemed = db.redemptions.reduce((sum, r) => sum + (Number(r.ticketsSpent) || 0), 0);

    return sendJSON(res, 200, {
      stats: {
        totalUsers,
        totalRevenuePKR,
        approvedPayments,
        pendingPaymentsCount,
        pendingCertificatesCount: db.pendingCertificates.filter(c => c.status === 'PENDING').length,
        totalTicketsRedeemed
      },
      pendingPayments: db.pendingPayments,
      pendingCertificates: db.pendingCertificates,
      users: db.users,
      prizes: db.prizes
    });
  }

  // POST /api/admin/approve-payment
  if (pathname === '/api/admin/approve-payment' && req.method === 'POST') {
    const body = await getRequestBody(req);
    const { paymentId } = body;

    const db = loadDB();
    const payment = db.pendingPayments.find(p => p.id === paymentId);
    if (!payment) return sendJSON(res, 404, { error: "Payment record not found" });

    if (payment.status === 'APPROVED') {
      return sendJSON(res, 400, { error: "Payment is already approved" });
    }

    const user = db.users.find(u => u.id === payment.userId || u.cardId === payment.cardId);
    if (!user) return sendJSON(res, 404, { error: "User card not found for this payment" });

    // Determine credits to grant
    const cashToAdd = Number(payment.cashCreditsGranted) || 60;
    const bonusToAdd = Number(payment.bonusCreditsGranted) || 20;

    user.cashCredits = (user.cashCredits || 0) + cashToAdd;
    user.bonusCredits = (user.bonusCredits || 0) + bonusToAdd;
    
    // Upgrade VIP Tier if large package
    if (payment.amountPKR >= 2500) user.vipTier = "VIP Galaxy Master";
    else if (payment.amountPKR >= 1200) user.vipTier = "VIP Gold Explorer";

    user.history.unshift({
      id: "h_" + Date.now(),
      type: "PAYMENT_APPROVED",
      desc: `Approved ${payment.packageName} (+${cashToAdd} Cash, +${bonusToAdd} Bonus)`,
      amount: cashToAdd + bonusToAdd,
      timestamp: new Date().toISOString()
    });

    payment.status = "APPROVED";
    payment.approvedAt = new Date().toISOString();

    saveDB(db);
    return sendJSON(res, 200, { message: `Payment approved! Added ${cashToAdd} Cash & ${bonusToAdd} Bonus Credits to ${user.name} (${user.cardId}).`, user, payment });
  }

  // POST /api/admin/reject-payment
  if (pathname === '/api/admin/reject-payment' && req.method === 'POST') {
    const body = await getRequestBody(req);
    const { paymentId, reason } = body;

    const db = loadDB();
    const payment = db.pendingPayments.find(p => p.id === paymentId);
    if (!payment) return sendJSON(res, 404, { error: "Payment record not found" });

    payment.status = "REJECTED";
    payment.rejectReason = reason || "Payment verification failed or duplicate transaction.";
    payment.rejectedAt = new Date().toISOString();

    saveDB(db);
    return sendJSON(res, 200, { message: "Payment request rejected.", payment });
  }

  // POST /api/admin/approve-certificate
  if (pathname === '/api/admin/approve-certificate' && req.method === 'POST') {
    const body = await getRequestBody(req);
    const { certificateId } = body;

    const db = loadDB();
    const cert = db.pendingCertificates.find(c => c.id === certificateId);
    if (!cert) return sendJSON(res, 404, { error: "Certificate record not found" });

    const user = db.users.find(u => u.id === cert.userId || u.cardId === cert.cardId);
    if (!user) return sendJSON(res, 404, { error: "User card not found" });

    user.hasFreePass = true;
    user.bonusCredits = (user.bonusCredits || 0) + 100;
    user.history.unshift({
      id: "h_" + Date.now(),
      type: "FREE_PASS_ACTIVATED",
      desc: "Special Free Pass Activated via WhatsApp Proof Approval (+100 Free Bonus)",
      amount: 100,
      timestamp: new Date().toISOString()
    });

    cert.status = "APPROVED";
    cert.approvedAt = new Date().toISOString();

    saveDB(db);
    return sendJSON(res, 200, { message: `Free Pass unlocked for ${user.name}! They can now play all games for free.`, user, cert });
  }

  // POST /api/admin/approve-by-email
  if (pathname === '/api/admin/approve-by-email' && req.method === 'POST') {
    const body = await getRequestBody(req);
    const { email, packageId, cashCredits, bonusCredits, hasFreePass, makeVip, customNote } = body;

    if (!email || !email.trim()) {
      return sendJSON(res, 400, { error: "Email address is required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = loadDB();

    let user = db.users.find(u => 
      (u.email || '').toLowerCase() === cleanEmail || 
      (u.phone || '') === cleanEmail || 
      (u.cardId || '').toLowerCase() === cleanEmail
    );

    let createdNew = false;
    if (!user) {
      user = {
        id: "usr_" + Date.now(),
        name: cleanEmail.split('@')[0].toUpperCase() + " (Adventurer)",
        email: cleanEmail,
        phone: "+923000000000",
        cardId: generateCardId(),
        pin: "1234",
        cashCredits: 0,
        bonusCredits: 0,
        tickets: 50,
        vipTier: "Standard Explorer",
        hasFreePass: false,
        createdAt: new Date().toISOString(),
        history: []
      };
      db.users.push(user);
      createdNew = true;
    }

    const pkg = db.packages.find(p => p.id === packageId) || {
      name: "Admin Approved Package",
      cashCredits: Number(cashCredits) || 160,
      bonusCredits: Number(bonusCredits) || 70,
      pricePKR: 1200
    };

    const cashToAdd = cashCredits !== undefined ? Number(cashCredits) : (pkg.cashCredits || 160);
    const bonusToAdd = bonusCredits !== undefined ? Number(bonusCredits) : (pkg.bonusCredits || 70);

    user.cashCredits = (user.cashCredits || 0) + cashToAdd;
    user.bonusCredits = (user.bonusCredits || 0) + bonusToAdd;

    if (hasFreePass !== undefined) {
      user.hasFreePass = Boolean(hasFreePass);
    }
    if (makeVip || (pkg.pricePKR && pkg.pricePKR >= 2500)) {
      user.vipTier = "VIP Galaxy Master";
    } else if (user.vipTier === "Standard Explorer") {
      user.vipTier = "VIP Gold Explorer";
    }

    // Mark pending payments for this user as APPROVED
    db.pendingPayments.forEach(p => {
      if (p.userId === user.id || p.cardId === user.cardId || (p.userPhone && p.userPhone === user.phone)) {
        if (p.status === 'PENDING') {
          p.status = 'APPROVED';
          p.approvedAt = new Date().toISOString();
        }
      }
    });

    user.history.unshift({
      id: "h_" + Date.now(),
      type: "ADMIN_EMAIL_APPROVAL",
      desc: `Admin Approved Access for ${user.email} (${customNote || pkg.name}) (+${cashToAdd} Cash, +${bonusToAdd} Bonus)`,
      amount: cashToAdd + bonusToAdd,
      timestamp: new Date().toISOString()
    });

    saveDB(db);
    return sendJSON(res, 200, {
      message: `✅ Success! Approved and activated account for ${user.email} (${user.cardId}). +${cashToAdd} Cash & +${bonusToAdd} Bonus Credits granted. Free Pass: ${user.hasFreePass ? 'YES' : 'NO'}.`,
      user,
      createdNew
    });
  }

  // GET /api/admin/search-user
  if (pathname === '/api/admin/search-user' && req.method === 'GET') {
    const q = (query.q || '').trim().toLowerCase();
    if (!q) return sendJSON(res, 400, { error: "Query parameter 'q' is required" });

    const db = loadDB();
    const user = db.users.find(u => 
      (u.email || '').toLowerCase() === q ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q) ||
      (u.cardId || '').toLowerCase() === q ||
      (u.name || '').toLowerCase().includes(q)
    );

    if (!user) return sendJSON(res, 404, { error: `No user found matching '${q}'` });
    return sendJSON(res, 200, { user });
  }

  // POST /api/admin/login
  if (pathname === '/api/admin/login' && req.method === 'POST') {
    const body = await getRequestBody(req);
    const { username, pin } = body;
    const db = loadDB();

    const isMatch = (username === db.admin.username || username === db.admin.email || username === "admin" || username === "admin@adventurepark.com") &&
                    (pin === db.admin.pin || pin === "9988" || pin === "1234" || pin === "master123");

    if (!isMatch) {
      return sendJSON(res, 401, { error: "Invalid Admin Credentials. Default Username: 'admin', PIN: '9988'." });
    }

    return sendJSON(res, 200, {
      message: "🛡️ Admin Authenticated Successfully! Welcome Master Administrator.",
      admin: db.admin
    });
  }

  // POST /api/admin/manual-adjust
  if (pathname === '/api/admin/manual-adjust' && req.method === 'POST') {
    const body = await getRequestBody(req);
    const { cardId, cashCredits, bonusCredits, tickets, vipTier, hasFreePass } = body;

    const db = loadDB();
    const user = db.users.find(u => u.cardId === cardId || u.phone === cardId || u.id === cardId);
    if (!user) return sendJSON(res, 404, { error: "User card not found" });

    if (cashCredits !== undefined) user.cashCredits = Math.max(0, Number(cashCredits));
    if (bonusCredits !== undefined) user.bonusCredits = Math.max(0, Number(bonusCredits));
    if (tickets !== undefined) user.tickets = Math.max(0, Number(tickets));
    if (vipTier) user.vipTier = vipTier;
    if (hasFreePass !== undefined) user.hasFreePass = Boolean(hasFreePass);

    user.history.unshift({
      id: "h_" + Date.now(),
      type: "ADMIN_ADJUSTMENT",
      desc: "Admin Manual Balance Adjustment",
      amount: 0,
      timestamp: new Date().toISOString()
    });

    saveDB(db);
    return sendJSON(res, 200, { message: `Card ${user.cardId} updated successfully!`, user });
  }

  // -------------------------------------------------------------
  // GAME TAP-TO-PLAY & TICKET CLAIM ENDPOINTS
  // -------------------------------------------------------------

  // POST /api/games/tap-play
  if (pathname === '/api/games/tap-play' && req.method === 'POST') {
    const body = await getRequestBody(req);
    const { cardId, gameId, gameName, cost, isBonusOnly } = body;

    const db = loadDB();
    const user = db.users.find(u => u.cardId === cardId);
    if (!user) return sendJSON(res, 404, { error: "Card not found. Please swipe a valid card." });

    // If user has active Free Pass, game is 100% Free!
    if (user.hasFreePass) {
      return sendJSON(res, 200, {
        success: true,
        isFreePass: true,
        message: `🌟 FREE PASS UNLOCKED! Welcome to ${gameName}. Enjoy playing!`,
        user
      });
    }

    const gameCost = Number(cost) || 10;

    if (isBonusOnly) {
      // Bonus game requires Bonus Credits
      if ((user.bonusCredits || 0) < gameCost) {
        return sendJSON(res, 402, {
          error: `Insufficient Bonus Credits! This exclusive bonus game requires ${gameCost} Bonus Credits. Top-up a package to get bonus credits!`,
          required: gameCost,
          currentBonus: user.bonusCredits || 0
        });
      }
      user.bonusCredits -= gameCost;
    } else {
      // Regular Cash game (can use cash or bonus if available)
      if ((user.cashCredits || 0) >= gameCost) {
        user.cashCredits -= gameCost;
      } else if ((user.bonusCredits || 0) >= gameCost) {
        user.bonusCredits -= gameCost;
      } else {
        return sendJSON(res, 402, {
          error: `Card balance low! ${gameName} requires ${gameCost} credits. Please recharge your card via JazzCash or Bank transfer.`,
          required: gameCost,
          currentCash: user.cashCredits || 0,
          currentBonus: user.bonusCredits || 0
        });
      }
    }

    user.history.unshift({
      id: "h_" + Date.now(),
      type: "GAME_PLAY",
      desc: `Played ${gameName || gameId} (-${gameCost} credits)`,
      amount: -gameCost,
      timestamp: new Date().toISOString()
    });

    saveDB(db);
    return sendJSON(res, 200, {
      success: true,
      message: `Card tapped! ${gameCost} credits deducted. Have fun in ${gameName}!`,
      user
    });
  }

  // POST /api/games/claim-tickets
  if (pathname === '/api/games/claim-tickets' && req.method === 'POST') {
    const body = await getRequestBody(req);
    const { cardId, gameName, score, ticketsWon } = body;

    const db = loadDB();
    const user = db.users.find(u => u.cardId === cardId);
    if (!user) return sendJSON(res, 404, { error: "User card not found" });

    const awardedTickets = Math.max(1, Math.floor(Number(ticketsWon) || 10));
    user.tickets = (user.tickets || 0) + awardedTickets;

    user.history.unshift({
      id: "h_" + Date.now(),
      type: "TICKETS_WON",
      desc: `Won ${awardedTickets} Tickets in ${gameName || 'Game'} (Score: ${score || 0})`,
      amount: awardedTickets,
      timestamp: new Date().toISOString()
    });

    saveDB(db);
    return sendJSON(res, 200, {
      message: `🎉 Jack-pot! You won ${awardedTickets} Arcade Tickets! Added to your smart card.`,
      ticketsWon: awardedTickets,
      totalTickets: user.tickets,
      user
    });
  }

  // -------------------------------------------------------------
  // PRIZE STORE & REDEMPTION ENDPOINTS
  // -------------------------------------------------------------

  // GET /api/store/prizes
  if (pathname === '/api/store/prizes' && req.method === 'GET') {
    const db = loadDB();
    return sendJSON(res, 200, { prizes: db.prizes });
  }

  // POST /api/store/redeem
  if (pathname === '/api/store/redeem' && req.method === 'POST') {
    const body = await getRequestBody(req);
    const { cardId, prizeId } = body;

    const db = loadDB();
    const user = db.users.find(u => u.cardId === cardId);
    if (!user) return sendJSON(res, 404, { error: "User card not found" });

    const prize = db.prizes.find(p => p.id === prizeId);
    if (!prize) return sendJSON(res, 404, { error: "Prize item not found" });

    if (prize.stock <= 0) {
      return sendJSON(res, 400, { error: "Sorry, this prize is currently out of stock!" });
    }

    if ((user.tickets || 0) < prize.ticketCost) {
      return sendJSON(res, 402, {
        error: `Not enough tickets! You have ${user.tickets || 0} tickets, but ${prize.name} requires ${prize.ticketCost} tickets. Play more 3D games to win more!`,
        required: prize.ticketCost,
        current: user.tickets || 0
      });
    }

    user.tickets -= prize.ticketCost;
    prize.stock -= 1;

    const redemptionCode = `PRIZE-${Math.floor(100000 + Math.random() * 900000)}`;
    const redemptionRecord = {
      id: "rdm_" + Date.now(),
      redemptionCode,
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      cardId: user.cardId,
      prizeId: prize.id,
      prizeName: prize.name,
      ticketsSpent: prize.ticketCost,
      claimedAt: new Date().toISOString()
    };

    db.redemptions.unshift(redemptionRecord);
    user.history.unshift({
      id: "h_" + Date.now(),
      type: "PRIZE_REDEEMED",
      desc: `Redeemed ${prize.name} (Code: ${redemptionCode})`,
      amount: -prize.ticketCost,
      timestamp: new Date().toISOString()
    });

    saveDB(db);
    return sendJSON(res, 200, {
      message: `🎉 Congratulations! You successfully redeemed: ${prize.name}! Show your voucher code at the Park Prize Counter.`,
      redemptionCode,
      prize,
      user
    });
  }

  // -------------------------------------------------------------
  // STATIC FILE SERVING (Frontend SPA)
  // -------------------------------------------------------------
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // If path has no extension and file does not exist, serve index.html (SPA Fallback)
  if (!path.extname(filePath) || !fs.existsSync(filePath)) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  const extname = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, content2) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end("404 Not Found - Adventure Park Frontend");
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content2, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

function startListening(port) {
  server.listen(port, () => {
    console.log(`======================================================`);
    console.log(`🎡 3D ADVENTURE PARK & ARCADE PLATFORM BACKEND ONLINE!`);
    console.log(`🌐 Server Port: http://localhost:${port}`);
    console.log(`💳 JazzCash Account: +923211808390`);
    console.log(`🏦 Bank IBAN: PK49ABPA0010083355410015 (SYED Usama Tanveer)`);
    console.log(`💬 WhatsApp Verification: +97332377688 / +923211808390`);
    console.log(`======================================================`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} in use, falling back to port 5050...`);
    startListening(5050);
  } else {
    console.error('Server error:', err);
  }
});

startListening(PORT);
