const express = require('express');
const { getAllProducts, addProduct, updateProduct, deleteProduct, getAllCategories, getProductsByCategory } = require('./productController');

const router = express.Router();

router.get('/', getAllProducts);
router.post('/', addProduct);
router.put('/:id', updateProduct); // Ruta para actualizar producto
router.delete('/:id', deleteProduct);
router.get('/categories', getAllCategories);
router.get('/category/:categoryID', getProductsByCategory);


module.exports = router;
