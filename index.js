// index.js (Phiên bản API thuần túy)
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import route tổng của API
const apiRoutes = require('./backend/routes');

// Import Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./backend/config/swagger');

// === CẤU HÌNH MÁY CHỦ ===
const app = express(); // Khởi tạo Express (Không còn Next.js)
const port = process.env.PORT || 5000;

// === CẤU HÌNH CORS ===
// Cho phép frontend (chạy trên port 3000) gọi API
const corsOptions = {
    origin: 'http://localhost:3000', // Chỉ cho phép port 3000
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// === MIDDLEWARES ===
app.use(express.json()); // Đọc body dạng JSON
app.use(express.urlencoded({ extended: true }));

// === ROUTES ===

// Phục vụ Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Gắn API routes
app.use('/api/v1', apiRoutes);

// Route cơ sở
app.get('/', (req, res) => {
    res.send('Project Management API is running. Go to /api-docs for documentation.');
});

// === KHỞI CHẠY SERVER ===
app.listen(port, (err) => {
    if (err) throw err;
    console.log(`> API Server sẵn sàng tại http://localhost:${port}`);
    console.log(`> API Docs sẵn sàng tại http://localhost:${port}/api-docs`);
});