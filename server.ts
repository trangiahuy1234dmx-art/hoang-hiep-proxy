import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

// Define the database file path
const DB_FILE = path.join(process.cwd(), "server_db.json");
const DB_TEMP_FILE = path.join(process.cwd(), "server_db.tmp.json");

// Default initial database structure
const defaultLuckyWheelSettings = {
  pricePerSpin: 10000,
  isActive: true,
  outOfKeysBehavior: "reroll"
};

const defaultLuckyWheelRewards = [
  {
    id: "reward_day",
    name: "Key Proxy 1 Ngày",
    rewardType: "day",
    probability: 70,
    keys: ["SPIN-1D-HOANGHIEP-XYZ1", "SPIN-1D-HOANGHIEP-XYZ2", "SPIN-1D-HOANGHIEP-XYZ3"]
  },
  {
    id: "reward_week",
    name: "Key Proxy 1 Tuần",
    rewardType: "week",
    probability: 20,
    keys: ["SPIN-1W-HOANGHIEP-ABC1", "SPIN-1W-HOANGHIEP-ABC2"]
  },
  {
    id: "reward_month",
    name: "Key Proxy 1 Tháng",
    rewardType: "month",
    probability: 10,
    keys: ["SPIN-1M-HOANGHIEP-MNP1"]
  }
];

const defaultProducts = [
  { id: 'proxy_1d', name: 'Key Proxy Full Aim 1 Ngày', category: 'proxy', duration: '1 Ngày', price: 10000 },
  { id: 'proxy_1w', name: 'Key Proxy Full Aim 1 Tuần', category: 'proxy', duration: '1 Tuần', price: 50000 },
  { id: 'proxy_1m', name: 'Key Proxy Full Aim 1 Tháng', category: 'proxy', duration: '1 Tháng', price: 150000 },
  { id: 'proxy_perm', name: 'Key Proxy Full Aim Vĩnh Viễn', category: 'proxy', duration: 'Vĩnh Viễn', price: 300000 },
  { id: 'migul_1w', name: 'Key Migul 1 Tuần', category: 'migul', duration: '1 Tuần', price: 100000 },
  { id: 'migul_1m', name: 'Key Migul 1 Tháng', category: 'migul', duration: '1 Tháng', price: 250000 },
];

const defaultKeys = [
  { id: 'k1', productId: 'proxy_1d', keyString: 'AIM-1D-HOANGHIEP-8E92B10C', isSold: false },
  { id: 'k2', productId: 'proxy_1d', keyString: 'AIM-1D-HOANGHIEP-7B91F2AA', isSold: false },
  { id: 'k3', productId: 'proxy_1d', keyString: 'AIM-1D-HOANGHIEP-3E52C9BB', isSold: false },
  { id: 'k4', productId: 'proxy_1w', keyString: 'AIM-1W-HOANGHIEP-93D8E221', isSold: false },
  { id: 'k5', productId: 'proxy_1w', keyString: 'AIM-1W-HOANGHIEP-01F4C592', isSold: false },
  { id: 'k6', productId: 'proxy_1m', keyString: 'AIM-1M-HOANGHIEP-44A5E812', isSold: false },
  { id: 'k7', productId: 'proxy_1m', keyString: 'AIM-1M-HOANGHIEP-77B3C204', isSold: false },
  { id: 'k8', productId: 'proxy_perm', keyString: 'AIM-LIFE-HOANGHIEP-77778888', isSold: false },
  { id: 'k9', productId: 'migul_1w', keyString: 'MIGUL-1W-HOANGHIEP-9922AA11', isSold: false },
  { id: 'k10', productId: 'migul_1w', keyString: 'MIGUL-1W-HOANGHIEP-8833BB22', isSold: false },
  { id: 'k11', productId: 'migul_1m', keyString: 'MIGUL-1M-HOANGHIEP-4455CC66', isSold: false },
];

const defaultAdminSettings = {
  bankName: 'MBBank (MB)',
  accountNumber: '190283749321',
  accountHolder: 'HOANG HUY HIEP',
  description: 'Nạp tiền Shop Hoang Hiep - Nội dung ghi đúng mã nạp',
  qrType: 'vietqr',
  vietqrBankId: 'MB',
  customQrUrl: '',
};

const defaultUsers = [
  {
    id: 'admin_huy',
    username: 'huy321la',
    balance: 99999999,
    createdAt: new Date().toISOString(),
    isBlocked: false,
    role: 'admin',
  },
  {
    id: 'admin_hiep',
    username: 'hiep321la',
    balance: 99999999,
    createdAt: new Date().toISOString(),
    isBlocked: false,
    role: 'admin',
  }
];

