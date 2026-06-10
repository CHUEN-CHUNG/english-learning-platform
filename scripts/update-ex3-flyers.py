#!/usr/bin/env python3
"""Batch rewrite Example-English 3 / Example-Chinnese 3 for YLE Flyers sentence menu."""
import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# word_key (lower) -> (Example-English 3, Example-Chinnese 3)
EX3_UPDATES = {
    # YLE-1
    "author": (
        "The famous author came to our school today.",
        "那位著名作家今天來我們學校。",
    ),
    "clever": (
        "She had a clever idea for our team game.",
        "她對我們的團隊遊戲有一個聰明的主意。",
    ),
    "during": (
        "Do not talk loudly during the class.",
        "上課期間不要大聲說話。",
    ),
    "each": (
        "Each student got an apple from the teacher.",
        "每位學生從老師那裡得到一顆蘋果。",
    ),
    "enough": (
        "This soup is not good enough for me.",
        "這碗湯對我來說不夠好。",
    ),
    "prepare": (
        "We must prepare for the camping trip.",
        "我們必須為露營之旅做準備。",
    ),
    "pleased": (
        "The teacher will be pleased with my work today.",
        "老師今天會對我的作業感到滿意。",
    ),
    "suddenly": (
        "The rabbit will suddenly appear on stage.",
        "兔子會突然出現在舞台上。",
    ),
    "delicious": (
        "Grandma made a delicious meal for us.",
        "奶奶為我們做了一頓美味的餐點。",
    ),
    "field": (
        "The soccer field is wet after the rain.",
        "大雨後足球場是濕的。",
    ),
    "meal": (
        "We will have a meal at the cafe today.",
        "我們今天會在咖啡館吃一餐。",
    ),
    "silver": (
        "She found a silver ring in the box.",
        "她在盒子裡找到一枚銀戒指。",
    ),
    "empty": (
        "There is nothing in this empty bottle.",
        "這個空瓶子裡什麼都沒有。",
    ),
    "heavy": (
        "We need umbrellas in this heavy rain today.",
        "今天這場大雨我們需要雨傘。",
    ),
    "horrible": (
        "Today was a horrible day at school.",
        "今天是在學校糟糕的一天。",
    ),
    "instead": (
        "I read a book instead of watching TV.",
        "我看書而不是看電視。",
    ),
    "disappear": (
        "The bird will disappear quickly from the cage.",
        "那隻鳥會從籠子裡快速消失。",
    ),
    "future": (
        "I want to be a doctor in the future.",
        "我未來想成為一位醫生。",
    ),
    "journey": (
        "He was tired after the long journey home.",
        "長途旅行回家後，他覺得很累。",
    ),
    "journalist": (
        "The news journalist took photos of the fire.",
        "那位新聞記者拍下了火災的照片。",
    ),
    "perhaps": (
        "Perhaps we can play outside after lunch.",
        "或許我們午餐後可以在外面玩。",
    ),
    # YLE-2
    "friendly": (
        "The friendly boy helped the old lady today.",
        "那位友善的男孩今天幫了老太太。",
    ),
    "front": (
        "There is a garden in front of my house.",
        "我家前面有一個美麗的花園。",
    ),
    "decide": (
        "We must decide to start the art project today.",
        "我們必須決定今天開始美術專案。",
    ),
    "interested": (
        "I am interested in the school basketball team.",
        "我對學校籃球隊有興趣。",
    ),
    "interesting": (
        "My brother told an interesting story last night.",
        "我哥哥昨晚講了一個有趣的故事。",
    ),
    "explore": (
        "The frog jumped in to explore the pool.",
        "青蛙跳進水裡探索這個水池。",
    ),
    "fork": (
        "Please eat your salad with a fork today.",
        "今天請用叉子吃沙拉。",
    ),
    "full": (
        "After rain the bucket is full of water.",
        "大雨後，水桶裡裝滿了水。",
    ),
    "glove": (
        "He put his wet glove near the heater.",
        "他把濕手套放在暖氣機旁邊。",
    ),
    "whisper": (
        "You must whisper to your friend in class.",
        "上課時你必須對朋友低語。",
    ),
    "enormous": (
        "They caught an enormous fish in the river.",
        "他們在河裡抓到一條巨大的魚。",
    ),
    "excellent": (
        "That is an excellent idea for our school trip.",
        "那是我們學校旅行的一個極好主意。",
    ),
    "fetch": (
        "The boy ran to fetch the ring quickly.",
        "男孩快跑過去撿回那枚戒指。",
    ),
    "frightening": (
        "That frightening crab moved towards us fast.",
        "那隻可怕的螃蟹快速朝我們移動。",
    ),
    "expensive": (
        "Keep your expensive ring in this small box.",
        "把這枚昂貴的戒指放在這個小盒子裡。",
    ),
    "explain": (
        "I need to explain to my mom after school.",
        "放學後我需要向媽媽解釋。",
    ),
    "guess": (
        "Tom can guess what is in the black box.",
        "湯姆能猜出黑盒子裡有什麼。",
    ),
    "husband": (
        "She asked her husband to carry the heavy bags.",
        "她請丈夫幫忙提重袋子。",
    ),
    "wife": (
        "He bought nice flowers for his wife today.",
        "他今天為妻子買了漂亮的花。",
    ),
    "important": (
        "The museum keeps the important treasure inside.",
        "博物館把這件重要寶物保存在裡面。",
    ),
    "keep": (
        "You can keep the ring in this wooden box.",
        "你可以把戒指放在這個木盒子裡。",
    ),
    # YLE-3 only
    "middle": (
        "Do not stop in the middle of the road.",
        "不要停在繁忙道路的中央。",
    ),
    "traffic": (
        "There is heavy traffic on this road today.",
        "今天這條路上有繁忙的車流。",
    ),
    "london": (
        "Many tourists visit London every summer.",
        "許多遊客每年夏天參訪倫敦。",
    ),
    "motorway": (
        "Sleepy drivers must not drive on the motorway today.",
        "很睏的駕駛今天不可以在高速公路上開車。",
    ),
    "pilot": (
        "I want to be an airplane pilot someday.",
        "我有一天想成為飛機駕駛員。",
    ),
    "platform": (
        "We waited on the train platform this morning.",
        "我們今天早上在火車月台等候。",
    ),
    "stay": (
        "My dog likes to stay at home every day.",
        "我的狗喜歡每天待在家裡。",
    ),
    "eagle": (
        "The bald eagle is a famous American bird.",
        "禿鷹是美國著名的鳥。",
    ),
    "find out": (
        "We need to find out the truth today.",
        "我們今天需要找出真相。",
    ),
    "factory": (
        "My father works at the local shoe factory.",
        "我父親在當地鞋廠工作。",
    ),
    "office": (
        "The post office is near our school today.",
        "郵局今天在我們學校附近。",
    ),
    "envelope": (
        "I will open the envelope after lunch today.",
        "我今天午餐後會打開信封。",
    ),
    "information": (
        "This book has useful information about trains.",
        "這本書有關火車的有用資訊。",
    ),
    "leave": (
        "The teacher asked him to leave the room.",
        "老師請他離開房間。",
    ),
    "festival": (
        "The music festival starts in the park today.",
        "音樂節今天要在公園開始。",
    ),
    "prize": (
        "He wants to win a prize at school today.",
        "他今天想在學校贏得獎品。",
    ),
    "shelf": (
        "The book on the shelf is very dusty now.",
        "書架上那本書現在很佈滿灰塵。",
    ),
}


