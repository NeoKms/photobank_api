const { exec } = require("child_process");

module.exports = function execPromise(cmd) {
  return new Promise(function (resolve, reject) {
    exec(cmd, function (err, stdout) {
      if (err) return reject(err);
      resolve(stdout);
    });
  });
};
