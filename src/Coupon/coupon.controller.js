'use strict';

import Coupon from './coupon.model.js';

// Listar cupones activos disponibles para el cliente
export const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({ status: 'ACTIVE' }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: coupons });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Obtener cupón por id
export const getCouponById = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Cupón no encontrado' });
        }
        res.status(200).json({ success: true, data: coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Validar cupón por código (para aplicar en checkout)
export const getCouponByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const coupon = await Coupon.findOne({ code: code.toUpperCase(), status: 'ACTIVE' });

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Cupón no válido o inactivo' });
        }

        if (new Date(coupon.expirationDate) < new Date()) {
            return res.status(400).json({ success: false, message: 'El cupón ha expirado' });
        }

        if (coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ success: false, message: 'El cupón alcanzó su límite de uso' });
        }

        res.status(200).json({ success: true, data: coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Crear cupón (plantilla CRUD)
export const createCoupon = async (req, res) => {
    try {
        const { code, discountPercentage, expirationDate, usageLimit } = req.body;
        const upperCode = code.toUpperCase();

        const existing = await Coupon.findOne({ code: upperCode });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `El código de cupón '${upperCode}' ya está registrado`
            });
        }

        if (new Date(expirationDate) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de expiración no puede ser anterior a hoy'
            });
        }

        const newCoupon = await Coupon.create({
            code: upperCode,
            discountPercentage,
            expirationDate,
            usageLimit
        });

        res.status(201).json({ success: true, message: 'Cupón creado exitosamente', data: newCoupon });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al crear el cupón', error: error.message });
    }
};

// Actualizar cupón
export const updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.body.code) req.body.code = req.body.code.toUpperCase();

        const updatedCoupon = await Coupon.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });

        if (!updatedCoupon) {
            return res.status(404).json({ success: false, message: 'Cupón no encontrado' });
        }

        res.status(200).json({ success: true, message: 'Cupón actualizado', data: updatedCoupon });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Toggle status (borrado lógico)
export const toggleCouponStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findById(id);

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Cupón no encontrado' });
        }

        coupon.status = coupon.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        await coupon.save();

        res.status(200).json({
            success: true,
            message: `Cupón ${coupon.status === 'ACTIVE' ? 'activado' : 'desactivado'} exitosamente`,
            data: coupon
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};