import 'package:flutter/material.dart';

import '../db.dart';
import '../knowledge.dart';
import '../l10n.dart';
import '../main.dart';
import '../player.dart';
import '../prefs.dart';
import 'arabic_surah.dart';
import 'reader.dart';

class ReadTab extends StatefulWidget {
  const ReadTab({super.key});
  @override
  State<ReadTab> createState() => _ReadTabState();
}

class _ReadTabState extends State<ReadTab> {
  List<Map<String, Object?>> _surahs = [];
  Map<String, Object?>? _today;
  int _visited = 0;
  String _cat = 'all';
  String _q = '';
  int? _continueTo;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    var surahs = <Map<String, Object?>>[];
    Map<String, Object?>? today;
    String? error;
    var visited = 0;
    int? cont;
    try {
      await Knowledge.i.load();
      surahs = await TafsirDb.i.surahs();
      final pick = Knowledge.i.ayahOfDay(DateTime.now());
      if (pick.isNotEmpty) {
        final sid = pick['surah'] as int;
        today = {
          'ar': pick['ar'],
          'en': pick['en'],
          'bn': pick['bn'],
          'ayah': pick['ayah'],
          'surah': surahs.firstWhere(
            (s) => (s['id'] as int?) == sid,
            orElse: () => <String, Object?>{},
          ),
        };
      } else {
        today = await TafsirDb.i.ayahOfTheDay();
      }
    } catch (e) {
      debugPrint('surah load failed: $e');
      error = '$e';
    }
    try {
      final sp = await prefsOrNull();
      visited = (sp?.getStringList('visited') ?? []).length;
      cont = sp?.getInt('lastSurah');
    } catch (e) {
      debugPrint('prefs load failed: $e');
    }
    if (!mounted) return;
    setState(() {
      _surahs = surahs;
      _today = today;
      _visited = visited;
      _continueTo = cont;
      _error = error;
      _loading = false;
    });
  }

  List<Map<String, Object?>> get _filtered {
    return _surahs.where((s) {
      if (_cat == 'makki' && (s['type'] as String? ?? '') != 'makki') return false;
      if (_cat == 'madani' && (s['type'] as String? ?? '') != 'madani') return false;
      if (_q.isEmpty) return true;
      final hay =
          '${s['en']} ${s['bn']} ${s['ar']}'.toLowerCase().trim();
      return hay.contains(_q.toLowerCase());
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.storage_rounded, size: 40),
              const SizedBox(height: 12),
              Text(L.t('library_error'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text(_error!, textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 12)),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () {
                  setState(() {
                    _loading = true;
                    _error = null;
                  });
                  _load();
                },
                child: Text(L.t('retry')),
              ),
            ],
          ),
        ),
      );
    }
    final t = _today ?? {};
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      children: [
        Text(L.t('scientific_tafsir'),
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w700, letterSpacing: -0.5)),
        Text(L.t('author_line'),
            style: TextStyle(color: AppColors.muted(context))),
        const SizedBox(height: 18),
        AnimatedBuilder(
          animation: app,
          builder: (_, __) => _TodayCard(today: t),
        ),
        if (_continueTo != null) ...[
          const SizedBox(height: 12),
          FilledButton.icon(
            icon: const Icon(Icons.play_arrow_rounded),
            label: Text(L.t('continue_surah', {'n': '$_continueTo'})),
            onPressed: () => _open(_continueTo!),
          ),
        ],
        const SizedBox(height: 18),
        Row(children: [
          Expanded(
            child: Text(L.t('all_chapters'),
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(fontWeight: FontWeight.w700)),
          ),
          const SizedBox(width: 8),
          Text(
              L.t('read_progress', {
                'v': '$_visited',
                'p': '${(_visited / 114 * 100).round()}',
              }),
              style: TextStyle(color: AppColors.muted(context), fontSize: 12)),
        ]),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: _visited / 114,
            minHeight: 8,
            backgroundColor: AppColors.ink(context).withValues(alpha: .07),
            valueColor: const AlwaysStoppedAnimation(AppColors.gold),
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          decoration: InputDecoration(
              hintText: L.t('find_surah'), prefixIcon: const Icon(Icons.search)),
          onChanged: (v) => setState(() => _q = v.trim()),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final e in {
              'all': L.t('all'),
              'makki': L.t('makki'),
              'madani': L.t('madani'),
            }.entries)
              ChoiceChip(
                label: Text(e.value),
                selected: _cat == e.key,
                selectedColor: AppColors.goldBright.withValues(alpha: .45),
                onSelected: (_) => setState(() => _cat = e.key),
              ),
          ],
        ),
        const SizedBox(height: 12),
        ..._filtered.map(_surahTile),
      ],
    );
  }

  Widget _surahTile(Map<String, Object?> s) {
    final id = s['id'] as int;
    final type = (s['type'] as String?) ?? 'makki';
    final typeColor = type == 'madani' ? AppColors.blue : AppColors.goldBright;
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: () => _open(id),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          child: Row(children: [
            SizedBox(
              width: 40,
              child: Text('$id',
                  style: const TextStyle(
                      color: AppColors.gold,
                      fontWeight: FontWeight.w800,
                      fontSize: 16),
                  textAlign: TextAlign.center),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Container(width: 3, height: 15, color: typeColor),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text('${s['en']}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    ]),
                    Text('${s['bn']}',
                        style: TextStyle(
                            color: AppColors.muted(context), fontSize: 12)),
                  ]),
            ),
            const SizedBox(width: 8),
            Text('${s['ar']}',
                style: const TextStyle(
                    color: AppColors.gold,
                    fontSize: 18,
                    fontWeight: FontWeight.w700)),
            const SizedBox(width: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
              decoration: BoxDecoration(
                color: typeColor.withValues(alpha: .13),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(type == 'madani' ? L.t('madani') : L.t('makki'),
                  style: TextStyle(color: typeColor, fontSize: 10)),
            ),
            const SizedBox(width: 2),
            Tooltip(
              message: L.t('play_tilawah'),
              child: InkWell(
                borderRadius: BorderRadius.circular(999),
                onTap: () => TilawahPlayer.instance.toggleForSurah(id),
                child: Padding(
                  padding: const EdgeInsets.all(6),
                  child: TilawahIcon(surah: id, size: 20),
                ),
              ),
            ),
            Tooltip(
              message: L.t('arabic_text'),
              child: InkWell(
                borderRadius: BorderRadius.circular(999),
                onTap: () => _openArabic(id, '${s['en']}'),
                child: const Padding(
                  padding: EdgeInsets.all(8),
                  child: Text('ع',
                      style: TextStyle(
                          color: AppColors.gold,
                          fontSize: 16,
                          fontWeight: FontWeight.w700)),
                ),
              ),
            ),
          ]),
        ),
      ),
    );
  }

  void _open(int id) {
    Navigator.of(context)
        .push(MaterialPageRoute(builder: (_) => ReaderScreen(surahId: id)));
  }

  void _openArabic(int id, String title) {
    Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => ArabicSurahScreen(surahId: id, title: title)));
  }
}

