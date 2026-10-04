package com.gentleking.mortify
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
class FleeWidget:AppWidgetProvider(){
    override fun onUpdate(context:Context,manager:AppWidgetManager,ids:IntArray){
        for(id in ids){val intent=Intent(Intent.ACTION_VIEW,Uri.parse("mortify://flee"),context,MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP);val pending=PendingIntent.getActivity(context,id,intent,PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT);val view=RemoteViews(context.packageName,R.layout.flee_widget);view.setOnClickPendingIntent(R.id.widget_flee,pending);manager.updateAppWidget(id,view)}
    }
}
