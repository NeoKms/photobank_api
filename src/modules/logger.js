const log4js = require("log4js");
const Sentry = require("@sentry/node");
const config = require("../config");

log4js.configure({
  appenders: {
    console: {
      type: "console",
      layout: {
        type: "pattern",
        pattern: "%[[%d] %p %m%]",
      },
    },
  },
  categories: { default: { appenders: ["console"], level: "all" } },
});

const logger = log4js.getLogger();

logger.loggerError = logger.error;

logger.error = function (error, ...args) {
  logger.loggerError(...args, error);
  try {
    if (config.SENTRY !== false) {
      if (typeof error === "string") {
        error = new Error(error);
      }
      Sentry.captureException(error);
    }
  } catch (error) {
    logger.loggerError("sentry error:", error);
  }
};

if (process.env.IS_TEST) {
  logger.error = () => {};
  logger.info = () => {};
  logger.debug = () => {};
}

module.exports = logger;
