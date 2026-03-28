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
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}
