import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, ShoppingBag, Terminal, Key, Check, AlertCircle, RefreshCw, Star, Info, CreditCard, X } from 'lucide-react';
import { db } from './dbMock';
import { User, Product, KeyStock, Transaction } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import ProductCard from './components/ProductCard';
import DepositSection from './components/DepositSection';
import MailboxSection from './components/MailboxSection';
import AdminPanel from './components/AdminPanel';
import LuckyWheelSection from './components/LuckyWheelSection';
import AimProxyGuide from './components/AimProxyGuide';
import { SupportChat } from './components/SupportChat';

export default function App() {
  // Navigation & Modal States
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Database Refresh Triggers
  const [dbTick, setDbTick] = useState(0);

  // Purchase Overlay Modal States
  const [boughtKey, setBoughtKey] = useState<string | null>(null);
  const [boughtProduct, setBoughtProduct] = useState<Product | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [insufficientFundsProduct, setInsufficientFundsProduct] = useState<Product | null>(null);

  // Welcome Announcement Modal State
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(true);

  // Blocked Account States
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [blockedCountdown, setBlockedCountdown] = useState(10);

  // Initialize session on mount and start background auto-sync with Express server
  useEffect(() => {
    const user = db.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }

    // Initial background sync
    db.syncWithServer().then(() => {
      refreshDatabase();
    });

    // Real-time Server-Sent Events (SSE) Stream listener for 0ms instant server synchronization
    let eventSource: EventSource | null = null;
    const setupSSE = () => {
      try {
        eventSource = new EventSource('/api/events');
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.db) {
              const updated = db.updateLocalDb(data.db);
              if (updated) {
                refreshDatabase();
              }
            }
          } catch (e) {
            console.error('Error handling real-time SSE stream:', e);
          }
        };
      } catch (e) {
        console.error('SSE initialization error:', e);
      }
    };

    setupSSE();

    // Passive fallback sync timer to ensure 100% data consistency
    const interval = setInterval(() => {
      db.syncWithServer().then((updated) => {
        if (updated) {
          refreshDatabase();
        }
      });
    }, 3000);

    return () => {
      clearInterval(interval);
      if (eventSource) eventSource.close();
    };
  }, []);

  // Force reactive syncs for shared database counters (like key counts)
  const refreshDatabase = () => {
    setDbTick(prev => prev + 1);
    const updatedUser = db.getCurrentUser();
    setCurrentUser(updatedUser);
  };

  const handleLogout = () => {
    db.setCurrentUser(null);
    setCurrentUser(null);
    setActiveTab('home');
  };

  // Check for real-time account block status from Admin
  useEffect(() => {
    if (currentUser && currentUser.isBlocked && currentUser.role !== 'admin') {
      if (!isBlockedModalOpen) {
        setIsBlockedModalOpen(true);
        setBlockedCountdown(10);
      }
    }
  }, [currentUser, isBlockedModalOpen]);

  // Handle countdown for blocked modal
  useEffect(() => {
    if (!isBlockedModalOpen) return;

    const timer = setInterval(() => {
      setBlockedCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleLogout();
          setIsBlockedModalOpen(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBlockedModalOpen]);

  const handleBlockedConfirm = () => {
    handleLogout();
    setIsBlockedModalOpen(false);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    refreshDatabase();
  };

  // --- CORE PURCHASE ENGINE ---
  const handleBuyProduct = async (product: Product) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const response = await fetch('/api/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUser.id, productId: product.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errMsg = errorData.error || 'Giao dịch thất bại!';

        if (response.status === 403) {
          alert(errMsg);
          handleLogout();
          return;
        }

        if (response.status === 404 && errMsg.includes('Tài khoản không tồn tại')) {
          alert(errMsg);
          handleLogout();
          return;
        }

        if (response.status === 400 && errMsg.includes('không đủ')) {
          setInsufficientFundsProduct(product);
          return;
        }

        alert(errMsg);
        return;
      }

      const data = await response.json();
      if (data.success) {
        // Mark write as completed so in-flight background syncs are invalidated
        db.markWriteCompleted();
        // Sync the client's local database completely with the returned DB from server
        db.updateLocalDb(data.db);

        // Update local React states to trigger UI changes immediately
        setBoughtKey(data.key.keyString);
        setBoughtProduct(product);
        refreshDatabase();
      }
    } catch (err) {
      console.error('Error purchasing product:', err);
      alert('Đã xảy ra lỗi khi kết nối với máy chủ!');
    }
  };

  // Pre-filter products lists
  const allProducts = db.getProducts();
  const proxyProducts = allProducts.filter(p => p.category === 'proxy');
  const migulProducts = allProducts.filter(p => p.category === 'migul');

  // Count unread mailbox count
  const allTxs = db.getTransactions();
  const mailboxCount = currentUser 
    ? allTxs.filter(t => t.userId === currentUser.id && !t.isDeleted).length
    : 0;

  // Simulator helper: Quick trigger admin or customer demo
  const handleQuickSwapRole = (role: 'user' | 'admin') => {
    const users = db.getUsers();
    if (role === 'admin') {
      const adminUser = users.find(u => u.username === 'huy321la') || {
        id: 'admin_huy',
        username: 'huy321la',
        balance: 99999999,
        createdAt: new Date().toISOString(),
        isBlocked: false,
        role: 'admin',
      };
      // Check if admin is in the users list
      if (!users.some(u => u.username === 'huy321la')) {
        db.saveUsers([...users, adminUser]);
      }
      db.setCurrentUser(adminUser);
      setCurrentUser(adminUser);
      setActiveTab('admin');
    } else {
      // Find or create a demo customer
      let demoUser = users.find(u => u.username === 'khachhang_demo');
      if (!demoUser) {
        demoUser = {
          id: 'user_demo',
          username: 'khachhang_demo',
          balance: 0,
          createdAt: new Date().toISOString(),
          isBlocked: false,
          role: 'user',
        };
        db.saveUsers([...users, demoUser]);
      }
      db.setCurrentUser(demoUser);
      setCurrentUser(demoUser);
      setActiveTab('home');
    }
    refreshDatabase();
  };

  const handleSimulateDepositCredit = () => {
    if (!currentUser) return;
    const users = db.getUsers();
    const updated = users.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, balance: u.balance + 100000 };
      }
      return u;
    });
    db.saveUsers(updated);
    refreshDatabase();
    alert('Đã nạp thành công 100.000 VNĐ thử nghiệm vào tài khoản của bạn!');
  };

  const formatVND = (value: number) => {
    return value.toLocaleString('vi-VN') + ' VNĐ';
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-zinc-100 flex flex-col font-sans selection:bg-pink-500/30 selection:text-white" id="shop-app-root">
      
      {/* Background Neon Grid Pattern Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1225_1px,transparent_1px),linear-gradient(to_bottom,#1f1225_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0 opacity-25"></div>

      {/* Decorative top ambient pink laser line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-pink-500 to-transparent shadow-[0_0_12px_rgba(236,72,153,0.8)] relative z-50"></div>

      {/* Primary Header */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        unreadCount={mailboxCount}
      />

      {/* Main Content Arena */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 relative z-10" id="main-content-layout">
        
        {/* TAB 1: SHOPPING FLOOR (HOME) */}
        {activeTab === 'home' && (
          <div className="space-y-12" id="tab-home-view">
            
            {/* Hero Brand Section */}
            <div className="text-center space-y-4 max-w-3xl mx-auto py-4" id="hero-brand-section">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 font-extrabold text-[10px] sm:text-xs tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-spin" />
                Cổng Dịch Vụ Hack Game Cao Cấp
              </span>
              
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-none uppercase">
                SHOP ĐỒ CHƠI <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]">FULL ĐỎ</span>
              </h1>
              <p className="text-sm sm:text-base text-zinc-400 font-medium max-w-xl mx-auto">
                Bảo quyền key game uy tín từ đại lý phân phối chính thức Hoàng Hiệp. Hệ thống thanh toán hóa đơn tự động 24/7 bảo mật tuyệt đối.
              </p>
            </div>

            {/* Quick Promo Alert banner */}
            <div className="bg-zinc-950/80 border border-pink-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-[0_0_15px_rgba(244,63,94,0.05)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-pink-500/10 text-pink-500 rounded-xl">
                  <Terminal className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-extrabold text-white text-sm">Chào mừng đến với đại lý game Hoàng Hiệp!</h4>
                  <p className="text-xs text-zinc-400">Bạn bắt buộc phải Đăng ký & Đăng nhập để tiến hành mua key tự động.</p>
                </div>
              </div>
              <div className="flex gap-2">
                {!currentUser ? (
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-xl shadow-[0_0_10px_rgba(219,39,119,0.3)] transition-all cursor-pointer"
                  >
                    Tham gia ngay
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('deposit')}
                    className="px-4 py-2 bg-pink-950/40 hover:bg-pink-950/80 text-pink-400 border border-pink-500/30 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Nạp ví của bạn
                  </button>
                )}
              </div>
            </div>

            {/* FEATURED: LUCKY WHEEL SECTION */}
            <div id="lucky-wheel-home-shelf">
              <LuckyWheelSection
                currentUser={currentUser}
                onOpenAuth={() => setIsAuthOpen(true)}
                onRefreshUser={refreshDatabase}
              />
            </div>

            {/* PRODUCT SHELF 1: KEY PROXY */}
            <div className="space-y-6" id="proxy-shelf">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                <span className="text-pink-500 text-xl">🌟</span>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">MỤC KEY PROXY (DÀNH CHO ANH EM PRO)</h2>
                  <p className="text-xs text-zinc-500 font-medium">Bản quyền Proxy Full Aim, bypass an toàn tuyệt đối, mượt mà hoàn hảo.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {proxyProducts.map(prod => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    inStockCount={db.getKeys().filter(k => k.productId === prod.id && !k.isSold).length}
                    onBuy={handleBuyProduct}
                  />
                ))}
              </div>
            </div>

            {/* PRODUCT SHELF 2: KEY MIGUL */}
            <div className="space-y-6" id="migul-shelf">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                <span className="text-emerald-500 text-xl">🔥</span>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">MỤC KEY MIGUL VIP</h2>
                  <p className="text-xs text-zinc-500 font-medium">Engine can thiệp cao cấp, tối ưu hóa FPS, đầy đủ tính năng mạnh mẽ nhất.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {migulProducts.map(prod => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    inStockCount={db.getKeys().filter(k => k.productId === prod.id && !k.isSold).length}
                    onBuy={handleBuyProduct}
                  />
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: LUCKY WHEEL DEDICATED VIEW */}
        {activeTab === 'wheel' && (
          <div id="tab-wheel-view">
            <LuckyWheelSection
              currentUser={currentUser}
              onOpenAuth={() => setIsAuthOpen(true)}
              onRefreshUser={refreshDatabase}
            />
          </div>
        )}

        {/* TAB: AIM PROXY INSTALLATION GUIDE */}
        {activeTab === 'guide' && (
          <div id="tab-guide-view">
            <AimProxyGuide />
          </div>
        )}

        {/* TAB 3: DEPOSIT BILLING */}
        {activeTab === 'deposit' && (
          <div id="tab-deposit-view">
            <DepositSection
              currentUser={currentUser}
              onOpenAuth={() => setIsAuthOpen(true)}
              onRefreshUser={refreshDatabase}
              dbTick={dbTick}
            />
          </div>
        )}

        {/* TAB 3: PERSONAL MAILBOX */}
        {activeTab === 'mailbox' && (
          <div id="tab-mailbox-view">
            <MailboxSection
              currentUser={currentUser}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          </div>
        )}

        {/* TAB 4: SYSTEM ADMIN PORTAL */}
        {activeTab === 'admin' && (
          <div id="tab-admin-view">
            <AdminPanel
              currentUser={currentUser}
              onRefreshDatabase={refreshDatabase}
              dbTick={dbTick}
            />
          </div>
        )}

      </main>

      {/* --- FOOTER STATEMENT --- */}
      <Footer />

      {/* --- FLOATING AUTHENTICATION MODAL --- */}
      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            onSuccess={handleAuthSuccess}
          />
        )}
      </AnimatePresence>

      {/* --- FLOATING SUCCESSFUL PURCHASE DIALOG MODAL --- */}
      <AnimatePresence>
        {boughtKey && boughtProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" id="purchase-success-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-lg bg-zinc-900 border-2 border-pink-500/60 rounded-2xl p-6 text-center space-y-6 shadow-[0_0_30px_rgba(244,63,94,0.3)] relative"
            >
              <div className="p-4 bg-pink-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
                <Check className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="font-black text-xl text-white uppercase tracking-wider">MUA KEY THÀNH CÔNG!</h3>
                <p className="text-xs text-zinc-400">Đơn hàng đã được thanh toán và giao trực tiếp về Hòm Thư cá nhân của bạn.</p>
              </div>

              {/* Product Info Summary */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-left space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Sản phẩm:</span>
                  <span className="text-white font-bold">{boughtProduct.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Hạn dùng:</span>
                  <span className="text-white font-bold">{boughtProduct.duration}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Giá trừ:</span>
                  <span className="text-pink-400 font-extrabold">{formatVND(boughtProduct.price)}</span>
                </div>

                <div className="h-px bg-zinc-800/60 my-2"></div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">MÃ BẢN QUYỀN GAME (LICENSE KEY)</label>
                  <div className="flex items-center justify-between bg-zinc-900 px-3 py-2.5 rounded border border-zinc-800">
                    <code className="text-emerald-400 font-mono font-extrabold tracking-wide select-all text-xs break-all">{boughtKey}</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(boughtKey);
                        alert('Đã sao chép key bản quyền!');
                      }}
                      className="text-zinc-400 hover:text-pink-400 text-[10px] font-bold border border-zinc-800 hover:border-pink-500/40 px-2 py-1 rounded bg-zinc-950"
                    >
                      SAO CHÉP
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setBoughtKey(null);
                    setBoughtProduct(null);
                    setActiveTab('mailbox');
                  }}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all cursor-pointer text-xs"
                >
                  XEM HÒM THƯ CÁ NHÂN
                </button>
                <button
                  onClick={() => {
                    setBoughtKey(null);
                    setBoughtProduct(null);
                  }}
                  className="flex-1 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl transition-all shadow-[0_0_12px_rgba(219,39,119,0.3)] cursor-pointer text-xs"
                >
                  MUA TIẾP SẢN PHẨM KHÁC
                </button>
              </div>

              <p className="text-[10px] text-zinc-500 font-medium font-mono">Bản quyền của bạn luôn được lưu trữ an toàn trong Hòm Thư Cá Nhân.</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- INSUFFICIENT FUNDS DIALOG OVERLAY --- */}
      <AnimatePresence>
        {insufficientFundsProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" id="insufficient-funds-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-900 border-2 border-red-500/50 rounded-2xl p-6 text-center space-y-5 shadow-[0_0_25px_rgba(239,68,68,0.15)]"
            >
              <div className="p-3.5 bg-red-500/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                <AlertCircle className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-extrabold text-lg text-white">SỐ DƯ KHÔNG ĐỦ THANH TOÁN</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Tài khoản của bạn hiện không có đủ số dư để mua <strong className="text-white">{insufficientFundsProduct.name}</strong> ({formatVND(insufficientFundsProduct.price)}).
                </p>
              </div>

              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 font-mono text-xs text-left flex justify-between items-center">
                <span className="text-zinc-500">Số dư hiện tại:</span>
                <span className="text-pink-500 font-black">{currentUser ? formatVND(currentUser.balance) : '0 VNĐ'}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setInsufficientFundsProduct(null)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg transition-all text-xs cursor-pointer"
                >
                  Để sau
                </button>
                <button
                  onClick={() => {
                    setInsufficientFundsProduct(null);
                    setActiveTab('deposit');
                  }}
                  className="flex-1 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-lg transition-all shadow-[0_0_12px_rgba(219,39,119,0.3)] text-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Nạp tiền ngay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- BLOCKED ACCOUNT NOTIFICATION OVERLAY (SHAKE ANIMATION) --- */}
      <AnimatePresence>
        {isBlockedModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md" id="blocked-account-overlay">
            <motion.div
              variants={{
                initial: { opacity: 0, scale: 0.9 },
                animate: { 
                  opacity: 1, 
                  scale: 1,
                  x: [0, -12, 12, -12, 12, -8, 8, -4, 4, 0],
                  transition: {
                    x: {
                      duration: 0.6,
                      ease: "easeInOut",
                      times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1],
                      repeat: Infinity,
                      repeatDelay: 1.5
                    },
                    default: { duration: 0.3 }
                  }
                },
                exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-md bg-zinc-950 border-2 border-red-600 rounded-2xl p-6 text-center space-y-6 shadow-[0_0_50px_rgba(220,38,38,0.3)] relative overflow-hidden"
            >
              {/* Top Warning Banner Glow Effect */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-pink-600 to-red-600 animate-pulse" />

              <div className="p-4 bg-red-600/10 border border-red-500/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-red-500 shadow-[0_0_20px_rgba(220,38,38,0.2)] animate-pulse">
                <AlertCircle className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <h3 className="font-black text-xl text-red-500 tracking-wider">TÀI KHOẢN BỊ KHÓA TRUY CẬP</h3>
                <p className="text-sm font-semibold text-zinc-300 leading-relaxed">
                  Phát hiện vi phạm nguyên tắc hệ thống hoặc hành vi gian lận.
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed px-2">
                  Tài khoản của bạn đã bị ban quản trị khóa vĩnh viễn hoặc tạm thời. Tất cả các tính năng mua sắm đã bị vô hiệu hóa ngay lập tức.
                </p>
              </div>

              <div className="bg-red-950/20 p-4 rounded-xl border border-red-500/10 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-mono">Tài khoản:</span>
                  <span className="text-zinc-300 font-bold font-mono">{currentUser?.username}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-mono">Lý do:</span>
                  <span className="text-red-400 font-bold">Vi phạm nghiêm trọng nguyên tắc</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs text-zinc-500 font-mono flex items-center justify-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                  Tự động đăng xuất sau <strong className="text-red-400 font-black font-mono">{blockedCountdown}s</strong>...
                </div>

                <button
                  onClick={handleBlockedConfirm}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] active:scale-[0.98] cursor-pointer text-xs uppercase tracking-wider"
                >
                  Xác nhận & Đăng xuất ngay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Welcome Announcement Modal */}
      <AnimatePresence>
        {isWelcomeModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-zinc-950 border-2 border-red-600/70 rounded-2xl p-6 sm:p-8 text-white space-y-6 shadow-[0_0_60px_rgba(220,38,38,0.35)] relative overflow-hidden"
            >
              {/* Background ambient glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-pink-500 to-red-600" />

              {/* Close Button Top Right */}
              <button
                onClick={() => setIsWelcomeModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors border border-zinc-800 cursor-pointer"
                title="Đóng thông báo"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header Badge & Title */}
              <div className="text-center space-y-2 pt-1">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-red-500" />
                  Thông Báo Chào Mừng
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                  🚀 Chào mừng đến với <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-pink-500 to-red-400">Proxy VIP Hoàng Hiệp</span>
                </h2>
              </div>

              {/* Message List */}
              <div className="space-y-3.5 bg-zinc-900/70 border border-zinc-800/80 p-4 sm:p-5 rounded-xl text-sm leading-relaxed text-zinc-200">
                <div className="flex items-start gap-3">
                  <span className="text-base shrink-0">❤️</span>
                  <p>Cảm ơn anh em đã tin tưởng và đồng hành cùng shop.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-base shrink-0">🔑</span>
                  <p>Chuyên cung cấp Key và dịch vụ Proxy chất lượng cao.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-base shrink-0">⚡</span>
                  <p>Máy chủ ổn định • Tốc độ nhanh • Đồng bộ thời gian thực.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-base shrink-0">🛡️</span>
                  <p>Hỗ trợ tận tâm • Uy tín • Bảo mật • Cập nhật liên tục.</p>
                </div>
                <div className="flex items-start gap-3 pt-2.5 border-t border-zinc-800/80">
                  <span className="text-base shrink-0">🤝</span>
                  <p className="font-semibold text-red-400">
                    Chúc anh em có những trải nghiệm tốt nhất tại Proxy VIP Hoàng Hiệp!
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setIsWelcomeModalOpen(false)}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 via-red-500 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-extrabold rounded-xl transition-all shadow-[0_0_25px_rgba(220,38,38,0.4)] hover:shadow-[0_0_35px_rgba(220,38,38,0.6)] active:scale-[0.98] cursor-pointer text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <span>Khám Phá Ngay</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Support Chat System (Replaces Test Simulator Box) */}
      <SupportChat 
        currentUser={currentUser} 
        onOpenAuth={() => setIsAuthOpen(true)} 
      />

    </div>
  );
}
