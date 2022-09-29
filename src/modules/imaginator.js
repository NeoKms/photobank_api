const { U_DIRS, IS_DEV, IS_LOCAL, LOCAL_DOMAIN } = require("../config");
const { sizeOf } = require("../helpers/helpers");
const fs_sync = require("fs");
const fs = fs_sync.promises;
const {
  getRawPath,
  checkFileExists,
  checkAndCreateDir,
} = require("../helpers/helpers");
const axios = require("axios");
const Sharp = require("sharp");
const PathModule = require("path");
const Jimp = require("jimp");

class Imaginator {
  externalDB = null;
  connection = null;
  id = -1;
  filePathFull = ""; //1920
  filePathTablet = ""; //720
  filePathDesktop = ""; //930
  filePathMobile = ""; //330
  filePathFullWebp = ""; //1920
  filePathDesktopWebp = ""; //930
  filePathTabletWebp = ""; //720
  filePathMobileWebp = ""; //330
  externalFileName = false;
  externalFilePath = false;
  externalExt = false;
  originalOnly = false;
  prefixes = ["full", "tablet", "mobile", "desktop"];
  sizeOfData = {
    height: 0,
    width: 0,
    type: "jpg",
    ratio: 1,
    ratioTitle: "1/1",
  };
  baseUrl = IS_LOCAL
    ? LOCAL_DOMAIN
    : IS_DEV
    ? "http://smiapi.dev.lan/"
    : "https://api-post.ttrace.ru/";

  constructor(external) {
    this.externalDB = external || require("../db/index");
  }

  setConnection(con) {
    this.connection = con;
    return this;
  }

  async byUrl(url) {
    let file = await this.downloadToBuffer(url);
    return this.fromFile(file);
  }

  async getId(filename) {
    this.id = await this.externalDB.images.getIdNew(filename, this.connection);
    return this.id;
  }

  __getRatioTitle() {
    if (this.sizeOfData.ratio >= 0.8 && this.sizeOfData.ratio < 1.2) {
      this.sizeOfData.ratioTitle = "1/1";
    }
    if (this.sizeOfData.ratio >= 1.2 && this.sizeOfData.ratio < 1.4) {
      this.sizeOfData.ratioTitle = "4/3";
    }
    if (this.sizeOfData.ratio >= 1.4 && this.sizeOfData.ratio < 1.65) {
      this.sizeOfData.ratioTitle = "3/2";
    }
    if (this.sizeOfData.ratio >= 1.65 && this.sizeOfData.ratio < 1.9) {
      this.sizeOfData.ratioTitle = "16/9";
    }
  }

  async loadExist(imagePath) {
    const splitted = PathModule.basename(imagePath).split("_");
    this.id = splitted.length ? splitted[0] : -1;
    let size =
      splitted.length >= 2
        ? splitted[1].replace(".jpeg", "").replace(".webp", "")
        : "full";
    if (size !== "full") {
      imagePath = imagePath.replace("_" + size, "_full");
    }
    this.sizeOfData = await sizeOf(imagePath);
    this.sizeOfData.ratio = this.sizeOfData.width / this.sizeOfData.height;
    this.__getRatioTitle();
    const ext = this.sizeOfData.type;
    if (ext !== "jpeg") {
      imagePath = imagePath.replace(ext, "jpeg");
    }
    this.filePathFull = imagePath;
    this.filePathTablet = imagePath.replace("_full", "_" + this.prefixes[1]);
    this.filePathDesktop = imagePath.replace("_full", "_" + this.prefixes[3]);
    this.filePathMobile = imagePath.replace("_full", "_" + this.prefixes[2]);
    this.filePathFullWebp = this.filePathFull.replace(".jpeg", ".webp");
    this.filePathDesktopWebp = this.filePathDesktop.replace(".jpeg", ".webp");
    this.filePathTabletWebp = this.filePathTablet.replace(".jpeg", ".webp");
    this.filePathMobileWebp = this.filePathMobile.replace(".jpeg", ".webp");
    return this;
  }

  async renderWatermark({ id, path, configs }) {
    const config = configs[this.sizeOfData.ratioTitle];
    if (!config) {
      throw new Error("imaginator: no config for this ratio");
    }
    const paths = this.getPathsFull();
    const errors = [];
    const outputPaths = [];
    return Promise.all(
      paths.map((imgPath) =>
        this.__applyWatermark(imgPath, path, config)
          .then((outputPath) => outputPaths.push(outputPath))
          .catch((err) => errors.push(err.message))
      )
    ).then(() => ({
      outputPaths,
      errors,
      isError: errors.length,
      id: +this.id,
      wm_id: id,
    }));
  }

