const express = require("express");
const router = express.Router();
const db = require("../../db");
const { getReqData } = require("../../helpers/helpers");
const HttpError = require("../../modules/HttpError");
const { isAccessWrite, isAccessRead } = require("../../modules/rights").gen(
  "mh_photobank"
);

module.exports = () => {
  /**
   * @api {post} /photobank/getList Получить список изображений
   * @apiName Photobank
   * @apiGroup Photobank
   * @apiPermission get_image_data: read
   *
   * @apiParamExample {json} Param-Example:
   {
        "select": [
                "id",
                "filename",
                "description",
                "preview",
                "type",
                "author_name",
                "source_name",
                "tags_names",
                "user_id"
        ],
        "options": {
                "onlyLimit": true,
                "itemsPerPage": 20
        }
}
   *
   * @apiSuccessExample {json} Success-Response:
   HTTP/1.1 200 OK
   {
    "message": "ok",
    "result": {
        "page": 1,
        "maxPages": 0,
        "allCount": 0,
        "data": [
            {
                "id": 247568,
                "filename": "blob",
                "paths": {
                    "full_w": "upload/images/2022/6/22/247568_full.webp",
                    "full": "upload/images/2022/6/22/247568_full.jpeg",
                    "desktop": "upload/images/2022/6/22/247568_desktop.jpeg",
                    "desktop_w": "upload/images/2022/6/22/247568_desktop.webp",
                    "tablet": "upload/images/2022/6/22/247568_tablet.jpeg",
                    "tablet_w": "upload/images/2022/6/22/247568_tablet.webp",
                    "mobile": "upload/images/2022/6/22/247568_mobile.jpeg",
                    "mobile_w": "upload/images/2022/6/22/247568_mobile.webp"
                },
                "description": "",
                "type": 1,
                "author_name": "ххх",
                "source_name": "кастом",
                "tags": [],
                "user_id": 1,
                "preview": "upload/images/2022/6/22/247568_mobile.webp"
            },
        ]
    }
  }
   *
   * @apiErrorExample {json} Error-Response:
   HTTP/1.1 400
   {
         "message":"text error"
     }
   */
  router.post(
    "/getList",
    isAccessRead("get_image_data"),
    async (req, res, next) => {
      try {
        let params = req.body;
        if (
          !!params?.filter?.deleted_at &&
          !req?.user?.rights?.mh_photobank_trash
        ) {
          throw new HttpError("Недостаточно прав", 401);
        }
        let result = await db.images.__filter(params);
        res.json({ message: "ok", result });
      } catch (error) {
        next(error);
      }
    }
  );
  /**
   * @api {get} /photobank/:id Получить картинку по айди
   * @apiDescription ...
   * @apiName Photobank
   * @apiGroup Photobank
   *
   * @apiSuccessExample {json} Success-Response:
   HTTP/1.1 200 OK
   {
    "message": "ok",
    "result": {
        "page": 1,
        "maxPages": 1,
        "allCount": 1,
        "data": [
            {
                "id": 247568,
                "filename": "blob",
                "paths": {
                    "full_w": "upload/images/2022/6/22/247568_full.webp",
                    "full": "upload/images/2022/6/22/247568_full.jpeg",
                    "desktop": "upload/images/2022/6/22/247568_desktop.jpeg",
                    "desktop_w": "upload/images/2022/6/22/247568_desktop.webp",
                    "tablet": "upload/images/2022/6/22/247568_tablet.jpeg",
                    "tablet_w": "upload/images/2022/6/22/247568_tablet.webp",
                    "mobile": "upload/images/2022/6/22/247568_mobile.jpeg",
                    "mobile_w": "upload/images/2022/6/22/247568_mobile.webp"
                },
                "description": "",
                "author_name": "ххх",
                "source_name": "кастом",
                "tags": [],
                "created_at": 1655895962,
                "creator": "Стадниченко Сергей"
            }
        ]
    }
}
   *
   * @apiErrorExample {json} Error-Response:
   HTTP/1.1 400
   {
         "message":"text error"
     }
   */
  router.get("/:id", isAccessRead(), async (req, res, next) => {
    try {
      let { id } = req.params;

      let select = [
        "id",
        "filename",
        "paths",
        "description",
        "type_name",
        "tags",
        "tags_names",
        "author_name",
        "source_name",
        "creator",
        "created_at",
      ];

      let filter = {
        id,
      };

      let result = await db.images.__filter({ select, filter });

      if (!result.data) {
        throw new HttpError("Не найдено", 404);
      }

      res.json({ message: "ok", result });
    } catch (error) {
      next(error);
    }
  });
  /**
   * @api {post} /photobank/create Сохранить новое изображение(-я)
   * @apiName Photobank
   * @apiGroup Photobank
   * @apiPermission set_image_data: write
   *
   * @apiParamExample {json} Param-Example:
   {
      "images_metadata": [{"description":"img1", "key":"tmp_0","type":0,"newSource":"source1","tags":["tag1","tag2"]},{"description":"img2","key":"tmp_1","type":0,"newAuthor":"author1","newSource":"source2","tags":["tag1","tag2"]}]
}
   *
   * @apiSuccessExample {json} Success-Response:
   HTTP/1.1 200 OK
   {
    "message": "ok",
  }
   *
   * @apiErrorExample {json} Error-Response:
   HTTP/1.1 400
   {
         "message":"text error"
     }
   */
  router.post(
    "/create",
    isAccessWrite("set_image_data"),
    async (req, res, next) => {
      try {
        let user_id = req.user.id;

        let images = req.files;

        let images_metadata = JSON.parse(req.body.images_metadata);

        if (!Array.isArray(images_metadata)) {
          images_metadata = [images_metadata];
        }

        images_metadata.forEach((item) => (item.image = images[item.key]));
        images_metadata = images_metadata.filter((el) => !!el?.image);

        await db.images.insert(images_metadata, user_id);

        res.json({ message: "ok" });

        db.logs
          .insert(
            Object.assign(getReqData(req), {
              data: { user_id },
              action_type: "create",
            })
          )
          .catch(() => {});
      } catch (error) {
        next(error);
      }
    }
  );
  /**
   * @api {put} /photobank/editImages Редактировать изображение(-я)
   * @apiName Photobank
   * @apiGroup Photobank
   * @apiPermission update_image_data: write
   *
   * @apiParamExample {json} Param-Example:
   {
      "images_metadata": [{"description":"img1", "key":"tmp_0","type":0,"newSource":"source1","tags":["tag1","tag2"]},{"description":"img2","key":"tmp_1","type":0,"newAuthor":"author1","newSource":"source2","tags":["tag1","tag2"]}]
}
   *
   * @apiSuccessExample {json} Success-Response:
   HTTP/1.1 200 OK
   {
    "message": "ok",
  }
   *
   * @apiErrorExample {json} Error-Response:
   HTTP/1.1 400
   {
         "message":"text error"
     }
   */
  router.put(
    "/editImages",
    isAccessWrite("update_image_data"),
    async (req, res, next) => {
      try {
        let data = req.body.images_metadata;
        if (!Array.isArray(data)) {
          data = [data];
        }
        await db.images.update(data);
        res.json({ message: "ok" });
        let dataToLogs = Object.assign({}, req.body);
        db.logs
          .insert(
            Object.assign(getReqData(req), {
              data: Object.assign(req.params, dataToLogs),
              action_type: "update",
            })
          )
          .catch(() => {});
      } catch (error) {
        next(error);
      }
    }
  );
  /**
   * @api {post} /photobank/deleteImages Удалить изображение(-я)
   * @apiName Photobank
   * @apiGroup Photobank
   * @apiPermission delete_image_data: write
   *
   * @apiParamExample {json} Param-Example:
   {
      "ids": [25, 26]
   *
   * @apiSuccessExample {json} Success-Response:
   HTTP/1.1 200 OK
   {
    "message": "ok",
  }
   *
   * @apiErrorExample {json} Error-Response:
   HTTP/1.1 400
   {
         "message":"text error"
     }
   */
  router.post(
    "/deleteImages",
    isAccessWrite("delete_image_data"),
    async (req, res, next) => {
      try {
        let { ids } = req.body;
        await db.images.softDelete(ids);

        res.json({ message: "ok" });
        db.logs
          .insert(
            Object.assign(getReqData(req), {
              data: req.params,
              action_type: "delete",
            })
          )
          .catch(() => {});
      } catch (error) {
        next(error);
      }
    }
  );
  /**
   * @api {post} /photobank/imagesAuthors Получить список авторов изображений
   * @apiName Photobank
   * @apiGroup Photobank
   * @apiPermission get_image_data: read
   *
   * @apiParamExample {json} Param-Example:
   {
    "select": ["name"]
}
   *
   * @apiSuccessExample {json} Success-Response:
   HTTP/1.1 200 OK
   {
    "message": "ok",
    "result": {
        "page": 1,
        "maxPages": 2,
        "allCount": 14,
        "data": [
            {
                "name": "author1"
            },
            {
                "name": "ххх"
            },
            {
                "name": "Пугачев Сергей Сергеич"
            },
            {
                "name": "Жигульский Владислав Евгеньевич"
            },
        ]
    }
}
   *
   * @apiErrorExample {json} Error-Response:
   HTTP/1.1 400
   {
         "message":"text error"
     }
   */
  router.post(
    "/imagesAuthors",
    isAccessRead("get_image_data"),
    async (req, res, next) => {
      try {
        let params = req.body;
        let result = await db.images.__filterAuthors(params);
        res.json({ message: "ok", result });
      } catch (error) {
        next(error);
      }
    }
  );
  /**
   * @api {post} /photobank/imagesSources Получить список источников изображений
   * @apiName Photobank
   * @apiGroup Photobank
   * @apiPermission get_image_data: read
   *
   * @apiParamExample {json} Param-Example:
   {
    "select": ["name"]
}
   *
   * @apiSuccessExample {json} Success-Response:
   HTTP/1.1 200 OK
   {
    "message": "ok",
    "result": {
        "page": 1,
        "maxPages": 2,
        "allCount": 13,
        "data": [
            {
                "name": "source2"
            },
            {
                "name": "source1"
            },
            {
                "name": "кастом"
            },
            {
                "name": "специально для РИА ФАН"
            },
    }
}
   *
   * @apiErrorExample {json} Error-Response:
   HTTP/1.1 400
   {
         "message":"text error"
     }
   */
  router.post(
    "/imagesSources",
    isAccessRead("get_image_data"),
    async (req, res, next) => {
      try {
        let params = req.body;
        let result = await db.images.__filterSources(params);
        res.json({ message: "ok", result });
      } catch (error) {
        next(error);
      }
    }
  );
  /**
   * @api {post} /photobank/imagesSources Получить список пользователей-создателей изображений
   * @apiName Photobank
   * @apiGroup Photobank
   * @apiPermission get_image_data: read
   *
   * @apiParamExample {json} Param-Example:
   {
    "select": ["name"]
}
   *
   * @apiSuccessExample {json} Success-Response:
   HTTP/1.1 200 OK
   {
    "message": "ok",
    "result": {
        "page": 1,
        "maxPages": 1,
        "allCount": 3,
        "data": [
            {
                "name": "Девицина Дарья Александровна"
            },
            {
                "name": "Жигульский Владислав Евгеньевич"
            },
            {
                "name": "Стадниченко Сергей"
            }
        ]
    }
}
   *
   * @apiErrorExample {json} Error-Response:
   HTTP/1.1 400
   {
         "message":"text error"
     }
   */
  router.post(
    "/imagesUsers",
    isAccessRead("get_image_data"),
    async (req, res, next) => {
      try {
        let params = req.body;
        let result = await db.images.__filterUsers(params);
        res.json({ message: "ok", result });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    "/undelete",
    isAccessRead("delete_image_data"),
    async (req, res, next) => {
      try {
        let { ids } = req.body;
        await db.images.unDelete(ids);
        res.json({ message: "ok" });
        db.logs
          .insert(
            Object.assign(getReqData(req), {
              data: req.params,
              action_type: "unDelete",
            })
          )
          .catch(() => {});
      } catch (error) {
        next(error);
      }
    }
  );
  return router;
};
