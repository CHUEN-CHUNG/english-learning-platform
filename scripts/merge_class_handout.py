import os
import argparse
from PyPDF2 import PdfMerger

def merge_pdfs(unit_name):
    # 定義檔案路徑
    vocab_pdf = f"content/handouts/vocabulary/{unit_name}/{unit_name}-Handout.pdf"
    phrase_pdf = f"content/handouts/phrase-reorganization/{unit_name}/{unit_name}-Phrase.pdf"
    output_pdf = f"content/handouts/Class/{unit_name}/{unit_name}-Class.pdf"

    merger = PdfMerger()

    # 檢查檔案是否存在並合併
    # 預設順序：先放單字講義，再放例句重組
    if os.path.exists(vocab_pdf):
        print(f"Adding Vocabulary Handout: {vocab_pdf}")
        merger.append(vocab_pdf)
    else:
        print(f"Error: 找不到單字講義 PDF ({vocab_pdf})。請先使用 VS Code 擴充套件匯出 PDF。")
        return

    if os.path.exists(phrase_pdf):
        print(f"Adding Phrase Reorganization: {phrase_pdf}")
        merger.append(phrase_pdf)
    else:
        print(f"Warning: 找不到例句重組 PDF ({phrase_pdf})。")

    # 輸出合併後的檔案
    os.makedirs(os.path.dirname(output_pdf), exist_ok=True)
    merger.write(output_pdf)
    merger.close()
    
    print(f"\n成功合併！檔案已儲存至: {output_pdf}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Merge Vocabulary Handout PDF and Phrase Reorganization PDF into one Class PDF.")
    parser.add_argument("unit", help="單元名稱 (例如: YLE-2)")
    
    args = parser.parse_args()
    merge_pdfs(args.unit)
