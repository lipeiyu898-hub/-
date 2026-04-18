export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: Date;
  status: 'pending' | 'confirmed';
  note?: string;
  source?: {
    type: 'screenshot' | 'share' | 'shortcut' | 'manual' | 'voice' | 'system_intent';
    imageUrl?: string;
    rawText?: string;
    parsedAt?: Date;
    intentId?: string;
  };
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}
