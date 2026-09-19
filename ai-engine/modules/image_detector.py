"""
Conservative Multi-Model Image Authenticity & Deepfake Forensics Engine
======================================================================
Scientifically calibrated 5-model ensemble with independent evidence grouping,
dedicated OpenCV face inspection, image quality auditing, and strict uncertainty rules.
"""

import os
import io
import sys
import base64
import logging
import datetime
from typing import Dict, Any, List, Tuple, Optional

from PIL import Image, ImageChops, ImageEnhance
from PIL.ExifTags import TAGS
import numpy as np
import cv2
import torch
from transformers import (
    AutoImageProcessor,
    ViTForImageClassification,
    SiglipForImageClassification,
)

try:
    from .utils import format_verification_response
except (ImportError, ValueError):
    try:
        from modules.utils import format_verification_response
    except ImportError:
        from utils import format_verification_response

logger = logging.getLogger("ImageDetector")
logging.basicConfig(level=logging.INFO)

# ==============================================================================
# CONFIGURATION & CONSTANTS
# ==============================================================================

MODELS_CONFIG = {
    "community_forensics": {
        "name": "CommunityForensics-DeepfakeDet-ViT",
        "id": "buildborderless/CommunityForensics-DeepfakeDet-ViT",
        "cls": ViTForImageClassification,
        "type": "binary_sigmoid",
        "weight": 0.40,
        "face_sensitive": True,
        "group": "B",
    },
    "dima806": {
        "name": "deepfake_vs_real_image_detection",
        "id": "dima806/deepfake_vs_real_image_detection",
        "cls": ViTForImageClassification,
        "type": "multi_softmax",
        "weight": 0.35,
        "face_sensitive": True,
        "group": "B",
    },
    "deepfake_v2": {
        "name": "Deep-Fake-Detector-v2-Model",
        "id": "prithivMLmods/Deep-Fake-Detector-v2-Model",
        "cls": ViTForImageClassification,
        "type": "multi_softmax",
        "weight": 0.15,
        "face_sensitive": True,
        "group": "B",
    },
    "deepfake_v1": {
        "name": "deepfake-detector-model-v1",
        "id": "prithivMLmods/deepfake-detector-model-v1",
        "cls": SiglipForImageClassification,
        "type": "multi_softmax",
        "weight": 0.10,
        "face_sensitive": True,
        "group": "B",
    },
    "ai_deepfake_real": {
        "name": "AI-vs-Deepfake-vs-Real-Siglip2",
        "id": "prithivMLmods/AI-vs-Deepfake-vs-Real-Siglip2",
        "cls": SiglipForImageClassification,
        "type": "multi_softmax",
        "weight": 0.20,
        "face_sensitive": False,
        "group": "A",
    },
}

FACE_THRESHOLDS = {
    "authentic_max": 0.30,
    "uncertain_max": 0.60,
    "potential_max": 0.80,
    "strong_min": 0.80
}

SUSPICIOUS_SOFTWARE_KEYWORDS = [
    "photoshop", "gimp", "canva", "lightroom", "paint.net",
    "snapseed", "pixlr", "affinity", "midjourney", "stable diffusion",
    "dall-e", "comfyui", "automatic1111", "firefly"
]


# ==============================================================================
# MODEL MANAGER (CACHED SINGLETON)
# ==============================================================================

class ModelManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.loaded_models: Dict[str, Any] = {}
        self.loaded_processors: Dict[str, Any] = {}
        self._initialized = True
        logger.info(f"[ModelManager] Initialized with on-demand lazy loading (Device: {self.device}). Zero memory allocated at startup.")

    def _get_or_load(self, key: str):
        if key in self.loaded_models:
            return self.loaded_models[key], self.loaded_processors[key]

        if key not in MODELS_CONFIG:
            return None, None

        conf = MODELS_CONFIG[key]
        model_id = conf["id"]
        model_cls = conf["cls"]

        # Memory optimization for 512MB cloud free tiers (e.g. Render / Koyeb):
        # Keep at most 1 active vision transformer in RAM at a time to stay strictly below 512MiB.
        if len(self.loaded_models) >= 1:
            logger.info(f"[ModelManager] Freeing memory before loading {key}...")
            self.loaded_models.clear()
            self.loaded_processors.clear()
            import gc
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

        try:
            logger.info(f"[ModelManager] Loading model on-demand: {key} ({model_id})...")
            proc = AutoImageProcessor.from_pretrained(model_id, use_fast=False)
            model = model_cls.from_pretrained(model_id).to(self.device)
            model.eval()
            self.loaded_processors[key] = proc
            self.loaded_models[key] = model
            logger.info(f"[ModelManager] Successfully loaded {key} on-demand.")
            return model, proc
        except Exception as e:
            logger.error(f"[ModelManager] Error loading {key} on-demand: {e}")
            return None, None

    def infer(self, key: str, image: Image.Image) -> Optional[torch.Tensor]:
        model, proc = self._get_or_load(key)
        if model is None or proc is None:
            return None
        try:
            inputs = proc(images=image, return_tensors="pt").to(self.device)
            with torch.no_grad():
                outputs = model(**inputs)
                return outputs.logits
        except Exception as e:
            logger.warning(f"[ModelManager] Inference error on {key}: {e}")
            return None


