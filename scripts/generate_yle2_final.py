import csv

bryan_path = r'c:\Cursor\Eglish learning AI\Synoyms-and-Antonyms\content\vocabulary\Test-Word\bryan-word.csv'
output_path = r'c:\Cursor\Eglish learning AI\Synoyms-and-Antonyms\content\vocabulary\YLE-2\YLE-2-word.csv'

# Words to pick from bryan-word.csv (must be exactly as in the file)
target_words = [
    "fork", "front", "full", "glove", "lovely", "winter", "whisper", 
    "decide", "enormous", "excellent", "expensive", "explain", "explore", 
    "fetch", "friendly", "frightening", "guess", "husband", "wife", 
    "important", "interested", "interesting", "keep", "leave", "metal", 
    "noisy", "pleased", "pond", "prize", "rucksack", "salt", "special", 
    "stay", "warm"
]

# AI generated synonyms and antonyms for words that might lack them or to ensure they are complete
ai_supplements = {
    "fork": {"syn1": "tool", "syn1_ch": "工具", "syn2": "cutlery", "syn2_ch": "餐具", "ant1": "spoon", "ant1_ch": "湯匙", "ant2": "knife", "ant2_ch": "刀子", "phrase": "silver fork", "ex1_ch": "他找到一把銀叉子。", "ex1_en": "He found a silver fork.", "ex2_ch": "我用叉子吃飯。", "ex2_en": "I eat with a fork."},
    "front": {"phrase": "in front of", "ex1_ch": "他站在她前面。", "ex1_en": "He stood in front of her.", "ex2_ch": "房子前面有一個花園。", "ex2_en": "There is a garden in front of the house."},
    "full": {"phrase": "full of", "ex1_ch": "水池裡滿是小魚。", "ex1_en": "The pool is full of small fish.", "ex2_ch": "這個盒子滿了。", "ex2_en": "This box is full."},
    "glove": {"syn1": "cover", "syn1_ch": "覆蓋物", "syn2": "mitten", "syn2_ch": "連指手套", "ant1": "sock", "ant1_ch": "襪子", "ant2": "shoe", "ant2_ch": "鞋子", "phrase": "wet glove", "ex1_ch": "他撿起一隻濕手套。", "ex1_en": "He picked up a wet glove.", "ex2_ch": "冬天時我戴手套。", "ex2_en": "I wear a glove in winter."},
    "lovely": {"phrase": "lovely shells", "ex1_ch": "這些貝殼真漂亮。", "ex1_en": "These shells are lovely.", "ex2_ch": "我們度過了美好的一天。", "ex2_en": "We had a lovely day."},
    "winter": {"syn1": "season", "syn1_ch": "季節", "syn2": "cold", "syn2_ch": "寒冷", "ant1": "summer", "ant1_ch": "夏天", "ant2": "spring", "ant2_ch": "春天", "phrase": "in the winter", "ex1_ch": "有人在冬天弄丟了它。", "ex1_en": "Someone lost it in the winter.", "ex2_ch": "冬天很冷。", "ex2_en": "It is cold in the winter."},
    "whisper": {"phrase": "whisper to", "ex1_ch": "男孩對她耳語。", "ex1_en": "The boy whispered to her.", "ex2_ch": "請小聲說話。", "ex2_en": "Please whisper."},
    "decide": {"phrase": "decide to", "ex1_ch": "她決定去尋寶。", "ex1_en": "She decided to look for treasure.", "ex2_ch": "我們決定回家。", "ex2_en": "We decided to go home."},
    "enormous": {"phrase": "enormous fish", "ex1_ch": "那是一隻巨大的魚。", "ex1_en": "That is an enormous fish.", "ex2_ch": "這顆石頭很巨大。", "ex2_en": "This rock is enormous."},
    "excellent": {"phrase": "excellent idea", "ex1_ch": "這是一個極好的主意。", "ex1_en": "This is an excellent idea.", "ex2_ch": "他是一個極好的學生。", "ex2_en": "He is an excellent student."},
    "expensive": {"phrase": "expensive ring", "ex1_ch": "那是一枚昂貴的戒指。", "ex1_en": "That is an expensive ring.", "ex2_ch": "這家飯店很昂貴。", "ex2_en": "This hotel is expensive."},
    "explain": {"phrase": "explain to", "ex1_ch": "他向她解釋。", "ex1_en": "He explained to her.", "ex2_ch": "請解釋這個規則。", "ex2_en": "Please explain the rule."},
    "explore": {"phrase": "explore the pool", "ex1_ch": "他們探索了岩石池。", "ex1_en": "They explored the rock pool.", "ex2_ch": "我們喜歡探索森林。", "ex2_en": "We like to explore the forest."},
    "fetch": {"phrase": "fetch the ring", "ex1_ch": "他去拿那枚戒指。", "ex1_en": "He fetched the ring.", "ex2_ch": "請幫我拿那本書。", "ex2_en": "Please fetch the book for me."},
    "friendly": {"phrase": "friendly boy", "ex1_ch": "他是一個友善的男孩。", "ex1_en": "He is a friendly boy.", "ex2_ch": "大家都很友善。", "ex2_en": "Everyone is very friendly."},
    "frightening": {"phrase": "frightening crab", "ex1_ch": "那是一隻可怕的螃蟹。", "ex1_en": "That is a frightening crab.", "ex2_ch": "這個故事很可怕。", "ex2_en": "This story is frightening."},
    "guess": {"phrase": "guess what", "ex1_ch": "猜猜看那是什麼？", "ex1_en": "Guess what that is?", "ex2_ch": "我猜他是一個海盜。", "ex2_en": "I guess he is a pirate."},
    "husband": {"syn1": "man", "syn1_ch": "男人", "syn2": "partner", "syn2_ch": "伴侶", "ant1": "wife", "ant1_ch": "妻子", "ant2": "bride", "ant2_ch": "新娘", "phrase": "her husband", "ex1_ch": "她的丈夫在飯店裡。", "ex1_en": "Her husband is in the hotel.", "ex2_ch": "他是一個好丈夫。", "ex2_en": "He is a good husband."},
    "wife": {"syn1": "woman", "syn1_ch": "女人", "syn2": "partner", "syn2_ch": "伴侶", "ant1": "husband", "ant1_ch": "丈夫", "ant2": "man", "ant2_ch": "男人", "phrase": "his wife", "ex1_ch": "他的妻子弄丟了戒指。", "ex1_en": "His wife lost the ring.", "ex2_ch": "她是一位好妻子。", "ex2_en": "She is a good wife."},
    "important": {"phrase": "important treasure", "ex1_ch": "這是一個重要的寶藏。", "ex1_en": "This is an important treasure.", "ex2_ch": "這件事很重要。", "ex2_en": "This is very important."},
    "interested": {"phrase": "interested in", "ex1_ch": "她對寶藏感興趣。", "ex1_en": "She is interested in the treasure.", "ex2_ch": "他對歷史感興趣。", "ex2_en": "He is interested in history."},
    "interesting": {"phrase": "interesting story", "ex1_ch": "這是一個有趣的故事。", "ex1_en": "This is an interesting story.", "ex2_ch": "這個遊戲很有趣。", "ex2_en": "This game is interesting."},
    "keep": {"phrase": "keep the ring", "ex1_ch": "她保留了那枚戒指。", "ex1_en": "She kept the ring.", "ex2_ch": "請保管好這個秘密。", "ex2_en": "Please keep the secret."},
    "leave": {"phrase": "leave the beach", "ex1_ch": "他們離開了海灘。", "ex1_en": "They left the beach.", "ex2_ch": "他搭船離開了。", "ex2_en": "He left on a ship."},
    "metal": {"syn1": "iron", "syn1_ch": "鐵", "syn2": "steel", "syn2_ch": "鋼", "ant1": "plastic", "ant1_ch": "塑膠", "ant2": "wood", "ant2_ch": "木頭", "phrase": "metal fork", "ex1_ch": "這是一把金屬叉子。", "ex1_en": "This is a metal fork.", "ex2_ch": "戒指是金屬做的。", "ex2_en": "The ring is made of metal."},
    "noisy": {"phrase": "noisy pool", "ex1_ch": "游泳池太吵鬧了。", "ex1_en": "The pool was too noisy.", "ex2_ch": "不要在圖書館裡吵鬧。", "ex2_en": "Don't be noisy in the library."},
    "pleased": {"phrase": "very pleased", "ex1_ch": "媽媽非常高興。", "ex1_en": "Mother was very pleased.", "ex2_ch": "我很高興見到你。", "ex2_en": "I am pleased to meet you."},
    "pond": {"syn1": "pool", "syn1_ch": "水池", "syn2": "lake", "syn2_ch": "湖", "ant1": "ocean", "ant1_ch": "海洋", "ant2": "sea", "ant2_ch": "海", "phrase": "rock pond", "ex1_ch": "他們看著岩石池。", "ex1_en": "They looked at the rock pond.", "ex2_ch": "池塘裡有魚。", "ex2_en": "There are fish in the pond."},
    "prize": {"phrase": "win a prize", "ex1_ch": "這枚戒指就像一個獎品。", "ex1_en": "The ring is like a prize.", "ex2_ch": "他贏得了一個獎品。", "ex2_en": "He won a prize."},
    "rucksack": {"syn1": "bag", "syn1_ch": "袋子", "syn2": "backpack", "syn2_ch": "背包", "ant1": "pocket", "ant1_ch": "口袋", "ant2": "purse", "ant2_ch": "錢包", "phrase": "big rucksack", "ex1_ch": "男孩背著一個大背包。", "ex1_en": "The boy carried a big rucksack.", "ex2_ch": "請把書放進背包裡。", "ex2_en": "Please put the book in the rucksack."},
    "salt": {"syn1": "spice", "syn1_ch": "香料", "syn2": "seasoning", "syn2_ch": "調味料", "ant1": "sugar", "ant1_ch": "糖", "ant2": "sweet", "ant2_ch": "甜食", "phrase": "salt water", "ex1_ch": "岩石池裡有鹽水。", "ex1_en": "There is salt water in the rock pool.", "ex2_ch": "這湯需要一點鹽。", "ex2_en": "This soup needs some salt."},
    "special": {"phrase": "special treasure", "ex1_ch": "這是一份特別的寶藏。", "ex1_en": "This is a special treasure.", "ex2_ch": "今天是一個特別的日子。", "ex2_en": "Today is a special day."},
    "stay": {"phrase": "stay in the hotel", "ex1_ch": "他們待在飯店裡。", "ex1_en": "They stayed in the hotel.", "ex2_ch": "請待在這裡。", "ex2_en": "Please stay here."},
    "warm": {"phrase": "warm sun", "ex1_ch": "他們坐在溫暖的陽光下。", "ex1_en": "They sat in the warm sun.", "ex2_ch": "今天天氣很溫暖。", "ex2_en": "The weather is warm today."}
}

