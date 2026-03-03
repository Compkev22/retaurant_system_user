'use strict';

import mongoose from 'mongoose';

const orderRequestSchema = new mongoose.Schema({

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },

    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },

    orderType: {
        type: String,
        enum: ['TAKEAWAY', 'DELIVERY'],
        required: true
    },
    couponCode: {
        type: String,
        uppercase: true,
        trim: true,
        default: null
    },
    appliedCoupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
    }
    ,
    orderStatus: {
            type: String,
            enum: [
                'Pendiente',
                'En Preparacion',
                'Listo',
                'Entregado',
                'Cancelado'
            ],
            default: 'Pendiente'
        },
    deliveryAddress: {
        type: String
    },

    total: {
        type: Number,
        default: 0
    }

}, {
    timestamps: true
});

export default mongoose.model('OrderRequest', orderRequestSchema);