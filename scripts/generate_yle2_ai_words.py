import csv
import random

orgword_path = r'c:\Cursor\Eglish learning AI\Synoyms-and-Antonyms\content\vocabulary\YLE-2\YLE-2-orgword.csv'
output_path = r'c:\Cursor\Eglish learning AI\Synoyms-and-Antonyms\content\vocabulary\YLE-2\YLE-2-word.csv'

# 1. Read org words and paragraphs
org_words = {}
with open(orgword_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Get the first paragraph number if multiple
        paragraphs = row['Paragraph'].split(',')
        first_para = paragraphs[0].strip() if paragraphs else "1"
        org_words[row['Word'].lower()] = first_para

# 2. AI generated dictionary for YLE-2 words that have clear synonyms and antonyms
# We will pick words from org_words that are suitable for the game (adjectives, verbs, adverbs)
ai_dict = {
    "bored": {"pos": "adj", "def": "feeling tired and unhappy because something is not interesting", "syn1": "tired", "syn1_ch": "疲倦的", "syn2": "dull", "syn2_ch": "乏味的", "ant1": "excited", "ant1_ch": "興奮的", "ant2": "interested", "ant2_ch": "感興趣的", "phrase": "feel bored", "ex1_ch": "我覺得很無聊。", "ex1_en": "I feel bored.", "ex2_ch": "他在課堂上覺得很無聊。", "ex2_en": "He felt bored in class."},
    "little": {"pos": "adj", "def": "small in size or amount", "syn1": "small", "syn1_ch": "小的", "syn2": "tiny", "syn2_ch": "微小的", "ant1": "big", "ant1_ch": "大的", "ant2": "large", "ant2_ch": "巨大的", "phrase": "a little boy", "ex1_ch": "那個小男孩在笑。", "ex1_en": "The little boy is laughing.", "ex2_ch": "我有一隻小狗。", "ex2_en": "I have a little dog."},
    "unhappy": {"pos": "adj", "def": "not happy; sad", "syn1": "sad", "syn1_ch": "悲傷的", "syn2": "miserable", "syn2_ch": "悲慘的", "ant1": "happy", "ant1_ch": "快樂的", "ant2": "glad", "ant2_ch": "高興的", "phrase": "look unhappy", "ex1_ch": "你看起來很不高興。", "ex1_en": "You look unhappy.", "ex2_ch": "她今天很不高興。", "ex2_en": "She is unhappy today."},
    "silly": {"pos": "adj", "def": "showing a lack of thought or good sense", "syn1": "foolish", "syn1_ch": "愚蠢的", "syn2": "stupid", "syn2_ch": "笨的", "ant1": "smart", "ant1_ch": "聰明的", "ant2": "clever", "ant2_ch": "機靈的", "phrase": "silly idea", "ex1_ch": "那是一個愚蠢的想法。", "ex1_en": "That is a silly idea.", "ex2_ch": "不要問愚蠢的問題。", "ex2_en": "Don't ask silly questions."},
    "funny": {"pos": "adj", "def": "making you smile or laugh", "syn1": "humorous", "syn1_ch": "幽默的", "syn2": "amusing", "syn2_ch": "有趣的", "ant1": "serious", "ant1_ch": "嚴肅的", "ant2": "boring", "ant2_ch": "無聊的", "phrase": "funny story", "ex1_ch": "他講了一個有趣的故事。", "ex1_en": "He told a funny story.", "ex2_ch": "這部電影很好笑。", "ex2_en": "This movie is very funny."},
    "small": {"pos": "adj", "def": "not large in size", "syn1": "little", "syn1_ch": "小的", "syn2": "tiny", "syn2_ch": "微小的", "ant1": "big", "ant1_ch": "大的", "ant2": "large", "ant2_ch": "巨大的", "phrase": "small fish", "ex1_ch": "池子裡有小魚。", "ex1_en": "There are small fish in the pool.", "ex2_ch": "這件衣服太小了。", "ex2_en": "This shirt is too small."},
    "lovely": {"pos": "adj", "def": "very beautiful or pleasant", "syn1": "beautiful", "syn1_ch": "美麗的", "syn2": "cute", "syn2_ch": "可愛的", "ant1": "ugly", "ant1_ch": "醜陋的", "ant2": "horrible", "ant2_ch": "可怕的", "phrase": "lovely shells", "ex1_ch": "這些貝殼真漂亮。", "ex1_en": "These shells are lovely.", "ex2_ch": "我們度過了美好的一天。", "ex2_en": "We had a lovely day."},
    "wet": {"pos": "adj", "def": "covered with water or another liquid", "syn1": "damp", "syn1_ch": "潮濕的", "syn2": "soaked", "syn2_ch": "濕透的", "ant1": "dry", "ant1_ch": "乾燥的", "ant2": "arid", "ant2_ch": "乾旱的", "phrase": "wet glove", "ex1_ch": "他撿起濕透的手套。", "ex1_en": "He picked up the wet glove.", "ex2_ch": "我的頭髮濕了。", "ex2_en": "My hair is wet."},
    "big": {"pos": "adj", "def": "large in size or amount", "syn1": "large", "syn1_ch": "大的", "syn2": "huge", "syn2_ch": "巨大的", "ant1": "small", "ant1_ch": "小的", "ant2": "little", "ant2_ch": "小的", "phrase": "big bag", "ex1_ch": "他背著一個大包包。", "ex1_en": "He carries a big bag.", "ex2_ch": "這隻狗很大。", "ex2_en": "This dog is big."},
    "old": {"pos": "adj", "def": "having lived or existed for a long time", "syn1": "aged", "syn1_ch": "年老的", "syn2": "ancient", "syn2_ch": "古老的", "ant1": "new", "ant1_ch": "新的", "ant2": "young", "ant2_ch": "年輕的", "phrase": "old pair of glasses", "ex1_ch": "他找到一副舊眼鏡。", "ex1_en": "He found an old pair of glasses.", "ex2_ch": "這棟房子很舊。", "ex2_en": "This house is old."},
    "deep": {"pos": "adj", "def": "going far down from the top", "syn1": "low", "syn1_ch": "低的", "syn2": "bottom", "syn2_ch": "底部的", "ant1": "shallow", "ant1_ch": "淺的", "ant2": "high", "ant2_ch": "高的", "phrase": "deep water", "ex1_ch": "水非常深。", "ex1_en": "The water is very deep.", "ex2_ch": "不要去深水區。", "ex2_en": "Don't go to the deep water."},
    "dangerous": {"pos": "adj", "def": "able or likely to cause harm or injury", "syn1": "unsafe", "syn1_ch": "不安全的", "syn2": "risky", "syn2_ch": "冒險的", "ant1": "safe", "ant1_ch": "安全的", "ant2": "secure", "ant2_ch": "安全的", "phrase": "dangerous place", "ex1_ch": "這裡很危險。", "ex1_en": "It is dangerous here.", "ex2_ch": "那是一項危險的運動。", "ex2_en": "That is a dangerous sport."},
    "best": {"pos": "adj", "def": "of the highest quality", "syn1": "finest", "syn1_ch": "最好的", "syn2": "greatest", "syn2_ch": "最棒的", "ant1": "worst", "ant1_ch": "最差的", "ant2": "poorest", "ant2_ch": "最劣的", "phrase": "best kind", "ex1_ch": "那是最好的寶藏。", "ex1_en": "That is the best kind of treasure.", "ex2_ch": "他是我最好的朋友。", "ex2_en": "He is my best friend."},
    "angry": {"pos": "adj", "def": "having a strong feeling against someone or something", "syn1": "mad", "syn1_ch": "生氣的", "syn2": "furious", "syn2_ch": "狂怒的", "ant1": "calm", "ant1_ch": "平靜的", "ant2": "happy", "ant2_ch": "快樂的", "phrase": "look angry", "ex1_ch": "那隻魚看起來很生氣。", "ex1_en": "That fish looks angry.", "ex2_ch": "媽媽生氣了。", "ex2_en": "Mom is angry."},
    "afraid": {"pos": "adj", "def": "feeling fear or worry", "syn1": "scared", "syn1_ch": "害怕的", "syn2": "frightened", "syn2_ch": "受驚的", "ant1": "brave", "ant1_ch": "勇敢的", "ant2": "fearless", "ant2_ch": "無畏的", "phrase": "not afraid", "ex1_ch": "我不害怕。", "ex1_en": "I am not afraid.", "ex2_ch": "她害怕狗。", "ex2_en": "She is afraid of dogs."},
    "beautiful": {"pos": "adj", "def": "very pleasing to look at", "syn1": "pretty", "syn1_ch": "漂亮的", "syn2": "lovely", "syn2_ch": "美麗的", "ant1": "ugly", "ant1_ch": "醜陋的", "ant2": "plain", "ant2_ch": "樸素的", "phrase": "beautiful ring", "ex1_ch": "這枚戒指很美麗。", "ex1_en": "The ring is beautiful.", "ex2_ch": "她有一雙美麗的眼睛。", "ex2_en": "She has beautiful eyes."},
    "surprised": {"pos": "adj", "def": "feeling or showing surprise", "syn1": "amazed", "syn1_ch": "驚奇的", "syn2": "shocked", "syn2_ch": "震驚的", "ant1": "calm", "ant1_ch": "平靜的", "ant2": "expecting", "ant2_ch": "預料中的", "phrase": "very surprised", "ex1_ch": "她感到非常驚訝。", "ex1_en": "She was very surprised.", "ex2_ch": "我們對這個消息感到驚訝。", "ex2_en": "We were surprised by the news."},
    "carefully": {"pos": "adv", "def": "with a lot of attention or thought", "syn1": "cautiously", "syn1_ch": "謹慎地", "syn2": "safely", "syn2_ch": "安全地", "ant1": "carelessly", "ant1_ch": "粗心地", "ant2": "recklessly", "ant2_ch": "魯莽地", "phrase": "carry carefully", "ex1_ch": "她小心地拿著戒指。", "ex1_en": "She carried the ring carefully.", "ex2_ch": "請小心開車。", "ex2_en": "Please drive carefully."},
    "sad": {"pos": "adj", "def": "unhappy or sorry", "syn1": "unhappy", "syn1_ch": "不高興的", "syn2": "miserable", "syn2_ch": "悲慘的", "ant1": "happy", "ant1_ch": "快樂的", "ant2": "glad", "ant2_ch": "高興的", "phrase": "look sad", "ex1_ch": "媽媽看起來很傷心。", "ex1_en": "Mom looked very sad.", "ex2_ch": "這是一個悲傷的故事。", "ex2_en": "This is a sad story."},
    "find": {"pos": "v", "def": "to discover something", "syn1": "discover", "syn1_ch": "發現", "syn2": "locate", "syn2_ch": "找出", "ant1": "lose", "ant1_ch": "失去", "ant2": "miss", "ant2_ch": "錯過", "phrase": "find it", "ex1_ch": "你在哪裡找到它的？", "ex1_en": "Where did you find it?", "ex2_ch": "我找不到我的鑰匙。", "ex2_en": "I cannot find my keys."},
    "believe": {"pos": "v", "def": "to think that something is true", "syn1": "trust", "syn1_ch": "信任", "syn2": "think", "syn2_ch": "認為", "ant1": "doubt", "ant1_ch": "懷疑", "ant2": "suspect", "ant2_ch": "懷疑", "phrase": "believe that", "ex1_ch": "你不相信我們。", "ex1_en": "You don't believe that we are here.", "ex2_ch": "我相信你。", "ex2_en": "I believe you."},
    "laugh": {"pos": "v", "def": "to smile while making sounds with your voice", "syn1": "smile", "syn1_ch": "微笑", "syn2": "giggle", "syn2_ch": "咯咯笑", "ant1": "cry", "ant1_ch": "哭泣", "ant2": "weep", "ant2_ch": "流淚", "phrase": "laugh at", "ex1_ch": "艾瑪笑了。", "ex1_en": "Emma laughed.", "ex2_ch": "不要嘲笑別人。", "ex2_en": "Don't laugh at others."},
    "stand": {"pos": "v", "def": "to be on your feet", "syn1": "rise", "syn1_ch": "起立", "syn2": "get up", "syn2_ch": "站起來", "ant1": "sit", "ant1_ch": "坐下", "ant2": "lie", "ant2_ch": "躺下", "phrase": "stand up", "ex1_ch": "她站了起來。", "ex1_en": "She stood up.", "ex2_ch": "請站在這裡。", "ex2_en": "Please stand here."},
    "pull": {"pos": "v", "def": "to move something towards yourself", "syn1": "draw", "syn1_ch": "拉", "syn2": "drag", "syn2_ch": "拖", "ant1": "push", "ant1_ch": "推", "ant2": "press", "ant2_ch": "按", "phrase": "pull out", "ex1_ch": "他把叉子拉出來。", "ex1_en": "He pulled out the fork.", "ex2_ch": "請拉開這扇門。", "ex2_en": "Please pull the door."},
    "give": {"pos": "v", "def": "to offer something to someone", "syn1": "offer", "syn1_ch": "提供", "syn2": "provide", "syn2_ch": "供給", "ant1": "take", "ant1_ch": "拿走", "ant2": "receive", "ant2_ch": "接收", "phrase": "give it to", "ex1_ch": "他把它給了艾瑪。", "ex1_en": "He gave it to Emma.", "ex2_ch": "請給我一杯水。", "ex2_en": "Please give me a glass of water."}
}

matches = []
word_id = 1001

for word, details in ai_dict.items():
    if word in org_words:
        matches.append({
            "原始單字標號": str(word_id),
            "原始單字": word,
            "原始單字詞性": details["pos"],
            "原始單字英文意思": details["def"],
            "7000字內的同義詞一單字": details["syn1"],
            "7000字內的同義詞一中文": details["syn1_ch"],
            "7000字內的同義詞二單字": details["syn2"],
            "7000字內的同義詞二中文": details["syn2_ch"],
            "7000字內的反義詞一單字": details["ant1"],
            "7000字內的反義詞一中文": details["ant1_ch"],
            "7000字內的反義詞二單字": details["ant2"],
            "7000字內的反義詞二中文": details["ant2_ch"],
            "原始單字常用片語": details["phrase"],
            "常用片語的例句一中文": details["ex1_ch"],
            "常用片語的例句一英文": details["ex1_en"],
            "常用片語的例句二中文": details["ex2_ch"],
            "常用片語的例句二英文": details["ex2_en"],
            "出現段落": org_words[word],
            "遊戲頁數": ""
        })
        word_id += 1

# Assign game pages (5 per page)
for i, m in enumerate(matches):
    m["遊戲頁數"] = str((i // 5) + 1)

# Write to CSV
headers = [
    "原始單字標號", "原始單字", "原始單字詞性", "原始單字英文意思", 
    "7000字內的同義詞一單字", "7000字內的同義詞一中文", "7000字內的同義詞二單字", "7000字內的同義詞二中文", 
    "7000字內的反義詞一單字", "7000字內的反義詞一中文", "7000字內的反義詞二單字", "7000字內的反義詞二中文", 
    "原始單字常用片語", "常用片語的例句一中文", "常用片語的例句一英文", "常用片語的例句二中文", "常用片語的例句二英文", 
    "出現段落", "遊戲頁數"
]

with open(output_path, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(matches)

print(f"Generated {len(matches)} words.")
