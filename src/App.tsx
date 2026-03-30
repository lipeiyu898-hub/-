import React, { useState, useMemo, useRef, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import * as LucideIcons from 'lucide-react';
import { 
  Menu, 
  Bell, 
  Coffee, 
  Car, 
  ShoppingBag, 
  Wallet, 
  Home, 
  Check, 
  Plus, 
  Mic, 
  Image as ImageIcon, 
  LayoutGrid, 
  ReceiptText, 
  BarChart3, 
  User,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  Search,
  TrendingDown,
  Utensils,
  HeartPulse,
  Gamepad2,
  Plane,
  X,
  CheckCircle2,
  ScanLine,
  ArrowUpRight,
  Settings,
  LogOut,
  HelpCircle,
  Share2,
  Sparkles,
  Edit2,
  Trash2,
  Book,
  Gift,
  Dog,
  Dumbbell,
  Briefcase,
  Users,
  LucideIcon,
  Mail,
  Lock,
  Phone,
  Smartphone,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// import { GoogleGenAI, Type } from "@google/genai"; // Removed Gemini
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  AreaChart,
  Area
} from 'recharts';
import { cn } from './lib/utils';
import { MOCK_TRANSACTIONS, CATEGORIES } from './constants';
import { Transaction, TransactionType, Category } from './types';
import JijiLogo from './components/JijiLogo';
import HamsterSuccessOverlay from './components/HamsterSuccessOverlay';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  updateProfile
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// --- Components ---

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background text-on-surface">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="w-20 h-20 bg-tertiary-container text-tertiary rounded-full flex items-center justify-center mx-auto">
              <X size={40} />
            </div>
            <h1 className="text-2xl font-headline font-bold">抱歉，出错了</h1>
            <p className="text-on-surface-variant">应用程序遇到了一个意外错误。请尝试刷新页面。</p>
            <div className="p-4 bg-surface-container-low rounded-xl text-left overflow-auto max-h-40 text-xs font-mono">
              {this.state.error?.toString()}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-primary text-white rounded-full font-bold shadow-lg"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const CategoryIcon = ({ icon, size = 24, className }: { icon: string, size?: number, className?: string }) => {
  const icons: Record<string, any> = {
    Utensils,
    ShoppingBag,
    Car,
    HeartPulse,
    Gamepad2,
    ReceiptText,
    Plane,
    Wallet,
    Home,
    Coffee,
    Mic,
    ImageIcon,
    Book,
    Gift,
    Dog,
    Dumbbell,
    Sparkles,
    Briefcase,
    Users,
  };
  const Icon = icons[icon] || HelpCircle;
  return <Icon size={size} className={className} />;
};

const BottomNav = ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) => {
  const tabs = [
    { id: 'overview', label: '概览', icon: 'https://api.dicebear.com/7.x/big-smile/svg?seed=hamster_overview' },
    { id: 'bills', label: '账单', icon: 'https://api.dicebear.com/7.x/big-smile/svg?seed=hamster_bills' },
    { id: 'analysis', label: '分析', icon: 'https://api.dicebear.com/7.x/big-smile/svg?seed=hamster_analysis' },
    { id: 'profile', label: '我的', icon: 'https://api.dicebear.com/7.x/big-smile/svg?seed=hamster_profile' },
  ];

  return (
    <nav className="absolute bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-10 pt-4 glass-effect rounded-t-[3rem] shadow-[0_-20px_40px_rgba(45,45,45,0.06)]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center px-5 py-2 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
              isActive ? "bg-secondary/10 text-secondary rounded-full scale-105" : "text-primary/40"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full overflow-hidden transition-all duration-300",
              isActive ? "ring-2 ring-secondary" : "grayscale opacity-60"
            )}>
              <img 
                src={tab.icon} 
                alt={tab.label} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-[11px] font-semibold tracking-wide mt-1">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

// JijiLogo component is now imported from ./components/JijiLogo.tsx

const Header = ({ title, showMenu = true, onMenuClick, userAvatar, onAvatarClick }: { title: string, showMenu?: boolean, onMenuClick?: () => void, userAvatar: string, onAvatarClick: () => void }) => (
  <header className="absolute top-10 w-full flex items-center px-6 h-16 glass-effect z-50">
    <div className="flex items-center gap-3 z-10">
      {showMenu ? (
        <button onClick={onMenuClick} className="p-2 -ml-2 hover:bg-surface-container-highest rounded-full transition-colors active:scale-90">
          <Menu className="text-primary" size={24} />
        </button>
      ) : <div className="w-6" />}
    </div>
    <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center gap-2">
      {title === '叽叽记账' && <JijiLogo size="h-8" />}
      <h1 className={cn(
        "text-xl font-bold tracking-tight transition-all duration-300",
        title === '叽叽记账' ? "font-cute text-primary text-2xl drop-shadow-sm" : "text-on-surface font-headline"
      )}>
        {title}
      </h1>
    </div>
    <div className="flex-1" />
    <div className="flex items-center gap-3 z-10">
      <button 
        onClick={onAvatarClick}
        className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-highest active:scale-90 transition-transform"
      >
        <img 
          src={userAvatar} 
          alt="Avatar" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </button>
    </div>
  </header>
);

const Sidebar = ({ isOpen, onClose, onNavigate, userName, userAvatar }: { isOpen: boolean, onClose: () => void, onNavigate: (tab: string) => void, userName: string, userAvatar: string }) => {
  const menuItems = [
    { id: 'overview', label: '首页概览', icon: LayoutGrid },
    { id: 'bills', label: '账单明细', icon: ReceiptText },
    { id: 'analysis', label: '分析报告', icon: BarChart3 },
    { id: 'profile', label: '个人中心', icon: User },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150]"
          />
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] bg-background z-[160] shadow-2xl flex flex-col p-8"
          >
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 overflow-hidden">
                <JijiLogo size="h-10" />
              </div>
              <span className="font-cute text-primary text-2xl font-bold">叽叽记账</span>
            </div>

            <nav className="flex-1 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-surface-container-low transition-colors group"
                >
                  <item.icon size={20} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                  <span className="font-body font-bold text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="pt-8 border-t border-outline-variant space-y-4">
              <div className="flex items-center gap-3 p-2">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest">
                  <img 
                    src={userAvatar} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <p className="font-bold text-sm">{userName}</p>
                  <p className="text-[10px] text-on-surface-variant/60 font-medium">Alita Premium</p>
                </div>
              </div>
              <button className="w-full flex items-center gap-3 p-4 text-error font-bold text-sm hover:bg-error-container/10 rounded-2xl transition-colors">
                <LogOut size={18} />
                退出登录
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- Screens ---

