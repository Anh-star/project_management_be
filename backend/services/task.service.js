const taskModel = require('../models/task.model');
const userModel = require('../models/user.model');
const notiModel = require('../models/notification.model');

/**
 * Tạo công việc mới
 */
const createTask = async (projectId, taskData, user) => {
    // 1. Kiểm tra người được giao (nếu có)
    if (taskData.assignee_id) {
        const assignee = await userModel.findById(taskData.assignee_id);
        if (!assignee) {
            throw new Error('Người được giao không tồn tại.');
        }
    }

    const fullTaskData = {
        ...taskData,
        projectId: projectId,
        created_by: user.id, // user là người tạo (PM/Admin)
    };

    try {
        const newTask = await taskModel.create(fullTaskData);

        // --- GỬI THÔNG BÁO: KHI ĐƯỢC GIAO VIỆC ---
        // Nếu có người được giao và người đó không phải là chính mình
        if (newTask.assignee_id && newTask.assignee_id !== user.id) {
            await notiModel.create({
                user_id: newTask.assignee_id,
                title: '🎯 Bạn được giao việc mới',
                message: `Dự án #${projectId}: "${newTask.title}" - Mức độ: ${newTask.priority}`,
                type: 'ASSIGN'
            });
        }

        return newTask;
    } catch (error) {
        throw error;
    }
};

/**
 * Lấy danh sách công việc (Dạng cây hoặc Phẳng)
 */
const getTasksForProject = async (projectId, priority = '', status = '') => {
    // 1. Lấy danh sách phẳng từ DB (có hỗ trợ lọc)
    const tasks = await taskModel.findByProjectId(projectId, priority, status);
    
    // 2. Nếu có bất kỳ bộ lọc nào -> Trả về danh sách phẳng (Flat List)
    // Vì hiển thị cây sẽ bị đứt gãy nếu cha bị lọc mất
    if (priority || status) {
        return tasks; 
    }

    // 3. Nếu không lọc -> Xây dựng cấu trúc cây (Recursive)
    const buildTree = (tasksList, parentId = null) => {
        const tree = [];
        // Tìm các con trực tiếp của parentId
        const children = tasksList.filter(task => task.parent_id === parentId);
        
        for (const child of children) {
            // Đệ quy tìm con của child
            const subTasks = buildTree(tasksList, child.id);
            if (subTasks.length > 0) {
                child.subTasks = subTasks; // Gán mảng con vào thuộc tính subTasks
            }
            tree.push(child);
        }
        
        return tree;
    };

    // Bắt đầu xây dựng từ gốc (parent_id = null)
    const taskTree = buildTree(tasks);
    return taskTree;
};

/**
 * Cập nhật công việc
 * @param {number} taskId - ID công việc
 * @param {object} taskData - Dữ liệu cần sửa
 * @param {boolean} isAssigneeOnly - True nếu người sửa chỉ là nhân viên (hạn chế quyền)
 */
const updateTask = async (taskId, taskData, isAssigneeOnly) => {
    let allowedUpdates = taskData;

    // 1. LOGIC PHÂN QUYỀN: Nếu chỉ là Assignee (Member)
    if (isAssigneeOnly) {
        // Chỉ được phép cập nhật status và priority
        const allowedFields = ['status', 'priority'];
        const restrictedUpdates = {};
        
        for (const field of allowedFields) {
            if (taskData.hasOwnProperty(field)) {
                restrictedUpdates[field] = taskData[field];
            }
        }
        
        if (Object.keys(restrictedUpdates).length === 0) {
            throw new Error('Bạn chỉ có quyền cập nhật trạng thái hoặc độ ưu tiên.');
        }
        allowedUpdates = restrictedUpdates;
    }
    
    // 2. LOGIC RÀNG BUỘC: Không cho hoàn thành Task Cha nếu con chưa xong
    if (allowedUpdates.status === 'DONE') {
        const hasChildrenLeft = await taskModel.hasIncompleteChildren(taskId);
        if (hasChildrenLeft) {
            throw new Error('Không thể hoàn thành. Vẫn còn công việc con chưa xong.');
        }
    }

    try {
        // Lấy thông tin task cũ để so sánh (phục vụ thông báo)
        const oldTask = await taskModel.findById(taskId);
        if (!oldTask) throw new Error('Công việc không tồn tại.');

        // 3. Thực hiện Update vào DB
        const updatedTask = await taskModel.update(taskId, allowedUpdates);

        // 4. LOGIC TỰ ĐỘNG: Revert Task Cha
        // Nếu task con bị chuyển từ DONE sang trạng thái khác (TODO/IN_PROGRESS)
        // Thì Task Cha (nếu đang DONE) cũng phải bị mở lại
        if (updatedTask.parent_id && updatedTask.status !== 'DONE') {
            const parentTask = await taskModel.findById(updatedTask.parent_id);
            
            if (parentTask && parentTask.status === 'DONE') {
                await taskModel.update(parentTask.id, { status: 'IN_PROGRESS' });
                console.log(`Auto-reverted Parent Task #${parentTask.id} to IN_PROGRESS`);
            }
        }

        // 5. GỬI THÔNG BÁO: Khi thay đổi trạng thái
        // Chỉ gửi nếu status thay đổi và người sửa khác người được giao (hoặc gửi cho chính mình để confirm cũng được, ở đây logic là gửi cho assignee)
        if (allowedUpdates.status && oldTask.status !== allowedUpdates.status && oldTask.assignee_id) {
            await notiModel.create({
                user_id: oldTask.assignee_id,
                title: '🔄 Cập nhật trạng thái',
                message: `Công việc "${oldTask.title}" đã chuyển sang ${allowedUpdates.status}`,
                type: 'STATUS'
            });
        }

        return updatedTask;
    } catch (error) {
        throw error;
    }
};

/**
 * Xóa công việc
 */
const deleteTask = async (taskId) => {
    try {
        const deletedTask = await taskModel.deleteById(taskId);
        if (!deletedTask) {
            throw new Error('Công việc không tồn tại.');
        }
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