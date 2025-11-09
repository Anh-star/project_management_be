// backend/config/swagger.js
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
    // Thông tin cơ bản về API
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Project Management API',
            version: '1.0.0',
            description: 'Tài liệu API cho ứng dụng Quản lý dự án',
        },
        servers: [
            {
                url: 'http://localhost:3000/api/v1', // URL cơ sở của API
            },
        ],
        // Cấu hình cho JWT (Authorize)
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Nhập JWT token của bạn (ví dụ: Bearer ey...)'
                }
            }
        },
        security: [
            {
                bearerAuth: [] // Yêu cầu JWT cho tất cả API (có thể ghi đè ở từng route)
            }
        ]
    },
    // Đường dẫn đến các file chứa JSDoc
    // Chúng ta sẽ trỏ đến các file routes
    apis: ['./backend/routes/*.js'], 
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;