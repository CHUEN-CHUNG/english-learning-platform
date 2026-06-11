import csv
import random
import os
import re
import argparse
from pathlib import Path

def scramble_sentence(sentence):
    # Remove punctuation at the end of the sentence
    sentence = re.sub(r'[.?!]+$', '', sentence.strip())
    # Split into words
    words = sentence.split()
    # Optionally lower case the first word to increase difficulty
    if words and words[0].istitle():
        words[0] = words[0].lower()
    # Shuffle words
    random.shuffle(words)
    # Join with ' / '
    return ' / '.join(words)

def generate_combined_handout(dictionary_csv_path, article_md_path, output_md_path):
    """
    Reads a Dictionary.csv file and generates a combined Markdown handout
    (Vocabulary + Phrase Reorganization).
    """
    if not os.path.exists(dictionary_csv_path):
        print(f"Error: Dictionary CSV file not found at {dictionary_csv_path}")
        return False

    pdf_name = Path(dictionary_csv_path).stem.replace("-Dictionary", "")
    
    try:
        with open(dictionary_csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            words_data = list(reader)
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return False

    if not words_data:
        print("Warning: CSV file is empty.")
        return False

    # Extract title from article
    article_title = "Unknown Title"
    if article_md_path and os.path.exists(article_md_path):
        with open(article_md_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith('# '):
                    article_title = line.replace('# ', '').strip()
                    break

    # --- CSS Styles ---
    md_content = "<style>\n"
    md_content += ".vocab-block { page-break-inside: avoid; break-inside: avoid-page; display: block; width: 100%; margin-bottom: 20px; }\n"
    md_content += ".question-block { page-break-inside: avoid; break-inside: avoid-page; display: block; width: 100%; margin-bottom: 20px; }\n"
    md_content += ".phrase-text { margin-bottom: 12px; font-weight: bold; }\n"
    md_content += ".chinese-text { margin-bottom: 12px; }\n"
    md_content += ".scrambled-text { margin-bottom: 0px; }\n"
    md_content += ".separator { margin-top: 75px; margin-bottom: 20px; border: 0; border-top: 1px solid #ccc; }\n"
    md_content += ".page-break { page-break-before: always; }\n"
    md_content += "</style>\n\n"

    # ==========================================
    # PART 1: Vocabulary Handout
    # ==========================================
    md_content += f"# Vocabulary Handout: {pdf_name}\n\n"
    md_content += "---\n\n"

    for i, row in enumerate(words_data, 1):
        word = row.get('Word', '').strip()
        if not word:
            continue

        pos = row.get('POS', '').strip()
        definition = row.get('Definition', '').strip()
        
        # Synonyms
        syn_en1 = row.get('Synonym-English 1', '').strip()
        syn_ch1 = row.get('Synonym-Chinnese 1', '').strip()
        if not syn_ch1:
            syn_ch1 = row.get('Synonym-Chinese 1', '').strip()
            
        syn_en2 = row.get('Synonym-English 2', '').strip()
        syn_ch2 = row.get('Synonym-Chinese 2', '').strip()
        
        # Antonyms
        ant_en1 = row.get('Antonym-English 1', '').strip()
        ant_ch1 = row.get('Antonym-Chinese 1', '').strip()
        ant_en2 = row.get('Antonym-English 2', '').strip()
        ant_ch2 = row.get('Antonym-Chinese 2', '').strip()
        
        phrase = row.get('Phrase', '').strip()
        
        # Examples
        ex_en2 = row.get('Example-English 2', '').strip()
        ex_ch2 = row.get('Example-Chinnese 2', '').strip()
        if not ex_ch2:
            ex_ch2 = row.get('Example-Chinese 2', '').strip()

        md_content += f"<div class=\"vocab-block\">\n\n"
        md_content += f"### {i}. **{word}** ({pos})\n\n"
        
        if definition:
            md_content += f"> {definition}\n\n"
            
        # Synonyms section
        syns = []
        if syn_en1 and syn_en1.lower() not in ['無', 'none']:
            syns.append(f"{syn_en1} ({syn_ch1})" if syn_ch1 else syn_en1)
        if syn_en2 and syn_en2.lower() not in ['無', 'none']:
            syns.append(f"{syn_en2} ({syn_ch2})" if syn_ch2 else syn_en2)
            
        if syns:
            md_content += f"- **Synonym**: {' 、 '.join(syns)}\n"
        else:
            md_content += "- **Synonym**: 沒有同義詞\n"

        # Antonyms section
        ants = []
        if ant_en1 and ant_en1.lower() not in ['無', 'none']:
            ants.append(f"{ant_en1} ({ant_ch1})" if ant_ch1 else ant_en1)
        if ant_en2 and ant_en2.lower() not in ['無', 'none']:
            ants.append(f"{ant_en2} ({ant_ch2})" if ant_ch2 else ant_en2)
            
        if ants:
            md_content += f"- **Antonym**: {' 、 '.join(ants)}\n"
        else:
            md_content += "- **Antonym**: 沒有反義詞\n"

        # Phrase
        if phrase and phrase.lower() != '無' and phrase.lower() != 'none':
            md_content += f"- **Phrase**: {phrase}\n"
        else:
            md_content += "- **Phrase**: 沒有片語\n"

        # Example 2
        if ex_en2 and ex_en2.lower() != '無' and ex_en2.lower() != 'none':
            ex2_text = f"{ex_en2} ({ex_ch2})" if ex_ch2 else ex_en2
            md_content += f"- **Example**: {ex2_text}\n"
        else:
            md_content += "- **Example**: 沒有例句\n"

        # Notes section
        md_content += "- **筆記**：_____________________________________________________\n\n"
        md_content += "</div>\n\n"
        md_content += "---\n\n"

    # ==========================================
    # PART 2: Phrase Reorganization
    # ==========================================
    phrase_md_content = (
        "<style>\n"
        ".question-block { page-break-inside: avoid; break-inside: avoid-page; display: block; width: 100%; margin-bottom: 20px; }\n"
        ".phrase-text { margin-bottom: 12px; font-weight: bold; }\n"
        ".chinese-text { margin-bottom: 12px; }\n"
        ".scrambled-text { margin-bottom: 0px; }\n"
        ".separator { margin-top: 75px; margin-bottom: 20px; border: 0; border-top: 1px solid #ccc; }\n"
        "</style>\n\n"
        f"# {article_title} - Chinese-to-English Translation\n\n"
    )

    md_content += f"<div class=\"page-break\"></div>\n\n"
    md_content += f"# {article_title} - Chinese-to-English Translation\n\n"

    for row in words_data:
        phrase = row.get('Phrase', '').strip()
        chinese = row.get('Example-Chinnese 1', '').strip()
        if not chinese:
            chinese = row.get('Example-Chinese 1', '').strip()
        english = row.get('Example-English 1', '').strip()
        
        if not phrase or not english or phrase.lower() in ['無', 'none']:
            continue
        
        scrambled = scramble_sentence(english)
        block = (
            '<div class="question-block">\n'
            f'<div class="phrase-text">{phrase}</div>\n'
            f'<div class="chinese-text">{chinese}</div>\n'
            f'<div class="scrambled-text">{scrambled}</div>\n'
            '<hr class="separator">\n'
            '</div>\n\n'
        )
        md_content += block
        phrase_md_content += block

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_md_path), exist_ok=True)

    try:
        with open(output_md_path, 'w', encoding='utf-8') as f:
            f.write(md_content)
        print(f"Successfully generated Combined Markdown handout at: {output_md_path}")

        phrase_md_path = output_md_path.replace(
            os.path.join("handouts", "Handout"),
            os.path.join("handouts", "phrase-reorganization"),
        ).replace("-Handout.md", "-Phrase.md")
        os.makedirs(os.path.dirname(phrase_md_path), exist_ok=True)
        with open(phrase_md_path, 'w', encoding='utf-8') as f:
            f.write(phrase_md_content)
        print(f"Successfully generated Phrase Markdown handout at: {phrase_md_path}")
        return True
    except Exception as e:
        print(f"Error writing Markdown file: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Generate Combined Handout (Vocabulary + Phrase Reorganization).")
    parser.add_argument("csv_path", help="Path to the input {pdf_name}-Dictionary.csv file")
    parser.add_argument("--output", "-o", help="Path to the output Markdown file.")
    
    args = parser.parse_args()
    csv_path = args.csv_path
    
    # Infer unit name and construct paths
    path_parts = Path(csv_path).parts
    unit_name = "Unknown-Unit"
    
    if "vocabulary" in path_parts:
        vocab_idx = path_parts.index("vocabulary")
        if vocab_idx + 1 < len(path_parts):
            unit_name = path_parts[vocab_idx + 1]
            
    pdf_name = Path(csv_path).stem.replace("-Dictionary", "")
    
    # Infer Article MD path
    article_md_path = os.path.join("static", "content", "articles", unit_name, f"{pdf_name}-Article.md")
    
    if args.output:
        output_path = args.output
    else:
        output_path = os.path.join("static", "content", "handouts", "Handout", unit_name, f"{pdf_name}-Handout.md")
        
    generate_combined_handout(csv_path, article_md_path, output_path)

if __name__ == "__main__":
    main()
