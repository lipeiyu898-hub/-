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
  Receipt,
  ReceiptText, 
  BarChart3, 
  User,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  Search,
  TrendingDown,
  TrendingUp,
  PieChart,
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
  EyeOff,
  AlertCircle,
  Download,
  Globe,
  FileText,
  ShieldCheck,
  Delete,
  RotateCcw,
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
  <header className="absolute top-0 w-full flex items-center justify-between px-6 h-28 z-50 bg-white/80 backdrop-blur-xl border-b border-outline-variant/5 pt-10">
    <div className="flex items-center w-12">
      {showMenu && (
        <button 
          onClick={onMenuClick} 
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/10 active:scale-90 transition-all shadow-sm"
        >
          <Menu className="text-on-surface-variant" size={20} />
        </button>
      )}
    </div>
    
    <div className="flex items-center justify-center gap-2 flex-1">
      {title === '叽叽记账' ? (
        <>
          <JijiLogo size="h-6" />
          <h1 className="font-cute text-primary text-xl font-bold tracking-tight">
            叽叽记账
          </h1>
        </>
      ) : (
        <h1 className="text-lg font-headline font-bold text-on-surface tracking-tight">
          {title}
        </h1>
      )}
    </div>
    
    <div className="flex items-center justify-end w-12">
      <button 
        onClick={onAvatarClick}
        className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md active:scale-90 transition-all"
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