model_manager = ModelManager()


# ==============================================================================
# IMAGE QUALITY & FORENSICS HELPERS
# ==============================================================================

def analyze_image_quality(image_path: str) -> Dict[str, Any]:
    """Extracts resolution, blur variance, and sharpness characteristics."""
    with Image.open(image_path) as img:
        w, h = img.size
    
    img_bgr = cv2.imread(image_path)
    if img_bgr is not None:
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    else:
        lap_var = 0.0

    sharpness_label = "Sharp / High Fidelity" if lap_var > 100 else ("Moderate" if lap_var > 30 else "Soft / Blurred")
    return {
        "resolution": f"{w}x{h}",
        "width": w,
        "height": h,
        "aspect_ratio": round(w / h, 2),
        "megapixels": round((w * h) / 1e6, 2),
        "blur_laplacian_var": round(lap_var, 2),
        "sharpness": sharpness_label
    }


def perform_ela(image_path: str, quality: int = 90) -> Tuple[float, float, str, Dict[str, Any]]:
    """Performs Error Level Analysis at quality 90."""
    original = Image.open(image_path).convert("RGB")
    buffer = io.BytesIO()
    original.save(buffer, "JPEG", quality=quality)
    buffer.seek(0)
    resaved = Image.open(buffer)

    diff = ImageChops.difference(original, resaved)
    diff_arr = np.array(diff, dtype=np.float32)

    mean_err = float(np.mean(diff_arr))
    max_err = float(np.max(diff_arr))
    std_err = float(np.std(diff_arr))

    h, w, _ = diff_arr.shape
    th, tw = max(1, h // 4), max(1, w // 4)
    tile_means = []
    for r in range(4):
        for c in range(4):
            tile = diff_arr[r * th:(r + 1) * th, c * tw:(c + 1) * tw]
            if tile.size > 0:
                tile_means.append(float(np.mean(tile)))

    tile_disparity = float(np.std(tile_means)) if tile_means else 0.0

    extrema = diff.getextrema()
    max_diff = max([ex[1] for ex in extrema])
    scale = 255.0 / max_diff if max_diff != 0 else 1.0
    scale = min(scale, 15.0)
    enhanced = ImageEnhance.Brightness(diff).enhance(scale)

    preview_buffer = io.BytesIO()
    enhanced.save(preview_buffer, format="JPEG")
    b64 = f"data:image/jpeg;base64,{base64.b64encode(preview_buffer.getvalue()).decode('utf-8')}"

    metrics = {
        "mean_error": round(mean_err, 3),
        "max_error": round(max_err, 3),
        "std_error": round(std_err, 3),
        "tile_disparity": round(tile_disparity, 3),
        "scale_applied": round(scale, 2)
    }
    return mean_err, max_err, b64, metrics


def compute_laplacian_sharpness(image_path: str) -> Tuple[float, float, Dict[str, Any]]:
    """Calculates spatial quadrant focus variance."""
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        return 0.0, 0.0, {}

    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    global_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    h, w = gray.shape
    th, tw = max(1, h // 4), max(1, w // 4)
    tile_vars = []
    for r in range(4):
        for c in range(4):
            tile = gray[r * th:(r + 1) * th, c * tw:(c + 1) * tw]
            if tile.size > 0:
                tile_vars.append(float(cv2.Laplacian(tile, cv2.CV_64F).var()))

    inconsistency = float(np.std(tile_vars) / (np.mean(tile_vars) + 1e-5)) if tile_vars else 0.0
    max_t = float(np.max(tile_vars)) if tile_vars else 0.0
    min_t = float(np.min(tile_vars)) if tile_vars else 0.0
    s_ratio = (max_t / (min_t + 1.0)) if min_t >= 0 else 1.0

    metrics = {
        "global_laplacian_var": round(global_var, 2),
        "inconsistency_ratio": round(inconsistency, 3),
        "max_tile_sharpness": round(max_t, 2),
        "min_tile_sharpness": round(min_t, 2),
        "sharpness_ratio": round(s_ratio, 2)
    }
    return global_var, inconsistency, metrics


def extract_exif_metadata(image_path: str) -> Tuple[Dict[str, Any], List[str], float]:
    """Audits EXIF tags as contextual supporting information."""
    indicators = []
    parsed_exif = {}
    suspicion_score = 0.0

    try:
        img = Image.open(image_path)
        raw_exif = img._getexif()
        if not raw_exif:
            return {}, ["No EXIF metadata found (typical for web images or social media uploads)."], 0.10

        for tag_id, value in raw_exif.items():
            tag_name = TAGS.get(tag_id, str(tag_id))
            if isinstance(value, bytes):
                try:
                    value = value.decode("utf-8", errors="ignore").strip()
                except Exception:
                    value = str(value)[:50]
            parsed_exif[tag_name] = str(value)[:120]

        software = parsed_exif.get("Software", "").lower()
        if software:
            matched = [k for k in SUSPICIOUS_SOFTWARE_KEYWORDS if k in software]
            if matched:
                indicators.append(f"EXIF Software tag references photo editing software: '{parsed_exif.get('Software')}'.")
                suspicion_score += 0.40

        make = parsed_exif.get("Make")
        model = parsed_exif.get("Model")
        if make or model:
            indicators.append(f"Camera metadata detected: {make or ''} {model or ''}".strip())

    except Exception as e:
        indicators.append(f"Could not parse EXIF metadata ({str(e)}).")

    return parsed_exif, indicators, min(1.0, suspicion_score)


# ==============================================================================
# CONSERVATIVE FACE ANALYSIS PATH
# ==============================================================================

def get_accurate_faces(img_bgr: np.ndarray, max_faces: int = 5) -> List[Tuple[int, int, int, int, float]]:
    """
    Detects accurate human faces using OpenCV's deep-learning YuNet detector,
    falling back to strict Non-Maximum Suppressed Haar Cascade if unavailable.
    """
    h, w, _ = img_bgr.shape
    faces_list = []
    
    # Try YuNet Deep-Learning Face Detector (SOTA accuracy, eliminates clothing/background false positives)
    possible_paths = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "face_detection_yunet_2023mar.onnx"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "modules", "face_detection_yunet_2023mar.onnx"),
        os.path.join(os.getcwd(), "ai-engine", "modules", "face_detection_yunet_2023mar.onnx"),
        os.path.join(os.getcwd(), "ai-engine", "face_detection_yunet_2023mar.onnx"),
        os.path.join(os.getcwd(), "face_detection_yunet_2023mar.onnx")
    ]
    yunet_path = next((p for p in possible_paths if os.path.exists(p)), None)
    
    if yunet_path and hasattr(cv2, "FaceDetectorYN"):
        try:
            # Score threshold 0.60 ensures high-confidence facial structures only
            detector = cv2.FaceDetectorYN.create(yunet_path, "", (w, h), score_threshold=0.60, nms_threshold=0.30)
            detector.setInputSize((w, h))
            num_faces, detected = detector.detect(img_bgr)
            if detected is not None and len(detected) > 0:
                for face in detected:
                    fx, fy, fw, fh = map(int, face[:4])
                    conf = float(face[-1])
                    fx = max(0, min(w - 1, fx))
                    fy = max(0, min(h - 1, fy))
                    fw = max(1, min(w - fx, fw))
                    fh = max(1, min(h - fy, fh))
                    if fw >= 24 and fh >= 24:
                        faces_list.append((fx, fy, fw, fh, conf))
                if faces_list:
                    # Sort by confidence * area
                    faces_list = sorted(faces_list, key=lambda f: f[4] * (f[2] * f[3]), reverse=True)[:max_faces]
                    return faces_list
        except Exception as e:
            logger.warning(f"YuNet face detection encountered an error: {e}")

    # Fallback: Strict Non-Maximum Suppressed Haar Cascade
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    face_cascade = cv2.CascadeClassifier(cascade_path)
    min_dim = max(48, int(min(w, h) * 0.06))
    raw_faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=8, minSize=(min_dim, min_dim))
    
    if len(raw_faces) > 0:
        boxes = [[int(x), int(y), int(bw), int(bh)] for (x, y, bw, bh) in raw_faces]
        scores = [1.0] * len(boxes)
        indices = cv2.dnn.NMSBoxes(boxes, scores, score_threshold=0.5, nms_threshold=0.3)
        for idx in indices:
            i = idx[0] if isinstance(idx, (list, tuple, np.ndarray)) else idx
            fx, fy, fw, fh = boxes[i]
            aspect = fw / float(fh) if fh > 0 else 0
            if 0.60 <= aspect <= 1.40:
                fx = max(0, min(w - 1, fx))
                fy = max(0, min(h - 1, fy))
                fw = max(1, min(w - fx, fw))
                fh = max(1, min(h - fy, fh))
                faces_list.append((fx, fy, fw, fh, 0.85))
                
    faces_list = sorted(faces_list, key=lambda f: f[2] * f[3], reverse=True)[:max_faces]
    return faces_list


