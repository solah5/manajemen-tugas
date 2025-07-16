// Import semua handler yang dibutuhkan dari handler.js
const {
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
} = require("./handler");

// Daftar semua route yang tersedia dalam aplikasi
const routes = [
  // ========================
  // ROUTE AUTENTIKASI USER
  // ========================

  {
    method: "POST",
    path: "/register",        // Endpoint untuk registrasi user
    handler: registerHandler,
  },
  {
    method: "POST",
    path: "/login",           // Endpoint untuk login user
    handler: loginHandler,
  },

  // ========================
  // ROUTE UNTUK CATATAN (NOTE)
  // ========================
  // Semua route ini dilindungi oleh middleware 'authenticate'

  {
    method: "POST",
    path: "/notes",           // Tambah catatan baru
    handler: addNoteHandler,
    options: {
      pre: [{ method: authenticate }],  // Hanya untuk user yang sudah login
    },
  },
  {
    method: "GET",
    path: "/notes",           // Ambil semua catatan milik user yang login
    handler: getAllNotesHandler,
    options: {
      pre: [{ method: authenticate }],
    },
  },
  {
    method: "GET",
    path: "/notes/{id}",      // Ambil detail catatan berdasarkan ID (milik user)
    handler: getNotesByIdHandler,
    options: {
      pre: [{ method: authenticate }],
    },
  },
  {
    method: "PUT",
    path: "/notes/{id}",      // Edit catatan berdasarkan ID
    handler: editNoteByIdHandler,
    options: {
      pre: [{ method: authenticate }],
    },
  },
  {
    method: "DELETE",
    path: "/notes/{id}",      // Hapus catatan berdasarkan ID
    handler: deleteNoteByIdHandler,
    options: {
      pre: [{ method: authenticate }],
    },
  },

  // ========================
  // ROUTE UNTUK ADMIN
  // ========================
  // Semua route ini dilindungi oleh middleware 'authenticate' dan 'authorizeAdmin'

  {
    method: "GET",
    path: "/admin/users",     // Ambil semua user (admin only)
    handler: getAllUsersHandler,
    options: {
      pre: [
        { method: authenticate },
        { method: authorizeAdmin },
      ],
    },
  },
  {
    method: "GET",
    path: "/admin/tasks",     // Ambil semua catatan dari semua user (admin only)
    handler: getAllTasksAdminHandler,
    options: {
      pre: [
        { method: authenticate },
        { method: authorizeAdmin },
      ],
    },
  },
  {
    method: "GET",
    path: "/admin/users/{userId}/tasks",  // Ambil semua catatan milik user tertentu (admin only)
    handler: getTasksByUserIdAdminHandler,
    options: {
      pre: [
        { method: authenticate },
        { method: authorizeAdmin },
      ],
    },
  },
];

// Ekspor array routes untuk digunakan di file utama (server.js)
module.exports = routes;