const Sidebar = ({ isOpen, onClose, onNavigate, activeTab, userName, userAvatar, onLogout }: { isOpen: boolean, onClose: () => void, onNavigate: (tab: string) => void, activeTab: string, userName: string, userAvatar: string, onLogout: () => void }) => {
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
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[150]"
          />
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed top-0 left-0 bottom-0 w-[260px] bg-background z-[160] shadow-[10px_0_40px_rgba(0,0,0,0.04)] flex flex-col p-6"
          >
            {/* Brand Area */}
            <div className="flex flex-col gap-1 mb-10 px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/15 overflow-hidden shrink-0">
                  <JijiLogo size="h-8" />
                </div>
                <span className="font-cute text-primary text-xl font-bold tracking-tight">叽叽记账</span>
              </div>
              <p className="text-[10px] text-on-surface-variant/40 font-bold tracking-widest uppercase ml-13">AI 智能记账助手</p>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 space-y-1">
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    className={cn(
                      "w-full flex items-center gap-3.5 p-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-on-surface-variant/70 hover:bg-surface-container-low hover:text-on-surface"
                    )}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="active-pill"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full"
                      />
                    )}
                    <item.icon 
                      size={18} 
                      className={cn(
                        "transition-colors",
                        isActive ? "text-primary" : "group-hover:text-primary"
                      )} 
                    />
                    <span className={cn(
                      "font-body font-bold text-sm transition-colors",
                      isActive ? "text-primary" : "group-hover:text-on-surface"
                    )}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Account Area */}
            <div className="mt-auto pt-6 border-t border-outline-variant/10">
              <div className="flex items-center gap-3 p-2 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest ring-2 ring-background shadow-sm shrink-0">
                  <img 
                    src={userAvatar} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{userName}</p>
                  <div className="flex items-center gap-1">
                    <Sparkles size={10} className="text-secondary" />
                    <p className="text-[10px] text-on-surface-variant/50 font-bold uppercase tracking-tighter">Alita Premium</p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3.5 text-on-surface-variant/40 hover:text-error/80 font-bold text-xs rounded-2xl transition-all hover:bg-error/5 group"
              >
                <LogOut size={16} className="group-hover:text-error/60 transition-colors" />
                <span>退出登录</span>
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
  onNavigateToBills,
  categories
}: { 
  transactions: Transaction[], 
  onConfirm: (id: string) => void,
  onEdit: (t: Transaction) => void,
  onDelete: (id: string) => void,
  onView: (t: Transaction) => void,
  onNavigateToBills: () => void,
  categories: Category[]
}) => {
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = a.date instanceof Date && !isNaN(a.date.getTime()) ? a.date.getTime() : 0;
      const dateB = b.date instanceof Date && !isNaN(b.date.getTime()) ? b.date.getTime() : 0;
      return dateB - dateA;
    });
  }, [transactions]);

  const recent = sortedTransactions.filter(t => t.status === 'confirmed').slice(0, 4);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonthTransactions = sortedTransactions.filter(t => {
      const d = new Date(t.date);
      return t.status === 'confirmed' && 
             d.getMonth() === now.getMonth() && 
             d.getFullYear() === now.getFullYear();
    });

    const income = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Find top category
    const catTotals: Record<string, number> = {};
    currentMonthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
      });
    
    const topCatId = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topCatName = categories.find(c => c.id === topCatId)?.name;

    return {
      income,
      expense,
      balance: income - expense,
      count: currentMonthTransactions.length,
      topCategory: topCatName
    };
  }, [sortedTransactions, categories]);

  const statusMessage = useMemo(() => {
    if (monthlyStats.balance < 0) {
      return `本月已超支 ¥${formatAmount(Math.abs(monthlyStats.balance))}`;
    }
    if (monthlyStats.count > 0) {
      return `本月已记录 ${monthlyStats.count} 笔账单${monthlyStats.topCategory ? `，消费主要集中在${monthlyStats.topCategory}` : ''}`;
    }
    return "本月还没有账单记录，开始记第一笔吧";
  }, [monthlyStats]);

  return (
    <div className="pt-28 pb-48 px-6 max-w-2xl mx-auto space-y-8 relative overscroll-y-contain">
      {/* Monthly Overview Card */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-white p-8 border border-outline-variant/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="relative z-10 space-y-6">
          <div className="space-y-1">
            <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest opacity-60">本月结余</p>
            <div className="flex items-baseline gap-1">
              <span className={cn(
                "text-5xl font-headline font-black tracking-tighter",
                monthlyStats.balance < 0 ? "text-tertiary" : "text-primary"
              )}>
                ¥{formatAmount(monthlyStats.balance)}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-outline-variant/5">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-secondary">
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">本月收入</span>
              </div>
              <p className="text-xl font-headline font-bold text-on-surface">¥{formatAmount(monthlyStats.income)}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-tertiary">
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">本月支出</span>
              </div>
              <p className="text-xl font-headline font-bold text-on-surface">¥{formatAmount(monthlyStats.expense)}</p>
            </div>
          </div>

          {/* Lightweight Insight / Status */}
          <div className="flex items-center gap-2 pt-2">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full animate-pulse",
              monthlyStats.balance < 0 ? "bg-tertiary" : "bg-primary"
            )} />
            <p className="text-xs text-on-surface-variant font-medium">
              {statusMessage}
            </p>
          </div>
        </div>
        
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
      </section>

      {/* Recent Transactions Section */}
      <section className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">近期账单</h3>
          <button 
            onClick={onNavigateToBills}
            className="text-xs font-bold text-primary flex items-center gap-1 hover:opacity-70 transition-opacity"
          >
            查看全部
            <ChevronRight size={14} />
          </button>
        </div>
        
        <div className="space-y-3 overviewRecentBillsFade">
          {recent.length > 0 ? (
            recent.map(t => (
              <TransactionItem 
                key={t.id} 
                transaction={t} 
                onEdit={onEdit}
                onDelete={onDelete}
                onClick={onView}
              />
            ))
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-surface-container-low/30 rounded-[2rem] border border-dashed border-outline-variant/20">
              <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant/30">
                <ReceiptText size={32} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-on-surface-variant">暂无近期账单</p>
                <p className="text-xs text-on-surface-variant/60">每一笔支出都值得被记录</p>
              </div>
            </div>
          )}
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

  // Helper to get date range for current and previous period
  const dateRanges = useMemo(() => {
    const now = new Date();
    const startOfCurrent = new Date(now);
    const endOfCurrent = new Date(now);
    const startOfPrev = new Date(now);
    const endOfPrev = new Date(now);

    if (period === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startOfCurrent.setDate(diff);
      startOfCurrent.setHours(0, 0, 0, 0);
      endOfCurrent.setDate(startOfCurrent.getDate() + 6);
      endOfCurrent.setHours(23, 59, 59, 999);
      startOfPrev.setDate(startOfCurrent.getDate() - 7);
      startOfPrev.setHours(0, 0, 0, 0);
      endOfPrev.setDate(startOfPrev.getDate() + 6);
      endOfPrev.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      startOfCurrent.setDate(1);
      startOfCurrent.setHours(0, 0, 0, 0);
      endOfCurrent.setMonth(startOfCurrent.getMonth() + 1, 0);
      endOfCurrent.setHours(23, 59, 59, 999);
      startOfPrev.setMonth(startOfCurrent.getMonth() - 1, 1);
      startOfPrev.setHours(0, 0, 0, 0);
      endOfPrev.setMonth(startOfPrev.getMonth() + 1, 0);
      endOfPrev.setHours(23, 59, 59, 999);
    } else {
      startOfCurrent.setMonth(0, 1);
      startOfCurrent.setHours(0, 0, 0, 0);
      endOfCurrent.setMonth(11, 31);
      endOfCurrent.setHours(23, 59, 59, 999);
      startOfPrev.setFullYear(startOfCurrent.getFullYear() - 1, 0, 1);
      startOfPrev.setHours(0, 0, 0, 0);
      endOfPrev.setFullYear(startOfPrev.getFullYear(), 11, 31);
      endOfPrev.setHours(23, 59, 59, 999);
    }
    return { startOfCurrent, endOfCurrent, startOfPrev, endOfPrev };
  }, [period]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (t.status !== 'confirmed' || t.type !== type) return false;
      const date = new Date(t.date);
      return date >= dateRanges.startOfCurrent && date <= dateRanges.endOfCurrent;
    });
  }, [transactions, type, dateRanges]);

  const prevTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (t.status !== 'confirmed' || t.type !== type) return false;
      const date = new Date(t.date);
      return date >= dateRanges.startOfPrev && date <= dateRanges.endOfPrev;
    });
  }, [transactions, type, dateRanges]);

  const totalAmount = useMemo(() => filteredTransactions.reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
  const prevTotalAmount = useMemo(() => prevTransactions.reduce((sum, t) => sum + t.amount, 0), [prevTransactions]);
  const percentChange = useMemo(() => prevTotalAmount === 0 ? (totalAmount > 0 ? 100 : 0) : ((totalAmount - prevTotalAmount) / prevTotalAmount) * 100, [totalAmount, prevTotalAmount]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredTransactions.forEach(t => { totals[t.category] = (totals[t.category] || 0) + t.amount; });
    return totals;
  }, [filteredTransactions]);

  const sortedCategories = useMemo(() => categories.filter(c => categoryTotals[c.id]).sort((a, b) => categoryTotals[b.id] - categoryTotals[a.id]), [categories, categoryTotals]);

  const insights = useMemo(() => {
    const list: string[] = [];
    if (filteredTransactions.length === 0) return ["记录更多账单后，可查看更完整分析"];
    if (sortedCategories.length > 0) list.push(`${period === 'week' ? '本周' : period === 'month' ? '本月' : '本年'}${type === 'expense' ? '支出' : '收入'}主要集中在${sortedCategories[0].name}`);
    if (Math.abs(percentChange) > 5) list.push(`相比上${period === 'week' ? '周' : period === 'month' ? '月' : '年'}，${type === 'expense' ? '支出' : '收入'}${percentChange > 0 ? '增长' : '下降'} ${Math.abs(percentChange).toFixed(1)}%`);
    if (period !== 'year' && filteredTransactions.length > 0) {
      const dayTotals: Record<string, number> = {};
      filteredTransactions.forEach(t => { const d = new Date(t.date).toLocaleDateString(); dayTotals[d] = (dayTotals[d] || 0) + t.amount; });
      const peakDate = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0][0];
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      list.push(`${period === 'week' ? '本周' : '本月'}消费最高的一天是${dayNames[new Date(peakDate).getDay()]}`);
    }
    return list;
  }, [filteredTransactions, sortedCategories, period, type, percentChange]);

  const chartData = useMemo(() => {
    const data: { name: string, value: number }[] = [];
    if (period === 'week') {
      const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      for (let i = 0; i < 7; i++) {
        const d = new Date(dateRanges.startOfCurrent); d.setDate(d.getDate() + i);
        const val = filteredTransactions.filter(t => new Date(t.date).getDate() === d.getDate()).reduce((sum, t) => sum + t.amount, 0);
        data.push({ name: days[i], value: val });
      }
    } else if (period === 'month') {
      const daysInMonth = dateRanges.endOfCurrent.getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const val = filteredTransactions.filter(t => new Date(t.date).getDate() === i).reduce((sum, t) => sum + t.amount, 0);
        data.push({ name: `${i}日`, value: val });
      }
    } else {
      const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      for (let i = 0; i < 12; i++) {
        const val = filteredTransactions.filter(t => new Date(t.date).getMonth() === i).reduce((sum, t) => sum + t.amount, 0);
        data.push({ name: months[i], value: val });
      }
    }
    return data;
  }, [filteredTransactions, period, dateRanges]);

  const typeLabel = type === 'expense' ? '支出' : '收入';
  const periodLabel = period === 'week' ? '本周' : period === 'month' ? '本月' : '本年';

  return (
    <div className="pt-28 pb-48 px-6 w-full max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-headline font-bold text-on-surface">分析报告</h1></div>
      <div className="space-y-4">
        <div className="flex bg-surface-container-low p-1 rounded-2xl border border-outline-variant/10">
          {(['expense', 'income'] as const).map((t) => (
            <button key={t} onClick={() => setType(t)} className={cn("flex-1 py-2.5 rounded-xl text-sm font-bold transition-all relative", type === t ? "text-on-primary" : "text-on-surface-variant hover:bg-surface-container-highest/50")}>
              {type === t && <motion.div layoutId="type-bg" className="absolute inset-0 bg-primary rounded-xl shadow-sm" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
              <span className="relative z-10">{t === 'expense' ? '支出' : '收入'}</span>
            </button>
          ))}
        </div>
        <div className="flex bg-surface-container-low p-1 rounded-2xl border border-outline-variant/10">
          {(['week', 'month', 'year'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn("flex-1 py-2 rounded-xl text-xs font-bold transition-all relative", period === p ? "text-primary" : "text-on-surface-variant hover:bg-surface-container-highest/50")}>
              {period === p && <motion.div layoutId="period-bg" className="absolute inset-0 bg-white rounded-xl shadow-sm border border-outline-variant/20" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
              <span className="relative z-10">{p === 'week' ? '按周' : p === 'month' ? '按月' : '按年'}</span>
            </button>
          ))}
        </div>
      </div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-white rounded-[2.5rem] p-8 space-y-6 border border-outline-variant/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
      >
        <div className="space-y-2">
          <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest">{periodLabel}{typeLabel}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-headline font-black tracking-tighter text-on-surface">¥{formatAmount(totalAmount)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold", 
              percentChange > 0 ? "bg-error/10 text-error" : "bg-secondary/10 text-secondary"
            )}>
              {percentChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>较上{period === 'week' ? '周' : period === 'month' ? '月' : '年'}{percentChange > 0 ? '增长' : '减少'} {Math.abs(percentChange).toFixed(1)}%</span>
            </div>
          </div>
        </div>
        
        <div className="h-px bg-outline-variant/5" />
        
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles size={16} />
            <h3 className="text-sm font-bold">智能分析</h3>
          </div>
          <div className="space-y-3">
            {insights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-3 group">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/30 mt-1.5 group-first:bg-primary transition-colors" />
                <p className="text-sm font-medium text-on-surface/80 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2"><h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">{typeLabel}趋势</h3></div>
        <div className="bg-white rounded-[2rem] p-6 border border-outline-variant/10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] h-64">
          {totalAmount > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  interval={period === 'month' ? 6 : 0} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--color-on-surface-variant)', opacity: 0.5 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--color-on-surface-variant)', opacity: 0.5 }} 
                  tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value} 
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--color-primary)" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  animationDuration={1500} 
                />
                <Tooltip 
                  cursor={{ stroke: 'var(--color-outline-variant)', strokeWidth: 1, strokeDasharray: '4 4' }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-surface-container-highest shadow-xl border border-outline-variant/20 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-on-surface-variant mb-1">{payload[0].payload.name}</p>
                          <p className="text-sm font-black text-on-surface">¥{formatAmount(payload[0].value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-30">
              <BarChart3 size={40} />
              <p className="text-xs font-medium">暂无足够数据生成趋势</p>
            </div>
          )}
        </div>
      </section>
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2"><h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">{typeLabel}分类</h3></div>
        <div className="space-y-3">
          {sortedCategories.length > 0 ? (
            sortedCategories.map((item) => {
              const amount = categoryTotals[item.id];
              const progress = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
              const count = filteredTransactions.filter(t => t.category === item.id).length;
              return (
                <motion.div 
                  key={item.id} 
                  whileTap={{ scale: 0.98 }} 
                  onClick={() => onNavigateToBills(item.name)} 
                  className="bg-white p-5 rounded-[1.5rem] border border-outline-variant/10 flex items-center gap-4 cursor-pointer group shadow-[0_4px_20px_rgb(0,0,0,0.02)]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <CategoryIcon icon={item.icon as any} size={24} className="text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-on-surface">{item.name}</p>
                        <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">{count} 笔交易</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-on-surface">¥{formatAmount(amount)}</p>
                        <p className="text-[10px] font-bold text-primary/60">{progress.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${progress}%` }} 
                        transition={{ duration: 1, ease: "easeOut" }} 
                        className="h-full bg-primary rounded-full" 
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="bg-surface-container-low rounded-3xl p-12 text-center space-y-4 border border-dashed border-outline-variant/30"><div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto text-on-surface-variant/20"><PieChart size={32} /></div><p className="text-sm font-medium text-on-surface-variant/60">此阶段暂无{typeLabel}记录</p></div>
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
  categories,
  budget = 15000
}: { 
  transactions: Transaction[],
  onEdit: (t: Transaction) => void,
  onDelete: (id: string) => void,
  onView: (t: Transaction) => void,
  initialSearch?: string,
  initialCategory?: string,
  categories: Category[],
  budget?: number
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeSearch, setActiveSearch] = useState(initialSearch);
  const [selectedTag, setSelectedTag] = useState(initialCategory);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showFutureWarning, setShowFutureWarning] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);

  // Helper to get start and end of a week
  const getWeekRange = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  // Helper to check if a date is in the future
  const isFuture = (date: Date, mode: 'day' | 'week' | 'month' | 'year') => {
    const now = new Date();
    if (mode === 'year') {
      return date.getFullYear() > now.getFullYear();
    }
    if (mode === 'month') {
      return date.getFullYear() > now.getFullYear() || 
             (date.getFullYear() === now.getFullYear() && date.getMonth() > now.getMonth());
    }
    if (mode === 'week') {
      const { start } = getWeekRange(date);
      const { start: nowStart } = getWeekRange(now);
      return start > nowStart;
    }
    // day mode
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const n = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return d > n;
  };

  const handleNavigate = (offset: number) => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'year') {
      newDate.setFullYear(selectedDate.getFullYear() + offset);
    } else if (viewMode === 'month') {
      newDate.setMonth(selectedDate.getMonth() + offset);
    } else if (viewMode === 'week') {
      newDate.setDate(selectedDate.getDate() + (offset * 7));
    } else {
      newDate.setDate(selectedDate.getDate() + offset);
    }

    if (isFuture(newDate, viewMode)) {
      setShowFutureWarning(true);
      setTimeout(() => setShowFutureWarning(false), 2000);
      return;
    }

    setSelectedDate(newDate);
  };

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
      if (t.status !== 'confirmed') return false;
      
      const tDate = new Date(t.date);
      const now = new Date();
      
      // Time Filter
      let matchesTime = true;
      if (viewMode === 'day') {
        matchesTime = tDate.toDateString() === selectedDate.toDateString();
      } else if (viewMode === 'week') {
        const { start, end } = getWeekRange(selectedDate);
        matchesTime = tDate >= start && tDate <= end;
      } else if (viewMode === 'month') {
        matchesTime = tDate.getMonth() === selectedDate.getMonth() && 
                      tDate.getFullYear() === selectedDate.getFullYear();
      } else if (viewMode === 'year') {
        matchesTime = tDate.getFullYear() === selectedDate.getFullYear();
      }

      // Search Filter
      const matchesSearch = activeSearch === '' || 
        t.title.toLowerCase().includes(activeSearch.toLowerCase()) ||
        (t.note && t.note.toLowerCase().includes(activeSearch.toLowerCase()));
      
      // Category Filter
      const matchesTag = selectedTag === '全部' || 
        categories.find(c => c.id === t.category)?.name === selectedTag;

      return matchesTime && matchesSearch && matchesTag;
    }).sort((a, b) => {
      const dateA = a.date instanceof Date && !isNaN(a.date.getTime()) ? a.date.getTime() : 0;
      const dateB = b.date instanceof Date && !isNaN(b.date.getTime()) ? b.date.getTime() : 0;
      return dateB - dateA;
    });
  }, [transactions, activeSearch, selectedTag, categories, viewMode, selectedDate]);

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense };
  }, [filteredTransactions]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach(t => {
      let dateStr = '';
      const d = new Date(t.date);
      
      if (viewMode === 'year') {
        dateStr = d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
      } else {
        dateStr = d.toLocaleDateString('zh-CN', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          weekday: viewMode === 'day' ? undefined : 'long'
        });
      }
      
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(t);
    });
    return groups;
  }, [filteredTransactions, viewMode]);

  const handleSearch = () => {
    setActiveSearch(searchQuery);
  };

  const tags = ['全部', ...categories.map(c => c.name)];

  const getTitle = () => {
    const now = new Date();
    if (viewMode === 'day') {
      const isToday = selectedDate.toDateString() === now.toDateString();
      return isToday ? '今日账单' : `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日账单`;
    }
    if (viewMode === 'week') {
      const { start, end } = getWeekRange(selectedDate);
      const { start: nowStart } = getWeekRange(now);
      if (start.getTime() === nowStart.getTime()) return '本周账单';
      return `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日账单`;
    }
    if (viewMode === 'month') {
      const isThisMonth = selectedDate.getMonth() === now.getMonth() && selectedDate.getFullYear() === now.getFullYear();
      return isThisMonth ? '本月账单' : `${selectedDate.getMonth() + 1}月账单`;
    }
    if (viewMode === 'year') {
      const isThisYear = selectedDate.getFullYear() === now.getFullYear();
      return isThisYear ? '本年账单' : `${selectedDate.getFullYear()}年账单`;
    }
    return '账单明细';
  };

  const getSubtitle = () => {
    if (viewMode === 'day') {
      return selectedDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    if (viewMode === 'week') {
      const { start, end } = getWeekRange(selectedDate);
      return `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`;
    }
    if (viewMode === 'month') {
      return `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月`;
    }
    return `${selectedDate.getFullYear()}年全年账单`;
  };

  const getStatsLabel = () => {
    if (viewMode === 'day') return '今日';
    if (viewMode === 'week') return '本周';
    if (viewMode === 'month') return '本月';
    return '本年';
  };

  const getTimeNavigatorLabel = () => {
    if (viewMode === 'day') {
      return `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日`;
    }
    if (viewMode === 'week') {
      const { start, end } = getWeekRange(selectedDate);
      return `${start.getMonth() + 1}.${start.getDate()} - ${end.getMonth() + 1}.${end.getDate()}`;
    }
    if (viewMode === 'month') {
      return `${selectedDate.getMonth() + 1}月`;
    }
    return `${selectedDate.getFullYear()}年`;
  };

  return (
    <div className="pt-28 pb-48 px-6 max-w-2xl mx-auto space-y-10 relative">
      {/* Future Date Warning Toast */}
      <AnimatePresence>
        {showFutureWarning && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-24 left-1/2 z-[100] bg-error/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-2 border border-white/20"
          >
            <AlertCircle size={18} />
            未来时间暂不可查看
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Page Header */}
      <div className="space-y-4 px-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight transition-all duration-500">
              {getTitle()}
            </h2>
            <p className="text-xs text-on-surface-variant/60 font-medium tracking-wide">
              {getSubtitle()}
            </p>
          </div>
          <button 
            onClick={() => setShowSearchOverlay(true)}
            className="p-3 bg-surface-container-low rounded-2xl border border-outline-variant/10 shadow-sm text-primary hover:bg-surface-container-highest transition-all active:scale-90"
          >
            <Search size={24} />
          </button>
        </div>
      </div>

      {/* 2. Stats Cards */}
      <section className="bg-surface-container-low rounded-[2.5rem] p-8 space-y-6 shadow-sm border border-outline-variant/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="text-center space-y-1 relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">{getStatsLabel()}总支出</p>
          <h2 className="text-5xl font-headline font-black tracking-tighter text-primary">¥{formatAmount(stats.expense)}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant/20 relative z-10">
          <div className="text-center space-y-1 border-r border-outline-variant/20">
            <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">{getStatsLabel()}收入</p>
            <p className="text-xl font-bold text-secondary">¥{formatAmount(stats.income)}</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">预算剩余</p>
            <p className="text-xl font-bold text-on-surface">¥{formatAmount(budget - stats.expense)}</p>
          </div>
        </div>
      </section>

      {/* 3. Combined Time Navigator & Range Selector */}
      <div className="bg-surface-container-low rounded-[2rem] border border-outline-variant/10 shadow-sm overflow-hidden py-1">
        <div className="flex items-center justify-between p-1">
          <button 
            onClick={() => handleNavigate(-1)} 
            className="p-3 hover:bg-surface-container-highest rounded-xl transition-all active:scale-90 text-primary"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-sm font-black text-on-surface tracking-tight">
              {getTimeNavigatorLabel()}
            </span>
          </div>
          <button 
            onClick={() => handleNavigate(1)} 
            className="p-3 hover:bg-surface-container-highest rounded-xl transition-all active:scale-90 text-primary"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="h-px bg-outline-variant/5 mx-4" />

        <div className="p-1">
          <div className="flex w-full">
            {(['day', 'week', 'month', 'year'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setViewMode(mode);
                  setSelectedDate(new Date());
                }}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-[1.5rem] text-[11px] font-bold transition-all duration-300 relative",
                  viewMode === mode 
                    ? "text-primary z-10" 
                    : "text-on-surface-variant/40 hover:text-on-surface hover:bg-surface-container-highest/30"
                )}
              >
                {mode === 'day' ? '按天' : mode === 'week' ? '按周' : mode === 'month' ? '按月' : '按年'}
                {viewMode === mode && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white rounded-[1.5rem] -z-10 shadow-sm border border-outline-variant/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Filters */}
      <div className="space-y-6">
        {/* Category Filters */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
          {tags.map((tag) => (
            <button 
              key={tag} 
              onClick={() => setSelectedTag(tag)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border",
                selectedTag === tag 
                  ? "bg-secondary text-white border-secondary shadow-md scale-105" 
                  : "bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:border-secondary/50"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Transaction List */}
      <section className="space-y-8">
        {Object.keys(groupedTransactions).length > 0 ? (
          Object.entries(groupedTransactions).map(([date, items]) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="h-px flex-1 bg-outline-variant/30" />
                <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-[0.2em]">{date}</span>
                <div className="h-px flex-1 bg-outline-variant/30" />
              </div>
              <div className="space-y-3">
                {items.map(t => (
                  <TransactionItem 
                    key={t.id} 
                    transaction={t} 
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onClick={onView}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto text-on-surface-variant/20">
              <Receipt size={40} />
            </div>
            <div className="space-y-1">
              <p className="text-on-surface font-bold">
                {isFuture(selectedDate, viewMode) ? '未来时间暂不可查看' : '这一阶段还没有账单记录'}
              </p>
              <p className="text-xs text-on-surface-variant/60">
                {isFuture(selectedDate, viewMode) ? '还没到这个时间哦' : '去记一笔账单吧，让生活更有条理'}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Search Overlay */}
      <AnimatePresence>
        {showSearchOverlay && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[200] bg-background flex flex-col"
          >
            <div className="pt-12 pb-6 px-6 flex items-center gap-4 border-b border-outline-variant/10">
              <button 
                onClick={() => {
                  setShowSearchOverlay(false);
                  setSearchQuery('');
                  setActiveSearch('');
                }}
                className="p-2 hover:bg-surface-container-highest rounded-full transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="relative flex-1">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="搜索账单、商户或类别" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full h-12 pl-12 pr-4 bg-surface-container-low border-none rounded-full font-medium focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
              {activeSearch ? (
                Object.keys(groupedTransactions).length > 0 ? (
                  Object.entries(groupedTransactions).map(([date, items]) => (
                    <div key={date} className="space-y-3">
                      <div className="flex items-center gap-3 px-2">
                        <div className="h-px flex-1 bg-outline-variant/30" />
                        <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-[0.2em]">{date}</span>
                        <div className="h-px flex-1 bg-outline-variant/30" />
                      </div>
                      <div className="space-y-3">
                        {items.map(t => (
                          <TransactionItem 
                            key={t.id} 
                            transaction={t} 
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onClick={(trans) => {
                              onView(trans);
                              setShowSearchOverlay(false);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto text-on-surface-variant/20">
                      <Search size={40} />
                    </div>
                    <p className="text-on-surface font-bold">未找到相关账单</p>
                  </div>
                )
              ) : (
                <div className="py-20 text-center space-y-4 opacity-40">
                  <Search size={60} className="mx-auto" />
                  <p className="text-sm font-medium">输入关键词搜索账单</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
  onLogout,
  onSubPageToggle
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
  onLogout: () => void,
  onSubPageToggle: (active: boolean) => void
}) => {
  const [activeSubPage, setActiveSubPage] = useState<string | null>(null);

  useEffect(() => {
    onSubPageToggle(!!activeSubPage);
  }, [activeSubPage, onSubPageToggle]);

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
        <div className="space-y-10">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">我的分类</h3>
              <button 
                onClick={() => setShowAddCategory(true)}
                className="text-primary font-bold text-xs flex items-center gap-1 hover:opacity-70 transition-opacity"
              >
                <Plus size={14} strokeWidth={3} />
                添加分类
              </button>
            </div>
            <div className="bg-surface-container-low rounded-[2.5rem] p-8 border border-outline-variant/10">
              <div className="grid grid-cols-4 gap-x-4 gap-y-8">
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
                    className="flex flex-col items-center gap-3 relative group"
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm",
                      cat.color,
                      isDeleting === cat.id ? "scale-90 ring-4 ring-error/20" : "hover:scale-105 active:scale-95"
                    )}>
                      <CategoryIcon icon={cat.icon as any} size={24} />
                      {isDeleting === cat.id && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCategories(prev => prev.filter(c => c.id !== cat.id));
                            setIsDeleting(null);
                          }}
                          className="absolute -top-2 -right-2 bg-error text-white rounded-full p-1.5 shadow-lg z-10 border-2 border-white animate-bounce"
                        >
                          <X size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-on-surface-variant text-center leading-tight tracking-wide">{cat.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showAddCategory && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-x-6 bottom-10 z-[100] bg-white rounded-[2.5rem] p-8 space-y-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-outline-variant/10"
              >
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="font-headline font-bold text-lg">添加新分类</h3>
                    <p className="text-xs text-on-surface-variant/60 font-medium">选择一个图标来创建您的分类</p>
                  </div>
                  <button onClick={() => setShowAddCategory(false)} className="text-on-surface-variant/40 p-2 hover:bg-surface-container-highest rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-x-4 gap-y-8 max-h-[40vh] overflow-y-auto p-2 no-scrollbar">
                  {AVAILABLE_CATEGORIES.filter(ac => !categories.find(c => c.id === ac.id)).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setCategories(prev => [...prev, cat]);
                        setShowAddCategory(false);
                      }}
                      className="flex flex-col items-center gap-3 hover:scale-105 active:scale-95 transition-all group"
                    >
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all group-hover:shadow-md", cat.color)}>
                        <CategoryIcon icon={cat.icon as any} size={24} />
                      </div>
                      <span className="text-[10px] font-bold text-on-surface-variant tracking-wide">{cat.name}</span>
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
        <div className="space-y-10">
          <div className="space-y-4">
            <h3 className="px-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">识别语言</h3>
            <div className="bg-surface-container-low rounded-[2rem] p-4 border border-outline-variant/10 grid grid-cols-2 gap-2">
              {['普通话', '粤语', '英语', '自动识别'].map((lang) => (
                <button 
                  key={lang}
                  onClick={() => setVoiceLang(lang)}
                  className={cn(
                    "py-4 rounded-2xl text-sm font-bold transition-all active:scale-95 border",
                    voiceLang === lang 
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                      : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/10 hover:border-primary/30"
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
            <p className="px-4 text-[10px] text-on-surface-variant/50 font-medium leading-relaxed">
              选择您最常用的语言可以显著提升识别准确率。自动识别模式在多语言环境下表现更佳。
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="px-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">识别行为</h3>
            <div className="bg-surface-container-low rounded-[2rem] overflow-hidden border border-outline-variant/10">
              <div 
                onClick={() => setAutoConfirm(!autoConfirm)}
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-surface-container-highest transition-colors"
              >
                <div className="space-y-1">
                  <span className="text-sm font-bold block text-on-surface">自动确认识别结果</span>
                  <span className="text-[10px] text-on-surface-variant/50 font-medium">识别完成后无需手动点击确认</span>
                </div>
                <div className={cn(
                  "w-12 h-7 rounded-full relative transition-all duration-300 p-1",
                  autoConfirm ? "bg-secondary" : "bg-surface-container-highest"
                )}>
                  <div className={cn(
                    "w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300",
                    autoConfirm ? "translate-x-5" : "translate-x-0"
                  )} />
                </div>
              </div>
              <div className="mx-6 h-px bg-outline-variant/10" />
              <div 
                onClick={() => setAutoSave(!autoSave)}
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-surface-container-highest transition-colors"
              >
                <div className="space-y-1">
                  <span className="text-sm font-bold block text-on-surface">识别后自动保存</span>
                  <span className="text-[10px] text-on-surface-variant/50 font-medium">确认结果后直接存入账单列表</span>
                </div>
                <div className={cn(
                  "w-12 h-7 rounded-full relative transition-all duration-300 p-1",
                  autoSave ? "bg-secondary" : "bg-surface-container-highest"
                )}>
                  <div className={cn(
                    "w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300",
                    autoSave ? "translate-x-5" : "translate-x-0"
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
        <div className="space-y-10">
          <div className="space-y-4">
            <h3 className="px-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">导出范围</h3>
            <div className="bg-surface-container-low rounded-[2rem] p-4 border border-outline-variant/10 grid grid-cols-3 gap-2">
              {['本月', '上月', '全部'].map((range) => (
                <button 
                  key={range}
                  onClick={() => setExportRange(range)}
                  className={cn(
                    "py-4 rounded-2xl text-xs font-bold transition-all active:scale-95 border",
                    exportRange === range 
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                      : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/10 hover:border-primary/30"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="px-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">导出格式</h3>
            <div className="bg-surface-container-low rounded-[2rem] overflow-hidden border border-outline-variant/10">
              {[
                { id: 'Excel (.xlsx)', desc: '最适合在电脑端进行深度财务分析' },
                { id: 'PDF (.pdf)', desc: '适合打印或作为正式财务凭证' },
                { id: 'CSV (.csv)', desc: '通用数据格式，适合导入其他软件' }
              ].map((format, idx) => (
                <React.Fragment key={format.id}>
                  <div 
                    onClick={() => setExportFormat(format.id)}
                    className="flex items-center justify-between p-6 cursor-pointer hover:bg-surface-container-highest transition-colors"
                  >
                    <div className="space-y-1">
                      <span className="text-sm font-bold block text-on-surface">{format.id}</span>
                      <span className="text-[10px] text-on-surface-variant/50 font-medium">{format.desc}</span>
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      exportFormat === format.id ? "border-primary bg-primary/5" : "border-outline-variant"
                    )}>
                      {exportFormat === format.id && <div className="w-3 h-3 bg-primary rounded-full shadow-sm" />}
                    </div>
                  </div>
                  {idx < 2 && <div className="mx-6 h-px bg-outline-variant/10" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className={cn(
                "w-full py-5 bg-primary text-white rounded-[2rem] font-black text-sm shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3",
                isExporting && "opacity-70 cursor-not-allowed"
              )}
            >
              {isExporting ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  正在生成文件...
                </>
              ) : (
                <>
                  <Download size={20} strokeWidth={3} />
                  立即导出数据
                </>
              )}
            </button>
            <p className="text-center mt-4 text-[10px] text-on-surface-variant/40 font-medium">
              导出完成后，文件将自动保存至您的设备。
            </p>
          </div>
        </div>
      )
    },
    'about': {
      title: '关于我们',
      component: (
        <div className="space-y-12">
          <div className="flex flex-col items-center gap-6 pt-8">
            <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white flex items-center justify-center p-4">
              <JijiLogo size="h-24 w-24" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-headline font-black text-primary tracking-tight">Alita 叽叽记账</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">Version 2.4.0 (Build 1024)</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-surface-container-low rounded-[2.5rem] p-8 border border-outline-variant/10">
              <p className="text-sm leading-relaxed text-on-surface-variant font-medium text-center">
                叽叽记账是一款基于 AI 语音识别技术的智能财务管理工具。我们致力于通过最自然的方式，帮助用户轻松记录每一笔开支，实现财务自由。
              </p>
            </div>

            <div className="bg-surface-container-low rounded-[2rem] overflow-hidden border border-outline-variant/10">
              <SettingsRow 
                icon={Globe} 
                label="官方网站" 
                sub="www.alita-app.com" 
                onClick={() => {}} 
                iconColor="text-primary"
                iconBg="bg-primary/5"
              />
              <div className="mx-6 h-px bg-outline-variant/10" />
              <SettingsRow 
                icon={FileText} 
                label="用户协议" 
                sub="查看详细的服务条款" 
                onClick={() => setActiveSubPage('user-agreement')} 
                iconColor="text-secondary"
                iconBg="bg-secondary/5"
              />
              <div className="mx-6 h-px bg-outline-variant/10" />
              <SettingsRow 
                icon={ShieldCheck} 
                label="隐私政策" 
                sub="了解我们如何保护您的数据" 
                onClick={() => setActiveSubPage('privacy-policy')} 
                iconColor="text-tertiary"
                iconBg="bg-tertiary/5"
              />
            </div>
          </div>

          <div className="text-center space-y-1">
            <p className="text-[10px] text-on-surface-variant/30 font-bold uppercase tracking-widest">
              Made with ❤️ by Alita Tech
            </p>
            <p className="text-[10px] text-on-surface-variant/20 font-medium">
              © 2026 Alita Tech. All Rights Reserved.
            </p>
          </div>
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
      <div className="min-h-screen bg-surface-container-lowest flex flex-col">
        {/* iOS Style Unified Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-outline-variant/5 px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => setActiveSubPage(null)}
            className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform text-on-surface"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="font-headline font-bold text-base absolute left-1/2 -translate-x-1/2">
            {subPages[activeSubPage].title}
          </h2>
          <div className="w-10" /> {/* Spacer for symmetry */}
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-8 max-w-2xl mx-auto w-full">
          {subPages[activeSubPage].component}
        </main>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-48 px-6 max-w-2xl mx-auto space-y-10">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      
      {/* User Information Summary - Profile Summary Style */}
      <section className="flex items-center gap-5 px-2">
        <div className="relative group">
          <div 
            onClick={handleAvatarClick}
            className="w-20 h-20 rounded-full overflow-hidden bg-surface-container-highest ring-2 ring-primary/10 shadow-sm cursor-pointer active:scale-95 transition-transform"
          >
            <img 
              src={userAvatar} 
              alt="User" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1 border-2 border-white shadow-sm">
            <Sparkles size={12} fill="currentColor" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 
              onClick={handleNameClick}
              className="font-headline font-bold text-2xl tracking-tight cursor-pointer hover:text-primary transition-colors"
            >
              {userName}
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-md uppercase tracking-wider">Premium</span>
            <span className="text-xs text-on-surface-variant/60 font-medium">ID: {auth.currentUser?.uid.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
      </section>

      {/* Core Statistics - Summary Metrics Style */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-low p-5 rounded-3xl border border-outline-variant/10 flex flex-col items-center justify-center space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">记账天数</span>
          <p className="text-2xl font-headline font-black text-on-surface">{stats.days}</p>
        </div>
        <div className="bg-surface-container-low p-5 rounded-3xl border border-outline-variant/10 flex flex-col items-center justify-center space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">本月结余</span>
          <p className={cn(
            "text-2xl font-headline font-black",
            stats.balance >= 0 ? "text-secondary" : "text-error"
          )}>
            ¥{formatAmount(stats.balance)}
          </p>
        </div>
      </div>

      {/* Financial Health Insight Card */}
      <section className="bg-white rounded-[2.5rem] p-8 border border-outline-variant/10 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h3 className="font-headline font-bold text-lg text-on-surface">财务健康洞察</h3>
            <p className="text-xs text-on-surface-variant/60 font-medium">基于本月预算执行情况</p>
          </div>
          <div className={cn(
            "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider",
            stats.health > 70 ? "bg-secondary/10 text-secondary" : 
            stats.health > 30 ? "bg-primary/10 text-primary" : 
            "bg-error/10 text-error"
          )}>
            {stats.health > 70 ? '执行良好' : stats.health > 30 ? '节奏稳定' : '预算预警'}
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle className="text-surface-container-highest" cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3.5" />
              <circle 
                className={cn(
                  "transition-all duration-1000 ease-out",
                  stats.health > 70 ? "text-secondary" : stats.health > 30 ? "text-primary" : "text-error"
                )} 
                cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3.5" 
                strokeDasharray="100" 
                strokeDashoffset={100 - stats.health} 
                strokeLinecap="round" 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-on-surface-variant/40 uppercase tracking-tighter">评分</span>
              <span className="text-3xl font-headline font-black leading-none">{stats.health}</span>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant/60 font-medium">当前预算</span>
                <button 
                  onClick={() => {
                    setTempBudget(budget.toString());
                    setIsEditingBudget(true);
                  }}
                  className="text-primary font-bold hover:underline"
                >
                  ¥{formatAmount(budget)}
                </button>
              </div>
              {isEditingBudget && (
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="number" 
                    value={tempBudget}
                    onChange={(e) => setTempBudget(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-surface-container-low border border-outline-variant rounded-xl outline-none focus:border-primary"
                    autoFocus
                  />
                  <button onClick={handleBudgetSave} className="p-2 text-secondary"><Check size={20} /></button>
                  <button onClick={handleBudgetCancel} className="p-2 text-on-surface-variant"><X size={20} /></button>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/5">
              <p className="text-xs font-medium leading-relaxed text-on-surface-variant">
                {stats.days === 0 ? (
                  "开始记录第一笔账单，开启您的财务健康之旅。"
                ) : stats.health > 0 ? (
                  <>支出节奏稳定，预计本月可节省 <span className="text-secondary font-black">¥{formatAmount(stats.estimatedSavings)}</span></>
                ) : (
                  "您的支出已超出预算，建议立即优化消费结构。"
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Settings List - Grouped Rows Style */}
      <div className="space-y-8">
        <div className="space-y-3">
          <h4 className="px-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">记账设置</h4>
          <div className="bg-surface-container-low rounded-[2rem] overflow-hidden border border-outline-variant/10">
            <SettingsRow 
              icon={LayoutGrid} 
              label="分类设置" 
              sub="自定义您的记账类别" 
              onClick={() => setActiveSubPage('category')} 
              iconColor="text-primary"
              iconBg="bg-primary/10"
            />
            <div className="mx-6 h-px bg-outline-variant/10" />
            <SettingsRow 
              icon={Mic} 
              label="语音偏好" 
              sub="设置您的语音识别习惯" 
              onClick={() => setActiveSubPage('voice')} 
              iconColor="text-secondary"
              iconBg="bg-secondary/10"
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="px-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">数据管理</h4>
          <div className="bg-surface-container-low rounded-[2rem] overflow-hidden border border-outline-variant/10">
            <SettingsRow 
              icon={Share2} 
              label="数据导出" 
              sub="导出为 Excel 或 PDF" 
              onClick={() => setActiveSubPage('export')} 
              iconColor="text-tertiary"
              iconBg="bg-tertiary/10"
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="px-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">关于与支持</h4>
          <div className="bg-surface-container-low rounded-[2rem] overflow-hidden border border-outline-variant/10">
            <SettingsRow 
              icon={HelpCircle} 
              label="关于我们" 
              sub="了解 Alita 的故事" 
              onClick={() => setActiveSubPage('about')} 
              iconColor="text-on-surface-variant"
              iconBg="bg-surface-container-highest"
            />
          </div>
        </div>

        <div className="pt-4">
          <button 
            onClick={onLogout}
            className="w-full py-5 bg-error/5 text-error rounded-[2rem] font-black text-sm flex items-center justify-center gap-3 active:scale-95 transition-transform border border-error/10"
          >
            <LogOut size={20} />
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingsRow = ({ icon: Icon, label, sub, onClick, iconColor, iconBg }: any) => (
  <div 
    onClick={onClick}
    className="flex items-center justify-between p-5 hover:bg-surface-container-highest transition-colors cursor-pointer group"
  >
    <div className="flex items-center gap-4">
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", iconBg, iconColor)}>
        <Icon size={20} />
      </div>
      <div>
        <span className="font-headline font-bold block text-sm text-on-surface">{label}</span>
        <span className="text-[10px] text-on-surface-variant/50 font-medium tracking-wide">{sub}</span>
      </div>
    </div>
    <ChevronRight className="text-outline-variant group-hover:text-primary transition-all group-hover:translate-x-1" size={18} />
  </div>
);

// --- Modals ---

const NumericKeypad = ({ onInput, onDelete, onDone, className }: { 
  onInput: (val: string) => void, 
  onDelete: () => void, 
  onDone: () => void,
  className?: string
}) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'delete'];
  return (
    <div className={cn("grid grid-cols-3 gap-2 p-4 bg-surface-container-low/20 rounded-[2.5rem]", className)}>
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => {
            if (key === 'delete') onDelete();
            else onInput(key);
          }}
          className={cn(
            "h-12 rounded-2xl flex items-center justify-center text-xl font-bold transition-all active:scale-90",
            key === 'delete' ? "text-on-surface-variant/40" : "text-on-surface hover:bg-surface-container-highest"
          )}
        >
          {key === 'delete' ? <Delete size={20} /> : key}
        </button>
      ))}
    </div>
  );
};

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
  const [showKeypad, setShowKeypad] = useState(true);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
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

  const handleKeypadInput = (val: string) => {
    if (val === '.') {
      if (amount.includes('.')) return;
      if (amount === '') {
        setAmount('0.');
        return;
      }
    }
    if (amount === '0' && val !== '.') {
      setAmount(val);
    } else {
      // Limit to 2 decimal places
      if (amount.includes('.') && amount.split('.')[1].length >= 2) return;
      // Limit total length
      if (amount.length >= 10) return;
      setAmount(prev => prev + val);
    }
  };

  const handleKeypadDelete = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 250 }}
      className="absolute inset-0 z-[100] bg-background flex flex-col"
    >
      <header className="flex items-center justify-between px-6 h-14 shrink-0">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant active:scale-90 transition-transform">
          <X size={18} />
        </button>
        <h1 className="font-headline font-bold text-base text-on-surface/80">记一笔</h1>
        <div className="w-9" />
      </header>

      <main className="flex-1 px-6 overflow-y-auto no-scrollbar flex flex-col">
        {/* Type Switcher - iOS Segmented Control Style */}
        <div className="flex justify-center mt-1 mb-6">
          <div className="bg-surface-container-low p-1 rounded-2xl flex w-full max-w-[220px] relative">
            <motion.div 
              layoutId="type-active-bg"
              className="absolute inset-1 bg-white rounded-xl shadow-sm z-0"
              initial={false}
              animate={{ x: type === 'expense' ? 0 : '100%' }}
              transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
              style={{ width: 'calc(50% - 4px)' }}
            />
            <button 
              onClick={() => setType('expense')}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs font-bold transition-colors relative z-10",
                type === 'expense' ? "text-primary" : "text-on-surface-variant/40"
              )}
            >
              支出
            </button>
            <button 
              onClick={() => setType('income')}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs font-bold transition-colors relative z-10",
                type === 'income' ? "text-primary" : "text-on-surface-variant/40"
              )}
            >
              收入
            </button>
          </div>
        </div>

        {/* Amount Input Section - Absolute Center Focus */}
        <section className="text-center mb-8 space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-on-surface-variant/20">输入金额</p>
          <div 
            onClick={() => setShowKeypad(true)}
            className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform py-2"
          >
            <span className={cn(
              "text-6xl font-headline font-black tracking-tighter transition-colors",
              amount ? "text-on-surface" : "text-on-surface-variant/30"
            )}>
              ¥{amount || '0.00'}
            </span>
            {showKeypad && (
              <motion.div 
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-0.5 h-12 bg-primary ml-0.5 rounded-full"
              />
            )}
          </div>
        </section>

        {/* Categories Grid - Refined and Compact */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/20">选择分类</h3>
          </div>
          <div className="grid grid-cols-4 gap-x-3 gap-y-4 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar pb-1">
            {categories.map((cat) => (
              <div key={cat.id} className="flex flex-col items-center gap-2">
                <button 
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 relative", 
                    selectedCategory === cat.id 
                      ? "bg-primary/5 text-primary ring-1 ring-primary/10" 
                      : cn(cat.color, "hover:bg-surface-container-highest")
                  )}
                >
                  <CategoryIcon 
                    icon={cat.icon as any} 
                    size={20} 
                    className={selectedCategory === cat.id ? "text-primary" : "text-on-surface-variant/80"} 
                  />
                  {selectedCategory === cat.id && (
                    <motion.div 
                      layoutId="cat-active-dot"
                      className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center shadow-sm z-20"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <Check size={10} strokeWidth={4.5} />
                    </motion.div>
                  )}
                </button>
                <span className={cn(
                  "text-[9px] font-bold tracking-tight transition-colors text-center leading-tight",
                  selectedCategory === cat.id ? "text-primary" : "text-on-surface-variant/40"
                )}>
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Unified Info Module - Date & Note */}
        <section className="space-y-3 mb-6">
          <div className="bg-surface-container-low/20 rounded-[2rem] overflow-hidden border border-outline-variant/5">
            <div 
              onClick={() => {
                setShowKeypad(false);
                if (dateInputRef.current) {
                  if ('showPicker' in dateInputRef.current) {
                    (dateInputRef.current as any).showPicker();
                  } else {
                    (dateInputRef.current as any).click();
                  }
                }
              }}
              className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-surface-container-low/40 transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/[0.03] text-primary/60 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ReceiptText size={16} />
              </div>
              <div className="flex-1">
                <p className="text-[8px] font-bold text-on-surface-variant/25 uppercase tracking-widest mb-0.5">交易日期</p>
                <p className="text-xs font-bold text-on-surface/80">{formatDate(date, true)}</p>
              </div>
              <ChevronRight size={14} className="text-outline-variant/40" />
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
            
            <div className="mx-5 h-px bg-outline-variant/5" />

            <div className="flex items-center gap-3 px-5 py-3.5 group">
              <div className="w-9 h-9 rounded-xl bg-secondary/[0.03] text-secondary/60 flex items-center justify-center group-focus-within:scale-105 transition-transform">
                <Edit2 size={16} />
              </div>
              <div className="flex-1">
                <p className="text-[8px] font-bold text-on-surface-variant/25 uppercase tracking-widest mb-0.5">备注描述</p>
                <input 
                  type="text" 
                  placeholder="备注 (可选)" 
                  value={note}
                  onFocus={() => setShowKeypad(false)}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs font-bold text-on-surface/80 placeholder:text-on-surface-variant/20" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Numeric Keypad & Save Button */}
        <div className="mt-auto pb-6 space-y-4">
          <AnimatePresence>
            {showKeypad && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                <NumericKeypad 
                  onInput={handleKeypadInput}
                  onDelete={handleKeypadDelete}
                  onDone={() => setShowKeypad(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={handleSave}
            disabled={!amount || Number(amount) <= 0}
            className={cn(
              "w-full py-4.5 rounded-[1.8rem] flex items-center justify-center gap-2 transition-all duration-300",
              (!amount || Number(amount) <= 0)
                ? "bg-surface-container-low text-on-surface-variant/20 cursor-not-allowed"
                : "bg-primary text-white shadow-lg shadow-primary/20 active:scale-95"
            )}
          >
            <span className="font-headline font-black text-sm tracking-widest">保存</span>
          </button>
        </div>
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

  const status = isIdentifying ? 'identifying' : isRecording ? 'recording' : detectedData ? 'completed' : 'idle';

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPermissionStatus('granted');
      setError(null);
      setDetectedData(null);
      setTranscript('');
      
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
    }
  };

  const identifyFromAudio = async (audioBlob: Blob) => {
    setIsIdentifying(true);
    setError(null);
    try {
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

  const category = categories.find(c => c.id === detectedData?.category) || categories.find(c => c.id === 'other') || categories[0];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[110] bg-background flex flex-col items-center"
    >
      <header className="w-full flex items-center justify-between px-6 h-16 shrink-0">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant active:scale-90 transition-transform">
          <X size={20} />
        </button>
        <h1 className="font-headline font-bold text-lg">语音记账</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 w-full px-6 flex flex-col items-center overflow-y-auto no-scrollbar pt-4">
        {/* Hamster Feedback Area */}
        <div className="relative mb-8 flex flex-col items-center">
          <motion.div
            animate={
              status === 'recording' ? { scale: [1, 1.05, 1] } :
              status === 'identifying' ? { y: [0, -10, 0], rotate: [0, 5, -5, 0] } :
              status === 'completed' ? { scale: [1, 1.1, 1], y: [0, -5, 0] } :
              {}
            }
            transition={{ repeat: Infinity, duration: status === 'recording' ? 2 : 3, ease: "easeInOut" }}
            className="relative z-10"
          >
            <JijiLogo size="h-32 w-32" />
          </motion.div>
          
          {/* Status Text */}
          <div className="mt-4 text-center">
            <h2 className={cn(
              "text-2xl font-headline font-bold transition-colors",
              status === 'completed' ? "text-primary" : "text-on-surface"
            )}>
              {status === 'recording' && '正在聆听...'}
              {status === 'identifying' && '正在识别...'}
              {status === 'completed' && '识别完成'}
              {status === 'idle' && '请开始说话'}
            </h2>
            <p className="text-xs font-bold text-on-surface-variant/40 mt-1 tracking-wide">
              {status === 'recording' && '说一句，我来帮你记'}
              {status === 'identifying' && '正在提取金额与分类'}
              {status === 'completed' && '我已经帮你整理好了，确认一下即可入账'}
              {status === 'idle' && '点击下方按钮开始录音'}
            </p>
          </div>
        </div>

        {/* Microphone / Action Button */}
        <div className="relative mb-10">
          <AnimatePresence>
            {status === 'recording' && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.4, 0.1] }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 bg-primary rounded-full blur-2xl"
              />
            )}
          </AnimatePresence>
          
          <button 
            onClick={status === 'recording' ? stopRecording : status === 'completed' ? startRecording : undefined}
            disabled={status === 'identifying'}
            className={cn(
              "relative w-24 h-24 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 active:scale-95",
              status === 'recording' ? "bg-primary text-white scale-110" : 
              status === 'completed' ? "bg-surface-container-highest text-primary" :
              "bg-surface-container-highest text-on-surface-variant/20"
            )}
          >
            {status === 'recording' ? (
              <div className="w-8 h-8 bg-white rounded-sm animate-pulse" />
            ) : status === 'completed' ? (
              <LucideIcons.RotateCcw size={32} />
            ) : status === 'identifying' ? (
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            ) : (
              <Mic size={32} />
            )}
          </button>
        </div>

        {/* Transcript & Result Area */}
        <div className="w-full max-w-sm space-y-6 pb-32">
          {/* Transcript */}
          <div className="text-center px-4">
            <p className="text-lg font-medium leading-relaxed text-on-surface/80">
              {transcript ? (
                <span className="italic">“{transcript}”</span>
              ) : status === 'recording' ? (
                <span className="opacity-20 italic">“刚刚在全家买了一瓶水，3.5元”</span>
              ) : null}
            </p>
          </div>

          {/* Result Card */}
          <AnimatePresence>
            {status === 'completed' && detectedData && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="bg-surface-container-low/40 rounded-[2.5rem] border border-outline-variant/5 overflow-hidden shadow-sm"
              >
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", category.color)}>
                        <CategoryIcon icon={category.icon as any} size={20} className="text-on-surface" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">分类</p>
                        <p className="text-sm font-bold text-on-surface">{category.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">类型</p>
                      <p className={cn("text-sm font-bold", detectedData.type === 'income' ? "text-secondary" : "text-primary")}>
                        {detectedData.type === 'income' ? '收入' : '支出'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-outline-variant/5">
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">金额</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-primary">¥</span>
                        <span className="text-3xl font-headline font-black tracking-tighter text-on-surface">
                          {detectedData.amount?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">时间</p>
                      <p className="text-sm font-bold text-on-surface">今天</p>
                    </div>
                  </div>

                  {detectedData.note && (
                    <div className="pt-4 border-t border-outline-variant/5">
                      <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest mb-1">备注</p>
                      <p className="text-xs font-bold text-on-surface/60 leading-relaxed">{detectedData.note}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-error/5 border border-error/10 rounded-2xl text-center"
            >
              <p className="text-xs font-bold text-error">{error}</p>
            </motion.div>
          )}
        </div>
      </main>

      {/* Bottom Actions */}
      <div className="px-6 pb-10 pt-2 flex flex-col gap-4 shrink-0 bg-background border-t border-outline-variant/5">
        {status === 'completed' ? (
          <button 
            onClick={handleSave} 
            className="w-full h-18 bg-primary text-white rounded-[2rem] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-transform"
          >
            <span className="font-headline font-black text-base tracking-widest">确认入账</span>
            <CheckCircle2 size={20} />
          </button>
        ) : status === 'identifying' ? (
          <button 
            disabled
            className="w-full h-18 bg-surface-container-highest text-on-surface-variant/40 rounded-[2rem] flex items-center justify-center gap-3"
          >
            <span className="font-headline font-black text-base tracking-widest">正在智能分析...</span>
          </button>
        ) : null}
        
        <button 
          onClick={onClose} 
          className="w-full py-2 text-on-surface-variant/60 font-bold text-sm active:opacity-60 transition-opacity"
        >
          取消
        </button>
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

  const status = isScanning ? 'identifying' : previewUrl ? 'completed' : 'idle';

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

  const category = categories.find(c => c.id === selectedCategory) || categories[0];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[110] bg-background flex flex-col overflow-hidden"
    >
      <header className="flex items-center justify-between px-6 h-16 shrink-0">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant active:scale-90 transition-transform">
          <X size={20} />
        </button>
        <h1 className="font-headline font-bold text-lg">截图识别</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 w-full px-6 overflow-y-auto no-scrollbar pb-6">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />

        {/* Upload / Preview Area */}
        <div className={cn(
          "transition-all duration-500 ease-in-out",
          status === 'idle' ? "mt-12 mb-12" : "mt-4 mb-8"
        )}>
          <div 
            onClick={() => status === 'idle' ? fileInputRef.current?.click() : setShowFullPreview(true)}
            className={cn(
              "relative mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500 cursor-pointer group",
              status === 'idle' ? "aspect-[3/4] w-full max-w-[280px] bg-surface-container-highest border-2 border-dashed border-outline-variant/20" : "aspect-[16/9] w-full max-w-[320px] bg-black"
            )}
          >
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Preview" 
                className={cn(
                  "w-full h-full object-cover transition-all duration-700", 
                  status === 'identifying' ? "opacity-40 scale-110 blur-sm" : "opacity-100",
                  status === 'completed' && "object-top"
                )}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 text-center">
                <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <ImageIcon size={40} className="text-primary" />
                </div>
                <div>
                  <p className="font-headline font-black text-lg text-on-surface tracking-tight">上传支付截图</p>
                  <p className="text-xs text-on-surface-variant/60 mt-2 leading-relaxed">
                    支持微信、支付宝、银行账单<br />
                    智能提取金额、商户与日期
                  </p>
                </div>
              </div>
            )}

            {status === 'identifying' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <motion.div 
                  animate={{ y: [0, 320, 0] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                  className="absolute top-0 left-0 right-0 h-1 bg-primary shadow-[0_0_20px_rgba(var(--primary),0.8)] z-20"
                />
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                <span className="font-bold text-white text-xs tracking-widest drop-shadow-md">正在智能识别...</span>
              </div>
            )}

            {status === 'completed' && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-4">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-bold border border-white/10">
                  <Search size={12} />
                  点击查看原图
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Amount Section */}
        <AnimatePresence>
          {status === 'completed' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-2 mb-10"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">
                {type === 'expense' ? '识别支出金额' : '识别收入金额'}
              </p>
              <div className="flex items-center justify-center">
                <div className="relative inline-flex items-baseline">
                  <span className="text-3xl font-headline font-black text-primary mr-1">¥</span>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-auto min-w-[120px] max-w-[240px] text-center bg-transparent border-none focus:ring-0 p-0 text-7xl font-headline font-black tracking-tighter text-on-surface"
                    style={{ width: `${Math.max(amount.length || 4, 4) * 0.6}em` }}
                  />
                </div>
              </div>
              <p className="text-[10px] font-medium text-on-surface-variant/60 flex items-center justify-center gap-1.5">
                <CheckCircle2 size={10} className="text-primary" />
                已自动提取，若不准确可点击修改
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Card */}
        <AnimatePresence>
          {status === 'completed' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-surface-container-low/40 rounded-[2.5rem] border border-outline-variant/5 overflow-hidden shadow-sm">
                <div className="p-6 space-y-8">
                  {/* Merchant */}
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">商户名称</p>
                    <input 
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="识别中..."
                      className="w-full bg-transparent border-none focus:ring-0 p-0 font-headline font-black text-xl text-on-surface"
                    />
                  </div>

                  {/* Category & Type */}
                  <div className="grid grid-cols-2 gap-6 pt-6 border-t border-outline-variant/5">
                    <div 
                      onClick={() => setShowCategoryPicker(true)}
                      className="flex flex-col gap-2 cursor-pointer group"
                    >
                      <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">账单分类</p>
                      <div className="flex items-center gap-3 bg-surface-container-highest/50 p-2 pr-4 rounded-2xl group-active:scale-95 transition-transform">
                        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shadow-sm", category.color)}>
                          <CategoryIcon icon={category.icon as any} size={18} className="text-on-surface" />
                        </div>
                        <span className="text-sm font-bold text-on-surface">{category.name}</span>
                        <ChevronRight size={14} className="ml-auto text-outline-variant" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">交易类型</p>
                      <div className="flex p-1 bg-surface-container-highest/50 rounded-2xl h-12">
                        <button 
                          onClick={() => setType('expense')}
                          className={cn(
                            "flex-1 rounded-xl text-[10px] font-black transition-all",
                            type === 'expense' ? "bg-white text-primary shadow-sm" : "text-on-surface-variant/40"
                          )}
                        >
                          支出
                        </button>
                        <button 
                          onClick={() => setType('income')}
                          className={cn(
                            "flex-1 rounded-xl text-[10px] font-black transition-all",
                            type === 'income' ? "bg-white text-secondary shadow-sm" : "text-on-surface-variant/40"
                          )}
                        >
                          收入
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="pt-6 border-t border-outline-variant/5">
                    <div 
                      onClick={openDatePicker}
                      className="flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">交易日期</p>
                        <span className="text-sm font-bold text-on-surface">{formatDate(date, true)}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-surface-container-highest/50 flex items-center justify-center text-outline-variant group-active:scale-90 transition-transform">
                        <ChevronRight size={18} />
                      </div>
                      <input 
                        ref={dateInputRef}
                        type="datetime-local" 
                        className="absolute opacity-0 pointer-events-none" 
                        value={toDateTimeLocal(date)}
                        onChange={(e) => {
                          const newDate = new Date(e.target.value);
                          if (!isNaN(newDate.getTime())) setDate(newDate);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-error/5 border border-error/10 rounded-2xl text-center">
                  <p className="text-xs font-bold text-error">{error}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Actions */}
      <div className="px-6 pb-10 pt-2 flex flex-col gap-4 shrink-0 bg-background border-t border-outline-variant/5">
        {status === 'completed' ? (
          <>
            <button 
              onClick={handleSave} 
              className="w-full h-18 bg-primary text-white rounded-[2rem] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-transform"
            >
              <span className="font-headline font-black text-base tracking-widest">确认入账</span>
              <CheckCircle2 size={20} />
            </button>
            <div className="flex gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 h-14 bg-surface-container-highest text-on-surface-variant rounded-2xl flex items-center justify-center gap-2 font-bold text-sm active:scale-95 transition-transform"
              >
                <RotateCcw size={16} />
                重新上传
              </button>
              <button 
                onClick={onClose}
                className="flex-1 h-14 bg-surface-container-low text-on-surface-variant/60 rounded-2xl flex items-center justify-center font-bold text-sm active:scale-95 transition-transform"
              >
                取消
              </button>
            </div>
          </>
        ) : status === 'identifying' ? (
          <button 
            disabled
            className="w-full h-18 bg-surface-container-highest text-on-surface-variant/40 rounded-[2rem] flex items-center justify-center gap-3"
          >
            <span className="font-headline font-black text-base tracking-widest">正在智能分析...</span>
          </button>
        ) : (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-18 bg-primary text-white rounded-[2rem] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-transform"
          >
            <span className="font-headline font-black text-base tracking-widest">上传截图开始识别</span>
            <Plus size={20} />
          </button>
        )}
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
  const [loginMode, setLoginMode] = useState<'landing' | 'google' | 'email' | 'register' | 'phone'>('landing');
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

  const [isSubPageActive, setIsSubPageActive] = useState(false);

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
        <div className="relative w-full max-w-[440px] h-full sm:h-[952px] bg-background overflow-hidden sm:rounded-[3.5rem] sm:shadow-[0_0_0_12px_#1a1a1a,0_20px_50px_rgba(0,0,0,0.3)] flex flex-col items-center p-8 text-center">
          <div id="recaptcha-container"></div>
          
          {/* Top Brand Area */}
          <div className="flex flex-col items-center space-y-3 mt-12 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center p-3">
              <JijiLogo size="h-full w-full" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-cute text-primary font-bold tracking-tight">叽叽记账</h1>
              <p className="text-[11px] text-on-surface-variant/40 font-bold uppercase tracking-[0.2em]">AI 智能记账助手</p>
            </div>
          </div>

          {/* Central Illustration Area */}
          <div className="flex-1 w-full flex flex-col items-center justify-center py-4 animate-in fade-in zoom-in-95 duration-1000 delay-200">
            <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center">
              {/* Decorative circles */}
              <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse" />
              <div className="absolute inset-4 bg-primary/5 rounded-full animate-pulse delay-75" />
              <div className="absolute inset-8 bg-primary/5 rounded-full animate-pulse delay-150" />
              
              {/* Main Illustration */}
              <div className="relative z-10 w-48 h-48 drop-shadow-2xl">
                <img 
                  src="https://api.dicebear.com/7.x/big-smile/svg?seed=hamster_holding_coin_cute_orange" 
                  alt="Jiji Hamster" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              {/* Floating elements */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute top-4 right-4 w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center p-2 border border-primary/10"
              >
                <LucideIcons.Sparkles className="text-primary" size={20} />
              </motion.div>
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute bottom-10 left-0 w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center p-2 border border-primary/10"
              >
                <LucideIcons.TrendingUp className="text-secondary" size={24} />
              </motion.div>
            </div>
            
            <div className="mt-8 space-y-2">
              <h2 className="text-xl font-headline font-bold text-on-surface">欢迎回来</h2>
              <p className="text-sm text-on-surface-variant/60 font-medium">登录后即可同步您的账单与分析数据</p>
            </div>
          </div>
          
          <div className="w-full space-y-4 mt-auto">
            {loginError && (
              <div className="w-full p-4 mb-4 bg-error-container text-error rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
                {loginError}
              </div>
            )}

            {loginMode === 'landing' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Primary: WeChat */}
                <button 
                  onClick={() => {
                    // Mock WeChat Login
                    setLoginError("微信登录环境初始化中，请稍后重试或使用其他方式。");
                  }}
                  className="w-full py-4.5 bg-[#07C160] text-white rounded-[2rem] font-bold shadow-xl shadow-green-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <LucideIcons.MessageCircle size={22} fill="currentColor" />
                  微信一键登录
                </button>

                {/* Secondary: Phone */}
                <button 
                  onClick={() => setLoginMode('phone')}
                  className="w-full py-4.5 bg-surface-container-high text-on-surface rounded-[2rem] font-bold border border-outline-variant/30 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <LucideIcons.Smartphone size={20} />
                  手机号登录
                </button>

                {/* Tertiary: Others */}
                <div className="pt-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-outline-variant/30" />
                    <span className="text-[10px] text-on-surface-variant/30 font-bold uppercase tracking-[0.2em]">其他登录方式</span>
                    <div className="flex-1 h-px bg-outline-variant/30" />
                  </div>

                  <div className="flex justify-center gap-10">
                    <button 
                      onClick={() => setLoginMode('email')}
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-surface-container-low border border-outline-variant/50 flex items-center justify-center text-primary group-active:scale-90 transition-transform">
                        <LucideIcons.Mail size={20} />
                      </div>
                      <span className="text-[10px] font-bold text-on-surface-variant/40">邮箱</span>
                    </button>
                    <button 
                      onClick={handleGoogleLogin}
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-surface-container-low border border-outline-variant/50 flex items-center justify-center group-active:scale-90 transition-transform">
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-on-surface-variant/40">Google</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loginMode === 'phone' && (
              <div className="space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => setLoginMode('landing')} className="p-2 -ml-2 hover:bg-surface-container rounded-full transition-colors">
                    <LucideIcons.ArrowLeft size={20} />
                  </button>
                  <h2 className="text-xl font-bold font-headline">手机号登录</h2>
                </div>
                {!isVerifying ? (
                  <form onSubmit={handleSendCode} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant ml-1">手机号码</label>
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                        <input 
                          type="tel" 
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="请输入手机号"
                          className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-2xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium text-lg"
                          required
                        />
                      </div>
                      <p className="text-[10px] text-on-surface-variant/40 ml-1">支持中国大陆手机号，需包含 +86</p>
                    </div>

                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4.5 bg-primary text-white rounded-full font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                      获取验证码
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyCode} className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-xs font-bold text-on-surface-variant">验证码</label>
                        <button type="button" onClick={() => setIsVerifying(false)} className="text-xs text-primary font-bold">修改手机号</button>
                      </div>
                      <div className="relative">
                        <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                        <input 
                          type="text" 
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="输入 6 位验证码"
                          className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-2xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium text-center tracking-[0.5em] text-xl"
                          maxLength={6}
                          required
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4.5 bg-primary text-white rounded-full font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                      立即登录
                    </button>

                    <button 
                      type="button"
                      onClick={handleSendCode}
                      className="w-full text-center text-sm text-on-surface-variant/60 font-bold"
                    >
                      重新发送验证码
                    </button>
                  </form>
                )}
              </div>
            )}

            {(loginMode === 'email' || loginMode === 'register') && (
              <form onSubmit={loginMode === 'email' ? handleEmailLogin : handleEmailRegister} className="space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => setLoginMode('landing')} className="p-2 -ml-2 hover:bg-surface-container rounded-full transition-colors">
                    <LucideIcons.ArrowLeft size={20} />
                  </button>
                  <h2 className="text-xl font-bold font-headline">{loginMode === 'email' ? '邮箱登录' : '创建账号'}</h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
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

                  <div className="space-y-2">
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
                  className="w-full py-4.5 bg-primary text-white rounded-full font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                  {loginMode === 'email' ? '立即登录' : '注册账号'}
                </button>

                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm text-on-surface-variant/60">{loginMode === 'email' ? '还没有账号？' : '已有账号？'}</span>
                  <button 
                    type="button" 
                    onClick={() => setLoginMode(loginMode === 'email' ? 'register' : 'email')}
                    className="text-primary font-bold text-sm"
                  >
                    {loginMode === 'email' ? '立即注册' : '返回登录'}
                  </button>
                </div>
              </form>
            )}
          </div>
          
          <div className="mt-12 space-y-2">
            <p className="text-[10px] text-on-surface-variant/40 font-medium">
              登录即代表您同意我们的
            </p>
            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-on-surface-variant/60">
              <span className="hover:text-primary transition-colors cursor-pointer underline decoration-primary/20 underline-offset-2">服务协议</span>
              <span className="w-1 h-1 bg-on-surface-variant/20 rounded-full" />
              <span className="hover:text-primary transition-colors cursor-pointer underline decoration-primary/20 underline-offset-2">隐私政策</span>
            </div>
          </div>
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
          activeTab={activeTab}
          userName={user.displayName || '叽叽'}
          userAvatar={user.photoURL || 'https://picsum.photos/seed/hamster_cute_user/200/200'}
          onLogout={handleLogout}
        />
        
        <main 
          className={cn(
            "flex-1 overflow-y-auto no-scrollbar relative overscroll-behavior-y-auto",
            activeTab === 'overview' && "overview-viewport-mask"
          )}
        >
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <OverviewScreen 
                  transactions={transactions} 
                  onConfirm={confirmTransaction}
                  onEdit={handleEdit}
                  onDelete={deleteTransaction}
                  onView={handleView}
                  onNavigateToBills={() => setActiveTab('bills')}
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
                  budget={budget}
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
                  onSubPageToggle={setIsSubPageActive}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Floating Action Buttons - Fixed in Overview */}
        <AnimatePresence>
          {activeTab === 'overview' && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="absolute bottom-[110px] left-1/2 -translate-x-1/2 z-[60] flex justify-center items-center gap-10 px-8 py-4 pointer-events-auto"
            >
              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={() => setModal('manual')} 
                  className="w-16 h-16 rounded-[1.5rem] overflow-hidden bg-white shadow-[0_8px_25px_rgba(0,0,0,0.08)] active:scale-90 transition-all duration-300 p-2.5 border border-outline-variant/5 flex items-center justify-center"
                >
                  <img 
                    src="https://api.dicebear.com/7.x/big-smile/svg?seed=hamster_holding_pen_writing_cute" 
                    alt="Manual" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </button>
                <span className="text-[10px] font-bold text-on-surface-variant tracking-tight">手动输入</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={() => setModal('voice')} 
                  className="w-16 h-16 rounded-[1.5rem] overflow-hidden bg-white shadow-[0_8px_25px_rgba(0,0,0,0.08)] active:scale-90 transition-all duration-300 p-2.5 border border-outline-variant/5 flex items-center justify-center"
                >
                  <img 
                    src="https://api.dicebear.com/7.x/big-smile/svg?seed=hamster_holding_microphone_singing_cute" 
                    alt="Voice" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </button>
                <span className="text-[10px] font-bold text-on-surface-variant tracking-tight">语音记账</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={() => setModal('screenshot')} 
                  className="w-16 h-16 rounded-[1.5rem] overflow-hidden bg-white shadow-[0_8px_25px_rgba(0,0,0,0.08)] active:scale-90 transition-all duration-300 p-2.5 border border-outline-variant/5 flex items-center justify-center"
                >
                  <img 
                    src="https://api.dicebear.com/7.x/big-smile/svg?seed=hamster_holding_plus_sign_cute" 
                    alt="Screenshot" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </button>
                <span className="text-[10px] font-bold text-on-surface-variant tracking-tight">截图导入</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isSubPageActive && <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />}

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
