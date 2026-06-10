import csv
import re

bryan_path = r'c:\Cursor\Eglish learning AI\Synoyms-and-Antonyms\content\vocabulary\Test-Word\bryan-word.csv'
article_path = r'c:\Cursor\Eglish learning AI\Synoyms-and-Antonyms\content\Article\YLE-2\YLE-2-Article.md'

with open(article_path, 'r', encoding='utf-8') as f:
    article_text = f.read().lower()

bryan_words = []
with open(bryan_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        word = row['原始單字'].lower().strip()
        # handle cases like "fall (UK autumn)"
        if '(' in word:
            word = word.split('(')[0].strip()
        bryan_words.append((row['原始單字標號'], word, row))

matches = []
for id, word, row in bryan_words:
    # check if word is in article
    if re.search(r'\b' + re.escape(word) + r'\b', article_text):
        matches.append((word, "in article", row))

print(f"Direct matches in article: {len(matches)}")
for m in matches:
    print(m[0])
