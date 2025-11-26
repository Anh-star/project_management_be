# Sử dụng Node.js bản nhẹ (Alpine Linux)
FROM node:18-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Copy file package.json trước để tận dụng cache của Docker
COPY package*.json ./

# Cài đặt thư viện (chỉ cài dependencies chính, bỏ qua devDependencies)
RUN npm install --production

# Copy toàn bộ mã nguồn vào container (bao gồm cả thư mục public chứa frontend)
COPY . .

# Mở port 5000 (Port chạy Express của bạn)
EXPOSE 5000

# Lệnh chạy ứng dụng
CMD ["node", "index.js"]