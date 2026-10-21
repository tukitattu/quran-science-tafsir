import 'package:flutter/material.dart';

import '../db.dart';
import 'read.dart'; // AppColors
import 'reader.dart';

class SearchTab extends StatefulWidget {
  const SearchTab({super.key});
  @override
  State<SearchTab> createState() => _SearchTabState();
}

class _SearchTabState extends State<SearchTab> {
  List<Map<String, Object?>> _surahs = [];
  List<Map<String, Object?>> _results = [];
  bool _bengali = false;
  bool _searching = false;
  String _q = '';

  @override
  void initState() {
    super.initState();
    TafsirDb.i.surahs().then((s) => setState(() => _surahs = s));
  }

  Future<void> _run() async {
    if (_q.trim().isEmpty) return;
    setState(() { _searching = true; _results = []; });
    final r = await TafsirDb.i.search(_q.trim(), bengali: _bengali);
    setState(() { _results = r; _searching = false; });
  }

  String _surahName(dynamic sid) {
    for (final s in _surahs) {
      if (s['id'] == sid) return '${s['en']}';
    }
    return 'Surah $sid';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Search the tafsir')),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 6),
          child: Row(children: [
            Expanded(
              child: TextField(
                autofocus: false,
                decoration: const InputDecoration(
                    hintText: 'e.g. heavens, রহমত, Iron…',
                    prefixIcon: Icon(Icons.search)),
                textInputAction: TextInputAction.search,
                onSubmitted: (_) => _run(),
                onChanged: (v) => _q = v,
              ),
            ),
            const SizedBox(width: 10),
            FilledButton(onPressed: _run, child: const Text('Go')),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(children: [
            Text('Search in: ',
                style: const TextStyle(color: AppColors.muted, fontSize: 13)),
            SegmentedButton<bool>(
              segments: const [
                ButtonSegment(value: false, label: Text('English')),
                ButtonSegment(value: true, label: Text('বাংলা')),
              ],
              selected: {_bengali},
              showSelectedIcon: false,
              onSelectionChanged: (s) => setState(() => _bengali = s.first),
            ),
          ]),
        ),
        Expanded(
          child: _searching
              ? const Center(child: CircularProgressIndicator())
              : _results.isEmpty
                  ? Center(
                      child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Text('لا توجد نتائج',
                                style: TextStyle(
                                    color: Color(0x66A67C1B), fontSize: 22)),
                            SizedBox(height: 6),
                            Text('Type a query and press Go',
                                style: TextStyle(color: AppColors.muted)),
                          ]),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      itemCount: _results.length,
                      itemBuilder: (c, i) => _resultCard(_results[i]),
                    ),
        ),
      ]),
    );
  }

  Widget _resultCard(Map<String, Object?> r) {
    final sid = r['surah_id'] as int;
    final ayah = r['ayah_num'];
    final body = (r[_bengali ? 'bn' : 'en'] ?? '').toString();
    final cite = RegExp(r'Al Quran\s+(\d+):(\d+)').firstMatch(body);
    final ref = cite != null ? '${cite[1]}:${cite[2]}' : '\u00b6$ayah';
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => ReaderScreen(surahId: sid)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFD9B44A).withValues(alpha: .14),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text('$sid. ${_surahName(sid)} · $ref',
                  style: const TextStyle(
                      color: AppColors.gold,
                      fontSize: 11,
                      fontWeight: FontWeight.w700)),
            ),
            const SizedBox(height: 8),
            Text(_first(formatVerseMarks(body), 220),
                style:
                    const TextStyle(fontSize: 14, height: 1.7, color: AppColors.ink)),
          ]),
        ),
      ),
    );
  }

  static String _first(String s, int n) {
    s = s.trim();
    return s.length <= n ? s : '${s.substring(0, n)}…';
  }
}
