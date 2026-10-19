import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quran_tafsir/theme.dart';

void main() {
  test('Paper.theme() builds', () {
    final theme = Paper.theme();
    expect(theme.scaffoldBackgroundColor, const Color(0xFFF8F8F4));
  });
}
