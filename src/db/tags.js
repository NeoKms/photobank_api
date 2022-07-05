const mysql = require("../helpers/mysqla.js");
const logger = require("../helpers/logger");
const DBWrapper = require("../modules/db.interface");
module.exports = class Tags {
  externalDB = {};

  setExternalDB(external) {
    this.externalDB = external;
  }

  async __filter(
    { select = [], filter = {}, hastest = [], options = {} },
    con = false
  ) {
    let connection, res;
    try {
      connection = con || (await mysql.connection());
      let wrapper = await new DBWrapper("tags", connection, false).selectValue(
        select,
        filter,
        hastest
      );
      if (options?.itemsPerPage) {
        wrapper.paginate(options);
      }
      res = await wrapper.runQuery();
      res = res.queryResult;
    } catch (err) {
      logger.error(err, "tags.filter:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
    return res;
  }

  async getAll(byId = false, con) {
    let connection,
      res = [];
    try {
      connection = con || (await mysql.connection());
      res = await connection.query(
        "select * from tags WHERE is_active = 1 order by name ASC"
      );
      if (byId) {
        res = res.reduce((acc, el) => {
          acc[el.id] = el;
          return acc;
        }, {});
      }
    } catch (err) {
      logger.error(err, "tags.getAll:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
    return res;
  }

  async byName(name, con) {
    let connection,
      res = [];
    try {
      connection = con || (await mysql.connection());
      [res] = await connection.query("select * from tags where name = ?", [
        name,
      ]);
    } catch (err) {
      logger.error(err, "tags.byName:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
    return res;
  }
  async byIds(ids, con) {
    let connection,
      res = [];
    try {
      connection = con || (await mysql.connection());
      res = await connection.query("select * from tags where id in (?)", [ids]);
    } catch (err) {
      logger.error(err, "tags.byIds:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
    return res;
  }
  async create(name, slug, con) {
    let connection,
      res = [];
    try {
      connection = con || (await mysql.connection());
      res = await connection.query(
        "INSERT INTO `tags`(`name`, `slug`) VALUES (?, ?) returning id",
        [name, slug]
      );
    } catch (err) {
      logger.error(err, "tags.create:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
    return res;
  }
  async softDelete(id, con) {
    let connection,
      res = [];
    try {
      connection = con || (await mysql.connection());
      res = await connection.query(
        "UPDATE tags SET is_active = 0 WHERE id = ?",
        [id]
      );
    } catch (err) {
      logger.error(err, "tags.softDelete:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
    return res;
  }
};
