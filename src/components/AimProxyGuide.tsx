import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Copy, Check, Play, ShieldAlert, Sparkles, Smartphone, Wifi, Key, CheckCircle2, AlertTriangle, ArrowRight, Video, Eye, Film } from 'lucide-react';

export default function AimProxyGuide() {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedServer, setCopiedServer] = useState(false);
  const [copiedPort, setCopiedPort] = useState(false);
  const [activeFrame, setActiveFrame] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const ACTIVATE_URL = 'https://chunchuche.io.vn/v2/activate.php';
  const PROXY_SERVER = '180.93.32.64';
  const PROXY_PORT = '1700';

  const copyToClipboard = (text: string, type: 'link' | 'server' | 'port') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else if (type === 'server') {
      setCopiedServer(true);
      setTimeout(() => setCopiedServer(false), 2000);
    } else if (type === 'port') {
      setCopiedPort(true);
      setTimeout(() => setCopiedPort(false), 2000);
    }
  };

  const videoFrames = [
    { num: 1, time: 0, title: 'B1: Sao chép Key từ Mess', src: '/frames/step_01.png', keyInfo: 'Key: BCE1FAB8E2 | UID: 15761653447' },
    { num: 2, time: 10, title: 'B2: Mở Safari & Kiểm tra Key', src: '/frames/step_02.png', keyInfo: 'chunchuche.io.vn/v2/activate.php' },
    { num: 3, time: 20, title: 'B3: Copy UID từ Free Fire MAX', src: '/frames/step_03.png', keyInfo: 'NV: dinhkhanh2ler9 - UID: 15761653447' },
    { num: 4, time: 30, title: 'B4: Kích hoạt & Tải Config', src: '/frames/step_04.png', keyInfo: 'Bấm Kích Hoạt -> Tải .mobileconfig' },
    { num: 5, time: 40, title: 'B5: Cài VPN Profile & Tin cậy', src: '/frames/step_05.png', keyInfo: 'Bật tin cậy ProxyPin CA / mitmproxy' },
    { num: 6, time: 50, title: 'B6: Cấu hình Proxy Wi-Fi', src: '/frames/step_06.png', keyInfo: '180.93.32.64 : 1700 (Thủ công)' },
    { num: 7, time: 60, title: 'B7: Mở Game & Fix Lỗi 400', src: '/frames/step_07.png', keyInfo: 'Lỗi 400 -> Tắt Proxy Wi-Fi -> Bấm Lưu' },
    { num: 8, time: 70, title: 'B8: Aim Proxy Kéo Tâm Full Đỏ', src: '/frames/step_08.png', keyInfo: 'Đã Kích Hoạt -> Vào Đấu Hạng / Trường Tập Bắn' },
  ];

  const seekToTime = (seconds: number, index: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }
    setActiveFrame(index);
  };

  const steps = [
    {
      num: '01',
      title: 'Mở Trình Duyệt Safari & Truy Cập Trang Kích Hoạt',
      desc: 'Bắt buộc sử dụng trình duyệt Safari trên iPhone/iPad (không dùng Chrome hay Facebook In-App Browser).',
      actionText: ACTIVATE_URL,
      copyType: 'link' as const,
      badge: 'Bắt buộc Safari',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    },
    {
      num: '02',
      title: 'Dán Key Proxy Đã Mua & Kiểm Tra Key',
      desc: 'Sao chép Mã Key Proxy bạn đã mua tại Shop Hoàng Hiệp, dán vào ô "ACCESS KEY" và bấm "Kiểm Tra Key".',
      badge: 'Nhập Key',
      badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/30'
    },
    {
      num: '03',
      title: 'Lấy ID Game (UID) Trong Free Fire MAX & Kích Hoạt',
      desc: 'Mở ứng dụng Free Fire MAX, bấm vào Hồ Sơ cá nhân sao chép UID (Ví dụ: 15761653447). Quay lại Safari dán vào ô "UID (TÀI KHOẢN GAME)" rồi bấm "Kích Hoạt".',
      badge: 'Chỉ Free Fire MAX',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    },
    {
      num: '04',
      title: 'Tải File Cấu Hình .mobileconfig Cho iPhone',
      desc: 'Sau khi kích hoạt thành công, bấm nút "Tải .mobileconfig". Hệ thống sẽ hỏi xác nhận, bấm chọn "Cho Phép" (Allow) để tải hồ sơ cấu hình về máy.',
      badge: 'Tải Profile',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
    },
    {
      num: '05',
      title: 'Cài Đặt Hồ Sơ & Bật Bật Tin Cậy Chứng Nhận',
      desc: 'Vào Cài Đặt (Settings) iPhone -> Cài Đặt Chung -> Quản lý VPN & Thiết bị -> Chọn hồ sơ CHUNCHUCHE VIP -> Bấm "Cài Đặt" (Nhập passcode màn hình). Tiếp theo vào Cài Đặt Chung -> Giới thiệu -> Cài đặt tin cậy chứng nhận -> Bật gạt XANH cho ProxyPin CA / mitmproxy.',
      badge: 'Cài Đặt VPN',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    },
    {
      num: '06',
      title: 'Cấu Hình Proxy Wi-Fi & Hoàn Tất Kích Hoạt Full Đỏ',
      desc: 'Vào Cài Đặt -> Wi-Fi -> Bấm chữ (i) cạnh tên Wi-Fi -> Kéo xuống "Định cấu hình proxy" -> Chọn "Thủ công" -> Nhập Máy chủ: 180.93.32.64 và Cổng: 1700 -> Bấm "Lưu". Sau đó vào Free Fire MAX, nếu bị lỗi 400 thì quay lại Wi-Fi chọn "Tắt" Proxy và Bấm "Lưu". Vào lại game là kích hoạt thành công!',
      badge: 'Kích Hoạt Game',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto" id="aim-proxy-guide-view">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-2 border-pink-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(236,72,153,0.15)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" />
              TÀI LIỆU HƯỚNG DẪN CHÍNH THỨC
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
              CÁCH CÀI <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-pink-500">AIM PROXY</span> TRÊN IPHONE (IOS)
            </h1>
            <p className="text-sm text-zinc-400 font-medium max-w-2xl leading-relaxed">
              Chi tiết các bước cài đặt Proxy kéo tâm Full Đỏ mượt mà. Vui lòng làm theo đúng video minh họa và các bước bên dưới để kích hoạt thành công.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 flex-shrink-0">
            <a
              href={ACTIVATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-sm rounded-2xl transition-all shadow-[0_0_20px_rgba(219,39,119,0.4)] flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider group"
            >
              <span>MỞ TRANG KÍCH HOẠT</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>

            <button
              onClick={() => copyToClipboard(ACTIVATE_URL, 'link')}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-pink-400 border border-pink-500/30 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Đã sao chép link!' : 'Sao chép link kích hoạt'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Config HUD Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-500/10 text-pink-400 rounded-xl">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-mono block uppercase">LINK KÍCH HOẠT</span>
              <span className="text-xs font-bold text-white font-mono truncate max-w-[150px] sm:max-w-[130px] md:max-w-[170px] block">
                chunchuche.io.vn
              </span>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(ACTIVATE_URL, 'link')}
            className="p-2 text-zinc-400 hover:text-pink-400 bg-zinc-900 rounded-lg transition-colors cursor-pointer"
            title="Sao chép link"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-mono block uppercase">MÁY CHỦ (SERVER IP)</span>
              <span className="text-xs font-black text-cyan-400 font-mono">{PROXY_SERVER}</span>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(PROXY_SERVER, 'server')}
            className="p-2 text-zinc-400 hover:text-cyan-400 bg-zinc-900 rounded-lg transition-colors cursor-pointer"
            title="Sao chép Server IP"
          >
            {copiedServer ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-mono block uppercase">CỔNG (PORT)</span>
              <span className="text-xs font-black text-amber-400 font-mono">{PROXY_PORT}</span>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(PROXY_PORT, 'port')}
            className="p-2 text-zinc-400 hover:text-amber-400 bg-zinc-900 rounded-lg transition-colors cursor-pointer"
            title="Sao chép Port"
          >
            {copiedPort ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Video Demonstration Section */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-500/10 text-pink-400 border border-pink-500/30 rounded-2xl">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <span>VIDEO HƯỚNG DẪN THỰC TẾ CÀI ĐẶT</span>
                <span className="bg-pink-600 text-white text-[10px] font-black px-2 py-0.5 rounded font-mono uppercase">
                  IOS STEP-BY-STEP
                </span>
              </h2>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                Xem kỹ từng thao tác trên iPhone để đảm bảo không bị thiếu bước kích hoạt
              </p>
            </div>
          </div>
        </div>

        {/* Video Player Frame Container */}
        <div className="relative rounded-2xl overflow-hidden bg-black border border-zinc-800/80 aspect-video flex items-center justify-center shadow-2xl group max-w-3xl mx-auto">
          <video
            ref={videoRef}
            controls
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-contain max-h-[500px]"
          >
            <source src="https://www.image2url.com/r2/default/videos/1784729365046-0d0f2015-c363-4b75-861a-f0a9249d82ef.mp4" type="video/mp4" />
            Trình duyệt của bạn không hỗ trợ phát video HTML5.
          </video>
        </div>

        {/* Video Quick Controls & Fullscreen/Download Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              MP4 HD Ready (1080p)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://www.image2url.com/r2/default/videos/1784729365046-0d0f2015-c363-4b75-861a-f0a9249d82ef.mp4"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-pink-600/20 hover:bg-pink-600 text-pink-300 hover:text-white border border-pink-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Xem Video Mới</span>
            </a>

            <a
              href="https://www.image2url.com/r2/default/videos/1784729365046-0d0f2015-c363-4b75-861a-f0a9249d82ef.mp4"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Video className="w-3.5 h-3.5 text-pink-400" />
              <span>Tải Video MP4</span>
            </a>
          </div>
        </div>

        {/* Note below video */}
        <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center gap-3 text-xs text-zinc-300 font-medium">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <span>
            <strong>Lưu ý quan trọng:</strong> Khi vào game hiện thông báo <code className="bg-black px-1.5 py-0.5 rounded text-pink-400 font-mono">Đăng nhập máy chủ thất bại 400</code> là bạn đã cấu hình đúng! Lúc này quay lại Cài đặt Wi-Fi tắt Proxy về <code className="bg-black px-1.5 py-0.5 rounded text-amber-400 font-mono">Tắt</code> rồi nhấn Lưu và vào lại game.
          </span>
        </div>
      </div>

      {/* Step-by-Step Instructions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-pink-500" />
            CÁC BƯỚC THỰC HIỆN CHI TIẾT
          </h2>
          <span className="text-xs text-zinc-500 font-mono font-bold">6 BƯỚC HOÀN CHỈNH</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step) => (
            <div
              key={step.num}
              className="bg-zinc-950 border border-zinc-800/80 hover:border-pink-500/40 rounded-2xl p-5 transition-all space-y-3 flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400 font-mono">
                    {step.num}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono border uppercase tracking-wider ${step.badgeColor}`}>
                    {step.badge}
                  </span>
                </div>

                <h3 className="font-extrabold text-white text-base group-hover:text-pink-400 transition-colors">
                  {step.title}
                </h3>

                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                  {step.desc}
                </p>
              </div>

              {step.actionText && (
                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-pink-400 text-[11px] truncate">{step.actionText}</span>
                  <button
                    onClick={() => copyToClipboard(step.actionText!, step.copyType!)}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg transition-colors flex items-center gap-1 font-mono text-[10px] flex-shrink-0 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Sao chép</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer Callout */}
      <div className="bg-gradient-to-r from-pink-950/40 via-zinc-900 to-pink-950/40 border border-pink-500/30 rounded-3xl p-6 text-center space-y-4">
        <h3 className="text-lg font-black text-white uppercase tracking-wider">
          BẠN ĐÃ CÓ KEY PROXY VÀ SẴN SÀNG KÍCH HOẠT CHƯA?
        </h3>
        <p className="text-xs text-zinc-400 max-w-lg mx-auto">
          Bấm ngay vào nút bên dưới để chuyển sang trang kích hoạt chính thức. Nếu cần hỗ trợ trực tiếp, vui lòng liên hệ Admin qua hòm thư hỗ trợ!
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href={ACTIVATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-xs rounded-xl shadow-[0_0_20px_rgba(219,39,119,0.4)] transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <span>TRUY CẬP CHUNCHUCHE.IO.VN</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

    </div>
  );
}
