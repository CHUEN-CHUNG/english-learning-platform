import argparse
import csv
import os
import re

def clean_word(word):
    """清理單字，轉小寫並移除標點符號"""
    if not word:
        return ""
    return re.sub(r'[^a-z]', '', str(word).lower())

def load_words_from_csv(filepath, word_column_index=0):
    """從 CSV 載入單字集合"""
    words = set()
    if not os.path.exists(filepath):
        return words
        
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        headers = next(reader, None) # Skip header
        for row in reader:
            if row and len(row) > word_column_index:
                word = clean_word(row[word_column_index])
                if word:
                    words.add(word)
    return words

def main():
    parser = argparse.ArgumentParser(description="單字比對邏輯，產出重複單字 CSV")
    parser.add_argument('--exam-csv', required=True, help="考試單字 CSV (Step 1 產出，或 bryan-word.csv)")
    parser.add_argument('--article-csv', required=True, help="文章單字 CSV (Step 3 產出)")
    parser.add_argument('--exclude-csv', help="排除清單 CSV (可選)")
    parser.add_argument('--output', required=True, help="輸出的 CSV 檔案名稱 (例如 YLE-3-Bryan.csv)")
    parser.add_argument('--limit', type=int, default=0, help="限制輸出的單字數量 (0 表示不限制)")
    
    args = parser.parse_args()

    # 1. 載入文章單字集合
    print(f"載入文章單字: {args.article_csv}")
    # 假設文章單字在第一欄 (index 0)
    article_words = load_words_from_csv(args.article_csv, word_column_index=0)
    print(f"文章單字數量: {len(article_words)}")

    # 2. 載入排除清單集合
    exclude_words = set()
    if args.exclude_csv:
        print(f"載入排除清單: {args.exclude_csv}")
        # 假設排除清單的單字在第二欄 (index 1) - 根據 word-picking.md，第2欄是「挑選後的單字」
        exclude_words = load_words_from_csv(args.exclude_csv, word_column_index=1)
        print(f"排除單字數量: {len(exclude_words)}")

    # 3. 讀取考試單字庫並進行比對
    print(f"讀取考試單字庫: {args.exam_csv}")
    matched_rows = []
    
    # 定義輸出的 12 個標準欄位
    output_headers = [
        "挑選後的單字標號",
        "挑選後的單字",
        "挑選後的單字詞性",
        "挑選後的單字中文",
        "7000字內的同義詞一單字",
        "7000字內的同義詞一中文",
        "7000字內的同義詞二單字",
        "7000字內的同義詞二中文",
        "7000字內的反義詞一單字",
        "7000字內的反義詞一中文",
        "7000字內的反義詞二單字",
        "7000字內的反義詞二中文"
    ]

    with open(args.exam_csv, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        exam_headers = next(reader, None)
        
        # 尋找單字欄位的 index (假設標題包含 'word' 或 '單字'，否則預設為 0)
        word_idx = 0
        if exam_headers:
            for i, h in enumerate(exam_headers):
                if 'word' in h.lower() or '單字' in h:
                    word_idx = i
                    break

        for row in reader:
            if not row or len(row) <= word_idx:
                continue
                
            word_raw = row[word_idx]
            word_clean = clean_word(word_raw)
            
            if not word_clean:
                continue
                
            # 檢查是否在排除清單中
            if word_clean in exclude_words:
                continue
                
            # 檢查是否在文章單字中
            if word_clean in article_words:
                # 建立符合輸出格式的 row
                # 這裡盡量從原始資料對應，若原始資料欄位不足則補空字串
                out_row = [""] * 12
                out_row[1] = word_raw # 挑選後的單字
                
                # 嘗試填入其他欄位 (根據實際 exam_csv 的格式，這裡做簡單的對應)
                if len(row) > 1: out_row[2] = row[1] # 詞性
                if len(row) > 2: out_row[3] = row[2] # 中文
                if len(row) > 3: out_row[4] = row[3] # 同義詞一單字
                if len(row) > 4: out_row[5] = row[4] # 同義詞一中文
                if len(row) > 5: out_row[6] = row[5] # 同義詞二單字
                if len(row) > 6: out_row[7] = row[6] # 同義詞二中文
                if len(row) > 7: out_row[8] = row[7] # 反義詞一單字
                if len(row) > 8: out_row[9] = row[8] # 反義詞一中文
                if len(row) > 9: out_row[10] = row[9] # 反義詞二單字
                if len(row) > 10: out_row[11] = row[10] # 反義詞二中文
                
                matched_rows.append(out_row)

    # 4. 處理數量限制與標號
    if args.limit > 0:
        matched_rows = matched_rows[:args.limit]
        
    for i, row in enumerate(matched_rows):
        row[0] = str(i + 1) # 填入標號

    # 5. 輸出結果
    os.makedirs(os.path.dirname(args.output) if os.path.dirname(args.output) else '.', exist_ok=True)
    with open(args.output, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(output_headers)
        writer.writerows(matched_rows)
        
    print(f"比對完成！共挑選出 {len(matched_rows)} 個單字。")
    print(f"結果已儲存至: {args.output}")

if __name__ == "__main__":
    main()
