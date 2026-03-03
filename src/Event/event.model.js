import { Schema, model } from 'mongoose';

const eventSchema = new Schema({
    branchId: {
        type: Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },

    clientId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    additionalServices: [{
        additionalServiceId: {
            type: Schema.Types.ObjectId,
            ref: 'AdditionalService',
            required: false
        }
    }],

    eventDate: {
        type: Date,
        required: true
    },

    startTime: {
        type: String,
        required: true
    },

    endTime: {
        type: String,
        required: true
    },

    numberOfPersons: {
        type: Number,
        required: true,
        min: 1
    },

    tables: [{
        type: Schema.Types.ObjectId,
        ref: 'Table'
    }],

    status: {
        type: String,
        enum: ['Pendiente', 'Confirmado', 'Cancelado', 'Finalizado'],
        default: 'Pendiente'
    },

    notes: {
        type: String,
        trim: true
    }

}, {
    timestamps: true,
    versionKey: false
});

eventSchema.index({ branchId: 1, eventDate: 1 });

export default model('Event', eventSchema);