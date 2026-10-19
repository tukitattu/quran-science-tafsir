import 'package:flutter_test/flutter_test.dart';

// The real app boots with platform channels (sqflite, notifications), which
// need bindings CI unit tests can't provide — keep a trivial placeholder here
// so `flutter create` (run in CI) never regenerates a broken default test.
void main() {
  test('placeholder', () => expect(true, isTrue));
}
