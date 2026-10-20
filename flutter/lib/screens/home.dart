import 'package:flutter/material.dart';

import '../main.dart';
import 'business_screen.dart';
import 'read.dart';
import 'search_screen.dart';
import 'settings.dart';
import 'words_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});
  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _tab = 0;

  static const _destinations = [
    (icon: Icons.auto_stories_outlined, selected: Icons.auto_stories, label: 'Read'),
    (icon: Icons.search_outlined, selected: Icons.search, label: 'Search'),
    (icon: Icons.translate_outlined, selected: Icons.translate, label: 'Words'),
    (icon: Icons.storefront_outlined, selected: Icons.storefront, label: 'Business'),
    (icon: Icons.settings_outlined, selected: Icons.settings, label: 'Settings'),
  ];

  Widget _page() => [
        const ReadTab(),
        const SearchTab(),
        const WordsTab(),
        const BusinessTab(),
        const SettingsTab(),
      ][_tab];

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: app,
      builder: (context, _) {
        return LayoutBuilder(builder: (context, box) {
          final wide = box.maxWidth >= 760;
          if (!wide) {
            return Scaffold(
              body: _page(),
              bottomNavigationBar: NavigationBar(
                selectedIndex: _tab,
                onDestinationSelected: (i) => setState(() => _tab = i),
                destinations: [
                  for (final d in _destinations)
                    NavigationDestination(
                      icon: Icon(d.icon),
                      selectedIcon: Icon(d.selected),
                      label: d.label,
                    ),
                ],
              ),
            );
          }
          return Scaffold(
            body: Row(children: [
              NavigationRail(
                selectedIndex: _tab,
                labelType: NavigationRailLabelType.all,
                backgroundColor: Colors.white.withValues(alpha: .55),
                indicatorColor: AppColors.gold.withValues(alpha: .18),
                onDestinationSelected: (i) => setState(() => _tab = i),
                leading: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: CircleAvatar(
                    radius: 22,
                    backgroundColor: const Color(0xFFF1EEE2),
                    child: Icon(Icons.menu_book, color: AppColors.gold, size: 24),
                  ),
                ),
                destinations: [
                  for (final d in _destinations)
                    NavigationRailDestination(
                      icon: Icon(d.icon),
                      selectedIcon: Icon(d.selected, color: AppColors.gold),
                      label: Text(d.label),
                    ),
                ],
              ),
              const VerticalDivider(width: 1),
              Expanded(child: _page()),
            ]),
          );
        });
      },
    );
  }
}
