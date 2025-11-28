require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Import Models & Routes
const notificationModel = require("./backend/models/notification.model");
const apiRoutes = require("./backend/routes");
const attachmentRoutes = require("./backend/routes/attachment.routes"); // <--- 1. IMPORT ROUTE ATTACHMENT

// Swagger
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./backend/config/swagger");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. LOGGING (Để debug)
app.use((req, res, next) => {
  if (!req.path.includes("_next") && !req.path.includes("static")) {
    console.log(`[REQUEST] ${req.method} ${req.path}`);
  }
  next();
});

// ==========================================
// 2. CẤU HÌNH CHO FILE UPLOAD (QUAN TRỌNG)
// ==========================================
// Mở quyền truy cập thư mục 'uploads' để xem ảnh
// Ví dụ: http://localhost/uploads/anh.jpg
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==========================================
// 3. API ROUTES
// ==========================================
app.use("/api/v1/attachments", attachmentRoutes); // <--- Đăng ký API Upload
app.use("/api/v1", apiRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==========================================
// 4. MIDDLEWARE PHỤC VỤ FRONTEND (STATIC)
// ==========================================
app.use((req, res, next) => {
  // Bỏ qua API và uploads
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads"))
    return next();

  const publicFolder = path.join(__dirname, "public");

  let cleanPath = req.path;
  if (cleanPath.endsWith("/") && cleanPath.length > 1) {
    cleanPath = cleanPath.slice(0, -1);
  }

  if (cleanPath === "/") cleanPath = "/index.html";

  const fullPath = path.join(publicFolder, cleanPath);

  // CASE A: Tìm file chính xác
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    return res.sendFile(fullPath);
  }

  // CASE B: Tìm file .html
  const htmlPath = fullPath + ".html";
  if (fs.existsSync(htmlPath)) {
    // console.log(`   -> Serving HTML: ${cleanPath}.html`);
    return res.sendFile(htmlPath);
  }

  // CASE C: Tìm index.html trong folder
  const folderIndexPath = path.join(fullPath, "index.html");
  if (fs.existsSync(folderIndexPath)) {
    return res.sendFile(folderIndexPath);
  }

  next();
});

app.use(express.static(path.join(__dirname, "public")));

// ==========================================
// 5. CATCH-ALL (Xử lý 404 & F5 Refresh)
// ==========================================
app.get(/.*/, (req, res) => {
  // Tránh trả về HTML cho các file hệ thống bị thiếu
  if (
    req.path.includes("_next") ||
    req.path.endsWith(".txt") ||
    req.path.endsWith(".json")
  ) {
    return res.status(404).send("Not found");
  }

  const notFoundPath = path.join(__dirname, "public", "404.html");
  const indexPath = path.join(__dirname, "public", "index.html");

  if (fs.existsSync(indexPath)) {
    // console.log('   -> Fallback to index.html');
    res.sendFile(indexPath);
  } else {
    res.status(404).send("404 Not Found");
  }
});

// ==========================================
// 6. CRON JOBS (Tác vụ chạy ngầm)
// ==========================================
// Chạy mỗi 60 giây: Kiểm tra task quá hạn
setInterval(() => {
  notificationModel.checkOverdueTasks();
}, 60000);

// Chạy mỗi 24 giờ: Xóa thông báo cũ
setInterval(
  () => {
    console.log("Running cron: Cleanup old notifications...");
    notificationModel.deleteOldNotifications();
  },
  24 * 60 * 60 * 1000
);

// Gọi dọn dẹp ngay khi khởi động
notificationModel.deleteOldNotifications();

app.listen(port, (err) => {
  if (err) throw err;
  console.log(`> Server đang chạy tại http://localhost:${port}`);
  console.log(`> API Docs tại http://localhost:${port}/api-docs`);
});
