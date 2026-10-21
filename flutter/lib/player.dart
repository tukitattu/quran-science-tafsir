import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:just_audio/just_audio.dart';

import 'prefs.dart';

const _iconGold = Color(0xFFA67C1B);
const _iconMuted = Color(0xFF5D6875);

/// One reciter entry from assets/data/audio.json.
class Reciter {
  final String id, en, bn;
  final String? ayah, fallback, surah;
  const Reciter(
      {required this.id,
      required this.en,
      required this.bn,
      this.ayah,
      this.fallback,
      this.surah});

  factory Reciter.fromJson(Map<String, dynamic> j) => Reciter(
        id: j['id'] as String? ?? '',
        en: j['en'] as String? ?? '',
        bn: j['bn'] as String? ?? '',
        ayah: j['ayah'] as String?,
        fallback: j['fallback'] as String?,
        surah: j['surah'] as String?,
      );
}

/// Snapshot of what the tilawah player is doing right now.
@immutable
class TilawahState {
  /// '', 'full' (whole surah), 'ayah' (chain), 'word'
  final String mode;
  final int surah;
  final int ayah;
  final bool playing;
  final int reciterIndex;
  final bool manifestReady;
  final String? error;

  const TilawahState({
    this.mode = '',
    this.surah = 0,
    this.ayah = 0,
    this.playing = false,
    this.reciterIndex = 0,
    this.manifestReady = false,
    this.error,
  });

  bool get active => mode.isNotEmpty && mode != 'word';
  bool isThisAyah(int s, int a) => mode == 'ayah' && surah == s && ayah == a;

  TilawahState copyWith({
    String? mode,
    int? surah,
    int? ayah,
    bool? playing,
    int? reciterIndex,
    bool? manifestReady,
    String? error,
    bool clearError = false,
  }) =>
      TilawahState(
        mode: mode ?? this.mode,
        surah: surah ?? this.surah,
        ayah: ayah ?? this.ayah,
        playing: playing ?? this.playing,
        reciterIndex: reciterIndex ?? this.reciterIndex,
        manifestReady: manifestReady ?? this.manifestReady,
        error: clearError ? null : (error ?? this.error),
      );
}

/// Streams surah/ayah/word audio from free public CDNs (never bundled).
/// Singleton: one audio element for the whole app.
class TilawahPlayer {
  TilawahPlayer._();
  static final TilawahPlayer instance = TilawahPlayer._();

  final JustAudio _p = JustAudio();
  final StreamController<TilawahState> _events =
      StreamController<TilawahState>.broadcast();

  Map<String, dynamic>? _manifest;
  Future<void>? _loading;
  List<int> _counts = const [];
  List<int> _offsets = const [];
  List<Reciter> _reciters = const [];
  String _surahTmpl = '';

  TilawahState _st = const TilawahState();
  int _token = 0;
  bool _triedFallback = false;
  bool _endedHandled = false;

  Stream<TilawahState> get events => _events.stream;
  TilawahState get state => _st;
  List<Reciter> get reciters => _reciters;

  Reciter? get _reciter => (_st.reciterIndex >= 0 && _st.reciterIndex < _reciters.length)
      ? _reciters[_st.reciterIndex]
      : null;

  void _emit([TilawahState? next]) {
    if (next != null) _st = next;
    if (!_events.isClosed) _events.add(_st);
  }

  Future<void> _ensure() async {
    if (_manifest != null) return;
    _loading ??= () async {
      final raw = await rootBundle.loadString('assets/data/audio.json');
      final m = jsonDecode(raw) as Map<String, dynamic>;
      _counts = (m['counts'] as List).map((e) => e as int).toList();
      _offsets = (m['offsets'] as List).map((e) => e as int).toList();
      _reciters = (m['reciters'] as List)
          .map((e) => Reciter.fromJson(e as Map<String, dynamic>))
          .toList();
      _surahTmpl = (m['surah'] as String?) ?? '';
      _manifest = m;
      var idx = 0;
      try {
        final sp = await prefsOrNull();
        idx = sp?.getInt('tafsir-reciter') ?? 0;
      } catch (_) {}
      if (idx < 0 || idx >= _reciters.length) idx = 0;
      _emit(_st.copyWith(reciterIndex: idx, manifestReady: true, clearError: true));
    }();
    return _loading!;
  }

