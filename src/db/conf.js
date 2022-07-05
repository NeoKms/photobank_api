const mysql = require("mysql");
const util = require("util");
const config = require("../config");

const pool = mysql.createPool(config.DB);
pool.query = util.promisify(pool.query);

module.exports = { pool };
