import SwiftUI
import WidgetKit
struct FleeEntry:TimelineEntry {let date:Date}
struct FleeProvider:TimelineProvider {
    func placeholder(in context:Context)->FleeEntry {FleeEntry(date:Date())}
    func getSnapshot(in context:Context,completion:@escaping(FleeEntry)->Void){completion(FleeEntry(date:Date()))}
    func getTimeline(in context:Context,completion:@escaping(Timeline<FleeEntry>)->Void){completion(Timeline(entries:[FleeEntry(date:Date())],policy:.never))}
}
struct FleeWidgetView:View {
    @Environment(\.colorScheme) var scheme
    var background:Color {scheme == .dark ? Color(red:22/255,green:19/255,blue:15/255):Color(red:245/255,green:240/255,blue:230/255)}
    var content:some View {ZStack{background;Text("Flee").font(.system(size:32,design:.serif)).foregroundColor(Color(red:245/255,green:240/255,blue:230/255)).frame(width:110,height:110).background(Color(red:122/255,green:46/255,blue:42/255)).clipShape(Circle())}.widgetURL(URL(string:"mortify://flee")).accessibilityLabel("Open the Mortify flee sequence")}
    var body:some View {if #available(iOSApplicationExtension 17.0, *){content.containerBackground(background,for:.widget)}else{content}}
}
@main struct MortifyFleeWidget:Widget {
    var body:some WidgetConfiguration {StaticConfiguration(kind:"MortifyFlee",provider:FleeProvider()){_ in FleeWidgetView()}.configurationDisplayName("Flee").description("Open the flee sequence.").supportedFamilies([.systemSmall])}
}
