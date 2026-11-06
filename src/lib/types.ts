export interface Registration {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  school_origin: string;
  category?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  registration_id: string;
  amount: number;
  unique_code?: number;
  method: "QRIS" | "Dana" | "GoPay";
  status: "pending" | "waiting_verification" | "paid" | "rejected" | "expired";
  expires_at: string;
  paid_at: string | null;
  payment_code: string;
  proof_image?: string | null;
  sender_name?: string | null;
  rejection_reason?: string | null;
  created_at: string;
}

export interface WaInviteLink {
  id: string;
  registration_id: string;
  token: string;
  wa_group_url: string;
  used: boolean;
  used_at: string | null;
  created_at: string;
}
