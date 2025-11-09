// index.js (Ở thư mục gốc)
require('dotenv').config();
const express = require('express');
const next = require('next');
const cors = require('cors');

// Import route tổng của API
const apiRoutes = require('./backend/routes');

// Import Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./backend/config/swagger'); // Import file config

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev }); // Khởi tạo Next.js
const handle = app.getRequestHandler(); // Lấy handler của Next.js

const port = process.env.PORT || 3000;

app.prepare().then(() => {
    const server = express(); // Khởi tạo Express

    // Middlewares cho Express
    server.use(cors()); // Cho phép cross-origin
    server.use(express.json()); // Đọc body dạng JSON
    server.use(express.urlencoded({ extended: true }));

    // === PHỤC VỤ SWAGGER ===
    // Tạo endpoint /api-docs để hiển thị tài liệu API
    server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // === ĐỊNH TUYẾN API CHO BACKEND ===
    // Tất cả API backend sẽ có tiền tố /api/v1
    server.use('/api/v1', apiRoutes);

    // === XỬ LÝ CHO FRONTEND (Next.js) ===
    // Cho tất cả các route còn lại, để Next.js xử lý
    server.use((req, res) => {
        return handle(req, res);
    });

    // Khởi chạy server
    server.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Server sẵn sàng tại http://localhost:${port}`);
        console.log(`> API Docs sẵn sàng tại http://localhost:${port}/api-docs`);
    });
});