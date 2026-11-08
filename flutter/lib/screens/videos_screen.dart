import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show Clipboard, ClipboardData;

import '../l10n.dart';
import 'read.dart' show AppColors;

class VideoChannel {
  const VideoChannel({required this.key, required this.name, required this.handle, required this.videosUrl, required this.lang});
  final String key, name, handle, videosUrl, lang;
}

class RelatedVideo {
  const RelatedVideo({required this.surah, required this.ayah, required this.title, required this.youtubeId, required this.topic, required this.channel});
  final int surah;
  final String ayah, title, youtubeId, topic, channel;
}

// Curated related videos — mirrors assets/data/ghaur_ofikr_map.js (three channels).
// All IDs verified via YouTube oEmbed (HTTP 200).
const List<VideoChannel> kVideoChannels = [
  VideoChannel(key: 'nak', name: 'NAK Bangla — নোমান আলী খান', handle: '@NAKBangla', videosUrl: 'https://www.youtube.com/@NAKBangla/videos', lang: 'বাংলা'),
  VideoChannel(key: 'qdd', name: 'Dr Sufyan — Quran Daily Dose', handle: '@qurandailydose2985', videosUrl: 'https://www.youtube.com/@qurandailydose2985/videos', lang: 'اردو · English'),
  VideoChannel(key: 'xarya', name: 'Xaryab Haschmi Podcast — زریاب ہاشمی', handle: '@xaryabhaschmiofficial', videosUrl: 'https://www.youtube.com/@xaryabhaschmiofficial/videos', lang: 'اردو · English'),
];

const List<RelatedVideo> kRelatedVideos = [
  RelatedVideo(surah: 2, ayah: '2:255', title: 'আয়াতুল কুরসির লুকানো নকশা || নোমান আলী খান', youtubeId: 'IMzP_NAPlt0', topic: 'Ayatul Kursi — the hidden design', channel: 'nak'),
  RelatedVideo(surah: 2, ayah: '2:186', title: "Maula Ali's (AS) Secret to Talking with Allah! | This Quote will change your Life | Zaryab Hashmi", youtubeId: 'vsdbjEJVCBc', topic: 'Allah is near to the caller who calls upon Me', channel: 'xarya'),
  RelatedVideo(surah: 7, ayah: '7:172', title: 'Why Are We Far From the Quran? The Answer Is Ehd-e-Alast - Zaryab Hashmi', youtubeId: 'ybR-7XHnyaQ', topic: 'Am I not your Lord? — the Ālast covenant', channel: 'xarya'),
  RelatedVideo(surah: 7, ayah: '7:172', title: 'Did Your Soul Choose This Life? The Secret of Alam-e-Arwah Revealed | Zaryab Hashmi', youtubeId: 'vRpjGszCPo4', topic: 'ʿĀlam al-arwāḥ — the world of souls', channel: 'xarya'),
  RelatedVideo(surah: 17, ayah: '17:85', title: 'The Journey of Your Soul (Ruh): From عالمِ ارواح to Barzakh | Quran and Rooh Explained', youtubeId: 'jBWQySK4GmY', topic: 'They ask you concerning the rūḥ', channel: 'qdd'),
  RelatedVideo(surah: 17, ayah: '17:85', title: 'Soul, Body, Spirit: Who Are You Really? Zaryab Hashmi', youtubeId: 'xH95XuNeawE', topic: 'They ask you concerning the rūḥ — command of the Lord', channel: 'xarya'),
  RelatedVideo(surah: 17, ayah: '17:85', title: 'The Truth About \'Rooh\' They Don\'t Want You to Know | Amr-e-Rabbi Explained | Zaryab Hashmi', youtubeId: 'XYkqO1quWk8', topic: 'Amr-e-Rabbi — the rūḥ as command of the Lord', channel: 'xarya'),
  RelatedVideo(surah: 17, ayah: '17:85', title: 'They Asked Rasool Allah ﷺ About the Soul — His Answer Shocked Everyone | Zaryab Hashmi', youtubeId: 'NcDwBxk6mfk', topic: 'The Prophet\'s answer when asked about the soul', channel: 'xarya'),
  RelatedVideo(surah: 24, ayah: '24:35', title: 'NUR ke Raz | The Mystery of Allah Names, Light, Quran & Quantum Physics', youtubeId: 'dVYP-eHfL9A', topic: 'Allāhu nūru-s-samāwāti wa-l-arḍ', channel: 'qdd'),
  RelatedVideo(surah: 24, ayah: '24:35', title: 'Noor: The Divine Light Behind All Information - Zaryab Hashmi', youtubeId: '5pMQzj1oXbI', topic: 'Allāhu nūru-s-samāwāti wa-l-arḍ — the Verse of Light', channel: 'xarya'),
  RelatedVideo(surah: 39, ayah: '39:42', title: '7 Janum - SOUL\'s LIGHT and Stages of Sleep Explained — Zaryab Hashmi', youtubeId: 'NjNV87tn7dg', topic: 'Allah takes the souls in death and in sleep', channel: 'xarya'),
  RelatedVideo(surah: 50, ayah: '50:16', title: 'Who Is Speaking Inside You? Rooh, Nafs & Waswasa | Zaryab Hashmi', youtubeId: '9HhKqm-4wPE', topic: 'We are nearer to him than his jugular vein', channel: 'xarya'),
  RelatedVideo(surah: 112, ayah: '112', title: 'সূরা ইখলাস (১১২) | সম্পূর্ণ দারস বাংলায় | উস্তাদ নোমান আলী খান', youtubeId: 'ZMt7ujMIgXg', topic: 'Surah Al-Ikhlas — full dars in Bangla', channel: 'nak'),
  RelatedVideo(surah: 114, ayah: '114:4-6', title: 'Jinnat, Black Magic & Quantum Physics: The Reality of Ghaib (Unseen) | Dr. Sufyan', youtubeId: 'QelCqxE1WGM', topic: 'Min sharri-l-waswāsi-l-khannās', channel: 'qdd'),
];

