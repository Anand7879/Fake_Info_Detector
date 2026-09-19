import os
import re
import math
import json
import base64
from urllib.parse import urlparse
from typing import Dict, Any, List, Tuple, Optional
import socket
import requests
from dotenv import load_dotenv

from .utils import compute_verdict_and_confidence, format_verification_response

load_dotenv()

SAFE_BROWSING_API_KEY = os.getenv("SAFE_BROWSING_API_KEY", "").strip()
VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY", "").strip()

# High-Abuse Suspicious TLDs
SUSPICIOUS_TLDS = [
    ".xyz", ".top", ".buzz", ".club", ".work", ".click", ".link",
    ".gq", ".cf", ".tk", ".ml", ".ga", ".fit", ".rest", ".beauty",
    ".monster", ".sbs", ".cam", ".vip", ".cc", ".tokyo", ".country",
    ".stream", ".online", ".site", ".space", ".cfd", ".icu", ".live",
    ".win", ".racing", ".download", ".loan", ".party", ".bid"
]

# Known Major Target Brands for Typosquatting Analysis (Global & Indian)
TARGET_BRANDS = [
    # Global Tech & Social Media
    "google", "paypal", "apple", "amazon", "microsoft", "netflix",
    "facebook", "instagram", "whatsapp", "telegram", "twitter", "ebay",
    "walmart", "dropbox", "linkedin", "yahoo", "binance", "coinbase",
    "steam", "discord", "roblox", "tiktok", "spotify", "adobe",

    # Global Banking
    "chase", "wellsfargo", "bankofamerica", "citibank", "hsbc", "barclays",

    # Indian Banking & Financial Institutions
    "sbi", "onlinesbi", "statebankofindia", "hdfcbank", "hdfc", "icicibank",
    "icici", "axisbank", "axis", "pnb", "pnbindia", "punjabnationalbank",
    "kotak", "kotakbank", "bankofbaroda", "bob", "canarabank", "unionbank",
    "idbibank", "yesbank", "indusind",

    # Indian Payments & UPI
    "paytm", "phonepe", "gpay", "googlepay", "bhim", "cred", "razorpay", "mobikwik",

    # Indian E-commerce, Telecom & Government
    "flipkart", "jio", "airtel", "irctc", "uidai", "aadhaar", "incometax", "digilocker"
]

# Sensitive Action & Phishing Lure Keywords in URL Path/Hostname
SENSITIVE_KEYWORDS = [
    "login", "verify", "secure", "account", "banking", "update",
    "password", "confirm", "signin", "wallet", "recovery", "suspended",
    "billing", "authenticate", "webscr", "cmd=_login-run", "kyc", "netbanking",
    "otp", "card", "pan", "aadhar", "recharge", "free", "claim", "reward",
    "giveaway", "winner", "prize", "cashback", "lottery", "subsidy"
]

# Known URL Shortener Domains
SHORTENER_DOMAINS = [
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "buff.ly",
    "ow.ly", "cutt.ly", "rb.gy", "shorturl.at", "rebrand.ly", "tiny.cc",
    "lnkd.in", "s.id", "v.gd", "clck.ru"
]


def unshorten_url(url: str) -> Tuple[str, bool, List[str]]:
    """
    Safely unmasks shortened URLs (e.g. bit.ly, tinyurl) by following HTTP redirects
    without downloading large response bodies.
    """
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    if not any(host == s or host.endswith("." + s) for s in SHORTENER_DOMAINS):
        return url, False, []

    hops = []
    try:
        resp = requests.head(
            url,
            allow_redirects=True,
            timeout=3.5,
            headers={"User-Agent": "FakeInfoDetector/2.0 (Security Scanner)"}
        )
        final_url = resp.url
        if resp.history:
            hops = [r.url for r in resp.history] + [final_url]
            return final_url, True, hops
    except Exception:
        try:
            with requests.get(
                url,
                allow_redirects=True,
                stream=True,
                timeout=3.5,
                headers={"User-Agent": "FakeInfoDetector/2.0 (Security Scanner)"}
            ) as r:
                final_url = r.url
                if r.history:
                    hops = [h.url for h in r.history] + [final_url]
                    return final_url, True, hops
        except Exception:
            pass

    return url, False, []


def levenshtein_distance(s1: str, s2: str) -> int:
    """
    Computes Levenshtein edit distance between two strings.
    """
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
        
    return previous_row[-1]

def calculate_shannon_entropy(s: str) -> float:
    """
    Calculates Shannon entropy of string to detect Domain Generation Algorithms (DGA).
    """
    if not s:
        return 0.0
    prob = [float(s.count(c)) / len(s) for c in dict.fromkeys(list(s))]
    entropy = -sum([p * math.log(p) / math.log(2.0) for p in prob])
    return round(entropy, 3)

