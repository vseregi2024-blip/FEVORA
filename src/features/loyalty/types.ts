export type LoyaltyClientSummary = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  instagram: string;
  telegramId: string | null;
  telegramConnected: boolean;
  registered: boolean;
};

export type LoyaltyProfile = {
  clientId: string;
  bonusBalance: number;
  pendingBonusBalance: number;
  levelName: string;
  levelBonusPercent: number;
  manualLevelPercent: number | null;
  totalSpent: number;
  totalReferrals: number;
  referralCode: string;
  referredByClientId: string | null;
  telegramConnected: boolean;
};

export type LoyaltyBonusTransaction = {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
};

export type LoyaltyBonusHistoryPage = {
  items: LoyaltyBonusTransaction[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export type LoyaltyPaymentService = {
  name: string;
  amount: number;
};

export type LoyaltyPaymentPayload = {
  external_source: "FEVORA";
  external_event_id: string;
  loyalty_client_id: number;
  appointment_id: string;
  amount: number;
  currency: "UAH";
  payment_date: string;
  services: LoyaltyPaymentService[];
  comment: string;
};

export type LoyaltyPaymentResponse = {
  status: "accepted" | "already_processed";
  externalSource: "FEVORA";
  externalEventId: string;
  paymentId: string;
  clientId: string;
  amount: number;
  currency: "UAH";
  bonusAwarded: number;
  bonusBalance: number;
};

export type LoyaltyBonusRedemptionPayload = {
  external_event_id: string;
  client_id: number;
  amount: number;
  currency: "UAH";
  source: "FEVORA";
  reference: { visit_id: string; payment_id: string };
};

export type LoyaltyBonusRedemptionResponse = {
  status: "accepted" | "already_processed";
  redemptionId: string;
  externalEventId: string;
  clientId: string;
  amountRedeemed: number;
  currency: "UAH";
  balanceBefore: number;
  balanceAfter: number;
  bonusTransactionId: string;
};
