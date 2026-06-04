"""
spending_persona_api_v2.py
==========================
File API lengkap untuk Spending Persona Classifier — Versi 2

PERUBAHAN dari v1:
  - Tambah mode `use_llm: bool` di /analyze → false = template-based insight
  - Tambah endpoint /insight/template → insight tanpa model, pure rule-based
  - Template engine rule-based yang highlight kategori terbesar & terkecil
  - Persona context dari previous persona (riwayat persona)
  - Semua insight LLM punya fallback template otomatis jika API key kosong

Cara menjalankan:
  pip install fastapi uvicorn httpx python-dotenv tensorflow scikit-learn pandas numpy joblib
  uvicorn spending_persona_api_v2:app --reload --port 8000

Endpoint:
  GET  /health
  POST /predict              → prediksi persona saja (tanpa LLM)
  POST /budget               → rekomendasi alokasi budget
  POST /analyze              → predict + budget + insight (LLM atau template, pilihan)
  POST /insight/template     → template insight saja (no model, no LLM)
"""

# ─────────────────────────────────────────────────────────────────
# IMPORTS
# ─────────────────────────────────────────────────────────────────
from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path
from typing import Dict, List, Literal, Optional

import httpx
import joblib
import numpy as np
import pandas as pd
import tensorflow as tf
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()


# ─────────────────────────────────────────────────────────────────
# KONFIGURASI
# ─────────────────────────────────────────────────────────────────
ARTIFACTS_DIR     = os.getenv("ARTIFACTS_DIR", "artifacts")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_URL     = "https://api.anthropic.com/v1/messages"
ANTHROPIC_MODEL   = "claude-sonnet-4-20250514"
MODEL_FILENAME    = "wide_and_deep_opsi2.keras"

ALL_CATEGORIES = [
    "Anak-Anak", "Belanja", "Elektronik", "Hewan Peliharaan", "Hiburan",
    "Kesehatan", "Makanan", "Olahraga", "Pakaian", "Pendidikan",
    "Perumahan", "Sosial", "Tagihan", "Transportasi", "Traveling",
]

KEBUTUHAN_CATS = ["Perumahan", "Makanan", "Kesehatan", "Tagihan", "Transportasi"]
GAYAHIDUP_CATS = [
    "Hiburan", "Belanja", "Traveling", "Pakaian", "Elektronik",
    "Olahraga", "Sosial", "Hewan Peliharaan", "Anak-Anak", "Pendidikan",
]

BUDGET_RATIOS = {
    "saver":        {"kebutuhan": 0.40, "gaya_hidup": 0.15, "tabungan": 0.30, "investasi": 0.15},
    "balanced":     {"kebutuhan": 0.50, "gaya_hidup": 0.20, "tabungan": 0.20, "investasi": 0.10},
    "spender":      {"kebutuhan": 0.55, "gaya_hidup": 0.25, "tabungan": 0.15, "investasi": 0.05},
    "overspending": {"kebutuhan": 0.65, "gaya_hidup": 0.10, "tabungan": 0.15, "investasi": 0.10},
}

# ─────────────────────────────────────────────────────────────────
# TEMPLATE ENGINE (Rule-Based Insight — tanpa LLM)
# ─────────────────────────────────────────────────────────────────

# Deskripsi persona
PERSONA_DESC: Dict[str, str] = {
    "saver": (
        "Anda termasuk tipe **Saver** — sebagian besar pengeluaran Anda difokuskan "
        "pada kebutuhan pokok dan jauh dari gaya hidup konsumtif. "
        "Pola ini sangat sehat untuk membangun fondasi keuangan jangka panjang."
    ),
    "balanced": (
        "Anda termasuk tipe **Balanced** — pengeluaran Anda terbagi cukup proporsional "
        "antara kebutuhan pokok dan gaya hidup. "
        "Pertahankan keseimbangan ini dan mulai tingkatkan alokasi investasi."
    ),
    "spender": (
        "Anda termasuk tipe **Spender** — proporsi pengeluaran gaya hidup lebih dominan "
        "dibanding kebutuhan pokok. "
        "Ini bukan buruk, tapi perlu diwaspadai agar tidak menggerus pos tabungan."
    ),
    "overspending": (
        "Anda termasuk tipe **Overspending** — total pengeluaran melebihi pendapatan bulanan. "
        "Ini kondisi yang perlu segera ditangani untuk menghindari akumulasi utang."
    ),
}

