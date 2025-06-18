const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        console.log(" Intentando conectar a MongoDB...");
        
        //  CONEXIÓN SIMPLE A MONGODB LOCAL
        await mongoose.connect("mongodb://localhost:27017/proyecto_db");
        
        console.log(" Conexión exitosa con MongoDB");
        console.log(" Base de datos: proyecto_db");
        
        // Inicializar datos si es necesario
        await initializeData();
        
    } catch (error) {
        console.error(" Error conectando a MongoDB:", error.message);
        console.log(" Asegúrate de que MongoDB esté corriendo:");
        console.log("   Windows: net start MongoDB");
        console.log("   Mac/Linux: sudo systemctl start mongod");
        process.exit(1);
    }
};

//  DATOS DE PRUEBA SIMPLIFICADOS
const initializeData = async () => {
    try {
        const { ClothingProduct, AccessoryProduct } = require('../models/product');
        const User = require('../models/user');
        
        // Verificar productos existentes
        const totalProducts = await ClothingProduct.countDocuments() + await AccessoryProduct.countDocuments();
        
        if (totalProducts === 0) {
            console.log(" Creando productos de prueba...");
            
            // Productos de ropa
            await ClothingProduct.create([
                {
                    name: "Power Hoodie",
                    price: 62.00,
                    salePrice: 50.00,
                    description: "Sudadera perfecta para entrenamientos",
                    images: ["https://via.placeholder.com/500x500?text=Power+Hoodie"],
                    rating: 4.8,
                    reviewCount: 253,
                    inStock: true,
                    gender: "men",
                    sizes: ["M", "L", "XL"],
                    fit: "Oversized",
                    productType: "clothing"
                },
                {
                    name: "Urban Biker Shorts",
                    price: 32.00,
                    description: "Shorts cómodos para entrenamiento",
                    images: ["https://via.placeholder.com/500x500?text=Biker+Shorts"],
                    rating: 4.9,
                    reviewCount: 321,
                    inStock: true,
                    gender: "women",
                    sizes: ["XS", "S", "M", "L"],
                    fit: "Compression",
                    productType: "clothing"
                }
            ]);
            
            // Accesorios
            await AccessoryProduct.create([
                {
                    name: "Training Bottle",
                    price: 18.99,
                    description: "Botella deportiva de 750ml",
                    images: ["https://via.placeholder.com/500x500?text=Training+Bottle"],
                    rating: 4.2,
                    reviewCount: 92,
                    inStock: true,
                    dimensions: "26cm x 7cm",
                    adjustable: false,
                    productType: "accessory"
                }
            ]);
            
            console.log(" Productos de prueba creados");
        }
        
        // Usuario admin
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            await User.create({
                username: 'admin',
                email: 'admin@gymstyle.com',
                password: 'admin123',
                firstName: 'Admin',
                lastName: 'GymStyle',
                role: 'admin'
            });
            console.log(" Usuario admin creado (admin@gymstyle.com / admin123)");
        }
        
    } catch (error) {
        console.error(" Error inicializando datos:", error.message);
    }
};

module.exports = connectDB;