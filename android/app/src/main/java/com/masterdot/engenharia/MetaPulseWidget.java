package com.masterdot.engenharia;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import org.json.JSONObject;

public class MetaPulseWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_metapulse);

        // Read summary saved by the app via @capacitor/preferences
        try {
            SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            String json = prefs.getString("widget_data", null);
            if (json != null) {
                JSONObject data = new JSONObject(json);
                views.setTextViewText(R.id.widget_in_progress, String.valueOf(data.optInt("inProgress", 0)));
                views.setTextViewText(R.id.widget_late,        String.valueOf(data.optInt("late",       0)));
                views.setTextViewText(R.id.widget_done,        String.valueOf(data.optInt("done",        0)));
                String updated = data.optString("updated", "");
                if (!updated.isEmpty()) {
                    views.setTextViewText(R.id.widget_updated, "Atualizado " + updated);
                }
            }
        } catch (Exception ignored) {}

        // Tap opens the app
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
