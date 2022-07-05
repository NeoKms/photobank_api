const mysql = require("../helpers/mysqla");
const logger = require("../modules/logger");

module.exports = class Users {
  externalDB = {};

  setExternalDB(external) {
    this.externalDB = external;
  }

  async getAuth({ username, password }) {
    let connection, res;
    try {
      connection = await mysql.connection();
      [res] = await connection.query(
        "select * from users where login=? and password_hash=?",
        [username, password]
      );
      if (res) {
        res.rights = JSON.parse(res.rights);
      }
      return res;
    } catch (err) {
      logger.error(err, "users.getAuth:");
      throw err;
    } finally {
      if (connection) await connection.release();
    }
  }
};
