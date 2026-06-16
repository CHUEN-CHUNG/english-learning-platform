import csv

file_path = 'static/content/grammar/ordering_conversation_adj_n/Game_Ordering_Advanced.csv'

with open(file_path, 'r', encoding='utf-8-sig', errors='replace') as f:
    reader = csv.reader(f)
    data = list(reader)

# Update checkout_h1 for all restaurant scenarios (row index 1 to 5)
# checkout_h1 is at index 34
for row in data[1:]:
    if len(row) > 34:
        row[34] = "Hint: Tell the server you want to pay the bill."

with open(file_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerows(data)

print("Done updating checkout hints.")