require('dotenv').config();

const Hapi = require("@hapi/hapi");
const routes = require("./routes");

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: "0.0.0.0",
    routes: {
      cors: {
        origin: ['*'], // Izinkan akses dari domain manapun
        headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match'], // Izinkan header penting
        credentials: true
      }
    },
  });

  // Langsung daftarkan rute API Anda
  server.route(routes);

  await server.start();
  console.log(`🚀 Server API berjalan di ${server.info.uri}`);
};

init();