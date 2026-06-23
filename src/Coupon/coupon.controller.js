'use strict';

import Coupon from './coupon.model.js';
import CouponUsage from '../CouponUsage/couponUsage.model.js';
import User from '../User/user.model.js';

// Devuelve {start, end} de la semana (lunes-domingo) que contiene `date`
const getWeekRange = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay(); // 0=Dom, 1=Lun...
    const diffToMonday = (day === 0 ? -6 : 1 - day);
    const start = new Date(d);
    start.setDate(d.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

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

        // Verificar límite semanal por cliente (1 uso por semana)
        const userDB = await User.findOne({ authId: req.user.id });
        if (userDB) {
            const { start, end } = getWeekRange();
            const usosEstaSemana = await CouponUsage.countDocuments({
                customer: userDB._id,
                coupon: coupon._id,
                usedAt: { $gte: start, $lte: end }
            });

            if (usosEstaSemana >= 1) {
                // Calcular cuántos días faltan para el próximo lunes
                const today = new Date();
                const daysUntilMonday = today.getDay() === 0 ? 1 : 8 - today.getDay();
                return res.status(400).json({
                    success: false,
                    message: `Ya usaste este cupón esta semana. Podrás volver a usarlo el próximo lunes (en ${daysUntilMonday} día${daysUntilMonday !== 1 ? 's' : ''}).`
                });
            }
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