import React from 'react';
import { Heart, ShieldCheck, Zap, MessageSquare } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative w-full bg-zinc-950 border-t border-pink-500/30 py-10 mt-auto overflow-hidden" id="main-footer">
      {/* Decorative subtle gradient radial glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[150px] bg-pink-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Brand Statement */}
        <div className="mb-6" id="footer-brand-statement">
          <h2 className="text-lg sm:text-xl font-black text-white tracking-[0.1em] uppercase inline-block">
            SHOP ĐỒ CHƠI FULL ĐỎ HOÀNG HIỆP <span className="text-pink-500 mx-2">—</span> <span className="text-pink-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">UY TÍN TẠO NÊN THƯƠNG HIỆU</span>
          </h2>
        </div>

        {/* Highlight Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8" id="footer-perks-grid">
          <div className="flex items-center justify-center gap-3 p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
            <div className="p-2 bg-pink-500/10 text-pink-400 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-zinc-300">Tự động hóa 24/7 siêu tốc</span>
          </div>
          
          <div className="flex items-center justify-center gap-3 p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
            <div className="p-2 bg-pink-500/10 text-pink-400 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-zinc-300">Bảo mật tuyệt đối khách hàng</span>
          </div>

          <div className="flex items-center justify-center gap-3 p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
            <div className="p-2 bg-pink-500/10 text-pink-400 rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-zinc-300">Hỗ trợ kỹ thuật 24/7 nhanh chóng</span>
          </div>
        </div>

        {/* Commitment Messages */}
        <div className="space-y-4 max-w-3xl mx-auto text-sm sm:text-base" id="footer-messages-container">
          <p className="text-zinc-300 font-medium leading-relaxed" id="footer-message-commitments">
            ⚡ Cam kết hệ thống giao dịch tự động 24/7 — Bảo mật tuyệt đối thông tin khách hàng — Hỗ trợ kỹ thuật nhanh chóng.
          </p>
          
          <p className="text-zinc-500 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium" id="footer-message-thanks">
            <Heart className="w-4 h-4 text-pink-500 fill-pink-500 inline shrink-0" />
            Cảm ơn quý khách đã tin tưởng và đồng hành cùng Shop đồ chơi full đỏ Hoàng Hiệp. Chúc bạn có những trải nghiệm tuyệt vời nhất!
          </p>
        </div>

        {/* Admin Copyright info */}
        <div className="mt-8 pt-6 border-t border-zinc-900 text-[11px] text-zinc-600 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 SHOP HOÀNG HIỆP. All Rights Reserved.</span>
          <span>Designed for Elite Gamers</span>
        </div>

      </div>
    </footer>
  );
}
