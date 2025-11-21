// backend/models/dashboard.model.js
const db = require('../config/db');

// 1. ADMIN: Thấy tất cả
const getAdminStats = async () => {
    const projectStatsQuery = `
        SELECT
            COUNT(*) AS total_projects,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed_projects,
            COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) AS in_progress_projects
        FROM projects;
    `;
    
    const taskStatsQuery = `
        SELECT
            COUNT(*) AS total_tasks,
            COUNT(CASE WHEN status = 'DONE' THEN 1 END) AS completed_tasks,
            COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) AS in_progress_tasks,
            COUNT(CASE WHEN status != 'DONE' AND due_date < NOW() THEN 1 END) AS overdue_tasks
        FROM tasks;
    `;
    
    const [projectRes, taskRes] = await Promise.all([
        db.query(projectStatsQuery),
        db.query(taskStatsQuery)
    ]);
    
    return {
        projects: projectRes.rows[0],
        tasks: taskRes.rows[0],
        scope: 'ADMIN'
    };
};

// 2. PM: Thấy dự án mình TẠO + dự án mình THAM GIA
const getPMStats = async (pmUserId) => {
    // Logic cũ: WHERE created_by = $1 (Chỉ dự án mình tạo)
    // Logic mới: Tính cả dự án mình là thành viên (JOIN project_members)
    
    const projectStatsQuery = `
        SELECT
            COUNT(DISTINCT p.id) AS total_projects,
            COUNT(DISTINCT CASE WHEN p.status = 'COMPLETED' THEN p.id END) AS completed_projects,
            COUNT(DISTINCT CASE WHEN p.status = 'IN_PROGRESS' THEN p.id END) AS in_progress_projects
        FROM projects p
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE p.created_by = $1 OR pm.user_id = $1;
    `;
    
    // Thống kê Task: Đếm tất cả task trong các dự án đó (PM được xem hết task của dự án)
    const taskStatsQuery = `
        SELECT
            COUNT(DISTINCT t.id) AS total_tasks,
            COUNT(DISTINCT CASE WHEN t.status = 'DONE' THEN t.id END) AS completed_tasks,
            COUNT(DISTINCT CASE WHEN t.status = 'IN_PROGRESS' THEN t.id END) AS in_progress_tasks,
            COUNT(DISTINCT CASE WHEN t.status != 'DONE' AND t.due_date < NOW() THEN t.id END) AS overdue_tasks
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE p.created_by = $1 OR pm.user_id = $1;
    `;
    
    const [projectRes, taskRes] = await Promise.all([
        db.query(projectStatsQuery, [pmUserId]),
        db.query(taskStatsQuery, [pmUserId])
    ]);
    
    return {
        projects: projectRes.rows[0],
        tasks: taskRes.rows[0],
        scope: 'PROJECT_MANAGER'
    };
};

// 3. MEMBER: Chỉ thấy dự án mình tham gia & Task GIAO CHO MÌNH
const getMemberStats = async (memberUserId) => {
    const projectStatsQuery = `
        SELECT
            COUNT(DISTINCT p.id) AS total_projects,
            COUNT(DISTINCT CASE WHEN p.status = 'COMPLETED' THEN p.id END) AS completed_projects,
            COUNT(DISTINCT CASE WHEN p.status = 'IN_PROGRESS' THEN p.id END) AS in_progress_projects
        FROM projects p
        JOIN project_members pm ON p.id = pm.project_id
        WHERE pm.user_id = $1;
    `;
    
    const taskStatsQuery = `
        SELECT
            COUNT(*) AS total_tasks,
            COUNT(CASE WHEN status = 'DONE' THEN 1 END) AS completed_tasks,
            COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) AS in_progress_tasks,
            COUNT(CASE WHEN status != 'DONE' AND due_date < NOW() THEN 1 END) AS overdue_tasks
        FROM tasks
        WHERE assignee_id = $1;
    `;
    
    const [projectRes, taskRes] = await Promise.all([
        db.query(projectStatsQuery, [memberUserId]),
        db.query(taskStatsQuery, [memberUserId])
    ]);
    
    return {
        projects: projectRes.rows[0],
        tasks: taskRes.rows[0],
        scope: 'MEMBER'
    };
};

module.exports = {
    getAdminStats,
    getPMStats,
    getMemberStats
};