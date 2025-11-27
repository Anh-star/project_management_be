// index.js (Backend)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const notificationModel = require('./backend/models/notification.model');
// Import API
const apiRoutes = require('./backend/routes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./backend/config/swagger');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. LOGGING (Để debug)
app.use((req, res, next) => {
    // Chỉ log các request trang chính để đỡ rối
    if (!req.path.includes('_next') && !req.path.includes('static')) {
        console.log(`[REQUEST] ${req.method} ${req.path}`);
    }
    next();
});

// 2. API & SWAGGER
app.use('/api/v1', apiRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 3. MIDDLEWARE TÙY CHỈNH ĐỂ PHỤC VỤ FILE TĨNH
app.use((req, res, next) => {
    // Bỏ qua API
    if (req.path.startsWith('/api')) return next();

    const publicFolder = path.join(__dirname, 'public');
    
    // --- XỬ LÝ ĐƯỜNG DẪN (QUAN TRỌNG) ---
    let cleanPath = req.path;

    // 1. Loại bỏ dấu '/' ở cuối nếu có (ví dụ: /users/ -> /users)
    if (cleanPath.endsWith('/') && cleanPath.length > 1) {
        cleanPath = cleanPath.slice(0, -1);
    }
    
    // 2. Nếu là trang chủ
    if (cleanPath === '/') cleanPath = '/index.html';

    const fullPath = path.join(publicFolder, cleanPath);

    // --- KIỂM TRA FILE ---

    // CASE A: Tìm file chính xác (vd: style.css, script.js, index.html)
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        return res.sendFile(fullPath);
    }

    // CASE B: Tìm file .html (vd: /dashboard -> dashboard.html)
    const htmlPath = fullPath + '.html';
    if (fs.existsSync(htmlPath)) {
        console.log(`   -> Serving HTML: ${cleanPath}.html`); // Log để kiểm tra
        return res.sendFile(htmlPath);
    }

    // CASE C: Tìm index.html trong folder (vd: /dashboard -> dashboard/index.html)
    const folderIndexPath = path.join(fullPath, 'index.html');
    if (fs.existsSync(folderIndexPath)) {
        return res.sendFile(folderIndexPath);
    }

    next();
});

// 4. PHỤC VỤ CÁC FILE CÒN LẠI (Ảnh, font, _next...)
app.use(express.static(path.join(__dirname, 'public')));

// 5. CATCH-ALL (Xử lý 404 & Refresh trang)
// Sử dụng Regex /.*/ thay vì '*'
app.get(/.*/, (req, res) => {
    // Nếu request là file nội bộ Next.js (.txt, .json) mà không tìm thấy
    // thì trả về 404 chuẩn (không trả về HTML để tránh lỗi console đỏ lòm)
    if (req.path.includes('_next') || req.path.endsWith('.txt') || req.path.endsWith('.json')) {
        return res.status(404).send('Not found');
    }

    const notFoundPath = path.join(__dirname, 'public', '404.html');
    const indexPath = path.join(__dirname, 'public', 'index.html');

    // Nếu tìm không thấy, trả về index.html để React Router xử lý (cho phép F5 ở trang con)
    if (fs.existsSync(indexPath)) {
        console.log('   -> Fallback to index.html');
        res.sendFile(indexPath);
    } else {
        res.status(404).send('404 Not Found');
    }
});

// --- CRON JOB KIỂM TRA QUÁ HẠN (Chạy mỗi 60 giây) ---
setInterval(() => {
    // console.log('Running cron: Check overdue tasks...'); // Có thể comment dòng log này cho đỡ rối
    notificationModel.checkOverdueTasks();
}, 60000);

// --- CRON JOB 2: DỌN DẸP THÔNG BÁO CŨ (Chạy mỗi 24 giờ) ---
// 24 giờ * 60 phút * 60 giây * 1000 mili-giây
setInterval(() => {
    console.log('Running cron: Cleanup old notifications...');
    notificationModel.deleteOldNotifications();
}, 24 * 60 * 60 * 1000);

// Gọi ngay 1 lần khi khởi động server để dọn dẹp luôn
notificationModel.deleteOldNotifications();

app.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Server đang chạy tại http://localhost:${port}`);
    console.log(`> API Docs tại http://localhost:${port}/api-docs`);
});
