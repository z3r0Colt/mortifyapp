import Capacitor
import FamilyControls
import ManagedSettings
import Combine

@objc(MortifyShieldPlugin)
public class MortifyShieldPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier="MortifyShieldPlugin"
    public let jsName="MortifyShield"
    public let pluginMethods:[CAPPluginMethod]=[CAPPluginMethod(name:"start",returnType:CAPPluginReturnPromise),CAPPluginMethod(name:"stop",returnType:CAPPluginReturnPromise),CAPPluginMethod(name:"status",returnType:CAPPluginReturnPromise)]
    private var observer:AnyCancellable?
    @available(iOS 16.0, *) private var store:ManagedSettingsStore {ManagedSettingsStore(named:.init("Mortify"))}
    @MainActor private func snapshot()->[String:Any] {
        guard #available(iOS 16.0, *) else{return ["available":false,"authorized":false,"running":false]}
        let authorized=AuthorizationCenter.shared.authorizationStatus == .approved
        let running=authorized && UserDefaults.standard.bool(forKey:"mortify.shield.enabled") && store.webContent.blockedByFilter == .auto([],except:[])
        return ["available":true,"authorized":authorized,"running":running]
    }
    public override func load() {
        DispatchQueue.main.async {
            if #available(iOS 16.0, *) {
                self.observer=AuthorizationCenter.shared.$authorizationStatus.sink {status in
                    if status != .approved && UserDefaults.standard.bool(forKey:"mortify.shield.enabled") {
                        self.store.clearAllSettings();UserDefaults.standard.set(false,forKey:"mortify.shield.enabled")
                        self.notifyListeners("stopped",data:["running":false,"authorized":false,"available":true],retainUntilConsumed:true)
                    }
                }
            }
        }
    }
    @objc func status(_ call:CAPPluginCall){Task{@MainActor in call.resolve(snapshot())}}
    @objc func start(_ call:CAPPluginCall){
        Task{@MainActor in
            guard #available(iOS 16.0, *) else{call.reject("Use the Screen Time setup guide on this version of iOS.");return}
            do{try await AuthorizationCenter.shared.requestAuthorization(for:.individual);guard AuthorizationCenter.shared.authorizationStatus == .approved else{call.reject("Authorization was not granted.");return}
                store.webContent.blockedByFilter = .auto([],except:[]);UserDefaults.standard.set(true,forKey:"mortify.shield.enabled");call.resolve(snapshot())
            }catch{call.reject("Apple authorization is unavailable. Check the Family Controls entitlement or use the setup guide.")}
        }
    }
    @objc func stop(_ call:CAPPluginCall){Task{@MainActor in if #available(iOS 16.0, *){store.clearAllSettings()};UserDefaults.standard.set(false,forKey:"mortify.shield.enabled");call.resolve(snapshot())}}
}
