const moment = require("moment");
const { poolPromise } = require("../db");
const sql = require("mssql");

const createOrder = async (req, res) => {
  const userID = req.user.userID;
  const { products, total, estado } = req.body;

  try {
    const pool = await poolPromise;

    // Convertir los productos a un formato JSON
    const productsJSON = JSON.stringify(products);

    const result = await pool
      .request()
      .input("ClienteID", sql.Int, userID)
      .input("Total", sql.Decimal(10, 2), total)
      .input("Estado", sql.NVarChar(50), estado)
      .input("Products", sql.NVarChar(sql.MAX), productsJSON)
      .execute("sp_CreateOrder");

    res.status(201).json({
      message: "Order created successfully",
      pedidoID: result.recordset[0].PedidoID,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the order" });
  }
};

const getOrderHistory = async (req, res) => {
  const userID = req.user.userID;

  try {
    const pool = await poolPromise;

    // Consultar los pedidos desde la vista
    const result = await pool.request().input("ClienteID", sql.Int, userID)
      .query(`
          SELECT * FROM vw_OrderHistory
          WHERE ClienteID = @ClienteID
          ORDER BY FechaPedido DESC;
        `);

    // Agrupar pedidos y sus detalles
    const orders = organizeOrders(result.recordset);

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching order history:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching order history" });
  }
};

// Función para organizar los pedidos en un formato legible
const organizeOrders = (rows) => {
  return rows.reduce((acc, row) => {
    const {
      PedidoID,
      FechaPedido,
      Total,
      ProductoID,
      Cantidad,
      PrecioUnitario,
      NombreProducto,
      Imagen,
    } = row;

    // Verificar si el pedido ya está en la lista
    let order = acc.find((o) => o.PedidoID === PedidoID);

    if (!order) {
      // Si el pedido no existe, crearlo
      order = {
        PedidoID,
        FechaPedido,
        Total,
        detalles: [],
      };
      acc.push(order);
    }

    // Añadir el detalle del producto al pedido
    order.detalles.push({
      ProductoID,
      Cantidad,
      PrecioUnitario,
      NombreProducto,
      Imagen,
    });

    return acc;
  }, []);
};

const getOrdersForAdmin = async (req, res) => {
  try {
    const pool = await poolPromise;

    // Consulta simplificada usando la vista
    const result = await pool.request().query(`
        SELECT * FROM vw_AdminOrderHistory
        ORDER BY FechaPedido DESC;
      `);

    // Agrupar pedidos y sus productos
    const orders = groupOrders(result.recordset);

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "An error occurred while fetching orders" });
  }
};

// Función para agrupar pedidos y productos
const groupOrders = (rows) => {
  return rows.reduce((acc, row) => {
    const {
      PedidoID,
      ClienteID,
      FechaPedido,
      Total,
      ProductoID,
      Cantidad,
      PrecioUnitario,
      NombreProducto,
      ImagenProducto,
    } = row;

    // Verificar si el pedido ya está en la lista
    let order = acc.find((o) => o.PedidoID === PedidoID);

    const product = {
      ProductoID,
      Nombre: NombreProducto,
      Imagen: ImagenProducto,
      Precio: PrecioUnitario,
      Cantidad,
    };

    if (order) {
      order.productos.push(product);
    } else {
      acc.push({
        PedidoID,
        ClienteID,
        FechaPedido,
        Total,
        productos: [product],
      });
    }

    return acc;
  }, []);
};

module.exports = {
  createOrder,
  getOrderHistory,
  getOrdersForAdmin,
};
