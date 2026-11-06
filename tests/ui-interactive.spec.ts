import { test, expect } from "@playwright/test";

test.describe("Interactive UI & Button Click Verification", () => {
  test("Homepage UI: navbar logo, CTA buttons, and mobile menu", async ({ page }) => {
    await page.goto("/");

    // 1. Check title & badge text
    await expect(page).toHaveTitle(/SRC X HK X SAKRARUN/);
    const badge = page.locator(".liquid-glass-pill").first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText("5K FUN RUN 2026");

    // 2. Check Navbar logo presence and link
    const navLogo = page.locator('nav a[aria-label="SRC X HK X SAKRARUN Beranda"] img');
    await expect(navLogo).toBeVisible();
    await expect(navLogo).toHaveAttribute("src", "/logo-event.png");

    // 3. Click "Daftar Sekarang" button in the hero card
    const ctaHero = page.locator('main a[href="/daftar"]:has-text("Daftar Sekarang")');
    await expect(ctaHero).toBeVisible();
    await ctaHero.click();
    await expect(page).toHaveURL(/\/daftar$/);

    // 4. Return to home via navbar logo click
    const logoLink = page.locator('nav a[aria-label="SRC X HK X SAKRARUN Beranda"]');
    await logoLink.click();
    await expect(page).toHaveURL(/localhost:3000\/$/);

    // 5. Test desktop navbar "Daftar Sekarang" button
    const navDaftar = page.locator('nav .hidden.md\\:flex a[href="/daftar"]');
    if (await navDaftar.isVisible()) {
      await navDaftar.click();
      await expect(page).toHaveURL(/\/daftar$/);
    }
  });

  test("Registration Form UI: input fields, validation, and submission", async ({ page }) => {
    await page.goto("/daftar");

    // Dismiss active session banner if it exists
    const dismissBtn = page.locator('button:has-text("Bukan Anda? Isi Data Baru")');
    if (await dismissBtn.isVisible()) {
      await dismissBtn.click();
    }

    // Check header
    await expect(page.locator("h1")).toContainText("Formulir Pendaftaran");

    // Fill form fields
    const suffix = Date.now();
    await page.fill("#full_name", "Siti Nurhaliza");
    await page.fill("#email", `siti.nurhaliza.${suffix}@gmail.com`);
    await page.fill("#phone", "081298765432");
    await page.selectOption("#school_origin", "SMAN 1 SLAWI");

    const submitBtn = page.locator('button[type="submit"]:has-text("Lanjut ke Pembayaran")');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify redirection to payment page
    await expect(page).toHaveURL(/\/pembayaran\/[a-f0-9-]+/, { timeout: 15000 });
  });

  test("Payment Page UI: billing card, copy button, QRIS info, and proof upload", async ({ page, request }) => {
    // Create a unique registration first via API
    const uniqueEmail = `test.runner.${Date.now()}.${Math.floor(Math.random() * 1000)}@gmail.com`;
    const regRes = await request.post("/api/register", {
      data: {
        full_name: "Test Runner UI",
        email: uniqueEmail,
        phone: `0813${Math.floor(10000000 + Math.random() * 90000000)}`,
        school_origin: "SMAN 1 SLAWI",
      },
    });
    const regData = await regRes.json();
    const paymentId = regData.payment_id;

    await page.goto(`/pembayaran/${paymentId}`);

    // Wait until loading finishes and billing card details appear
    await expect(page.locator("text=Total Transfer")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Rincian Tagihan")).toBeVisible();
    await expect(page.locator("text=ID1024687332144")).toBeVisible();

    // Verify copy nominal button
    const copyBtn = page.locator('button[title="Salin nominal transfer"]');
    if (await copyBtn.isVisible()) {
      await copyBtn.click();
      await expect(page.locator('button:has-text("Tersalin!")')).toBeVisible();
    }

    // Verify upload proof inputs
    const senderInput = page.locator("#sender-name-input");
    await expect(senderInput).toBeVisible();
    await senderInput.fill("Test Sender Account");

    const fileInput = page.locator("#proof-upload-input");
    await expect(fileInput).toBeAttached();

    // Upload dummy proof image
    const dummy1x1Png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    await fileInput.setInputFiles({
      name: "bukti.png",
      mimeType: "image/png",
      buffer: dummy1x1Png,
    });

    // Click upload proof button
    const uploadBtn = page.locator('button[type="submit"]:has-text("Kirim Bukti Pembayaran")');
    await expect(uploadBtn).toBeEnabled();
    await uploadBtn.click();

    // Verify upload success feedback appears
    await expect(page.locator("text=Bukti berhasil dikirim")).toBeVisible({ timeout: 15000 });
  });

  test("Admin Dashboard UI: PIN login, participant list view, and filter controls", async ({ page }) => {
    await page.goto("/admin");

    // Login screen visible
    await expect(page.locator("text=Portal Panitia FUN RUN")).toBeVisible();
    const pinInput = page.locator("#admin-pin-input");
    await pinInput.fill("funrun5k2026");

    const loginBtn = page.locator('button[type="submit"]:has-text("Masuk ke Panel Panitia")');
    await loginBtn.click();

    // Verify dashboard table loaded
    await expect(page.locator("text=Verifikasi Pembayaran & Data Peserta")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Download Excel (CSV)")).toBeVisible();

    // Test filter tabs
    const waitingTab = page.locator('button:has-text("Perlu Verifikasi")').first();
    if (await waitingTab.isVisible()) {
      await waitingTab.click();
    }

    const paidTab = page.locator('button:has-text("Lunas")').first();
    if (await paidTab.isVisible()) {
      await paidTab.click();
    }
  });
});
