import React from 'react';
import { ShoppingCart, ShieldCheck, Key, Zap, Flame } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string;
  product: Product;
  inStockCount: number;
  onBuy: (product: Product) => void;
}

export default function ProductCard({ product, inStockCount, onBuy }: ProductCardProps) {
  const formatVND = (value: number) => {
    return value.toLocaleString('vi-VN') + ' VNĐ';
  };

  const isProxy = product.category === 'proxy';

  return (
    <div
      className="relative bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 transition-all duration-300 hover:border-pink-500/40 hover:shadow-[0_0_20px_rgba(244,63,94,0.08)] flex flex-col justify-between group overflow-hidden"
      id={`product-card-${product.id}`}
    >
      {/* Dynamic Background Glow on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 via-pink-500/0 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

      {/* Header Tag */}
      <div className="flex justify-between items-start gap-2 mb-4 relative z-10">
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
          isProxy 
            ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20 shadow-[0_0_8px_rgba(236,72,153,0.1)]' 
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]'
        }`}>
          {isProxy ? 'PROXIMA AIM' : 'MIGUL ENGINE'}
        </span>

        <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
          inStockCount > 0 
            ? 'bg-zinc-950 text-emerald-400 border border-emerald-950' 
            : 'bg-zinc-950 text-red-400 border border-red-950'
        }`}>
          {inStockCount > 0 ? `Còn ${inStockCount} key` : 'Hết Key'}
        </span>
      </div>

      {/* Main product info */}
      <div className="space-y-2 relative z-10 mb-6">
        <h3 className="text-lg font-black text-white group-hover:text-pink-400 transition-colors tracking-wide flex items-center gap-1.5">
          {isProxy ? <Flame className="w-5 h-5 text-pink-500 shrink-0" /> : <Zap className="w-5 h-5 text-emerald-400 shrink-0" />}
          {product.name}
        </h3>
        
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-bold uppercase tracking-wider font-mono">
          <span>Thời hạn:</span>
          <span className="text-zinc-300">{product.duration}</span>
        </div>
      </div>

      {/* Footer buy actions */}
      <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-between gap-4 relative z-10 mt-auto">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 font-bold uppercase">Giá thanh toán</span>
          <span className="text-base sm:text-lg font-black text-white group-hover:text-pink-500 transition-colors drop-shadow-[0_0_5px_rgba(244,63,94,0.1)]">
            {formatVND(product.price)}
          </span>
        </div>

        {inStockCount > 0 ? (
          <button
            onClick={() => onBuy(product)}
            className="px-4 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-[0_0_12px_rgba(219,39,119,0.35)] hover:shadow-[0_0_20px_rgba(219,39,119,0.55)] flex items-center gap-1.5 cursor-pointer active:scale-95"
            id={`buy-btn-${product.id}`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            MUA NGAY
          </button>
        ) : (
          <div className="px-4 py-2.5 bg-zinc-800 text-zinc-500 font-extrabold text-xs sm:text-sm rounded-xl border border-zinc-700/50 cursor-not-allowed select-none">
            HẾT KEY
          </div>
        )}
      </div>

    </div>
  );
}
