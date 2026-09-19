import os
import re
import datetime
from typing import Dict, Any, List, Tuple, Optional
import fitz  # PyMuPDF
import docx  # python-docx

from .text_detector import verify_text
from .utils import compute_verdict_and_confidence, format_verification_response

SUSPICIOUS_PRODUCERS = [
    "photoshop", "gimp", "canva", "illustrator", "inkscape",
    "pdf-editor", "sejda", "smallpdf", "ilovepdf", "nitro"
]

def parse_pdf_date(date_str: Optional[str]) -> Optional[datetime.datetime]:
    """
    Parses PDF date format (e.g. "D:20260912143000Z" or "D:20260912143000+05'30'")
    """
    if not date_str:
        return None
    try:
        clean = date_str.replace("D:", "").replace("'", "")
        # Extract YYYYMMDDHHMMSS
        match = re.match(r"^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?", clean)
        if match:
            parts = [int(p) for p in match.groups() if p is not None]
            while len(parts) < 6:
                parts.append(0)
            return datetime.datetime(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5])
    except Exception:
        pass
    return None

def extract_pdf_data(pdf_path: str) -> Tuple[str, Dict[str, Any], List[str], float]:
    """
    Extracts text, fonts, and metadata from a PDF file using PyMuPDF.
    Returns: (text, metadata, indicators, metadata_suspicion_score)
    """
    doc = fitz.open(pdf_path)
    full_text = []
    font_families = set()
    indicators = []
    suspicion = 0.05

    for page in doc:
        full_text.append(page.get_text())
        # Inspect fonts across text blocks
        page_dict = page.get_text("dict")
        for block in page_dict.get("blocks", []):
            if "lines" in block:
                for line in block["lines"]:
                    for span in line.get("spans", []):
                        font_name = span.get("font")
                        if font_name:
                            # Strip subset prefixes like "ABCDEF+Arial"
                            clean_font = font_name.split("+")[-1]
                            font_families.add(clean_font)

    meta = doc.metadata or {}
    creator = (meta.get("creator") or "").lower()
    producer = (meta.get("producer") or "").lower()
    author = meta.get("author") or "Unknown"
    title = meta.get("title") or os.path.basename(pdf_path)

    # 1. Producer / Creator software check
    for susp in SUSPICIOUS_PRODUCERS:
        if susp in creator or susp in producer:
            indicators.append(
                f"Document produced with graphic design / editing tool: '{meta.get('creator') or meta.get('producer')}' (often used in forged credentials)."
            )
            suspicion += 0.45
            break

    # 2. Date discrepancy check
    c_date = parse_pdf_date(meta.get("creationDate"))
    m_date = parse_pdf_date(meta.get("modDate"))
    if c_date and m_date:
        delta_days = abs((m_date - c_date).total_seconds()) / 86400.0
        if delta_days > 7.0:
            indicators.append(
                f"Significant timeline modification: Created on {c_date.strftime('%Y-%m-%d')} but modified on {m_date.strftime('%Y-%m-%d')} ({int(delta_days)} days later)."
            )
            suspicion += 0.35

    # 3. Font consistency check
    font_count = len(font_families)
    if font_count > 6:
        indicators.append(
            f"High font variety detected ({font_count} distinct font styles: {', '.join(list(font_families)[:4])}...), potential indicator of spliced or pasted sections."
        )
        suspicion += 0.25
    elif font_count > 0:
        indicators.append(f"Consistent font hierarchy maintained ({font_count} font style(s)).")

    doc.close()
    
    extracted_text = "\n".join(full_text).strip()
    parsed_meta = {
        "format": "PDF",
        "title": title,
        "author": author,
        "creator": meta.get("creator", "N/A"),
        "producer": meta.get("producer", "N/A"),
        "creation_date": meta.get("creationDate", "N/A"),
        "mod_date": meta.get("modDate", "N/A"),
        "fonts_detected": list(font_families)[:8]
    }
    
    return extracted_text, parsed_meta, indicators, min(1.0, suspicion)

