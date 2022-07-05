const db = require("../src/db");
const logger = require("../src/modules/logger");

async function run() {
  let currentTimestamp = Math.round(Date.now() / 1000);
  let ids = await db.images.delayedDeletion(currentTimestamp);
  if (ids.length) {
    logger.info("автоматически удалено", ids.length, "изображений");
    db.logs
      .insert({
        data: ids,
        route: "photobank autoDelete",
        action: "delete",
        userId: 2,
        ipAddress: "none",
      })
      .catch(() => {});
  }
  return setTimeout(() => run(), 1000 * 60);
}

run();
