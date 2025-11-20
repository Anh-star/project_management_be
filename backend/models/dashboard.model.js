const db = require('../config/db');

/**
 * Lấy thống kê cho ADMIN (Toàn bộ hệ thống)
 */
const getAdminStats = async () => {
    // 1. Thống kê Dự án
    const projectStatsQuery = `
        SELECT
            COUNT(*) AS total_projects,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed_projects,
            COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) AS in_progress_projects
        FROM projects;
    `;
    
    // 2. Thống kê Công việc
    const taskStatsQuery = `
        SELECT
            COUNT(*) AS total_tasks,
            COUNT(CASE WHEN status = 'DONE' THEN 1 END) AS completed_tasks,
            COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) AS in_progress_tasks,
            COUNT(CASE WHEN status != 'DONE' AND due_date < NOW() THEN 1 END) AS overdue_tasks
        FROM tasks;
    `;
    
    // Thực thi song song 2 query
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

/**
 * Lấy thống kê cho PM (Dự án do PM quản lý)
 */
const getPMStats = async (pmUserId) => {
    // 1. Thống kê Dự án (do PM này tạo)
    const projectStatsQuery = `
        SELECT
            COUNT(*) AS total_projects,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed_projects,
            COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) AS in_progress_projects
        FROM projects
        WHERE created_by = $1;
    `;
    
    // 2. Thống kê Công việc (thuộc các dự án do PM này tạo)
    const taskStatsQuery = `
        SELECT
            COUNT(t.id) AS total_tasks,
            COUNT(CASE WHEN t.status = 'DONE' THEN 1 END) AS completed_tasks,
            COUNT(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 END) AS in_progress_tasks,
            COUNT(CASE WHEN t.status != 'DONE' AND t.due_date < NOW() THEN 1 END) AS overdue_tasks
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        WHERE p.created_by = $1;
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

/**
 * Lấy thống kê cho MEMBER (Dự án và Công việc của Member)
 */
const getMemberStats = async (memberUserId) => {
    // 1. Thống kê Dự án (Member này là thành viên)
    const projectStatsQuery = `
        SELECT
            COUNT(DISTINCT p.id) AS total_projects,
            COUNT(DISTINCT CASE WHEN p.status = 'COMPLETED' THEN p.id END) AS completed_projects,
            COUNT(DISTINCT CASE WHEN p.status = 'IN_PROGRESS' THEN p.id END) AS in_progress_projects
        FROM projects p
        JOIN project_members pm ON p.id = pm.project_id
        WHERE pm.user_id = $1;
    `;
    
    // 2. Thống kê Công việc (được gán cho Member này)
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