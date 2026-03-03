'use strict';

import Order from './order.model.js';
import OrderDetail from '../OrderDetail/orderDetail.model.js';
import Table from '../Table/table.model.js';
import Coupon from '../Coupon/coupon.model.js';

// Obtener todas las Ordenes
export const getOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, estado } = req.query;

        const filter = {};
        if (estado) filter.estado = estado;

        const orders = await Order.find(filter)
            .populate('mesaId', 'numero capacidad')
            .populate('empleadoId', 'name surname')
            .populate('branchId', 'name')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Order.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las órdenes',
            error: error.message
        });
    }
};

// Obtener una Orden por ID
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id)
            .populate('mesaId')
            .populate('empleadoId')
            .populate('branchId');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        const items = await OrderDetail.find({ order: id })
            .populate('productoId')
            .populate('comboId')
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            data: { order, items }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener la orden',
            error: error.message
        });
    }
};

// Crear Orden
export const createOrder = async (req, res) => {
    try {

        const {
            branchId,
            mesaId,
            orderType
        } = req.body;

        const userRole = req.user.role;
        const empleadoId = ['EMPLOYEE', 'BRANCH_ADMIN', 'PLATFORM_ADMIN'].includes(userRole) 
            ? req.user._id 
            : null;

        //Validar tipo de Orden
        if (!orderType) {
            return res.status(400).json({
                success: false,
                message: 'orderType es obligatorio'
            });
        }

        /* ===============================
           RBAC — REGLAS DE NEGOCIO
        =============================== */

        if (orderType === 'DINE_IN' && !['EMPLOYEE', 'BRANCH_ADMIN', 'PLATFORM_ADMIN'].includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para crear órdenes en mesa'
            });
        }

        // SOLO clientes crean DELIVERY o PICKUP
        if (
            (orderType === 'DELIVERY' || orderType === 'PICKUP') &&
            userRole !== 'CLIENT'
        ) {
            return res.status(403).json({
                success: false,
                message: 'Solo clientes pueden crear órdenes DELIVERY o PICKUP'
            });
        }

        let table = null;

        // Validar Mesa para Comer Aquí
        if (orderType === 'DINE_IN') {

            if (!mesaId) {
                return res.status(400).json({
                    success: false,
                    message: 'mesaId es obligatorio para DINE_IN'
                });
            }

            table = await Table.findById(mesaId);

            if (!table) {
                return res.status(404).json({
                    success: false,
                    message: 'Mesa no encontrada'
                });
            }

            if (table.availability !== 'Disponible') {
                return res.status(400).json({
                    success: false,
                    message: 'La mesa no está disponible'
                });
            }
        }

        const { couponCode } = req.body; 
        let appliedCouponId = null;

        if (couponCode) {
            // Importar Coupon arriba en el archivo es mejor: import Coupon from '../Coupon/coupon.model.js';
            const couponDB = await Coupon.findOne({ 
                code: couponCode.toUpperCase(), 
                status: 'ACTIVE' 
            });

            if (!couponDB) {
                return res.status(404).json({ success: false, message: 'Cupón no válido o inexistente' });
            }

            if (new Date() > couponDB.expirationDate) {
                return res.status(400).json({ success: false, message: 'El cupón ha expirado' });
            }

            if (couponDB.usedCount >= couponDB.usageLimit) {
                return res.status(400).json({ success: false, message: 'El cupón ha alcanzado su límite de usos' });
            }

            appliedCouponId = couponDB._id;
            // Nota: El descuento real se aplicará cuando se calculen los OrderDetails
        }

        const order = await Order.create({
            branchId,
            mesaId: orderType === 'DINE_IN' ? mesaId : null,
            empleadoId,
            orderType,
            coupon: appliedCouponId,
            total: 0,
            estado: 'Pendiente'
        });

        // IMPORTANTE: Incrementar el uso del cupón si se aplicó
        if (appliedCouponId) {
            await Coupon.findByIdAndUpdate(appliedCouponId, { $inc: { usedCount: 1 } });
        }

        // Ocupar Mesa
        if (table) {
            table.availability = 'Ocupada';
            await table.save();
        }

        res.status(201).json({
            success: true,
            message: 'Orden creada correctamente',
            data: order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear la orden',
            error: error.message
        });
    }
};

// Actualizar Orden
export const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const userRole = req.user.role;

        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'].includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'No autorizado para editar órdenes'
            });
        }

        const order = await Order.findByIdAndUpdate(
            id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        )
            .populate('mesaId')
            .populate('empleadoId')
            .populate('branchId');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Orden actualizada exitosamente',
            data: order
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar la orden',
            error: error.message
        });
    }
};

// Cambiar estado de Orden
export const changeOrderStatus = async (req, res) => {
    try {

        const { id } = req.params;
        const { estado } = req.body;

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        order.estado = estado;
        await order.save();

        // Liberar Mesa
        if (
            (estado === 'Finalizada' || estado === 'Cancelado') &&
            order.mesaId
        ) {
            const table = await Table.findById(order.mesaId);
            if (table) {
                table.availability = 'Disponible';
                await table.save();
            }
        }

        res.status(200).json({
            success: true,
            message: 'Estado de la orden actualizado',
            data: order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al cambiar el estado de la orden',
            error: error.message
        });
    }
};