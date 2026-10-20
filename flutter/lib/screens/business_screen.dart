import 'package:flutter/material.dart';

import '../knowledge.dart';
import 'read.dart' show AppColors;

class BusinessTab extends StatefulWidget {
  const BusinessTab({super.key});
  @override
  State<BusinessTab> createState() => _BusinessTabState();
}

class _BusinessTabState extends State<BusinessTab> {
  String _sec = 'all';
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    Knowledge.i.load().then((_) {
      if (mounted) setState(() => _loading = false);
    });
  }

  String _t(dynamic v) {
    if (v is Map) return (v['en'] ?? '').toString();
    return (v ?? '').toString();
  }

  List<Map<String, dynamic>> get _sections {
    final raw = Knowledge.i.business['sections'];
    if (raw is List) return raw.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    return const [];
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final sections = _sections.where((s) => _sec == 'all' || s['id'] == _sec).toList();
    final intro = Knowledge.i.business['intro'];
    return Scaffold(
      appBar: AppBar(title: const Text('Business & Trade')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
        children: [
          if (intro is Map)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: .7),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: AppColors.ink.withValues(alpha: .08)),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(_t(intro),
                    style: const TextStyle(fontSize: 13, height: 1.65, color: AppColors.muted)),
                const SizedBox(height: 8),
                Text((intro['bn'] ?? '').toString(),
                    style: const TextStyle(fontSize: 12.5, height: 1.75, color: AppColors.muted)),
              ]),
            ),
          const SizedBox(height: 14),
          Wrap(spacing: 7, runSpacing: 7, children: [
            _tab('all', 'All'),
            for (final s in _sections) _tab((s['id'] ?? '').toString(), _t(s['title'])),
          ]),
          const SizedBox(height: 8),
          for (final s in sections) ...[
            Padding(
              padding: const EdgeInsets.only(top: 14, bottom: 6),
              child: Text(_t(s['title']),
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.ink)),
            ),
            for (final it in ((s['items'] as List?) ?? const []).whereType<Map>())
              _card(Map<String, dynamic>.from(it)),
          ],
        ],
      ),
    );
  }

  Widget _tab(String id, String label) {
    final on = _sec == id;
    return InkWell(
      borderRadius: BorderRadius.circular(999),
      onTap: () => setState(() => _sec = id),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: on ? AppColors.gold : Colors.white.withValues(alpha: .75),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: AppColors.gold.withValues(alpha: on ? .8 : .3)),
        ),
        child: Text(label,
            style: TextStyle(
                fontSize: 12, fontWeight: FontWeight.w700,
                color: on ? Colors.white : AppColors.gold)),
      ),
    );
  }

  Widget _card(Map<String, dynamic> it) {
    final ar = (it['ar'] ?? '').toString();
    final en = (it['en'] ?? '').toString();
    final bn = (it['bn'] ?? '').toString();
    final src = (it['source'] ?? '').toString();
    final ref = (it['ref'] ?? '').toString();
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: .72),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.ink.withValues(alpha: .07)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        if (ar.isNotEmpty)
          Text(ar,
              textDirection: TextDirection.rtl,
              textAlign: TextAlign.right,
              style: const TextStyle(fontSize: 21, height: 1.9, color: AppColors.gold)),
        if (en.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(en, style: const TextStyle(fontSize: 13.5, height: 1.6)),
          ),
        if (bn.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(bn,
                style: const TextStyle(fontSize: 13, height: 1.7, color: AppColors.muted)),
          ),
        const SizedBox(height: 10),
        Wrap(spacing: 7, runSpacing: 6, children: [
          if (src.isNotEmpty) _tag(src, AppColors.gold),
          if (ref.isNotEmpty) _tag('Qur\'an $ref', const Color(0xFF23638C)),
        ]),
      ]),
    );
  }

  Widget _tag(String label, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
        decoration: BoxDecoration(
          color: color.withValues(alpha: .12),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(label,
            style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: color)),
      );
}
