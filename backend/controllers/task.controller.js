// backend/controllers/task.controller.js
const taskService = require('../services/task.service');

const createTask = async (req, res) => {
    try {
        const { projectId } = req.params;
        const taskData = req.body; // { title, description, parent_id, assignee_id, ... }
        
        if (!taskData.title) {
            return res.status(400).json({ message: 'Tiêu đề công việc là bắt buộc.' });
        }

        // req.user được gán từ 'authenticateToken'
        const newTask = await taskService.createTask(projectId, taskData, req.user);
        
        res.status(201).json(newTask);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getProjectTasks = async (req, res) => {
    try {
        const { projectId } = req.params;
        
        // Service sẽ trả về dạng cây
        const taskTree = await taskService.getTasksForProject(projectId);
        
        res.status(200).json(taskTree);

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy công việc.', error: error.message });
    }
};

module.exports = {
    createTask,
    getProjectTasks,
};