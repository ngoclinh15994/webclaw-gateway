# WebClaw Hybrid Engine 🚀

[English](./README.md) | Tiếng Việt

**Cầu nối web scraping privacy-first tối ưu cho AI agents.**

WebClaw chạy hoàn toàn trên máy của bạn: kiến trúc **zero-Docker**, **NPM-native** (Node.js) giúp chuyển trang web thành **Markdown sạch** cho LLM, không đẩy HTML thô hoặc ngữ cảnh duyệt web lên dịch vụ scraping bên thứ ba.

---

## Khởi động nhanh (1 lệnh)

```bash
npx webclaw-hybrid-engine-ln
```

Đợi terminal hiển thị **Ready on port 58822**, sau đó mở dashboard tại **http://localhost:58822**.

- **100% Node.js native** — không cần Docker.
- **Privacy-first** — quá trình fetch, render và chuyển Markdown diễn ra **cục bộ** trên máy của bạn.

---

## Chạy nền 24/7

Để chạy WebClaw 24/7 với PM2:

```bash
npm install -g webclaw-hybrid-engine-ln
pm2 start webclaw-hybrid-engine-ln --name "webclaw"
pm2 save
```

---

## Lệnh quản lý

| Lệnh | Mục đích |
|------|----------|
| `pm2 status webclaw` | Kiểm tra tiến trình **webclaw** có đang chạy không |
| `pm2 stop webclaw` | Dừng engine (không xóa khỏi danh sách PM2) |
| `pm2 restart webclaw` | Khởi động lại engine (ví dụ sau khi cập nhật) |
| `pm2 delete webclaw` | Xóa tiến trình **webclaw** khỏi PM2 |

Xem log: `pm2 logs webclaw`.

---

## Cài đặt OpenClaw Skill

### ⚙️ Cách cài OpenClaw Skill

Chúng tôi cung cấp Local Dashboard 1-click đẹp mắt để cài skill tự động, không cần thao tác tay với đường dẫn thư mục.

**Bước 1: Khởi động WebClaw**  
Đảm bảo engine đang chạy (bằng `npx` hoặc `pm2`).

```bash
npx webclaw-hybrid-engine-ln
```

**Bước 2: Mở Local Dashboard**  
Mở trình duyệt và truy cập: `http://localhost:58822`

**Bước 3: Cài đặt qua UI**

Nhấn nút màu vàng "Cài đặt Skill OpenClaw" ở góc trên bên phải dashboard.

Một popup sẽ hiện ra, tự động nhận diện hệ điều hành và thư mục skills của OpenClaw.

Nhấn "Xác nhận Cài đặt".

🟢 Khởi động lại OpenClaw agent. Tool `webclaw-hybrid-engine-ln` đã sẵn sàng để sử dụng!

---

## Vì sao chọn WebClaw?

- **Hybrid engine** — tự động chuyển giữa **Cheerio** (nhanh cho static) và **Playwright** (dynamic/SPAs), chạy trên [Crawlee](https://crawlee.dev/).
- **Privacy-first** — dữ liệu scraping, render và Markdown extraction nằm trên máy bạn.
- **Token-efficient** — trả về Markdown sạch, giảm nhiễu khi đưa vào LLM (thường tiết kiệm đáng kể token so với HTML thô).

---

## API & dashboard

- **Scrape:** `POST http://localhost:58822/api/v1/scrape` với body JSON `{"url": "<url>", "mode": "auto"}` (tùy chọn `extract_mode`: `article` | `ecommerce`).
- **Health:** `GET http://localhost:58822/health`
- **Dashboard:** **http://localhost:58822** — history, stats, cookies, exclude URLs, OpenClaw skill installer.
- **API docs (EN):** [`API.md`](./API.md)
- **API docs (VI):** [`API.vi.md`](./API.vi.md)

---

## Yêu cầu

- **Node.js 20+**
- **npm** (để dùng `npx`)

---

## License

Phát hành theo [MIT License](https://opensource.org/licenses/MIT).

---

## Repository

**https://github.com/ngoclinh15994/webclaw-gateway**
