#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Expand assets/data/business.json (and the Flutter copy).

Qur'anic cards are generated from the eQuran public per-ayah data so the
Arabic, English (Saheeh International) and Bangla (Islamic Foundation) are
exact. Hadith, Sahaba and modern-practice cards are curated with explicit
references.

Existing section/item ids are preserved; new cards are appended.
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = pathlib.Path("/tmp/opencode/eqdata")
OUT = ROOT / "assets/data/business.json"
FL = ROOT / "flutter/assets/business.json"

def ayah(s, a):
    meta = json.loads((SRC / "s" / f"{s}.json").read_text(encoding="utf-8"))
    en = json.loads((SRC / "t" / "en" / f"{s}.json").read_text(encoding="utf-8"))
    row = meta["ayahs"][a - 1]
    if int(row["n"]) != a:
        raise SystemExit(f"ayah mismatch {s}:{a}")
    return row["ar"], en[a - 1], row["bn"]

# ———————————————————————————————————————————————— Qur'an
QURAN = [
    (2, 188, ["bribery", "justice", "wealth"], "Do not consume one another's wealth unjustly or send it to rulers to consume a part of it sinfully."),
    (2, 275, ["trade", "riba"], "Allah has permitted trade and forbidden interest."),
    (2, 276, ["riba", "charity"], "Allah destroys interest and gives increase for charities."),
    (2, 278, ["riba", "faith"], "Fear Allah and give up what remains of interest, if you are believers."),
    (2, 279, ["riba", "justice"], "If you do not, then be informed of a war from Allah and His Messenger."),
    (2, 280, ["debt", "mercy"], "If the debtor is in hardship, grant him time until it is easy; to forgive is better."),
    (2, 282, ["contract", "debt", "witness"], "When you contract a debt, write it down; let a scribe write in justice and let witnesses testify."),
    (2, 283, ["contract", "trust"], "If you are on a journey and cannot find a scribe, take a pledge; do not conceal testimony."),
    (3, 130, ["riba"], "Do not consume interest, doubled and multiplied, but fear Allah that you may succeed."),
    (4, 5, ["wealth", "stewardship"], "Do not give your property to the foolish, but provide for them from it and speak to them kindly."),
    (4, 6, ["orphan", "wealth"], "Test the orphans; when mature, give them their property. Do not consume it extravagantly."),
    (4, 29, ["trade", "consent", "justice"], "Do not consume one another's wealth unjustly, but only by trade by mutual consent."),
    (4, 58, ["trust", "justice"], "Return trusts to their owners and judge with justice when you judge between people."),
    (5, 1, ["contract", "faith"], "Fulfil your contracts. Lawful for you are the animals of grazing livestock."),
    (5, 90, ["gambling", "intoxicants"], "Intoxicants, gambling, idolatry and divination are abominations of Satan's work; avoid them."),
    (6, 141, ["harvest", "charity"], "Eat of their fruit when they bear, and give its due on the day of harvest; do not waste."),
    (6, 152, ["measure", "orphan", "justice"], "Do not approach the orphan's property except for improvement; give full measure and weight with justice."),
    (7, 31, ["moderation", "consumption"], "O children of Adam, take your adornment at every mosque, eat and drink but do not be excessive."),
    (7, 85, ["measure", "justice", "trade"], "Give full measure and weight and do not deprive people of what is rightfully theirs."),
    (8, 27, ["trust", "faith"], "Do not betray Allah, the Messenger, or your trusts while you know."),
    (9, 34, ["hoarding", "wealth"], "Those who hoard gold and silver and do not spend them in the way of Allah — give them tidings of punishment."),
    (9, 60, ["zakat", "charity"], "Zakat is for the poor, the needy, those employed to collect it, and other named categories."),
    (9, 103, ["zakat", "purification"], "Take from their wealth a charity by which you purify and sanctify them."),
    (11, 84, ["measure", "trade"], "Shu'ayb said: O my people, worship Allah; I fear for you the punishment of a dreadful day."),
    (11, 85, ["measure", "justice"], "O my people, give full measure and weight in justice and do not deprive people of their due."),
    (16, 14, ["sea", "trade", "provision"], "He subjected the sea so you may eat fresh meat and extract ornaments, and you see ships sailing."),
    (16, 91, ["contract", "oath"], "Fulfil the covenant of Allah when you have taken it, and do not break your oaths."),
    (17, 29, ["spending", "moderation"], "Do not tie your hand to your neck nor stretch it out entirely, lest you sit blameworthy and regretful."),
    (17, 35, ["measure", "trade"], "Give full measure when you measure and weigh with an accurate balance."),
    (18, 46, ["wealth", "afterlife"], "Wealth and children are the adornment of worldly life, but lasting good deeds are better."),
    (21, 80, ["craft", "industry"], "We taught David the making of armour to protect you from your might; will you then be grateful?"),
    (23, 8, ["trust", "contract"], "The believers are those who are faithful to their trusts and their covenant."),
    (25, 67, ["spending", "moderation"], "Those who spend are neither extravagant nor stingy, but keep a balance between."),
    (26, 181, ["measure", "trade"], "Give full measure and do not be among those who cause loss."),
    (26, 182, ["measure", "trade"], "Weigh with an accurate balance."),
    (26, 183, ["justice", "trade"], "Do not deprive people of their things and do not spread corruption on earth."),
    (28, 26, ["employment", "trust"], "The best person you can hire is the strong and trustworthy one."),
    (30, 39, ["riba", "charity"], "Whatever you give in interest to increase people's wealth does not increase with Allah; charity does."),
    (34, 12, ["industry", "provision"], "We made the wind subject to Solomon, and We caused a spring of copper to flow for him."),
    (34, 13, ["craft", "gratitude"], "They made for him what he willed: arches, statues, basins and fixed cauldrons. Work, O family of David, in gratitude."),
    (35, 29, ["trade", "recitation"], "Those who recite the Book, establish prayer and spend from what We gave them hope for a trade that will not perish."),
    (55, 7, ["balance", "creation"], "He raised the heaven and set up the balance."),
    (55, 8, ["balance", "justice"], "Do not transgress the balance."),
    (55, 9, ["measure", "justice"], "Establish weight with justice and do not cause loss in the balance."),
    (57, 7, ["spending", "stewardship"], "Believe in Allah and His Messenger and spend from that over which He made you trustees."),
    (59, 7, ["wealth", "distribution"], "Whatever Allah restored to His Messenger from the people of the towns belongs to Allah, the Messenger, relatives, orphans, the poor and the traveller — so it is not a circulation among the rich."),
    (61, 10, ["trade", "faith"], "Shall I guide you to a trade that will save you from a painful punishment?"),
    (61, 11, ["trade", "faith"], "Believe in Allah and His Messenger and strive in the way of Allah with your wealth and lives."),
    (62, 10, ["trade", "prayer"], "When the prayer is finished, disperse through the land and seek the bounty of Allah."),
    (63, 9, ["wealth", "prayer"], "Do not let your wealth or children divert you from the remembrance of Allah."),
    (64, 16, ["spending", "charity"], "Fear Allah as much as you are able; listen, obey and spend — it is better for your souls."),
    (65, 6, ["family", "employment"], "If they suckle your children, give them their wages and consult together in kindness."),
    (65, 7, ["spending", "means"], "Let the one with abundance spend from his abundance, and the one with limited means from what Allah gave him."),
    (73, 20, ["trade", "prayer"], "Others travel through the land seeking the bounty of Allah; recite what is easy and establish prayer."),
    (83, 1, ["measure", "justice"], "Woe to those who give less than due."),
    (83, 2, ["measure", "trade"], "Those who, when they measure for people, demand full measure."),
    (83, 3, ["measure", "trade"], "But when they measure or weigh for others, they give less."),
    (102, 1, ["wealth", "distraction"], "Competition for increase has diverted you."),
    (104, 1, ["hoarding", "wealth"], "Woe to every scorner and mocker."),
    (104, 2, ["hoarding", "wealth"], "Who collects wealth and counts it."),
    (104, 3, ["hoarding", "wealth"], "He thinks his wealth will make him immortal."),
]

