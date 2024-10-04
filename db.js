const sql = require("mssql");

const dbConfig = {
  user: "GabitoZZZ",
  password: "PEPETEAMO",
  server: "localhost",
  database: "webstore_mejorada_2",
  options: {
    encrypt: false, 
    enableArithAbort: true,
  },
};

const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then((pool) => {
    console.log("Connected to SQL Server");
    return pool;
  })
  .catch((err) => {
    console.error("Database Connection Failed! Bad Config: ", err);
    throw err;
  });

module.exports = {
  sql,
  poolPromise,
};