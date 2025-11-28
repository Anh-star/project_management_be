const taskModel = require("../models/task.model");
const userModel = require("../models/user.model");
const notiModel = require("../models/notification.model");
const projectModel = require("../models/project.model"); // Import Project Model

/**
 * Tạo công việc mới
 */
const createTask = async (projectId, taskData, user) => {
  // 1. Kiểm tra người được giao (nếu có)
  if (taskData.assignee_id) {
    const assignee = await userModel.findById(taskData.assignee_id);
    if (!assignee) throw new Error("Người được giao không tồn tại.");
  }

  // --- LOGIC 1: TỰ ĐỘNG MỞ LẠI DỰ ÁN (Nếu đang Completed) ---
  const project = await projectModel.findById(projectId);
  if (project && project.status === "COMPLETED") {
    // Cập nhật trạng thái dự án về IN_PROGRESS
    await projectModel.update(projectId, { status: "IN_PROGRESS" });
    console.log(
      `Auto-reverted Project #${projectId} to IN_PROGRESS (New task added)`
    );

    // Gửi thông báo cho TẤT CẢ thành viên dự án
    try {
      const members = await projectModel.getMembersByProjectId(projectId);
      await Promise.all(
        members.map((member) => {
          return notiModel.create({
            user_id: member.id,
            title: "🔄 Dự án mở lại",
            message: `Dự án "${project.name}" đã chuyển về trạng thái Đang thực hiện do có công việc mới được tạo.`,
            type: "STATUS",
          });
        })
      );
    } catch (err) {
      console.error("Lỗi gửi thông báo mở lại dự án:", err);
    }
  }
  // ----------------------------------------------------------

  // --- LOGIC 2: TỰ ĐỘNG MỞ LẠI TASK CHA (Nếu đang Done) ---
  if (taskData.parent_id) {
    const parentTask = await taskModel.findById(taskData.parent_id);
    if (parentTask && parentTask.status === "DONE") {
      // Mở lại task cha và xóa thời gian hoàn thành của nó
      await taskModel.update(parentTask.id, {
        status: "IN_PROGRESS",
        completed_at: null,
      });

      // Gửi thông báo cho người phụ trách Task Cha
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

  const fullTaskData = {
    ...taskData,
    projectId: projectId,
    created_by: user.id,
  };

  try {
    const newTask = await taskModel.create(fullTaskData);

    // 3. Thông báo Giao việc (Assign)
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

  // 1. Phân quyền (Member chỉ sửa được status, priority)
  if (isAssigneeOnly) {
    const allowedFields = ["status", "priority"];
    const restrictedUpdates = {};
    for (const field of allowedFields) {
      if (taskData.hasOwnProperty(field))
        restrictedUpdates[field] = taskData[field];
    }
    if (Object.keys(restrictedUpdates).length === 0) {
      throw new Error("Bạn chỉ có quyền cập nhật trạng thái hoặc độ ưu tiên.");
    }
    allowedUpdates = restrictedUpdates;
  }

  // 2. Ràng buộc: Chặn hoàn thành Task cha nếu con chưa xong
  if (allowedUpdates.status === "DONE") {
    const hasChildrenLeft = await taskModel.hasIncompleteChildren(taskId);
    if (hasChildrenLeft) {
      throw new Error("Không thể hoàn thành. Vẫn còn công việc con chưa xong.");
    }
  }

  try {
    const oldTask = await taskModel.findById(taskId);
    if (!oldTask) throw new Error("Công việc không tồn tại.");

    // --- XỬ LÝ THỜI GIAN HOÀN THÀNH (COMPLETED_AT) ---
    if (allowedUpdates.status) {
      if (allowedUpdates.status === "DONE" && oldTask.status !== "DONE") {
        // Mới chuyển sang DONE -> Ghi nhận thời gian
        allowedUpdates.completed_at = new Date();
      } else if (
        allowedUpdates.status !== "DONE" &&
        oldTask.status === "DONE"
      ) {
        // Từ DONE chuyển sang cái khác -> Xóa thời gian
        allowedUpdates.completed_at = null;
      }
    }
    // --------------------------------------------------

    // Reset cờ quá hạn nếu người dùng đổi hạn chót
    if (
      allowedUpdates.due_date &&
      allowedUpdates.due_date !== oldTask.due_date
    ) {
      allowedUpdates.is_overdue_notified = false;
    }

    // 3. Thực hiện Update
    const updatedTask = await taskModel.update(taskId, allowedUpdates);

    // 4. Logic tự động: Revert Task Cha (Nếu task con bị làm lại)
    if (updatedTask.parent_id && updatedTask.status !== "DONE") {
      const parentTask = await taskModel.findById(updatedTask.parent_id);
      if (parentTask && parentTask.status === "DONE") {
        await taskModel.update(parentTask.id, {
          status: "IN_PROGRESS",
          completed_at: null,
        });
      }
    }

    // 5. Thông báo: Đổi người (Re-assign)
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

    // 6. Thông báo: Đổi trạng thái (Status Change)
    if (
      allowedUpdates.status &&
      oldTask.status !== allowedUpdates.status &&
      oldTask.assignee_id
    ) {
      const isDone = allowedUpdates.status === "DONE";

      await notiModel.create({
        user_id: oldTask.assignee_id,
        title: isDone ? "✅ Công việc hoàn thành" : "🔄 Cập nhật trạng thái", // Icon động
        message: `Công việc "${oldTask.title}" đã chuyển sang ${allowedUpdates.status}`,
        type: "STATUS",
      });
    }

    return updatedTask;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách công việc (Hỗ trợ Lọc & Cây)
 */
const getTasksForProject = async (projectId, priority = "", status = "") => {
  // 1. Lấy danh sách phẳng
  const tasks = await taskModel.findByProjectId(projectId, priority, status);

  // 2. Nếu có lọc -> Trả về phẳng
  if (priority || status) {
    return tasks;
  }

  // 3. Nếu không lọc -> Xây cây
  const buildTree = (tasksList, parentId = null) => {
    const tree = [];
    const children = tasksList.filter((task) => task.parent_id === parentId);
    for (const child of children) {
      const subTasks = buildTree(tasksList, child.id);
      if (subTasks.length > 0) {
        child.subTasks = subTasks;
      }
      tree.push(child);
    }
    return tree;
  };

  return buildTree(tasks);
};

/**
 * Xóa công việc
 */
const deleteTask = async (taskId) => {
  try {
    const deletedTask = await taskModel.deleteById(taskId);
    if (!deletedTask) throw new Error("Công việc không tồn tại.");
    return deletedTask;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createTask,
  getTasksForProject,
  updateTask,
  deleteTask,
};
