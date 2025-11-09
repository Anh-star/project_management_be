// backend/services/project.service.js
const projectModel = require('../models/project.model');
const userModel = require('../models/user.model');

const createProject = async (projectData, user) => {
    // user (req.user) được lấy từ middleware
    // projectData (req.body) được lấy từ controller
    
    try {
        const newProject = await projectModel.create(projectData, user.id);
        return newProject;
    } catch (error) {
        // Ném lỗi lên controller để xử lý
        throw error;
    }
};

const getProjectsForUser = async (userId) => {
    try {
        const projects = await projectModel.findProjectsByUserId(userId);
        return projects;
    } catch (error) {
        throw error;
    }
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
module.exports = {
    createProject,
    getProjectsForUser,
    addMemberToProject, // <-- Thêm dòng này
    getProjectMembers,  // <-- Thêm dòng này
};