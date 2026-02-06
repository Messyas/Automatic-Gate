import os
from typing import Optional, Tuple, Dict, Any

import cv2
import numpy as np
import requests
from fastapi import FastAPI, File, Form, UploadFile
from ultralytics import YOLO
import easyocr

app = FastAPI()

MODEL_PATH = os.getenv("MODEL_PATH", "models/runs/yolov8n_lp/weights/best.pt")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000/cars/detect")
AUTO_REGISTER = os.getenv("AUTO_REGISTER", "false").strip().lower() in {
    "1",
    "true",
    "yes",
    "y",
    "on",
}
EASYOCR_GPU = os.getenv("EASYOCR_GPU", "0").strip().lower() in {
    "1",
    "true",
    "yes",
    "y",
    "on",
}


try:
    model = YOLO(MODEL_PATH)
except Exception as exc:  # pragma: no cover - surface at runtime
    raise RuntimeError(f"Failed to load YOLO model at {MODEL_PATH}: {exc}") from exc

reader = easyocr.Reader(["en"], gpu=EASYOCR_GPU)

DICT_CHAR_TO_INT = {
    "O": "0",
    "I": "1",
    "J": "3",
    "A": "4",
    "G": "6",
    "S": "5",
}

DICT_INT_TO_CHAR = {v: k for k, v in DICT_CHAR_TO_INT.items()}


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/detect")
async def detect(
    image: UploadFile = File(...),
    trackId: Optional[int] = Form(None),
    register: Optional[bool] = Form(None),
) -> Dict[str, Any]:
    img_bytes = await image.read()
    np_img = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
    if frame is None:
        return {
            "plate": None,
            "score": None,
            "bbox": None,
            "trackId": trackId,
            "error": "Invalid image data",
        }

    bbox, bbox_score = detect_plate_bbox(frame)
    if bbox is None:
        return {
            "plate": None,
            "score": None,
            "bbox": None,
            "trackId": trackId,
        }

    x1, y1, x2, y2 = bbox
    crop = frame[y1:y2, x1:x2]
    plate, plate_score = read_license_plate(crop)

    payload = None
    backend_response = None
    should_register = register if register is not None else AUTO_REGISTER
    if should_register and plate:
        payload = {
            "trackId": int(trackId or 0),
            "plate": plate,
        }
        backend_response = post_detection(payload)

    return {
        "plate": plate,
        "score": plate_score,
        "bbox": [x1, y1, x2, y2],
        "trackId": trackId,
        "backendResponse": backend_response,
        "bboxScore": bbox_score,
    }


def detect_plate_bbox(frame: np.ndarray) -> Tuple[Optional[Tuple[int, int, int, int]], Optional[float]]:
    results = model.predict(frame, verbose=False)
    if not results or results[0].boxes is None or len(results[0].boxes) == 0:
        return None, None

    boxes = results[0].boxes
    confs = boxes.conf.cpu().numpy().reshape(-1)
    best_idx = int(np.argmax(confs))
    xyxy = boxes.xyxy.cpu().numpy()[best_idx]
    h, w = frame.shape[:2]

    x1, y1, x2, y2 = map(int, xyxy.tolist())
    x1 = max(0, min(x1, w - 1))
    y1 = max(0, min(y1, h - 1))
    x2 = max(0, min(x2, w))
    y2 = max(0, min(y2, h))
    if x2 <= x1 or y2 <= y1:
        return None, None

    return (x1, y1, x2, y2), float(confs[best_idx])


def preprocess(crop: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_LINEAR)
    return cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_MEAN_C,
        cv2.THRESH_BINARY_INV,
        35,
        15,
    )


def read_license_plate(license_plate_crop: np.ndarray) -> Tuple[Optional[str], Optional[float]]:
    if license_plate_crop is None or license_plate_crop.size == 0:
        return None, None

    processed = preprocess(license_plate_crop)
    detections = reader.readtext(processed)

    best_text = None
    best_score = None
    for _bbox, text, score in detections:
        text = text.upper().replace(" ", "")
        if license_complies_format(text):
            formatted = format_license(text)
            if best_score is None or score > best_score:
                best_text = formatted
                best_score = float(score)

    return best_text, best_score


def license_complies_format(text: str) -> bool:
    if len(text) != 7:
        return False

    return (
        (text[0] in DICT_INT_TO_CHAR or text[0].isalpha())
        and (text[1] in DICT_INT_TO_CHAR or text[1].isalpha())
        and (text[2] in DICT_CHAR_TO_INT or text[2].isdigit())
        and (text[3] in DICT_CHAR_TO_INT or text[3].isdigit())
        and (text[4] in DICT_INT_TO_CHAR or text[4].isalpha())
        and (text[5] in DICT_INT_TO_CHAR or text[5].isalpha())
        and (text[6] in DICT_INT_TO_CHAR or text[6].isalpha())
    )


def format_license(text: str) -> str:
    license_plate = ""
    mapping = {
        0: DICT_INT_TO_CHAR,
        1: DICT_INT_TO_CHAR,
        4: DICT_INT_TO_CHAR,
        5: DICT_INT_TO_CHAR,
        6: DICT_INT_TO_CHAR,
        2: DICT_CHAR_TO_INT,
        3: DICT_CHAR_TO_INT,
    }
    for idx in range(7):
        if text[idx] in mapping[idx]:
            license_plate += mapping[idx][text[idx]]
        else:
            license_plate += text[idx]
    return license_plate


def post_detection(payload: Dict[str, Any]) -> Dict[str, Any]:
    try:
        resp = requests.post(BACKEND_URL, json=payload, timeout=5)
        try:
            data = resp.json()
        except ValueError:
            data = {"raw": resp.text}
        return {
            "status": resp.status_code,
            "data": data,
        }
    except requests.RequestException as exc:
        return {"error": str(exc)}
