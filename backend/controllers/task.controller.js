const taskService = require("../services/task.service");

const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const taskData = req.body; // { title, description, parent_id, assignee_id, ... }

    if (!taskData.title) {
      return res
        .status(400)
        .json({ message: "Tiêu đề công việc là bắt buộc." });
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
    const { priority, status } = req.query;
    const tasks = await taskService.getTasksForProject(
      projectId,
      priority,
      status
    );
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const taskData = req.body; // Dữ liệu cần cập nhật

    // req.isAssigneeOnly được gán từ middleware canUpdateTask
    const updatedTask = await taskService.updateTask(
      taskId,
      taskData,
      req.isAssigneeOnly || false
    );

    res.status(200).json(updatedTask);
  } catch (error) {
    if (error.message.includes("không tồn tại")) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("Bạn chỉ có quyền")) {
      return res.status(403).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    await taskService.deleteTask(taskId);
    res.status(200).json({ message: "Xóa công việc thành công." });
  } catch (error) {
    if (error.message.includes("không tồn tại")) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getProjectTasks,
  updateTask,
  deleteTask,
};
