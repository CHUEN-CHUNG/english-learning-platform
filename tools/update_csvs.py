import csv
import os

# New headers
HEADERS = [
    "原始單字標號", "原始單字", "原始單字詞性", "原始單字英文意思",
    "7000字內的同義詞一單字", "7000字內的同義詞一中文", "7000字內的同義詞二單字", "7000字內的同義詞二中文",
    "7000字內的反義詞一單字", "7000字內的反義詞一中文", "7000字內的反義詞二單字", "7000字內的反義詞二中文",
    "原始單字常用片語", "常用片語的例句一中文", "常用片語的例句一英文", "常用片語的例句二中文", "常用片語的例句二英文"
]

# Data for YLE-2
YLE2_DATA = {
    "102": {"en_meaning": "a book where you write what happens every day", "phrase": "keep a diary", "ex1_zh": "她每天寫日記。", "ex1_en": "She keeps a diary every day.", "ex2_zh": "寫日記是一個好習慣。", "ex2_en": "Keeping a diary is a good habit."},
    "104": {"en_meaning": "a very big animal that lived a long time ago", "phrase": "dinosaur fossil", "ex1_zh": "我們在博物館看到了恐龍化石。", "ex1_en": "We saw a dinosaur fossil in the museum.", "ex2_zh": "這塊恐龍化石非常古老。", "ex2_en": "This dinosaur fossil is very old."},
    "120": {"en_meaning": "very, very big", "phrase": "enormous elephant", "ex1_zh": "那是一隻巨大的大象。", "ex1_en": "That is an enormous elephant.", "ex2_zh": "這隻巨大的大象吃很多草。", "ex2_en": "This enormous elephant eats a lot of grass."},
    "132": {"en_meaning": "to make something easy to understand", "phrase": "explain the rules", "ex1_zh": "老師解釋了遊戲規則。", "ex1_en": "The teacher explained the rules.", "ex2_zh": "你能向我解釋這些規則嗎？", "ex2_en": "Can you explain the rules to me?"},
    "133": {"en_meaning": "to travel to a new place to learn about it", "phrase": "explore the forest", "ex1_zh": "我們想去探索這座森林。", "ex1_en": "We want to explore the forest.", "ex2_zh": "探索森林很有趣。", "ex2_en": "It is fun to explore the forest."},
    "134": {"en_meaning": "no longer alive today", "phrase": "become extinct", "ex1_zh": "恐龍已經滅絕了。", "ex1_en": "Dinosaurs have become extinct.", "ex2_zh": "我們必須保護動物以免牠們滅絕。", "ex2_en": "We must protect animals so they don't become extinct."},
    "165": {"en_meaning": "making you feel afraid", "phrase": "frightening movie", "ex1_zh": "那是一部令人驚嚇的電影。", "ex1_en": "That was a frightening movie.", "ex2_zh": "我不喜歡看令人驚嚇的電影。", "ex2_en": "I don't like watching frightening movies."},
    "195": {"en_meaning": "things that happened in the past", "phrase": "history book", "ex1_zh": "我正在讀一本歷史書。", "ex1_en": "I am reading a history book.", "ex2_zh": "這本歷史書很有趣。", "ex2_en": "This history book is very interesting."},
    "199": {"en_meaning": "to want something good to happen", "phrase": "hope for the best", "ex1_zh": "我們只能抱著最好的希望。", "ex1_en": "We can only hope for the best.", "ex2_zh": "即使很困難，我們也要抱著最好的希望。", "ex2_en": "Even if it's hard, we must hope for the best."},
    "211": {"en_meaning": "facts or details about something", "phrase": "useful information", "ex1_zh": "這本書有很多有用的資訊。", "ex1_en": "This book has a lot of useful information.", "ex2_zh": "謝謝你提供有用的資訊。", "ex2_en": "Thank you for the useful information."},
    "212": {"en_meaning": "a small animal with six legs", "phrase": "flying insect", "ex1_zh": "那是一隻會飛的昆蟲。", "ex1_en": "That is a flying insect.", "ex2_zh": "我怕會飛的昆蟲。", "ex2_en": "I am afraid of flying insects."},
    "216": {"en_meaning": "keeping your attention because it is cool", "phrase": "interesting story", "ex1_zh": "這是一個有趣的故事。", "ex1_en": "This is an interesting story.", "ex2_zh": "他告訴我們一個有趣的故事。", "ex2_en": "He told us an interesting story."},
    "272": {"en_meaning": "a hard material like iron or gold", "phrase": "metal box", "ex1_zh": "這是一個金屬盒子。", "ex1_en": "This is a metal box.", "ex2_zh": "他把硬幣放在金屬盒子裡。", "ex2_en": "He put the coins in a metal box."},
    "287": {"en_meaning": "a place where you can see old and special things", "phrase": "art museum", "ex1_zh": "我們週末去了美術館。", "ex1_en": "We went to the art museum on the weekend.", "ex2_zh": "這家美術館有很多名畫。", "ex2_en": "This art museum has many famous paintings."},
    "294": {"en_meaning": "making a lot of loud sounds", "phrase": "noisy classroom", "ex1_zh": "這間教室太喧鬧了。", "ex1_en": "This classroom is too noisy.", "ex2_zh": "老師要喧鬧的教室安靜下來。", "ex2_en": "The teacher asked the noisy classroom to be quiet."},
    "314": {"en_meaning": "the time before now", "phrase": "in the past", "ex1_zh": "在過去，人們沒有手機。", "ex1_en": "In the past, people didn't have cell phones.", "ex2_zh": "我們應該從過去學習。", "ex2_en": "We should learn from the past."},
    "315": {"en_meaning": "a small road for walking", "phrase": "walk along the path", "ex1_zh": "我們沿著小徑散步。", "ex1_en": "We walked along the path.", "ex2_zh": "沿著這條小徑走，你就會看到花園。", "ex2_en": "Walk along the path, and you will see the garden."},
    "319": {"en_meaning": "a part of something", "phrase": "a piece of cake", "ex1_zh": "這對我來說是小事一樁（一塊蛋糕）。", "ex1_en": "This is a piece of cake for me.", "ex2_zh": "我吃了一塊蛋糕。", "ex2_en": "I ate a piece of cake."},
    "408": {"en_meaning": "different from others in a good way", "phrase": "special gift", "ex1_zh": "這是一份特別的禮物。", "ex1_en": "This is a special gift.", "ex2_zh": "我為媽媽準備了一份特別的禮物。", "ex2_en": "I prepared a special gift for my mom."},
    "506": {"en_meaning": "the hard material that trees are made of", "phrase": "made of wood", "ex1_zh": "這張桌子是木頭做的。", "ex1_en": "This table is made of wood.", "ex2_zh": "木頭做的玩具很安全。", "ex2_en": "Toys made of wood are very safe."}
}

