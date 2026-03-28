import { Transaction, Category } from './types';

export const CATEGORIES: Category[] = [
  { id: 'food', name: '餐饮', icon: 'Utensils', color: 'bg-surface-container-low' },
  { id: 'shopping', name: '购物', icon: 'ShoppingBag', color: 'bg-surface-container-low' },
  { id: 'transport', name: '交通', icon: 'Car', color: 'bg-surface-container-low' },
  { id: 'medical', name: '医疗', icon: 'HeartPulse', color: 'bg-surface-container-low' },
  { id: 'entertainment', name: '娱乐', icon: 'Gamepad2', color: 'bg-surface-container-low' },
  { id: 'income', name: '工资', icon: 'Wallet', color: 'bg-surface-container-low' },
  { id: 'travel', name: '旅行', icon: 'Plane', color: 'bg-surface-container-low' },
  { id: 'other', name: '其他', icon: 'HelpCircle', color: 'bg-surface-container-low' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    title: '星巴克咖啡',
    amount: 35.00,
    type: 'expense',
    category: 'food',
    date: new Date(),
    status: 'pending',
  },
  {
    id: '2',
    title: '滴滴出行',
    amount: 22.50,
    type: 'expense',
    category: 'transport',
    date: new Date(Date.now() - 86400000),
    status: 'pending',
  },
  {
    id: '3',
    title: '淘宝购物',
    amount: 299.00,
    type: 'expense',
    category: 'shopping',
    date: new Date('2024-05-20'),
    status: 'confirmed',
  },
  {
    id: '4',
    title: '工资收入',
    amount: 12500.00,
    type: 'income',
    category: 'income',
    date: new Date('2024-05-15'),
    status: 'confirmed',
  },
  {
    id: '5',
    title: '房租缴纳',
    amount: 2800.00,
    type: 'expense',
    category: 'other',
    date: new Date('2024-05-10'),
    status: 'confirmed',
  },
];
