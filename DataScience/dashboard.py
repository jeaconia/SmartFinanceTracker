"""
Dashboard EDA — Smart Personal Finance Tracker (SPFT) 
==========================================================
Dataset Real: 269.743 transaksi · 1.000 pengguna · Juni 2025 – Mei 2026
Kolom: id_pengguna, tanggal, bulan, tahun, Kota, Kategori,
        pendapatan_bulanan, jumlah_pengeluaran, status_user

Prinsip Desain & Integritas Visualisasi:
  1. Zero baseline pada bar chart         → mencegah distorsi persepsi
  2. Konsistensi palet semantik           → biru=normal, merah=bahaya, kuning=waspada, hijau=sehat
  3. Label & anotasi eksplisit            → setiap angka penting di grafik
  4. Judul + sumber konteks              → setiap chart punya judul & subtitle
  5. Skala sesuai data                   → log-scale hanya jika membantu
  6. Keterangan warna (legend)           → selalu ada >1 seri
  7. Tidak menyalahgunakan 3D/pie        → donut dengan teks pusat
  8. Gridlines minimal                   → hanya sumbu Y
  9. Rasio aspek proporsional            → tinggi chart sesuai konten
 10. Aksesibilitas warna                 → palet aman color-blind
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import warnings

warnings.filterwarnings("ignore")

# ── Konfigurasi halaman ──────────────────────────────────────────────────────
st.set_page_config(
    page_title="EDA · Smart Personal Finance Tracker",
    page_icon="💰",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Palet semantik 
C_MAIN   = "#185FA5"
C_WARN   = "#E07B00"
C_DANGER = "#D63031"
C_OK     = "#27AE60"
C_MUTED  = "#95A5A6"

PALETTE_CAT = [
    "#185FA5","#E07B00","#27AE60","#D63031","#8E44AD",
    "#2980B9","#F39C12","#1ABC9C","#C0392B","#7F8C8D",
    "#16A085","#2C3E50","#F1C40F","#E74C3C","#3498DB",
]

# ── Deteksi tema (dark / light) 
def get_theme():
    """Deteksi tema Streamlit saat ini."""
    try:
        theme = st.get_option("theme.base")
        return "dark" if theme == "dark" else "light"
    except Exception:
        return "light"

THEME = get_theme()
IS_DARK = THEME == "dark"

# Warna teks & sumbu dinamis
TEXT_COLOR   = "#ffffff" if IS_DARK else "#111827"
AXIS_COLOR   = "#ffffff" if IS_DARK else "#000000"
GRID_COLOR   = "rgba(255,255,255,0.15)" if IS_DARK else "#d1d5db"
ZERO_COLOR   = "rgba(255,255,255,0.3)"  if IS_DARK else "#9ca3af"
LEGEND_BG    = "rgba(30,30,30,0.85)"    if IS_DARK else "rgba(255,255,255,0.9)"
LEGEND_BORDER= "#555555"                if IS_DARK else "#d1d5db"
METRIC_BG    = "#1e1e2e"               if IS_DARK else "#ffffff"
METRIC_BORDER= "#2d2d44"               if IS_DARK else "#e8ecf0"
METRIC_VAL   = "#ffffff"               if IS_DARK else "#1a1a2e"
INSIGHT_BG   = "#1a2332"               if IS_DARK else "#f8fafc"
INSIGHT_TEXT = "#c8d8e8"               if IS_DARK else "#34495e"

# ── CSS Custom 
st.markdown(f"""
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