# Data for YLE-3
YLE3_DATA = {
    "124": {"en_meaning": "a paper cover for a letter", "phrase": "open the envelope", "ex1_zh": "他打開了信封。", "ex1_en": "He opened the envelope.", "ex2_zh": "請小心地打開信封。", "ex2_en": "Please open the envelope carefully."},
    "135": {"en_meaning": "a big building where things are made", "phrase": "shoe factory", "ex1_zh": "他在一家鞋廠工作。", "ex1_en": "He works in a shoe factory.", "ex2_zh": "這家鞋廠每天生產很多鞋子。", "ex2_en": "This shoe factory makes many shoes every day."},
    "166": {"en_meaning": "the part that comes first", "phrase": "in front of", "ex1_zh": "他在房子前面。", "ex1_en": "He is in front of the house.", "ex2_zh": "請站在門前面。", "ex2_en": "Please stand in front of the door."},
    "275": {"en_meaning": "the center part of something", "phrase": "in the middle of", "ex1_zh": "他站在房間的中間。", "ex1_en": "He is standing in the middle of the room.", "ex2_zh": "這棵樹在花園的中間。", "ex2_en": "The tree is in the middle of the garden."},
    "303": {"en_meaning": "a room where people work at desks", "phrase": "post office", "ex1_zh": "我要去郵局寄信。", "ex1_en": "I am going to the post office to send a letter.", "ex2_zh": "郵局就在學校旁邊。", "ex2_en": "The post office is next to the school."},
    "382": {"en_meaning": "a flat board on a wall to put things on", "phrase": "book on the shelf", "ex1_zh": "書在架子上。", "ex1_en": "The book is on the shelf.", "ex2_zh": "請把玩具放在架子上。", "ex2_en": "Please put the toys on the shelf."},
    "417": {"en_meaning": "to not leave a place", "phrase": "stay at home", "ex1_zh": "我今天想待在家裡。", "ex1_en": "I want to stay at home today.", "ex2_zh": "下雨時我們待在家裡。", "ex2_en": "We stay at home when it rains."},
    "463": {"en_meaning": "all the cars moving on a road", "phrase": "heavy traffic", "ex1_zh": "今天早上的交通很擁擠。", "ex1_en": "The traffic is heavy this morning.", "ex2_zh": "因為交通擁擠，我遲到了。", "ex2_en": "I was late because of the heavy traffic."},
    "109": {"en_meaning": "a large bird that flies very high", "phrase": "bald eagle", "ex1_zh": "那是一隻禿鷹。", "ex1_en": "That is a bald eagle.", "ex2_zh": "禿鷹飛得很高。", "ex2_en": "The bald eagle flies very high."},
    "142": {"en_meaning": "a special day when people celebrate", "phrase": "music festival", "ex1_zh": "我們週末去了音樂節。", "ex1_en": "We went to the music festival on the weekend.", "ex2_zh": "這個音樂節很有名。", "ex2_en": "This music festival is very famous."},
    "148": {"en_meaning": "to learn or discover something", "phrase": "find out the truth", "ex1_zh": "我們必須找出真相。", "ex1_en": "We must find out the truth.", "ex2_zh": "他想找出真相。", "ex2_en": "He wants to find out the truth."},
    "211": {"en_meaning": "facts or details about something", "phrase": "useful information", "ex1_zh": "這本書有很多有用的資訊。", "ex1_en": "This book has a lot of useful information.", "ex2_zh": "謝謝你提供有用的資訊。", "ex2_en": "Thank you for the useful information."},
    "215": {"en_meaning": "wanting to know more about something", "phrase": "interested in", "ex1_zh": "我對科學很感興趣。", "ex1_en": "I am interested in science.", "ex2_zh": "他對學習英文很感興趣。", "ex2_en": "He is interested in learning English."},
    "216": {"en_meaning": "keeping your attention because it is cool", "phrase": "interesting story", "ex1_zh": "這是一個有趣的故事。", "ex1_en": "This is an interesting story.", "ex2_zh": "他告訴我們一個有趣的故事。", "ex2_en": "He told us an interesting story."},
    "208": {"en_meaning": "having great value or meaning", "phrase": "important meeting", "ex1_zh": "我今天有一個重要的會議。", "ex1_en": "I have an important meeting today.", "ex2_zh": "這是一個非常重要的會議。", "ex2_en": "This is a very important meeting."},
    "242": {"en_meaning": "to go away from a place", "phrase": "leave the room", "ex1_zh": "請離開這個房間。", "ex1_en": "Please leave the room.", "ex2_zh": "他生氣地離開了房間。", "ex2_en": "He left the room angrily."},
    "251": {"en_meaning": "the capital city of the UK", "phrase": "visit London", "ex1_zh": "我們明年要去拜訪倫敦。", "ex1_en": "We will visit London next year.", "ex2_zh": "拜訪倫敦是我的夢想。", "ex2_en": "It is my dream to visit London."},
    "285": {"en_meaning": "a big road where cars drive fast", "phrase": "drive on the motorway", "ex1_zh": "在高速公路上開車要小心。", "ex1_en": "Be careful when you drive on the motorway.", "ex2_zh": "我們在高速公路上開車。", "ex2_en": "We are driving on the motorway."},
    "320": {"en_meaning": "a person who flies a plane", "phrase": "airplane pilot", "ex1_zh": "我的叔叔是一名飛機飛行員。", "ex1_en": "My uncle is an airplane pilot.", "ex2_zh": "成為一名飛機飛行員很不容易。", "ex2_en": "It is not easy to be an airplane pilot."},
    "324": {"en_meaning": "a place where you wait for a train", "phrase": "train platform", "ex1_zh": "我們在火車月臺等車。", "ex1_en": "We waited at the train platform.", "ex2_zh": "火車月臺上有很多。", "ex2_en": "There are many people on the train platform."},
    "338": {"en_meaning": "something you win in a game", "phrase": "win a prize", "ex1_zh": "他贏得了一個獎品。", "ex1_en": "He won a prize.", "ex2_zh": "如果你努力，你就會贏得一個獎品。", "ex2_en": "If you work hard, you will win a prize."}
}

