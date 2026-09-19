import os
import socket
import tempfile
import shutil
from typing import Optional

# Prevent Windows IPv6 blackhole timeouts during HF/API network queries
_orig_getaddrinfo = socket.getaddrinfo
socket.getaddrinfo = lambda h, p, f=0, t=0, pr=0, fl=0: _orig_getaddrinfo(h, p, socket.AF_INET, t, pr, fl)

from fastapi import FastAPI, HTTPException, UploadFile, File, Form

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from modules.text_detector import verify_text
from modules.image_detector import verify_image
from modules.video_detector import verify_video
from modules.url_detector import verify_url
from modules.document_detector import verify_document
from modules.utils import format_verification_response

load_dotenv()

app = FastAPI(
    title="Fake Info Detector - AI Forensics Engine",
    description="Multi-Modal Misinformation, Deepfake, and Manipulation Verification Engine",
    version="1.0.0"
)

# Enable CORS for Next.js frontend and Express backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextVerificationRequest(BaseModel):
    text: str = Field(..., min_length=1, description="News text or statement to verify")

class UrlVerificationRequest(BaseModel):
    url: str = Field(..., description="URL to verify for phishing, fake news, or malware")

@app.get("/")
def read_root():
    return {
        "service": "Fake Info Detector - AI Forensics Engine",
        "status": "online",
        "supported_modalities": ["text", "image", "video", "url", "document"],
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/verify/text")
def api_verify_text(payload: TextVerificationRequest):
    """
    Verifies input text using DistilBERT/BART ML zero-shot classification + forensic heuristics.
    Returns: prediction, confidence_score, explanation, and indicator breakdown.
    """
    try:
        result = verify_text(payload.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text verification failed: {str(e)}")

@app.post("/verify/url")
def api_verify_url(payload: UrlVerificationRequest):
    """
    Verifies URL for phishing, scam campaigns, typosquatting, and malware.
    Queries Google Safe Browsing and VirusTotal if keys are configured;
    falls back to structural heuristics and brand spoofing models.
    """
    try:
        result = verify_url(payload.url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"URL verification failed: {str(e)}")

@app.post("/verify/image")
async def api_verify_image(file: UploadFile = File(...)):
    """
    Verifies uploaded image for splicing, manipulation, ELA disparity, 
    Laplacian sharpness inconsistency, and EXIF tampering.
    """
    allowed_extensions = [".jpg", ".jpeg", ".png", ".webp"]
    _, ext = os.path.splitext(file.filename or "")
    if ext.lower() not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image format '{ext}'. Allowed: {', '.join(allowed_extensions)}"
        )
        
    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, file.filename or "uploaded_image.jpg")
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        result = verify_image(temp_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image verification failed: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
                os.rmdir(temp_dir)
            except Exception:
                pass

@app.post("/verify/video")
def api_verify_video(file: UploadFile = File(...)):
    """
    Verifies uploaded video for deepfake manipulation via frame extraction,
    face detection, MesoNet CNN scoring, and temporal boundary analysis.
    """
    import time
    allowed_extensions = [".mp4", ".avi", ".mov", ".mkv", ".webm"]
    _, ext = os.path.splitext(file.filename or "")
    if ext.lower() not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported video format '{ext}'. Allowed: {', '.join(allowed_extensions)}"
        )

    t_start = time.time()
    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, file.filename or "uploaded_video.mp4")
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        t_copy = time.time()

        result = verify_video(temp_path)
        t_done = time.time()
        print(f"[API Verify Video] Copy: {t_copy - t_start:.2f}s | Verify: {t_done - t_copy:.2f}s | Total: {t_done - t_start:.2f}s")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video verification failed: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
                os.rmdir(temp_dir)
            except Exception:
                pass

@app.post("/verify/document")
async def api_verify_document(file: UploadFile = File(...)):
    """
    Verifies uploaded documents (PDF, DOCX, TXT) for text misinformation,
    metadata timeline shifts, creator software tampering, and font anomalies.
    """
    allowed_extensions = [".pdf", ".docx", ".doc", ".txt"]
    _, ext = os.path.splitext(file.filename or "")
    if ext.lower() not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported document format '{ext}'. Allowed: {', '.join(allowed_extensions)}"
        )

    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, file.filename or "uploaded_document.pdf")
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = verify_document(temp_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document verification failed: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
                os.rmdir(temp_dir)
            except Exception:
                pass

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
