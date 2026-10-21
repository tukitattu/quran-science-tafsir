import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Returns the preferences store, or null when the platform plugin is
/// unavailable. Preferences are a convenience (last page, visited count);
/// losing them must never stop the reader from opening.
Future<SharedPreferences?> prefsOrNull() async {
  try {
    return await SharedPreferences.getInstance();
  } catch (e) {
    debugPrint('shared_preferences unavailable: $e');
    return null;
  }
}
