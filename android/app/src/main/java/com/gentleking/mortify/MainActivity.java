package com.gentleking.mortify;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(android.os.Bundle state) {
        registerPlugin(MortifyVaultPlugin.class);
        registerPlugin(MortifyShieldPlugin.class);
        registerPlugin(MortifyAppearancePlugin.class);
        super.onCreate(state);
        getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE);
    }
}
