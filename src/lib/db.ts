import { supabase, isSupabaseConfigured } from "./supabase";
import { Registration, Payment, WaInviteLink } from "./types";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

interface StoreData {
  registrations: Record<string, Registration>;
  payments: Record<string, Payment>;
  waLinks: Record<string, WaInviteLink>;
}

const dataDir = path.join(process.cwd(), ".data");
const dataFile = path.join(dataDir, "store.json");
const participantsDir = path.join(dataDir, "participants");
const proofsDir = path.join(dataDir, "proofs");

function getStore(): StoreData {
  const globalObj = globalThis as unknown as {
    __funrun_store__?: StoreData;
  };

  if (globalObj.__funrun_store__) {
    return globalObj.__funrun_store__;
  }

  const initial: StoreData = {
    registrations: {},
    payments: {},
    waLinks: {},
  };

  try {
    if (fs.existsSync(dataFile)) {
      const content = fs.readFileSync(dataFile, "utf-8");
      if (content && content.trim().length > 0) {
        try {
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === "object" && parsed.registrations && parsed.payments) {
            globalObj.__funrun_store__ = parsed;
            return parsed;
          }
        } catch {
          // If the file is temporarily empty or being written, do not crash
        }
      }
    }
  } catch (err) {
    console.error("Gagal membaca file .data/store.json:", err);
  }

  globalObj.__funrun_store__ = initial;
  return initial;
}

function persistStore(store: StoreData) {
  const globalObj = globalThis as unknown as {
    __funrun_store__?: StoreData;
  };
  globalObj.__funrun_store__ = store;

  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const tempFile = path.join(dataDir, `store.json.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`);
    fs.writeFileSync(tempFile, JSON.stringify(store, null, 2), "utf-8");
    try {
      fs.renameSync(tempFile, dataFile);
    } catch {
      fs.writeFileSync(dataFile, JSON.stringify(store, null, 2), "utf-8");
      if (fs.existsSync(tempFile)) {
        try { fs.unlinkSync(tempFile); } catch {}
      }
    }
  } catch (err) {
    console.error("Gagal menyimpan file .data/store.json:", err);
  }
}

