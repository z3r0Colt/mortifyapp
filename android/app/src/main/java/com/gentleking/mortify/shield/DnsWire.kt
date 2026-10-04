package com.gentleking.mortify.shield

import java.io.ByteArrayOutputStream
import java.net.InetAddress

object DnsWire {
    data class Question(val name:String,val type:Int,val end:Int)
    fun u16(data:ByteArray,offset:Int):Int {require(offset>=0&&offset+2<=data.size);return ((data[offset].toInt() and 255) shl 8) or (data[offset+1].toInt() and 255)}
    fun question(data:ByteArray):Question {
        require(data.size>=12&&u16(data,4)==1&&(data[2].toInt() and 0xF8)==0)
        var pos=12;val labels=mutableListOf<String>()
        while(true){require(pos<data.size);val length=data[pos++].toInt() and 255;if(length==0)break;require(length<=63&&pos+length<=data.size);val label=data.copyOfRange(pos,pos+length).toString(Charsets.US_ASCII);require(label.matches(Regex("[A-Za-z0-9_-]+")));labels.add(label);pos+=length}
        require(labels.isNotEmpty()&&labels.joinToString(".").length<=253&&u16(data,pos+2)==1)
        return Question(labels.joinToString(".").lowercase(),u16(data,pos),pos+4)
    }
    fun name(name:String):ByteArray {val out=ByteArrayOutputStream();for(label in name.split('.')){val bytes=label.toByteArray(Charsets.US_ASCII);require(bytes.size in 1..63);out.write(bytes.size);out.write(bytes)};out.write(0);return out.toByteArray()}
    fun query(name:String,type:Int,id:Int):ByteArray {val out=ByteArrayOutputStream();write16(out,id);write16(out,0x0100);write16(out,1);repeat(3){write16(out,0)};out.write(name(name));write16(out,type);write16(out,1);return out.toByteArray()}
    fun error(query:ByteArray,rcode:Int):ByteArray {val q=question(query);val out=query.copyOf(q.end);out[2]=0x81.toByte();out[3]=(0x80 or rcode).toByte();for(i in 6..11)out[i]=0;return out}
    private fun skipName(data:ByteArray,start:Int):Int {var pos=start;var hops=0;while(true){require(pos<data.size&&++hops<128);val size=data[pos++].toInt() and 255;if(size==0)return pos;if(size and 0xc0==0xc0){require(pos<data.size);return pos+1};require(size<=63&&pos+size<=data.size);pos+=size}}
    fun addresses(data:ByteArray,type:Int):List<ByteArray> {require(data.size>=12);var pos=12;repeat(u16(data,4)){pos=skipName(data,pos)+4;require(pos<=data.size)};val result=mutableListOf<ByteArray>();repeat(u16(data,6)){pos=skipName(data,pos);val kind=u16(data,pos);val size=u16(data,pos+8);pos+=10;require(pos+size<=data.size);if(kind==type&&size==(if(type==1)4 else 16))result.add(data.copyOfRange(pos,pos+size));pos+=size};return result}
    fun safeAnswer(original:ByteArray,target:String,addresses:List<ByteArray>):ByteArray {
        val q=question(original);val out=ByteArrayOutputStream();out.write(original.copyOfRange(0,2));write16(out,0x8180);write16(out,1);write16(out,1+addresses.size);write16(out,0);write16(out,0);out.write(original.copyOfRange(12,q.end))
        out.write(byteArrayOf(0xc0.toByte(),0x0c));write16(out,5);write16(out,1);out.write(byteArrayOf(0,0,0,60));val encoded=name(target);write16(out,encoded.size);out.write(encoded)
        for(address in addresses){out.write(encoded);write16(out,q.type);write16(out,1);out.write(byteArrayOf(0,0,0,60));write16(out,address.size);out.write(address)}
        return out.toByteArray()
    }
    fun write16(out:ByteArrayOutputStream,value:Int){out.write((value shr 8) and 255);out.write(value and 255)}
}
