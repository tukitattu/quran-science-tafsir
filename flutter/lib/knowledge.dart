import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;

import 'screens/read.dart' show AppColors;

/// Offline knowledge layer: book extracts (knowledge.json), the full Uthmani
/// ayah text (quran_ar.json) and the curated business set (business.json).
class Knowledge {
  Knowledge._();
  static final Knowledge i = Knowledge._();

  Map<String, dynamic> _kb = const {};
  Map<String, dynamic> _ar = const {};
  Map<String, dynamic> _business = const {};
  bool ready = false;
  Future<void>? _p;

  Future<void> load() {
    if (ready) return Future.value();
    return _p ??= _load();
  }

  Future<void> _load() async {
    try {
      final kb = await rootBundle.loadString('assets/knowledge.json');
      _kb = jsonDecode(kb) as Map<String, dynamic>;
    } catch (_) {}
    try {
      final ar = await rootBundle.loadString('assets/data/quran_ar.json');
      _ar = jsonDecode(ar) as Map<String, dynamic>;
    } catch (_) {}
    try {
      final b = await rootBundle.loadString('assets/business.json');
      _business = jsonDecode(b) as Map<String, dynamic>;
    } catch (_) {}
    ready = true;
  }

  Map<String, dynamic> get business => _business;

  /// Uthmani text for surah:ayah ("" when unavailable).
  String ayahText(int surah, int ayah) {
    final s = _ar['$surah'];
    if (s is Map) return (s['$ayah'] ?? '').toString().replaceAll('\ufeff', '');
    return '';
  }

  /// Deterministic ayah for a given day, chosen across the full Uthmani text.
  Map<String, dynamic> ayahOfDay(DateTime now) {
    final surahIds = _ar.keys
        .map(int.tryParse)
        .whereType<int>()
        .toList()
      ..sort();
    if (surahIds.isEmpty) return const {};
    final counts = <int, int>{};
    var total = 0;
    for (final s in surahIds) {
      final c = (_ar['$s'] as Map?)?.length ?? 0;
      if (c == 0) continue;
      counts[s] = c;
      total += c;
    }
    if (total == 0) return const {};
    final days = now.difference(DateTime.utc(2024, 1, 1)).inDays;
    var pick = days % total;
    for (final s in counts.keys) {
      final c = counts[s]!;
      if (pick < c) {
        return {'surah': s, 'ayah': pick + 1, 'ar': ayahText(s, pick + 1)};
      }
      pick -= c;
    }
    return const {};
  }

  /// Number of ayahs available for a surah (0 when the text is missing).
  int ayahCount(int surah) {
    final s = _ar['$surah'];
    if (s is Map) return s.length;
    return 0;
  }

  List<Map<String, dynamic>> forAyah(int surah, int ayah) {
    final list = (_kb['byAyah'] as Map?)?['$surah:$ayah'];
    return _asList(list);
  }

  List<Map<String, dynamic>> forWord(String word) {
    final list = (_kb['byWord'] as Map?)?[normAr(word)];
    return _asList(list);
  }

  List<Map<String, dynamic>> forTag(String tag) {
    final list = (_kb['byTag'] as Map?)?[tag.toLowerCase()];
    return _asList(list);
  }

  static List<Map<String, dynamic>> _asList(dynamic v) {
    if (v is List) return v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    return const [];
  }
}

/// Normalise Arabic for matching (strip harakat, unify alef/ya/ta-marbuta).
String normAr(String s) {
  var t = s.replaceAll('\ufeff', '');
  t = t.replaceAll(RegExp(r'[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]'), '');
  t = t.replaceAll('\u0671', '\u0627').replaceAll('\u0622', '\u0627')
       .replaceAll('\u0623', '\u0627').replaceAll('\u0625', '\u0627')
       .replaceAll('\u0649', '\u064A').replaceAll('\u0629', '\u0647');
  return t.trim();
}

/// A folded pill: one button after an ayah / word. Tapping it unfolds a
/// rounded popover whose height follows the number of available translations.
class KnowledgePill extends StatefulWidget {
  final String label;
  final List<Map<String, dynamic>> items;
  final List<MapEntry<String, String>> ayahs;
  const KnowledgePill({
    super.key,
    required this.label,
    this.items = const [],
    this.ayahs = const [],
  });

  static KnowledgePill? forAyah(int surah, int ayah, {String? label}) {
    final ar = Knowledge.i.ayahText(surah, ayah);
    final items = Knowledge.i.forAyah(surah, ayah);
    if (ar.isEmpty && items.isEmpty) return null;
    return KnowledgePill(
      label: label ?? 'Ayah $surah:$ayah',
      items: items,
      ayahs: ar.isEmpty ? const [] : [MapEntry('$surah:$ayah', ar)],
    );
  }