  int ayahCount(int s) => (s >= 1 && s <= _counts.length) ? _counts[s - 1] : 0;

  String _pad(int n) => n.toString().padLeft(3, '0');

  String _ayahUrl(int s, int a) {
    final r = _reciter;
    if (r == null) return '';
    final g = _offsets[s - 1] + a;
    final t = r.ayah;
    if (t != null && t.isNotEmpty) return t.replaceAll('{g}', '$g');
    final f = r.fallback;
    if (f != null && f.isNotEmpty) {
      return f.replaceAll('{padded}', '${_pad(s)}${_pad(a)}');
    }
    return '';
  }

  void _listenOnce() {
    _p.playbackEventStream.listen((ev) {
      if (ev.processingState == ProcessingState.completed) {
        if (_endedHandled) return;
        _endedHandled = true;
        _onEnded();
      } else if (ev.processingState == ProcessingState.ready) {
        _endedHandled = false;
      }
    });
    _p.playerStateStream.listen((s) {
      _emit(_st.copyWith(playing: s.playing));
    });
  }

  Future<void> _playCurrent() async {
    final t = ++_token;
    final s = _st.surah, a = _st.ayah;
    String url;
    if (_st.mode == 'full') {
      url = _surahTmpl.replaceAll('{s}', '$s');
    } else {
      url = _ayahUrl(s, a);
    }
    if (url.isEmpty) {
      _finish();
      return;
    }
    try {
      await _p.setAudioSource(AudioSource.uri(Uri.parse(url)));
      if (t != _token) return; // a newer tap superseded this one
      await _p.play();
      if (t != _token) return;
      _emit(_st.copyWith(playing: true, clearError: true));
    } catch (e) {
      if (t != _token) return;
      debugPrint('tilawah play failed ($url): $e');
      final r = _reciter;
      if (!_triedFallback && r != null && r.fallback != null && a > 0) {
        _triedFallback = true;
        final fb = r.fallback!
            .replaceAll('{padded}', '${_pad(s)}${_pad(a)}');
        try {
          await _p.setAudioSource(AudioSource.uri(Uri.parse(fb)));
          if (t != _token) return;
          await _p.play();
          if (t != _token) return;
          _emit(_st.copyWith(playing: true, clearError: true));
          return;
        } catch (e2) {
          debugPrint('tilawah fallback failed: $e2');
        }
      }
      // give up on this file: skip forward in a chain, else stop
      if (_st.mode == 'ayah' && a < ayahCount(s)) {
        _triedFallback = false;
        _emit(_st.copyWith(ayah: a + 1));
        _playCurrent();
      } else {
        _emit(_st.copyWith(error: 'audio unavailable', clearError: false));
        _finish();
      }
    }
  }

  void _onEnded() {
    final s = _st.surah, a = _st.ayah;
    if (_st.mode == 'ayah' && a < ayahCount(s)) {
      _triedFallback = false;
      _emit(_st.copyWith(ayah: a + 1));
      _playCurrent();
      return;
    }
    _finish();
  }

  void _finish() {
    _token++;
    _p.stop();
    _emit(TilawahState(
        reciterIndex: _st.reciterIndex, manifestReady: _st.manifestReady));
  }

  Future<void> playSurah(int s) async {
    bind();
    try {
      await _ensure();
    } catch (e) {
      debugPrint('audio manifest: $e');
      _emit(_st.copyWith(error: 'audio unavailable'));
      return;
    }
    _triedFallback = false;
    _endedHandled = false;
    _emit(TilawahState(
        mode: (_reciter?.surah != null && _surahTmpl.isNotEmpty) ? 'full' : 'ayah',
        surah: s,
        ayah: 1,
        reciterIndex: _st.reciterIndex,
        manifestReady: true));
    await _playCurrent();
  }

