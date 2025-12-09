# Mock Escrow Payment System for Krowba

A comprehensive test payment system that simulates buyer-seller flows without using live payment gateways.

## 🚀 Quick Start

### 1. Database Setup

Run the SQL functions in your Supabase SQL Editor:

```bash
# Open Supabase Dashboard > SQL Editor
# Copy and execute: scripts/mock-wallet-functions.sql
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Access Mock Payments Dashboard

Navigate to:
```
http://localhost:3000/dashboard/mock-payments
```

---

## 💳 Test Cards

### Guaranteed Success
```
Card Number: 4242 4242 4242 4242
Expiry: 12/25
CVV: 123
Result: ✅ Always succeeds
```

### Guaranteed Decline
```
Card Number: 4000 0000 0000 0002
Expiry: 12/25
CVV: 123
Result: ❌ Always declines
```

### Random Outcome
```
Any valid card number (passes Luhn check)
Success Rate: 80%
```

---

## 📱 Mobile Payments

### Phone Format
```
Valid: 0712345678, 0734567890, 254712345678
Success Rate: 85%
Simulation: STK push with 1-3 second delay
```

---

## 🔄 Complete Test Flow

### Buyer Journey
1. **Create Link**: `/dashboard/links/create` → Create product
2. **Visit Buyer Page**: Use generated short code
3. **Select Payment**: Choose Card or Mobile
4. **Enter Details**: Use test cards above
5. **Complete Payment**: Funds locked in escrow (Pending)

### Seller Journey
6. **View Pending**: Check Virtual Wallet → Pending balance updated
7. **Ship Item**: Click "Ship" button on transaction
8. **Buyer Confirms**: Buyer visits confirmation link
9. **Funds Released**: Pending → Available
10. **Request Payout**: Click "Withdraw Funds"
11. **Funds Paid**: Available → Paid Out (with confetti! 🎉)

### Refund Flow
- **Item Rejected**: Buyer clicks "Not As Described" → Funds → Refunded
- **Not Received**: Buyer clicks "Not Received" → Auto refund → Refunded

---

## 🎨 Wallet Balance States

| State | Color | Icon | Meaning |
|-------|-------|------|---------|
| **Pending** | 🟡 Yellow | Wallet | Locked in escrow |
| **Available** | 🟢 Neon Green | Dollar | Ready for payout |
| **Refunded** | 🔴 Red | Refresh | Returned to buyers |
| **Paid** | 🔵 Blue | Trending Up | Withdrawn to seller |

---

## 📡 API Endpoints

### POST `/api/mock/payments`
Process card or mobile payment

**Request:**
```json
{
  "payment_method": "card",
  "amount": 5000,
  "krowba_link_id": "uuid",
  "buyer_phone": "0712345678",
  "card_number": "4242424242424242",
  "card_expiry": "12/25",
  "card_cvv": "123"
}
```

**Response:**
```json
{
  "success": true,
  "reference": "MOCK_CARD_1702137845_A3B5C7",
  "status": "completed",
  "message": "Payment successful!",
  "transaction_id": "uuid"
}
```

### GET `/api/mock/transactions`
List all seller transactions

### GET `/api/mock/wallet`
Get wallet balances (pending, available, refunded, paid)

### POST `/api/mock/payouts`
Simulate payout (available → paid)

**Request:**
```json
{
  "amount": 15000  // Optional: defaults to all available balance
}
```

### POST `/api/mock/refunds`
Process partial or full refund

**Request:**
```json
{
  "transaction_id": "uuid",
  "type": "full",  // or "partial"
  "amount": 1000,  // required for partial
  "reason": "Item not as described",
  "initiated_by": "buyer"
}
```

---

## 🧪 Testing Scenarios

### ✅ Successful Payment Flow
```bash
1. Card: 4242 4242 4242 4242
2. Payment succeeds
3. Transaction created
4. Escrow locked (Pending + 5000)
5. Ship item
6. Buyer confirms
7. Funds released (Available + 5000, Pending - 5000)
8. Request payout
9. Funds paid (Paid + 5000, Available - 5000)
```

### ❌ Failed Payment Flow
```bash
1. Card: 4000 0000 0000 0002
2. Payment fails with error message
3. No transaction created
4. Balances unchanged
```

### 🔄 Refund Flow
```bash
1. Complete payment (Pending + 5000)
2. Ship item
3. Buyer rejects
4. Refund processed (Refunded + 5000, Pending - 5000)
```

---

## 🛠️ Development

### Project Structure
```
lib/services/
  ├── mockPaymentService.ts    # Payment simulation logic
  └── mockWalletService.ts     # Wallet management

