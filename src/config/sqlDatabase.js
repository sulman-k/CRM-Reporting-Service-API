const e = require("express");
const mariadb = require("mariadb");
require("dotenv").config();
const moduleName = "[sqlDatabase]",
  logger = require(`${__utils}/logger/logger`)(moduleName);
const pool = mariadb.createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: process.env.PORT,
  connectionLimit: 5,
});

const readOnlyPool = mariadb.createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
});
let connection;
(async () => {
  await sqlConn();
})();
async function sqlConn() {
  connection = await pool.getConnection();
  return connection;
}
exports.queryRollBack = async (query) => {
  try {
    const res = await connection.query(query, [1, "mariadb"]);
    logger.info("[query][result]", res);

    return res;
  } catch (error) {
    logger.error("[query][error]", error);

    return error;
  }
};
exports.connection = async () => {
  return connection;
};

exports.query = async (query) => {
  let connection;
  let promise = await new Promise(async (resolve, reject) => {
    connection = await pool.getConnection();
    // console.log("Query: ", query);
    try {
      logger.info("[query]", query);

      const res = await connection.query(query, [1, "mariadb"]);
      logger.info("[query][result]", res);

      connection.end();
      resolve(res);
    } catch (error) {
      logger.error("[query][error]", error);
      connection.end();

      reject(error);
    }
  });

  return promise;
};

exports.readOnlyQuery = async (query) => {
  let connection;
  let promise = await new Promise(async (resolve, reject) => {
    connection = await readOnlyPool.getConnection();
    // console.log("Query: ", query);
    try {
      logger.info("[query]", query);

      const res = await connection.query(query, [1, "mariadb"]);
      logger.info("[query][result]", res);

      connection.end();
      resolve(res);
    } catch (error) {
      logger.error("[query][error]", error);
      connection.end();

      reject(error);
    }
  });

  return promise;
};
