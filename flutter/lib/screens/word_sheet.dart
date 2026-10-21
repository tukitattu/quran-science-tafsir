import 'package:flutter/material.dart';

import '../knowledge.dart';
import '../player.dart';
import '../wbw.dart';
import 'read.dart' show AppColors;

/// Bottom sheet with the word-by-word meanings of one ayah.
/// Tap a word to hear it; meanings show Arabic, transliteration, EN and বাংলা.
Future<void> showWordSheet(BuildContext context,
    {required int surah, required int ayah}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => WordSheet(surah: surah, ayah: ayah),
  );
}

class WordSheet extends StatefulWidget {
  final int surah, ayah;
  const WordSheet({super.key, required this.surah, required this.ayah});

  @override
  State<WordSheet> createState() => _WordSheetState();
}

class _WordSheetState extends State<WordSheet> {
  Future<List<WbwWord>>? _future;
  int _sel = 0;

  @override
  void initState() {
    super.initState();
    _future = WbwStore.words(widget.surah, widget.ayah);
  }

  void _tap(List<WbwWord> words, int i) {
    setState(() => _sel = i);
    final w = words[i];
    if (w.hasAudio) TilawahPlayer.instance.playWord(w.audio);
  }

  @override
  Widget build(BuildContext context) {
    final ayahText = Knowledge.i.ayahText(widget.surah, widget.ayah);
    return Container(
      constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.78),
      decoration: const BoxDecoration(
        color: Color(0xFFFFFDF7),
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 14,
          bottom: MediaQuery.of(context).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.ink.withValues(alpha: .15),
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(children: [
              Text('Word by word',
                  style: TextStyle(
                      color: AppColors.gold,
                      fontWeight: FontWeight.w800,
                      fontSize: 13)),
              const Spacer(),
              Text('${widget.surah}:${widget.ayah}',
                  style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 12,
                      fontWeight: FontWeight.w700)),
              const SizedBox(width: 6),
              IconButton(
                visualDensity: VisualDensity.compact,
                icon: const Icon(Icons.close, size: 18),
                onPressed: () => Navigator.of(context).maybePop(),
              ),
            ]),
            if (ayahText.isNotEmpty)
              Text(ayahText,
                  textDirection: TextDirection.rtl,
                  textAlign: TextAlign.right,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      fontSize: 20,
                      height: 1.9,
                      color: AppColors.goldDeep)),
            const SizedBox(height: 6),
            Flexible(
              child: FutureBuilder<List<WbwWord>>(
                future: _future,
                builder: (context, snap) {
                  if (snap.connectionState != ConnectionState.done) {
                    return const Padding(
                      padding: EdgeInsets.all(24),
                      child: Center(child: CircularProgressIndicator()),
                    );
                  }
                  final words = snap.data ?? const <WbwWord>[];
                  if (words.isEmpty) {
                    return const Padding(
                      padding: EdgeInsets.all(20),
                      child: Text(
                        'Word meanings for this ayah are not available yet.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppColors.muted),
                      ),
                    );
                  }
                  final i = _sel.clamp(0, words.length - 1);
                  final w = words[i];
                  return ListView(
                    shrinkWrap: true,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.goldBright.withValues(alpha: .16),
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: Text(w.text,
                                      textDirection: TextDirection.rtl,
                                      textAlign: TextAlign.right,
                                      style: const TextStyle(
                                          fontSize: 26,
                                          height: 1.8,
                                          color: AppColors.ink)),
                                ),
                                const SizedBox(width: 8),
                                if (w.hasAudio)
                                  IconButton(
                                    tooltip: 'Hear the word',
                                    onPressed: () =>
                                        TilawahPlayer.instance.playWord(w.audio),
                                    icon: const Icon(Icons.volume_up_rounded,
                                        color: AppColors.gold),
                                  ),
                              ],
                            ),
                            if (w.translit.isNotEmpty)
                              Text(w.translit,
                                  style: const TextStyle(
                                      color: AppColors.muted,
                                      fontStyle: FontStyle.italic,
                                      fontSize: 12)),
                            const SizedBox(height: 6),
                            if (w.en.isNotEmpty)
                              Text('EN · ${w.en}',
                                  style: const TextStyle(
                                      fontSize: 14, height: 1.5)),
                            if (w.bn.isNotEmpty)
                              Text('বাংলা · ${w.bn}',
                                  style: const TextStyle(
                                      fontSize: 14,
                                      height: 1.5,
                                      color: AppColors.muted)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          for (var k = 0; k < words.length; k++)
                            InkWell(
                              borderRadius: BorderRadius.circular(12),
                              onTap: () => _tap(words, k),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: k == i
                                      ? AppColors.gold.withValues(alpha: .22)
                                      : AppColors.ink.withValues(alpha: .05),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                      color: k == i
                                          ? AppColors.gold
                                          : Colors.transparent),
                                ),
                                child: Text(words[k].text,
                                    textDirection: TextDirection.rtl,
                                    style: TextStyle(
                                        fontSize: 17,
                                        color: k == i
                                            ? AppColors.goldDeep
                                            : AppColors.ink)),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
