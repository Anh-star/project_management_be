const projectModel = require("../models/project.model");
const userModel = require("../models/user.model");
const taskModel = require("../models/task.model");
const notiModel = require("../models/notification.model");

const createProject = async (projectData, user) => {
  const { manager_ids } = projectData;
  return await projectModel.create(projectData, user.id, manager_ids);
};

const getProjectsForUser = async (user, keyword, status) => {
  if (user.role === "ADMIN") return await projectModel.findAll(keyword, status);
  return await projectModel.findProjectsByUserId(user.id, keyword, status);
};

const updateProject = async (id, projectData) => {
  if (projectData.status === "COMPLETED") {
    const incompleteCount = await taskModel.countIncomplete(id);
    if (incompleteCount > 0) {
      throw new Error(
        `Không thể hoàn thành dự án! Vẫn còn ${incompleteCount} công việc chưa xử lý xong (Trạng thái khác Done).`
      );
    }
  }

  const { manager_ids } = projectData;
  delete projectData.project_code;
  delete projectData.created_by;
  delete projectData.manager_ids;

  const updated = await projectModel.update(id, projectData, manager_ids);
  if (!updated) throw new Error("Dự án không tồn tại.");

  // GỬI THÔNG BÁO HOÀN THÀNH DỰ ÁN
  if (projectData.status === "COMPLETED") {
    try {
      // 1. Lấy danh sách thành viên
      const members = await projectModel.getMembersByProjectId(id);

      // 2. Gửi thông báo cho từng người
      // Dùng Promise.all để gửi song song cho nhanh
      await Promise.all(
        members.map((member) => {
          return notiModel.create({
            user_id: member.id,
            title: "🏆 Dự án hoàn thành!",
            message: `Dự án "${updated.name}" đã chính thức hoàn thành. Cảm ơn đóng góp của bạn!`,
            type: "STATUS", // Hoặc thêm type 'PROJECT' nếu muốn icon riêng
          });
        })
      );
    } catch (err) {
      console.error("Lỗi gửi thông báo dự án hoàn thành:", err);
      // Không throw error để tránh rollback việc update dự án
    }
  }
  return updated;
};

const deleteProject = async (id) => await projectModel.deleteById(id);
const addMemberToProject = async (projectId, email) => {
  const user = await userModel.findByEmail(email);
  if (!user) throw new Error("Người dùng với email này không tồn tại.");

  try {
    const result = await projectModel.addMember(projectId, user.id);

    // GỬI THÔNG BÁO CHO THÀNH VIÊN MỚI
    const project = await projectModel.findById(projectId); // Lấy tên dự án
    if (project) {
      await notiModel.create({
        user_id: user.id,
        title: "🎉 Chào mừng bạn!",
        message: `Bạn đã được thêm vào dự án "${project.name}". Hãy kiểm tra ngay!`,
        type: "ASSIGN", // Dùng type ASSIGN để hiện icon xanh lá
      });
    }

    return result;
  } catch (error) {
    throw error;
  }
};
const getProjectMembers = async (pid) =>
  await projectModel.getMembersByProjectId(pid);
const removeMemberFromProject = async (pid, uid) =>
  await projectModel.removeMember(pid, uid);
const updateMemberManagerStatus = async (pid, uid, isManager) =>
  await projectModel.updateMemberRole(pid, uid, isManager);
const getProjectReport = async (pid) =>
  await projectModel.getProjectReport(pid);

module.exports = {
  createProject,
  getProjectsForUser,
  updateProject,
  deleteProject,
  addMemberToProject,
  getProjectMembers,
  removeMemberFromProject,
  updateMemberManagerStatus,
  getProjectReport,
};
