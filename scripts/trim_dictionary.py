import csv

dict_path = r'c:\Cursor\Eglish learning AI\Synoyms-and-Antonyms\content\vocabulary\YLE-2\YLE-2-Dictionary.csv'
output_path = r'c:\Cursor\Eglish learning AI\Synoyms-and-Antonyms\content\vocabulary\YLE-2\YLE-2-Dictionary_new.csv'

with open(dict_path, 'r', encoding='utf-8-sig') as f:
    reader = list(csv.DictReader(f))
    if reader:
        headers = reader[0].keys()
    else:
        headers = []

# Keep exactly 20 words
trimmed_data = reader[:20]

with open(output_path, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(trimmed_data)

print(f"Trimmed dictionary to {len(trimmed_data)} words and saved to {output_path}.")
