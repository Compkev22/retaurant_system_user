'use strict';

import mongoose from 'mongoose';
import OrderRequest from './orderRequest.model.js';
import Order from '../Order/order.model.js';
import OrderDetail from '../OrderDetail/orderDetail.model.js';
import Product from '../Product/product.model.js';
import Combo from '../Combo/combo.model.js';
import Coupon from '../Coupon/coupon.model.js';
import CouponUsage from '../CouponUsage/couponUsage.model.js';
import User from '../User/user.model.js';
import Billing from '../Billing/billing.model.js';
import Inventory from '../Inventory/inventory.model.js';

/**
 * CLIENTE obtiene sus pedidos
 */
export const getMyOrderRequests = async (req, res) => {
    try {
        const user = await User.findOne({
            authId: req.user.id
        });
        const allOrders = await OrderRequest.find({});

        const orders = await OrderRequest.find({
            customer: user._id
        })
            .populate('order')
            .populate('branch')
            .sort({ createdAt: -1 });

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




export const createOrderRequest = async (req, res) => {
    try {
        const { branch, orderType, deliveryAddress, deliveryLat, deliveryLng, items, couponCode, nit, billEmail } = req.body;

        const userDB = await User.findOne({ authId: req.user.id });
        if (!userDB) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        const customer = userDB._id;

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

            // Verificar que este cliente no haya usado este cupón ya esta semana
            const now = new Date();
            const day = now.getDay();
            const diffToMonday = day === 0 ? -6 : 1 - day;
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() + diffToMonday);
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            const usosEstaSemana = await CouponUsage.countDocuments({
                customer,
                coupon: couponDB._id,
                usedAt: { $gte: startOfWeek, $lte: endOfWeek }
            });

            if (usosEstaSemana >= 1) {
                const daysUntilMonday = day === 0 ? 1 : 8 - day;
                return res.status(400).json({
                    success: false,
                    message: `Ya usaste este cupón esta semana. Podrás volver a usarlo el próximo lunes (en ${daysUntilMonday} día${daysUntilMonday !== 1 ? 's' : ''}).`
                });
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
            estado: 'En Preparacion',
            isPaid: true
        });

        let subtotalAcumulado = 0;

        // 2. Validar stock y procesar cada item
        for (const item of items) {
            const { productoId, comboId, cantidad } = item;

            let precioUnitario = 0;
            if (productoId) {
                const productDB = await Product.findOne({ _id: productoId, ProductStatus: 'ACTIVE' })
                    .populate('ingredientes.inventoryId');
                if (!productDB) throw new Error(`Producto no encontrado: ${productoId}`);

                // Validar stock de ingredientes
                for (const ing of productDB.ingredientes || []) {
                    const inv = ing.inventoryId;
                    if (!inv) throw new Error(`Ingrediente invalido en ${productDB.nombre}`);
                    const needed = ing.cantidadUsada * cantidad;
                    if (inv.stock < needed) {
                        throw new Error(`Stock insuficiente para ${productDB.nombre}. Disponible: ${inv.stock}, Requerido: ${needed}`);
                    }
                }

                precioUnitario = productDB.precio || 0;
            } else if (comboId) {
                const comboDB = await Combo.findOne({ _id: comboId, ComboStatus: 'ACTIVE' })
                    .populate({ path: 'ComboList.productId', populate: { path: 'ingredientes.inventoryId' } });
                if (!comboDB) throw new Error(`Combo no encontrado: ${comboId}`);

                // Validar stock de todos los productos del combo
                for (const comboItem of comboDB.ComboList || []) {
                    const product = comboItem.productId;
                    if (!product) throw new Error(`Producto del combo no encontrado`);
                    const comboItemQty = comboItem.cantidad || 1;
                    for (const ing of product.ingredientes || []) {
                        const inv = ing.inventoryId;
                        if (!inv) throw new Error(`Ingrediente invalido en ${product.nombre}`);
                        const needed = ing.cantidadUsada * comboItemQty * cantidad;
                        if (inv.stock < needed) {
                            throw new Error(`Stock insuficiente para ${product.nombre} (combo ${comboDB.ComboName}). Disponible: ${inv.stock}, Requerido: ${needed}`);
                        }
                    }
                }

                precioUnitario = comboDB.ComboPrice || 0;
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

        // Registrar el uso global y el uso individual por cliente
        if (appliedCouponId) {
            await Coupon.findByIdAndUpdate(appliedCouponId, { $inc: { usedCount: 1 } });
            await CouponUsage.create({
                customer: customer,
                coupon: appliedCouponId
            });
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
            deliveryLat: orderType === 'DELIVERY' ? deliveryLat : null,
            deliveryLng: orderType === 'DELIVERY' ? deliveryLng : null,
            orderStatus: 'En Preparacion',
            paymentStatus: 'PAID',
            total: totalConDescuento
        });

        // 5. Crear Billing automaticamente (el cliente ya pago con tarjeta)
        const total = Number(totalConDescuento || 0);
        const billSubtotal = Number((total / 1.12).toFixed(2));
        const billIva = Number((total - billSubtotal).toFixed(2));

        await Billing.create({
            branchId: branch,
            client: customer,
            Order: order._id,
            BillSerie: `FAC-${Date.now()}`,
            BillSubtotal: billSubtotal,
            BillIVA: billIva,
            BillTotal: total,
            BillPaymentMethod: 'CARD',
            BillStatus: 'PAYED',
            BillDate: new Date(),
            BillNIT: nit || 'CF',
            BillEmail: billEmail || null
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
 * CLIENTE cancela su pedido
 */
export const cancelOrderRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const userDB = await User.findOne({ authId: req.user.id });
        if (!userDB) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const orderRequest = await OrderRequest.findOne({
            _id: id,
            customer: userDB._id
        });

        if (!orderRequest) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        if (orderRequest.orderStatus !== 'En Preparacion') {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden cancelar pedidos en Preparación'
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

/**
 * CLIENTE paga su pedido — cambia paymentStatus a PAID y crea Billing automaticamente
 */
export const payOrderRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const userDB = await User.findOne({ authId: req.user.id });
        if (!userDB) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const orderRequest = await OrderRequest.findOne({
            _id: id,
            customer: userDB._id
        }).populate('order').populate('branch');

        if (!orderRequest) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        if (orderRequest.paymentStatus === 'PAID') {
            return res.status(400).json({
                success: false,
                message: 'Este pedido ya fue pagado'
            });
        }

        if (orderRequest.paymentStatus === 'REFUNDED') {
            return res.status(400).json({
                success: false,
                message: 'Este pedido tiene un reembolso activo'
            });
        }

        const order = await Order.findById(orderRequest.order._id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        // Calcular IVA
        const total = Number(order.total || 0);
        const subtotal = Number((total / 1.12).toFixed(2));
        const iva = Number((total - subtotal).toFixed(2));

        // Crear Billing automaticamente con status PAYED
        const billing = await Billing.create({
            branchId: orderRequest.branch._id,
            client: userDB._id,
            Order: order._id,
            BillSerie: `FAC-${Date.now()}`,
            BillSubtotal: subtotal,
            BillIVA: iva,
            BillTotal: total,
            BillPaymentMethod: 'CARD',
            BillStatus: 'PAYED',
            BillDate: new Date()
        });

        // Actualizar paymentStatus del OrderRequest
        orderRequest.paymentStatus = 'PAID';
        await orderRequest.save();

        res.status(200).json({
            success: true,
            message: 'Pago procesado y factura generada',
            data: {
                orderRequest,
                billing
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al procesar el pago',
            error: error.message
        });
    }
};