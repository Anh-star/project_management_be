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
const findProjectsByUserId = async (userId, keyword = '', status = '') => {
    const searchTerm = `%${keyword}%`;
    const statusCondition = status ? `AND p.status = '${status}'` : '';

    const queryText = `
        SELECT DISTINCT p.*,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as total_tasks,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'DONE') as completed_tasks
        FROM projects p
        JOIN project_members pm ON p.id = pm.project_id
        WHERE pm.user_id = $1 
        AND (p.name ILIKE $2 OR p.project_code ILIKE $2)
        ${statusCondition}
        ORDER BY p.created_at DESC
    `;
    const { rows } = await db.query(queryText, [userId, searchTerm]);
    return rows.map(row => ({
        ...row,
        progress: row.total_tasks > 0 ? Math.round((row.completed_tasks / row.total_tasks) * 100) : 0
    }));
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

const findById = async (projectId) => {
    const queryText = 'SELECT * FROM projects WHERE id = $1';
    try {
        const { rows } = await db.query(queryText, [projectId]);
        return rows[0];
    } catch (error) {
        throw error;
    }
};

/**
 * Cập nhật dự án
 */
const update = async (projectId, projectData) => {
    // projectData: { name, description, status }
    const fields = Object.keys(projectData);
    const values = Object.values(projectData);
    const setString = fields.map((field, index) => 
        `"${field}" = $${index + 2}`
    ).join(', ');

    const queryText = `
        UPDATE projects
        SET ${setString}
        WHERE id = $1
        RETURNING *
    `;
    
    try {
        const { rows } = await db.query(queryText, [projectId, ...values]);
        return rows[0];
    } catch (error) {
        if (error.code === '23505') { // Lỗi unique (trùng project_code)
            throw new Error('Mã dự án đã tồn tại.');
        }
        throw error;
    }
};

/**
 * Xóa dự án
 * (Tất cả thành viên và công việc liên quan sẽ bị xóa theo
 * nhờ 'ON DELETE CASCADE' trong DDL)
 */
const deleteById = async (projectId) => {
    const queryText = 'DELETE FROM projects WHERE id = $1 RETURNING *';
    try {
        const { rows } = await db.query(queryText, [projectId]);
        return rows[0];
    } catch (error) {
        throw error;
    }
};

const removeMember = async (projectId, userId) => {
    const queryText = 'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING *';
    try {
        const { rows } = await db.query(queryText, [projectId, userId]);
        return rows[0];
    } catch (error) {
        throw error;
    }
};

const findAll = async (keyword = '', status = '') => {
    const searchTerm = `%${keyword}%`;
    // Nếu status rỗng thì lấy tất cả, ngược lại lọc theo status
    const statusCondition = status ? `AND p.status = '${status}'` : '';
    
    const queryText = `
        SELECT p.*,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as total_tasks,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'DONE') as completed_tasks
        FROM projects p
        WHERE (p.name ILIKE $1 OR p.project_code ILIKE $1)
        ${statusCondition}
        ORDER BY p.created_at DESC
    `;
    const { rows } = await db.query(queryText, [searchTerm]);
    return rows.map(row => ({
        ...row,
        progress: row.total_tasks > 0 ? Math.round((row.completed_tasks / row.total_tasks) * 100) : 0
    }));
};

const getProjectReport = async (projectId) => {
    // Query này thống kê số task được giao, đã xong, và trễ hạn cho từng thành viên
    const memberStatsQuery = `
        SELECT u.username, u.email, u.id as user_id,
            COUNT(t.id) as assigned_tasks,
            COUNT(CASE WHEN t.status = 'DONE' THEN 1 END) as done_tasks,
            COUNT(CASE WHEN t.status != 'DONE' AND t.due_date < NOW() THEN 1 END) as overdue_tasks
        FROM users u
        JOIN project_members pm ON u.id = pm.user_id
        LEFT JOIN tasks t ON u.id = t.assignee_id AND t.project_id = $1
        WHERE pm.project_id = $1
        GROUP BY u.id, u.username, u.email
    `;
    
    const { rows } = await db.query(memberStatsQuery, [projectId]);
    return { members: rows };
};

module.exports = {
    create,
    findProjectsByUserId,
    findById,
    update,
    deleteById,
    addMember,
    getMembersByProjectId,
    removeMember,
    findAll,
    getProjectReport,
};