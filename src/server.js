require('dotenv').config();

const Hapi = require("@hapi/hapi");
const Inert = require('@hapi/inert');
const path = require('path');
const routes = require("./routes");

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

  console.log('Mendaftarkan plugin...');
  await server.register(Inert);

  console.log('Mendefinisikan rute...');
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

  // Daftarkan rute API Anda dari file lain
  server.route(routes);

  // LANGSUNG MULAI SERVER
  await server.start();
  console.log(`🚀 Server berhasil aktif di ${server.info.uri}`);
};

init();