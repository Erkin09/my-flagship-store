
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Device, Sale, AppState, Brand, Storage } from './types';
import { translations, DEFAULT_IPHONE_MODELS, DEFAULT_SAMSUNG_MODELS, STORAGE_OPTIONS } from './constants';
import { 
  LayoutDashboard, Smartphone, ShoppingCart, Users, BarChart3, Settings, 
  Plus, Search, Moon, Sun, Globe, TrendingUp, RotateCcw, User, Calendar, 
  Store, DollarSign, Wallet, Coins, Box, Hash, CalendarDays, Tag, ChevronRight,
  BrainCircuit, Sparkles, RefreshCw, Trash2, ArrowLeftRight, CheckCircle2, Info,
  Check, X, Cloud, CloudUpload, CloudDownload, Copy, Key, Zap, Download, Laptop, Undo2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { GoogleGenAI } from "@google/genai";

const generateId = () => Math.random().toString(36).substr(2, 9);
const CLOUD_STORAGE_URL = 'https://jsonblob.com/api/jsonBlob';

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-all duration-300 ${
      active 
        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40'
    }`}
  >
    <Icon size={18} />
    <span className={`text-sm ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
  </button>
);

const Card = ({ title, subtitle, icon: Icon, colorClass = "bg-brand-50 text-brand-600", trend, isPrimary }: any) => (
  <div className={`${isPrimary ? 'bg-brand-600 text-white shadow-2xl shadow-brand-500/20' : 'bg-white dark:bg-slate-800/50 text-slate-900 dark:text-slate-50'} backdrop-blur-sm p-5 rounded-[2rem] border ${isPrimary ? 'border-brand-500' : 'border-slate-100 dark:border-slate-800/50'} group transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between h-full min-h-[140px]`}>
    {isPrimary && <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 text-white"><Icon size={80} /></div>}
    <div className="flex justify-between items-start mb-2 relative z-10">
      <div className={`p-2 rounded-2xl ${isPrimary ? 'bg-white/20 text-white' : colorClass}`}>
        <Icon size={18} />
      </div>
      {trend && (
        <span className={`text-[9px] font-black ${isPrimary ? 'text-white bg-white/20' : 'text-brand-600 bg-brand-50 dark:bg-brand-900/20'} px-2.5 py-1 rounded-full whitespace-nowrap uppercase tracking-tighter`}>
          {trend}
        </span>
      )}
    </div>
    <div className="relative z-10 text-left">
      <h3 className={`text-[9px] font-bold ${isPrimary ? 'text-white/60' : 'text-slate-400 dark:text-slate-500'} uppercase tracking-widest mb-0.5`}>{title}</h3>
      <p className="text-xl lg:text-2xl font-black tracking-tighter leading-none truncate">{subtitle}</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'sales' | 'debtors' | 'analytics' | 'settings'>('dashboard');
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('flagship_hub_v19');
    if (saved) return JSON.parse(saved);
    return { 
      devices: [], 
      sales: [], 
      language: 'ru', 
      theme: 'dark', 
      cashBalance: 0,
      exchangeRate: 12850,
      customIphoneModels: DEFAULT_IPHONE_MODELS,
      customSamsungModels: DEFAULT_SAMSUNG_MODELS,
      aiAdvice: '',
      autoSync: false
    };
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState<Device | null>(null);
  const [isInstallmentMode, setIsInstallmentMode] = useState(false);
  const [modalSelectedBrand, setModalSelectedBrand] = useState<Brand>('iPhone');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelBrand, setNewModelBrand] = useState<Brand>('iPhone');
  const [syncKeyInput, setSyncKeyInput] = useState('');
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [paymentValue, setPaymentValue] = useState<string>('');

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    localStorage.setItem('flagship_hub_v19', JSON.stringify(state));
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
    if (state.autoSync && state.syncId) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => backgroundSaveToCloud(), 5000);
    }
  }, [state]);

  const t = translations[state.language];

  const downloadProject = async () => {
    // @ts-ignore
    const zip = new JSZip();
    const fileList = [
      { name: 'index.html', path: '/index.html' },
      { name: 'index.tsx', path: '/index.tsx' },
      { name: 'App.tsx', path: '/App.tsx' },
      { name: 'types.ts', path: '/types.ts' },
      { name: 'constants.tsx', path: '/constants.tsx' },
      { name: 'package.json', path: '/package.json' },
      { name: 'vite.config.ts', path: '/vite.config.ts' },
      { name: 'metadata.json', path: '/metadata.json' },
    ];

    try {
      for (const f of fileList) {
        const response = await fetch(f.path);
        const content = await response.text();
        zip.file(f.name, content);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      // @ts-ignore
      saveAs(blob, "flagship-hub-source.zip");
      alert(state.language === 'ru' ? "Проект успешно скачан! Распакуйте архив на ПК." : "Project downloaded successfully!");
    } catch (e) {
      alert("Error building zip: " + e);
    }
  };

  const backgroundSaveToCloud = async () => {
    if (!state.syncId) return;
    setIsSyncing(true);
    try {
      await fetch(`${CLOUD_STORAGE_URL}/${state.syncId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
      setState(prev => ({ ...prev, lastSynced: new Date().toISOString() }));
    } catch (e) { setSyncError(true); } finally { setIsSyncing(false); }
  };

  const saveToCloud = async () => {
    setIsSyncing(true);
    try {
      const url = state.syncId ? `${CLOUD_STORAGE_URL}/${state.syncId}` : CLOUD_STORAGE_URL;
      const response = await fetch(url, {
        method: state.syncId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
      if (response.ok) {
        if (!state.syncId) {
          const blobUrl = response.headers.get('Location');
          const newId = blobUrl?.split('/').pop();
          if (newId) setState(prev => ({ ...prev, syncId: newId, lastSynced: new Date().toISOString() }));
        } else {
          setState(prev => ({ ...prev, lastSynced: new Date().toISOString() }));
        }
        alert(state.language === 'ru' ? 'Синхронизация успешна!' : 'Sync Successful!');
      }
    } catch (e) { setSyncError(true); } finally { setIsSyncing(false); }
  };

  const loadFromCloud = async () => {
    const key = syncKeyInput || state.syncId;
    if (!key) return;
    setIsSyncing(true);
    try {
      const res = await fetch(`${CLOUD_STORAGE_URL}/${key}`);
      if (res.ok) {
        const data = await res.json();
        setState({ ...data, syncId: key, lastSynced: new Date().toISOString() });
        setSyncKeyInput('');
        alert(state.language === 'ru' ? 'Данные загружены!' : 'Data Loaded!');
      }
    } catch (e) { setSyncError(true); } finally { setIsSyncing(false); }
  };

  const devicesInStock = state.devices.filter(d => d.status === 'In Stock');
  const stockValue = devicesInStock.reduce((acc, d) => acc + d.purchasePrice, 0);
  const activeSales = state.sales.filter(s => s.status === 'Completed');
  const debtorsList = activeSales.filter(s => s.isInstallment && s.installmentPlan && (s.installmentPlan.paidAmount < s.salePrice - 0.01));
  const totalDebt = debtorsList.reduce((acc, s) => acc + (s.salePrice - (s.installmentPlan?.paidAmount || 0)), 0);
  const totalAssets = stockValue + totalDebt + state.cashBalance;

  const chartData = useMemo(() => {
    const year = new Date().getFullYear();
    const months = state.language === 'ru' 
      ? ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return months.map((name, i) => {
      const monthSales = state.sales.filter(s => {
        const d = new Date(s.date);
        return d.getFullYear() === year && d.getMonth() === i && s.status === 'Completed';
      });
      const profit = monthSales.reduce((acc, s) => {
        const dev = state.devices.find(d => d.id === s.deviceId);
        return acc + (s.salePrice - (dev?.purchasePrice || 0));
      }, 0);
      return { name, profit, sales: monthSales.length };
    });
  }, [state.sales, state.devices, state.language]);

  const generateAIAdvice = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Shop analytics: Total Assets $${totalAssets}, Stock $${stockValue}, Debtors $${totalDebt}, Cash $${state.cashBalance}. Total devices in stock: ${devicesInStock.length}. Give 4 short business growth tips in ${state.language === 'ru' ? 'Russian' : 'English'}.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setState(prev => ({ ...prev, aiAdvice: response.text || 'Error generating advice' }));
    } catch (e) { 
      console.error(e);
      setState(prev => ({ ...prev, aiAdvice: 'Не удалось связаться с ИИ. Проверьте ключ API.' }));
    } finally { setIsAiLoading(false); }
  };

  const addDevice = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const dev: Device = {
      id: generateId(),
      brand: fd.get('brand') as Brand,
      model: fd.get('model') as string,
      storage: fd.get('storage') as Storage,
      imei: fd.get('imei') as string,
      purchasePrice: Number(fd.get('purchasePrice')),
      purchasedFrom: fd.get('purchasedFrom') as string || 'Unknown',
      purchaseDate: new Date().toISOString(),
      status: 'In Stock',
      dateAdded: new Date().toISOString()
    };
    setState(prev => ({ ...prev, devices: [dev, ...prev.devices] }));
    setShowAddModal(false);
  };

  const sellDevice = (e: any) => {
    e.preventDefault();
    if (!showSellModal) return;
    const fd = new FormData(e.currentTarget);
    const isInst = fd.get('isInstallment') === 'on';
    const sPrice = Number(fd.get('salePrice'));
    const pAmount = isInst ? Number(fd.get('paidAmount')) : sPrice;

    const sale: Sale = {
      id: generateId(),
      deviceId: showSellModal.id,
      customerName: fd.get('customerName') as string || "Guest",
      customerPhone: fd.get('customerPhone') as string || "N/A",
      salePrice: sPrice,
      date: new Date().toISOString(),
      isInstallment: isInst,
      status: 'Completed',
      ...(isInst ? { installmentPlan: { months: Number(fd.get('months')) as any, paidAmount: pAmount, dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() } } : {})
    };

    setState(prev => ({
      ...prev,
      sales: [sale, ...prev.sales],
      devices: prev.devices.map(d => d.id === showSellModal.id ? { ...d, status: 'Sold' } : d),
      cashBalance: prev.cashBalance + pAmount
    }));
    setShowSellModal(null);
    setIsInstallmentMode(false);
  };

  const returnSale = (saleId: string) => {
    if (!confirm(state.language === 'ru' ? "Вернуть товар на склад?" : "Return item to stock?")) return;
    setState(prev => {
      const sale = prev.sales.find(s => s.id === saleId);
      if (!sale) return prev;
      const refundAmount = sale.isInstallment ? (sale.installmentPlan?.paidAmount || 0) : sale.salePrice;
      return {
        ...prev,
        sales: prev.sales.map(s => s.id === saleId ? { ...s, status: 'Returned' } : s),
        devices: prev.devices.map(d => d.id === sale.deviceId ? { ...d, status: 'In Stock' } : d),
        cashBalance: prev.cashBalance - refundAmount
      };
    });
  };

  const handleAddPayment = (saleId: string, amount: number) => {
    if (isNaN(amount) || amount <= 0) return;
    setState(prev => {
      const updatedSales = prev.sales.map(s => {
        if (s.id === saleId && s.installmentPlan) {
          return { ...s, installmentPlan: { ...s.installmentPlan, paidAmount: s.installmentPlan.paidAmount + amount } };
        }
        return s;
      });
      return { ...prev, sales: updatedSales, cashBalance: prev.cashBalance + amount };
    });
    setActivePaymentId(null);
    setPaymentValue('');
  };

  const addNewModel = () => {
    if (!newModelName.trim()) return;
    const key = newModelBrand === 'iPhone' ? 'customIphoneModels' : 'customSamsungModels';
    if (state[key].includes(newModelName)) { alert("Уже есть!"); return; }
    setState(prev => ({ ...prev, [key]: [...prev[key], newModelName.trim()].sort() }));
    setNewModelName('');
    alert("Модель добавлена!");
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0B0F19] transition-colors duration-500 font-sans">
      <aside className="w-64 border-r border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-6 hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="flex items-center space-x-3 mb-10 px-2">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <Smartphone size={20} />
          </div>
          <span className="text-lg font-bold tracking-tight dark:text-white uppercase">Flagship<span className="text-brand-500">Hub</span></span>
        </div>
        <nav className="space-y-2 flex-1">
          <SidebarItem icon={LayoutDashboard} label={t.dashboard} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={Box} label={t.inventory} active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
          <SidebarItem icon={ShoppingCart} label={t.sales} active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} />
          <SidebarItem icon={Users} label={t.debtors} active={activeTab === 'debtors'} onClick={() => setActiveTab('debtors')} />
          <SidebarItem icon={BarChart3} label={t.analytics} active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
        </nav>
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
          <SidebarItem icon={Settings} label={t.settings} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </aside>

      <main className="flex-1 p-4 lg:p-12 overflow-x-hidden">
        <header className="flex flex-wrap justify-between items-center mb-10 gap-4">
          <div className="text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase">{t[activeTab]}</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">{new Date().toLocaleDateString(state.language === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center space-x-3">
             <div className="hidden sm:flex items-center space-x-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700">
               <Globe className="text-brand-500" size={14} />
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">$1 ≈ {state.exchangeRate.toLocaleString()} UZS</span>
             </div>
             <button onClick={() => setState(s => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))} className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-brand-500 transition-all">
               {state.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
             </button>
             <button onClick={() => setState(s => ({ ...s, language: s.language === 'ru' ? 'en' : 'ru' }))} className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">
               {state.language}
             </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card title={t.totalAssets} subtitle={`$${totalAssets.toLocaleString()}`} icon={Coins} isPrimary />
              <Card title={t.stockValue} subtitle={`$${stockValue.toLocaleString()}`} icon={Box} colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20" trend={`${devicesInStock.length} шт`} />
              <Card title={t.cash} subtitle={`$${state.cashBalance.toLocaleString()}`} icon={Wallet} colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" trend="Касса" />
              <Card title={t.debtors} subtitle={`$${totalDebt.toLocaleString()}`} icon={Users} colorClass="bg-rose-50 text-rose-600 dark:bg-rose-900/20" trend="Долги" />
            </div>
            <div className="bg-white dark:bg-slate-800/40 p-8 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 text-left">{t.monthlyPerformance}</h3>
               <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData}>
                     <defs>
                       <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/></linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                     <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                     <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', backgroundColor: state.theme === 'dark' ? '#1e293b' : '#fff' }} />
                     <Area type="monotone" dataKey="profit" stroke="#0ea5e9" strokeWidth={4} fill="url(#grad1)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder={t.search} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 rounded-2xl outline-none text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700" />
              </div>
              <button onClick={() => setShowAddModal(true)} className="px-6 py-4 bg-brand-600 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-all"><Plus size={16} /> <span>{t.addDevice}</span></button>
            </div>
            <div className="bg-white dark:bg-slate-800/40 rounded-[2.5rem] overflow-x-auto border border-slate-200/50 dark:border-slate-800/50 shadow-sm text-left">
              <table className="w-full text-left min-w-[600px] text-slate-900 dark:text-slate-100">
                <thead><tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-400"><th className="px-8 py-6">{t.model}</th><th className="px-8 py-6">{t.storage}</th><th className="px-8 py-6">{t.imei}</th><th className="px-8 py-6">{t.price}</th><th className="px-8 py-6 text-right">{t.actions}</th></tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {devicesInStock.filter(d => d.model.toLowerCase().includes(searchQuery.toLowerCase()) || d.imei.includes(searchQuery)).map(device => (
                    <tr key={device.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-8 py-6 font-bold">{device.model}</td>
                      <td className="px-8 py-6 font-black uppercase tracking-tight text-[10px]">{device.storage}</td>
                      <td className="px-8 py-6 text-xs text-slate-500 font-mono">{device.imei}</td>
                      <td className="px-8 py-6 font-black">${device.purchasePrice}</td>
                      <td className="px-8 py-6 text-right"><button onClick={() => setShowSellModal(device)} className="px-5 py-2.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 hover:bg-brand-600 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-sm">{t.sell}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800/40 rounded-[2.5rem] overflow-x-auto border border-slate-200/50 dark:border-slate-800/50 shadow-sm text-left">
              <table className="w-full text-left min-w-[800px] text-slate-900 dark:text-slate-100">
                <thead><tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-400"><th className="px-8 py-6">{t.date}</th><th className="px-8 py-6">{t.model}</th><th className="px-8 py-6">{t.customer}</th><th className="px-8 py-6">{t.sellingPrice}</th><th className="px-8 py-6">{t.status}</th><th className="px-8 py-6 text-right">{t.actions}</th></tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {state.sales.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(sale => {
                    const dev = state.devices.find(d => d.id === sale.deviceId);
                    return (
                      <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-8 py-6 text-xs text-slate-400">{new Date(sale.date).toLocaleDateString()}</td>
                        <td className="px-8 py-6 font-bold">{dev?.model || 'Deleted Device'}</td>
                        <td className="px-8 py-6 text-sm">{sale.customerName}</td>
                        <td className="px-8 py-6 font-black">${sale.salePrice}</td>
                        <td className="px-8 py-6"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${sale.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'}`}>{sale.status === 'Completed' ? t.completed : t.returned}</span></td>
                        <td className="px-8 py-6 text-right">{sale.status === 'Completed' && (<button onClick={() => returnSale(sale.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"><Undo2 size={18} /></button>)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'debtors' && (
          <div className="grid grid-cols-1 gap-4 text-left">
             {debtorsList.length > 0 ? debtorsList.map(debtor => {
                const dev = state.devices.find(d => d.id === debtor.deviceId);
                const remaining = debtor.salePrice - (debtor.installmentPlan?.paidAmount || 0);
                return (
                  <div key={debtor.id} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center shadow-md gap-6">
                     <div className="flex items-center space-x-6">
                        <div className="w-14 h-14 bg-brand-50 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center text-brand-600"><User size={28} /></div>
                        <div><h4 className="font-black text-xl tracking-tighter leading-none mb-1">{debtor.customerName}</h4><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{dev?.model} • {debtor.customerPhone}</p></div>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.remaining}</p><p className="text-2xl font-black text-rose-500 tracking-tighter">${remaining.toLocaleString()}</p></div>
                        <button onClick={() => { setActivePaymentId(debtor.id); setPaymentValue(remaining.toFixed(2)); }} className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">{t.pay}</button>
                     </div>
                  </div>
                );
             }) : <div className="p-20 text-center opacity-30 font-black uppercase tracking-widest">Должников нет</div>}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8 text-left">
            <div className="bg-white dark:bg-slate-800/60 p-10 rounded-[3rem] border border-brand-500/20 relative overflow-hidden shadow-lg group">
               <div className="flex flex-col sm:flex-row justify-between items-start mb-6 relative z-10 gap-6">
                 <div><h3 className="text-2xl font-black flex items-center space-x-3 tracking-tighter"><BrainCircuit className="text-brand-500" size={28} /><span>{t.aiInsights}</span></h3><p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-2">Gemini 3 Flash Pro</p></div>
                 <button onClick={generateAIAdvice} disabled={isAiLoading} className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center space-x-2 disabled:opacity-50 shadow-xl shadow-brand-500/30 hover:bg-brand-700 transition-all text-white">{isAiLoading ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}<span>{t.generateAI}</span></button>
               </div>
               <div className="min-h-[120px] text-slate-600 dark:text-slate-200 leading-relaxed italic whitespace-pre-wrap font-medium text-lg">{state.aiAdvice || "Нажмите кнопку выше для анализа данных..."}</div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm"><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 text-left">Прибыль ($)</h3><div className="h-[300px]"><ResponsiveContainer><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} /><XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} /><Bar dataKey="profit" fill="#8b5cf6" radius={[10, 10, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
               <div className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm"><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 text-left">Продажи (шт)</h3><div className="h-[300px]"><ResponsiveContainer><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} /><XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} /><Bar dataKey="sales" fill="#10b981" radius={[10, 10, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left pb-20 text-slate-900 dark:text-white">
             {/* Download Project */}
             <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-700 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8 lg:col-span-2 group relative overflow-hidden">
                <div className="text-left relative z-10 flex-1">
                   <div className="flex items-center space-x-4 mb-4"><div className="p-3 bg-brand-500/20 text-brand-400 rounded-2xl"><Laptop size={28} /></div><h3 className="text-2xl font-black text-white uppercase tracking-tighter">Сохранить проект на ПК</h3></div>
                   <p className="text-slate-400 text-sm max-w-xl">Скачайте исходный код для локального запуска или хостинга.</p>
                </div>
                <button onClick={downloadProject} className="w-full lg:w-auto px-10 py-6 bg-brand-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-brand-500/40 hover:bg-brand-500 transition-all flex items-center justify-center space-x-3"><Download size={20} /><span>Скачать .zip</span></button>
             </div>

             {/* Cloud Sync */}
             <div className="bg-brand-600 text-white p-10 rounded-[3rem] shadow-2xl lg:col-span-2 flex flex-col lg:flex-row justify-between gap-10 border border-brand-400/20 relative overflow-hidden group">
                <div className="flex-1 space-y-4 relative z-10">
                   <div className="flex items-center space-x-4"><div className="p-3 bg-white/20 rounded-2xl"><CloudUpload size={24} /></div><h3 className="text-2xl font-black uppercase tracking-tighter">Облачная база</h3></div>
                   <p className="text-white/70 text-sm">Синхронизируйте данные между устройствами через облако.</p>
                   <div className="flex items-center space-x-3 p-4 bg-white/10 rounded-[1.5rem] cursor-pointer" onClick={() => setState(s => ({...s, autoSync: !s.autoSync}))}>
                      <div className={`w-12 h-6 rounded-full relative transition-colors ${state.autoSync ? 'bg-emerald-400' : 'bg-white/20'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${state.autoSync ? 'left-7' : 'left-1'}`}></div></div>
                      <span className="text-xs font-black uppercase">Авто-сохранение</span>
                   </div>
                   {state.syncId && <div className="space-y-1"><label className="text-[10px] font-black opacity-50 uppercase tracking-widest">Облачный ключ:</label><div className="flex items-center space-x-2"><code className="bg-black/20 px-4 py-2 rounded-xl text-sm flex-1">{state.syncId}</code><button onClick={() => {navigator.clipboard.writeText(state.syncId!); alert("Copied!");}} className="p-2 bg-white/10 rounded-lg"><Copy size={16} /></button></div></div>}
                </div>
                <div className="flex-1 bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-4 relative z-10">
                   <p className="font-bold text-sm">Вход по ключу:</p>
                   <div className="flex space-x-2"><input type="text" placeholder="Введите ключ..." value={syncKeyInput} onChange={(e) => setSyncKeyInput(e.target.value)} className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white outline-none text-sm" /><button onClick={loadFromCloud} disabled={isSyncing} className="p-3 bg-brand-500 rounded-xl"><CloudDownload size={20} /></button></div>
                   <div className="grid grid-cols-2 gap-2 pt-2"><button onClick={saveToCloud} disabled={isSyncing} className="py-3 bg-white/10 rounded-xl font-black uppercase text-[10px] tracking-widest">Выгрузить</button><button onClick={loadFromCloud} disabled={isSyncing || !state.syncId} className="py-3 bg-white/10 rounded-xl font-black uppercase text-[10px] tracking-widest">Обновить</button></div>
                </div>
             </div>

             {/* Cash Management - FIXED BUTTON OVERFLOW */}
             <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-full">
                <div><h3 className="text-xl font-black mb-1 uppercase tracking-tight">Учет кассы</h3><p className="text-slate-400 text-xs mb-6">Установить текущий баланс денег в наличии.</p></div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-3xl border border-slate-200 dark:border-slate-700">
                   <input 
                      id="set-cash" 
                      type="number" 
                      defaultValue={state.cashBalance} 
                      className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none font-black text-xl lg:text-2xl text-slate-900 dark:text-white" 
                   />
                   <button 
                      onClick={() => {setState(s => ({...s, cashBalance: Number((document.getElementById('set-cash') as any).value)})); alert("Касса обновлена!");}} 
                      className="shrink-0 px-6 py-3 bg-brand-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-brand-500/20 active:scale-95 transition-all"
                   >
                     OK
                   </button>
                </div>
             </div>

             {/* Add New Model */}
             <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm h-full">
                <h3 className="text-xl font-black mb-1 uppercase tracking-tight">Справочник моделей</h3>
                <p className="text-slate-400 text-xs mb-6">Добавить новую модель в список выбора.</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setNewModelBrand('iPhone')} className={`py-3 rounded-2xl font-bold uppercase text-[9px] border-2 transition-all ${newModelBrand === 'iPhone' ? 'bg-brand-600 text-white border-brand-600 shadow-lg' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-transparent'}`}>iPhone</button>
                    <button onClick={() => setNewModelBrand('Samsung')} className={`py-3 rounded-2xl font-bold uppercase text-[9px] border-2 transition-all ${newModelBrand === 'Samsung' ? 'bg-brand-600 text-white border-brand-600 shadow-lg' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-transparent'}`}>Samsung</button>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-3xl border border-slate-200 dark:border-slate-700">
                    <input 
                      value={newModelName} 
                      onChange={(e) => setNewModelName(e.target.value)} 
                      placeholder="Напр. iPhone 17 Pro" 
                      className="min-w-0 flex-1 bg-transparent px-4 py-2 outline-none font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400" 
                    />
                    <button onClick={addNewModel} className="shrink-0 px-5 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-emerald-700 transition-all">Добавить</button>
                  </div>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Modals remain same but integrated */}
      {activePaymentId && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-left">
            <h3 className="text-2xl font-black mb-6 uppercase tracking-tighter dark:text-white">Принять оплату</h3>
            <input type="number" value={paymentValue} onChange={(e) => setPaymentValue(e.target.value)} className="w-full p-5 bg-slate-100 dark:bg-slate-900 rounded-2xl outline-none font-black text-3xl text-brand-600 mb-6" />
            <div className="flex gap-4"><button onClick={() => setActivePaymentId(null)} className="flex-1 py-4 font-bold uppercase text-[10px] text-slate-400">Отмена</button><button onClick={() => handleAddPayment(activePaymentId, Number(paymentValue))} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Оплатить</button></div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300 text-left">
           <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h2 className="text-2xl font-black mb-8 dark:text-white uppercase tracking-tighter">{t.addDevice}</h2>
              <form onSubmit={addDevice} className="space-y-6">
                 <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.brand}</label><select name="brand" value={modalSelectedBrand} onChange={(e) => setModalSelectedBrand(e.target.value as Brand)} className="w-full p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl outline-none font-bold text-slate-900 dark:text-white"><option value="iPhone">iPhone</option><option value="Samsung">Samsung</option></select></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.storage}</label><select name="storage" defaultValue="256Gb" className="w-full p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl outline-none font-bold text-slate-900 dark:text-white">{STORAGE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                 </div>
                 <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.model}</label><input list="models" name="model" required placeholder="Напр. iPhone 15 Pro Max" className="w-full p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl outline-none font-bold text-slate-900 dark:text-white" /><datalist id="models">{(modalSelectedBrand === 'iPhone' ? state.customIphoneModels : state.customSamsungModels).map(m => <option key={m} value={m} />)}</datalist></div>
                 <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.imei}</label><input name="imei" required placeholder="IMEI..." className="w-full p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl outline-none font-bold text-slate-900 dark:text-white" /></div>
                 <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.purchasePrice} ($)</label><input name="purchasePrice" type="number" required className="w-full p-5 bg-brand-500/5 rounded-3xl border-4 border-brand-500/20 outline-none font-black text-3xl text-brand-600" /></div>
                 <button type="submit" className="w-full py-5 bg-brand-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-brand-500/30 hover:bg-brand-700 transition-all">Сохранить</button>
              </form>
           </div>
        </div>
      )}

      {showSellModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 z-[100] animate-in zoom-in duration-300 text-left">
           <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h2 className="text-2xl font-black mb-1 dark:text-white uppercase tracking-tighter">{t.sell}</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8">{showSellModal.model} • {showSellModal.imei}</p>
              <form onSubmit={sellDevice} className="space-y-6">
                 <div className="flex items-center justify-between p-5 bg-slate-100 dark:bg-slate-900 rounded-3xl mb-6 shadow-inner border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center space-x-3"><CalendarDays className="text-brand-500" size={20} /><span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t.installment}</span></div>
                    <input type="checkbox" name="isInstallment" className="w-7 h-7 rounded-xl accent-brand-600 cursor-pointer shadow-sm" onChange={(e) => setIsInstallmentMode(e.target.checked)} />
                 </div>
                 {isInstallmentMode && (
                   <div className="space-y-4 animate-in slide-in-from-top duration-500">
                      <div className="grid grid-cols-2 gap-4"><input name="customerName" placeholder="ФИО Клиента" required className="w-full p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl outline-none text-sm font-bold text-slate-900 dark:text-white" /><input name="customerPhone" placeholder="Телефон" required className="w-full p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl outline-none text-sm font-bold text-slate-900 dark:text-white" /></div>
                      <div className="grid grid-cols-2 gap-4"><select name="months" className="w-full p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl outline-none text-sm font-bold text-slate-900 dark:text-white"><option value="1">1 Месяц</option><option value="2">2 Месяца</option><option value="3">3 Месяца</option></select><input name="paidAmount" type="number" placeholder="Взнос $" className="w-full p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl outline-none text-sm font-bold text-slate-900 dark:text-white" /></div>
                   </div>
                 )}
                 <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.sellingPrice} ($)</label><input name="salePrice" type="number" defaultValue={showSellModal.purchasePrice + 100} className="w-full p-6 bg-brand-500/5 rounded-3xl border-4 border-brand-500 outline-none font-black text-5xl text-brand-600" /></div>
                 <div className="flex space-x-4 pt-4"><button type="button" onClick={() => setShowSellModal(null)} className="flex-1 py-4 text-slate-400 font-bold uppercase text-[10px]">Отмена</button><button type="submit" className="flex-[2] py-4 bg-brand-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-brand-500/30 hover:bg-brand-700 transition-all">Продать</button></div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
