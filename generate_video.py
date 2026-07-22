import os
import subprocess

os.makedirs("public/frames", exist_ok=True)

slides = [
    {
        "num": "01",
        "title": "Buoc 1: Sao chep Link va Key tu Messenger",
        "subtitle": "Mess: Hieu, Duy | Key: BCE1FAB8E2 | UID: 15761653447",
        "items": [
            "[1] Messenger Chat: Hieu, Duy",
            "[2] Link kich hoat: https://chunchuche.io.vn/v2/activate.php",
            "[3] Access Key: BCE1FAB8E2 (30 ngay VIP)",
            "[4] Game UID: 15761653447",
            "--> Nhan giu tin nhan de Sao Chep Link & Key!"
        ]
    },
    {
        "num": "02",
        "title": "Buoc 2: Mo Safari -> Kiem Tra Access Key",
        "subtitle": "Bat buoc dung Safari tren iPhone / iPad",
        "items": [
            "[1] Mo trinh duyet Safari tren iPhone",
            "[2] Dan link: chunchuche.io.vn/v2/activate.php",
            "[3] Nhap Access Key: BCE1FAB8E2",
            "[4] Bam nut [ KIEM TRA KEY ]",
            "--> VPN Info: AimDrag 180.93.32.64:1700 (1/1 slot)"
        ]
    },
    {
        "num": "03",
        "title": "Buoc 3: Sao chep UID trong Free Fire MAX",
        "subtitle": "Bat buoc dung phien ban Free Fire MAX",
        "items": [
            "[1] Mo ung dung Free Fire MAX tren iPhone",
            "[2] Bam vao Ho So Ca Nhan o goc tren ben trai",
            "[3] Nhan icon Sao Chep UID (Vi du: 15761653447)",
            "[4] Ten tai khoan game: dinhkhanh2ler9",
            "--> Quay lai Safari de chuan bi Kich Hoat!"
        ]
    },
    {
        "num": "04",
        "title": "Buoc 4: Nhap UID & Tai File .mobileconfig",
        "subtitle": "Trang kich hoat CHUNCHUCHE - Step 2 & 3",
        "items": [
            "[1] Dan UID 15761653447 vao o UID (TAI KHOAN GAME)",
            "[2] Bam nut [ KICH HOAT ] -> Thong bao Kich hoat thanh cong!",
            "[3] Bam nut [ TAI .MOBILECONFIG ]",
            "[4] System Modal: Cho phep tai ve ho so cau hinh?",
            "--> Bam [ CHO PHEP ] -> Bam [ DONG ]"
        ]
    },
    {
        "num": "05",
        "title": "Buoc 5: Cai dat VPN Profile & Bat Tin Cay Certificate",
        "subtitle": "Cai Dat iPhone -> Quan ly VPN & Thiet bi",
        "items": [
            "[1] Cai Dat -> Cai Dat Chung -> Quan ly VPN & Thiet bi",
            "[2] Chon ho so: CHUNCHUCHE VIP - BCE1FAB8E2 -> Bam [ CAI DAT ]",
            "[3] Nhap Mat Ma Passcode iPhone -> Bam [ CAI DAT ]",
            "[4] Cai Dat Chung -> Gioi Thieu -> Cai dat tin cay chung nhan",
            "--> Bat gat XANH cho ProxyPin CA & mitmproxy -> Bam [ TIEP TUC ]"
        ]
    },
    {
        "num": "06",
        "title": "Buoc 6: Cau hinh Wi-Fi Proxy Thu Cong",
        "subtitle": "Wi-Fi (WLAN) -> Thu thao -> Dinh cau hinh proxy",
        "items": [
            "[1] Cai Dat -> Wi-Fi -> Bam nut (i) ben canh ten Wi-Fi",
            "[2] Keo xuong cuoi trang -> Dinh cau hinh proxy",
            "[3] Chon che do [ THU CONG ]",
            "[4] Nhap May chu: 180.93.32.64 | Cong: 1700",
            "--> Bam nut [ LUU ] o goc tren ben phai"
        ]
    },
    {
        "num": "07",
        "title": "Buoc 7: Mo Game -> Fix Loi May Chu 400",
        "subtitle": "Loi 400 la tin hieu DA AN PROXY thanh cong!",
        "items": [
            "[1] Mo Free Fire MAX -> Hien: Dang nhap may chu that bai 400",
            "[2] Tin hieu hoan hao! Proxy da bat duoc traffic game",
            "[3] Quay lai Cai dat Wi-Fi -> Dinh cau hinh proxy",
            "[4] Chon che do [ TAT ] -> Bam nut [ LUU ]",
            "--> Mo lai Free Fire MAX -> Tu dong ket noi lai!"
        ]
    },
    {
        "num": "08",
        "title": "Buoc 8: Full Red Aim Proxy Activated Successfully!",
        "subtitle": "Experience AimDrag Pull Headshot - Shop Hoang Hiep",
        "items": [
            "[1] Screen Display: Activated Successfully (AimDrag)",
            "[2] Proxy IP: 180.93.32.64:1700 | Expire: 30 ngay",
            "[3] Keo tam Truong Tap Ban: 100% KEO TAM FULL DO!",
            "[4] Khong bi vang game, khong bi lag ping!",
            "--> CHUC CAC BAN CHOI GAME VUI VE & CHIEN THANG!"
        ]
    }
]

