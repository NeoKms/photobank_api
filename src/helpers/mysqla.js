const util = require("util");
const { pool } = require("../db/conf");
const logger = require("./logger");

const connection = () =>
  new Promise((resolve, reject) => {
    pool.getConnection((err, con) => {
      if (err) {
        logger.error(err, "pool.getConnection:");
        reject(err);
      }
      const query = (sql, binding) =>
        new Promise((resolve, reject) => {
          con.query(sql, binding, (err, result) => {
            if (err) reject(err);
            resolve(result);
          });
        });
      const release = () =>
        new Promise((resolve, reject) => {
          if (err) reject(err);
          resolve(con.release());
        });
      const beginTransaction = () =>
        util.promisify(con.beginTransaction).call(con);
      const commit = () => util.promisify(con.commit).call(con);
      const rollback = () => util.promisify(con.rollback).call(con);
      resolve({
        query,
        release,
        beginTransaction,
        commit,
        rollback,
      });
    });
  });

const query = (sql, binding) =>
  new Promise((resolve, reject) => {
    pool.query(sql, binding, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });

module.exports = { pool, connection, query };
