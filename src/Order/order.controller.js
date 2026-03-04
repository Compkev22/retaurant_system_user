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

