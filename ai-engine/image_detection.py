"""
Forwarding proxy to modules.image_detector for backwards compatibility.
Ensures any legacy calls to image_detection.py get the latest high-performance,
safe OpenCV and cached PyTorch models.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from modules.image_detector import *
