const Hapi = require("@hapi/hapi");

const init = async () => {
    const server = Hapi.server({
        port: process.env.PORT || 5000,
        host: "0.0.0.0",
    });

    server.route({
        method: 'GET',
        path: '/',
        handler: (request, h) => {
            return 'Hello, Railway! Server tes berhasil berjalan.';
        }
    });

    await server.start();
    console.log(`🚀 Server Tes berjalan di ${server.info.uri}`);
};

init();