# Tips per kategori terbesar
CATEGORY_TIPS: Dict[str, str] = {
    "Perumahan":       "Pertimbangkan negosiasi sewa atau refinancing jika memungkinkan.",
    "Makanan":         "Meal prep mingguan bisa memangkas biaya makan hingga 20–30%.",
    "Hiburan":         "Tetapkan budget hiburan bulanan yang tetap agar tidak overrun.",
    "Belanja":         "Terapkan aturan 24 jam sebelum membeli barang non-prioritas.",
    "Tagihan":         "Audit langganan rutin — batalkan yang jarang digunakan.",
    "Transportasi":    "Pertimbangkan carpooling atau transportasi umum untuk hari kerja.",
    "Kesehatan":       "Manfaatkan BPJS Kesehatan dan cek rutin untuk mencegah biaya besar.",
    "Traveling":       "Rencanakan perjalanan jauh-jauh hari untuk mendapat harga terbaik.",
    "Pakaian":         "Buat daftar kebutuhan sebelum belanja agar tidak impulsif.",
    "Elektronik":      "Beli produk refurbished atau tunggu momen sale tahunan.",
    "Pendidikan":      "Manfaatkan kursus online gratis/subsidi sebelum kursus berbayar.",
    "Olahraga":        "Fasilitas olahraga outdoor gratis bisa jadi alternatif gym.",
    "Sosial":          "Rayakan momen spesial dengan cara yang berkesan namun hemat.",
    "Hewan Peliharaan":"Vaksinasi rutin lebih hemat daripada biaya pengobatan darurat.",
    "Anak-Anak":       "Manfaatkan program beasiswa dan perlengkapan second-hand berkualitas.",
}

# Pesan kategori terkecil
SMALL_CATEGORY_NOTES: Dict[str, str] = {
    "Kesehatan": (
        "Pengeluaran kesehatan Anda sangat kecil — pastikan Anda tetap memiliki "
        "perlindungan BPJS atau asuransi dasar untuk antisipasi."
    ),
    "Pendidikan": (
        "Investasi pada diri sendiri (kursus, buku) masih sangat rendah. "
        "Sisihkan minimal 1–2% pendapatan untuk pengembangan kompetensi."
    ),
    "Tabungan": (
        "Pos tabungan belum terlihat — mulai dengan nominal kecil secara konsisten "
        "menggunakan metode Pay Yourself First."
    ),
}

# Pesan tren pengeluaran
TREND_NOTES: Dict[str, str] = {
    "naik":   "⚠️ Tren pengeluaran Anda **meningkat** 3 bulan terakhir — perlu dievaluasi.",
    "turun":  "✅ Tren pengeluaran Anda **menurun** 3 bulan terakhir — pertahankan!",
    "stabil": "📊 Tren pengeluaran Anda **stabil** — konsistensi yang baik.",
}

# Pesan perubahan persona dari persona sebelumnya
PERSONA_TRANSITION: Dict[tuple, str] = {
    ("saver",    "balanced"):     "📈 Pengeluaran mulai melebar dari pola hemat Anda sebelumnya.",
    ("saver",    "spender"):      "🔔 Pergeseran signifikan dari pola hemat ke konsumtif — evaluasi segera.",
    ("saver",    "overspending"): "🚨 Dari saver ke overspending — ada kejadian besar yang perlu ditangani.",
    ("balanced", "saver"):        "💪 Anda berhasil meningkatkan efisiensi pengeluaran — lanjutkan!",
    ("balanced", "spender"):      "⚠️ Pengeluaran gaya hidup mulai mendominasi dibanding periode lalu.",
    ("balanced", "overspending"): "🚨 Pengeluaran kini melebihi pendapatan — segera tinjau pos besar.",
    ("spender",  "balanced"):     "✅ Ada perbaikan nyata dari pola konsumtif bulan lalu!",
    ("spender",  "saver"):        "🌟 Transformasi luar biasa — Anda berhasil membalik pola belanja.",
    ("spender",  "overspending"): "🚨 Pola konsumtif memburuk hingga melebihi pendapatan.",
    ("overspending", "spender"):  "✅ Pengeluaran mulai terkendali, meski masih dominan gaya hidup.",
    ("overspending", "balanced"): "💪 Pemulihan signifikan dari overspending — kerja bagus!",
    ("overspending", "saver"):    "🌟 Pemulihan luar biasa dari overspending ke pola hemat!",
}


