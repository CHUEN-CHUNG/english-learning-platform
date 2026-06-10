import csv
import re

# 1. Update Dictionary
dict_path = "content/vocabulary/YLE-2/YLE-2-Dictionary.csv"
word_para_map = {
    "decide": "2",
    "enormous": "4",
    "excellent": "4",
    "expensive": "4",
    "explain": "5",
    "explore": "3",
    "fetch": "4",
    "fork": "3",
    "friendly": "1",
    "frightening": "4",
    "front": "1",
    "full": "3",
    "glove": "3",
    "guess": "5",
    "husband": "5",
    "wife": "5",
    "important": "4",
    "interested": "2",
    "interesting": "2",
    "keep": "5"
}

rows = []
with open(dict_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    for row in reader:
        word = row['Word']
        if word in word_para_map:
            row['Para'] = word_para_map[word]
        rows.append(row)

with open(dict_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)


# 2. Generate Reading QA (10 per paragraph, 5 paragraphs)
reading_qa_path = "content/ReadingQA/YLE-2-ReadingQA.csv"
reading_qas = [
    # Paragraph 1
    ["Q01", "1", "MC", "Where was Emma?", "At a school", "At the beach", "In a city park", "At a hospital", "At the beach", "Paragraph 1 says 'Emma walked down to the beach and sat on the sand.'"],
    ["Q02", "1", "MC", "Who was Emma with on holiday?", "Her friends", "Her parents", "Her teacher", "Her sister", "Her parents", "Paragraph 1 says 'Emma was on holiday with her parents.'"],
    ["Q03", "1", "MC", "Why was Emma bored at the swimming pool?", "There were too many people", "The water was cold", "She couldn't swim", "It was raining", "There were too many people", "Paragraph 1 says 'There were too many people in the swimming pool.'"],
    ["Q04", "1", "MC", "What did Emma's mum and dad want to do?", "Play tennis", "Swim in the pool", "Sit in the sun", "Look for treasure", "Sit in the sun", "Paragraph 1 says 'her mum and dad just wanted to sit in the sun.'"],
    ["Q05", "1", "MC", "What hit Emma on the head?", "A book", "A tennis ball", "A beach ball", "A shell", "A beach ball", "Paragraph 1 says 'Then something hit her on the head. It was a beach ball.'"],
    ["Q06", "1", "MC", "Who is the little boy?", "Emma's brother", "A boy who is six or seven", "A lifeguard", "Emma's friend", "A boy who is six or seven", "Paragraph 1 says 'He was only about six or seven.'"],
    ["Q07", "1", "MC", "Which sentence is NOT true about Emma in paragraph 1?", "She wanted to play tennis.", "She was on holiday.", "She was very happy.", "She sat on the sand.", "She was very happy.", "The text says Emma was bored and unhappy."],
    ["Q08", "1", "MC", "How does Emma probably feel when the ball hits her?", "Excited", "Happy", "Annoyed", "Scared", "Annoyed", "She thought it was a boring day and wanted the boy to go away."],
    ["Q09", "1", "MC", "What did the little boy say when the ball hit Emma?", "Hello!", "Sorry!", "Watch out!", "Catch!", "Sorry!", "Paragraph 1 says ''Sorry!' a little boy said.'"],
    ["Q10", "1", "MC", "Why did the little boy talk to Emma?", "Because she looked unhappy", "Because he wanted to play tennis", "Because he lost his parents", "Because he was hungry", "Because she looked unhappy", "Paragraph 1 says 'But you look unhappy. What's the matter?'"],

    # Paragraph 2
    ["Q11", "2", "MC", "Where are the little boy's parents?", "At the hotel", "By the island", "In the pool", "On the beach", "By the island", "Paragraph 2 says 'They're out there by the island.'"],
    ["Q12", "2", "MC", "Who does the little boy say he is?", "The son of a king", "The son of a pirate", "A student", "A swimmer", "The son of a pirate", "Paragraph 2 says 'I'm the son of a pirate, he said.'"],
    ["Q13", "2", "MC", "Why did Emma laugh?", "The boy told a joke", "She thought his idea was silly", "She saw a funny dog", "She was happy", "She thought his idea was silly", "She laughed because she thought pirates are only in stories and there was no ship."],
    ["Q14", "2", "MC", "Why can't Emma see the pirate ship?", "It is too dark", "It is behind the island", "Because she believes pirates are only in stories", "Because she is not wearing glasses", "Because she believes pirates are only in stories", "Paragraph 2 says 'You can't see it because you believe that we're only in stories.'"],
    ["Q15", "2", "MC", "Which of the following is true about Emma in paragraph 2?", "She ran away.", "She thought the boy was funny.", "She was angry.", "She went to sleep.", "She thought the boy was funny.", "Paragraph 2 says 'Emma thought the little boy was funny.'"],
    ["Q16", "2", "MC", "How did Emma's feeling change at the end of paragraph 2?", "She became sad", "She suddenly didn't feel bored", "She felt hungry", "She felt tired", "She suddenly didn't feel bored", "Paragraph 2 says 'suddenly she didn't feel bored.'"],
    ["Q17", "2", "MC", "What did Emma say?", "Go away!", "Let's look for treasure!", "Where is my mum?", "I want to swim!", "Let's look for treasure!", "Paragraph 2 says ''OK,' she said, and stood up. 'Let's look for treasure!''"],
    ["Q18", "2", "MC", "Where did the boy point?", "At the hotel", "At some rocks", "At the island", "At the sky", "At some rocks", "Paragraph 2 says 'The boy pointed at some rocks.'"],
    ["Q19", "2", "MC", "In paragraph 2, what does 'it' refer to in 'You can't see it'?", "The island", "The treasure", "The pirate ship", "The beach", "The pirate ship", "The boy is talking about their ship."],
    ["Q20", "2", "MC", "Why did Emma stand up?", "To go back to the hotel", "To look for treasure with the boy", "To find her parents", "To play tennis", "To look for treasure with the boy", "She agreed to look for treasure with the boy."],

    # Paragraph 3
    ["Q21", "3", "MC", "What was in the pools of sea water?", "Big sharks", "Small fish and shells", "Old shoes", "Pirate ships", "Small fish and shells", "Paragraph 3 says 'They were full of small fish and shells.'"],
    ["Q22", "3", "MC", "What was the first kind of 'treasure' they found?", "A gold ring", "Lovely shells", "A silver fork", "Old glasses", "Lovely shells", "The boy says 'Those shells are lovely... They're a kind of treasure.'"],
    ["Q23", "3", "MC", "What blue thing did Emma see in the rock pool?", "A hat", "A glove", "A ball", "A fish", "A glove", "Paragraph 3 says 'Then she saw something blue in the rock pool too... It's a glove, isn't it?'"],
    ["Q24", "3", "MC", "Where did the boy put the wet glove?", "In his pocket", "In a big bag", "On his head", "On the rock", "In a big bag", "Paragraph 3 says 'and put it in a big bag that he carried on his shoulder.'"],
    ["Q25", "3", "MC", "What did Emma find at the bottom of the next rock pool?", "A silver fork", "A gold ring", "A blue glove", "A small crab", "A silver fork", "Paragraph 3 says 'It looks like a silver fork.'"],
    ["Q26", "3", "MC", "Who pulled the silver fork out of the water?", "Emma", "The little boy", "Emma's mum", "A pirate", "The little boy", "Paragraph 3 says 'He pulled out the silver fork and put it in his bag too.'"],
    ["Q27", "3", "MC", "What was the last thing they found in paragraph 3?", "A silver fork", "A gold ring", "An old pair of glasses", "A blue glove", "An old pair of glasses", "Paragraph 3 says 'There was an old pair of glasses in another rock pool.'"],
    ["Q28", "3", "MC", "Which sentence is NOT true about paragraph 3?", "They found a blue glove.", "They found an old pair of glasses.", "They found a gold ring.", "They found a silver fork.", "They found a gold ring.", "The gold ring is found in paragraph 4, not paragraph 3."],
    ["Q29", "3", "MC", "How did the boy feel when they found the glasses?", "He was angry", "He was sad", "He laughed", "He cried", "He laughed", "Paragraph 3 says ''More treasure!' he laughed.'"],
    ["Q30", "3", "MC", "Who pointed to the glasses?", "The pirate", "The little boy", "Emma", "Her mother", "Emma", "Paragraph 3 says 'She pointed to them'"],

    # Paragraph 4
    ["Q31", "4", "MC", "What was the water like in the new rock pool?", "Very hot", "Very, very deep", "Very dirty", "Very cold", "Very, 
