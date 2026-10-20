import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;

import '../db.dart';
import '../knowledge.dart';
import 'read.dart' show AppColors;

const _catLabel = {
  'business': 'Business', 'mercy': 'Mercy', 'prayer': 'Prayer', 'justice': 'Justice',
  'knowledge': 'Knowledge', 'patience': 'Patience', 'creation': 'Creation',
  'afterlife': 'Afterlife', 'family': 'Family', 'prophets': 'Prophets', 'faith': 'Faith',
  'language': 'Language', 'general': 'General', 'pending': 'Pending research',
};

class WordsTab extends StatefulWidget {
  const WordsTab({super.key});
  @override
  State<WordsTab> createState() => _WordsTabState();
}

class _WordsTabState extends State<WordsTab> {
  List<Map<String, dynamic>> _words = [];
  List<Map<String, Object?>> _surahs = [];
  String _q = '';
  String _cat = '';
  int _surah = 0;
  bool _favOnly = false, _loading = true;

  @override
  void initState() {
    super.initState();
    TafsirDb.i.surahs().then((s) { if (mounted) setState(() => _surahs = s); });
    _loadWords();
  }

  Future<void> _loadWords() async {
    List<Map<String, dynamic>> words = [];
    try {
      final raw = await rootBundle.loadString('assets/words_export.json');
      final list = jsonDecode(raw) as List;
      words = list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    } catch (_) {
      final dbWords = await TafsirDb.i.words();
      words = dbWords.map((e) => Map<String, dynamic>.from(e)).toList();
    }
    await Knowledge.i.load();
    if (!mounted) return;
    setState(() { _words = words; _loading = false; });
  }

  bool _placeholder(Map<String, dynamic> w) =>
      (w['cat'] ?? '') == 'pending' || '${w['w'] ?? ''}'.startsWith('كلمة');

  bool _isArabic(String s) => RegExp(r'[\u0600-\u06FF]').hasMatch(s);

  List<Map<String, dynamic>> get _filtered => _words.where((w) {
    if (_surah != 0 && w['surah'] != _surah) return false;
    if (_cat.isNotEmpty && w['cat'] != _cat) return false;
    if (_favOnly && !Favs.has((w['id'] as int?) ?? 0)) return false;
    if (_q.isEmpty) return true;
    if (_placeholder(w) && _q.isNotEmpty) return false;
    if (_isArabic(_q)) {
      final nq = normAr(_q);
      final an = (w['ar_norm'] ?? '').toString();
      return an.contains(nq) || '${w['root'] ?? ''}'.replaceAll('-', '').contains(nq);
    }
    return '${w['srch'] ?? ''}'.toLowerCase().contains(_q.toLowerCase());
  }).toList();

