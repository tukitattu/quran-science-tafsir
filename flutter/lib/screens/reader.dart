import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../db.dart';
import '../knowledge.dart';
import '../main.dart';
import 'read.dart'; // AppColors

final RegExp _verseMark = RegExp(r'\[(\d+)\]');

/// Replace bare verse markers such as `[3]` with ornamental brackets so the
/// paragraph text reads naturally (citations like `[Al Quran 9:29]` are left).
String formatVerseMarks(String s) =>
    s.replaceAllMapped(_verseMark, (m) => ' \u2009\uFD3F${m[1]}\uFD3E\u2009 ');

class ReaderScreen extends StatefulWidget {
  final int surahId;
  final int startPage;
  const ReaderScreen({super.key, required this.surahId, this.startPage = 0});
  @override
  State<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends State<ReaderScreen> {
  List<Map<String, Object?>> _paras = [];
  Map<String, Object?> _meta = {};
  bool _loading = true;
  String? _error;
  late final PageController _pager;
  double _font = 16;
  String _lang = 'both';

  @override
  void initState() {
    super.initState();
    _pager = PageController(initialPage: widget.startPage);
    _load();
  }

  Future<void> _load() async {
    var paras = <Map<String, Object?>>[];
    Map<String, Object?> meta = {};
    var initPage = 0;
    String? error;
    try {
      await Knowledge.i.load();
      paras = await TafsirDb.i.paras(widget.surahId);
      meta = await TafsirDb.i.tafsirMeta(widget.surahId) ?? {};
      final sp = await SharedPreferences.getInstance();
      final vis = sp.getStringList('visited') ?? [];
      if (!vis.contains('${widget.surahId}')) {
        await sp.setStringList('visited', [...vis, '${widget.surahId}']);
      }
      initPage = sp.getInt('page:${widget.surahId}') ?? 0;
    } catch (e) {
      debugPrint('reader load failed: $e');
      error = '$e';
    }
    if (initPage > 0 && initPage < paras.length) {
      Future.microtask(() {
        if (mounted && _pager.hasClients) {
          _pager.jumpToPage((initPage / 25).floor());
        }
      });
    }
    if (!mounted) return;
    setState(() {
      _paras = paras;
      _meta = meta;
      _font = app.fontScale * 16;
      _lang = app.lang;
      _error = error;
      _loading = false;
    });
  }

  @override
  void dispose() {
    _savePage();
    _pager.dispose();
    super.dispose();
  }

  Future<void> _savePage() async {
    try {
      if (_paras.isEmpty) return;
      final sp = await SharedPreferences.getInstance();
      final i = _pager.hasClients ? _pager.page?.round() ?? 0 : 0;
      final at = (i * 25).clamp(0, _paras.length - 1);
      await sp.setInt('page:${widget.surahId}', at);
      await sp.setInt('lastSurah', widget.surahId);
    } catch (e) {
      debugPrint('save page failed: $e');
    }
  }

  void _setLang(String v) {
    setState(() => _lang = v);
    app.setLang(v);
  }

  List<Widget> _paraText(Map<String, Object?> p) {
    final en = (p['en'] ?? '') as String;
    final bn = (p['bn'] ?? '') as String;
    var ar = (p['ar'] ?? '') as String;
    final ayahs = RegExp(r'\[(\d+)\]')
        .allMatches(en)
        .map((m) => int.parse(m.group(1)!))
        .toList();
    // Arabic comes from the bundled Uthmani text when the DB column is empty.
    if (ar.isEmpty && ayahs.isNotEmpty) {
      ar = ayahs
          .map((n) => Knowledge.i.ayahText(widget.surahId, n))
          .where((t) => t.isNotEmpty)
          .join('  ۞  ');
    }
    final isVerse = ar.isNotEmpty || ayahs.isNotEmpty;
    final fontSize = _font * (isVerse ? 1.03 : 1.0);
    final widgets = <Widget>[];
    if (ar.isNotEmpty) {
      widgets.add(Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: const Color(0xFFD9B44A).withValues(alpha: 0.14),
          borderRadius: const BorderRadius.horizontal(
              left: Radius.circular(18), right: Radius.circular(6)),
        ),
        child: Text(ar,
            textDirection: TextDirection.rtl,
            style: TextStyle(
                fontSize: fontSize + 4, height: 2, color: const Color(0xFF5F4A14))),
      ));
    }
    if (_lang == 'ar') {
      if (ayahs.isNotEmpty && Knowledge.i.ready) {
        final pills = ayahs
            .map((n) => KnowledgePill.forAyah(widget.surahId, n))
            .whereType<KnowledgePill>()
            .toList();
        if (pills.isNotEmpty) {
          widgets.add(Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Wrap(spacing: 8, runSpacing: 6, children: pills),
          ));
        }
      }
      return widgets;
    }
    if (_lang != 'en' && bn.isNotEmpty) {
      widgets.add(Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Text(formatVerseMarks(bn),
              style: TextStyle(fontSize: fontSize, height: 1.85, color: AppColors.ink))));
    }
    if (_lang != 'bn' && en.isNotEmpty) {
      widgets.add(Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Text(formatVerseMarks(en),
              style: TextStyle(
                  fontSize: fontSize, height: 1.85,
                  color: _lang == 'both' ? AppColors.muted : AppColors.ink))));
    }
    if (ayahs.isNotEmpty && Knowledge.i.ready) {
      final pills = ayahs
          .map((n) => KnowledgePill.forAyah(widget.surahId, n))
          .whereType<KnowledgePill>()
          .toList();
      if (pills.isNotEmpty) {
        widgets.add(Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Wrap(spacing: 8, runSpacing: 6, children: pills),
        ));
      }
    }
    return widgets;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Surah')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.storage_rounded, size: 40),
                const SizedBox(height: 12),
                const Text('This surah could not be opened.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontWeight: FontWeight.w700)),
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
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }
    final pages = <List<Widget>>[];
    for (var i = 0; i < _paras.length; i += 25) {
      pages.add(_paras.skip(i).take(25).expand(_paraText).toList());
    }
    return Scaffold(
      appBar: AppBar(
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('${_meta['en'] ?? 'Surah ${widget.surahId}'}',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          Text('${_meta['ar'] ?? ''} · بাংলা ${_meta['bn'] ?? ''}',
              style: const TextStyle(fontSize: 11, color: AppColors.muted)),
        ]),
        actions: [
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'both', label: Text('EN বাং')),
              ButtonSegment(value: 'en', label: Text('EN')),
              ButtonSegment(value: 'bn', label: Text('বাং')),
              ButtonSegment(value: 'ar', label: Text('عربي')),
            ],
            selected: {_lang},
            style: const ButtonStyle(visualDensity: VisualDensity.compact),
            showSelectedIcon: false,
            onSelectionChanged: (s) => _setLang(s.first),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: pages.isEmpty
          ? const Center(child: Text('No paragraphs found'))
          : PageView.builder(
              controller: _pager,
              itemCount: pages.length,
              itemBuilder: (c, i) => ListView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                children: [
                  Text('Page ${i + 1} / ${pages.length}',
                      style: const TextStyle(
                          color: AppColors.muted, fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  ...pages[i],
                  _NavRow(
                    surah: widget.surahId,
                    page: i,
                    pages: pages.length,
                  ),
                ],
              ),
            ),
      floatingActionButton: FloatingActionButton.small(
        backgroundColor: Colors.white.withValues(alpha: .9),
        foregroundColor: AppColors.ink,
        child: const Icon(Icons.text_increase),
        onPressed: () {
          showModalBottomSheet(
            context: context,
            backgroundColor: Colors.white.withValues(alpha: .96),
            shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
            builder: (_) => _FontSheet(
              value: _font / 16,
              onChange: (v) => setState(() => _font = 16 * v),
            ),
          );
        },
      ),
    );
  }
}