# word_key -> Ex3-Pattern（YLE Flyers 句型菜單）
EX3_PATTERNS = {
    "author": "S + V + O",
    "clever": "S + V + O",
    "during": "片語",
    "each": "S + V + O",
    "enough": "S + be + adj",
    "prepare": "can / must + V",
    "pleased": "S + be + adj",
    "suddenly": "S + V + O",
    "delicious": "S + V + O",
    "field": "S + be + adj",
    "meal": "S + V + O",
    "silver": "S + V + O",
    "empty": "There is/are…",
    "heavy": "片語",
    "horrible": "S + be + adj",
    "instead": "片語",
    "disappear": "S + V + O",
    "future": "S + like / want + n / v-ing",
    "journey": "S + be + adj",
    "journalist": "S + V + O",
    "perhaps": "片語",
    "friendly": "S + V + O",
    "front": "There is/are…",
    "decide": "can / must + V",
    "interested": "片語",
    "interesting": "S + V + O",
    "explore": "S + V + to + V",
    "fork": "片語",
    "full": "S + be + adj",
    "glove": "S + V + O",
    "whisper": "can / must + V",
    "enormous": "S + V + O",
    "excellent": "S + be + adj",
    "fetch": "S + V + to + V",
    "frightening": "S + be + adj",
    "expensive": "S + V + O",
    "explain": "S + V + to + V",
    "guess": "S + V + O",
    "husband": "S + V + to + V",
    "wife": "S + V + O",
    "important": "S + V + O",
    "keep": "can / must + V",
    "middle": "片語",
    "traffic": "There is/are…",
    "london": "S + V + O",
    "motorway": "can / must + V",
    "pilot": "S + like / want + n / v-ing",
    "platform": "S + V + O",
    "stay": "S + like / want + n / v-ing",
    "eagle": "S + be + adj",
    "find out": "S + V + to + V",
    "factory": "S + V + O",
    "office": "S + be + adj",
    "envelope": "S + V + O",
    "information": "S + V + O",
    "leave": "S + V + to + V",
    "festival": "S + V + O",
    "prize": "S + like / want + n / v-ing",
    "shelf": "S + be + adj",
}

