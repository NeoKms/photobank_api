const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const config = require("./src/config");
const logger = require("./src/helpers/logger");
const exec = require("./src/helpers/exec");
const fileUpload = require("express-fileupload");
const Sentry = require("@sentry/node");

const app = express();

require("./src/modules/sentry")(app);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,OPTIONS,DELETE"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "baggage, sentry-trace, Content-Type, Access-Control-Allow-Headers, Access-Control-Allow-Methods, Authorization, X-Requested-With, Access-Control-Allow-Origin, Set-Cookie"
  );
  next();
});

app
  .use(
    morgan(
      ":remote-addr - :remote-user [:date[iso]] ':method :url HTTP/:http-version' :status :res[content-length] ':referrer' - :response-time ms"
    )
  )
  .use(bodyParser.urlencoded({ limit: "10mb", extended: true }))
  .use(bodyParser.json({ limit: "30mb", extended: true }))
  .use(cookieParser())
  .use(
    fileUpload({
      useTempFiles: false,
      tempFileDir: config.U_DIRS.tmp,
    })
  );
process.pool = require("./src/db/conf").pool;
require("./src/modules/residAuth")(app);
require("./src/routes")(app);

app.use(Sentry.Handlers.errorHandler());
app.use((err, req, res, next) => {
  if (!err) next();
  logger.error(err);
  if (err.name === "HttpError") {
    res.status(err.statusCode).json({ error: err.message });
  } else {
    const msg = config.PRODUCTION ? "Ошибка на стороне сервера" : err.message;
    res.status(400).json({ error: msg });
  }
});
(async () => {
  let msg = await exec("db-migrate up");
  console.log(msg);
  app.listen(config.PORT, () => {
    logger.info(`server runing port: ${config.PORT}`);
  });
  require("./services/delete_images");
})();
