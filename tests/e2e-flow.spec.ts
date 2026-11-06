import { test, expect } from "@playwright/test";

test.describe("SRC X HK X SAKRARUN Registration Flow", () => {
  let createdPaymentId = "";
  let paymentAmount = 0;
  let uniqueCode = 0;
  let waToken = "";

  const uniqueSuffix = Date.now();
  const testEmail = `budi.pratama.${uniqueSuffix}@gmail.com`;
  const testPhone = `0812${Math.floor(10000000 + Math.random() * 90000000)}`;

  test("complete end-to-end registration, 3-digit unique code, proof upload, admin verification, and WA token", async ({ request }) => {
    // 1. Submit Registration Form with valid @gmail.com and active Indonesian WhatsApp number
    const registerResponse = await request.post("/api/register", {
      data: {
        full_name: "Budi Pratama",
        email: testEmail,
        phone: testPhone,
        school_origin: "SMAN 1 SLAWI",
      },
    });

    expect(registerResponse.status()).toBe(200);
    const registerData = await registerResponse.json();
    expect(registerData).toHaveProperty("payment_id");
    createdPaymentId = registerData.payment_id;

    // 2. Fetch Payment Details and Verify 3-Digit Random Unique Code (Rp 10.100 - Rp 10.999)
    const paymentResponse = await request.get(`/api/payment/${createdPaymentId}`);
    expect(paymentResponse.status()).toBe(200);
    const paymentData = await paymentResponse.json();
    expect(paymentData.status).toBe("pending");
    expect(paymentData.registration.full_name).toBe("Budi Pratama");
    expect(paymentData.registration.school_origin).toBe("SMAN 1 SLAWI");
    expect(paymentData.payment_code).toMatch(/^SRCXHK-/);

    // Verify unique code is 3 digits (100 - 999)
    expect(paymentData.unique_code).toBeGreaterThanOrEqual(100);
    expect(paymentData.unique_code).toBeLessThanOrEqual(999);
    uniqueCode = paymentData.unique_code;

    // Total amount = 10000 + uniqueCode
    expect(paymentData.amount).toBe(10000 + uniqueCode);
    paymentAmount = paymentData.amount;

    const expiryTime = new Date(paymentData.expires_at).getTime();
    const currentTime = Date.now();
    const hoursRemaining = (expiryTime - currentTime) / (1000 * 60 * 60);
    expect(hoursRemaining).toBeGreaterThan(23);
    expect(hoursRemaining).toBeLessThanOrEqual(24.1);

    // 3. Participant Uploads Payment Proof (Screenshot)
    const dummyImageBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    const uploadResponse = await request.post("/api/payment/upload-proof", {
      multipart: {
        file: {
          name: "bukti_transfer_budi.png",
          mimeType: "image/png",
          buffer: dummyImageBuffer,
        },
        payment_id: createdPaymentId,
        sender_name: "Budi Pratama (DANA)",
      },
    });

    expect(uploadResponse.status()).toBe(200);
    const uploadData = await uploadResponse.json();
    expect(uploadData.success).toBe(true);
    expect(uploadData.proof_url).toContain("/api/proof/");

    // 4. Verify Payment Status Transitions to "waiting_verification"
    const afterUploadResponse = await request.get(`/api/payment/${createdPaymentId}`);
    expect(afterUploadResponse.status()).toBe(200);
    const afterUploadData = await afterUploadResponse.json();
    expect(afterUploadData.status).toBe("waiting_verification");
    expect(afterUploadData.sender_name).toBe("Budi Pratama (DANA)");
    expect(afterUploadData.proof_image).toContain("/api/proof/");

    // 5. Test Admin Verification Flow (Approve / Tandai Lunas)
    const adminVerifyResponse = await request.post("/api/admin/verify-payment", {
      headers: {
        authorization: "Bearer authenticated_sakrarun_2026",
      },
      data: {
        payment_id: createdPaymentId,
        action: "approve",
      },
    });

    expect(adminVerifyResponse.status()).toBe(200);
    const adminVerifyData = await adminVerifyResponse.json();
    expect(adminVerifyData.success).toBe(true);
    expect(adminVerifyData.status).toBe("paid");

    // 6. Verify Payment is Now "paid"
    const paidPaymentRes = await request.get(`/api/payment/${createdPaymentId}`);
    expect(paidPaymentRes.status()).toBe(200);
    const paidPaymentData = await paidPaymentRes.json();
    expect(paidPaymentData.status).toBe("paid");

    // 7. Fetch Official Receipt
    const receiptResponse = await request.get(`/api/confirmation/${createdPaymentId}`);
    expect(receiptResponse.status()).toBe(200);
    const receiptData = await receiptResponse.json();
    expect(receiptData.registration.full_name).toBe("Budi Pratama");
    expect(receiptData.registration.school_origin).toBe("SMAN 1 SLAWI");
    expect(receiptData.payment.amount).toBe(paymentAmount);
    expect(receiptData.wa_token).toBeTruthy();
    waToken = receiptData.wa_token;

    // 8. Inspect WhatsApp One-Time Token (Preview Crawler Safe Check)
    const waCheckResponse = await request.get(`/api/wa/redeem?token=${waToken}`);
    expect(waCheckResponse.status()).toBe(200);
    const waCheckData = await waCheckResponse.json();
    expect(waCheckData.valid).toBe(true);
    expect(waCheckData.used).toBe(false);
    expect(waCheckData.participant_name).toBe("Budi Pratama");

    // 9. Redeem WhatsApp Token (User Clicks "Gabung Sekarang")
    const redeemResponse = await request.post("/api/wa/redeem", {
      data: { token: waToken },
    });
    expect(redeemResponse.status()).toBe(200);
    const redeemData = await redeemResponse.json();
    expect(redeemData.success).toBe(true);
    expect(redeemData.redirect_url).toContain("chat.whatsapp.com");

    // 10. Verify Second Use Attempt is Blocked (One-Time Protection)
    const secondRedeemResponse = await request.post("/api/wa/redeem", {
      data: { token: waToken },
    });
    expect(secondRedeemResponse.status()).toBe(410);
    const secondRedeemData = await secondRedeemResponse.json();
    expect(secondRedeemData.used).toBe(true);
    expect(secondRedeemData.message).toContain("sudah pernah digunakan");
  });

  test("resumes active payment session if user tries to register again before payment expires", async ({ request }) => {
    const resumeEmail = `dimas.anggara.${Date.now()}@gmail.com`;
    const resumePhone = `0856${Math.floor(10000000 + Math.random() * 90000000)}`;

    // 1. Initial registration
    const initialRes = await request.post("/api/register", {
      data: {
        full_name: "Dimas Anggara",
        email: resumeEmail,
        phone: resumePhone,
        school_origin: "SMAN 1 SLAWI",
      },
    });
    expect(initialRes.status()).toBe(200);
    const initialData = await initialRes.json();
    const firstPaymentId = initialData.payment_id;
    expect(initialData.resumed).toBe(false);

    // 2. User accidentally returns to registration form hours later and submits again
    const secondRes = await request.post("/api/register", {
      data: {
        full_name: "Dimas Anggara",
        email: resumeEmail,
        phone: resumePhone,
        school_origin: "SMAN 1 SLAWI",
      },
    });
    expect(secondRes.status()).toBe(200);
    const secondData = await secondRes.json();

    // Must return the SAME active payment session without creating a new bill
    expect(secondData.payment_id).toBe(firstPaymentId);
    expect(secondData.resumed).toBe(true);
    expect(secondData.message).toContain("masih aktif");
  });

  test("handles committee rejection and participant re-upload flow", async ({ request }) => {
    const rejectEmail = `siti.rahma.${Date.now()}@gmail.com`;
    const rejectPhone = `0877${Math.floor(10000000 + Math.random() * 90000000)}`;

    // 1. Register new participant
    const regRes = await request.post("/api/register", {
      data: {
        full_name: "Siti Rahma",
        email: rejectEmail,
        phone: rejectPhone,
        school_origin: "SMAN 1 KRAMAT",
      },
    });
    expect(regRes.status()).toBe(200);
    const { payment_id } = await regRes.json();

    // 2. Upload initial proof
    const dummyImageBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    await request.post("/api/payment/upload-proof", {
      multipart: {
        file: {
          name: "bukti_salah.png",
          mimeType: "image/png",
          buffer: dummyImageBuffer,
        },
        payment_id,
        sender_name: "Siti",
      },
    });

    // 3. Admin rejects payment with reason
    const rejectRes = await request.post("/api/admin/verify-payment", {
      headers: {
        authorization: "Bearer authenticated_sakrarun_2026",
      },
      data: {
        payment_id,
        action: "reject",
        reason: "Nominal tidak sesuai kode unik. Mohon transfer tepat hingga 3 digit terakhir.",
      },
    });
    expect(rejectRes.status()).toBe(200);
    const rejectData = await rejectRes.json();
    expect(rejectData.status).toBe("rejected");

    // 4. Verify participant's payment details reflect rejection
    const checkRes = await request.get(`/api/payment/${payment_id}`);
    expect(checkRes.status()).toBe(200);
    const checkData = await checkRes.json();
    expect(checkData.status).toBe("rejected");
    expect(checkData.rejection_reason).toContain("Nominal tidak sesuai");

    // 5. Participant re-uploads correct proof
    const reuploadRes = await request.post("/api/payment/upload-proof", {
      multipart: {
        file: {
          name: "bukti_benar.png",
          mimeType: "image/png",
          buffer: dummyImageBuffer,
        },
        payment_id,
        sender_name: "Siti Rahma",
      },
    });
    expect(reuploadRes.status()).toBe(200);

    // 6. Verify status transitions back to "waiting_verification"
    const afterReupload = await request.get(`/api/payment/${payment_id}`);
    expect(afterReupload.status()).toBe(200);
    const afterData = await afterReupload.json();
    expect(afterData.status).toBe("waiting_verification");
    expect(afterData.rejection_reason).toBeNull();
  });

  test("rejects non-gmail email addresses to prevent fake data", async ({ request }) => {
    const response = await request.post("/api/register", {
      data: {
        full_name: "Budi Pratama",
        email: "budi@yahoo.com",
        phone: "081234567890",
        school_origin: "SMAN 1 SLAWI",
      },
    });
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.message).toContain("@gmail.com");
  });

  test("rejects invalid WhatsApp phone numbers", async ({ request }) => {
    const response = await request.post("/api/register", {
      data: {
        full_name: "Budi Pratama",
        email: "budi.pratama@gmail.com",
        phone: "123456",
        school_origin: "SMAN 1 SLAWI",
      },
    });
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.message).toContain("WhatsApp");
  });

  test("admin authentication, CSV export, and individual participant file download", async ({ request }) => {
    // 1. Invalid login attempt
    const badLogin = await request.post("/api/admin/login", {
      data: { password: "wrongpassword" },
    });
    expect(badLogin.status()).toBe(401);

    // 2. Successful login with correct PIN
    const goodLogin = await request.post("/api/admin/login", {
      data: { password: "funrun5k2026" },
    });
    expect(goodLogin.status()).toBe(200);

    // 3. Fetch participants list with auth header
    const listRes = await request.get("/api/admin/participants", {
      headers: {
        authorization: "Bearer authenticated_sakrarun_2026",
      },
    });
    expect(listRes.status()).toBe(200);
    const listData = await listRes.json();
    expect(Array.isArray(listData.participants)).toBe(true);

    // 4. Download Excel CSV export
    const csvRes = await request.get("/api/admin/export/csv", {
      headers: {
        authorization: "Bearer authenticated_sakrarun_2026",
      },
    });
    expect(csvRes.status()).toBe(200);
    const csvText = await csvRes.text();
    expect(csvText).toContain("Nama Lengkap");
    expect(csvText).toContain("Asal Sekolah");
    expect(csvText).toContain("Budi Pratama");

    // 5. Download individual JSON file named (nama_peserta)_(asal_sekolah).json
    if (createdPaymentId) {
      const singleRes = await request.get(`/api/admin/download/${createdPaymentId}`);
      expect(singleRes.status()).toBe(200);
      const disposition = singleRes.headers()["content-disposition"] || "";
      expect(disposition).toContain("Budi_Pratama_SMAN_1_SLAWI.json");
      const singleJson = await singleRes.json();
      expect(singleJson.nama_peserta).toBe("Budi Pratama");
      expect(singleJson.asal_sekolah).toBe("SMAN 1 SLAWI");
    }
  });
});
