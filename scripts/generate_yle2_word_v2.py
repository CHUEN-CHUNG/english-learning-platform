import csv
import os

detail_path = r'c:\Cursor\Eglish learning AI\Synoyms-and-Antonyms\content\vocabulary\Test-Word\Words-detail.csv'
orgword_path = r'c:\Cursor\Eglish learning AI\Synoyms-and-Antonyms\content\vocabulary\YLE-2\YLE-2-orgword.csv'
output_path = r'c:\Cursor\Eglish learning AI\Synoyms-and-Antonyms\content\vocabulary\YLE-2\YLE-2-word_new.csv'

# 1. Read org words and paragraphs
org_words = {}
with open(orgword_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Get the first paragraph number if multiple
        paragraphs = row['Paragraph'].split(',')
        first_para = paragraphs[0].strip() if paragraphs else "1"
        org_words[row['Word'].lower()] = first_para

# 2. Find matches in Words-detail and filter those with both synonyms and antonyms
matches = []
with open(detail_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        word = row['原始單字'].lower()
        if word in org_words:
            # Check if it has both synonym and antonym
            syn = row.get('7000字內的同義詞一單字', '').strip()
            ant = row.get('7000字內的反義詞一單字', '').strip()
            if syn and ant:
                matches.append({
                    "原始單字標號": row.get('原始單字標號', ''),
                    "原始單字": row.get('原始單字', ''),
                    "原始單字詞性": row.get('原始單字詞性', ''),
                    "原始單字英文意思": row.get('原始單字中文', ''), # Using Chinese definition as placeholder or we can leave it
                    "7000字內的同義詞一單字": row.get('7000字內的同義詞一單字', ''),
                    "7000字內的同義詞一中文": row.get('7000字內的同義詞一中文', ''),
                    "7000字內的同義詞二單字": row.get('7000字內的同義詞二單字', ''),
                    "7000字內的同義詞二中文": row.get('7000字內的同義詞二中文', ''),
                    "7000字內的反義詞一單字": row.get('7000字內的反義詞一單字', ''),
                    "7000字內的反義詞一中文": row.get('7000字內的反義詞一中文', ''),
                    "7000字內的反義詞二單字": row.get('7000字內的反義詞二單字', ''),
                    "7000字內的反義詞二中文": row.get('7000字內的反義詞二中文', ''),
                    "原始單字常用片語": f"{row.get('原始單字', '')} phrase",
                    "常用片語的例句一中文": f"這是一個關於 {row.get('原始單字', '')} 的例句。",
                    "常用片語的例句一英文": f"This is an example sentence for {row.get('原始單字', '')}.",
                    "常用片語的例句二中文": f"這是另一個關於 {row.get('原始單字', '')} 的例句。",
                    "常用片語的例句二英文": f"This is another example sentence for {row.get('原始單字', '')}.",
                    "出現段落": org_words[word],
                    "遊戲頁數": ""
                })

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

print(f"Generated {len(matches)} words with both synonyms and antonyms.")
