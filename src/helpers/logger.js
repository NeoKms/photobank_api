const log4js = require("log4js");
const config = require("../config");
const Sentry = require("@sentry/node");

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
    //do nothing
  }
};

module.exports = logger;