const emptyStructure = {
  users: defaultUsers,
  products: defaultProducts,
  keys: defaultKeys,
  deposits: [],
  transactions: [],
  adminSettings: defaultAdminSettings,
  chats: [],
  luckyWheelSettings: defaultLuckyWheelSettings,
  luckyWheelRewards: defaultLuckyWheelRewards,
  luckyWheelSpinLogs: []
};

// Global in-memory cached database for ultra-fast response (<1ms) under high concurrent load
let cachedDb: any = null;
let isSaving = false;
let saveScheduled = false;

// Load database into memory once at startup
function initServerDb() {
  if (cachedDb) return cachedDb;

  if (!fs.existsSync(DB_FILE)) {
    cachedDb = JSON.parse(JSON.stringify(emptyStructure));
    saveServerDbSync();
    return cachedDb;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    cachedDb = JSON.parse(raw);
    if (!cachedDb.luckyWheelSettings) cachedDb.luckyWheelSettings = defaultLuckyWheelSettings;
    if (!cachedDb.luckyWheelRewards) cachedDb.luckyWheelRewards = defaultLuckyWheelRewards;
    if (!cachedDb.luckyWheelSpinLogs) cachedDb.luckyWheelSpinLogs = [];
    if (!cachedDb.users || cachedDb.users.length === 0) cachedDb.users = defaultUsers;
    if (!cachedDb.products || cachedDb.products.length === 0) cachedDb.products = defaultProducts;
    if (!cachedDb.keys) cachedDb.keys = defaultKeys;
    if (!cachedDb.deposits) cachedDb.deposits = [];
    if (!cachedDb.transactions) cachedDb.transactions = [];
    if (!cachedDb.chats) cachedDb.chats = [];
    if (!cachedDb.adminSettings || !cachedDb.adminSettings.bankName) cachedDb.adminSettings = defaultAdminSettings;

    // Ensure admins exist
    if (!cachedDb.users.some((u: any) => u.username === "huy321la")) {
      cachedDb.users.push(defaultUsers[0]);
    }
    if (!cachedDb.users.some((u: any) => u.username === "hiep321la")) {
      cachedDb.users.push(defaultUsers[1]);
    }
  } catch (e) {
    console.error("[Database] Error reading database file, resetting to clean state", e);
    cachedDb = JSON.parse(JSON.stringify(emptyStructure));
  }
  return cachedDb;
}

// Get in-memory cached database
function loadServerDb() {
  if (!cachedDb) {
    return initServerDb();
  }
  return cachedDb;
}

// Synchronous initial fallback save
function saveServerDbSync() {
  try {
    const data = JSON.stringify(cachedDb, null, 2);
    fs.writeFileSync(DB_TEMP_FILE, data, "utf-8");
    fs.renameSync(DB_TEMP_FILE, DB_FILE);
  } catch (e) {
    console.error("[Database] Error writing database synchronously", e);
  }
}

// Debounced, Atomic, Non-Blocking File System Writer for High Concurrency
function scheduleSaveServerDb() {
  if (saveScheduled) return;
  saveScheduled = true;

  setImmediate(() => {
    saveScheduled = false;
    if (isSaving) {
      // Re-schedule if another write is currently executing
      scheduleSaveServerDb();
      return;
    }

    isSaving = true;
    try {
      const dataStr = JSON.stringify(cachedDb, null, 2);
      fs.writeFile(DB_TEMP_FILE, dataStr, "utf-8", (err) => {
        if (err) {
          console.error("[Database] Error writing temp database file:", err);
          isSaving = false;
          return;
        }
        fs.rename(DB_TEMP_FILE, DB_FILE, (renameErr) => {
          if (renameErr) {
            console.error("[Database] Error replacing master database file:", renameErr);
          }
          isSaving = false;
        });
      });
    } catch (err) {
      console.error("[Database] Uncaught exception during database save:", err);
      isSaving = false;
    }
  });
}

// SSE Connected clients list for real-time instant synchronization
const sseClients: Set<express.Response> = new Set();

function broadcastRealtimeUpdate(payload?: any) {
  const dbToBroadcast = payload || cachedDb;
  if (!dbToBroadcast) return;

  const dataStr = `data: ${JSON.stringify({ type: "db_update", timestamp: Date.now(), db: dbToBroadcast })}\n\n`;
  for (const clientRes of sseClients) {
    try {
      clientRes.write(dataStr);
    } catch (e) {
      sseClients.delete(clientRes);
    }
  }
}

// Keep-alive heartbeat timer for SSE connections (runs every 15 seconds)
setInterval(() => {
  const pingStr = `: ping\n\n`;
  for (const clientRes of sseClients) {
    try {
      clientRes.write(pingStr);
    } catch (e) {
      sseClients.delete(clientRes);
    }
  }
}, 15000);

