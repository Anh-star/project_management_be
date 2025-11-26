const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');

const getAllUsers = async (keyword, page, limit, role) => {
    const offset = (page - 1) * limit;
    
    const { users, total } = await userModel.findAll(keyword, limit, offset, role);
    
    return {
        data: users,
        pagination: {
            page: page,
            limit: limit,
            total_records: total,
            total_pages: Math.ceil(total / limit)
        }
    };
};

const createUser = async (userData) => {
    const { username, email, password, role } = userData;
    
    // Check trùng email
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) throw new Error('Email đã tồn tại.');

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await userModel.create(username, email, password_hash, role);
    delete newUser.password_hash;
    return newUser;
};

const updateUser = async (userId, updateData) => {
    // Nếu có update password thì phải hash
    if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password_hash = await bcrypt.hash(updateData.password, salt);
        delete updateData.password; // Xóa field password thô
    }

    // Không cho sửa email (để đơn giản)
    delete updateData.email; 

    return await userModel.update(userId, updateData);
};

const deleteUser = async (userId) => {
    return await userModel.deleteById(userId);
};

module.exports = { getAllUsers, createUser, updateUser, deleteUser };