// backend/controllers/project.controller.js
const projectService = require('../services/project.service');

const createProject = async (req, res) => {
    try {
        const { name, project_code } = req.body;
        if (!name || !project_code) {
            return res.status(400).json({ message: 'Tên và Mã dự án là bắt buộc.' });
        }

        // req.user được gán từ 'authenticateToken'
        const newProject = await projectService.createProject(req.body, req.user);
        
        res.status(201).json(newProject);

    } catch (error) {
        if (error.message === 'Mã dự án đã tồn tại.') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Lỗi server khi tạo dự án.', error: error.message });
    }
};

const getMyProjects = async (req, res) => {
    try {
        // Lấy các dự án mà user (đã login) là thành viên
        const projects = await projectService.getProjectsForUser(req.user.id);
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy dự án.', error: error.message });
    }
};

/**
 * Controller thêm thành viên
 */
const addMember = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { email } = req.body; // Lấy email từ body

        if (!email) {
            return res.status(400).json({ message: 'Cần cung cấp email.' });
        }

        await projectService.addMemberToProject(projectId, email);
        res.status(201).json({ message: 'Thêm thành viên thành công.' });

    } catch (error) {
        // Bắt lỗi từ service (user không tồn tại, user đã ở trong dự án)
        res.status(400).json({ message: error.message });
    }
};

/**
 * Controller lấy danh sách thành viên
 */
const getMembers = async (req, res) => {
    try {
        const { projectId } = req.params;
        const members = await projectService.getProjectMembers(projectId);
        res.status(200).json(members);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy thành viên.' });
    }
};

// Cập nhật module.exports ở cuối file
module.exports = {
    createProject,
    getMyProjects,
    addMember,     // <-- Thêm dòng này
    getMembers,    // <-- Thêm dòng này
};