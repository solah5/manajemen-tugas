// Import dependensi yang diperlukan
const { nanoid } = require("nanoid");
const pool = require("./database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Baca Kunci rahasia untuk JWT dari Environment Variable
const SECRET_KEY = process.env.JWT_SECRET;

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
    console.error("Register handler error:", error); // <-- LOGGING DITAMBAHKAN
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
    console.error("Login handler error:", error); // <-- LOGGING DITAMBAHKAN
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
    console.error("Authentication error:", error); // <-- LOGGING DITAMBAHKAN
    return h
      .response({
        status: "fail",
        message: "Invalid or expired token",
      })
      .code(401)
      .takeover();
  }
};

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

const addNoteHandler = async (request, h) => {
  const { title, tags, body, status = "pending", deadline } = request.payload;
  const userId = request.userId;

  const id = nanoid(16);
  const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
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
    console.error("Add note handler error:", error); // <-- LOGGING DITAMBAHKAN
    return h
      .response({
        status: "fail",
        message: "Failed to add note",
      })
      .code(500);
  }
};

const getAllNotesHandler = async (request, h) => {
  const userId = request.userId;

  try {
    const [notes] = await pool.execute("SELECT * FROM notes WHERE userId = ?", [
      userId,
    ]);
    return { status: "success", data: { notes } };
  } catch (error) {
    console.error("Get all notes handler error:", error); // <-- LOGGING DITAMBAHKAN
    return h
      .response({
        status: "fail",
        message: "Failed to fetch notes",
      })
      .code(500);
  }
};

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
    console.error("Get note by id handler error:", error); // <-- LOGGING DITAMBAHKAN
    return h
      .response({
        status: "fail",
        message: "Failed to fetch note",
      })
      .code(500);
  }
};

const editNoteByIdHandler = async (request, h) => {
  const { id } = request.params;
  const { title, tags, body, status, deadline } = request.payload;
  const userId = request.userId;
  const updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

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
    console.error("Edit note handler error:", error); // <-- LOGGING DITAMBAHKAN
    return h
      .response({
        status: "fail",
        message: "Failed to update note",
      })
      .code(500);
  }
};

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
    console.error("Delete note handler error:", error); // <-- LOGGING DITAMBAHKAN
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

const getAllUsersHandler = async (request, h) => {
  try {
    const [users] = await pool.execute("SELECT id, username, role FROM users");
    return { status: "success", data: { users } };
  } catch (error) {
    console.error("Get all users admin handler error:", error); // <-- LOGGING DITAMBAHKAN
    return h
      .response({
        status: "fail",
        message: "Failed to fetch users",
      })
      .code(500);
  }
};

const getAllTasksAdminHandler = async (request, h) => {
  try {
    const [notes] = await pool.execute(`
      SELECT notes.*, users.username
      FROM notes
      JOIN users ON notes.userId = users.id
    `);
    return { status: "success", data: { notes } };
  } catch (error) {
    console.error("Get all tasks admin handler error:", error); // <-- LOGGING DITAMBAHKAN
    return h
      .response({
        status: "fail",
        message: "Failed to fetch all tasks",
      })
      .code(500);
  }
};

const getTasksByUserIdAdminHandler = async (request, h) => {
  const { userId } = request.params;
  try {
    const [notes] = await pool.execute("SELECT * FROM notes WHERE userId = ?", [
      userId,
    ]);
    return { status: "success", data: { notes } };
  } catch (error) {
    console.error("Get tasks by user id admin handler error:", error); // <-- LOGGING DITAMBAHKAN
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