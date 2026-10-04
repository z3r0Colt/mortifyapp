package com.gentleking.mortify.shield

import android.net.VpnService
import java.io.DataInputStream
import java.io.DataOutputStream
import java.net.*
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.Semaphore

class LocalSocks(private val vpn:VpnService,private val dns:DnsFilter,val password:String):AutoCloseable {
    private val server=ServerSocket(0,32,InetAddress.getByName("127.0.0.1"))
    private val executor=Executors.newCachedThreadPool()
    private val capacity=Semaphore(64)
    private val sockets=ConcurrentHashMap.newKeySet<AutoCloseable>()
    @Volatile private var open=true
    val port:Int get()=server.localPort
    private val dohIps=setOf("1.1.1.1","1.0.0.1","8.8.8.8","8.8.4.4","9.9.9.9","149.112.112.112","2606:4700:4700::1111","2606:4700:4700::1001","2001:4860:4860::8888","2001:4860:4860::8844")
    fun start(){executor.execute{while(open){try{val socket=server.accept();if(!capacity.tryAcquire()){socket.close();continue};sockets.add(socket);executor.execute{try{handle(socket)}catch(_:Exception){}finally{socket.close();sockets.remove(socket);capacity.release()}}}catch(_:Exception){if(open)close()}}}}
    private data class Destination(val address:InetAddress,val port:Int)
    private fun destination(input:DataInputStream):Destination {
        val address=when(input.readUnsignedByte()){
            1->InetAddress.getByAddress(ByteArray(4).also{input.readFully(it)})
            4->InetAddress.getByAddress(ByteArray(16).also{input.readFully(it)})
            3->{val name=ByteArray(input.readUnsignedByte()).also{input.readFully(it)}.toString(Charsets.US_ASCII);require(!dns.blocked(name));val answer=dns.resolve(DnsWire.query(name,1,1));InetAddress.getByAddress(DnsWire.addresses(answer,1).first())}
            else->throw IllegalArgumentException()
        }
        return Destination(address,input.readUnsignedShort())
    }
    private fun permitted(dest:Destination):Boolean=dest.port!=853&&!(dest.port==443&&dohIps.any{InetAddress.getByName(it)==dest.address})&&!dest.address.isLoopbackAddress&&!dest.address.isAnyLocalAddress&&!dest.address.isMulticastAddress
    private fun response(output:DataOutputStream,code:Int,address:InetAddress=InetAddress.getByName("127.0.0.1"),port:Int=0){output.write(byteArrayOf(5,code.toByte(),0,if(address.address.size==4)1 else 4));output.write(address.address);output.writeShort(port);output.flush()}
    private fun handle(client:Socket){
        client.soTimeout=15000;val input=DataInputStream(client.inputStream);val output=DataOutputStream(client.outputStream)
        require(input.readUnsignedByte()==5);val methods=ByteArray(input.readUnsignedByte()).also{input.readFully(it)};require(methods.contains(2.toByte()));output.write(byteArrayOf(5,2));output.flush()
        require(input.readUnsignedByte()==1);val user=ByteArray(input.readUnsignedByte()).also{input.readFully(it)}.toString(Charsets.US_ASCII);val pass=ByteArray(input.readUnsignedByte()).also{input.readFully(it)}.toString(Charsets.US_ASCII)
        require(user=="mortify"&&pass==password);output.write(byteArrayOf(1,0));output.flush()
        require(input.readUnsignedByte()==5);val command=input.readUnsignedByte();require(input.readUnsignedByte()==0);val dest=destination(input)
        when(command){1->tcp(client,input,output,dest);3->udp(client,input,output);else->response(output,7)}
    }
    private fun tcp(client:Socket,input:DataInputStream,output:DataOutputStream,dest:Destination){
        if(dest.port==53){response(output,0);client.soTimeout=60000;while(open){val size=input.readUnsignedShort();require(size in 12..65535);val query=ByteArray(size).also{input.readFully(it)};val answer=dns.resolve(query);output.writeShort(answer.size);output.write(answer);output.flush()};return}
        if(!permitted(dest)){response(output,2);return}
        Socket().use{upstream->
            sockets.add(upstream)
            try{require(vpn.protect(upstream));upstream.connect(InetSocketAddress(dest.address,dest.port),10000);client.soTimeout=0;response(output,0,upstream.localAddress,upstream.localPort)
                val downstream=executor.submit{try{upstream.inputStream.copyTo(client.outputStream);client.shutdownOutput()}catch(_:Exception){client.close()}}
                try{input.copyTo(upstream.outputStream);upstream.shutdownOutput()}catch(_:Exception){upstream.close()};downstream.get()
            }finally{sockets.remove(upstream)}
        }
    }
    private fun udp(client:Socket,input:DataInputStream,output:DataOutputStream){
        val local=DatagramSocket(InetSocketAddress("127.0.0.1",0));val upstream=DatagramSocket(null as SocketAddress?);require(vpn.protect(upstream));upstream.bind(InetSocketAddress(0));sockets.add(local);sockets.add(upstream)
        var target:SocketAddress?=null;val destinations=ConcurrentHashMap.newKeySet<String>()
        response(output,0,local.localAddress,local.localPort);client.soTimeout=0
        fun wrap(dest:InetAddress,port:Int,payload:ByteArray):ByteArray=byteArrayOf(0,0,0,if(dest.address.size==4)1 else 4)+dest.address+byteArrayOf((port shr 8).toByte(),port.toByte())+payload
        executor.execute{try{while(open&&!local.isClosed){val packet=DatagramPacket(ByteArray(65535),65535);local.receive(packet);if(!packet.address.isLoopbackAddress)continue;if(target==null)target=packet.socketAddress;if(packet.socketAddress!=target)continue;val stream=DataInputStream(packet.data.copyOfRange(0,packet.length).inputStream());require(stream.readUnsignedShort()==0&&stream.readUnsignedByte()==0);val dest=destination(stream);val payload=stream.readBytes()
            if(dest.port==53){val answer=try{dns.resolve(payload)}catch(_:Exception){DnsWire.error(payload,2)};val wrapped=wrap(dest.address,53,answer);local.send(DatagramPacket(wrapped,wrapped.size,target));}
            else if(permitted(dest)){destinations.add("${dest.address.hostAddress}:${dest.port}");upstream.send(DatagramPacket(payload,payload.size,dest.address,dest.port))}
        }}catch(_:Exception){local.close();upstream.close();client.close()}}
        executor.execute{try{while(open&&!upstream.isClosed){val packet=DatagramPacket(ByteArray(65535),65535);upstream.receive(packet);if("${packet.address.hostAddress}:${packet.port}" !in destinations)continue;val endpoint=target?:continue;val wrapped=wrap(packet.address,packet.port,packet.data.copyOfRange(0,packet.length));local.send(DatagramPacket(wrapped,wrapped.size,endpoint))}}catch(_:Exception){local.close();upstream.close();client.close()}}
        try{while(input.read()!=-1){}}finally{local.close();upstream.close();sockets.remove(local);sockets.remove(upstream)}
    }
    override fun close(){open=false;server.close();sockets.forEach{try{it.close()}catch(_:Exception){}};executor.shutdownNow()}
}