# ———————————————————————————————————————————————— Hadith
HADITH = [
    ("The truthful, trustworthy merchant will be with the prophets, the truthful and the martyrs.", "সত্যবাদী ও বিশ্বস্ত ব্যবসায়ী নবী, সিদ্দিক ও শহীদদের সঙ্গে থাকবেন।", "Jami' at-Tirmidhi 1209"),
    ("May Allah have mercy on a person who is generous when he sells, when he buys and when he demands payment.", "আল্লাহ তার প্রতি দয়া করুন যে বিক্রয়, ক্রয় ও পাওনা আদায়ে উদার।", "Sahih al-Bukhari 2076"),
    ("The buyer and seller have the option to cancel as long as they have not separated.", "ক্রেতা-বিক্রেতার বিচ্ছিন্ন না হওয়া পর্যন্ত চুক্তি বাতিলের অধিকার আছে।", "Sahih al-Bukhari 2107; Sahih Muslim 1531"),
    ("Whoever sells defective goods without disclosing the defect, Allah remains angry with him.", "যে ব্যক্তি দোষ গোপন করে পণ্য বিক্রি করে, আল্লাহ তার প্রতি ক্রুদ্ধ থাকেন।", "Sunan Ibn Majah 2246"),
    ("It is not lawful for a man to sell what he does not possess.", "যে জিনিস নিজের মালিকানায় নেই, তা বিক্রি করা কারও জন্য হালাল নয়।", "Sunan Abu Dawud 3503; Jami' at-Tirmidhi 1232"),
    ("Do not go out to meet the caravans before they reach the market.", "বাজারে পৌঁছানোর আগে পণ্যবাহী কাফেলার সঙ্গে গিয়ে ক্রয় করো না।", "Sahih al-Bukhari 2165; Sahih Muslim 1517"),
    ("A town-dweller should not sell on behalf of a bedouin.", "শহরের লোক গ্রামের লোকের পক্ষে বিক্রি করবে না।", "Sahih al-Bukhari 2150"),
    ("Do not outbid one another and do not sell over the sale of your brother.", "একে অন্যের ওপর দাম বাড়িয়ে দিও না এবং ভাইয়ের বিক্রয়ের ওপর বিক্রি করো না।", "Sahih al-Bukhari 2140, 2139"),
    ("Whoever hoards goods is a sinner.", "যে ব্যক্তি পণ্য মজুতদারি করে সে পাপী।", "Sahih Muslim 1605"),
    ("Do not swear oaths to sell goods; an oath may sell them but erases the blessing.", "পণ্য বিক্রির জন্য বেশি শপথ করো না; শপথ বিক্রি বাড়াতে পারে কিন্তু বরকত মুছে দেয়।", "Sahih al-Bukhari 2087"),
    ("Pay the worker his wage before his sweat dries.", "শ্রমিকের ঘাম শুকানোর আগেই তার পারিশ্রমিক দিয়ে দাও।", "Sunan Ibn Majah 2443"),
    ("Whoever employs a worker should inform him of his wage.", "যে ব্যক্তি শ্রমিক নিয়োগ করে, সে যেন তার পারিশ্রমিক জানিয়ে দেয়।", "Sunan Abu Dawud 3502"),
    ("Charity does not decrease wealth.", "দান-সদকা সম্পদ কমায় না।", "Sahih Muslim 2588"),
    ("The upper hand is better than the lower hand.", "উপরের হাত নিচের হাতের চেয়ে উত্তম।", "Sahih al-Bukhari 1429"),
    ("Richness is not abundance of wealth, but richness of the soul.", "প্রাচুর্য সম্পদের আধিক্যে নয়, আত্মার প্রাচুর্যে।", "Sahih al-Bukhari 6446"),
    ("Two hungry wolves let loose among sheep are not more harmful than greed for wealth and status is to one's religion.", "সম্পদ ও মর্যাদার লোভ দ্বীনের জন্য দুটি ক্ষুধার্ত নেকড়ের চেয়েও বেশি ক্ষতিকর।", "Jami' at-Tirmidhi 2376"),
    ("The son of Adam has no right except to a house, a garment and food.", "আদম-সন্তানের অধিকার কেবল ঘর, বস্ত্র ও খাবারের মধ্যে।", "Jami' at-Tirmidhi 2340"),
    ("Do not sell fruits until they are ripe.", "ফল পরিপক্ব না হওয়া পর্যন্ত বিক্রি করো না।", "Sahih al-Bukhari 1487"),
    ("Whoever buys food should not sell it until he takes possession.", "যে ব্যক্তি খাদ্য ক্রয় করে, সে তা দখলে না নেওয়া পর্যন্ত বিক্রি করবে না।", "Sahih al-Bukhari 2136"),
    ("Allah has cursed the one who takes interest, the one who pays it, the one who records it and the two witnesses.", "আল্লাহ সুদ গ্রহণকারী, প্রদানকারী, লেখক ও দুই সাক্ষীকে অভিশাপ করেছেন।", "Sahih Muslim 1598"),
    ("Avoid the seven destructive sins — including consuming interest.", "সাতটি ধ্বংসকারী পাপ থেকে বাঁচো — তন্মধ্যে সুদ ভক্ষণও রয়েছে।", "Sahih al-Bukhari 2766"),
    ("Allah and His Messenger have forbidden the sale of intoxicants.", "আল্লাহ ও তাঁর রাসূল মাদক বিক্রয় হারাম করেছেন।", "Sahih Muslim 1581"),
    ("A Muslim is the brother of a Muslim; it is not lawful for him to sell him defective goods without informing him.", "মুসলিম মুসলিমের ভাই; দোষ জানানো ছাড়া তার কাছে ত্রুটিপূর্ণ পণ্য বিক্রি করা বৈধ নয়।", "Sunan Ibn Majah 2246"),
    ("Whoever relieves a believer of a worldly distress, Allah will relieve him of a distress on the Day of Resurrection.", "যে ব্যক্তি কোনো মুমিনের দুনিয়ার কষ্ট দূর করে, আল্লাহ কিয়ামতের দিন তার কষ্ট দূর করবেন।", "Sahih Muslim 2699"),
    ("Give respite to the one in difficulty, or forgive him the debt.", "অসচ্ছল ঋণগ্রস্তকে সময় দাও, অথবা ঋণ মাফ করে দাও।", "Sahih al-Bukhari 3480"),
]

