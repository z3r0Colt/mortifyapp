package com.gentleking.mortify.shield

// JNI registration names are defined by the pinned Hev engine's Android build.
class TunnelEngine {
    external fun TProxyStartService(config:String,fd:Int):Boolean
    external fun TProxyStopService():Boolean
    external fun TProxyIsRunning():Boolean
    external fun TProxyGetStats():LongArray
    companion object {val available:Boolean by lazy {try{System.loadLibrary("hev-socks5-tunnel");true}catch(_:UnsatisfiedLinkError){false}}}
}
