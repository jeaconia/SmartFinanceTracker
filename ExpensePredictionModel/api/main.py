# ============================================================
# FASTAPI - API PREDIKSI PENGELUARAN 3 BULAN
# ============================================================

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List
import numpy as np
import joblib
import tensorflow as tf
import os

# ============================================================
# LOAD MODEL DAN SCALER
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "model_final_prediksi_pengeluaran.keras")
SCALER_PATH = os.path.join(BASE_DIR, "feature_scaler.pkl")
TARGET_CONFIG_PATH = os.path.join(BASE_DIR, "target_config.pkl")

model = tf.keras.models.load_model(MODEL_PATH, compile=False)
feature_scaler = joblib.load(SCALER_PATH)
target_config = joblib.load(TARGET_CONFIG_PATH)

MAX_RATIO = target_config["MAX_RATIO"]

# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="API Prediksi Pengeluaran",
    description="API untuk memprediksi proporsi pengeluaran 3 bulan ke depan menggunakan model LSTM/GRU.",
    version="1.0.0"
)

# ============================================================
# REQUEST SCHEMA
# ============================================================

class PredictionRequest(BaseModel):
    user_id: str = Field(..., example="USR001")

    # Harus 3 baris data, masing-masing berisi 12 fitur numerik
    # Sesuai input model: (1, 3, 12)
    features: List[List[float]] = Field(
        ...,
        example=[
            [1, 2026, 2500000, 20, 125000, 0, 5000000, 0.10, 2300000, 2400000, 46.0, 48.0],
            [2, 2026, 2600000, 22, 118181, 0, 5000000, 0.04, 2500000, 2450000, 50.0, 49.0],
            [3, 2026, 2700000, 25, 108000, 0, 5000000, 0.03, 2600000, 2600000, 52.0, 51.0]
        ]
    )

# ============================================================
# FUNCTION STATUS RISIKO
# ============================================================

def status_risiko(x):
    persen = x * 100  # 1.26 → 126
    if persen < 75:
        return "Aman"
    elif persen < 100:
        return "Perlu Dipantau"
    elif persen < 150:
        return "Waspada Overspending"
    else:
        return "Kritis"

# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "API Prediksi Pengeluaran aktif",
        "input_shape": "(3, 12)",
        "output": "Prediksi proporsi pengeluaran 3 bulan ke depan"
    }

# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "OK",
        "model_loaded": True,
        "max_ratio": MAX_RATIO
    }

# ============================================================
# PREDICT ENDPOINT
# ============================================================

@app.post("/predict")
def predict_pengeluaran(request: PredictionRequest):
    try:
        data = np.array(request.features, dtype=float)

        # Validasi bentuk input
        if data.shape != (3, 12):
            raise HTTPException(
                status_code=400,
                detail=f"Input harus berbentuk 3 baris x 12 fitur. Bentuk input saat ini: {data.shape}"
            )

        # Scaling fitur
        data_scaled = feature_scaler.transform(data)

        # Reshape ke format model LSTM/GRU: (batch, timestep, feature)
        data_scaled = data_scaled.reshape(1, 3, 12)

        # Prediksi
        pred_scaled = model.predict(data_scaled)

        # Output model dikembalikan ke rasio asli
        pred_ratio = pred_scaled.flatten() * MAX_RATIO

        # Buat hasil 3 bulan ke depan
        predictions = []

        for i, value in enumerate(pred_ratio, start=1):
            predictions.append({
                "bulan_ke": i,
                "proporsi_terhadap_pendapatan": round(float(value), 2),
                "status": status_risiko(float(value))
            })

        return {
            "success": True,
            "user_id": request.user_id,
            "predictions": predictions
        }

    except HTTPException as e:
        raise e

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )