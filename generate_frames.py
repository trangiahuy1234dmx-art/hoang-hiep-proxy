import os
import subprocess

# Define the 8 key frames matching the user's uploaded video
slides = [
    {
        "step": "BƯỚC 1: SAO CHÉP LINK & KEY TỪ MESSENGER",
        "app": "MESSENGER CHAT",
        "desc": "Mở Messenger, sao chép link chunchuche.io.vn/v2/activate.php và Access Key [BCE1FAB8E2]",
        "mock_ui": [
            ("MESSENGER - Hiếu, Duy", "text-zinc-400"),
            ("🔗 https://chunchuche.io.vn/v2/activate.php", "text-pink-400"),
            ("🔑 Access Key: BCE1FAB8E2", "text-amber-300"),
            ("👤 Game UID: 15761653447", "text-cyan-300"),
            ("👉 Nhấn giữ để 'Sao Chép' link", "text-emerald-400")
        ]
    },
    {
        "step": "BƯỚC 2: MỞ SAFARI & KIỂM TRA KEY",
        "app": "TRÌNH DUYỆT SAFARI (IPHONE)",
        "desc": "Bắt buộc mở bằng Safari trên iPhone, dán link chunchuche.io.vn/v2/activate.php",
        "mock_ui": [
            ("SAFARI - chunchuche.io.vn/v2/activate.php", "text-pink-400"),
            ("ACCESS KEY: [ BCE1FAB8E2 ]", "text-amber-300"),
            ("BẤM [ KIỂM TRA KEY ]", "text-emerald-400"),
            ("✅ Kết quả: Hạn 30 ngày - VPN AimDrag", "text-white"),
            ("🌐 Server IP: 180.93.32.64 : 1700", "text-cyan-300")
        ]
    },
    {
        "step": "BƯỚC 3: SAO CHÉP UID TỪ FREE FIRE MAX",
        "app": "FREE FIRE MAX (GAME LOBBY)",
        "desc": "Bắt buộc dùng bản Free Fire MAX, bấm Hồ Sơ cá nhân sao chép UID (Ví dụ: 15761653447)",
        "mock_ui": [
            ("FREE FIRE MAX - GARENA", "text-rose-500"),
            ("👤 Tên NV: dinhkhanh2ler9", "text-white"),
            ("🆔 UID: 15761653447", "text-amber-300"),
            ("👉 Đã sao chép UID tài khoản game!", "text-emerald-400")
        ]
    },
    {
        "step": "BƯỚC 4: KÍCH HOẠT & TẢI FILE .MOBILECONFIG",
        "app": "SAFARI - KÍCH HOẠT KEY",
        "desc": "Dán UID vào Safari -> Bấm 'Kích Hoạt' -> Bấm 'Tải .mobileconfig' -> Chọn 'Cho Phép'",
        "mock_ui": [
            ("UID: 15761653447", "text-cyan-300"),
            ("BẤM [ KÍCH HOẠT ] -> Kích hoạt thành công!", "text-emerald-400"),
            ("BẤM [ TẢI .MOBILECONFIG ]", "text-pink-400"),
            ("📲 Thông báo: 'Cho phép tải về hồ sơ cấu hình?'", "text-amber-300"),
            ("👉 Chọn [ CHO PHÉP ] -> Chọn [ ĐÓNG ]", "text-white")
        ]
    },
    {
        "step": "BƯỚC 5: CÀI HỒ SƠ VPN & BẬT TIN CẬY CHỨNG NHẬN",
        "app": "CÀI ĐẶT IPHONE (SETTINGS)",
        "desc": "Cài đặt -> Cài đặt chung -> Quản lý VPN & Thiết bị -> Cài đặt CHUNCHUCHE VIP",
        "mock_ui": [
            ("⚙️ Cài Đặt Chung -> Quản lý VPN & Thiết bị", "text-white"),
            ("📁 Hồ sơ đã tải về: CHUNCHUCHE VIP", "text-pink-400"),
            ("🔑 Bấm [ CÀI ĐẶT ] -> Nhập Passcode iPhone", "text-amber-300"),
            ("⚙️ Cài Đặt Chung -> Giới Thiệu -> Cài đặt tin cậy chứng nhận", "text-white"),
            ("✅ Bật gạt XANH: ProxyPin CA / mitmproxy -> Chọn [ TIẾP TỤC ]", "text-emerald-400")
        ]
    },
    {
        "step": "BƯỚC 6: CẤU HÌNH PROXY WI-FI THỦ CÔNG",
        "app": "CÀI ĐẶT WI-FI (WLAN)",
        "desc": "Cài Đặt -> Wi-Fi -> Bấm (i) Wi-Fi đang dùng -> Kéo xuống Định cấu hình proxy",
        "mock_ui": [
            ("📶 Wi-Fi: Thu thao (Nhấn nút i)", "text-white"),
            ("🌐 Định cấu hình proxy -> Chọn [ THỦ CÔNG ]", "text-cyan-300"),
            ("🖥️ Máy chủ: 180.93.32.64", "text-amber-300"),
            ("🔌 Cổng (Port): 1700", "text-pink-400"),
            ("👉 Bấm [ LƯU ] ở góc trên bên phải", "text-emerald-400")
        ]
    },
    {
        "step": "BƯỚC 7: MỞ GAME & XỬ LÝ LỖI MÁY CHỦ 400",
        "app": "FREE FIRE MAX -> LỖI 400 DỰ KIẾN",
        "desc": "Mở Free Fire MAX -> Hiện 'Đăng nhập máy chủ thất bại 400' -> Tắt Proxy Wi-Fi",
        "mock_ui": [
            ("🎮 Mở Free Fire MAX", "text-white"),
            ("⚠️ Hiện thông báo: 'Đăng nhập máy chủ thất bại 400'", "text-amber-400"),
            ("💡 Đây là tín hiệu đã ăn Proxy thành công!", "text-emerald-400"),
            ("⚙️ Quay lại Cài đặt Wi-Fi -> Proxy -> Chọn [ TẮT ] -> Bấm [ LƯU ]", "text-pink-400"),
            ("🔁 Vào lại game -> Hệ thống tự động kết nối lại", "text-cyan-300")
        ]
    },
    {
        "step": "BƯỚC 8: VÀO GAME & TRẢI NGHIỆM AIM PROXY FULL ĐỎ",
        "app": "FREE FIRE MAX - TRƯỜNG TẬP BẮN",
        "desc": "Vào Huấn luyện / Đấu hạng -> Kéo tâm Full Đỏ mượt mà không bị văng!",
        "mock_ui": [
            ("🎯 Trạng thái: Activated Successfully (AimDrag)", "text-emerald-400"),
            ("🔥 Expire: 30 ngày (CHUNCHUCHE VIP)", "text-pink-400"),
            ("💥 Kéo tâm bắn: 100% ĐẦU / FULL ĐỎ!", "text-rose-400"),
            ("👑 ĐÃ HOÀN TẤT CÀI ĐẶT CỰC KỲ ĐƠN GIẢN!", "text-amber-300")
        ]
    }
]

os.makedirs("frames", exist_ok=True)

for i, slide in enumerate(slides):
    svg_filename = f"frames/frame_{i+1:02d}.svg"
    png_filename = f"frames/frame_{i+1:02d}.png"
    
    ui_lines_svg = ""
    for j, (line_text, color_cls) in enumerate(slide["mock_ui"]):
        color_code = "#ffffff"
        if "pink" in color_cls: color_code = "#f472b6"
        elif "amber" in color_cls: color_code = "#fbbf24"
        elif "emerald" in color_cls: color_code = "#34d399"
        elif "cyan" in color_cls: color_code = "#38bdf8"
        elif "rose" in color_cls: color_code = "#f43f5e"
        
        y_pos = 280 + j * 55
        ui_lines_svg += f'''
        <rect x="240" y="{y_pos - 38}" width="800" height="44" rx="10" fill="#18181b" stroke="#27272a" stroke-width="1.5"/>
        <text x="260" y="{y_pos - 10}" fill="{color_code}" font-family="Arial, sans-serif" font-size="20" font-weight="bold">{line_text}</text>
        '''

    svg_content = f'''<svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
  <rect width="1280" height="720" fill="#09090b"/>
  
  <!-- Subtle background glow -->
  <circle cx="1000" cy="150" r="300" fill="#ec4899" opacity="0.12"/>
  <circle cx="200" cy="600" r="250" fill="#3b82f6" opacity="0.1"/>

  <!-- Top Header Frame -->
  <rect x="40" y="30" width="1200" height="110" rx="20" fill="#18181b" stroke="#ec4899" stroke-width="2"/>
  <text x="70" y="70" fill="#ec4899" font-family="Arial, sans-serif" font-size="16" font-weight="bold" letter-spacing="2">SHOP HOÀNG HIỆP • HƯỚNG DẪN CÀI ĐẶT AIM PROXY</text>
  <text x="70" y="110" fill="#ffffff" font-family="Arial, sans-serif" font-size="30" font-weight="900">{slide["step"]}</text>
  
  <rect x="980" y="55" width="230" height="40" rx="12" fill="#ec4899" opacity="0.2" stroke="#ec4899" stroke-width="1.5"/>
  <text x="1000" y="81" fill="#f472b6" font-family="Arial, sans-serif" font-size="14" font-weight="bold">TRÌNH CHIẾU VIDEO {i+1}/8</text>

  <!-- iPhone Mockup Card Container -->
  <rect x="200" y="160" width="880" height="480" rx="24" fill="#0c0c0e" stroke="#3f3f46" stroke-width="2"/>
  
  <!-- Sub-header bar inside phone card -->
  <rect x="200" y="160" width="880" height="50" rx="24" fill="#18181b"/>
  <circle cx="230" cy="185" r="6" fill="#ef4444"/>
  <circle cx="250" cy="185" r="6" fill="#f59e0b"/>
  <circle cx="270" cy="185" r="6" fill="#10b981"/>
  <text x="300" y="191" fill="#a1a1aa" font-family="Arial, sans-serif" font-size="16" font-weight="bold">📱 GIAO DIỆN IPHONE: {slide["app"]}</text>

  <!-- Mock UI lines -->
  {ui_lines_svg}

  <!-- Description Banner at bottom -->
  <rect x="240" y="570" width="800" height="50" rx="12" fill="#27272a" stroke="#ec4899" stroke-width="1"/>
  <text x="260" y="601" fill="#f472b6" font-family="Arial, sans-serif" font-size="16" font-weight="bold">💡 Ghi chú: {slide["desc"]}</text>

  <!-- Bottom Brand Footer -->
  <text x="640" y="685" text-anchor="middle" fill="#71717a" font-family="Arial, sans-serif" font-size="14" font-weight="bold">Website Kích Hoạt: chunchuche.io.vn/v2/activate.php • Hỗ trợ 24/7 Shop Hoàng Hiệp</text>
</svg>'''

    with open(svg_filename, "w", encoding="utf-8") as f:
        f.write(svg_content)
        
    # Convert SVG to PNG using ImageMagick
    subprocess.run(["convert", svg_filename, png_filename], check=True)
    print(f"Generated {png_filename}")

print("All frame images created successfully.")
