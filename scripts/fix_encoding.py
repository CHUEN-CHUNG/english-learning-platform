import csv
import os

file_path = r'c:\Cursor\Eglish learning AI\Synoyms-and-Antonyms\content\vocabulary\YLE-2\YLE-2-word.csv'
fixed_file_path = r'c:\Cursor\Eglish learning AI\Synoyms-and-Antonyms\content\vocabulary\YLE-2\YLE-2-word_fixed.csv'

# Read with utf-8 or utf-8-sig
with open(file_path, 'r', encoding='utf-8-sig') as f:
    content = f.read()

# Write with utf-8-sig to ensure BOM is present for Excel
with open(fixed_file_path, 'w', encoding='utf-8-sig') as f:
    f.write(content)

print("Fixed encoding and saved to YLE-2-word_fixed.csv")