const formatDate = (date: any, includeTime = false) => {
  let d = date;
  if (!(d instanceof Date)) {
    d = new Date(date);
  }
  if (isNaN(d.getTime())) return '未知日期';
  
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const dateStr = isToday ? '今天' : `${d.getMonth() + 1}月${d.getDate()}日`;
  
  if (includeTime) {
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${dateStr} ${hours}:${minutes}`;
  }
  return dateStr;
};

const toDateTimeLocal = (date: any) => {
  let d = date;
  if (!(d instanceof Date)) {
    d = new Date(date);
  }
  if (isNaN(d.getTime())) return '';
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const formatAmount = (amount: any) => {
  const val = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(val)) return '0.00';
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// --- Gemini AI Service ---
// Removed getGeminiClient

const TransactionItem = ({ 
  transaction, 
  onConfirm, 
  onEdit, 
  onDelete, 
  onClick 
}: { 
  transaction: Transaction, 
  onConfirm?: (id: string) => void,
  onEdit: (t: Transaction) => void,
  onDelete: (id: string) => void,
  onClick: (t: Transaction) => void,
  key?: string
}) => {
  const [isSwiped, setIsSwiped] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-3xl group">
      {/* Action Buttons Background */}
      <div className="absolute inset-0 flex justify-end items-center pr-4 gap-2 bg-surface-container-highest">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onEdit(transaction);
            setIsSwiped(false);
          }}
          className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <Edit2 size={20} />
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(transaction.id);
            setIsSwiped(false);
          }}
          className="w-12 h-12 rounded-full bg-tertiary text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Main Content Card */}
      <motion.div 
        drag="x"
        dragConstraints={{ left: -140, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60) setIsSwiped(true);
          else if (info.offset.x > 20) setIsSwiped(false);
        }}
        animate={{ x: isSwiped ? -140 : 0 }}
        onClick={() => {
          if (isSwiped) setIsSwiped(false);
          else onClick(transaction);
        }}
        className="relative z-10 flex items-center justify-between p-5 bg-surface-container-low cursor-pointer active:bg-surface-container-highest transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            transaction.type === 'income' ? "bg-secondary-container/20 text-secondary" : "bg-tertiary-container/20 text-tertiary"
          )}>
            <CategoryIcon icon={CATEGORIES.find(c => c.id === transaction.category)?.icon || 'HelpCircle'} size={24} />
          </div>
          <div>
            <p className="font-bold">{transaction.title}</p>
            <p className="text-xs text-on-surface-variant">
              {formatDate(transaction.date)} · {CATEGORIES.find(c => c.id === transaction.category)?.name}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cn("font-bold text-lg", transaction.type === 'income' ? "text-secondary" : "text-tertiary")}>
            {transaction.type === 'income' ? '+' : '-'} {formatAmount(transaction.amount)}
          </span>
          {transaction.status === 'pending' && onConfirm && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onConfirm(transaction.id);
              }}
              className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full uppercase tracking-widest"
            >
              确认
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const TransactionDetailModal = ({ 
  transaction, 
  onClose, 
  onEdit, 
  onDelete,
  onUpdate,
  categories
}: { 
  transaction: Transaction, 
  onClose: () => void,
  onEdit: (t: Transaction) => void,
  onDelete: (id: string) => void,
  onUpdate: (id: string, updates: Partial<Transaction>) => void,
  categories: Category[]
}) => {
  const category = categories.find(c => c.id === transaction.category);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const dateValue = useMemo(() => {
    return toDateTimeLocal(transaction.date);
  }, [transaction.date]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      onUpdate(transaction.id, { date: newDate });
    }
  };

  const openDatePicker = () => {
    if (dateInputRef.current) {
      if ('showPicker' in dateInputRef.current) {
        (dateInputRef.current as any).showPicker();
      } else {
        (dateInputRef.current as any).click();
      }
    }
  };

  const toggleType = () => {
    const newType = transaction.type === 'income' ? 'expense' : 'income';
    onUpdate(transaction.id, { type: newType });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-md bg-background rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
            <button onClick={onClose} className="p-2 hover:bg-surface-container-highest rounded-full transition-colors">
              <X size={24} />
            </button>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  onEdit(transaction);
                  onClose();
                }}
                className="p-2 hover:bg-surface-container-highest rounded-full transition-colors text-primary"
              >
                <Edit2 size={24} />
              </button>
              <button 
                onClick={() => {
                  onDelete(transaction.id);
                  onClose();
                }}
                className="p-2 hover:bg-surface-container-highest rounded-full transition-colors text-tertiary"
              >
                <Trash2 size={24} />
              </button>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className={cn("w-20 h-20 rounded-full mx-auto flex items-center justify-center", category?.color || "bg-surface-container-highest")}>
              <CategoryIcon icon={category?.icon || 'HelpCircle'} size={40} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-[0.2em]">{category?.name}</p>
              <h2 className="text-5xl font-headline font-extrabold tracking-tighter mt-2">
                {transaction.type === 'income' ? '+' : '-'} ¥{formatAmount(transaction.amount)}
              </h2>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-3xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">交易状态</span>
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                transaction.status === 'confirmed' ? "bg-secondary-container text-secondary" : "bg-primary-container text-primary"
              )}>
                {transaction.status === 'confirmed' ? '已入账' : '待确认'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span 
                onClick={openDatePicker}
                className="text-xs font-bold text-on-surface-variant uppercase tracking-widest cursor-pointer hover:text-primary transition-colors"
              >
                交易日期
              </span>
              <div className="relative">
                <span 
                  onClick={openDatePicker}
                  className="font-bold text-primary cursor-pointer hover:underline"
                >
                  {formatDate(transaction.date, true)}
                </span>
                <input 
                  ref={dateInputRef}
                  type="datetime-local" 
                  className="absolute opacity-0 pointer-events-none" 
                  value={dateValue}
                  onChange={handleDateChange}
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">交易类型</span>
              <span 
                onClick={toggleType}
                className="font-bold text-primary cursor-pointer hover:underline"
              >
                {transaction.type === 'income' ? '收入' : '支出'}
              </span>
            </div>
            {transaction.note && (
              <div className="pt-4 border-t border-outline-variant">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-2">备注</span>
                <p className="font-medium text-on-surface">{transaction.note}</p>
              </div>
            )}
          </div>

          <button 
            onClick={onClose}
            className="w-full h-16 bg-primary text-white rounded-full font-headline font-bold text-lg shadow-lg shadow-primary/20 active:scale-95 transition-transform"
          >
            完成
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const OverviewScreen = ({ 
  transactions, 
  onConfirm,
  onEdit,
  onDelete,
  onView,
  categories
}: { 
  transactions: Transaction[], 
  onConfirm: (id: string) => void,
  onEdit: (t: Transaction) => void,
  onDelete: (id: string) => void,
  onView: (t: Transaction) => void,
  categories: Category[]
}) => {
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = a.date instanceof Date && !isNaN(a.date.getTime()) ? a.date.getTime() : 0;
      const dateB = b.date instanceof Date && !isNaN(b.date.getTime()) ? b.date.getTime() : 0;
      return dateB - dateA;
    });
  }, [transactions]);

  const recent = sortedTransactions.filter(t => t.status === 'confirmed').slice(0, 3);

  const monthlyIncome = useMemo(() => {
    const now = new Date();
    return sortedTransactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'income' && 
             t.status === 'confirmed' && 
             d.getMonth() === now.getMonth() && 
             d.getFullYear() === now.getFullYear();
    }).reduce((sum, t) => sum + t.amount, 0);
  }, [sortedTransactions]);

  const monthlyExpense = useMemo(() => {
    const now = new Date();
    return sortedTransactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && 
             t.status === 'confirmed' && 
             d.getMonth() === now.getMonth() && 
             d.getFullYear() === now.getFullYear();
    }).reduce((sum, t) => sum + t.amount, 0);
  }, [sortedTransactions]);

  return (
    <div className="pt-28 pb-48 px-6 max-w-2xl mx-auto space-y-8">
      <section className="text-center py-4 space-y-2">
        <p className="text-on-surface-variant font-label text-[10px] font-bold tracking-[0.15em] uppercase">本月结余</p>
        <h2 className="text-6xl font-headline font-extrabold text-primary tracking-tighter">¥{formatAmount(monthlyIncome - monthlyExpense)}</h2>
        <div className="flex justify-center gap-8 mt-6">
          <div className="flex flex-col items-center">
            <span className="text-xs text-on-surface-variant mb-1">本月收入</span>
            <span className="text-secondary font-bold text-lg">¥{formatAmount(monthlyIncome)}</span>
          </div>
          <div className="w-px h-8 bg-outline-variant/30 self-center" />
          <div className="flex flex-col items-center">
            <span className="text-xs text-on-surface-variant mb-1">本月支出</span>
            <span className="text-tertiary font-bold text-lg">¥{formatAmount(monthlyExpense)}</span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-headline font-bold text-on-surface">近期账单</h3>
        <div className="space-y-3">
          {recent.map(t => (
            <TransactionItem 
              key={t.id} 
              transaction={t} 
              onEdit={onEdit}
              onDelete={onDelete}
              onClick={onView}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

const AnalysisScreen = ({ 
  transactions, 
  onNavigateToBills,
  categories
}: { 
  transactions: Transaction[],
  onNavigateToBills: (category?: string) => void,
  categories: Category[]
}) => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [type, setType] = useState<'expense' | 'income'>('expense');

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      if (t.status !== 'confirmed' || t.type !== type) return false;
      const date = new Date(t.date);
      if (period === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return date >= weekAgo;
      } else if (period === 'month') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      } else {
        return date.getFullYear() === now.getFullYear();
      }
    });
  }, [transactions, period, type]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    });
    return totals;
  }, [filteredTransactions]);

  const totalAmount = useMemo(() => 
    filteredTransactions.reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions]
  );

  const chartData = useMemo(() => {
    const now = new Date();
    const data: { name: string, value: number }[] = [];

    if (period === 'week') {
      const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayName = days[d.getDay()];
        const dayTotal = transactions
          .filter(t => {
            const tDate = new Date(t.date);
            return t.status === 'confirmed' && 
                   t.type === type && 
                   tDate.getDate() === d.getDate() && 
                   tDate.getMonth() === d.getMonth() && 
                   tDate.getFullYear() === d.getFullYear();
          })
          .reduce((sum, t) => sum + t.amount, 0);
        data.push({ name: dayName, value: dayTotal });
      }
    } else if (period === 'month') {
      // Group by 7-day intervals for the current month
      for (let i = 1; i <= 4; i++) {
        const label = `${i * 7}日`;
        const weekTotal = transactions
          .filter(t => {
            const tDate = new Date(t.date);
            const isSameMonth = tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
            const day = tDate.getDate();
            return t.status === 'confirmed' && 
                   t.type === type && 
                   isSameMonth && 
                   day > (i - 1) * 7 && day <= i * 7;
          })
          .reduce((sum, t) => sum + t.amount, 0);
        data.push({ name: label, value: weekTotal });
      }
    } else {
      const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      // Show all months of current year
      for (let i = 0; i < 12; i++) {
        const monthTotal = transactions
          .filter(t => {
            const tDate = new Date(t.date);
            return t.status === 'confirmed' && 
                   t.type === type && 
                   tDate.getMonth() === i && 
                   tDate.getFullYear() === now.getFullYear();
          })
          .reduce((sum, t) => sum + t.amount, 0);
        data.push({ name: months[i], value: monthTotal });
      }
    }
    return data;
  }, [transactions, period, type]);

  const periodLabel = {
    week: '本周',
    month: '本月',
    year: '本年'
  };

  const typeLabel = {
    expense: '支出',
    income: '收入'
  };

  return (
    <div className="pt-36 pb-32 px-6 w-full space-y-12">
      <section className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex bg-surface-container-low p-1 rounded-full">
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-bold transition-all",
                  type === t ? "bg-primary text-white shadow-md" : "text-on-surface-variant"
                )}
              >
                {typeLabel[t]}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <p className="font-label text-on-surface-variant tracking-[0.15em] uppercase text-[10px] font-bold">{periodLabel[period]}总{typeLabel[type]}</p>
          <h2 className="font-headline text-5xl font-extrabold tracking-tighter text-[#2D2D2D]">
            ¥{formatAmount(totalAmount)}
          </h2>
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-secondary-container rounded-full mt-2">
            <TrendingDown size={14} className="text-on-secondary-container" />
            <span className="text-xs font-bold text-on-secondary-container">较上阶段减少 8.4%</span>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex bg-surface-container-low p-1 rounded-full">
            {(['week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                  period === p ? "bg-primary text-white" : "text-on-surface-variant"
                )}
              >
                {p === 'week' ? '本周' : p === 'month' ? '本月' : '本年'}
              </button>
            ))}
          </div>
          <h3 className="font-headline text-lg font-bold">{periodLabel[period]}{typeLabel[type]}趋势</h3>
        </div>
        
        <div className="w-full h-56 bg-surface-container-low rounded-xl p-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: -20, right: 20, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5F5E5E" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#5F5E5E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#434841' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#434841' }}
                tickFormatter={(value) => `${value}`}
              />
              <Area type="monotone" dataKey="value" stroke="#5F5E5E" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              <Tooltip cursor={false} content={() => null} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>



      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-headline text-xl font-bold">{typeLabel[type]}类别</h3>
        </div>
        <div className="bg-surface-container-low rounded-lg p-2 space-y-1">
          {categories.filter(c => categoryTotals[c.id]).length > 0 ? (
            categories.filter(c => categoryTotals[c.id]).map((item, i) => {
              const amount = categoryTotals[item.id];
              const progress = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
              
              return (
                <div 
                  key={item.id} 
                  onClick={() => onNavigateToBills(item.name)}
                  className="flex items-center justify-between p-4 bg-background rounded-[1.5rem] transition-all active:scale-95 duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center bg-surface-container-highest")}>
                      <CategoryIcon icon={item.icon as any} size={24} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-body font-bold text-sm">{item.name}</p>
                      <p className="text-[10px] font-medium text-on-surface-variant opacity-60 uppercase tracking-widest">
                        {filteredTransactions.filter(t => t.category === item.id).length} 笔交易
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-headline font-bold text-sm text-[#2D2D2D]">¥{formatAmount(amount)}</p>
                    <div className="w-20 h-1 bg-surface-container-highest rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-secondary" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-on-surface-variant/40 italic text-sm">
              此阶段暂无{typeLabel[type]}记录
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const BillsScreen = ({ 
  transactions,
  onEdit,
  onDelete,
  onView,
  initialSearch = '',
  initialCategory = '全部',
  categories
}: { 
  transactions: Transaction[],
  onEdit: (t: Transaction) => void,
  onDelete: (id: string) => void,
  onView: (t: Transaction) => void,
  initialSearch?: string,
  initialCategory?: string,
  categories: Category[]
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeSearch, setActiveSearch] = useState(initialSearch);
  const [selectedTag, setSelectedTag] = useState(initialCategory);

  useEffect(() => {
    if (initialCategory) {
      setSelectedTag(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchQuery(initialSearch);
      setActiveSearch(initialSearch);
    }
  }, [initialSearch]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = activeSearch === '' || 
        t.title.toLowerCase().includes(activeSearch.toLowerCase()) ||
        (t.note && t.note.toLowerCase().includes(activeSearch.toLowerCase()));
      
      const matchesTag = selectedTag === '全部' || 
        categories.find(c => c.id === t.category)?.name === selectedTag;

      return t.status === 'confirmed' && matchesSearch && matchesTag;
    }).sort((a, b) => {
      const dateA = a.date instanceof Date && !isNaN(a.date.getTime()) ? a.date.getTime() : 0;
      const dateB = b.date instanceof Date && !isNaN(b.date.getTime()) ? b.date.getTime() : 0;
      return dateB - dateA;
    });
  }, [transactions, activeSearch, selectedTag, categories]);

  const monthlyIncome = useMemo(() => 
    transactions.filter(t => t.status === 'confirmed' && t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const monthlyExpense = useMemo(() => 
    transactions.filter(t => t.status === 'confirmed' && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const handleSearch = () => {
    setActiveSearch(searchQuery);
  };

  const tags = ['全部', ...categories.map(c => c.name)];

  return (
    <div className="pt-36 pb-48 px-6 max-w-2xl mx-auto space-y-8">
      <section className="bg-surface-container-low rounded-3xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">本月总支出</p>
          <h2 className="text-4xl font-headline font-extrabold tracking-tighter">¥{formatAmount(monthlyExpense)}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-[10px] font-bold text-on-surface-variant/60">本月收入</p>
            <p className="text-lg font-bold text-secondary">¥{formatAmount(monthlyIncome)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-on-surface-variant/60">预算剩余</p>
            <p className="text-lg font-bold text-primary">¥{formatAmount(15000 - monthlyExpense)}</p>
          </div>
        </div>
      </section>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="搜索账单、商户或类别" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full h-14 pl-12 pr-6 bg-surface-container-low border-none rounded-full font-medium focus:ring-2 focus:ring-secondary/20"
          />
        </div>
        <button 
          onClick={handleSearch}
          className="h-14 px-6 bg-secondary text-white rounded-full font-bold active:scale-95 transition-transform"
        >
          搜索
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
        {tags.map((tag) => (
          <button 
            key={tag} 
            onClick={() => setSelectedTag(tag)}
            className={cn(
              "px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all",
              selectedTag === tag ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant"
            )}
          >
            {tag}
          </button>
        ))}
      </div>

      <section className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-on-surface">
              {selectedTag === '全部' ? '最近账单' : `${selectedTag} 账单`}
            </h4>
            <span className="text-[10px] font-bold text-on-surface-variant/60">共 {filteredTransactions.length} 笔交易</span>
          </div>
          <div className="space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map(t => (
                <TransactionItem 
                  key={t.id} 
                  transaction={t} 
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onClick={onView}
                />
              ))
            ) : (
              <div className="text-center py-12 text-on-surface-variant/40 italic">
                没有找到相关账单
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

const ProfileScreen = ({ 
  categories, 
  setCategories, 
  transactions,
  userName,
  setUserName,
  userAvatar,
  setUserAvatar,
  budget,
  setBudget,
  onLogout
}: { 
  categories: Category[], 
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>,
  transactions: Transaction[],
  userName: string,
  setUserName: (name: string) => void,
  userAvatar: string,
  setUserAvatar: (avatar: string) => void,
  budget: number,
  setBudget: (budget: number) => void,
  onLogout: () => void
}) => {
  const [activeSubPage, setActiveSubPage] = useState<string | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(budget.toString());
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState('Excel (.xlsx)');
  const [exportRange, setExportRange] = useState('本月');
  const [isExporting, setIsExporting] = useState(false);
  const [voiceLang, setVoiceLang] = useState('普通话');
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNameClick = () => {
    const newName = prompt('请输入新的名字', userName);
    if (newName && newName.trim()) {
      setUserName(newName.trim());
    }
  };

  const AVAILABLE_CATEGORIES: Category[] = [
    { id: 'education', name: '学习', icon: 'Book', color: 'bg-surface-container-low' },
    { id: 'gift', name: '礼物', icon: 'Gift', color: 'bg-surface-container-low' },
    { id: 'pets', name: '宠物', icon: 'Dog', color: 'bg-surface-container-low' },
    { id: 'sports', name: '运动', icon: 'Dumbbell', color: 'bg-surface-container-low' },
    { id: 'beauty', name: '美容', icon: 'Sparkles', color: 'bg-surface-container-low' },
    { id: 'housing', name: '住房', icon: 'Home', color: 'bg-surface-container-low' },
    { id: 'work', name: '工作', icon: 'Briefcase', color: 'bg-surface-container-low' },
    { id: 'social', name: '社交', icon: 'Users', color: 'bg-surface-container-low' },
    { id: 'shopping', name: '购物', icon: 'ShoppingBag', color: 'bg-surface-container-low' },
    { id: 'transport', name: '交通', icon: 'Car', color: 'bg-surface-container-low' },
    { id: 'medical', name: '医疗', icon: 'HeartPulse', color: 'bg-surface-container-low' },
    { id: 'entertainment', name: '娱乐', icon: 'Gamepad2', color: 'bg-surface-container-low' },
    { id: 'travel', name: '旅行', icon: 'Plane', color: 'bg-surface-container-low' },
    { id: 'bills', name: '账单', icon: 'Receipt', color: 'bg-surface-container-low' },
    { id: 'insurance', name: '保险', icon: 'ShieldCheck', color: 'bg-surface-container-low' },
    { id: 'investment', name: '投资', icon: 'TrendingUp', color: 'bg-surface-container-low' },
    { id: 'repair', name: '维修', icon: 'Wrench', color: 'bg-surface-container-low' },
    { id: 'donation', name: '捐赠', icon: 'Heart', color: 'bg-surface-container-low' },
  ];

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      const headers = ['日期', '标题', '金额', '类型', '分类', '备注'];
      const rows = transactions.map(t => [
        formatDate(t.date),
        t.title,
        t.amount,
        t.type === 'income' ? '收入' : '支出',
        categories.find(c => c.id === t.category)?.name || t.category,
        t.note || ''
      ]);
      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `xiaoyuan_bills_${new Date().toLocaleDateString()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
      alert('导出成功！');
    }, 1500);
  };

  const subPages: Record<string, { title: string, component: React.ReactNode }> = {
    'user-agreement': {
      title: '用户协议',
      component: (
        <div className="space-y-6 pt-4 text-sm text-on-surface-variant leading-relaxed overflow-y-auto max-h-[60vh] custom-scrollbar pr-2">
          <h3 className="font-bold text-lg text-on-surface">用户服务协议</h3>
          <p>欢迎您使用叽叽记账！在您使用本服务前，请认真阅读并充分理解本协议。</p>
          <div className="space-y-4">
            <section>
              <h4 className="font-bold text-on-surface">1. 服务说明</h4>
              <p>叽叽记账为您提供智能财务管理服务，包括但不限于语音记账、消费分析、预算管理等功能。</p>
            </section>
            <section>
              <h4 className="font-bold text-on-surface">2. 账号安全</h4>
              <p>您应妥善保管您的账号信息，并对您账号下发生的所有活动承担责任。</p>
            </section>
            <section>
              <h4 className="font-bold text-on-surface">3. 用户行为规范</h4>
              <p>您承诺在使用本服务时遵守法律法规，不得利用本服务从事违法违规活动。</p>
            </section>
            <section>
              <h4 className="font-bold text-on-surface">4. 免责声明</h4>
              <p>本服务按“现状”提供，我们不保证服务不会中断，也不对因不可抗力导致的损失负责。</p>
            </section>
          </div>
          <p className="pt-4 text-xs text-on-surface-variant/60">最后更新日期：2026年3月25日</p>
        </div>
      )
    },
    'privacy-policy': {
      title: '隐私政策',
      component: (
        <div className="space-y-6 pt-4 text-sm text-on-surface-variant leading-relaxed overflow-y-auto max-h-[60vh] custom-scrollbar pr-2">
          <h3 className="font-bold text-lg text-on-surface">隐私政策</h3>
          <p>我们非常重视您的隐私。本政策说明了我们如何收集、使用和保护您的个人信息。</p>
          <div className="space-y-4">
            <section>
              <h4 className="font-bold text-on-surface">1. 信息收集</h4>
              <p>我们可能会收集您的基本账户信息、记账数据以及在使用语音功能时产生的音频数据（仅用于识别）。</p>
            </section>
            <section>
              <h4 className="font-bold text-on-surface">2. 信息使用</h4>
              <p>收集的信息主要用于提供和改进我们的服务，为您提供个性化的财务分析。</p>
            </section>
            <section>
              <h4 className="font-bold text-on-surface">3. 信息共享</h4>
              <p>除非法律要求或获得您的明确同意，我们不会向第三方共享您的个人信息。</p>
            </section>
            <section>
              <h4 className="font-bold text-on-surface">4. 数据安全</h4>
              <p>我们采用行业标准的加密和安全措施来保护您的数据安全。</p>
            </section>
          </div>
          <p className="pt-4 text-xs text-on-surface-variant/60">最后更新日期：2026年3月25日</p>
        </div>
      )
    },
    'category': {
      title: '分类设置',
      component: (
        <div className="space-y-10 pt-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">当前分类 (长按删除)</h3>
              <button 
                onClick={() => setShowAddCategory(true)}
                className="text-primary text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform"
              >
                <Plus size={14} /> 添加分类
              </button>
            </div>
            <div className="grid grid-cols-4 gap-x-4 gap-y-6">
              {categories.map((cat) => (
                <motion.button
                  key={cat.id}
                  onContextMenu={(e) => e.preventDefault()}
                  onMouseDown={() => {
                    const timer = setTimeout(() => setIsDeleting(cat.id), 800);
                    (window as any)._catTimer = timer;
                  }}
                  onMouseUp={() => clearTimeout((window as any)._catTimer)}
                  onTouchStart={() => {
                    const timer = setTimeout(() => setIsDeleting(cat.id), 800);
                    (window as any)._catTimer = timer;
                  }}
                  onTouchEnd={() => clearTimeout((window as any)._catTimer)}
                  className="flex flex-col items-center gap-2 relative group"
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                    cat.color,
                    isDeleting === cat.id ? "scale-90 bg-error-container text-error" : "hover:scale-105 active:scale-95"
                  )}>
                    <CategoryIcon icon={cat.icon as any} size={24} />
                    {isDeleting === cat.id && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setCategories(prev => prev.filter(c => c.id !== cat.id));
                          setIsDeleting(null);
                        }}
                        className="absolute -top-2 -right-2 bg-error text-white rounded-full p-1 shadow-lg z-10"
                      >
                        <X size={12} />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant text-center leading-tight">{cat.name}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {showAddCategory && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-surface-container-low rounded-3xl p-6 space-y-6 shadow-xl border border-outline-variant"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-headline font-bold">选择新分类</h3>
                  <button onClick={() => setShowAddCategory(false)} className="text-on-surface-variant p-1 hover:bg-surface-container-highest rounded-full">
                    <X size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-x-4 gap-y-6 max-h-72 overflow-y-auto p-2 custom-scrollbar">
                  {AVAILABLE_CATEGORIES.filter(ac => !categories.find(c => c.id === ac.id)).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setCategories(prev => [...prev, cat]);
                        setShowAddCategory(false);
                      }}
                      className="flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                    >
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", cat.color)}>
                        <CategoryIcon icon={cat.icon as any} size={20} />
                      </div>
                      <span className="text-[10px] font-bold text-on-surface-variant">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    },
    'voice': {
      title: '语音偏好',
      component: (
        <div className="space-y-8 pt-6">
          <div className="bg-surface-container-low rounded-2xl p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">识别语言</h3>
              <div className="grid grid-cols-2 gap-3">
                {['普通话', '粤语', '英语', '自动识别'].map((lang) => (
                  <button 
                    key={lang}
                    onClick={() => setVoiceLang(lang)}
                    className={cn(
                      "py-3 rounded-xl text-sm font-bold border-2 transition-all active:scale-95",
                      voiceLang === lang ? "border-primary bg-primary/5 text-primary" : "border-outline text-on-surface-variant hover:border-outline-variant"
                    )}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-6 border-t border-outline-variant space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">高级设置</h3>
              <div 
                onClick={() => setAutoConfirm(!autoConfirm)}
                className="flex items-center justify-between group cursor-pointer"
              >
                <span className="text-sm font-medium group-active:text-primary transition-colors">自动确认识别结果</span>
                <div className={cn(
                  "w-12 h-6 rounded-full relative transition-all duration-300",
                  autoConfirm ? "bg-primary" : "bg-surface-container-highest"
                )}>
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300",
                    autoConfirm ? "right-1" : "left-1"
                  )} />
                </div>
              </div>
              <div 
                onClick={() => setAutoSave(!autoSave)}
                className="flex items-center justify-between group cursor-pointer"
              >
                <span className="text-sm font-medium group-active:text-primary transition-colors">识别后自动保存</span>
                <div className={cn(
                  "w-12 h-6 rounded-full relative transition-all duration-300",
                  autoSave ? "bg-primary" : "bg-surface-container-highest"
                )}>
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300",
                    autoSave ? "right-1" : "left-1"
                  )} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    'export': {
      title: '数据导出',
      component: (
        <div className="space-y-8 pt-4">
          <div className="bg-surface-container-low rounded-2xl p-6 space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">导出范围</h3>
              <div className="grid grid-cols-3 gap-3">
                {['本月', '上月', '全部'].map((range) => (
                  <button 
                    key={range}
                    onClick={() => setExportRange(range)}
                    className={cn(
                      "py-3 rounded-xl text-xs font-bold border-2 transition-all active:scale-95",
                      exportRange === range ? "border-primary bg-primary/5 text-primary" : "border-outline text-on-surface-variant"
                    )}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">导出格式</h3>
              <div className="space-y-3">
                {['Excel (.xlsx)', 'PDF (.pdf)', 'CSV (.csv)'].map((format) => (
                  <label key={format} className="flex items-center gap-3 p-4 border border-outline rounded-xl cursor-pointer hover:bg-surface-container-highest transition-colors active:scale-[0.98]">
                    <input 
                      type="radio" 
                      name="format" 
                      className="hidden" 
                      checked={exportFormat === format}
                      onChange={() => setExportFormat(format)}
                    />
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                      exportFormat === format ? "border-primary" : "border-outline"
                    )}>
                      {exportFormat === format && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                    </div>
                    <span className="text-sm font-medium">{format}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className={cn(
              "w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2",
              isExporting && "opacity-70 cursor-not-allowed"
            )}
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                正在导出...
              </>
            ) : (
              <>
                <Share2 size={18} />
                生成并导出文件
              </>
            )}
          </button>
        </div>
      )
    },
    'about': {
      title: '关于我们',
      component: (
        <div className="space-y-8 text-center pt-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-xl shadow-primary/10 bg-white flex items-center justify-center">
              <JijiLogo size="h-20 w-20" />
            </div>
            <div>
              <h2 className="text-2xl font-cute text-primary font-bold">叽叽记账</h2>
              <p className="text-xs text-on-surface-variant/60 font-medium mt-1">Version 2.4.0 (Build 1024)</p>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-2xl p-6 text-left space-y-4">
            <p className="text-sm leading-relaxed text-on-surface-variant">
              叽叽记账是一款基于 AI 语音识别技术的智能财务管理工具。我们致力于通过最自然的方式，帮助用户轻松记录每一笔开支，实现财务自由。
            </p>
            <div className="pt-4 border-t border-outline-variant space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant/60">官方网站</span>
                <span className="text-primary font-bold">www.alita-app.com</span>
              </div>
              <button 
                onClick={() => setActiveSubPage('user-agreement')}
                className="w-full flex justify-between text-xs hover:text-primary transition-colors"
              >
                <span className="text-on-surface-variant/60">用户协议</span>
                <ChevronRight size={14} />
              </button>
              <button 
                onClick={() => setActiveSubPage('privacy-policy')}
                className="w-full flex justify-between text-xs hover:text-primary transition-colors"
              >
                <span className="text-on-surface-variant/60">隐私政策</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-on-surface-variant/40 font-medium">
            © 2026 Alita Tech. All Rights Reserved.
          </p>
        </div>
      )
    }
  };

  const stats = useMemo(() => {
    const now = new Date();
    const uniqueDates = new Set(transactions.map(t => new Date(t.date).toDateString()));
    
    const monthlyTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.status === 'confirmed';
    });

    const monthlyIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpense = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = monthlyIncome - monthlyExpense;

    const budgetUsage = monthlyExpense > 0 ? Math.min(Math.round((monthlyExpense / budget) * 100), 100) : 0;
    const health = 100 - budgetUsage;
    const estimatedSavings = Math.max(budget - monthlyExpense, 0);

    return {
      days: uniqueDates.size,
      balance,
      health,
      estimatedSavings,
      monthlyExpense
    };
  }, [transactions, budget]);

  const handleBudgetSave = () => {
    const val = Number(tempBudget);
    if (!isNaN(val) && val >= 0) {
      setBudget(val);
      setIsEditingBudget(false);
    }
  };

  const handleBudgetCancel = () => {
    setTempBudget(budget.toString());
    setIsEditingBudget(false);
  };

  if (activeSubPage && subPages[activeSubPage]) {
    return (
      <div className="pt-32 pb-32 px-6 max-w-2xl mx-auto space-y-8">
        <header className="flex items-center gap-4 -mb-2">
          <button 
            onClick={() => setActiveSubPage(null)}
            className="p-2 bg-surface-container-low rounded-full text-on-surface-variant active:scale-90 transition-transform"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-headline font-bold text-xl">{subPages[activeSubPage].title}</h2>
        </header>
        {subPages[activeSubPage].component}
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 px-6 max-w-2xl mx-auto space-y-8">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      <section className="flex flex-col items-center justify-center text-center space-y-4 pt-6">
        <div className="relative">
          <div 
            onClick={handleAvatarClick}
            className="w-24 h-24 rounded-full overflow-hidden bg-surface-container-highest ring-4 ring-white shadow-lg cursor-pointer active:scale-95 transition-transform"
          >
            <img 
              src={userAvatar} 
              alt="User" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute bottom-0 right-0 bg-secondary text-white rounded-full p-1.5 border-2 border-white">
            <CheckCircle2 size={16} fill="currentColor" />
          </div>
        </div>
        <div>
          <h2 
            onClick={handleNameClick}
            className="font-headline font-bold text-2xl tracking-tight cursor-pointer hover:text-primary transition-colors"
          >
            {userName}
          </h2>
          <p className="font-label text-sm text-on-surface-variant/70 tracking-wide mt-1">Alita Premium Member</p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-low p-4 rounded-2xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-1">记账天数</p>
          <p className="text-2xl font-headline font-extrabold">{stats.days}</p>
        </div>
        <div className="bg-surface-container-low p-4 rounded-2xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-1">本月结余</p>
          <p className={cn(
            "text-2xl font-headline font-extrabold",
            stats.balance >= 0 ? "text-secondary" : "text-error"
          )}>
            ¥{formatAmount(stats.balance)}
          </p>
        </div>
      </div>

      <section className="relative bg-surface-container-lowest rounded-xl p-8 shadow-[0_20px_40px_0_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <h3 className="font-headline font-bold text-lg">预算健康度</h3>
            <div className="flex items-center gap-2">
              {isEditingBudget ? (
                <div className="flex items-center gap-1">
                  <input 
                    type="number" 
                    value={tempBudget}
                    onChange={(e) => setTempBudget(e.target.value)}
                    className="w-20 px-2 py-0.5 text-xs bg-surface-container-low border border-primary rounded outline-none"
                    autoFocus
                  />
                  <button onClick={handleBudgetSave} className="text-[10px] text-secondary font-bold">保存</button>
                  <button onClick={handleBudgetCancel} className="text-[10px] text-on-surface-variant font-bold">取消</button>
                </div>
              ) : (
                <p className="text-[10px] text-on-surface-variant font-medium">
                  当前预算: ¥{formatAmount(budget)} 
                  <span 
                    onClick={() => {
                      setTempBudget(budget.toString());
                      setIsEditingBudget(true);
                    }} 
                    className="text-primary cursor-pointer ml-1 underline"
                  >
                    修改
                  </span>
                </p>
              )}
            </div>
          </div>
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-bold",
            stats.health > 70 ? "bg-secondary-container text-on-secondary-container" : 
            stats.health > 30 ? "bg-tertiary-container text-on-tertiary-container" : 
            "bg-error-container text-error"
          )}>
            {stats.health > 70 ? '良好' : stats.health > 30 ? '一般' : '预警'}
          </span>
        </div>
        <div className="relative flex justify-center py-4">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle className="text-surface-container" cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" />
              <circle 
                className={cn(
                  stats.health > 70 ? "text-secondary" : stats.health > 30 ? "text-tertiary" : "text-error"
                )} 
                cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" 
                strokeDasharray="100" 
                strokeDashoffset={100 - stats.health} 
                strokeLinecap="round" 
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-headline font-extrabold">{stats.health}%</span>
            </div>
          </div>
        </div>
        <div className="bg-tertiary-container/10 border-l-4 border-tertiary-container p-4 rounded-r-lg mt-4 backdrop-blur-sm">
          <p className="font-body text-sm leading-relaxed text-on-tertiary-container">
            {stats.days === 0 ? (
              <>您还没有记账记录，开始记录第一笔账单吧！</>
            ) : stats.health > 0 ? (
              <>您的支出节奏{stats.health > 70 ? '良好' : '尚可'}，预计本月可节省 <span className="font-bold text-lg">¥{formatAmount(stats.estimatedSavings)}</span></>
            ) : (
              <>您的支出已超出预算，请注意控制开支。</>
            )}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        {[
          { id: 'category', icon: LayoutGrid, label: '分类设置', sub: '自定义您的记账类别' },
          { id: 'voice', icon: Mic, label: '语音偏好', sub: '设置您的语音识别习惯' },
          { id: 'export', icon: Share2, label: '数据导出', sub: '导出为 Excel 或 PDF' },
          { id: 'about', icon: HelpCircle, label: '关于我们', sub: '了解 Alita 的故事' },
        ].map((item, i) => (
          <div 
            key={i} 
            onClick={() => setActiveSubPage(item.id)}
            className="flex items-center justify-between p-5 bg-surface-container-low rounded-2xl hover:bg-surface-container-highest transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
                <item.icon size={20} />
              </div>
              <div>
                <span className="font-body font-bold block text-sm">{item.label}</span>
                <span className="text-[10px] text-on-surface-variant/60 font-medium">{item.sub}</span>
              </div>
            </div>
            <ChevronRight className="text-outline-variant group-hover:text-primary transition-colors" size={20} />
          </div>
        ))}
      </section>

      <section className="mt-4">
        <button 
          onClick={onLogout}
          className="w-full py-4 bg-surface-container-highest text-tertiary rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <LogOut size={20} />
          退出登录
        </button>
      </section>

    </div>
  );
};

