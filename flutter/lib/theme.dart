import 'package:flutter/material.dart';

/// Design tokens mirroring the web GLYPH PAPER system: off-white paper,
/// antique gold, humanist sans. Level: one paper, floating pills.
class Paper {
  static const bg = Color(0xFFF8F8F4);
  static const ink = Color(0xFF232B36);
  static const muted = Color(0xFF5D6875);
  static const gold = Color(0xFFA67C1B);
  static const goldBright = Color(0xFFD9B44A);
  static const goldDeep = Color(0xFF5F4A14);
  static const blue = Color(0xFF23638C);
  static const cream = Color(0xFFF1EEE2);

  static ThemeData theme() {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: gold,
        brightness: Brightness.light,
        surface: bg,
      ),
      scaffoldBackgroundColor: bg,
    );
    return base.copyWith(
      textTheme: base.textTheme.apply(
        bodyColor: ink,
        displayColor: ink,
        fontFamily: 'Roboto',
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: bg,
        foregroundColor: ink,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardTheme(
        color: Colors.white.withValues(alpha: 0.72),
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(22),
          side: BorderSide(color: ink.withValues(alpha: 0.08)),
        ),
        margin: const EdgeInsets.only(bottom: 14),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: bg,
        indicatorColor: goldBright.withValues(alpha: 0.25),
        labelTextStyle: const WidgetStatePropertyAll(TextStyle(
            fontSize: 12, fontWeight: FontWeight.w600, color: muted)),
      ),
      chipTheme: base.chipTheme.copyWith(
        backgroundColor: cream,
        side: BorderSide(color: ink.withValues(alpha: 0.10)),
        shape: const StadiumBorder(),
        labelStyle: const TextStyle(color: muted, fontSize: 12),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: gold,
          foregroundColor: const Color(0xFFFFFDF6),
          shape: const StadiumBorder(),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.8),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(999),
          borderSide: BorderSide(color: ink.withValues(alpha: 0.09)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(999),
          borderSide: BorderSide(color: ink.withValues(alpha: 0.09)),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      ),
      dividerTheme: DividerThemeData(color: ink.withValues(alpha: 0.08)),
    );
  }
}
