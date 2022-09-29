const db = require("../../db");
const express = require("express");
const router = express.Router();
const { getReqData } = require("../../helpers/helpers");
const HttpError = require("../../modules/HttpError");
const { isAccessWrite, isAccessRead } = require("../../modules/rights").gen(
  "mh_photobank"
);

module.exports = () => {
  /**
   * @api {post} /watermark создать вотермарку
   * @apiName watermark
   * @apiGroup watermark
   * @apiPermission set_watermark: write
   *
   * @apiParamExample {json} Param-Example:
   {
    "name": "вотермарка",
    "type": 1
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
  router.post("/", isAccessWrite("set_watermark"), async (req, res, next) => {
    try {
      let image = req.files;
      let params = req.body;
      await db.images.insertWatermark(image, params);
      res.json({ message: "ok" });
      db.logs
        .insert(
          Object.assign(getReqData(req), {
            data: params,
            action_type: "create",
          })
        )
        .catch(() => {});
    } catch (error) {
      next(error);
    }
  });
  /**
   * @api {get} /watermark/:getList Получить список всех ватермарок
   * @apiDescription ...
   * @apiName watermark
   * @apiGroup watermark
   *
   * @apiSuccessExample {json} Success-Response:
   HTTP/1.1 200 OK
   {
    "message": "ok",
    "result": [
        {
            "id": 247599,
            "name": "вотермарка",
            "type": 1,
            "path": "https://api-post.ttrace.ru/upload/images/2022/6/24/247599.jpg"
        },
        {
            "id": 247600,
            "name": "вотермарка",
            "type": 1,
            "path": "https://api-post.ttrace.ru/upload/images/2022/6/24/247600.jpg"
        },
        {
            "id": 247601,
            "name": "вотермарка",
            "type": 1,
            "path": "https://api-post.ttrace.ru/upload/images/2022/6/24/247601.jpg"
        }
    ]
}
   *
   * @apiErrorExample {json} Error-Response:
   HTTP/1.1 400
   {
         "message":"text error"
     }
   */
  router.post("/getList", isAccessRead(), async (req, res, next) => {
    try {
      let { options } = req.body;
      let result = await db.images.filterWatermark({ options });
      res.json({ message: "ok", result });
    } catch (error) {
      next(error);
    }
  });
  /**
   * @api {get} watermark/:id Получить ватермарку по айди
   * @apiDescription ...
   * @apiName watermark
   * @apiGroup watermark
   *
   * @apiSuccessExample {json} Success-Response:
   HTTP/1.1 200 OK
   {
    "message": "ok",
    "result": [
        {
            "id": 247601,
            "name": "вотермарка",
            "type": 1,
            "path": "https://api-post.ttrace.ru/upload/images/2022/6/24/247601.jpg"
        }
    ]
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
      let filter = {
        id: Number.parseInt(id),
      };

      let result = await db.images.filterWatermark({ filter });

      if (!result?.length) {
        throw new HttpError("Не найдено", 404);
      }

      res.json({ message: "ok", result });
    } catch (error) {
      next(error);
    }
  });
  /**
   * @api {delete} /watermark/:id Удалить ватермарку
   * @apiName watermark
   * @apiGroup watermark

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
  router.delete("/:id", isAccessWrite(), async (req, res, next) => {
    try {
      let { id } = req.params;
      await db.images.deleteWatermark(id);

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
  });
    /**
   * @api {post} watermark/:id/configs Обновить configs ватермарки по айди
   * @apiDescription ...
   * @apiName watermark
   * @apiGroup post-watermark-id
   *
   * @apiErrorExample {json} Error-Response:
   HTTP/1.1 400
   {
         "message":"text error"
     }
   */
  router.post("/:id/configs", isAccessRead(), async (req, res, next) => {
    try {
      const { id } = req.params;
      const { configs } = req.body;
      let result = await db.images.updateWatermarkConfigs(+id, configs);
      res.json({ message: "ok", result });
    } catch (error) {
      next(error);
    }
  });
  return router;
};