// --- Modals ---

const ManualEntryModal = ({ onClose, onSave, onUpdate, initialData, categories }: { 
  onClose: () => void, 
  onSave: (transaction: Omit<Transaction, 'id'>) => void,
  onUpdate?: (id: string, updates: Partial<Transaction>) => void,
  initialData?: Transaction | null,
  categories: Category[]
}) => {
  const [type, setType] = useState<'expense' | 'income'>(initialData?.type || 'expense');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category || categories[0].id);
  const [note, setNote] = useState(initialData?.note || '');
  const [date, setDate] = useState<Date>(initialData?.date || new Date());
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (!amount || isNaN(Number(amount))) {
      return;
    }
    
    const data = {
      title: categories.find(c => c.id === selectedCategory)?.name || '未命名',
      amount: Number(amount),
      date,
      category: selectedCategory,
      type: type as TransactionType,
      status: 'confirmed' as const,
      note
    };

    if (initialData && onUpdate) {
      onUpdate(initialData.id, data);
    } else {
      onSave(data);
    }
    onClose();
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-[100] bg-background flex flex-col"
    >
      <header className="flex items-center justify-between px-6 h-20">
        <button onClick={onClose} className="text-primary">
          <X size={24} />
        </button>
        <h1 className="font-headline font-bold text-xl">记一笔</h1>
        <div className="w-6" />
      </header>

      <main className="flex-1 px-6 overflow-y-auto pb-12">
        <div className="flex justify-center mb-10">
          <div className="bg-surface-container-low p-1.5 rounded-full flex w-full max-w-[280px]">
            <button 
              onClick={() => setType('expense')}
              className={cn(
                "flex-1 py-3 px-6 rounded-full text-sm font-bold transition-all",
                type === 'expense' ? "bg-surface-container-highest shadow-sm" : "text-on-surface-variant"
              )}
            >
              支出
            </button>
            <button 
              onClick={() => setType('income')}
              className={cn(
                "flex-1 py-3 px-6 rounded-full text-sm font-bold transition-all",
                type === 'income' ? "bg-surface-container-highest shadow-sm" : "text-on-surface-variant"
              )}
            >
              收入
            </button>
          </div>
        </div>

        <section className="text-center mb-12">
          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">金额</label>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-headline font-medium text-primary">¥</span>
            <input 
              autoFocus
              type="number" 
              inputMode="decimal"
              placeholder="0.00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-center bg-transparent border-none focus:ring-0 p-0 text-7xl font-headline font-extrabold tracking-tighter focus:placeholder:opacity-0"
            />
          </div>
        </section>

        <section className="space-y-10">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-6">选择分类</label>
            <div className="grid grid-cols-4 gap-x-4 gap-y-6 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
              {categories.map((cat) => (
                <div key={cat.id} className="flex flex-col items-center gap-3">
                  <button 
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center transition-all active:scale-90", 
                      selectedCategory === cat.id 
                        ? "bg-primary text-white ring-4 ring-primary/20 ring-offset-2" 
                        : cn(cat.color, "hover:bg-surface-container-highest")
                    )}
                  >
                    <CategoryIcon 
                      icon={cat.icon as any} 
                      size={24} 
                      className={selectedCategory === cat.id ? "text-white" : "text-on-surface-variant"} 
                    />
                  </button>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest transition-colors text-center leading-tight",
                    selectedCategory === cat.id ? "text-primary" : "text-on-surface-variant"
                  )}>
                    {cat.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8 bg-surface-container-low/50 p-8 rounded-3xl">
            <div 
              onClick={() => {
                if (dateInputRef.current) {
                  if ('showPicker' in dateInputRef.current) {
                    (dateInputRef.current as any).showPicker();
                  } else {
                    (dateInputRef.current as any).click();
                  }
                }
              }}
              className="flex items-center gap-3 border-b-2 border-primary-fixed py-2 cursor-pointer group"
            >
              <ReceiptText size={20} className="text-primary group-hover:scale-110 transition-transform" />
              <div className="flex-1">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">交易日期</p>
                <p className="text-lg font-medium">{formatDate(date, true)}</p>
              </div>
                <input 
                  ref={dateInputRef}
                  type="datetime-local" 
                  className="absolute opacity-0 pointer-events-none" 
                  value={toDateTimeLocal(date)}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    if (!isNaN(newDate.getTime())) {
                      setDate(newDate);
                    }
                  }}
                />
            </div>
            <div className="flex items-center gap-3 border-b-2 border-primary-fixed py-2">
              <Mic size={20} className="text-primary" />
              <input 
                type="text" 
                placeholder="添加备注描述..." 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 p-0 text-lg font-medium" 
              />
            </div>
          </div>
        </section>

        <button 
          onClick={handleSave}
          className="w-full h-20 bg-secondary text-white rounded-full flex items-center justify-center gap-3 shadow-lg shadow-secondary/20 mt-12 active:scale-95 transition-transform"
        >
          <span className="font-headline font-bold text-lg">保存记录</span>
          <CheckCircle2 size={24} fill="currentColor" />
        </button>
      </main>
    </motion.div>
  );
};

