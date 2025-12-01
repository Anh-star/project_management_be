-- init.sql

-- 1. ENUMs
CREATE TYPE user_role AS ENUM ('ADMIN', 'PM', 'MEMBER');
CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'OVERDUE');
CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- 2. Bảng Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'MEMBER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Projects
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    project_code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS',
    created_by INT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng Project Members
CREATE TABLE project_members (
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, user_id)
);

-- 5. Bảng Tasks
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status NOT NULL DEFAULT 'TODO',
    priority task_priority NOT NULL DEFAULT 'MEDIUM',
    start_date TIMESTAMP,
    due_date TIMESTAMP,
    assignee_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_by INT NOT NULL REFERENCES users(id),
    parent_id INT REFERENCES tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
    -- 1. Thêm cột is_manager vào bảng project_members
    ALTER TABLE project_members 
    ADD COLUMN is_manager BOOLEAN DEFAULT FALSE;


-- 1. Tạo bảng thông báo
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50), -- 'ASSIGN', 'STATUS', 'OVERDUE'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP DEFAULT NULL;

CREATE TABLE attachments (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,   -- <--- Sửa thành 255
    file_path TEXT NOT NULL,           -- <--- Sửa thành TEXT
    file_type VARCHAR(255),            -- <--- Sửa thành 255
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE comments 
ADD COLUMN parent_id INT REFERENCES comments(id) ON DELETE CASCADE;

ALTER TABLE comments ADD COLUMN image_url TEXT;
-- 2. Thêm cột đánh dấu đã báo quá hạn chưa (để tránh báo lặp lại) cho bảng tasks
ALTER TABLE tasks ADD COLUMN is_overdue_notified BOOLEAN DEFAULT FALSE;
-- (Tùy chọn) Tạo sẵn 1 tài khoản Admin mặc định
-- Pass: 123456 (hash bcrypt mẫu)
-- Mật khẩu là: 123456
--INSERT INTO users (username, email, password_hash, role) 
--VALUES ('admin', 'admin@example.com', '$2a$10$X7V.j/X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X', 'ADMIN');