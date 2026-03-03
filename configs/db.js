'use strict';

import mongoose from 'mongoose';

export const dbConnection = async () => {
    try {
        //Monitoreo
        mongoose.connection.on('error', () => {
            console.log('MongoDB | no se pudo conectar con mongoDB');
        });

        mongoose.connection.on('connecting', () => {
            console.log('MongoDB | Intentando conectar con mongoDB');
        });

        mongoose.connection.on('connected', () => {
            console.log('MongoDB | conectando con mongoDB');
        });

        mongoose.connection.on('open', () => {
            console.log('MongoDB | conectando a la base de datos restaurant/system');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB | reconectando a mongoDB');
        });

        mongoose.connection.on('disconect', () => {
            console.log('MongoDB | desconectado de mongoDB');
        });

        // Conexion
        // Menciona que URI_MongoDB es una variable de entorno
        await mongoose.connect(process.env.URI_MONGODB, {
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 10,
        });
    } catch (error) {
        console.error(`Error al conectar con la base de datos: ${error}`);
        process.exit(1);
    }
};
//Ciere Controlado
const gracefulShutdown = async (signal) => {
    console.log(`MongoDB | Received ${signal}, Closing database connection...`);
    try {
        await mongoose.connection.close();
        console.log('MongoDB | Database connection closed successfully')
        process.exit(0); // salida exitosa sin errores
    } catch (error) {
        console.error('MongoDB | Error during graceful shutdown:', error.message);
        process.exit(1); // salida con error
    }
};

// Manejadores de señal de proceso" (Process signal handlers)
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSRT'));