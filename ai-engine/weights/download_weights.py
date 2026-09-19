"""
Helper script to download pretrained weights for MesoNet (Deepfake Video Detector).
Source: MesoNet official research repository (Darius Afchar / Vincent Nozick)
Repository: https://github.com/DariusAf/MesoNet
"""

import os
import urllib.request

WEIGHTS_DIR = os.path.dirname(os.path.abspath(__file__))
MESO4_WEIGHTS_URL = "https://raw.githubusercontent.com/DariusAf/MesoNet/master/weights/Meso4_DF"
TARGET_PATH = os.path.join(WEIGHTS_DIR, "Meso4_DF.h5")

def download_mesonet_weights():
    print(f"[Weights] Target directory: {WEIGHTS_DIR}")
    if os.path.exists(TARGET_PATH):
        print(f"[Weights] MesoNet weights already exist at: {TARGET_PATH}")
        return

    print(f"[Weights] Downloading MesoNet weights from {MESO4_WEIGHTS_URL}...")
    try:
        urllib.request.urlretrieve(MESO4_WEIGHTS_URL, TARGET_PATH)
        print(f"[Weights] Download completed successfully: {TARGET_PATH}")
    except Exception as e:
        print(f"[Weights] Automatic download failed: {e}")
        print("\nManual Download Instructions:")
        print("1. Visit: https://github.com/DariusAf/MesoNet/tree/master/weights")
        print("2. Download 'Meso4_DF' or 'Meso4_F2F'")
        print(f"3. Place the file inside: {WEIGHTS_DIR}/Meso4_DF.h5")

if __name__ == "__main__":
    download_mesonet_weights()
