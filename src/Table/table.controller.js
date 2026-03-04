'use strict';

import Table from './table.model.js';



//Todos pueden ver todas las mesa
export const getTables = async (req, res) => {
    try {
        const filter = {};

        if (req.user.role === 'CLIENT') {
            filter.TableStatus = 'ACTIVE';
        } else {
            if (req.query.TableStatus) {
                filter.TableStatus = req.query.TableStatus;
            }
        }

        const tables = await Table.find(filter).populate('branchId', 'nombre');
        return res.send({ success: true, tables });
    } catch (err) {
        return res.status(500).send({ success: false, message: 'Error al obtener mesas' });
    }
};

