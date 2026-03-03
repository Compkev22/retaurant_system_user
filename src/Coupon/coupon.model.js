'use strict';

import { Schema, model } from 'mongoose';

const couponSchema = new Schema({
    code: {
        type: String,
        required: [true, 'El código es obligatorio'],
        unique: true,
        uppercase: true,
        trim: true,
        maxlength: [15, 'El código no puede exceder los 15 caracteres']
    },
    discountPercentage: {
        type: Number,
        required: [true, 'El porcentaje de descuento es obligatorio'],
        min: [1, 'El descuento mínimo es 1%'],
        max: [100, 'El descuento máximo es 100%']
    },
    expirationDate: {
        type: Date,
        required: [true, 'La fecha de expiración es obligatoria']
    },
    usageLimit: {
        type: Number,
        default: 10,
        min: [1, 'El límite de uso debe ser al menos 1']
    },
    usedCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    }
}, { 
    timestamps: true, 
    versionKey: false 
});

export default model('Coupon', couponSchema);