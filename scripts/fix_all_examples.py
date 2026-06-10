import csv

fixes = {
    'Author': ('famous author', 'He is a famous author.', '他是一位著名的作家。', 'I want to be a famous author.', '我想要成為一位著名的作家。', 'She knows a famous author.', '她認識一位著名的作家。'),
    'Clever': ('clever idea', 'That is a clever idea.', '那是一個聰明的主意。', 'He has a clever idea.', '他有一個聰明的主意。', 'We need a clever idea.', '我們需要一個聰明的主意。'),
    'Delicious': ('delicious meal', 'Thank you for the delicious meal.', '謝謝這頓美味的一餐。', 'We had a delicious meal.', '我們吃了一頓美味的一餐。', 'She cooked a delicious meal.', '她煮了一頓美味的一餐。'),
    'During': ('during the class', 'Please be quiet during the class.', '上課時請保持安靜。', 'He fell asleep during the class.', '他在上課時睡著了。', 'We cannot eat during the class.', '我們上課時不能吃東西。'),
    'Disappear': ('disappear quickly', 'The clouds disappear quickly.', '雲很快就消失了。', 'The birds disappear quickly.', '鳥兒很快就消失了。', 'The snow will disappear quickly.', '雪很快就會消失。'),
    'Each': ('each student', 'Each student has a book.', '每個學生都有一本書。', 'The teacher helps each student.', '老師幫助每個學生。', 'Each student must do the homework.', '每個學生都必須做作業。'),
    'Empty': ('empty bottle', 'There is an empty bottle on the table.', '桌上有一個空瓶子。', 'Please throw away the empty bottle.', '請把空瓶子丟掉。', 'He found an empty bottle.', '他找到一個空瓶子。'),
    'Enough': ('good enough', 'Your work is good enough.', '你的工作夠好了。', 'This phone is good enough for me.', '這支手機對我來說夠好了。', 'The weather is good enough to go out.', '天氣好到可以出門了。'),
    'Field': ('soccer field', 'They play on the soccer field.', '他們在足球場上玩。', 'The soccer field is very big.', '這個足球場很大。', 'We run around the soccer field.', '我們繞著足球場跑。'),
    'Future': ('in the future', 'I want to be a doctor in the future.', '我未來想當醫生。', 'Cars will fly in the future.', '未來的車子會飛。', 'What will happen in the future?', '未來會發生什麼事？'),
    'Heavy': ('heavy rain', 'We cannot go out because of the heavy rain.', '因為下大雨，我們不能出門。', 'The heavy rain stopped.', '大雨停了。', 'I do not like heavy rain.', '我不喜歡下大雨。'),
    'Horrible': ('horrible day', 'I had a horrible day.', '我度過了糟糕的一天。', 'Yesterday was a horrible day.', '昨天是糟糕的一天。', 'It is a horrible day for a picnic.', '這對野餐來說是個糟糕的日子。'),
    'Instead': ('instead of', 'I will drink water instead of juice.', '我會喝水而不是果汁。', 'Let us walk instead of taking a bus.', '我們走路吧，不要搭公車。', 'He plays games instead of studying.', '他玩遊戲而不是讀書。'),
    'Journey': ('long journey', 'It was a long journey.', '這是一趟漫長的旅程。', 'We are ready for the long journey.', '我們準備好迎接漫長的旅程了。', 'The long journey made me tired.', '漫長的旅程讓我感到疲倦。'),
    'Journalist': ('news journalist', 'My sister is a news journalist.', '我的姐姐是一名新聞記者。', 'The news journalist asks many questions.', '新聞記者問了很多問題。', 'He wants to be a news journalist.', '他想成為一名新聞記者。'),
    'Perhaps': ('perhaps we can', 'Perhaps we can go tomorrow.', '或許我們明天可以去。', 'Perhaps we can help you.', '或許我們可以幫你。', 'Perhaps we can eat pizza.', '或許我們可以吃披薩。'),
    'Meal': ('have a meal', 'Let us have a meal together.', '我們一起吃頓飯吧。', 'They have a meal at the restaurant.', '他們在餐廳吃飯。', 'We will have a meal soon.', '我們很快就會吃飯了。'),
    'Pleased': ('be pleased with', 'I will be pleased with the gift.', '我會對這個禮物感到高興。', 'The teacher will be pleased with your work.', '老師會對你的表現感到高興。', 'She must be pleased with the result.', '她一定對結果感到高興。'),
    'Prepare': ('prepare for', 'We must prepare for the test.', '我們必須為考試做準備。', 'They prepare for the party.', '他們為派對做準備。', 'Please prepare for the trip.', '請為旅行做準備。'),
    'Silver': ('silver ring', 'She wears a silver ring.', '她戴著一枚銀戒指。', 'He bought a silver ring.', '他買了一枚銀戒指。', 'The silver ring is beautiful.', '這枚銀戒指很漂亮。'),
    'Suddenly': ('suddenly appear', 'The rabbit will suddenly appear.', '兔子會突然出現。', 'A man will suddenly appear.', '一個男人會突然出現。', 'The stars suddenly appear at night.', '星星在夜晚突然出現。'),
    'friendly': ('friendly boy', 'He is a friendly boy.', '他是一個友善的男孩。', 'I met a friendly boy today.', '我今天遇到一個友善的男孩。', 'The friendly boy helped me.', '那個友善的男孩幫助了我。'),
    'front': ('in front of', 'He stood in front of her.', '他站在她前面。', 'The car is in front of the house.', '車子在房子前面。', 'Please wait in front of the door.', '請在門前等候。'),
    'decide': ('decide to', 'I decide to look for treasure.', '我決定去尋寶。', 'We decide to go home.', '我們決定回家。', 'They decide to eat apples.', '他們決定吃蘋果。'),
    'interested': ('interested in', 'She is interested in the treasure.', '她對寶藏感興趣。', 'He is interested in history.', '他對歷史感興趣。', 'I am interested in reading.', '我對閱讀感興趣。'),
    'interesting': ('interesting story', 'This is an interesting story.', '這是一個有趣的故事。', 'He told an interesting story.', '他講了一個有趣的故事。', 'I like this interesting story.', '我喜歡這個有趣的故事。'),
    'explore': ('explore the pool', 'They want to explore the pool.', '他們想要探索這個水池。', 'Let us explore the pool together.', '我們一起探索這個水池吧。', 'We can explore the pool today.', '我們今天可以探索這個水池。'),
    'fork': ('with a fork', 'I eat with a fork.', '我用叉子吃飯。', 'She eats with a fork.', '她用叉子吃飯。', 'He plays with a fork.', '他拿著叉子玩。'),
    'full': ('full of', 'The pool is full of small fish.', '水池裡滿是小魚。', 'This box is full of toys.', '這個盒子裝滿了玩具。', 'The bag is full of books.', '這個袋子裝滿了書。'),
    'glove': ('wet glove', 'He picked up a wet glove.', '他撿起一隻濕手套。', 'She found a wet glove.', '她找到一隻濕手套。', 'I do not want to wear a wet glove.', '我不想戴濕手套。'),
    'whisper': ('whisper to', 'She will whisper to her friend.', '她會對她的朋友低語。', 'Please whisper to me.', '請對我低語。', 'He likes to whisper to his mother.', '他喜歡對他的媽媽低語。'),
    'enormous': ('enormous fish', 'That is an enormous fish.', '那是一隻巨大的魚。', 'He caught an enormous fish.', '他抓到了一隻巨大的魚。', 'I saw an enormous fish.', '我看到了一隻巨大的魚。'),
    'excellent': ('excellent idea', 'This is an excellent idea.', '這是一個極好的主意。', 'That was an excellent idea.', '那是一個極好的主意。', 'He has an excellent idea.', '他有一個極好的主意。'),
    'fetch': ('fetch the ring', 'Please fetch the ring for me.', '請幫我拿那枚戒指。', 'He will fetch the ring.', '他會去拿那枚戒指。', 'I can fetch the ring.', '我可以去拿那枚戒指。'),
    'frightening': ('frightening crab', 'That is a frightening crab.', '那是一隻可怕的螃蟹。', 'I saw a frightening crab.', '我看到一隻可怕的螃蟹。', 'The frightening crab is big.', '那隻可怕的螃蟹很大。'),
    'expensive': ('expensive ring', 'That is an expensive ring.', '那是一枚昂貴的戒指。', 'She bought an expensive ring.', '她買了一枚昂貴的戒指。', 'I want an expensive ring.', '我想要一枚昂貴的戒指。'),
    'explain': ('explain to', 'Please explain to her.', '請向她解釋。', 'Can you explain to me?', '你可以向我解釋嗎？', 'I will explain to the teacher.', '我會向老師解釋。'),
    'guess': ('guess what', 'Guess what that is?', '猜猜看那是什麼？', 'Guess what I have.', '猜猜看我有什麼。', 'Guess what he said.', '猜猜看他說了什麼。'),
    'husband': ('her husband', 'Her husband is in the hotel.', '她的丈夫在飯店裡。', 'Her husband is a doctor.', '她的丈夫是一名醫生。', 'She loves her husband.', '她愛她的丈夫。'),
    'wife': ('his wife', 'His wife lost the ring.', '他的妻子弄丟了戒指。', 'His wife is very kind.', '他的妻子非常親切。', 'He loves his wife.', '他愛他的妻子。'),
    'important': ('important treasure', 'This is an important treasure.', '這是一個重要的寶藏。', 'He found an important treasure.', '他找到了一個重要的寶藏。', 'We need the important treasure.', '我們需要這個重要的寶藏。'),
    'keep': ('keep the ring', 'She wants to keep the ring.', '她想要保留這枚戒指。', 'He will keep the ring.', '他會保留這枚戒指。', 'Please keep the ring safe.', '請好好保管這枚戒指。'),
    'middle': ('in the middle of', 'He is standing in the middle of the room.', '他站在房間的中間。', 'The tree is in the middle of the garden.', '這棵樹在花園的中間。', 'We are in the middle of the city.', '我們在城市的中央。'),
    'traffic': ('heavy traffic', 'We hate the heavy traffic.', '我們討厭擁擠的交通。', 'I was late because of the heavy traffic.', '因為交通擁擠，我遲到了。', 'There is heavy traffic today.', '今天的交通很擁擠。'),
    'London': ('visit London', 'We will visit London next year.', '我們明年要去拜訪倫敦。', 'It is my dream to visit London.', '拜訪倫敦是我的夢想。', 'They want to visit London.', '他們想去拜訪倫敦。'),
    'motorway': ('drive on the motorway', 'Be careful when you drive on the motorway.', '在高速公路上開車要小心。', 'We drive on the motorway.', '我們在高速公路上開車。', 'It is fast to drive on the motorway.', '在高速公路上開車很快。'),
    'pilot': ('airplane pilot', 'My uncle is an airplane pilot.', '我的叔叔是一名飛機飛行員。', 'It is not easy to be an airplane pilot.', '成為一名飛機飛行員很不容易。', 'He wants to be an airplane pilot.', '他想成為一名飛機飛行員。'),
    'platform': ('train platform', 'We waited at the train platform.', '我們在火車月臺等車。', 'There are many people on the train platform.', '火車月臺上有很多。', 'Please walk to the train platform.', '請走到火車月臺。'),
    'stay': ('stay at home', 'I want to stay at home today.', '我今天想待在家裡。', 'We stay at home when it rains.', '下雨時我們待在家裡。', 'Please stay at home.', '請待在家裡。'),
    'eagle': ('bald eagle', 'That is a bald eagle.', '那是一隻禿鷹。', 'The bald eagle flies very high.', '禿鷹飛得很高。', 'I saw a bald eagle.', '我看到一隻禿鷹。'),
    'find out': ('find out the truth', 'We must find out the truth.', '我們必須找出真相。', 'He wants to find out the truth.', '他想找出真相。', 'They will find out the truth.', '他們會找出真相。'),
    'factory': ('shoe factory', 'He works in a shoe factory.', '他在一家鞋廠工作。', 'This shoe factory makes many shoes.', '這家鞋廠生產很多鞋子。', 'I visited a shoe factory.', '我參觀了一家鞋廠。'),
    'office': ('post office', 'I am going to the post office.', '我要去郵局。', 'The post office is next to the school.', '郵局就在學校旁邊。', 'He works at the post office.', '他在郵局工作。'),
    'envelope': ('open the envelope', 'He will open the envelope.', '他會打開信封。', 'Please open the envelope carefully.', '請小心地打開信封。', 'She wants to open the envelope.', '她想要打開這個信封。'),
    'information': ('useful information', 'This book has a lot of useful information.', '這本書有很多有用的資訊。', 'Thank you for the useful information.', '謝謝你提供有用的資訊。', 'We need some useful information.', '我們需要一些有用的資訊。'),
    'leave': ('leave the room', 'Please leave the room.', '請離開這個房間。', 'They will leave the room soon.', '他們很快就會離開房間。', 'He wants to leave the room.', '他想離開這個房間。'),
    'festival': ('music festival', 'We went to the music festival.', '我們去了音樂節。', 'This music festival is very famous.', '這個音樂節很有名。', 'I like the music festival.', '我喜歡這個音樂節。'),
    'prize': ('win a prize', 'He will win a prize.', '他會贏得一個獎品。', 'If you work hard, you will win a prize.', '如果你努力，你就會贏得一個獎品。', 'She hopes to win a prize.', '她希望能贏得一個獎品。'),
    'shelf': ('book on the shelf', 'The book is on the shelf.', '書在架子上。', 'Please put the book on the shelf.', '請把書放在架子上。', 'I saw a book on the shelf.', '我看到架子上有一本書。')
}

