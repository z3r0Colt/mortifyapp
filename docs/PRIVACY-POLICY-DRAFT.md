# Mortify privacy policy

**Draft: replace bracketed fields and confirm provider retention before publishing.**

Effective date: [DATE]

Mortify is operated by [LEGAL OPERATOR NAME]. Contact us at [PRIVACY CONTACT EMAIL].

## Your private entries

Journal, confession, and reflection text is encrypted on your device before it is saved, using AES-GCM with a key derived from your PIN. Only this encrypted form is stored in your account on our Supabase project, so it can return to you on a new device when you enter the same PIN. Your PIN and the key never leave your device, and we cannot read or recover this text. It is never shared with brethren or included in push notifications.

On native devices, optional biometric unlocking protects an unlocking key in AndroidKeyStore or Apple's device-only Keychain. Mortify does not receive your fingerprint or face data. Turning off the PIN lock allows anyone who can open the app on that device to read your entries. Exporting your data creates a readable file; you are responsible for where you keep or send it. Lost PINs cannot be restored by our server; configured biometric access may still allow you to unlock.

Your account stores your preferences (battles, reading times, trust answer, protection status), reading position, examination tags, and records of when you used Flee and how it ended. These are visible to you and to the operators of the service, but not to brethren unless you choose to share them. Your device keeps a copy for opening without a connection, plus any entries and messages waiting to upload.

## Optional brethren account

An account is required to use Mortify. Supabase processes your account email and authentication records. If you join the brethren features, it also stores your profile. Your profile includes the name, sex, church, and optional phone number you supply. Only accepted peers of the same sex can view the shared profile; a code lookup reveals a limited profile preview so you can confirm a proposed link. A circle accepts up to eight peers.

You choose whether accepted peers can see battles, temptation/standing-firm events, falls, and protection status. Falls are private by default. Turning off battle sharing hides battle choices and removes battle identifiers from previously shared events and messages. Messages you explicitly send go to their intended recipients and our Supabase project. A message is separate from your private journal. Removing a link or reporting a message blocks further access through that link.

Reports are stored privately for the operator to review; they are not published to other users. No public feed or stranger search exists. We use account information, shared events, messages, and reports to provide the functions you request and maintain a safe closed circle. [CONFIRM LEGAL BASIS, CONTACT, AND REPORT RETENTION FOR YOUR JURISDICTION.]

## Notifications and reminders

With your permission, native reminders run on your phone. Web reminders use our server. Message notifications use Web Push providers or Firebase Cloud Messaging and Apple's push service. We store a subscription/token and device identifier to route notifications and remove expired registrations. Standard message notifications may include the sender's name; discreet notifications say only that there is a new message. They do not contain private entry text. Providers process delivery information under their own policies. You can disable notification permission in system settings or remove a device registration by signing out.

## Optional phone protection

On Android, Mortify uses a local VPN to forward internet traffic on the device, filter DNS, apply SafeSearch DNS mappings, and block a bundled set of domains and common encrypted resolvers. Mortify does not operate a remote traffic proxy, read the contents of HTTPS pages, or keep a browsing-history log. DNS questions are sent over TLS to CleanBrowsing's family resolver, which can receive domain names and your network IP address. Review [CleanBrowsing's privacy policy](https://cleanbrowsing.org/privacy/). Other apps' internet connections still go to their own destinations. Filtering is limited and cannot block every bypass or harmful page.

On iPhone, Apple Family Controls and Managed Settings apply Apple's adult web filter after your authorization. Mortify checks authorization and its filter setting; it does not receive a list of websites you visited. On either platform, only protection on/off events are sent to accepted peers when you choose to share that status.

## Service providers and retention

Our PWA host, GitHub Pages, delivers app files and may process normal hosting/security request logs, including IP addresses. Supabase hosts your account, preferences, activity records, encrypted entries, brethren events, messages, and notification registrations. Firebase and push providers deliver notifications. Mortify contains no analytics, advertising, or tracking scripts and does not sell data.

Account data stays in the project until deletion; notifications and shared-event timelines do not make old server records automatically disappear. [INSERT VERIFIED VERCEL/SUPABASE LOG AND BACKUP RETENTION, HOSTING REGIONS, REPORT RETENTION, INTERNATIONAL TRANSFER INFORMATION, AND ANY REQUIRED RIGHTS FOR YOUR USERS.] Provider security logs/backups may persist for their configured retention period. Recipients can remember or separately copy a message even after your account is deleted.

## Your choices and deletion

Use Settings > Privacy to export your data or to sign out and clear this device. Clearing a device stops Mortify's filter and removes its offline copy and keys; your account is unchanged. Use Settings > Delete my account while connected to permanently remove the account and everything in it: preferences, activity records, encrypted entries, profile, links, messages, events, registrations, and settings.

You can also request account deletion without installing the app at [PUBLIC ACCOUNT-DELETION URL], or contact [PRIVACY CONTACT EMAIL]. [CONFIRM AND IMPLEMENT THIS PUBLIC REQUEST PATH BEFORE PUBLICATION.] We may verify account ownership before carrying out a request. [STATE ANY LEGALLY REQUIRED RETENTION OR CONFIRM NONE.]

This version is intended for adult Christians. [CONFIRM MINIMUM AGE AND ACTUAL ENFORCEMENT BEFORE PUBLICATION.] Contact us with privacy questions or requests at [PRIVACY CONTACT EMAIL]. We will update this policy when our practices change.