def analyze_face_crops(image_path: str, raw_img: Image.Image, max_faces: int = 5) -> Tuple[List[Dict[str, Any]], int]:
    """
    Detects authentic human faces using deep learning YuNet face detection (with NMS fallback),
    crops them with 15% contextual boundary padding, and runs face-sensitive vision models.
    """
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        return [], 0

    h, w, _ = img_bgr.shape
    faces = get_accurate_faces(img_bgr, max_faces=max_faces)
    if not faces:
        return [], 0

    face_models = [k for k, v in MODELS_CONFIG.items() if v.get("face_sensitive", False)]
    face_results = []
    face_manip_count = 0
    img_w, img_h = min(w, raw_img.width), min(h, raw_img.height)

    for i, (fx, fy, fw, fh, det_conf) in enumerate(faces):
        px, py = int(fw * 0.15), int(fh * 0.15)
        x1 = max(0, min(img_w - 1, fx - px))
        y1 = max(0, min(img_h - 1, fy - py))
        x2 = max(x1 + 1, min(img_w, fx + fw + px))
        y2 = max(y1 + 1, min(img_h, fy + fh + py))

        if (x2 - x1) < 16 or (y2 - y1) < 16:
            continue

        try:
            crop_pil = raw_img.crop((x1, y1, x2, y2))
        except Exception as e:
            logger.warning(f"Skipping invalid face crop ({x1},{y1},{x2},{y2}): {e}")
            continue

        # Resolution-aware face crop weighting and temperature scaling
        # Low-res crops (<140px) suffer from bicubic upscaling blur that triggers false alarms in dima806.
        # CommunityForensics is invariant to crop scale and anchors small face authentic evaluation.
        is_small_crop = max(fw, fh) < 140
        if is_small_crop:
            face_w = {"community_forensics": 0.60, "deepfake_v2": 0.20, "deepfake_v1": 0.20}
        else:
            face_w = {"community_forensics": 0.45, "dima806": 0.25, "deepfake_v2": 0.15, "deepfake_v1": 0.15}

        crop_fake_scores = []
        w_list = []
        for f_key, w in face_w.items():
            if f_key not in face_models:
                continue
            logits = model_manager.infer(f_key, crop_pil)
            if logits is None:
                continue
            conf = MODELS_CONFIG[f_key]
            # Temperature scaling T=1.5 for calibrated probabilities on unseen faces
            if conf["type"] == "binary_sigmoid":
                f_fake = float(torch.sigmoid(logits / 1.5).item())
            else:
                probs = torch.softmax(logits / 1.5, dim=-1)[0].tolist()
                m_obj = model_manager.loaded_models[f_key]
                l0 = str(m_obj.config.id2label.get(0, "")).lower()
                f_fake = probs[1] if "real" in l0 else probs[0]
            crop_fake_scores.append(f_fake * w)
            w_list.append(w)

        avg_fake = float(sum(crop_fake_scores) / sum(w_list)) if w_list else 0.0

        # Conservative classification thresholds (Section 9)
        if avg_fake < FACE_THRESHOLDS["authentic_max"]:
            verdict = "Likely Authentic"
        elif avg_fake < FACE_THRESHOLDS["uncertain_max"]:
            verdict = "Uncertain / Mixed"
        elif avg_fake < FACE_THRESHOLDS["potential_max"]:
            verdict = "Potential Manipulation"
            face_manip_count += 1
        else:
            verdict = "Strong Manipulation Evidence"
            face_manip_count += 1

        face_results.append({
            "face_id": i + 1,
            "bounding_box": [int(fx), int(fy), int(fw), int(fh)],
            "detection_confidence": round(det_conf, 3),
            "verdict": verdict,
            "manipulation_score": round(avg_fake, 3),
            "authenticity_score": round(1.0 - avg_fake, 3)
        })

    return face_results, face_manip_count


