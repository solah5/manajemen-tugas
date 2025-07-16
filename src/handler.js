// Import dependensi yang diperlukan
const { nanoid } = require("nanoid"); // Untuk membuat ID unik
const pool = require("./database"); // Koneksi database MySQL
const bcrypt = require("bcrypt"); // Untuk hash dan verifikasi password
const jwt = require("jsonwebtoken"); // Untuk membuat dan memverifikasi token JWT

const SECRET_KEY = process.env.JWT_SECRET; // Kunci rahasia untuk JWT

// ===============================
// Fungsi Pembantu
// ===============================

// Membuat token JWT untuk otentikasi
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, SECRET_KEY, { expiresIn: "1h" });
};

// ===============================
// Handler untuk Autentikasi User
// ===============================

// Registrasi pengguna baru
const registerHandler = async (request, h) => {
  const { username, password } = request.payload;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [username, hashedPassword, "user"]
    );

    const token = generateToken(result.insertId, "user");

    return h
      .response({
        status: "success",
        message: "User registered successfully",
        data: { token },
      })
      .code(201);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return h
        .response({
          status: "fail",
          message: "Username already exists",
        })
        .code(400);
    }
    return h
      .response({
        status: "error",
        message: "Internal server error",
      })
      .code(500);
  }
};

// Login pengguna
const loginHandler = async (request, h) => {
  const { username, password } = request.payload;

  try {
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return h
        .response({
          status: "fail",
          message: "Invalid credentials",
        })
        .code(401);
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return h
        .response({
          status: "fail",
          message: "Invalid credentials",
        })
        .code(401);
    }

    const token = generateToken(user.id, user.role);

    return h.response({
      status: "success",
      message: "Login successful",
      data: { token, role: user.role },
    });
  } catch (error) {
    return h
      .response({
        status: "error",
        message: "Internal server error",
      })
      .code(500);
  }
};

// ===============================
// Middleware Autentikasi & Otorisasi
// ===============================

// Middleware untuk memverifikasi token JWT
const authenticate = async (request, h) => {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    return h
      .response({
        status: "fail",
        message: "Authorization header missing",
      })
      .code(401)
      .takeover();
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    request.userId = decoded.userId;
    request.userRole = decoded.role;
    return h.continue;
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: "Invalid or expired token",
      })
      .code(401)
      .takeover();
  }
};

// Middleware untuk membatasi akses hanya untuk admin
const authorizeAdmin = async (request, h) => {
  if (request.userRole !== "admin") {
    return h
      .response({
        status: "fail",
        message: "Unauthorized: Admin access required",
      })
      .code(403)
      .takeover();
  }
  return h.continue;
};

// ===============================
// Handler untuk Operasi Catatan
// ===============================

// Menambahkan catatan baru
const addNoteHandler = async (request, h) => {
  const { title, tags, body, status = "pending", deadline } = request.payload;
  const userId = request.userId;

  const id = nanoid(16);
  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;

  try {
    await pool.execute(
      "INSERT INTO notes (id, title, tags, body, status, createdAt, updatedAt, deadline, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, title, tags, body, status, createdAt, updatedAt, deadline, userId]
    );

    return h
      .response({
        status: "success",
        message: "Note added successfully",
        data: { noteId: id },
      })
      .code(201);
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: "Failed to add note",
      })
      .code(500);
  }
};

// Mengambil semua catatan milik user saat ini
const getAllNotesHandler = async (request, h) => {
  const userId = request.userId;

  try {
    const [notes] = await pool.execute("SELECT * FROM notes WHERE userId = ?", [
      userId,
    ]);
    return { status: "success", data: { notes } };
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: "Failed to fetch notes",
      })
      .code(500);
  }
};

// Mengambil catatan berdasarkan ID (hanya milik user)
const getNotesByIdHandler = async (request, h) => {
  const { id } = request.params;
  const userId = request.userId;

  try {
    const [notes] = await pool.execute(
      "SELECT * FROM notes WHERE id = ? AND userId = ?",
      [id, userId]
    );

    if (notes.length > 0) {
      return { status: "success", data: { note: notes[0] } };
    }

    return h
      .response({
        status: "fail",
        message: "Note not found",
      })
      .code(404);
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: "Failed to fetch note",
      })
      .code(500);
  }
};

// Mengedit catatan berdasarkan ID (hanya milik user)
const editNoteByIdHandler = async (request, h) => {
  const { id } = request.params;
  const { title, tags, body, status, deadline } = request.payload;
  const userId = request.userId;
  const updatedAt = new Date().toISOString();

  try {
    const [result] = await pool.execute(
      "UPDATE notes SET title = ?, tags = ?, body = ?, status = ?, updatedAt = ?, deadline = ? WHERE id = ? AND userId = ?",
      [title, tags, body, status, updatedAt, deadline, id, userId]
    );

    if (result.affectedRows > 0) {
      return h.response({
        status: "success",
        message: "Note updated successfully",
      });
    }

    return h
      .response({
        status: "fail",
        message: "Note not found or not owned by user",
      })
      .code(404);
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: "Failed to update note",
      })
      .code(500);
  }
};

// Menghapus catatan berdasarkan ID (hanya milik user)
const deleteNoteByIdHandler = async (request, h) => {
  const { id } = request.params;
  const userId = request.userId;

  try {
    const [result] = await pool.execute(
      "DELETE FROM notes WHERE id = ? AND userId = ?",
      [id, userId]
    );

    if (result.affectedRows > 0) {
      return h.response({
        status: "success",
        message: "Note deleted successfully",
      });
    }

    return h
      .response({
        status: "fail",
        message: "Note not found or not owned by user",
      })
      .code(404);
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: "Failed to delete note",
      })
      .code(500);
  }
};

// ===============================
// Handler untuk Admin
// ===============================

// Mengambil semua user (untuk admin)
const getAllUsersHandler = async (request, h) => {
  try {
    const [users] = await pool.execute("SELECT id, username, role FROM users");
    return { status: "success", data: { users } };
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: "Failed to fetch users",
      })
      .code(500);
  }
};

// Mengambil semua tugas dari semua user (untuk admin)
const getAllTasksAdminHandler = async (request, h) => {
  try {
    const [notes] = await pool.execute(`
      SELECT notes.*, users.username
      FROM notes
      JOIN users ON notes.userId = users.id
    `);
    return { status: "success", data: { notes } };
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: "Failed to fetch all tasks",
      })
      .code(500);
  }
};

// Mengambil semua tugas berdasarkan ID user (untuk admin)
const getTasksByUserIdAdminHandler = async (request, h) => {
  const { userId } = request.params;
  try {
    const [notes] = await pool.execute("SELECT * FROM notes WHERE userId = ?", [
      userId,
    ]);
    return { status: "success", data: { notes } };
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: "Failed to fetch tasks for this user",
      })
      .code(500);
  }
};

// ===============================
// Ekspor semua handler
// ===============================
module.exports = {
  registerHandler,
  loginHandler,
  authenticate,
  authorizeAdmin,
  addNoteHandler,
  getAllNotesHandler,
  getNotesByIdHandler,
  editNoteByIdHandler,
  deleteNoteByIdHandler,
  getAllUsersHandler,
  getAllTasksAdminHandler,
  getTasksByUserIdAdminHandler,
};
