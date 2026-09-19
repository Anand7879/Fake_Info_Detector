import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from modules.url_detector import verify_url

def run_test(title: str, url: str):
    print("\n" + "=" * 75)
    print(f"TEST CASE: {title}")
    print("=" * 75)
    print(f"TARGET URL: {url}")
    
    result = verify_url(url)
    
    pred = result["prediction"].upper()
    conf = result["confidence_score"]
    weights = result["weights"]
    indicators = result["indicators"]
    
    print(f">> VERDICT:                  [{pred}]")
    print(f">> CONFIDENCE SCORE:         {conf}%")
    print(f">> THREAT MODEL SCORE (70%): {weights['model_probability'] * 100:.1f}% risk")
    print(f">> HEURISTIC RULES    (30%): {weights['rule_score'] * 100:.1f}% risk")
    print(f">> COMPOSITE SCORE:          {weights['composite_score'] * 100:.1f}% malicious/fake")
    
    print("\nFORENSIC EXPLANATIONS:")
    for idx, exp in enumerate(result["explanation"], 1):
        print(f"  {idx}. {exp}")
        
    print("\nINDICATORS BREAKDOWN:")
    print(f"  * Is IP Address:   {indicators.get('is_ip_address')}")
    print(f"  * Suspicious TLD:  {indicators.get('suspicious_tld')}")
    print(f"  * Typosquatting:   {indicators.get('typosquatting')}")
    print(f"  * Sensitive Words: {indicators.get('sensitive_keywords')}")
    print(f"  * Domain Entropy:  {indicators.get('domain_entropy')}")
    
    return result

if __name__ == "__main__":
    print("Starting Standalone URL Verification Test Suite...")

    # 1. Authentic Corporate Domain
    real_url = "https://www.paypal.com/signin"
    res_real = run_test("AUTHENTIC REGISTERED ENTERPRISE URL", real_url)
    assert res_real["prediction"] == "real", f"Expected 'real', got {res_real['prediction']}"

    # 2. Phishing & Brand Typosquatting URL
    phish_url = "http://secure-login-paypa1.xyz/account/verify?token=92847291847192847192847192847"
    res_phish = run_test("BRAND TYPOSQUATTING & SUSPICIOUS TLD PHISHING LINK", phish_url)
    assert res_phish["prediction"] == "fake", f"Expected 'fake', got {res_phish['prediction']}"

    # 3. Numeric IP Address Host
    ip_url = "http://192.168.1.50/banking/update-credentials"
    res_ip = run_test("NUMERIC IP ADDRESS HOST WITH CREDENTIAL KEYWORDS", ip_url)
    assert res_ip["prediction"] in ["fake", "suspicious"], f"Expected 'fake' or 'suspicious', got {res_ip['prediction']}"

    print("\n" + "=" * 75)
    print("ALL URL VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 75)
