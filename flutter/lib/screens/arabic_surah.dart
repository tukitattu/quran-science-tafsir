import 'dart:async';

import 'package:flutter/material.dart';

import '../knowledge.dart';
import '../player.dart';
import 'read.dart' show AppColors;
import 'word_sheet.dart';

/// Arabic-only reading view: the full Uthmani text of one surah, ayah by ayah.
class ArabicSurahScreen extends StatefulWidget {
  final int surahId;
  final String title;
  const ArabicSurahScreen(
      {super.key, required this.surahId, required this.title});

  @override
  State<ArabicSurahScreen> createState() => _ArabicSurahScreenState();
}

class _ArabicSurahScreenState extends State<ArabicSurahScreen> {
  bool _loading = true;
  int _count = 0;
  TilawahState _st = const TilawahState();
  StreamSubscription<TilawahState>? _sub;

  @override
  void initState() {
    super.initState();
    TilawahPlayer.instance.bind();
    _st = TilawahPlayer.instance.state;
    _sub = TilawahPlayer.instance.events.listen((s) {
      if (mounted) setState(() => _st = s);
    });
    _load();
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      await Knowledge.i.load();
    } catch (e) {
      debugPrint('arabic text load failed: $e');
    }
    if (!mounted) return;
    setState(() {
      _count = Knowledge.i.ayahCount(widget.surahId);
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(widget.title,
              style:
                  const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          const Text('النص القرآني بالرسم العثماني',
              style: TextStyle(fontSize: 11, color: AppColors.muted)),
        ]),
        actions: [
          IconButton(
            tooltip: 'Tilawah — play this surah',
            onPressed: () =>
                TilawahPlayer.instance.toggleForSurah(widget.surahId),
            icon: TilawahIcon(surah: widget.surahId),
          ),
          const SizedBox(width: 6),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _count == 0
              ? const Center(child: Text('Arabic text is not available.'))
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                  itemCount: _count,
                  itemBuilder: (context, i) {
                    final n = i + 1;
                    return _AyahRow(
                      number: n,
                      text: Knowledge.i.ayahText(widget.surahId, n),
                      active: _st.isThisAyah(widget.surahId, n),
                      onPlay: () =>
                          TilawahPlayer.instance.playAyah(widget.surahId, n),
                      onWords: () => showWordSheet(context,
                          surah: widget.surahId, ayah: n),
                    );
                  },
                ),
    );
  }
}

class _AyahRow extends StatelessWidget {
  final int number;
  final String text;
  final bool active;
  final VoidCallback onPlay;
  final VoidCallback onWords;
  const _AyahRow({
    required this.number,
    required this.text,
    required this.active,
    required this.onPlay,
    required this.onWords,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: active ? AppColors.goldBright.withValues(alpha: .13) : null,
        borderRadius: BorderRadius.circular(12),
        border: const Border(bottom: BorderSide(color: Color(0x14000000))),
      ),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Tooltip(
          message: 'Play this ayah',
          child: InkWell(
            borderRadius: BorderRadius.circular(999),
            onTap: onPlay,
            child: Container(
              width: 34,
              height: 34,
              margin: const EdgeInsets.only(top: 8),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: active
                    ? AppColors.gold
                    : AppColors.gold.withValues(alpha: .12),
                shape: BoxShape.circle,
              ),
              child: active
                  ? const Icon(Icons.pause, size: 15, color: Colors.white)
                  : Text('$number',
                      style: TextStyle(
                          color: active ? Colors.white : AppColors.gold,
                          fontSize: 11,
                          fontWeight: FontWeight.w700)),
            ),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: SelectableText(
            text,
            textDirection: TextDirection.rtl,
            textAlign: TextAlign.right,
            style: const TextStyle(
              fontSize: 22,
              height: 2.1,
              color: AppColors.ink,
            ),
          ),
        ),
        const SizedBox(width: 4),
        Tooltip(
          message: 'Word meanings',
          child: InkWell(
            borderRadius: BorderRadius.circular(999),
            onTap: onWords,
            child: const Padding(
              padding: EdgeInsets.all(8),
              child: Icon(Icons.translate, size: 17, color: AppColors.muted),
            ),
          ),
        ),
      ]),
    );
  }
}
