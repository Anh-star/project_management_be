// backend/models/project.model.js
const db = require('../config/db');

/**
 * Tạo dự án mới VÀ thêm người tạo làm thành viên
 * (Sử dụng transaction)
 */
const create = async (projectData, createdById) => {
    const { name, project_code, description } = projectData;
    
    // Lấy một client từ pool
    const client = await db.getClient();

    try {
        // Bắt đầu transaction
        await client.query('BEGIN');

        // 1. Thêm dự án vào bảng 'projects'
        const projectQuery = `
            INSERT INTO projects (name, project_code, description, created_by)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const projectRes = await client.query(projectQuery, [name, project_code, description, createdById]);
        const newProject = projectRes.rows[0];

        // 2. Thêm người tạo vào bảng 'project_members'
        const memberQuery = `
            INSERT INTO project_members (project_id, user_id)
            VALUES ($1, $2)
        `;
        await client.query(memberQuery, [newProject.id, createdById]);

        // Hoàn tất transaction
        await client.query('COMMIT');
        
        return newProject;

    } catch (error) {
        // Nếu có lỗi, hủy bỏ mọi thay đổi
        await client.query('ROLLBACK');
        
        if (error.code === '23505') { // Lỗi unique (trùng project_code)
            throw new Error('Mã dự án đã tồn tại.');
        }
        throw error;
    } finally {
        // Luôn luôn trả client về pool
        client.release();
    }
};

/**
 * Lấy các dự án mà một user là thành viên
 */
const findProjectsByUserId = async (userId) => {
    const queryText = `
        SELECT DISTINCT p.* FROM projects p
        JOIN project_members pm ON p.id = pm.project_id
        WHERE pm.user_id = $1
        ORDER BY p.created_at DESC
    `;
    // Dùng DISTINCT phòng trường hợp user được add nhiều lần (dù đã có PRIMARY KEY)
    
    try {
        const { rows } = await db.query(queryText, [userId]);
        return rows;
    } catch (error) {
        throw error;
    }
};

const addMember = async (projectId, userId) => {
    const queryText = `
        INSERT INTO project_members (project_id, user_id)
        VALUES ($1, $2)
        RETURNING *
    `;
    try {
        const { rows } = await db.query(queryText, [projectId, userId]);
        return rows[0];
    } catch (error) {
        if (error.code === '23505') { // Lỗi unique (đã là thành viên)
            throw new Error('Người dùng đã ở trong dự án này.');
        }
        if (error.code === '23503') { // Lỗi khóa ngoại (user hoặc project không tồn tại)
            throw new Error('Người dùng hoặc dự án không tồn tại.');
        }
        throw error;
    }
};

/**
 * Lấy danh sách thành viên của một dự án
 */
const getMembersByProjectId = async (projectId) => {
    const queryText = `
        SELECT u.id, u.username, u.email, u.role 
        FROM users u
        JOIN project_members pm ON u.id = pm.user_id
        WHERE pm.project_id = $1
    `;
    try {
        const { rows } = await db.query(queryText, [projectId]);
        return rows;
    } catch (error) {
        throw error;
    }
};

// Cập nhật module.exports ở cuối file
module.exports = {
    create,
    findProjectsByUserId,
    addMember,               // <-- Thêm dòng này
    getMembersByProjectId,   // <-- Thêm dòng này
};