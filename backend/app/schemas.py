from typing import Dict, Any
from pydantic import BaseModel


class PredictAllRequest(BaseModel):
    code: str
    language: str = "unknown"


class SinglePrediction(BaseModel):
    label: int
    prediction: str
    confidence: float
    probabilities: Dict[str, float]


class PredictAllResponse(BaseModel):
    input: Dict[str, Any]
    predictions: Dict[str, Any]
