const { U_DIRS, IS_LOCAL, LOCAL_DOMAIN } = require("../config");
const fs_sync = require("fs");
const fs = fs_sync.promises;
const {
  getRawPath,
  checkFileExists,
  checkAndCreateDir,
} = require("../helpers/helpers");
const axios = require("axios");
const Sharp = require("sharp");
const imageSize = require("image-size");
const sizeOf = async (path) =>
  new Promise((resolve, reject) =>
    imageSize(path, (err, dimensions) => {
      if (err) reject(err);
      else resolve(dimensions);
    })
  );
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
  baseUrl = IS_LOCAL ? LOCAL_DOMAIN : "https://pbapi.jrgreez.ru/";

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

  async fromFile(file) {
    if (
      file.mimetype.indexOf("image") ||
      file.mimetype.indexOf("webp") ||
      this.externalExt
    ) {
      //do nothing
    } else {
      throw new Error("Попытка загрузить не изображение");
    }
    let filename = "";
    if (this.externalFileName === false) {
      filename = await this.getId(file.name);
    } else {
      filename = this.externalFileName;
    }
    let actualPath = await this.getActualPath();
    if (this.externalFilePath) {
      actualPath = await checkAndCreateDir(this.externalFilePath);
    }
    let pathWithName = actualPath + filename;
    let ext = ".jpg";
    if (this.externalExt) {
      ext = this.externalExt;
    }
    if (ext === ".jpg" && !this.originalOnly) {
      let promises = [];
      let originalImg = await Sharp(file.data, {
        failOnError: false,
      });
      let metadata = await originalImg.metadata();
      // full
      let filePathFullJpeg = pathWithName + "_full" + ".jpeg";
      let filePathFullWebp = pathWithName + "_full" + ".webp";
      let fullStreamJpeg = originalImg.clone();
      let fullStreamWebp = originalImg.clone();
      if (metadata.width > 1920) {
        fullStreamJpeg.resize({ width: 1920 });
        fullStreamWebp.resize({ width: 1920 });
      }
      promises.push(
        fullStreamJpeg
          .jpeg({ quality: 80 })
          .flatten({ background: "#ffffff" })
          .toFile(filePathFullJpeg)
          .then(() => (this.filePathFull = filePathFullJpeg)),
        fullStreamWebp
          .webp({ quality: 80 })
          .toFile(filePathFullWebp)
          .then(() => (this.filePathFullWebp = filePathFullWebp))
      );
      // desktop
      let filePathDesktopJpeg = pathWithName + "_desktop" + ".jpeg";
      let filePathdesktopWebp = pathWithName + "_desktop" + ".webp";
      let desktopStreamJpeg = originalImg.clone();
      let desktopStreamWebp = originalImg.clone();
      if (metadata.width > 930) {
        desktopStreamJpeg.resize({ width: 930 });
        desktopStreamWebp.resize({ width: 930 });
      }
      promises.push(
        desktopStreamJpeg
          .jpeg({ quality: 80 })
          .flatten({ background: "#ffffff" })
          .toFile(filePathDesktopJpeg)
          .then(() => (this.filePathDesktop = filePathDesktopJpeg)),
        desktopStreamWebp
          .webp({ quality: 80 })
          .toFile(filePathdesktopWebp)
          .then(() => (this.filePathDesktopWebp = filePathdesktopWebp))
      );
      // tablet
      let filePathTabletJpeg = pathWithName + "_tablet" + ".jpeg";
      let filePathTabletWebp = pathWithName + "_tablet" + ".webp";
      let tabletStreamJpeg = originalImg.clone();
      let tabletStreamWebp = originalImg.clone();
      if (metadata.width > 720) {
        tabletStreamJpeg.resize({ width: 720 });
        tabletStreamWebp.resize({ width: 720 });
      }
      promises.push(
        tabletStreamJpeg
          .jpeg({ quality: 100 })
          .flatten({ background: "#ffffff" })
          .toFile(filePathTabletJpeg)
          .then(() => (this.filePathTablet = filePathTabletJpeg)),
        tabletStreamWebp
          .webp({ quality: 100 })
          .toFile(filePathTabletWebp)
          .then(() => (this.filePathTabletWebp = filePathTabletWebp))
      );
      // mobile
      let filePathMobileJpeg = pathWithName + "_mobile" + ".jpeg";
      let filePathMobileWebp = pathWithName + "_mobile" + ".webp";
      let mobileStreamJpeg = originalImg.clone();
      let mobileStreamWebp = originalImg.clone();
      if (metadata.width > 330) {
        mobileStreamJpeg.resize({ width: 330 });
        mobileStreamWebp.resize({ width: 330 });
      }
      promises.push(
        mobileStreamJpeg
          .jpeg({ quality: 100 })
          .flatten({ background: "#ffffff" })
          .toFile(filePathMobileJpeg)
          .then(() => (this.filePathMobile = filePathMobileJpeg)),
        mobileStreamWebp
          .webp({ quality: 100 })
          .toFile(filePathMobileWebp)
          .then(() => (this.filePathMobileWebp = filePathMobileWebp))
      );
      await Promise.all(promises);
    } else if (this.externalExt) {
      let filePathFull =
        pathWithName + (this.originalOnly ? "" : "_full") + this.externalExt;
      await fs
        .writeFile(filePathFull, file.data)
        .then(() => (this.filePathFull = filePathFull));
    } else {
      let filePathFull = pathWithName + (this.originalOnly ? "" : "_full");
      await fs
        .writeFile(filePathFull, file.data)
        .then(() => (this.filePathFull = filePathFull));
    }
    if (!this.externalFileName) {
      await this.externalDB.images.setFilePathAndSize(
        filename,
        this.filePathFull,
        await sizeOf(this.filePathFull),
        this.connection
      );
    }
    return this;
  }

  getImageId() {
    return this.id;
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
}

module.exports = Imaginator;
