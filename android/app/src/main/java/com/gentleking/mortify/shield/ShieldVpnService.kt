package com.gentleking.mortify.shield

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import androidx.core.app.NotificationCompat
import com.gentleking.mortify.MainActivity
import java.io.File
import java.util.UUID

class ShieldVpnService:VpnService() {
    private var tunnel:ParcelFileDescriptor?=null
    private var proxy:LocalSocks?=null
    private var engine:TunnelEngine?=null
    private var monitor:Thread?=null
    @Volatile private var closing=false
    companion object {@Volatile var running=false;const val STOPPED="com.gentleking.mortify.SHIELD_STOPPED"}
    override fun onStartCommand(intent:Intent?,flags:Int,startId:Int):Int {
        if(intent?.action=="stop"){stopSelf();return START_NOT_STICKY}
        if(running)return START_STICKY
        if(!TunnelEngine.available){stopSelf();return START_NOT_STICKY}
        val manager=getSystemService(NotificationManager::class.java)
        if(Build.VERSION.SDK_INT>=26)manager.createNotificationChannel(NotificationChannel("mortify_shield","Protection",NotificationManager.IMPORTANCE_LOW))
        val open=PendingIntent.getActivity(this,0,Intent(this,MainActivity::class.java),PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        startForeground(30,NotificationCompat.Builder(this,"mortify_shield").setSmallIcon(android.R.drawable.ic_lock_lock).setContentTitle("Mortify protection is on").setContentText("Local VPN filters DNS. Tap to open protection settings.").setContentIntent(open).setOngoing(true).build())
        try{
            closing=false;val password=UUID.randomUUID().toString();proxy=LocalSocks(this,DnsFilter(this),password).also{it.start()}
            tunnel=Builder().setSession("Mortify protection").setMtu(1500).addAddress("198.18.0.1",32).addAddress("fd00:6d6f:7274::1",128).addRoute("0.0.0.0",0).addRoute("::",0).addDnsServer("198.18.0.2").establish()?:throw IllegalStateException()
            val config=File(filesDir,"shield.yml");config.writeText("""
                tunnel:
                  mtu: 1500
                  ipv4: 198.18.0.1
                  ipv6: 'fd00:6d6f:7274::1'
                socks5:
                  address: 127.0.0.1
                  port: ${proxy!!.port}
                  username: mortify
                  password: '$password'
                  udp: udp
                misc:
                  log-file: null
                  log-level: error
                  max-session-count: 64
            """.trimIndent())
            engine=TunnelEngine();check(engine!!.TProxyStartService(config.absolutePath,tunnel!!.fd));running=true
            getSharedPreferences("shield",0).edit().putBoolean("enabled",true).apply()
            monitor=Thread{while(!closing&&engine?.TProxyIsRunning()==true){Thread.sleep(1000)};if(!closing)stopSelf()}.also{it.start()}
            return START_STICKY
        }catch(_:Exception){stopSelf();return START_NOT_STICKY}
    }
    override fun onRevoke(){stopSelf();super.onRevoke()}
    override fun onDestroy(){
        closing=true;monitor?.interrupt();try{engine?.TProxyStopService()}catch(_:Exception){};try{tunnel?.close()}catch(_:Exception){};try{proxy?.close()}catch(_:Exception){}
        val wasRunning=running;running=false
        if(wasRunning){getSharedPreferences("shield",0).edit().putBoolean("enabled",false).putLong("offAt",System.currentTimeMillis()).apply();sendBroadcast(Intent(STOPPED).setPackage(packageName))}
        stopForeground(STOP_FOREGROUND_REMOVE);super.onDestroy()
    }
}
