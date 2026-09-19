import sys
import os
import json

# Add parent directory to path so modules can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from modules.text_detector import verify_text

def run_test(title: str, text: str):
    print("\n" + "=" * 75)
    print(f"TEST CASE: {title}")
    print("=" * 75)
    print(f"INPUT TEXT:\n\"{text.strip()}\"\n")
    
    result = verify_text(text)
    
    pred = result["prediction"].upper()
    conf = result["confidence_score"]
    weights = result["weights"]
    
    print(f">> VERDICT:          [{pred}]")
    print(f">> CONFIDENCE SCORE: {conf}%")
    print(f">> MODEL PROBABILITY (70%): {weights['model_probability'] * 100:.1f}% fake")
    print(f">> RULE SCORE        (30%): {weights['rule_score'] * 100:.1f}% fake")
    print(f">> COMPOSITE SCORE:         {weights['composite_score'] * 100:.1f}% fake")
    print("\nEXPLANATIONS & FORENSIC SIGNALS:")
    for idx, exp in enumerate(result["explanation"], 1):
        print(f"  {idx}. {exp}")
    
    print(f"\nINDICATORS DETAIL: {json.dumps(result['indicators'], indent=4)}")
    return result

if __name__ == "__main__":
    print("Starting Standalone Text Verification Test Suite...")

    # 1. Credible News Sample
    credible_sample = (
        "According to a peer-reviewed study published in Nature Medicine by researchers at Oxford University, "
        "regular moderate physical activity was associated with a 24% reduction in cardiovascular disease risk "
        "across a monitored cohort of 50,000 adult participants observed over a ten-year timeframe."
    )
    res_real = run_test("CREDIBLE JOURNALISTIC / SCIENTIFIC CLAIM", credible_sample)
    assert res_real["prediction"] == "real", f"Expected 'real', got {res_real['prediction']}"

    # 2. Sensational Fake News / Clickbait Sample
    fake_sample = (
        "SHOCKING! Doctors are FURIOUS! This secret herbal leaf cures ALL cancer in 48 hours and big pharma "
        "is trying to BANN IT from the public! Share this NOW before the elites delete this video forever!!!"
    )
    res_fake = run_test("BLATANT SENSATIONALIST FAKE NEWS", fake_sample)
    assert res_fake["prediction"] == "fake", f"Expected 'fake', got {res_fake['prediction']}"

    # 3. Ambiguous / Unverified Claim
    ambiguous_sample = (
        "Several residents on Elm Street reported observing an unusual metallic object hovering above "
        "the transmission tower yesterday evening before drifting eastward toward the hills."
    )
    res_amb = run_test("UNVERIFIED AMBIGUOUS CLAIM", ambiguous_sample)

    print("\n" + "=" * 75)
    print("ALL TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 75)