String? _channelName(String key) {
  for (final c in kVideoChannels) {
    if (c.key == key) return c.name;
  }
  return null;
}

String? _channelUrl(String key) {
  for (final c in kVideoChannels) {
    if (c.key == key) return c.videosUrl;
  }
  return null;
}

class VideosTab extends StatefulWidget {
  const VideosTab({super.key});
  @override
  State<VideosTab> createState() => _VideosTabState();
}

class _VideosTabState extends State<VideosTab> {
  String _filter = 'all';

  @override
  Widget build(BuildContext context) {
    final filtered = _filter == 'all' ? kRelatedVideos : kRelatedVideos.where((v) => v.channel == _filter).toList();
    return Scaffold(
      appBar: AppBar(title: Text(L.t('related_videos'))),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          Text(L.t('related_videos_intro'), style: TextStyle(color: AppColors.muted(context), fontSize: 13)),
          const SizedBox(height: 12),
          // Channel cards
          for (final ch in kVideoChannels)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    const Icon(Icons.play_circle_outline, color: AppColors.gold),
                    const SizedBox(width: 10),
                    Expanded(child: Text(ch.name, style: const TextStyle(fontWeight: FontWeight.w700))),
                  ]),
                  const SizedBox(height: 4),
                  Text('${ch.handle} · ${ch.lang}', style: TextStyle(color: AppColors.muted(context), fontSize: 12)),
                  const SizedBox(height: 8),
                  SelectableText(ch.videosUrl, style: TextStyle(color: AppColors.blueRef(context), fontSize: 12)),
                  const SizedBox(height: 8),
                  FilledButton.tonal(
                    onPressed: () async {
                      await Clipboard.setData(ClipboardData(text: ch.videosUrl));
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Channel link copied')));
                      }
                    },
                    child: const Text('Copy channel link'),
                  ),
                ]),
              ),
            ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            children: [
              ChoiceChip(label: const Text('All'), selected: _filter == 'all', onSelected: (_) => setState(() => _filter = 'all')),
              for (final ch in kVideoChannels)
                ChoiceChip(label: Text(ch.key), selected: _filter == ch.key, onSelected: (_) => setState(() => _filter = ch.key)),
            ],
          ),
          const SizedBox(height: 14),
          Text('${filtered.length} videos', style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          if (filtered.isEmpty)
            Text(L.t('no_videos_mapped'), style: TextStyle(color: AppColors.muted(context)))
          else
            for (final v in filtered) _videoCard(context, v),
        ],
      ),
    );
  }

  Widget _videoCard(BuildContext context, RelatedVideo v) {
    final thumb = 'https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg';
    final watch = 'https://www.youtube.com/watch?v=${v.youtubeId}';
    final chName = _channelName(v.channel) ?? v.channel;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: AspectRatio(
              aspectRatio: 16 / 9,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    thumb,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(color: Theme.of(context).colorScheme.surfaceContainerHighest),
                  ),
                  const Center(child: Icon(Icons.play_circle_fill, color: Colors.white, size: 52)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          Text(v.title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
          const SizedBox(height: 4),
          Text('${v.ayah} · ${v.topic}', style: TextStyle(color: AppColors.muted(context), fontSize: 12)),
          Text(chName, style: TextStyle(color: AppColors.blueRef(context), fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Row(children: [
            Expanded(
              child: FilledButton.tonal(
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: watch));
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('YouTube link copied — open in browser')));
                  }
                },
                child: const Text('Copy YouTube link'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: OutlinedButton(
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: _channelUrl(v.channel) ?? ''));
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Channel link copied')));
                  }
                },
                child: const Text('Channel ↗'),
              ),
            ),
          ]),
          const SizedBox(height: 4),
          SelectableText(watch, style: TextStyle(color: AppColors.muted(context), fontSize: 11)),
        ]),
      ),
    );
  }
}
