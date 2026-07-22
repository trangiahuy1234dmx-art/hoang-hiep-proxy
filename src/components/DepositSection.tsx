import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Copy, Check, QrCode, AlertTriangle, History, ArrowRight } from 'lucide-react';
import { db } from '../dbMock';
import { User, DepositRequest, AdminSettings } from '../types';

interface DepositSectionProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onRefreshUser: () => void;
  dbTick?: number;
}

const PRESET_AMOUNTS = [20000, 50000, 100000, 200000, 500000];

export default function DepositSection({ currentUser, onOpenAuth, onRefreshUser, dbTick }: DepositSectionProps) {
  const [amount, setAmount] = useState<number | ''>('');
  const [customAmount, setCustomAmount] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<DepositRequest | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const adminSettings: AdminSettings = db.getAdminSettings();

  // Handle preset click
  const handleSelectPreset = (val: number) => {
    setAmount(val);
    setCustomAmount('');
  };

  // Handle custom input
  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomAmount(val);
    if (val) {
      setAmount(Number(val));
    } else {
      setAmount('');
    }
  };

  // Copy helper
  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1500);
  };

  // Create deposit order
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const finalAmount = Number(amount);
    if (!finalAmount || finalAmount < 10000) {
      alert('Số tiền nạp tối thiểu là 10.000 VNĐ!');
      return;
    }

    const code = 'HH' + Math.floor(10000 + Math.random() * 90000); // Unique HH12345 transfer code

    try {
      const res = await fetch('/api/deposit/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          username: currentUser.username,
          amount: finalAmount,
          code: code
        })
      });
      const data = await res.json();
      if (data.success && data.db) {
        db.updateLocalDb(data.db);
        setActiveRequest(data.deposit);
        setSuccessMsg('Đã tạo lệnh nạp tiền! Vui lòng chuyển khoản đúng số tiền và nội dung dưới đây.');
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi gửi yêu cầu nạp tiền lên máy chủ!');
    }
    
    // Auto clear alert
    setTimeout(() => {
      setSuccessMsg('');
    }, 5000);
  };

  // Format currency
  const formatVND = (value: number) => {
    return value.toLocaleString('vi-VN') + ' VNĐ';
  };

  // User's history
  const allRequests = db.getDepositRequests();
  const userRequests = currentUser 
    ? allRequests.filter(r => r.userId === currentUser.id)
    : [];

  // Generate real QR code link using VietQR API or return Custom QR URL configured by Admin
  const getQRUrl = (req: DepositRequest) => {
    if (adminSettings.qrType === 'custom' && adminSettings.customQrUrl) {
      return adminSettings.customQrUrl;
    }
    const bankId = adminSettings.vietqrBankId || 'MB';
    const accountNo = adminSettings.accountNumber;
    const holder = encodeURIComponent(adminSettings.accountHolder);
    const description = encodeURIComponent(`Nạp tiền tài khoản ${req.username} - Mã ${req.code}`);
    return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${req.amount}&addInfo=${description}&accountName=${holder}`;
  };

  return (
    <div className="space-y-8" id="deposit-section-root">
      
      {/* Intro Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
          HỆ THỐNG <span className="text-pink-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]">NẠP TIỀN TỰ ĐỘNG</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Chuyển khoản chính xác theo thông tin tài khoản bên dưới kèm mã nạp, hệ thống sẽ tự động phê duyệt trong vòng 1-3 phút.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Create request form */}
        <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-6" id="deposit-creator">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <div className="p-2.5 bg-pink-500/10 text-pink-400 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Tạo Lệnh Nạp Tiền</h3>
              <p className="text-xs text-zinc-500">Lựa chọn số tiền bạn muốn cộng vào tài khoản</p>
            </div>
          </div>

          {!currentUser ? (
            <div className="p-6 text-center space-y-4">
              <p className="text-sm text-zinc-400">Vui lòng đăng ký hoặc đăng nhập tài khoản để có thể nạp tiền và thực hiện mua sắm.</p>
              <button
                onClick={onOpenAuth}
                className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(219,39,119,0.3)]"
              >
                ĐĂNG NHẬP / ĐĂNG KÝ
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateRequest} className="space-y-6">
              
              {/* Presets Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Chọn mệnh giá nhanh
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" id="preset-grid">
                  {PRESET_AMOUNTS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSelectPreset(val)}
                      className={`py-2 px-1 text-xs font-extrabold rounded-lg transition-all border cursor-pointer ${
                        amount === val && !customAmount
                          ? 'bg-pink-500/20 text-pink-400 border-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.2)]'
                          : 'bg-zinc-950/80 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {val / 1000}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Hoặc tự nhập số tiền cần nạp
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customAmount}
                    onChange={handleCustomChange}
                    placeholder="Ví dụ: 150000"
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 text-sm font-bold"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-pink-500">
                    VNĐ
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500">Mức nạp tối thiểu là 10.000 VNĐ. Nhập chữ số không kèm dấu chấm, dấu phẩy.</p>
              </div>

              {/* Confirmation Button */}
              <button
                type="submit"
                disabled={!amount}
                className={`w-full py-3.5 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  amount
                    ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_15px_rgba(219,39,119,0.3)] active:scale-98'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
                id="create-deposit-btn"
              >
                {amount ? `TẠO YÊU CẦU NẠP ${formatVND(Number(amount))}` : 'VUI LÒNG CHỌN SỐ TIỀN'}
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>
          )}

          {/* Quick Notice */}
          <div className="p-4 bg-zinc-950/50 border border-zinc-800/80 rounded-xl space-y-2 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-zinc-400 space-y-1">
              <p className="font-bold text-zinc-300">Lưu ý quan trọng:</p>
              <p>1. Luôn ghi chính xác nội dung chuyển khoản gồm mã số nạp để tránh thất lạc.</p>
              <p>2. Chụp ảnh biên lai giao dịch thành công để làm bằng chứng khi cần thiết.</p>
              <p className="text-pink-400 font-semibold">💡 Vì đây là môi trường thử nghiệm (Demo), sau khi tạo lệnh nạp, bạn có thể click vào tab "Hệ Thống Admin" để bấm duyệt tiền ngay lập tức mà không cần chuyển khoản thật!</p>
            </div>
          </div>

        </div>

        {/* Right Side: QR Code & Bank details for active/selected request */}
        <div className="lg:col-span-5 space-y-6" id="deposit-payment-details">
          {activeRequest ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/60 border-2 border-pink-500/40 rounded-2xl p-6 text-center space-y-5 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
              id="active-payment-container"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-xs font-bold text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-lg">
                  LỆNH NẠP ĐANG CHỜ PHÊ DUYỆT
                </span>
                <span className="text-xs font-mono text-zinc-500">Mã: {activeRequest.code}</span>
              </div>

              {/* QR Image */}
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="p-3 bg-white rounded-2xl shadow-lg border border-zinc-200 w-48 h-48 flex items-center justify-center relative overflow-hidden group">
                  <img
                    src={getQRUrl(activeRequest)}
                    alt="VietQR Chuyển Khoản Admin"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                    id="vietqr-image"
                  />
                </div>
                <span className="text-[10px] text-zinc-500 font-medium">Sử dụng ứng dụng Ngân hàng/Ví điện tử để quét mã</span>
              </div>

              {/* Bank Details Table */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 text-left space-y-3 font-mono text-xs">
                
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Ngân hàng:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold">{adminSettings.bankName}</span>
                    <button
                      onClick={() => handleCopyText(adminSettings.bankName, 'bank')}
                      className="text-zinc-400 hover:text-pink-500 transition-colors"
                    >
                      {copiedField === 'bank' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Số tài khoản:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold text-sm tracking-wider">{adminSettings.accountNumber}</span>
                    <button
                      onClick={() => handleCopyText(adminSettings.accountNumber, 'acc')}
                      className="text-zinc-400 hover:text-pink-500 transition-colors"
                    >
                      {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Chủ tài khoản:</span>
                  <span className="text-white font-bold uppercase">{adminSettings.accountHolder}</span>
                </div>

                <div className="h-px bg-zinc-800/60 my-2"></div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Số tiền chuyển:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-pink-400 font-extrabold text-sm">{formatVND(activeRequest.amount)}</span>
                    <button
                      onClick={() => handleCopyText(activeRequest.amount.toString(), 'amt')}
                      className="text-zinc-400 hover:text-pink-500 transition-colors"
                    >
                      {copiedField === 'amt' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 bg-pink-950/20 border border-pink-500/20 rounded-lg p-2.5 mt-2">
                  <div className="flex items-center justify-between text-[11px] text-pink-400 font-bold uppercase tracking-wide">
                    <span>Nội dung chuyển khoản:</span>
                    <button
                      onClick={() => handleCopyText(`Nạp tiền tài khoản ${activeRequest.username} - Mã ${activeRequest.code}`, 'desc')}
                      className="text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-1"
                    >
                      {copiedField === 'desc' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                  <span className="text-white font-black text-xs break-all bg-zinc-950 p-1.5 rounded border border-zinc-800">
                    Nạp tiền tài khoản {activeRequest.username} - Mã {activeRequest.code}
                  </span>
                </div>

              </div>
              
              <p className="text-[11px] text-zinc-500">Vui lòng không tắt hoặc tải lại trang này cho đến khi giao dịch được xác nhận.</p>
            </motion.div>
          ) : (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8 text-center space-y-4 text-zinc-500" id="payment-prompt">
              <QrCode className="w-12 h-12 mx-auto text-zinc-700 animate-pulse" />
              <div>
                <h4 className="font-bold text-white text-sm">Chưa có lệnh nạp nào hoạt động</h4>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-1">Lệnh nạp tiền mới được tạo sẽ xuất hiện QR code và thông tin tài khoản chi tiết tại đây.</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* User Deposit History Table */}
      {currentUser && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6" id="user-deposit-history">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4 mb-4">
            <History className="w-5 h-5 text-pink-400" />
            <h3 className="font-bold text-white text-base">Lịch Sử Lệnh Nạp Của Bạn</h3>
          </div>

          {userRequests.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-sm">
              Bạn chưa tạo bất kỳ lệnh nạp tiền nào trên hệ thống.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Mã số nạp</th>
                    <th className="py-3 px-4 font-bold">Thời gian</th>
                    <th className="py-3 px-4 font-bold">Số tiền</th>
                    <th className="py-3 px-4 font-bold text-center">Trạng thái</th>
                    <th className="py-3 px-4 font-bold text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-zinc-300">
                  {userRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">{req.code}</td>
                      <td className="py-3.5 px-4 text-zinc-400">{new Date(req.createdAt).toLocaleString('vi-VN')}</td>
                      <td className="py-3.5 px-4 font-bold text-pink-400">{formatVND(req.amount)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          req.status === 'approved'
                            ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-400'
                            : req.status === 'rejected'
                            ? 'bg-red-950/40 border border-red-500/40 text-red-400'
                            : 'bg-amber-950/40 border border-amber-500/40 text-amber-400 animate-pulse'
                        }`}>
                          {req.status === 'approved' ? 'Thành công' : req.status === 'rejected' ? 'Thất bại' : 'Chờ duyệt'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setActiveRequest(req);
                            window.scrollTo({ top: 350, behavior: 'smooth' });
                          }}
                          className="text-pink-400 hover:text-pink-300 font-bold hover:underline transition-all"
                        >
                          Xem QR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
