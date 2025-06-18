
const express = require('express');
const router = express.Router();

// Middleware para validar token (ajusta según tu implementación)
const validateToken = (req, res, next) => {
    // Por ahora, aceptar todas las requests
    // Aquí deberías validar el token JWT
    next();
};

// GET /api/orders - Obtener órdenes del usuario
router.get('/', validateToken, async (req, res) => {
    try {
        console.log('📋 GET /api/orders - Obteniendo órdenes...');
        
        // Por ahora, devolver array vacío
        // Aquí deberías consultar tu base de datos
        const orders = [];
        
        res.json({
            ok: true,
            orders: orders,
            total: orders.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo órdenes:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
});

// POST /api/orders - Crear nueva orden
router.post('/', validateToken, async (req, res) => {
    try {
        console.log('🛒 POST /api/orders - Creando nueva orden...');
        console.log('Body recibido:', req.body);
        
        const { items, shippingAddress, paymentInfo, shippingMethod } = req.body;
        
        // Validaciones básicas
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                ok: false,
                msg: 'Se requieren items para la orden'
            });
        }
        
        if (!shippingAddress) {
            return res.status(400).json({
                ok: false,
                msg: 'Se requiere dirección de envío'
            });
        }
        
        if (!paymentInfo) {
            return res.status(400).json({
                ok: false,
                msg: 'Se requiere información de pago'
            });
        }
        
        // Crear orden mock (aquí deberías guardar en tu base de datos)
        const newOrder = {
            id: Date.now(), // ID temporal
            orderNumber: `ORD-${Date.now()}`,
            userId: req.user?.id || 'mock-user-id', // Desde el token
            items: items,
            shippingAddress: shippingAddress,
            paymentInfo: {
                method: paymentInfo.method,
                last4: paymentInfo.last4,
                transactionId: paymentInfo.transactionId
            },
            shippingMethod: shippingMethod,
            status: 'pending',
            subtotal: items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0),
            shipping: shippingMethod === 'standard' ? 5.99 : 12.99,
            tax: 0, // Calcular según sea necesario
            total: 0, // Calcular
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Calcular total
        newOrder.tax = newOrder.subtotal * 0.21; // 21% IVA
        newOrder.total = newOrder.subtotal + newOrder.shipping + newOrder.tax;
        
        console.log('✅ Orden creada exitosamente:', newOrder.orderNumber);
        
        // Aquí deberías guardar en tu base de datos
        // await Order.create(newOrder);
        
        res.status(201).json({
            ok: true,
            msg: 'Orden creada exitosamente',
            order: newOrder
        });
        
    } catch (error) {
        console.error('❌ Error creando orden:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET /api/orders/:id - Obtener orden específica
router.get('/:id', validateToken, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📋 GET /api/orders/${id} - Obteniendo orden específica...`);
        
        // Mock order - aquí deberías consultar tu base de datos
        const order = {
            id: id,
            orderNumber: `ORD-${id}`,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };
        
        res.json({
            ok: true,
            order: order
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo orden:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
});

module.exports = router;