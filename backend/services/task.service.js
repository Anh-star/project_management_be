// backend/services/task.service.js
const taskModel = require('../models/task.model');
const userModel = require('../models/user.model'); // Sẽ cần để kiểm tra assignee

/**
 * Tạo công việc mới
 */
const createTask = async (projectId, taskData, user) => {
    const { assignee_id } = taskData;

    // (Tùy chọn) Kiểm tra xem người được gán (assignee) có tồn tại không
    if (assignee_id) {
        const assignee = await userModel.findById(assignee_id);
        if (!assignee) {
            throw new Error('Người được giao không tồn tại.');
        }
        // (Nâng cao) Bạn cũng có thể kiểm tra xem assignee có phải là thành viên dự án không
    }

    const fullTaskData = {
        ...taskData,
        projectId: projectId,
        created_by: user.id, // user là người tạo (PM/Admin)
    };

    try {
        const newTask = await taskModel.create(fullTaskData);
        return newTask;
    } catch (error) {
        throw error;
    }
};

/**
 * Lấy cây công việc của dự án
 */
const getTasksForProject = async (projectId) => {
    // 1. Lấy danh sách phẳng (flat list)
    const tasks = await taskModel.findByProjectId(projectId);
    
    // 2. Hàm đệ quy để xây dựng cây
    const buildTree = (tasksList, parentId = null) => {
        const tree = [];
        
        // Lọc ra các công việc con của parentId hiện tại
        const children = tasksList.filter(task => task.parent_id === parentId);
        
        for (const child of children) {
            // Tìm các công việc con của (child)
            const subTasks = buildTree(tasksList, child.id);
            if (subTasks.length > 0) {
                child.subTasks = subTasks; // Gán mảng con vào
            }
            tree.push(child);
        }
        
        return tree;
    };

    // 3. Bắt đầu xây dựng cây từ cấp cao nhất (parent_id = null)
    const taskTree = buildTree(tasks);
    return taskTree;
};

module.exports = {
    createTask,
    getTasksForProject,
};