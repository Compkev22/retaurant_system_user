'use strict';

import mongoose, { Schema } from "mongoose";

const billingSchema = new mongoose.Schema({
    branchId: {
        type: Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    client: { 
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El cliente es obligatorio para la factura']
    },
    BillSerie: {
        type: String,
        required: [true, 'La serie de la factura es requerida'],
        trim: true,
        maxlength: [35, 'La serie de la factura no puede tener más de 35 caracteres'],
    },
    BillDate: {
        type: Date,
        default: Date.now
    },
    Order: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    },
    BillSubtotal: {
        type: Number
    },
    BillIVA: {
        type: Number
    },
    BillTotal: {
        type: Number
    },
    BillPaymentMethod: {
        type: String,
        enum: ['CASH', 'CARD'],
        required: true
    },
    BillStatus: {
        type: String,
        enum: ['GENERATED', 'PAYED'],
        default: 'GENERATED'
    }
}, { 
    versionKey: false, 
    timestamps: true 
});

billingSchema.index({ BillSerie: 1, client: 1 });

export default mongoose.model("Billing", billingSchema);