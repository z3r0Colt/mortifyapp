import Capacitor
class MortifyViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(MortifyVaultPlugin())
        bridge?.registerPluginInstance(MortifyShieldPlugin())
        bridge?.registerPluginInstance(MortifyAppearancePlugin())
    }
}
