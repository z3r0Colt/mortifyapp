package com.gentleking.mortify
import android.content.ComponentName
import android.content.pm.PackageManager
import com.getcapacitor.*
import com.getcapacitor.annotation.CapacitorPlugin
@CapacitorPlugin(name="MortifyAppearance")
class MortifyAppearancePlugin:Plugin(){
    @PluginMethod fun setDiscreet(call:PluginCall){
        try{val discreet=call.getBoolean("enabled",false)?:false;val manager=context.packageManager;val chosen=if(discreet)"NotesAlias" else "MortifyAlias";val other=if(discreet)"MortifyAlias" else "NotesAlias"
            manager.setComponentEnabledSetting(ComponentName(context,"${context.packageName}.$chosen"),PackageManager.COMPONENT_ENABLED_STATE_ENABLED,PackageManager.DONT_KILL_APP)
            manager.setComponentEnabledSetting(ComponentName(context,"${context.packageName}.$other"),PackageManager.COMPONENT_ENABLED_STATE_DISABLED,PackageManager.DONT_KILL_APP);call.resolve(JSObject().put("enabled",discreet))
        }catch(_:Exception){call.reject("Could not change the launcher icon")}
    }
}
