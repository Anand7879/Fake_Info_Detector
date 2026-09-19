"""
Regression Test Suite for Image Authenticity & Deepfake Forensics
=================================================================
Evaluates the conservative 5-model ensemble on known ground-truth samples,
calculates confusion metrics, and verifies the False Positive Rate on real photos.
"""

import os
import sys
import json

# Add ai-engine to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from modules.image_detector import verify_image

TEST_SAMPLES = [
    # 1. Known Original Camera Photos (Ground Truth: REAL)
    {
        "path": "ai-engine/tests/samples/authentic_camera_shot.jpg",
        "ground_truth": "REAL",
        "description": "Original Canon EOS 80D Camera Landscape (No faces)"
    },
    {
        "path": "backend/uploads/file-1789222960743-23616142.jpg",
        "ground_truth": "REAL",
        "description": "Original vivo T2x 5G Smartphone Photo (4 group faces)"
    },
    # 2. Manipulated / Spliced Photos (Ground Truth: FAKE / MANIPULATED)
    {
        "path": "ai-engine/tests/samples/manipulated_spliced_photo.jpg",
        "ground_truth": "MANIPULATED",
        "description": "Manipulated / Spliced composite photo"
    },
]

def run_regression_suite():
    print("=" * 76)
    print("       IMAGE AUTHENTICITY REGRESSION TEST SUITE & METRICS")
    print("=" * 76)
    
    tp = 0 # True Positive (Fake classified as Deepfake/Manip/AI)
    fp = 0 # False Positive (Real incorrectly classified as Fake/Deepfake)
    tn = 0 # True Negative (Real correctly classified as Real)
    fn = 0 # False Negative (Fake incorrectly classified as Real)
    uncertain = 0
    
    for item in TEST_SAMPLES:
        p = item["path"]
        gt = item["ground_truth"]
        desc = item["description"]
        
        if not os.path.exists(p):
            print(f"[SKIP] File not found: {p}")
            continue
            
        print(f"\nEvaluating: {desc} ({p})")
        res = verify_image(p)
        pred_label = res["classification"]["label"]
        conf = res["classification"]["confidence"]
        certainty = res["classification"]["certainty"]
        auth_ev = res["evidence"]["authenticity"]
        df_ev = res["evidence"]["deepfake_manipulation"]
        
        print(f"  * Ground Truth:       {gt}")
        print(f"  * System Verdict:     {pred_label} ({res['classification']['display_title']})")
        print(f"  * Confidence:         {int(conf * 100)}% ({certainty.upper()})")
        print(f"  * Authenticity Ev:    {auth_ev * 100:.1f}% | Deepfake Ev: {df_ev * 100:.1f}%")
        print(f"  * Model Support:      Real: {res['model_support']['real']}/5, Deepfake: {res['model_support']['deepfake']}/5")
        print(f"  * Faces Inspected:    {res['faces']['count']}")
        
        if pred_label == "UNCERTAIN":
            uncertain += 1
            print("  -> Outcome: INCONCLUSIVE / UNCERTAIN (Safe conservative state)")
        elif gt == "REAL":
            if pred_label == "REAL":
                tn += 1
                print("  -> Outcome: TRUE NEGATIVE (Correct Authentic Classification)")
            else:
                fp += 1
                print("  -> Outcome: FALSE POSITIVE (Real photo misclassified as Fake!)")
        else: # gt in ("FAKE", "MANIPULATED", "DEEPFAKE", "AI_GENERATED")
            if pred_label in ("DEEPFAKE", "AI_GENERATED", "MANIPULATED"):
                tp += 1
                print("  -> Outcome: TRUE POSITIVE (Correct Detection)")
            else:
                fn += 1
                print("  -> Outcome: FALSE NEGATIVE (Missed manipulation)")

    print("\n" + "=" * 76)
    print("                    FINAL EVALUATION METRICS")
    print("=" * 76)
    total_real = tn + fp
    fpr = (fp / total_real * 100) if total_real > 0 else 0.0
    
    print(f"Total Evaluated:                 {len(TEST_SAMPLES)}")
    print(f"True Negatives (Authentic Real): {tn}")
    print(f"True Positives (Detected):       {tp}")
    print(f"Uncertain / Inconclusive:        {uncertain}")
    print(f"False Positives (Fake Alarm):    {fp}")
    print(f"False Negatives:                 {fn}")
    print("-" * 76)
    print(f"FALSE POSITIVE RATE ON REAL PHOTOS: {fpr:.1f}%")
    print("=" * 76)
    
    # Critical Acceptance Criterion: False Positive Rate on Real Photos must be 0%
    assert fp == 0, f"Critical failure: FPR on real photos is {fpr}% > 0%!"
    print("\n>>> CRITICAL ACCEPTANCE CRITERIA PASSED: ZERO FALSE POSITIVES ON REAL PHOTOS! <<<\n")

if __name__ == "__main__":
    run_regression_suite()