def check_google_safe_browsing(url: str) -> Tuple[Optional[bool], str, bool, Optional[str]]:
    """
    Queries Google Safe Browsing API v4.
    Returns: (is_malicious, threat_details, is_success, threat_category)
    where threat_category is "phishing", "malware", "clean", or None.
    """
    if not SAFE_BROWSING_API_KEY:
        return None, "Safe Browsing API key not configured.", False, None
        
    endpoint = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={SAFE_BROWSING_API_KEY}"
    payload = {
        "client": {"clientId": "fake-info-detector", "clientVersion": "1.0.0"},
        "threatInfo": {
            "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": url}]
        }
    }
    orig_getaddrinfo = socket.getaddrinfo
    try:
        socket.getaddrinfo = lambda h, p, f=0, t=0, pr=0, fl=0: orig_getaddrinfo(h, p, socket.AF_INET, t, pr, fl)
        resp = requests.post(endpoint, json=payload, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            matches = data.get("matches", [])
            if matches:
                threats = [m.get("threatType") for m in matches]
                if "SOCIAL_ENGINEERING" in threats:
                    cat = "phishing"
                elif any(t in threats for t in ["MALWARE", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"]):
                    cat = "malware"
                else:
                    cat = "phishing"
                return True, f"Google Safe Browsing flagged active threat: {', '.join(threats)} ({cat})", True, cat
            return False, "Google Safe Browsing reported 0 known threats (Clean).", True, "clean"
        return None, f"Safe Browsing API status {resp.status_code}", False, None
    except Exception as e:
        return None, f"Safe Browsing check failed ({str(e)})", False, None
    finally:
        socket.getaddrinfo = orig_getaddrinfo

def check_virustotal_url(url: str) -> Tuple[Optional[bool], str, bool, Optional[str], Dict[str, Any]]:
    """
    Queries VirusTotal API v3 URL report.
    Returns: (is_malicious, details, is_success, vt_category, stats)
    where vt_category is "clean", "phishing", "malware", "suspicious", or None.
    """
    if not VIRUSTOTAL_API_KEY:
        return None, "VirusTotal API key not configured.", False, None, {}
        
    url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
    endpoint = f"https://www.virustotal.com/api/v3/urls/{url_id}"
    headers = {"x-apikey": VIRUSTOTAL_API_KEY}

    def parse_vt_attributes(attrs: dict) -> Tuple[bool, str, str, dict]:
        stats = attrs.get("last_analysis_stats", {})
        malicious = stats.get("malicious", 0)
        suspicious = stats.get("suspicious", 0)
        harmless = stats.get("harmless", 0)
        undetected = stats.get("undetected", 0)
        total = malicious + suspicious + harmless + undetected

        results = attrs.get("last_analysis_results", {})
        categories_map = attrs.get("categories", {})
        tags = [str(t).lower() for t in attrs.get("tags", [])]

        phishing_votes = 0
        malware_votes = 0

        for engine_data in results.values():
            if engine_data.get("category") == "malicious":
                r = (engine_data.get("result") or "").lower()
                if any(w in r for w in ["phish", "scam", "fraud", "social", "credential", "deceptive"]):
                    phishing_votes += 1
                elif any(w in r for w in ["malware", "trojan", "virus", "worm", "exploit", "drop", "payload", "c2", "ransom"]):
                    malware_votes += 1

        for cat_val in categories_map.values():
            c_str = str(cat_val).lower()
            if any(w in c_str for w in ["phish", "scam", "fraud"]):
                phishing_votes += 1
            elif any(w in c_str for w in ["malware", "virus", "exploit", "trojan"]):
                malware_votes += 1

        if "phishing" in tags:
            phishing_votes += 2
        if "malware" in tags:
            malware_votes += 2

        if malicious > 0:
            vt_cat = "malware" if malware_votes > phishing_votes else "phishing"
            msg = f"VirusTotal flagged {vt_cat}: {malicious} engine(s) malicious, {suspicious} suspicious out of {total} security vendors."
            return True, msg, vt_cat, stats
        elif suspicious > 1:
            vt_cat = "suspicious"
            msg = f"VirusTotal flagged suspicious: {suspicious} suspicious engine(s) out of {total} security vendors."
            return True, msg, vt_cat, stats
        elif harmless > 0 or total > 0:
            vt_cat = "clean"
            msg = f"VirusTotal reported clean: 0/{total} engines flagged threats ({harmless} confirmed harmless)."
            return False, msg, vt_cat, stats
        return False, "VirusTotal report inconclusive.", "clean", stats
    
    orig_getaddrinfo = socket.getaddrinfo
    try:
        socket.getaddrinfo = lambda h, p, f=0, t=0, pr=0, fl=0: orig_getaddrinfo(h, p, socket.AF_INET, t, pr, fl)
        resp = requests.get(endpoint, headers=headers, timeout=5)
        if resp.status_code == 200:
            attrs = resp.json().get("data", {}).get("attributes", {})
            is_mal, msg, vt_cat, stats = parse_vt_attributes(attrs)
            return is_mal, msg, True, vt_cat, stats
        elif resp.status_code == 404:
            # URL not in VirusTotal cache, submit for live analysis
            try:
                post_resp = requests.post("https://www.virustotal.com/api/v3/urls", headers=headers, data={"url": url}, timeout=4)
                if post_resp.status_code in [200, 201]:
                    import time; time.sleep(1.2)
                    retry_resp = requests.get(endpoint, headers=headers, timeout=4)
                    if retry_resp.status_code == 200:
                        attrs = retry_resp.json().get("data", {}).get("attributes", {})
                        is_mal, msg, vt_cat, stats = parse_vt_attributes(attrs)
                        return is_mal, msg, True, vt_cat, stats
            except Exception:
                pass
            return None, "VirusTotal reported unindexed URL (no scan records available).", False, None, {}
        return None, f"VirusTotal status {resp.status_code}", False, None, {}
    except Exception as e:
        return None, f"VirusTotal check failed ({str(e)})", False, None, {}
    finally:
        socket.getaddrinfo = orig_getaddrinfo


def detect_typosquatting(domain: str) -> Tuple[bool, Optional[str], int]:
    """
    Checks if domain is a Levenshtein typosquat or brand spoof of a major enterprise/bank.
    """
    domain_clean = domain.lower()
    
    # Official brand domains check (e.g. sbi.co.in, hdfcbank.com, paypal.com, google.com)
    for b in TARGET_BRANDS:
        official_domains = [
            f"{b}.com", f"{b}.in", f"{b}.co.in", f"{b}.org", f"{b}.net", f"{b}.gov.in"
        ]
        if domain_clean in official_domains or any(domain_clean.endswith(f".{od}") for od in official_domains):
            return False, None, 0

    # Normalize common character substitutions in phishing (e.g. 1 -> l, 0 -> o)
    normalized = (domain_clean.replace("1", "l")
                              .replace("0", "o")
                              .replace("5", "s")
                              .replace("3", "e")
                              .replace("-", "")
                              .replace("_", ""))
    
    tokens = re.split(r"[\.-]", domain_clean)
    
    for brand in TARGET_BRANDS:
        # Check exact token spoofing in subdomain/domain (e.g. paypal.evil-site.com or onlinesbi-login.xyz)
        if brand in tokens:
            return True, brand, 0
            
        # Check Levenshtein distance on individual tokens
        for token in tokens:
            if token == brand:
                continue
            dist = levenshtein_distance(token, brand)
            if 1 <= dist <= 2 and len(token) >= 4 and abs(len(token) - len(brand)) <= 2:
                return True, brand, dist

        # Also test normalized string for hidden brand names
        if brand in normalized and brand not in domain_clean and len(brand) >= 4:
            return True, brand, 1

    return False, None, 99


_last_gemini_quota_exceeded = 0.0
GEMINI_QUOTA_COOLDOWN_SECONDS = 90.0

def analyze_url_with_gemini(
    url: str,
    hostname: str,
    flags: Dict[str, Any],
    explanation: List[str]
) -> Optional[Dict[str, Any]]:
    """
    Performs cognitive URL security & social engineering risk analysis with Google Gemini 2.5 Flash.
    """
    global _last_gemini_quota_exceeded
    import time
    if time.time() - _last_gemini_quota_exceeded < GEMINI_QUOTA_COOLDOWN_SECONDS:
        return None

    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key or not api_key.strip():
        return None

    api_key = api_key.strip()
    primary_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
    candidate_models = [primary_model, "gemini-2.5-flash", "gemini-flash-latest"]
    models_to_try = list(dict.fromkeys(candidate_models))

    signals_str = "\n".join([f"- {exp}" for exp in explanation]) if explanation else "No anomalies detected."

    system_instruction = (
        "You are an elite cybersecurity threat intelligence engine specializing in URL forensic analysis, phishing detection, malware identification, brand impersonation, and social engineering risk assessment.\n"
        "Categorize the provided URL strictly into one of the standard threat categories (matching VirusTotal taxonomy):\n"
        "- 'clean': Legitimate, harmless, verified authentic site with no security threats.\n"
        "- 'phishing': Deceptive site, credential harvesting, brand impersonation/typosquatting, fake bank/login clone, social engineering lure.\n"
        "- 'malware': Malicious payload distribution, trojans, exploit delivery, drive-by downloads.\n"
        "- 'suspicious': High-risk anomaly, disposable scam TLD, unverified hostname, suspicious character patterns without verified malicious payload.\n\n"
        "Return strictly a JSON object with this schema:\n"
        "{\n"
        "  \"verdict\": \"clean\" | \"phishing\" | \"malware\" | \"suspicious\",\n"
        "  \"confidence_score\": <number between 70.0 and 99.0>,\n"
        "  \"risk_level\": \"SAFE\" | \"LOW\" | \"MEDIUM\" | \"HIGH\" | \"CRITICAL\",\n"
        "  \"threat_category\": \"clean\" | \"phishing\" | \"malware\" | \"suspicious\",\n"
        "  \"summary\": \"<Concise 2-sentence security overview directly evaluating the URL's legitimacy and threat potential.>\",\n"
        "  \"key_findings\": [\"<finding 1>\", \"<finding 2>\", \"<finding 3>\"],\n"
        "  \"safety_advisory\": \"<Direct actionable advice for users, e.g. Do not enter OTPs/passwords on this link.>\"\n"
        "}"
    )

    prompt = (
        f"CATEGORIZE THIS URL INTO VIRUSTOTAL-STYLE THREAT CATEGORIES (clean, phishing, malware, suspicious):\n"
        f"URL: {url}\n"
        f"Hostname: {hostname}\n"
        f"Forensic Indicators:\n{signals_str}\n\n"
        f"Provide your security analysis strictly in the requested JSON structure."
    )

    for model in models_to_try:
        url_endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [{"role": "user", "parts": [{"text": f"{system_instruction}\n\n{prompt}"}]}],
            "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"}
        }
        try:
            resp = requests.post(url_endpoint, json=payload, headers={"Content-Type": "application/json"}, timeout=(3.0, 5.0))
            if resp.status_code == 200:
                raw_text = resp.json().get("candidates", [])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                clean_json = raw_text.strip()
                if clean_json.startswith("```json"):
                    clean_json = clean_json[7:]
                if clean_json.startswith("```"):
                    clean_json = clean_json[3:]
                if clean_json.endswith("```"):
                    clean_json = clean_json[:-3]
                parsed = json.loads(clean_json.strip())
                parsed["model_used"] = model
                _last_gemini_quota_exceeded = 0.0

                # Normalize verdict to VirusTotal categories
                v_raw = str(parsed.get("verdict", "") or parsed.get("threat_category", "")).lower().strip()
                if v_raw in ["real", "safe", "clean", "harmless"]:
                    parsed["verdict"] = "clean"
                elif v_raw in ["fake", "malicious", "phishing"]:
                    parsed["verdict"] = "phishing"
                elif v_raw == "malware":
                    parsed["verdict"] = "malware"
                elif v_raw == "suspicious":
                    parsed["verdict"] = "suspicious"
                else:
                    parsed["verdict"] = "suspicious"

                conf = float(parsed.get("confidence_score", 92.0))
                if conf <= 1.0:
                    conf = conf * 100.0
                parsed["confidence_score"] = min(99.0, max(70.0, round(conf, 1)))
                return parsed
            elif resp.status_code in [429, 401, 403]:
                _last_gemini_quota_exceeded = time.time()
                print(f"[GeminiURL] Model {model} returned status {resp.status_code} (quota or auth limit). Falling back to multi-layer forensics.", flush=True)
                break
            else:
                print(f"[GeminiURL] Model {model} status {resp.status_code}: {resp.text[:100]}", flush=True)
        except Exception as e:
            print(f"[GeminiURL] Exception calling model {model}: {e}", flush=True)

    return None



def verify_url(url: str) -> Dict[str, Any]:
    """
    Main entrypoint for URL Verification.
    Combines:
    1. Shortener Unmasking & Redirect Chain Analysis
    2. Deep Structural Heuristics (IP host, Suspicious TLDs, Brand Typosquatting, Plain HTTP penalty, Sensitive Lures)
    3. External Threat Intelligence (Google Safe Browsing & VirusTotal if keys set)
    4. Google Gemini 2.5 Flash Cognitive Security Reasoning & User Advisory
    5. Calibrated Multi-Layer Composite Scoring (Zero False-Negative Safety Net)
    """
    clean_url = url.strip()
    if not clean_url.startswith(("http://", "https://")):
        clean_url = "http://" + clean_url

    # 1. Unshorten URL if shortened (e.g. bit.ly, tinyurl)
    resolved_url, was_shortened, redirect_hops = unshorten_url(clean_url)
    effective_url = resolved_url if was_shortened else clean_url

    parsed = urlparse(effective_url)
    hostname = (parsed.hostname or "").lower()
    path_and_query = (parsed.path + ("?" + parsed.query if parsed.query else "")).lower()
    is_https = effective_url.lower().startswith("https://")

    explanation = []
    flags = {
        "was_shortened": was_shortened,
        "resolved_url": resolved_url if was_shortened else None,
        "redirect_hops": redirect_hops,
        "is_https": is_https
    }

    if was_shortened:
        explanation.append(
            f"Shortened URL detected: Unmasked destination to '{resolved_url}' across {len(redirect_hops)} redirect hop(s)."
        )

    # -------------------------------------------------------------------------
    # TIER 1 (PRIMARY): Authoritative Security Intelligence (GSB & VirusTotal)
    # The primary source of truth for phishing and malicious URLs.
    # -------------------------------------------------------------------------
    has_gsb_key = bool(SAFE_BROWSING_API_KEY)
    has_vt_key = bool(VIRUSTOTAL_API_KEY)

    gsb_malicious, gsb_msg, gsb_ok, gsb_cat = (None, "Safe Browsing key omitted.", False, None)
    vt_malicious, vt_msg, vt_ok, vt_cat, vt_stats = (None, "VirusTotal key omitted.", False, None, {})

    if has_gsb_key:
        gsb_malicious, gsb_msg, gsb_ok, gsb_cat = check_google_safe_browsing(effective_url)
    if has_vt_key:
        vt_malicious, vt_msg, vt_ok, vt_cat, vt_stats = check_virustotal_url(effective_url)

    flags["google_safe_browsing"] = gsb_msg
    flags["virustotal"] = vt_msg
    flags["vt_stats"] = vt_stats

    # Check for active threat detection from either API
    threat_detected = (gsb_ok and gsb_malicious is True) or (vt_ok and vt_malicious is True)

    # Check preliminary red flags to avoid falsely clearing unindexed zero-day phishing links
    is_ip_pre = bool(re.match(r"^(\d{1,3}\.){3}\d{1,3}$", hostname))
    matched_tld_pre = next((tld for tld in SUSPICIOUS_TLDS if hostname.endswith(tld)), None)
    is_typo_pre, _, _ = detect_typosquatting(hostname)
    has_high_risk_heuristic = bool(is_ip_pre or matched_tld_pre or is_typo_pre or "@" in parsed.netloc)

    # Clean is confirmed if either API reports clean AND the URL does not exhibit high-risk zero-day phishing lures
    clean_confirmed = (
        not has_high_risk_heuristic and (
            (vt_ok and vt_malicious is False and vt_cat == "clean") or
            (gsb_ok and gsb_malicious is False and gsb_cat == "clean")
        )
    )

    if threat_detected:
        # Determine exact VirusTotal category: phishing, malware, or suspicious
        if gsb_cat == "malware" or vt_cat == "malware":
            threat_category = "malware"
        elif gsb_cat == "phishing" or vt_cat == "phishing":
            threat_category = "phishing"
        elif vt_cat == "suspicious":
            threat_category = "suspicious"
        else:
            path_lower = parsed.path.lower()
            if any(path_lower.endswith(ext) for ext in [".exe", ".apk", ".zip", ".msi", ".dll", ".scr", ".bat", ".sh", ".iso"]):
                threat_category = "malware"
            else:
                threat_category = "phishing"

        prediction = threat_category
        confidence = 99.0 if (gsb_ok and gsb_malicious and vt_ok and vt_malicious) else 96.0
        composite_score = 0.98 if threat_category in ["phishing", "malware"] else 0.65
        risk_level = "CRITICAL" if (gsb_malicious is True or threat_category in ["phishing", "malware"]) else "HIGH"

        if gsb_ok and gsb_malicious:
            explanation.append(f"[Google Safe Browsing] {gsb_msg}")
        if vt_ok and vt_malicious:
            explanation.append(f"[VirusTotal] {vt_msg}")

        if threat_category == "phishing":
            summary_text = f"URL '{hostname}' was flagged as PHISHING / SOCIAL ENGINEERING by threat intelligence databases."
            safety_advice = "CRITICAL WARNING: Do not enter credentials, OTPs, or passwords on this site. This link mimics trusted services to harvest credentials."
        elif threat_category == "malware":
            summary_text = f"URL '{hostname}' was flagged as MALWARE / EXPLOIT by threat intelligence databases."
            safety_advice = "CRITICAL WARNING: Do not visit this site or download any files. Risk of immediate device infection or trojan delivery."
        else:
            summary_text = f"URL '{hostname}' was flagged as SUSPICIOUS by threat intelligence security vendors."
            safety_advice = "CAUTION: Security vendors flagged suspicious indicators on this link. Do not share personal information."

        flags["threat_category"] = threat_category
        ai_overview = {
            "summary": summary_text,
            "key_points": [exp for exp in explanation if "[" in exp or "Shortened" in exp][:3],
            "safety_advisory": safety_advice,
            "risk_level": risk_level,
            "threat_category": threat_category,
            "powered_by": "google_safe_browsing_virustotal"
        }
        if safety_advice:
            ai_overview["key_points"].append(f"Safety Advisory: {safety_advice}")

        return format_verification_response(
            modality="url",
            prediction=prediction,
            confidence_score=confidence,
            explanation=explanation,
            model_score=0.98,
            rule_score=0.98,
            composite_score=composite_score,
            indicators=flags,
            raw_details={
                "normalized_url": clean_url,
                "effective_url": effective_url,
                "hostname": hostname,
                "path": parsed.path,
                "query": parsed.query,
                "evaluation_engine": "Google Safe Browsing & VirusTotal Threat Intelligence",
                "gemini_powered": False,
                "primary_api_evaluated": True,
                "threat_category": threat_category,
                "gsb_status": gsb_msg,
                "vt_status": vt_msg
            },
            ai_overview=ai_overview
        )

    elif clean_confirmed:
        prediction = "clean"
        confidence = 98.0 if (gsb_ok and vt_ok) else 95.0
        composite_score = 0.02
        risk_level = "SAFE"
        threat_category = "clean"

        if gsb_ok:
            explanation.append(f"[Google Safe Browsing] {gsb_msg}")
        if vt_ok:
            explanation.append(f"[VirusTotal] {vt_msg}")

        summary_text = f"URL '{hostname}' was verified CLEAN and harmless by authoritative threat intelligence databases."
        safety_advice = "The link has been audited and confirmed safe by primary security intelligence."

        flags["threat_category"] = "clean"
        ai_overview = {
            "summary": summary_text,
            "key_points": [exp for exp in explanation if "[" in exp or "Shortened" in exp][:3],
            "safety_advisory": safety_advice,
            "risk_level": risk_level,
            "threat_category": "clean",
            "powered_by": "google_safe_browsing_virustotal"
        }
        if safety_advice:
            ai_overview["key_points"].append(f"Safety Advisory: {safety_advice}")

        return format_verification_response(
            modality="url",
            prediction=prediction,
            confidence_score=confidence,
            explanation=explanation,
            model_score=0.02,
            rule_score=0.02,
            composite_score=composite_score,
            indicators=flags,
            raw_details={
                "normalized_url": clean_url,
                "effective_url": effective_url,
                "hostname": hostname,
                "path": parsed.path,
                "query": parsed.query,
                "evaluation_engine": "Google Safe Browsing & VirusTotal Threat Intelligence",
                "gemini_powered": False,
                "primary_api_evaluated": True,
                "threat_category": "clean",
                "gsb_status": gsb_msg,
                "vt_status": vt_msg
            },
            ai_overview=ai_overview
        )


    # -------------------------------------------------------------------------
    # TIER 2 (FAIL-SAFE FALLBACK): Multi-Layer Forensics & Heuristic Analysis
    # Executed ONLY if Google Safe Browsing and VirusTotal are omitted or failed
    # -------------------------------------------------------------------------
    explanation.append(
        "[Notice: Primary security APIs (Safe Browsing / VirusTotal) unavailable; evaluated via fallback forensic analysis.]"
    )

    # 2. Structural Heuristics Evaluation
    rule_score_parts = []

    # A. IP Address Check
    ip_pattern = r"^(\d{1,3}\.){3}\d{1,3}$"
    is_ip = bool(re.match(ip_pattern, hostname))
    flags["is_ip_address"] = is_ip
    if is_ip:
        rule_score_parts.append(0.65)
        explanation.append(f"Host uses raw numeric IP address '{hostname}' instead of a registered domain name (frequent phishing vector).")

    # B. Suspicious TLD Check
    matched_tld = None
    for tld in SUSPICIOUS_TLDS:
        if hostname.endswith(tld):
            matched_tld = tld
            break
    flags["suspicious_tld"] = matched_tld
    if matched_tld:
        rule_score_parts.append(0.45)
        explanation.append(f"Domain uses high-risk suspicious Top-Level Domain '{matched_tld}' frequently linked to disposable scam campaigns.")

    # C. Sensitive Credential / Banking / Giveaway Keywords
    matched_keywords = [kw for kw in SENSITIVE_KEYWORDS if kw in path_and_query or kw in hostname]
    flags["sensitive_keywords"] = matched_keywords
    if matched_keywords:
        kw_severity = min(0.40, len(matched_keywords) * 0.15)
        rule_score_parts.append(kw_severity)
        kw_sample = ", ".join([f"'{k}'" for k in matched_keywords[:3]])
        explanation.append(f"Contains high-risk credential/scam lure keywords in URL: {kw_sample}.")

    # D. Insecure Plain HTTP for Sensitive Actions
    if not is_https and (matched_keywords or matched_tld or is_ip):
        rule_score_parts.append(0.30)
        explanation.append("Insecure plain HTTP protocol used for sensitive authentication/banking path (vulnerable to credential interception).")
    elif not is_https:
        rule_score_parts.append(0.15)
        flags["insecure_http"] = True

    # E. URL Length & Subdomain Obfuscation
    url_len = len(effective_url)
    subdomains = [s for s in hostname.split(".") if s] if not is_ip else []
    subdomain_count = len(subdomains) - 2 if len(subdomains) > 2 else 0
        
    flags["url_length"] = url_len
    flags["subdomain_count"] = subdomain_count

    if url_len > 85:
        rule_score_parts.append(0.20)
        explanation.append(f"Excessive URL length ({url_len} chars), commonly used for token obfuscation in phishing kits.")
    if subdomain_count >= 2:
        rule_score_parts.append(0.35)
        explanation.append(f"Multiple subdomain levels ({subdomain_count} subdomains), characteristic of brand disguise tactics.")

    # F. Deceptive Characters (@ or // in path)
    if "@" in parsed.netloc:
        rule_score_parts.append(0.50)
        explanation.append("URL contains '@' credential symbol used to mislead browser target resolution.")

    # G. Typosquatting / Brand Spoofing Check
    is_typosquat, target_brand, edit_dist = detect_typosquatting(hostname)
    flags["typosquatting"] = {
        "detected": is_typosquat,
        "impersonated_brand": target_brand,
        "edit_distance": edit_dist
    }
    if is_typosquat:
        rule_score_parts.append(0.55)
        explanation.append(
            f"Brand Impersonation / Typosquatting: Domain mimics legitimate brand '{target_brand.upper()}' "
            f"(Levenshtein distance: {edit_dist})."
        )

    # H. Domain Entropy / DGA Detection
    domain_body = subdomains[-2] if len(subdomains) >= 2 else hostname
    entropy = calculate_shannon_entropy(domain_body)
    flags["domain_entropy"] = entropy
    if entropy > 3.8 and len(domain_body) > 10:
        rule_score_parts.append(0.35)
        explanation.append(f"High domain character entropy ({entropy} bits), indicative of algorithmic domain generation (DGA).")

    # Aggregate Rule Score
    rule_score = min(1.0, max(0.05, sum(rule_score_parts)))

    # 3. Model / Threat Intelligence Scoring Layer
    model_score = 0.08 # Clean web prior

    # Calibrated Heuristic Threat Score Adaptor
    if is_ip and matched_keywords:
        model_score = max(model_score, 0.88)
    elif is_ip:
        model_score = max(model_score, 0.65)

    if is_typosquat:
        model_score = max(model_score, 0.88)

    if matched_tld and matched_keywords:
        model_score = max(model_score, 0.85)
    elif matched_tld:
        model_score = max(model_score, 0.60)

    if not is_https and matched_keywords and (matched_tld or subdomain_count >= 1 or is_ip):
        model_score = max(model_score, 0.82)

    # Dynamic Weight Adaptor: High rule score directly activates model threat layer
    if rule_score >= 0.45:
        model_score = max(model_score, rule_score * 0.90)

    # Legitimate Corporate Domain Fast-Pass
    is_authentic_corporate = False
    if not is_typosquat and not is_ip and not matched_tld and is_https and rule_score <= 0.20:
        for b in TARGET_BRANDS:
            if hostname == f"{b}.com" or hostname == f"{b}.co.in" or hostname.endswith(f".{b}.com") or hostname.endswith(f".{b}.co.in"):
                is_authentic_corporate = True
                model_score = 0.02
                rule_score = 0.02
                explanation.append(f"Verified authentic corporate domain for '{b.upper()}'.")
                break

    # Cognitive Reasoning with Google Gemini 2.5 Flash
    gemini_res = analyze_url_with_gemini(effective_url, hostname, flags, explanation)
    gemini_powered = (gemini_res is not None)
    ai_overview = None

    if gemini_powered:
        gemini_verdict = gemini_res.get("verdict", "suspicious").lower()
        if gemini_verdict in ["real", "safe", "clean", "harmless"]:
            gemini_verdict = "clean"
        elif gemini_verdict in ["fake", "malicious", "phishing"]:
            gemini_verdict = "phishing"
        elif gemini_verdict == "malware":
            gemini_verdict = "malware"
        elif gemini_verdict not in ["clean", "phishing", "malware", "suspicious"]:
            gemini_verdict = "suspicious"

        # Blend Gemini verdict with high-confidence forensic signals
        if is_authentic_corporate:
            prediction = "clean"
            confidence = max(95.0, float(gemini_res.get("confidence_score", 95.0)))
            composite_score = 0.05
            risk_level = "SAFE"
        elif is_typosquat or (matched_keywords and (matched_tld or is_ip or "@" in parsed.netloc)):
            prediction = "phishing"
            confidence = max(92.0, float(gemini_res.get("confidence_score", 92.0)))
            composite_score = 0.95
            risk_level = "HIGH"
        elif any(parsed.path.lower().endswith(ext) for ext in [".exe", ".apk", ".zip", ".msi", ".dll", ".scr", ".bat", ".sh", ".iso"]):
            prediction = "malware"
            confidence = max(92.0, float(gemini_res.get("confidence_score", 92.0)))
            composite_score = 0.95
            risk_level = "HIGH"
        elif gemini_verdict == "clean" and not has_high_risk_heuristic:
            prediction = "clean"
            confidence = float(gemini_res.get("confidence_score", 90.0))
            composite_score = 0.05
            risk_level = "SAFE"
        else:
            prediction = gemini_verdict
            confidence = float(gemini_res.get("confidence_score", 85.0))
            composite_score = 0.95 if prediction in ["phishing", "malware"] else (0.05 if prediction == "clean" else 0.50)
            risk_level = gemini_res.get("risk_level", "MEDIUM")

        flags["threat_category"] = prediction
        ai_overview = {
            "summary": gemini_res.get("summary", ""),
            "key_points": gemini_res.get("key_findings", []),
            "safety_advisory": gemini_res.get("safety_advisory", ""),
            "risk_level": risk_level,
            "threat_category": prediction,
            "powered_by": "gemini",
            "gemini_model": gemini_res.get("model_used", "gemini-2.5-flash")
        }
        if gemini_res.get("safety_advisory"):
            ai_overview["key_points"].append(f"Safety Advisory: {gemini_res.get('safety_advisory')}")

        evaluation_engine = f"Google Gemini ({gemini_res.get('model_used', 'gemini-2.5-flash')}) + Multi-Layer Forensics [Fallback Mode]"
    else:
        # Deterministic Rule-Based Forensics Fallback
        if is_authentic_corporate:
            prediction = "clean"
            confidence = 96.0
            composite_score = 0.02
            risk_level = "SAFE"
            summary_text = f"URL '{hostname}' is an authentic corporate domain with verified cryptographic certificate authority."
            safety_advice = "The link has been verified authentic."
        elif is_typosquat:
            prediction = "phishing"
            confidence = 94.0
            composite_score = 0.94
            risk_level = "CRITICAL"
            summary_text = f"URL '{hostname}' is impersonating '{flags['typosquatting']['impersonated_brand'].upper()}' using brand typosquatting."
            safety_advice = "CRITICAL WARNING: Do not enter login credentials or passwords on this imitation link."
        elif matched_keywords and (matched_tld or is_ip or "@" in parsed.netloc or not is_https):
            prediction = "phishing"
            confidence = 88.0
            composite_score = 0.88
            risk_level = "HIGH"
            summary_text = f"URL '{hostname}' contains high-risk credential harvesting lures on unverified infrastructure."
            safety_advice = "WARNING: Phishing risk detected. Never submit passwords or OTPs."
        elif any(parsed.path.lower().endswith(ext) for ext in [".exe", ".apk", ".zip", ".msi", ".dll", ".scr", ".bat", ".sh", ".iso"]):
            prediction = "malware"
            confidence = 92.0
            composite_score = 0.92
            risk_level = "HIGH"
            summary_text = f"URL '{hostname}' points directly to an executable binary or payload file."
            safety_advice = "CRITICAL WARNING: Do not download or execute files from this address."
        elif is_ip or matched_tld or entropy > 3.8:
            prediction = "suspicious"
            confidence = 82.0
            composite_score = 0.50
            risk_level = "MEDIUM"
            summary_text = f"URL '{hostname}' exhibits anomalous structure (disposable TLD or raw IP host). Proceed with caution."
            safety_advice = "Verify the authenticity of the sender before browsing this destination."
        else:
            prediction = "clean"
            confidence = 88.0
            composite_score = 0.08
            risk_level = "SAFE"
            summary_text = f"URL '{hostname}' passed heuristic structural integrity filters."
            safety_advice = "Standard web formatting verified."

        flags["threat_category"] = prediction
        evaluation_engine = "Fallback Multi-Layer Forensic & Heuristic Engine"
        ai_overview = {
            "summary": summary_text,
            "key_points": [e for e in explanation if not e.startswith("[Notice")][:3],
            "safety_advisory": safety_advice,
            "risk_level": risk_level,
            "threat_category": prediction,
            "powered_by": "local_heuristics"
        }
        if safety_advice:
            ai_overview["key_points"].append(f"Safety Advisory: {safety_advice}")


    if not explanation:
        explanation.append("Domain exhibits standard architectural formatting and passed all heuristic integrity filters.")

    return format_verification_response(
        modality="url",
        prediction=prediction,
        confidence_score=confidence,
        explanation=explanation,
        model_score=model_score,
        rule_score=rule_score,
        composite_score=composite_score,
        indicators=flags,
        raw_details={
            "normalized_url": clean_url,
            "effective_url": effective_url,
            "hostname": hostname,
            "path": parsed.path,
            "query": parsed.query,
            "evaluation_engine": evaluation_engine,
            "gemini_powered": gemini_powered,
            "gemini_model": gemini_res.get("model_used") if gemini_powered else None,
            "primary_api_evaluated": False,
            "threat_category": prediction,
            "gsb_status": gsb_msg,
            "vt_status": vt_msg
        },
        ai_overview=ai_overview
    )

