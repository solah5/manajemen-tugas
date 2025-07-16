require('dotenv').config();

const Hapi = require("@hapi/hapi");
const Inert = require('@hapi/inert');
const path = require('path');
const routes = require("./routes"); // <-- Aktifkan kembali baris ini

const init = async () => {
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
    // Kembalikan teks biasa untuk memastikan health check lolos
    return 'Aplikasi backend berjalan. Frontend di-load terpisah.';
  }
});

  // Route untuk file statis lain
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

  server.route(routes); // <-- Aktifkan kembali baris ini

  await server.start();
  console.log(`🚀 Server berhasil aktif di ${server.info.uri}`);
};

init();