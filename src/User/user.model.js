'use strict';

import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    // ── Vínculo con AuthService (Postgres) ─────────────────────────
    authId: {
        type: String,
        unique: true,
        sparse: true, // permite null para usuarios legados
        index: true,
    },
    UserName: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true,
        maxlength: [100, 'El nombre no puede tener más de 100 caracteres']
    },
    UserSurname: {
        type: String,
        required: [true, 'El apellido es requerido'],
        trim: true,
        maxlength: [100, 'El apellido no puede tener más de 100 caracteres']
    },
    UserEmail: {
        type: String,
        required: [true, 'El correo es requerido'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        // Ya no es la fuente de verdad (eso lo maneja el Auth-Service),
        // pero se mantiene para compatibilidad con el esquema/index local.
        type: String,
        required: false,
        select: false,
    },
    role: {
        type: String,
        enum: ['PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE', 'CLIENT'],
        default: 'CLIENT'
    },
    phone: {
        type: String,
        trim: true,
    },
    UserStatus: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    UserCreatedAt: {
        type: Date,
        default: Date.now
    }
});

// Encripta la contraseña solo si viene presente (sincronización opcional)
userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw new Error('Error al encriptar la contraseña: ' + error.message);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
    const { __v, password, _id, ...user } = this.toObject();
    user.uid = _id;
    return user;
};

export default mongoose.model("User", userSchema);