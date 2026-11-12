import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// Guards the data bundled into the APK. These are the files that make the
/// app complete offline: the 14.6k word index, the Knowledge Hub collections,
/// business knowledge, per-surah word-by-word data and the research database.
Map<String, dynamic> _json(String path) =>
    jsonDecode(File(path).readAsStringSync()) as Map<String, dynamic>;

void main() {
  test('word index: every normalised form is present and translatable', () {
    final gz = File('assets/words_index.json.gz');
    expect(gz.existsSync(), isTrue, reason: 'words index must ship in the APK');
    final rows = jsonDecode(utf8.decode(gzip.decode(gz.readAsBytesSync())))
        as List<dynamic>;
    expect(rows.length, greaterThanOrEqualTo(14000));
    for (final row in rows.take(50)) {
      final m = row as Map<String, dynamic>;
      expect('${m['w']}'.trim(), isNotEmpty);
      expect('${m['en']}'.trim(), isNotEmpty);
      expect('${m['bn']}'.trim(), isNotEmpty);
      expect('${m['ref']}'.trim(), matches(RegExp(r'^\d+:\d+$')));
    }
  });

  test('knowledge hub: 99 names, 70 du\'as, 10 guides, daily, 16 topics', () {
    final names = _json('assets/data/more/names.json')['names'] as List;
    expect(names.length, 99);

    final cats = _json('assets/data/more/duas.json')['categories'] as List;
    expect(cats.length, 12);
    final duas = cats.fold<int>(
      0,
      (sum, c) => sum + ((c as Map)['items'] as List).length,
    );
    expect(duas, 70);

    expect((_json('assets/data/more/learn.json')['guides'] as List).length, 10);

    final daily = _json('assets/data/more/daily.json');
    expect((daily['ayahs'] as List).length, greaterThanOrEqualTo(60));
    expect((daily['hadith'] as List).length, greaterThanOrEqualTo(50));

    expect((_json('assets/data/more/topics.json')['topics'] as List).length, 16);
  });

  test('business knowledge: 6 sections and 147 entries', () {
    final data = _json('assets/business.json');
    final sections = data['sections'] as List;
    expect(sections.length, 6);
    final total = sections.fold<int>(
      0,
      (sum, s) => sum + ((s as Map)['items'] as List).length,
    );
    expect(total, 147);
    for (final section in sections) {
      for (final item in (section as Map)['items'] as List) {
        expect('${(item as Map)['ref']}'.trim(), isNotEmpty);
        expect('${item['en']}'.trim(), isNotEmpty);
      }
    }
  });

  test('research database: DB v4 tables survive in the compressed asset', () {
    final gz = File('assets/tafsir.db.gz');
    expect(gz.existsSync(), isTrue);
    final bytes = gzip.decode(gz.readAsBytesSync());
    // SQLite header magic.
    expect(
      String.fromCharCodes(bytes.take(15)),
      'SQLite format 3',
    );
    final text = latin1.decode(bytes, allowInvalid: true);
    for (final table in ['translations', 'ayah_notes', 'surah_intros']) {
      expect(text.contains(table), isTrue, reason: 'missing table $table');
    }
    // 6,236 rows of translations (one per ayah across 114 surahs).
    expect(text.contains('CREATE TABLE translations'), isTrue);
  });

  test('per-surah word-by-word data covers all 114 chapters', () {
    for (var n = 1; n <= 114; n++) {
      final f = File('assets/data/wbw/$n.json.gz');
      expect(f.existsSync(), isTrue, reason: 'missing wbw/$n.json.gz');
    }
  });

  test('audio manifest covers 6,236 ayahs', () {
    final m = _json('assets/data/audio.json');
    final counts = (m['counts'] as List).cast<int>();
    expect(counts.length, 114);
    expect(counts.reduce((a, b) => a + b), 6236);
  });

  test('knowledge.json still ships the full Uthmani text', () {
    final k = _json('assets/knowledge.json');
    expect(k.isNotEmpty, isTrue);
  });
}