class AppColors {
  static const gold = Color(0xFFA67C1B);
  static const goldDeep = Color(0xFF5F4A14);
  static const goldBright = Color(0xFFD9B44A);
  static const blue = Color(0xFF23638C);

  static Color ink(BuildContext context) =>
      Theme.of(context).colorScheme.onSurface;
  static Color muted(BuildContext context) =>
      Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.55);
}

class _TodayCard extends StatelessWidget {
  final Map<String, Object?> today;
  const _TodayCard({required this.today});

  @override
  Widget build(BuildContext context) {
    final ar = (today['ar'] ?? '') as String;
    final s = (today['surah'] ?? <String, Object?>{}) as Map<String, Object?>;
    final ref = '${today['surah'] != null ? '${s['en']} ' : ''}${today['ayah'] ?? ''}';
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(L.t('today_ayah'),
              style: TextStyle(
                  color: AppColors.gold,
                  fontWeight: FontWeight.w800,
                  fontSize: 13)),
          const SizedBox(height: 12),
          if (ar.isNotEmpty)
            Text(ar,
                textDirection: TextDirection.rtl,
                textAlign: TextAlign.right,
                style: const TextStyle(
                    fontSize: 22, height: 2, color: AppColors.goldDeep)),
          const SizedBox(height: 8),
          if (app.lang != 'en' && (today['bn'] ?? '').toString().isNotEmpty)
            Text((today['bn'] ?? '').toString(),
                style: TextStyle(
                    color: AppColors.muted(context), height: 1.6)),
          if ((app.lang == 'en' || app.lang == 'both') &&
              (today['en'] ?? '').toString().isNotEmpty) ...[
            const SizedBox(height: 4),
            Text((today['en'] ?? '').toString(),
                style: TextStyle(
                    color: AppColors.muted(context), height: 1.6)),
          ],
          if (app.lang != 'bn') ...[
            const SizedBox(height: 4),
            Text(ref, style: TextStyle(color: AppColors.muted(context), fontSize: 12)),
          ],
        ]),
      ),
    );
  }
}
