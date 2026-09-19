import socket
_orig_getaddrinfo = socket.getaddrinfo
socket.getaddrinfo = lambda h, p, f=0, t=0, pr=0, fl=0: _orig_getaddrinfo(h, p, socket.AF_INET, t, pr, fl)

import sys
import os
import json
import cv2
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from modules.video_detector import verify_video

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "samples")
os.makedirs(SAMPLES_DIR, exist_ok=True)

def draw_synthetic_face(frame: np.ndarray, cx: int, cy: int, r: int, is_tampered: bool = False):
    """
    Draws a face geometry with eyes, mouth, and skin tones detectable by standard cascades.
    If is_tampered is True, injects unnatural boundary seams and high-frequency noise.
    """
    # Head contour (oval)
    skin_color = (180, 205, 235) # BGR peach tone
    cv2.ellipse(frame, (cx, cy), (r, int(r * 1.25)), 0, 0, 360, skin_color, -1)
    
    # Eyes
    eye_offset_x = int(r * 0.4)
    eye_offset_y = int(r * 0.25)
    eye_r = max(3, int(r * 0.12))
    cv2.circle(frame, (cx - eye_offset_x, cy - eye_offset_y), eye_r, (40, 40, 40), -1)
    cv2.circle(frame, (cx + eye_offset_x, cy - eye_offset_y), eye_r, (40, 40, 40), -1)
    
    # Nose
    cv2.line(frame, (cx, cy - int(r * 0.05)), (cx, cy + int(r * 0.15)), (140, 165, 195), 2)
    
    # Mouth
    cv2.ellipse(frame, (cx, cy + int(r * 0.45)), (int(r * 0.35), int(r * 0.12)), 0, 0, 180, (60, 60, 180), 3)

    if is_tampered:
        # Inject artificial blending seam around the boundary
        cv2.ellipse(frame, (cx, cy), (r + 4, int(r * 1.25) + 4), 0, 0, 360, (255, 255, 255), 3)
        # Inject high frequency noise inside face
        noise = np.random.randint(-40, 40, (int(r * 1.2), int(r * 1.2), 3), dtype=np.int16)
        y1, y2 = max(0, cy - int(r * 0.6)), min(frame.shape[0], cy + int(r * 0.6))
        x1, x2 = max(0, cx - int(r * 0.6)), min(frame.shape[1], cx + int(r * 0.6))
        target = frame[y1:y2, x1:x2].astype(np.int16)
        noise_crop = noise[:target.shape[0], :target.shape[1]]
        frame[y1:y2, x1:x2] = np.clip(target + noise_crop, 0, 255).astype(np.uint8)

def generate_test_video(filename: str, tampered: bool = False) -> str:
    path = os.path.join(SAMPLES_DIR, filename)
    fps = 15.0
    width, height = 320, 240
    duration_frames = 30 # 2 seconds
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(path, fourcc, fps, (width, height))
    
    for i in range(duration_frames):
        # Create gradient background
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        frame[:, :] = (60, 50, 40)
        
        # Smooth continuous motion
        cx = int(width / 2 + 30 * np.sin(i / 5.0))
        cy = int(height / 2 + 15 * np.cos(i / 5.0))
        radius = 45
        
        # In tampered video, glitch frames 12 to 24 with synthetic boundary seams
        frame_tampered = tampered and (12 <= i <= 24)
        draw_synthetic_face(frame, cx, cy, radius, is_tampered=frame_tampered)
        
        out.write(frame)
        
    out.release()
    return path

def run_test(title: str, video_path: str):
    print("\n" + "=" * 75)
    print(f"TEST CASE: {title}")
    print("=" * 75)
    print(f"VIDEO PATH: {video_path}")
    
    result = verify_video(video_path, sample_interval_frames=5)
    
    pred = result["prediction"].upper()
    conf = result["confidence_score"]
    weights = result["weights"]
    indicators = result["indicators"]
    
    print(f">> VERDICT:                  [{pred}]")
    print(f">> CONFIDENCE SCORE:         {conf}%")
    print(f">> MESONET MODEL PROB (70%): {weights['model_probability'] * 100:.1f}% fake")
    print(f">> TEMPORAL RULES     (30%): {weights['rule_score'] * 100:.1f}% tampering markers")
    print(f">> COMPOSITE SCORE:          {weights['composite_score'] * 100:.1f}% fake")
    
    print("\nINDICATORS SUMMARY:")
    print(f"  * Total Video Frames:      {indicators['total_frames_in_video']}")
    print(f"  * Sampled Frames:          {indicators['sampled_frames_count']}")
    print(f"  * Facial Frames Evaluated: {indicators['facial_frames_evaluated']}")
    print(f"  * Suspicious Frames Count: {indicators['suspicious_frames_count']}")
    
    print("\nFORENSIC EXPLANATIONS:")
    for idx, exp in enumerate(result["explanation"], 1):
        print(f"  {idx}. {exp}")
        
    return result

if __name__ == "__main__":
    print("Starting Standalone Video Verification Test Suite...")
    
    auth_video = generate_test_video("authentic_speech_clip.mp4", tampered=False)
    tampered_video = generate_test_video("deepfake_face_replacement.mp4", tampered=True)
    
    res_auth = run_test("AUTHENTIC COHERENT VIDEO CLIP", auth_video)
    res_tampered = run_test("DEEPFAKE VIDEO WITH INJECTED SEAMS & NOISE", tampered_video)
    
    print("\n" + "=" * 75)
    print("VIDEO VERIFICATION TEST SUITE FINISHED SUCCESSFULLY!")
    print("=" * 75)
