# ============================================================
# AutoBudgeting API — FastAPI
# Model: TensorFlow Functional API (bundle .pkl)
# Endpoint: POST /predict
# ============================================================

import os
import json
import math
import joblib
import numpy as np
import pandas as pd
import tensorflow as tf

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional


# ============================================================
# CUSTOM LOSS — harus didefinisikan agar bundle bisa di-load
# ============================================================

def custom_mae_huber_loss(y_true, y_pred):
    y_true = tf.reshape(y_true, (-1, 1))
    y_pred = tf.reshape(y_pred, (-1, 1))
    mae    = tf.reduce_mean(tf.abs(y_true - y_pred))
    delta  = 0.02
    error  = y_true - y_pred
    abs_e  = tf.abs(error)
    quad   = tf.minimum(abs_e, delta)
    lin    = abs_e - quad
    huber  = tf.reduce_mean(0.5 * tf.square(quad) + delta * lin)
    return 0.9 * mae + 0.1 * huber


# ============================================================
# LOAD BUNDLE
# ============================================================

BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
BUNDLE_PATH  = os.path.join(BASE_DIR, "model_bundle.pkl")

if not os.path.exists(BUNDLE_PATH):
    raise FileNotFoundError(f"model_bundle.pkl tidak ditemukan di {BASE_DIR}")

import keras
with keras.saving.custom_object_scope({"custom_mae_huber_loss": custom_mae_huber_loss}):
    _bundle = joblib.load(BUNDLE_PATH)

model           = _bundle["model"]
scaler_num      = _bundle["scaler_numeric"]
scaler_y        = _bundle["scaler_target"]
le_user         = _bundle["label_encoder_user"]
le_kota         = _bundle["label_encoder_kota"]
NUMERIC_FEATURES = _bundle["numeric_features"]
MAX_RATIO       = _bundle["max_ratio"]
MODEL_METRICS   = {k: (float(v) if isinstance(v, (np.floating, np.float32, float)) else v)
                   for k, v in _bundle["metrics"].items()
                   if k != "y_pred_real"}


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="AutoBudgeting API",
    description=(
        "Prediksi rasio pengeluaran bulan depan dan rekomendasi alokasi budget "
        "menggunakan TensorFlow Functional API."
    ),
    version="1.0.0",
)


# ============================================================
# REQUEST SCHEMA
# ============================================================

class BudgetRequest(BaseModel):
    """
    Data yang dikirim dari Node.js backend.

    Field historis (rasio_lag_*, rolling_*) bersifat opsional;
    jika tidak dikirim, API akan menghitung fallback dari rasio bulan ini.
    """
    user_id: str   = Field(..., example="USR000001")
    kota:    str   = Field(..., example="Jakarta Selatan")

    bulan:  int   = Field(..., ge=1, le=12, example=5)
    tahun:  int   = Field(..., example=2026)

    pendapatan_bulanan: float = Field(..., gt=0,   example=5_000_000)
    total_pengeluaran:  float = Field(..., ge=0,   example=3_500_000)

    # Lag & rolling — opsional
    rasio_lag_1:   Optional[float] = Field(None, example=0.70)
    rasio_lag_2:   Optional[float] = Field(None, example=0.65)
    rasio_lag_3:   Optional[float] = Field(None, example=0.72)
    rolling_mean_2: Optional[float] = Field(None, example=0.675)
    rolling_mean_3: Optional[float] = Field(None, example=0.690)
    rolling_mean_6: Optional[float] = Field(None, example=0.680)
    rolling_std_3:  Optional[float] = Field(None, example=0.030)


# ============================================================
# HELPERS
# ============================================================

def _encode_safe(encoder, value: str) -> int:
    """Return encoded label; fallback to 0 for unseen values."""
    value = str(value).strip().title()
    if value in encoder.classes_:
        return int(encoder.transform([value])[0])
    return 0


def _status_risiko(ratio: float) -> str:
    pct = ratio * 100
    if pct < 75:   return "Aman"
    if pct < 100:  return "Perlu Dipantau"
    if pct < 150:  return "Waspada Overspending"
    return "Kritis"


def _budget_split(status: str):
    """Return (kebutuhan_pct, keinginan_pct, tabungan_pct) berdasarkan status risiko."""
    splits = {
        "Aman":                  (0.50, 0.30, 0.20),
        "Perlu Dipantau":        (0.55, 0.25, 0.20),
        "Waspada Overspending":  (0.60, 0.20, 0.20),
        "Kritis":                (0.65, 0.15, 0.20),
    }
    return splits.get(status, (0.50, 0.30, 0.20))


