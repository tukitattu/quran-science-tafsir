/* Related & contextual videos from three channels, mapped Surah/Ayah → episode
   Channels:
     NAK   — Nouman Ali Khan Bangla (@NAKBangla) — Bangla dars + dubbed Bayyinah-style videos, Quranic word choice, surah-wide dars
     QDD   — Dr Sufyan — Quran Daily Dose (@qurandailydose2985) — Quran & Modern Science / Ghaur o Fikr (Urdu + English)
     XARYA — Xaryab Haschmi Podcast (@xaryabhaschmiofficial) — Tasawwuf, ʿālam al-arwāḥ, rooh/nafs, Noor, spiritual guidance (Urdu · English)
   Usage: GHAUR_O_FIKR_MAP[surahNumber] -> array of {ayah, title, youtubeId, timestamp, topic, channel}
   Timestamps are seconds (optional). Add new entries here; every entry is a real,
   publicly-listed video on one of the three channels.
   Videos without a surah-specific match are NOT listed — no fake placeholders.
*/

const GHAUR_O_FIKR_MAP = {
  // Surah 2 — Al-Baqarah
  2: [
    { ayah: "2:23", title: "Can AI Create a Surah Like the Quran? An Atheist Dr Faraz's Frankenstein Claim", youtubeId: "5qmULGISKf0", timestamp: 0, topic: "Inimitability of the Quran — the challenge (tahaddi)", channel: "qdd" },
    { ayah: "2:30", title: "کیا سگے بہن بھائیوں کی شادی سے نسل بڑھی؟ Were There Humans Before Adam?", youtubeId: "Zs5lsRl90QM", timestamp: 0, topic: "Adam, pre-Adam humans & creation of man", channel: "qdd" },
    { ayah: "2:74", title: "মুগ্ধময় কুরআন সিরিজ || পর্ব ০৪ || পাথরসম হৃদয় || নোমান আলী খান", youtubeId: "e1FL6YUe6LQ", timestamp: 0, topic: "Hearts like stone — قست قلوبكم", channel: "nak" },
    { ayah: "2:126", title: "পাখিও নিরাপদ যে শহরে, সেখানে নবী ﷺ কেন নিরাপদ নন?", youtubeId: "iYZobiarECA", timestamp: 0, topic: "Sanctity of the city — Ibrahim's dua (Rabb al-Balad)", channel: "nak" },
    { ayah: "2:186", title: "The Quantum Secret of Dua: Manifestation in Islam Explained, Quran & Law of Attraction", youtubeId: "3L9VyR9XLG4", timestamp: 0, topic: "Dua — sustenance of the soul", channel: "qdd" },
    { ayah: "2:255", title: "আয়াতুল কুরসির লুকানো নকশা || নোমান আলী খান", youtubeId: "IMzP_NAPlt0", timestamp: 0, topic: "Ayatul Kursi — the hidden design", channel: "nak" },
    { ayah: "2:269", title: "A Muslim and An Atheist: Quran, Science and Intelligence | Dr. Sufyan Dr Faraz", youtubeId: "m8hqxu7k5Qw", timestamp: 0, topic: "Wisdom (ḥikmah) — whoever is given ḥikmah is given much good", channel: "qdd" },
    { ayah: "2:286", title: "সাধ্যাতীত ব্যাপারগুলো আল্লাহর হাতে ছেড়ে দিন || নোমান আলী খান", youtubeId: "5pY7QUuKYXU", timestamp: 0, topic: "La yukallifullahu nafsan illa wus'aha — no soul beyond its capacity", channel: "nak" },
    { ayah: "2:165", title: "Love Beyond Fear: Mansoor Hallaj Real Uncut Story - Zaryab Hashmi", youtubeId: "RAiH8zhRE_E", timestamp: 0, topic: "Hālīj — the love of Allah stronger, and lovers in His cause", channel: "xarya" },
    { ayah: "2:186", title: "Maula Ali's (AS) Secret to Talking with Allah! | This Quote will change your Life | Zaryab Hashmi", youtubeId: "vsdbjEJVCBc", timestamp: 0, topic: "Qul — 'I am near to the caller who calls upon Me'", channel: "xarya" },
    { ayah: "2:79", title: "Don't Read the 'Quran' - Sochi Samjhi Sazish | Zaryab Hashmi", youtubeId: "Y9uDFK57iU8", timestamp: 0, topic: "Woe to those who write the Book with their hands", channel: "xarya" },
    { ayah: "2:190", title: "Islam vs Global War: The Truth They Hide | Zaryab Hashmi", youtubeId: "Rt61sbZ4bZ8", timestamp: 0, topic: "Fight in the way of Allah, do not transgress", channel: "xarya" }
  ],
  // Surah 3 — Al Imran
  3: [
    { ayah: "3:59", title: "God vs Evolution: Does Darwin's Theory Disprove God? | 4 Unanswered Questions| Quran and Science", youtubeId: "f-j10bjmSY0", timestamp: 0, topic: "Jesus held like Adam — created from dust", channel: "qdd" },
    { ayah: "3:144", title: "12 Rabbi-ul-Awal Celebration Special Message | True Essense of Christmas | Zaryab Hashmi", youtubeId: "DksqGZR4XAA", timestamp: 0, topic: "Muḥammad is only a messenger, before him messengers passed away", channel: "xarya" }
  ],
  // Surah 4 — An-Nisa
  4: [
    { ayah: "4:48", title: "শিরক থেকে বাঁচার তিনটি পার্থক্য || নোমান আলী খান", youtubeId: "jCtRKjV69Y8", timestamp: 0, topic: "Shirk — the one unpardonable sin; distinctions to guard tawhid", channel: "nak" },
    { ayah: "4:64", title: "\"YA ALIە MADAD\" - Waseela, Tawasul, Istiyanat - Madad Mangna Kaisa Hai | Zaryab Hashmi", youtubeId: "ePYr9gufnL8", timestamp: 0, topic: "Had they come to you when they wronged themselves...", channel: "xarya" }
  ],
  // Surah 6 — Al-An'am
  6: [
    { ayah: "6:161-163", title: "আল্লাহ আমার রব || নোমান আলী খান", youtubeId: "V7nJtcUyiR0", timestamp: 0, topic: "Qul inna ḥayāti wa-mamāti lillāh", channel: "nak" },
    { ayah: "6:164", title: "Child R*pe and Hospital Negligence | Makafaat-e-Amal ya Kuch Aur? Zaryab Hashmi", youtubeId: "e1l_0G0ky9E", timestamp: 0, topic: "No bearer of burdens bears another's burden", channel: "xarya" }
  ],
  // Surah 7 — Al-A'raf
  7: [
    { ayah: "7:180", title: "#Allah #asmaulhusna #dua", youtubeId: "G3oKuvzeo7I", timestamp: 0, topic: "Fadlallahi al-ḥusnā — call Him by His Beautiful Names", channel: "qdd" },
    { ayah: "7:187", title: "Qayamat Kab Ayegi? 3 Quranic Prophecies | Challenge of an Atheist| Dr. Sufyan Quran & Science", youtubeId: "FhTKdz8jHYQ", timestamp: 0, topic: "As'aluka 'anin sami'ah — when will the Hour come?", channel: "qdd" },
    { ayah: "7:172", title: "Why Are We Far From the Quran? The Answer Is Ehd-e-Alast - Zaryab Hashmi", youtubeId: "ybR-7XHnyaQ", timestamp: 0, topic: "Am I not your Lord? — the Ālast covenant", channel: "xarya" },
    { ayah: "7:172", title: "Did Your Soul Choose This Life? The Secret of Alam-e-Arwah Revealed | Zaryab Hashmi", youtubeId: "vRpjGszCPo4", timestamp: 0, topic: "ʿĀlam al-arwāḥ — the world of souls' testimony", channel: "xarya" },
    { ayah: "7:172", title: "Rooh Ka Ehad! — Soul's Promise that Quran Never Lets Us Forget | Zaryab Hashmi", youtubeId: "zPRd8SIVNmU", timestamp: 0, topic: "Rūḥ ka ʿahd — the soul's promise the Quran recalls", channel: "xarya" }
  ],
  // Surah 8 — Al-Anfal
  8: [
    { ayah: "8:53", title: "\" Pakistan par Azaab a Chuka Hai!\" - Zaryab Hashmi", youtubeId: "NtMDhj-UXds", timestamp: 0, topic: "Allah does not change a favor until a people change themselves", channel: "xarya" }
  ],
  // Surah 9 — At-Tawbah
  9: [
    { ayah: "9:24", title: "Ishq-e-Majazi se Ishq-e-Haqeeqi | Sufi Journey of True Love | Zaryab Hashmi", youtubeId: "F5pGkrvHRtc", timestamp: 0, topic: "Allah, His Messenger and jihād are dearer than family", channel: "xarya" }
  ],
  // Surah 12 — Yusuf
  12: [
    { ayah: "12:53", title: "(নতুন ডাবিং) প্রবৃত্তি যেন আল্লাহর জায়গা না নেয় || নোমান আলী খান", youtubeId: "CIPrHKU88Mo", timestamp: 0, topic: "An-nafs al-ammarah — the commanding soul", channel: "nak" }
  ],
  // Surah 13 — Ar-Ra'd
  13: [
    { ayah: "13:2", title: "The Invisible Pillars of the Universe | Quran, Scuence, Gravity & Quantum Physics, Dr Sufyan", youtubeId: "w30Kwm08S4I", timestamp: 0, topic: "Guardians of the heavens without visible pillars — gravity", channel: "qdd" }
  ],
  // Surah 14 — Ibrahim
  14: [
    { ayah: "14:1", title: "14 August - Azaadi Special: 79 Years of Pakistan's Destruction | Zaryab Hashmi", youtubeId: "w330_SNXXqI", timestamp: 0, topic: "We sent the Book to bring mankind from darkness to light", channel: "xarya" }
  ],
  // Surah 15 — Al-Hijr
  15: [
    { ayah: "15:26", title: "Human Creation in Quran and Science| The Stardust Secret| کیا ہم ستاروں کی دھول ہیں؟", youtubeId: "rsNOmX2pAGo", timestamp: 0, topic: "Khalaqal-insane min salṣāl — creation of man", channel: "qdd" }
  ],
  // Surah 16 — An-Nahl
  16: [
    { ayah: "16:121", title: "ইব্রাহিম (আ) কেন \"কয়েকটি\" নিয়ামতের শোকরকারী? ভাষাগত মু'জিজা  || নোমান আলী খান", youtubeId: "WAbStglxRmA", timestamp: 0, topic: "Shākiran li-anʿumih — Ibrahim, ever grateful", channel: "nak" }
  ],
  // Surah 17 — Al-Isra
  17: [
    { ayah: "17:85", title: "The Journey of Your Soul (Ruh): From عالمِ ارواح to Barzakh | Quran and Rooh Explained", youtubeId: "jBWQySK4GmY", timestamp: 0, topic: "Yas'alnaka 'ani-r-rūḥ", channel: "qdd" },
    { ayah: "17:110", title: "#Allah #dua #asmaulhusna #allahnames #quran", youtubeId: "NwbPDFzl0Go", timestamp: 0, topic: "Qul udʿū Allāh aw udʿū ar-Raḥmān — the Beautiful Names", channel: "qdd" },
    { ayah: "17:85", title: "Soul, Body, Spirit: Who Are You Really? Zaryab Hashmi", youtubeId: "xH95XuNeawE", timestamp: 0, topic: "They ask you concerning the rūḥ — Say: the rūḥ is of my Lord's command", channel: "xarya" },
    { ayah: "17:85", title: "The Truth About 'Rooh' They Don't Want You to Know | Amr-e-Rabbi Explained | Zaryab Hashmi", youtubeId: "XYkqO1quWk8", timestamp: 0, topic: "Amr-e-Rabbi — the rūḥ as command of the Lord", channel: "xarya" },
    { ayah: "17:85", title: "They Asked Rasool Allah ﷺ About the Soul — His Answer Shocked Everyone | Zaryab Hashmi", youtubeId: "NcDwBxk6mfk", timestamp: 0, topic: "The Prophet's answer when asked about the soul", channel: "xarya" }
  ],
  // Surah 18 — Al-Kahf
  18: [
    { ayah: "18:13", title: "God of the Quran | Science, Ashab e Kahf & The Creator | Asif Jutt Podcast with Dr. Muhammad Sufyan", youtubeId: "JZg1Tl3J15s", timestamp: 0, topic: "Aṣḥāb al-Kahf — the sleepers of the cave", channel: "qdd" },
    { ayah: "18:83", title: "Are Yajooj Majooj Aliens? The Interstellar Journey of Zulqarnain | Quran and Science Dr. Sufyan", youtubeId: "pyw6Nexbhqw", timestamp: 0, topic: "Dhul-Qarnayn & Ya'juj and Ma'juj", channel: "qdd" }
  ],
  // Surah 20 — Ta-Ha
  20: [
    { ayah: "20:8", title: "ইলাহ শব্দের অর্থ || নোমান আলী খান", youtubeId: "vo-yIjW3JXo", timestamp: 0, topic: "Allāh lā ilāha illā huwa — the meaning of ilāh", channel: "nak" },
    { ayah: "20:134", title: "Why Gen Z Is Doomed? The Truth About Gen Alpha | Zaryab Hashmi", youtubeId: "PZxn-b9i5uA", timestamp: 0, topic: "Whoever turns away from My remembrance will have a straitened life", channel: "xarya" }
  ],
  // Surah 21 — Al-Anbiya
  21: [
    { ayah: "21:30", title: "Human Creation and Secret of Water: Big Bang, Pulsar Stars & Quran Explained", youtubeId: "d_4aiA8uz_s", timestamp: 0, topic: "Jaʿalnā mina-l-māʾi kulla shayʾin ḥayy — everything from water", channel: "qdd" },
    { ayah: "21:87", title: "معجزہ کی دعا #dua #miracle #quran", youtubeId: "5LHfB6fmp14", timestamp: 0, topic: "La ilāha illā anta subḥānaka innī kuntu mina-ẓ-ẓālimīn", channel: "qdd" },
    { ayah: "21:107", title: "Rahmatul lil Alameen | حضرت محمدﷺ کی نبوت کا ثبوت | Islam, Science & Atheism", youtubeId: "OrtxukFkers", timestamp: 0, topic: "Wa-mā arsalnāka illā raḥmatan lil-ʿālamīn", channel: "qdd" },
    { ayah: "21:107", title: "Rehmatul-lil-Aalameen ﷺ: Real Mercy Isn't Always Seen in This World | Zaryab Hashmi", youtubeId: "xVbu9BRMHlE", timestamp: 0, topic: "We sent you as a mercy to the worlds", channel: "xarya" }
  ],
  // Surah 23 — Al-Mu'minun
  23: [
    { ayah: "23:14", title: "Theory of Everything & Master Code | Quran & Science Ghaur o Fikr Ep 84 البرٹ آئن سٹائن کا آخری راز", youtubeId: "bLTIQreY0cg", timestamp: 0, topic: "Fatabāraka Allāh aḥsanu-l-khāliqīn", channel: "qdd" },
    { ayah: "23:99-100", title: "Life After Death | Multiverse, Quran & Science, Quantum Physics, Parallel Universe, Portals", youtubeId: "hOLw709-Zik", timestamp: 0, topic: "Rabbi-rjiʿūn — the soul at the moment of death", channel: "qdd" },
    { ayah: "23:99-100", title: "What Does Death Really Feel Like? Islam's view on Reincarnation - Zaryab Hashmi", youtubeId: "_ib1djwDzKI", timestamp: 0, topic: "Rabbi-rjiʿūn — the barrier (barzakh) after death", channel: "xarya" }
  ],
  // Surah 24 — An-Nur
  24: [
    { ayah: "24:35", title: "NUR ke Raz | The Mystery of Allah Names, Light, Quran & Quantum Physics", youtubeId: "dVYP-eHfL9A", timestamp: 0, topic: "Allāhu nūru-s-samāwāti wa-l-arḍ — the Verse of Light", channel: "qdd" },
    { ayah: "24:39", title: "মুগ্ধময় কুরআন সিরিজ || পর্ব ০৫ || মরীচিকার ডাক || নোমান আলী খান", youtubeId: "RBhtp-saS3w", timestamp: 0, topic: "Ruvāt al-kafar — deeds like a desert mirage", channel: "nak" },
    { ayah: "24:35", title: "Noor: The Divine Light Behind All Information - Zaryab Hashmi", youtubeId: "5pMQzj1oXbI", timestamp: 0, topic: "Allāhu nūru-s-samāwāti wa-l-arḍ — the Verse of Light", channel: "xarya" }
  ],
  // Surah 26 — Ash-Shu'ara
  26: [
    { ayah: "26:89", title: "زریاب ہاشمی کے چند اشعار ", youtubeId: "WebkSaK92hI", timestamp: 0, topic: "Poetry — day when neither wealth nor children avail", channel: "xarya" }
  ],
  // Surah 27 — An-Naml
  27: [
    { ayah: "27:82", title: "Scientific Reality of Dabbat al-Ard, Sign of Qiyamah| AI, AGI, Robots, Bio-Hybrids & The Quran", youtubeId: "LGNHpqgnQ9Q", timestamp: 0, topic: "Dabbat al-Arḍ — the Beast from the earth", channel: "qdd" }
  ],
  // Surah 31 — Luqman
  31: [
    { ayah: "31:13", title: "সন্তান প্রতিপালনে বাবার ভূমিকা || নোমান আলী খান", youtubeId: "xk9IbcFimqM", timestamp: 0, topic: "Luqman's counsel to his son — how to raise children", channel: "nak" }
  ],
  // Surah 33 — Al-Ahzab
  33: [
    { ayah: "33:45", title: "حضرت محمد ﷺ کا مقام #muhammadﷺ #quran #islam", youtubeId: "LBCIdgh6Ih8", timestamp: 0, topic: "Yā ayyuha-n-nabiyyu innā arsalnāka shāhidan wa-mubashshiran — the station of the Prophet", channel: "qdd" },
    { ayah: "33:56", title: "Quantum Durood: The Quran, Dhikr, Consciousness & Quantum Physics", youtubeId: "o88HOzGjd2U", timestamp: 0, topic: "Innallāha wa-malāʾikatahu yuṣallūna ʿala-n-nabī — ṣalawāt", channel: "qdd" }
  ],
  // Surah 39 — Az-Zumar
  39: [
    { ayah: "39:53", title: "مایوسی #quran #dua #hopless #depression", youtubeId: "R1jB5vD2kPw", timestamp: 0, topic: "Lā taqnaṭū min raḥmati-llāh — do not despair of Allah's mercy", channel: "qdd" },
    { ayah: "39:42", title: "7 Janum - SOUL's LIGHT and Stages of Sleep Explained — Zaryab Hashmi", youtubeId: "NjNV87tn7dg", timestamp: 0, topic: "Allah takes the souls in death and in sleep", channel: "xarya" }
  ],
  // Surah 41 — Fussilat
  41: [
    { ayah: "41:53", title: "বহু বছর আগের এক নোট কীভাবে এক সংশয়বাদীকে ইসলামে আনল?", youtubeId: "zYsuRpEveQM", timestamp: 0, topic: "Sanurīhim āyātinā fi-l-āfāq — the signs in the horizons", channel: "nak" },
    { ayah: "41:53", title: "What is Hidden from Mankind? Answer by Sufism & Ahle Bait - Zaryab Hashmi", youtubeId: "xeqfhUfcc2g", timestamp: 0, topic: "We shall show them Our signs in the horizons and within themselves", channel: "xarya" }
  ],
  // Surah 43 — Zukhruf
  43: [
    { ayah: "43:63", title: "ঈসা (আ) কেন কখনো \"ইয়া কওমি\" বলেননি? নোমান আলী খান", youtubeId: "wTktLE9XUyM", timestamp: 0, topic: "Isa addresses Banī Isrāʾīl — never ‘yā qawmī’", channel: "nak" }
  ],
  // Surah 49 — Al-Hujurat
  49: [
    { ayah: "49:13", title: "Khawaja Sara and Aurat March, Men are Reaponsible? Zaryab Hashmi", youtubeId: "RfBBBUmbueM", timestamp: 0, topic: "We made you peoples and tribes that you may know one another", channel: "xarya" }
  ],
  // Surah 50 — Qaf
  50: [
    { ayah: "50:16", title: "Who Is Speaking Inside You? Rooh, Nafs & Waswasa | Zaryab Hashmi", youtubeId: "9HhKqm-4wPE", timestamp: 0, topic: "We are nearer to him than his jugular vein", channel: "xarya" }
  ],
  // Surah 51 — Adh-Dhariyat
  51: [
    { ayah: "51:47", title: "Singularity, Big Bang, Quran vs Science, How the universe begin", youtubeId: "XEuTEX2mGOc", timestamp: 0, topic: "Wa-s-samāʾa banaynāhā bi-aydin wa-innā la-mūsiʿūn — expanding heavens", channel: "qdd" },
    { ayah: "51:56", title: "Maqsad-e-Hayat kya hai? 3 Indicators of Purpose of Life | Zaryab Hashmi", youtubeId: "0YGEfoKqGrc", timestamp: 0, topic: "I created jinn and mankind only that they worship Me", channel: "xarya" }
  ],
  // Surah 54 — Al-Qamar
  54: [
    { ayah: "54:49", title: "Universe Code: Is Your Destiny Pre-Programmed? | تقدیر کا راز", youtubeId: "v1XAWx6ePj4", timestamp: 0, topic: "Innā kulla shayʾin khalaqnāhu bi-qadar — everything created by qadar", channel: "qdd" }
  ],
  // Surah 55 — Ar-Rahman
  55: [
    { ayah: "55:7", title: "Quantum Meezan | The Higgs Field, Mass, Matter & the Quran’s Concept of Al-Mizan", youtubeId: "p-PGNy6FWbw", timestamp: 0, topic: "Wa-s-samāʾa rafaʿahā wa-waḍaʿa-l-mīzān — the Balance", channel: "qdd" },
    { ayah: "55:19-20", title: "Wahdatul Wajood, Barzakh and The Mystery of Bermuda Triangle Explained | Zaryab Hashmi", youtubeId: "7S4IgmvDroI", timestamp: 0, topic: "Barzakh — two seas that do not meet", channel: "xarya" }
  ],
  // Surah 57 — Al-Hadid
  57: [
    { ayah: "57:20", title: "Quran & Quantum Physics : Is the Material World an Illusion? | کوانٹم فزکس اور قرآن", youtubeId: "k10SCukMagU", timestamp: 0, topic: "Aʿlamu anna-l-ḥayāta-d-dunyā laʿibun wa-lahw — this life is play", channel: "qdd" },
    { ayah: "57:22", title: "#quran تقدیر #taqdeer #destiny #islam", youtubeId: "fLdf-i-t_mY", timestamp: 0, topic: "Mā aṣāba min muṣībatin — decree written before creation", channel: "qdd" },
    { ayah: "57:20", title: "A LIFE WITHOUT WIFI 🚫 - HALAL MUSIC and CARTOONS waqt kaise badla - Zaryab Hashmi THE GREY LOUNGE", youtubeId: "CMKhtNCjpjA", timestamp: 0, topic: "Know that the life of this world is play, diversion and adornment", channel: "xarya" }
  ],
  // Surah 59 — Al-Hashr
  59: [
    { ayah: "59:24", title: "Allah ke Raz: The Secret Behind the Name | Moon God Claim Explained", youtubeId: "3-w6mD6HeqA", timestamp: 0, topic: "Huwa Allāh al-Khāliq al-Bāriʾ al-Muṣawwir — lahu-l-asmāʾu-l-ḥusnā", channel: "qdd" },
    { ayah: "59:18", title: "Your Soul has Bigger Plans! Here's How to Wake up to the truth! Zaryab Hashmi", youtubeId: "3vEDhq2RA6s", timestamp: 0, topic: "Let the soul look to what it has sent forth for tomorrow", channel: "xarya" }
  ],
  // Surah 62 — Al-Jumu'ah
  62: [
    { ayah: "62:2", title: "আল্লাহর ৪টি নাম, রাসূল ﷺ-এর ৪টি কাজ: সূরা জুমুআর বিস্ময়কর মিল | উস্তাদ নোমান আলী খান", youtubeId: "sWbWMThlzHU", timestamp: 0, topic: "Surah Al-Jumu'ah — four Names, four actions", channel: "nak" },
    { ayah: "62:11", title: "ব্যবসা নাকি বিনোদন? কুরআনের পারফেক্ট শব্দ চয়ন || নোমান আলী খান", youtubeId: "FyDHu1JisM4", timestamp: 0, topic: "Tijārah aw lahw — trade or amusement; the Quran's precise word choice", channel: "nak" }
  ],
  // Surah 74 — Al-Muddaththir
  74: [
    { ayah: "74:42-47", title: "নামাজ না পড়ার পরিণতি || নোমান আলী খান", youtubeId: "9SmSKJTXaT0", timestamp: 0, topic: "Mā salāku-kum fī saqar — ‘what led you into the Fire?’", channel: "nak" }
  ],
  // Surah 76 — Al-Insan
  76: [
    { ayah: "76:1", title: "Did Humans Really Evolve from Monkeys? |Darwin vs Islamic Evolution? Quran and  Science | Dr. Sufyan", youtubeId: "QjDYlGoKv04", timestamp: 0, topic: "Hal atā ʿala-l-insāni ḥīnun mina-d-dahri lam yakun shayʾan madhkūrā", channel: "qdd" }
  ],
  // Surah 79 — An-Nazi'at
  79: [
    { ayah: "79:30", title: "Shape of Earth in Quran and Science | Scientific Proofs of Round Earth", youtubeId: "L13OxlMnRVs", timestamp: 0, topic: "Wa-l-arḍa baʿda dhālika daḥāhā — the spread earth", channel: "qdd" },
    { ayah: "79:40", title: "Can You Conquer Your Nafs? The Qur'an, Maula Aliع and Iqbal's Secret of Ishq | Zaryab Hashmi", youtubeId: "wLKyAF795gg", timestamp: 0, topic: "Whoever feared standing before his Lord and restrained his soul from desires", channel: "xarya" }
  ],
  // Surah 80 — Abasa
  80: [
    { ayah: "80:33", title: "#quran #science #atheism #challenge #qayamat #judgementday", youtubeId: "gVVgBS_jwdg", timestamp: 0, topic: "Fa-idhā jāʾati-ṣ-ṣākhkhah — the Deafening Blast", channel: "qdd" }
  ],
  // Surah 81 — At-Takwir
  81: [
    { ayah: "81:1", title: "কেয়ামতের ভয়ংকর একটি দৃশ্য || নোমান আলী খান", youtubeId: "HuKSIABwG58", timestamp: 0, topic: "Idhā-sh-shamsu kuwwirat — when the sun is wound up", channel: "nak" }
  ],
  // Surah 82 — Al-Infitar
  82: [
    { ayah: "82:1", title: "সূরা আল-ইনফিতার (৮২) | সম্পূর্ণ দারস বাংলায় | উস্তাদ নোমান আলী খান", youtubeId: "oMBOb1gfaPE", timestamp: 0, topic: "Surah Al-Infitar — full dars in Bangla", channel: "nak" }
  ],
  // Surah 83 — Al-Mutaffifin
  83: [
    { ayah: "83:1-3", title: "সূরা মুতাফফিফিন (৮৩) | সম্পূর্ণ দারস বাংলায় | উস্তাদ নোমান আলী খান", youtubeId: "CsXKpd9FtU8", timestamp: 0, topic: "Al-Muṭaffifīn — giving less in full measure; full dars", channel: "nak" },
    { ayah: "83:1-3", title: "সূরা আল-মুতাফফিফিনের (৮৩) দারস || নোমান আলী খান", youtubeId: "G4vlZKJ-fSY", timestamp: 0, topic: "Al-Muṭaffifīn — giving less in full measure", channel: "nak" },
    { ayah: "83:7-9", title: "‘কেউ দেখছে না’—পাপীর খাতা কোথায় জমা হয়?", youtubeId: "thMH7M68j4A", timestamp: 0, topic: "Sijjīn — the record of the wicked", channel: "nak" },
    { ayah: "83:15", title: "সেদিন কারা তাদের রবকে এক পলকও দেখতে পাবে না?", youtubeId: "sSBMITiE-WI", timestamp: 0, topic: "Kalla innāhum ʿan rabbihim yawmaʾidhin la-maḥjūbūn", channel: "nak" }
  ],
  // Surah 84 — Al-Inshiqaq
  84: [
    { ayah: "84:1-2", title: "সূরা ইনশিকাক প্রথম দুই আয়াত", youtubeId: "jNad9PgJ6Gc", timestamp: 0, topic: "Idha-s-samāʾunshuqqat — when the sky is split apart", channel: "nak" },
    { ayah: "84", title: "সূরা ইনশিকাকের দারস (৮৪) || নোমান আলী খান", youtubeId: "1BnlWqepAfY", timestamp: 0, topic: "Surah Al-Inshiqaq — dars", channel: "nak" },
    { ayah: "84", title: "সূরা ইনশিকাকের তাফসীর (১ম পর্ব) || নোমান আলী খান", youtubeId: "kU23BoQ-vTY", timestamp: 0, topic: "Surah Al-Inshiqaq — tafsir, part 1", channel: "nak" },
    { ayah: "84", title: "সূরা ইনশিকাকের তাফসীর (২য় পর্ব) || নোমান আলী খান", youtubeId: "Y0TImFkN1UY", timestamp: 0, topic: "Surah Al-Inshiqaq — tafsir, part 2", channel: "nak" }
  ],
  // Surah 86 — At-Tariq
  86: [
    { ayah: "86:1-3", title: "সূরা আত-তারিক (৮৬) | সম্পূর্ণ দারস বাংলায় | উস্তাদ নোমান আলী খান", youtubeId: "fOU31ApB860", timestamp: 0, topic: "At-Tāriq — the nightly visitor; full dars", channel: "nak" }
  ],
  // Surah 89 — Al-Fajr
  89: [
    { ayah: "89:1-5", title: "সূরা আল-ফাজরের তাফসীর  (৮৯) || নোমান আলী খান", youtubeId: "UOuFa_d0gGs", timestamp: 0, topic: "Al-Fajr — tafsir of the dawn surah", channel: "nak" }
  ],
  // Surah 90 — Al-Balad
  90: [
    { ayah: "90:1-4", title: "সূরা আল-বালাদ (৯০) | সম্পূর্ণ দারস বাংলায় | উস্তাদ নোমান আলী খান", youtubeId: "WyV8TliPrLI", timestamp: 0, topic: "Al-Balad — ‘I swear by this city’; full dars", channel: "nak" }
  ],
  // Surah 91 — Ash-Shams
  91: [
    { ayah: "91:7-10", title: "MINDFULNESS: The Battle Between Soul & Body | جنت کی دو باتیں | Dr Sufyan Podcast", youtubeId: "95O_AinMiuw", timestamp: 0, topic: "Wa-nafsin wa-mā sawwāhā qad aflaḥa man zakkāhā", channel: "qdd" }
  ],
  // Surah 94 — Ash-Sharh
  94: [
    { ayah: "94:5-6", title: "কেন আমার সাথেই এমন হয়? কঠিন সময়ের আসল কারণ", youtubeId: "RZwhbDmQ1Lo", timestamp: 0, topic: "Fa-inna maʿa-l-ʿusri yusrā — with hardship comes ease", channel: "nak" }
  ],
  // Surah 112 — Al-Ikhlas
  112: [
    { ayah: "112:1", title: "‘জেনে রাখো’ নয়, আল্লাহ কেন বললেন ‘বলো’?", youtubeId: "8CmxlvzzPV4", timestamp: 0, topic: "Qul — why ‘Say’, not ‘Know’", channel: "nak" },
    { ayah: "112", title: "প্রতি রাকাতে সূরা ইখলাস! নবীজি ﷺ কী বললেন?", youtubeId: "m_ojA4w_Lv8", timestamp: 0, topic: "Surah Ikhlas in every rakʿah — what the Prophet ﷺ said", channel: "nak" },
    { ayah: "112", title: "সূরা ইখলাস (১১২) | সম্পূর্ণ দারস বাংলায় | উস্তাদ নোমান আলী খান", youtubeId: "ZMt7ujMIgXg", timestamp: 0, topic: "Surah Al-Ikhlas — full dars in Bangla", channel: "nak" },
    { ayah: "112", title: "সূরা ইখলাসের (১১২) তাফসীর (সম্পূর্ণ সূরা)  || নোমান আলী খান", youtubeId: "gLiLEGa8TWg", timestamp: 0, topic: "Surah Al-Ikhlas — complete tafsir", channel: "nak" }
  ],
  // Surah 114 — An-Nas
  114: [
    { ayah: "114:4-6", title: "Jinnat, Black Magic & Quantum Physics: The Reality of Ghaib (Unseen) | Dr. Sufyan", youtubeId: "QelCqxE1WGM", timestamp: 0, topic: "Min sharri-l-waswāsi-l-khannās — the whispering sneak", channel: "qdd" }
  ],
};

