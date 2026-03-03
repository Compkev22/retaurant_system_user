'use strict';

import mongoose from 'mongoose';

const orderDetailSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    productoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: false
    },
    comboId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Combo',
        required: false
    },
    cantidad: {
        type: Number,
        required: true,
        min: 1
    },
    precio: {
        type: Number,
        required: true,
        min: 0
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true,
    versionKey: false
});

export default mongoose.model('OrderDetail', orderDetailSchema);
