const authService = require("../services/auth.service");

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Kiểm tra đầu vào
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Vui lòng điền đủ thông tin." });
    }

    const user = await authService.registerUser(username, email, password);

    // Trả về 201 Created
    res.status(201).json({ message: "Đăng ký thành công!", user });
  } catch (error) {
    // Lỗi do client (ví dụ: email đã tồn tại)
    res.status(400).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền email và mật khẩu." });
    }

    const { user, token } = await authService.loginUser(email, password);

    // Trả về 200 OK
    res.status(200).json({ message: "Đăng nhập thành công!", user, token });
  } catch (error) {
    // Lỗi xác thực
    res.status(401).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
};
