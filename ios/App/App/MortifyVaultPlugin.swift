import Capacitor
import LocalAuthentication
import Security

@objc(MortifyVaultPlugin)
public class MortifyVaultPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MortifyVaultPlugin"
    public let jsName = "MortifyVault"
    public let pluginMethods: [CAPPluginMethod] = [CAPPluginMethod(name:"available",returnType:CAPPluginReturnPromise),CAPPluginMethod(name:"store",returnType:CAPPluginReturnPromise),CAPPluginMethod(name:"read",returnType:CAPPluginReturnPromise),CAPPluginMethod(name:"remove",returnType:CAPPluginReturnPromise)]
    private let service = "com.gentleking.mortify.journal"
    private var query: [String: Any] { [kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:service,kSecAttrAccount as String:"key"] }
    @objc func available(_ call: CAPPluginCall) {let context=LAContext();var error:NSError?;call.resolve(["available":context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics,error:&error)])}
    @objc func store(_ call: CAPPluginCall) {
        guard let encoded=call.getString("key"),let data=Data(base64Encoded:encoded),data.count==32 else {call.reject("Invalid private key");return}
        var item=query;item[kSecValueData as String]=data
        let biometric=call.getBool("biometric") ?? false
        if biometric {
            var error:Unmanaged<CFError>?
            guard let access=SecAccessControlCreateWithFlags(nil,kSecAttrAccessibleWhenUnlockedThisDeviceOnly,.biometryCurrentSet,&error) else {call.reject("Biometric storage unavailable");return}
            item[kSecAttrAccessControl as String]=access
        }else{item[kSecAttrAccessible as String]=kSecAttrAccessibleWhenUnlockedThisDeviceOnly}
        SecItemDelete(query as CFDictionary)
        if SecItemAdd(item as CFDictionary,nil)==errSecSuccess {call.resolve()}else{call.reject("Could not save your private key. Your PIN still works.")}
    }
    @objc func read(_ call: CAPPluginCall) {
        DispatchQueue.global(qos:.userInitiated).async {
            var item=self.query;item[kSecReturnData as String]=true;item[kSecMatchLimit as String]=kSecMatchLimitOne
            let context=LAContext();context.localizedReason="Open your Mortify journal";item[kSecUseAuthenticationContext as String]=context
            var result:CFTypeRef?
            if SecItemCopyMatching(item as CFDictionary,&result)==errSecSuccess,let data=result as? Data {call.resolve(["key":data.base64EncodedString()])}else{call.reject("Private key unavailable. Use your PIN.")}
        }
    }
    @objc func remove(_ call: CAPPluginCall) {let status=SecItemDelete(query as CFDictionary);if status==errSecSuccess || status==errSecItemNotFound {call.resolve()}else{call.reject("Could not remove the saved key")}}
}
