import { Schema, model } from 'mongoose';

const inventorySchema = Schema({
    branchId: {
        type: Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    name: {
        type: String,
        required: [true, 'El nombre es obligatorio']
    },
    description: {
        type: String,
        required: [true, 'La descripción es obligatoria']
    },
    stock: {
        type: Number,
        required: [true, 'El stock es obligatorio'],
        default: 0
    },
    unitCost: {
        type: Number,
        required: [true, 'El costo unitario es obligatorio']
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, { versionKey: false });

export default model('Inventory', inventorySchema);