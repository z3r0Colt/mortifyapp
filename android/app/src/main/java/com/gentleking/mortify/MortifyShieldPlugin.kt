package com.gentleking.mortify

import android.app.Activity
import android.content.*
import android.net.VpnService
import android.os.Build
import androidx.activity.result.ActivityResult
import androidx.core.content.ContextCompat
import com.getcapacitor.*
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import com.gentleking.mortify.shield.ShieldVpnService
import com.gentleking.mortify.shield.TunnelEngine

@CapacitorPlugin(name="MortifyShield")
class MortifyShieldPlugin:Plugin() {
    private val receiver=object:BroadcastReceiver(){override fun onReceive(context:Context,intent:Intent){notifyListeners("stopped",snapshot(),true)}}
    override fun load(){ContextCompat.registerReceiver(context,receiver,IntentFilter(ShieldVpnService.STOPPED),ContextCompat.RECEIVER_NOT_EXPORTED)}
    override fun handleOnDestroy(){context.unregisterReceiver(receiver)}
    private fun snapshot()=JSObject().put("running",ShieldVpnService.running).put("authorized",VpnService.prepare(context)==null).put("available",TunnelEngine.available)
    @PluginMethod fun status(call:PluginCall){call.resolve(snapshot())}
    @PluginMethod fun start(call:PluginCall){if(!TunnelEngine.available){call.reject("The full tunnel engine is not included in this build. Use the setup guide.");return};val intent=VpnService.prepare(context);if(intent!=null)startActivityForResult(call,intent,"permission")else begin(call)}
    @ActivityCallback private fun permission(call:PluginCall?,result:ActivityResult){if(call==null)return;if(result.resultCode==Activity.RESULT_OK)begin(call)else call.reject("VPN permission was not granted. The setup guide is available.")}
    private fun begin(call:PluginCall){ContextCompat.startForegroundService(context,Intent(context,ShieldVpnService::class.java));Thread{repeat(50){if(ShieldVpnService.running){call.resolve(snapshot());return@Thread};Thread.sleep(100)};call.reject("Protection did not start. Use the setup guide and check the native build.")}.start()}
    @PluginMethod fun stop(call:PluginCall){context.stopService(Intent(context,ShieldVpnService::class.java));call.resolve(JSObject().put("running",false).put("authorized",VpnService.prepare(context)==null).put("available",TunnelEngine.available))}
}
