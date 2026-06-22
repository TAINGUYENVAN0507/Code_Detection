import json
import os
from datetime import datetime
from pathlib import Path

from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.model_service import ModelService
from app.schemas import (
    PredictAllRequest,
    PredictAllResponse,
)


app = FastAPI(title="AI Code Detector API")

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOW_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_service = ModelService()


@app.get("/")
def home():
    return {
        "message": "AI Code Detector API",
        "available_models": model_service.get_available_models(),
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "available_models": model_service.get_available_models(),
    }


@app.post("/predict-all", response_model=PredictAllResponse)
def predict_all(request: PredictAllRequest):
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code is empty")

    predictions = model_service.predict_all(request.code)

    return {
        "input": {
            "language": request.language,
            "code": request.code,
        },
        "predictions": predictions,
    }


@app.post("/predict-all-json")
def predict_all_json(request: PredictAllRequest):
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code is empty")

    predictions = model_service.predict_all(request.code)

    result = {
        "input": {
            "language": request.language,
            "code": request.code,
        },
        "predictions": predictions,
    }

    output_dir = Path("outputs")
    output_dir.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = output_dir / f"prediction_result_{timestamp}.json"

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    return FileResponse(
        path=output_path,
        media_type="application/json",
        filename=output_path.name,
    )

static_dir = Path(__file__).resolve().parent.parent / "static"

if static_dir.exists():
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")