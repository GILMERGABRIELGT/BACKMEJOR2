const sql = require("mssql");

const dbConfig = {
  user: "David_back",
  password: "david_1234",
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