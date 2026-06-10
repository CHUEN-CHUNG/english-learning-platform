# -*- coding: utf-8 -*-
import csv
from pathlib import Path

ROWS = [
    (
        "結尾；或讀完全文後",
        "主旨理解題／最佳標題 (Main Idea)",
        "What is the best title for this text?",
        "A day at the space museum",
        "How to build a rocket",
        "My favourite science teacher",
        "The history of planets",
    ),
    (
        "全部段落適用",
        "細節理解題 (Specific Detail)",
        "Where did the students go for their school trip?",
        "To the space museum",
        "To the local hospital",
        "To the new sports centre",
        "To the city library",
    ),
    (
        "全部段落適用",
        "推論題 (Inference)",
        "How did the children probably feel when they saw the spaceship?",
        "Amazed and excited",
        "Bored and tired",
        "Angry and upset",
        "Afraid and worried",
    ),
    (
        "詞彙出現之段落",
        "詞彙語境題 (Vocabulary in Context)",
        "What does the word 'enormous' mean in paragraph 2?",
        "Very big",
        "Very small",
        "Really fast",
        "Quite cheap",
    ),
    (
        "指代詞出現之句",
        "代名詞指代題 (Pronoun Reference)",
        "In paragraph 3, what does 'they' refer to?",
        "The astronauts",
        "The planets",
        "The students",
        "The teachers",
    ),
    (
        "結尾；或讀完全文後",
        "寫作目的題 (Author's Purpose)",
        "Why did the author write this text?",
        "To tell a story about a trip",
        "To explain how to do homework",
        "To sell tickets to a museum",
        "To complain about the weather",
    ),
    (
        "包含多個事實之段落",
        "資訊檢索題 (Information Retrieval)",
        "How many hours did the trip take?",
        "Four hours",
        "Two hours",
        "Three hours",
        "Five hours",
    ),
    (
        "全部段落適用",
        "是非題轉換：正確陳述鑑別題 (True Statement)",
        "Which of the following is true about the spaceship?",
        "It was made of metal.",
        "It was painted green.",
        "It was very small.",
        "It was broken.",
    ),
    (
        "全部段落適用",
        "是非題轉換：不正確陳述鑑別題 (NOT True Statement)",
        "Which sentence is NOT true about the trip?",
        "They ate lunch on the bus.",
        "They saw a real spacesuit.",
        "They bought souvenirs.",
        "They met an astronaut.",
    ),
    (
        "對話或互動段落",
        "對話理解題 (Dialogue Response)",
        "What did the guide say when Tom asked a question?",
        "That's a great question!",
        "It's half past two.",
        "I don't like pizza.",
        "My name is Sarah.",
    ),
    (
        "句子中空格處",
        "克漏字選擇題 (Cloze - Grammar/Vocabulary)",
        "The museum was ___ than they thought.",
        "bigger",
        "big",
        "biggest",
        "loudly",
    ),
    (
        "比較兩段資訊時",
        "比較／異同理解題 (Comparison)",
        "What is the difference between the first and second floor of the museum?",
        "The first floor has older things.",
        "The second floor is darker.",
        "The first floor is only for adults.",
        "The second floor has a café.",
    ),
    (
        "事件轉折處",
        "因果／理由理解題 (Cause and Effect)",
        "Why couldn't they go inside the spaceship?",
        "Because it was too dangerous.",
        "Because it was too late.",
        "Because they didn't have tickets.",
        "Because it was cleaning time.",
    ),
    (
        "簡答題轉換",
        "擷取關鍵字題 (Wh- Question)",
        "What did the students buy at the gift shop?",
        "Postcards and pens",
        "Apples and bananas",
        "Books and bags",
        "Sweets and drinks",
    ),
]

HEADER = [
    "可出題位置",
    "Question_Type",
    "問題一",
    "選項A",
    "選項B",
    "選項C",
    "選項D",
]

def main():
    root = Path(__file__).resolve().parents[1]
    path = root / "Reading-YLE-2026.csv"
    with path.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(HEADER)
        w.writerows(ROWS)
    print(f"Created {path.name}")

if __name__ == "__main__":
    main()
