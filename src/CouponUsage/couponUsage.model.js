'use strict';

import mongoose from 'mongoose';

/**
 * Registra cada uso de un cupón por cliente.
 * Permite controlar límites por persona sin bloqueos globales.
 */
const couponUsageSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        required: true,
        index: true
    },
    usedAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    versionKey: false
});

// Índice compuesto para consultas rápidas: "usos de este cupón por este cliente"
couponUsageSchema.index({ customer: 1, coupon: 1, usedAt: -1 });

export default mongoose.model('CouponUsage', couponUsageSchema);
