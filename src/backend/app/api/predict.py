from fastapi import APIRouter

from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.predictor import predict_alzheimers

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    result = predict_alzheimers(request.text)
    return result