import React, { useState, useEffect } from 'react';
import { Mail, Key, Copy, Check, Calendar, ShoppingBag, ShieldCheck, Trash2, History, Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { User, Transaction } from '../types';
import { db } from '../dbMock';

interface MailboxSectionProps {
  currentUser: User | null;
  onOpenAuth: () => void;
}

export default function MailboxSection({ currentUser, onOpenAuth }: MailboxSectionProps) {
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [localTxs, setLocalTxs] = useState<Transaction[]>(() => db.getTransactions());
  const [mailboxTab, setMailboxTab] = useState<'keys' | 'balance'>('keys');

  useEffect(() => {
    setLocalTxs(db.getTransactions());
  }, [currentUser]);

  // Copy key helper
  const handleCopyKey = (keyString: string, txId: string) => {
    navigator.clipboard.writeText(keyString);
    setCopiedKeyId(txId);
    setTimeout(() => setCopiedKeyId(null), 1500);
  };

  // Delete transaction helper
  const handleDeleteTx = (txId: string) => {
    const isConfirmed = window.confirm("Bạn có chắc chắn muốn xóa bản ghi này khỏi hòm thư cá nhân không?");
    if (!isConfirmed) return;

    const allTransactions = db.getTransactions();
    const updatedTransactions = allTransactions.map(t => {
      if (t.id === txId) {
        return { ...t, isDeleted: true };
      }
      return t;
    });
    db.saveTransactions(updatedTransactions);
    setLocalTxs(updatedTransactions);
  };

  // Get all user transactions (excluding deleted ones)
  const allUserTxs = currentUser
    ? localTxs
        .filter(t => t.userId === currentUser.id && !t.isDeleted)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  // Filter to keys purchased (those that have a keyString and are of type 'purchase' or undefined)
  const purchasedKeysTxs = allUserTxs.filter(t => !t.type || t.type === 'purchase');

  const formatVND = (value: number) => {
    return value.toLocaleString('vi-VN') + ' VNĐ';
  };

  return (
    <div className="space-y-8" id="mailbox-section-root">
      
      {/* Inbox Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
          HÒM THƯ <span className="text-pink-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]">CÁ NHÂN</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Nơi nhận mã bản quyền game, key phần mềm tự động của bạn ngay sau khi giao dịch thành công.
        </p>
      </div>

      {!currentUser ? (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-12 text-center space-y-5 max-w-lg mx-auto" id="mailbox-guest-prompt">
          <Mail className="w-12 h-12 text-zinc-700 mx-auto animate-bounce" />
          <div className="space-y-2">
            <h3 className="font-bold text-white text-base">Yêu Cầu Đăng Nhập</h3>
            <p className="text-xs text-zinc-400">Vui lòng đăng nhập tài khoản của bạn để truy cập hòm thư cá nhân và xem mã key đã sở hữu.</p>
          </div>
          <button
            onClick={onOpenAuth}
            className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(219,39,119,0.3)] cursor-pointer"
          >
            ĐĂNG NHẬP NGAY
          </button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6" id="mailbox-user-content">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-400">Địa chỉ hòm thư:</span>
              <span className="text-xs font-mono text-pink-400 font-bold tracking-wider">{currentUser.username}@hoanghiep-shop.vn</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-400">Số dư hiện tại:</span>
              <span className="text-xs font-mono text-emerald-400 font-bold tracking-wider bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">{formatVND(currentUser.balance)}</span>
            </div>
          </div>

          {/* Sub-tabs Selection */}
          <div className="flex border-b border-zinc-800 gap-2" id="mailbox-tabs">
            <button
              onClick={() => setMailboxTab('keys')}
              className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
                mailboxTab === 'keys'
                  ? 'border-pink-500 text-pink-400 bg-pink-500/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
              id="sub-tab-keys"
            >
              <Key className="w-4 h-4" />
              Key Đã Sở Hữu ({purchasedKeysTxs.length})
            </button>
            <button
              onClick={() => setMailboxTab('balance')}
              className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
                mailboxTab === 'balance'
                  ? 'border-pink-500 text-pink-400 bg-pink-500/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
              id="sub-tab-balance"
            >
              <History className="w-4 h-4" />
              Biến Động Số Dư ({allUserTxs.length})
            </button>
          </div>

          {mailboxTab === 'keys' ? (
            purchasedKeysTxs.length === 0 ? (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-16 text-center space-y-4 text-zinc-500" id="mailbox-empty-state">
                <ShoppingBag className="w-12 h-12 mx-auto text-zinc-700" />
                <div>
                  <h4 className="font-bold text-white text-sm">Hòm thư của bạn đang trống!</h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-1">Bạn chưa thực hiện bất kỳ giao dịch mua key nào. Hãy quay lại trang chủ và chọn mua sản phẩm bạn yêu thích.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4" id="purchased-keys-list">
                {purchasedKeysTxs.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 hover:border-pink-500/30 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden"
                  >
                    {/* Decorative badge marker */}
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-500"></div>

                    <div className="space-y-2 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-widest bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded border border-pink-500/20">
                          Bản quyền phần mềm
                        </span>
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(tx.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      
                      <h4 className="font-extrabold text-white text-base tracking-wide">{tx.productName}</h4>
                      
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-zinc-500">Đơn giá:</span>
                        <span className="text-zinc-300 font-bold">{formatVND(tx.amount)}</span>
                        <span className="text-zinc-600">|</span>
                        <span className="text-zinc-500">Mã đơn:</span>
                        <span className="text-zinc-400 font-mono">{tx.id}</span>
                      </div>
                    </div>

                    {/* Action Group */}
                    <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      {/* License Key Holder */}
                      <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                        <div className="flex items-center gap-2 px-1 text-zinc-400">
                          <Key className="w-4 h-4 text-pink-500 shrink-0" />
                          <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">KEY:</span>
                          <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/20 px-2 py-1 rounded select-all break-all tracking-wide">
                            {tx.keyString}
                          </span>
                        </div>

                        <button
                          onClick={() => handleCopyKey(tx.keyString, tx.id)}
                          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            copiedKeyId === tx.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                          }`}
                        >
                          {copiedKeyId === tx.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Đã sao chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Sao chép Key</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Delete Product Button */}
                      <button
                        onClick={() => handleDeleteTx(tx.id)}
                        title="Xóa khỏi hòm thư"
                        className="px-4 py-3 sm:py-2 bg-zinc-950 border border-zinc-800 hover:border-red-500/50 hover:bg-red-950/20 text-zinc-400 hover:text-red-400 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sm:hidden text-xs font-bold">Xóa lịch sử</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-6" id="balance-history-card">
              {allUserTxs.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-sm space-y-3">
                  <Wallet className="w-12 h-12 mx-auto text-zinc-700 animate-pulse" />
                  <p>Bạn chưa phát sinh bất kỳ giao dịch hoặc biến động số dư nào trên hệ thống.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4 font-extrabold">Thời gian</th>
                        <th className="py-3 px-4 font-extrabold">Loại giao dịch</th>
                        <th className="py-3 px-4 font-extrabold text-zinc-500">Số dư trước</th>
                        <th className="py-3 px-4 font-extrabold">Số tiền thay đổi</th>
                        <th className="py-3 px-4 font-extrabold">Số dư sau GD</th>
                        <th className="py-3 px-4 font-extrabold text-right">Chi tiết đơn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900 text-zinc-300">
                      {allUserTxs.map((tx) => {
                        const isDeposit = tx.type === 'deposit';
                        const isAdjustment = tx.type === 'admin_adjustment';
                        const isPurchase = !tx.type || tx.type === 'purchase';

                        // Decide transaction name & icon & amount sign
                        let typeName = '';
                        let typeBadge = '';
                        let amountColor = '';
                        let amountSign = '';
                        let IconComponent = History;

                        const isAdd = isDeposit || (isAdjustment && tx.productName?.includes('cộng'));

                        if (isDeposit) {
                          typeName = tx.productName || 'Nạp tiền vào tài khoản';
                          typeBadge = 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400';
                          amountColor = 'text-emerald-400 font-extrabold';
                          amountSign = '+';
                          IconComponent = ArrowUpRight;
                        } else if (isAdjustment) {
                          typeName = tx.productName || 'Thay đổi số dư';
                          typeBadge = isAdd 
                            ? 'bg-blue-950/40 border border-blue-500/30 text-blue-400' 
                            : 'bg-zinc-950/40 border border-zinc-800 text-zinc-400';
                          amountColor = isAdd ? 'text-emerald-400 font-extrabold' : 'text-rose-400 font-extrabold';
                          amountSign = isAdd ? '+' : '-';
                          IconComponent = isAdd ? ArrowUpRight : ArrowDownLeft;
                        } else {
                          typeName = `Mua key: ${tx.productName}`;
                          typeBadge = 'bg-pink-950/40 border border-pink-500/30 text-pink-400';
                          amountColor = 'text-rose-400 font-extrabold';
                          amountSign = '-';
                          IconComponent = ArrowDownLeft;
                        }

                        let balanceBefore = 0;
                        if (tx.balanceAfter !== undefined) {
                          balanceBefore = isAdd ? tx.balanceAfter - tx.amount : tx.balanceAfter + tx.amount;
                        }

                        return (
                          <tr key={tx.id} className="hover:bg-zinc-900/40 transition-colors">
                            {/* Execution Time */}
                            <td className="py-4 px-4 text-zinc-400 whitespace-nowrap">
                              {new Date(tx.createdAt).toLocaleString('vi-VN')}
                            </td>

                            {/* Transaction Type */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`p-1 rounded-md shrink-0 ${isDeposit ? 'bg-emerald-950 text-emerald-400' : isPurchase ? 'bg-pink-950 text-pink-400' : 'bg-zinc-800 text-zinc-300'}`}>
                                  <IconComponent className="w-3.5 h-3.5" />
                                </span>
                                <div className="space-y-0.5">
                                  <div className="text-zinc-200 font-sans font-bold text-xs">{typeName}</div>
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${typeBadge}`}>
                                    {isDeposit ? 'Nạp tiền' : isAdjustment ? 'Căn chỉnh' : 'Mua sắm'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Balance Before */}
                            <td className="py-4 px-4 whitespace-nowrap text-zinc-500">
                              {tx.balanceAfter !== undefined ? (
                                <span>{formatVND(balanceBefore)}</span>
                              ) : (
                                <span className="italic">N/A</span>
                              )}
                            </td>

                            {/* Amount Changed */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className={amountColor}>
                                {amountSign}{formatVND(tx.amount)}
                              </span>
                            </td>

                            {/* Balance After */}
                            <td className="py-4 px-4 whitespace-nowrap text-zinc-300">
                              {tx.balanceAfter !== undefined ? (
                                <span className="font-extrabold text-zinc-200">{formatVND(tx.balanceAfter)}</span>
                              ) : (
                                <span className="text-zinc-500 italic">N/A</span>
                              )}
                            </td>

                            {/* Action/ID Detail */}
                            <td className="py-4 px-4 text-right text-zinc-500 font-mono text-[10px] whitespace-nowrap">
                              {tx.id}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Guarantee stamp */}
          <div className="p-4 bg-zinc-900/20 border border-zinc-800/60 rounded-xl text-center flex items-center justify-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <span className="text-xs text-zinc-500 font-medium">Cam kết toàn bộ key bản quyền đều chính hãng 100% — Bảo hành trọn đời thời hạn sử dụng.</span>
          </div>

        </div>
      )}

    </div>
  );
}
