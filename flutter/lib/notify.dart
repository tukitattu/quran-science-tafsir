import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

/// Local daily-ayah reminder. No backend, no FCM — entirely on-device
/// (Android 10+; runtime POST_NOTIFICATIONS permission is Android 13+).
class DailyReminder {
  DailyReminder._();
  static final DailyReminder i = DailyReminder._();

  final _plugin = FlutterLocalNotificationsPlugin();
  bool _ready = false;

  Future<void> init() async {
    if (_ready) return;
    tz.initializeTimeZones();
    const settings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
    );
    await _plugin.initialize(settings, onDidReceiveNotificationResponse: null);
    _ready = true;
  }

  String? scheduledBody; // set before schedule() by the ayah picker

  Future<void> scheduleDaily(int hour, int minute, String body,
      {String surahName = ''}) async {
    await init();
    final ref = surahName.isEmpty ? '' : ' — $surahName';
    final title = "Today's Ayah$ref";
    final shown = body.isEmpty ? 'Open the tafsir to read of it.' : body;
    await _plugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();
    await _plugin.zonedSchedule(
      1001,
      title,
      shown,
      _next(tz.now(), hour, minute),
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'daily-ayah',
          'Daily Ayah',
          channelDescription: 'A Quranic ayah recommendation each day',
          importance: Importance.high,
          priority: Priority.defaultPriority,
          playSound: false,
        ),
      ),
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.time,
      payload: 'daily',
    );
  }

  Future<void> cancel() async {
    await init();
    await _plugin.cancel(1001);
  }

  static tz.TZDateTime _next(tz.TZDateTime now, int h, int m) {
    var t = tz.TZDateTime(tz.local, now.year, now.month, now.day, h, m);
    if (!t.isAfter(now)) t = t.add(const Duration(days: 1));
    return t;
  }
}
