const session = require("express-session");
const redis = require("redis");
const RedisStore = require("connect-redis")(session);
const passport = require("passport");
const { REDIS_SETTINGS } = require("../config");
const JsonStrategy = require("passport-json").Strategy;
const { createHashPassword } = require("../helpers/helpers");
const db = require("../db");

const redisClient = redis.createClient({
  host: REDIS_SETTINGS.host,
  port: REDIS_SETTINGS.port,
});

// :Middleware session REDIS
const sessionMiddleware = session({
  secret: REDIS_SETTINGS.secret,
  resave: true,
  rolling: true,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 30,
    httpOnly: false,
    sameSite: "lax",
    domain: REDIS_SETTINGS.sessionDomain,
  },
  store: new RedisStore({ client: redisClient }),
});

module.exports = (app) => {
  app.use(sessionMiddleware);
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
  app.use(passport.initialize()).use(passport.session());
  passport.use(
    "json",
    new JsonStrategy(
      {
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true,
        allowEmptyPasswords: false,
      },
      (req, username, password, done) => {
        const dataIn = {
          username,
          password: createHashPassword(password),
        };
        db.users
          .getAuth(dataIn)
          .then((res) => {
            if (res) {
              return done(null, res);
            }
            return done({ error: "Incorrect username or password." });
          })
          .catch((err) =>
            done({
              error: (err && err.message) || "Incorrect username or password.",
            })
          );
      }
    )
  );
};
