import 'package:flutter_test/flutter_test.dart';
import 'package:quran_tafsir/knowledge.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    await Knowledge.i.load();
  });

  test('ships the full Uthmani text', () {
    expect(Knowledge.i.ayahCount(1), 7);
    expect(Knowledge.i.ayahCount(2), 286);
    expect(Knowledge.i.ayahCount(114), 6);
    expect(Knowledge.i.ayahText(1, 1), contains('بِسْمِ'));
  });

  test('ayah of the day is deterministic and non-empty', () {
    final a = Knowledge.i.ayahOfDay(DateTime.utc(2026, 1, 1));
    final b = Knowledge.i.ayahOfDay(DateTime.utc(2026, 1, 1));
    expect(a['ar'], isNotEmpty);
    expect(a['surah'], b['surah']);
    expect(a['ayah'], b['ayah']);
  });

  test('normAr strips diacritics and unifies alef', () {
    expect(normAr('بِسْمِ'), 'بسم');
    expect(normAr('أَحَد'), normAr('احد'));
  });
}