def process_csv(filepath, data_dict):
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        rows = list(reader)
    
    # Process rows
    new_rows = []
    # Header
    new_rows.append(HEADERS)
    
    # Data rows
    for row in rows[1:]:
        if not row or not row[0].strip():
            continue
        word_id = row[0].strip()
        
        # Base columns (1 to 3)
        new_row = row[:3]
        
        # Column 4: English meaning (replaces Chinese meaning)
        if word_id in data_dict:
            new_row.append(data_dict[word_id]["en_meaning"])
        else:
            new_row.append("")
            
        # Columns 5 to 12: Synonyms and Antonyms
        # Original row has 12 columns. We take indices 4 to 11.
        while len(row) < 12:
            row.append("")
        new_row.extend(row[4:12])
        
        # Columns 13 to 17: Phrases and Examples
        if word_id in data_dict:
            new_row.append(data_dict[word_id]["phrase"])
            new_row.append(data_dict[word_id]["ex1_zh"])
            new_row.append(data_dict[word_id]["ex1_en"])
            new_row.append(data_dict[word_id]["ex2_zh"])
            new_row.append(data_dict[word_id]["ex2_en"])
        else:
            new_row.extend(["", "", "", "", ""])
            
        new_rows.append(new_row)
        
    with open(filepath, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(new_rows)

if __name__ == '__main__':
    process_csv('content/vocabulary/YLE-2/YLE-2-Bryan.csv', YLE2_DATA)
    process_csv('vocabulary/YLE-3/YLE-3-Bryan.csv', YLE3_DATA)
    print("CSV files updated successfully.")
