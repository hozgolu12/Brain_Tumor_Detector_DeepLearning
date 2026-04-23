# NeuroScan Model Inference Service

Plug your trained Keras (`.h5`) brain tumor model into NeuroScan.

## How it works

The Node API server (`artifacts/api-server`) exposes `/api/predict`. When the
environment variable `MODEL_SERVICE_URL` is set, every prediction request is
forwarded to that URL. If unset (or the call fails), a deterministic mock is
used so the UI still works end-to-end.

## Running your model

1. Install dependencies (Python 3.10+):

   ```bash
   pip install flask tensorflow pillow numpy
   ```

2. Point the service at your `.h5` file:

   ```bash
   export MODEL_PATH=/absolute/path/to/your_model.h5
   export MODEL_VERSION=my-model-v1   # optional
   python model_service/inference_server.py
   ```

   The service listens on port `8000` by default. Override with `PORT=...`.

3. Tell the Node API where to find the service and restart it:

   ```bash
   export MODEL_SERVICE_URL=http://localhost:8000
   ```

   Then restart the `API Server` workflow from the workspace.

## Customising for your model

Open `inference_server.py` and update:

- `CLASS_LABELS` — the order must match how your model was trained.
- `INPUT_SIZE` — the image dimensions your model expects.
- `preprocess()` — adjust normalisation / channel order if your training
  pipeline used different preprocessing (e.g. ImageNet mean subtraction,
  grayscale, etc.).

The labels NeuroScan recognises by default are:
`glioma`, `meningioma`, `pituitary`, `no_tumor`. Renaming them in
`CLASS_LABELS` will cause the frontend to display the new names automatically.

## Request / response contract

Request — `POST /predict`:

```json
{ "imageBase64": "<base64 jpg/png>", "filename": "scan.jpg" }
```

Response:

```json
{
  "predictedClass": "glioma",
  "confidence": 0.93,
  "probabilities": [
    {"label": "glioma", "probability": 0.93},
    {"label": "meningioma", "probability": 0.04},
    {"label": "pituitary", "probability": 0.02},
    {"label": "no_tumor", "probability": 0.01}
  ],
  "modelVersion": "my-model-v1",
  "backend": "tensorflow-python",
  "processingTimeMs": 142
}
```
