const { sql, poolPromise } = require("../db");

// Controlador para obtener todos los productos
const getAllProducts = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM Productos");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//Controlador para agregar productos
const addProduct = async (req, res) => {
  const { Nombre, Precio, Stock, Descripcion, Imagen, CategoriaID } = req.body;

  try {
    const pool = await poolPromise;
    const query = `
      INSERT INTO Productos (Nombre, Precio, Stock, Descripcion, Imagen, CategoriaID) 
      VALUES (@Nombre, @Precio, @Stock, @Descripcion, @Imagen, @CategoriaID);
      SELECT SCOPE_IDENTITY() AS ProductoID;
    `;
    
    const inputs = [
      { name: 'Nombre', type: sql.NVarChar, value: Nombre },
      { name: 'Precio', type: sql.Decimal(10, 2), value: Precio },
      { name: 'Stock', type: sql.Int, value: Stock },
      { name: 'Descripcion', type: sql.NVarChar, value: Descripcion },
      { name: 'Imagen', type: sql.NVarChar, value: Imagen },
      { name: 'CategoriaID', type: sql.Int, value: CategoriaID }
    ];

    const request = pool.request();
    inputs.forEach(input => request.input(input.name, input.type, input.value));

    const result = await request.query(query);

    res.status(201).json({ message: "Producto creado exitosamente",
      ProductoID: result.recordset[0].ProductoID,
      Nombre,
      Precio,
      Stock,
      Descripcion,
      Imagen,
      CategoriaID
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//Controlador para actualizar productos
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { Nombre, Precio, Stock, Descripcion, Imagen, CategoriaID } = req.body;

  try {
    const pool = await poolPromise;

    const query = `
      UPDATE Productos 
      SET Nombre = @Nombre, Precio = @Precio, Stock = @Stock, Descripcion = @Descripcion, Imagen = @Imagen, CategoriaID = @CategoriaID
      WHERE ProductoID = @id;
      SELECT * FROM Productos WHERE ProductoID = @id;
    `;

    const inputs = [
      { name: 'id', type: sql.Int, value: id },
      { name: 'Nombre', type: sql.NVarChar, value: Nombre },
      { name: 'Precio', type: sql.Decimal(10, 2), value: Precio },
      { name: 'Stock', type: sql.Int, value: Stock },
      { name: 'Descripcion', type: sql.NVarChar, value: Descripcion },
      { name: 'Imagen', type: sql.NVarChar, value: Imagen },
      { name: 'CategoriaID', type: sql.Int, value: CategoriaID }
    ];

    const request = pool.request();
    inputs.forEach(input => request.input(input.name, input.type, input.value));

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.status(200).json({
      message: "Producto actualizado correctamente",
      product: result.recordset[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


//Controlador de eliminar productos
const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;

    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Productos WHERE ProductoID = @id');

    res.status(200).json({ message: 'Producto eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//Controlador de obtener todas las categorias
const getAllCategories = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { recordset: categories } = await pool.request().query('SELECT * FROM Categorias');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//Controlador de obtener productos por categoria
const getProductsByCategory = async (req, res) => {
  const { categoryID } = req.params;

  try {
    const pool = await poolPromise;
    const { recordset: products } = await pool
      .request()
      .input('CategoriaID', sql.Int, categoryID)
      .query(`
        SELECT p.*, c.Nombre as CategoriaNombre
        FROM Productos p
        JOIN Categorias c ON p.CategoriaID = c.CategoriaID
        WHERE p.CategoriaID = @CategoriaID
      `);

    if (!products.length) {
      return res.status(404).json({ message: 'No products found for this category' });
    }

    res.json({
      categoryName: products[0].CategoriaNombre,
      products,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


module.exports = {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getAllCategories,
  getProductsByCategory,
};