  static KnowledgePill? forWord(String word) {
    final items = Knowledge.i.forWord(word);
    if (items.isEmpty) return null;
    return KnowledgePill(label: '${items.length} translation${items.length == 1 ? '' : 's'}', items: items);
  }

  @override
  State<KnowledgePill> createState() => _KnowledgePillState();
}

class _KnowledgePillState extends State<KnowledgePill> {
  final OverlayPortalController _ctrl = OverlayPortalController();
  final LayerLink _link = LayerLink();

  void _toggle() {
    if (_ctrl.isShowing) {
      _ctrl.hide();
    } else {
      _ctrl.show();
    }
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final n = widget.items.length + widget.ayahs.length;
    return OverlayPortal(
      controller: _ctrl,
      overlayChildBuilder: (ctx) => CompositedTransformFollower(
        link: _link,
        targetAnchor: Alignment.bottomLeft,
        followerAnchor: Alignment.topLeft,
        offset: const Offset(0, 6),
        child: Align(
          alignment: Alignment.topLeft,
          child: TapRegion(
            onTapOutside: (_) {
              _ctrl.hide();
              setState(() {});
            },
            child: ConstrainedBox(
              constraints: BoxConstraints(
                maxWidth: 340,
                maxHeight: MediaQuery.of(ctx).size.height * .6,
              ),
              child: Material(
                elevation: 10,
                color: Colors.white.withValues(alpha: .97),
                borderRadius: BorderRadius.circular(22),
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      for (final a in widget.ayahs) _AyahBox(ref: a.key, text: a.value),
                      for (final it in widget.items) _ExtractBox(item: it),
                      if (n == 0)
                        const Padding(
                          padding: EdgeInsets.all(8),
                          child: Text('No additional translations yet.',
                              style: TextStyle(color: AppColors.muted, fontSize: 12)),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
      child: CompositedTransformTarget(
        link: _link,
        child: InkWell(
          borderRadius: BorderRadius.circular(999),
          onTap: _toggle,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 7),
            decoration: BoxDecoration(
              color: _ctrl.isShowing
                  ? const Color(0xFFD9B44A).withValues(alpha: .22)
                  : Colors.white.withValues(alpha: .8),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: AppColors.gold.withValues(alpha: .35)),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.menu_book_outlined, size: 15, color: AppColors.gold),
              const SizedBox(width: 6),
              Text(widget.label,
                  style: const TextStyle(
                      fontSize: 11.5, fontWeight: FontWeight.w700, color: AppColors.gold)),
              const SizedBox(width: 4),
              Icon(_ctrl.isShowing ? Icons.expand_less : Icons.expand_more,
                  size: 15, color: AppColors.gold.withValues(alpha: .8)),
            ]),
          ),
        ),
      ),
    );
  }
}

class _AyahBox extends StatelessWidget {
  final String ref, text;
  const _AyahBox({required this.ref, required this.text});
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFD9B44A).withValues(alpha: .12),
        borderRadius: BorderRadius.circular(15),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text(ref,
            style: const TextStyle(
                fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.gold,
                letterSpacing: .06)),
        const SizedBox(height: 3),
        Text(text,
            textDirection: TextDirection.rtl,
            textAlign: TextAlign.right,
            style: const TextStyle(fontSize: 19, height: 1.9, color: AppColors.ink)),
      ]),
    );
  }
}

class _ExtractBox extends StatelessWidget {
  final Map<String, dynamic> item;
  const _ExtractBox({required this.item});
  @override
  Widget build(BuildContext context) {
    final ar = (item['ar'] ?? '').toString();
    final en = (item['en'] ?? '').toString();
    final bn = (item['bn'] ?? '').toString();
    final src = (item['src'] ?? '').toString();
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.ink.withValues(alpha: .035),
        borderRadius: BorderRadius.circular(15),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        if (ar.isNotEmpty)
          Text(ar,
              textDirection: TextDirection.rtl,
              textAlign: TextAlign.right,
              style: const TextStyle(fontSize: 16, height: 1.8, color: AppColors.ink)),
        if (en.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(en, style: const TextStyle(fontSize: 12.5, height: 1.55)),
          ),
        if (bn.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(bn,
                style: const TextStyle(fontSize: 12.5, height: 1.6, color: AppColors.muted)),
          ),
        if (src.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(src,
                style: const TextStyle(
                    fontSize: 10.5, fontWeight: FontWeight.w700, color: AppColors.gold)),
          ),
      ]),
    );
  }
}