# ==============================================================================
# MAIN VERIFICATION ENGINE
# ==============================================================================

def verify_image(image_path: str) -> Dict[str, Any]:
    """
    Evaluates image authenticity using an evidence-grouped 5-model ensemble,
    dedicated face analysis, and conservative decision calibration.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    raw_img = Image.open(image_path).convert("RGB")
    quality_info = analyze_image_quality(image_path)

    # 1. Run All 5 Models on the Full Image
    model_results = []
    support_counts = {"real": 0, "ai_generated": 0, "deepfake": 0}

    for key, conf in MODELS_CONFIG.items():
        logits = model_manager.infer(key, raw_img)
        if logits is None:
            continue

        model_obj = model_manager.loaded_models[key]
        id2label = getattr(model_obj.config, "id2label", {})
        proc = model_manager.loaded_processors[key]
        proc_desc = f"{type(proc).__name__} (native)"

        if conf["type"] == "binary_sigmoid":
            # CommunityForensics: single logit sigmoid with temperature calibration
            fake_prob = float(torch.sigmoid(logits / 1.5).item())
            real_prob = 1.0 - fake_prob
            norm_label = "real" if real_prob >= 0.50 else "deepfake"
            score = max(real_prob, fake_prob)

            res = {
                "model_key": key,
                "model_name": conf["name"],
                "model_id": conf["id"],
                "raw_label": "Real" if norm_label == "real" else "Fake",
                "normalized_label": norm_label,
                "score": round(score, 4),
                "real_score": round(real_prob, 4),
                "fake_score": round(fake_prob, 4),
                "raw_logits": [round(logits.item(), 4)],
                "preprocessing": proc_desc,
                "success": True
            }
        else:
            probs = torch.softmax(logits / 1.5, dim=-1)[0].tolist()
            if len(probs) == 3:
                # 3-class SigLIP2: 0: AI, 1: Deepfake, 2: Real
                ai_p, df_p, rl_p = probs[0], probs[1], probs[2]
                if ai_p >= df_p and ai_p >= rl_p:
                    norm_label = "ai_generated"
                    score = ai_p
                elif df_p >= rl_p:
                    norm_label = "deepfake"
                    score = df_p
                else:
                    norm_label = "real"
                    score = rl_p

                top_idx = probs.index(max(probs))
                raw_lbl = str(id2label.get(top_idx, id2label.get(str(top_idx), "")))
                res = {
                    "model_key": key,
                    "model_name": conf["name"],
                    "model_id": conf["id"],
                    "raw_label": raw_lbl,
                    "normalized_label": norm_label,
                    "score": round(score, 4),
                    "ai_score": round(ai_p, 4),
                    "deepfake_score": round(df_p, 4),
                    "real_score": round(rl_p, 4),
                    "raw_logits": [round(x, 4) for x in logits[0].tolist()],
                    "preprocessing": proc_desc,
                    "success": True
                }
            else:
                # 2-class ViT / SigLIP
                l0 = str(id2label.get(0, id2label.get("0", ""))).lower()
                if "real" in l0:
                    rl_p, fk_p = probs[0], probs[1]
                else:
                    fk_p, rl_p = probs[0], probs[1]

                norm_label = "real" if rl_p >= 0.50 else "deepfake"
                score = max(rl_p, fk_p)
                top_idx = probs.index(max(probs))
                raw_lbl = str(id2label.get(top_idx, id2label.get(str(top_idx), "")))
                res = {
                    "model_key": key,
                    "model_name": conf["name"],
                    "model_id": conf["id"],
                    "raw_label": raw_lbl,
                    "normalized_label": norm_label,
                    "score": round(score, 4),
                    "real_score": round(rl_p, 4),
                    "fake_score": round(fk_p, 4),
                    "raw_logits": [round(x, 4) for x in logits[0].tolist()],
                    "preprocessing": proc_desc,
                    "success": True
                }

        support_counts[norm_label] += 1
        model_results.append(res)

    # 2. Face Analysis Path
    face_results, face_manip_count = analyze_face_crops(image_path, raw_img)
    faces_detected = len(face_results) > 0

    # 3. Independent Evidence Grouping (Section 8)
    # Group A: AI generation evidence
    ai_gen_ev = 0.0
    for r in model_results:
        if "ai_score" in r:
            ai_gen_ev = max(ai_gen_ev, r["ai_score"])

    # Group B: Real vs Deepfake Evidence from dedicated forensics models
    group_b_results = [r for r in model_results if MODELS_CONFIG.get(r.get("model_key", ""), {}).get("group") == "B"]
    if not group_b_results:
        group_b_results = model_results

    weights_list = [MODELS_CONFIG[r["model_key"]]["weight"] for r in group_b_results]
    weight_sum = sum(weights_list) or 1.0
    normalized_weights = [w / weight_sum for w in weights_list]

    real_scores = [r.get("real_score", 0.0) for r in group_b_results]
    deepfake_scores = [r.get("deepfake_score", r.get("fake_score", 0.0)) for r in group_b_results]

    auth_ev = sum(s * w for s, w in zip(real_scores, normalized_weights))
    deepfake_ev = sum(s * w for s, w in zip(deepfake_scores, normalized_weights))

    # Supporting Forensics (ELA, Laplacian, EXIF)
    mean_err, max_err, ela_b64, ela_metrics = perform_ela(image_path)
    global_var, lap_inconsistency, lap_metrics = compute_laplacian_sharpness(image_path)
    exif_data, exif_indicators, exif_rule_score = extract_exif_metadata(image_path)

    # 4. Model Support and Evidence Strength (Section 15 & 16)
    total_models = max(1, len(model_results))
    dominant_support_count = max(support_counts.values())
    model_agreement = round(dominant_support_count / total_models, 2)

    if dominant_support_count >= 4 and max(auth_ev, deepfake_ev, ai_gen_ev) >= 0.75:
        evidence_strength = "Strong"
    elif dominant_support_count == 3:
        evidence_strength = "Moderate"
    else:
        evidence_strength = "Conflicting / Weak"

    # 5. Conservative Decision Engine (Section 13, 14, 17)
    results_by_key = {r.get("model_key"): r for r in model_results}
    comm_real = results_by_key.get("community_forensics", {}).get("real_score", 0.0)
    dima_real = results_by_key.get("dima806", {}).get("real_score", 0.0)

    # RULE 1: AI-Generated
    # Requires strong AI score (>= 0.70) AND not an isolated outlier against a Real majority (support_real < 3)
    is_ai_supported = (ai_gen_ev >= 0.70 and (support_counts["ai_generated"] >= 2 or (support_counts["ai_generated"] == 1 and support_counts["real"] < 3)))

    # RULE 2: Deepfake / Face Manipulation
    # Requires strong manipulation evidence (>= 0.65) AND multiple models supporting AND either face manipulation or low authenticity
    is_deepfake_supported = (deepfake_ev >= 0.65 and support_counts["deepfake"] >= 3 and auth_ev < 0.35 and (not faces_detected or face_manip_count > 0))
    is_strong_face_manip = (faces_detected and any(f.get("manipulation_score", 0) >= 0.75 for f in face_results))

    # Condition: Spliced manipulation (ELA anomaly with supporting ML evidence)
    is_spliced_manip = (ela_metrics.get("tile_disparity", 0.0) >= 1.8 and (deepfake_ev >= 0.15 or ai_gen_ev >= 0.15 or ela_metrics.get("tile_disparity", 0.0) >= 2.2))

    # RULE 3: Real / Authentic
    # A) Major authenticity evidence >= 0.55 and majority real models (support_real >= 3) and no face manipulation, OR
    # B) Strong forensic authenticity evidence (auth_ev >= 0.65) anchored by CommunityForensics (>= 0.80) and 0 face manipulation, OR
    # C) Both top general forensics anchor models independently verify authentic (>= 0.80) and 0 face manipulation
    # AND NO localized ELA compression disparity (tile_disparity < 1.8)
    is_real_supported = (
        (
            (auth_ev >= 0.55 and support_counts["real"] >= 3 and face_manip_count == 0) or
            (auth_ev >= 0.65 and comm_real >= 0.80 and face_manip_count == 0) or
            (comm_real >= 0.80 and dima_real >= 0.80 and face_manip_count == 0)
        )
        and ela_metrics.get("tile_disparity", 0.0) < 1.8
    )

    if is_ai_supported:
        verdict = "AI_GENERATED"
        display_title = "Likely AI-Generated"
        certainty = "high" if ai_gen_ev >= 0.85 and support_counts["ai_generated"] >= 2 else "medium"
        confidence = round(ai_gen_ev, 2)
        legacy_prediction = "fake"

    elif is_strong_face_manip or is_deepfake_supported:
        verdict = "DEEPFAKE"
        display_title = "Likely Deepfake / Face-Swap" if not is_strong_face_manip else "Likely Facial Manipulation / Deepfake"
        certainty = "high" if deepfake_ev >= 0.80 else "medium"
        confidence = round(max(deepfake_ev, max([f.get("manipulation_score", 0) for f in face_results]) if faces_detected else 0.0), 2)
        legacy_prediction = "fake"

    elif is_spliced_manip:
        verdict = "MANIPULATED"
        display_title = "Potentially Manipulated / Spliced"
        certainty = "medium"
        confidence = round(min(0.85, 0.50 + ela_metrics["tile_disparity"] * 0.10), 2)
        legacy_prediction = "fake"

    elif is_real_supported:
        verdict = "REAL"
        display_title = "Likely Authentic"
        certainty = "high" if (auth_ev >= 0.70 or support_counts["real"] >= 4) else "medium"
        confidence = round(min(0.95, max(auth_ev, 0.72)), 2)
        legacy_prediction = "real"

    else:
        # RULE 4 & 6: Disagreement, Mixed Signals, or Close Scores -> UNCERTAIN
        verdict = "UNCERTAIN"
        display_title = "Inconclusive / Mixed Evidence"
        certainty = "low"
        confidence = 0.50
        legacy_prediction = "suspicious"

    # 6. Explanations Generation (Probabilistic & Non-Absolutist)
    explanations = [
        f"Ensemble Verdict: {display_title} (Evidence Strength: {evidence_strength}, Decision Confidence: {int(confidence * 100)}%).",
        f"Model Support: {support_counts['real']} of {total_models} models support authenticity, {support_counts['deepfake']} support manipulation, {support_counts['ai_generated']} support AI generation."
    ]

    if faces_detected:
        f_count = len(face_results)
        f_plural = "face" if f_count == 1 else "faces"
        if face_manip_count > 0:
            explanations.append(
                f"Facial Forensics: Analyzed {f_count} {f_plural}; detected potential manipulation indicators in {face_manip_count} face crop(s)."
            )
        else:
            max_f_risk = max([f.get("manipulation_score", 0.0) for f in face_results])
            explanations.append(
                f"Facial Forensics: Analyzed {f_count} {f_plural}; all facial boundaries and textures show natural characteristics (max manipulation score: {int(max_f_risk * 100)}%)."
            )
    else:
        explanations.append("Spatial Analysis: No human faces detected; full-frame synthetic texture and composition models applied.")

    if ela_metrics["tile_disparity"] > 2.5:
        explanations.append(
            f"Error Level Analysis (ELA): High regional compression disparity ({ela_metrics['tile_disparity']}), indicating potential localized splicing."
        )
    else:
        explanations.append("Error Level Analysis (ELA): ELA pattern is not strongly indicative of manipulation.")

    if lap_metrics.get("sharpness_ratio", 1.0) > 25.0 and lap_inconsistency > 1.3:
        explanations.append("Focal Forensics: Notable spatial sharpness disparity across quadrants.")
    else:
        explanations.append("Focal Forensics: Consistent spatial sharpness distribution across quadrants.")

    explanations.extend(exif_indicators)

    # 7. Unified Response Formatting (Preserves Section 24, Section 25, and Legacy Schema)
    model_weight = 0.90
    rule_weight = 0.10
    model_score = round(deepfake_ev, 4)
    rule_score = round(exif_rule_score, 4)
    composite_score = round((model_weight * model_score) + (rule_weight * rule_score), 4)

    base_response = format_verification_response(
        modality="image",
        prediction=legacy_prediction,
        confidence_score=round(confidence * 100.0, 1),
        explanation=explanations,
        model_score=model_score,
        rule_score=rule_score,
        composite_score=composite_score,
        model_weight=model_weight,
        rule_weight=rule_weight,
        indicators={
            "predicted_class": display_title,
            "primary_classification": verdict,
            "class_probabilities": {
                "Real": round(auth_ev * 100, 1),
                "AI-Generated": round(ai_gen_ev * 100, 1),
                "Deepfake": round(deepfake_ev * 100, 1),
                "Manipulated": round(ela_metrics["tile_disparity"] * 10, 1) if ela_metrics["tile_disparity"] > 2.0 else 0.0
            },
            "model_support": support_counts,
            "model_agreement_pct": round(model_agreement * 100, 1),
            "evidence_strength": evidence_strength,
            "face_analysis": {
                "detected": faces_detected,
                "count": len(face_results),
                "manipulated_count": face_manip_count,
                "results": face_results
            },
            "ela_metrics": ela_metrics,
            "laplacian_metrics": lap_metrics,
            "exif_metadata": exif_data
        },
        raw_details={
            "ela_preview_base64": ela_b64,
            "filename": os.path.basename(image_path),
            "file_size_bytes": os.path.getsize(image_path),
            "quality": quality_info
        }
    )

    # Section 25 Schema Extensions
    base_response["success"] = True
    base_response["classification"] = {
        "label": verdict,
        "display_title": display_title,
        "confidence": confidence,
        "certainty": certainty
    }
    base_response["evidence"] = {
        "ai_generation": round(ai_gen_ev, 3),
        "deepfake_manipulation": round(deepfake_ev, 3),
        "authenticity": round(auth_ev, 3)
    }
    base_response["model_support"] = support_counts
    base_response["faces"] = {
        "detected": faces_detected,
        "count": len(face_results),
        "results": face_results
    }
    base_response["forensics"] = {
        "ela": ela_metrics,
        "metadata": exif_data,
        "image_quality": quality_info
    }
    base_response["models"] = model_results

    # Extra keys for UI breakdown compatibility
    base_response["scores"] = {
        "real": round(auth_ev, 3),
        "ai_generated": round(ai_gen_ev, 3),
        "deepfake": round(deepfake_ev, 3),
        "manipulated": 0.0,
        "uncertain": round(max(0.0, 1.0 - confidence), 3) if verdict == "UNCERTAIN" else 0.0
    }
    base_response["model_agreement"] = model_agreement
    base_response["processing"] = {
        "models_used": len(model_results),
        "face_analysis_used": faces_detected,
        "device": str(model_manager.device),
        "evidence_strength": evidence_strength
    }

    return base_response


# ==============================================================================
# CLI RUNNER
# ==============================================================================

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python modules/image_detector.py <path_to_image>")
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(f"Error: File '{image_path}' not found.")
        sys.exit(1)

    print(f"\n[CLI] Running Conservative Image Analysis on: {image_path}...")
    res = verify_image(image_path)

    print("\n" + "=" * 76)
    print("      CONSERVATIVE MULTI-MODEL IMAGE AUTHENTICITY REPORT")
    print("=" * 76)
    print(f"Verdict:                 {res['classification']['label']} ({res['classification']['display_title']})")
    print(f"Confidence:              {int(res['classification']['confidence'] * 100)}% (Certainty: {res['classification']['certainty'].upper()})")
    print(f"Evidence Strength:       {res['processing']['evidence_strength']}")
    print(f"Model Support:           Real: {res['model_support']['real']}/5, Deepfake: {res['model_support']['deepfake']}/5, AI: {res['model_support']['ai_generated']}/5")
    print(f"Faces Detected:          {res['faces']['count']}")
    print("-" * 76)
    print("EVIDENCE SCORES:")
    print(f"  * Authenticity Evidence:       {res['evidence']['authenticity'] * 100:.1f}%")
    print(f"  * Deepfake Evidence:           {res['evidence']['deepfake_manipulation'] * 100:.1f}%")
    print(f"  * AI Generation Evidence:      {res['evidence']['ai_generation'] * 100:.1f}%")
    print("-" * 76)
    print("INDIVIDUAL MODEL RESULTS:")
    for m in res["models"]:
        r_score = m.get('real_score', 0)
        d_score = m.get('deepfake_score', m.get('fake_score', 0))
        print(f"  * {m['model_name']:<36} -> {m['normalized_label'].upper():<12} (Real: {r_score:.3f}, Fake: {d_score:.3f})")
    if res["faces"]["detected"]:
        print("-" * 76)
        print("FACE FORENSICS:")
        for f in res["faces"]["results"]:
            print(f"  * Face #{f['face_id']} {f['bounding_box']}: {f['verdict']} (Manip risk: {f['manipulation_score']*100:.1f}%)")
    print("-" * 76)
    print("EXPLANATORY SIGNALS:")
    for exp in res["explanation"]:
        print(f"  • {exp}")
    print("=" * 76 + "\n")
