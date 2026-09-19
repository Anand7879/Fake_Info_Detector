import datetime
from typing import List, Dict, Any, Optional

def compute_verdict_and_confidence(
    model_score: float,
    rule_score: float,
    model_weight: float = 0.90,
    rule_weight: float = 0.10,
    fake_threshold: float = 0.60,
    real_threshold: float = 0.40
) -> tuple[str, float, float]:
    """
    Combines model probability (90%) and rule-based indicator score (10%)
    into an explainable verdict and confidence score (0-100).
    
    Returns:
        (prediction, confidence_score, composite_fake_score)
    """
    # Ensure scores are within [0, 1]
    model_score = max(0.0, min(1.0, float(model_score)))
    rule_score = max(0.0, min(1.0, float(rule_score)))
    
    composite_fake_score = round((model_weight * model_score) + (rule_weight * rule_score), 4)
    
    if composite_fake_score >= fake_threshold:
        prediction = "fake"
        confidence = round(composite_fake_score * 100, 2)
    elif composite_fake_score <= real_threshold:
        prediction = "real"
        confidence = round((1.0 - composite_fake_score) * 100, 2)
    else:
        prediction = "suspicious"
        # Suspicious represents uncertainty or mixed signals
        distance_from_center = abs(composite_fake_score - 0.5)
        confidence = round(60.0 + (1.0 - distance_from_center * 5) * 20.0, 2)
        confidence = min(85.0, max(50.0, confidence))
        
    return prediction, confidence, composite_fake_score

def format_verification_response(
    modality: str,
    prediction: str,
    confidence_score: float,
    explanation: List[str],
    model_score: float,
    rule_score: float,
    composite_score: float,
    indicators: Optional[Dict[str, Any]] = None,
    raw_details: Optional[Dict[str, Any]] = None,
    model_weight: float = 0.90,
    rule_weight: float = 0.10,
    ai_overview: Optional[Dict[str, Any]] = None,
    web_sources: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Standard response format across all 5 verification modalities.
    """
    resp = {
        "modality": modality,
        "prediction": prediction,
        "confidence_score": confidence_score,
        "explanation": explanation,
        "weights": {
            "model_weight": round(model_weight, 2),
            "rule_weight": round(rule_weight, 2),
            "model_probability": round(model_score, 4),
            "rule_score": round(rule_score, 4),
            "composite_score": round(composite_score, 4)
        },
        "indicators": indicators or {},
        "raw_details": raw_details or {},
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    if ai_overview is not None:
        resp["ai_overview"] = ai_overview
    if web_sources is not None:
        resp["web_sources"] = web_sources
    return resp