  getActualPath() {
    let date = new Date();
    return checkAndCreateDir(
      U_DIRS.images +
        `${date.getUTCFullYear()}/${
          date.getUTCMonth() + 1
        }/${date.getUTCDate()}/`
    );
  }
  setExternalExt(ext) {
    this.externalExt = ext;
    return this;
  }
  setExternalFilePath(path) {
    this.externalFilePath = path;
    if (this.externalFilePath[this.externalFilePath.length - 1] !== "/") {
      this.externalFilePath += "/";
    }
    return this;
  }
  setExternalFileName(name) {
    this.externalFileName = name;
    return this;
  }
  setOriginalOnly(t = true) {
    this.originalOnly = t;
    return this;
  }

  async __saveImage(originalImg, pathTo, { w, q }) {
    const ext = PathModule.extname(pathTo).replace(".", "");
    let metadata = await originalImg.metadata();
    let stream = originalImg.clone();
    if (metadata.width > w) {
      stream.resize({ width: w });
    }
    if (["jpeg", "webp"].includes(ext)) {
      stream[ext]({ quality: q });
    }
    if (ext === "jpeg") {
      stream.flatten({ background: "#ffffff" });
    }
    return stream.toFile(pathTo);
  }

  async fromFile(file) {
    if (
      !this.originalOnly &&
      file.mimetype.indexOf("image") === -1 &&
      file.mimetype.indexOf("webp") === -1 &&
      !this.externalExt
    ) {
      throw new Error("Попытка загрузить не изображение");
    }
    let filename = "";
    if (!this.externalFileName) {
      filename = await this.getId(file.name);
    } else {
      filename = this.externalFileName;
    }
    let actualPath = "";
    if (!this.externalFilePath) {
      actualPath = await this.getActualPath();
    } else {
      actualPath = await checkAndCreateDir(this.externalFilePath);
    }
    let pathWithName = actualPath + filename;
    let ext = "";
    if (PathModule.extname(pathWithName)) {
      ext = PathModule.extname(pathWithName);
      pathWithName = pathWithName.replace(ext, "");
      this.externalExt = ext;
    } else if (this.externalExt) {
      ext = this.externalExt;
    } else {
      ext = ".jpeg";
    }
    if (ext === ".jpeg" && !this.originalOnly) {
      let promises = [];
      let originalImg = await Sharp(file.data, {
        failOnError: false,
      });
      // full
      let filePathFullJpeg = pathWithName + `_${this.prefixes[0]}` + ".jpeg";
      let filePathFullWebp = pathWithName + `_${this.prefixes[0]}` + ".webp";
      promises.push(
        this.__saveImage(originalImg, filePathFullJpeg, {
          w: 1920,
          q: 80,
        }).then(() => (this.filePathFull = filePathFullJpeg)),
        this.__saveImage(originalImg, filePathFullWebp, {
          w: 1920,
          q: 80,
        }).then(() => (this.filePathFullWebp = filePathFullWebp))
      );
      // desktop
      let filePathDesktopJpeg = pathWithName + `_${this.prefixes[3]}` + ".jpeg";
      let filePathdesktopWebp = pathWithName + `_${this.prefixes[3]}` + ".webp";
      promises.push(
        this.__saveImage(originalImg, filePathDesktopJpeg, {
          w: 930,
          q: 80,
        }).then(() => (this.filePathDesktop = filePathDesktopJpeg)),
        this.__saveImage(originalImg, filePathdesktopWebp, {
          w: 930,
          q: 80,
        }).then(() => (this.filePathDesktopWebp = filePathdesktopWebp))
      );
      // tablet
      let filePathTabletJpeg = pathWithName + `_${this.prefixes[1]}` + ".jpeg";
      let filePathTabletWebp = pathWithName + `_${this.prefixes[1]}` + ".webp";
      promises.push(
        this.__saveImage(originalImg, filePathTabletJpeg, {
          w: 720,
          q: 100,
        }).then(() => (this.filePathTablet = filePathTabletJpeg)),
        this.__saveImage(originalImg, filePathTabletWebp, {
          w: 720,
          q: 100,
        }).then(() => (this.filePathTabletWebp = filePathTabletWebp))
      );
      // mobile
      let filePathMobileJpeg = pathWithName + `_${this.prefixes[2]}` + ".jpeg";
      let filePathMobileWebp = pathWithName + `_${this.prefixes[2]}` + ".webp";
      promises.push(
        this.__saveImage(originalImg, filePathMobileJpeg, {
          w: 330,
          q: 100,
        }).then(() => (this.filePathMobile = filePathMobileJpeg)),
        this.__saveImage(originalImg, filePathMobileWebp, {
          w: 330,
          q: 100,
        }).then(() => (this.filePathMobileWebp = filePathMobileWebp))
      );
      await Promise.all(promises);
    } else {
      let filePathFull =
        pathWithName +
        (this.originalOnly ? "" : `_${this.prefixes[0]}`) +
        this.externalExt;
      await fs
        .writeFile(filePathFull, file.data)
        .then(() => (this.filePathFull = filePathFull));
    }
    if (!this.externalFileName) {
      await this.externalDB.images.setFilePathAndSize(
        filename,
        this.filePathFull,
        await sizeOf(this.filePathFull),
        await this.getPathsAll(),
        this.connection
      );
    }
    return this;
  }

  getImageId() {
    return this.id;
  }

  getPathsFull() {
    return [
      this.filePathFull,
      this.filePathTablet,
      this.filePathDesktop,
      this.filePathMobile,
      this.filePathFullWebp,
      this.filePathDesktopWebp,
      this.filePathTabletWebp,
      this.filePathMobileWebp,
    ];
  }
  async getPathsAll(raw = true) {
    let result = {};
    return Promise.all([
      checkFileExists(this.filePathFull).then((res) =>
        res
          ? (result.full =
              (raw ? "" : this.baseUrl) + getRawPath(this.filePathFull))
          : null
      ),
      checkFileExists(this.filePathFullWebp).then((res) =>
        res
          ? (result.full_w =
              (raw ? "" : this.baseUrl) + getRawPath(this.filePathFullWebp))
          : null
      ),
      checkFileExists(this.filePathDesktop).then((res) =>
        res
          ? (result.desktop =
              (raw ? "" : this.baseUrl) + getRawPath(this.filePathDesktop))
          : null
      ),
      checkFileExists(this.filePathDesktopWebp).then((res) =>
        res
          ? (result.desktop_w =
              (raw ? "" : this.baseUrl) + getRawPath(this.filePathDesktopWebp))
          : null
      ),
      checkFileExists(this.filePathTablet).then((res) =>
        res
          ? (result.tablet =
              (raw ? "" : this.baseUrl) + getRawPath(this.filePathTablet))
          : null
      ),
      checkFileExists(this.filePathTabletWebp).then((res) =>
        res
          ? (result.tablet_w =
              (raw ? "" : this.baseUrl) + getRawPath(this.filePathTabletWebp))
          : null
      ),
      checkFileExists(this.filePathMobile).then((res) =>
        res
          ? (result.mobile =
              (raw ? "" : this.baseUrl) + getRawPath(this.filePathMobile))
          : null
      ),
      checkFileExists(this.filePathMobileWebp).then((res) =>
        res
          ? (result.mobile_w =
              (raw ? "" : this.baseUrl) + getRawPath(this.filePathMobileWebp))
          : null
      ),
    ]).then(() => result);
  }

  async getPaths() {
    let result = {};
    let full = await checkFileExists(this.filePathFull);
    if (full) {
      result.url = this.baseUrl + getRawPath(this.filePathFull);
    }
    return result;
  }

  async readFileAsBuffer(filepath) {
    let readstream = fs_sync.createReadStream(filepath);
    let data = [];
    return new Promise((resolve, reject) => {
      readstream.on("data", function (chunk) {
        data.push(chunk);
      });
      readstream.on("error", (e) => reject(e));
      readstream.on("end", () => {
        data = Buffer.concat(data);
        resolve(data);
      });
    });
  }
  async downloadToBuffer(url) {
    let file = {
      data: [],
      mimetype: "",
      size: 0,
    };
    return axios({
      url,
      responseType: "stream",
    }).then((response) => {
      file.mimetype = response.headers["content-type"];
      if (url.indexOf(".webp") !== -1) {
        file.mimetype = "image/webp";
      }
      file.size = parseInt(response.headers["content-length"]);
      return new Promise((resolve, reject) => {
        response.data.on("data", function (chunk) {
          file.data.push(chunk);
        });
        response.data.on("error", (e) => reject(e));
        response.data.on("end", () => {
          file.data = Buffer.concat(file.data);
          resolve(file);
        });
      });
    });
  }

  async __applyWatermark(imagePath, wmPath, config) {
    //prepare
    const wm_id = PathModule.basename(wmPath).split(".")[0];
    const splitted = PathModule.basename(imagePath).split("_");
    splitted.splice(1, 0, `v${wm_id}v`);
    const outputImagePath =
      PathModule.parse(imagePath).dir + "/" + splitted.join("_");
    if (await checkFileExists(outputImagePath)) {
      return getRawPath(outputImagePath);
    }
    //draw
    let originalImg = await Sharp(imagePath, {
      failOnError: false,
    });
    const { width, height } = await originalImg.metadata();
    return Jimp.read(wmPath)
      .then((JimpWrapper) =>
        JimpWrapper.opacity(config.opacity).getBufferAsync(Jimp.MIME_PNG)
      )
      .then((JimpBuffer) =>
        Sharp(JimpBuffer, {
          failOnError: false,
        })
          .resize({ width: Math.round(width * config.scale) })
          .toBuffer()
      )
      .then((wmBuffer) =>
        originalImg
          .composite([
            {
              input: wmBuffer,
              top: Math.round((config.top * height) / 100),
              left: Math.round((config.left * width) / 100),
            },
          ])
          .toFile(outputImagePath)
      )
      .then(() => getRawPath(outputImagePath));
  }
}

module.exports = Imaginator;
