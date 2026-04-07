# Tài liệu API WebClaw Hybrid Engine

[English](./API.md) | [Tiếng Việt](./API.vi.md)

Base URL (local): `http://localhost:58822`

Tài liệu này liệt kê đầy đủ các API hiện được WebClaw Hybrid Engine hỗ trợ để tích hợp.

---

## Quy ước chung

- Content-Type cho các API POST JSON: `Content-Type: application/json`
- Dạng thành công: thường có `"status": "success"`
- Dạng lỗi: thường có `"status": "error"` và `"message"`

---

## Health Check

### GET `/health`
Kiểm tra nhanh dịch vụ còn hoạt động hay không.

**Response**
```json
{
  "status": "ok"
}
```

---

## API Cào dữ liệu (Scraping)

### POST `/api/v1/scrape`
API chính để đọc URL và chuyển về Markdown sạch.

**Request body**
```json
{
  "url": "https://example.com/article",
  "mode": "auto",
  "extract_mode": "article"
}
```

**Các trường**
- `url` (string, bắt buộc): URL mục tiêu
- `mode` (string, tùy chọn): `auto` | `fast_only` | `playwright_only` (mặc định `auto`)
- `extract_mode` (string, tùy chọn): `article` | `ecommerce` (mặc định `article`)

**Response thành công (ví dụ)**
```json
{
  "status": "success",
  "engine_used": "crawlee_cheerio",
  "data": {
    "title": "Page title",
    "markdown": "# Clean Markdown output..."
  },
  "metrics": {
    "raw_tokens": 12345,
    "cleaned_tokens": 2345,
    "tokens_saved": 10000,
    "reduction_percentage": 81.0
  }
}
```

**Các lỗi thường gặp**
- `400`: thiếu `url`
- `400`: `mode` không hợp lệ
- `400`: `extract_mode` không hợp lệ
- `400`: URL bị chặn bởi settings (`EXCLUDED_BY_USER`)
- `500`: lỗi runtime trong pipeline crawler

---

## Lịch sử & Thống kê

### GET `/api/v1/history`
Trả về lịch sử scrape có phân trang.

**Query params**
- `limit` (tùy chọn): mặc định `50`, min `1`, max `200`
- `offset` (tùy chọn): mặc định `0`

**Ví dụ**
`GET /api/v1/history?limit=20&offset=0`

**Response (ví dụ)**
```json
{
  "status": "success",
  "items": [],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 0
  }
}
```

### GET `/api/v1/stats`
Trả về thống kê tổng hợp về token saving.

**Response (ví dụ)**
```json
{
  "status": "success",
  "stats": {
    "total_requests": 0,
    "total_tokens_saved": 0,
    "overall_reduction_percentage": 0
  }
}
```

---

## Tích hợp OpenClaw

### GET `/api/v1/integrate/openclaw/status`
Kiểm tra thư mục OpenClaw và trạng thái cài skill hiện tại.

**Response (ví dụ)**
```json
{
  "status": "success",
  "installed": false,
  "openclawRootExists": true
}
```

### POST `/api/v1/integrate/openclaw`
Cài skill tự động vào vị trí OpenClaw mặc định.

**Response thành công**
```json
{
  "status": "success",
  "message": "WebClaw Skill successfully installed into OpenClaw!"
}
```

**Response khi chưa có OpenClaw**
```json
{
  "status": "error",
  "message": "OpenClaw is not installed on this machine."
}
```

### GET `/api/v1/system-info`
Trả về thông tin hệ điều hành + đường dẫn gợi ý để cài skill qua giao diện UI.

**Response (ví dụ)**
```json
{
  "status": "success",
  "osType": "Windows",
  "suggestedSkillPath": "C:\\Users\\<ban>\\.openclaw\\skills\\webclaw-hybrid-engine-ln",
  "isOpenClawInstalled": true
}
```

### POST `/api/v1/install-skill`
Cài `SKILL.md` vào đường dẫn tùy chọn (qua UI installer).

**Request body**
```json
{
  "targetPath": "C:\\Users\\<ban>\\.openclaw\\skills\\webclaw-hybrid-engine-ln"
}
```

**Hành vi**
- Validate `targetPath` là đường dẫn tuyệt đối
- Giới hạn đường dẫn nằm trong `.openclaw` để an toàn
- Tự tạo thư mục nếu chưa có
- Ghi nội dung template ra file `SKILL.md`

**Response thành công**
```json
{
  "status": "success",
  "message": "Skill installed successfully. Please restart OpenClaw.",
  "targetPath": "C:\\Users\\<ban>\\.openclaw\\skills\\webclaw-hybrid-engine-ln\\SKILL.md"
}
```

---

## Settings (Danh sách URL loại trừ)

### GET `/api/v1/settings`
Lấy cấu hình hiện tại.

**Response**
```json
{
  "status": "success",
  "settings": {
    "exclude_urls": []
  }
}
```

### POST `/api/v1/settings`
Cập nhật cấu hình.

**Request body**
```json
{
  "exclude_urls": ["youtube.com", "example.org"]
}
```

**Validation**
- `exclude_urls` phải là mảng

---

## Cookies

### GET `/api/v1/cookies`
Lấy danh sách cookies đã lưu.

**Response**
```json
{
  "status": "success",
  "cookies": []
}
```

### POST `/api/v1/cookies`
Lưu danh sách cookie phục vụ pipeline scraping.

**Request body**
```json
{
  "cookies": [
    {
      "domain": "example.com",
      "cookie_string": "a=1; b=2"
    }
  ]
}
```

**Response**
```json
{
  "status": "success",
  "count": 1
}
```

---

## Ví dụ tích hợp nhanh

```bash
curl -X POST "http://localhost:58822/api/v1/scrape" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://example.com\",\"mode\":\"auto\"}"
```

Dashboard: `http://localhost:58822`