def fix_file(file):
    rows = []
    with open(file, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        header = next(reader)
        word_idx = header.index('Word')
        phrase_idx = header.index('Phrase')
        ex1_en_idx = header.index('Example-English 1')
        ex1_ch_idx = header.index('Example-Chinnese 1')
        ex2_en_idx = header.index('Example-English 2')
        ex2_ch_idx = header.index('Example-Chinnese 2')
        ex3_en_idx = header.index('Example-English 3')
        ex3_ch_idx = header.index('Example-Chinnese 3')
        
        for row in reader:
            word = row[word_idx]
            if word in fixes:
                p, e1, c1, e2, c2, e3, c3 = fixes[word]
                row[phrase_idx] = p
                row[ex1_en_idx] = e1
                row[ex1_ch_idx] = c1
                row[ex2_en_idx] = e2
                row[ex2_ch_idx] = c2
                row[ex3_en_idx] = e3
                row[ex3_ch_idx] = c3
            rows.append(row)
            
    with open(file, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)

fix_file('content/vocabulary/YLE-1/YLE-1-Dictionary.csv')
fix_file('content/vocabulary/YLE-2/YLE-2-Dictionary.csv')
fix_file('content/vocabulary/YLE-3/YLE-3-Dictionary.csv')
print('Fixed all examples')
