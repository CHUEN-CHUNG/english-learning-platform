import csv

orgword_path = r'c:\Cursor\Eglish learning AI\Synoyms-and-Antonyms\content\vocabulary\YLE-2\YLE-2-orgword.csv'
detail_path = r'c:\Cursor\Eglish learning AI\Synoyms-and-Antonyms\content\vocabulary\Test-Word\Words-detail.csv'

org_words = set()
with open(orgword_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        org_words.add(row['Word'].lower())

matches = []
with open(detail_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        word = row['原始單字'].lower()
        if word in org_words:
            matches.append(row)

print(f"Total matches: {len(matches)}")
for m in matches:
    print(f"{m['原始單字']} ({m['原始單字詞性']})")