export function saveParticipantIndividualFile(data: {
  registration: Registration;
  payment: Payment;
  waToken?: string | null;
}): string | null {
  // Di cloud (Vercel serverless), filesystem lokal read-only, arsip disimpan di Supabase
  if (isSupabaseConfigured) {
    return null;
  }

  try {
    if (!fs.existsSync(participantsDir)) {
      fs.mkdirSync(participantsDir, { recursive: true });
    }

    const cleanName = data.registration.full_name
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");
    const cleanSchool = (data.registration.school_origin || "UMUM")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");

    const fileName = `${cleanName}_${cleanSchool}.json`;
    const filePath = path.join(participantsDir, fileName);

    const content = {
      nama_peserta: data.registration.full_name,
      asal_sekolah: data.registration.school_origin,
      email: data.registration.email,
      no_whatsapp: data.registration.phone,
      event: "SRC X HK X SAKRARUN",
      kode_pembayaran: data.payment.payment_code,
      nominal: data.payment.amount,
      status_pembayaran: data.payment.status === "paid" ? "LUNAS" : data.payment.status,
      waktu_pembayaran: data.payment.paid_at || new Date().toISOString(),
      metode_pembayaran: data.payment.method,
      wa_token: data.waToken || null,
      arsip_dibuat_pada: new Date().toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf-8");
    return fileName;
  } catch (err) {
    console.error("Gagal menyimpan file arsip peserta:", err);
    return null;
  }
}

export async function findActivePaymentByEmailOrPhone(
  email: string,
  phone: string
): Promise<{
  active: boolean;
  status: "pending" | "waiting_verification" | "paid" | "rejected" | "expired";
  paymentId: string;
  payment: Payment;
  registration: Registration;
} | null> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.trim().replace(/[\s-]/g, "");
  const now = new Date();

  if (isSupabaseConfigured) {
    const { data: reg, error: regErr } = await supabase
      .from("registrations")
      .select("*")
      .or(`email.eq.${cleanEmail},phone.eq.${cleanPhone}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (regErr || !reg) return null;

    const { data: payment, error: payErr } = await supabase
      .from("payments")
      .select("*")
      .eq("registration_id", reg.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (payErr || !payment) return null;

    if (payment.status === "paid") {
      return {
        active: false,
        status: "paid",
        paymentId: payment.id,
        payment: payment as Payment,
        registration: reg as Registration,
      };
    }

    const isExpired = new Date(payment.expires_at) < now;
    if (isExpired) {
      return {
        active: false,
        status: "expired",
        paymentId: payment.id,
        payment: payment as Payment,
        registration: reg as Registration,
      };
    }

    return {
      active: true,
      status: payment.status as any,
      paymentId: payment.id,
      payment: payment as Payment,
      registration: reg as Registration,
    };
  }

  const store = getStore();
  const regList = Object.values(store.registrations).filter(
    (r) =>
      (r?.email && r.email.trim().toLowerCase() === cleanEmail) ||
      (r?.phone && r.phone.trim().replace(/[\s-]/g, "") === cleanPhone)
  );

  if (regList.length === 0) return null;

  // Urutkan dari yang terbaru
  regList.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const latestReg = regList[0];

  const payList = Object.values(store.payments).filter(
    (p) => p.registration_id === latestReg.id
  );

  if (payList.length === 0) return null;

  payList.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const latestPay = payList[0];

  if (latestPay.status === "paid") {
    return {
      active: false,
      status: "paid",
      paymentId: latestPay.id,
      payment: latestPay,
      registration: latestReg,
    };
  }

  const isExpired = new Date(latestPay.expires_at) < now;
  if (isExpired) {
    return {
      active: false,
      status: "expired",
      paymentId: latestPay.id,
      payment: latestPay,
      registration: latestReg,
    };
  }

  return {
    active: true,
    status: latestPay.status,
    paymentId: latestPay.id,
    payment: latestPay,
    registration: latestReg,
  };
}

export async function createRegistration(data: Omit<Registration, "id" | "created_at">): Promise<Registration> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    const { data: inserted, error } = await supabase
      .from("registrations")
      .insert({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        school_origin: data.school_origin,
        category: data.category || "Fun Run",
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return inserted as Registration;
  }

  const store = getStore();
  const id = randomUUID();
  const reg: Registration = {
    id,
    ...data,
    created_at: now,
  };
  store.registrations[id] = reg;
  persistStore(store);
  return reg;
}

export async function createPayment(
  registrationId: string,
  amount: number,
  paymentCode: string,
  uniqueCode?: number
): Promise<Payment> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  if (isSupabaseConfigured) {
    const { data: inserted, error } = await supabase
      .from("payments")
      .insert({
        registration_id: registrationId,
        amount,
        unique_code: uniqueCode,
        method: "QRIS",
        status: "pending",
        expires_at: expiresAt,
        payment_code: paymentCode,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return inserted as Payment;
  }

  const store = getStore();
  const id = randomUUID();
  const payment: Payment = {
    id,
    registration_id: registrationId,
    amount,
    unique_code: uniqueCode,
    method: "QRIS",
    status: "pending",
    expires_at: expiresAt,
    paid_at: null,
    payment_code: paymentCode,
    created_at: now.toISOString(),
  };
  store.payments[id] = payment;
  persistStore(store);
  return payment;
}

export async function submitPaymentProof(
  paymentId: string,
  data: {
    proofImage: string;
    senderName?: string;
  }
): Promise<Payment> {
  if (isSupabaseConfigured) {
    const { data: updated, error } = await supabase
      .from("payments")
      .update({
        proof_image: data.proofImage,
        sender_name: data.senderName || null,
        status: "waiting_verification",
        rejection_reason: null,
      })
      .eq("id", paymentId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return updated as Payment;
  }

  const store = getStore();
  const payment = store.payments[paymentId];
  if (!payment) throw new Error("Pembayaran tidak ditemukan");

  payment.proof_image = data.proofImage;
  payment.sender_name = data.senderName || null;
  payment.status = "waiting_verification";
  payment.rejection_reason = null;
  persistStore(store);

  return payment;
}

async function insertWaInviteLink(registrationId: string, token: string, url: string) {
  // Try target_url first, then fallback to wa_group_url for schema compatibility.
  const { error: err1 } = await supabase.from("wa_invite_links").insert({
    registration_id: registrationId,
    token,
    target_url: url,
    used: false,
  });

  if (err1) {
    const { error: err2 } = await supabase.from("wa_invite_links").insert({
      registration_id: registrationId,
      token,
      wa_group_url: url,
      used: false,
    });
    if (err2) {
      console.error("Failed to insert wa_invite_link:", err1.message, err2.message);
      throw new Error(`Gagal menyimpan link WhatsApp: ${err2.message}`);
    }
  }
}

export async function verifyPaymentByAdmin(
  paymentId: string,
  action: "approve" | "reject",
  options?: {
    reason?: string;
    waGroupUrl?: string;
  }
): Promise<{ success: boolean; token?: string; status: string; registration?: Registration; payment?: Payment }> {
  const now = new Date();
  const waGroupUrl =
    options?.waGroupUrl ||
    process.env.WA_GROUP_INVITE_URL ||
    "https://chat.whatsapp.com/SrcHkFunRun2026Official";

  if (isSupabaseConfigured) {
    const { data: payment, error: fetchErr } = await supabase
      .from("payments")
      .select("*, registration:registrations(*)")
      .eq("id", paymentId)
      .single();

    if (fetchErr || !payment) throw new Error("Pembayaran tidak ditemukan");

    if (action === "approve") {
      const { error: updateErr } = await supabase
        .from("payments")
        .update({
          status: "paid",
          paid_at: now.toISOString(),
          rejection_reason: null,
        })
        .eq("id", paymentId);

      if (updateErr) throw new Error(updateErr.message);

      const { data: existingLink } = await supabase
        .from("wa_invite_links")
        .select("token")
        .eq("registration_id", payment.registration_id)
        .single();

      let token = existingLink?.token;
      if (!token) {
        token = randomUUID();
        await insertWaInviteLink(payment.registration_id, token, waGroupUrl);
      }

      saveParticipantIndividualFile({
        registration: payment.registration,
        payment: {
          ...payment,
          status: "paid",
          paid_at: now.toISOString(),
        },
        waToken: token,
      });

      return {
        success: true,
        token,
        status: "paid",
        registration: payment.registration,
        payment: { ...payment, status: "paid", paid_at: now.toISOString() },
      };
    } else {
      const { error: updateErr } = await supabase
        .from("payments")
        .update({
          status: "rejected",
          rejection_reason:
            options?.reason || "Bukti transfer tidak sesuai atau belum tercatat pada mutasi rekening panitia.",
        })
        .eq("id", paymentId);

      if (updateErr) throw new Error(updateErr.message);
      return { success: true, status: "rejected" };
    }
  }

  const store = getStore();
  const payment = store.payments[paymentId];
  if (!payment) throw new Error("Pembayaran tidak ditemukan");

  const registration = store.registrations[payment.registration_id];

  if (action === "approve") {
    payment.status = "paid";
    payment.paid_at = now.toISOString();
    payment.rejection_reason = null;

    let token: string | null = null;
    for (const link of Object.values(store.waLinks)) {
      if (link.registration_id === payment.registration_id) {
        token = link.token;
        break;
      }
    }

    if (!token) {
      token = randomUUID();
      const linkId = randomUUID();
      const waLink: WaInviteLink = {
        id: linkId,
        registration_id: payment.registration_id,
        token,
        wa_group_url: waGroupUrl,
        used: false,
        used_at: null,
        created_at: now.toISOString(),
      };
      store.waLinks[token] = waLink;
    }

    persistStore(store);

    if (registration) {
      saveParticipantIndividualFile({
        registration,
        payment,
        waToken: token,
      });
    }

    return {
      success: true,
      token,
      status: "paid",
      registration,
      payment,
    };
  } else {
    payment.status = "rejected";
    payment.rejection_reason =
      options?.reason || "Bukti transfer tidak sesuai atau belum tercatat pada mutasi rekening panitia.";
    persistStore(store);
    return { success: true, status: "rejected" };
  }
}

export async function getPayment(id: string): Promise<(Payment & { registration: Registration }) | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("payments")
      .select("*, registration:registrations(*)")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as Payment & { registration: Registration };
  }

  const store = getStore();
  const payment = store.payments[id];
  if (!payment) return null;
  const registration = store.registrations[payment.registration_id];
  if (!registration) return null;

  return {
    ...payment,
    registration,
  };
}

export async function confirmPayment(
  paymentId: string,
  method: "QRIS" | "Dana" | "GoPay",
  waGroupUrl: string
): Promise<{ success: boolean; token: string }> {
  const now = new Date();

  if (isSupabaseConfigured) {
    const { data: payment, error: fetchErr } = await supabase
      .from("payments")
      .select("*, registration:registrations(*)")
      .eq("id", paymentId)
      .single();

    if (fetchErr || !payment) throw new Error("Pembayaran tidak ditemukan");
    if (payment.status === "paid") {
      const { data: link } = await supabase
        .from("wa_invite_links")
        .select("token")
        .eq("registration_id", payment.registration_id)
        .single();
      return { success: true, token: link?.token || "" };
    }

    if (new Date(payment.expires_at) < now) {
      await supabase.from("payments").update({ status: "expired" }).eq("id", paymentId);
      throw new Error("Waktu pembayaran telah kadaluarsa");
    }

    const { error: updateErr } = await supabase
      .from("payments")
      .update({
        status: "paid",
        method,
        paid_at: now.toISOString(),
      })
      .eq("id", paymentId);

    if (updateErr) throw new Error(updateErr.message);

    const token = randomUUID();
    await insertWaInviteLink(payment.registration_id, token, waGroupUrl);

    saveParticipantIndividualFile({
      registration: payment.registration,
      payment: {
        ...payment,
        status: "paid",
        method,
        paid_at: now.toISOString(),
      },
      waToken: token,
    });

    return { success: true, token };
  }

  const store = getStore();
  const payment = store.payments[paymentId];
  if (!payment) throw new Error("Pembayaran tidak ditemukan");

  if (payment.status === "paid") {
    for (const link of Object.values(store.waLinks)) {
      if (link.registration_id === payment.registration_id) {
        return { success: true, token: link.token };
      }
    }
  }

  if (new Date(payment.expires_at) < now) {
    payment.status = "expired";
    persistStore(store);
    throw new Error("Waktu pembayaran telah kadaluarsa");
  }

  payment.status = "paid";
  payment.method = method;
  payment.paid_at = now.toISOString();

  const token = randomUUID();
  const linkId = randomUUID();
  const waLink: WaInviteLink = {
    id: linkId,
    registration_id: payment.registration_id,
    token,
    wa_group_url: waGroupUrl,
    used: false,
    used_at: null,
    created_at: now.toISOString(),
  };
  store.waLinks[token] = waLink;
  persistStore(store);

  const registration = store.registrations[payment.registration_id];
  if (registration) {
    saveParticipantIndividualFile({
      registration,
      payment,
      waToken: token,
    });
  }

  return { success: true, token };
}

export async function getConfirmation(paymentId: string) {
  if (isSupabaseConfigured) {
    const { data: payment, error } = await supabase
      .from("payments")
      .select("*, registration:registrations(*)")
      .eq("id", paymentId)
      .eq("status", "paid")
      .single();

    if (error || !payment) return null;

    const { data: link } = await supabase
      .from("wa_invite_links")
      .select("token")
      .eq("registration_id", payment.registration_id)
      .single();

    return {
      registration: payment.registration as Registration,
      payment: {
        amount: payment.amount,
        method: payment.method,
        payment_code: payment.payment_code,
        paid_at: payment.paid_at,
      },
      wa_token: link?.token || null,
    };
  }

  const store = getStore();
  const payment = store.payments[paymentId];
  if (!payment || payment.status !== "paid") return null;

  const registration = store.registrations[payment.registration_id];
  if (!registration) return null;

  let token: string | null = null;
  for (const l of Object.values(store.waLinks)) {
    if (l.registration_id === payment.registration_id) {
      token = l.token;
      break;
    }
  }

  return {
    registration,
    payment: {
      amount: payment.amount,
      method: payment.method,
      payment_code: payment.payment_code,
      paid_at: payment.paid_at,
    },
    wa_token: token,
  };
}

export async function getWaLinkByToken(token: string) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("wa_invite_links")
      .select("*, registration:registrations(full_name)")
      .eq("token", token)
      .single();

    if (error || !data) return null;
    const row = data as any;
    return {
      ...row,
      wa_group_url: row.target_url || row.wa_group_url,
    } as WaInviteLink & { registration?: { full_name: string } };
  }

  const store = getStore();
  const link = store.waLinks[token];
  if (!link) return null;
  const registration = store.registrations[link.registration_id];
  return {
    ...link,
    registration: registration ? { full_name: registration.full_name } : undefined,
  };
}

export async function markWaLinkUsed(token: string) {
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from("wa_invite_links")
      .update({ used: true, used_at: now })
      .eq("token", token);

    if (error) throw new Error(error.message);
    return;
  }

  const store = getStore();
  const link = store.waLinks[token];
  if (link) {
    link.used = true;
    link.used_at = now;
    persistStore(store);
  }
}

export async function deleteRegistrationAndPayment(paymentId: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    const { data: payment } = await supabase
      .from("payments")
      .select("registration_id, proof_image")
      .eq("id", paymentId)
      .single();

    if (!payment) return false;

    // Hapus wa_invite_links jika ada
    await supabase.from("wa_invite_links").delete().eq("registration_id", payment.registration_id);

    // Hapus file gambar di storage jika tersimpan di Supabase
    if (payment.proof_image && payment.proof_image.includes("/payment-proofs/")) {
      const fileName = payment.proof_image.split("/payment-proofs/")[1];
      if (fileName) {
        await supabase.storage.from("payment-proofs").remove([fileName]);
      }
    }

    // Hapus payment
    await supabase.from("payments").delete().eq("id", paymentId);

    // Hapus registration
    await supabase.from("registrations").delete().eq("id", payment.registration_id);

    return true;
  }

  // Fallback lokal
  const store = getStore();
  const payment = store.payments[paymentId];
  if (!payment) return false;

  const regId = payment.registration_id;
  delete store.payments[paymentId];
  delete store.registrations[regId];

  for (const [token, link] of Object.entries(store.waLinks)) {
    if (link.registration_id === regId) {
      delete store.waLinks[token];
    }
  }

  persistStore(store);
  return true;
}

export async function getAllRegistrationsWithPayments(): Promise<
  Array<Payment & { registration: Registration; wa_token: string | null }>
> {
  if (isSupabaseConfigured) {
    const { data: payments, error } = await supabase
      .from("payments")
      .select("*, registration:registrations(*)")
      .order("created_at", { ascending: false });

    if (error || !payments) return [];

    const { data: waLinks } = await supabase.from("wa_invite_links").select("*");
    const linkMap = new Map((waLinks || []).map((l: any) => [l.registration_id, l.token]));

    return payments.map((p: any) => ({
      ...p,
      registration: p.registration as Registration,
      wa_token: linkMap.get(p.registration_id) || null,
    }));
  }

  const store = getStore();
  const list = Object.values(store.payments).map((payment) => {
    const registration = store.registrations[payment.registration_id];
    let waToken: string | null = null;
    for (const link of Object.values(store.waLinks)) {
      if (link.registration_id === payment.registration_id) {
        waToken = link.token;
        break;
      }
    }
    return {
      ...payment,
      registration: registration
        ? {
            ...registration,
            school_origin: registration.school_origin || "SMAN 1 SLAWI",
          }
        : {
            id: payment.registration_id,
            full_name: "Tidak Diketahui",
            email: "-",
            phone: "-",
            school_origin: "SMAN 1 SLAWI",
            created_at: payment.created_at,
          },
      wa_token: waToken,
    };
  });

  return list.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
