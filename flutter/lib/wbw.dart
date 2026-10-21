import 'dart:convert';
import 'dart:io' show gzip;

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart' show rootBundle;

/// One word of a word-by-word edition (Arabic + EN + BN + transliteration
/// + an optional short audio clip). Source: quran.com v4 word data.
class WbwWord {
  final String text, en, bn, translit, audio;
  const WbwWord({
    required this.text,
    required this.en,
    required this.bn,
    required this.translit,
    required this.audio,
  });

  bool get hasAudio => audio.isNotEmpty;

  factory WbwWord.fromJson(Map<String, dynamic> j) => WbwWord(
        text: (j['t'] ?? '') as String,
        en: (j['en'] ?? '') as String,
        bn: (j['bn'] ?? '') as String,
        translit: (j['tr'] ?? '') as String,
        audio: (j['au'] ?? '') as String,
      );
}

/// All words of one surah, keyed by ayah number (1-based).
class WbwSurah {
  final int surah;
  final Map<int, List<WbwWord>> ayahs;
  const WbwSurah({required this.surah, required this.ayahs});

  List<WbwWord> words(int ayah) => ayahs[ayah] ?? const [];
}

/// Loads and caches the gzipped per-surah word files bundled in assets.
class WbwStore {
  WbwStore._();
  static final Map<int, WbwSurah> _cache = {};

  static Future<WbwSurah?> load(int surah) async {
    final hit = _cache[surah];
    if (hit != null) return hit;
    try {
      final data = await rootBundle.load('assets/data/wbw/$surah.json.gz');
      final bytes =
          data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes);
      final decoded = jsonDecode(utf8.decode(gzip.decode(bytes)))
          as Map<String, dynamic>;
      final map = <int, List<WbwWord>>{};
      for (final row in (decoded['ayahs'] as List)) {
        final r = row as Map<String, dynamic>;
        final a = (r['a'] as num).toInt();
        map[a] = [
          for (final w in (r['w'] as List))
            WbwWord.fromJson(w as Map<String, dynamic>)
        ];
      }
      final out = WbwSurah(surah: surah, ayahs: map);
      _cache[surah] = out;
      return out;
    } catch (e) {
      debugPrint('wbw load failed (surah $surah): $e');
      return null;
    }
  }

  static Future<List<WbwWord>> words(int surah, int ayah) async =>
      (await load(surah))?.words(ayah) ?? const [];
}
