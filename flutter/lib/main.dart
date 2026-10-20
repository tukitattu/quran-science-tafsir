import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'db.dart';
import 'knowledge.dart';
import 'notify.dart';
import 'screens/home.dart';
import 'theme.dart';

final App app = App.instance;

/// App state: language, font size, daily reminder prefs.
class App extends ChangeNotifier {
  App._();
  static final App instance = App._();

  final ValueNotifier<List<String>> _snacks = ValueNotifier(const []);

  String lang = 'both'; // en | bn | both
  double fontScale = 1.0;
  bool reminderOn = false;
  int reminderHour = 7, reminderMinute = 30, reminderMin = 7, reminderMax = 7;
  bool loaded = false;
  bool dbReady = false;

  Future<void> load() async {
    final sp = await SharedPreferences.getInstance();
    lang = sp.getString('lang') ?? 'both';
    fontScale = sp.getDouble('fontScale') ?? 1.0;
    reminderOn = sp.getBool('reminderOn') ?? false;
    reminderHour = sp.getInt('reminderHour') ?? 7;
    reminderMinute = sp.getInt('reminderMinute') ?? 30;
    reminderMin = sp.getInt('reminderMin') ?? 7;
    reminderMax = sp.getInt('reminderMax') ?? 7;
    loaded = true;
    notifyListeners();
  }

  Future<void> setLang(String v) async {
    lang = v;
    final sp = await SharedPreferences.getInstance();
    await sp.setString('lang', v);
    notifyListeners();
  }

  Future<void> setFontScale(double v) async {
    fontScale = v;
    final sp = await SharedPreferences.getInstance();
    await sp.setDouble('fontScale', v);
    notifyListeners();
  }

  Future<void> setReminder(bool on) async {
    reminderOn = on;
    final sp = await SharedPreferences.getInstance();
    await sp.setBool('reminderOn', on);
    notifyListeners();
    try {
      if (on) {
        final a = await TafsirDb.i.ayahOfTheDay();
        final ar = ((a['ar'] ?? '') as String).trim();
        final surah = (a['surah'] ?? const {}) as Map<String, Object?>;
        await DailyReminder.i.scheduleDaily(
          reminderHour, reminderMinute, ar,
          surahName: (surah['en'] ?? '') as String,
        );
      } else {
        await DailyReminder.i.cancel();
      }
    } catch (_) {}
  }

  void toast(String msg) {
    final list = List<String>.from(_snacks.value)..add(msg);
    _snacks.value = list;
    notifyListeners();
  }
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await app.load();
  // DB unpack happens lazily on first query; surface it as a splash step.
  try {
    await TafsirDb.i.db;
    app.dbReady = true;
  } catch (e) {
    debugPrint('db init failed: $e');
  }
  await DailyReminder.i.init();
  // knowledge layer (ayah text + book extracts) loads in the background
  Knowledge.i.load();
  runApp(const TafsirApp());
}

class TafsirApp extends StatelessWidget {
  const TafsirApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Al Quran — Scientific Tafsir',
      debugShowCheckedModeBanner: false,
      theme: Paper.theme(),
      home: const HomeShell(),
    );
  }
}
