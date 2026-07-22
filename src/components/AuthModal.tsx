import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, LogIn, Shield, HelpCircle } from 'lucide-react';
import { db } from '../dbMock';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !password) {
      setError('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    // Sync with the central server to get the absolute latest user records and balances
    await db.syncWithServer();

    const users = db.getUsers();

    if (isLogin) {
      // Login flow
      // Standard credentials check
      const foundUser = users.find(u => u.username === cleanUsername);
      if (!foundUser) {
        setError('Tài khoản không tồn tại trên hệ thống!');
        return;
      }

      if (foundUser.isBlocked) {
        setError('Tài khoản này đã bị khóa do vi phạm quy định!');
        return;
      }

      // Check for default admin password or simulate matching
      // (For mock purposes, password is same as username or we allow any password for newly registered users, but we strict check 'huy321la' and 'hiep321la' for the default admins)
      if (cleanUsername === 'huy321la' && password !== 'huy321la') {
        setError('Mật khẩu Admin không chính xác!');
        return;
      }
      if (cleanUsername === 'hiep321la' && password !== 'hiep321la') {
        setError('Mật khẩu Admin không chính xác!');
        return;
      }

      // Successful login
      db.setCurrentUser(foundUser);
      setSuccess('Đăng nhập thành công!');
      setTimeout(() => {
        onSuccess(foundUser);
        onClose();
      }, 1000);
    } else {
      // Register flow
      if (cleanUsername === 'huy321la' || cleanUsername === 'hiep321la') {
        setError('Không thể đăng ký tài khoản trùng tên Admin!');
        return;
      }

      if (cleanUsername.length < 3) {
        setError('Tên tài khoản phải từ 3 ký tự trở lên!');
        return;
      }

      const foundUser = users.find(u => u.username === cleanUsername);
      if (foundUser) {
        setError('Tên tài khoản đã tồn tại!');
        return;
      }

      const newUser: User = {
        id: 'user_' + Math.random().toString(36).substring(2, 9),
        username: cleanUsername,
        balance: 0,
        createdAt: new Date().toISOString(),
        isBlocked: false,
        role: 'user',
      };

      const updatedUsers = [...users, newUser];
      db.saveUsers(updatedUsers);
      db.setCurrentUser(newUser);

      setSuccess('Đăng ký tài khoản mới thành công!');
      setTimeout(() => {
        onSuccess(newUser);
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" id="auth-modal-backdrop">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md overflow-hidden bg-zinc-900 border-2 border-pink-500/50 rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.15)]"
        id="auth-modal-container"
      >
        {/* Header */}
        <div className="relative flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            {isLogin ? (
              <LogIn className="w-5 h-5 text-pink-500" />
            ) : (
              <UserPlus className="w-5 h-5 text-pink-500" />
            )}
            <h3 className="font-bold text-lg text-white tracking-wide">
              {isLogin ? 'ĐĂNG NHẬP HỆ THỐNG' : 'ĐĂNG KÝ TÀI KHOẢN'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-pink-500 hover:bg-zinc-800 rounded-lg transition-colors"
            id="auth-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4" id="auth-form">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/50 text-red-400 text-sm rounded-lg" id="auth-error">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 text-emerald-400 text-sm rounded-lg" id="auth-success">
              {success}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Tên tài khoản
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 transition-all text-sm"
              placeholder="Nhập tên tài khoản của bạn..."
              autoFocus
              id="auth-username-input"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 transition-all text-sm"
              placeholder="Nhập mật khẩu..."
              id="auth-password-input"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-2 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(219,39,119,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            id="auth-submit-btn"
          >
            {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {isLogin ? 'ĐĂNG NHẬP NGAY' : 'ĐĂNG KÝ NGAY'}
          </button>

          {/* Toggle register/login */}
          <div className="text-center pt-2 text-sm text-zinc-400">
            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
              }}
              className="ml-1.5 text-pink-400 hover:text-pink-300 font-semibold underline transition-all"
              id="auth-toggle-mode"
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập ngay'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
