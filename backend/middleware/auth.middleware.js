// backend/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

/**
 * Middleware kiểm tra JWT
 */
const authenticateToken = async (req, res, next) => {
    // Lấy token từ header: "Authorization: Bearer <TOKEN>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        // 401 Unauthorized (Chưa xác thực)
        return res.status(401).json({ message: 'Yêu cầu token xác thực.' });
    }

    try {
        // Giải mã token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Lấy thông tin user từ DB (để đảm bảo user còn tồn tại)
        // Chúng ta dùng findById (chỉ lấy thông tin an toàn)
        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'Người dùng không tồn tại.' });
        }

        // Gắn thông tin user vào request để các controller sau có thể dùng
        req.user = user; 
        
        next(); // Cho phép request đi tiếp

    } catch (err) {
        // 403 Forbidden (Token không hợp lệ / hết hạn)
        return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
};

module.exports = {
    authenticateToken,
};