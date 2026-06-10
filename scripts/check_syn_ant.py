import csv

orgword_path = r'c:\Cursor\Eglish learning AI\Synoyms-and-Antonyms\content\vocabulary\YLE-2\YLE-2-orgword.csv'
detail_path = r'c:\Cursor\Eglish learning AI\Synoyms-and-Antonyms\content\vocabulary\Test-Word\Words-detail.csv'

org_words = {}
with open(orgword_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        org_words[row['Word'].lower()] = row['Paragraph']

matches = []
with open(detail_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        word = row['原始單字'].lower()
        if word in org_words:
            row['Paragraph'] = org_words[word]
            matches.append(row)

for m in matches:
    print(f"{m['原始單字']} | {m['7000字內的同義詞一單字']} | {m['7000字內的反義詞一單字']}")