const VoiceModal = ({ onClose, onSave, categories, uid }: { onClose: () => void, onSave: (t: Omit<Transaction, 'id'>) => void, categories: Category[], uid: string }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [detectedData, setDetectedData] = useState<{ amount?: number, category?: string, title?: string, type?: string, note?: string, merchant?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPermissionStatus('granted');
      setError(null);
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await identifyFromAudio(audioBlob);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionStatus('denied');
        setError("麦克风权限被拒绝，请在浏览器设置中开启。");
      } else {
        setError("无法访问麦克风，请检查设备连接。");
      }
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsIdentifying(true);
    }
  };

  const identifyFromAudio = async (audioBlob: Blob) => {
    setIsIdentifying(true);
    setError(null);
    try {
      // 1. Upload audio to /api/transcribe
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");

      const transcribeResponse = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!transcribeResponse.ok) {
        throw new Error("语音转写失败，请检查网络或 API 配置。");
      }

      const { text: transcriptText } = await transcribeResponse.json();
      if (!transcriptText) {
        throw new Error("未能识别到语音内容，请重试。");
      }

      setTranscript(transcriptText);

      // 2. Send transcript to /api/parse-bill
      const parseResponse = await fetch("/api/parse-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcriptText }),
      });

      if (!parseResponse.ok) {
        throw new Error("账单解析失败，请尝试手动输入。");
      }

      const billData = await parseResponse.json();
      setDetectedData(billData);
    } catch (err: any) {
      console.error("AI Identification failed:", err);
      setError(err.message || "智能识别失败，请尝试手动输入。");
    } finally {
      setIsIdentifying(false);
    }
  };

  useEffect(() => {
    startRecording();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleSave = async () => {
    if (!detectedData?.amount) return;
    
    const billToSave = {
      title: detectedData.note || detectedData.merchant || '语音记账',
      amount: detectedData.amount,
      date: new Date(),
      category: detectedData.category || 'other',
      type: (detectedData.type as any) || 'expense',
      status: 'confirmed' as const,
      note: `语音识别: ${transcript}`
    };

    try {
      await onSave(billToSave);
      onClose();
    } catch (err: any) {
      console.error("Save failed:", err);
      setError(err.message || "保存失败，请重试。");
    }
  };

  const categoryName = categories.find(c => c.id === detectedData?.category)?.name || '其他';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[110] bg-background flex flex-col items-center p-6"
    >
      <header className="w-full flex items-center justify-between mb-12">
        <button onClick={onClose} className="text-primary">
          <X size={24} />
        </button>
        <h1 className="font-headline font-bold text-xl">语音记账</h1>
        <div className="w-6" />
      </header>

      <div className="text-center space-y-4 mb-16">
        <div className="opacity-40 scale-75">
          <JijiLogo size="text-xs" />
          <span className="text-xs font-bold uppercase tracking-widest ml-2">· JIJI</span>
        </div>
        <h2 className="text-3xl font-headline font-bold text-primary">
          {isIdentifying ? '正在识别中...' : isRecording ? '正在倾听描述...' : '录音已结束'}
        </h2>
      </div>

      <div className="relative mb-16">
        <AnimatePresence>
          {isRecording && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.3, 0.1] }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute inset-0 bg-primary/20 rounded-full blur-3xl"
            />
          )}
        </AnimatePresence>
        
        <button 
          onClick={isRecording ? stopRecording : startRecording}
          className={cn(
            "relative w-28 h-28 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500",
            isRecording ? "bg-primary text-white scale-110" : "bg-surface-container-highest text-on-surface-variant"
          )}
        >
          {isRecording ? (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Mic size={44} />
            </motion.div>
          ) : (
            <Mic size={44} />
          )}
        </button>
      </div>

      <div className="text-center space-y-8 w-full max-w-sm">
        <div className="min-h-[80px] flex items-center justify-center px-4">
          <p className="text-xl font-medium leading-relaxed text-on-surface">
            {transcript ? (
              <span>“{transcript}”</span>
            ) : (
              <span className="opacity-30 italic">“刚刚在全家买了一瓶水，3.5元”</span>
            )}
          </p>
        </div>

        {(isIdentifying || detectedData) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-secondary-container/10 rounded-[2.5rem] border border-secondary-container/20 shadow-sm"
          >
            <div className="flex items-center justify-center gap-3 text-secondary font-bold text-sm mb-3">
              <Sparkles size={18} className={isIdentifying ? "animate-pulse" : ""} />
              {isIdentifying ? '正在智能分析...' : '智能识别成功'}
            </div>
            
            {detectedData ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xl font-bold text-primary">¥</span>
                  <input 
                    type="number"
                    value={detectedData.amount}
                    onChange={(e) => setDetectedData({ ...detectedData, amount: Number(e.target.value) })}
                    className="w-32 text-center bg-transparent border-none focus:ring-0 p-0 text-3xl font-headline font-extrabold text-primary"
                  />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <CategoryIcon icon={categories.find(c => c.id === detectedData.category)?.icon || 'HelpCircle'} size={14} className="text-primary" />
                  </div>
                  <p className="font-bold text-sm">检测到分类：{categoryName}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" />
              </div>
            )}
          </motion.div>
        )}
      </div>

      {error && (
        <p className="mt-4 text-xs font-bold text-tertiary bg-tertiary/10 px-4 py-2 rounded-full">{error}</p>
      )}

      <div className="absolute bottom-12 w-full px-6 space-y-6">
        <button 
          onClick={handleSave} 
          disabled={!detectedData}
          className="w-full h-20 bg-secondary text-white rounded-full flex items-center justify-center gap-3 shadow-lg shadow-secondary/20 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
        >
          <span className="font-headline font-bold text-lg">确认入账</span>
          <CheckCircle2 size={24} fill="currentColor" />
        </button>
        <button onClick={onClose} className="w-full text-on-surface-variant font-bold">取消</button>
      </div>
    </motion.div>
  );
};

