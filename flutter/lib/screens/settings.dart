import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../db.dart';
import '../main.dart';
import '../notify.dart';
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
    final sp = await SharedPreferences.getInstance();
    setState(() {
      _visited = (sp.getStringList('visited') ?? []).length;
    });
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 30),
      children: [
        Text('Settings',
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.w800, letterSpacing: -.3)),
        Text('Al Quran — Scientific Tafsir · v2.1.0 (Flutter, embedded SQLite)',
            style: const TextStyle(color: AppColors.muted, fontSize: 12)),
        const SizedBox(height: 20),

        // ——— language
        const _SectionLabel('Reading language'),
        SegmentedButton<String>(
          segments: const [
            ButtonSegment(value: 'both', label: Text('EN + বাংলা')),
            ButtonSegment(value: 'en', label: Text('English')),
            ButtonSegment(value: 'bn', label: Text('বাংলা')),
            ButtonSegment(value: 'ar', label: Text('عربي')),
          ],
          selected: {app.lang},
          showSelectedIcon: false,
          onSelectionChanged: (s) => app.setLang(s.first),
        ),
        const SizedBox(height: 20),

        // ——— text size
        const _SectionLabel('Text size'),
        AnimatedBuilder(
          animation: app,
          builder: (context, _) => Slider(
            value: app.fontScale,
            min: .8, max: 1.6, divisions: 8,
            label: '${(app.fontScale * 100).round()}%',
            onChanged: app.setFontScale,
          ),
        ),

        // ——— daily reminder
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const Icon(Icons.notifications_outlined, color: AppColors.gold),
                const SizedBox(width: 10),
                const Text('Daily ayah reminder',
                    style: TextStyle(fontWeight: FontWeight.w700)),
                const Spacer(),
                Switch(value: app.reminderOn, onChanged: app.setReminder),
              ]),
              const Text('A notification with a Quranic ayah each day at your chosen time.',
                  style: TextStyle(color: AppColors.muted, fontSize: 12.5)),
              const SizedBox(height: 10),
              AnimatedBuilder(
                animation: app,
                builder: (c, _) => Row(children: [
                  const Text('At', style: TextStyle(color: AppColors.muted, fontSize: 13)),
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
                      final a = await TafsirDb.i.ayahOfTheDay();
                      final ar = ((a['ar'] ?? '') as String).trim();
                      final surah = (a['surah'] ?? const {}) as Map<String, Object?>;
                      await DailyReminder.i.scheduleDaily(
                        app.reminderHour, app.reminderMinute, ar,
                        surahName: (surah['en'] ?? '') as String,
                      );
                      app.toast('Reminder set for ${app.reminderHour}:${app.reminderMinute.toString().padLeft(2, '0')}');
                      setState(() => app.reminderOn = true);
                    },
                    child: const Text('Save time'),
                  ),
                ]),
              ),
            ]),
          ),
        ),

        // ——— stats + about
        const _SectionLabel('Your reading'),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              const Icon(Icons.auto_stories_outlined, color: AppColors.gold),
              const SizedBox(width: 12),
              Text('$_visited of 114 surahs opened',
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              const Spacer(),
              Text('${(_visited / 114 * 100).round()}%',
                  style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w800)),
            ]),
          ),
        ),
        const _SectionLabel('About'),
        const Text.rich(
          TextSpan(children: [
            TextSpan(
                text:
                    'Al Quran — Scientific Tafsir of the Quran by Zakaria Kamal. All content is embedded offline: 114 surahs, 7,796 paragraphs, word studies with roots and ayah references, 662 figures, the business knowledge set and the Uthmani Arabic text. The SQLite research database is bundled inside the app. Bengali is machine translation. Freely shareable per the author\'s notice.\n'),
            TextSpan(
                text: 'Data: backfilled Arabic Uthmani text & multiple alternative translations (Pickthall, Yusuf Ali, Sahih Intl).',
                style: TextStyle(color: AppColors.muted, fontSize: 12)),
          ]),
          style: TextStyle(fontSize: 13.5, height: 1.65),
        ),
      ],
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
