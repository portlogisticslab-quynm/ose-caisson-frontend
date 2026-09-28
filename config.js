// config.js - địa chỉ backend API
//
// Sau khi tạo dịch vụ trên Render, thay RENDER_BACKEND bằng địa chỉ Render cấp,
// ví dụ "https://ose-caisson-backend.onrender.com" (không có dấu / ở cuối).
const RENDER_BACKEND = "https://ose-caisson-backend.onrender.com";
const LOCAL_BACKEND = "http://127.0.0.1:8000";

// Chọn địa chỉ API theo nơi đang mở giao diện:
//  - mở từ chính backend (cổng 8000 hoặc trang Render)  -> gọi cùng địa chỉ
//  - mở trên máy cá nhân ở cổng khác (vd. 5500)        -> gọi backend cục bộ
//  - mở từ Cloudflare Pages hoặc nơi khác              -> gọi backend Render
(function () {
  const here = location.origin;
  const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
  if (here === LOCAL_BACKEND || here === RENDER_BACKEND) window.API_BASE = "";
  else if (isLocal) window.API_BASE = LOCAL_BACKEND;
  else window.API_BASE = RENDER_BACKEND;
})();
