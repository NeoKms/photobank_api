const mysql = require("../helpers/mysqla.js");
const logger = require("../helpers/logger");

module.exports = class Logs {
  externalDB = {};

  setExternalDB(external) {
    this.externalDB = external;
  }

  async insert(data, con) {
    let connection;
    try {
      connection = con || (await mysql.connection());
      await connection.query(
        "INSERT INTO `logs` (`user_id`, `route`, `data`, `ip_address`, `action_type`) values (?,?,?,?,?)",
        [
          data.userId,
          data.route,
          JSON.stringify(data.data),
          data.ipAddress,
          data.action_type,
        ]
      );
    } catch (err) {
      logger.error(err, "logs.insert:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
  }
};