const ScreenshotModal = ({ onClose, onSave, categories }: { onClose: () => void, onSave: (t: Omit<Transaction, 'id'>) => void, categories: Category[] }) => {
  const [date, setDate] = useState(new Date());
  const [amount, setAmount] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0].id);
  const [type, setType] = useState<TransactionType>('expense');
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      recognizeReceipt(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const recognizeReceipt = async (base64Data: string) => {
    setIsScanning(true);
    setError(null);
    try {
      const response = await fetch("/api/recognize-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Data }),
      });

      if (!response.ok) {
        throw new Error("截图识别失败，请尝试手动输入。");
      }

      const receiptData = await response.json();
      
      setTitle(receiptData.merchant || receiptData.note || '未命名商户');
      setAmount(receiptData.amount?.toString() || '');
      setType(receiptData.type || 'expense');
      
      // Fallback to 'other' if category is not recognized or not in our list
      const recognizedCat = categories.find(c => c.id === receiptData.category);
      setSelectedCategory(recognizedCat ? recognizedCat.id : 'other');
      
      if (receiptData.time) {
        const parsedDate = new Date(receiptData.time);
        if (!isNaN(parsedDate.getTime())) {
          setDate(parsedDate);
        }
      }
    } catch (err: any) {
      console.error("Recognition failed:", err);
      setError(err.message || "识别失败，请手动调整或重试。");
      setSelectedCategory('other');
    } finally {
      setIsScanning(false);
    }
  };

  const openDatePicker = () => {
    if (dateInputRef.current) {
      if ('showPicker' in dateInputRef.current) {
        (dateInputRef.current as any).showPicker();
      } else {
        (dateInputRef.current as any).click();
      }
    }
  };

  const handleSave = () => {
    onSave({
      title: title || '截图识别账单',
      amount: Number(amount) || 0,
      date,
      category: selectedCategory,
      type,
      status: 'confirmed',
      note: '通过截图识别导入'
    });
    onClose();
  };

  const items = [
    { icon: Home, label: '商户名称', value: title || (isScanning ? '正在识别...' : '等待上传'), onChange: (v: string) => setTitle(v) },
    { icon: LayoutGrid, label: '支出类别', value: categories.find(c => c.id === selectedCategory)?.name || '未分类', onClick: () => setShowCategoryPicker(true), categoryIcon: categories.find(c => c.id === selectedCategory)?.icon },
    { icon: ReceiptText, label: '交易日期', value: formatDate(date, true), isDate: true },
    { icon: Wallet, label: '交易类型', value: type === 'income' ? '收入' : '支出', isType: true },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[110] bg-background flex flex-col p-6 overflow-y-auto no-scrollbar"
    >
      <header className="flex items-center justify-between mb-8">
        <button onClick={onClose} className="text-primary">
          <X size={24} />
        </button>
        <h1 className="font-headline font-bold text-xl">截图识别</h1>
        <div className="w-6" />
      </header>

      <div 
        onClick={() => previewUrl ? setShowFullPreview(true) : fileInputRef.current?.click()}
        className="relative aspect-[3/4] w-full max-w-sm mx-auto rounded-[3rem] overflow-hidden mb-8 shadow-2xl cursor-pointer group"
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />
        
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt="Preview" 
            className={cn("w-full h-full object-cover transition-opacity", isScanning ? "opacity-50" : "opacity-100")}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-100 flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <ImageIcon size={40} className="text-primary" />
            </div>
            <span className="font-bold text-sm text-on-surface-variant">点击上传截图</span>
          </div>
        )}

        {isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/20 backdrop-blur-sm">
            <motion.div 
              animate={{ y: [0, 200, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute top-0 left-0 right-0 h-1 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)] z-20"
            />
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="font-bold text-white drop-shadow-md">正在智能识别...</span>
          </div>
        )}
        
        {!isScanning && previewUrl && (
          <div className="absolute bottom-6 right-6 bg-secondary text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
            {error ? '识别失败' : '点击预览'}
          </div>
        )}
      </div>

      <div className="text-center space-y-2 mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">支出金额</p>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-2xl font-bold text-primary">¥</span>
          <input 
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-40 text-center bg-transparent border-none focus:ring-0 p-0 text-6xl font-headline font-extrabold tracking-tighter focus:placeholder:opacity-0"
          />
        </div>
      </div>

      <div className="bg-surface-container-low rounded-3xl p-6 space-y-6">
        {items.map((item, i) => (
          <div 
            key={i} 
            className="flex items-center justify-between group"
            onClick={item.onClick}
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary shrink-0">
                {item.categoryIcon ? (
                  <CategoryIcon icon={item.categoryIcon} size={24} />
                ) : (
                  <item.icon size={24} />
                )}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">{item.label}</p>
                {item.onChange ? (
                  <input 
                    type="text"
                    value={item.value}
                    onChange={(e) => item.onChange(e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 font-bold"
                  />
                ) : (
                  <p className="font-bold">{item.value}</p>
                )}
              </div>
            </div>
            <div className="relative flex items-center gap-2">
              {item.isDate && (
                <div onClick={openDatePicker} className="cursor-pointer hover:text-primary transition-colors">
                  <ChevronRight size={20} className="text-outline-variant" />
                  <input 
                    ref={dateInputRef}
                    type="datetime-local" 
                    className="absolute opacity-0 pointer-events-none right-0" 
                    value={toDateTimeLocal(date)}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      if (!isNaN(newDate.getTime())) {
                        setDate(newDate);
                      }
                    }}
                  />
                </div>
              )}
              {item.isType && (
                <button 
                  onClick={() => setType(type === 'income' ? 'expense' : 'income')}
                  className="text-primary font-bold text-sm hover:underline"
                >
                  切换
                </button>
              )}
              {!item.isDate && !item.isType && !item.onChange && (
                <ChevronRight size={20} className="text-outline-variant" />
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-4 text-center text-xs font-bold text-tertiary">{error}</p>
      )}

      <div className="mt-12 space-y-6 pb-12">
        <button 
          onClick={handleSave}
          disabled={isScanning || !previewUrl}
          className="w-full h-20 bg-secondary text-white rounded-full flex items-center justify-center gap-3 shadow-lg shadow-secondary/20 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
        >
          <span className="font-headline font-bold text-lg">确认入账</span>
          <CheckCircle2 size={24} fill="currentColor" />
        </button>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full text-on-surface-variant font-bold"
        >
          重新上传
        </button>
      </div>

      {/* Full Image Preview Modal */}
      <AnimatePresence>
        {showFullPreview && previewUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col"
          >
            <header className="flex items-center justify-between px-6 h-20 text-white">
              <button onClick={() => setShowFullPreview(false)}>
                <X size={24} />
              </button>
              <h2 className="font-bold">图片预览</h2>
              <div className="w-6" />
            </header>
            <div className="flex-1 flex items-center justify-center p-4">
              <img 
                src={previewUrl} 
                alt="Full Preview" 
                className="max-w-full max-h-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Picker Modal */}
      <AnimatePresence>
        {showCategoryPicker && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex flex-col justify-end"
            onClick={() => setShowCategoryPicker(false)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-background rounded-t-[3.5rem] p-8 pb-12 shadow-2xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full mx-auto mb-8 shrink-0" />
              
              <div className="flex items-center justify-between mb-8 shrink-0">
                <h2 className="font-headline font-bold text-2xl tracking-tight">选择分类</h2>
                <button 
                  onClick={() => setShowCategoryPicker(false)} 
                  className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant active:scale-90 transition-transform"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-x-4 gap-y-8 overflow-y-auto no-scrollbar py-2">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex flex-col items-center gap-3">
                    <button 
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setShowCategoryPicker(false);
                      }}
                      className={cn(
                        "w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all active:scale-90 duration-300", 
                        selectedCategory === cat.id 
                          ? "bg-primary text-white shadow-xl shadow-primary/30 scale-110" 
                          : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"
                      )}
                    >
                      <CategoryIcon 
                        icon={cat.icon as any} 
                        size={24} 
                        className={selectedCategory === cat.id ? "text-white" : ""} 
                      />
                    </button>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest transition-colors text-center",
                      selectedCategory === cat.id ? "text-primary" : "text-on-surface-variant/70"
                    )}>
                      {cat.name}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [billsFilter, setBillsFilter] = useState<{ search?: string, category?: string }>({});
  const [modal, setModal] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState(5000);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Login states
  const [loginMode, setLoginMode] = useState<'google' | 'email' | 'register' | 'phone'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successOverlay, setSuccessOverlay] = useState<{ open: boolean; type: 'saving' | 'expense' }>({ open: false, type: 'expense' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }

    const q = query(
      collection(db, 'bills'),
      where('uid', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const billsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: (doc.data().date as Timestamp).toDate()
      })) as Transaction[];
      setTransactions(billsData);
    }, (error) => {
      console.error("Fetch bills failed:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) {
      setLoginError("Firebase Auth 未初始化，请刷新页面。");
      return;
    }
    try {
      setIsLoading(true);
      setLoginError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login failed:", error);
      let message = error.message || "登录失败，请重试。";
      if (error.code === 'auth/popup-blocked') {
        message = "登录窗口被浏览器拦截，请允许弹出窗口后重试。";
      } else if (error.code === 'auth/network-request-failed') {
        message = "网络连接失败，请检查您的网络设置。";
      }
      setLoginError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError("请输入邮箱和密码。");
      return;
    }
    try {
      setIsLoading(true);
      setLoginError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Email login failed:", error);
      let message = "登录失败，请检查邮箱和密码。";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "邮箱或密码错误。";
      } else if (error.code === 'auth/invalid-email') {
        message = "邮箱格式不正确。";
      }
      setLoginError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError("请输入邮箱和密码。");
      return;
    }
    if (password.length < 6) {
      setLoginError("密码长度至少为 6 位。");
      return;
    }
    try {
      setIsLoading(true);
      setLoginError(null);
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Registration failed:", error);
      let message = "注册失败，请重试。";
      if (error.code === 'auth/email-already-in-use') {
        message = "该邮箱已被注册。";
      } else if (error.code === 'auth/invalid-email') {
        message = "邮箱格式不正确。";
      } else if (error.code === 'auth/weak-password') {
        message = "密码强度太弱。";
      }
      setLoginError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      setLoginError("请输入手机号。");
      return;
    }
    // Simple phone format check (e.g., +8613800138000)
    if (!phoneNumber.startsWith('+')) {
      setLoginError("请输入带国家代码的手机号（例如：+8613800138000）。");
      return;
    }
    try {
      setIsLoading(true);
      setLoginError(null);
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
      setIsVerifying(true);
    } catch (error: any) {
      console.error("SMS send failed:", error);
      let message = "验证码发送失败，请重试。";
      if (error.code === 'auth/invalid-phone-number') {
        message = "手机号格式不正确。";
      } else if (error.code === 'auth/too-many-requests') {
        message = "请求过于频繁，请稍后再试。";
      }
      setLoginError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || !confirmationResult) {
      setLoginError("请输入验证码。");
      return;
    }
    try {
      setIsLoading(true);
      setLoginError(null);
      await confirmationResult.confirm(verificationCode);
    } catch (error: any) {
      console.error("Verification failed:", error);
      let message = "验证码错误，请重试。";
      if (error.code === 'auth/invalid-verification-code') {
        message = "验证码不正确。";
      } else if (error.code === 'auth/code-expired') {
        message = "验证码已过期，请重新获取。";
      }
      setLoginError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Force a reload to ensure all states are cleared and the login screen is shown
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleUpdateUserName = async (newName: string) => {
    if (!user) return;
    try {
      await updateProfile(user, { displayName: newName });
      // updateProfile doesn't trigger onAuthStateChanged in some Firebase versions, 
      // so we manually refresh the user object or just rely on the next auth state change.
      // Actually, we can just force a state update by creating a new object.
      setUser({ ...user, displayName: newName } as FirebaseUser);
    } catch (error) {
      console.error("Update name failed:", error);
    }
  };

  const handleUpdateUserAvatar = async (newAvatar: string) => {
    if (!user) return;
    try {
      await updateProfile(user, { photoURL: newAvatar });
      setUser({ ...user, photoURL: newAvatar } as FirebaseUser);
    } catch (error) {
      console.error("Update avatar failed:", error);
    }
  };

  const handleNavigateToBills = (category?: string) => {
    setBillsFilter({ category });
    setActiveTab('bills');
  };

  const confirmTransaction = async (id: string) => {
    try {
      await updateDoc(doc(db, 'bills', id), { status: 'confirmed' });
    } catch (error) {
      console.error("Confirm failed:", error);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'bills'), {
        ...transaction,
        uid: user.uid,
        date: Timestamp.fromDate(transaction.date),
        createdAt: serverTimestamp()
      });
      // Trigger success animation
      setSuccessOverlay({ open: true, type: transaction.type === 'income' ? 'saving' : 'expense' });
    } catch (error) {
      console.error("Add failed:", error);
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const firestoreUpdates: any = { ...updates };
      if (updates.date) {
        firestoreUpdates.date = Timestamp.fromDate(updates.date);
      }
      await updateDoc(doc(db, 'bills', id), firestoreUpdates);
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'bills', id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setModal('manual');
  };

  const handleView = (transaction: Transaction) => {
    setViewingTransaction(transaction);
  };

  const screenTitle = useMemo(() => {
    switch (activeTab) {
      case 'overview': return '叽叽记账';
      case 'bills': return '账单明细';
      case 'analysis': return '分析报告';
      case 'profile': return '个人中心';
      default: return '叽叽记账';
    }
  }, [activeTab]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-100 flex justify-center items-center p-0 sm:p-4 md:p-8">
        <div className="relative w-full max-w-[440px] h-full sm:h-[952px] bg-background overflow-hidden sm:rounded-[3.5rem] sm:shadow-[0_0_0_12px_#1a1a1a,0_20px_50px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div id="recaptcha-container"></div>
          
          <div className="flex flex-col items-center space-y-4 mb-4">
            <JijiLogo size="h-24 w-24" />
            <h1 className="text-3xl font-cute text-primary font-bold">叽叽记账</h1>
          </div>
          
          <div className="w-full space-y-4">
            {loginError && (
              <div className="w-full p-4 bg-error-container text-error rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
                {loginError}
              </div>
            )}

            {loginMode === 'google' && (
              <div className="space-y-4">
                <p className="text-on-surface-variant font-medium text-sm">欢迎使用叽叽记账，请登录以同步您的账单数据。</p>
                <button 
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full py-4 bg-primary text-white rounded-full font-bold shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-50"
                >
                  {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <LucideIcons.LogIn size={20} />}
                  使用 Google 账号登录
                </button>
                
                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-outline-variant" />
                  <span className="text-xs text-on-surface-variant/60 font-bold uppercase tracking-widest">或者使用</span>
                  <div className="flex-1 h-px bg-outline-variant" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setLoginMode('email')}
                    className="py-4 bg-surface-container-low text-on-surface rounded-3xl font-bold flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform border border-outline-variant"
                  >
                    <Mail size={20} className="text-primary" />
                    <span className="text-xs">邮箱登录</span>
                  </button>
                  <button 
                    onClick={() => setLoginMode('phone')}
                    className="py-4 bg-surface-container-low text-on-surface rounded-3xl font-bold flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform border border-outline-variant"
                  >
                    <Smartphone size={20} className="text-secondary" />
                    <span className="text-xs">手机登录</span>
                  </button>
                </div>
              </div>
            )}

            {(loginMode === 'email' || loginMode === 'register') && (
              <form onSubmit={loginMode === 'email' ? handleEmailLogin : handleEmailRegister} className="space-y-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <button type="button" onClick={() => setLoginMode('google')} className="p-2 hover:bg-surface-container rounded-full">
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-xl font-bold font-headline">{loginMode === 'email' ? '邮箱登录' : '创建账号'}</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant ml-1">邮箱地址</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-2xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant ml-1">密码</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-4 bg-surface-container-low rounded-2xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-primary text-white rounded-full font-bold shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-50 mt-4"
                >
                  {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                  {loginMode === 'email' ? '立即登录' : '注册账号'}
                </button>

                <p className="text-center text-sm text-on-surface-variant">
                  {loginMode === 'email' ? '还没有账号？' : '已有账号？'}
                  <button 
                    type="button" 
                    onClick={() => setLoginMode(loginMode === 'email' ? 'register' : 'email')}
                    className="text-primary font-bold ml-1"
                  >
                    {loginMode === 'email' ? '立即注册' : '返回登录'}
                  </button>
                </p>
              </form>
            )}

            {loginMode === 'phone' && (
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <button type="button" onClick={() => { setLoginMode('google'); setIsVerifying(false); }} className="p-2 hover:bg-surface-container rounded-full">
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-xl font-bold font-headline">手机登录</h2>
                </div>

                {!isVerifying ? (
                  <form onSubmit={handleSendCode} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant ml-1">手机号码</label>
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                        <input 
                          type="tel" 
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+8613800138000"
                          className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-2xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium"
                          required
                        />
                      </div>
                      <p className="text-[10px] text-on-surface-variant/60 ml-1">请包含国家代码，例如中国手机号：+86138...</p>
                    </div>

                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 bg-primary text-white rounded-full font-bold shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-50"
                    >
                      {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                      发送验证码
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyCode} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant ml-1">验证码</label>
                      <div className="relative">
                        <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                        <input 
                          type="text" 
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="输入 6 位验证码"
                          className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-2xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium text-center tracking-[0.5em] text-lg"
                          maxLength={6}
                          required
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 bg-primary text-white rounded-full font-bold shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-50"
                    >
                      {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                      确认登录
                    </button>

                    <button 
                      type="button"
                      onClick={() => setIsVerifying(false)}
                      className="w-full text-center text-sm text-primary font-bold"
                    >
                      重新发送验证码
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
          
          <p className="text-[10px] text-on-surface-variant/40 font-medium">
            登录即代表您同意我们的 <span className="underline">服务协议</span> 和 <span className="underline">隐私政策</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex justify-center items-center p-0 sm:p-4 md:p-8">
      {/* iPhone Frame Container */}
      <div className="relative w-full max-w-[440px] h-full sm:h-[952px] bg-background overflow-hidden sm:rounded-[3.5rem] sm:shadow-[0_0_0_12px_#1a1a1a,0_20px_50px_rgba(0,0,0,0.3)] flex flex-col">
        
        {/* Dynamic Island Simulation */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-9 bg-black rounded-[20px] z-[100] hidden sm:block shadow-lg" />

        {/* iOS Status Bar Simulation */}
        <div className="hidden sm:flex justify-between items-center px-10 pt-5 pb-2 z-[60] text-on-surface font-bold text-xs">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full border-2 border-current opacity-20" />
            <div className="w-4 h-4 rounded-full border-2 border-current opacity-20" />
            <div className="w-6 h-3 rounded-sm border-2 border-current opacity-20" />
          </div>
        </div>

        <Header 
          title={screenTitle} 
          onMenuClick={() => setIsSidebarOpen(true)} 
          userAvatar={user.photoURL || 'https://picsum.photos/seed/hamster_cute_user/200/200'}
          onAvatarClick={() => setActiveTab('profile')}
        />
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          onNavigate={setActiveTab} 
          userName={user.displayName || '叽叽'}
          userAvatar={user.photoURL || 'https://picsum.photos/seed/hamster_cute_user/200/200'}
        />
        
        <main className="flex-1 overflow-y-auto no-scrollbar relative">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <OverviewScreen 
                  transactions={transactions} 
                  onConfirm={confirmTransaction}
                  onEdit={handleEdit}
                  onDelete={deleteTransaction}
                  onView={handleView}
                  categories={categories}
                />
              </motion.div>
            )}
            {activeTab === 'bills' && (
              <motion.div key="bills" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <BillsScreen 
                  transactions={transactions} 
                  onEdit={handleEdit}
                  onDelete={deleteTransaction}
                  onView={handleView}
                  initialSearch={billsFilter.search}
                  initialCategory={billsFilter.category}
                  categories={categories}
                />
              </motion.div>
            )}
            {activeTab === 'analysis' && (
              <motion.div key="analysis" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <AnalysisScreen transactions={transactions} onNavigateToBills={handleNavigateToBills} categories={categories} />
              </motion.div>
            )}
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <ProfileScreen 
                  categories={categories} 
                  setCategories={setCategories} 
                  transactions={transactions}
                  userName={user.displayName || '叽叽'}
                  setUserName={handleUpdateUserName}
                  userAvatar={user.photoURL || 'https://picsum.photos/seed/hamster_cute_user/200/200'}
                  setUserAvatar={handleUpdateUserAvatar}
                  budget={budget}
                  setBudget={setBudget}
                  onLogout={handleLogout}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Floating Action Buttons - Fixed in Overview */}
        <AnimatePresence>
          {activeTab === 'overview' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-32 left-0 right-0 z-[60] flex justify-center items-start gap-8 px-6 pointer-events-none"
            >
              <div className="flex flex-col items-center gap-2 pointer-events-auto">
                <button 
                  onClick={() => setModal('manual')} 
                  className="w-16 h-16 rounded-full overflow-hidden bg-[#FFF9F2] border-2 border-[#F2994A]/20 shadow-xl active:scale-95 transition-transform duration-200 p-1"
                >
                  <img 
                    src="https://api.dicebear.com/7.x/big-smile/svg?seed=hamster_pen_writing" 
                    alt="Manual" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </button>
                <span className="text-[10px] font-headline font-bold text-[#8B5E3C] tracking-wide">手动输入</span>
              </div>
              <div className="flex flex-col items-center gap-2 pointer-events-auto">
                <button 
                  onClick={() => setModal('voice')} 
                  className="w-16 h-16 rounded-full overflow-hidden bg-[#FFF9F2] border-2 border-[#F2994A]/20 shadow-xl active:scale-95 transition-transform duration-200 p-1"
                >
                  <img 
                    src="https://api.dicebear.com/7.x/big-smile/svg?seed=hamster_mic_singing" 
                    alt="Voice" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </button>
                <span className="text-[10px] font-headline font-bold text-[#8B5E3C] tracking-wide">语音记账</span>
              </div>
              <div className="flex flex-col items-center gap-2 pointer-events-auto">
                <button 
                  onClick={() => setModal('screenshot')} 
                  className="w-16 h-16 rounded-full overflow-hidden bg-[#FFF9F2] border-2 border-[#F2994A]/20 shadow-xl active:scale-95 transition-transform duration-200 p-1"
                >
                  <img 
                    src="https://api.dicebear.com/7.x/big-smile/svg?seed=hamster_plus_sign" 
                    alt="Screenshot" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </button>
                <span className="text-[10px] font-headline font-bold text-[#8B5E3C] tracking-wide">截图导入</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

        <AnimatePresence>
          {modal === 'manual' && (
            <ManualEntryModal 
              onClose={() => {
                setModal(null);
                setEditingTransaction(null);
              }} 
              onSave={addTransaction}
              onUpdate={updateTransaction}
              initialData={editingTransaction}
              categories={categories}
            />
          )}
          {modal === 'voice' && <VoiceModal onClose={() => setModal(null)} onSave={addTransaction} categories={categories} uid={user.uid} />}
          {modal === 'screenshot' && (
            <ScreenshotModal 
              onClose={() => setModal(null)} 
              onSave={addTransaction}
              categories={categories}
            />
          )}
          {viewingTransaction && (
            <TransactionDetailModal 
              transaction={viewingTransaction}
              onClose={() => setViewingTransaction(null)}
              onEdit={handleEdit}
              onDelete={deleteTransaction}
              onUpdate={updateTransaction}
              categories={categories}
            />
          )}
        </AnimatePresence>

        {/* Home Indicator Simulation */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-on-surface/10 rounded-full z-[70] hidden sm:block" />

        <HamsterSuccessOverlay 
          open={successOverlay.open} 
          type={successOverlay.type} 
          onFinish={() => setSuccessOverlay(prev => ({ ...prev, open: false }))} 
        />
      </div>
    </div>
  );
}
