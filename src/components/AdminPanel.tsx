import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Settings, Key, Check, X, Ban, UserCheck, Plus, Trash2, Edit2, Coins, Landmark, Dices, Award, Clock, Sparkles, Upload, Image as ImageIcon, UploadCloud, Database, Search } from 'lucide-react';
import { db } from '../dbMock';
import { User, Product, KeyStock, DepositRequest, AdminSettings, Transaction, LuckyWheelReward, LuckyWheelSettings, LuckyWheelSpinLog } from '../types';

interface AdminPanelProps {
  currentUser: User | null;
  onRefreshDatabase: () => void;
  dbTick?: number;
}

export default function AdminPanel({ currentUser, onRefreshDatabase, dbTick }: AdminPanelProps) {
  const [subTab, setSubTab] = useState<'products' | 'deposits' | 'users' | 'settings' | 'luckywheel'>('deposits');
  
  // Lucky Wheel admin states
  const [luckySettings, setLuckySettings] = useState<LuckyWheelSettings>({
    pricePerSpin: 10000,
    isActive: true,
    outOfKeysBehavior: 'reroll'
  });
  const [luckyRewards, setLuckyRewards] = useState<LuckyWheelReward[]>([]);
  const [luckySpinLogs, setLuckySpinLogs] = useState<LuckyWheelSpinLog[]>([]);
  
  // Edit values
  const [wheelPrice, setWheelPrice] = useState(10000);
  const [wheelActive, setWheelActive] = useState(true);
  const [wheelBehavior, setWheelBehavior] = useState<'reroll' | 'refund' | 'empty_no_key'>('reroll');

  // Individual rewards editing
  const [rewardDay, setRewardDay] = useState<LuckyWheelReward | null>(null);
  const [rewardWeek, setRewardWeek] = useState<LuckyWheelReward | null>(null);
  const [rewardMonth, setRewardMonth] = useState<LuckyWheelReward | null>(null);

  const [bulkDayText, setBulkDayText] = useState('');
  const [bulkWeekText, setBulkWeekText] = useState('');
  const [bulkMonthText, setBulkMonthText] = useState('');

  const [luckySuccessMsg, setLuckySuccessMsg] = useState('');

  const fetchLuckyWheelAdminData = async () => {
    try {
      const response = await fetch(`/api/lucky-wheel/data?username=${currentUser?.username}`);
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        if (data && data.settings) {
          setLuckySettings(data.settings);
          setWheelPrice(data.settings.pricePerSpin);
          setWheelActive(data.settings.isActive);
          setWheelBehavior(data.settings.outOfKeysBehavior || 'reroll');
        }
        if (data && data.rewards) {
          setLuckyRewards(data.rewards);
          const day = data.rewards.find((r: any) => r.id === 'reward_day');
          const week = data.rewards.find((r: any) => r.id === 'reward_week');
          const month = data.rewards.find((r: any) => r.id === 'reward_month');
          if (day) setRewardDay(day);
          if (week) setRewardWeek(week);
          if (month) setRewardMonth(month);
        }
        if (data && data.spinLogs) {
          setLuckySpinLogs(data.spinLogs);
        }
      }
    } catch (err) {
      console.error('Error fetching admin lucky wheel:', err);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      fetchLuckyWheelAdminData();
    }
  }, [currentUser, subTab]);

  const handleSaveWheelSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/lucky-wheel/save-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pricePerSpin: Number(wheelPrice),
          isActive: Boolean(wheelActive),
          outOfKeysBehavior: wheelBehavior
        })
      });
      if (response.ok) {
        const data = await response.json();
        db.updateLocalDb(data.db);
        setLuckySuccessMsg('Đã lưu cấu hình chung của Vòng quay may mắn thành công!');
        setTimeout(() => setLuckySuccessMsg(''), 3000);
        fetchLuckyWheelAdminData();
        onRefreshDatabase();
      } else {
        alert('Lưu cài đặt thất bại!');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ!');
    }
  };

  const handleUpdateReward = async (rewardId: string, name: string, probability: number, newKeysText: string, clearAll = false) => {
    // Find reward to update
    const updatedRewards = luckyRewards.map((r) => {
      if (r.id === rewardId) {
        let currentKeys = clearAll ? [] : [...(r.keys || [])];
        
        // Parse new bulk keys if any
        if (newKeysText.trim()) {
          const splitKeys = newKeysText
            .split('\n')
            .map((k) => k.trim())
            .filter((k) => k.length > 0);
          currentKeys = [...currentKeys, ...splitKeys];
        }

        return {
          ...r,
          name: name,
          probability: Number(probability),
          keys: currentKeys
        };
      }
      return r;
    });

    // Validate total probability
    const totalProb = updatedRewards.reduce((sum, r) => sum + r.probability, 0);
    if (totalProb > 100) {
      alert(`Lỗi: Tổng tỷ lệ trúng thưởng đang là ${totalProb}%, vượt quá 100%! Vui lòng điều chỉnh lại.`);
      return;
    }

    try {
      const response = await fetch('/api/admin/lucky-wheel/save-rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewards: updatedRewards })
      });
      if (response.ok) {
        const data = await response.json();
        db.updateLocalDb(data.db);
        setLuckySuccessMsg('Đã cập nhật phần thưởng và kho key thành công!');
        setTimeout(() => setLuckySuccessMsg(''), 3000);
        
        // Clear text areas
        if (rewardId === 'reward_day') setBulkDayText('');
        if (rewardId === 'reward_week') setBulkWeekText('');
        if (rewardId === 'reward_month') setBulkMonthText('');

        fetchLuckyWheelAdminData();
        onRefreshDatabase();
      } else {
        alert('Cập nhật phần thưởng thất bại!');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ!');
    }
  };

  // States for products
  const [products, setProducts] = useState<Product[]>(db.getProducts());
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState(0);
  const [prodDuration, setProdDuration] = useState('');
  const [prodCategory, setProdCategory] = useState<'proxy' | 'migul'>('proxy');

  // States for bulk upload keys & server key warehouse
  const [bulkProductSelect, setBulkProductSelect] = useState('');
  const [bulkKeysText, setBulkKeysText] = useState('');
  const [keyUploadSuccess, setKeyUploadSuccess] = useState('');
  const [keyFilterProduct, setKeyFilterProduct] = useState<string>('all');
  const [keyFilterStatus, setKeyFilterStatus] = useState<'all' | 'available' | 'sold'>('all');
  const [keySearchText, setKeySearchText] = useState<string>('');

  // States for deposits
  const [deposits, setDeposits] = useState<DepositRequest[]>(db.getDepositRequests());

  // States for users
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [searchUser, setSearchUser] = useState('');

  // States for settings
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(db.getAdminSettings());
  const [bankName, setBankName] = useState(adminSettings.bankName);
  const [accountNumber, setAccountNumber] = useState(adminSettings.accountNumber);
  const [accountHolder, setAccountHolder] = useState(adminSettings.accountHolder);
  const [vietqrBankId, setVietqrBankId] = useState(adminSettings.vietqrBankId);
  const [qrType, setQrType] = useState<'vietqr' | 'custom'>(adminSettings.qrType || 'vietqr');
  const [customQrUrl, setCustomQrUrl] = useState(adminSettings.customQrUrl || '');
  const [qrFileName, setQrFileName] = useState<string>('');
  const [isUploadingQr, setIsUploadingQr] = useState<boolean>(false);
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Sync real-time updates from Server DB when SSE stream notifies new state
  useEffect(() => {
    const latestSettings = db.getAdminSettings();
    if (latestSettings) {
      setAdminSettings(latestSettings);
      setBankName(latestSettings.bankName || '');
      setAccountNumber(latestSettings.accountNumber || '');
      setAccountHolder(latestSettings.accountHolder || '');
      setVietqrBankId(latestSettings.vietqrBankId || '');
      setQrType(latestSettings.qrType || 'vietqr');
      setCustomQrUrl(latestSettings.customQrUrl || '');
    }
    setProducts(db.getProducts());
    setDeposits(db.getDepositRequests());
    setUsers(db.getUsers());
  }, [dbTick]);

  // File Reader for uploading QR image from device
  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP, GIF...)!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Dung lượng ảnh quá lớn! Vui lòng chọn tệp nhỏ hơn 5MB.');
      return;
    }

    setIsUploadingQr(true);
    setQrFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomQrUrl(result);
      }
      setIsUploadingQr(false);
    };
    reader.onerror = () => {
      alert('Đã xảy ra lỗi khi đọc tệp hình ảnh từ thiết bị!');
      setIsUploadingQr(false);
    };
    reader.readAsDataURL(file);
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="bg-red-950/20 border border-red-500/50 rounded-2xl p-8 text-center space-y-3">
        <Shield className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-extrabold text-white text-lg">CẢNH BÁO QUYỀN TRUY CẬP</h3>
        <p className="text-zinc-400 text-sm max-w-md mx-auto">Bạn không có quyền truy cập trang quản trị này. Vui lòng đăng nhập thủ công với tài khoản Admin mặc định (Username: <code className="text-pink-400">huy321la</code> hoặc <code className="text-pink-400">hiep321la</code>).</p>
      </div>
    );
  }

  const syncDatabase = () => {
    db.syncWithServer().then(() => {
      onRefreshDatabase();
      setProducts(db.getProducts());
      setDeposits(db.getDepositRequests());
      setUsers(db.getUsers());
    });
  };

  // --- PRODUCT MANAGEMENT ---
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice || !prodDuration) {
      alert('Vui lòng điền đầy đủ thông tin sản phẩm!');
      return;
    }

    const prodData: Product = {
      id: editingProduct ? editingProduct.id : prodCategory + '_' + Math.random().toString(36).substring(2, 6),
      name: prodName,
      category: prodCategory,
      duration: prodDuration,
      price: Number(prodPrice),
    };

    try {
      const res = await fetch('/api/admin/products/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: prodData,
          adminUsername: currentUser?.username
        })
      });
      const data = await res.json();
      if (data.success && data.db) {
        db.updateLocalDb(data.db);
        syncDatabase();
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi lưu sản phẩm lên máy chủ!');
    }

    // Reset fields
    setEditingProduct(null);
    setProdName('');
    setProdPrice(0);
    setProdDuration('');
  };

  const handleEditProductClick = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdPrice(prod.price);
    setProdDuration(prod.duration);
    setProdCategory(prod.category);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) {
      try {
        const res = await fetch('/api/admin/products/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            adminUsername: currentUser?.username
          })
        });
        const data = await res.json();
        if (data.success && data.db) {
          db.updateLocalDb(data.db);
          syncDatabase();
        } else if (data.error) {
          alert(data.error);
        }
      } catch (e) {
        console.error(e);
        alert('Lỗi khi xóa sản phẩm trên máy chủ!');
      }
    }
  };

  // --- SERVER KEY WAREHOUSE MANAGEMENT HANDLERS ---
  const handleBulkKeyUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkProductSelect) {
      alert('Vui lòng chọn sản phẩm cần thêm key!');
      return;
    }

    const rawKeys = bulkKeysText.split('\n').map(k => k.trim()).filter(k => k.length > 0);
    if (rawKeys.length === 0) {
      alert('Vui lòng điền danh sách key!');
      return;
    }

    try {
      const response = await fetch('/api/admin/keys/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: bulkProductSelect,
          keyStrings: rawKeys,
          adminUsername: currentUser?.username
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        alert(errData.error || 'Nạp key thất bại!');
        return;
      }

      const data = await response.json();
      if (data.success) {
        db.markWriteCompleted();
        db.updateLocalDb(data.db);
        setBulkKeysText('');
        setKeyUploadSuccess(data.message || `Đã nạp sỉ thành công ${rawKeys.length} key mới vào kho server!`);
        setTimeout(() => setKeyUploadSuccess(''), 4000);
        onRefreshDatabase();
      }
    } catch (err) {
      console.error('Error adding keys:', err);
      alert('Lỗi kết nối máy chủ!');
    }
  };

  const handleEditKey = async (key: KeyStock) => {
    const newStr = prompt('Nhập nội dung key mới:', key.keyString);
    if (newStr === null || !newStr.trim()) return;

    try {
      const response = await fetch('/api/admin/keys/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyId: key.id,
          newKeyString: newStr.trim(),
          adminUsername: currentUser?.username
        })
      });

      if (response.ok) {
        const data = await response.json();
        db.markWriteCompleted();
        db.updateLocalDb(data.db);
        onRefreshDatabase();
      } else {
        const errData = await response.json();
        alert(errData.error || 'Sửa key thất bại!');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ!');
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa key này khỏi kho server không?')) return;

    try {
      const response = await fetch('/api/admin/keys/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyId,
          adminUsername: currentUser?.username
        })
      });

      if (response.ok) {
        const data = await response.json();
        db.markWriteCompleted();
        db.updateLocalDb(data.db);
        onRefreshDatabase();
      } else {
        const errData = await response.json();
        alert(errData.error || 'Xóa key thất bại!');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ!');
    }
  };

  const handleClearUnsoldKeys = async (productId: string) => {
    const prod = products.find(p => p.id === productId);
    const prodName = prod ? prod.name : productId;
    if (!confirm(`Bạn có chắc chắn muốn XÓA TẤT CẢ KEY CHƯA BÁN của sản phẩm "${prodName}" trên server không?`)) return;

    try {
      const response = await fetch('/api/admin/keys/clear-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          adminUsername: currentUser?.username
        })
      });

      if (response.ok) {
        const data = await response.json();
        db.markWriteCompleted();
        db.updateLocalDb(data.db);
        alert(data.message || 'Đã dọn dẹp kho key chưa bán thành công!');
        onRefreshDatabase();
      } else {
        const errData = await response.json();
        alert(errData.error || 'Xóa kho key thất bại!');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ!');
    }
  };

  // --- DEPOSIT APPROVAL ---
  const handleApproveDeposit = async (request: DepositRequest) => {
    try {
      const response = await fetch('/api/admin/approve-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ depositId: request.id }),
      });

      if (!response.ok) {
        const errData = await response.json();
        alert(errData.error || 'Duyệt nạp tiền thất bại!');
        return;
      }

      const data = await response.json();
      if (data.success) {
        db.markWriteCompleted();
        db.updateLocalDb(data.db);
        
        onRefreshDatabase();
        setProducts(db.getProducts());
        setDeposits(db.getDepositRequests());
        setUsers(db.getUsers());

        // Update current session if approved user is ourselves
        const currentLoggedUser = db.getCurrentUser();
        if (currentLoggedUser && (currentLoggedUser.id === request.userId || currentLoggedUser.username === request.username)) {
          const match = db.getUsers().find(u => u.id === currentLoggedUser.id);
          if (match) db.setCurrentUser(match);
        }
      }
    } catch (err) {
      console.error('Error approving deposit:', err);
      alert('Đã xảy ra lỗi kết nối với máy chủ!');
    }
  };

  const handleRejectDeposit = async (request: DepositRequest) => {
    try {
      const response = await fetch('/api/admin/reject-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ depositId: request.id }),
      });

      if (!response.ok) {
        const errData = await response.json();
        alert(errData.error || 'Từ chối nạp tiền thất bại!');
        return;
      }

      const data = await response.json();
      if (data.success) {
        db.markWriteCompleted();
        db.updateLocalDb(data.db);
        
        onRefreshDatabase();
        setProducts(db.getProducts());
        setDeposits(db.getDepositRequests());
        setUsers(db.getUsers());
      }
    } catch (err) {
      console.error('Error rejecting deposit:', err);
      alert('Đã xảy ra lỗi kết nối với máy chủ!');
    }
  };

  // --- USER CONTROLS ---
  const handleToggleBlockUser = async (user: User) => {
    if (user.role === 'admin') {
      alert('Không thể khóa tài khoản Admin tối cao!');
      return;
    }

    try {
      const response = await fetch('/api/admin/toggle-block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const errData = await response.json();
        alert(errData.error || 'Thao tác khóa/mở khóa thất bại!');
        return;
      }

      const data = await response.json();
      if (data.success) {
        db.markWriteCompleted();
        db.updateLocalDb(data.db);
        
        onRefreshDatabase();
        setProducts(db.getProducts());
        setDeposits(db.getDepositRequests());
        setUsers(db.getUsers());
      }
    } catch (err) {
      console.error('Error toggling block user:', err);
      alert('Đã xảy ra lỗi kết nối với máy chủ!');
    }
  };

  const handleChangeUserBalance = async (user: User) => {
    const newBalStr = prompt(`Nhập số dư mới cho tài khoản ${user.username}:`, user.balance.toString());
    if (newBalStr === null) return;

    const newBal = Number(newBalStr);
    if (isNaN(newBal) || newBal < 0) {
      alert('Số tiền nhập vào không hợp lệ!');
      return;
    }

    const currentLoggedUser = db.getCurrentUser();
    const adminUsername = currentLoggedUser ? currentLoggedUser.username : 'admin';

    try {
      const response = await fetch('/api/admin/change-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          newBalance: newBal,
          adminUsername
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        alert(errData.error || 'Thay đổi số dư thất bại!');
        return;
      }

      const data = await response.json();
      if (data.success) {
        db.markWriteCompleted();
        db.updateLocalDb(data.db);
        
        onRefreshDatabase();
        setProducts(db.getProducts());
        setDeposits(db.getDepositRequests());
        setUsers(db.getUsers());

        // Update current session if edit self
        if (currentLoggedUser && currentLoggedUser.id === user.id) {
          const match = db.getUsers().find(u => u.id === currentLoggedUser.id);
          if (match) db.setCurrentUser(match);
        }
      }
    } catch (err) {
      console.error('Error changing balance:', err);
      alert('Đã xảy ra lỗi kết nối với máy chủ!');
    }
  };

  // --- SETTINGS UPDATE ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber || !accountHolder) {
      alert('Vui lòng điền đủ thông tin chuyển khoản!');
      return;
    }
    if (qrType === 'vietqr' && !vietqrBankId) {
      alert('Vui lòng điền mã VietQR Bank ID!');
      return;
    }
    if (qrType === 'custom' && !customQrUrl) {
      alert('Vui lòng tải hoặc chọn ảnh QR chuyển khoản từ thiết bị!');
      return;
    }

    const updatedSettings: AdminSettings = {
      bankName,
      accountNumber,
      accountHolder,
      description: adminSettings.description,
      qrType,
      vietqrBankId,
      customQrUrl,
    };

    try {
      const res = await fetch('/api/admin/settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: updatedSettings,
          adminUsername: currentUser?.username
        })
      });
      const data = await res.json();
      if (data.success && data.db) {
        db.updateLocalDb(data.db);
        setAdminSettings(updatedSettings);
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 2000);
        syncDatabase();
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi lưu cấu hình ngân hàng lên máy chủ!');
    }
  };

  // Helper counters
  const keysStock = db.getKeys();
  const getInStockCount = (productId: string) => {
    return keysStock.filter(k => k.productId === productId && !k.isSold).length;
  };

  const formatVND = (value: number) => {
    return value.toLocaleString('vi-VN') + ' VNĐ';
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchUser.toLowerCase().trim())
  );

  return (
    <div className="space-y-8" id="admin-panel-root">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-pink-500/10 text-pink-400 rounded-2xl border border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.15)] animate-pulse">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">CỔNG QUẢN TRỊ ADMIN</h2>
            <p className="text-xs text-zinc-500">Quản trị toàn diện sản phẩm, duyệt nạp tiền và cài đặt hệ thống.</p>
          </div>
        </div>

        {/* Inner Tab Toggles */}
        <div className="flex gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800/80" id="admin-subtabs">
          <button
            onClick={() => setSubTab('deposits')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              subTab === 'deposits' ? 'bg-pink-600 text-white shadow-sm' : 'text-zinc-500 hover:text-white'
            }`}
          >
            Duyệt Nạp Tiền
          </button>
          
          <button
            onClick={() => setSubTab('products')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              subTab === 'products' ? 'bg-pink-600 text-white shadow-sm' : 'text-zinc-500 hover:text-white'
            }`}
          >
            Sản Phẩm & Kho Key
          </button>

          <button
            onClick={() => setSubTab('users')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              subTab === 'users' ? 'bg-pink-600 text-white shadow-sm' : 'text-zinc-500 hover:text-white'
            }`}
          >
            Tài Khoản
          </button>

          <button
            onClick={() => setSubTab('settings')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              subTab === 'settings' ? 'bg-pink-600 text-white shadow-sm' : 'text-zinc-500 hover:text-white'
            }`}
          >
            Cài Đặt
          </button>

          <button
            onClick={() => setSubTab('luckywheel')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              subTab === 'luckywheel' ? 'bg-pink-600 text-white shadow-sm' : 'text-zinc-500 hover:text-white'
            }`}
          >
            Cấu hình Vòng Quay
          </button>
        </div>
      </div>

      {/* --- DEPOSIT APPROVAL VIEW --- */}
      {subTab === 'deposits' && (
        <div className="space-y-6" id="admin-deposits-tab">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
              <Coins className="w-5 h-5 text-pink-400" />
              Danh Sách Lệnh Nạp Chờ Phê Duyệt
            </h3>

            {deposits.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-sm">
                Không có lệnh nạp tiền nào trên hệ thống.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider">
                      <th className="py-3 px-4 font-bold">Mã số nạp</th>
                      <th className="py-3 px-4 font-bold">Khách hàng</th>
                      <th className="py-3 px-4 font-bold">Thời gian</th>
                      <th className="py-3 px-4 font-bold">Số tiền nạp</th>
                      <th className="py-3 px-4 font-bold text-center">Trạng thái</th>
                      <th className="py-3 px-4 font-bold text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-zinc-300">
                    {deposits.map((req) => (
                      <tr key={req.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{req.code}</td>
                        <td className="py-3.5 px-4 text-pink-400 font-semibold">{req.username}</td>
                        <td className="py-3.5 px-4 text-zinc-400">{new Date(req.createdAt).toLocaleString('vi-VN')}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-400">{formatVND(req.amount)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            req.status === 'approved'
                              ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-400'
                              : req.status === 'rejected'
                              ? 'bg-red-950/40 border border-red-500/40 text-red-400'
                              : 'bg-amber-950/40 border border-amber-500/40 text-amber-400 animate-pulse'
                          }`}>
                            {req.status === 'approved' ? 'Đã duyệt' : req.status === 'rejected' ? 'Đã từ chối' : 'Đang chờ'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {req.status === 'pending' ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveDeposit(req)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                title="Phê duyệt lệnh và cộng tiền"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Duyệt nạp
                              </button>
                              
                              <button
                                onClick={() => handleRejectDeposit(req)}
                                className="px-2.5 py-1.5 bg-zinc-800 hover:bg-red-950 border border-zinc-700 hover:border-red-500/40 text-zinc-400 hover:text-red-400 font-bold rounded-lg transition-all cursor-pointer"
                                title="Từ chối lệnh nạp"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-zinc-600 text-[10px]">Đã xử lý</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- PRODUCTS & KEY STOCK VIEW --- */}
      {subTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="admin-products-tab">
          
          {/* Left: Product List / Edit Form */}
          <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <h3 className="font-bold text-white text-base border-b border-zinc-800 pb-3 flex items-center justify-between">
              <span>Danh Sách Sản Phẩm</span>
              <span className="text-xs text-zinc-500">Tổng cộng {products.length} sản phẩm</span>
            </h3>

            {/* Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-mono">
                    <th className="py-3 px-3">Tên dịch vụ</th>
                    <th className="py-3 px-3">Loại</th>
                    <th className="py-3 px-3">Hạn</th>
                    <th className="py-3 px-3">Giá bán</th>
                    <th className="py-3 px-3 text-center">Tồn kho</th>
                    <th className="py-3 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-zinc-300">
                  {products.map((prod) => {
                    const stock = getInStockCount(prod.id);
                    return (
                      <tr key={prod.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3 px-3 font-bold text-white">{prod.name}</td>
                        <td className="py-3 px-3 uppercase text-[10px] font-mono">
                          <span className={`px-2 py-0.5 rounded ${prod.category === 'proxy' ? 'bg-pink-950/40 text-pink-400 border border-pink-500/20' : 'bg-zinc-950/40 text-zinc-400 border border-zinc-800'}`}>
                            {prod.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-zinc-400">{prod.duration}</td>
                        <td className="py-3 px-3 font-extrabold text-pink-400">{formatVND(prod.price)}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${stock > 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' : 'bg-red-950 text-red-400 border border-red-500/20'}`}>
                            {stock} key
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleEditProductClick(prod)}
                              className="p-1.5 text-zinc-400 hover:text-pink-400 hover:bg-zinc-800 rounded transition-colors"
                              title="Chỉnh sửa sản phẩm"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                              title="Xóa sản phẩm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Product Create/Edit Form */}
            <form onSubmit={handleSaveProduct} className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-4">
              <h4 className="font-bold text-sm text-pink-400 uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4" />
                {editingProduct ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Tên sản phẩm</label>
                  <input
                    type="text"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="Ví dụ: Key Proxy Full Aim 1 Ngày"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Hạn dùng</label>
                  <input
                    type="text"
                    value={prodDuration}
                    onChange={(e) => setProdDuration(e.target.value)}
                    placeholder="Ví dụ: 1 Ngày, 1 Tuần, Vĩnh Viễn"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Đơn giá (VNĐ)</label>
                  <input
                    type="number"
                    value={prodPrice || ''}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    placeholder="Ví dụ: 10000"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Danh mục</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value as 'proxy' | 'migul')}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="proxy">Key Proxy</option>
                    <option value="migul">Key Migul</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {editingProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setProdName('');
                      setProdPrice(0);
                      setProdDuration('');
                    }}
                    className="px-4 py-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Hủy sửa
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  {editingProduct ? 'Lưu Thay Đổi' : 'Tạo Sản Phẩm'}
                </button>
              </div>
            </form>

          </div>

          {/* Right: Bulk Key Upload Tool */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-5">
              <h3 className="font-bold text-white text-base border-b border-zinc-800 pb-3 flex items-center gap-2">
                <Key className="w-5 h-5 text-pink-400" />
                Nạp Sỉ Key Vào Kho
              </h3>

              {keyUploadSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 text-emerald-400 text-xs rounded-lg">
                  {keyUploadSuccess}
                </div>
              )}

              <form onSubmit={handleBulkKeyUpload} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Chọn sản phẩm nhận key</label>
                  <select
                    value={bulkProductSelect}
                    onChange={(e) => setBulkProductSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="">-- Vui lòng chọn sản phẩm --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.duration})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase flex justify-between">
                    <span>Danh sách key sỉ</span>
                    <span className="text-[9px] text-pink-500 font-bold uppercase">Mỗi key một dòng</span>
                  </label>
                  <textarea
                    rows={6}
                    value={bulkKeysText}
                    onChange={(e) => setBulkKeysText(e.target.value)}
                    placeholder="HOANGHIEP-KEY-ABC1&#10;HOANGHIEP-KEY-ABC2&#10;HOANGHIEP-KEY-ABC3"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-pink-500 placeholder:text-zinc-700"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_10px_rgba(219,39,119,0.3)] cursor-pointer"
                >
                  NẠP KEY VÀO KHO TỰ ĐỘNG
                </button>
              </form>

              {/* Informative Stats */}
              <div className="p-3 bg-zinc-950/50 border border-zinc-800/60 rounded-xl space-y-1.5 text-[11px] text-zinc-400 leading-relaxed font-mono">
                <p className="font-bold text-zinc-300">Tình trạng kho key hiện tại:</p>
                {products.map(p => (
                  <div key={p.id} className="flex justify-between border-b border-zinc-900 pb-0.5">
                    <span className="text-zinc-500">{p.name}:</span>
                    <span className="font-bold text-white">{getInStockCount(p.id)} key còn lại</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Centralized Server Key Warehouse Management Table */}
          <div className="lg:col-span-12 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Database className="w-5 h-5 text-pink-400" />
                  Kho Key Tập Trung Phía Máy Chủ (Server Database Warehouse)
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Tất cả key được quản lý tập trung trực tiếp trên máy chủ. Hệ thống không tự tạo hoặc sinh ngẫu nhiên key.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Đồng Bộ Realtime (SSE Active)
                </span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Lọc theo sản phẩm</label>
                <select
                  value={keyFilterProduct}
                  onChange={(e) => setKeyFilterProduct(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="all">-- Tất cả sản phẩm ({db.getKeys().length} key) --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({getInStockCount(p.id)} còn trong kho)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Lọc trạng thái</label>
                <select
                  value={keyFilterStatus}
                  onChange={(e) => setKeyFilterStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="all">Tất cả key (Đã bán & Chưa bán)</option>
                  <option value="available">Khả dụng (Chưa bán)</option>
                  <option value="sold">Đã bán (Đã cấp cho khách)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Tìm kiếm nội dung Key / User</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={keySearchText}
                    onChange={(e) => setKeySearchText(e.target.value)}
                    placeholder="Mã key hoặc username..."
                    className="w-full pl-8 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="flex items-end">
                {keyFilterProduct !== 'all' && (
                  <button
                    type="button"
                    onClick={() => handleClearUnsoldKeys(keyFilterProduct)}
                    className="w-full py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa tất cả key chưa bán của SP này
                  </button>
                )}
              </div>
            </div>

            {/* Warehouse Keys Table */}
            <div className="overflow-x-auto border border-zinc-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3 font-bold w-12 text-center">STT</th>
                    <th className="py-2.5 px-3 font-bold">Mã Key (Key String)</th>
                    <th className="py-2.5 px-3 font-bold">Sản phẩm</th>
                    <th className="py-2.5 px-3 font-bold text-center">Trạng thái</th>
                    <th className="py-2.5 px-3 font-bold">Người nhận / Thời gian</th>
                    <th className="py-2.5 px-3 font-bold text-right">Quản trị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/30 text-zinc-300">
                  {(() => {
                    const allK = db.getKeys();
                    const filtered = allK.filter(k => {
                      if (keyFilterProduct !== 'all' && k.productId !== keyFilterProduct) return false;
                      if (keyFilterStatus === 'available' && k.isSold) return false;
                      if (keyFilterStatus === 'sold' && !k.isSold) return false;
                      if (keySearchText.trim()) {
                        const q = keySearchText.toLowerCase();
                        const p = products.find(prod => prod.id === k.productId);
                        const matchK = k.keyString.toLowerCase().includes(q);
                        const matchU = k.soldToUser ? k.soldToUser.toLowerCase().includes(q) : false;
                        const matchP = p ? p.name.toLowerCase().includes(q) : false;
                        return matchK || matchU || matchP;
                      }
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-zinc-500 italic">
                            Không tìm thấy key nào phù hợp với bộ lọc trong kho server.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((keyItem, index) => {
                      const prod = products.find(p => p.id === keyItem.productId);
                      return (
                        <tr key={keyItem.id} className="hover:bg-zinc-900/60 transition-colors">
                          <td className="py-2.5 px-3 text-center text-zinc-600 font-bold">{index + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-400 select-all font-mono">
                            {keyItem.keyString}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-300">
                            {prod ? prod.name : keyItem.productId}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {keyItem.isSold ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-pink-950/50 border border-pink-500/40 text-pink-400">
                                Đã cấp phát
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/50 border border-emerald-500/40 text-emerald-400">
                                Khả dụng
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                            {keyItem.isSold ? (
                              <div>
                                <span className="font-bold text-white">@{keyItem.soldToUser || 'Khách'}</span>
                                {keyItem.soldAt && (
                                  <span className="block text-[10px] text-zinc-500">
                                    {new Date(keyItem.soldAt).toLocaleString('vi-VN')}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-zinc-600 italic">Chưa bán</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditKey(keyItem)}
                                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors cursor-pointer"
                                title="Sửa nội dung Key"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteKey(keyItem.id)}
                                className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-lg transition-colors cursor-pointer border border-red-500/30"
                                title="Xóa Key khỏi kho"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* --- USERS MANAGEMENT VIEW --- */}
      {subTab === 'users' && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6" id="admin-users-tab">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-4">
            <h3 className="font-bold text-white text-base">Hệ Thống Quản Lý Tài Khoản Khách Hàng</h3>
            
            {/* Search filter */}
            <input
              type="text"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              placeholder="🔍 Tìm kiếm tài khoản..."
              className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500 w-full sm:w-60 font-medium"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-4 font-bold">Mã ID</th>
                  <th className="py-3 px-4 font-bold">Tài khoản</th>
                  <th className="py-3 px-4 font-bold">Ngày đăng ký</th>
                  <th className="py-3 px-4 font-bold">Số dư hiện tại</th>
                  <th className="py-3 px-4 font-bold text-center">Trạng thái</th>
                  <th className="py-3 px-4 font-bold text-right">Điều khiển</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3 px-4 text-zinc-500">{user.id}</td>
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-1.5">
                      {user.username}
                      {user.role === 'admin' && (
                        <span className="text-[9px] bg-pink-600 text-white px-1 py-0.5 rounded font-bold uppercase">
                          ADMIN
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-400">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="py-3 px-4 font-extrabold text-pink-400">
                      <span className="flex items-center gap-1.5">
                        {formatVND(user.balance)}
                        <button
                          onClick={() => handleChangeUserBalance(user)}
                          className="p-1 bg-zinc-800 hover:bg-pink-900 rounded text-zinc-400 hover:text-white transition-colors"
                          title="Chỉnh sửa số dư thủ công"
                        >
                          <Coins className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${user.isBlocked ? 'bg-red-950/40 border border-red-500/40 text-red-400' : 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-400'}`}>
                        {user.isBlocked ? 'Đã bị khóa' : 'Hoạt động'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {user.role !== 'admin' ? (
                        <button
                          onClick={() => handleToggleBlockUser(user)}
                          className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 ${user.isBlocked ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white'}`}
                        >
                          {user.isBlocked ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Mở khóa</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-3.5 h-3.5" />
                              <span>Khóa nick</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-zinc-600 text-[10px]">Tối cao</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SYSTEM CONFIG SETTINGS VIEW --- */}
      {subTab === 'settings' && (
        <div className="max-w-2xl bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6" id="admin-settings-tab">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4 mb-5">
            <div className="p-2.5 bg-pink-500/10 text-pink-400 rounded-xl">
              <Settings className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Cấu Hình Ngân Hàng Nhận Nạp Tiền</h3>
              <p className="text-xs text-zinc-500">Mã QR nạp tiền của khách sẽ tự động cập nhật theo cài đặt này.</p>
            </div>
          </div>

          {settingsSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 text-emerald-400 text-xs rounded-lg mb-4">
              Cập nhật cấu hình cổng nạp tiền thành công!
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 font-mono text-xs">
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Tên ngân hàng & Chi nhánh</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Ví dụ: MBBank (MB)"
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Số tài khoản nhận</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Ví dụ: 190283749321"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Tên chủ tài khoản (In Hoa)</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Ví dụ: HOANG HUY HIEP"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-bold uppercase"
                />
              </div>
            </div>

            <div className="space-y-2 border-t border-zinc-800/60 pt-4">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Phương thức tạo mã QR</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${qrType === 'vietqr' ? 'bg-pink-500/10 border-pink-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                  <input
                    type="radio"
                    name="qrType"
                    value="vietqr"
                    checked={qrType === 'vietqr'}
                    onChange={() => setQrType('vietqr')}
                    className="accent-pink-500"
                  />
                  <div>
                    <p className="font-bold text-xs">Mã VietQR Tự động</p>
                    <p className="text-[10px] text-zinc-500 font-sans">Tự tạo QR chuyển khoản kèm số tiền</p>
                  </div>
                </label>

                <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${qrType === 'custom' ? 'bg-pink-500/10 border-pink-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                  <input
                    type="radio"
                    name="qrType"
                    value="custom"
                    checked={qrType === 'custom'}
                    onChange={() => setQrType('custom')}
                    className="accent-pink-500"
                  />
                  <div>
                    <p className="font-bold text-xs">Ảnh QR Tự chọn</p>
                    <p className="text-[10px] text-zinc-500 font-sans">Tải ảnh QR từ thiết bị / máy tính</p>
                  </div>
                </label>
              </div>
            </div>

            {qrType === 'vietqr' ? (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase flex justify-between">
                  <span>Mã VietQR Bank ID (Để tạo QR tự động)</span>
                  <span className="text-pink-500 text-[9px] lowercase font-sans">e.g. mb, vcb, icb, tcb, acb...</span>
                </label>
                <input
                  type="text"
                  value={vietqrBankId}
                  onChange={(e) => setVietqrBankId(e.target.value)}
                  placeholder="Ví dụ: MB"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-bold uppercase"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center justify-between">
                  <span>Tải ảnh QR từ thiết bị / máy tính</span>
                  <span className="text-pink-400 text-[10px] font-mono">Định dạng: PNG, JPG, WEBP (Max 5MB)</span>
                </label>

                <input
                  type="file"
                  id="qr-file-input"
                  accept="image/*"
                  onChange={handleQrImageUpload}
                  className="hidden"
                />

                {/* Upload Action Zone */}
                <div className="p-5 bg-zinc-950 border-2 border-dashed border-zinc-800 hover:border-pink-500/50 rounded-2xl transition-all text-center flex flex-col items-center justify-center gap-3 group">
                  {customQrUrl ? (
                    <div className="flex flex-col items-center gap-3 w-full">
                      <div className="relative group/img">
                        <img
                          src={customQrUrl}
                          alt="QR Code"
                          className="max-h-48 object-contain rounded-xl border-2 border-pink-500/40 bg-white p-2 shadow-[0_0_20px_rgba(236,72,153,0.15)]"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute -top-2 -right-2 bg-pink-600 text-white p-1 rounded-full text-xs shadow">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
                        <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                        <span>{qrFileName || 'Ảnh QR đã tải thành công'}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <label
                          htmlFor="qr-file-input"
                          className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-pink-400 border border-pink-500/30 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Chọn ảnh khác từ thiết bị
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            setCustomQrUrl('');
                            setQrFileName('');
                          }}
                          className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-500/30 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Xóa ảnh
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="qr-file-input"
                      className="flex flex-col items-center gap-2 cursor-pointer w-full py-4"
                    >
                      <div className="p-3.5 bg-pink-500/10 border border-pink-500/30 text-pink-400 rounded-2xl group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(236,72,153,0.2)]">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-white group-hover:text-pink-400 transition-colors block">
                          TẢI ẢNH QR TỪ THIẾT BỊ
                        </span>
                        <span className="text-[10px] text-zinc-500 font-sans block">
                          Nhấp vào đây để chọn tệp ảnh mã QR chuyển khoản lưu trong máy tính hoặc điện thoại
                        </span>
                      </div>
                    </label>
                  )}
                </div>

                {/* Secondary optional URL mode toggle */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 font-sans underline cursor-pointer"
                  >
                    {showUrlInput ? 'Ẩn ô nhập link URL' : 'Hoặc dán trực tiếp đường dẫn link ảnh URL (Nâng cao)'}
                  </button>

                  {showUrlInput && (
                    <div className="mt-2 space-y-1">
                      <input
                        type="text"
                        value={customQrUrl}
                        onChange={(e) => setCustomQrUrl(e.target.value)}
                        placeholder="https://example.com/qr-code.png"
                        className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl transition-all shadow-[0_0_12px_rgba(219,39,119,0.3)] cursor-pointer"
              >
                CẬP NHẬT CẤU HÌNH NHẬN TIỀN
              </button>
            </div>

          </form>

          {/* Quick Info on Bank IDs */}
          <div className="mt-6 p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl space-y-2 text-xs text-zinc-500">
            <span className="font-bold text-zinc-300 flex items-center gap-1">
              <Landmark className="w-4 h-4 text-pink-500" /> Hướng dẫn VietQR Bank ID:
            </span>
            <p>Để tạo mã QR tự động chính xác cho ngân hàng Việt Nam, hãy điền đúng mã định danh (Ví dụ: <code className="text-pink-400">MB</code> - MBBank, <code className="text-pink-400">VCB</code> - Vietcombank, <code className="text-pink-400">ICB</code> - VietinBank, <code className="text-pink-400">TCB</code> - Techcombank, <code className="text-pink-400">BIDV</code> - BIDV, <code className="text-pink-400">ACB</code> - ACB).</p>
          </div>

        </div>
      )}

      {/* --- LUCKY WHEEL MANAGEMENT VIEW --- */}
      {subTab === 'luckywheel' && (
        <div className="space-y-6" id="admin-luckywheel-tab">
          
          {luckySuccessMsg && (
            <div className="p-4 bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl font-bold flex items-center gap-2 animate-bounce">
              <Check className="w-4 h-4" />
              <span>{luckySuccessMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* GENERAL WHEEL CONFIGURATION */}
            <div className="lg:col-span-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                <div className="p-2.5 bg-pink-500/10 text-pink-400 rounded-xl">
                  <Dices className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Cấu Hình Chung Vòng Quay</h3>
                  <p className="text-[11px] text-zinc-500">Thiết lập giá, trạng thái hoạt động và quy tắc máy chủ</p>
                </div>
              </div>

              <form onSubmit={handleSaveWheelSettings} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Giá mỗi lượt quay (VNĐ)</label>
                  <input
                    type="number"
                    value={wheelPrice}
                    onChange={(e) => setWheelPrice(Number(e.target.value))}
                    min={0}
                    step={1000}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-pink-400 font-extrabold font-mono"
                  />
                  <p className="text-[10px] text-zinc-500">* Mặc định: 10.000 VNĐ / lượt quay.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Trạng thái vòng quay</label>
                  <div className="flex gap-3 pt-1">
                    <label className={`flex-1 p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-center gap-2 ${wheelActive ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400 font-extrabold' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}>
                      <input
                        type="radio"
                        name="wheelActive"
                        checked={wheelActive}
                        onChange={() => setWheelActive(true)}
                        className="sr-only"
                      />
                      <Sparkles className="w-4 h-4" />
                      <span>ĐANG MỞ</span>
                    </label>

                    <label className={`flex-1 p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-center gap-2 ${!wheelActive ? 'bg-red-950/40 border-red-500 text-red-400 font-extrabold' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}>
                      <input
                        type="radio"
                        name="wheelActive"
                        checked={!wheelActive}
                        onChange={() => setWheelActive(false)}
                        className="sr-only"
                      />
                      <Ban className="w-4 h-4" />
                      <span>TẠM DỪNG</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Xử lý khi trúng ô đã hết Key trong kho</label>
                  <select
                    value={wheelBehavior}
                    onChange={(e: any) => setWheelBehavior(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold"
                  >
                    <option value="reroll">Tự động chọn phần thưởng khác còn key (Khuyên dùng)</option>
                    <option value="refund">Tự động hoàn trả 100% tiền lượt quay</option>
                    <option value="empty_no_key">Thông báo hết key (Không hoàn tiền)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-extrabold rounded-xl transition-all shadow-[0_0_12px_rgba(219,39,119,0.3)] cursor-pointer text-xs uppercase"
                >
                  LƯU CẤU HÌNH CHUNG
                </button>
              </form>
            </div>

            {/* REWARDS & KEY STOCK MANAGEMENT */}
            <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-pink-500/10 text-pink-400 rounded-xl">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Quản Lý Tỷ Lệ Trúng & Kho Key</h3>
                    <p className="text-[11px] text-zinc-500">Cấu hình 3 loại phần thưởng key proxy</p>
                  </div>
                </div>

                {/* Total probability gauge */}
                {(() => {
                  const total = luckyRewards.reduce((sum, r) => sum + Number(r.probability || 0), 0);
                  return (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold font-mono border ${total === 100 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                      TỔNG TỶ LỆ: {total}%
                    </span>
                  );
                })()}
              </div>

              {/* 3 REWARD SECTORS */}
              <div className="space-y-4">
                
                {/* 1. KEY PROXY 1 DAY */}
                {rewardDay && (
                  <div className="bg-zinc-950/70 border border-zinc-800/80 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-pink-400 text-xs uppercase flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                        Ô 1: {rewardDay.name}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                        Còn {rewardDay.keys ? rewardDay.keys.length : 0} key trong kho
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] text-zinc-400 font-bold">Tên hiển thị phần thưởng:</label>
                        <input
                          type="text"
                          value={rewardDay.name}
                          onChange={(e) => setRewardDay({ ...rewardDay, name: e.target.value })}
                          className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-bold mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 font-bold">Tỷ lệ trúng (%):</label>
                        <input
                          type="number"
                          value={rewardDay.probability}
                          onChange={(e) => setRewardDay({ ...rewardDay, probability: Number(e.target.value) })}
                          min={0}
                          max={100}
                          className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-pink-400 font-extrabold font-mono mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold block mb-1">Thêm hàng loạt Key vào kho Ô 1 (Mỗi dòng 1 key):</label>
                      <textarea
                        value={bulkDayText}
                        onChange={(e) => setBulkDayText(e.target.value)}
                        placeholder="Dán mã key tại đây...&#10;SPIN-1D-PROXY-KEY01&#10;SPIN-1D-PROXY-KEY02"
                        rows={2}
                        className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-pink-500"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateReward('reward_day', rewardDay.name, rewardDay.probability, bulkDayText, true)}
                        className="px-2.5 py-1 bg-red-950/40 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Xóa toàn bộ key cũ Ô 1
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateReward('reward_day', rewardDay.name, rewardDay.probability, bulkDayText)}
                        className="px-4 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-extrabold transition-all cursor-pointer shadow-sm"
                      >
                        LƯU CẤU HÌNH Ô 1
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. KEY PROXY 1 WEEK */}
                {rewardWeek && (
                  <div className="bg-zinc-950/70 border border-zinc-800/80 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-blue-400 text-xs uppercase flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Ô 2: {rewardWeek.name}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                        Còn {rewardWeek.keys ? rewardWeek.keys.length : 0} key trong kho
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] text-zinc-400 font-bold">Tên hiển thị phần thưởng:</label>
                        <input
                          type="text"
                          value={rewardWeek.name}
                          onChange={(e) => setRewardWeek({ ...rewardWeek, name: e.target.value })}
                          className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-bold mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 font-bold">Tỷ lệ trúng (%):</label>
                        <input
                          type="number"
                          value={rewardWeek.probability}
                          onChange={(e) => setRewardWeek({ ...rewardWeek, probability: Number(e.target.value) })}
                          min={0}
                          max={100}
                          className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-pink-400 font-extrabold font-mono mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold block mb-1">Thêm hàng loạt Key vào kho Ô 2 (Mỗi dòng 1 key):</label>
                      <textarea
                        value={bulkWeekText}
                        onChange={(e) => setBulkWeekText(e.target.value)}
                        placeholder="Dán mã key tại đây...&#10;SPIN-1W-PROXY-KEY01&#10;SPIN-1W-PROXY-KEY02"
                        rows={2}
                        className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-pink-500"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateReward('reward_week', rewardWeek.name, rewardWeek.probability, bulkWeekText, true)}
                        className="px-2.5 py-1 bg-red-950/40 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Xóa toàn bộ key cũ Ô 2
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateReward('reward_week', rewardWeek.name, rewardWeek.probability, bulkWeekText)}
                        className="px-4 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-extrabold transition-all cursor-pointer shadow-sm"
                      >
                        LƯU CẤU HÌNH Ô 2
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. KEY PROXY 1 MONTH */}
                {rewardMonth && (
                  <div className="bg-zinc-950/70 border border-zinc-800/80 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-amber-400 text-xs uppercase flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Ô 3: {rewardMonth.name}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                        Còn {rewardMonth.keys ? rewardMonth.keys.length : 0} key trong kho
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] text-zinc-400 font-bold">Tên hiển thị phần thưởng:</label>
                        <input
                          type="text"
                          value={rewardMonth.name}
                          onChange={(e) => setRewardMonth({ ...rewardMonth, name: e.target.value })}
                          className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-bold mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 font-bold">Tỷ lệ trúng (%):</label>
                        <input
                          type="number"
                          value={rewardMonth.probability}
                          onChange={(e) => setRewardMonth({ ...rewardMonth, probability: Number(e.target.value) })}
                          min={0}
                          max={100}
                          className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-pink-400 font-extrabold font-mono mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold block mb-1">Thêm hàng loạt Key vào kho Ô 3 (Mỗi dòng 1 key):</label>
                      <textarea
                        value={bulkMonthText}
                        onChange={(e) => setBulkMonthText(e.target.value)}
                        placeholder="Dán mã key tại đây...&#10;SPIN-1M-PROXY-KEY01&#10;SPIN-1M-PROXY-KEY02"
                        rows={2}
                        className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-pink-500"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateReward('reward_month', rewardMonth.name, rewardMonth.probability, bulkMonthText, true)}
                        className="px-2.5 py-1 bg-red-950/40 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Xóa toàn bộ key cũ Ô 3
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateReward('reward_month', rewardMonth.name, rewardMonth.probability, bulkMonthText)}
                        className="px-4 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-extrabold transition-all cursor-pointer shadow-sm"
                      >
                        LƯU CẤU HÌNH Ô 3
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* SPIN AUDIT LOGS TABLE */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-pink-500" />
                Lịch Sử Nhật Ký Lượt Quay Khách Hàng (Thời Gian Thực)
              </h3>
              <span className="text-[10px] font-mono text-zinc-500">Tổng: {luckySpinLogs.length} lượt quay</span>
            </div>

            {luckySpinLogs.length === 0 ? (
              <p className="text-zinc-500 text-xs py-4 text-center">Chưa có nhật ký quay nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Thời gian</th>
                      <th className="py-2.5 px-3">Tài khoản</th>
                      <th className="py-2.5 px-3">Phần thưởng</th>
                      <th className="py-2.5 px-3">Mã Key đã cấp</th>
                      <th className="py-2.5 px-3 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-zinc-300 text-[11px]">
                    {luckySpinLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-900/40">
                        <td className="py-2.5 px-3 text-zinc-500">
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white">@{log.username}</td>
                        <td className="py-2.5 px-3 font-extrabold text-pink-400">{log.rewardName}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">{log.keyString}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            log.status === 'success' ? 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-400' : 'bg-red-950/40 border border-red-500/20 text-red-400'
                          }`}>
                            {log.status === 'success' ? 'Thành công' : 'Không thành công'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