def extract_docx_data(docx_path: str) -> Tuple[str, Dict[str, Any], List[str], float]:
    """
    Extracts text and core document properties from a DOCX file using python-docx.
    """
    doc = docx.Document(docx_path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    extracted_text = "\n".join(paragraphs).strip()
    
    core = doc.core_properties
    indicators = []
    suspicion = 0.05
    
    c_date = core.created
    m_date = core.modified
    if c_date and m_date and c_date != m_date:
        delta = abs((m_date - c_date).total_seconds()) / 86400.0
        if delta > 7.0:
            indicators.append(
                f"Document modified {int(delta)} days after creation (Revision #{core.revision})."
            )
            suspicion += 0.25

    if core.author and core.last_modified_by and core.author != core.last_modified_by:
        indicators.append(
            f"Author discrepancy: Authored by '{core.author}' but last modified by '{core.last_modified_by}'."
        )
        suspicion += 0.20

    parsed_meta = {
        "format": "DOCX",
        "title": core.title or os.path.basename(docx_path),
        "author": core.author or "N/A",
        "last_modified_by": core.last_modified_by or "N/A",
        "revision": core.revision,
        "creation_date": str(c_date) if c_date else "N/A",
        "mod_date": str(m_date) if m_date else "N/A"
    }

    return extracted_text, parsed_meta, indicators, min(1.0, suspicion)

def extract_txt_data(txt_path: str) -> Tuple[str, Dict[str, Any], List[str], float]:
    """
    Reads plain text document.
    """
    with open(txt_path, "r", encoding="utf-8", errors="ignore") as f:
        extracted_text = f.read()
        
    parsed_meta = {
        "format": "TXT",
        "file_size": os.path.getsize(txt_path),
        "last_modified": datetime.datetime.fromtimestamp(os.path.getmtime(txt_path)).isoformat()
    }
    return extracted_text, parsed_meta, ["Plain text file without embedded metadata."], 0.10

def verify_document(document_path: str) -> Dict[str, Any]:
    """
    Main entrypoint for Document Verification (PDF, DOCX, TXT).
    1. Extracts text and forensic document metadata.
    2. Runs extracted text through Module 1 Text Verification (70% model layer).
    3. Audits document metadata: creator software, timeline shifts, font consistency (30% rule layer).
    4. Synthesizes combined veracity verdict.
    """
    if not os.path.exists(document_path):
        raise FileNotFoundError(f"Document file not found: {document_path}")

    _, ext = os.path.splitext(document_path)
    ext = ext.lower()

    if ext == ".pdf":
        extracted_text, metadata, meta_indicators, meta_score = extract_pdf_data(document_path)
    elif ext in [".docx", ".doc"]:
        extracted_text, metadata, meta_indicators, meta_score = extract_docx_data(document_path)
    elif ext == ".txt":
        extracted_text, metadata, meta_indicators, meta_score = extract_txt_data(document_path)
    else:
        raise ValueError(f"Unsupported document format: '{ext}'. Supported: .pdf, .docx, .txt")

    if not extracted_text.strip():
        return format_verification_response(
            modality="document",
            prediction="suspicious",
            confidence_score=40.0,
            explanation=["Document contains no readable text layer (may be a flat image scan or empty document)."] + meta_indicators,
            model_score=0.50,
            rule_score=meta_score,
            composite_score=0.50,
            indicators={"document_metadata": metadata}
        )

    # 1. Run Text Veracity Analysis (70% Model Layer)
    text_result = verify_text(extracted_text)
    text_model_score = text_result["weights"]["composite_score"] # combined text fake probability

    # 2. Document Metadata Rules (30% Rule Layer)
    explanation = []
    explanation.extend(meta_indicators)
    # Add key text findings
    explanation.extend([f"[Content Analysis] {exp}" for exp in text_result["explanation"][:3]])

    # 3. Synthesize Final Verdict (70% Text Veracity / 30% Metadata Tampering)
    prediction, confidence, composite_score = compute_verdict_and_confidence(
        model_score=text_model_score,
        rule_score=meta_score,
        model_weight=0.70,
        rule_weight=0.30
    )

    return format_verification_response(
        modality="document",
        prediction=prediction,
        confidence_score=confidence,
        explanation=explanation,
        model_score=text_model_score,
        rule_score=meta_score,
        composite_score=composite_score,
        indicators={
            "document_metadata": metadata,
            "text_indicators": text_result["indicators"],
            "extracted_character_count": len(extracted_text),
            "extracted_word_count": len(extracted_text.split())
        },
        raw_details={
            "text_snippet": extracted_text[:300] + ("..." if len(extracted_text) > 300 else ""),
            "filename": os.path.basename(document_path)
        }
    )
