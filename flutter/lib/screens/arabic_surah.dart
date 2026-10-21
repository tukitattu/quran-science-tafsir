import 'package:flutter/material.dart';

import '../knowledge.dart';
import 'read.dart' show AppColors;

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

  @override
  void initState() {
    super.initState();
    _load();
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
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _count == 0
              ? const Center(child: Text('Arabic text is not available.'))
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                  itemCount: _count,
                  itemBuilder: (context, i) => _AyahRow(
                    number: i + 1,
                    text: Knowledge.i.ayahText(widget.surahId, i + 1),
                  ),
                ),
    );
  }
}

class _AyahRow extends StatelessWidget {
  final int number;
  final String text;
  const _AyahRow({required this.number, required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0x14000000))),
      ),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 34,
          height: 34,
          margin: const EdgeInsets.only(top: 8),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: AppColors.gold.withValues(alpha: .12),
            shape: BoxShape.circle,
          ),
          child: Text('$number',
              style: const TextStyle(
                  color: AppColors.gold,
                  fontSize: 11,
                  fontWeight: FontWeight.w700)),
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
      ]),
    );
  }
}
