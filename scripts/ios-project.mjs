import fs from "node:fs";
import xcode from "xcode";
const file = "ios/App/App.xcodeproj/project.pbxproj";
const project = xcode.project(file);
project.parseSync();
const objects = project.hash.project.objects;
const clean = (value) =>
  typeof value === "string" ? value.replaceAll('"', "") : value;
const widgets = Object.entries(objects.PBXNativeTarget).filter(
  ([key, value]) =>
    !key.endsWith("_comment") && clean(value.name) === "MortifyWidget",
);
// Repair duplicate targets produced by quoted-name comparisons in xcode's helpers.
for (const [uuid, targetValue] of widgets.slice(1)) {
  const remove = new Set([
    uuid,
    targetValue.productReference,
    targetValue.buildConfigurationList,
    ...targetValue.buildPhases.map((p) => p.value),
  ]);
  for (const config of objects.XCConfigurationList[
    targetValue.buildConfigurationList
  ].buildConfigurations)
    remove.add(config.value);
  for (const [key, value] of Object.entries(
    objects.PBXContainerItemProxy ?? {},
  ))
    if (value.remoteGlobalIDString === uuid) remove.add(key);
  for (const [key, value] of Object.entries(objects.PBXTargetDependency ?? {}))
    if (value.target === uuid) remove.add(key);
  for (const [key, value] of Object.entries(objects.PBXBuildFile ?? {}))
    if (value.fileRef === targetValue.productReference) remove.add(key);
  function prune(value) {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (Array.isArray(child))
        value[key] = child
          .filter((item) => !remove.has(item.value))
          .map((item) => {
            prune(item);
            return item;
          });
      else prune(child);
    }
  }
  for (const section of Object.values(objects)) {
    for (const key of remove) {
      delete section[key];
      delete section[`${key}_comment`];
    }
    prune(section);
  }
}
for (const [key, value] of Object.entries(objects.PBXNativeTarget))
  if (!key.endsWith("_comment")) {
    value.name = clean(value.name);
    objects.PBXNativeTarget[`${key}_comment`] = value.name;
  }
const group = project.findPBXGroupKey({ path: "App" });
const target = project.getFirstTarget().uuid;
for (const name of [
  "MortifyViewController.swift",
  "MortifyVaultPlugin.swift",
  "MortifyShieldPlugin.swift",
  "MortifyAppearancePlugin.swift",
]) {
  if (!project.hasFile(name)) project.addSourceFile(name, { target }, group);
}
// Entitlements belong only to the main app, never the widget extension.
project.removeBuildProperty("CODE_SIGN_ENTITLEMENTS");
project.updateBuildProperty(
  "CODE_SIGN_ENTITLEMENTS",
  "App/App.entitlements",
  undefined,
  "App",
);
// xcode's resource helper expects a Resources group even when a custom group is supplied.
if (!project.pbxGroupByName("Resources")) {
  const resources = project.addPbxGroup([], "Resources");
  project.addToPbxGroup(
    resources.uuid,
    project.getFirstProject().firstProject.mainGroup,
  );
}
for (const name of [
  "NotesIcon@2x.png",
  "NotesIcon@3x.png",
  "NotesIcon~ipad.png",
  "NotesIcon~ipad@2x.png",
  "NotesIcon83.5@2x.png",
])
  if (!project.hasFile(name)) project.addResourceFile(name, { target }, group);
if (!project.pbxTargetByName("MortifyWidget")) {
  const widget = project.addTarget(
    "MortifyWidget",
    "app_extension",
    "MortifyWidget",
    "com.gentleking.mortify.widget",
  );
  for (const [type, name] of [
    ["PBXSourcesBuildPhase", "Sources"],
    ["PBXFrameworksBuildPhase", "Frameworks"],
    ["PBXResourcesBuildPhase", "Resources"],
  ])
    project.addBuildPhase([], type, name, widget.uuid);
  const widgetGroup = project.addPbxGroup([], "MortifyWidget", "MortifyWidget");
  project.addToPbxGroup(
    widgetGroup.uuid,
    project.getFirstProject().firstProject.mainGroup,
  );
  project.addSourceFile(
    "MortifyWidget.swift",
    { target: widget.uuid },
    widgetGroup.uuid,
  );
}
for (const [key, value] of Object.entries(objects.PBXNativeTarget))
  if (!key.endsWith("_comment")) {
    value.name = clean(value.name);
    objects.PBXNativeTarget[`${key}_comment`] = value.name;
  }
for (const [key, value] of Object.entries({
  IPHONEOS_DEPLOYMENT_TARGET: "16.0",
  SWIFT_VERSION: "5.0",
  SDKROOT: "iphoneos",
  TARGETED_DEVICE_FAMILY: '"1,2"',
  CODE_SIGN_STYLE: "Automatic",
  CURRENT_PROJECT_VERSION: "1",
  MARKETING_VERSION: "1.0",
  APPLICATION_EXTENSION_API_ONLY: "YES",
  GENERATE_INFOPLIST_FILE: "NO",
  INFOPLIST_FILE: "MortifyWidget/MortifyWidget-Info.plist",
}))
  project.updateBuildProperty(key, value, undefined, "MortifyWidget");
// Remove unset optional fields emitted as invalid literal `undefined` by xcode.
for (const value of Object.values(objects.PBXFileReference))
  if (value && typeof value === "object" && clean(value.path)?.endsWith(".png"))
    value.lastKnownFileType = "image.png";
for (const section of Object.values(objects))
  for (const value of Object.values(section))
    if (value && typeof value === "object")
      for (const key of Object.keys(value))
        if (value[key] === undefined || value[key] === "undefined")
          delete value[key];
fs.writeFileSync(file, project.writeSync());
