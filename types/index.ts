// Krowba Type Definitions

export type EscrowMode = "split_risk" | "full_escrow"
export type PaymentType = "deposit" | "full" | "balance"
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded"
export type EscrowStatus = "held" | "released" | "refunded" | "disputed"
export type LinkStatus = "active" | "paid" | "completed" | "cancelled" | "disputed" | "sold"
export type AIVerificationStatus = "pending" | "passed" | "warning" | "failed"
export type DisputeResolution = "buyer_favor" | "seller_favor" | "partial_refund" | "no_resolution"


export interface KrowbaLink {
  id: string
  seller_id: string
  item_id: string | null
  short_code: string
  item_name: string
  item_price: number
  delivery_fee: number
  currency: string
  escrow_mode: EscrowMode
  deposit_amount: number | null
  access_pin: string | null
  images: string[]
  ai_verification_status: AIVerificationStatus
  ai_verification_message: string | null
  status: LinkStatus
  shipping_status: "pending" | "processing" | "shipped" | "delivered" | "returned" | "rejected"
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  krowba_link_id: string
  seller_id: string
  buyer_phone: string
  buyer_name: string | null
  amount: number
  payment_type: PaymentType
  payment_method: string
  payment_reference: string | null
  payhero_reference: string | null
  status: PaymentStatus
  created_at: string
  updated_at: string
}

export interface EscrowHold {
  id: string
  transaction_id: string
  krowba_link_id: string
  seller_id: string
  amount: number
  currency: string
  status: EscrowStatus
  released_at: string | null
  refunded_at: string | null
  created_at: string
  updated_at: string
}

export interface ShippingProof {
  id: string
  transaction_id: string
  krowba_link_id: string
  seller_id: string
  courier_name: string
  courier_contact: string | null
  tracking_number: string | null
  dispatch_images: string[]
  dispatch_video: string | null
  ai_comparison_score: number | null
  ai_comparison_status: "pending" | "matched" | "warning" | "mismatch"
  dispatched_at: string
  created_at: string
}

export interface DeliveryConfirmation {
  id: string
  transaction_id: string
  krowba_link_id: string
  buyer_phone: string
  confirmed: boolean
  confirmation_code: string | null
  confirmed_at: string | null
  auto_confirmed: boolean
  created_at: string
}

export interface Dispute {
  id: string
  transaction_id: string
  krowba_link_id: string
  seller_id: string
  initiated_by: "buyer" | "seller" | "system"
  reason: string
  description: string | null
  evidence_images: string[]
  evidence_video: string | null
  ai_analysis: string | null
  resolution: DisputeResolution | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface AIVerification {
  id: string
  entity_type: "item" | "krowba_link" | "shipping_proof"
  entity_id: string
  verification_type: "image_text_match" | "fake_detection" | "similarity_check" | "duplicate_check"
  image_url: string
  score: number | null
  confidence: number | null
  status: AIVerificationStatus
  message: string | null
  raw_response: Record<string, unknown> | null
  created_at: string
}

// API Response Types
export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PayHeroSTKRequest {
  amount: number
  phone_number: string
  channel_id: string
  external_reference: string
  callback_url: string
}

export interface PayHeroSTKResponse {
  success: boolean
  reference: string
  status: string
}

export interface PayHeroWebhookPayload {
  reference: string
  external_reference: string
  status: "SUCCESS" | "FAILED" | "PENDING"
  amount: number
  phone_number: string
  timestamp: string
}

// AI Service Types
export interface AIAnalysisResult {
  status: "passed" | "warning" | "failed" | "needs_more_evidence"
  score: number
  confidence: number
  message: string
}

export interface CreateLinkFormData {
  item_name: string
  item_price: number
  delivery_fee: number
  escrow_mode: EscrowMode
  deposit_amount?: number
  images: string[]
  description?: string
}

// Mock Payment System Types
export type PaymentMethod = "card" | "mobile"
export type WalletBalanceType = "pending" | "available" | "refunded" | "paid"
export type MockPaymentStatus = "initiated" | "processing" | "completed" | "failed"
export type RefundType = "partial" | "full"
export type MockWebhookStatus = "pending" | "processing" | "needs-attention" | "processed" | "failed"

export interface MockTransaction {
  id: string
  transaction_reference: string
  amount: number
  currency: string
  status: MockPaymentStatus
  payment_method: PaymentMethod
  message: string
  created_at: string
  updated_at: string
}

export interface VirtualWallet {
  pending: number
  available: number
  refunded: number
  paid: number
}

export interface WalletTransaction {
  id: string
  reference: string
  amount: number
  type: WalletBalanceType
  status: string
  payment_method: PaymentMethod
  created_at: string
}

export interface MockPaymentRequest {
  payment_method: PaymentMethod
  amount: number
  krowba_link_id: string
  buyer_phone: string
  buyer_name?: string
  card_number?: string // For card payments
  card_expiry?: string // For card payments
  card_cvv?: string // For card payments
}

export interface MockPaymentResponse {
  success: boolean
  reference: string
  status: MockPaymentStatus
  message: string
  transaction_id?: string
}

export interface RefundRequest {
  transaction_id: string
  type: RefundType
  amount?: number // Required for partial refunds
  reason: string
  initiated_by: "buyer" | "seller" | "system"
}
