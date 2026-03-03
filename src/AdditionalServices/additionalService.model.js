import { Schema, model } from 'mongoose';

const additionalServiceSchema = new Schema({
    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        required: true
    },
    AdditionalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    }
}, { timestamps: true });

additionalServiceSchema.index({ Name: 1 });

export default model('AdditionalService', additionalServiceSchema);