def _fmt(n: float | int) -> str:
    """Format angka ke format Rupiah."""
    return "Rp" + f"{int(n):,}".replace(",", ".")


def _pct(n: float) -> str:
    return f"{n * 100:.1f}%"


def _trend_label(trend: float) -> str:
    if trend > 0.05:  return "naik"
    if trend < -0.05: return "turun"
    return "stabil"


def build_template_insight(
    pred: dict,
    budget_data: Optional[dict] = None,
    previous_persona: Optional[str] = None,
) -> dict:
    """
    Bangun insight berbasis template tanpa LLM.

    Parameters
    ----------
    pred             : hasil dari SpendingPredictor.predict()
    budget_data      : hasil dari SpendingPredictor.budget() (opsional)
    previous_persona : persona dari periode sebelumnya (opsional)

    Returns
    -------
    dict berisi:
        persona_insight  : teks insight persona
        category_insight : highlight kategori terbesar & terkecil
        trend_insight    : teks tren pengeluaran
        transition_note  : pesan perubahan dari persona sebelumnya (jika ada)
        budget_insight   : teks alokasi budget (jika budget_data diberikan)
        summary          : ringkasan 1 baris
    """
    persona        = pred["persona"]
    top_cat        = pred["top_category"]["nama"]
    bot_cat        = pred["bot_category"]["nama"]
    top_total      = pred["top_category"]["total"]
    bot_total      = pred["bot_category"]["total"]
    avg_ratio      = pred["avg_monthly_ratio"]
    pendapatan     = pred["pendapatan"]
    kota           = pred["kota"]
    pct_kebutuhan  = pred["pct_kebutuhan"]
    pct_gayahidup  = pred["pct_gaya_hidup"]
    trend          = _trend_label(pred["spending_trend"])

    # ── 1. Persona insight ────────────────────────────────────────
    persona_insight = PERSONA_DESC.get(persona, f"Persona Anda terdeteksi sebagai {persona}.")

    # ── 2. Category insight ───────────────────────────────────────
    top_group = "kebutuhan pokok" if top_cat in KEBUTUHAN_CATS else "gaya hidup"
    bot_group = "kebutuhan pokok" if bot_cat in KEBUTUHAN_CATS else "gaya hidup"

    category_insight = (
        f"💸 **Pengeluaran terbesar** Anda ada di kategori **{top_cat}** "
        f"({_fmt(top_total)} atau {_pct(top_total / (pendapatan or 1))} dari pendapatan) "
        f"— termasuk kelompok {top_group}.\n"
        f"💡 {CATEGORY_TIPS.get(top_cat, 'Pantau konsistensi pengeluaran kategori ini.')}\n\n"
        f"📉 **Pengeluaran terkecil** ada di **{bot_cat}** ({_fmt(bot_total)}) "
        f"— termasuk kelompok {bot_group}.\n"
        f"{SMALL_CATEGORY_NOTES.get(bot_cat, f'Kategori {bot_cat} masih sangat kecil — sesuaikan jika diperlukan.')}"
    )

    # ── 3. Trend insight ──────────────────────────────────────────
    trend_insight = (
        f"{TREND_NOTES[trend]} "
        f"Rata-rata pengeluaran bulanan: {_pct(avg_ratio)} dari pendapatan "
        f"({_fmt(avg_ratio * pendapatan)}/{_fmt(pendapatan)})."
    )

    # ── 4. Spending profile ───────────────────────────────────────
    profile_insight = (
        f"📊 **Profil belanja** — Kebutuhan pokok: {_pct(pct_kebutuhan)} | "
        f"Gaya hidup: {_pct(pct_gayahidup)}"
    )
    if persona == "overspending":
        profile_insight += (
            f"\n⚠️ Total pengeluaran melebihi pendapatan. "
            f"Identifikasi pos yang bisa dipangkas segera."
        )
    elif pct_gayahidup > 0.35:
        profile_insight += (
            f"\n⚠️ Proporsi gaya hidup cukup tinggi ({_pct(pct_gayahidup)}). "
            f"Pertimbangkan untuk menekan ke bawah 30%."
        )
    elif pct_kebutuhan > 0.70:
        profile_insight += (
            f"\n💡 Sebagian besar pendapatan habis untuk kebutuhan pokok. "
            f"Ini wajar di kota dengan biaya hidup tinggi seperti {kota}."
        )

    # ── 5. Transition note ────────────────────────────────────────
    transition_note = None
    if previous_persona and previous_persona != persona:
        key = (previous_persona, persona)
        transition_note = PERSONA_TRANSITION.get(
            key,
            f"Persona berubah dari **{previous_persona}** menjadi **{persona}**."
        )

    # ── 6. Budget insight ─────────────────────────────────────────
    budget_insight = None
    if budget_data:
        b, r = budget_data["budget"], budget_data["rasio"]
        budget_insight = (
            f"📋 **Rekomendasi alokasi** untuk {persona} di {kota} "
            f"(pendapatan {_fmt(pendapatan)}):\n"
            f"  • Kebutuhan pokok : {_fmt(b['kebutuhan'])} ({round(r['kebutuhan']*100)}%)\n"
            f"  • Gaya hidup      : {_fmt(b['gaya_hidup'])} ({round(r['gaya_hidup']*100)}%)\n"
            f"  • Tabungan darurat: {_fmt(b['tabungan'])} ({round(r['tabungan']*100)}%)\n"
            f"  • Investasi       : {_fmt(b['investasi'])} ({round(r['investasi']*100)}%)"
        )
        # Gap analysis
        gap_kebutuhan  = pct_kebutuhan  - r["kebutuhan"]
        gap_gayahidup  = pct_gayahidup  - r["gaya_hidup"]
        if abs(gap_kebutuhan) > 0.05:
            arah = "lebih tinggi" if gap_kebutuhan > 0 else "lebih rendah"
            budget_insight += (
                f"\n\n💬 Kebutuhan pokok Anda saat ini {_pct(pct_kebutuhan)} — "
                f"{arah} {_pct(abs(gap_kebutuhan))} dari rekomendasi."
            )
        if abs(gap_gayahidup) > 0.05:
            arah = "lebih tinggi" if gap_gayahidup > 0 else "lebih rendah"
            budget_insight += (
                f"\n💬 Gaya hidup Anda saat ini {_pct(pct_gayahidup)} — "
                f"{arah} {_pct(abs(gap_gayahidup))} dari rekomendasi."
            )

    # ── 7. Summary 1 baris ────────────────────────────────────────
    summary = (
        f"Persona {persona.capitalize()} | "
        f"Terbesar: {top_cat} ({_fmt(top_total)}) | "
        f"Terkecil: {bot_cat} ({_fmt(bot_total)}) | "
        f"Ratio: {_pct(avg_ratio)} | Tren: {trend}"
    )

    result = {
        "persona_insight" : persona_insight,
        "category_insight": category_insight,
        "trend_insight"   : trend_insight,
        "profile_insight" : profile_insight,
        "summary"         : summary,
    }
    if transition_note:
        result["transition_note"] = transition_note
    if budget_insight:
        result["budget_insight"] = budget_insight

    return result


