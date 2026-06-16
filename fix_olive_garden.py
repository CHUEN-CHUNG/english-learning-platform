import csv

file_path = 'static/content/grammar/ordering_conversation_adj_n/Game_Ordering_Advanced.csv'

with open(file_path, 'r', encoding='utf-8-sig', errors='replace') as f:
    reader = csv.reader(f)
    data = list(reader)

# Olive Garden is row index 5 (0-indexed, but with header it's 5: 1=In-N-Out, 2=Shake Shack, 3=Pret, 4=Chipotle, 5=Olive Garden)
# Wait, let's find the row dynamically.
for row in data:
    if row[1] == 'Olive Garden':
        # order_a1 is index 6
        # Let's remove the MCQ part
        if '|' in row[6]:
            row[6] = "Yes, my name is Smith. Table of two."
            
with open(file_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerows(data)

print("Done")