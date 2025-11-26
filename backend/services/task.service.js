const taskModel = require('../models/task.model');
const userModel = require('../models/user.model'); // Sẽ cần để kiểm tra assignee

/**
 * Tạo công việc mới
 */
const createTask = async (projectId, taskData, user) => {
    const { assignee_id } = taskData;

    // (Tùy chọn) Kiểm tra xem người được gán (assignee) có tồn tại không
    if (assignee_id) {
        const assignee = await userModel.findById(assignee_id);
        if (!assignee) {
            throw new Error('Người được giao không tồn tại.');
        }
        // (Nâng cao) Bạn cũng có thể kiểm tra xem assignee có phải là thành viên dự án không
    }

    const fullTaskData = {
        ...taskData,
        projectId: projectId,
        created_by: user.id, // user là người tạo (PM/Admin)
    };

    try {
        const newTask = await taskModel.create(fullTaskData);
        return newTask;
    } catch (error) {
        throw error;
    }
};

/**
 * Lấy cây công việc của dự án
 */
const getTasksForProject = async (projectId) => {
    // 1. Lấy danh sách phẳng (flat list)
    const tasks = await taskModel.findByProjectId(projectId);
    
    // 2. Hàm đệ quy để xây dựng cây
    const buildTree = (tasksList, parentId = null) => {
        const tree = [];
        
        // Lọc ra các công việc con của parentId hiện tại
        const children = tasksList.filter(task => task.parent_id === parentId);
        
        for (const child of children) {
            // Tìm các công việc con của (child)
            const subTasks = buildTree(tasksList, child.id);
            if (subTasks.length > 0) {
                child.subTasks = subTasks; // Gán mảng con vào
            }
            tree.push(child);
        }
        
        return tree;
    };

    // 3. Bắt đầu xây dựng cây từ cấp cao nhất (parent_id = null)
    const taskTree = buildTree(tasks);
    return taskTree;
};

/**
 * Cập nhật công việc
 */
const updateTask = async (taskId, taskData, isAssigneeOnly) => {
    let allowedUpdates = taskData;

    // 1. Logic phân quyền (Giữ nguyên)
    if (isAssigneeOnly) {
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

    // 2. Logic chặn: Không cho Task cha DONE nếu con chưa xong (Giữ nguyên từ bước trước)
    if (allowedUpdates.status === 'DONE') {
        const hasChildrenLeft = await taskModel.hasIncompleteChildren(taskId);
        if (hasChildrenLeft) {
            throw new Error('Không thể hoàn thành. Vẫn còn công việc con chưa xong.');
        }
    }

    try {
        // 3. Thực hiện Update
        const updatedTask = await taskModel.update(taskId, allowedUpdates);
        if (!updatedTask) {
            throw new Error('Công việc không tồn tại.');
        }

        // --- 4. LOGIC MỚI: TỰ ĐỘNG CẬP NHẬT TASK CHA ---
        // Nếu task con vừa update KHÔNG phải là DONE (tức là đang làm lại)
        // Và nó có task cha (parent_id)
        if (updatedTask.parent_id && updatedTask.status !== 'DONE') {
            // Kiểm tra trạng thái hiện tại của Task Cha
            const parentTask = await taskModel.findById(updatedTask.parent_id);
            
            // Nếu Task Cha đang là DONE -> Đẩy về IN_PROGRESS
            if (parentTask && parentTask.status === 'DONE') {
                await taskModel.update(parentTask.id, { status: 'IN_PROGRESS' });
                console.log(`Auto-reverted Parent Task #${parentTask.id} to IN_PROGRESS`);
            }
        }
        // ------------------------------------------------

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