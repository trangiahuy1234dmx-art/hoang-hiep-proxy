export interface User {
  id: string;
  username: string;
  balance: number;
  createdAt: string;
  isBlocked: boolean;
  role: 'user' | 'admin';
}

export type ProductCategory = 'proxy' | 'migul';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  duration: string;
  price: number;
}

export interface KeyStock {
  id: string;
  productId: string;
  keyString: string;
  isSold: boolean;
  soldToUser?: string;
  soldAt?: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  username: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  code: string; // Dynamic transfer code, e.g. HH12345
  processedAt?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  username: string;
  productId: string;
  productName: string;
  amount: number;
  keyString: string;
  createdAt: string;
  isDeleted?: boolean;
  type?: 'purchase' | 'deposit' | 'admin_adjustment';
  balanceAfter?: number;
}

export interface AdminSettings {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  description: string;
  qrType: 'vietqr' | 'custom';
  vietqrBankId: string; // e.g. MB, ICB, vcb
  customQrUrl?: string; // URL of custom QR code image
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderUsername: string;
  receiverId: string; // 'admin' or user's ID
  message: string;
  createdAt: string;
}

export interface LuckyWheelReward {
  id: string;
  name: string;
  rewardType: 'day' | 'week' | 'month' | 'empty';
  probability: number; // e.g. 60, 30, 10
  keys: string[]; // List of available key strings in stock
}

export interface LuckyWheelSettings {
  pricePerSpin: number;
  isActive: boolean;
  outOfKeysBehavior: 'reroll' | 'refund' | 'empty_no_key'; // Actions when a rolled item has 0 keys
}

export interface LuckyWheelSpinLog {
  id: string;
  userId: string;
  username: string;
  rewardId: string;
  rewardName: string;
  keyString: string;
  createdAt: string;
  status: 'success' | 'refunded' | 'empty_no_key';
}


