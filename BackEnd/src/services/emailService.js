const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Currency formatter ───────────────────────────────────────────────────────
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

// ─── Base HTML wrapper ────────────────────────────────────────────────────────
function wrapHtml(title, bodyContent) {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f6f8; margin: 0; padding: 24px; color: #1a1a2e; }
    .card { background: #ffffff; border-radius: 10px; max-width: 560px; margin: 0 auto; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { font-size: 22px; font-weight: bold; color: #2d6a4f; margin-bottom: 4px; }
    .subheader { font-size: 13px; color: #6b7280; margin-bottom: 24px; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .info-row:last-of-type { border-bottom: none; }
    .label { color: #6b7280; }
    .value { font-weight: 600; color: #1a1a2e; }
    .value.danger { color: #dc2626; }
    .value.warning { color: #d97706; }
    .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 14px; color: #dc2626; }
    .reminder-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 14px; color: #92400e; }
    .footer { margin-top: 28px; font-size: 12px; color: #9ca3af; text-align: center; }
    .btn { display: inline-block; margin-top: 20px; background: #2d6a4f; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    ${bodyContent}
    <div class="footer">
      Email ini dikirim otomatis oleh <strong>Finance Tracker</strong>. Harap tidak membalas email ini.
    </div>
  </div>
</body>
</html>`;
}

// ─── sendEmail ────────────────────────────────────────────────────────────────
async function sendEmail(to, subject, htmlBody) {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Finance Tracker <onboarding@resend.dev>',
    to,
    subject,
    html: htmlBody,
  });

  if (error) {
    throw new Error(`[emailService] Failed to send email: ${error.message}`);
  }

  console.log(`[emailService] Sent "${subject}" → ${to} (id: ${data.id})`);
  return data;
}

// ─── sendOverbudgetEmail ──────────────────────────────────────────────────────
async function sendOverbudgetEmail(userEmail, userName, category, used, limit, month) {
  const subject = `[Finance Tracker] Peringatan: Anggaran ${category} Terlampaui`;
  const percentageUsed = limit > 0 ? Math.round((used / limit) * 100) : 0;
  const overAmount = used - limit;

  const body = wrapHtml(subject, `
    <div class="header">⚠️ Anggaran Terlampaui</div>
    <div class="subheader">Pemberitahuan otomatis untuk bulan ${month}</div>
    <p style="font-size:15px;">Halo <strong>${userName}</strong>,</p>
    <p style="font-size:14px; color:#374151;">
      Pengeluaran kamu untuk kategori <strong>${category}</strong> pada bulan
      <strong>${month}</strong> telah <strong style="color:#dc2626;">melampaui anggaran</strong> yang telah ditetapkan.
    </p>
    <div class="alert-box">
      🚨 Kamu sudah menggunakan <strong>${percentageUsed}%</strong> dari anggaran ${category} dan melebihi batas sebesar <strong>${formatRupiah(overAmount)}</strong>.
    </div>
    <div class="info-row"><span class="label">Kategori</span><span class="value">${category}</span></div>
    <div class="info-row"><span class="label">Batas Anggaran</span><span class="value">${formatRupiah(limit)}</span></div>
    <div class="info-row"><span class="label">Total Terpakai</span><span class="value danger">${formatRupiah(used)}</span></div>
    <div class="info-row"><span class="label">Kelebihan</span><span class="value danger">+ ${formatRupiah(overAmount)}</span></div>
    <div class="info-row"><span class="label">Persentase Penggunaan</span><span class="value danger">${percentageUsed}%</span></div>
    <div class="info-row"><span class="label">Bulan</span><span class="value">${month}</span></div>
    <p style="font-size:13px; color:#6b7280; margin-top:20px;">
      Pertimbangkan untuk meninjau kembali pengeluaran kamu agar tetap sesuai dengan rencana keuangan.
    </p>
  `);

  return sendEmail(userEmail, subject, body);
}

// ─── sendRecurringReminderEmail ───────────────────────────────────────────────
async function sendRecurringReminderEmail(userEmail, userName, recurringName, amount, dueDate) {
  const subject = `[Finance Tracker] Pengingat: ${recurringName} jatuh tempo ${dueDate}`;

  const body = wrapHtml(subject, `
    <div class="header">🔔 Pengingat Tagihan Rutin</div>
    <div class="subheader">Tagihan kamu akan segera jatuh tempo</div>
    <p style="font-size:15px;">Halo <strong>${userName}</strong>,</p>
    <p style="font-size:14px; color:#374151;">
      Ini adalah pengingat bahwa tagihan rutin kamu <strong>${recurringName}</strong>
      akan <strong>jatuh tempo pada ${dueDate}</strong>. Pastikan saldo kamu mencukupi.
    </p>
    <div class="reminder-box">
      📅 Siapkan pembayaran sebesar <strong>${formatRupiah(amount)}</strong> sebelum tanggal jatuh tempo.
    </div>
    <div class="info-row"><span class="label">Nama Tagihan</span><span class="value">${recurringName}</span></div>
    <div class="info-row"><span class="label">Jumlah</span><span class="value warning">${formatRupiah(amount)}</span></div>
    <div class="info-row"><span class="label">Tanggal Jatuh Tempo</span><span class="value">${dueDate}</span></div>
    <p style="font-size:13px; color:#6b7280; margin-top:20px;">
      Kamu menerima email ini karena tagihan ini terdaftar sebagai pengeluaran rutin di Finance Tracker.
    </p>
  `);

  return sendEmail(userEmail, subject, body);
}

module.exports = {
  sendEmail,
  sendOverbudgetEmail,
  sendRecurringReminderEmail,
};