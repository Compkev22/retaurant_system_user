'use strict';

import Review from './review.model.js';
import Order from '../Order/order.model.js';
import OrderRequest from '../OrderRequest/orderRequest.model.js';
import User from '../User/user.model.js';
import mongoose from 'mongoose';

/* -----------------------------------------
   CREAR RESEÑA
------------------------------------------*/
export const createReview = async (req, res) => {
    try {
        const { orderRequestId, rating, comment } = req.body;

        const user = await User.findOne({
            authId: req.user.id
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const customerId = user._id;

        // BUSCAR el pedido (No crearlo)
        const orderReq = await OrderRequest.findById(orderRequestId);

        if (!orderReq) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud de pedido no encontrada'
            });
        }

        // Validar dueño
        if (orderReq.customer.toString() !== customerId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'No puedes reseñar un pedido que no realizaste tú'
            });
        }

        // Validar estado
        if (orderReq.orderStatus !== 'Entregado') {
            return res.status(400).json({
                success: false,
                message: 'Solo puedes reseñar pedidos entregados'
            });
        }

        // Si ya existe una reseña (activa o eliminada) para este pedido,
        // el índice único {customer, order} impide crear una nueva.
        // En vez de fallar, reactivamos y actualizamos la existente.
        const existingReview = await Review.findOne({
            customer: customerId,
            order: orderReq.order
        });

        if (existingReview) {

            if (!existingReview.isDeleted) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya has dejado una reseña para este pedido'
                });
            }

            existingReview.isDeleted = false;
            existingReview.rating = rating;
            existingReview.comment = comment;
            existingReview.branch = orderReq.branch;

            await existingReview.save();

            return res.status(201).json({
                success: true,
                message: 'Reseña creada exitosamente',
                data: existingReview
            });
        }

        // CREAR la RESEÑA (Aquí es donde se usa Review.create)
        const review = await Review.create({
            customer: customerId,
            order: orderReq.order,
            branch: orderReq.branch,
            rating,
            comment
        });

        res.status(201).json({
            success: true,
            message: 'Reseña creada exitosamente',
            data: review
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Ya has dejado una reseña para este pedido'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error al procesar la reseña',
            error: error.message
        });
    }
};

/* -----------------------------------------
   OBTENER RESEÑAS DEL CLIENTE
------------------------------------------*/
export const getMyReviews = async (req, res) => {
    try {

        const user = await User.findOne({
            authId: req.user.id
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const reviews = await Review.find({ customer: user._id })
            .populate('branch', 'name')
            .populate('order');

        res.status(200).json({
            success: true,
            data: reviews
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener reseñas',
            error: error.message
        });
    }
};





/* -----------------------------------------
   ACTUALIZAR RESEÑA
------------------------------------------*/
export const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;

        const user = await User.findOne({
            authId: req.user.id
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Reseña no encontrada'
            });
        }

        if (review.customer.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para editar esta reseña'
            });
        }

        review.rating = rating ?? review.rating;
        review.comment = comment ?? review.comment;

        await review.save();

        res.status(200).json({
            success: true,
            message: 'Reseña actualizada',
            data: review
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al actualizar reseña',
            error: error.message
        });
    }
};

/* -----------------------------------------
   ELIMINAR RESEÑA (SOFT DELETE)
------------------------------------------*/
export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findOne({
            authId: req.user.id
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const userRole = req.user.role;
        const userId = user._id;

        // Buscamos la reseña
        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Reseña no encontrada'
            });
        }

        // Lógica de Permisos 
        const isPlatformAdmin = userRole === 'PLATFORM_ADMIN';
        const isBranchAdmin = (userRole === 'BRANCH_ADMIN' && review.branch?.toString() === req.user.branchId?.toString());
        const isOwner = review.customer.toString() === userId.toString();

        if (!isPlatformAdmin && !isBranchAdmin && !isOwner) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para modificar el estado de esta reseña'
            });
        }

        review.isDeleted = !review.isDeleted;

        await review.save();

        // 4. Respuesta dinámica según el nuevo estado
        const statusMessage = review.isDeleted ? 'eliminada (Soft Delete)' : 'restaurada con éxito';

        res.status(200).json({
            success: true,
            message: `Reseña ${statusMessage} por ${userRole}`,
            data: {
                id: review._id,
                isDeleted: review.isDeleted
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al procesar el cambio de estado de la reseña',
            error: error.message
        });
    }
};