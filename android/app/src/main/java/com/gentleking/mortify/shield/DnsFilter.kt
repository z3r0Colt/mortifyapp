package com.gentleking.mortify.shield

import android.net.VpnService
import java.io.DataInputStream
import java.io.DataOutputStream
import java.net.InetSocketAddress
import java.net.Socket
import javax.net.ssl.SSLSocket
import javax.net.ssl.SSLSocketFactory

class DnsFilter(private val vpn:VpnService) {
    private val blocked=vpn.assets.open("shield-blocklist.txt").bufferedReader().useLines {lines->lines.map{it.trim().lowercase()}.filter{it.isNotEmpty()&&!it.startsWith('#')}.toSet()}
    fun blocked(name:String):Boolean {var domain=name.lowercase().trimEnd('.');while(domain.isNotEmpty()){if(domain in blocked)return true;domain=domain.substringAfter('.',"")};return false}
    fun safeTarget(name:String):String?=when {
        name.matches(Regex("(www\\.)?google\\.(com|[a-z]{2}|com\\.[a-z]{2}|co\\.[a-z]{2})"))->"forcesafesearch.google.com"
        name=="bing.com"||name=="www.bing.com"->"strict.bing.com"
        name=="duckduckgo.com"||name=="www.duckduckgo.com"->"safe.duckduckgo.com"
        name in setOf("youtube.com","www.youtube.com","m.youtube.com","youtubei.googleapis.com","youtube.googleapis.com","www.youtube-nocookie.com")->"restrict.youtube.com"
        else->null
    }
    fun resolve(query:ByteArray):ByteArray {
        val q=DnsWire.question(query)
        if(blocked(q.name))return DnsWire.error(query,3)
        val target=safeTarget(q.name)
        if(target!=null){if(q.type !in setOf(1,28))return DnsWire.error(query,0);val response=upstream(DnsWire.query(target,q.type,DnsWire.u16(query,0)));return DnsWire.safeAnswer(query,target,DnsWire.addresses(response,q.type))}
        val response=upstream(query)
        require(DnsWire.u16(response,0)==DnsWire.u16(query,0))
        return response
    }
    private fun upstream(query:ByteArray):ByteArray {
        Socket().use { base ->
        require(vpn.protect(base));base.connect(InetSocketAddress("185.228.168.168",853),5000)
        ((SSLSocketFactory.getDefault() as SSLSocketFactory).createSocket(base,"family-filter-dns.cleanbrowsing.org",853,true) as SSLSocket).use {tls->
            tls.soTimeout=5000;val params=tls.sslParameters;params.endpointIdentificationAlgorithm="HTTPS";tls.sslParameters=params;tls.startHandshake()
            val output=DataOutputStream(tls.outputStream);output.writeShort(query.size);output.write(query);output.flush()
            val input=DataInputStream(tls.inputStream);val size=input.readUnsignedShort();require(size in 12..65535);return ByteArray(size).also{input.readFully(it)}
        }
        }
    }
}
