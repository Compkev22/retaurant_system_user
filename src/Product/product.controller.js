'use strict';

import Product from './product.model.js';
import Inventory from '../Inventory/inventory.model.js';
import Branch from '../Branch/branch.model.js';
import mongoose from 'mongoose';



// Obtener productos
export const getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, categoria } = req.query;
        
        
        const filter = { 
            ProductStatus: 'ACTIVE', 
            estado: 'Disponible' 
        };

        if (categoria) filter.categoria = categoria;

        const products = await Product.find(filter)
            .populate('ingredientes.inventoryId', 'name') 
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ nombre: 1 });

        const total = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                totalRecords: total,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al obtener productos' });
    }
};



