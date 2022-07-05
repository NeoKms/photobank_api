const express = require("express");
const router = express.Router();
const config = require("../config");

module.exports = (app) => {
  router.options("/upload/*", (_, res) => {
    res.sendStatus(200);
  });
  app.use("/upload/images", express.static(config.U_DIRS.images));
  require("fs")
    .readdirSync("./src/routes/modules")
    .map((module) => {
      app.use(
        `/${module.replace(".js", "")}`,
        require(`./modules/${module}`)(app)
      );
    });

  app.use(router);
};
