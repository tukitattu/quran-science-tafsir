import 'package:flutter/material.dart';

import '../db.dart';
import '../knowledge.dart';
import '../l10n.dart';
import '../main.dart';
import '../notify.dart';
import '../prefs.dart';
import 'read.dart'; // AppColors

class SettingsTab extends StatefulWidget {
  const SettingsTab({super.key});
  @override
  State<SettingsTab> createState() => _SettingsTabState();
}

class _SettingsTabState extends State<SettingsTab> {
  int _visited = 0;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    final sp = await prefsOrNull();
    if (!mounted) return;
    setState(() {
      _visited = (sp?.getStringList('visited') ?? []).length;
    });
  }

  Future<String> _todaySurahName() async {
    final a = Knowledge.i.ayahOfDay(DateTime.now());
    final sid = a['surah'] as int?;
    if (sid == null) return '';
    try {
      final rows = await TafsirDb.i.surahs();
      final row = rows.firstWhere((s) => s['id'] == sid,
          orElse: () => <String, Object?>{});
      return (row['en'] ?? '') as String;
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: app,
      builder: (context, _) => ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 30),
        children: [
          Text(L.t('settings'),
              style: Theme.of(context)
                  .textTheme
                  .headlineSmall
                  ?.copyWith(fontWeight: FontWeight.w800, letterSpacing: -.3)),
          Text(L.t('version_line'),
              style: const TextStyle(color: AppColors.muted, fontSize: 12)),
          const SizedBox(height: 20),

          // ——— interface language
          _SectionLabel(L.t('ui_language')),
          SegmentedButton<String>(
            segments: [
              ButtonSegment(value: 'en', label: Text(L.t('english'))),
              ButtonSegment(value: 'bn', label: Text(L.t('bengali'))),
              ButtonSegment(value: 'ar', label: Text(L.t('arabic'))),
            ],
            selected: {app.uiLang},
            showSelectedIcon: false,
            onSelectionChanged: (s) => app.setUiLang(s.first),
          ),
          const SizedBox(height: 20),

          // ——— reading language
          _SectionLabel(L.t('reading_language')),
          SegmentedButton<String>(
            segments: [
              ButtonSegment(value: 'both', label: Text(L.t('en_plus_bn'))),
              ButtonSegment(value: 'en', label: Text(L.t('english'))),
              ButtonSegment(value: 'bn', label: Text(L.t('bengali'))),
              ButtonSegment(value: 'ar', label: Text(L.t('arabic'))),
            ],
            selected: {app.lang},
            showSelectedIcon: false,
            onSelectionChanged: (s) => app.setLang(s.first),
          ),
          const SizedBox(height: 20),

          // ——— text size
          _SectionLabel(L.t('text_size')),
          Slider(
            value: app.fontScale,
            min: .8, max: 1.6, divisions: 8,
            label: '${(app.fontScale * 100).round()}%',
            onChanged: app.setFontScale,
          ),

          // ——— daily reminder
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  const Icon(Icons.notifications_outlined, color: AppColors.gold),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(L.t('daily_ayah_reminder'),
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                  ),
                  Switch(value: app.reminderOn, onChanged: app.setReminder),
                ]),
                Text(L.t('reminder_desc'),
                    style: const TextStyle(color: AppColors.muted, fontSize: 12.5)),
                const SizedBox(height: 10),
                Row(children: [
                  Text(L.t('at'),
                      style: const TextStyle(color: AppColors.muted, fontSize: 13)),
                  const SizedBox(width: 10),
                  DropdownButton<int>(
                    value: app.reminderHour,
                    items: [for (var h = 0; h < 24; h++) DropdownMenuItem(value: h, child: Text('$h:00'))],
                    onChanged: (v) {
                      setState(() => app.reminderHour = v ?? 7);
                    },
                  ),
                  DropdownButton<int>(
                    value: app.reminderMinute,
                    items: [
                      for (final m in const [0, 15, 30, 45])
                        DropdownMenuItem(value: m, child: Text('::$m'))
                    ],
                    onChanged: (v) {
                      setState(() => app.reminderMinute = v ?? 0);
                    },
                  ),
                  const Spacer(),
                  FilledButton.tonal(
                    onPressed: () async {
                      try {
                        await Knowledge.i.load();
                      } catch (_) {}
                      final a = Knowledge.i.ayahOfDay(DateTime.now());
                      final ar = ((a['ar'] ?? '') as String).trim();
                      final surahName = await _todaySurahName();
                      await DailyReminder.i.scheduleDaily(
                        app.reminderHour, app.reminderMinute, ar,
                        surahName: surahName,
                      );
                      final sp = await prefsOrNull();
                      await sp?.setInt('reminderHour', app.reminderHour);
                      await sp?.setInt('reminderMinute', app.reminderMinute);
                      await sp?.setBool('reminderOn', true);
                      app.toast(L.t('reminder_set', {
                        'h': '${app.reminderHour}',
                        'm': app.reminderMinute.toString().padLeft(2, '0'),
                      }));
                      setState(() => app.reminderOn = true);
                    },
                    child: Text(L.t('save_time')),
                  ),
                ]),
              ]),
            ),
          ),

          // ——— stats + about
          _SectionLabel(L.t('your_reading')),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(children: [
                const Icon(Icons.auto_stories_outlined, color: AppColors.gold),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(L.t('surahs_opened', {'v': '$_visited'}),
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                ),
                Text('${(_visited / 114 * 100).round()}%',
                    style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w800)),
              ]),
            ),
          ),
          _SectionLabel(L.t('about')),
          Text.rich(
            TextSpan(children: [
              TextSpan(text: L.t('about_text')),
              TextSpan(
                  text: L.t('about_data'),
                  style: const TextStyle(color: AppColors.muted, fontSize: 12)),
            ]),
            style: const TextStyle(fontSize: 13.5, height: 1.65),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 6, bottom: 8),
    child: Text(text.toUpperCase(),
        style: const TextStyle(
            color: AppColors.gold, fontSize: 11, letterSpacing: .12, fontWeight: FontWeight.w800)),
  );
}