  Future<void> playAyah(int s, int a) async {
    bind();
    try {
      await _ensure();
    } catch (e) {
      debugPrint('audio manifest: $e');
      _emit(_st.copyWith(error: 'audio unavailable'));
      return;
    }
    _triedFallback = false;
    _endedHandled = false;
    _emit(TilawahState(
        mode: 'ayah',
        surah: s,
        ayah: a,
        reciterIndex: _st.reciterIndex,
        manifestReady: true));
    await _playCurrent();
  }

  Future<void> playWord(String url) async {
    bind();
    try {
      await _ensure();
    } catch (_) {
      /* word audio does not need the manifest */
    }
    _triedFallback = false;
    _endedHandled = false;
    final t = ++_token;
    _emit(TilawahState(
        mode: 'word',
        reciterIndex: _st.reciterIndex,
        manifestReady: _st.manifestReady));
    try {
      final u = url.startsWith('http') ? url : 'https://audio.qurancdn.com/$url';
      await _p.setAudioSource(AudioSource.uri(Uri.parse(u)));
      if (t != _token) return;
      await _p.play();
      if (t != _token) return;
      _emit(_st.copyWith(playing: true));
    } catch (e) {
      debugPrint('word audio failed: $e');
      _emit(_st.copyWith(error: 'audio unavailable'));
    }
  }

  Future<void> toggle() async {
    if (_st.mode.isEmpty) return;
    if (_st.playing) {
      await _p.pause();
      _emit(_st.copyWith(playing: false));
    } else if (_p.audioSource != null) {
      try {
        await _p.play();
        _emit(_st.copyWith(playing: true));
      } catch (e) {
        debugPrint('resume failed: $e');
        _playCurrent();
      }
    } else {
      await _playCurrent();
    }
  }

  /// Play/pause helper for a specific surah (used by buttons that show
  /// a per-surah state): if this surah is loaded, toggle it; else start it.
  Future<void> toggleForSurah(int s) async {
    if (_st.active && _st.surah == s) return toggle();
    return playSurah(s);
  }

  Future<void> stop() async => _finish();

  Future<void> next() async {
    if (_st.mode != 'ayah') return;
    if (_st.ayah >= ayahCount(_st.surah)) return;
    _triedFallback = false;
    _emit(_st.copyWith(ayah: _st.ayah + 1));
    await _playCurrent();
  }

  Future<void> prev() async {
    if (_st.mode != 'ayah') return;
    if (_st.ayah <= 1) return;
    _triedFallback = false;
    _emit(_st.copyWith(ayah: _st.ayah - 1));
    await _playCurrent();
  }

  Future<void> cycleReciter() async {
    if (_reciters.isEmpty) return;
    final i = (_st.reciterIndex + 1) % _reciters.length;
    _emit(_st.copyWith(reciterIndex: i));
    try {
      final sp = await prefsOrNull();
      await sp?.setInt('tafsir-reciter', i);
    } catch (e) {
      debugPrint('reciter pref: $e');
    }
    if (_st.mode == 'ayah') {
      _triedFallback = false;
      await _playCurrent();
    } else if (_st.mode == 'full') {
      await playSurah(_st.surah);
    }
  }

  Future<void> loadManifest() => _ensure();

  bool _bound = false;

  /// Attach playback listeners (idempotent); called by play* and widgets.
  void bind() {
    if (_bound) return;
    _bound = true;
    _listenOnce();
  }
}

/// Play/pause icon that follows the player for one surah.
class TilawahIcon extends StatelessWidget {
  final int surah;
  final double size;
  const TilawahIcon({super.key, required this.surah, this.size = 22});

  @override
  Widget build(BuildContext context) {
    final p = TilawahPlayer.instance..bind();
    return StreamBuilder<TilawahState>(
      stream: p.events,
      initialData: p.state,
      builder: (context, snap) {
        final st = snap.data ?? p.state;
        final on = st.active && st.surah == surah && st.playing;
        return Icon(
          on ? Icons.pause_circle_filled : Icons.play_circle_outline,
          size: size,
          color: on ? _iconGold : _iconMuted,
        );
      },
    );
  }
}
