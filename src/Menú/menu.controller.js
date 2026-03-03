import Product from '../Product/product.model.js';
import Combo from '../Combo/combo.model.js';

export const getMenu = async (req, res) => {
    try {
        const products = await Product.find({ 
            estado: 'Disponible', 
            ProductStatus: 'ACTIVE' 
        });

        const combos = await Combo.find({ 
            status: 'Disponible',
            ComboStatus: 'ACTIVE' 
        });

        const menu = [
            ...products.map(product => ({
                _id: product._id,
                name: product.nombre,   
                description: product.descripcion || 'Sin descripción', 
                category: product.categoria,
                price: product.precio,  
                type: 'Individual'
            })),
            ...combos.map(combo => ({
                _id: combo._id,
                name: combo.ComboName,              
                description: combo.ComboDescription, 
                price: combo.ComboPrice,            
                category: 'Combos',
                type: 'Combo'
            }))
        ];

        return res.status(200).send({
            success: true,
            message: 'Menú obtenido correctamente',
            total: menu.length,
            menu
        });

    } catch (err) {
        return res.status(500).send({
            success: false,
            message: 'Error al obtener el menú',
            error: err.message
        });
    }
};