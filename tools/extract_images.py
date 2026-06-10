import fitz

def extract_images_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=150)
        pix.save(f"page_{i}.png")
        print(f"Saved page_{i}.png")

pdf_path = r"c:\Users\User\JEENI\CLASS\Mock tsets\YLE\YLE-2.pdf"
extract_images_from_pdf(pdf_path)
