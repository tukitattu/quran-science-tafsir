import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;

import '../l10n.dart';
import 'read.dart' show AppColors;
import 'reader.dart';

/// Knowledge Hub: 99 names, du'as, step-by-step guides, daily ayah/hadith and
/// Qur'anic topic collections. Data is bundled from the public eQuran dataset.
class MoreScreen extends StatefulWidget {
  const MoreScreen({super.key});
  @override
  State<MoreScreen> createState() => _MoreScreenState();
}

class _MoreScreenState extends State<MoreScreen> {
  Map<String, dynamic>? _names, _duas, _learn, _daily, _topics;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<Map<String, dynamic>> _json(String name) async {
    final raw = await rootBundle.loadString('assets/data/more/$name.json');
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  Future<void> _load() async {
    try {
      final all = await Future.wait([
        _json('names'), _json('duas'), _json('learn'), _json('daily'), _json('topics'),
      ]);
      if (!mounted) return;
      setState(() {
        _names = all[0]; _duas = all[1]; _learn = all[2]; _daily = all[3]; _topics = all[4];
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = '$e'; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 5,
      child: Scaffold(
        appBar: AppBar(
          title: Text(L.t('more_hub')),
          bottom: TabBar(
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            tabs: [
              Tab(text: L.t('names_99')),
              Tab(text: L.t('duas')),
              Tab(text: L.t('learn_guides')),
              Tab(text: L.t('daily')),
              Tab(text: L.t('topics')),
            ],
          ),
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text('${L.t('library_error')}\n$_error', textAlign: TextAlign.center)))
                : TabBarView(children: [
                    _NamesView(data: _names!),
                    _DuasView(data: _duas!),
                    _LearnView(data: _learn!),
                    _DailyView(data: _daily!),
                    _TopicsView(data: _topics!),
                  ]),
      ),
    );
  }
}

Widget _empty(String t) => Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Text(t, textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey)),
      ),
    );

Widget _ar(String text, {double size = 20, bool center = false}) => Text(
      text,
      textDirection: TextDirection.rtl,
      textAlign: center ? TextAlign.center : TextAlign.right,
      style: TextStyle(fontSize: size, height: 1.9, color: AppColors.gold, fontWeight: FontWeight.w600),
    );

class _NamesView extends StatelessWidget {
  final Map<String, dynamic> data;
  const _NamesView({required this.data});
  @override
  Widget build(BuildContext context) {
    final names = (data['names'] as List?) ?? const [];
    if (names.isEmpty) return _empty(L.t('no_results'));
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      itemCount: names.length,
      itemBuilder: (c, i) {
        final n = (names[i] as Map).cast<String, dynamic>();
        final q = (n['q'] as List?) ?? const [];
        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('${i + 1}. ${n['tr'] ?? ''}',
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                  if ((n['uc'] ?? '').toString().isNotEmpty)
                    Text(n['uc'].toString(), style: TextStyle(color: AppColors.muted(context), fontSize: 12)),
                  Text(n['me'] ?? n['mean'] ?? '',
                      style: TextStyle(color: AppColors.blueRef(context), fontWeight: FontWeight.w600)),
                ])),
                const SizedBox(width: 10),
                _ar(n['ar']?.toString() ?? '', size: 22, center: true),
              ]),
              if ((n['mean'] ?? '').toString().isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(n['mean'].toString(),
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: AppColors.gold, fontSize: 12.5)),
                ),
              if ((n['desc'] ?? '').toString().isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(n['desc'].toString(), style: const TextStyle(fontSize: 12.5, height: 1.7)),
                ),
              if (q.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Wrap(spacing: 6, runSpacing: 6, children: [
                    for (final r in q.take(4))
                      ActionChip(
                        label: Text('$r', style: const TextStyle(fontSize: 10.5)),
                        onPressed: () {
                          final s = int.tryParse('$r'.split(':').first);
                          if (s != null) {
                            Navigator.of(context).push(MaterialPageRoute(
                                builder: (_) => ReaderScreen(surahId: s)));
                          }
                        },
                      ),
                  ]),
                ),
            ]),
          ),
        );
      },
    );
  }
}

