'use strict';

import Order from '../Order/order.model.js';
import OrderDetail from './orderDetail.model.js';
import Product from '../Product/product.model.js';
import Combo from '../Combo/combo.model.js';
import Inventory from '../Inventory/inventory.model.js';

export const createOrderDetail = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const { order, productoId, comboId, cantidad } = req.body;

        const existingOrder = await Order.findById(order);
        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        let precio;

        if (productoId) {
            const product = await Product.findById(productoId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }
            precio = product.precio;

            for (const ingrediente of product.ingredientes) {
                const inventaryItem = ingrediente.inventoryId;
                const cantidadNecesaria = ingrediente.cantidadUsada * cantidad;

                if (inventaryItem.stock < cantidadNecesaria) {
                    return res.status(400).json({
                        success: false,
                        message: 'No hay suficiente stock para crear el producto'
                    });
                }

            }

            for (const ingrediente of product.ingredientes) {
                const cantidadNecesaria = ingrediente.cantidadUsada * cantidad;

                await Inventory.findByIdAndUpdate(
                    ingrediente.inventoryId,
                    { $inc: { stock: -cantidadNecesaria } }
                );
            }
        }

        if (comboId) {
            const combo = await Combo.findById(comboId);
            if (!combo) {
                return res.status(404).json({
                    success: false,
                    message: 'Combo no encontrado'
                });
            }
            precio = combo.ComboPrice;
        }

        const subtotal = precio * cantidad;

        const detail = await OrderDetail.create({
            order,
            productoId,
            comboId,
            cantidad,
            precio,
            subtotal
        });

        await Order.findByIdAndUpdate(order, {
            $inc: { total: subtotal }
        });

        res.status(201).json({
            success: true,
            message: 'Item creado correctamente',
            data: detail
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear item',
            error: error.message
        });
    }
};

export const getOrderDetailsByOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        if (req.user.role === 'CLIENT') {
            if (order.clientId?.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'No autorizado' });
            }
        } else if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }


        const details = await OrderDetail.find({ order: orderId })
            .populate('productoId')
            .populate('comboId')
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            data: details
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener items',
            error: error.message
        });
    }
};


export const updateOrderDetail = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const { id } = req.params;

        const detail = await OrderDetail.findById(id);
        if (!detail) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado'
            });
        }

        const nuevaCantidad = req.body.cantidad ?? detail.cantidad;

        const nuevoSubtotal = nuevaCantidad * detail.precio;
        const diferencia = nuevoSubtotal - detail.subtotal;

        detail.set({
            cantidad: nuevaCantidad,
            subtotal: nuevoSubtotal
        });

        await detail.save();

        await Order.findByIdAndUpdate(detail.order, {
            $inc: { total: diferencia }
        });

        res.status(200).json({
            success: true,
            message: 'Item actualizado',
            data: detail
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar item',
            error: error.message
        });
    }
};

/**
 * Eliminar item
 */
export const deleteOrderDetail = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }
        
        const { id } = req.params;

        const detail = await OrderDetail.findById(id);
        if (!detail) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado'
            });
        }

        await Order.findByIdAndUpdate(detail.order, {
            $inc: { total: -detail.subtotal }
        });

        await detail.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Item eliminado correctamente'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar item',
            error: error.message
        });
    }
};