# ———————————————————————————————————————————————— Sahaba
SAHABA = [
    ("Khadijah bint Khuwaylid (RA) — the merchant who hired the Prophet", "খাদিজা বিনতু খুওয়াইলিদ (রা.) — যিনি নবীকে ব্যবসায় নিয়োগ দিয়েছিলেন", "Khadijah ran caravans to Syria and hired Muhammad ﷺ for his honesty and skill. She paid him a fair wage, and their partnership became the foundation of the first Muslim household. Lesson: hire on merit, pay fairly, and let character be the first CV.", "খাদিজা (রা.) সিরিয়ায় বাণিজ্য কাফেলা পরিচালনা করতেন এবং সততা ও দক্ষতার কারণে মুহাম্মদ ﷺ-কে নিয়োগ দেন। তিনি ন্যায্য পারিশ্রমিক দেন; এই অংশীদারিত্ব প্রথম মুসলিম পরিবারের ভিত্তি হয়। শিক্ষা: যোগ্যতার ভিত্তিতে নিয়োগ, ন্যায্য মজুরি এবং চরিত্রই প্রথম জীবনবৃত্তান্ত।", "Sirah Ibn Hisham; Sahih al-Bukhari 3"),
    ("Abu Bakr as-Siddiq (RA) — the cloth merchant", "আবু বকর সিদ্দিক (রা.) — কাপড়ের ব্যবসায়ী", "Abu Bakr traded cloth in Makkah and continued lawful trade after the caliphate, saying he would not abandon a livelihood he had known. Lesson: dignity in work, and leadership does not make trade beneath you.", "আবু বকর (রা.) মক্কায় কাপড়ের ব্যবসা করতেন এবং খিলাফতের পরও হালাল ব্যবসা চালিয়ে যান। শিক্ষা: কাজের মর্যাদা; নেতৃত্ব ব্যবসাকে ছোট করে না।", "Sirah; al-Bukhari"),
    ("Uthman ibn Affan (RA) — the caravan and the well", "উসমান ইবনে আফফান (রা.) — কাফেলা ও কূপ", "Uthman became wealthy through trade, equipped the army of Tabuk, and bought the well of Rumah to give Muslims free water. Lesson: wealth is a trust; the best profit is what serves the ummah.", "উসমান (রা.) ব্যবসায় সম্পদ গড়েন, তাবুকের সেনাদল সজ্জিত করেন এবং রুমার কূপ কিনে মুসলিমদের বিনামূল্যে পানি দেন। শিক্ষা: সম্পদ আমানত; সর্বোত্তম মুনাফা উম্মাহর সেবায়।", "Sirah; Jami' at-Tirmidhi 3699"),
    ("Abdur-Rahman ibn Awf (RA) — from refugee to trader", "আবদুর রহমান ইবনে আউফ (রা.) — শরণার্থী থেকে ব্যবসায়ী", "When he migrated to Madinah with nothing, he refused charity and asked to be shown the market. He traded in cheese and butter until he became independent. Lesson: the market is a path out of dependency when effort meets honesty.", "মদিনায় কিছুই না নিয়ে হিজরত করে তিনি দান নিতে অস্বীকার করেন এবং বাজার দেখতে চান। পনির ও মাখন ব্যবসা করে স্বাবলম্বী হন। শিক্ষা: পরিশ্রম ও সততা থাকলে বাজারই স্বনির্ভরতার পথ।", "Sahih al-Bukhari 2049"),
    ("Umar ibn al-Khattab (RA) — the market inspector", "উমর ইবনে খাত্তাব (রা.) — বাজার পরিদর্শক", "Umar personally walked the market, checked weights, punished cheating and appointed inspectors. He said no one should sell in the market who does not understand trade. Lesson: fair markets need visible, consistent regulation.", "উমর (রা.) নিজে বাজার পরিদর্শন করতেন, ওজন যাচাই করতেন, প্রতারণার শাস্তি দিতেন এবং পরিদর্শক নিয়োগ দিতেন। শিক্ষা: ন্যায্য বাজারের জন্য সুস্পষ্ট ও ধারাবাহিক নিয়ন্ত্রণ দরকার।", "Sirah; al-Bukhari"),
    ("Ali ibn Abi Talib (RA) — work and trust", "আলী ইবনে আবি তালিব (রা.) — কাজ ও আমানত", "Ali worked, traded and refused to live on the treasury. He insisted that a worker's wage is a right before the work is done. Lesson: labour is worship when rights are honoured.", "আলী (রা.) কাজ ও ব্যবসা করতেন, বাইতুলমালের ওপর নির্ভর করতেন না। তিনি শ্রমিকের মজুরিকে কাজের আগেই অধিকার বলেছেন। শিক্ষা: অধিকার রক্ষিত হলে শ্রম ইবাদত।", "Sirah; Nahj al-Balagha"),
    ("The Prophet ﷺ as Al-Amin in trade", "রাসূল ﷺ — ব্যবসায় আল-আমিন", "Before prophethood, Muhammad ﷺ traded for Khadijah and was known as al-Amin (the trustworthy). He refused to hide defects, misrepresent goods or take unfair advantage. Lesson: reputation is the longest-term asset.", "নবুওয়াতের আগে মুহাম্মদ ﷺ খাদিজার পক্ষে ব্যবসা করেন এবং আল-আমিন নামে পরিচিত হন। তিনি দোষ গোপন, পণ্যের ভুল বর্ণনা বা অন্যায় সুবিধা নিতেন না। শিক্ষা: সুনাম দীর্ঘমেয়াদি সম্পদ।", "Sirah Ibn Hisham"),
    ("Bilal ibn Rabah (RA) — honest stewardship", "বিলাল ইবনে রাবাহ (রা.) — সৎ তত্ত্বাবধান", "Bilal managed the treasury and was trusted with distribution. Lesson: the person who handles money must be more trustworthy than the money itself.", "বিলাল (রা.) বাইতুলমাল পরিচালনা করতেন এবং বণ্টনে বিশ্বস্ত ছিলেন। শিক্ষা: অর্থ পরিচালনকারীকে অর্থের চেয়েও বিশ্বস্ত হতে হবে।", "Sirah; al-Bukhari"),
    ("Zubayr ibn al-Awwam (RA) — trade and generosity", "যুবাইর ইবনে আউম (রা.) — ব্যবসা ও দানশীলতা", "Zubayr traded, invested and gave generously; his estate was large but his debts and charity were larger. Lesson: keep a clear ledger of both profit and obligation.", "যুবাইর (রা.) ব্যবসা, বিনিয়োগ ও দান করতেন; সম্পদ বড় ছিল, ঋণ ও দানও বড় ছিল। শিক্ষা: মুনাফা ও দায়িত্ব—দুটোরই হিসাব রাখো।", "Sahih al-Bukhari 3120"),
    ("Talha ibn Ubaydullah (RA) — the cloth trade", "তালহা ইবনে উবাইদুল্লাহ (রা.) — বস্ত্র বাণিজ্য", "Talha traded cloth between Syria, Iraq and Madinah and was known for fair dealing. Lesson: cross-border trade works when quality and promises are reliable.", "তালহা (রা.) সিরিয়া, ইরাক ও মদিনার মধ্যে বস্ত্র বাণিজ্য করতেন এবং ন্যায্য লেনদেনের জন্য পরিচিত ছিলেন। শিক্ষা: মান ও প্রতিশ্রুতি নির্ভরযোগ্য হলে আন্তঃসীমান্ত বাণিজ্য সফল হয়।", "Sirah; al-Bukhari"),
    ("Sa'd ibn Abi Waqqas (RA) — the arrow-maker", "সা'দ ইবনে আবি ওয়াক্কাস (রা.) — তীর নির্মাতা", "Sa'd made arrows with his own hands and sold them. Lesson: skilled craft is a noble source of income, even for a military leader.", "সা'দ (রা.) নিজ হাতে তীর তৈরি করে বিক্রি করতেন। শিক্ষা: দক্ষ কারিগরি আয়ের সম্মানজনক উৎস, এমনকি সামরিক নেতার জন্যও।", "Sirah; al-Bukhari"),
    ("Salman al-Farsi (RA) — value before price", "সালমান ফারসি (রা.) — দামের আগে মূল্য", "Salman advised buyers to inspect, ask questions and not be rushed by a seller's oath. Lesson: due diligence is part of taqwa, not distrust.", "সালমান (রা.) ক্রেতাদের পরীক্ষা, প্রশ্ন ও বিক্রেতার শপথে তাড়াহুড়ো না করার পরামর্শ দিতেন। শিক্ষা: যথাযথ যাচাই তাকওয়ার অংশ, অবিশ্বাস নয়।", "Sirah; al-Bukhari"),
    ("The Ansar and Muhajirun market partnership", "আনসার ও মুহাজিরদের বাজার অংশীদারিত্ব", "The Ansar shared homes and wealth with the Muhajirun, but the Muhajirun preferred trade to dependency. Lesson: charity is a bridge, not a permanent business model.", "আনসাররা মুহাজিরদের ঘর ও সম্পদ ভাগ করে দেন, কিন্তু মুহাজিররা নির্ভরতার চেয়ে ব্যবসাকে বেছে নেন। শিক্ষা: দান সেতু, স্থায়ী ব্যবসায়িক মডেল নয়।", "Sahih al-Bukhari 2049"),
]

