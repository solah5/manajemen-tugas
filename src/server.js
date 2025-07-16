require('dotenv').config(); 
const Hapi = require("@hapi/hapi");
const routes = require("./routes");

const init = async () => {
  const server = Hapi.server({
    // --- UBAH BAGIAN INI ---
    port: process.env.PORT || 5000,
    host: "0.0.0.0", // <-- Penting untuk environment seperti Railway
    // -----------------------
    routes: {
      cors: {
        origin: ["*"],
        headers: ["Authorization", "Content-Type"],
        credentials: true,
      },
    },
  });

  // Register routes
  server.route(routes);

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
