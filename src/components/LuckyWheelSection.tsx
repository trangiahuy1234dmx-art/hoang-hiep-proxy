import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dices, Coins, HelpCircle, RefreshCw, Play, Pause, Clock, Sparkles, Lock, AlertTriangle, Key, Copy, Check, Star, Shield, Zap, Crown, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { User, LuckyWheelReward, LuckyWheelSettings, LuckyWheelSpinLog } from '../types';

interface LuckyWheelSectionProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onRefreshUser: () => void;
}

export default function LuckyWheelSection({ currentUser, onOpenAuth, onRefreshUser }: LuckyWheelSectionProps) {
  const [settings, setSettings] = useState<LuckyWheelSettings>({
    pricePerSpin: 10000,
    isActive: true,
    outOfKeysBehavior: 'reroll'
  });
  const [rewards, setRewards] = useState<(LuckyWheelReward & { keyCount?: number })[]>([]);
  const [spinLogs, setSpinLogs] = useState<LuckyWheelSpinLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonResult, setWonResult] = useState<{
    rewardName: string;
    keyString: string;
    rewardType: string;
  } | null>(null);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  const [spinError, setSpinError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Check if current logged-in user is Admin
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'huy321la' || currentUser?.username === 'hiep321la';

  // Fetch real-time configurations from server
  const fetchWheelData = async () => {
    try {
      const usernameParam = currentUser ? `?username=${currentUser.username}` : '';
      const response = await fetch(`/api/lucky-wheel/data${usernameParam}`);
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        setSettings(data.settings);
        setRewards(data.rewards);
        setSpinLogs(data.spinLogs);
      }
    } catch (err) {
      console.error('Error fetching lucky wheel data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWheelData();
  }, [currentUser]);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpin = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (isSpinning) return;
    setSpinError(null);
    setWonResult(null);

    if (currentUser.balance < settings.pricePerSpin) {
      setSpinError(`Số dư tài khoản không đủ để quay! Lượt quay cần ${settings.pricePerSpin.toLocaleString('vi-VN')} VNĐ.`);
      return;
    }

    setIsSpinning(true);

    try {
      const response = await fetch('/api/lucky-wheel/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setSpinError('Máy chủ không phản hồi JSON hợp lệ!');
        setIsSpinning(false);
        return;
      }

      if (!response.ok) {
        const errData = await response.json();
        setSpinError(errData.error || 'Quay vòng quay thất bại!');
        setIsSpinning(false);
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        const wonReward = data.wonReward;

        // Find sector of the won reward to stop the wheel precisely
        const matchedRewardIndex = rewards.findIndex(r => r.id === wonReward.id);
        const rewardIndex = matchedRewardIndex !== -1 ? matchedRewardIndex : 0;

        // Circle segment size
        const N = rewards.length || 3;
        const segmentSize = 360 / N;
        // Center angle for slice index i
        const centerAngle = rewardIndex * segmentSize + (segmentSize / 2);
        
        // Counter-clockwise required rotation to point the top needle (0 deg) to center of slice i:
        const needleTargetAngle = 360 - centerAngle;

        // Perform 6 complete spins first, then land on target angle with an extra random offset (+-12 deg)
        const randomOffset = (Math.random() - 0.5) * (segmentSize * 0.35);
        const newRotation = rotation + (360 * 6) + (needleTargetAngle - (rotation % 360)) + randomOffset;
        
        setRotation(newRotation);

        // Notify parent of updated state (refresh user info / balance / mailbox immediately)
        onRefreshUser();

        // Wait for 4s spinning animation to finish
        setTimeout(() => {
          setIsSpinning(false);
          setWonResult({
            rewardName: wonReward.name,
            keyString: wonReward.keyString,
            rewardType: wonReward.rewardType,
          });
          setIsWinnerModalOpen(true);
          // Refetch updated stock counts and logs
          fetchWheelData();
        }, 4000);
      }
    } catch (err) {
      console.error('Spin error:', err);
      setSpinError('Đã xảy ra lỗi khi kết nối máy chủ!');
      setIsSpinning(false);
    }
  };

  const getConicGradient = () => {
    // Ultra high-tech vibrant cyberpunk gradient slices (3 sectors x 120 deg)
    return 'conic-gradient(from 0deg, #be123c 0deg 120deg, #1d4ed8 120deg 240deg, #b45309 240deg 360deg)';
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
        <span className="text-zinc-500 font-mono text-sm uppercase">Đang tải dữ liệu vòng quay cyber...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="lucky-wheel-container">
      {/* Title Header with Cyber Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4" id="wheel-header">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-pink-500/20 to-cyan-500/20 border border-pink-500/40 rounded-2xl shadow-[0_0_15px_rgba(236,72,153,0.25)]">
            <Dices className="w-6 h-6 text-pink-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-cyan-300 uppercase tracking-wider">
                VÒNG QUAY MAY MẮN CYBER
              </h2>
              <span className="bg-pink-500/20 text-pink-400 border border-pink-500/40 text-[9px] font-black px-1.5 py-0.5 rounded font-mono uppercase">
                AUTOMATED
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              Thử vận may chỉ với {settings.pricePerSpin.toLocaleString('vi-VN')} VNĐ/lượt — Cơ hội trúng ngay Key Proxy 1 Ngày, 1 Tuần, 1 Tháng!
            </p>
          </div>
        </div>

        {/* Admin probability status info badge */}
        <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-xl">
          {isAdmin ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-pink-400 font-bold font-mono">
              <Eye className="w-3.5 h-3.5 text-pink-400" />
              Chế độ Admin: Xem tỷ lệ %
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-medium font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Hệ thống quay minh bạch
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: THE HIGH-TECH CYBER WHEEL INTERFACE */}
        <div className="lg:col-span-7 bg-zinc-950/80 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center space-y-8 relative overflow-hidden shadow-[0_0_50px_rgba(236,72,153,0.05)]">
          
          {/* Cyber Grid Background lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#ec4899_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />
          
          {/* HUD Corner Accents */}
          <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-pink-500/40" />
          <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-pink-500/40" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-pink-500/40" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-pink-500/40" />

          {/* Active Status & Price Tag Bar */}
          <div className="w-full flex items-center justify-between z-20">
            {settings.isActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold font-mono tracking-wider uppercase shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                HỆ THỐNG HOẠT ĐỘNG
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold font-mono tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                HỆ THỐNG BẢO TRÌ
              </span>
            )}

            <div className="text-right bg-zinc-900/90 border border-zinc-800/80 px-3 py-1 rounded-xl">
              <span className="text-[10px] text-zinc-500 font-mono block">GIÁ LƯỢT QUAY</span>
              <span className="text-sm font-black text-pink-400 font-mono">{settings.pricePerSpin.toLocaleString('vi-VN')} VNĐ</span>
            </div>
          </div>

          {/* CORE INTERACTIVE CYBER WHEEL STAGE */}
          <div className="relative mt-2 flex items-center justify-center select-none" id="wheel-interactive-area">
            
            {/* Top Futuristic Cyber Needle / Pointer */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_0_18px_rgba(236,72,153,0.8)] flex flex-col items-center">
              <div className="w-7 h-7 bg-gradient-to-b from-pink-400 to-rose-600 border-2 border-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.9)]">
                <div className="w-2.5 h-2.5 bg-zinc-950 rounded-full animate-ping" />
              </div>
              <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[22px] border-t-rose-500 -mt-1.5 drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]" />
            </div>

            {/* Glowing Outer Neon Ring Casing */}
            <div className="absolute -inset-4 rounded-full border-2 border-pink-500/30 shadow-[0_0_40px_rgba(236,72,153,0.25)] pointer-events-none animate-pulse" />
            <div className="absolute -inset-2 rounded-full border border-cyan-500/20 pointer-events-none" />

            {/* Circumference LED Lights around Wheel Casing */}
            <div className="absolute -inset-4 rounded-full pointer-events-none z-20">
              {[...Array(12)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_8px_#ec4899] transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${50 + 49 * Math.cos((i * 30 * Math.PI) / 180)}%`,
                    top: `${50 + 49 * Math.sin((i * 30 * Math.PI) / 180)}%`,
                    animation: `pulse 1.5s ease-in-out infinite ${i * 0.12}s`
                  }}
                />
              ))}
            </div>

            {/* Rotatable wheel canvas container */}
            <div 
              className="relative w-80 h-80 sm:w-88 sm:h-88 rounded-full border-[6px] border-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex items-center justify-center overflow-hidden" 
              style={{
                background: getConicGradient(),
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 4s cubic-bezier(0.12, 0.82, 0.28, 1)' : 'none'
              }}
              id="lucky-wheel-circle"
            >
              {/* Central hub metallic glow cover */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(0,0,0,0.75)_100%)] z-10" />

              {/* High-tech sector separators */}
              <div className="absolute top-0 bottom-0 left-[calc(50%-1.5px)] w-[3px] bg-cyan-400/80 shadow-[0_0_10px_#22d3ee] transform origin-center rotate-0 z-10" />
              <div className="absolute top-0 bottom-0 left-[calc(50%-1.5px)] w-[3px] bg-cyan-400/80 shadow-[0_0_10px_#22d3ee] transform origin-center rotate-120 z-10" />
              <div className="absolute top-0 bottom-0 left-[calc(50%-1.5px)] w-[3px] bg-cyan-400/80 shadow-[0_0_10px_#22d3ee] transform origin-center rotate-240 z-10" />

              {/* Sector Labels inside the Wheel Slices */}
              {rewards.map((reward, idx) => {
                const angle = idx * 120 + 60; // middle of the 120deg sector
                return (
                  <div 
                    key={reward.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 origin-center flex flex-col items-center" 
                    style={{ transform: `rotate(${angle}deg) translateY(-92px)` }}
                  >
                    <div className="p-1 rounded-lg bg-black/30 border border-white/10 mb-1">
                      {idx === 0 ? <Zap className="w-3.5 h-3.5 text-rose-300" /> : idx === 1 ? <Crown className="w-3.5 h-3.5 text-blue-300" /> : <Star className="w-3.5 h-3.5 text-amber-300" />}
                    </div>

                    <span className="text-white font-black text-xs uppercase tracking-wider drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] text-center max-w-[120px] whitespace-pre-line leading-tight font-sans">
                      {reward.name.replace('Key Proxy ', '')}
                    </span>

                    {/* STRICT CONDITION: ONLY ADMIN CAN SEE PROBABILITY PERCENTAGES (%) */}
                    {isAdmin ? (
                      <span className="text-[10px] text-pink-300 font-extrabold bg-pink-950/80 border border-pink-500/50 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.5)] font-mono mt-1.5 tracking-tight flex items-center gap-1">
                        <Eye className="w-2.5 h-2.5 text-pink-400" />
                        {reward.probability}%
                      </span>
                    ) : (
                      <span className="text-[8px] text-cyan-300 font-extrabold bg-black/60 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono mt-1.5 uppercase tracking-wider backdrop-blur-sm">
                        PROXY VIP
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CENTER SPIN REACTOR HUB */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center">
              
              {/* Rotating Dashed Orbit Ring */}
              <div className="absolute -inset-3 rounded-full border-2 border-dashed border-pink-500/60 animate-[spin_12s_linear_infinite] pointer-events-none" />

              <button
                onClick={handleSpin}
                disabled={isSpinning || !settings.isActive}
                className={`w-22 h-22 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center font-black tracking-tight border-4 border-zinc-950 text-white uppercase text-xs shadow-[0_0_30px_rgba(0,0,0,0.95)] transition-all cursor-pointer select-none active:scale-95 group relative overflow-hidden ${
                  isSpinning 
                    ? 'bg-zinc-800 opacity-90 cursor-not-allowed text-zinc-400' 
                    : !settings.isActive
                    ? 'bg-zinc-900 text-zinc-500 cursor-not-allowed border-zinc-800 shadow-none'
                    : 'bg-gradient-to-br from-pink-600 via-rose-600 to-pink-700 hover:from-pink-500 hover:to-rose-500 shadow-[0_0_30px_rgba(236,72,153,0.6)] border-pink-400'
                }`}
                id="spin-trigger-btn"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Dices className={`w-7 h-7 mb-0.5 z-10 ${isSpinning ? 'animate-spin text-zinc-400' : 'text-white group-hover:rotate-180 transition-transform duration-500'}`} />
                <span className="font-black text-xs z-10 tracking-widest text-white drop-shadow">QUAY</span>
                <span className="text-[8px] font-mono font-bold text-pink-200 z-10 opacity-80">SPIN HUD</span>
              </button>
            </div>
          </div>

          {/* Dynamic Cyber Feedback Notice */}
          <div className="w-full max-w-md text-center" id="wheel-feedback-box">
            {spinError && (
              <div className="p-3.5 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded-2xl font-bold animate-bounce flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{spinError}</span>
              </div>
            )}
            {!spinError && isSpinning && (
              <div className="text-pink-400 text-xs font-bold animate-pulse flex items-center justify-center gap-2 bg-pink-950/40 border border-pink-500/20 py-2.5 px-4 rounded-xl">
                <Sparkles className="w-4 h-4 text-pink-400 animate-spin" />
                Hệ thống đang xoay kết quả ngẫu nhiên từ server...
              </div>
            )}
            {!spinError && !isSpinning && (
              <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Thuật toán quay ngẫu nhiên bảo mật 100% từ máy chủ.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: REWARD STOCK & LIVE LOGS */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Rewards overview card */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-3xl p-5 space-y-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]" id="wheel-rewards-shelf">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="font-black text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <Crown className="w-4 h-4 text-pink-400" />
                Cơ cấu giải thưởng trong kho
              </h3>
              
              {/* Admin vs User Badge */}
              {isAdmin && (
                <span className="text-[9px] font-mono font-bold bg-pink-500/20 text-pink-400 border border-pink-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Hiển thị % (Admin)
                </span>
              )}
            </div>

            <div className="space-y-3">
              {rewards.map((reward, i) => {
                const stock = reward.keyCount !== undefined ? reward.keyCount : 0;
                return (
                  <div 
                    key={reward.id}
                    className="flex justify-between items-center bg-zinc-900/60 border border-zinc-800/80 p-3.5 rounded-2xl hover:border-pink-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs w-7 h-7 rounded-xl font-mono font-black flex items-center justify-center border ${
                        i === 0 
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]' 
                          : i === 1 
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {i + 1}
                      </span>
                      <div className="text-left space-y-0.5">
                        <h4 className="font-black text-white text-xs group-hover:text-pink-400 transition-colors">{reward.name}</h4>
                        
                        {/* ONLY ADMIN SEES THE PROBABILITY PERCENTAGE HERE */}
                        {isAdmin ? (
                          <span className="text-[10px] text-pink-400 font-bold font-mono block flex items-center gap-1">
                            <Eye className="w-3 h-3 text-pink-400" />
                            Tỷ lệ trúng: {reward.probability}%
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-mono block">
                            Hỗ trợ HTTP / SOCKS5
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      {stock > 0 ? (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black font-mono rounded-xl border border-emerald-500/20">
                          SẴN {stock} KEY
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-red-500/10 text-red-400 text-[10px] font-black font-mono rounded-xl border border-red-500/20">
                          TẠM HẾT KEY
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Recent Spin History list */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-3xl p-5 space-y-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]" id="wheel-recent-logs">
            <h3 className="font-black text-white text-xs uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/80 pb-3">
              <Clock className="w-4 h-4 text-cyan-400" />
              Lịch sử quay gần đây
            </h3>

            {spinLogs.length === 0 ? (
              <div className="text-zinc-500 text-xs py-8 text-center font-medium font-mono">
                Chưa có lượt quay nào được thực hiện.
              </div>
            ) : (
              <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {spinLogs.slice(0, 10).map((log) => {
                  const dateStr = new Date(log.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div 
                      key={log.id} 
                      className="bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800/60 text-[11px] flex justify-between items-center gap-3 hover:border-zinc-700 transition-all"
                    >
                      <div className="text-left space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-zinc-200 font-extrabold">@{log.username}</span>
                          <span className="text-zinc-500 font-mono text-[10px]">{dateStr}</span>
                        </div>
                        <div className="text-zinc-400 font-medium text-[10px]">
                          {log.status === 'success' ? (
                            <span>Quay trúng: <strong className="text-pink-400 font-bold">{log.rewardName}</strong></span>
                          ) : log.status === 'refunded' ? (
                            <span className="text-yellow-500 font-medium">Hoàn tiền (Hết key giải thưởng)</span>
                          ) : (
                            <span className="text-zinc-500">Trúng {log.rewardName} (Hụt kho)</span>
                          )}
                        </div>
                      </div>

                      <div>
                        {log.status === 'success' ? (
                          <span className="text-emerald-400 font-extrabold bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-500/20 font-mono text-[8px] uppercase">
                            Trúng Giải
                          </span>
                        ) : log.status === 'refunded' ? (
                          <span className="text-yellow-400 font-extrabold bg-yellow-950/40 px-2 py-0.5 rounded-lg border border-yellow-500/20 font-mono text-[8px] uppercase">
                            Hoàn Tiền
                          </span>
                        ) : (
                          <span className="text-zinc-500 font-extrabold bg-zinc-950/40 px-2 py-0.5 rounded-lg border border-zinc-800 font-mono text-[8px] uppercase">
                            Hụt Giải
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* --- FLOATING WINNER OVERLAY MODAL --- */}
      <AnimatePresence>
        {isWinnerModalOpen && wonResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" id="victory-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              className="w-full max-w-md bg-zinc-950 border-2 border-pink-500 rounded-3xl p-6 text-center space-y-6 shadow-[0_0_60px_rgba(236,72,153,0.4)] relative overflow-hidden"
            >
              {/* Confetti Glow Effect */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.2)_0%,transparent_70%)] pointer-events-none" />

              <div className="p-4 bg-gradient-to-br from-pink-500/20 to-cyan-500/20 border border-pink-500/40 rounded-full w-20 h-20 flex items-center justify-center mx-auto text-pink-400 shadow-[0_0_30px_rgba(236,72,153,0.3)] animate-bounce">
                <Sparkles className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black text-pink-400 tracking-widest uppercase block animate-pulse font-mono">
                  ★ CYBER REWARD UNLOCKED ★
                </span>
                <h3 className="font-black text-2xl text-white tracking-wide uppercase">BẠN ĐÃ TRÚNG THƯỞNG!</h3>
                <p className="text-xs text-zinc-400">
                  Hệ thống tự động quay và cấp phần thưởng trực tiếp từ máy chủ.
                </p>
              </div>

              {/* Award Presentation Box */}
              <div className="bg-zinc-900/90 border border-pink-500/30 p-5 rounded-2xl space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-wider block">Phần thưởng trúng được:</span>
                  <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-cyan-300 block uppercase">
                    {wonResult.rewardName}
                  </span>
                </div>

                <div className="pt-2 border-t border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-wider block mb-2">Mã key đã cấp tự động:</span>
                  
                  {wonResult.keyString && wonResult.keyString !== 'N/A' ? (
                    <div className="flex gap-2 bg-black p-3 rounded-xl border border-zinc-800 items-center justify-between shadow-inner">
                      <span className="font-mono text-xs font-black text-emerald-400 tracking-wider break-all select-all text-left pr-2">
                        {wonResult.keyString}
                      </span>
                      <button
                        onClick={() => handleCopyKey(wonResult.keyString)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex-shrink-0 flex items-center justify-center ${
                          copied 
                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' 
                            : 'bg-zinc-900 border-zinc-800 hover:border-pink-500 text-zinc-400 hover:text-white'
                        }`}
                        title="Copy key"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-950/30 border border-red-500/30 text-red-400 font-bold text-xs rounded-xl">
                      Không tìm thấy key trúng thưởng trong kho
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-[10px] text-zinc-500 font-mono leading-relaxed px-2">
                  * Key trúng thưởng đã được lưu giữ tự động trong Hộp Thư cá nhân của bạn để tra cứu lại bất kỳ lúc nào.
                </p>

                <button
                  onClick={() => setIsWinnerModalOpen(false)}
                  className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold rounded-2xl transition-all shadow-[0_0_20px_rgba(219,39,119,0.4)] active:scale-[0.98] cursor-pointer text-xs uppercase tracking-wider"
                >
                  Tuyệt vời & Đóng lại
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