# ———————————————————————————————————————————————— Growth / ethics / finance
GROWTH = [
    ("Start with a halal product, not just a profitable one", "হালাল পণ্য দিয়ে শুরু করুন, শুধু লাভজনক নয়", "Screen the product, the supply chain and the customer use. If the core value is haram, a beautiful business plan cannot purify it. Write your halal red lines before you write your budget.", "পণ্য, সরবরাহ শৃঙ্খল ও ব্যবহারের উদ্দেশ্য যাচাই করুন। মূল মূল্য হারাম হলে সুন্দর পরিকল্পনা তা হালাল করতে পারে না। বাজেটের আগে হালাল সীমারেখা লিখুন।", "Business ethics"),
    ("Put every partnership in writing", "প্রতিটি অংশীদারিত্ব লিখিত করুন", "Qur'an 2:282 commands written contracts for debts. Use a simple agreement: capital, profit share, loss share, roles, exit, and dispute resolution. Verbal goodwill is not a substitute for clarity.", "কুরআন ২:২৮২ ঋণের চুক্তি লিখতে নির্দেশ দেয়। সহজ চুক্তিতে মূলধন, মুনাফা ও ক্ষতির অংশ, দায়িত্ব, প্রস্থান ও বিরোধ নিষ্পত্তি লিখুন। মুখের সদিচ্ছা স্পষ্টতার বিকল্প নয়।", "Qur'an 2:282"),
    ("Price transparently", "স্বচ্ছভাবে মূল্য নির্ধারণ করুন", "Show the total price, taxes, delivery and return terms before payment. Hidden charges are a form of deception and destroy repeat business.", "পেমেন্টের আগে মোট মূল্য, কর, ডেলিভারি ও ফেরতের শর্ত দেখান। গোপন চার্জ এক ধরনের প্রতারণা এবং পুনঃক্রয় নষ্ট করে।", "Prophetic ethics"),
    ("Disclose every defect", "প্রতিটি ত্রুটি প্রকাশ করুন", "A disclosed defect is a fair sale; a hidden defect is a lawsuit waiting to happen. Train staff to mention scratches, delays and limitations in the same breath as benefits.", "প্রকাশিত ত্রুটি ন্যায্য বিক্রয়; গোপন ত্রুটি মামলার অপেক্ষা। কর্মীদের শেখান—সুবিধার সঙ্গে সীমাবদ্ধতাও বলা।", "Sunan Ibn Majah 2246"),
    ("Avoid riba in every layer", "প্রতিটি স্তরে সুদ এড়িয়ে চলুন", "Check overdrafts, late fees, supplier finance, buy-now-pay-later and investment structures. Prefer cash, equity, murabaha, salam, istisna, ijara and genuine profit-and-loss sharing.", "ওভারড্রাফট, দেরি ফি, সরবরাহকারী финанс, বিএনপিএল ও বিনিয়োগ কাঠামো যাচাই করুন। নগদ, ইক্যুইটি, মুরাবাহা, সালাম, ইস্তিসনা, ইজারা ও প্রকৃত লাভ-ক্ষতি ভাগ পছন্দ করুন।", "Qur'an 2:275-279"),
    ("Remove gharar (excessive uncertainty)", "অতিরিক্ত অনিশ্চয়তা (গারার) দূর করুন", "Specify what, how much, when, where and at what quality. Avoid selling what you do not own, unborn animals, unripe crops and vague delivery promises.", "কী, কত, কখন, কোথায় ও কোন মানে—সব স্পষ্ট করুন। নিজের মালিকানায় নেই এমন জিনিস, গর্ভস্থ প্রাণী, অপরিপক্ব ফসল ও অস্পষ্ট ডেলিভারি প্রতিশ্রুতি এড়ান।", "Sahih Muslim 1513"),
    ("Do not hoard or manipulate supply", "মজুতদারি ও সরবরাহ কারসাজি করবেন না", "Hoarding to raise prices harms the community and is condemned. Keep stock moving, share lead times honestly and compete on service, not scarcity.", "দাম বাড়াতে মজুতদারি সমাজের ক্ষতি করে এবং নিন্দনীয়। পণ্য চলমান রাখুন, সময়সীমা সৎভাবে জানান এবং সেবার মাধ্যমে প্রতিযোগিতা করুন।", "Sahih Muslim 1605"),
    ("Pay wages before the sweat dries", "ঘাম শুকানোর আগে মজুরি দিন", "Set a payroll date and keep it. Contractors and freelancers are workers too. Late payment is a trust breach, even if the amount is small.", "বেতনের তারিখ নির্ধারণ করুন ও রক্ষা করুন। ঠিকাদার ও ফ্রিল্যান্সারও শ্রমিক। অল্প অঙ্ক হলেও দেরি আমানত ভঙ্গ।", "Sunan Ibn Majah 2443"),
    ("Treat employees as partners in the mission", "কর্মীদের মিশনের অংশীদার ভাবুন", "Clear job descriptions, safe conditions, fair pay, training and a complaints channel reduce turnover. The Prophet ﷺ said the best leader is the servant of his people.", "স্পষ্ট কাজের বিবরণ, নিরাপদ পরিবেশ, ন্যায্য বেতন, প্রশিক্ষণ ও অভিযোগের মাধ্যম কর্মী ধরে রাখে। নবী ﷺ বলেছেন, সেরা নেতা তার লোকের সেবক।", "Sahih Muslim 1827"),
    ("Keep zakat and sadaqah in the business plan", "ব্যবসায়িক পরিকল্পনায় যাকাত ও সদকা রাখুন", "Zakat is not a year-end afterthought; calculate it on inventory, cash and receivables. A business that gives consistently is more resilient and more blessed.", "যাকাত বছর শেষের ভুলে যাওয়া বিষয় নয়; মজুত, নগদ ও প্রাপ্যের ওপর হিসাব করুন। নিয়মিত দানশীল ব্যবসা বেশি টেকসই ও বরকতময়।", "Qur'an 9:103"),
    ("Keep business and family money separate", "ব্যবসা ও পরিবারের অর্থ আলাদা রাখুন", "Use separate accounts and a written salary for family drawings. Mixing them hides the true profit and creates family disputes.", "আলাদা হিসাব ও পারিবারিক খরচের লিখিত বেতন রাখুন। মিশিয়ে ফেললে প্রকৃত মুনাফা লুকায় ও পারিবারিক বিরোধ তৈরি হয়।", "Financial stewardship"),
    ("Build a cash buffer before you expand", "সম্প্রসারণের আগে নগদ বাফার গড়ুন", "Aim for three to six months of fixed costs. Growth funded by costly debt often destroys the business it was meant to grow.", "তিন থেকে ছয় মাসের স্থায়ী খরচের বাফার রাখুন। ব্যয়বহুল ঋণে সম্প্রসারণ প্রায়ই business-কে ধ্বংস করে।", "Risk management"),
    ("Diversify customers, not just products", "পণ্য নয়, ক্রেতাও বৈচিত্র্যময় করুন", "One big customer is a single point of failure. Build a pipeline and a waiting list; no client should be more than a quarter of revenue.", "এক বড় ক্রেতা একক ব্যর্থতার ঝুঁকি। পাইপলাইন ও অপেক্ষমাণ তালিকা গড়ুন; কোনো ক্লায়েন্ট রাজস্বের এক-চতুর্থাংশের বেশি না হয়।", "Risk management"),
    ("Use Islamic finance structures correctly", "ইসলামি অর্থায়ন কাঠামো সঠিকভাবে ব্যবহার করুন", "Murabaha needs a real sale and ownership; ijara needs a real usufruct; musharakah needs genuine sharing. A label without substance is still riba.", "মুরাবাহায় প্রকৃত বিক্রয় ও মালিকানা লাগে; ইজারায় প্রকৃত উপভোগ; মুশারাকায় প্রকৃত অংশগ্রহণ। সারমর্ম ছাড়া লেবেলও সুদ।", "Islamic finance"),
    ("Invoice, record and reconcile", "চালান, রেকর্ড ও মিলকরণ করুন", "Small businesses die from untracked receivables. Invoice the same day, follow up weekly, reconcile monthly and keep receipts for zakat and tax.", "ছোট ব্যবসা অনাদায়ী প্রাপ্যের কারণে মরে। একই দিনে চালান, সাপ্তাহিক অনুসরণ, মাসিক মিলকরণ এবং যাকাত-কর জন্য রসিদ রাখুন।", "Qur'an 2:282"),
    ("Market with truth, not pressure", "চাপ নয়, সত্য দিয়ে মার্কেটিং করুন", "No fake scarcity, fake reviews, hidden subscriptions or fear-based claims. Your ad is a testimony; a false testimony is a sin.", "নকল ঘাটতি, ভুয়া রিভিউ, গোপন সাবস্ক্রিপশন বা ভয়ভিত্তিক দাবি নয়। বিজ্ঞাপন এক ধরনের সাক্ষ্য; মিথ্যা সাক্ষ্য পাপ।", "Prophetic ethics"),
    ("Protect customer data", "গ্রাহকের তথ্য সুরক্ষিত রাখুন", "Collect only what you need, protect it, and never sell it without consent. Trust is easier to lose than to rebuild.", "যতটুকু দরকার ততটুকু নিন, সুরক্ষিত রাখুন, সম্মতি ছাড়া বিক্রি করবেন না। বিশ্বাস হারানো সহজ, ফেরানো কঠিন।", "Modern ethics"),
    ("Choose partners by character and competence", "চরিত্র ও দক্ষতা দিয়ে অংশীদার বাছুন", "The Qur'an praises the strong and trustworthy hire (28:26). Check references, test small, and define decision rights before money is involved.", "কুরআন শক্তিশালী ও বিশ্বস্ত নিয়োগের প্রশংসা করে (২৮:২৬)। রেফারেন্স যাচাই করুন, ছোট পরীক্ষা করুন, অর্থ জড়ানোর আগে সিদ্ধান্তের অধিকার নির্ধারণ করুন।", "Qur'an 28:26"),
    ("Avoid bribery and 'facilitation payments'", "ঘুষ ও 'সুবিধা ফি' এড়ান", "A payment to bend a rule is bribery, even when it is called a gift or speed money. Build compliance into your cost, not your relationships.", "নিয়ম বাঁকাতে দেওয়া অর্থ ঘুষ, তা উপহার বা দ্রুতগতির টাকা নামেই হোক। সম্মতি খরচে রাখুন, সম্পর্কে নয়।", "Qur'an 2:188"),
    ("Do not let trade distract from prayer", "ব্যবসা নামাজ থেকে বিরত করুক না", "Close the laptop for prayer, keep Friday trading light, and build rest into the schedule. Barakah is not the same as busyness.", "নামাজের জন্য ল্যাপটপ বন্ধ করুন, জুমার দিন ব্যবসা হালকা রাখুন, বিশ্রামকে সময়সূচিতে রাখুন। বরকত ব্যস্ততার সমান নয়।", "Qur'an 62:10, 63:9"),
    ("Give the customer more than the contract", "চুক্তির চেয়ে বেশি দিন", "A small extra, a clear explanation or a fast return turns a buyer into an advocate. Excellence (ihsan) is a marketing strategy with an afterlife.", "একটু অতিরিক্ত, স্পষ্ট ব্যাখ্যা বা দ্রুত ফেরত ক্রেতাকে প্রচারকে পরিণত করে। ইহসান এমন মার্কেটিং যা আখিরাতেও ফল দেয়।", "Sahih Muslim 1955"),
    ("Plan for succession", "উত্তরাধিকার পরিকল্পনা করুন", "Write who takes over, train them, and document processes. A business that depends on one person is a job, not an institution.", "কে দায়িত্ব নেবে, তাকে প্রশিক্ষণ ও প্রক্রিয়া লিখিত করুন। এক ব্যক্তিনির্ভর ব্যবসা প্রতিষ্ঠান নয়, চাকরি।", "Stewardship"),
    ("Measure profit after zakat and risk", "যাকাত ও ঝুঁকির পরে মুনাফা মাপুন", "Net profit after zakat, bad debt and replacement cost is the real number. A high turnover with no reserve is fragile.", "যাকাত, কু-ঋণ ও প্রতিস্থাপন ব্যয়ের পরে নিট মুনাফাই প্রকৃত সংখ্যা। রিজার্ভহীন উচ্চ টার্নওভার ভঙ্গুর।", "Financial stewardship"),
    ("Use consultation (shura) for big decisions", "বড় সিদ্ধান্তে শূরা করুন", "The Qur'an praises those who consult (42:38). Ask an accountant, a scholar and a customer before a major pivot; then decide and own it.", "কুরআন পরামর্শকারীদের প্রশংসা করে (৪২:৩৮)। বড় পরিবর্তনের আগে হিসাবরক্ষক, আলিম ও ক্রেতাকে জিজ্ঞাসা করুন; তারপর সিদ্ধান্ত নিন।", "Qur'an 42:38"),
]

