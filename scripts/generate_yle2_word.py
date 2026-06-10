import csv
import os

data = [
    ["原始單字標號", "原始單字", "原始單字詞性", "原始單字英文意思", "7000字內的同義詞一單字", "7000字內的同義詞一中文", "7000字內的同義詞二單字", "7000字內的同義詞二中文", "7000字內的反義詞一單字", "7000字內的反義詞一中文", "7000字內的反義詞二單字", "7000字內的反義詞二中文", "原始單字常用片語", "常用片語的例句一中文", "常用片語的例句一英文", "常用片語的例句二中文", "常用片語的例句二英文", "出現段落", "遊戲頁數"],
    ["22", "arrive", "v", "to reach a place", "reach", "到達", "come", "來", "leave", "離開", "depart", "出發", "arrive at the station", "我們準時到達車站。", "We arrived at the station on time.", "火車何時到達車站？", "When does the train arrive at the station?", "4", "1"],
    ["38", "believe", "v", "to think that something is true", "trust", "信任", "think", "認為", "doubt", "懷疑", "suspect", "懷疑", "believe in yourself", "你必須相信你自己。", "You must believe in yourself.", "我相信你做得到。", "I believe in you.", "2", "1"],
    ["45", "bored", "adj", "feeling tired and unhappy because nothing is interesting", "tired", "疲倦的", "dull", "乏味的", "excited", "興奮的", "interested", "感興趣的", "feel bored", "我覺得很無聊。", "I feel bored.", "他在課堂上覺得很無聊。", "He felt bored in class.", "1", "1"],
    ["97", "deep", "adj", "going far down from the top", "low", "低的", "bottom", "底部的", "shallow", "淺的", "high", "高的", "deep water", "不要游到深水區。", "Do not swim in the deep water.", "這條河的水很深。", "The river has very deep water.", "4", "1"],
    ["147", "finger", "n", "one of the five long parts at the end of your hand", "digit", "手指", "thumb", "拇指", "", "", "", "", "point a finger", "不要用手指指著別人。", "Do not point a finger at others.", "她用手指著那幅畫。", "She pointed a finger at the painting.", "6", "2"],
    ["161", "fork", "n", "a tool with three or four points used for eating", "tool", "工具", "", "", "", "", "", "", "use a fork", "我用叉子吃義大利麵。", "I use a fork to eat pasta.", "請給我一把叉子。", "Please give me a fork.", "3", "2"],
    ["176", "glove", "n", "a piece of clothing that covers your hand", "cover", "覆蓋物", "", "", "", "", "", "", "wear a glove", "冬天時我會戴手套。", "I wear a glove in winter.", "他戴著一隻黑色的手套。", "He is wearing a black glove.", "3", "2"],
    ["180", "gold", "adj + n", "a valuable yellow metal", "yellow", "黃色的", "", "", "", "", "", "", "gold ring", "她戴著一枚金戒指。", "She wears a gold ring.", "這枚金戒指很貴。", "This gold ring is very expensive.", "4", "2"],
    ["201", "hotel", "n", "a building where you pay to sleep when you are traveling", "inn", "客棧", "motel", "汽車旅館", "", "", "", "", "stay in a hotel", "我們在假期時住在一間旅館。", "We stayed in a hotel during our holiday.", "這間旅館非常舒適。", "This hotel is very comfortable.", "6", "3"],
    ["254", "lovely", "adj", "very beautiful or nice", "cute", "可愛的", "beautiful", "美麗的", "ugly", "醜陋的", "horrible", "可怕的", "lovely day", "今天真是個美好的一天。", "It is a lovely day today.", "我們度過了一個美好的一天。", "We had a lovely day.", "3", "3"],
    ["339", "problem", "n", "something that is difficult to deal with", "trouble", "麻煩", "issue", "問題", "solution", "解決方案", "answer", "答案", "solve a problem", "我們必須解決這個問題。", "We must solve this problem.", "他幫我解決了數學問題。", "He helped me solve a math problem.", "5", "3"],
    ["363", "ring", "n", "a round piece of jewelry worn on a finger", "band", "環", "circle", "圓圈", "", "", "", "", "beautiful ring", "這是一枚美麗的戒指。", "This is a beautiful ring.", "他給了她一枚美麗的戒指。", "He gave her a beautiful ring.", "4", "3"],
    ["384", "silver", "adj + n", "a valuable shiny, light grey metal", "metal", "金屬", "", "", "", "", "", "", "silver fork", "桌上有一把銀叉子。", "There is a silver fork on the table.", "這把銀叉子很舊了。", "This silver fork is very old.", "3", "4"],
    ["432", "suddenly", "adv", "quickly and unexpectedly", "quickly", "快速地", "unexpectedly", "意外地", "slowly", "緩慢地", "gradually", "逐漸地", "stop suddenly", "車子突然停了下來。", "The car stopped suddenly.", "雨突然停了。", "The rain stopped suddenly.", "2", "4"],
    ["439", "surprise", "n", "an unexpected event", "shock", "驚嚇", "wonder", "驚奇", "", "", "", "", "big surprise", "這對我來說是一個大驚喜。", "This is a big surprise for me.", "我們給了她一個大驚喜。", "We gave her a big surprise.", "6", "4"]
]

output_path = r'c:\Cursor\Eglish learning AI\Synoyms-and-Antonyms\content\vocabulary\YLE-2\YLE-2-word_new.csv'

with open(output_path, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.writer(f)
    writer.writerows(data)

print(f"Generated {output_path}")
