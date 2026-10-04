import Capacitor
import UIKit
@objc(MortifyAppearancePlugin)
public class MortifyAppearancePlugin:CAPPlugin,CAPBridgedPlugin {
    public let identifier="MortifyAppearancePlugin"
    public let jsName="MortifyAppearance"
    public let pluginMethods:[CAPPluginMethod]=[CAPPluginMethod(name:"setDiscreet",returnType:CAPPluginReturnPromise)]
    @objc func setDiscreet(_ call:CAPPluginCall){DispatchQueue.main.async {guard UIApplication.shared.supportsAlternateIcons else{call.reject("Alternate icons are unavailable");return};let enabled=call.getBool("enabled") ?? false;UIApplication.shared.setAlternateIconName(enabled ? "Notes" : nil){error in if error != nil{call.reject("Could not change the app icon")}else{call.resolve(["enabled":enabled])}}}}
}
