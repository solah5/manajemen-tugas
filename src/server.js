require('dotenv').config();

const Hapi = require("@hapi/hapi");
const Inert = require('@hapi/inert');
const path = require('path');
const routes = require("./routes"); // Pastikan path ini benar
const dbPool = require('./database'); // Panggil konfigurasi pool dari database.js

const init = async () => {
  console.log('Mendefinisikan server Hapi...');
  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: "0.0.0.0",
    routes: {
      files: {
        relativeTo: path.join(__dirname, 'frontend')
      }
    },
  });

  await server.register(Inert);

  // Route untuk landing page
  server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return h.file('landing.html');
    }
  });

  // Route untuk file statis lainnya
  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: '.',
        redirectToSlash: true,
      }
    }
  });

  // Daftarkan rute API Anda
  server.route(routes);

  // Coba tes koneksi database SETELAH server didefinisikan
  try {
    console.log('Mencoba terhubung ke database...');
    const connection = await dbPool.getConnection();
    console.log('✅ Berhasil terhubung ke database.');
    connection.release(); // Lepaskan koneksi setelah tes berhasil
  } catch (dbError) {
    console.error('❌ Gagal terhubung ke database:', dbError);
    // Kita tidak menghentikan proses jika DB gagal, agar server tetap bisa jalan
  }

  // MULAI SERVER SEKARANG
  await server.start();
  console.log(`🚀 Server berjalan di ${server.info.uri}`);
};

init();