const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Lỗi khi kết nối đến Postgres:', err.stack);
    }
    console.log('Đã kết nối thành công đến Postgres!');
    release();
});

// Xuất ra 2 thứ:
module.exports = {
    // 1. Hàm query nhanh cho các truy vấn đơn giản
    query: (text, params) => pool.query(text, params),
    
    // 2. Hàm lấy client để dùng cho transaction
    getClient: () => pool.connect(),
};