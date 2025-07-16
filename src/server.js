// server.js

require('dotenv').config();

const Hapi = require("@hapi/hapi");
const Inert = require('@hapi/inert'); // Panggil plugin Inert
const path = require('path');        // Panggil module 'path'
const routes = require("./src/routes"); // Pastikan path ke routes benar

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: "0.0.0.0",
    routes: {
      files: {
        // Beritahu Hapi di mana folder frontend Anda berada
        relativeTo: path.join(__dirname, 'frontend') 
      },
      cors: {
        origin: ["*"],
      },
    },
  });

  // Daftarkan plugin Inert
  await server.register(Inert);

  // Buat route utama untuk menyajikan landing.html
  server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return h.file('landing.html');
    }
  });

  // Buat route untuk menyajikan semua file lain (CSS, JS, images)
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

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

init();