for i, s in enumerate(slides):
    img_path = f"public/frames/step_{i+1:02d}.png"
    
    # Build ImageMagick command
    cmd = [
        "convert",
        "-size", "1280x720",
        "xc:#09090b",
        # Top background box
        "-fill", "#18181b", "-draw", "roundrectangle 40,30 1240,130 16,16",
        "-stroke", "#ec4899", "-strokewidth", "2", "-draw", "roundrectangle 40,30 1240,130 16,16",
        # Top text
        "-pointsize", "16", "-fill", "#ec4899", "-stroke", "none",
        "-draw", f"text 60,65 'SHOP HOANG HIEP - VIDEO HUONG DAN CAI AIM PROXY (FRAME {i+1}/8)'",
        "-pointsize", "28", "-fill", "#ffffff",
        "-draw", f"text 60,108 \"{s['title']}\"",
        
        # Phone mockup container frame
        "-fill", "#0c0c0e", "-stroke", "#3f3f46", "-strokewidth", "2",
        "-draw", "roundrectangle 160,155 1120,630 20,20",
        
        # Phone header bar
        "-fill", "#18181b", "-stroke", "none",
        "-draw", "roundrectangle 160,155 1120,205 20,20",
        "-fill", "#ef4444", "-draw", "circle 190,180 190,186",
        "-fill", "#f59e0b", "-draw", "circle 210,180 210,186",
        "-fill", "#10b981", "-draw", "circle 230,180 230,186",
        "-pointsize", "16", "-fill", "#f472b6",
        "-draw", f"text 255,186 \"{s['subtitle']}\"",
    ]
    
    # Draw item text boxes
    for idx, item in enumerate(s["items"]):
        y_top = 225 + idx * 75
        y_bottom = y_top + 60
        text_y = y_top + 38
        
        item_bg = "#18181b"
        text_color = "#ffffff"
        border_color = "#27272a"
        
        if "-->" in item or "SUCCESS" in item.upper() or "FULL DO" in item.upper():
            item_bg = "#064e3b"
            text_color = "#34d399"
            border_color = "#059669"
        elif "VIP" in item or "BCE1FAB8E2" in item or "PROXIPIN" in item.upper():
            item_bg = "#831843"
            text_color = "#f472b6"
            border_color = "#db2777"
            
        cmd.extend([
            "-fill", item_bg, "-stroke", border_color, "-strokewidth", "1",
            "-draw", f"roundrectangle 190,{y_top} 1090,{y_bottom} 12,12",
            "-pointsize", "19", "-fill", text_color, "-stroke", "none",
            "-draw", f"text 215,{text_y} \"{item}\""
        ])
        
    # Footer info text
    cmd.extend([
        "-pointsize", "15", "-fill", "#a1a1aa", "-stroke", "none",
        "-draw", "text 320,680 'Kich hoat chinh thuc tai: https://chunchuche.io.vn/v2/activate.php'"
    ])
    
    cmd.append(img_path)
    subprocess.run(cmd, check=True)
    print(f"Created slide image: {img_path}")

# Concat file list
concat_file = "public/frames/concat_list.txt"
with open(concat_file, "w") as f:
    for i in range(1, 9):
        f.write(f"file 'step_{i:02d}.png'\n")
        f.write("duration 10\n")
    f.write("file 'step_08.png'\n")

ffmpeg_cmd = [
    "ffmpeg", "-y",
    "-f", "concat", "-safe", "0", "-i", concat_file,
    "-f", "lavfi", "-i", "sine=frequency=523:duration=80",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "25",
    "-c:a", "aac", "-b:a", "128k",
    "public/video_guide.mp4"
]

subprocess.run(ffmpeg_cmd, check=True)
print("Successfully generated public/video_guide.mp4!")
