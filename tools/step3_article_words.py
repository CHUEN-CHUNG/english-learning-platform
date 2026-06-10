import argparse
import csv
import re
import os

def extract_words_from_markdown(input_path, output_path):
    """
    從 Markdown 檔案中擷取所有不重複的英文單字，並輸出為 CSV 檔案。
    """
    if not os.path.exists(input_path):
        print(f"錯誤：找不到輸入檔案 '{input_path}'")
        return

    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            text = f.read()
    except Exception as e:
        print(f"讀取檔案時發生錯誤：{e}")
        return

    # 使用正規表達式找出所有英文單字，並轉為小寫
    # \b[a-zA-Z]+\b 確保只擷取純英文字母的單字，忽略標點符號與數字
    words = re.findall(r'\b[a-zA-Z]+\b', text.lower())

    # 取得不重複單字並排序
    unique_words = sorted(set(words))

    # 確保輸出目錄存在
    output_dir = os.path.dirname(output_path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    try:
        with open(output_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Word'])  # 寫入標題列
            for word in unique_words:
                writer.writerow([word])
    except Exception as e:
        print(f"寫入 CSV 檔案時發生錯誤：{e}")
        return

    print(f"成功擷取 {len(unique_words)} 個不重複單字，並儲存至 '{output_path}'")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="從 Markdown 文章中擷取所有不重複的英文單字並輸出為 CSV。")
    parser.add_argument("input", help="輸入的 Markdown 檔案路徑")
    parser.add_argument("output", help="輸出的 CSV 檔案路徑")
    
    args = parser.parse_args()
    extract_words_from_markdown(args.input, args.output)