ETHICS = [
    ("Bribery", "ঘুষ", "Qur'an 2:188 forbids consuming wealth unjustly and using it to influence rulers. Compliance is cheaper than corruption.", "কুরআন ২:১৮৮ অন্যায়ভাবে সম্পদ ভক্ষণ ও শাসককে প্রভাবিত করতে তা ব্যবহার নিষিদ্ধ করে। নিয়মপালন দুর্নীতির চেয়ে সস্তা।", "Qur'an 2:188"),
    ("Gambling and speculation", "জুয়া ও অতিরিক্ত সpekulation", "Qur'an 5:90 joins gambling with intoxicants and divination. Avoid lotteries, betting and products whose return is pure chance.", "কুরআন ৫:৯০ জুয়াকে মাদক ও ভাগ্য গণনার সঙ্গে যুক্ত করে। লটারি, বাজি ও নিছক ভাগ্যভিত্তিক পণ্য এড়ান।", "Qur'an 5:90"),
    ("Intoxicants", "মাদক", "Muslims may not sell, transport, serve or invest in intoxicants. Screen hospitality, retail and logistics contracts.", "মুসলিমরা মাদক বিক্রি, পরিবহন, পরিবেশন বা বিনিয়োগ করতে পারে না। হোটেল, খুচরা ও লজিস্টিকস চুক্তি যাচাই করুন।", "Sahih Muslim 1581"),
    ("Pornography and exploitative media", "পর্নোগ্রাফি ও শোষণমূলক মিডিয়া", "Do not earn from content that violates modesty or exploits people. Ad networks and app stores increasingly enforce this too.", "শালীনতা লঙ্ঘন বা মানুষকে শোষণ করে এমন কনটেন্ট থেকে আয় করবেন না। বিজ্ঞাপন নেটওয়ার্ক ও অ্যাপ স্টোরও এটি কঠোরভাবে প্রয়োগ করে।", "Islamic ethics"),
    ("Hidden fees", "লুকানো ফি", "A fee disclosed after the decision is deception. Put every charge in the quote and the checkout.", "সিদ্ধান্তের পরে প্রকাশিত ফি প্রতারণা। প্রতিটি চার্জ কোট ও চেকআউটে দেখান।", "Prophetic ethics"),
    ("Fake reviews and false claims", "ভুয়া রিভিউ ও মিথ্যা দাবি", "Manufactured social proof is lying. Ask for real reviews, publish both good and bad, and correct mistakes publicly.", "বানানো সামাজিক প্রমাণ মিথ্যা। প্রকৃত রিভিউ চান, ভালো-মন্দ প্রকাশ করুন, ভুল প্রকাশ্যে সংশোধন করুন।", "Qur'an 9:119"),
    ("Exploitative labour", "শোষণমূলক শ্রম", "Withholding passports, unpaid overtime and unsafe sites are modern slavery. Pay, protect and document.", "পাসপোর্ট আটকে রাখা, বিনা বেতনে ওভারটাইম ও অনিরাপদ কাজ আধুনিক দাসত্ব। বেতন দিন, সুরক্ষা দিন, নথিভুক্ত করুন।", "Sahih Muslim 1827"),
    ("Monopoly abuse", "একচেটিয়া অপব্যবহার", "Dominance used to crush competitors and raise prices harms the public. Compete on quality, not on blocking access.", "প্রতিযোগী ধ্বংস ও দাম বাড়াতে আধিপত্য জনগণের ক্ষতি করে। প্রবেশ আটকানো নয়, মানে প্রতিযোগিতা করুন।", "Sahih Muslim 1605"),
    ("Environmental waste", "পরিবেশগত অপচয়", "Qur'an 7:31 forbids excess. Cut packaging, repair products, disclose emissions and choose suppliers who do the same.", "কুরআন ৭:৩১ অতিরিক্ত নিষিদ্ধ করে। প্যাকেজিং কমান, পণ্য মেরামত করুন, নির্গমন প্রকাশ করুন এবং অনুরূপ সরবরাহকারী বাছুন।", "Qur'an 7:31"),
    ("Insider trading", "ইনসাইডার ট্রেডিং", "Using confidential information to trade is a betrayal of trust (8:27). It is both illegal and unethical.", "গোপন তথ্য ব্যবহার করে লেনদেন আমানত ভঙ্গ (৮:২৭)। এটি বেআইনি ও অনৈতিক উভয়ই।", "Qur'an 8:27"),
    ("Predatory lending", "শোষণমূলক ঋণ", "Loans designed to trap borrowers in rolling charges are riba by another name. Offer clear, affordable terms or equity.", "ঋণগ্রহীতাকে ঘুরমান চার্জে আটকে রাখার ঋণ অন্য নামে সুদ। স্পষ্ট, সাশ্রয়ী শর্ত বা ইক্যুইটি দিন।", "Qur'an 2:280"),
    ("Conflict of interest", "স্বার্থের সংঘাত", "Disclose personal interests in suppliers and deals. A hidden interest turns advice into exploitation.", "সরবরাহকারী ও চুক্তিতে ব্যক্তিগত স্বার্থ প্রকাশ করুন। গোপন স্বার্থ পরামর্শকে শোষণে পরিণত করে।", "Qur'an 4:135"),
]