class _DuasView extends StatelessWidget {
  final Map<String, dynamic> data;
  const _DuasView({required this.data});
  @override
  Widget build(BuildContext context) {
    final cats = (data['categories'] as List?) ?? const [];
    if (cats.isEmpty) return _empty(L.t('no_results'));
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      itemCount: cats.length,
      itemBuilder: (c, i) {
        final cat = (cats[i] as Map).cast<String, dynamic>();
        final items = (cat['items'] as List?) ?? const [];
        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          child: ExpansionTile(
            title: Text('${cat['icon'] ?? ''} ${cat['cat'] ?? ''}',
                style: const TextStyle(fontWeight: FontWeight.w800)),
            subtitle: Text('${items.length}', style: TextStyle(color: AppColors.muted(context), fontSize: 11)),
            childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
            children: [
              for (final it in items)
                Builder(builder: (context) {
                  final m = (it as Map).cast<String, dynamic>();
                  return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                    const SizedBox(height: 10),
                    Text(m['t']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    _ar(m['ar']?.toString() ?? '', size: 19),
                    if ((m['uc'] ?? '').toString().isNotEmpty)
                      Text('উচ্চারণ: ${m['uc']}', style: TextStyle(color: AppColors.muted(context), fontSize: 11.5)),
                    if ((m['bn'] ?? '').toString().isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(m['bn'].toString(), style: const TextStyle(fontSize: 13, height: 1.7)),
                      ),
                    if ((m['src'] ?? '').toString().isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(m['src'].toString(),
                            style: TextStyle(color: AppColors.gold, fontSize: 10.5)),
                      ),
                    const Divider(height: 18),
                  ]);
                }),
            ],
          ),
        );
      },
    );
  }
}

class _LearnView extends StatelessWidget {
  final Map<String, dynamic> data;
  const _LearnView({required this.data});
  @override
  Widget build(BuildContext context) {
    final guides = (data['guides'] as List?) ?? const [];
    if (guides.isEmpty) return _empty(L.t('no_results'));
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      itemCount: guides.length,
      itemBuilder: (c, i) {
        final g = (guides[i] as Map).cast<String, dynamic>();
        final steps = (g['steps'] as List?) ?? const [];
        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          child: ExpansionTile(
            title: Text('${g['icon'] ?? ''} ${g['t'] ?? ''}',
                style: const TextStyle(fontWeight: FontWeight.w800)),
            subtitle: Text(g['sub']?.toString() ?? '',
                style: TextStyle(color: AppColors.muted(context), fontSize: 11.5)),
            childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
            children: [
              if ((g['intro'] ?? '').toString().isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 4, bottom: 6),
                  child: Text(g['intro'].toString(), style: const TextStyle(fontSize: 12.5, height: 1.7)),
                ),
              for (var j = 0; j < steps.length; j++)
                Builder(builder: (context) {
                  final st = (steps[j] as Map).cast<String, dynamic>();
                  return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                    const Divider(height: 14),
                    Text('${j + 1}. ${st['h'] ?? ''}',
                        style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.gold)),
                    if ((st['p'] ?? '').toString().isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 3),
                        child: Text(st['p'].toString(), style: const TextStyle(fontSize: 12.5, height: 1.65)),
                      ),
                    if ((st['ar'] ?? '').toString().isNotEmpty) _ar(st['ar'].toString(), size: 18),
                    if ((st['uc'] ?? '').toString().isNotEmpty)
                      Text('উচ্চারণ: ${st['uc']}', style: TextStyle(color: AppColors.muted(context), fontSize: 11)),
                    if ((st['src'] ?? '').toString().isNotEmpty)
                      Text(st['src'].toString(), style: TextStyle(color: AppColors.muted(context), fontSize: 10.5)),
                  ]);
                }),
            ],
          ),
        );
      },
    );
  }
}