# ─────────────────────────────────────────────────────────────────
# SPENDING PREDICTOR (sama seperti v1, tidak diubah)
# ─────────────────────────────────────────────────────────────────
class SpendingPredictor:
    def __init__(self, artifacts_dir: str = ARTIFACTS_DIR):
        d = Path(artifacts_dir)
        if not (d / MODEL_FILENAME).exists():
            raise FileNotFoundError(
                f"Model tidak ditemukan di {d / MODEL_FILENAME}. "
                "Jalankan notebook training terlebih dahulu."
            )
        self.model  = tf.keras.models.load_model(d / MODEL_FILENAME)
        self.scaler = joblib.load(d / "scaler.pkl")
        self.le_p   = joblib.load(d / "le_persona.pkl")
        self.le_k   = joblib.load(d / "le_kota.pkl")
        with open(d / "metadata.json") as f:
            self.meta = json.load(f)
        self.OVER           = self.meta["overspending_threshold"]
        self.P33            = self.meta["p33_pct_kebutuhan"]
        self.P67            = self.meta["p67_pct_kebutuhan"]
        self.kebutuhan_cats = self.meta["kebutuhan_cats"]
        self.gayahidup_cats = self.meta["gayahidup_cats"]
        print(f"[SpendingPredictor] Model loaded. Kelas: {self.meta['persona_classes']}")

    def _build_features(self, df: pd.DataFrame) -> tuple[dict, float]:
        um = (
            df.groupby(["bulan", "tahun"])
            .agg(
                total_keluar=("jumlah_pengeluaran", "sum"),
                pendapatan  =("pendapatan_bulanan", "first"),
                n_transaksi =("jumlah_pengeluaran", "count"),
            )
            .reset_index()
        )
        um["monthly_ratio"] = um["total_keluar"] / um["pendapatan"]
        um = um.sort_values(["tahun", "bulan"])
        avg_ratio = float(um["monthly_ratio"].mean())
        grand     = df["jumlah_pengeluaran"].sum()
        feats: dict = {
            "std_ratio"         : float(um["monthly_ratio"].std() or 0),
            "ratio_range"       : float(um["monthly_ratio"].max() - um["monthly_ratio"].min()),
            "trend"             : float(
                um.tail(3)["monthly_ratio"].mean() - um.head(3)["monthly_ratio"].mean()
            ),
            "avg_keluar"        : float(um["total_keluar"].mean()),
            "std_keluar"        : float(um["total_keluar"].std() or 0),
            "avg_transaksi"     : float(um["n_transaksi"].mean()),
            "pendapatan_bulanan": float(df["pendapatan_bulanan"].iloc[0]),
        }
        for cat in ALL_CATEGORIES:
            val = df[df["Kategori"] == cat]["jumlah_pengeluaran"].sum()
            feats[f"cat_{cat}"] = float(val / grand) if grand > 0 else 0.0
        feats["pct_kebutuhan"]  = sum(feats.get(c, 0) for c in self.kebutuhan_cats)
        feats["pct_gaya_hidup"] = sum(feats.get(c, 0) for c in self.gayahidup_cats)
        return feats, avg_ratio

    def _base_response(self, df: pd.DataFrame, feats: dict, avg_ratio: float) -> dict:
        cat_totals = (
            df.groupby("Kategori")["jumlah_pengeluaran"]
            .sum()
            .sort_values(ascending=False)
        )
        return {
            "avg_monthly_ratio": round(avg_ratio, 4),
            "spending_trend"   : round(feats["trend"], 4),
            "pct_kebutuhan"    : round(feats["pct_kebutuhan"], 4),
            "pct_gaya_hidup"   : round(feats["pct_gaya_hidup"], 4),
            "pendapatan"       : int(feats["pendapatan_bulanan"]),
            "kota"             : df["Kota"].iloc[0],
            "top_category"     : {"nama": cat_totals.index[0],  "total": int(cat_totals.iloc[0])},
            "bot_category"     : {"nama": cat_totals.index[-1], "total": int(cat_totals.iloc[-1])},
        }

    def predict(self, transactions: list[dict]) -> dict:
        df             = pd.DataFrame(transactions)
        feats, avg_ratio = self._build_features(df)
        base           = self._base_response(df, feats, avg_ratio)
        if avg_ratio >= self.OVER:
            return {
                **base,
                "persona"   : "overspending",
                "confidence": 1.0,
                "proba"     : {"overspending": 1.0, "saver": 0.0, "balanced": 0.0, "spender": 0.0},
                "method"    : "rule",
            }
        x_num = np.array([[feats[c] for c in self.meta["model_feats"]]])
        x_num = self.scaler.transform(x_num)
        try:
            kota_enc = int(self.le_k.transform([df["Kota"].iloc[0]])[0])
        except ValueError:
            kota_enc = 0
        x_kota   = np.array([[kota_enc]])
        proba    = self.model.predict({"numerical": x_num, "kota": x_kota}, verbose=0)[0]
        pred_idx = int(np.argmax(proba))
        persona  = self.le_p.inverse_transform([pred_idx])[0]
        return {
            **base,
            "persona"   : persona,
            "confidence": round(float(proba[pred_idx]), 4),
            "proba"     : {c: round(float(p), 4) for c, p in zip(self.le_p.classes_, proba)},
            "method"    : "model",
        }

    def budget(self, persona: str, pendapatan: int) -> dict:
        ratios = BUDGET_RATIOS.get(persona, BUDGET_RATIOS["balanced"])
        return {
            "budget": {k: round(pendapatan * v) for k, v in ratios.items()},
            "rasio" : ratios,
        }


