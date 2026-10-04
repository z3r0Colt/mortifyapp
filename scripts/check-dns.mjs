import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const dist = ".gradle-cache/wrapper/dists/gradle-8.14.3-all";
const folder = fs
  .readdirSync(dist)
  .map((name) => path.join(dist, name, "gradle-8.14.3/lib"))
  .find((name) => fs.existsSync(name));
if (!folder)
  throw new Error(
    "Run Android Gradle once to download its Kotlin compiler first.",
  );
const java = path.join(
  process.env.JAVA_HOME ?? "",
  "bin",
  process.platform === "win32" ? "java.exe" : "java",
);
const output = ".native-tests/dns";
fs.mkdirSync(output, { recursive: true });
const stdlib = fs
  .readdirSync(folder)
  .find((name) => /^kotlin-stdlib-.*\.jar$/.test(name));
function run(args) {
  const result = spawnSync(java, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status) process.exit(result.status);
}
run([
  "-cp",
  `${folder}/*`,
  "org.jetbrains.kotlin.cli.jvm.K2JVMCompiler",
  "-no-stdlib",
  "-no-reflect",
  "-classpath",
  path.join(folder, stdlib),
  "-d",
  output,
  "android/app/src/main/java/com/gentleking/mortify/shield/DnsWire.kt",
  "scripts/DnsWireSmoke.kt",
]);
run([
  "-cp",
  `${output}${path.delimiter}${path.join(folder, stdlib)}`,
  "DnsWireSmokeKt",
]);