/* Channel metadata — used by the UI to link to the channels themselves. */
const VIDEO_CHANNELS = {
  nak: {
    id: "UC0gR3U-zZuenutB5uVju1_g",
    name: "NAK Bangla — নোমান আলী খান",
    handle: "@NAKBangla",
    url: "https://www.youtube.com/@NAKBangla",
    videos: "https://www.youtube.com/@NAKBangla/videos",
    lang: "বাংলা"
  },
  qdd: {
    id: "UCTxfjAr3E8pgKP7Xv1TM_FA",
    name: "Dr Sufyan — Quran Daily Dose",
    handle: "@qurandailydose2985",
    url: "https://www.youtube.com/@qurandailydose2985",
    videos: "https://www.youtube.com/@qurandailydose2985/videos",
    lang: "اردو · English"
  },
  xarya: {
    id: "UCOBcqyI4sNm5gcJmGmvDcaA",
    name: "Xaryab Haschmi Podcast — زریاب ہاشمی",
    handle: "@xaryabhaschmiofficial",
    url: "https://www.youtube.com/@xaryabhaschmiofficial",
    videos: "https://www.youtube.com/@xaryabhaschmiofficial/videos",
    lang: "اردو · English"
  }
};

// NOTE: surahs without curated matches simply have no entries — the UI
// shows channel links instead of placeholder videos.

// Classic scripts don't put top-level const on window — expose explicitly:
if (typeof window !== 'undefined') {
  window.GHAUR_O_FIKR_MAP = GHAUR_O_FIKR_MAP;
  window.VIDEO_CHANNELS = VIDEO_CHANNELS;
}