# word_key -> Ex3-Tense（YLE Flyers 時態菜單）
EX3_TENSES = {
    "author": "過去式",
    "clever": "過去式",
    "during": "現在簡單式",
    "each": "過去式",
    "enough": "現在簡單式",
    "prepare": "現在簡單式",
    "pleased": "未來式",
    "suddenly": "未來式",
    "delicious": "過去式",
    "field": "現在簡單式",
    "meal": "未來式",
    "silver": "過去式",
    "empty": "現在簡單式",
    "heavy": "現在簡單式",
    "horrible": "過去式",
    "instead": "過去式",
    "disappear": "未來式",
    "future": "現在簡單式",
    "journey": "過去式",
    "journalist": "過去式",
    "perhaps": "現在簡單式",
    "friendly": "過去式",
    "front": "現在簡單式",
    "decide": "現在簡單式",
    "interested": "現在簡單式",
    "interesting": "過去式",
    "explore": "過去式",
    "fork": "現在簡單式",
    "full": "現在簡單式",
    "glove": "過去式",
    "whisper": "現在簡單式",
    "enormous": "過去式",
    "excellent": "現在簡單式",
    "fetch": "過去式",
    "frightening": "過去式",
    "expensive": "現在簡單式",
    "explain": "現在簡單式",
    "guess": "現在簡單式",
    "husband": "過去式",
    "wife": "過去式",
    "important": "現在簡單式",
    "keep": "現在簡單式",
    "middle": "現在簡單式",
    "traffic": "現在簡單式",
    "london": "現在簡單式",
    "motorway": "現在簡單式",
    "pilot": "現在簡單式",
    "platform": "過去式",
    "stay": "現在簡單式",
    "eagle": "現在簡單式",
    "find out": "現在簡單式",
    "factory": "現在簡單式",
    "office": "現在簡單式",
    "envelope": "未來式",
    "leave": "過去式",
    "festival": "現在簡單式",
    "prize": "現在簡單式",
    "shelf": "現在簡單式",
}


def word_key(word: str) -> str:
    return word.strip().lower()


def update_csv(path: Path) -> int:
    with open(path, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    if not fieldnames:
        raise ValueError(f"No headers in {path}")

    ex3_en = "Example-English 3"
    ex3_zh = "Example-Chinnese 3"
    ex3_pat = "Ex3-Pattern"
    ex3_tense = "Ex3-Tense"
    if ex3_zh not in fieldnames and "Example-Chinese 3" in fieldnames:
        ex3_zh = "Example-Chinese 3"
    if ex3_pat not in fieldnames:
        idx = list(fieldnames).index(ex3_zh) + 1 if ex3_zh in fieldnames else len(fieldnames)
        fieldnames = list(fieldnames)
        fieldnames.insert(idx, ex3_pat)
    if ex3_tense not in fieldnames:
        idx = list(fieldnames).index(ex3_pat) + 1 if ex3_pat in fieldnames else len(fieldnames)
        fieldnames = list(fieldnames)
        fieldnames.insert(idx, ex3_tense)

    updated = 0
    for row in rows:
        key = word_key(row.get("Word", ""))
        if key in EX3_UPDATES:
            en, zh = EX3_UPDATES[key]
            row[ex3_en] = en
            row[ex3_zh] = zh
            updated += 1
        if key in EX3_PATTERNS:
            row[ex3_pat] = EX3_PATTERNS[key]
        if key in EX3_TENSES:
            row[ex3_tense] = EX3_TENSES[key]

    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)

    return updated


def audit(path: Path) -> list[str]:
    issues = []
    forbidden = [
        (r"\bbecause\b", "because"),
        (r"\bso\b", "so"),
        (r"\bwhen\b", "when"),
        (r"\bif\b", "if"),
        (r"\bwho\b", "who"),
        (r"\bwhich\b", "which"),
        (r";", "semicolon"),
        (r"\bor\b[^.?!]*\bor\b", "or...or"),
    ]
    with open(path, encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            w = row.get("Word", "")
            en = (row.get("Example-English 3") or "").strip()
            phrase = (row.get("Phrase") or "").strip()
            if not en:
                continue
            wc = len(en.split())
            if wc > 10:
                issues.append(f"{w}: {wc} words (>10)")
            if wc < 6:
                issues.append(f"{w}: {wc} words (<6)")
            for pat, label in forbidden:
                if re.search(pat, en, re.I):
                    issues.append(f"{w}: forbidden {label}")
            if phrase and phrase.lower() not in en.lower():
                issues.append(f"{w}: phrase '{phrase}' not in sentence")
    return issues


def main():
    paths = sorted(ROOT.glob("Content/Vocabulary/YLE-*/YLE-*-Dictionary.csv"))
    for path in paths:
        n = update_csv(path)
        print(f"Updated {n} rows in {path.relative_to(ROOT)}")
        bad = audit(path)
        if bad:
            print("  QA issues:")
            for item in bad:
                print(f"    - {item}")
        else:
            print("  QA: OK")


if __name__ == "__main__":
    main()
