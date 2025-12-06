// Application constants

export const ESCROW_MODES = {
  FULL_ESCROW: "full_escrow",
  SPLIT_RISK: "split_risk",
} as const

export const TRANSACTION_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  DISPUTED: "disputed",
  REFUNDED: "refunded",
  COMPLETED: "completed",
} as const

export const ESCROW_STATUS = {
  PENDING: "pending",
  HELD: "held",
  RELEASED: "released",
  REFUNDED: "refunded",
  DISPUTED: "disputed",
} as const

export const AI_VERIFICATION_TYPES = {
  PRODUCT_IMAGE: "product_image",
  FAKE_DETECTION: "fake_detection",
  DUPLICATE_CHECK: "duplicate_check",
  PACKAGING_COMPARISON: "packaging_comparison",
} as const

export const COURIER_OPTIONS = [
  { value: "g4s", label: "G4S Courier" },
  { value: "fargo", label: "Fargo Courier" },
  { value: "wells_fargo", label: "Wells Fargo" },
  { value: "posta", label: "Posta Kenya" },
  { value: "sendy", label: "Sendy" },
  { value: "boda", label: "Boda Rider" },
  { value: "pickup", label: "Self Pickup" },
  { value: "other", label: "Other" },
] as const

export const AUTO_RELEASE_HOURS = 24 // Hours before auto-release if buyer unresponsive

export const MAX_IMAGES_PER_LISTING = 5

export const AI_CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.6,
  LOW: 0.4,
} as const