  Map<String, int> get _catCounts {
    final m = <String, int>{};
    for (final w in _words) {
      final c = (w['cat'] ?? 'general').toString();
      m[c] = (m[c] ?? 0) + 1;
    }
    return m;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Word meanings'),
        actions: [
          IconButton(
            icon: Icon(_favOnly ? Icons.bookmark : Icons.bookmark_border, color: AppColors.gold),
            tooltip: 'Saved words only',
            onPressed: () => setState(() => _favOnly = !_favOnly),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 6),
                child: Row(children: [
                  Expanded(
                    child: TextField(
                      decoration: const InputDecoration(
                          hintText: 'Word, root or meaning…',
                          prefixIcon: Icon(Icons.search)),
                      onChanged: (v) => setState(() => _q = v.trim()),
                      textInputAction: TextInputAction.search,
                      onSubmitted: (_) => setState(() {}),
                    ),
                  ),
                  const SizedBox(width: 10),
                  SizedBox(
                    width: 64,
                    child: DropdownButton<int>(
                      value: _surah,
                      isExpanded: true,
                      underline: const SizedBox(),
                      items: [
                        const DropdownMenuItem(value: 0, child: Text('All', style: TextStyle(fontSize: 13))),
                        for (final s in _surahs)
                          DropdownMenuItem(
                              value: s['id'] as int,
                              child: Text('${s['id']}.', style: const TextStyle(fontSize: 12))),
                      ],
                      onChanged: (v) => setState(() => _surah = v ?? 0),
                    ),
                  ),
                ]),
              ),
              SizedBox(
                height: 38,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    _catChip('', 'All'),
                    for (final c in _catCounts.keys)
                      if (c != 'pending') _catChip(c, '${_catLabel[c] ?? c} (${_catCounts[c]})'),
                  ],
                ),
              ),
              Expanded(
                child: GridView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 20),
                  gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                      maxCrossAxisExtent: 240,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: .78),
                  itemCount: _filtered.length,
                  itemBuilder: (c, i) {
                    final w = _filtered[i];
                    return _WordTile(
                      w: w,
                      placeholder: _placeholder(w),
                      fav: Favs.has((w['id'] as int?) ?? 0),
                      onOpen: () => _open(w),
                    );
                  },
                ),
              ),
            ]),
    );
  }

  Widget _catChip(String value, String label) {
    final on = _cat == value;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: () => setState(() => _cat = value),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: on ? AppColors.gold : Colors.white.withValues(alpha: .7),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: AppColors.gold.withValues(alpha: on ? .8 : .3)),
          ),
          child: Text(label,
              style: TextStyle(
                  fontSize: 11.5, fontWeight: FontWeight.w700,
                  color: on ? Colors.white : AppColors.gold)),
        ),
      ),
    );
  }

  void _open(Map<String, dynamic> w) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white.withValues(alpha: .97),
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (_) => _WordSheet(w: w),
    );
  }
}

/// Favorites are in-memory this session; listed on the bookmark filter.
class Favs {
  static final Set<int> ids = {};
  static bool has(int id) => ids.contains(id);
  static void toggle(int id) => ids.contains(id) ? ids.remove(id) : ids.add(id);
}

class _WordTile extends StatelessWidget {
  final Map<String, dynamic> w;
  final bool placeholder, fav;
  final VoidCallback onOpen;
  const _WordTile({
      required this.w, required this.placeholder, required this.fav, required this.onOpen});

  @override
  Widget build(BuildContext context) {
    final am = _means(w);
    final cat = (w['cat'] ?? '').toString();
    final ref = (w['ref'] ?? '').toString();
    return Card(
      color: Colors.white.withValues(alpha: placeholder ? .35 : .72),
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: onOpen,
        child: Padding(
          padding: const EdgeInsets.all(13),
          child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text((w['w'] ?? '').toString(),
                    textDirection: TextDirection.rtl,
                    style: const TextStyle(
                        fontSize: 21, color: AppColors.gold, fontWeight: FontWeight.w700,
                        height: 1.8)),
                Text((w['tr'] ?? '').toString(),
                    textDirection: TextDirection.ltr,
                    style: const TextStyle(color: AppColors.muted, fontSize: 10.5),
                    maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 5),
                Expanded(
                  child: Text((w['en'] ?? '').toString(),
                      style: const TextStyle(fontSize: 11.5, height: 1.35),
                      maxLines: 3, overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center),
                ),
                Wrap(spacing: 4, runSpacing: 4, alignment: WrapAlignment.center, children: [
                  if (cat.isNotEmpty && cat != 'pending')
                    _Chip(_catLabel[cat] ?? cat, gold: true),
                  if (am.isNotEmpty) _Chip('${am.length}'),
                  if (ref.isNotEmpty) _Chip(ref, blue: true),
                  if (placeholder) const _Chip('pending'),
                ]),
              ]),
        ),
      ),
    );
  }
}

class _chip extends StatelessWidget {
  const _Chip(this.label, {this.gold = false, this.blue = false});
  final String label;
  final bool gold, blue;
  @override
  Widget build(BuildContext context) {
    final color = blue ? const Color(0xFF23638C) : (gold ? AppColors.gold : AppColors.muted);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(label,
          style: TextStyle(fontSize: 9, color: color, fontWeight: FontWeight.w700)),
    );
  }
}

