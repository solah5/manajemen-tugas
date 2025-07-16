const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  // Gunakan variabel dari Railway
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  
  // --- INI PERUBAHAN TERAKHIR ---
  // Izinkan koneksi meskipun sertifikat tidak terverifikasi (umum untuk PaaS seperti Railway)
  ssl: {
      "rejectUnauthorized": false 
  },
  // -----------------------------

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;