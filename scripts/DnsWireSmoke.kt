import com.gentleking.mortify.shield.DnsWire
import java.net.InetAddress

fun main() {
    val query=DnsWire.query("www.google.com",1,123)
    check(DnsWire.question(query).name=="www.google.com")
    check(DnsWire.u16(DnsWire.error(query,3),2) and 15==3)
    val answer=DnsWire.safeAnswer(query,"forcesafesearch.google.com",listOf(InetAddress.getByName("216.239.38.120").address))
    check(DnsWire.addresses(answer,1).single().contentEquals(byteArrayOf(216.toByte(),239.toByte(),38,120)))
    val ipv6=DnsWire.query("www.youtube.com",28,17)
    val bytes=InetAddress.getByName("2001:db8::1").address
    check(DnsWire.addresses(DnsWire.safeAnswer(ipv6,"restrict.youtube.com",listOf(bytes)),28).single().contentEquals(bytes))
    for(size in 0 until query.size)check(runCatching{DnsWire.question(query.copyOf(size))}.isFailure)
    val compressed=query.clone();compressed[12]=192.toByte()
    check(runCatching{DnsWire.question(compressed)}.isFailure)
    println("DNS wire checks passed: A/AAAA SafeSearch replies, NXDOMAIN, truncated and compressed question rejection.")
}
