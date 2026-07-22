import React from 'react';
import { Home, CreditCard, Mail, LogIn, LogOut, Shield, Wallet, Dices, BookOpen } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  unreadCount: number;
}

export default function Header({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onLogout,
  unreadCount,
}: HeaderProps) {
  // Format currency with VNĐ suffix
  const formatVND = (value: number) => {
    return value.toLocaleString('vi-VN') + ' VNĐ';
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-zinc-950/90 backdrop-blur-md border-b border-pink-500/30 shadow-[0_4px_20px_rgba(244,63,94,0.1)]" id="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Glowing Pink Neon Logo */}
          <div 
            onClick={() => setActiveTab('home')} 
            className="flex flex-col cursor-pointer group"
            id="header-logo-container"
          >
            <span className="text-xl sm:text-2xl font-black text-white tracking-widest uppercase transition-all duration-300 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)] group-hover:drop-shadow-[0_0_15px_rgba(236,72,153,1)]">
              HOÀNG <span className="text-pink-500">HIỆP</span>
            </span>
            <span className="text-[9px] font-bold text-pink-400 tracking-[0.25em] -mt-1 uppercase text-center sm:text-left">
              Shop Đồ Chơi Full Đỏ
            </span>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1" id="header-nav-desktop">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40 shadow-[0_0_10px_rgba(236,72,153,0.2)]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
              id="nav-tab-home"
            >
              <Home className="w-4 h-4" />
              Trang Chủ
            </button>

            <button
              onClick={() => setActiveTab('wheel')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all cursor-pointer relative ${
                activeTab === 'wheel'
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40 shadow-[0_0_10px_rgba(236,72,153,0.2)]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
              id="nav-tab-wheel"
            >
              <Dices className="w-4 h-4 text-pink-500 animate-spin" />
              <span className="text-pink-400 font-extrabold">Vòng Quay</span>
              <span className="bg-pink-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase animate-pulse">HOT</span>
            </button>
            
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40 shadow-[0_0_10px_rgba(236,72,153,0.2)]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
              id="nav-tab-guide"
            >
              <BookOpen className="w-4 h-4 text-pink-400" />
              Cách Cài Aim Proxy
            </button>

            <button
              onClick={() => setActiveTab('deposit')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all cursor-pointer ${
                activeTab === 'deposit'
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40 shadow-[0_0_10px_rgba(236,72,153,0.2)]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
              id="nav-tab-deposit"
            >
              <CreditCard className="w-4 h-4" />
              Nạp Tiền
            </button>

            <button
              onClick={() => setActiveTab('mailbox')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all relative cursor-pointer ${
                activeTab === 'mailbox'
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40 shadow-[0_0_10px_rgba(236,72,153,0.2)]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
              id="nav-tab-mailbox"
            >
              <Mail className="w-4 h-4" />
              Hòm Thư Cá Nhân
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white shadow-[0_0_5px_rgba(236,72,153,0.8)] animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {currentUser && currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all border border-pink-500/60 bg-pink-950/20 text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.15)] cursor-pointer hover:bg-pink-500 hover:text-white`}
                id="nav-tab-admin"
              >
                <Shield className="w-4 h-4 animate-pulse" />
                Hệ Thống Admin
              </button>
            )}
          </nav>

          {/* Right-side Account Details / Login button */}
          <div className="flex items-center gap-3" id="header-profile-section">
            {currentUser ? (
              <div className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-1.5 pl-3.5 pr-2.5" id="user-info-badge">
                <div className="flex flex-col text-right">
                  <span className="text-xs text-zinc-400 font-medium">Xin chào,</span>
                  <span className="text-sm font-bold text-white flex items-center gap-1">
                    {currentUser.username}
                    {currentUser.role === 'admin' && (
                      <span className="text-[9px] bg-pink-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Admin
                      </span>
                    )}
                  </span>
                </div>

                <div className="h-8 w-px bg-zinc-800 hidden sm:block"></div>

                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Wallet className="w-3 h-3 text-pink-500" /> Số dư
                  </span>
                  <span className="text-sm font-black text-pink-400 drop-shadow-[0_0_4px_rgba(244,63,94,0.3)]">
                    {formatVND(currentUser.balance)}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  title="Đăng xuất"
                  className="p-2 text-zinc-400 hover:text-pink-400 hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
                  id="logout-btn"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(219,39,119,0.4)] hover:shadow-[0_0_20px_rgba(219,39,119,0.6)] flex items-center gap-2 cursor-pointer active:scale-95"
                id="login-register-trigger"
              >
                <LogIn className="w-4 h-4" />
                ĐĂNG NHẬP / ĐĂNG KÝ
              </button>
            )}
          </div>

        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center justify-around py-3 border-t border-zinc-900 bg-zinc-950" id="header-nav-mobile">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 text-xs font-bold transition-all ${
              activeTab === 'home' ? 'text-pink-500' : 'text-zinc-500'
            }`}
          >
            <Home className="w-4 h-4" />
            Home
          </button>

          <button
            onClick={() => setActiveTab('wheel')}
            className={`flex flex-col items-center gap-1 text-xs font-bold transition-all ${
              activeTab === 'wheel' ? 'text-pink-500 font-black' : 'text-zinc-500'
            }`}
          >
            <Dices className="w-4 h-4 text-pink-500" />
            Vòng quay
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex flex-col items-center gap-1 text-xs font-bold transition-all ${
              activeTab === 'guide' ? 'text-pink-500 font-black' : 'text-zinc-500'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Cách Cài
          </button>
          
          <button
            onClick={() => setActiveTab('deposit')}
            className={`flex flex-col items-center gap-1 text-xs font-bold transition-all relative ${
              activeTab === 'deposit' ? 'text-pink-500' : 'text-zinc-500'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Nạp tiền
          </button>

          <button
            onClick={() => setActiveTab('mailbox')}
            className={`flex flex-col items-center gap-1 text-xs font-bold transition-all relative ${
              activeTab === 'mailbox' ? 'text-pink-500' : 'text-zinc-500'
            }`}
          >
            <Mail className="w-4 h-4" />
            Hòm thư
            {unreadCount > 0 && (
              <span className="absolute top-0 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-pink-500 text-[8px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {currentUser && currentUser.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex flex-col items-center gap-1 text-xs font-bold transition-all ${
                activeTab === 'admin' ? 'text-pink-500' : 'text-zinc-500'
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </button>
          )}
        </div>

        {/* Mobile Balance Bar if logged in */}
        {currentUser && (
          <div className="sm:hidden py-1.5 px-1 bg-zinc-900/60 flex justify-between items-center border-t border-zinc-900 rounded-b-xl" id="mobile-balance-bar">
            <span className="text-xs text-zinc-500 font-bold ml-2">SỐ DƯ TÀI KHOẢN:</span>
            <span className="text-xs font-black text-pink-400 mr-2">
              {formatVND(currentUser.balance)}
            </span>
          </div>
        )}

      </div>
    </header>
  );
}
