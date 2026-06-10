import csv
from pathlib import Path
import sys

ROWS = [
    ["結尾", "主旨理解題 (Main Idea)", "MC", "What is the best name for the story?", "A day at the zoo", "My new school bag", "The lost puppy", "The lost puppy", "Look at the whole story. It is about a boy finding his lost dog."],
    ["結尾", "教訓/總結題 (Moral/Summary)", "MC", "What is the most important lesson in this text?", "Always tell the truth", "Never go outside in the rain", "Don't help your friends", "Always tell the truth", "At the end of the story, the boy learned that telling the truth is important."],
    ["結尾", "文章分析題 (Story Analysis)", "MC", "Who is telling the story?", "Tom", "Tom's grandpa", "A teacher", "Tom", "The story uses 'I', and we know the boy's name is Tom."],
    ["開頭", "背景理解題 (Setting)", "MC", "Where does the story happen?", "At a school", "At a farm", "In a city park", "At a farm", "Paragraph 1 says 'Tom was visiting his grandpa's farm.'"],
    ["開頭", "背景理解題 (Characters)", "MC", "Who is Mrs Green?", "Emma's teacher", "Emma's mother", "Emma's aunt", "Emma's teacher", "Paragraph 1 says 'Mrs Green, Emma's teacher, walked into the classroom.'"],
    ["全部段落", "細節理解題 (Detail)", "MC", "Where did Tom and his dad go last weekend?", "To the beach", "To the library", "To the cinema", "To the cinema", "Paragraph 2 says 'They went to the cinema to watch a movie.'"],
    ["全部段落", "細節理解題 (Detail - NOT true)", "MC", "Which sentence is NOT true?", "Tom likes pizza.", "Tom has a sister.", "Tom can swim.", "Tom has a sister.", "The text says Tom is an only child, so he doesn't have a sister."],
    ["全部段落", "推論題 (Inference)", "MC", "How does Jack probably feel at the end?", "Excited", "Worried", "Angry", "Excited", "He is smiling and jumping, which means he is excited."],
    ["全部段落", "代名詞指代題 (Pronoun Reference)", "MC", "In paragraph 2, what does 'it' refer to?", "The new bike", "The broken window", "The heavy bag", "The new bike", "The sentence before says 'He got a new bike. It was red.'"],
    ["全部段落", "因果理解題 (Cause and Effect)", "MC", "Why was the shop closed?", "It was Sunday", "It was too hot", "The owner was ill", "It was Sunday", "Paragraph 3 says 'The shop was closed because it was Sunday.'"],
    ["全部段落", "順序理解題 (Sequence)", "MC", "What did Anna do first?", "She phoned her friend", "She ate breakfast", "She packed her bag", "She ate breakfast", "The text says 'First, Anna ate breakfast. Then, she packed her bag.'"],
    ["全部段落", "對話理解題 (Dialogue)", "MC", "Paul asks: Would you like some juice?", "Yes, please.", "It's Tuesday.", "My name is Paul.", "Yes, please.", "When someone asks 'Would you like...', we answer 'Yes, please' or 'No, thank you.'"],
    ["全部段落", "文法 - 時態 (Grammar - Tense)", "MC", "Last year we ___ to London.", "go", "went", "going", "went", "'Last year' means we must use the past tense 'went'."],
    ["全部段落", "文法 - 介系詞 (Grammar - Preposition)", "MC", "The children played ___ the garden.", "in", "on", "at", "in", "We use 'in' for enclosed spaces like a garden."],
    ["備用題/字彙區", "字彙配對題 (Vocabulary)", "MC", "Which word means 'not expensive'?", "cheap", "heavy", "empty", "cheap", "'Cheap' means it does not cost a lot of money."],
    ["全部段落", "細節理解題 (Detail)", "MC", "What is the boy's favourite sport?", "Swimming", "Basketball", "Tennis", "Basketball", "Paragraph 2 says his favourite sport is basketball."]
]

HEADER = ["可出題位置", "Question_Type", "Type", "Question_Text", "Option_A", "Option_B", "Option_C", "Answer", "Explanation"]

def main():
    root = Path(__file__).resolve().parents[1]
    path = root / "Reading-YLE-Excel.csv"
    try:
        with path.open("w", newline="", encoding="utf-8-sig") as f:
            w = csv.writer(f)
            w.writerow(HEADER)
            w.writerows(ROWS)
        print("Success")
    except PermissionError:
        print("LOCKED", file=sys.stderr)

if __name__ == "__main__":
    main()
