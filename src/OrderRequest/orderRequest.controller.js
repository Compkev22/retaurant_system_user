'use strict';

import mongoose from 'mongoose';
import OrderRequest from './orderRequest.model.js';
import Order from '../Order/order.model.js';
import OrderDetail from '../OrderDetail/orderDetail.model.js';
import Product from '../Product/product.model.js';
import Combo from '../Combo/combo.model.js';
import Coupon from '../Coupon/coupon.model.js';

/**
 * CLIENTE obtiene sus pedidos
 */
export const getMyOrderRequests = async (req, res) => {
    try {

        const orders = await OrderRequest.find({
            customer: req.user._id
        })
            .populate('order')
            .populate('branch');

        res.status(200).json({
            success: true,
            data: orders
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};


/**
 * EMPLEADOS / ADMIN SUCURSAL
 * Ver pedidos de una sucursal
 */
export const getBranchOrderRequests = async (req, res) => {
    try {

        const { branchId } = req.params;

        const orders = await OrderRequest.find({
            branch: branchId
        })
            .populate('customer', 'UserName UserSurname UserEmail')
            .populate('order');

        res.status(200).json({
            success: true,
            data: orders
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching branch orders',
            error: error.message
        });
    }
};

export const createOrderRequest = async (req, res) => {
    try {
        const { branch, orderType, deliveryAddress, items, couponCode } = req.body;
        const customer = req.user._id;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Debe enviar un arreglo de productos o combos'
            });
        }

        /* ===============================
            LÓGICA DE VALIDACIÓN DE CUPÓN
        =============================== */
        let appliedCouponId = null;
        let discountPercentage = 0;

        if (couponCode) {
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
                return res.status(400).json({ success: false, message: 'Cupón agotado' });
            }

            appliedCouponId = couponDB._id;
            discountPercentage = couponDB.discountPercentage;
        }

        // 1. Crear Order base (incluyendo campos de cupón)
        const order = await Order.create({
            branchId: branch,
            orderType,
            coupon: appliedCouponId,
            total: 0,
            estado: 'Pendiente'
        });

        let subtotalAcumulado = 0;

        // 2. Procesar cada item
        for (const item of items) {
            const { productoId, comboId, cantidad } = item;
            
            // ... (Toda tu lógica de validación de items y creación de OrderDetail se mantiene igual)
            // Solo asegúrate de ir sumando al subtotalAcumulado
            
            // Ejemplo simplificado de lo que ya tienes:
            let precioUnitario = 0;
            if (productoId) {
                const productDB = await Product.findOne({ _id: productoId, ProductStatus: 'ACTIVE' });
                if (!productDB) throw new Error(`Producto no encontrado: ${productoId}`);
                precioUnitario = productDB.precio || 0;
            } else if (comboId) {
                const comboDB = await Combo.findOne({ _id: comboId, ComboStatus: 'ACTIVE' });
                if (!comboDB) throw new Error(`Combo no encontrado: ${comboId}`);
                precioUnitario = (comboDB.ComboPrice || 0) - (comboDB.ComboDiscount || 0);
            }

            const subtotalItem = precioUnitario * cantidad;
            await OrderDetail.create({
                order: order._id,
                productoId,
                comboId,
                cantidad: Number(cantidad),
                precio: precioUnitario,
                subtotal: subtotalItem
            });
            subtotalAcumulado += subtotalItem;
        }

        /* ===============================
            APLICACIÓN FINAL DEL DESCUENTO
        =============================== */
        const discountApplied = (subtotalAcumulado * discountPercentage) / 100;
        const totalConDescuento = subtotalAcumulado - discountApplied;

        // 3. Actualizar la Orden con los cálculos finales
        order.total = totalConDescuento;
        order.discountApplied = discountApplied;
        await order.save();

        // Registrar el uso en el modelo de Cupones
        if (appliedCouponId) {
            await Coupon.findByIdAndUpdate(appliedCouponId, { $inc: { usedCount: 1 } });
        }

        // 4. Crear el OrderRequest vinculado
        const orderRequest = await OrderRequest.create({
            customer,
            branch,
            order: order._id,
            orderType,
            couponCode: couponCode ? couponCode.toUpperCase() : null, 
            appliedCoupon: appliedCouponId, 
            deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress : undefined,
            orderStatus: 'Pendiente',
            total: totalConDescuento // El total ya tiene el descuento aplicado
        });

        res.status(201).json({
            success: true,
            message: 'Pedido solicitado correctamente',
            data: orderRequest
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al procesar el pedido',
            error: error.message
        });
    }
};
/**
 * PERSONAL actualiza estado del pedido
 */
export const updateOrderRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatus } = req.body; // Se espera: 'En Preparacion', 'Listo', etc.

        const orderRequest = await OrderRequest.findById(id);

        if (!orderRequest) {
            return res.status(404).json({
                success: false,
                message: 'Order request no encontrada'
            });
        }

        // Bloquear si ya está finalizada
        if (orderRequest.orderStatus === 'Cancelado' || orderRequest.orderStatus === 'Entregado') {
            return res.status(400).json({
                success: false,
                message: 'No se puede modificar un pedido finalizado'
            });
        }

        // Mapeo de transiciones válidas usando tus estados de Order
        const validTransitions = {
            'Pendiente': ['En Preparacion', 'Cancelado'],
            'En Preparacion': ['Listo'],
            'Listo': ['Entregado'],
            'Entregado': [],
            'Cancelado': []
        };

        const allowed = validTransitions[orderRequest.orderStatus];

        if (!allowed || !allowed.includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                message: `Transición inválida de ${orderRequest.orderStatus} a ${orderStatus}`
            });
        }

        // Actualizar OrderRequest
        orderRequest.orderStatus = orderStatus;
        await orderRequest.save();

        // Sincronizar con Order interna (Usando los mismos estados)
        await Order.findByIdAndUpdate(orderRequest.order, {
            estado: orderStatus
        });

        const updatedOrder = await OrderRequest.findById(id)
            .populate('customer')
            .populate('order');

        res.status(200).json({
            success: true,
            message: 'Estado del pedido actualizado',
            data: updatedOrder
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating status',
            error: error.message
        });
    }
};

/**
 * CLIENTE cancela su pedido
 */
export const cancelOrderRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const orderRequest = await OrderRequest.findOne({
            _id: id,
            customer: req.user._id
        });

        if (!orderRequest) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        if (orderRequest.orderStatus !== 'Pendiente') {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden cancelar pedidos en estado Pendiente'
            });
        }

        orderRequest.orderStatus = 'Cancelado';
        await orderRequest.save();

        await Order.findByIdAndUpdate(orderRequest.order, {
            estado: 'Cancelado'
        });

        res.status(200).json({
            success: true,
            message: 'Pedido cancelado'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelling order',
            error: error.message
        });
    }
};