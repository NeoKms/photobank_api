const Ajv = require("ajv");
const ajv = new Ajv({ allErrors: true });
const fs = require("fs");

readSchemas(`${__dirname}`);

function readSchemas(dir) {
  fs.readdirSync(dir).map((module) => {
    if (module.indexOf(".json") !== -1) {
      ajv.addSchema(require(`${dir}/${module}`), module.replace(".json", ""));
    } else if (module.indexOf(".") === -1) {
      readSchemas(`${dir}/${module}`);
    }
  });
}

function errorResponse(schemaErrors) {
  const errors = schemaErrors.map((error) => ({
    param: error.dataPath,
    requireType: error.params.type,
    message: error.message,
  }));
  return {
    error: errors,
  };
}

module.exports = (schemaName) => async (req, res, next) => {
  try {
    if (
      !ajv.validate(schemaName, { ...req.body, ...req.files, ...req.params })
    ) {
      return res.status(400).send(errorResponse(ajv.errors));
    }
    next();
  } catch (error) {
    next(error);
  }
};
module.exports.validateSchema = (req, res, next, schemaName) => {
  try {
    if (
      !ajv.validate(schemaName, { ...req.body, ...req.files, ...req.params })
    ) {
      res.status(400).send(errorResponse(ajv.errors));
      return false;
    }
    return true;
  } catch (error) {
    return next(error);
  }
};
