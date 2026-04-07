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

## Chạy nền (set & forget)

Để engine chạy nền và tự khởi động lại sau reboot, dùng [PM2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2
pm2 start npx --name "webclaw" -- webclaw-hybrid-engine-ln
pm2 save && pm2 startup
```

Làm theo hướng dẫn in ra từ `pm2 startup` để hoàn tất cấu hình startup một lần.

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

## Tích hợp OpenClaw

Cài skill đã publish cho OpenClaw / ClawHub:

```bash
clawhub install webclaw-hybrid-engine-ln
```

Skill sẽ gọi về **http://localhost:58822**. Vì vậy engine bắt buộc phải chạy (foreground `npx` hoặc PM2 `webclaw`) trên port **58822** trước khi agent scrape.

Bạn cũng có thể cài skill qua dashboard local (**Install OpenClaw Skill**) hoặc API `POST /api/v1/integrate/openclaw`.

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