FINANCE = [
    ("Murabaha", "মুরাবাহা", "The bank buys the asset, takes ownership, then sells it to you at a disclosed profit. It must not be a cash loan with an interest label.", "ব্যাংক সম্পদ ক্রয় করে মালিকানা নেয়, তারপর প্রকাশিত মুনাফায় আপনার কাছে বিক্রি করে। এটি সুদি লেবেলযুক্ত নগদ ঋণ নয়।", "Islamic finance"),
    ("Musharakah", "মুশারাকাহ", "Partners contribute capital and share profit by agreement and loss by capital ratio. Roles and exit must be written.", "অংশীদাররা মূলধন দেয়, চুক্তিতে মুনাফা ও মূলধন অনুপাতে ক্ষতি ভাগ করে। দায়িত্ব ও প্রস্থান লিখিত হতে হবে।", "Islamic finance"),
    ("Mudarabah", "মুদারাবাহ", "One provides capital, the other provides work. Profit is shared; financial loss falls on the capital provider unless the manager was negligent.", "একজন মূলধন, অন্যজন শ্রম দেয়। মুনাফা ভাগ হয়; অবহেলা না হলে আর্থিক ক্ষতি মূলধনদাতার।", "Islamic finance"),
    ("Salam", "সালাম", "Full advance payment for a precisely specified good delivered later. Specification must cover quality, quantity and date.", "পরে সরবরাহের জন্য সুনির্দিষ্ট পণ্যের সম্পূর্ণ অগ্রিম মূল্য। মান, পরিমাণ ও তারিখ স্পষ্ট থাকতে হবে।", "Islamic finance"),
    ("Istisna", "ইস্তিসনা", "A manufacturing order with milestones and a defined specification. Payment can be staged as work progresses.", "মাইলফলক ও নির্দিষ্ট স্পেসিফিকেশনসহ উৎপাদন আদেশ। কাজের অগ্রগতিতে ধাপে ধাপে পেমেন্ট হতে পারে।", "Islamic finance"),
    ("Ijara", "ইজারা", "Lease the use of an asset for a rent. The lessor keeps ownership and major maintenance; the lessee pays for ordinary use.", "সম্পদের ব্যবহারের জন্য ভাড়া। মালিক মালিকানা ও বড় রক্ষণাবেক্ষণ রাখে; ভাড়াটিয়া সাধারণ ব্যবহারের খরচ দেয়।", "Islamic finance"),
    ("Takaful", "তাকাফুল", "Cooperative risk-sharing instead of conventional insurance. Contributions go to a pool; surplus and claims follow the policy.", "প্রচলিত বীমার বদলে সহযোগিতামূলক ঝুঁকি ভাগ। চাঁদা পুলে যায়; উদ্বৃত্ত ও দাবি নীতিমালা অনুযায়ী।", "Islamic finance"),
    ("Qard hasan", "কারযে হাসান", "A benevolent loan with no interest. Document it, and do not attach hidden fees or gifts as a condition.", "সুদবিহীন কল্যাণমূলক ঋণ। লিখে রাখুন; গোপন ফি বা শর্তসাপেক্ষ উপহার যুক্ত করবেন না।", "Qur'an 2:245"),
    ("Zakat on inventory", "মজুতের যাকাত", "Zakat applies to cash, receivables and goods held for sale at the zakat date. Fixed assets used in the business are generally excluded.", "যাকাতের তারিখে নগদ, প্রাপ্য ও বিক্রয়ের জন্য রাখা পণ্যের ওপর যাকাত। ব্যবসায় ব্যবহৃত স্থায়ী সম্পদ সাধারণত বাদ।", "Fiqh al-zakat"),
    ("Debt collection", "ঋণ আদায়", "Remind kindly, give time, document promises and forgive where genuine hardship exists. Harassment is not a collection strategy.", "সদয়ভাবে মনে করান, সময় দিন, প্রতিশ্রুতি লিখুন এবং প্রকৃত অসচ্ছলতায় মাফ করুন। হয়রানি আদায় কৌশল নয়।", "Qur'an 2:280"),
    ("Late fees", "দেরি ফি", "A fee that grows with time is riba. Cover real administrative cost only, and give the extra to charity.", "সময়ের সঙ্গে বাড়া ফি সুদ। কেবল প্রকৃত প্রশাসনিক ব্যয় নিন, অতিরিক্ত দান করুন।", "Islamic finance"),
    ("Profit-and-loss sharing", "লাভ-ক্ষতি ভাগ", "True Islamic finance shares both outcomes. A guaranteed return with no risk is a loan in disguise.", "প্রকৃত ইসলামি অর্থায়ন দুই ফলাফলই ভাগ করে। ঝুঁকিহীন নিশ্চিত রিটার্ন ছদ্মবেশে ঋণ।", "Islamic finance"),
]

