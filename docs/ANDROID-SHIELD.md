# Android MortifyShield

The source uses VpnService with full IPv4/IPv6 routes, a pinned MIT HevSocks5Tunnel packet engine, and an authenticated local SOCKS forwarder. Forwarding sockets are protected from reentering the VPN. DNS UDP/TCP 53 is intercepted; upstream questions go to CleanBrowsing's family filter using TLS with hostname verification. No domain query logs, Accessibility API, or Device Admin are used.

1. `node scripts/vendor-tunnel.mjs` restores the pinned engine/submodules. Keep all upstream license files. Application.mk sets the engine's JNI class to com/gentleking/mortify/shield/TunnelEngine.
2. Install SDK 36 and NDK 28.2.13676358. Build with `gradlew :app:assembleDebug :app:testDebugUnitTest -PmortifyShield`. Without the flag, the plugin reports unavailable and retains the setup guide.
3. Start protection, acknowledge the disclosure, grant Android VPN consent and verify its persistent notification. Test ordinary TCP/UDP browsing, IPv6 and DNS before lockdown.
4. In Android Settings > Network & internet (or Connections) > VPN > Mortify settings, turn on Always-on VPN, then Block connections without VPN. After validating the full tunnel build, this blocks traffic while the VPN is down. Review these switches before intentionally stopping protection; otherwise internet may remain blocked. Android permits one VPN at a time.
5. Verify restricted DNS destinations for Google/Bing/DuckDuckGo/YouTube; test A/AAAA and HTTPS/SVCB records, Wi-Fi/mobile transitions, captive portals, reboot, app termination and revocation. DNS wire unit tests cover malformed/truncated questions and response construction.
6. Bundled adult domains and subdomains are blocked; the maintained family DNS filter adds broader coverage. Common DoH names/resolver IPs and client port 853 are blocked. Disable conflicting strict Private DNS while this VPN runs. Custom encrypted resolvers, hardcoded IPs, proxies and another VPN can evade domain filtering; never claim an absolute guarantee.
7. Test stop/status/stopped event. On reopening, protection status is checked and an off event is queued only when chosen sharing permits it. A killed app cannot promise immediate cloud status updates.

## Google Play VPN disclosure draft

Mortify uses Android's VPN permission to apply the protection you choose. The VPN runs locally on this device and forwards internet traffic while filtering domain lookups and enforcing supported SafeSearch settings. DNS questions are sent over an encrypted connection to CleanBrowsing's family filter. Mortify does not send your internet traffic through a Mortify server and does not store browsing history. If you choose to share protection status, only an on/off event is sent to your accepted brethren. You may stop protection in the app or Android settings. Android allows one active VPN at a time. With “Block connections without VPN” enabled, internet access is blocked when protection is not running.

Complete Play Console's current VPN/foreground-service declarations and requested video. Keep disclosure immediately before consent. Native compilation and physical-device networking checks are release requirements.

Sources: [Android VPN](https://developer.android.com/develop/connectivity/vpn), [packet engine](https://github.com/heiher/hev-socks5-tunnel), [Google SafeSearch](https://support.google.com/websearch/answer/186669), [Bing](https://support.microsoft.com/en-us/bing/blocking-explicit-content-with-safesearch), [DuckDuckGo](https://duckduckgo.com/duckduckgo-help-pages/features/safe-search).
