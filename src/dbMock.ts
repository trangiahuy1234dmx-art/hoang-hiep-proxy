import { User, Product, KeyStock, DepositRequest, Transaction, AdminSettings, ChatMessage } from './types';

// Default initial products
const DEFAULT_PRODUCTS: Product[] = [
  { id: 'proxy_1d', name: 'Key Proxy Full Aim 1 Ngày', category: 'proxy', duration: '1 Ngày', price: 10000 },
  { id: 'proxy_1w', name: 'Key Proxy Full Aim 1 Tuần', category: 'proxy', duration: '1 Tuần', price: 50000 },
  { id: 'proxy_1m', name: 'Key Proxy Full Aim 1 Tháng', category: 'proxy', duration: '1 Tháng', price: 150000 },
  { id: 'proxy_perm', name: 'Key Proxy Full Aim Vĩnh Viễn', category: 'proxy', duration: 'Vĩnh Viễn', price: 300000 },
  { id: 'migul_1w', name: 'Key Migul 1 Tuần', category: 'migul', duration: '1 Tuần', price: 100000 },
  { id: 'migul_1m', name: 'Key Migul 1 Tháng', category: 'migul', duration: '1 Tháng', price: 250000 },
];

// Initial seed keys so that the user can test purchasing immediately
const DEFAULT_KEYS: KeyStock[] = [
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

const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  bankName: 'MBBank (MB)',
  accountNumber: '190283749321',
  accountHolder: 'HOANG HUY HIEP',
  description: 'Nạp tiền Shop Hoang Hiep - Nội dung ghi đúng mã nạp',
  qrType: 'vietqr',
  vietqrBankId: 'MB',
  customQrUrl: '',
};

// --- In-Memory Fast Cache Layer ---
let cachedUsers: User[] | null = null;
let cachedProducts: Product[] | null = null;
let cachedKeys: KeyStock[] | null = null;
let cachedDeposits: DepositRequest[] | null = null;
let cachedTransactions: Transaction[] | null = null;
let cachedAdminSettings: AdminSettings | null = null;
let cachedCurrentUser: User | null = null;
let cachedChats: ChatMessage[] | null = null;
let syncTimeoutId: any = null;
let lastCompletedRequestSeq = 0;
let globalRequestSeq = 0;
let isSyncing = false;

