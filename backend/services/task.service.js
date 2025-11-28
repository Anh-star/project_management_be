// backend/services/task.service.js
const taskModel = require("../models/task.model");
const userModel = require("../models/user.model");
const notiModel = require("../models/notification.model");

/**
 * Tạo công việc mới
 */
const createTask = async (projectId, taskData, user) => {
  if (taskData.assignee_id) {
    const assignee = await userModel.findById(taskData.assignee_id);
    if (!assignee) throw new Error("Người được giao không tồn tại.");
  }

  // Logic tự động mở lại Task Cha
  if (taskData.parent_id) {
    const parentTask = await taskModel.findById(taskData.parent_id);
    if (parentTask && parentTask.status === "DONE") {
      await taskModel.update(parentTask.id, { status: "IN_PROGRESS" });
      if (parentTask.assignee_id) {
        await notiModel.create({
          user_id: parentTask.assignee_id,
          title: "🔄 Công việc mở lại",
          message: `Task "${parentTask.title}" đã mở lại do có việc con mới.`,
          type: "STATUS",
        });
      }
    }
  }

  const fullTaskData = { ...taskData, projectId, created_by: user.id };

  try {
    const newTask = await taskModel.create(fullTaskData);

    // Thông báo giao việc
    if (newTask.assignee_id && newTask.assignee_id !== user.id) {
      await notiModel.create({
        user_id: newTask.assignee_id,
        title: "🎯 Bạn được giao việc mới",
        message: `Dự án #${projectId}: "${newTask.title}" - Mức độ: ${newTask.priority}`,
        type: "ASSIGN",
      });
    }
    return newTask;
  } catch (error) {
    throw error;
  }
};

/**
 * Cập nhật công việc
 */
const updateTask = async (taskId, taskData, isAssigneeOnly) => {
  let allowedUpdates = taskData;

  if (isAssigneeOnly) {
    const allowedFields = ["status", "priority"];
    const restrictedUpdates = {};
    for (const field of allowedFields) {
      if (taskData.hasOwnProperty(field))
        restrictedUpdates[field] = taskData[field];
    }
    if (Object.keys(restrictedUpdates).length === 0)
      throw new Error("Quyền hạn không đủ.");
    allowedUpdates = restrictedUpdates;
  }

  if (allowedUpdates.status === "DONE") {
    const hasChildrenLeft = await taskModel.hasIncompleteChildren(taskId);
    if (hasChildrenLeft)
      throw new Error("Không thể hoàn thành. Còn việc con chưa xong.");
  }

  try {
    const oldTask = await taskModel.findById(taskId);
    if (!oldTask) throw new Error("Công việc không tồn tại.");

    // Xử lý thời gian hoàn thành
    if (allowedUpdates.status) {
      if (allowedUpdates.status === "DONE" && oldTask.status !== "DONE") {
        allowedUpdates.completed_at = new Date();
      } else if (
        allowedUpdates.status !== "DONE" &&
        oldTask.status === "DONE"
      ) {
        allowedUpdates.completed_at = null;
      }
    }

    if (
      allowedUpdates.due_date &&
      allowedUpdates.due_date !== oldTask.due_date
    ) {
      allowedUpdates.is_overdue_notified = false;
    }

    const updatedTask = await taskModel.update(taskId, allowedUpdates);

    // Revert Task Cha
    if (updatedTask.parent_id && updatedTask.status !== "DONE") {
      const parentTask = await taskModel.findById(updatedTask.parent_id);
      if (parentTask && parentTask.status === "DONE") {
        await taskModel.update(parentTask.id, {
          status: "IN_PROGRESS",
          completed_at: null,
        });
      }
    }

    // Thông báo Re-assign
    if (
      allowedUpdates.assignee_id &&
      parseInt(allowedUpdates.assignee_id) !== oldTask.assignee_id
    ) {
      await notiModel.create({
        user_id: allowedUpdates.assignee_id,
        title: "🎯 Bạn được chuyển giao công việc",
        message: `Bạn vừa nhận công việc "${updatedTask.title}".`,
        type: "ASSIGN",
      });
    }

    if (
      allowedUpdates.status &&
      oldTask.status !== allowedUpdates.status &&
      oldTask.assignee_id
    ) {
      const isDone = allowedUpdates.status === "DONE";
      await notiModel.create({
        user_id: oldTask.assignee_id,
        title: isDone ? "✅ Công việc hoàn thành" : "🔄 Cập nhật trạng thái",
        message: `Công việc "${oldTask.title}" đã chuyển sang ${allowedUpdates.status}`,
        type: "STATUS",
      });
    }
    return updatedTask;
  } catch (error) {
    throw error;
  }
};

const getTasksForProject = async (projectId, priority = "", status = "") => {
  const tasks = await taskModel.findByProjectId(projectId, priority, status);
  if (priority || status) return tasks;
  const buildTree = (tasksList, parentId = null) => {
    const tree = [];
    const children = tasksList.filter((task) => task.parent_id === parentId);
    for (const child of children) {
      const subTasks = buildTree(tasksList, child.id);
      if (subTasks.length > 0) child.subTasks = subTasks;
      tree.push(child);
    }
    return tree;
  };
  return buildTree(tasks);
};

const deleteTask = async (taskId) => {
  try {
    const deletedTask = await taskModel.deleteById(taskId);
    if (!deletedTask) throw new Error("Công việc không tồn tại.");
    return deletedTask;
  } catch (error) {
    throw error;
  }
};

module.exports = { createTask, getTasksForProject, updateTask, deleteTask };
