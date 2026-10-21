import 'dart:io';

import 'package:archive/archive.dart' as a;
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:flutter/services.dart' show rootBundle;
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';

/// SQLite access layer. The research database (tafsir.db.gz) ships as an asset
/// and is unpacked into app storage on first launch.
class TafsirDb {
  TafsirDb._();
  static final TafsirDb i = TafsirDb._();
  static const int kVersion = 2;

  Database? _db;

  Future<Database> get db async {
    if (_db != null) return _db!;
    try {
      _db = await _open();
    } catch (e) {
      debugPrint('db open failed ($e) — repacking from asset');
      try {
        final docs = await getApplicationDocumentsDirectory();
        for (final f in [
          File(p.join(docs.path, 'tafsir.db')),
          File(p.join(docs.path, 'db.meta')),
        ]) {
          if (f.existsSync()) f.deleteSync();
        }
      } catch (e) {
        debugPrint('db cleanup failed: $e');
      }
      _db = await _open();
    }
    return _db!;
  }

  Future<Database> _open() async {
    final docs = await getApplicationDocumentsDirectory();
    final dbPath = p.join(docs.path, 'tafsir.db');
    final existing = File(dbPath);
    final assetMeta = File(p.join(docs.path, 'db.meta'));
    final metaOk =
        assetMeta.existsSync() && assetMeta.readAsStringSync() == 'v$kVersion';
    final fileOk = existing.existsSync() && existing.lengthSync() > 65536;
    if (!fileOk || !metaOk) {
      final gz = await rootBundle.load('assets/tafsir.db.gz');
      final bytes = a.GZipDecoder().decodeBytes(
        gz.buffer.asUint8List(gz.offsetInBytes, gz.lengthInBytes),
      );
      if (existing.existsSync()) existing.deleteSync();
      await existing.writeAsBytes(bytes, flush: true);
      assetMeta.writeAsStringSync('v$kVersion');
    }
    return openDatabase(dbPath, readOnly: true);
  }

  Future<List<Map<String, Object?>>> surahs() async {
    return (await db).query('surahs', orderBy: 'id');
  }

  Future<List<Map<String, Object?>>> paras(int surah) async {
    return (await db).query('verses',
        where: 'surah_id = ?', whereArgs: [surah], orderBy: 'id');
  }

  Future<Map<String, Object?>?> tafsirMeta(int surah) async {
    final r = await (await db).query('tafsir',
        where: 'surah_id = ?', whereArgs: [surah], limit: 1);
    return r.isEmpty ? null : r.first;
  }

  Future<List<Map<String, Object?>>> words({int? surah}) async {
    return (await db).query('words',
        where: surah == null ? null : 'surah_id = ?',
        whereArgs: surah == null ? null : [surah],
        orderBy: 'surah_id, id');
  }

  Future<List<Map<String, Object?>>> search(String q,
      {int? surah, bool bengali = false}) async {
    final col = bengali ? 'bn' : 'en';
    return (await db).query('verses',
        where: surah == null
            ? '($col LIKE ? OR en LIKE ? OR bn LIKE ?)'
            : 'surah_id = ? AND ($col LIKE ? OR en LIKE ? OR bn LIKE ?)',
        whereArgs: surah == null
            ? ['%$q%', '%$q%', '%$q%']
            : [surah, '%$q%', '%$q%', '%$q%'],
        limit: 80);
  }

  Future<List<Map<String, Object?>>> altMeaningsFor(int surah, int ayah) async {
    return (await db).query('alt_meanings',
        where: 'ayah_key = ?', whereArgs: ['$surah:$ayah']);
  }

  /// A deterministic ayah-of-the-day across the whole database.
  Future<Map<String, dynamic>> ayahOfTheDay() async {
    final d = await (await db).query('verses',
        columns: ['COUNT(*) AS c'], where: "ar != ''");
    final count = (d.isEmpty ? null : d.first['c'] as int?) ?? 0;
    if (count == 0) return {};
    final dayNum = DateTime.now().difference(DateTime(2024)).inDays;
    final r = await (await db).query('verses',
        where: "ar != ''",
        limit: 1,
        offset: dayNum % count,
        columns: ['surah_id', 'ayah_num', 'ar', 'en', 'bn']);
    if (r.isEmpty) return {};
    final row = r.first;
    final s = await (await db).query('surahs',
        where: 'id = ?', whereArgs: [row['surah_id']], limit: 1);
    return {
      'ar': row['ar'] ?? '',
      'en': row['en'] ?? '',
      'bn': row['bn'] ?? '',
      'ayah': row['ayah_num'],
      'surah': s.isEmpty ? {} : s.first,
    };
  }
}
