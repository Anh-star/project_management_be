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
        const { search, status } = req.query; // Lấy từ URL: /projects?search=abc
        const projects = await projectService.getProjectsForUser(req.user, search, status);
        res.status(200).json(projects);
    } catch (error) { res.status(500).json({ message: error.message }); }
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

/**
 * Controller cập nhật dự án
 */
const updateProject = async (req, res) => {
    try {
        const updated = await projectService.updateProject(req.params.projectId, req.body);
        res.status(200).json(updated);
    } catch (error) {
        // In lỗi ra console backend để kiểm tra xem nội dung chính xác là gì
        console.log("Update Project Logic Error:", error.message);

        // 1. Lỗi không tìm thấy
        if (error.message.includes('không tồn tại')) {
            return res.status(404).json({ message: error.message });
        }

        // 2. Lỗi Validate (Mã trùng, hoặc logic chặn hoàn thành)
        // Sửa điều kiện thoáng hơn: Chặn tất cả lỗi bắt đầu bằng "Không thể" hoặc chứa "Mã dự án"
        if (
            error.message.includes('Mã dự án') || 
            error.message.includes('Không thể') || 
            error.message.includes('chưa xong') ||
            error.message.includes('chưa xử lý')
        ) {
            return res.status(400).json({ message: error.message });
        }

        // 3. Lỗi hệ thống thực sự (DB chết, code lỗi...)
        res.status(500).json({ message: 'Lỗi server khi cập nhật dự án.', error: error.message });
    }
};

/**
 * Controller xóa dự án
 */
const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        await projectService.deleteProject(projectId);
        res.status(200).json({ message: 'Xóa dự án thành công.' });
    } catch (error) {
        if (error.message.includes('không tồn tại')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Lỗi server khi xóa dự án.' });
    }
};

const removeMember = async (req, res) => {
    try {
        const { projectId, userId } = req.params;
        await projectService.removeMemberFromProject(projectId, userId);
        res.status(200).json({ message: 'Đã xóa thành viên khỏi dự án.' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getReport = async (req, res) => {
    try {
        const data = await projectService.getProjectReport(req.params.projectId);
        res.status(200).json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateMemberRole = async (req, res) => {
    try {
        const { projectId, userId } = req.params;
        const { is_manager } = req.body; // Nhận boolean từ body
        await projectService.updateMemberManagerStatus(projectId, userId, is_manager);
        res.status(200).json({ message: 'Cập nhật quyền thành công.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createProject,
    getMyProjects,
    addMember,
    getMembers,
    updateProject,
    deleteProject, 
    removeMember, 
    getReport,
    updateMemberRole,
};