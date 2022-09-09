const { env } = process;
const { checkStaticDirSync } = require("../helpers/helpers");
const path = require("path");
const config = {};

config.PRODUCTION = String(env.PRODUCTION || false).toLowerCase() == "true";
//only dev//
if (!config.PRODUCTION) {
  require("dotenv").config({ path: __dirname + "/../../.env" });
}
//
config.IS_LOCAL = String(env.IS_LOCAL || false).toLowerCase() == "true";
config.LOCAL_DOMAIN = env.LOCAL_DOMAIN;

config.UPLOAD = checkStaticDirSync(
  env.UPLOAD || path.resolve(__dirname + "/../../upload") + "/"
);
config.PORT = env.PORT || 3000;

config.SENTRY = env.SENTRY_KEY || false;

config.DB = {
  type: "mysql",
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  connectionLimit: 50,
  acquireTimeout: 10000,
};
config.U_DIRS = {
  tmp: checkStaticDirSync(config.UPLOAD + "tmp/"),
  images: checkStaticDirSync(config.UPLOAD + "images/"),
};

config.REDIS_SETTINGS = {
  host: env.REDIS_HOST,
  port: parseInt(env.REDIS_PORT),
  sessionDomain: env.REDIS_SESSION_DOMAIN || ".dev.lan",
  secret: env.REDIS_SECRET,
  key: env.REDIS_KEY,
};

module.exports = config;