def _build_features(req: BudgetRequest):
    """Hitung semua fitur numerik dari request dan kembalikan DataFrame."""
    pend  = float(req.pendapatan_bulanan)
    total = float(req.total_pengeluaran)
    sisa  = pend - total

    rasio        = (total / pend) if pend > 0 else 0.0
    rasio        = min(rasio, MAX_RATIO)
    total_norm   = rasio
    sisa_pct     = (sisa / pend) if pend > 0 else 0.0

    pend_log  = math.log1p(pend)
    peng_log  = math.log1p(total)

    month_sin = math.sin(2 * math.pi * req.bulan / 12)
    month_cos = math.cos(2 * math.pi * req.bulan / 12)

    bulan_next = req.bulan + 1
    tahun_next = req.tahun
    if bulan_next > 12:
        bulan_next = 1
        tahun_next += 1

    next_sin = math.sin(2 * math.pi * bulan_next / 12)
    next_cos = math.cos(2 * math.pi * bulan_next / 12)

    # Lag & rolling (fallback ke rasio bulan ini jika tidak dikirim)
    lag1 = req.rasio_lag_1    if req.rasio_lag_1    is not None else rasio
    lag2 = req.rasio_lag_2    if req.rasio_lag_2    is not None else lag1
    lag3 = req.rasio_lag_3    if req.rasio_lag_3    is not None else lag2
    rm2  = req.rolling_mean_2 if req.rolling_mean_2 is not None else (rasio + lag1) / 2
    rm3  = req.rolling_mean_3 if req.rolling_mean_3 is not None else (rasio + lag1 + lag2) / 3
    rm6  = req.rolling_mean_6 if req.rolling_mean_6 is not None else rm3
    rs3  = req.rolling_std_3  if req.rolling_std_3  is not None else float(np.std([rasio, lag1, lag2]))
    diff = rasio - lag1

    # Historical features (API tidak tahu nilai aktual bulan depan → pakai rolling_mean_3)
    hist_next  = rm3
    hist_error = hist_next - rasio

    row = {
        "bulan":                 req.bulan,
        "tahun":                 req.tahun,
        "bulan_next":            bulan_next,
        "tahun_next":            tahun_next,
        "pendapatan_bulanan":    pend,
        "total_pengeluaran":     total,
        "sisa_anggaran":         sisa,
        "rasio_pengeluaran":     rasio,
        "total_pengeluaran_norm": total_norm,
        "sisa_pct":              sisa_pct,
        "pendapatan_log":        pend_log,
        "pengeluaran_log":       peng_log,
        "month_sin":             month_sin,
        "month_cos":             month_cos,
        "next_month_sin":        next_sin,
        "next_month_cos":        next_cos,
        "rasio_lag_1":           lag1,
        "rasio_lag_2":           lag2,
        "rasio_lag_3":           lag3,
        "rolling_mean_2":        rm2,
        "rolling_mean_3":        rm3,
        "rolling_mean_6":        rm6,
        "rolling_std_3":         rs3,
        "rasio_diff":            diff,
        "historical_next_ratio": hist_next,
        "historical_error":      hist_error,
    }

    df = pd.DataFrame([row])[NUMERIC_FEATURES]
    return df


# ============================================================
# ENDPOINTS
# ============================================================

@app.get("/")
def root():
    return {
        "message": "AutoBudgeting API aktif",
        "model":   "TensorFlow Functional API",
        "docs":    "/docs",
    }


@app.get("/health")
def health():
    return {
        "status":       "OK",
        "model_loaded": True,
        "max_ratio":    MAX_RATIO,
        "metrics": {
            "mae_scaled":        MODEL_METRICS.get("mae_scaled"),
            "akurasi_estimasi":  MODEL_METRICS.get("akurasi_estimasi"),
        },
    }


@app.get("/metrics")
def get_metrics():
    return {"message": "Metrik model dari hasil training", "metrics": MODEL_METRICS}


@app.post("/predict")
def predict_budget(req: BudgetRequest):
    try:
        df_row   = _build_features(req)
        X_scaled = scaler_num.transform(df_row).astype("float32")

        user_enc = np.array([_encode_safe(le_user, req.user_id)], dtype="int32")
        kota_enc = np.array([_encode_safe(le_kota, req.kota)],    dtype="int32")

        pred_scaled = float(np.clip(
            model.predict([X_scaled, user_enc, kota_enc], verbose=0).reshape(-1)[0],
            0, 1,
        ))

        pred_ratio = float(max(0.0, scaler_y.inverse_transform([[pred_scaled]])[0, 0]))

        pend              = float(req.pendapatan_bulanan)
        pred_pengeluaran  = pred_ratio * pend
        pred_sisa         = pend - pred_pengeluaran
        status            = _status_risiko(pred_ratio)

        kb_pct, ki_pct, tb_pct = _budget_split(status)

        rasio_saat_ini = (float(req.total_pengeluaran) / pend) if pend > 0 else 0.0

        return {
            "success":    True,
            "user_id":    req.user_id,
            "kota":       req.kota,

            "input": {
                "bulan":                      req.bulan,
                "tahun":                      req.tahun,
                "pendapatan_bulanan":         pend,
                "total_pengeluaran_saat_ini": float(req.total_pengeluaran),
                "rasio_pengeluaran_saat_ini": round(rasio_saat_ini, 4),
            },

            "prediction": {
                "prediksi_rasio_scaled":          round(pred_scaled, 4),
                "prediksi_rasio_pengeluaran":     round(pred_ratio,  4),
                "prediksi_pengeluaran_bulan_depan": round(pred_pengeluaran),
                "prediksi_sisa_anggaran":         round(pred_sisa),
                "status_risiko":                  status,
            },

            # Inilah yang akan disimpan ke ai_results.budget_recommendation
            "budget_recommendation": {
                "kebutuhan_persen": round(kb_pct * 100, 1),
                "keinginan_persen": round(ki_pct * 100, 1),
                "tabungan_persen":  round(tb_pct * 100, 1),
                "budget_kebutuhan": round(pend * kb_pct),
                "budget_keinginan": round(pend * ki_pct),
                "budget_tabungan":  round(pend * tb_pct),
            },

            "model_info": {
                "model_type":       "TensorFlow Functional API",
                "mae_scaled":       MODEL_METRICS.get("mae_scaled"),
                "akurasi_estimasi": MODEL_METRICS.get("akurasi_estimasi"),
            },
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
