const mysql = require("../helpers/mysqla.js");
const logger = require("../helpers/logger");
const {
  getTags,
  splitToChunks,
  deleteFileByPath,
} = require("../helpers/helpers");
const DBWrapper = require("../modules/db.interface");
const Imaginator = require("../modules/imaginator");
const maps = require("../helpers/constants").maps;

module.exports = class Images {
  externalDB = {};

  setExternalDB(external) {
    this.externalDB = external;
  }

  insertWatermark = async (image, data, con) => {
    let connection,
      res = [];
    try {
      connection = con || (await mysql.connection());
      await connection.beginTransaction();
      let imaginator = await new Imaginator(this.externalDB)
        .setConnection(connection)
        .setOriginalOnly(true)
        .setExternalExt(".png")
        .fromFile(image.file);
      let imageId = imaginator.getImageId();
      let paths = await imaginator.getPathsAll();

      await connection.query(
        "INSERT INTO watermarks (`id`, `name`, `type`, `path`) VALUES (?,?,?,?)",
        [imageId, data.name, data.type, paths.full]
      );

      await connection.query(
        "update `images` set `description` = ?, `created_at` = ?, `type` =  ?, `path` = ? where id=?",
        [data.name, Math.round(Date.now() / 1000), 2, paths.full, imageId]
      );
      await connection.commit();
    } catch (err) {
      if (connection && !con) {
        await connection.rollback();
      }
      logger.error(err, "images.insertWatermark:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
    return res;
  };

  filterWatermark = async (
    { select = [], filter = {}, hasarr = [], options = {} },
    con
  ) => {
    let connection, res;
    try {
      connection = con || (await mysql.connection());

      res = await new DBWrapper("watermarks", connection, {
        debug: false,
        mapObj: maps.watermarks,
      })
        .selectValue(select, filter, hasarr)
        .orderBy(options)
        .paginate(options)
        .runQuery();

      res = {
        page: res.pagination.page,
        maxPages: res.pagination.maxPages,
        allCount: res.pagination.all,
        data: res.queryResult,
      };
    } catch (err) {
      logger.error(err, "images.filterWatermark:");
    } finally {
      if (connection && !con) await connection.release();
    }
    return res;
  };

  deleteWatermark = async (id, con) => {
    let connection;
    try {
      connection = con || (await mysql.connection());
      await connection.beginTransaction();
      let [deletedWatermark] = await connection.query(
        "DELETE FROM `watermarks` WHERE id = ? returning path",
        [id]
      );
      try {
        await deleteFileByPath(deletedWatermark.path);
      } catch (err) {
        //do nothing
      }
      await connection.commit();
    } catch (err) {
      if (connection && !con) {
        await connection.rollback();
      }
      logger.error(err, "images.deleteWatermark:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
  };

  getIdNew = async (filename, con) => {
    let connection, res;
    try {
      connection = con || (await mysql.connection());
      res = await connection
        .query("INSERT INTO `images`(`filename`) VALUES (?) RETURNING *", [
          filename,
        ])
        .then((res) => res[0].id);
    } catch (err) {
      logger.error(err, "images.getIdNew:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
    return res;
  };
  setFilePathAndSize = async (id, path, metadata, con) => {
    let connection;
    try {
      connection = con || (await mysql.connection());
      await connection.query(
        "update `images` set `path`=?, `width`=?, `height`=? where id = ?",
        [path, metadata.width, metadata.height, id]
      );
    } catch (err) {
      logger.error(err, "images.setFilePath:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
  };

  getById = async (id, con) => {
    let connection, res;
    try {
      connection = con || (await mysql.connection());
      [res] = await connection.query(
        "SELECT images.id, images.filename, images.path_arr, images.description, images.type, images.tags, images.user_id, images_authors.name as author_name, images_sources.name as source_name FROM `images` inner join images_authors on images_authors.id=images.author_id inner join images_sources on images_sources.id=images.source_id WHERE images.id = ?",
        [id]
      );
    } catch (err) {
      logger.error(err, "images.getById:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
    return res;
  };

  __filter = async (
    { select = [], filter = {}, hasarr = [], options = {} },
    con
  ) => {
    let connection,
      res,
      tagNamesById = null;
    try {
      if (select.includes("preview") && !select.includes("paths")) {
        select.push("paths");
      }
      if (select.includes("tags_names") && !select.includes("tags")) {
        select.push("tags");
      }
      if (select.includes("type_name")) {
        select.push("type");
      }
      filter.is_pb = 1;
      if (!options?.sortBy?.length) {
        options.sortBy = ["id"];
        options.sortDesc = [true];
      }
      connection = con || (await mysql.connection());

      res = await new DBWrapper("images", connection, {
        debug: false,
        mapObj: maps.images,
      })
        .selectValue(select, filter, hasarr)
        .orderBy(options)
        .paginate(options)
        .runQuery();

      for (let i = 0, c = res.queryResult.length; i < c; i++) {
        let item = res.queryResult[i];
        if (res.has.del_after) {
          item.del_checked = item.del_after > 0;
          if (!item.del_after) {
            item.del_after = 86400;
          }
        }
        if (res.has.preview && item.paths) {
          item.preview = item.paths.mobile_w;
        }
        if (res.has.type_name && res.has.type) {
          item.type_name = item.type === 1 ? "фото" : "иллюстрация";
        }
        if (res.has.tags_names && res.has.tags) {
          let tags_names = [];
          if (tagNamesById === null) {
            let tagsIds = Array.from(
              new Set(
                res.queryResult.reduce((acc, el) => {
                  return acc.concat(el.tags);
                }, [])
              )
            );
            if (tagsIds.lenght) {
              tagNamesById = await this.externalDB.tags
                .byIds(tagsIds, connection)
                .then((res) =>
                  res.reduce((acc, el) => {
                    acc[el.id] = el.name;
                    return acc;
                  }, {})
                );
            } else {
              tagNamesById = {};
            }
          }
          item.tags.forEach((tagId) => {
            if (tagNamesById.hasOwnProperty(tagId)) {
              tags_names.push(tagNamesById[tagId]);
            }
          });
          item.tags_names = tags_names;
        }
        if (res.has.used && !item.used) {
          item.used = [];
        }
      }

      res = {
        page: res.pagination.page,
        maxPages: res.pagination.maxPages,
        allCount: res.pagination.all,
        data: res.queryResult,
      };
    } catch (err) {
      logger.error(err, "images.__filter:");
    } finally {
      if (connection && !con) await connection.release();
    }
    return res;
  };

  __insertOneItem = async (data, user_id, con) => {
    let connection,
      res = [];
    try {
      connection = con || (await mysql.connection());
      let imaginator = await new Imaginator(this.externalDB)
        .setConnection(connection)
        .fromFile(data.image);
      let imageId = imaginator.getImageId();
      let paths = await imaginator.getPathsAll();

      let currentTimestamp = Math.round(Date.now() / 1000);

      let delAfter = data.del_checked ? data.del_after : null;

      let tags = data.tags || [];
      let tagsNew = data.tagsNew || [];

      if (tagsNew.length) {
        tags = await getTags(tags, tagsNew, this.externalDB.tags, connection);
      }

      // если добавили нового автора
      if (data.newAuthor?.trim()) {
        let authorExist = await this.getAuthorByName(
          data.newAuthor.trim(),
          connection
        );
        data.author_id = authorExist?.id;
        if (!authorExist) {
          let res = await this.setAuthor(data.newAuthor.trim(), connection);
          data.author_id = res.id;
        }
      }

      // если добавили новый источник
      if (data.newSource?.trim()) {
        let sourceExist = await this.getSourceByName(
          data.newSource.trim(),
          connection
        );
        data.source_id = sourceExist?.id;
        if (!sourceExist) {
          let res = await this.setSource(data.newSource.trim(), connection);
          data.source_id = res.id;
        }
      }
      await connection.query(
        "update `images` set `description` = ?, `type` = ?, `author_id` = ?, `source_id` = ?, `tags` = ?, `user_id` = ?, `del_after` = ?, `created_at` = ?, `is_pb` = ?, `paths` = ? where id=?",
        [
          data.description,
          data.type,
          data.author_id,
          data.source_id,
          JSON.stringify(tags),
          user_id,
          delAfter,
          currentTimestamp,
          1,
          JSON.stringify(paths),
          imageId,
        ]
      );
    } catch (err) {
      logger.error(err, "images.insertOneItem:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
    return res;
  };

  __updateOneItem = async (data, con) => {
    let connection,
      res = [];
    try {
      connection = con || (await mysql.connection());

      let currentTimestamp = Math.round(Date.now() / 1000);

      let delAfter = data.del_checked ? data.del_after : null;

      let tags = data.tags || [];
      let tagsNew = data.tagsNew || [];

      if (tagsNew.length) {
        tags = await getTags(tags, tagsNew, this.externalDB.tags, connection);
      }

      // если добавили нового автора
      if (data.newAuthor?.trim()) {
        let authorExist = await this.getAuthorByName(
          data.newAuthor.trim(),
          connection
        );
        data.author_id = authorExist?.id;
        if (!authorExist) {
          let res = await this.setAuthor(data.newAuthor.trim(), connection);
          data.author_id = res.id;
        }
      }

      // если добавили новый источник
      if (data.newSource?.trim()) {
        let sourceExist = await this.getSourceByName(
          data.newSource.trim(),
          connection
        );
        data.source_id = sourceExist?.id;
        if (!sourceExist) {
          let res = await this.setSource(data.newSource.trim(), connection);
          data.source_id = res.id;
        }
      }
      await connection.query(
        "update `images` set `description` = ?, `type` = ?, author_id = ?, source_id = ?, tags = ?, `del_after` = ?, `updated_at` = ? where id=?",
        [
          data.description,
          data.type,
          data.author_id,
          data.source_id,
          JSON.stringify(tags),
          delAfter,
          currentTimestamp,
          data.id,
        ]
      );
    } catch (err) {
      logger.error(err, "images.updateOneItem:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
    return res;
  };

  async prepareSources(images, con) {
    let items = Array.from(
      new Set(
        images.reduce((acc, image) => {
          if (image.newSource?.trim()) {
            acc.push(image.newSource.trim());
          }
          return acc;
        }, [])
      )
    );
    for (let i = 0, c = items.length; i < c; i++) {
      let sourceExist = await this.getSourceByName(items[i], con);
      if (!sourceExist) {
        await this.setSource(items[i], con);
      }
    }
  }

  async prepareAuthors(images, con) {
    let items = Array.from(
      new Set(
        images.reduce((acc, image) => {
          if (image.newAuthor?.trim()) {
            acc.push(image.newAuthor.trim());
          }
          return acc;
        }, [])
      )
    );
    for (let i = 0, c = items.length; i < c; i++) {
      let authorExist = await this.getAuthorByName(items[i], con);
      if (!authorExist) {
        await this.setAuthor(items[i], con);
      }
    }
  }

  async prepareTags(images, con) {
    let tagsNew = Array.from(
      new Set(
        images.reduce((acc, image) => {
          acc = acc.concat(image.tagsNew);
          return acc;
        }, [])
      )
    );
    if (tagsNew.length) {
      await getTags([], tagsNew, this.externalDB.tags, con);
    }
  }

  insert = async (data, user_id, con) => {
    let connection,
      res = [];
    try {
      connection = con || (await mysql.connection());
      await connection.beginTransaction();
      await this.prepareTags(data);
      await this.prepareAuthors(data);
      await this.prepareSources(data);
      let chunks = splitToChunks(data, 10);
      for (let chunk of chunks) {
        let promises = [];
        chunk.forEach((item) =>
          promises.push(this.__insertOneItem(item, user_id, connection))
        );
        await Promise.all(promises);
      }
      await connection.commit();
    } catch (err) {
      if (connection && !con) {
        await connection.rollback();
      }
      logger.error(err, "images.insert:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
    return res;
  };

  update = async (data, con) => {
    let connection,
      res = [];
    try {
      connection = con || (await mysql.connection());
      await connection.beginTransaction();
      await this.prepareTags(data);
      await this.prepareAuthors(data);
      await this.prepareSources(data);
      let chunks = splitToChunks(data, 10);
      for (let chunk of chunks) {
        let promises = [];
        chunk.forEach((item) =>
          promises.push(this.__updateOneItem(item, connection))
        );
        await Promise.all(promises);
      }
      await connection.commit();
    } catch (err) {
      if (connection && !con) {
        await connection.rollback();
      }
      logger.error(err, "images.update:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
    return res;
  };

  unDelete = async (ids, con) => {
    let connection;
    try {
      connection = con || (await mysql.connection());
      await connection.query(
        "UPDATE `images` SET `deleted_at` = null, `updated_at`=? WHERE id in (?)",
        [Math.round(Date.now() / 1000), ids]
      );
    } catch (err) {
      logger.error(err, "images.unDelete:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
  };

  softDelete = async (ids, con) => {
    let connection;
    try {
      connection = con || (await mysql.connection());
      await connection.query(
        "UPDATE `images` SET `deleted_at` = ? WHERE id in (?)",
        [Math.round(Date.now() / 1000), ids]
      );
    } catch (err) {
      logger.error(err, "images.softDelete:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
  };

  delayedDeletion = async (date, con) => {
    let connection, res;
    try {
      connection = con || (await mysql.connection());
      res = await connection.query(
        "select id from `images` WHERE (del_after+updated_at) <= ? and deleted_at is null",
        [date, date]
      );
      await connection.query(
        "UPDATE `images` SET `deleted_at` = ? WHERE (del_after+updated_at) <= ? and deleted_at is null",
        [date, date]
      );
      return res;
    } catch (err) {
      logger.error(err, "images.delayedDeletion:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
  };

  getAuthorByName = async (name, con) => {
    let connection, res;
    try {
      connection = con || (await mysql.connection());
      [res] = await connection.query(
        "select * from `images_authors` where name = ?",
        [name]
      );
    } catch (err) {
      logger.error(err, "images.getAuthorByName:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
    return res;
  };

  setAuthor = async (name, con) => {
    let connection, res;
    try {
      connection = con || (await mysql.connection());
      [res] = await connection.query(
        "INSERT INTO `images_authors`(`name`) VALUES (?) returning id",
        [name]
      );
    } catch (err) {
      logger.error(err, "images.setAuthor:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
    return res;
  };

  getSourceByName = async (name, con) => {
    let connection, res;
    try {
      connection = con || (await mysql.connection());
      [res] = await connection.query(
        "select * from `images_sources` where name = ?",
        [name]
      );
    } catch (err) {
      logger.error(err, "images.getSourceByName:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
    return res;
  };

  setSource = async (name, con) => {
    let connection, res;
    try {
      connection = con || (await mysql.connection());
      [res] = await connection.query(
        "INSERT INTO `images_sources`(`name`) VALUES (?) returning id",
        [name]
      );
    } catch (err) {
      logger.error(err, "images.setSource:");
      throw err;
    } finally {
      if (connection && !con) await connection.release();
    }
    return res;
  };

  __filterUsers = async (
    { select = [], filter = {}, hasarr = [], options = {} },
    con = null
  ) => {
    let connection, res;
    try {
      if (!options?.sortBy?.length) {
        options.sortBy = ["id"];
        options.sortDesc = [true];
      }
      connection = con || (await mysql.connection());

      res = await new DBWrapper("image_users_list", connection, {
        debug: false,
        mapObj: maps.image_users_list,
      })
        .selectValue(select, filter, hasarr)
        .orderBy(options)
        .paginate(options)
        .runQuery();

      res = {
        page: res.pagination.page,
        maxPages: res.pagination.maxPages,
        allCount: res.pagination.all,
        data: res.queryResult,
      };
    } catch (err) {
      logger.error(err, "images.__filterUsers:");
    } finally {
      if (connection && !con) await connection.release();
    }
    return res;
  };

  __filterAuthors = async (
    { select = [], filter = {}, hasarr = [], options = {} },
    con = null
  ) => {
    let connection, res;
    try {
      if (!options?.sortBy?.length) {
        options.sortBy = ["id"];
        options.sortDesc = [true];
      }
      connection = con || (await mysql.connection());

      res = await new DBWrapper("images_authors", connection, {
        debug: false,
        mapObj: maps.images_authors,
      })
        .selectValue(select, filter, hasarr)
        .orderBy(options)
        .paginate(options)
        .runQuery();

      res = {
        page: res.pagination.page,
        maxPages: res.pagination.maxPages,
        allCount: res.pagination.all,
        data: res.queryResult,
      };
    } catch (err) {
      logger.error(err, "images.__filterAuthors:");
    } finally {
      if (connection && !con) await connection.release();
    }
    return res;
  };

  __filterSources = async (
    { select = [], filter = {}, hasarr = [], options = {} },
    con
  ) => {
    let connection, res;
    try {
      if (!options?.sortBy?.length) {
        options.sortBy = ["id"];
        options.sortDesc = [true];
      }
      connection = con || (await mysql.connection());

      res = await new DBWrapper("images_sources", connection, {
        debug: false,
        mapObj: maps.images_sources,
      })
        .selectValue(select, filter, hasarr)
        .orderBy(options)
        .paginate(options)
        .runQuery();

      res = {
        page: res.pagination.page,
        maxPages: res.pagination.maxPages,
        allCount: res.pagination.all,
        data: res.queryResult,
      };
    } catch (err) {
      logger.error(err, "images.__filterSources:");
    } finally {
      if (connection && !con) await connection.release();
    }
    return res;
  };
};