export const db = {
  getUsers(): User[] {
    if (cachedUsers) return cachedUsers;
    const data = localStorage.getItem('sh_users');
    let users: User[] = [];
    if (!data) {
      // Seed initial admin users
      users = [
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
      localStorage.setItem('sh_users', JSON.stringify(users));
      cachedUsers = users;
      return users;
    }
    users = JSON.parse(data);
    // Ensure both admins always exist in the users array for seamless synchronization
    let updated = false;
    if (!users.some(u => u.username === 'huy321la')) {
      users.push({
        id: 'admin_huy',
        username: 'huy321la',
        balance: 99999999,
        createdAt: new Date().toISOString(),
        isBlocked: false,
        role: 'admin',
      });
      updated = true;
    }
    if (!users.some(u => u.username === 'hiep321la')) {
      users.push({
        id: 'admin_hiep',
        username: 'hiep321la',
        balance: 99999999,
        createdAt: new Date().toISOString(),
        isBlocked: false,
        role: 'admin',
      });
      updated = true;
    }
    if (updated) {
      localStorage.setItem('sh_users', JSON.stringify(users));
    }
    cachedUsers = users;
    return users;
  },

  saveUsers(users: User[]): void {
    cachedUsers = users;
    localStorage.setItem('sh_users', JSON.stringify(users));
    // If saving user list updates our current session user, refresh the cache
    if (cachedCurrentUser) {
      const match = users.find(u => u.id === cachedCurrentUser?.id);
      if (match) {
        cachedCurrentUser = match;
        localStorage.setItem('sh_current_user', JSON.stringify(match));
      }
    }
    this.triggerSync();
  },

  getProducts(): Product[] {
    if (cachedProducts) return cachedProducts;
    const data = localStorage.getItem('sh_products');
    if (!data) {
      localStorage.setItem('sh_products', JSON.stringify(DEFAULT_PRODUCTS));
      cachedProducts = DEFAULT_PRODUCTS;
      return DEFAULT_PRODUCTS;
    }
    const products = JSON.parse(data);
    cachedProducts = products;
    return products;
  },

  saveProducts(products: Product[]): void {
    cachedProducts = products;
    localStorage.setItem('sh_products', JSON.stringify(products));
    this.triggerSync();
  },

  getKeys(): KeyStock[] {
    if (cachedKeys) return cachedKeys;
    const data = localStorage.getItem('sh_keys');
    if (!data) {
      localStorage.setItem('sh_keys', JSON.stringify(DEFAULT_KEYS));
      cachedKeys = DEFAULT_KEYS;
      return DEFAULT_KEYS;
    }
    const keys = JSON.parse(data);
    cachedKeys = keys;
    return keys;
  },

  saveKeys(keys: KeyStock[]): void {
    cachedKeys = keys;
    localStorage.setItem('sh_keys', JSON.stringify(keys));
    this.triggerSync();
  },

  getDepositRequests(): DepositRequest[] {
    const data = localStorage.getItem('sh_deposits');
    let deposits: DepositRequest[] = data ? JSON.parse(data) : [];
    
    // Prune resolved deposits older than 30 minutes (1,800,000 ms)
    const now = new Date().getTime();
    const THIRTY_MINUTES = 30 * 60 * 1000;
    let modified = false;

    deposits = deposits.filter(dep => {
      if (dep.status === 'pending') return true;
      if (dep.processedAt) {
        const processedTime = new Date(dep.processedAt).getTime();
        const expired = (now - processedTime) >= THIRTY_MINUTES;
        if (expired) modified = true;
        return !expired;
      }
      return true;
    });

    if (modified) {
      localStorage.setItem('sh_deposits', JSON.stringify(deposits));
    }
    cachedDeposits = deposits;
    return deposits;
  },

  saveDepositRequests(requests: DepositRequest[]): void {
    cachedDeposits = requests;
    localStorage.setItem('sh_deposits', JSON.stringify(requests));
    this.triggerSync();
  },

  getTransactions(): Transaction[] {
    if (cachedTransactions) return cachedTransactions;
    const data = localStorage.getItem('sh_transactions');
    const transactions = data ? JSON.parse(data) : [];
    cachedTransactions = transactions;
    return transactions;
  },

  saveTransactions(transactions: Transaction[]): void {
    cachedTransactions = transactions;
    localStorage.setItem('sh_transactions', JSON.stringify(transactions));
    this.triggerSync();
  },

  getAdminSettings(): AdminSettings {
    if (cachedAdminSettings) return cachedAdminSettings;
    const data = localStorage.getItem('sh_admin_settings');
    if (!data) {
      localStorage.setItem('sh_admin_settings', JSON.stringify(DEFAULT_ADMIN_SETTINGS));
      cachedAdminSettings = DEFAULT_ADMIN_SETTINGS;
      return DEFAULT_ADMIN_SETTINGS;
    }
    const settings = JSON.parse(data);
    cachedAdminSettings = settings;
    return settings;
  },

  saveAdminSettings(settings: AdminSettings): void {
    cachedAdminSettings = settings;
    localStorage.setItem('sh_admin_settings', JSON.stringify(settings));
    this.triggerSync();
  },

  getCurrentUser(): User | null {
    if (cachedCurrentUser) return cachedCurrentUser;
    const data = localStorage.getItem('sh_current_user');
    if (!data) return null;
    
    // Refresh user details from master list in case balance or status changed
    const userObj = JSON.parse(data) as User;
    const users = this.getUsers();
    const updatedUser = users.find(u => u.id === userObj.id || u.username === userObj.username);
    if (updatedUser) {
      localStorage.setItem('sh_current_user', JSON.stringify(updatedUser));
      cachedCurrentUser = updatedUser;
      return updatedUser;
    }
    cachedCurrentUser = userObj;
    return userObj;
  },

  setCurrentUser(user: User | null): void {
    cachedCurrentUser = user;
    if (user) {
      localStorage.setItem('sh_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('sh_current_user');
    }
  },

  getChatMessages(): ChatMessage[] {
    if (cachedChats) return cachedChats;
    const data = localStorage.getItem('sh_chats');
    const chats = data ? JSON.parse(data) : [];
    cachedChats = chats;
    return chats;
  },

  saveChatMessages(messages: ChatMessage[]): void {
    cachedChats = messages;
    localStorage.setItem('sh_chats', JSON.stringify(messages));
    this.triggerSync();
  },

  cleanExpiredChats(): void {
    const messages = this.getChatMessages();
    if (messages.length === 0) return;

    // Group messages by user conversation (the non-admin user ID)
    const messagesByUser = new Map<string, ChatMessage[]>();
    messages.forEach(msg => {
      const userId = msg.senderId === 'admin' ? msg.receiverId : msg.senderId;
      if (!messagesByUser.has(userId)) {
        messagesByUser.set(userId, []);
      }
      messagesByUser.get(userId)!.push(msg);
    });

    const now = new Date().getTime();
    const ONE_HOUR = 60 * 60 * 1000;
    const activeUserIds: string[] = [];

    messagesByUser.forEach((msgs, userId) => {
      // Find the most recent message in this conversation
      const sorted = [...msgs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const lastMsgTime = new Date(sorted[0].createdAt).getTime();
      if (now - lastMsgTime < ONE_HOUR) {
        activeUserIds.push(userId);
      }
    });

    // Filter to keep only messages belonging to active conversations (last active < 1 hour ago)
    const filteredMessages = messages.filter(msg => {
      const userId = msg.senderId === 'admin' ? msg.receiverId : msg.senderId;
      return activeUserIds.includes(userId);
    });

    if (filteredMessages.length !== messages.length) {
      this.saveChatMessages(filteredMessages);
    }
  },

  updateLocalDb(sDb: any): boolean {
    if (!sDb) return false;

    // Fast signature comparison to avoid expensive localStorage stringify and unneeded DOM renders
    const currentSignature = `${sDb.users?.length || 0}_${sDb.products?.length || 0}_${sDb.keys?.length || 0}_${sDb.deposits?.length || 0}_${sDb.transactions?.length || 0}_${sDb.chats?.length || 0}_${JSON.stringify(sDb.users?.[0] || {})}_${JSON.stringify(sDb.keys?.[0] || {})}`;
    
    // Memory assignment
    cachedUsers = sDb.users || [];
    cachedProducts = sDb.products || [];
    cachedKeys = sDb.keys || [];
    cachedDeposits = sDb.deposits || [];
    cachedTransactions = sDb.transactions || [];
    cachedAdminSettings = sDb.adminSettings || {};
    cachedChats = sDb.chats || [];

    // Persist back to client localStorage
    try {
      localStorage.setItem('sh_users', JSON.stringify(cachedUsers));
      localStorage.setItem('sh_products', JSON.stringify(cachedProducts));
      localStorage.setItem('sh_keys', JSON.stringify(cachedKeys));
      localStorage.setItem('sh_deposits', JSON.stringify(cachedDeposits));
      localStorage.setItem('sh_transactions', JSON.stringify(cachedTransactions));
      localStorage.setItem('sh_admin_settings', JSON.stringify(cachedAdminSettings));
      localStorage.setItem('sh_chats', JSON.stringify(cachedChats));

      // Refresh session user detail if logged in
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        const matchedUser = cachedUsers.find((u: any) => u.id === currentUser.id);
        if (matchedUser) {
          cachedCurrentUser = matchedUser;
          localStorage.setItem('sh_current_user', JSON.stringify(matchedUser));
        }
      }
    } catch (e) {
      console.error('LocalStorage persist error:', e);
    }

    return true;
  },

  markWriteCompleted(): void {
    globalRequestSeq++;
    lastCompletedRequestSeq = globalRequestSeq;
  },

  async syncWithServer(): Promise<boolean> {
    if (isSyncing) return false;
    isSyncing = true;
    const mySeq = ++globalRequestSeq;

    try {
      const clientDb = {
        users: this.getUsers(),
        products: this.getProducts(),
        keys: this.getKeys(),
        deposits: this.getDepositRequests(),
        transactions: this.getTransactions(),
        adminSettings: this.getAdminSettings(),
        chats: this.getChatMessages(),
      };
      const currentUser = this.getCurrentUser();

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientDb, currentUser }),
      });

      if (!response.ok) {
        return false;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return false;
      }

      const data = await response.json();
      
      // If a newer authoritative write (e.g. purchase or admin adjustment) has completed since we started this request,
      // discard this response as it contains stale state.
      if (mySeq < lastCompletedRequestSeq) {
        return false;
      }
      lastCompletedRequestSeq = mySeq;

      if (data && data.db) {
        this.updateLocalDb(data.db);
        return true;
      }
    } catch (e) {
      console.error('Error syncing with server:', e);
    } finally {
      isSyncing = false;
    }
    return false;
  },

  triggerSync(): void {
    // Invalidate currently in-flight requests because we have authored a newer local change
    globalRequestSeq++;
    lastCompletedRequestSeq = globalRequestSeq;

    // Debounce the sync to batch rapid consecutive local writes (e.g., during purchases)
    if (syncTimeoutId) {
      clearTimeout(syncTimeoutId);
    }
    syncTimeoutId = setTimeout(() => {
      syncTimeoutId = null;
      this.syncWithServer().catch(err => console.error('Background sync failed', err));
    }, 100);
  }
};
