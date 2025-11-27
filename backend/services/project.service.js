const projectModel = require('../models/project.model');
const userModel = require('../models/user.model');
const taskModel = require('../models/task.model');

const createProject = async (projectData, user) => {
    const { manager_ids } = projectData; 
    return await projectModel.create(projectData, user.id, manager_ids);
};

const getProjectsForUser = async (user, keyword, status) => {
    if (user.role === 'ADMIN') return await projectModel.findAll(keyword, status);
    return await projectModel.findProjectsByUserId(user.id, keyword, status);
};

const addMemberToProject = async (projectId, email) => {
    // 1. Tìm user bằng email
    const user = await userModel.findByEmail(email);
    if (!user) {
        throw new Error('Người dùng với email này không tồn tại.');
    }

    // 2. Thêm user ID vào dự án
    try {
        const result = await projectModel.addMember(projectId, user.id);
        return result;
    } catch (error) {
        // Ném lỗi (ví dụ: "Người dùng đã ở trong dự án") lên controller
        throw error;
    }
};

const getProjectMembers = async (projectId) => {
    try {
        const members = await projectModel.getMembersByProjectId(projectId);
        return members;
    } catch (error) {
        throw error;
    }
};

/**
 * Cập nhật dự án
 */
const updateProject = async (id, projectData) => {
    if (projectData.status === 'COMPLETED') {
        const incompleteCount = await taskModel.countIncomplete(id);
        if (incompleteCount > 0) {
            throw new Error(`Không thể hoàn thành. Còn ${incompleteCount} công việc chưa xong.`);
        }
    }

    const { manager_ids } = projectData;
    delete projectData.project_code;
    delete projectData.created_by;
    delete projectData.manager_ids;
    
    const updated = await projectModel.update(id, projectData, manager_ids);
    if (!updated) throw new Error('Dự án không tồn tại.');
    return updated;
};
/**
 * Xóa dự án
 */
const deleteProject = async (projectId) => {
    try {
        const deletedProject = await projectModel.deleteById(projectId);
        if (!deletedProject) {
            throw new Error('Dự án không tồn tại.');
        }
        return deletedProject;
    } catch (error) {
        throw error;
    }
};

const removeMemberFromProject = async (projectId, userId) => {
    // (Tùy chọn) Kiểm tra xem có phải là Project Owner không trước khi xóa (để tránh xóa nhầm chủ dự án)
    // Nhưng logic này có thể để ở Frontend hoặc Controller check quyền
    try {
        const result = await projectModel.removeMember(projectId, userId);
        if (!result) {
            throw new Error('Thành viên không tồn tại trong dự án này.');
        }
        return result;
    } catch (error) {
        throw error;
    }
};

const getProjectReport = async (projectId) => {
    try {
        return await projectModel.getProjectReport(projectId);
    } catch (error) { throw error; }
};

const updateMemberManagerStatus = async (projectId, userId, isManager) => {
    return await projectModel.updateMemberRole(projectId, userId, isManager);
};

module.exports = {
    createProject,
    getProjectsForUser,
    addMemberToProject,
    getProjectMembers,
    updateProject,
    deleteProject, 
    removeMemberFromProject,
    getProjectReport,
    updateMemberManagerStatus,
};