
import React, { useState, useEffect, useMemo } from 'react';
import { Device, Sale, AppState, Brand, Storage } from './types';
import { translations, IPHONE_MODELS, SAMSUNG_MODELS, STORAGE_OPTIONS } from './constants';
import { 
  LayoutDashboard, 
  Smartphone, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings, 
  Plus, 
  Search,
  Moon,
  Sun,
  Globe,
  TrendingUp,
  RotateCcw,
  User,
  Calendar,
  Store,
  DollarSign,
  ArrowRightLeft,
  ChevronRight,
  Wallet,
  Coins,
  Box,
  Hash,
  Info,
  CalendarDays,
  Tag,
  RefreshCw,
  Github,
  Key,
  Database,
  Menu,
  X,
  Download
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

// --- Utility Functions ---
const generateId = () => Math.random().toString(36).substr(2, 9);
const formatDate = (date: string, lang: string) => 
  new Date(date).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' });

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <motion.button
    whileHover={{ x: 4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-all duration-300 ${
      active 
        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100'
    }`}
  >
    <Icon size={18} className={active ? 'opacity-100' : 'opacity-60'} />
    <span className={`text-sm tracking-tight ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
    {active && <ChevronRight size={14} className="ml-auto opacity-40" />}
  </motion.button>
);

const Card = ({ title, subtitle, icon: Icon, colorClass = "bg-brand-50 text-brand-600", trend }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5 }}
    className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300 group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 ${colorClass.split(' ')[0]} dark:bg-opacity-10 rounded-2xl ${colorClass.split(' ')[1]} transition-transform duration-300 group-hover:scale-110`}>
        <Icon size={20} />
      </div>
      {trend && (
        <span className="text-[10px] font-semibold px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg tracking-wide">
          {trend}
        </span>
      )}
    </div>
    <div>
      <h3 className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">{title}</h3>
      <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">{subtitle}</p>
    </div>
  </motion.div>
);

const InputWrapper = ({ label, children, icon: Icon }: any) => (
  <div className="space-y-1.5 flex-1">
    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1">
      {Icon && <Icon size={12} className="text-brand-500 opacity-60" />}
      {label}
    </label>
    {children}
  </div>
);

// --- Main App ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'sales' | 'debtors' | 'analytics' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('flagship_hub_v7');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.exchangeRate || parsed.exchangeRate === 1) {
        parsed.exchangeRate = 12210;
      }
      if (!parsed.buyRate) parsed.buyRate = parsed.exchangeRate - 50;
      if (!parsed.sellRate) parsed.sellRate = parsed.exchangeRate + 50;
      return parsed;
    }
    
    // Try to recover from older versions if v7 is empty
    const legacyKeys = ['flagship_hub_v6', 'flagship_hub_v5', 'flagship_hub_v4', 'flagship_hub_v3', 'flagship_hub_v2', 'flagship_hub'];
    for (const key of legacyKeys) {
      const legacyData = localStorage.getItem(key);
      if (legacyData) {
        try {
          const parsed = JSON.parse(legacyData);
          console.log(`Recovered data from ${key}`);
          return { ...parsed, language: parsed.language || 'ru', theme: parsed.theme || 'dark' };
        } catch (e) { continue; }
      }
    }

    return {
      devices: [],
      sales: [],
      language: 'ru',
      theme: 'dark',
      cashBalance: 0,
      exchangeRate: 12210,
      buyRate: 12160,
      sellRate: 12260,
      customModels: { iPhone: [], Samsung: [] },
      syncSettings: {
        githubToken: '',
        repoName: '',
        lastSync: ''
      }
    };
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddDebtorModal, setShowAddDebtorModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState<Device | null>(null);
  const [isInstallmentMode, setIsInstallmentMode] = useState(false);
  
  const [modalSelectedBrand, setModalSelectedBrand] = useState<Brand>('iPhone');

  const fetchRate = async () => {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data && data.rates && data.rates.UZS) {
        const newRate = Math.round(data.rates.UZS);
        setState(prev => {
          if (Math.abs(prev.exchangeRate - newRate) > 1 || prev.exchangeRate === 1) {
            return { 
              ...prev, 
              exchangeRate: newRate,
              buyRate: newRate - 40,
              sellRate: newRate + 40
            };
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
    }
  };

  // Fetch Exchange Rate on mount
  useEffect(() => {
    fetchRate();
    const interval = setInterval(fetchRate, 3600000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('flagship_hub_v7', JSON.stringify(state));
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state]);

  const t = translations[state.language];

  // Sync to GitHub Logic
  const syncToGithub = async () => {
    if (!state.syncSettings?.githubToken || !state.syncSettings?.repoName) {
      alert(state.language === 'ru' ? 'Заполните настройки GitHub' : 'Fill GitHub settings');
      return;
    }

    try {
      const { githubToken, repoName } = state.syncSettings;
      const fileName = 'flagship_data.json';
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(state, null, 2))));
      
      const trimmedRepo = repoName.trim();
      const trimmedToken = githubToken.trim();

      // 0. Check if repository exists and token is valid
      const repoCheck = await fetch(`https://api.github.com/repos/${trimmedRepo}`, {
        headers: { 'Authorization': `Bearer ${trimmedToken}` }
      });

      if (!repoCheck.ok) {
        if (repoCheck.status === 404) {
          alert(state.language === 'ru' 
            ? 'Ошибка: Репозиторий не найден. Проверьте:\n1. Название (Erkin09/MyInventoryApp)\n2. Права токена (должна быть галочка "repo")' 
            : 'Error: Repository not found. Check:\n1. Name (Erkin09/MyInventoryApp)\n2. Token permissions (must have "repo" scope)');
        } else if (repoCheck.status === 401) {
          alert(state.language === 'ru' ? 'Ошибка: Неверный токен (Unauthorized)' : 'Error: Invalid token (Unauthorized)');
        } else {
          const err = await repoCheck.json();
          alert(`GitHub Error: ${err.message}`);
        }
        return;
      }

      // 1. Try to get the file SHA if it exists
      let sha = '';
      try {
        const getRes = await fetch(`https://api.github.com/repos/${trimmedRepo}/contents/${fileName}`, {
          headers: { 'Authorization': `Bearer ${trimmedToken}` }
        });
        if (getRes.ok) {
          const data = await getRes.json();
          sha = data.sha;
        }
      } catch (e) { /* File might not exist */ }

      // 2. Create or Update the file
      const res = await fetch(`https://api.github.com/repos/${trimmedRepo}/contents/${fileName}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${trimmedToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Sync data ${new Date().toISOString()}`,
          content,
          sha: sha || undefined
        })
      });

      if (res.ok) {
        setState(prev => ({
          ...prev,
          syncSettings: { ...prev.syncSettings, lastSync: new Date().toISOString() }
        }));
        alert(state.language === 'ru' ? 'Синхронизация успешна' : 'Sync successful');
      } else {
        const err = await res.json();
        alert(`Error: ${err.message}`);
      }
    } catch (error) {
      console.error(error);
      alert('Sync failed');
    }
  };

  const restoreFromGithub = async () => {
    if (!state.syncSettings?.githubToken || !state.syncSettings?.repoName) {
      alert(state.language === 'ru' ? 'Заполните настройки GitHub' : 'Fill GitHub settings');
      return;
    }

    if (!confirm(state.language === 'ru' ? 'Это перезапишет текущие данные. Продолжить?' : 'This will overwrite current data. Continue?')) {
      return;
    }

    try {
      const { githubToken, repoName } = state.syncSettings;
      const fileName = 'flagship_data.json';
      
      const trimmedRepo = repoName.trim();
      const trimmedToken = githubToken.trim();

      const res = await fetch(`https://api.github.com/repos/${trimmedRepo}/contents/${fileName}`, {
        headers: { 'Authorization': `Bearer ${trimmedToken}` }
      });

      if (res.ok) {
        const data = await res.json();
        const decodedContent = decodeURIComponent(escape(atob(data.content)));
        const restoredState = JSON.parse(decodedContent);
        
        // Merge sync settings to keep current token/repo
        setState({
          ...restoredState,
          syncSettings: state.syncSettings
        });
        
        alert(state.language === 'ru' ? 'Данные восстановлены' : 'Data restored');
      } else {
        const err = await res.json();
        alert(`Error: ${err.message}`);
      }
    } catch (error) {
      console.error(error);
      alert('Restore failed');
    }
  };

  // Logic Helpers
  const devicesInStock = state.devices.filter(d => d.status === 'In Stock');
  const stockValue = devicesInStock.reduce((acc, d) => acc + d.purchasePrice, 0);
  
  const debtorsList = useMemo(() => {
    return state.sales.filter(s => 
      s.isInstallment === true && 
      s.status === 'Completed' &&
      s.installmentPlan && 
      Math.round(s.installmentPlan.paidAmount) < Math.round(s.salePrice)
    );
  }, [state.sales]);

  const totalDebt = debtorsList.reduce((acc, s) => acc + (s.salePrice - (s.installmentPlan?.paidAmount || 0)), 0);
  const totalAssets = stockValue + totalDebt + state.cashBalance;

  const totalProfit = state.sales
    .filter(s => s.status === 'Completed')
    .reduce((acc, s) => {
      const device = state.devices.find(d => d.id === s.deviceId);
      return acc + (s.salePrice - (device?.purchasePrice || 0));
    }, 0);

  // Analytics helper with current year filter
  const chartData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const months = state.language === 'ru' 
      ? ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return months.map((m, i) => {
      const monthlySales = state.sales.filter(s => {
        const d = new Date(s.date);
        return d.getFullYear() === currentYear && d.getMonth() === i && s.status === 'Completed';
      });
      const profit = monthlySales.reduce((acc, s) => {
        const dev = state.devices.find(d => d.id === s.deviceId);
        return acc + (s.salePrice - (dev?.purchasePrice || 0));
      }, 0);
      return { name: m, profit, sales: monthlySales.length };
    });
  }, [state.sales, state.devices, state.language]);

  const dailyProfitData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dailySales = state.sales.filter(s => {
        const d = new Date(s.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() === day && s.status === 'Completed';
      });
      const profit = dailySales.reduce((acc, s) => {
        const dev = state.devices.find(d => d.id === s.deviceId);
        return acc + (s.salePrice - (dev?.purchasePrice || 0));
      }, 0);
      return { name: day.toString(), profit };
    });
  }, [state.sales, state.devices]);

  // Handlers
  const addDevice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newDevice: Device = {
      id: generateId(),
      brand: formData.get('brand') as Brand,
      model: formData.get('model') as string,
      storage: formData.get('storage') as Storage,
      imei: formData.get('imei') as string,
      purchasePrice: Number(formData.get('purchasePrice')),
      purchasedFrom: formData.get('purchasedFrom') as string,
      purchaseDate: formData.get('purchaseDate') as string || new Date().toISOString().split('T')[0],
      status: 'In Stock',
      dateAdded: new Date().toISOString()
    };
    setState(prev => ({ ...prev, devices: [newDevice, ...prev.devices] }));
    setShowAddModal(false);
  };

  const sellDevice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!showSellModal) return;
    const formData = new FormData(e.currentTarget);
    const isInstallment = formData.get('isInstallment') === 'on';
    const salePrice = Number(formData.get('salePrice'));
    const paidAmount = isInstallment ? Number(formData.get('paidAmount') || 0) : salePrice;

    const sale: Sale = {
      id: generateId(),
      deviceId: showSellModal.id,
      customerName: isInstallment ? formData.get('customerName') as string : "Guest",
      customerPhone: isInstallment ? formData.get('customerPhone') as string : "N/A",
      salePrice: salePrice,
      date: new Date().toISOString(),
      isInstallment,
      status: 'Completed',
      ...(isInstallment ? {
        installmentPlan: {
          months: Number(formData.get('months')) as any,
          paidAmount: paidAmount,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      } : {})
    };

    setState(prev => ({
      ...prev,
      sales: [sale, ...prev.sales],
      devices: prev.devices.map(d => d.id === showSellModal.id ? { ...d, status: 'Sold' } : d),
      cashBalance: prev.cashBalance + paidAmount
    }));
    setShowSellModal(null);
    setIsInstallmentMode(false);
  };

  const returnSale = (saleId: string) => {
    if(!confirm(state.language === 'ru' ? 'Вы уверены?' : 'Are you sure?')) return;
    const sale = state.sales.find(s => s.id === saleId);
    if (!sale) return;
    setState(prev => ({
      ...prev,
      sales: prev.sales.map(s => s.id === saleId ? { ...s, status: 'Returned' } : s),
      devices: prev.devices.map(d => d.id === sale.deviceId ? { ...d, status: 'In Stock' } : d),
      cashBalance: prev.cashBalance - (sale.isInstallment ? (sale.installmentPlan?.paidAmount || 0) : sale.salePrice)
    }));
  };

  const updateInstallment = (saleId: string, amount: number) => {
    setState(prev => ({
      ...prev,
      sales: prev.sales.map(s => {
        if (s.id === saleId && s.installmentPlan) {
          return {
            ...s,
            installmentPlan: { ...s.installmentPlan, paidAmount: s.installmentPlan.paidAmount + amount }
          };
        }
        return s;
      }),
      cashBalance: prev.cashBalance + amount
    }));
  };

  const deleteDevice = (id: string) => {
    try {
      setState(prev => ({
        ...prev,
        devices: prev.devices.filter(d => d.id !== id)
      }));
      // Small toast-like alert for feedback since we removed confirm
      console.log("Device deleted:", id);
    } catch (err) {
      alert("Error deleting device");
    }
  };

  const addDebtor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const salePrice = Number(formData.get('salePrice'));
    const paidAmount = Number(formData.get('paidAmount') || 0);

    const sale: Sale = {
      id: generateId(),
      customerName: formData.get('customerName') as string,
      customerPhone: formData.get('customerPhone') as string,
      salePrice: salePrice,
      date: new Date().toISOString(),
      isInstallment: true,
      status: 'Completed',
      installmentPlan: {
        months: Number(formData.get('months')) as any,
        paidAmount: paidAmount,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    };

    setState(prev => ({
      ...prev,
      sales: [sale, ...prev.sales],
      cashBalance: prev.cashBalance + paidAmount
    }));
    setShowAddDebtorModal(false);
  };

  const filteredDevices = devicesInStock.filter(d => 
    d.imei.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F19] text-slate-700 dark:text-slate-300 transition-colors duration-500 font-sans selection:bg-brand-500/30">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-r border-slate-100 dark:border-slate-800 flex flex-col p-4 space-y-1 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between px-3 py-8 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <Smartphone size={18} />
            </div>
            <span className="text-base font-semibold tracking-tight uppercase text-slate-900 dark:text-white">Fhub</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <SidebarItem icon={LayoutDashboard} label={t.dashboard} active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} />
        <SidebarItem icon={Smartphone} label={t.inventory} active={activeTab === 'inventory'} onClick={() => { setActiveTab('inventory'); setIsSidebarOpen(false); }} />
        <SidebarItem icon={ShoppingCart} label={t.sales} active={activeTab === 'sales'} onClick={() => { setActiveTab('sales'); setIsSidebarOpen(false); }} />
        <SidebarItem icon={Users} label={t.debtors} active={activeTab === 'debtors'} onClick={() => { setActiveTab('debtors'); setIsSidebarOpen(false); }} />
        <SidebarItem icon={BarChart3} label={t.analytics} active={activeTab === 'analytics'} onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }} />
        
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
          <SidebarItem icon={Settings} label={t.settings} active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} />
        </div>
        <div className="mt-auto p-4 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
            <span>Flagship Hub</span>
            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-brand-500">v1.2.1</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-x-hidden">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-sm active:scale-95 transition-all"
              >
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-lg md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 leading-none">{t[activeTab]}</h1>
                <div className="flex items-center space-x-2 text-slate-400 text-[9px] font-semibold uppercase tracking-widest mt-1">
                  <Calendar size={10} className="text-brand-500 opacity-60" />
                  <span>{new Date().toLocaleDateString(state.language === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 md:hidden">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setState(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }))}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 shadow-sm"
              >
                {state.theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setState(s => ({ ...s, language: s.language === 'ru' ? 'en' : 'ru' }))}
                className="px-2 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase shadow-sm"
              >
                {state.language}
              </motion.button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 w-full md:w-auto justify-start md:justify-end overflow-x-auto scrollbar-hide py-1 no-scrollbar">
            <div className="flex items-center space-x-3 px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm shrink-0">
              <div className="flex flex-col">
                <span className="text-[7px] font-bold text-slate-400 uppercase leading-none mb-1">{t.buyRate}</span>
                <span className="text-[10px] font-bold text-emerald-600 leading-none">{state.buyRate.toLocaleString()}</span>
              </div>
              <div className="w-px h-5 bg-slate-100 dark:bg-slate-700" />
              <div className="flex flex-col">
                <span className="text-[7px] font-bold text-slate-400 uppercase leading-none mb-1">{t.sellRate}</span>
                <span className="text-[10px] font-bold text-rose-600 leading-none">{state.sellRate.toLocaleString()}</span>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setState(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }))}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 shadow-sm transition-all"
              >
                {state.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setState(s => ({ ...s, language: s.language === 'ru' ? 'en' : 'ru' }))}
                className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-50 dark:text-slate-400 flex items-center space-x-1.5 transition-all font-semibold text-[10px] tracking-widest uppercase shadow-sm"
              >
                <Globe size={14} className="text-brand-500 opacity-60" />
                <span>{state.language}</span>
              </motion.button>
            </div>
          </div>
        </header>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <div className="md:col-span-2 bg-brand-600 p-8 rounded-[2rem] text-white relative overflow-hidden shadow-sm">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white opacity-5 rounded-full"></div>
                  <div className="relative z-10 flex flex-col h-full justify-between">
                     <div className="flex justify-between items-start">
                        <div className="p-2.5 bg-white/10 rounded-xl">
                           <Coins size={22} />
                        </div>
                        <span className="text-[9px] font-semibold uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full">{t.totalAssets}</span>
                     </div>
                     <div className="mt-8">
                        <p className="text-4xl font-semibold tracking-tight">${totalAssets.toLocaleString()}</p>
                     </div>
                  </div>
               </div>
               <Card title={t.cash} subtitle={`$${state.cashBalance.toLocaleString()}`} icon={Wallet} colorClass="bg-emerald-50 text-emerald-600" />
               <Card title={t.debtors} subtitle={`$${totalDebt.toLocaleString()}`} icon={Users} colorClass="bg-rose-50 text-rose-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card title={t.stockValue} subtitle={`$${stockValue.toLocaleString()}`} icon={Box} colorClass="bg-blue-50 text-blue-600" />
              <Card title={t.totalSales} subtitle={state.sales.filter(s => s.status === 'Completed').length.toString()} icon={ShoppingCart} colorClass="bg-amber-50 text-amber-600" />
              <Card title={t.profit} subtitle={`$${totalProfit.toLocaleString()}`} icon={TrendingUp} colorClass="bg-purple-50 text-purple-600" />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">{t.monthlyPerformance}</h3>
               <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.05} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tick={{dy: 10}} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                        itemStyle={{ color: '#38bdf8', fontWeight: 'semibold' }}
                      />
                      <Area type="monotone" dataKey="profit" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>
        )}

        {/* Inventory View */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border-none rounded-xl shadow-sm text-sm font-medium outline-none focus:ring-1 ring-brand-500/20"
                />
              </div>
              <div className="flex space-x-2 items-center">
                 <div className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">{t.stockValue}</p>
                    <p className="text-lg font-semibold text-brand-600 tracking-tight leading-none">${stockValue.toLocaleString()}</p>
                 </div>
                 <button 
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center space-x-2 bg-slate-900 dark:bg-brand-600 text-white px-4 py-2.5 rounded-xl hover:bg-brand-700 transition-all font-semibold uppercase text-[10px] tracking-widest"
                >
                  <Plus size={14} />
                  <span>{t.addDevice}</span>
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
               <div className="overflow-x-auto scrollbar-hide">
                 <table className="w-full text-left min-w-[600px]">
                   <thead>
                     <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/60">
                        <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{t.model}</th>
                        <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{t.storage}</th>
                        <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{t.imei}</th>
                        <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{t.supplier}</th>
                        <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{t.purchasePrice}</th>
                        <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400 text-right">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                    {filteredDevices.map(device => (
                      <tr key={device.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                        <td className="px-6 py-4">
                           <div className="flex items-center space-x-3">
                              <span className={`w-1.5 h-1.5 rounded-full ${device.brand === 'iPhone' ? 'bg-indigo-400' : 'bg-brand-500'}`}></span>
                              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 tracking-tight leading-none">{device.model}</p>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[9px] font-semibold tracking-widest uppercase text-slate-500 dark:text-slate-400">{device.storage}</span>
                        </td>
                        <td className="px-6 py-4">
                           <code className="text-[10px] font-medium text-slate-400">{device.imei}</code>
                        </td>
                        <td className="px-6 py-4">
                           <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{device.purchasedFrom}</p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-sm text-slate-900 dark:text-slate-100">${device.purchasePrice.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center space-x-3">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteDevice(device.id);
                                }}
                                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all active:scale-90"
                                title={state.language === 'ru' ? 'Удалить' : 'Delete'}
                              >
                                <X size={18} />
                              </button>
                              <button 
                                onClick={() => setShowSellModal(device)}
                                className="px-5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-brand-600 hover:text-white dark:hover:bg-brand-600 text-slate-500 dark:text-slate-400 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95"
                              >
                                {t.sell}
                              </button>
                            </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {filteredDevices.length === 0 && (
                   <div className="py-20 text-center text-slate-400/60">
                     <Smartphone size={40} className="mx-auto mb-3 opacity-10" />
                     <p className="text-[10px] font-semibold uppercase tracking-widest italic">Inventory clear</p>
                   </div>
                 )}
               </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                   <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8">{t.monthlyProfit}</h3>
                   <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="colorProfitAnalytic" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.05} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="profit" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfitAnalytic)" />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                   <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8">{t.dailyProfit}</h3>
                   <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={dailyProfitData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.05} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis hide />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                            <Bar dataKey="profit" fill="#10b981" radius={[6, 6, 0, 0]} barSize={12} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Settings, Sales, Debtors remain similarly refined in App.tsx logic... */}
        {/* ... (Existing tabs logic but with refined typography classes applied) ... */}
        
        {activeTab === 'sales' && (
           <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm animate-in fade-in duration-500">
             <div className="overflow-x-auto scrollbar-hide">
               <table className="w-full text-left min-w-[700px]">
                 <thead>
                   <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/60">
                     <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.date}</th>
                     <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.model}</th>
                     <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.customer}</th>
                     <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.purchasePrice}</th>
                     <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.sellingPrice}</th>
                     <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.status}</th>
                     <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">{t.actions}</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                   {state.sales.map(sale => {
                     const device = state.devices.find(d => d.id === sale.deviceId);
                     return (
                       <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                         <td className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase">{formatDate(sale.date, state.language)}</td>
                         <td className="px-6 py-4">
                           <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 tracking-tight">{device?.model || '?'}</p>
                           <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">{device?.storage} • {device?.imei.slice(-4)}</p>
                         </td>
                         <td className="px-6 py-4">
                           <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{sale.customerName || "—"}</p>
                           <p className="text-[9px] font-medium text-slate-400">{sale.customerPhone || "—"}</p>
                         </td>
                                                                              <td className="px-6 py-4 font-semibold text-xs text-slate-400">${device?.purchasePrice.toLocaleString() || '0'}</td>
                                                                              <td className="px-6 py-4 font-semibold text-base text-brand-600">${sale.salePrice.toLocaleString()}</td>
                          <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase tracking-widest ${
                             sale.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'
                           }`}>
                             {sale.status === 'Completed' ? (sale.isInstallment ? 'In Debt' : 'Paid') : 'Returned'}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-right">
                           {sale.status === 'Completed' && (
                             <button onClick={() => returnSale(sale.id)} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-rose-500 transition-all active:scale-90">
                               <RotateCcw size={14} />
                             </button>
                           )}
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
           </div>
        )}

        {activeTab === 'debtors' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-end">
              <button 
                onClick={() => setShowAddDebtorModal(true)}
                className="flex items-center space-x-2 bg-slate-900 dark:bg-brand-600 text-white px-4 py-2.5 rounded-xl hover:bg-brand-700 transition-all font-semibold uppercase text-[10px] tracking-widest"
              >
                <Plus size={14} />
                <span>{t.addDebtor || (state.language === 'ru' ? 'Добавить должника' : 'Add Debtor')}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {debtorsList.map(sale => {
                const device = state.devices.find(d => d.id === sale.deviceId);
                const remaining = Math.round(sale.salePrice - (sale.installmentPlan?.paidAmount || 0));
                const progress = ((sale.installmentPlan?.paidAmount || 0) / sale.salePrice) * 100;
                return (
                  <div key={sale.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 relative shadow-sm">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center font-bold text-sm text-slate-500">
                        {sale.customerName?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm leading-tight text-slate-900 dark:text-slate-100">{sale.customerName}</h4>
                        <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">{sale.customerPhone}</p>
                      </div>
                    </div>
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                        <span className="uppercase tracking-wider">{device?.model || (state.language === 'ru' ? 'Прочее' : 'Other')}</span>
                        <span className="text-slate-900 dark:text-slate-100 font-bold tracking-tight">${remaining.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-brand-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <input type="number" id={`pay-${sale.id}`} placeholder="0.00" className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none text-xs font-semibold focus:ring-1 ring-brand-500/20" />
                      <button onClick={() => {
                          const input = document.getElementById(`pay-${sale.id}`) as HTMLInputElement;
                          updateInstallment(sale.id, Number(input.value));
                          input.value = '';
                        }} className="px-4 py-2 bg-brand-600 text-white font-semibold text-[9px] uppercase tracking-widest rounded-xl hover:bg-brand-700 transition-all active:scale-95">
                        Receive
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-4xl space-y-6 animate-in fade-in duration-500 pb-20">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cash & Exchange Rate Card */}
                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center">
                      <Coins className="mr-2 text-brand-500 opacity-70" size={16} />
                      {t.updateCash}
                    </h3>
                    <div className="flex space-x-2">
                          <input type="number" placeholder="0.00" className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none text-sm font-semibold border border-transparent focus:border-brand-500/30 transition-all" value={state.cashBalance} onChange={(e) => setState(s => ({...s, cashBalance: Number(e.target.value)}))} id="manual-cash-input" />
                          <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                             const val = Number((document.getElementById('manual-cash-input') as HTMLInputElement).value);
                             setState(s => ({...s, cashBalance: val}));
                            }} 
                            className="px-6 py-3 bg-brand-600 text-white font-semibold text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-brand-500/20 whitespace-nowrap"
                          >Update</motion.button>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center justify-between">
                      <div className="flex items-center">
                        <DollarSign className="mr-2 text-brand-500 opacity-70" size={16} />
                        {t.exchangeRate} (UZS)
                      </div>
                      <motion.button 
                        whileTap={{ rotate: 180 }}
                        onClick={fetchRate}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <RefreshCw size={14} className="text-brand-500" />
                      </motion.button>
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.buyRate}</label>
                        <div className="flex space-x-2">
                          <input type="number" step="1" className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none text-sm font-semibold border border-transparent focus:border-brand-500/30 transition-all" value={state.buyRate} onChange={(e) => setState(s => ({...s, buyRate: Number(e.target.value)}))} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.sellRate}</label>
                        <div className="flex space-x-2">
                          <input type="number" step="1" className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none text-sm font-semibold border border-transparent focus:border-brand-500/30 transition-all" value={state.sellRate} onChange={(e) => setState(s => ({...s, sellRate: Number(e.target.value)}))} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Models Management Card */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center">
                     <Database className="mr-2 text-brand-500 opacity-70" size={16} />
                     {t.models}
                   </h3>
                   <div className="space-y-4">
                      <div className="flex flex-col space-y-2">
                        <div className="flex space-x-2">
                          <select id="new-model-brand" className="px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none text-sm font-semibold border border-transparent">
                            <option value="iPhone">iPhone</option>
                            <option value="Samsung">Samsung</option>
                          </select>
                          <input type="text" id="new-model-name" placeholder="Model Name" className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none text-sm font-semibold border border-transparent focus:border-brand-500/30 transition-all" />
                        </div>
                        <motion.button 
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                           const brand = (document.getElementById('new-model-brand') as HTMLSelectElement).value as Brand;
                           const name = (document.getElementById('new-model-name') as HTMLInputElement).value;
                           if (!name) return;
                           setState(s => ({
                             ...s,
                             customModels: {
                               ...s.customModels,
                               [brand]: [...s.customModels[brand], name]
                             }
                           }));
                           (document.getElementById('new-model-name') as HTMLInputElement).value = '';
                          }} 
                          className="w-full py-3 bg-slate-900 dark:bg-brand-600 text-white font-semibold text-[10px] uppercase tracking-widest rounded-2xl shadow-lg"
                        >Add Model</motion.button>
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                        {Object.entries(state.customModels).map(([brand, models]) => 
                          models.map(m => (
                            <motion.span 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              key={`${brand}-${m}`} 
                              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-xl text-[10px] font-bold flex items-center gap-2 border border-slate-200/50 dark:border-slate-700"
                            >
                              <span className="opacity-50">{brand}:</span> {m}
                              <button onClick={() => {
                                setState(s => ({
                                  ...s,
                                  customModels: {
                                    ...s.customModels,
                                    [brand as Brand]: s.customModels[brand as Brand].filter(mod => mod !== m)
                                  }
                                }));
                              }} className="text-rose-500 hover:text-rose-700 ml-1">×</button>
                            </motion.span>
                          ))
                        )}
                      </div>
                   </div>
                </div>

                {/* Synchronization & API Card */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 md:col-span-2">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center">
                     <RefreshCw className="mr-2 text-brand-500 opacity-70" size={16} />
                     {t.sync} & {t.api}
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                          <Key size={12} className="text-brand-500" /> {t.githubToken}
                        </label>
                        <input 
                          type="password" 
                          placeholder="ghp_..." 
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none text-sm font-semibold border border-transparent focus:border-brand-500/30 transition-all"
                          value={state.syncSettings?.githubToken || ''}
                          onChange={(e) => setState(s => ({ ...s, syncSettings: { ...s.syncSettings, githubToken: e.target.value } }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                          <Github size={12} className="text-brand-500" /> {t.repoName}
                        </label>
                        <input 
                          type="text" 
                          placeholder="username/repo" 
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none text-sm font-semibold border border-transparent focus:border-brand-500/30 transition-all"
                          value={state.syncSettings?.repoName || ''}
                          onChange={(e) => setState(s => ({ ...s, syncSettings: { ...s.syncSettings, repoName: e.target.value } }))}
                        />
                      </div>
                   </div>
                   <div className="flex flex-col md:flex-row items-center justify-between pt-4 gap-4">
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
                        {t.lastSync}: <span className="text-slate-900 dark:text-slate-100">{state.syncSettings?.lastSync ? new Date(state.syncSettings.lastSync).toLocaleString() : 'Never'}</span>
                      </div>
                      <div className="grid grid-cols-2 md:flex md:flex-row gap-3 w-full md:w-auto">
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={restoreFromGithub}
                          className="flex items-center justify-center space-x-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 px-4 py-4 rounded-2xl hover:bg-slate-200 transition-all font-semibold uppercase text-[10px] tracking-widest"
                        >
                          <Download size={14} />
                          <span>{t.restore || (state.language === 'ru' ? 'Восстановить' : 'Restore')}</span>
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={syncToGithub}
                          className="flex items-center justify-center space-x-2 bg-brand-600 text-white px-4 py-4 rounded-2xl hover:bg-brand-700 transition-all font-semibold uppercase text-[10px] tracking-widest shadow-lg shadow-brand-500/20"
                        >
                          <RefreshCw size={14} />
                          <span>{t.syncNow}</span>
                        </motion.button>
                      </div>
                   </div>
                </div>


             </div>
          </div>
        )}
      </main>

      {/* REFINED ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative border border-white/5">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-8 flex items-center gap-3">
               <div className="p-2.5 bg-brand-50 dark:bg-brand-900/30 rounded-xl text-brand-600">
                  <Plus size={18} />
               </div>
               {t.addDevice}
            </h2>
            
            <form onSubmit={addDevice} className="space-y-6">
              {/* Group A: Model Specs */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                   <Tag size={12} className="text-brand-500 opacity-60" />
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Specifications</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <InputWrapper label={t.brand}>
                      <select name="brand" required value={modalSelectedBrand} onChange={(e) => setModalSelectedBrand(e.target.value as Brand)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none border-none text-sm font-medium">
                        <option value="iPhone">iPhone</option>
                        <option value="Samsung">Samsung</option>
                      </select>
                   </InputWrapper>
                   <InputWrapper label={t.storage}>
                      <select name="storage" required className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none border-none text-sm font-medium">
                        {STORAGE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </InputWrapper>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <InputWrapper label={t.model}>
                      <input list="modal-models-list" name="model" required className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none text-sm font-medium" placeholder="Model" />
                      <datalist id="modal-models-list">
                        {(modalSelectedBrand === 'iPhone' ? IPHONE_MODELS : SAMSUNG_MODELS).map(m => <option key={m} value={m} />)}
                        {state.customModels[modalSelectedBrand].map(m => <option key={m} value={m} />)}
                      </datalist>
                   </InputWrapper>
                   <InputWrapper label={t.imei} icon={Hash}>
                      <input name="imei" required placeholder="IMEI" className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none text-sm font-medium" />
                   </InputWrapper>
                </div>
              </div>

              {/* Group B: Logistics */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 px-1">
                   <CalendarDays size={12} className="text-brand-500 opacity-60" />
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sourcing</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <InputWrapper label={t.purchasedFrom} icon={Store}>
                      <input name="purchasedFrom" required placeholder="Source" className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none text-sm font-medium" />
                   </InputWrapper>
                   <InputWrapper label={t.purchaseDate}>
                      <input name="purchaseDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none text-[11px] font-bold" />
                   </InputWrapper>
                </div>
                <InputWrapper label={t.purchasePrice} icon={DollarSign}>
                   <input name="purchasePrice" type="number" required placeholder="0.00" className="w-full p-4 bg-brand-500/5 dark:bg-brand-500/10 rounded-2xl outline-none text-xl font-bold text-brand-600 focus:ring-1 ring-brand-500/20" />
                </InputWrapper>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 font-semibold text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-slate-900 dark:bg-brand-600 text-white font-semibold text-[10px] uppercase tracking-widest rounded-2xl shadow-lg">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SELL MODAL remains refined as per logic ... */}
      {showSellModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative border border-white/5">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-1 uppercase tracking-tight">{t.sell}</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-8 italic">{showSellModal.model} • IMEI {showSellModal.imei.slice(-4)}</p>
            
            <form onSubmit={sellDevice} className="space-y-6">
              <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl space-y-5 border border-slate-100 dark:border-slate-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                     <Users size={16} className="text-brand-500 opacity-60" />
                     <span className="font-bold text-[10px] uppercase tracking-widest italic">{t.installment}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="isInstallment" className="sr-only peer" onChange={(e) => setIsInstallmentMode(e.target.checked)} />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:start-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                  </label>
                </div>
                
                {isInstallmentMode && (
                   <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top duration-300">
                      <InputWrapper label={t.customer + " Name"}>
                        <input name="customerName" required className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl outline-none font-semibold text-sm" />
                      </InputWrapper>
                      <InputWrapper label="Phone">
                        <input name="customerPhone" required className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl outline-none font-semibold text-sm" />
                      </InputWrapper>
                      <InputWrapper label={t.months}>
                        <select name="months" className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl outline-none font-semibold text-sm">
                          <option value="1">1 Month</option>
                          <option value="2">2 Months</option>
                          <option value="3">3 Months</option>
                        </select>
                      </InputWrapper>
                      <InputWrapper label={t.downPayment}>
                        <input name="paidAmount" type="number" placeholder="0.00" className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl outline-none font-semibold text-sm" />
                      </InputWrapper>
                   </div>
                )}
              </div>

              <InputWrapper label={t.sellingPrice}>
                <div className="relative">
                   <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-600" size={20} />
                   <input name="salePrice" type="number" defaultValue={showSellModal.purchasePrice + 80} required className="w-full pl-10 pr-6 py-5 bg-brand-500/5 dark:bg-brand-500/10 border-2 border-brand-500 text-brand-600 dark:text-brand-400 text-2xl font-semibold rounded-2xl outline-none italic" />
                </div>
              </InputWrapper>

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => { setShowSellModal(null); setIsInstallmentMode(false); }} className="flex-1 py-3 font-semibold text-[10px] uppercase tracking-widest text-slate-400">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-brand-600 text-white font-semibold text-[10px] uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition-all">Sell Device</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD DEBTOR MODAL */}
      {showAddDebtorModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative border border-white/5">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-8 flex items-center gap-3">
               <div className="p-2.5 bg-brand-50 dark:bg-brand-900/30 rounded-xl text-brand-600">
                  <Users size={18} />
               </div>
               {t.addDebtor || (state.language === 'ru' ? 'Добавить должника' : 'Add Debtor')}
            </h2>
            
            <form onSubmit={addDebtor} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <InputWrapper label={t.customer + " Name"}>
                  <input name="customerName" required className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none font-semibold text-sm" />
                </InputWrapper>
                <InputWrapper label="Phone">
                  <input name="customerPhone" required className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none font-semibold text-sm" />
                </InputWrapper>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <InputWrapper label={t.months}>
                  <select name="months" className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none font-semibold text-sm">
                    <option value="1">1 Month</option>
                    <option value="2">2 Months</option>
                    <option value="3">3 Months</option>
                  </select>
                </InputWrapper>
                <InputWrapper label={t.downPayment}>
                  <input name="paidAmount" type="number" placeholder="0.00" className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none font-semibold text-sm" />
                </InputWrapper>
              </div>

              <InputWrapper label={t.sellingPrice}>
                <div className="relative">
                   <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-600" size={20} />
                   <input name="salePrice" type="number" required placeholder="0.00" className="w-full pl-10 pr-6 py-5 bg-brand-500/5 dark:bg-brand-500/10 border-2 border-brand-500 text-brand-600 dark:text-brand-400 text-2xl font-semibold rounded-2xl outline-none italic" />
                </div>
              </InputWrapper>

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowAddDebtorModal(false)} className="flex-1 py-3 font-semibold text-[10px] uppercase tracking-widest text-slate-400">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-brand-600 text-white font-semibold text-[10px] uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition-all">Save Debtor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
