import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import sys
import os

# Set tesseract path
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def extract_text_from_pdf(pdf_path, output_path):
    print(f"Loading PDF: {pdf_path}")
    
    doc = fitz.open(pdf_path)
    all_text = ""
    
    print(f"Total pages: {len(doc)}")
    for page_num in range(len(doc)):
        print(f"Processing page {page_num + 1}/{len(doc)}...")
        page = doc.load_page(page_num)
        
        # Render page to an image (pixmap)
        # Increasing the resolution (zoom) improves OCR accuracy
        zoom = 2.0
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)
        
        # Convert pixmap to PIL Image
        if pix.n == 4:
            # RGBA
            img = Image.frombytes("RGBA", [pix.width, pix.height], pix.samples)
            img = img.convert("RGB")
        else:
            # RGB
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            
        # Run OCR using Tesseract
        # Assuming English text
        page_text = pytesseract.image_to_string(img, lang='eng')
        
        all_text += page_text + "\n\n"
        
    # Save to text file
    print(f"Saving extracted text to {output_path}")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(all_text)
        
    print("Done!")

if __name__ == "__main__":
    pdf_file = "YLE-1.pdf"
    output_file = "raw_text_yle1.txt"
    
    if not os.path.exists(pdf_file):
        print(f"Error: {pdf_file} not found.")
        sys.exit(1)
        
    extract_text_from_pdf(pdf_file, output_file)