# ─────────────────────────────────────────────────────────────────
# LLM INSIGHT (sama seperti v1 + fallback ke template)
# ─────────────────────────────────────────────────────────────────
async def _call_llm(prompt: str, max_tokens: int = 350) -> str:
    if not ANTHROPIC_API_KEY:
        return None  # signal: gunakan template
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            ANTHROPIC_URL,
            headers={
                "Content-Type"      : "application/json",
                "x-api-key"         : ANTHROPIC_API_KEY,
                "anthropic-version" : "2023-06-01",
            },
            json={
                "model"     : ANTHROPIC_MODEL,
                "max_tokens": max_tokens,
                "messages"  : [{"role": "user", "content": prompt}],
            },
        )
        res.raise_for_status()
        return res.json()["content"][0]["text"]


async def get_persona_insight_llm(pred: dict) -> str:
    trend = (
        "meningkat dalam 3 bulan terakhir"  if pred["spending_trend"] > 0.05
        else "menurun dalam 3 bulan terakhir" if pred["spending_trend"] < -0.05
        else "stabil"
    )
    method_note = (
        f"Pengeluaran melebihi pendapatan (ratio {_pct(pred['avg_monthly_ratio'])})."
        if pred["method"] == "rule"
        else (
            f"Persona terdeteksi dari pola distribusi kategori belanja "
            f"dengan confidence {_pct(pred['confidence'])}. "
            f"Porsi kebutuhan pokok: {_pct(pred['pct_kebutuhan'])}, "
            f"gaya hidup: {_pct(pred['pct_gaya_hidup'])}."
        )
    )
    prompt = f"""Kamu adalah financial advisor yang memahami kondisi ekonomi Indonesia.

Data pengguna:
- Kota: {pred['kota']}
- Pendapatan: {_fmt(pred['pendapatan'])}/bulan
- Persona: {pred['persona']}
- {method_note}
- Rata-rata pengeluaran: {_pct(pred['avg_monthly_ratio'])} dari pendapatan
- Tren pengeluaran: {trend}
- Kategori terbesar: {pred['top_category']['nama']} ({_fmt(pred['top_category']['total'])})
- Kategori terkecil: {pred['bot_category']['nama']} ({_fmt(pred['bot_category']['total'])})

Berikan insight 3-4 kalimat dalam Bahasa Indonesia:
1. Konteks biaya hidup di {pred['kota']} yang relevan
2. Makna persona "{pred['persona']}" untuk kondisi mereka
3. Satu saran konkret berdasarkan kategori dominan "{pred['top_category']['nama']}"
Tone: ramah, tidak menghakimi."""
    return await _call_llm(prompt, 350)


