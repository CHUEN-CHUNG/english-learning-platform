import os
import shutil
import subprocess
import uuid
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI(title="Vocabulary Generator API")

# 允許前端跨域請求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
PUBLIC_DIR = "public"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PUBLIC_DIR, exist_ok=True)

@app.post("/api/generate")
async def generate_vocabulary(
    exam_name: str = Form(...),
    vocab_csv: UploadFile = File(...),
    article_file: UploadFile = File(...)
):
    try:
        # 建立獨立的 session 資料夾以避免檔案衝突
        session_id = str(uuid.uuid4())
        session_dir = os.path.join(UPLOAD_DIR, session_id)
        os.makedirs(session_dir, exist_ok=True)
        
        # 儲存上傳的檔案
        vocab_path = os.path.join(session_dir, "vocab.csv")
        with open(vocab_path, "wb") as f:
            shutil.copyfileobj(vocab_csv.file, f)
            
        article_ext = os.path.splitext(article_file.filename)[1].lower()
        article_filename = f"article{article_ext}"
        article_path = os.path.join(session_dir, article_filename)
        with open(article_path, "wb") as f:
            shutil.copyfileobj(article_file.file, f)
            
        # 取得 scripts 資料夾的絕對路徑
        scripts_dir = os.path.abspath("scripts")
        
        # Step 1: 建立考試單字表 CSV
        subprocess.run(
            ["python", os.path.join(scripts_dir, "step1_vocab_csv.py"), "vocab.csv", exam_name],
            cwd=session_dir, check=True
        )
        
        # Step 2: 處理文章 (如果是 PDF 則轉為 Markdown)
        md_filename = article_filename
        if article_ext == ".pdf":
            md_filename = "article.md"
            subprocess.run(
                ["python", os.path.join(scripts_dir, "step2_pdf_parsing.py"), article_filename, "-o", md_filename],
                cwd=session_dir, check=True
            )
            
        # Step 3: 從 Markdown 擷取單字
        subprocess.run(
            ["python", os.path.join(scripts_dir, "step3_article_words.py"), md_filename, "article_words.csv"],
            cwd=session_dir, check=True
        )
        
        # Step 4: 單字比對並輸出最終結果至 public 資料夾
        final_output_name = f"{exam_name}-Word.csv"
        final_output_path = os.path.abspath(os.path.join(PUBLIC_DIR, final_output_name))
        
        subprocess.run([
            "python", os.path.join(scripts_dir, "step4_word_matching.py"),
            "--exam-csv", f"{exam_name}-Word.csv",
            "--article-csv", "article_words.csv",
            "--output", final_output_path
        ], cwd=session_dir, check=True)
        
        return {
            "status": "success",
            "message": "單字表生成成功！",
            "file": final_output_name,
            "exam_name": exam_name
        }
        
    except subprocess.CalledProcessError as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": f"腳本執行失敗: {str(e)}"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": f"發生錯誤: {str(e)}"})

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
