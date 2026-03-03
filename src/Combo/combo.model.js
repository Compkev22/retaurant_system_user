'use strict';

import mongoose from "mongoose";

const comboSchema = new mongoose.Schema({
    ComboName: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true,
        maxlength: [100, 'El nombre no puede tener más de 100 caracteres']
    },
    ComboList: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        cantidad: {
            type: Number,
            required: true,
            default: 1, // 1 papas, 2 hamburguesas, etc...
            min: [1, 'La cantidad mínima es 1']
        }
    }],
    status: {
        type: String,
        enum: ['Disponible', 'Agotado', 'Descontinuado'],
        default: 'Disponible'
    },
    ComboDescription: {
        type: String,
        required: [true, 'La descripción es requerida'],
        trim: true,
        maxlength: [100, 'La descripción no puede tener más de 100 caracteres']
    },
    ComboPrice: {
        type: Number,
        required: [true, 'El precio es requerido'],
    },
    ComboDiscount: {
        type: Number,
        default: 0,
    },
    ComboStatus: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    },
    deletedAt: {
        type: Date,
        default: null,
        index: true
    }
}, { 
    timestamps: true, 
    versionKey: false
});

comboSchema.index({ ComboName: 1 });

export default mongoose.model("Combo", comboSchema);