async def get_budget_insight_llm(pred: dict, budget_data: dict) -> str:
    b, r = budget_data["budget"], budget_data["rasio"]
    prompt = f"""Kamu adalah perencana keuangan yang memahami kondisi ekonomi Indonesia.

Data pengguna:
- Kota: {pred['kota']}
- Pendapatan: {_fmt(pred['pendapatan'])}/bulan
- Persona: {pred['persona']}
- Porsi kebutuhan pokok saat ini: {_pct(pred['pct_kebutuhan'])}
- Porsi gaya hidup saat ini: {_pct(pred['pct_gaya_hidup'])}

Rekomendasi alokasi budget:
- Kebutuhan pokok : {_fmt(b['kebutuhan'])} ({round(r['kebutuhan']*100)}%)
- Gaya hidup      : {_fmt(b['gaya_hidup'])} ({round(r['gaya_hidup']*100)}%)
- Tabungan darurat: {_fmt(b['tabungan'])} ({round(r['tabungan']*100)}%)
- Investasi       : {_fmt(b['investasi'])} ({round(r['investasi']*100)}%)

Berikan 2-3 kalimat:
1. Apakah alokasi ini realistis di {pred['kota']}?
2. Tips spesifik untuk "{pred['top_category']['nama']}" di {pred['kota']}."""
    return await _call_llm(prompt, 280)


