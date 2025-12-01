const taskModel = require("../models/task.model");

const getCalendarTasks = async (req, res) => {
  try {
    const { projectId, assigneeId } = req.query;
    const tasks = await taskModel.findAllByUserId(req.user.id, req.user.role, {
      projectId,
      assigneeId,
    });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCalendarTasks };
