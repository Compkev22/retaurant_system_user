'use strict';

import { Schema, model } from 'mongoose';

const tableSchema = Schema({
    branchId: {
        type: Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    numberTable: {
        type: Number,
        required: [true, 'El número de mesa es obligatorio'],
        unique: true
    },
    capacity: {
        type: Number,
        required: [true, 'La capacidad es obligatoria']
    },
    // Estandarizamos para el Soft Delete
    TableStatus: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    },
    Coordinates: {
        type: [Number],
        default: [0, 0]
    },
    // Para uso de negocio (opcional, pero lo mantenemos si lo necesitas)
    availability: {
        type: String,
        enum: ['Disponible', 'Ocupada', 'Mantenimiento'],
        default: 'Disponible'
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, { versionKey: false, timestamps: true });

export default model('Table', tableSchema);