import argparse
import os
import re
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io

def clean_and_reconstruct_text(text):
    """
    清理並重構提取的文字，處理 PDF 硬換行、雜訊與 OCR 錯誤。
    """
    if not text:
        return ""

    # 1. 移除常見的雜訊 (例如頁碼、單獨的符號、無意義的裝飾)
    # 移除只有數字的行 (可能是頁碼)
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        # 簡單過濾：如果整行只有數字或特殊符號，可能是頁碼或雜訊
        if re.match(r'^[\d\W_]+$', stripped):
            continue
        cleaned_lines.append(stripped)
    
    # 2. 拼湊斷句 (處理硬換行)
    # 將行與行之間重新組合。如果一行不以句號、問號、驚嘆號等結尾，通常是同一個句子被切斷
    reconstructed_text = ""
    for i, line in enumerate(cleaned_lines):
        reconstructed_text += line
        # 如果這行以連字號結尾，去掉連字號並直接接上下一行
        if line.endswith('-'):
            reconstructed_text = reconstructed_text[:-1]
        # 如果這行以標點符號結尾 (., !, ?, ", '), 則視為句子/段落結束，加上換行
        elif re.search(r'[.!?\"\'”’]$', line):
            reconstructed_text += "\n\n"
        else:
            # 否則加一個空格，與下一行連接
            reconstructed_text += " "

    # 3. 修正常見 OCR 錯誤 (可根據需求擴充)
    reconstructed_text = reconstructed_text.replace(" l ", " I ")
    reconstructed_text = reconstructed_text.replace(" 1 ", " I ")
    
    # 整理多餘的空格與換行
    reconstructed_text = re.sub(r' {2,}', ' ', reconstructed_text)
    reconstructed_text = re.sub(r'\n{3,}', '\n\n', reconstructed_text)

    return reconstructed_text.strip()

def extract_text_from_pdf(pdf_path, use_ocr=True):
    """
    從 PDF 提取文字。如果頁面沒有文字，嘗試使用 OCR 從圖片提取。
    """
    doc = fitz.open(pdf_path)
    full_text = ""

    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # 嘗試直接提取文字 (數位版 PDF)
        text = page.get_text()
        
        # 如果沒有文字或文字太少，且允許使用 OCR，則處理圖片
        if use_ocr and len(text.strip()) < 50:
            print(f"第 {page_num + 1} 頁文字過少，嘗試使用 OCR 提取影像文字...")
            pix = page.get_pixmap(dpi=300)
            img_data = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_data))
            
            # 使用 pytesseract 進行 OCR
            # 預設使用英文，若需中文可加上 lang='chi_tra'
            ocr_text = pytesseract.image_to_string(img, lang='eng')
            text = ocr_text
            
        full_text += text + "\n"

    return full_text

def process_pdf_to_markdown(pdf_path, output_path):
    """
    主要流程：讀取 PDF -> 提取文字 -> 清理與重構 -> 輸出 Markdown
    """
    print(f"開始處理 PDF: {pdf_path}")
    
    if not os.path.exists(pdf_path):
        print(f"錯誤：找不到檔案 {pdf_path}")
        return

    # 1. 文字提取 (Text Extraction)
    raw_text = extract_text_from_pdf(pdf_path)
    
    # 2. 語句重構與清理 (Sentence Reconstruction & Cleaning)
    # 3. 語意分段 (Logical Paragraphing)
    processed_text = clean_and_reconstruct_text(raw_text)
    
    # 準備 Markdown 內容
    filename = os.path.basename(pdf_path)
    title = os.path.splitext(filename)[0]
    
    md_content = f"# {title}\n\n"
    md_content += processed_text
    
    # 確保輸出目錄存在
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    
    # 寫入 Markdown 檔案
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(md_content)
        
    print(f"✅ 處理完成！已輸出至: {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="將 PDF 轉換為排版良好的 Markdown 文章 (參考 Article.md)")
    parser.add_argument("input_pdf", help="輸入的 PDF 檔案路徑")
    parser.add_argument("-o", "--output", help="輸出的 Markdown 檔案路徑 (預設為 output/<檔名>.md)", default=None)
    
    args = parser.parse_args()
    
    input_pdf = args.input_pdf
    output_md = args.output
    
    if output_md is None:
        filename = os.path.basename(input_pdf)
        basename = os.path.splitext(filename)[0]
        output_md = os.path.join("output", f"{basename}.md")
        
    process_pdf_to_markdown(input_pdf, output_md)
