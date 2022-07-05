const express = require("express");
const router = express.Router();
const db = require("../../db");

module.exports = () => {
  router.post("/", async (req, res, next) => {
    try {
      let params = req.body;
      let result = await db.tags.__filter(params);
      res.json({ message: "ok", result });
    } catch (error) {
      next(error);
    }
  });
  return router;
};