class _NavRow extends StatelessWidget {
  final int surah, page, pages;
  const _NavRow({required this.surah, required this.page, required this.pages});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      OutlinedButton(
        onPressed: page > 0 ? () => Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => ReaderScreen(surahId: surah, startPage: page - 1))) : null,
        child: const Text('‹ Prev page'),
      ),
      const Spacer(),
      OutlinedButton(
        onPressed: page < pages - 1 ? () => Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => ReaderScreen(surahId: surah, startPage: page + 1))) : null,
        child: const Text('Next page ›'),
      ),
    ]);
  }
}

class _FontSheet extends StatelessWidget {
  final double value;
  final void Function(double) onChange;
  const _FontSheet({required this.value, required this.onChange});

  @override
  Widget build(BuildContext context) {
    return StatefulBuilder(builder: (context, setState) {
      return Padding(
        padding: const EdgeInsets.all(22),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('Text size',
              style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.w800)),
          Slider(
            value: value,
            min: .8, max: 1.6, divisions: 8,
            label: '${(value * 100).round()}%',
            onChanged: (v) { setState(() {}); onChange(v); },
          ),
          Text('Sample paragraph — the size you are reading right now.',
              style: TextStyle(fontSize: 16 * value, height: 1.8)),
        ]),
      );
    });
  }
}
