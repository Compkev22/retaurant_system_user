import Product from '../Product/product.model.js';
import Combo from '../Combo/combo.model.js';

const checkProductStock = (product) => {
    if (!product.ingredientes || product.ingredientes.length === 0) return true;
    return product.ingredientes.every((ing) => {
        const inv = ing.inventoryId;
        if (!inv || inv.stock === undefined) return false;
        return inv.stock >= ing.cantidadUsada;
    });
};

const checkComboStock = (combo) => {
    if (!combo.ComboList || combo.ComboList.length === 0) return true;
    return combo.ComboList.every((item) => {
        const product = item.productId;
        if (!product || !product.ingredientes || product.ingredientes.length === 0) return true;
        return product.ingredientes.every((ing) => {
            const inv = ing.inventoryId;
            if (!inv || inv.stock === undefined) return false;
            return inv.stock >= (ing.cantidadUsada * (item.cantidad || 1));
        });
    });
};

export const getMenu = async (req, res) => {
    try {
        const { branchId } = req.query;

        const productFilter = {
            estado: 'Disponible',
            ProductStatus: 'ACTIVE'
        };

        if (branchId) {
            productFilter['Branches.BranchId'] = branchId;
        }

        const products = await Product.find(productFilter).populate('ingredientes.inventoryId');

        const comboFilter = {
            status: 'Disponible',
            ComboStatus: 'ACTIVE'
        };
        if (branchId) {
            comboFilter['Branches.BranchId'] = branchId;
        }
        const combos = await Combo.find(comboFilter).populate({
            path: 'ComboList.productId',
            populate: { path: 'ingredientes.inventoryId' }
        });

        const menu = [
            ...products.map(product => ({
                _id: product._id,
                name: product.nombre,
                description: product.descripcion || 'Sin descripción',
                category: product.categoria,
                price: product.precio,
                imagen_url: product.imagen_url,
                type: 'Individual',
                inStock: checkProductStock(product)
            })),
            ...combos.map(combo => ({
                _id: combo._id,
                name: combo.ComboName,
                description: combo.ComboDescription,
                price: combo.ComboPrice,
                category: 'Combos',
                image: combo.image || null,
                type: 'Combo',
                inStock: checkComboStock(combo)
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
