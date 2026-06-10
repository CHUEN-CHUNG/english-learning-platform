import os
import re
import csv
from collections import defaultdict

def extract_words_from_md(md_file_path, csv_file_path):
    if not os.path.exists(md_file_path):
        print(f"File not found: {md_file_path}")
        return

    with open(md_file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    word_stats = defaultdict(lambda: {'freq': 0, 'paragraphs': set()})
    
    paragraph_num = 0
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Count non-empty lines. If it's a title, we might assign it paragraph 0.
        if line.startswith('#'):
            p_idx = 0 # Title
        else:
            paragraph_num += 1
            p_idx = paragraph_num
            
        # Extract words: lowercase, keep alphabetic characters and internal apostrophes
        words = re.findall(r"[a-zA-Z]+(?:'[a-zA-Z]+)?", line.lower())
        
        for w in words:
            # Clean up leading/trailing apostrophes just in case
            w = w.strip("'")
            if w:
                word_stats[w]['freq'] += 1
                word_stats[w]['paragraphs'].add(p_idx)

    # Sort words alphabetically
    sorted_words = sorted(word_stats.keys())

    with open(csv_file_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Word', 'Frequency', 'Paragraph'])
        for w in sorted_words:
            freq = word_stats[w]['freq']
            # Sort paragraphs and join with comma
            paras = sorted(list(word_stats[w]['paragraphs']))
            # Replace 0 with 'Title'
            para_str = ", ".join(["Title" if p == 0 else str(p) for p in paras])
            writer.writerow([w, freq, para_str])

    print(f"Generated {csv_file_path} with {len(sorted_words)} unique words.")

def main():
    articles = [
        ("content/Article/YLE-1-Article.md", "content/vocabulary/YLE-1/YLE-1-orgword.csv"),
        ("content/Article/YLE-2-Article.md", "content/vocabulary/YLE-2/YLE-2-orgword.csv"),
        ("content/Article/YLE-3-Article.md", "content/vocabulary/YLE-3/YLE-3-orgword.csv")
    ]
    
    for md_path, csv_path in articles:
        # Ensure output directory exists
        os.makedirs(os.path.dirname(csv_path), exist_ok=True)
        extract_words_from_md(md_path, csv_path)

if __name__ == "__main__":
    main()
