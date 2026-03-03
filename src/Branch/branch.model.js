'use strict';

import mongoose, { trusted } from 'mongoose';

const branchSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true,
        default: 'Guatemala'
    },
    zone: {
        type: Number,
        required: true
    },
    phone: {
        type: Number,
        required: true
    },
    Email: {
        type: String,
        required: true
    },
    tableCapacity: {
        type: Number,
        default: 0
    },
    Category: {
        type: String,
        enum: ['Gourmet', 'Buffet', 'Fast Food', 'Familiar'],
        required: true
    },
    hasDriveThru: {
        type: Boolean,
        default: true
    },
    AveragePrices: {
        type: Number,
        default: 0.00,
        required: true
    },
    OpenedAt: {
        type: String,
        default: '06:00',
        required: true
    },
    ClosedAt: {
        type: String,
        default: '18:00',
        required: true
    },
    branchStatus: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    },
    Photos: [{
        ImgaeURL: {
            type: String,
            default: 'branches/restaurant_generic'
        }
    }],
    deletedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

branchSchema.index({ zone: 1, name: 1 });

export default mongoose.model('Branch', branchSchema);