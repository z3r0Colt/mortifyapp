import { execFileSync } from "node:child_process";
import fs from "node:fs";
const root = "native/vendor/hev-socks5-tunnel";
const git = (args) =>
  execFileSync("git", ["-c", "http.sslBackend=openssl", ...args], {
    encoding: "utf8",
  });
const pin = "2cdc169a248ced7097a7931aea5bf81540dc7759";
if (!fs.existsSync(`${root}/.git`))
  git(["clone", "https://github.com/heiher/hev-socks5-tunnel.git", root]);
git(["-C", root, "checkout", pin]);
for (const [path, repo] of [
  ["third-part/hev-task-system", "hev-task-system"],
  ["third-part/yaml", "yaml"],
  ["third-part/lwip", "lwip"],
  ["src/core", "hev-socks5-core"],
]) {
  const commit = git(["-C", root, "ls-tree", "HEAD", path]).split(/\s+/)[2];
  if (!/^[a-f0-9]{40}$/.test(commit))
    throw new Error("Missing pinned submodule");
  if (!fs.existsSync(`${root}/${path}/.git`))
    git([
      "clone",
      "--no-checkout",
      `https://github.com/heiher/${repo}.git`,
      `${root}/${path}`,
    ]);
  git(["-C", `${root}/${path}`, "checkout", commit]);
}
fs.writeFileSync(
  "native/vendor/TUNNEL-VERSION.txt",
  `hev-socks5-tunnel ${pin}\nSource: https://github.com/heiher/hev-socks5-tunnel\nLicense: MIT (retain all bundled license files)\n`,
);
