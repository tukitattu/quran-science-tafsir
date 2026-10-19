import 'dart:convert';

import 'package:flutter/material.dart';

import '../db.dart';
import 'read.dart'; // AppColors

class WordsTab extends StatefulWidget {
  const WordsTab({super.key});
  @override
  State<WordsTab> createState() => _WordsTabState();
}

class _WordsTabState extends State<WordsTab> {
  List<Map<String, Object?>> _words = [];
  List<Map<String, Object?>> _surahs = [];
  String _q = '';
  int _surah = 0;
  bool _favOnly = false, _loading = true;

  @override
  void initState() {
    super.initState();
    TafsirDb.i.surahs().then((s) => setState(() => _surahs = s));
    TafsirDb.i.words().then((w) => setState(() { _words = w; _loading = false; }));
  }

  bool _placeholder(Map<String, Object?> w) {
    final s = (w['w'] ?? '').toString();
    return s.startsWith('كلمة');
  }

  List<Map<String, Object?>> get _filtered => _words.where((w) {
    if (_surah != 0 && w['surah_id'] != _surah) return false;
    if (_q.isEmpty) return true;
    if (_placeholder(w)) return false;
    final hay = '${w['w']} ${w['tr']} ${w['en']} ${w['bn']} ${w['root']}'
        .toLowerCase();
    return hay.contains(_q.toLowerCase());
  }).toList();

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
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 10),
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
              Expanded(
                child: GridView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
                  gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                      maxCrossAxisExtent: 240,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: .82),
                  itemCount: _filtered.length,
                  itemBuilder: (c, i) {
                    final w = _filtered[i];
                    final ph = _placeholder(w);
                    return _WordTile(
                      w: w,
                      placeholder: ph,
                      fav: Favs.has(w['id'] as int),
                      onOpen: () => _open(w),
                    );
                  },
                ),
              ),
            ]),
    );
  }

  void _open(Map<String, Object?> w) {
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
  final Map<String, Object?> w;
  final bool placeholder, fav;
  final VoidCallback onOpen;
  const _WordTile({
      required this.w, required this.placeholder, required this.fav, required this.onOpen});

  @override
  Widget build(BuildContext context) {
    final am = _means(w);
    return Card(
      color: Colors.white.withValues(alpha: placeholder ? .35 : .72),
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: onOpen,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text((w['w'] ?? '').toString(),
                    style: const TextStyle(
                        fontSize: 22, color: AppColors.gold, fontWeight: FontWeight.w700,
                        height: 1.9)),
                Text((w['tr'] ?? '').toString(),
                    style: const TextStyle(color: AppColors.muted, fontSize: 11),
                    maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 6),
                Expanded(
                  child: Text((w['en'] ?? '').toString(),
                      style: const TextStyle(fontSize: 12, height: 1.4),
                      maxLines: 3, overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center),
                ),
                Wrap(spacing: 4, runSpacing: 4, alignment: WrapAlignment.center, children: [
                  if ((w['root'] ?? '').toString().isNotEmpty)
                    _chip((w['root']).toString(), gold: true),
                  if (am.isNotEmpty) _chip('${am.length} meanings'),
                  if (placeholder) const _chip('data pending'),
                ]),
              ]),
        ),
      ),
    );
  }
}

class _chip extends StatelessWidget {
  const _chip(this.label, {this.gold = false});
  final String label;
  final bool gold;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: gold
            ? const Color(0xFFD9B44A).withValues(alpha: .16)
            : AppColors.ink.withValues(alpha: .05),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(label,
          style: TextStyle(
              fontSize: 9.5,
              color: gold ? AppColors.gold : AppColors.muted,
              fontWeight: FontWeight.w600)),
    );
  }
}

List<Map<String, Object?>> _means(Map<String, Object?> w) {
  final raw = w['alternative_meanings'];
  if (raw is String && raw.isNotEmpty) {
    try {
      final d = jsonDecode(raw);
      if (d is List) return d.cast<Map<String, Object?>>();
    } catch (_) {}
  }
  return const [];
}

class _WordSheet extends StatelessWidget {
  final Map<String, Object?> w;
  const _WordSheet({required this.w});

  @override
  Widget build(BuildContext context) {
    final maxHeight = MediaQuery.of(context).size.height * .88;
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
          const SizedBox(height: 10),
          const _Label('Meaning'),
          _Box(text: (w['en'] ?? '').toString()),
          const _Label('অর্থ (বাংলা)'),
          _Box(text: (w['bn'] ?? '').toString(), tint: false),
          if ((w['root'] ?? '').toString().isNotEmpty) ...[
            const _Label('Root'),
            _Box(boldRef: (w['root']).toString(), text: (w['root_analysis'] ?? '').toString()),
          ],
          if ((w['form'] ?? '').toString().isNotEmpty) ...[
            const _Label('Linguistic form'),
            _Box(text: (w['form']).toString()),
          ],
          if ((w['why'] ?? '').toString().isNotEmpty) ...[
            const _Label('Why this word (Ayn)'),
            _Box(gold: true, text: (w['why']).toString()),
          ],
          for (final m in _means(w)) ...[
            const _Label('Alternative meaning'),
            _Box(gold: true, text: (m['meaning'] ?? '').toString(), footnote: (m['source'] ?? '').toString(), italic: (m['evidence'] ?? '').toString()),
          ],
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: OutlinedButton(
              onPressed: () { Favs.toggle(w['id'] as int); (context as Element).markNeedsBuild(); },
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