// Save trigger helper used by endpoints
function saveServerDb(updatedDb?: any) {
  if (updatedDb) {
    cachedDb = updatedDb;
  }
  scheduleSaveServerDb();
  broadcastRealtimeUpdate(cachedDb);
}

async function startServer() {
  // Initialize in-memory database
  initServerDb();

  const app = express();
  const PORT = 3000;

  // High Concurrency Middleware Settings
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Prevent API caching issues across clients
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

  // SSE Real-time Events Stream Endpoint
  app.get("/api/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();

    sseClients.add(res);

    // Initial connection handshake payload with fresh server DB
    res.write(`data: ${JSON.stringify({ type: "connected", db: loadServerDb() })}\n\n`);

    req.on("close", () => {
      sseClients.delete(res);
    });
  });

  // API Endpoint: Admin Get Full Server Key Warehouse List
  app.get("/api/admin/keys/list", (req, res) => {
    const { username } = req.query;
    const serverDb = loadServerDb();
    const isAdmin = username === "huy321la" || username === "hiep321la";

    if (!isAdmin) {
      return res.status(403).json({ error: "Quyền hạn không hợp lệ! Chỉ Admin mới được xem kho key tập trung." });
    }

    return res.json({ keys: serverDb.keys || [], db: serverDb });
  });

  // API Endpoint: Admin Bulk Add Keys Directly To Server Database
  app.post("/api/admin/keys/add", (req, res) => {
    const { productId, keyStrings, adminUsername } = req.body;
    const isAdmin = adminUsername === "huy321la" || adminUsername === "hiep321la";

    if (!isAdmin) {
      return res.status(403).json({ error: "Chỉ tài khoản Admin mới có quyền nhập key vào kho!" });
    }

    if (!productId || !keyStrings || !Array.isArray(keyStrings) || keyStrings.length === 0) {
      return res.status(400).json({ error: "Vui lòng chọn sản phẩm và nhập danh sách key hợp lệ!" });
    }

    const serverDb = loadServerDb();
    const product = serverDb.products.find((p: any) => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: "Sản phẩm không tồn tại trên hệ thống!" });
    }

    const newKeys = keyStrings
      .map((str: string) => String(str).trim())
      .filter((str: string) => str.length > 0)
      .map((keyStr: string, idx: number) => ({
        id: "k_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7) + "_" + idx,
        productId,
        keyString: keyStr,
        isSold: false
      }));

    if (newKeys.length === 0) {
      return res.status(400).json({ error: "Danh sách key rỗng!" });
    }

    if (!serverDb.keys) serverDb.keys = [];
    serverDb.keys.push(...newKeys);

    // Save and broadcast real-time sync immediately
    saveServerDb(serverDb);

    return res.json({
      success: true,
      addedCount: newKeys.length,
      message: `Đã nạp thành công ${newKeys.length} key vào kho server!`,
      db: serverDb
    });
  });

  // API Endpoint: Admin Edit Key String Directly In Server Database
  app.post("/api/admin/keys/edit", (req, res) => {
    const { keyId, newKeyString, adminUsername } = req.body;
    const isAdmin = adminUsername === "huy321la" || adminUsername === "hiep321la";

    if (!isAdmin) {
      return res.status(403).json({ error: "Chỉ tài khoản Admin mới có quyền chỉnh sửa kho key!" });
    }

    if (!keyId || !newKeyString) {
      return res.status(400).json({ error: "Thiếu mã keyId hoặc nội dung key mới!" });
    }

    const serverDb = loadServerDb();
    const keyIdx = serverDb.keys.findIndex((k: any) => k.id === keyId);
    if (keyIdx === -1) {
      return res.status(404).json({ error: "Mã key không tồn tại trong cơ sở dữ liệu!" });
    }

    serverDb.keys[keyIdx].keyString = String(newKeyString).trim();
    saveServerDb(serverDb);

    return res.json({ success: true, db: serverDb });
  });

  // API Endpoint: Admin Delete Single Key From Server Database
  app.post("/api/admin/keys/delete", (req, res) => {
    const { keyId, adminUsername } = req.body;
    const isAdmin = adminUsername === "huy321la" || adminUsername === "hiep321la";

    if (!isAdmin) {
      return res.status(403).json({ error: "Chỉ tài khoản Admin mới có quyền xóa key!" });
    }

    if (!keyId) {
      return res.status(400).json({ error: "Thiếu mã keyId cần xóa!" });
    }

    const serverDb = loadServerDb();
    const initialCount = serverDb.keys.length;
    serverDb.keys = serverDb.keys.filter((k: any) => k.id !== keyId);

    if (serverDb.keys.length === initialCount) {
      return res.status(404).json({ error: "Mã key không tồn tại!" });
    }

    saveServerDb(serverDb);

    return res.json({ success: true, db: serverDb });
  });

  // API Endpoint: Admin Clear Unsold Keys for a Specific Product
  app.post("/api/admin/keys/clear-product", (req, res) => {
    const { productId, adminUsername } = req.body;
    const isAdmin = adminUsername === "huy321la" || adminUsername === "hiep321la";

    if (!isAdmin) {
      return res.status(403).json({ error: "Chỉ tài khoản Admin mới có quyền xóa kho key!" });
    }

    if (!productId) {
      return res.status(400).json({ error: "Thiếu productId!" });
    }

    const serverDb = loadServerDb();
    const removedCount = serverDb.keys.filter((k: any) => k.productId === productId && !k.isSold).length;
    serverDb.keys = serverDb.keys.filter((k: any) => !(k.productId === productId && !k.isSold));

    saveServerDb(serverDb);

    return res.json({
      success: true,
      removedCount,
      message: `Đã dọn dẹp ${removedCount} key chưa bán khỏi kho server!`,
      db: serverDb
    });
  });

  // API Endpoint: Admin Save Product (Create or Update)
  app.post("/api/admin/products/save", (req, res) => {
    const { product, adminUsername } = req.body;
    const isAdmin = adminUsername === "huy321la" || adminUsername === "hiep321la";

    if (!isAdmin) {
      return res.status(403).json({ error: "Chỉ tài khoản Admin mới có quyền quản lý sản phẩm!" });
    }

    if (!product || !product.name || product.price === undefined || !product.duration) {
      return res.status(400).json({ error: "Thiếu thông tin sản phẩm bắt buộc!" });
    }

    const serverDb = loadServerDb();
    if (!serverDb.products) serverDb.products = [];

    const existingIdx = serverDb.products.findIndex((p: any) => p.id === product.id);
    if (existingIdx !== -1) {
      serverDb.products[existingIdx] = {
        ...serverDb.products[existingIdx],
        ...product,
        price: Number(product.price)
      };
    } else {
      serverDb.products.push({
        ...product,
        price: Number(product.price)
      });
    }

    saveServerDb(serverDb);
    return res.json({ success: true, db: serverDb });
  });

  // API Endpoint: Admin Delete Product
  app.post("/api/admin/products/delete", (req, res) => {
    const { productId, adminUsername } = req.body;
    const isAdmin = adminUsername === "huy321la" || adminUsername === "hiep321la";

    if (!isAdmin) {
      return res.status(403).json({ error: "Chỉ tài khoản Admin mới có quyền xóa sản phẩm!" });
    }

    if (!productId) {
      return res.status(400).json({ error: "Thiếu productId!" });
    }

    const serverDb = loadServerDb();
    serverDb.products = (serverDb.products || []).filter((p: any) => p.id !== productId);
    serverDb.keys = (serverDb.keys || []).filter((k: any) => !(k.productId === productId && !k.isSold));

    saveServerDb(serverDb);
    return res.json({ success: true, db: serverDb });
  });

  // API Endpoint: Admin Save Bank & Deposit QR Settings
  app.post("/api/admin/settings/save", (req, res) => {
    const { settings, adminUsername } = req.body;
    const isAdmin = adminUsername === "huy321la" || adminUsername === "hiep321la";

    if (!isAdmin) {
      return res.status(403).json({ error: "Chỉ tài khoản Admin mới có quyền chỉnh sửa cấu hình ngân hàng!" });
    }

    if (!settings || !settings.bankName?.trim() || !settings.accountNumber?.trim() || !settings.accountHolder?.trim()) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ Tên ngân hàng, Số tài khoản và Tên chủ tài khoản!" });
    }

    if (settings.qrType === "vietqr" && !settings.vietqrBankId?.trim()) {
      return res.status(400).json({ error: "Vui lòng nhập mã VietQR Bank ID!" });
    }

    if (settings.qrType === "custom" && !settings.customQrUrl?.trim()) {
      return res.status(400).json({ error: "Vui lòng chọn hoặc tải ảnh QR chuyển khoản!" });
    }

    const cleanSettings = {
      bankName: String(settings.bankName).trim(),
      accountNumber: String(settings.accountNumber).trim(),
      accountHolder: String(settings.accountHolder).trim().toUpperCase(),
      description: String(settings.description || "").trim(),
      qrType: settings.qrType === "custom" ? "custom" : "vietqr",
      vietqrBankId: String(settings.vietqrBankId || "MB").trim().toUpperCase(),
      customQrUrl: String(settings.customQrUrl || "").trim(),
    };

    const serverDb = loadServerDb();
    serverDb.adminSettings = cleanSettings;

    saveServerDb(serverDb);
    return res.json({ success: true, db: serverDb });
  });

  // API Endpoint: User Create Deposit Request
  app.post("/api/deposit/create", (req, res) => {
    const { userId, username, amount, code } = req.body;
    if (!userId || !username || !amount || !code) {
      return res.status(400).json({ error: "Thiếu thông tin yêu cầu nạp tiền!" });
    }

    const serverDb = loadServerDb();
    const newDeposit = {
      id: "dep_" + Math.random().toString(36).substring(2, 9),
      userId,
      username,
      amount: Number(amount),
      status: "pending",
      createdAt: new Date().toISOString(),
      code
    };

    if (!serverDb.deposits) serverDb.deposits = [];
    serverDb.deposits.unshift(newDeposit);

    saveServerDb(serverDb);
    return res.json({ success: true, deposit: newDeposit, db: serverDb });
  });

  // API Endpoint: Send Live Support Chat Message
  app.post("/api/chat/send", (req, res) => {
    const { senderId, senderUsername, receiverId, message } = req.body;
    if (!senderId || !senderUsername || !message) {
      return res.status(400).json({ error: "Thiếu thông tin tin nhắn!" });
    }

    const serverDb = loadServerDb();
    const newMsg = {
      id: "msg_" + Math.random().toString(36).substring(2, 9),
      senderId,
      senderUsername,
      receiverId: receiverId || "admin",
      message: String(message).trim(),
      createdAt: new Date().toISOString()
    };

    if (!serverDb.chats) serverDb.chats = [];
    serverDb.chats.push(newMsg);

    saveServerDb(serverDb);
    return res.json({ success: true, message: newMsg, db: serverDb });
  });

  // API Endpoint: Smart Database Synchronization (Server is SSOT)
  app.post("/api/sync", (req, res) => {
    try {
      const { clientDb } = req.body || {};
      const serverDb = loadServerDb();

      if (!clientDb) {
        return res.json({ db: serverDb });
      }

      const clientUsers = Array.isArray(clientDb.users) ? clientDb.users : [];

      // --- MERGE NEW USER REGISTRATIONS ONLY ---
      const mergedUsers = [...serverDb.users];
      clientUsers.forEach((clientUser: any) => {
        if (!clientUser || !clientUser.id) return;
        const serverUserIdx = mergedUsers.findIndex((u: any) => u.id === clientUser.id || u.username === clientUser.username);
        if (serverUserIdx === -1) {
          const isClientAdmin = clientUser.username === "huy321la" || clientUser.username === "hiep321la";
          const cleanUser = {
            ...clientUser,
            role: isClientAdmin ? "admin" : "user",
            balance: isClientAdmin ? 99999999 : 0,
            isBlocked: false,
            createdAt: clientUser.createdAt || new Date().toISOString()
          };
          mergedUsers.push(cleanUser);
        }
      });

      // Ensure default Admins always exist on server
      if (!mergedUsers.some((u: any) => u.username === "huy321la")) {
        mergedUsers.push(defaultUsers[0]);
      }
      if (!mergedUsers.some((u: any) => u.username === "hiep321la")) {
        mergedUsers.push(defaultUsers[1]);
      }

      serverDb.users = mergedUsers;

      // Server is the sole authoritative master for products, keys, deposits, adminSettings, transactions, chats and luckyWheel.
      // Save and broadcast current state
      saveServerDb(serverDb);

      return res.json({ db: serverDb });
    } catch (err: any) {
      console.error("Error in /api/sync:", err);
      res.status(500).json({ error: "Lỗi đồng bộ phía máy chủ" });
    }
  });

  // API Endpoint: Server-Authoritative Purchase and Balance Deduction
  app.post("/api/buy", (req, res) => {
    const { userId, productId } = req.body;
    if (!userId || !productId) {
      return res.status(400).json({ error: "Thiếu thông tin người dùng hoặc sản phẩm" });
    }

    const serverDb = loadServerDb();
    const userIdx = serverDb.users.findIndex((u: any) => u.id === userId);
    if (userIdx === -1) {
      return res.status(404).json({ error: "Tài khoản không tồn tại trên hệ thống!" });
    }

    const user = serverDb.users[userIdx];
    if (user.isBlocked) {
      return res.status(403).json({ error: "Tài khoản của bạn đã bị Admin khóa do vi phạm!" });
    }

    const product = serverDb.products.find((p: any) => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: "Sản phẩm không tồn tại hoặc đã bị gỡ bỏ!" });
    }

    if (user.balance < product.price) {
      return res.status(400).json({ error: "Số dư tài khoản của bạn không đủ để thực hiện giao dịch này!" });
    }

    // Find available key
    const availableKeyIdx = serverDb.keys.findIndex((k: any) => k.productId === productId && !k.isSold);
    if (availableKeyIdx === -1) {
      return res.status(400).json({ error: "Sản phẩm này hiện tại đã hết key trong kho! Admin sẽ sớm bổ sung thêm." });
    }

    const availableKey = serverDb.keys[availableKeyIdx];
    const oldBalance = user.balance;
    const newBalance = oldBalance - product.price;

    // 1. Deduct balance on server
    serverDb.users[userIdx].balance = newBalance;

    // 2. Mark key as sold on server
    serverDb.keys[availableKeyIdx] = {
      ...availableKey,
      isSold: true,
      soldToUser: user.username,
      soldAt: new Date().toISOString()
    };

    // 3. Create purchase transaction on server
    const newTx = {
      id: "tx_" + Math.floor(100000 + Math.random() * 900000),
      userId: user.id,
      username: user.username,
      productId: product.id,
      productName: product.name,
      amount: product.price,
      keyString: availableKey.keyString,
      createdAt: new Date().toISOString(),
      type: "purchase",
      balanceAfter: newBalance
    };

    serverDb.transactions.unshift(newTx);

    // Save final database state
    saveServerDb(serverDb);

    return res.json({
      success: true,
      user: serverDb.users[userIdx],
      key: serverDb.keys[availableKeyIdx],
      transaction: newTx,
      db: serverDb
    });
  });

  // API Endpoint: Admin Manual Balance Adjustment
  app.post("/api/admin/change-balance", (req, res) => {
    const { userId, newBalance, adminUsername } = req.body;
    if (!userId || newBalance === undefined || !adminUsername) {
      return res.status(400).json({ error: "Thiếu thông tin yêu cầu" });
    }

    const serverDb = loadServerDb();
    const userIdx = serverDb.users.findIndex((u: any) => u.id === userId);
    if (userIdx === -1) {
      return res.status(404).json({ error: "Tài khoản không tồn tại!" });
    }

    const user = serverDb.users[userIdx];
    const diff = newBalance - user.balance;

    if (diff !== 0) {
      const adjustmentTx = {
        id: "tx_" + Math.floor(100000 + Math.random() * 900000),
        userId: user.id,
        username: user.username,
        productId: "adjustment",
        productName: diff > 0 ? "Admin cộng tiền thủ công" : "Admin trừ tiền thủ công",
        amount: Math.abs(diff),
        keyString: "N/A",
        createdAt: new Date().toISOString(),
        type: "admin_adjustment",
        balanceAfter: newBalance
      };
      serverDb.transactions.unshift(adjustmentTx);
    }

    serverDb.users[userIdx].balance = newBalance;
    saveServerDb(serverDb);

    return res.json({ success: true, db: serverDb });
  });

  // API Endpoint: Admin Approve Deposit Request
  app.post("/api/admin/approve-deposit", (req, res) => {
    const { depositId } = req.body;
    if (!depositId) {
      return res.status(400).json({ error: "Thiếu thông tin mã nạp tiền" });
    }

    const serverDb = loadServerDb();
    const depositIdx = serverDb.deposits.findIndex((d: any) => d.id === depositId);
    if (depositIdx === -1) {
      return res.status(404).json({ error: "Yêu cầu nạp tiền không tồn tại!" });
    }

    const deposit = serverDb.deposits[depositIdx];
    if (deposit.status !== "pending") {
      return res.status(400).json({ error: "Yêu cầu nạp tiền này đã được xử lý từ trước!" });
    }

    const userIdx = serverDb.users.findIndex((u: any) => u.id === deposit.userId || u.username === deposit.username);
    if (userIdx === -1) {
      return res.status(404).json({ error: "Người dùng yêu cầu nạp tiền không tồn tại trên hệ thống!" });
    }

    const targetUser = serverDb.users[userIdx];
    const depositAmount = deposit.amount;
    const oldBalance = targetUser.balance;
    const newBalance = oldBalance + depositAmount;

    // 1. Mark deposit as approved
    serverDb.deposits[depositIdx] = {
      ...deposit,
      status: "approved",
      processedAt: new Date().toISOString()
    };

    // 2. Add balance
    serverDb.users[userIdx].balance = newBalance;

    // 3. Create transaction
    const depositTx = {
      id: "tx_" + Math.floor(100000 + Math.random() * 900000),
      userId: targetUser.id,
      username: targetUser.username,
      productId: "deposit",
      productName: `Nạp tiền qua ngân hàng (${deposit.code})`,
      amount: depositAmount,
      keyString: "N/A",
      createdAt: new Date().toISOString(),
      type: "deposit",
      balanceAfter: newBalance
    };
    serverDb.transactions.unshift(depositTx);

    saveServerDb(serverDb);

    return res.json({ success: true, db: serverDb });
  });

  // API Endpoint: Admin Reject Deposit Request
  app.post("/api/admin/reject-deposit", (req, res) => {
    const { depositId } = req.body;
    if (!depositId) {
      return res.status(400).json({ error: "Thiếu thông tin mã nạp tiền" });
    }

    const serverDb = loadServerDb();
    const depositIdx = serverDb.deposits.findIndex((d: any) => d.id === depositId);
    if (depositIdx === -1) {
      return res.status(404).json({ error: "Yêu cầu nạp tiền không tồn tại!" });
    }

    const deposit = serverDb.deposits[depositIdx];
    if (deposit.status !== "pending") {
      return res.status(400).json({ error: "Yêu cầu nạp tiền này đã được xử lý từ trước!" });
    }

    // Mark as rejected
    serverDb.deposits[depositIdx] = {
      ...deposit,
      status: "rejected",
      processedAt: new Date().toISOString()
    };

    saveServerDb(serverDb);

    return res.json({ success: true, db: serverDb });
  });

  // API Endpoint: Admin Block/Unblock User
  app.post("/api/admin/toggle-block", (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Thiếu thông tin người dùng" });
    }

    const serverDb = loadServerDb();
    const userIdx = serverDb.users.findIndex((u: any) => u.id === userId);
    if (userIdx === -1) {
      return res.status(404).json({ error: "Người dùng không tồn tại!" });
    }

    const user = serverDb.users[userIdx];
    if (user.role === "admin") {
      return res.status(400).json({ error: "Không thể khóa tài khoản Admin tối cao!" });
    }

    serverDb.users[userIdx].isBlocked = !user.isBlocked;
    saveServerDb(serverDb);

    return res.json({ success: true, db: serverDb });
  });

  // --- LUCKY WHEEL API ENDPOINTS ---

  // Get Lucky Wheel configuration and rewards in real-time
  app.get("/api/lucky-wheel/data", (req, res) => {
    const { username } = req.query;
    const serverDb = loadServerDb();
    const isAdmin = username === "huy321la" || username === "hiep321la";

    const cleanedRewards = (serverDb.luckyWheelRewards || []).map((r: any) => {
      if (isAdmin) {
        return r;
      }
      const { keys, probability, ...rest } = r;
      return {
        ...rest,
        keyCount: keys ? keys.length : 0
      };
    });

    return res.json({
      settings: serverDb.luckyWheelSettings,
      rewards: cleanedRewards,
      spinLogs: serverDb.luckyWheelSpinLogs || []
    });
  });

  // Spin the Lucky Wheel (Server-Authoritative logic to prevent tampering)
  app.post("/api/lucky-wheel/spin", (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Thiếu thông tin ID tài khoản!" });
    }

    const serverDb = loadServerDb();
    const userIdx = serverDb.users.findIndex((u: any) => u.id === userId);
    if (userIdx === -1) {
      return res.status(404).json({ error: "Tài khoản không tồn tại trên hệ thống!" });
    }

    const user = serverDb.users[userIdx];
    if (user.isBlocked) {
      return res.status(403).json({ error: "Tài khoản của bạn đã bị khóa và không thể quay vòng quay!" });
    }

    const settings = serverDb.luckyWheelSettings || { pricePerSpin: 10000, isActive: true, outOfKeysBehavior: "reroll" };
    if (!settings.isActive) {
      return res.status(400).json({ error: "Vòng quay may mắn hiện đang tạm dừng hoạt động!" });
    }

    if (user.balance < settings.pricePerSpin) {
      return res.status(400).json({ error: "Số dư tài khoản không đủ! Vui lòng nạp thêm tiền." });
    }

    // Deduct entry fee
    user.balance -= settings.pricePerSpin;

    const activeRewards = serverDb.luckyWheelRewards || [];
    if (activeRewards.length === 0) {
      user.balance += settings.pricePerSpin; // Refund
      return res.status(400).json({ error: "Hiện chưa cấu hình phần thưởng nào trên hệ thống!" });
    }

    // Calculate total probability
    const totalProb = activeRewards.reduce((sum: number, r: any) => sum + Number(r.probability || 0), 0);
    if (totalProb <= 0) {
      user.balance += settings.pricePerSpin; // Refund
      return res.status(400).json({ error: "Tổng tỷ lệ trúng thưởng đang bằng 0%!" });
    }

    // Weighted random selection
    let randomVal = Math.random() * totalProb;
    let selectedReward: any = null;
    let accumulated = 0;
    for (const r of activeRewards) {
      accumulated += Number(r.probability || 0);
      if (randomVal <= accumulated) {
        selectedReward = r;
        break;
      }
    }

    let finalReward = selectedReward;
    let finalKey = "";
    let spinStatus: "success" | "refunded" | "empty_no_key" = "success";

    if (finalReward && finalReward.keys && finalReward.keys.length > 0) {
      finalKey = finalReward.keys.shift();
    } else {
      const behavior = settings.outOfKeysBehavior || "reroll";
      if (behavior === "reroll") {
        const rewardsWithKeys = activeRewards.filter((r: any) => r.keys && r.keys.length > 0);
        if (rewardsWithKeys.length > 0) {
          const subTotalProb = rewardsWithKeys.reduce((sum: number, r: any) => sum + Number(r.probability || 0), 0);
          let subRandom = Math.random() * subTotalProb;
          let subAccumulated = 0;
          for (const r of rewardsWithKeys) {
            subAccumulated += Number(r.probability || 0);
            if (subRandom <= subAccumulated) {
              finalReward = r;
              break;
            }
          }
          if (finalReward && finalReward.keys && finalReward.keys.length > 0) {
            finalKey = finalReward.keys.shift();
          }
        } else {
          user.balance += settings.pricePerSpin; // Refund
          spinStatus = "refunded";
          finalKey = "N/A";
        }
      } else if (behavior === "refund") {
        user.balance += settings.pricePerSpin; // Refund
        spinStatus = "refunded";
        finalKey = "N/A";
      } else {
        spinStatus = "empty_no_key";
        finalKey = "N/A";
      }
    }

    if (spinStatus === "success" && finalReward) {
      const spinTx = {
        id: "tx_" + Math.floor(100000 + Math.random() * 900000),
        userId: user.id,
        username: user.username,
        productId: "lucky_spin",
        productName: `Quay vòng quay: Trúng ${finalReward.name}`,
        amount: settings.pricePerSpin,
        keyString: finalKey,
        createdAt: new Date().toISOString(),
        type: "purchase",
        balanceAfter: user.balance
      };
      serverDb.transactions.unshift(spinTx);
    } else if (spinStatus === "empty_no_key" && finalReward) {
      const spinTx = {
        id: "tx_" + Math.floor(100000 + Math.random() * 900000),
        userId: user.id,
        username: user.username,
        productId: "lucky_spin",
        productName: `Quay vòng quay: Rất tiếc (${finalReward.name} - Hết kho key)`,
        amount: settings.pricePerSpin,
        keyString: "N/A",
        createdAt: new Date().toISOString(),
        type: "purchase",
        balanceAfter: user.balance
      };
      serverDb.transactions.unshift(spinTx);
    }

    const spinLog = {
      id: "spin_" + Math.floor(100000 + Math.random() * 900000),
      userId: user.id,
      username: user.username,
      rewardId: finalReward ? finalReward.id : "N/A",
      rewardName: finalReward ? finalReward.name : "Không xác định",
      keyString: finalKey,
      createdAt: new Date().toISOString(),
      status: spinStatus
    };
    if (!serverDb.luckyWheelSpinLogs) {
      serverDb.luckyWheelSpinLogs = [];
    }
    serverDb.luckyWheelSpinLogs.unshift(spinLog);

    saveServerDb(serverDb);

    return res.json({
      success: true,
      wonReward: finalReward ? {
        id: finalReward.id,
        name: finalReward.name,
        rewardType: finalReward.rewardType,
        keyString: finalKey,
      } : null,
      spinStatus,
      newBalance: user.balance,
      db: serverDb
    });
  });

  // Admin: Save Lucky Wheel Settings
  app.post("/api/admin/lucky-wheel/save-settings", (req, res) => {
    const { pricePerSpin, isActive, outOfKeysBehavior } = req.body;
    if (pricePerSpin === undefined || isActive === undefined || !outOfKeysBehavior) {
      return res.status(400).json({ error: "Thiếu thông tin cài đặt!" });
    }

    const serverDb = loadServerDb();
    serverDb.luckyWheelSettings = {
      pricePerSpin: Number(pricePerSpin),
      isActive: Boolean(isActive),
      outOfKeysBehavior
    };

    saveServerDb(serverDb);
    return res.json({ success: true, db: serverDb });
  });

  // Admin: Save Lucky Wheel Rewards
  app.post("/api/admin/lucky-wheel/save-rewards", (req, res) => {
    const { rewards } = req.body;
    if (!rewards || !Array.isArray(rewards)) {
      return res.status(400).json({ error: "Thiếu danh sách phần thưởng!" });
    }

    const serverDb = loadServerDb();
    serverDb.luckyWheelRewards = rewards;

    saveServerDb(serverDb);
    return res.json({ success: true, db: serverDb });
  });

  // Serve static files from public directory explicitly (enables byte-range video streaming)
  const publicPath = path.join(process.cwd(), "public");
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }

  // Serve static files / Vite Middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      maxAge: "1d",
      etag: true
    }));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Online High-Performance Server] Running on port ${PORT}`);
  });

  // Socket and Keep-Alive Tuning for High Concurrent Load
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
}

// Global process exception protection to guarantee 24/7 uptime without crashes
process.on("uncaughtException", (err) => {
  console.error("[Fatal Server Exception Handled]:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[Unhandled Promise Rejection Handled]:", reason);
});

startServer();
