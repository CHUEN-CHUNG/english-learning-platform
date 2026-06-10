import csv
import argparse
import os
import sys

def main():
    parser = argparse.ArgumentParser(description="建立考試單字表 CSV 檔案")
    parser.add_argument("input_csv", help="輸入的單字 CSV 檔案路徑")
    parser.add_argument("exam_name", help="考試名稱 (用於產生 [ExamName]-Word.csv)")
    
    args = parser.parse_args()
    
    input_file = args.input_csv
    exam_name = args.exam_name
    output_file = f"{exam_name}-Word.csv"
    
    if not os.path.exists(input_file):
        print(f"錯誤：找不到輸入檔案 '{input_file}'", file=sys.stderr)
        sys.exit(1)
        
    # 定義 12 個欄位名稱
    fieldnames = [
        "原始單字標號",
        "原始單字",
        "原始單字詞性",
        "原始單字中文",
        "7000字內的同義詞一單字",
        "7000字內的同義詞一中文",
        "7000字內的同義詞二單字",
        "7000字內的同義詞二中文",
        "7000字內的反義詞一單字",
        "7000字內的反義詞一中文",
        "7000字內的反義詞二單字",
        "7000字內的反義詞二中文"
    ]
    
    try:
        input_data = []
        with open(input_file, mode='r', encoding='utf-8-sig') as infile:
            reader = csv.reader(infile)
            for row in reader:
                if row:
                    input_data.append(row)
                    
        if not input_data:
            print("警告：輸入檔案為空。")
            
        # 判斷第一行是否為標頭
        has_header = False
        word_idx, pos_idx, meaning_idx = 0, 1, 2
        
        if input_data:
            first_row = [str(cell).strip().lower() for cell in input_data[0]]
            if any(h in first_row for h in ['word', '單字', '原始單字']):
                has_header = True
                for i, h in enumerate(first_row):
                    if h in ['word', '單字', '原始單字']:
                        word_idx = i
                    elif h in ['pos', 'part of speech', '詞性', '原始單字詞性']:
                        pos_idx = i
                    elif h in ['meaning', '中文', '原始單字中文', '解釋']:
                        meaning_idx = i
            
        if has_header:
            input_data = input_data[1:]
            
        with open(output_file, mode='w', encoding='utf-8-sig', newline='') as outfile:
            writer = csv.DictWriter(outfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for idx, row in enumerate(input_data, start=1):
                word = row[word_idx] if word_idx < len(row) else ""
                pos = row[pos_idx] if pos_idx < len(row) else ""
                meaning = row[meaning_idx] if meaning_idx < len(row) else ""
                
                writer.writerow({
                    "原始單字標號": str(idx),
                    "原始單字": word,
                    "原始單字詞性": pos,
                    "原始單字中文": meaning,
                    "7000字內的同義詞一單字": "",
                    "7000字內的同義詞一中文": "",
                    "7000字內的同義詞二單字": "",
                    "7000字內的同義詞二中文": "",
                    "7000字內的反義詞一單字": "",
                    "7000字內的反義詞一中文": "",
                    "7000字內的反義詞二單字": "",
                    "7000字內的反義詞二中文": ""
                })
                
        print(f"成功建立檔案：{output_file}，共處理 {len(input_data)} 筆單字。")
        
    except Exception as e:
        print(f"處理檔案時發生錯誤：{e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
