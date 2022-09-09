const { validateSchema } = require("./validate");
const RIGHTS_ERR = { error: "not rights" };
const AUTH_ERR = { error: "not authenticated" };
const valid = (req, res, next, val) =>
  !val || (val && validateSchema(req, res, next, val));

const rights = {
  deny: 0,
  read: 1,
  write: 2,
};
const checkRights = (user = {}, e, r) => user.rights && user.rights[e] >= r;
const canRead = (user = {}, entity) => checkRights(user, entity, rights.read);
const canWrite = (user = {}, entity) => checkRights(user, entity, rights.write);
const isAccess = (user = {}, e) => user.rights && user.rights[e] > rights.deny;

const gen = (...entity) => ({
  isAccessRead: (val) => async (req, res, next) => {
    if (req.isAuthenticated()) {
      let result = [];
      for (let item of entity) {
        if (canRead(req.user, item)) {
          result.push(item);
        }
      }
      if (result.length > 0) {
        if (valid(req, res, next, val)) {
          next();
        }
      } else {
        res.status(403).json(RIGHTS_ERR);
      }
    } else {
      res.status(401).json(AUTH_ERR);
    }
  },
  isAccessWrite: (val) => async (req, res, next) => {
    if (req.isAuthenticated()) {
      let result = [];
      for (let item of entity) {
        if (canWrite(req.user, item)) {
          result.push(item);
        }
      }
      if (result.length > 0) {
        if (valid(req, res, next, val)) {
          next();
        }
      } else {
        res.status(403).json(RIGHTS_ERR);
      }
    } else {
      res.status(401).json(AUTH_ERR);
    }
  },
  isAccess: (val) => async (req, res, next) => {
    if (req.isAuthenticated()) {
      let result = [];
      for (let item of entity) {
        if (isAccess(req.user, item)) {
          result.push(item);
        }
      }
      if (result.length > 0) {
        if (valid(req, res, next, val)) {
          next();
        }
      } else {
        res.status(403).json(RIGHTS_ERR);
      }
    } else {
      res.status(401).json(AUTH_ERR);
    }
  },
});

module.exports = {
  gen,
  RIGHTS_ERR,
  AUTH_ERR,
};
