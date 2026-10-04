package com.gentleking.mortify.shield
import org.junit.Assert.*
import org.junit.Test
class DnsWireTest {
    @Test fun questionRoundTrip(){val query=DnsWire.query("www.google.com",1,42);val question=DnsWire.question(query);assertEquals("www.google.com",question.name);assertEquals(1,question.type);assertEquals(42,DnsWire.u16(query,0))}
    @Test fun blockedResponse(){val response=DnsWire.error(DnsWire.query("blocked.example",1,7),3);assertEquals(3,response[3].toInt() and 15);assertEquals(0,DnsWire.u16(response,6))}
    @Test fun safeAddressResponse(){val response=DnsWire.safeAnswer(DnsWire.query("www.google.com",1,5),"forcesafesearch.google.com",listOf(byteArrayOf(1,2,3,4)));assertEquals(2,DnsWire.u16(response,6));assertArrayEquals(byteArrayOf(1,2,3,4),DnsWire.addresses(response,1).single())}
    @Test(expected=IllegalArgumentException::class) fun rejectsTruncation(){DnsWire.question(byteArrayOf(1,2))}
    @Test(expected=IllegalArgumentException::class) fun rejectsCompressedQuestion(){val query=DnsWire.query("valid.example",1,1);query[12]=0xc0.toByte();DnsWire.question(query)}
}