html, body, [class*="css"] {{
    font-family: 'Plus Jakarta Sans', sans-serif;
}}
.metric-card {{
    background: {METRIC_BG};
    border: 1px solid {METRIC_BORDER};
    border-left: 4px solid var(--accent, #185FA5);
    border-radius: 10px;
    padding: 18px 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}}
.metric-card .label {{ font-size: 11px; color: #7f8c8d; font-weight: 600; text-transform: uppercase; letter-spacing: .8px; }}
.metric-card .value {{ font-size: 26px; font-weight: 700; color: {METRIC_VAL}; margin: 4px 0 2px; font-family: 'JetBrains Mono', monospace; }}
.metric-card .delta {{ font-size: 12px; color: #7f8c8d; }}
.section-header {{
    font-size: 18px;
    font-weight: 700;
    color: {TEXT_COLOR};
    border-bottom: 2px solid {"rgba(255,255,255,0.25)" if IS_DARK else "#e5e7eb"};
    padding-bottom: 8px;
    margin: 28px 0 16px;
}}
.insight-box {{
    background: {INSIGHT_BG}; border-left: 3px solid #185FA5;
    border-radius: 0 8px 8px 0; padding: 12px 16px; margin-top: 10px;
    font-size: 13px; color: {INSIGHT_TEXT}; line-height: 1.6;
}}
.badge-danger {{ background:#fdecea; color:#D63031; padding:2px 8px; border-radius:4px; font-weight:600; font-size:12px; }}
.badge-ok     {{ background:#eafaf1; color:#27AE60; padding:2px 8px; border-radius:4px; font-weight:600; font-size:12px; }}
.badge-warn   {{ background:#fff8ec; color:#E07B00; padding:2px 8px; border-radius:4px; font-weight:600; font-size:12px; }}
.min-filter-warning {{
    background: {"#2d1f00" if IS_DARK else "#fff8ec"};
    border: 1px solid #E07B00;
    border-left: 4px solid #E07B00;
    border-radius: 8px;
    padding: 16px 20px;
    color: {"#ffc966" if IS_DARK else "#7a4500"};
    font-size: 14px;
    line-height: 1.7;
    margin: 16px 0;
}}
</style>
""", unsafe_allow_html=True)

# ── Helper 
def fmt_rp(x): return f"Rp {x/1e6:.1f} jt"
def fmt_rp_rb(x): return f"Rp {x/1e3:.0f} rb"
def fmt_int(x): return f"{x:,.0f}"

def apply_chart_defaults(fig, height=380):

    fig.update_layout(
        height=height,
        margin=dict(l=40, r=20, t=50, b=40),

        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",

        font=dict(
            family="Plus Jakarta Sans",
            size=12,
            color=TEXT_COLOR
        ),

        legend=dict(
            bgcolor=LEGEND_BG,
            bordercolor=LEGEND_BORDER,
            borderwidth=1,
            font=dict(
                size=11,
                color=TEXT_COLOR
            )
        ),

        xaxis=dict(
            showgrid=False,
            showline=True,
            linecolor=AXIS_COLOR,
            tickfont=dict(color=TEXT_COLOR),
            title_font=dict(color=TEXT_COLOR)
        ),

        yaxis=dict(
            showgrid=True,
            gridcolor=GRID_COLOR,
            showline=True,
            linecolor=AXIS_COLOR,
            tickfont=dict(color=TEXT_COLOR),
            title_font=dict(color=TEXT_COLOR)
        )
    )

    return fig

def metric_card(label, value, delta="", accent=C_MAIN):
    return f"""
    <div class="metric-card" style="--accent:{accent}">
        <div class="label">{label}</div>
        <div class="value">{value}</div>
        <div class="delta">{delta}</div>
    </div>"""

def safe_sample(df_input, n=2000, random_state=42):
    """Ambil sampel dengan aman — tidak akan error jika data < n."""
    actual_n = min(n, len(df_input))
    if actual_n == 0:
        return df_input
    return df_input.sample(actual_n, random_state=random_state)

def check_min_data(df_check, min_rows=2, context="grafik ini"):
    """
    Periksa apakah data cukup untuk ditampilkan.
    Kembalikan True jika cukup, False + tampilkan warning jika tidak.
    """
    if len(df_check) < min_rows:
        st.markdown(
            f'<div class="min-filter-warning">'
            f'⚠️ <b>Data tidak cukup untuk menampilkan {context}.</b><br>'
            f'Filter saat ini menghasilkan <b>{len(df_check)} baris</b>. '
            f'Untuk melihat grafik/diagram ini, coba perluas filter — misalnya tambahkan lebih banyak '
            f'<b>Kota</b>, <b>Kategori</b>, atau <b>Status User</b>.'
            f'</div>',
            unsafe_allow_html=True,
        )
        return False
    return True

# ── Load & Prepare Data 

@st.cache_data
def load_data():

    import os

    base_dir = os.path.dirname(__file__)
    csv_path = os.path.join(base_dir, "raw_dataset_personal_finance.csv")

    df = pd.read_csv(csv_path)

    df["tanggal"] = pd.to_datetime(df["tanggal"])

    # Hitung total pengeluaran per user per bulan untuk rasio
    monthly_spend = (
        df.groupby(["id_pengguna", "tahun", "bulan"])["jumlah_pengeluaran"]
        .sum()
        .reset_index()
        .rename(columns={"jumlah_pengeluaran": "total_pengeluaran_bulanan"})
    )
    df = df.merge(monthly_spend, on=["id_pengguna", "tahun", "bulan"], how="left")

    # Fitur tambahan
    df["rasio_pengeluaran"] = df["total_pengeluaran_bulanan"] / df["pendapatan_bulanan"]
    df["sisa_anggaran"]     = df["pendapatan_bulanan"] - df["total_pengeluaran_bulanan"]
    df["flag_overspend"]    = (df["status_user"] == "Overspending").astype(int)

    # Segmentasi keuangan berdasarkan rasio
    df["status_keuangan"] = pd.cut(
        df["rasio_pengeluaran"],
        bins=[0, 0.8, 1.0, 1.5, np.inf],
        labels=["Aman (<80%)", "Waspada (80–100%)", "Overspend (100–150%)", "Kritis (>150%)"],
    )

    # Region mapping
    barat  = ["Jakarta Selatan","Jakarta Utara","Jakarta Timur","Jakarta Barat","Bandung","Bogor",
               "Bekasi","Depok","Tangerang","Serang","Cilegon","Sukabumi","Cirebon","Tasikmalaya",
               "Tegal","Pekalongan","Semarang","Solo","Salatiga","Magelang","Purwokerto","Kudus",
               "Blitar","Malang","Surabaya","Madiun","Probolinggo","Kediri","Pasuruan","Mojokerto",
               "Batu","Yogyakarta","Bandar Lampung","Palembang","Jambi","Pangkal Pinang","Bengkulu",
               "Pekanbaru","Batam","Padang","Bukittinggi","Langsa","Lhokseumawe","Banda Aceh",
               "Sabang","Sibolga","Binjai","Pematangsiantar","Medan","Tanjung Balai"]
    timur  = ["Manado","Gorontalo","Sorong","Nabire","Jayapura","Merauke","Ternate","Ambon",
               "Tual","Kendari"]
    def get_region(kota):
        if kota in barat:    return "Indonesia Barat"
        elif kota in timur:  return "Indonesia Timur"
        else:                return "Indonesia Tengah"

    df["region"] = df["Kota"].apply(get_region)
    return df

df_raw = load_data()

# ── Sidebar 
with st.sidebar:
    st.markdown("### 🎛️ Filter Dashboard")
    st.markdown("---")

    all_cities = sorted(df_raw["Kota"].unique())
    all_cats   = sorted(df_raw["Kategori"].unique())
    all_regs   = sorted(df_raw["region"].unique())

    sel_region = st.multiselect("Region", all_regs, default=all_regs)
    sel_city   = st.multiselect("Kota", all_cities, default=[],
                                 help="Kosongkan untuk semua kota")
    sel_cat    = st.multiselect("Kategori", all_cats, default=all_cats)
    sel_status = st.multiselect("Status User", ["Normal","Overspending"],
                                 default=["Normal","Overspending"])

    inc_min = int(df_raw["pendapatan_bulanan"].min() // 1e6)
    inc_max = int(df_raw["pendapatan_bulanan"].max() // 1e6) + 1
    income_rng = st.slider("Pendapatan Bulanan (Rp juta)",
                            min_value=inc_min, max_value=inc_max, value=(inc_min, inc_max))
    st.markdown("---")
    st.markdown("**Periode Data**")
    st.caption("Juni 2025 — Mei 2026")
    st.markdown("---")
    st.markdown(
        "<div style='font-size:11px;color:#95a5a6'>Dashboard EDA · Smart Personal Finance Tracker</div>",
        unsafe_allow_html=True,
    )

# ── Filter data 
city_filter = sel_city if sel_city else all_cities
df = df_raw[
    (df_raw["region"].isin(sel_region)) &
    (df_raw["Kota"].isin(city_filter)) &
    (df_raw["Kategori"].isin(sel_cat)) &
    (df_raw["status_user"].isin(sel_status)) &
    (df_raw["pendapatan_bulanan"] >= income_rng[0] * 1e6) &
    (df_raw["pendapatan_bulanan"] <= income_rng[1] * 1e6)
].copy()

def filter_too_narrow():

    return (
        df["Kota"].nunique() < 2
        or df["Kategori"].nunique() < 2
        or df["status_user"].nunique() < 2
        or len(df) < 30
    )


def show_filter_warning():

    st.warning(
        """
### ⚠️ Filter Terlalu Sempit

Data yang tersisa setelah proses filter terlalu sedikit sehingga beberapa visualisasi tidak dapat ditampilkan.

**Agar grafik dapat ditampilkan, silakan:**

- Pilih lebih dari **1 Region**
- Pilih minimal **2 Kota**
- Pilih minimal **2 Kategori**
- Pilih minimal **2 Status User**

Atau perluas filter yang digunakan.
"""
    )

# ══════════════════════════════════════════════════════════════════════════════
# HEADER
# ══════════════════════════════════════════════════════════════════════════════
st.markdown("""
<div style="background:linear-gradient(135deg,#1a237e 0%,#185FA5 60%,#0097a7 100%);
     border-radius:14px;padding:28px 32px;margin-bottom:24px;color:white;">
  <h1 style="margin:0;font-size:26px;font-weight:700;letter-spacing:-.5px;">
    💰 Smart Personal Finance Tracker
  </h1>
  <p style="margin:6px 0 0;opacity:.85;font-size:14px;">
    Exploratory Data Analysis · 269.743 transaksi · 1.000 pengguna · Juni 2025 – Mei 2026
  </p>
</div>
""", unsafe_allow_html=True)

# ══════════════════════════════════════════════════════════════════════════════
# KPI CARDS
# ══════════════════════════════════════════════════════════════════════════════
total_rows     = len(df)
n_users        = df["id_pengguna"].nunique()
overspend_pct  = df["flag_overspend"].mean() * 100
avg_income     = df.groupby("id_pengguna")["pendapatan_bulanan"].first().median()
avg_spend      = df["jumlah_pengeluaran"].median()
n_kota         = df["Kota"].nunique()

c1, c2, c3, c4, c5, c6 = st.columns(6)
c1.markdown(metric_card("Total Transaksi",   f"{total_rows:,}",        "baris dalam dataset"),            unsafe_allow_html=True)
c2.markdown(metric_card("Jumlah Pengguna",   f"{n_users:,}",           "unique id_pengguna"),             unsafe_allow_html=True)
c3.markdown(metric_card("% Overspending",    f"{overspend_pct:.1f}%",  "transaksi overspend", C_DANGER),  unsafe_allow_html=True)
c4.markdown(metric_card("Median Pendapatan", fmt_rp(avg_income),       "per pengguna/bulan", C_OK),       unsafe_allow_html=True)
c5.markdown(metric_card("Median Pengeluaran",fmt_rp_rb(avg_spend),     "per transaksi", C_WARN),          unsafe_allow_html=True)
c6.markdown(metric_card("Cakupan Kota",      f"{n_kota}",              "kota di Indonesia"),              unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# ══════════════════════════════════════════════════════════════════════════════
# TAB NAVIGASI
# ══════════════════════════════════════════════════════════════════════════════
tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "📊 Distribusi Univariat",
    "🔗 Analisis Bivariat",
    "🗺️ Analisis Geografis",
    "📈 Tren Temporal",
    "🧩 Feature Engineering",
])

# ══════════════════════════════════════════════════════════════════════════════
# TAB 1 · DISTRIBUSI UNIVARIAT
# ══════════════════════════════════════════════════════════════════════════════
with tab1:
    if filter_too_narrow():
        show_filter_warning()
    else:
        st.markdown('<div class="section-header">1.1 Distribusi Pendapatan Bulanan</div>', unsafe_allow_html=True)

    income_vals = df.groupby("id_pengguna")["pendapatan_bulanan"].first().reset_index()
    if not check_min_data(income_vals, min_rows=5, context="distribusi pendapatan (1.1)"):
        pass
    else:
        fig_inc = px.histogram(
            income_vals, x="pendapatan_bulanan",
            nbins=40,
            color_discrete_sequence=[C_MAIN],
            labels={"pendapatan_bulanan": "Pendapatan Bulanan (Rp)", "count": "Jumlah Pengguna"},
            title="Distribusi Pendapatan Bulanan · 1.000 Pengguna",
        )
        fig_inc.update_traces(marker_line_color="white", marker_line_width=0.5)
        fig_inc.update_layout(
            xaxis_tickformat=",.0f",
            xaxis_title="Pendapatan Bulanan (Rp)",
            yaxis_title="Jumlah Pengguna",
            bargap=0.05,
            yaxis=dict(rangemode="tozero"),
        )
        med_inc  = income_vals["pendapatan_bulanan"].median()
        mean_inc = income_vals["pendapatan_bulanan"].mean()
        fig_inc.add_vline(x=med_inc, line_dash="dash", line_color=C_OK, line_width=2,
                          annotation_text=f"Median: {fmt_rp(med_inc)}",
                          annotation_position="top right", annotation_font_color=C_OK)
        fig_inc.add_vline(x=mean_inc, line_dash="dot", line_color=C_WARN, line_width=2,
                          annotation_text=f"Mean: {fmt_rp(mean_inc)}",
                          annotation_position="top left", annotation_font_color=C_WARN)
        apply_chart_defaults(fig_inc)
        st.plotly_chart(fig_inc, use_container_width=True)
        st.markdown(
            f'<div class="insight-box">📌 Distribusi pendapatan cukup merata di rentang '
            f'<b>Rp3–15 juta/bulan</b>, merepresentasikan berbagai segmen ekonomi. '
            f'Median (Rp{med_inc/1e6:.1f} jt) dan mean (Rp{mean_inc/1e6:.1f} jt) berdekatan, '
            f'menunjukkan distribusi yang relatif simetris.</div>',
            unsafe_allow_html=True,
        )

    if filter_too_narrow():
        show_filter_warning()
    else:
        st.markdown('<div class="section-header">1.2 Distribusi Jumlah Pengeluaran per Transaksi</div>', unsafe_allow_html=True)
    col_a, col_b = st.columns(2)

    if not check_min_data(df, min_rows=5, context="distribusi pengeluaran (1.2)"):
        pass
    else:
        with col_a:
            fig_exp = px.histogram(
                df, x="jumlah_pengeluaran", nbins=60,
                color_discrete_sequence=[C_MAIN],
                title="Distribusi Pengeluaran per Transaksi (skala normal)",
            )
            fig_exp.update_traces(marker_line_color="white", marker_line_width=0.3)
            fig_exp.update_layout(
                xaxis_title="Jumlah Pengeluaran (Rp)",
                yaxis_title="Frekuensi",
                xaxis_tickformat=",.0s",
                yaxis=dict(rangemode="tozero"),
            )
            apply_chart_defaults(fig_exp)
            st.plotly_chart(fig_exp, use_container_width=True)

        with col_b:
            fig_exp_log = px.histogram(
                df, x="jumlah_pengeluaran", nbins=80,
                color_discrete_sequence=[C_WARN],
                title="Distribusi Pengeluaran per Transaksi (skala logaritmik)",
            )
            fig_exp_log.update_traces(marker_line_color="white", marker_line_width=0.3)
            fig_exp_log.update_layout(
                xaxis_title="Jumlah Pengeluaran (Rp)",
                yaxis_title="Frekuensi (log scale)",
                xaxis_tickformat=",.0s",
                yaxis_type="log",
            )
            apply_chart_defaults(fig_exp_log)
            st.plotly_chart(fig_exp_log, use_container_width=True)

    if filter_too_narrow():
        show_filter_warning()
    else:
        st.markdown('<div class="section-header">1.3 Distribusi Kategori Pengeluaran</div>', unsafe_allow_html=True)

    if not check_min_data(df, min_rows=2, context="distribusi kategori (1.3)"):
        pass
    else:
        cat_counts = df["Kategori"].value_counts().reset_index()
        cat_counts.columns = ["Kategori", "Jumlah"]
        fig_cat = px.bar(
            cat_counts.sort_values("Jumlah"),
            x="Jumlah", y="Kategori",
            orientation="h",
            color="Jumlah",
            color_continuous_scale=[[0, "#c8ddf5"], [1, C_MAIN]],
            title="Frekuensi Transaksi per Kategori Pengeluaran (15 Kategori)",
            text="Jumlah",
        )
        fig_cat.update_traces(texttemplate="%{text:,}", textposition="outside")
        fig_cat.update_layout(
            xaxis_title="Jumlah Transaksi",
            yaxis_title="",
            showlegend=False,
            coloraxis_showscale=False,
            xaxis=dict(rangemode="tozero"),
            height=480,
        )
        apply_chart_defaults(fig_cat, height=480)
        st.plotly_chart(fig_cat, use_container_width=True)

    if filter_too_narrow():
        show_filter_warning()
    else:
        st.markdown('<div class="section-header">1.4 Median Pengeluaran per Kategori</div>', unsafe_allow_html=True)

    if not check_min_data(df, min_rows=2, context="median per kategori (1.4)"):
        pass
    else:
        cat_med = df.groupby("Kategori")["jumlah_pengeluaran"].median().reset_index()
        cat_med.columns = ["Kategori", "Median Pengeluaran"]
        cat_med = cat_med.sort_values("Median Pengeluaran", ascending=True)

        fig_cat_med = go.Figure(go.Bar(
            x=cat_med["Median Pengeluaran"],
            y=cat_med["Kategori"],
            orientation="h",
            marker_color=PALETTE_CAT[:len(cat_med)],
            text=[fmt_rp_rb(v) for v in cat_med["Median Pengeluaran"]],
            textposition="outside",
        ))
        fig_cat_med.update_layout(
            title="Median Pengeluaran per Kategori",
            xaxis_title="Median Jumlah Pengeluaran (Rp)",
            yaxis_title="",
            xaxis=dict(rangemode="tozero", tickformat=",.0s"),
            height=480,
        )
        apply_chart_defaults(fig_cat_med, height=480)
        st.plotly_chart(fig_cat_med, use_container_width=True)
        st.markdown(
            '<div class="insight-box">📌 Kategori <b>Perumahan</b> memiliki median pengeluaran tertinggi '
            '(Rp463 rb/transaksi), diikuti <b>Tagihan</b> dan <b>Makanan</b>. Sementara <b>Olahraga</b> dan '
            '<b>Hewan Peliharaan</b> memiliki median terendah. '
            'Dataset mencakup 15 kategori dengan distribusi frekuensi yang sangat merata (~18.000 transaksi/kategori).</div>',
            unsafe_allow_html=True,
        )

# ══════════════════════════════════════════════════════════════════════════════
# TAB 2 · ANALISIS BIVARIAT
# ══════════════════════════════════════════════════════════════════════════════
with tab2:
    st.markdown('<div class="section-header">2.1 Status Keuangan — Overspending vs Normal</div>',
                unsafe_allow_html=True)

    col1, col2 = st.columns([1, 1.4])

    with col1:
        status_counts = df["status_user"].value_counts()
        labels = ["Overspending", "Normal"]
        values = [int(status_counts.get("Overspending", 0)), int(status_counts.get("Normal", 0))]
        total  = sum(values)
        ovs_pct = values[0]/total*100 if total else 0

        fig_donut = go.Figure(go.Pie(
            labels=labels, values=values,
            hole=0.62,
            marker_colors=[C_DANGER, C_OK],
            textinfo="percent+label",
            textfont_size=13,
            hovertemplate="%{label}: %{value:,} transaksi<br>(%{percent})<extra></extra>",
            showlegend=True,
        ))
        fig_donut.add_annotation(
            text=f"<b>{ovs_pct:.1f}%</b><br><span style='font-size:11px'>Overspend</span>",
            x=0.5, y=0.5, showarrow=False, font_size=18, align="center",
        )
        fig_donut.update_layout(
            title="Proporsi Status Keuangan Pengguna",
            legend=dict(orientation="h", y=-0.08, x=0.5, xanchor="center"),
        )
        apply_chart_defaults(fig_donut, height=340)
        st.plotly_chart(fig_donut, use_container_width=True)

    with col2:
        # Segmentasi 4-tier berdasarkan rasio_pengeluaran
        order = ["Aman (<80%)", "Waspada (80–100%)", "Overspend (100–150%)", "Kritis (>150%)"]
        color_map = {
            "Aman (<80%)":          C_OK,
            "Waspada (80–100%)":    "#F1C40F",
            "Overspend (100–150%)": C_WARN,
            "Kritis (>150%)":       C_DANGER,
        }
        seg = df["status_keuangan"].value_counts().reset_index()
        seg.columns = ["Status", "Jumlah"]
        seg["Status"] = pd.Categorical(seg["Status"], categories=order, ordered=True)
        seg = seg.dropna(subset=["Status"]).sort_values("Status")
        seg["Persentase"] = seg["Jumlah"] / seg["Jumlah"].sum() * 100
        seg["warna"] = seg["Status"].map(color_map)

        fig_seg = go.Figure(go.Bar(
            x=seg["Status"],
            y=seg["Jumlah"],
            marker_color=seg["warna"].tolist(),
            text=[f"{p:.1f}%" for p in seg["Persentase"]],
            textposition="outside",
            hovertemplate="%{x}<br>Jumlah: %{y:,}<br>Persentase: %{text}<extra></extra>",
        ))
        fig_seg.update_layout(
            title="Segmentasi Kesehatan Keuangan (4 Kategori)",
            xaxis_title="Segmen Keuangan",
            yaxis_title="Jumlah Transaksi",
            yaxis=dict(rangemode="tozero"),
        )
        apply_chart_defaults(fig_seg, height=340)
        st.plotly_chart(fig_seg, use_container_width=True)

    st.markdown(
        f'<div class="insight-box">📌 Mayoritas transaksi (<b>{100-ovs_pct:.1f}%</b>) berstatus '
        f'<span class="badge-ok">Normal</span>, sementara <b>{ovs_pct:.1f}%</b> teridentifikasi '
        f'<span class="badge-danger">Overspending</span>. '
        f'Ini menunjukkan sebagian besar pengguna masih dalam kondisi keuangan terkendali.</div>',
        unsafe_allow_html=True,
    )

    st.markdown('<div class="section-header">2.2 Pengeluaran per Kategori berdasarkan Status User</div>',
                unsafe_allow_html=True)

    cat_status = df.groupby(["Kategori","status_user"])["jumlah_pengeluaran"].median().reset_index()
    fig_cs = px.bar(
        cat_status, x="Kategori", y="jumlah_pengeluaran", color="status_user",
        barmode="group",
        color_discrete_map={"Normal": C_OK, "Overspending": C_DANGER},
        title="Median Pengeluaran per Kategori & Status User",
        labels={"jumlah_pengeluaran": "Median Pengeluaran (Rp)", "status_user": "Status"},
        text_auto=False,
    )
    fig_cs.update_layout(
        xaxis_tickangle=-30,
        yaxis=dict(rangemode="tozero", tickformat=",.0s"),
        height=400,
    )
    apply_chart_defaults(fig_cs, height=400)
    st.plotly_chart(fig_cs, use_container_width=True)

    st.markdown('<div class="section-header">2.3 Distribusi Pengeluaran per Status User</div>',
                unsafe_allow_html=True)

    col3, col4 = st.columns(2)
    with col3:
        if df["status_user"].nunique() < 2:
            st.warning(
            """
⚠️ Box Plot tidak dapat ditampilkan.

Visualisasi ini membutuhkan minimal:

• Normal
• Overspending

secara bersamaan.
"""
        )

        else:

            fig_box = px.box(
                df,
                x="status_user",
                y="jumlah_pengeluaran",
                color="status_user",
                color_discrete_map={
                    "Normal": C_OK,
                    "Overspending": C_DANGER
                },
                title="Box Plot Pengeluaran per Status User",
                labels={
                    "jumlah_pengeluaran": "Jumlah Pengeluaran (Rp)",
                    "status_user": "Status"
                },
                notched=True,
            )

            fig_box.update_layout(
                showlegend=False,
                yaxis=dict(
                    rangemode="tozero",
                    tickformat=",.0s"
                )
            )

            apply_chart_defaults(fig_box)

            st.plotly_chart(
                fig_box,
                use_container_width=True
            )

    with col4:
        # Scatter pendapatan vs total_pengeluaran_bulanan
        sample_df = df.drop_duplicates(subset=["id_pengguna", "bulan", "tahun"])
        if len(sample_df) < 2:
            st.warning("⚠️ Scatter Plot tidak dapat ditampilkan karena data tidak mencukupi.")
        else:
            sample = sample_df.sample(
                min(2000, len(sample_df)),
                random_state=42)

        fig_sc = px.scatter(
            sample, x="pendapatan_bulanan", y="total_pengeluaran_bulanan",
            color="status_user",
            color_discrete_map={"Normal": C_OK, "Overspending": C_DANGER},
            opacity=0.45,
            title="Pendapatan vs Total Pengeluaran Bulanan",
            labels={
                "pendapatan_bulanan": "Pendapatan Bulanan (Rp)",
                "total_pengeluaran_bulanan": "Total Pengeluaran Bulanan (Rp)",
                "status_user": "Status",
            },
        )
        x_range = np.linspace(df["pendapatan_bulanan"].min(), df["pendapatan_bulanan"].max(), 100)
        fig_sc.add_trace(go.Scatter(
            x=x_range, y=x_range, mode="lines",
            line=dict(color=C_DANGER, dash="dash", width=2),
            name="Pendapatan = Pengeluaran",
            hoverinfo="skip",
        ))
        fig_sc.update_layout(
            xaxis_tickformat=",.0s", yaxis_tickformat=",.0s",
            legend_title="Status",
        )
        apply_chart_defaults(fig_sc)
        st.plotly_chart(fig_sc, use_container_width=True)

    st.markdown('<div class="section-header">2.4 Pendapatan vs Status User</div>',
                unsafe_allow_html=True)


    if df["status_user"].nunique() < 2:

        st.warning(
        """
⚠️ Violin Plot tidak dapat ditampilkan.

Visualisasi ini membutuhkan minimal:

• Normal
• Overspending

secara bersamaan.
"""
    )

    else:

        fig_inc_status = px.violin(
            df.drop_duplicates(subset=["id_pengguna"]),
            x="status_user",
            y="pendapatan_bulanan",
            color="status_user",
            color_discrete_map={
                "Normal": C_OK,
                "Overspending": C_DANGER
            },
            box=True,
            points=False,
            title="Distribusi Pendapatan Bulanan per Status User",
            labels={
                "pendapatan_bulanan": "Pendapatan Bulanan (Rp)",
                "status_user": "Status User"
            },
        )

    fig_inc_status.update_layout(
        showlegend=False,
        yaxis=dict(tickformat=",.0s")
    )

    apply_chart_defaults(fig_inc_status, height=360)

    st.plotly_chart(
        fig_inc_status,
        use_container_width=True
    )


    st.markdown(
        '<div class="insight-box">📌 Menariknya, distribusi pendapatan antara pengguna '
        '<span class="badge-ok">Normal</span> dan <span class="badge-danger">Overspending</span> '
        'cukup mirip — artinya overspending <b>tidak semata-mata disebabkan pendapatan rendah</b>, '
        'melainkan lebih dipengaruhi oleh pola belanja dan pengelolaan anggaran.</div>',
        unsafe_allow_html=True,
    )

# ══════════════════════════════════════════════════════════════════════════════
# TAB 3 · ANALISIS GEOGRAFIS
# ══════════════════════════════════════════════════════════════════════════════
with tab3:
    st.markdown('<div class="section-header">3.1 Top 15 Kota — Median Pengeluaran per Transaksi</div>',
                unsafe_allow_html=True)

    city_agg = df.groupby("Kota").agg(
        n_obs=("id_pengguna","count"),
        median_pendapatan=("pendapatan_bulanan","median"),
        median_pengeluaran=("jumlah_pengeluaran","median"),
        pct_overspend=("flag_overspend","mean"),
    ).reset_index()
    city_agg["pct_overspend"] *= 100
    city_top15 = city_agg.nlargest(15, "median_pengeluaran")

    fig_city = go.Figure()
    fig_city.add_trace(go.Bar(
        name="Median Pendapatan", x=city_top15["Kota"],
        y=city_top15["median_pendapatan"],
        marker_color=C_OK,
        text=[fmt_rp(v) for v in city_top15["median_pendapatan"]],
        textposition="outside", textfont_size=9,
    ))
    fig_city.add_trace(go.Bar(
        name="Median Pengeluaran/Transaksi", x=city_top15["Kota"],
        y=city_top15["median_pengeluaran"],
        marker_color=C_DANGER,
        text=[fmt_rp_rb(v) for v in city_top15["median_pengeluaran"]],
        textposition="outside", textfont_size=9,
    ))
    fig_city.update_layout(
        barmode="group",
        title="15 Kota dengan Median Pengeluaran per Transaksi Tertinggi",
        xaxis_title="Kota",
        yaxis_title="Nilai (Rp)",
        yaxis=dict(rangemode="tozero", tickformat=",.0s"),
        legend_title="Variabel",
        height=420,
        xaxis_tickangle=-30,
    )
    apply_chart_defaults(fig_city, height=420)
    st.plotly_chart(fig_city, use_container_width=True)

    st.markdown('<div class="section-header">3.2 Distribusi % Overspending per Kota (Top 20)</div>',
                unsafe_allow_html=True)

    city_top20_ovs = city_agg.nlargest(20, "pct_overspend").sort_values("pct_overspend")
    avg_ovs = df["flag_overspend"].mean() * 100
    colors_ovs = [C_DANGER if p >= 30 else C_WARN if p >= 20 else C_OK
                  for p in city_top20_ovs["pct_overspend"]]

    fig_ovs = go.Figure(go.Bar(
        x=city_top20_ovs["pct_overspend"],
        y=city_top20_ovs["Kota"],
        orientation="h",
        marker_color=colors_ovs,
        text=[f"{p:.1f}%" for p in city_top20_ovs["pct_overspend"]],
        textposition="outside",
        hovertemplate="<b>%{y}</b><br>% Overspend: %{x:.1f}%<extra></extra>",
    ))
    fig_ovs.add_vline(x=avg_ovs, line_dash="dash", line_color="#7f8c8d", line_width=1.5,
                      annotation_text=f"Rata-rata: {avg_ovs:.1f}%",
                      annotation_position="top right", annotation_font_size=10)
    fig_ovs.update_layout(
        title="Persentase Transaksi Overspending per Kota (Top 20)",
        xaxis_title="% Overspending",
        yaxis_title="",
        xaxis=dict(rangemode="tozero", range=[0, max(city_top20_ovs["pct_overspend"])*1.2]),
        height=520,
    )
    apply_chart_defaults(fig_ovs, height=520)
    st.plotly_chart(fig_ovs, use_container_width=True)

    st.markdown('<div class="section-header">3.3 Komposisi Status User per Region</div>',
                unsafe_allow_html=True)

    reg_agg = df.groupby(["region","status_user"]).size().reset_index(name="n")
    reg_total = reg_agg.groupby("region")["n"].transform("sum")
    reg_agg["pct"] = reg_agg["n"] / reg_total * 100

    fig_reg = px.bar(
        reg_agg, x="region", y="pct", color="status_user",
        color_discrete_map={"Normal": C_OK, "Overspending": C_DANGER},
        title="Komposisi Status Keuangan per Region (100% Stacked)",
        labels={"pct": "Persentase (%)", "region": "Region", "status_user": "Status"},
        text_auto=".1f",
    )
    fig_reg.update_layout(
        yaxis=dict(range=[0, 100], ticksuffix="%"),
        legend_title="Status User",
        height=380,
    )
    apply_chart_defaults(fig_reg, height=380)
    st.plotly_chart(fig_reg, use_container_width=True)

    # Jumlah pengguna per kota — bubble
    st.markdown(
        '<div class="section-header">3.4 Volume Transaksi & Overspending per Kota (Top 25)</div>',
        unsafe_allow_html=True
    )

    if df["Kota"].nunique() < 2:

        st.warning(
            """
    ⚠️ Bubble Chart tidak dapat ditampilkan.

    Visualisasi geografis membutuhkan minimal 2 kota.
    """
        )

    else:

        city_bubble = city_agg.nlargest(25, "n_obs")

        fig_bubble = px.scatter(
            city_bubble,
            x="median_pendapatan",
            y="pct_overspend",
            size="n_obs",
            color="median_pengeluaran",
            hover_name="Kota",
            color_continuous_scale=[[0, "#c8ddf5"], [1, C_DANGER]],
            title="Bubble Chart: Pendapatan vs % Overspending per Kota (ukuran = volume transaksi)",
            labels={
                "median_pendapatan": "Median Pendapatan (Rp)",
                "pct_overspend": "% Overspending",
                "n_obs": "Volume Transaksi",
                "median_pengeluaran": "Median Pengeluaran",
            },
            size_max=50,
        )

        fig_bubble.update_layout(xaxis_tickformat=",.0s")
        apply_chart_defaults(fig_bubble, height=420)
        st.plotly_chart(fig_bubble, use_container_width=True)


    top_ovs_kota = city_agg.nlargest(3, "pct_overspend")["Kota"].tolist()
    st.markdown(
        f'<div class="insight-box">📌 Kota dengan tingkat overspending tertinggi: '
        f'<b>{", ".join(top_ovs_kota)}</b>. '
        f'Perbedaan antarwilayah mengindikasikan perlu strategi pengelolaan yang <b>berbeda per region</b>, '
        f'bukan pendekatan seragam nasional.</div>',
        unsafe_allow_html=True,
    )

# ══════════════════════════════════════════════════════════════════════════════
# TAB 4 · TREN TEMPORAL
# ══════════════════════════════════════════════════════════════════════════════
with tab4:
    df["period"] = df["tanggal"].dt.to_period("M").astype(str)

    st.markdown('<div class="section-header">4.1 Tren Volume Transaksi Bulanan</div>',
                unsafe_allow_html=True)

    monthly_vol = df.groupby(["period","status_user"]).size().reset_index(name="n")
    fig_vol = px.bar(
        monthly_vol, x="period", y="n", color="status_user",
        color_discrete_map={"Normal": C_OK, "Overspending": C_DANGER},
        title="Volume Transaksi Bulanan per Status User",
        labels={"period": "Periode", "n": "Jumlah Transaksi", "status_user": "Status"},
        barmode="stack",
    )
    fig_vol.update_layout(
        xaxis_tickangle=-30,
        yaxis=dict(rangemode="tozero"),
        legend_title="Status",
        height=380,
    )
    apply_chart_defaults(fig_vol, height=380)
    st.plotly_chart(fig_vol, use_container_width=True)

    st.markdown('<div class="section-header">4.2 Tren Median Pengeluaran & Pendapatan Bulanan</div>',
                unsafe_allow_html=True)

    monthly = df.groupby("period").agg(
        median_pengeluaran=("jumlah_pengeluaran","median"),
        median_pendapatan=("pendapatan_bulanan","median"),
        n_obs=("id_pengguna","count"),
        pct_overspend=("flag_overspend","mean"),
    ).reset_index()
    monthly["pct_overspend"] *= 100
    monthly["ma3_pengeluaran"] = monthly["median_pengeluaran"].rolling(3, min_periods=1).mean()

    fig_trend = go.Figure()
    fig_trend.add_trace(go.Scatter(
        x=monthly["period"], y=monthly["median_pengeluaran"],
        name="Median Pengeluaran/Transaksi", mode="lines+markers",
        line=dict(color=C_DANGER, width=2), marker=dict(size=5),
    ))
    fig_trend.add_trace(go.Scatter(
        x=monthly["period"], y=monthly["ma3_pengeluaran"],
        name="MA3 Pengeluaran", mode="lines",
        line=dict(color=C_WARN, width=2.5, dash="dash"),
    ))
    fig_trend.update_layout(
        title="Tren Bulanan: Median Pengeluaran per Transaksi (Jun 2025 – Mei 2026)",
        xaxis_title="Periode (Bulan)",
        yaxis_title="Median Pengeluaran (Rp)",
        yaxis=dict(tickformat=",.0s", rangemode="tozero"),
        legend_title="Metrik",
        height=380,
        xaxis_tickangle=-30,
    )
    apply_chart_defaults(fig_trend, height=380)
    st.plotly_chart(fig_trend, use_container_width=True)

    col_t1, col_t2 = st.columns(2)

    with col_t1:
        st.markdown('<div class="section-header">4.3 Tren % Overspending Bulanan</div>',
                    unsafe_allow_html=True)
        fig_ovst = go.Figure()
        fig_ovst.add_trace(go.Scatter(
            x=monthly["period"], y=monthly["pct_overspend"],
            fill="tozeroy", name="% Overspending",
            fillcolor="rgba(214,48,49,0.15)",
            line=dict(color=C_DANGER, width=2.5),
        ))
        fig_ovst.add_hline(y=monthly["pct_overspend"].mean(), line_dash="dot", line_color="#7f8c8d",
                           annotation_text=f"Rata-rata: {monthly['pct_overspend'].mean():.1f}%",
                           annotation_position="bottom right", annotation_font_size=10)
        fig_ovst.update_layout(
            yaxis_title="% Overspending",
            xaxis_title="Periode",
            yaxis=dict(rangemode="tozero", ticksuffix="%"),
            showlegend=False,
            xaxis_tickangle=-30,
        )
        apply_chart_defaults(fig_ovst)
        st.plotly_chart(fig_ovst, use_container_width=True)

    with col_t2:
        st.markdown('<div class="section-header">4.4 Distribusi Transaksi per Bulan</div>',
                    unsafe_allow_html=True)
        monthly_count = df.groupby("bulan")["id_pengguna"].count().reset_index()
        monthly_count.columns = ["Bulan", "Jumlah"]
        bulan_label = {1:"Jan",2:"Feb",3:"Mar",4:"Apr",5:"Mei",6:"Jun",
                       7:"Jul",8:"Agt",9:"Sep",10:"Okt",11:"Nov",12:"Des"}
        monthly_count["Label"] = monthly_count["Bulan"].map(bulan_label)

        fig_monthly = go.Figure(go.Bar(
            x=monthly_count["Label"],
            y=monthly_count["Jumlah"],
            marker_color=C_MAIN,
            text=[f"{v:,}" for v in monthly_count["Jumlah"]],
            textposition="outside",
        ))
        fig_monthly.update_layout(
            title="Volume Transaksi per Bulan (Agregat)",
            xaxis_title="Bulan",
            yaxis_title="Jumlah Transaksi",
            yaxis=dict(rangemode="tozero"),
            xaxis_tickangle=0,
        )
        apply_chart_defaults(fig_monthly)
        st.plotly_chart(fig_monthly, use_container_width=True)

    st.markdown('<div class="section-header">4.5 Heatmap Volume Transaksi per Kategori & Bulan</div>',
                unsafe_allow_html=True)

    cat_monthly = df.groupby(["period","Kategori"]).size().reset_index(name="n")
    fig_heatmap = px.density_heatmap(
        cat_monthly, x="period", y="Kategori", z="n",
        color_continuous_scale=[[0,"#eaf4fe"],[0.5,"#185FA5"],[1,"#0a2d5e"]],
        title="Heatmap Volume Transaksi per Kategori & Bulan (Jun 2025 – Mei 2026)",
        labels={"period":"Periode","n":"Jumlah Transaksi"},
        text_auto=True,
    )
    fig_heatmap.update_layout(
        coloraxis_colorbar_title="Transaksi",
        height=500,
        xaxis_tickangle=-30,
    )
    apply_chart_defaults(fig_heatmap, height=500)
    st.plotly_chart(fig_heatmap, use_container_width=True)

    st.markdown(
        '<div class="insight-box">📌 Volume transaksi relatif stabil sepanjang periode, '
        'dengan sedikit variasi antar bulan. Semua 15 kategori terdistribusi merata '
        'di setiap bulan, menunjukkan pola pengeluaran yang <b>konsisten</b> tanpa lonjakan musiman '
        'yang signifikan.</div>',
        unsafe_allow_html=True,
    )

# ══════════════════════════════════════════════════════════════════════════════
# TAB 5 · FEATURE ENGINEERING
# ══════════════════════════════════════════════════════════════════════════════
with tab5:
    st.markdown('<div class="section-header">5.1 Distribusi Fitur-Fitur Turunan</div>', unsafe_allow_html=True)

    feats = [
        ("rasio_pengeluaran",         "Rasio Total Pengeluaran/Pendapatan", C_MAIN, None, "Rasio > 1 = potensi overspend"),
        ("sisa_anggaran",             "Sisa Anggaran Bulanan (Rp)",         C_OK,   1e6,  "Positif = ada sisa, negatif = defisit"),
        ("jumlah_pengeluaran",        "Pengeluaran per Transaksi (Rp)",     C_WARN, 1e3,  "Ribu rupiah per transaksi"),
        ("total_pengeluaran_bulanan", "Total Pengeluaran Bulanan (Rp)",     C_MAIN, 1e6,  "Akumulasi seluruh transaksi"),
    ]

    col_f1, col_f2 = st.columns(2)
    for i, (col, label, color, divisor, subtitle) in enumerate(feats):
        vals = df[col].dropna()
        if divisor:
            vals = vals / divisor
            unit = f" ({'juta Rp' if divisor==1e6 else 'ribu Rp'})"
        else:
            unit = ""

        fig_f = px.histogram(
            x=vals.clip(vals.quantile(0.01), vals.quantile(0.99)),
            nbins=60,
            color_discrete_sequence=[color],
            title=f"{label}{unit}",
            labels={"x": label+unit, "count": "Frekuensi"},
        )
        fig_f.update_traces(marker_line_color="white", marker_line_width=0.3)
        fig_f.add_vline(x=0, line_color=C_DANGER, line_width=1.5, line_dash="dash")
        med_v = vals.clip(vals.quantile(0.01), vals.quantile(0.99)).median()
        fig_f.add_vline(x=med_v, line_color=C_OK, line_width=1.5, line_dash="dot",
                        annotation_text=f"Median: {med_v:.2f}",
                        annotation_font_size=10, annotation_font_color=C_OK)
        fig_f.update_layout(
            yaxis=dict(rangemode="tozero"),
            annotations=[dict(x=0.5, y=1.1, xref="paper", yref="paper",
                               text=subtitle, showarrow=False, font=dict(size=11, color="#7f8c8d"))],
        )
        apply_chart_defaults(fig_f, height=280)

        if i % 2 == 0:
            with col_f1:
                st.plotly_chart(fig_f, use_container_width=True)
        else:
            with col_f2:
                st.plotly_chart(fig_f, use_container_width=True)

    st.markdown(
        '<div class="section-header">5.2 Korelasi Antar Fitur Numerik</div>',
        unsafe_allow_html=True
    )

    if len(df) < 10:

        st.warning(
            """
    ⚠️ Heatmap korelasi tidak dapat ditampilkan.

    Data terlalu sedikit untuk menghitung korelasi yang valid.
    """
        )

    else:

        numeric_cols = [
            "pendapatan_bulanan",
            "jumlah_pengeluaran",
            "total_pengeluaran_bulanan",
            "rasio_pengeluaran",
            "sisa_anggaran",
            "flag_overspend"
        ]

        corr_mat = df[numeric_cols].corr()

        labels_corr = {
            "pendapatan_bulanan": "Pendapatan\nBulanan",
            "jumlah_pengeluaran": "Pengeluaran\nper Transaksi",
            "total_pengeluaran_bulanan": "Total\nPengeluaran",
            "rasio_pengeluaran": "Rasio\nPengeluaran",
            "sisa_anggaran": "Sisa\nAnggaran",
            "flag_overspend": "Flag\nOverspend",
        }

        fig_corr = go.Figure(
            go.Heatmap(
                z=corr_mat.values,
                x=[labels_corr.get(c, c) for c in corr_mat.columns],
                y=[labels_corr.get(c, c) for c in corr_mat.index],
                colorscale=[[0, C_DANGER], [0.5, "#f8f9fa"], [1, C_MAIN]],
                zmin=-1,
                zmax=1,
                text=np.round(corr_mat.values, 2),
                texttemplate="%{text}",
                textfont_size=11,
                hovertemplate="%{y} × %{x}<br>r = %{z:.2f}<extra></extra>",
            )
        )

        fig_corr.update_layout(
            title="Heatmap Korelasi Fitur Numerik (Pearson r)",
            xaxis=dict(tickangle=-20),
            height=440,
            coloraxis_colorbar=dict(
                title="r",
                tickvals=[-1, -0.5, 0, 0.5, 1]
            ),
        )

        apply_chart_defaults(fig_corr, height=440)

        st.plotly_chart(
            fig_corr,
            use_container_width=True
        )

    st.markdown('<div class="section-header">5.3 Ringkasan Statistik Deskriptif</div>', unsafe_allow_html=True)

    summary_cols = ["pendapatan_bulanan","jumlah_pengeluaran","total_pengeluaran_bulanan",
                    "rasio_pengeluaran","sisa_anggaran","flag_overspend"]
    summary_df = df[summary_cols].describe().T.round(2)
    summary_df.index = [labels_corr.get(c, c).replace("\n"," ") for c in summary_df.index]
    st.dataframe(
        summary_df.style
            .format("{:,.2f}")
            .background_gradient(subset=["mean","50%"], cmap="Blues")
            .highlight_max(subset=["std"], color="#fdecea"),
        use_container_width=True,
    )

    st.markdown('<div class="section-header">5.4 Distribusi Pengeluaran per Kategori & Status (Heatmap)</div>',
                unsafe_allow_html=True)

    cat_status_med = df.groupby(["Kategori","status_user"])["jumlah_pengeluaran"].median().unstack()
    fig_heat2 = go.Figure(go.Heatmap(
        z=cat_status_med.values,
        x=cat_status_med.columns.tolist(),
        y=cat_status_med.index.tolist(),
        colorscale=[[0,"#eaf4fe"],[0.5,"#185FA5"],[1,"#0a2d5e"]],
        text=np.round(cat_status_med.values/1000, 0),
        texttemplate="%{text:.0f}rb",
        textfont_size=11,
        hovertemplate="Kategori: %{y}<br>Status: %{x}<br>Median: Rp%{z:,.0f}<extra></extra>",
    ))
    fig_heat2.update_layout(
        title="Median Pengeluaran (Rp) per Kategori & Status User",
        coloraxis_colorbar_title="Median (Rp)",
        height=480,
    )
    apply_chart_defaults(fig_heat2, height=480)
    st.plotly_chart(fig_heat2, use_container_width=True)

    st.markdown(
        '<div class="insight-box">📌 Fitur-fitur turunan yang dibuat: '
        '<b>total_pengeluaran_bulanan</b> (agregasi per user/bulan), '
        '<b>rasio_pengeluaran</b> (total belanja ÷ pendapatan), '
        '<b>sisa_anggaran</b> (pendapatan − total belanja), dan '
        '<b>flag_overspend</b> (biner dari status_user). '
        'Fitur-fitur ini siap digunakan untuk model klasifikasi overspending dan segmentasi pengguna.</div>',
        unsafe_allow_html=True,
    )

# ── Footer 
st.markdown("""
<div style="text-align:center;font-size:12px;color:#95a5a6;padding:8px 0">
📊 <b>Smart Personal Finance Tracker Dashboard</b> |
269.743 transaksi | 1.000 pengguna | 55 kota | Juni 2025–Mei 2026<br>
Menyajikan insight perilaku keuangan pengguna melalui analisis pengeluaran, pendapatan, dan risiko overspending
</div>
""", unsafe_allow_html=True)