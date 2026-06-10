import csv
import pandas as pd

yle1_path = r'c:\Cursor\Eglish learning AI\Synoyms-and-Antonyms\content\vocabulary\YLE-1\YLE-1-Dictionary.xlsx'
yle2_word_path = r'c:\Cursor\Eglish learning AI\Synoyms-and-Antonyms\content\vocabulary\YLE-2\YLE-2-word.csv'
output_path = r'c:\Cursor\Eglish learning AI\Synoyms-and-Antonyms\content\vocabulary\YLE-2\YLE-2-Dictionary.csv'

# 1. Get YLE-1 words
df_yle1 = pd.read_excel(yle1_path)
yle1_words = set(str(w).lower().strip() for w in df_yle1.iloc[:, 0].dropna())

# 2. Read YLE-2 words and filter
new_rows = []
with open(yle2_word_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        word = row['原始單字'].strip().lower()
        if word in yle1_words:
            print(f"Skipping '{word}' as it is already in YLE-1.")
            continue
            
        new_row = {
            'Word': row['原始單字'],
            'POS': row['原始單字詞性'],
            'Definition': row['原始單字英文意思'],
            'Synonym-English 1': row['7000字內的同義詞一單字'],
            'Synonym-Chinnese 1': row['7000字內的同義詞一中文'],
            'Antonym-English 1': row['7000字內的反義詞一單字'],
            'Antonym-Chinese 1': row['7000字內的反義詞一中文'],
            'Synonym-English 2': row['7000字內的同義詞二單字'],
            'Synonym-Chinese 2': row['7000字內的同義詞二中文'],
            'Antonym-English 2': row['7000字內的反義詞二單字'],
            'Antonym-Chinese 2': row['7000字內的反義詞二中文'],
            'Phrase': row['原始單字常用片語'],
            'Example-English 1': row['常用片語的例句一英文'],
            'Example-Chinnese 1': row['常用片語的例句一中文'],
            'Example-English 2': row['常用片語的例句二英文'],
            'Example-Chinnese 2': row['常用片語的例句二中文'],
            'CEFR': 'A1'  # Default level
        }
        new_rows.append(new_row)

# 3. Write output
fieldnames = [
    'Word', 'POS', 'Definition', 
    'Synonym-English 1', 'Synonym-Chinnese 1', 
    'Antonym-English 1', 'Antonym-Chinese 1',
    'Synonym-English 2', 'Synonym-Chinese 2', 
    'Antonym-English 2', 'Antonym-Chinese 2',
    'Phrase', 'Example-English 1', 'Example-Chinnese 1', 
    'Example-English 2', 'Example-Chinnese 2', 'CEFR'
]

with open(output_path, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(new_rows)

print(f"Generated {len(new_rows)} words in {output_path}")