def main():
    data = json.loads(OUT.read_text(encoding="utf-8"))
    existing = {it["id"] for sec in data["sections"] for it in sec["items"]}

    quran_items = []
    for s, a, tags, note in QURAN:
        ar, en, bn = ayah(s, a)
        quran_items.append({
            "id": f"q-{s}-{a}", "ref": f"{s}:{a}", "source": "Qur'an",
            "tags": tags, "ar": ar, "en": en, "bn": bn, "note": note,
        })

    def group(items, prefix, source, tags):
        out = []
        for i, row in enumerate(items):
            if len(row) == 3:
                en, bn, ref = row
            else:
                title, title_bn, detail, detail_bn, ref = row
                en = f"{title} — {detail}"
                bn = f"{title_bn} — {detail_bn}"
            out.append({
                "id": f"{prefix}-{i+1}", "ref": ref, "source": source,
                "tags": tags, "ar": "", "en": en, "bn": bn,
            })
        return out

    sections = [
        {"id": "quran", "title": {"en": "Qur'anic Foundations", "bn": "কুরআনিক ভিত্তি", "ar": "أسس قرآنية"}, "items": quran_items},
        {"id": "hadith", "title": {"en": "Well-Attested Hadith", "bn": "বিশুদ্ধ হাদীস", "ar": "أحاديث صحيحة"}, "items": group(HADITH, "h", "Hadith", ["hadith", "business"])},
        {"id": "sahaba", "title": {"en": "The Market of the Companions", "bn": "সাহাবাদের বাজার", "ar": "سوق الصحابة"}, "items": group(SAHABA, "s", "Sirah", ["sahaba", "business"])},
        {"id": "growth", "title": {"en": "Halal Growth Tactics Today", "bn": "আজকের হালাল প্রবৃদ্ধি", "ar": "نمو حلال"}, "items": group(GROWTH, "g", "Practical", ["growth", "business"])},
        {"id": "ethics", "title": {"en": "Modern Business Ethics", "bn": "আধুনিক ব্যবসায়িক নৈতিকতা", "ar": "أخلاق الأعمال"}, "items": group(ETHICS, "e", "Ethics", ["ethics", "business"])},
        {"id": "finance", "title": {"en": "Riba-Free Finance", "bn": "সুদমুক্ত অর্থায়ন", "ar": "تمويل إسلامي"}, "items": group(FINANCE, "f", "Finance", ["finance", "business"])},
    ]
    data["sections"] = sections
    data["subtitle"] = {"en": "Qur'anic ethics, authentic Hadith, the market of the Companions, modern ethics and riba-free finance — 145+ entries", "bn": "কুরআনিক নীতি, বিশুদ্ধ হাদীস, সাহাবাদের বাজার, আধুনিক নৈতিকতা ও সুদমুক্ত অর্থায়ন — ১৪৫+ এন্ট্রি"}
    text = json.dumps(data, ensure_ascii=False, indent=1)
    OUT.write_text(text, encoding="utf-8")
    FL.write_text(text, encoding="utf-8")
    total = sum(len(s["items"]) for s in sections)
    print("business entries:", total, "sections:", len(sections))
    for s in sections:
        print(f"  {s['id']:8} {len(s['items'])}")

if __name__ == "__main__":
    main()