# ─────────────────────────────────────────────────────────────────
# SCHEMA
# ─────────────────────────────────────────────────────────────────
class Transaction(BaseModel):
    bulan              : int   = Field(..., ge=1, le=12)
    tahun              : int   = Field(..., ge=2020)
    Kota               : str
    Kategori           : str
    pendapatan_bulanan : float = Field(..., gt=0)
    jumlah_pengeluaran : float = Field(..., ge=0)


class PredictRequest(BaseModel):
    transactions: List[Transaction] = Field(..., min_length=1)


class BudgetRequest(BaseModel):
    persona    : str
    pendapatan : int = Field(..., gt=0)


class AnalyzeRequest(BaseModel):
    """Request untuk /analyze dengan pilihan mode insight."""
    transactions     : List[Transaction] = Field(..., min_length=1)
    use_llm          : bool = Field(
        default=True,
        description="True = pakai LLM (Anthropic API). False = pakai template rule-based (lebih cepat, tanpa biaya API)."
    )
    previous_persona : Optional[Literal["saver", "balanced", "spender", "overspending"]] = Field(
        default=None,
        description="Persona periode sebelumnya untuk menampilkan pesan perubahan pola."
    )


class TemplateInsightRequest(BaseModel):
    """Request untuk /insight/template — tidak butuh model, hanya butuh data spending summary."""
    persona          : Literal["saver", "balanced", "spender", "overspending"]
    pendapatan       : int   = Field(..., gt=0)
    kota             : str
    avg_monthly_ratio: float = Field(..., ge=0)
    spending_trend   : float = Field(default=0.0)
    pct_kebutuhan    : float = Field(..., ge=0, le=1)
    pct_gaya_hidup   : float = Field(..., ge=0, le=1)
    top_category     : dict  = Field(..., description='{"nama": "Makanan", "total": 1500000}')
    bot_category     : dict  = Field(..., description='{"nama": "Olahraga", "total": 50000}')
    previous_persona : Optional[Literal["saver", "balanced", "spender", "overspending"]] = None
    include_budget   : bool  = Field(default=True)


# ─────────────────────────────────────────────────────────────────
# FASTAPI APP
# ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title       = "Spending Persona API v2",
    description = (
        "Klasifikasi persona spending dengan Wide & Deep model (Opsi 2).\n\n"
        "**Dua mode insight:**\n"
        "- `use_llm: true` → insight naratif via Claude (butuh ANTHROPIC_API_KEY)\n"
        "- `use_llm: false` → insight template rule-based (cepat, tanpa biaya API)\n\n"
        "Endpoint `/insight/template` bisa dipakai tanpa model ML sama sekali."
    ),
    version     = "2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor: Optional[SpendingPredictor] = None


@app.on_event("startup")
def startup_event():
    global predictor
    try:
        predictor = SpendingPredictor(ARTIFACTS_DIR)
    except FileNotFoundError as e:
        print(f"[WARNING] {e}")
        print("[INFO] Endpoint /predict, /budget, /analyze tidak tersedia tanpa model.")
        print("[INFO] Endpoint /insight/template tetap tersedia.")


# ── Health ───────────────────────────────────────────────────────
@app.get("/health", summary="Cek status server dan model")
def health():
    has_model = predictor is not None
    return {
        "status"          : "ok",
        "model_loaded"    : has_model,
        "model"           : MODEL_FILENAME if has_model else None,
        "llm_configured"  : bool(ANTHROPIC_API_KEY),
        "persona_classes" : predictor.meta["persona_classes"] if has_model else [],
        "insight_modes"   : ["llm", "template"],
    }


# ── Predict ──────────────────────────────────────────────────────
@app.post(
    "/predict",
    summary="Prediksi persona (tanpa insight)",
    response_description="Persona, confidence, proba, statistik spending",
)
def predict(req: PredictRequest):
    if not predictor:
        raise HTTPException(503, "Model belum ter-load. Cek ARTIFACTS_DIR.")
    try:
        return predictor.predict([t.model_dump() for t in req.transactions])
    except Exception as e:
        raise HTTPException(500, str(e))


# ── Budget ───────────────────────────────────────────────────────
@app.post(
    "/budget",
    summary="Rekomendasi alokasi budget per persona",
)
def budget(req: BudgetRequest):
    if not predictor:
        raise HTTPException(503, "Model belum ter-load.")
    valid = list(BUDGET_RATIOS.keys())
    if req.persona not in valid:
        raise HTTPException(400, f"persona harus salah satu dari {valid}")
    return predictor.budget(req.persona, req.pendapatan)


