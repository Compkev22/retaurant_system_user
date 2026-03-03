import { Schema, model } from 'mongoose';

const reservationSchema = new Schema({
    branchId: {
        type: Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    clientId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tableId: {
        type: Schema.Types.ObjectId,
        ref: 'Table',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    numberOfPersons: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ['Confirmada', 'Pendiente', 'Cancelada', 'Completada'],
        default: 'Pendiente'
    },
    statusRes: {
        type: String,
        enum: ['ACTIVADO', 'DESACTIVADO'],
        default: 'ACTIVADO',
        uppercase: true
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    versionKey: false,
    timestamps: true
});

/* Índices recomendados */
reservationSchema.index({ branchId: 1, date: 1 });
reservationSchema.index({ tableId: 1, date: 1, time: 1 });
// Índice para filtrar rápidamente las activas
reservationSchema.index({ statusRes: 1 });

export default model('Reservation', reservationSchema);