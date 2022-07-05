const fsSync = require("fs");
const moment = require("moment");
const fs = fsSync.promises;
const { F_OK } = require("fs").constants;
const crypto = require("crypto");

const helpers = {};

helpers.getRawPath = (path) => {
  return "upload/" + path.split("upload/")[1];
};
helpers.deleteFileByPath = async (path) => {
  await fs.rm(path, {});
};
helpers.checkFileExists = (file) => {
  return fs
    .access(file, F_OK)
    .then(() => true)
    .catch(() => false);
};
helpers.checkAndCreateDir = (dir) => {
  return helpers
    .checkFileExists(dir)
    .then(async (res) => {
      if (!res) {
        return fs.mkdir(dir, { recursive: true, mode: "0744" });
      }
    })
    .then(() => dir);
};
helpers.checkStaticDirSync = (dir) => {
  if (!fsSync.existsSync(dir)) {
    fsSync.mkdirSync(dir, { recursive: true, mode: "0744" });
  }
  return dir;
};
helpers.createSlug = (text, toLowerCase = false) => {
  const a = {
    Ё: "YO",
    Й: "I",
    Ц: "TS",
    У: "U",
    К: "K",
    Е: "E",
    Н: "N",
    Г: "G",
    Ш: "SH",
    Щ: "SCH",
    З: "Z",
    Х: "H",
    Ъ: "'",
    ё: "yo",
    й: "i",
    ц: "ts",
    у: "u",
    к: "k",
    е: "e",
    н: "n",
    г: "g",
    ш: "sh",
    щ: "sch",
    з: "z",
    х: "h",
    ъ: "'",
    Ф: "F",
    Ы: "I",
    В: "V",
    А: "a",
    П: "P",
    Р: "R",
    О: "O",
    Л: "L",
    Д: "D",
    Ж: "ZH",
    Э: "E",
    ф: "f",
    ы: "i",
    в: "v",
    а: "a",
    п: "p",
    р: "r",
    о: "o",
    л: "l",
    д: "d",
    ж: "zh",
    э: "e",
    Я: "Ya",
    Ч: "CH",
    С: "S",
    М: "M",
    И: "I",
    Т: "T",
    Ь: "'",
    Б: "B",
    Ю: "YU",
    я: "ya",
    ч: "ch",
    с: "s",
    м: "m",
    и: "i",
    т: "t",
    ь: "'",
    б: "b",
    ю: "yu",
  };
  text = text
    .split("")
    .map((char) => a[char] || char)
    .join("")
    .replace(/[^a-z0-9]/gim, " ")
    .replace(/(\r|\n)+/gim, " ")
    .replace(/\s+/gim, "_")
    .replace(/_+$/gim, "");
  if (toLowerCase) {
    text = text.toLowerCase();
  }
  return text;
};
helpers.getModifiedDate = async (filepath) => {
  let stat = await fs.stat(filepath);
  return parseInt(stat.mtimeMs.toString());
};
helpers.sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
helpers.getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
};
helpers.copObj = (f) => {
  return JSON.parse(JSON.stringify(f));
};
helpers.getRoundTimestamp = (delta, from = "") => {
  delta = delta || 5;
  let datestamp = from ? moment(from).utc() : moment().utc();
  let stampminutes = datestamp.minutes();
  stampminutes = stampminutes - (stampminutes % delta);
  if (delta === 1440) {
    datestamp.hours(0);
    datestamp.minutes(0);
  } else if (delta === 60) {
    datestamp.minutes(0);
  } else if (delta === 720) {
    datestamp.hours(datestamp.hours() >= 12 ? 12 : 0);
    datestamp.minutes(0);
  } else {
    datestamp.minutes(stampminutes);
  }
  datestamp.seconds(0);
  datestamp.milliseconds(0);
  return datestamp.unix();
};
helpers.getTags = async (tags, tagsNew, tagsDB, connection) => {
  for (let tag of tagsNew) {
    if (typeof tag === "string") {
      let slug = helpers.createSlug(tag);
      let tagExist = await tagsDB.byName(tag, connection);
      if (!tagExist) {
        let [tagId] = await tagsDB.create(tag, slug, connection);
        tags.push(tagId.id);
      } else {
        tags.push(tagExist.id);
      }
    }
  }
  return tags;
};
helpers.getReqData = (req) => {
  let route = req.originalUrl;
  let ipAddress = (
    req.headers["x-forwarded-for"] || req.connection.remoteAddress
  )
    .split(":")
    .pop();
  let userId = req.user.id;
  return { route, ipAddress, userId };
};
helpers.writeLog = (req, action_type, db, extBody = false, ...other) =>
  db.logs
    .insert(
      Object.assign(helpers.getReqData(req), {
        data: Object.assign(req.params, extBody ? extBody : req.body, ...other),
        action_type,
      })
    )
    .catch(() => {});
helpers.splitToChunks = (arr, n) =>
  arr.length
    ? [arr.slice(0, n), ...helpers.splitToChunks(arr.slice(n), n)]
    : [];
const SALT = "1239d";
helpers.createHashPassword = (password) => {
  return crypto
    .createHash("md5")
    .update(
      SALT +
        crypto.createHash("md5").update(password).digest("hex") +
        crypto.createHash("md5").update(SALT).digest("hex")
    )
    .digest("hex");
};
module.exports = helpers;