class _DailyView extends StatelessWidget {
  final Map<String, dynamic> data;
  const _DailyView({required this.data});
  @override
  Widget build(BuildContext context) {
    final ayahs = (data['ayahs'] as List?) ?? const [];
    final hadith = (data['hadith'] as List?) ?? const [];
    if (ayahs.isEmpty && hadith.isEmpty) return _empty(L.t('no_results'));
    final day = DateTime.now().difference(DateTime(DateTime.now().year)).inDays;
    final ay = ayahs.isEmpty ? <String, dynamic>{} : (ayahs[day % ayahs.length] as Map).cast<String, dynamic>();
    final hd = hadith.isEmpty ? <String, dynamic>{} : (hadith[day % hadith.length] as Map).cast<String, dynamic>();
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Text(L.t('today_ayah'),
                  style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              _ar(ay['ar']?.toString() ?? ''),
              const SizedBox(height: 6),
              Text(ay['bn']?.toString() ?? '', style: const TextStyle(fontSize: 13.5, height: 1.7)),
              if (ay['s'] != null)
                Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton(
                    onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                        builder: (_) => ReaderScreen(surahId: (ay['s'] as num).toInt()))),
                    child: Text('${ay['s']}:${ay['a']} →'),
                  ),
                ),
            ]),
          ),
        ),
        const SizedBox(height: 10),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Text(L.t('daily'), style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              Text(hd['t']?.toString() ?? '', style: const TextStyle(fontSize: 14, height: 1.7)),
              if ((hd['src'] ?? '').toString().isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(hd['src'].toString(),
                      style: TextStyle(color: AppColors.muted(context), fontSize: 11)),
                ),
            ]),
          ),
        ),
        const SizedBox(height: 10),
        ExpansionTile(
          title: Text('${ayahs.length} ${L.t('today_ayah')}'),
          children: [
            for (final x in ayahs)
              Builder(builder: (context) {
                final m = (x as Map).cast<String, dynamic>();
                return ListTile(
                  title: _ar(m['ar']?.toString() ?? '', size: 17),
                  subtitle: Text(m['bn']?.toString() ?? '', style: const TextStyle(fontSize: 12)),
                  onTap: m['s'] == null
                      ? null
                      : () => Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => ReaderScreen(surahId: (m['s'] as num).toInt()))),
                );
              }),
          ],
        ),
      ],
    );
  }
}

class _TopicsView extends StatelessWidget {
  final Map<String, dynamic> data;
  const _TopicsView({required this.data});
  @override
  Widget build(BuildContext context) {
    final topics = (data['topics'] as List?) ?? const [];
    if (topics.isEmpty) return _empty(L.t('no_results'));
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      itemCount: topics.length,
      itemBuilder: (c, i) {
        final t = (topics[i] as Map).cast<String, dynamic>();
        final items = (t['items'] as List?) ?? const [];
        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          child: ExpansionTile(
            title: Text('${t['icon'] ?? ''} ${t['t'] ?? ''}',
                style: const TextStyle(fontWeight: FontWeight.w800)),
            subtitle: Text('${items.length}', style: TextStyle(color: AppColors.muted(context), fontSize: 11)),
            childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
            children: [
              for (final it in items)
                Builder(builder: (context) {
                  final m = (it as Map).cast<String, dynamic>();
                  return InkWell(
                    onTap: m['s'] == null
                        ? null
                        : () => Navigator.of(context).push(MaterialPageRoute(
                            builder: (_) => ReaderScreen(surahId: (m['s'] as num).toInt()))),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                      const Divider(height: 14),
                      _ar(m['ar']?.toString() ?? '', size: 18),
                      Text(m['bn']?.toString() ?? '', style: const TextStyle(fontSize: 12.5, height: 1.65)),
                      Text('${m['s']}:${m['a']} →',
                          style: TextStyle(color: AppColors.blueRef(context), fontSize: 11)),
                    ]),
                  );
                }),
            ],
          ),
        );
      },
    );
  }
}
