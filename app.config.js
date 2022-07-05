module.exports = {
  apps: [
    {
      error_file: "/var/log/pm2_err.log",
      out_file: "/var/log/pm2_out.log",
      name: "index",
      script: "npm",
      watch: false,
      args: "start",
      cwd: "/var/photobank_api/",
      ignore_watch: [
        "package-lock.json",
        "package.json",
        "node_modules",
        ".git",
        ".*",
      ],
    },
  ],
};
