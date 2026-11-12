import 'dart:ui' show PlatformDispatcher;

import 'package:flutter/material.dart';

import 'db.dart';
import 'l10n.dart';
import 'prefs.dart';
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

  String lang = 'both'; // reading content: en | bn | both | ar
  String uiLang = 'en'; // app chrome: en | bn | ar
  double fontScale = 1.0;
  bool reminderOn = false;
  int reminderHour = 7, reminderMinute = 30, reminderMin = 7, reminderMax = 7;
  bool loaded = false;
  bool dbReady = false;

  Future<void> load() async {
    final sp = await prefsOrNull();
    lang = sp?.getString('lang') ?? 'both';
    uiLang = sp?.getString('uiLang') ?? 'en';
    L.code = uiLang;
    fontScale = sp?.getDouble('fontScale') ?? 1.0;
    reminderOn = sp?.getBool('reminderOn') ?? false;
    reminderHour = sp?.getInt('reminderHour') ?? 7;
    reminderMinute = sp?.getInt('reminderMinute') ?? 30;
    reminderMin = sp?.getInt('reminderMin') ?? 7;
    reminderMax = sp?.getInt('reminderMax') ?? 7;
    loaded = true;
    notifyListeners();
  }

  Future<void> setLang(String v) async {
    lang = v;
    final sp = await prefsOrNull();
    await sp?.setString('lang', v);
    notifyListeners();
  }

  Future<void> setUiLang(String v) async {
    uiLang = v;
    L.code = v;
    final sp = await prefsOrNull();
    await sp?.setString('uiLang', v);
    notifyListeners();
  }

  Future<void> setFontScale(double v) async {
    fontScale = v;
    final sp = await prefsOrNull();
    await sp?.setDouble('fontScale', v);
    notifyListeners();
  }

  Future<void> setReminder(bool on) async {
    reminderOn = on;
    final sp = await prefsOrNull();
    await sp?.setBool('reminderOn', on);
    notifyListeners();
    try {
      if (on) {
        try {
          await Knowledge.i.load();
        } catch (_) {}
        final a = Knowledge.i.ayahOfDay(DateTime.now());
        final ar = ((a['ar'] ?? '') as String).trim();
        var surahName = '';
        final sid = a['surah'] as int?;
        if (sid != null) {
          try {
            final rows = await TafsirDb.i.surahs();
            final row = rows.firstWhere((s) => s['id'] == sid,
                orElse: () => <String, Object?>{});
            surahName = (row['en'] ?? '') as String;
          } catch (_) {}
        }
        await DailyReminder.i.scheduleDaily(
          reminderHour, reminderMinute, ar,
          surahName: surahName,
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

/// Release-safe error surface: never render the raw framework error screen
/// and never leak stack traces to the user.
void _installErrorHandlers() {
  ErrorWidget.builder = (FlutterErrorDetails details) {
    debugPrint('widget build error: ${details.exception}\n${details.stack}');
    return const _ErrorScreen();
  };
  FlutterError.onError = (FlutterErrorDetails details) {
    debugPrint('Flutter error: ${details.exception}\n${details.stack}');
  };
  PlatformDispatcher.instance.onError = (Object error, StackTrace stack) {
    debugPrint('uncaught async error: $error\n$stack');
    return true;
  };
}

class _ErrorScreen extends StatelessWidget {
  const _ErrorScreen();
  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).colorScheme.surface,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded, size: 40),
              const SizedBox(height: 12),
              Text(L.t('something_wrong'), textAlign: TextAlign.center),
              const SizedBox(height: 4),
              Text(L.t('tap_retry'),
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
            ],
          ),
        ),
      ),
    );
  }
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  _installErrorHandlers();
  // Never block the first frame on plugin/database work: render a splash
  // immediately, then open the app once init has settled.
  runApp(const BootGate());
}

/// Startup gate. Shows a real screen from the very first frame, runs every
/// init step with its own try/catch and a timeout, and surfaces failures
/// instead of hanging on a black screen.
class BootGate extends StatefulWidget {
  const BootGate({super.key});

  @override
  State<BootGate> createState() => _BootGateState();
}

class _BootGateState extends State<BootGate> {
  final List<String> _errors = [];
  bool _ready = false;
  bool _dismissed = false;

  @override
  void initState() {
    super.initState();
    _boot();
  }

  void _note(String step, Object e) {
    debugPrint('startup $step failed: $e');
    if (_errors.length < 5) _errors.add('$step: $e');
  }

  Future<void> _boot() async {
    try {
      await app.load().timeout(const Duration(seconds: 10));
    } catch (e) {
      _note('preferences', e);
    }
    try {
      await TafsirDb.i.db.timeout(const Duration(seconds: 45));
      app.dbReady = true;
    } catch (e) {
      _note('database', e);
    }
    try {
      await DailyReminder.i.init().timeout(const Duration(seconds: 10));
    } catch (e) {
      _note('notifications', e);
    }
    Knowledge.i.load().catchError((Object e) {
      debugPrint('knowledge load failed: $e');
    });
    if (!mounted) return;
    setState(() => _ready = true);
  }

  void _retry() {
    setState(() {
      _errors.clear();
      _ready = false;
      _dismissed = false;
    });
    _boot();
  }

  @override
  Widget build(BuildContext context) {
    if (_ready && (_errors.isEmpty || _dismissed)) {
      return const TafsirApp();
    }
    return MaterialApp(
      title: L.t('app_title'),
      debugShowCheckedModeBanner: false,
      theme: Paper.theme(),
      darkTheme: Paper.darkTheme(),
      themeMode: ThemeMode.system,
      home: Scaffold(
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(28),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 520),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Image.asset('assets/icon.png', width: 84, height: 84),
                    const SizedBox(height: 18),
                    Text(
                      L.t('app_title'),
                      textAlign: TextAlign.center,
                      style:
                          TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 22),
                    if (!_ready) ...[
                      const CircularProgressIndicator(),
                      const SizedBox(height: 14),
                      Text(L.t('preparing')),
                    ] else ...[
                      const Icon(Icons.warning_amber_rounded, size: 34),
                      const SizedBox(height: 10),
                      Text(
                        L.t('boot_warning'),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          _errors.join('\n\n'),
                          style: const TextStyle(fontSize: 12, height: 1.4),
                        ),
                      ),
                      const SizedBox(height: 18),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          FilledButton(
                            onPressed: _retry,
                            child: Text(L.t('retry')),
                          ),
                          const SizedBox(width: 12),
                          TextButton(
                            onPressed: () =>
                                setState(() => _dismissed = true),
                            child: Text(L.t('continue_')),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class TafsirApp extends StatelessWidget {
  const TafsirApp({super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: app,
      builder: (context, _) => MaterialApp(
        title: L.t('app_title'),
        debugShowCheckedModeBanner: false,
        theme: Paper.theme(),
        darkTheme: Paper.darkTheme(),
        themeMode: ThemeMode.system,
        builder: (context, child) => Directionality(
          textDirection: L.rtl ? TextDirection.rtl : TextDirection.ltr,
          child: child ?? const SizedBox.shrink(),
        ),
        home: const HomeShell(),
      ),
    );
  }
}