# ── Analyze (predict + insight, LLM atau template) ───────────────
@app.post(
    "/analyze",
    summary="Analisis lengkap: predict + budget + insight (LLM atau template)",
    response_description="Prediksi, budget, dan insight dalam satu response",
)
async def analyze(req: AnalyzeRequest):
    """
    **One-call endpoint** dengan dua mode insight:

    - `use_llm: true` → insight naratif dari Claude (perlu ANTHROPIC_API_KEY).
      Jika API key tidak ada, otomatis fallback ke template.
    - `use_llm: false` → insight template rule-based: lebih cepat, deterministik,
      tanpa biaya API, dan highlight kategori terbesar/terkecil secara otomatis.

    `previous_persona` (opsional) menambah pesan perubahan pola spending antar periode.
    """
    if not predictor:
        raise HTTPException(503, "Model belum ter-load. Cek ARTIFACTS_DIR.")
    try:
        txns        = [t.model_dump() for t in req.transactions]
        pred        = predictor.predict(txns)
        budget_data = predictor.budget(pred["persona"], pred["pendapatan"])

        # ── Pilih mode insight ────────────────────────────────────
        if req.use_llm and ANTHROPIC_API_KEY:
            # Mode LLM — paralel call
            persona_insight_raw, budget_insight_raw = await asyncio.gather(
                get_persona_insight_llm(pred),
                get_budget_insight_llm(pred, budget_data),
            )
            insight_mode = "llm"
            insight = {
                "persona_insight": persona_insight_raw,
                "budget_insight" : budget_insight_raw,
            }
            # Tetap sertakan transition note dari template jika ada previous_persona
            if req.previous_persona and req.previous_persona != pred["persona"]:
                key = (req.previous_persona, pred["persona"])
                insight["transition_note"] = PERSONA_TRANSITION.get(
                    key,
                    f"Persona berubah dari {req.previous_persona} menjadi {pred['persona']}."
                )
        else:
            # Mode template (use_llm=False atau API key kosong)
            insight_mode = "template" if not req.use_llm else "template_fallback"
            insight = build_template_insight(
                pred,
                budget_data=budget_data,
                previous_persona=req.previous_persona,
            )

        return {
            "prediction"  : pred,
            "budget"      : budget_data,
            "insight"     : insight,
            "insight_mode": insight_mode,
        }

    except Exception as e:
        raise HTTPException(500, str(e))


# ── Template Insight (tanpa model ML) ────────────────────────────
@app.post(
    "/insight/template",
    summary="Template insight rule-based (tanpa model ML & tanpa LLM)",
    response_description="Insight highlight kategori, tren, persona, dan budget",
)
def template_insight(req: TemplateInsightRequest):
    """
    Endpoint **tanpa model ML dan tanpa LLM**.

    Cocok untuk:
    - Frontend yang sudah punya hasil prediksi dan hanya perlu teks insight
    - Situasi offline / hemat biaya
    - A/B testing antara insight LLM vs template

    Input: data summary spending (bisa dari /predict atau dihitung sendiri).
    Output: insight berbasis template dengan highlight kategori terbesar/terkecil.
    """
    pred = {
        "persona"          : req.persona,
        "pendapatan"       : req.pendapatan,
        "kota"             : req.kota,
        "avg_monthly_ratio": req.avg_monthly_ratio,
        "spending_trend"   : req.spending_trend,
        "pct_kebutuhan"    : req.pct_kebutuhan,
        "pct_gaya_hidup"   : req.pct_gaya_hidup,
        "top_category"     : req.top_category,
        "bot_category"     : req.bot_category,
        "method"           : "external",
        "confidence"       : 1.0,
    }
    budget_data = None
    if req.include_budget:
        ratios      = BUDGET_RATIOS.get(req.persona, BUDGET_RATIOS["balanced"])
        budget_data = {
            "budget": {k: round(req.pendapatan * v) for k, v in ratios.items()},
            "rasio" : ratios,
        }
    return {
        "insight"     : build_template_insight(pred, budget_data, req.previous_persona),
        "budget"      : budget_data,
        "insight_mode": "template",
    }


# ─────────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("spending_persona_api_v2:app", host="0.0.0.0", port=8000, reload=True)
