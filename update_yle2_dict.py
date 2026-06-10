import csv

dict_path = "content/vocabulary/YLE-2/YLE-2-Dictionary.csv"
word_para_map = {
    "decide": "2",
    "enormous": "4",
    "excellent": "4",
    "expensive": "5",
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
    "important": "5",
    "interested": "2",
    "interesting": "2",
    "keep": "5"
}

rows = []
with open(dict_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    for row in reader:
        word = row['Word']
        if word in word_para_map:
            row['Para'] = word_para_map[word]
        rows.append(row)

with open(dict_path, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print("Dictionary updated.")
