const corsOptions = {
    //Permite que cualquier origen pueda acceder a la API
    origin: true,
    //Permite que la API envie y reciba cookies
    credential: true,
    //Especifica los metodos HTTP permitidos
    methods: "GET,POST,PUT,DELETE",
    //Especifica los encabezados permitidos
    allowedHeaders: "Content-Type,Authorization",
};
//Exporta la configuracion de CORS para ser utilizada en otros archivos
export {corsOptions};