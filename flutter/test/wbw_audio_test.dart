import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('audio manifest: 114 counts sum to 6236 with valid offsets', () {
    final m = jsonDecode(File('assets/data/audio.json').readAsStringSync())
        as Map<String, dynamic>;
    final counts = (m['counts'] as List).cast<int>();
    final offsets = (m['offsets'] as List).cast<int>();
    expect(counts.length, 114);
    expect(offsets.length, 114);
    expect(counts.reduce((a, b) => a + b), 6236);
    expect(offsets.first, 0);
    for (var i = 0; i < 113; i++) {
      expect(offsets[i + 1], offsets[i] + counts[i],
          reason: 'offset[$i + 1] must be cumulative');
    }
    final reciters = (m['reciters'] as List).cast<Map<String, dynamic>>();
    expect(reciters.length, greaterThanOrEqualTo(4));
    expect(reciters.first['surah'], contains('{s}'),
        reason: 'first reciter streams whole surahs');
    expect(reciters.first['ayah'], contains('{g}'),
        reason: 'per-ayah template uses the global ayah number');
    expect((m['wordBase'] ?? '').toString(), isNotEmpty);
  });

  test('wbw: surah 1 has 7 ayahs, basmala row has 4 words', () {
    final json = jsonDecode(utf8
            .decode(gzip.decode(File('assets/data/wbw/1.json.gz').readAsBytesSync())))
        as Map<String, dynamic>;
    expect(json['surah'], 1);
    final ayahs = (json['ayahs'] as List).cast<Map<String, dynamic>>();
    expect(ayahs.length, 7);
    expect(ayahs.first['a'], 1);
    final words = (ayahs.first['w'] as List).cast<Map<String, dynamic>>();
    expect(words.length, 4, reason: 'bismillah = 4 words');
    for (final w in words) {
      expect((w['t'] ?? '').toString(), isNotEmpty);
      expect((w['en'] ?? '').toString(), isNotEmpty);
      expect((w['bn'] ?? '').toString(), isNotEmpty);
      expect((w['tr'] ?? '').toString(), isNotEmpty);
      expect((w['au'] ?? '').toString(), endsWith('.mp3'));
    }
  });

  test('wbw: all 114 files parse and match quran_ar ayah counts', () {
    final quran = jsonDecode(
            File('assets/data/quran_ar.json').readAsStringSync().replaceFirst('\ufeff', ''))
        as Map<String, dynamic>;
    var totalAyahs = 0, totalWords = 0;
    for (var n = 1; n <= 114; n++) {
      final f = File('assets/data/wbw/$n.json.gz');
      expect(f.existsSync(), isTrue, reason: 'missing wbw for surah $n');
      final json = jsonDecode(utf8.decode(gzip.decode(f.readAsBytesSync())))
          as Map<String, dynamic>;
      expect(json['surah'], n);
      final ayahs = (json['ayahs'] as List).cast<Map<String, dynamic>>();
      final expected =
          ((quran['$n'] as Map<String, dynamic>?) ?? <String, dynamic>{}).length;
      expect(ayahs.length, expected, reason: 'surah $n ayah count');
      for (final a in ayahs) {
        final w = (a['w'] as List);
        expect(w, isNotEmpty, reason: 'surah $n ayah ${a['a']} has no words');
        totalWords += w.length;
      }
      totalAyahs += ayahs.length;
    }
    expect(totalAyahs, 6236);
    expect(totalWords, 77429);
  });
}