List<Map<String, dynamic>> _means(Map<String, dynamic> w) {
  final raw = w['am'] ?? w['alternative_meanings'];
  if (raw is String && raw.isNotEmpty) {
    try {
      final d = jsonDecode(raw);
      if (d is List) return d.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    } catch (_) {}
  }
  if (raw is List) return raw.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  return const [];
}

class _WordSheet extends StatelessWidget {
  final Map<String, dynamic> w;
  const _WordSheet({required this.w});

  @override
  Widget build(BuildContext context) {
    final maxHeight = MediaQuery.of(context).size.height * .88;
    final pill = KnowledgePill.forWord((w['w'] ?? '').toString());
    final ref = (w['ref'] ?? '').toString();
    final ra = w['ra'];
    final raText = ra is Map
        ? [ra['linguistic'], ra['sci'], ra['trait']].where((e) => e != null && '$e'.isNotEmpty).join(' · ')
        : (ra ?? '').toString();
    return Container(
      constraints: BoxConstraints(maxHeight: maxHeight),
      padding: const EdgeInsets.fromLTRB(22, 14, 22, 26),
      child: SingleChildScrollView(
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Row(children: [
            const Spacer(),
            IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
          ]),
          Text((w['w'] ?? '').toString(),
              textDirection: TextDirection.rtl,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  fontSize: 40, color: AppColors.gold, height: 1.9, fontWeight: FontWeight.w700)),
          Text((w['tr'] ?? '').toString(),
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.w800)),
          if (pill != null)
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Center(child: pill),
            ),
          const _Label('Meaning'),
          _Box(text: (w['en'] ?? '').toString()),
          const _Label('অর্থ (বাংলা)'),
          _Box(text: (w['bn'] ?? '').toString()),
          if ((w['root'] ?? '').toString().isNotEmpty) ...[
            const _Label('Root'),
            _Box(boldRef: (w['root']).toString(), text: raText),
          ],
          if ((w['form'] ?? '').toString().isNotEmpty) ...[
            const _Label('Linguistic form'),
            _Box(text: (w['form']).toString()),
          ],
          if ((w['why'] ?? '').toString().isNotEmpty) ...[
            const _Label('Why this word (Ayn)'),
            _Box(gold: true, text: (w['why']).toString()),
          ],
          if (ref.isNotEmpty) ...[
            const _Label('Ayah reference'),
            _Box(gold: true, text: 'Qur\'an $ref'),
          ],
          for (final m in _means(w)) ...[
            const _Label('Alternative meaning'),
            _Box(gold: true, text: (m['meaning'] ?? '').toString(),
                footnote: (m['source'] ?? '').toString(),
                italic: (m['evidence'] ?? '').toString()),
          ],
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: OutlinedButton(
              onPressed: () { Favs.toggle((w['id'] as int?) ?? 0); (context as Element).markNeedsBuild(); },
              child: const Text('☆ Save'),
            )),
            const SizedBox(width: 10),
            Expanded(child: FilledButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            )),
          ]),
        ]),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 14, bottom: 6),
    child: Text(text.toUpperCase(),
        style: const TextStyle(
            color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: .1)),
  );
}

class _Box extends StatelessWidget {
  final String text, footnote, italic, boldRef;
  final bool gold;
  const _Box({this.text = '', this.footnote = '', this.italic = '', this.boldRef = '', this.gold = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: gold
            ? const Color(0xFFD9B44A).withValues(alpha: .10)
            : AppColors.ink.withValues(alpha: .035),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (boldRef.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Text(boldRef,
                textDirection: TextDirection.rtl,
                style: const TextStyle(
                    color: AppColors.gold, fontWeight: FontWeight.w800, fontSize: 16)),
          ),
        if (text.isNotEmpty)
          Text(text, style: const TextStyle(fontSize: 14, height: 1.65)),
        if (italic.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 5),
            child: Text(italic,
                style: const TextStyle(
                    fontSize: 12.5, color: AppColors.muted, fontStyle: FontStyle.italic)),
          ),
        if (footnote.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 7),
            child: Text(footnote,
                style: const TextStyle(fontSize: 11.5, color: AppColors.gold, fontWeight: FontWeight.w700)),
          ),
      ]),
    );
  }
}
