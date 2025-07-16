const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  // Gunakan NAMA variabel yang diberikan Railway
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT, // Penulisan port Anda sudah benar!

  // Tambahkan konfigurasi SSL untuk koneksi aman ke database cloud
  ssl: {
    "rejectUnauthorized": true
  },

  // Opsi ini bisa tetap ada
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;