const allowedOrigins = [
    process.env.CLIENT_ADMIN_URL || 'http://localhost:5173',
    process.env.CLIENT_USER_URL || 'http://localhost:5174',
    process.env.CLIENT_EXPO_URL || 'http://localhost:8081',
];

const corsOptions = {
    //Permite que cualquier origen pueda acceder a la API
    origin: function (origin, callback) {
        // Permitir requests sin origin (Postman, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    //Permite que la API envie y reciba cookies
    credentials: true,
    //Especifica los metodos HTTP permitidos
    methods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
    //Especifica los encabezados permitidos
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    maxAge: 600,
};
//Exporta la configuracion de CORS para ser utilizada en otros archivos
export {corsOptions};