app/api/mock/
  ├── payments/route.ts        # Payment processing
  ├── transactions/route.ts    # Transaction list
  ├── wallet/route.ts          # Wallet balances
  ├── payouts/route.ts         # Payout simulation
  └── refunds/route.ts         # Refund processing

components/buyer/
  ├── mock-payment-selector.tsx
  ├── mock-card-payment-form.tsx
  ├── mock-mobile-payment-form.tsx
  └── mock-payment-flow.tsx

components/seller/
  ├── virtual-wallet-card.tsx
  ├── payout-simulator.tsx
  └── mock-transactions-table.tsx

components/shared/
  └── wallet-status-badge.tsx
```

### Success Rates
- **Card Payments**: 80% (configurable in `mockPaymentService.ts`)
- **Mobile Payments**: 85% (configurable in `mockPaymentService.ts`)
- **Processing Delays**: 500ms - 3000ms (randomized)

---

## 🚀 Future Migration to Real Payments

The mock system is designed for easy migration:

### Step 1: Replace Payment Service
```typescript
// Before (Mock)
import { mockPaymentService } from "@/lib/services/mockPaymentService"

// After (Real)
import { paystackService } from "@/lib/services/paystack"
```

### Step 2: Update API Routes
```typescript
// Change endpoint from:
POST /api/mock/payments

// To:
POST /api/payments
```

### Step 3: Database Already Ready
All transaction data is stored in production tables with:
- `payment_method` field ✅
- `payment_reference` field ✅
- Proper escrow tracking ✅

---

## 🎯 Features

✅ Card payment simulation (Visa/Mastercard)
✅ Mobile payment simulation (M-Pesa style)
✅ Virtual wallet with 4 balance types
✅ Payout simulation with confetti
✅ Partial and full refunds
✅ Transaction history with payment methods
✅ Mock webhook status tracking
✅ Light/Dark mode support
✅ Mobile-responsive design
✅ Neon green accent for Krowba branding

---

## 📝 Notes

- **No Real Money**: All transactions are simulated
- **Random Outcomes**: Success/failure determined by probability
- **Persistent Data**: Transactions saved to database
- **Theme Compliant**: Matches Krowba's existing design system
- **Easy Testing**: Test cards and phones provided

---

## 🐛 Troubleshooting

### "Unauthorized" Error
- Make sure you're logged in as a seller
- Check Supabase authentication

### "Database function not found"
- Run `scripts/mock-wallet-functions.sql` in Supabase

### "Balance not updating"
- Refresh the page
- Check browser console for errors
- Verify database functions executed successfully

### "Payment always fails"
- Check you're using valid test cards
- Verify card number passes Luhn algorithm
- Check payment service configuration

---

## 📊 Dashboard Metrics

The mock payments dashboard shows:
- **Virtual Wallet**: Real-time balance across 4 states
- **Transaction History**: All payments with methods and references
- **Payout Simulator**: One-click fund withdrawal
- **Test Mode Info**: Success rates and test cards

---

## 🎨 Theme Colors

| Element | Light Mode | Dark Mode |
|---------|-----------|----------|
| Pending | `bg-yellow-100 text-yellow-600` | `bg-yellow-950/30 text-yellow-400` |
| Available | `bg-green-100 text-green-600` | `bg-green-950/30 text-[#44f91f]` |
| Refunded | `bg-red-100 text-red-600` | `bg-red-950/30 text-red-400` |
| Paid | `bg-blue-100 text-blue-600` | `bg-blue-950/30 text-blue-400` |

---

## 📞 Support

For issues or questions:
1. Check the walkthrough: `walkthrough.md`
2. Review implementation plan: `implementation_plan.md`
3. Inspect browser console for errors
4. Verify database setup

---

**Built with ❤️ for Krowba**
