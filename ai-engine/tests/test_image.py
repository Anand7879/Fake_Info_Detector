import sys
import os
import io
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import piexif

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from modules.image_detector import verify_image

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "samples")
os.makedirs(SAMPLES_DIR, exist_ok=True)

def create_authentic_sample() -> str:
    """
    Generates a uniform, unmanipulated JPEG with consistent compression
    and authentic camera EXIF tags.
    """
    path = os.path.join(SAMPLES_DIR, "authentic_camera_shot.jpg")
    
    # Create smooth natural scene (gradient + soft landscape geometry)
    img = Image.new("RGB", (400, 300), color=(135, 206, 235)) # Sky blue
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 150, 400, 300], fill=(34, 139, 34)) # Grass
    draw.ellipse([280, 40, 340, 100], fill=(255, 223, 0)) # Sun
    
    # Apply slight natural lens blur
    img = img.filter(ImageFilter.GaussianBlur(0.8))

    # Add authentic EXIF metadata (Canon camera)
    zeroth_ifd = {
        piexif.ImageIFD.Make: b"Canon",
        piexif.ImageIFD.Model: b"Canon EOS 80D",
        piexif.ImageIFD.DateTime: b"2026:05:10 14:30:00"
    }
    exif_ifd = {
        piexif.ExifIFD.DateTimeOriginal: b"2026:05:10 14:30:00",
        piexif.ExifIFD.DateTimeDigitized: b"2026:05:10 14:30:00"
    }
    exif_dict = {"0th": zeroth_ifd, "Exif": exif_ifd}
    exif_bytes = piexif.dump(exif_dict)
    
    img.save(path, "JPEG", quality=92, exif=exif_bytes)
    return path

def create_manipulated_sample() -> str:
    """
    Generates a spliced, manipulated image with localized sharpness
    inconsistency, high ELA error boundary, and Adobe Photoshop EXIF metadata.
    """
    path = os.path.join(SAMPLES_DIR, "manipulated_spliced_photo.jpg")
    
    # 1. Base blurry background
    base = Image.new("RGB", (400, 300), color=(100, 100, 100))
    base = base.filter(ImageFilter.GaussianBlur(4.0)) # heavily blurred
    
    # Save base as low quality JPEG first (multiple compression cycles)
    buf = io.BytesIO()
    base.save(buf, "JPEG", quality=60)
    buf.seek(0)
    base = Image.open(buf).convert("RGB")
    
    # 2. Splice in a sharp, foreign element with high noise/contrast
    splice = Image.new("RGB", (100, 100), color=(255, 0, 50))
    splice_draw = ImageDraw.Draw(splice)
    for i in range(0, 100, 5):
        splice_draw.line([(0, i), (100, i)], fill=(255, 255, 255), width=2)
        
    # Paste the sharp splice onto the blurry base (tampering)
    base.paste(splice, (150, 100))
    
    # 3. Add manipulated EXIF metadata (Photoshop + date mismatch)
    zeroth_ifd = {
        piexif.ImageIFD.Software: b"Adobe Photoshop 2026 (Windows)",
        piexif.ImageIFD.DateTime: b"2026:09:12 11:15:22"
    }
    exif_ifd = {
        piexif.ExifIFD.DateTimeOriginal: b"2024:01:01 09:00:00"
    }
    exif_dict = {"0th": zeroth_ifd, "Exif": exif_ifd}
    exif_bytes = piexif.dump(exif_dict)
    
    base.save(path, "JPEG", quality=95, exif=exif_bytes)
    return path

def run_test(title: str, image_path: str):
    print("\n" + "=" * 75)
    print(f"TEST CASE: {title}")
    print("=" * 75)
    print(f"IMAGE PATH: {image_path}")
    
    result = verify_image(image_path)
    
    pred = result["prediction"].upper()
    conf = result["confidence_score"]
    weights = result["weights"]
    indicators = result["indicators"]
    
    print(f">> VERDICT:                 [{pred}]")
    print(f">> CONFIDENCE SCORE:        {conf}%")
    print(f">> VISION FORENSIC (70%):   {weights['model_probability'] * 100:.1f}% manipulation")
    print(f">> METADATA RULES  (30%):   {weights['rule_score'] * 100:.1f}% tampering markers")
    print(f">> COMPOSITE SCORE:         {weights['composite_score'] * 100:.1f}% fake")
    
    print("\nMETRICS BREAKDOWN:")
    print(f"  * ELA Mean Error:         {indicators['ela_metrics']['mean_error']}")
    print(f"  * ELA Tile Disparity:     {indicators['ela_metrics']['tile_disparity']}")
    print(f"  * Laplacian Inconsistency: {indicators['laplacian_metrics']['inconsistency_ratio']}")
    print(f"  * Global Laplacian Var:   {indicators['laplacian_metrics']['global_laplacian_var']}")
    
    print("\nFORENSIC EXPLANATIONS:")
    for idx, exp in enumerate(result["explanation"], 1):
        print(f"  {idx}. {exp}")
        
    print(f"\nEXIF DETECTED: {json.dumps(indicators['exif_metadata'], indent=4)}")
    return result

if __name__ == "__main__":
    print("Starting Standalone Image Verification Test Suite...")
    
    auth_path = create_authentic_sample()
    manip_path = create_manipulated_sample()
    
    res_auth = run_test("AUTHENTIC CAMERA CAPTURE", auth_path)
    assert res_auth["prediction"] == "real", f"Expected 'real', got {res_auth['prediction']}"
    
    res_manip = run_test("TAMPERED / SPLICED IMAGE WITH PHOTOSHOP EXIF", manip_path)
    assert res_manip["prediction"] == "fake", f"Expected 'fake', got {res_manip['prediction']}"
    
    print("\n" + "=" * 75)
    print("ALL IMAGE VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 75)
