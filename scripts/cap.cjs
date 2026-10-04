// The Ionic CLI asks Windows for account metadata solely to detect a shell.
// Some managed runners cannot provide it; use the existing environment then.
const os = require("node:os");
const original = os.userInfo;
os.userInfo = function (options) {
  try {
    return original(options);
  } catch {
    return {
      shell: process.env.ComSpec || "cmd.exe",
      homedir: process.env.USERPROFILE,
      username: process.env.USERNAME,
      uid: -1,
      gid: -1,
    };
  }
};
require("@capacitor/cli/bin/capacitor");
