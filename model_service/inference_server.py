"""
NeuroScan model inference service.

Run this alongside the Node API server to plug your trained Keras (.h5) model
into NeuroScan. The Node server will forward /api/predict requests to this
service when the MODEL_SERVICE_URL environment variable is set.

Quick start:

    pip install flask tensorflow pillow numpy
    export MODEL_PATH=/absolute/path/to/your_model.h5
    python model_service/inference_server.py
    # In another shell, tell the Node API where this service is:
    export MODEL_SERVICE_URL=http://localhost:8000
    # Then restart the API Server workflow.

Customise CLASS_LABELS and INPUT_SIZE to match the way your model was trained.

Request format (POST /predict):
    { "imageBase64": "<base64 jpg/png, no data: prefix>", "filename": "scan.jpg" }

Response format:
    {
      "predictedClass": "glioma",
      "confidence": 0.93,
      "probabilities": [{"label": "glioma", "probability": 0.93}, ...],
      "modelVersion": "my-model-v1",
      "backend": "tensorflow-python",
      "processingTimeMs": 142
    }
"""

import base64
import io
import os
import time

import numpy as np
from flask import Flask, jsonify, request
from PIL import Image

try:
    import tflite_runtime.interpreter as tflite
except ImportError:
    # Fallback to tf.lite if tflite_runtime is not installed
    import tensorflow.lite as tflite

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_MODEL_PATH = os.path.join(BASE_DIR, "MobileNet.tflite")
MODEL_PATH = os.environ.get("MODEL_PATH", DEFAULT_MODEL_PATH)
MODEL_VERSION = os.environ.get("MODEL_VERSION", "custom-v1")
INPUT_SIZE = (224, 224)  # change to match your model's expected input
CLASS_LABELS = ["glioma", "meningioma", "no_tumor", "pituitary"]

print(f"Loading TFLite model from {MODEL_PATH} ...")
interpreter = tflite.Interpreter(model_path=MODEL_PATH, num_threads=1)
interpreter.allocate_tensors()
print("TFLite Model loaded.")

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

app = Flask(__name__)


def preprocess(image_bytes: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize(INPUT_SIZE)
    arr = np.asarray(img, dtype=np.float32)
    # MobileNetV2 preprocess_input scales pixels to [-1, 1]
    arr = (arr / 127.5) - 1.0
    return np.expand_dims(arr, axis=0)

@app.post("/predict")
def predict():
    payload = request.get_json(force=True)
    image_b64 = payload["imageBase64"]
    image_bytes = base64.b64decode(image_b64)

    start = time.time()
    x = preprocess(image_bytes)
    
    # Run TFLite inference
    interpreter.set_tensor(input_details[0]['index'], x)
    interpreter.invoke()
    preds = interpreter.get_tensor(output_details[0]['index'])[0]
    
    print(f"Prediction: {preds}")
    elapsed_ms = int((time.time() - start) * 1000)

    probabilities = [
        {"label": label, "probability": float(p)}
        for label, p in zip(CLASS_LABELS, preds)
    ]
    best = max(probabilities, key=lambda x: x["probability"])
    print(f"Prediction: {best}")
    return jsonify(
        {
            "predictedClass": best["label"],
            "confidence": best["probability"],
            "probabilities": probabilities,
            "modelVersion": MODEL_VERSION,
            "backend": "tflite-python",
            "processingTimeMs": elapsed_ms,
        }
    )


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    app.run(host="0.0.0.0", port=port)
