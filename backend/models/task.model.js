// backend/models/task.model.js
const db = require('../config/db');

/**
 * Tạo một công việc mới
 */
const create = async (taskData) => {
    const {
        projectId,
        title,
        description,
        status,
        priority,
        start_date,
        due_date,
        assignee_id, // ID người được giao
        created_by,  // ID người tạo (PM/Admin)
        parent_id    // ID công việc cha (có thể null)
    } = taskData;

    const queryText = `
        INSERT INTO tasks (
            project_id, title, description, status, priority, 
            start_date, due_date, assignee_id, created_by, parent_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
    `;
    
    // Nếu status, priority, v.v. không được cung cấp, chúng sẽ dùng DEFAULT trong DB
    const values = [
        projectId, title, description, status || 'TODO', priority || 'MEDIUM',
        start_date, due_date, assignee_id, created_by, parent_id
    ];

    try {
        const { rows } = await db.query(queryText, values);
        return rows[0];
    } catch (error) {
        // Lỗi 23503 có thể là do project_id, assignee_id, created_by hoặc parent_id không tồn tại
        if (error.code === '23503') {
            console.error("Lỗi khóa ngoại khi tạo task:", error.detail);
            throw new Error('Dự án, người dùng hoặc công việc cha không hợp lệ.');
        }
        throw error;
    }
};

/**
 * Lấy tất cả công việc (dạng phẳng) của một dự án
 */
const findByProjectId = async (projectId) => {
    const queryText = `
        SELECT * FROM tasks 
        WHERE project_id = $1
        ORDER BY created_at ASC
    `;
    try {
        const { rows } = await db.query(queryText, [projectId]);
        return rows;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    create,
    findByProjectId,
};