const axios = require("axios");
const cookie = require("cookie");
const config = require("../config");
const logger = require("../helpers/logger");

async function getSessionCookie(renew = false) {
  if (global.coockieAuth !== undefined && renew === false) {
    return global.coockieAuth;
  }
  return axios({
    method: "post",
    url: `${config.NODE_AUTH.url}/auth/login`,
    data: {
      username: config.NODE_AUTH.login,
      password: config.NODE_AUTH.password,
    },
    withCredentials: true,
  }).then((loginCookie) => {
    if (
      loginCookie.headers["set-cookie"] &&
      loginCookie.headers["set-cookie"].length < 1
    ) {
      logger.error(
        new Error(
          `login error to ${config.NODE_AUTH.url}/auth/login = NO COOKIES!`
        )
      );
      return;
    }
    const cookies = cookie.parse(loginCookie.headers["set-cookie"][0]);

    global.coockieAuth = `connect.sid=${cookies["connect.sid"]}`;

    return `connect.sid=${cookies["connect.sid"]}`;
  });
}

module.exports = getSessionCookie;
