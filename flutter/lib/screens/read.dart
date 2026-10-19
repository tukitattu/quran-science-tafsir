import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../db.dart';
import '../main.dart';

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

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final s = await TafsirDb.i.surahs();
    final today = await TafsirDb.i.ayahOfTheDay();
    final sp = await SharedPreferences.getInstance();
    final visited = sp.getStringList('visited');
    final cont = sp.getInt('lastSurah');
    setState(() {
      _surahs = s;
      _today = today;
      _visited = visited.length;
      _continueTo = cont;
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
    final t = _today ?? {};
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      children: [
        Text('Scientific Tafsir',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w700, letterSpacing: -0.5)),
        Text('Zakaria Kamal · English / বাংলা / العربية',
            style: const TextStyle(color: AppColors.muted)),
        const SizedBox(height: 18),
        _TodayCard(today: t),
        if (_continueTo != null) ...[
          const SizedBox(height: 12),
          FilledButton.icon(
            icon: const Icon(Icons.play_arrow_rounded),
            label: Text('Continue — Surah ${_continueTo}'),
            onPressed: () => _open(_continueTo!),
          ),
        ],
        const SizedBox(height: 18),
        Row(children: [
          Text('All 114 chapters',
              style: Theme.of(context)
                  .textTheme
                  .titleLarge
                  ?.copyWith(fontWeight: FontWeight.w700)),
          const Spacer(),
          Text('$_visited/114 read · ${(_visited / 114 * 100).round()}%',
              style: const TextStyle(color: AppColors.muted, fontSize: 12)),
        ]),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: _visited / 114,
            minHeight: 8,
            backgroundColor: AppColors.ink.withValues(alpha: .07),
            valueColor: const AlwaysStoppedAnimation(AppColors.gold),
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          decoration: const InputDecoration(
              hintText: 'Find a surah…', prefixIcon: Icon(Icons.search)),
          onChanged: (v) => setState(() => _q = v.trim()),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final e in {'all': 'All', 'makki': 'Makki', 'madani': 'Madani'}.entries)
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
                        style: const TextStyle(
                            color: AppColors.muted, fontSize: 12)),
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
              child: Text(type == 'madani' ? 'Madani' : 'Makki',
                  style: TextStyle(color: typeColor, fontSize: 10)),
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
}

class AppColors {
  static const ink = Color(0xFF232B36);
  static const muted = Color(0xFF5D6875);
  static const gold = Color(0xFFA67C1B);
  static const goldBright = Color(0xFFD9B44A);
  static const blue = Color(0xFF23638C);
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
          Text("Today's Ayah",
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
          if (app.lang != 'en')
            Text((today['bn'] ?? '').toString(),
                style: const TextStyle(
                    color: AppColors.muted, height: 1.6)),
          if (app.lang != 'bn') ...[
            const SizedBox(height: 4),
            Text(ref, style: const TextStyle(color: AppColors.muted, fontSize: 12)),
          ],
        ]),
      ),
    );
  }
}
