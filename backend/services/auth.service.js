const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Assuming db connection is available

const registerUser = async (username, email, password) => {
    const hashedPassword = await bcrypt.hash(password, 10); // Hash password with salt rounds = 10

    // Default role for new users based on the user_role ENUM
    const defaultRole = 'MEMBER'; 

    const result = await db.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
        [username, email, hashedPassword, defaultRole]
    );

    return result.rows[0]; // Return the newly created user (without password_hash)
};

const loginUser = async (email, password) => {
    // 1. Retrieve user from database
    const result = await db.query('SELECT id, username, email, password_hash, role FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
        throw new Error('Email hoặc mật khẩu không đúng.');
    }

    // 2. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new Error('Email hoặc mật khẩu không đúng.');
    }

    // 3. Generate JWT token
    const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' } // Token expires in 1 hour
    );

    // 4. Return user and token
    // Exclude password_hash from the returned user object
    const { password_hash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
};

const authService = {
    registerUser,
    loginUser,
    // Other auth-related functions will go here
};

module.exports = authService;
