'use strict';

import { Schema, model } from 'mongoose';

const orderSchema = Schema({
    branchId: {
        type: Schema.Types.ObjectId, 
        ref: 'Branch',
        required: true
    },
    orderType: {
        type: String,
        enum: ["DINE_IN", "TAKEAWAY", "DELIVERY"],
        required: true
    },
    empleadoId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: function () {
            return this.orderType === "DINE_IN";
        }
    },
    mesaId: {
        type: Schema.Types.ObjectId,
        ref: "Table",
        required: function () {
            return this.orderType === "DINE_IN";
        }
    },
    coupon: {
        type: Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null
    },
    discountApplied: {
        type: Number,
        default: 0
    },
    horaPedido: {
        type: Date,
        default: Date.now
    },
    estado: {
        type: String,
        enum: ['Pendiente', 'En Preparacion', 'Listo', 'Entregado', 'Cancelado'],
        default: 'Pendiente'
    },
    total: {
        type: Number,
        default: 0
    }
}, { versionKey: false, timestamps: true });

orderSchema.index({ estado: 1, horaPedido: 1 });

export default model('Order', orderSchema);