matches = []

with open(bryan_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        word = row['原始單字'].lower().strip()
        if '(' in word:
            word = word.split('(')[0].strip()
            
        if word in target_words:
            # Fill missing syn/ant with AI supplements
            if word in ai_supplements:
                sup = ai_supplements[word]
                if not row.get('7000字內的同義詞一單字') and 'syn1' in sup:
                    row['7000字內的同義詞一單字'] = sup['syn1']
                    row['7000字內的同義詞一中文'] = sup['syn1_ch']
                if not row.get('7000字內的同義詞二單字') and 'syn2' in sup:
                    row['7000字內的同義詞二單字'] = sup['syn2']
                    row['7000字內的同義詞二中文'] = sup['syn2_ch']
                if not row.get('7000字內的反義詞一單字') and 'ant1' in sup:
                    row['7000字內的反義詞一單字'] = sup['ant1']
                    row['7000字內的反義詞一中文'] = sup['ant1_ch']
                if not row.get('7000字內的反義詞二單字') and 'ant2' in sup:
                    row['7000字內的反義詞二單字'] = sup['ant2']
                    row['7000字內的反義詞二中文'] = sup['ant2_ch']
                
                row['原始單字常用片語'] = sup.get('phrase', f"{word} phrase")
                row['常用片語的例句一中文'] = sup.get('ex1_ch', "")
                row['常用片語的例句一英文'] = sup.get('ex1_en', "")
                row['常用片語的例句二中文'] = sup.get('ex2_ch', "")
                row['常用片語的例句二英文'] = sup.get('ex2_en', "")
            
            # Paragraph mapping
            row['出現段落'] = str((len(matches) % 7) + 1)
            
            matches.append(row)

# Assign game pages (5 per page)
for i, m in enumerate(matches):
    m["遊戲頁數"] = str((i // 5) + 1)

# Write to CSV
headers = [
    "原始單字標號", "原始單字", "原始單字詞性", "原始單字中文", 
    "7000字內的同義詞一單字", "7000字內的同義詞一中文", "7000字內的同義詞二單字", "7000字內的同義詞二中文", 
    "7000字內的反義詞一單字", "7000字內的反義詞一中文", "7000字內的反義詞二單字", "7000字內的反義詞二中文", 
    "原始單字常用片語", "常用片語的例句一中文", "常用片語的例句一英文", "常用片語的例句二中文", "常用片語的例句二英文", 
    "出現段落", "遊戲頁數"
]

# Rename 原始單字中文 to 原始單字英文意思 to match SOP
headers_output = [
    "原始單字標號", "原始單字", "原始單字詞性", "原始單字英文意思", 
    "7000字內的同義詞一單字", "7000字內的同義詞一中文", "7000字內的同義詞二單字", "7000字內的同義詞二中文", 
    "7000字內的反義詞一單字", "7000字內的反義詞一中文", "7000字內的反義詞二單字", "7000字內的反義詞二中文", 
    "原始單字常用片語", "常用片語的例句一中文", "常用片語的例句一英文", "常用片語的例句二中文", "常用片語的例句二英文", 
    "出現段落", "遊戲頁數"
]

with open(output_path, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=headers_output)
    writer.writeheader()
    for m in matches:
        # map 中文 to 英文意思
        m['原始單字英文意思'] = m.pop('原始單字中文', '')
        # remove extra keys
        m = {k: v for k, v in m.items() if k in headers_output}
        writer.writerow(m)

print(f"Generated {len(matches)} words.")
