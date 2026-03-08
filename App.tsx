
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
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
  Cloud,
  CalendarDays,
  Tag,
  RefreshCw,
  Github,
  Key,
  Database,
  Menu,
  X,
  Edit,
  Trash2,
  CheckCircle,
  Download,
  ShieldCheck,
  Upload
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

// --- Utility Functions ---
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substr(2, 9);
};
const formatDate = (date: string, lang: string) => 
  new Date(date).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' });

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <motion.button
    onClick={onClick}
    className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-all duration-200 ${
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
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('flagship_hub_v7');
    const defaults: AppState = {
      devices: [],
      sales: [],
      language: 'ru',
      theme: 'dark',
      cashBalance: 0,
      exchangeRate: 12195,
      buyRate: 12170,
      sellRate: 12220,
      bankRate: 12150,
      prevExchangeRate: 12195,
      customModels: { iPhone: [], Samsung: [] },
      aiChatHistory: [],
      aiStructuredData: null,
      geminiApiKey: '',
      syncSettings: {
        githubToken: '',
        repoName: '',
        autoSync: false
      },
      currencySettings: {
        autoUpdate: true,
        buyOffset: 25,
        sellOffset: 25
      }
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { 
          ...defaults, 
          ...parsed,
          devices: Array.isArray(parsed.devices) ? parsed.devices : [],
          sales: Array.isArray(parsed.sales) ? parsed.sales : [],
          aiChatHistory: Array.isArray(parsed.aiChatHistory) ? parsed.aiChatHistory : [],
          customModels: parsed.customModels || defaults.customModels,
          geminiApiKey: parsed.geminiApiKey || ''
        };
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    
    // Try to recover from older versions if v7 is empty
    const legacyKeys = ['flagship_hub_v6', 'flagship_hub_v5', 'flagship_hub_v4', 'flagship_hub_v3', 'flagship_hub_v2', 'flagship_hub'];
    for (const key of legacyKeys) {
      const legacyData = localStorage.getItem(key);
      if (legacyData) {
        try {
          const parsed = JSON.parse(legacyData);
          return { ...defaults, ...parsed };
        } catch (e) { continue; }
      }
    }

    return defaults;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddDebtorModal, setShowAddDebtorModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState<Device | null>(null);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [isInstallmentMode, setIsInstallmentMode] = useState(false);
  
  const [modalSelectedBrand, setModalSelectedBrand] = useState<Brand>('iPhone');
  const [modalSelectedStorage, setModalSelectedStorage] = useState<Storage>('128Gb');
  const [batteryHealth, setBatteryHealth] = useState(100);

  useEffect(() => {
    if (modalSelectedBrand === 'iPhone') {
      setModalSelectedStorage('128Gb');
    } else if (modalSelectedBrand === 'Samsung') {
      setModalSelectedStorage('256Gb');
    }
  }, [modalSelectedBrand]);

  const fetchRate = async () => {
    // If manual mode is on, don't fetch
    if (state.currencySettings?.autoUpdate === false && state.currencySettings?.manualRate) {
      return;
    }

    try {
      // 1. Fetch Market Rate (Global USD/UZS)
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      
      // 2. Fetch Official Bank Rate (CBU Uzbekistan) using a CORS proxy
      let newBankRate = 0;
      try {
        // Using allorigins proxy to bypass CORS for the official CBU API
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent('https://cbu.uz/ru/arkhiv-kursov-valyut/json/')}`;
        const cbuProxyRes = await fetch(proxyUrl);
        if (cbuProxyRes.ok) {
          const cbuProxyData = await cbuProxyRes.json();
          const cbuData = JSON.parse(cbuProxyData.contents);
          const usdBank = cbuData.find((item: any) => item.Ccy === 'USD');
          if (usdBank) {
            newBankRate = Math.round(Number(usdBank.Rate));
          }
        }
      } catch (e) {
        console.warn('CBU rate fetch via proxy failed, falling back to market rate');
      }

      if (data && data.rates && data.rates.UZS) {
        const marketRate = Math.round(data.rates.UZS);
        
        // If we couldn't get the bank rate, we use the market rate as a fallback for it
        const finalBankRate = newBankRate || marketRate;

        setState(prev => {
          const buyOffset = prev.currencySettings?.buyOffset ?? 25;
          const sellOffset = prev.currencySettings?.sellOffset ?? 25;

          // The "exact" rate for a business is often the Market Rate
          // We'll use the market rate as the base for Buy/Sell
          const hasRateChanged = Math.abs(prev.exchangeRate - marketRate) >= 1;
          const hasBankRateChanged = finalBankRate > 0 && prev.bankRate !== finalBankRate;

          if (hasRateChanged || hasBankRateChanged || prev.exchangeRate === 1) {
            return { 
              ...prev, 
              prevExchangeRate: prev.exchangeRate,
              exchangeRate: marketRate,
              buyRate: marketRate - buyOffset,
              sellRate: marketRate + sellOffset,
              bankRate: finalBankRate
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
    
    // Auto-Restore on mount if enabled
    if (state.syncSettings?.autoSync && state.syncSettings?.githubToken && state.syncSettings?.repoName) {
      restoreFromGithub(true);
    }

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

  // Magic Restore: If settings are entered and inventory is empty, try to restore
  useEffect(() => {
    if (state.devices.length === 0 && state.sales.length === 0 && 
        state.syncSettings?.githubToken && state.syncSettings?.repoName) {
      const timer = setTimeout(() => {
        restoreFromGithub(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.syncSettings?.githubToken, state.syncSettings?.repoName]);

  const t = translations[state.language];

  // Auto-Sync Logic
  useEffect(() => {
    if (!state.syncSettings?.autoSync || !state.syncSettings?.githubToken || !state.syncSettings?.repoName) return;

    const timeout = setTimeout(() => {
      syncToGithub(true); // Silent sync
    }, 5000); // Debounce 5 seconds

    return () => clearTimeout(timeout);
  }, [state.devices, state.sales, state.cashBalance, state.customModels, state.syncSettings?.autoSync]);

  // Sync to GitHub Logic
  const syncToGithub = async (silent = false) => {
    if (!state.syncSettings?.githubToken || !state.syncSettings?.repoName) {
      if (!silent) alert(state.language === 'ru' ? 'Заполните настройки GitHub' : 'Fill GitHub settings');
      return;
    }

    // Safety check: Don't auto-sync if local data is empty but we have sync settings
    // This prevents overwriting cloud backup if local storage was cleared by browser
    if (silent && state.devices.length === 0 && state.sales.length === 0) {
      return;
    }

    setIsSyncing(true);
    try {
      const { githubToken, repoName } = state.syncSettings;
      const fileName = 'flagship_data.json';
      
      // Create a clean copy of the state without the token to avoid GitHub's secret scanning
      const stateToSync = {
        ...state,
        syncSettings: {
          ...state.syncSettings,
          githubToken: '' // Clear the token in the synced file
        }
      };
      
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(stateToSync, null, 2))));
      
      const trimmedRepo = repoName.trim();
      const trimmedToken = githubToken.trim();

      // 0. Check if repository exists and token is valid
      if (!silent) {
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
        if (!silent) alert(state.language === 'ru' ? 'Синхронизация успешна' : 'Sync successful');
      } else {
        if (!silent) {
          const err = await res.json();
          alert(`Error: ${err.message}`);
        }
      }
    } catch (error) {
      console.error(error);
      if (!silent) alert('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const restoreFromGithub = async (silent = false) => {
    if (!state.syncSettings?.githubToken || !state.syncSettings?.repoName) {
      if (!silent) alert(state.language === 'ru' ? 'Заполните настройки GitHub' : 'Fill GitHub settings');
      return;
    }

    if (!silent && state.devices.length > 0 && !confirm(state.language === 'ru' ? 'Это перезапишет текущие данные. Продолжить?' : 'This will overwrite current data. Continue?')) {
      return;
    }

    setIsSyncing(true);
    try {
      const { githubToken, repoName } = state.syncSettings;
      const fileName = 'flagship_data.json';
      
      const trimmedRepo = repoName.trim();
      const trimmedToken = githubToken.trim();

      const res = await fetch(`https://api.github.com/repos/${trimmedRepo}/contents/${fileName}`, {
        headers: { 
          'Authorization': `Bearer ${trimmedToken}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (res.ok) {
        const data = await res.json();
        // GitHub content can have newlines, strip them before atob
        const base64Content = data.content.replace(/\n/g, '');
        const decodedContent = decodeURIComponent(escape(atob(base64Content)));
        const restoredState = JSON.parse(decodedContent);
        
        // Merge sync settings to keep current token/repo
        setState(prev => ({
          ...restoredState,
          syncSettings: prev.syncSettings,
          // Ensure we don't lose the Gemini API key if it was entered manually
          geminiApiKey: prev.geminiApiKey || restoredState.geminiApiKey
        }));
        
        if (!silent) alert(state.language === 'ru' ? 'Данные восстановлены из облака' : 'Data restored from cloud');
      } else {
        if (!silent) {
          const err = await res.json();
          if (res.status === 404) {
            alert(state.language === 'ru' ? 'Файл данных не найден в репозитории.' : 'Data file not found in repository.');
          } else {
            alert(`Error: ${err.message}`);
          }
        }
      }
    } catch (error) {
      console.error(error);
      if (!silent) alert('Restore failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const testGithubConnection = async () => {
    if (!state.syncSettings?.githubToken || !state.syncSettings?.repoName) {
      alert(state.language === 'ru' ? 'Заполните настройки GitHub' : 'Fill GitHub settings');
      return;
    }

    const trimmedRepo = state.syncSettings.repoName.trim();
    const trimmedToken = state.syncSettings.githubToken.trim();

    if (!trimmedRepo.includes('/')) {
      alert(state.language === 'ru' 
        ? 'Ошибка: Название репозитория должно быть в формате "пользователь/репозиторий" (например: Erkin09/MyInventoryApp)' 
        : 'Error: Repository name must be in "user/repo" format (e.g., Erkin09/MyInventoryApp)');
      return;
    }

    try {
      const res = await fetch(`https://api.github.com/repos/${trimmedRepo}`, {
        headers: { 'Authorization': `Bearer ${trimmedToken}` }
      });

      if (res.ok) {
        const data = await res.json();
        const permissions = data.permissions;
        if (permissions?.push) {
          alert(state.language === 'ru' 
            ? `✅ Соединение успешно!\nРепозиторий: ${data.full_name}\nДоступ на запись: Есть` 
            : `✅ Connection successful!\nRepo: ${data.full_name}\nWrite access: Yes`);
        } else {
          alert(state.language === 'ru' 
            ? `⚠️ Соединение есть, но НЕТ ПРАВ на запись.\nПроверьте галочку "repo" в настройках токена.` 
            : `⚠️ Connected, but NO WRITE ACCESS.\nCheck "repo" scope in token settings.`);
        }
      } else {
        if (res.status === 404) {
          alert(state.language === 'ru' 
            ? '❌ Ошибка 404: Репозиторий не найден.\nПроверьте название и убедитесь, что у токена есть доступ к приватным репозиториям.' 
            : '❌ Error 404: Repository not found.\nCheck the name and ensure the token has access to private repos.');
        } else if (res.status === 401) {
          alert(state.language === 'ru' ? '❌ Ошибка 401: Неверный токен.' : '❌ Error 401: Invalid token.');
        } else {
          const err = await res.json();
          alert(`GitHub Error: ${err.message}`);
        }
      }
    } catch (e) {
      alert('Network error');
    }
  };

  const [aiUserMessage, setAiUserMessage] = useState('');

  const generateAiAnalytics = async () => {
    if (isGeneratingAi) return;
    setIsGeneratingAi(true);
    
    // Clear previous data to show loading state clearly
    setState(prev => ({ ...prev, aiStructuredData: undefined }));

    try {
      // Prioritize manually entered key, then user-selected key from platform dialog, then environment key
      let apiKey = state.geminiApiKey || process.env.API_KEY || process.env.GEMINI_API_KEY || (window as any).GEMINI_API_KEY;
      
      if (!apiKey || apiKey === 'undefined' || apiKey === '') {
        const hasSelected = await (window as any).aistudio?.hasSelectedApiKey?.();
        if (hasSelected) {
          // Re-read from process.env after selection as it might have been injected
          apiKey = process.env.API_KEY || (window as any).GEMINI_API_KEY;
        }
        
        if (!apiKey || apiKey === 'undefined' || apiKey === '') {
          alert(state.language === 'ru' 
            ? 'API ключ не найден. Пожалуйста, введите его вручную в настройках или нажмите "Выбрать API ключ".' 
            : 'API key not found. Please enter it manually in settings or click "Select API Key".');
          setIsGeneratingAi(false);
          return;
        }
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      // Prepare data for AI
      const recentSales = state.sales.filter(s => new Date(s.date) >= thirtyDaysAgo && s.status === 'Completed');
      const totalRevenue = recentSales.reduce((sum, s) => sum + s.salePrice, 0);
      const totalProfitVal = recentSales.reduce((sum, s) => {
        const purchasePrice = s.purchasePrice ?? state.devices.find(d => d.id === s.deviceId)?.purchasePrice ?? 0;
        return sum + (s.salePrice - purchasePrice);
      }, 0);
      
      const inventory = state.devices.filter(d => d.status === 'In Stock');
      const stockValueVal = inventory.reduce((sum, d) => sum + d.purchasePrice, 0);
      
      const inventorySummary = inventory
        .slice(0, 30) // Limit to avoid token limits
        .map(d => `${d.brand} ${d.model} (${d.storage}) - $${d.purchasePrice}`)
        .join('\n');
        
      const salesHistory = recentSales
        .slice(0, 30)
        .map(s => {
          const device = state.devices.find(d => d.id === s.deviceId);
          return `- ${s.date}: ${device?.model} ($${s.salePrice})`;
        }).join('\n');
      
      const prompt = `Анализ магазина электроники "Flagship Hub".
      Текущие показатели (30 дней):
      - Выручка: $${totalRevenue}
      - Чистая прибыль: $${totalProfitVal}
      - Количество продаж: ${recentSales.length}
      - Стоимость склада: $${stockValueVal}
      - Устройств в наличии: ${inventory.length}
      
      История продаж:
      ${salesHistory || 'Нет продаж за период'}
      
      Текущий склад (выборка):
      ${inventorySummary || 'Склад пуст'}
      
      Проанализируй данные и верни JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: `Ты — ведущий бизнес-аналитик. Твоя цель — помочь владельцу магазина смартфонов увеличить прибыль.
          
          ОБЯЗАТЕЛЬНО верни ТОЛЬКО JSON объект (без markdown разметки):
          {
            "summary": "Глубокий анализ текущей ситуации (2-3 абзаца). Упомяни тренды и аномалии.",
            "stats": [
              {"label": "ROI", "value": "XX%"},
              {"label": "Средний чек", "value": "$XXX"},
              {"label": "Оборачиваемость", "value": "X дней"},
              {"label": "Маржа", "value": "XX%"}
            ],
            "chartData": [{"name": "iPhone 15", "value": 5}, {"name": "S24 Ultra", "value": 3}],
            "brandData": [{"name": "Apple", "value": 5000}, {"name": "Samsung", "value": 3000}],
            "profitTrend": [{"date": "01.02", "profit": 200}, {"date": "02.02", "profit": 450}],
            "recommendations": [
              "Конкретный совет по закупкам",
              "Совет по ценообразованию",
              "Маркетинговая идея"
            ]
          }
          
          Язык: Русский. Тон: Профессиональный, экспертный.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              stats: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING }
                  }
                }
              },
              chartData: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    value: { type: Type.NUMBER }
                  }
                }
              },
              brandData: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    value: { type: Type.NUMBER }
                  }
                }
              },
              profitTrend: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    profit: { type: Type.NUMBER }
                  }
                }
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["summary", "stats", "chartData", "brandData", "profitTrend", "recommendations"]
          }
        }
      });

      if (!response.text) {
        throw new Error(state.language === 'ru' ? 'ИИ не вернул текст ответа' : 'AI returned no text');
      }
      
      try {
        // Robust JSON extraction
        let jsonStr = response.text.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim();
        }
        
        const result = JSON.parse(jsonStr);
        setState(prev => ({ ...prev, aiStructuredData: result }));
      } catch (parseError) {
        console.error('JSON Parse Error:', response.text);
        throw new Error(state.language === 'ru' ? 'Ошибка обработки данных от ИИ: Неверный формат JSON' : 'Error processing AI data: Invalid JSON format');
      }
    } catch (error: any) {
      console.error('AI Error:', error);
      alert(error.message || 'Error generating analytics');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const sendAiMessage = async () => {
    if (!aiUserMessage.trim()) return;
    const userMsg = aiUserMessage;
    setAiUserMessage('');
    
    const newHistory: { role: 'user' | 'model', text: string }[] = [...(state.aiChatHistory || []), { role: 'user' as const, text: userMsg }];
    setState(prev => ({ ...prev, aiChatHistory: newHistory }));

    try {
      const apiKey = state.geminiApiKey || process.env.API_KEY || process.env.GEMINI_API_KEY || (window as any).GEMINI_API_KEY;
      if (!apiKey) {
        alert(state.language === 'ru' ? 'API ключ не найден' : 'API key not found');
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "Ты помощник владельца магазина смартфонов. Отвечай четко, по делу, без лишних символов и звездочек. Используй данные магазина если нужно."
        }
      });

      // Send context with the first message if history is short
      const context = `
        Данные магазина:
        - Продаж за все время: ${state.sales.length}
        - Товаров в наличии: ${devicesInStock.length}
        - Общая стоимость склада: $${stockValue.toLocaleString()}
        - Общая прибыль: $${totalProfit.toLocaleString()}
        - Касса: $${state.cashBalance.toLocaleString()}
        - Текущий курс: ${state.exchangeRate} UZS
        - Должников: ${debtorsList.length} на сумму $${totalDebt.toLocaleString()}
      `.trim();
      const response = await chat.sendMessage({ message: `${context}\n\nВопрос пользователя: ${userMsg}` });
      
      setState(prev => ({
        ...prev,
        aiChatHistory: [...(prev.aiChatHistory || []), { role: 'model' as const, text: response.text || '' }]
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const exportData = () => {
    try {
      const dataStr = JSON.stringify(state, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const exportFileDefaultName = `flagship_hub_backup_${new Date().toISOString().split('T')[0]}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', url);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert(state.language === 'ru' ? 'Ошибка при экспорте данных' : 'Error exporting data');
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let imported: any;
        try {
          imported = JSON.parse(content);
          console.log('Importing data:', imported);
        } catch (e) {
          throw new Error(state.language === 'ru' ? 'Файл не является корректным JSON. Проверьте содержимое файла.' : 'File is not a valid JSON. Check file content.');
        }
        
        let devices: Device[] = [];
        let sales: Sale[] = [];
        
        // 1. Handle Inventory -> Devices
        const rawInventory = imported.inventory || imported.devices || (Array.isArray(imported) ? imported : []);
        if (Array.isArray(rawInventory)) {
          devices = rawInventory.map((item: any) => {
            const storageRaw = String(item.storage || '128Gb');
            let storage: Storage = '128Gb';
            if (storageRaw.toLowerCase().includes('64')) storage = '64Gb';
            else if (storageRaw.toLowerCase().includes('128')) storage = '128Gb';
            else if (storageRaw.toLowerCase().includes('256')) storage = '256Gb';
            else if (storageRaw.toLowerCase().includes('512')) storage = '512Gb';
            else if (storageRaw.toLowerCase().includes('1t')) storage = '1Tb';

            return {
              id: String(item.id || generateId()),
              brand: (item.brand === 'Apple' || item.brand === 'iPhone') ? 'iPhone' : 'Samsung',
              model: String(item.model || 'Unknown'),
              storage,
              imei: String(item.imei || ''),
              purchasePrice: Number(item.purchasePrice || item.buyPrice || 0),
              purchasedFrom: String(item.purchasedFrom || item.supplier || ''),
              purchaseDate: String(item.purchaseDate || item.createdAt || new Date().toISOString()),
              batteryHealth: item.battery === null ? undefined : Number(item.batteryHealth || item.battery || 100),
              status: (item.status === 'In Stock' || item.status === 'Sold' || item.status === 'Returned') ? item.status : 'In Stock',
              dateAdded: String(item.dateAdded || item.createdAt || new Date().toISOString())
            };
          });
        }

        // 2. Handle Sales -> Sales
        const rawSales = imported.sales || [];
        if (Array.isArray(rawSales)) {
          sales = rawSales.map((item: any) => ({
            id: String(item.id || generateId()),
            deviceId: item.deviceId ? String(item.deviceId) : undefined,
            customerName: String(item.customerName || ''),
            customerPhone: String(item.customerPhone || ''),
            salePrice: Number(item.salePrice || item.sellPrice || 0),
            purchasePrice: Number(item.purchasePrice || item.buyPrice || 0),
            date: String(item.date || item.soldAt || new Date().toISOString()),
            isInstallment: Boolean(item.isInstallment || false),
            status: (item.status === 'Completed' || item.status === 'Returned') ? item.status : 'Completed'
          }));
        }

        // 3. Handle Debtors -> Sales (Installments)
        const rawDebtors = imported.debtors || [];
        if (Array.isArray(rawDebtors)) {
          const debtorSales: Sale[] = rawDebtors.map((item: any) => ({
            id: String(item.id || generateId()),
            customerName: String(item.name || ''),
            salePrice: Number(item.amountTotal || 0),
            purchasePrice: 0,
            date: String(item.createdAt || new Date().toISOString()),
            isInstallment: true,
            status: 'Completed' as const,
            installmentPlan: {
              months: (item.months === 1 || item.months === 2 || item.months === 3) ? item.months : 1,
              paidAmount: Number((item.amountTotal || 0) - (item.amountLeft || 0)),
              dueDate: String(item.dueDate || new Date().toISOString())
            }
          }));
          sales = [...sales, ...debtorSales];
        }

        if (devices.length === 0 && sales.length === 0 && imported.cash === undefined && imported.cashBalance === undefined) {
          throw new Error(state.language === 'ru' ? 'В файле не найдено данных об устройствах, продажах или должниках' : 'No device, sales or debtors data found in file');
        }

        if (confirm(state.language === 'ru' ? `Найдено: устройств (${devices.length}), продаж (${sales.length}). Вы уверены? Это заменит все текущие данные.` : `Found: devices (${devices.length}), sales (${sales.length}). Are you sure? This will replace all current data.`)) {
          const newState: AppState = {
            ...state,
            devices,
            sales,
            cashBalance: imported.cash !== undefined ? Number(imported.cash) : (imported.cashBalance !== undefined ? Number(imported.cashBalance) : state.cashBalance),
            theme: (imported.theme === 'light' || imported.theme === 'dark') ? imported.theme : state.theme,
            language: (imported.language === 'ru' || imported.language === 'en') ? imported.language : state.language,
            syncSettings: state.syncSettings,
            geminiApiKey: state.geminiApiKey
          };

          setState(newState);
          localStorage.setItem('flagship_hub_v7', JSON.stringify(newState));
          alert(state.language === 'ru' ? 'Данные успешно восстановлены!' : 'Data successfully restored!');
        }
      } catch (error: any) {
        console.error('Import error details:', error);
        alert((state.language === 'ru' ? 'Ошибка при импорте: ' : 'Import error: ') + (error.message || 'Unknown error'));
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const recoverLegacyData = () => {
    const versions = ['flagship_hub', 'flagship_hub_v1', 'flagship_hub_v2', 'flagship_hub_v3', 'flagship_hub_v4', 'flagship_hub_v5', 'flagship_hub_v6'];
    let found = false;

    for (const v of versions) {
      const data = localStorage.getItem(v);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.devices || parsed.sales) {
            if (confirm(state.language === 'ru' 
              ? `Найдена старая версия данных (${v}). Восстановить её? Текущие данные будут заменены.` 
              : `Found legacy data version (${v}). Restore it? Current data will be replaced.`)) {
              setState(prev => ({ ...prev, ...parsed }));
              alert(state.language === 'ru' ? 'Данные успешно восстановлены!' : 'Data successfully restored!');
              found = true;
              break;
            }
          }
        } catch (e) {
          console.error(`Failed to parse legacy data from ${v}`, e);
        }
      }
    }

    if (!found) {
      alert(state.language === 'ru' ? 'Старые версии данных не найдены в этом браузере.' : 'No legacy data versions found in this browser.');
    }
  };

  // Logic Helpers
  const devicesInStock = useMemo(() => state.devices.filter(d => d.status === 'In Stock'), [state.devices]);
  const stockValue = useMemo(() => devicesInStock.reduce((acc, d) => acc + d.purchasePrice, 0), [devicesInStock]);
  
  const debtorsList = useMemo(() => {
    return state.sales.filter(s => 
      s.isInstallment === true && 
      s.status === 'Completed' &&
      s.installmentPlan && 
      Math.round(s.installmentPlan.paidAmount) < Math.round(s.salePrice)
    );
  }, [state.sales]);

  const totalDebt = useMemo(() => debtorsList.reduce((acc, s) => acc + (s.salePrice - (s.installmentPlan?.paidAmount || 0)), 0), [debtorsList]);
  const totalAssets = useMemo(() => stockValue + totalDebt + state.cashBalance, [stockValue, totalDebt, state.cashBalance]);

  const totalProfit = useMemo(() => state.sales
    .filter(s => s.status === 'Completed')
    .reduce((acc, s) => {
      // Use stored purchase price if available, otherwise find it from current devices (legacy support)
      const purchasePrice = s.purchasePrice ?? state.devices.find(d => d.id === s.deviceId)?.purchasePrice ?? 0;
      return acc + (s.salePrice - purchasePrice);
    }, 0), [state.sales, state.devices]);

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
        const purchasePrice = s.purchasePrice ?? state.devices.find(d => d.id === s.deviceId)?.purchasePrice ?? 0;
        return acc + (s.salePrice - purchasePrice);
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
        const purchasePrice = s.purchasePrice ?? state.devices.find(d => d.id === s.deviceId)?.purchasePrice ?? 0;
        return acc + (s.salePrice - purchasePrice);
      }, 0);
      return { name: day.toString(), profit };
    });
  }, [state.sales, state.devices]);

  const lastThreeMonthsData = useMemo(() => {
    const now = new Date();
    const result = [];
    const months = state.language === 'ru' 
      ? ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIndex = d.getMonth();
      const year = d.getFullYear();
      
      const monthlySales = state.sales.filter(s => {
        const sd = new Date(s.date);
        return sd.getFullYear() === year && sd.getMonth() === monthIndex && s.status === 'Completed';
      });

      const totalRevenue = monthlySales.reduce((acc, s) => acc + s.salePrice, 0);
      const totalProfit = monthlySales.reduce((acc, s) => {
        const purchasePrice = s.purchasePrice ?? state.devices.find(dev => dev.id === s.deviceId)?.purchasePrice ?? 0;
        return acc + (s.salePrice - purchasePrice);
      }, 0);

      // Calculate percentage based on a dynamic target (e.g. 1.5x previous month or fixed 5k)
      const target = 5000; 
      const percent = Math.min(Math.round((totalProfit / target) * 100), 100);

      result.push({
        name: months[monthIndex],
        revenue: totalRevenue,
        profit: totalProfit,
        percent
      });
    }
    return result;
  }, [state.sales, state.devices, state.language]);

  const filteredDevices = useMemo(() => devicesInStock.filter(d => 
    d.imei.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.model.toLowerCase().includes(searchQuery.toLowerCase())
  ), [devicesInStock, searchQuery]);

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
      batteryHealth: formData.get('brand') === 'iPhone' ? Number(formData.get('batteryHealth')) : undefined,
      status: 'In Stock',
      dateAdded: new Date().toISOString()
    };
    setState(prev => ({ ...prev, devices: [newDevice, ...prev.devices] }));
    setShowAddModal(false);
  };

  const updateDevice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDevice) return;
    const formData = new FormData(e.currentTarget);
    const updatedDevice: Device = {
      ...editingDevice,
      brand: formData.get('brand') as Brand,
      model: formData.get('model') as string,
      storage: formData.get('storage') as Storage,
      imei: formData.get('imei') as string,
      purchasePrice: Number(formData.get('purchasePrice')),
      purchasedFrom: formData.get('purchasedFrom') as string,
      purchaseDate: formData.get('purchaseDate') as string,
      batteryHealth: formData.get('batteryHealth') ? Number(formData.get('batteryHealth')) : editingDevice.batteryHealth
    };
    setState(prev => ({
      ...prev,
      devices: prev.devices.map(d => d.id === editingDevice.id ? updatedDevice : d)
    }));
    setEditingDevice(null);
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
      purchasePrice: showSellModal.purchasePrice,
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
    setState(prev => {
      const sale = prev.sales.find(s => s.id === saleId);
      if (!sale || sale.status !== 'Completed') return prev;
      
      const refundAmount = sale.isInstallment ? (sale.installmentPlan?.paidAmount || 0) : sale.salePrice;
      
      return {
        ...prev,
        sales: prev.sales.map(s => s.id === saleId ? { ...s, status: 'Returned' } : s),
        devices: prev.devices.map(d => d.id === sale.deviceId ? { ...d, status: 'In Stock' } : d),
        cashBalance: prev.cashBalance - refundAmount
      };
    });
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

  const cancelSale = (saleId: string) => {
    setState(prev => {
      const sale = prev.sales.find(s => s.id === saleId);
      if (!sale) return prev;

      const refundAmount = sale.status === 'Completed' 
        ? (sale.isInstallment ? (sale.installmentPlan?.paidAmount || 0) : sale.salePrice)
        : 0;

      return {
        ...prev,
        sales: prev.sales.filter(s => s.id !== saleId),
        devices: prev.devices.map(d => d.id === sale.deviceId ? { ...d, status: 'In Stock' } : d),
        cashBalance: prev.cashBalance - refundAmount
      };
    });
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
        fixed inset-y-0 left-0 z-50 w-64 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-r border-slate-100 dark:border-slate-800 flex flex-col p-4 space-y-1 transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between px-3 py-8 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <Smartphone size={18} />
            </div>
            <span className="text-base font-semibold tracking-tight uppercase text-slate-900 dark:text-white">Fhub</span>
            {state.syncSettings?.autoSync && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[8px] font-bold animate-pulse">
                <RefreshCw size={8} className="animate-spin-slow" />
                CLOUD
              </div>
            )}
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
            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-brand-500">v1.2.5</span>
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
                  {state.syncSettings?.lastSync && (
                    <>
                      <span className="text-slate-200 dark:text-slate-700">|</span>
                      <Cloud size={10} className="text-emerald-500 opacity-60" />
                      <span className="text-emerald-500/80">{new Date(state.syncSettings.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {state.syncSettings?.githubToken && state.syncSettings?.repoName && (
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => syncToGithub()}
                  disabled={isSyncing}
                  className={`hidden md:flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                    isSyncing ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 hover:bg-brand-100'
                  }`}
                >
                  <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? t.syncing : t.syncNow}</span>
                </motion.button>
              )}
            </div>
              
            <div className="flex items-center space-x-2 md:hidden">
              {state.syncSettings?.githubToken && state.syncSettings?.repoName && (
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => syncToGithub()}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-brand-500 shadow-sm transition-all"
                  title={state.language === 'ru' ? 'Синхронизировать сейчас' : 'Sync Now'}
                >
                  <RefreshCw size={16} />
                </motion.button>
              )}
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
            {isSyncing && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-100 dark:border-brand-800/50 text-brand-600 dark:text-brand-400 animate-pulse shrink-0">
                <RefreshCw size={12} className="animate-spin" />
                <span className="text-[9px] font-bold uppercase tracking-widest">{state.language === 'ru' ? 'Облако...' : 'Cloud...'}</span>
              </div>
            )}
            <div className="flex items-center space-x-3 px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm shrink-0">
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-[7px] font-bold text-slate-400 uppercase leading-none">{state.language === 'ru' ? 'Рынок' : 'Market'}</span>
                  {state.exchangeRate > state.prevExchangeRate ? (
                    <TrendingUp size={8} className="text-emerald-500" />
                  ) : state.exchangeRate < state.prevExchangeRate ? (
                    <TrendingUp size={8} className="text-rose-500 rotate-180" />
                  ) : null}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] font-bold text-emerald-600 leading-none">{state.buyRate.toLocaleString()}</span>
                  <span className="text-[8px] text-slate-300">/</span>
                  <span className="text-[10px] font-bold text-rose-600 leading-none">{state.sellRate.toLocaleString()}</span>
                </div>
              </div>
              <div className="w-px h-5 bg-slate-100 dark:bg-slate-700" />
              <div className="flex flex-col">
                <span className="text-[7px] font-bold text-slate-400 uppercase leading-none mb-1">{state.language === 'ru' ? 'Банк' : 'Bank'}</span>
                <span className="text-[10px] font-bold text-blue-600 leading-none">{(state.bankRate || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              {state.syncSettings?.githubToken && state.syncSettings?.repoName && (
                <>
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => restoreFromGithub()}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 shadow-sm transition-all flex items-center gap-2"
                    title={state.language === 'ru' ? 'Восстановить из облака' : 'Restore from Cloud'}
                  >
                    <Download size={18} />
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => syncToGithub()}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-brand-500 shadow-sm transition-all flex items-center gap-2"
                    title={state.language === 'ru' ? 'Синхронизировать сейчас' : 'Sync Now'}
                  >
                    <RefreshCw size={18} />
                  </motion.button>
                </>
              )}
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
            {(!state.syncSettings?.githubToken || !state.syncSettings?.repoName) && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 p-4 rounded-2xl flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-xl text-amber-600 dark:text-amber-400">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-100 uppercase tracking-tight">
                      {state.language === 'ru' ? 'Данные не защищены' : 'Data not protected'}
                    </p>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                      {state.language === 'ru' 
                        ? 'Данные хранятся только в браузере и могут быть удалены. Настройте GitHub Sync в Настройках.' 
                        : 'Data is only stored in your browser and may be cleared. Configure GitHub Sync in Settings.'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button 
                    onClick={recoverLegacyData}
                    className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[9px] font-bold uppercase tracking-widest rounded-xl shadow-sm hover:bg-blue-100 transition-all flex items-center gap-2"
                  >
                    <RotateCcw size={12} />
                    {state.language === 'ru' ? 'Поиск старых данных' : 'Search Legacy'}
                  </button>
                  <label className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-bold uppercase tracking-widest rounded-xl shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 cursor-pointer">
                    <Upload size={12} />
                    {state.language === 'ru' ? 'Восстановить' : 'Restore'}
                    <input type="file" className="hidden" accept=".json" onChange={importData} />
                  </label>
                  <button 
                    onClick={exportData}
                    className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white text-[9px] font-bold uppercase tracking-widest rounded-xl shadow-sm hover:bg-slate-800 transition-all flex items-center gap-2"
                  >
                    <Download size={12} />
                    {state.language === 'ru' ? 'Скачать копию' : 'Download Backup'}
                  </button>
                  <button 
                    onClick={() => setActiveTab('settings')}
                    className="px-4 py-2 bg-amber-600 text-white text-[9px] font-bold uppercase tracking-widest rounded-xl shadow-sm hover:bg-amber-700 transition-all"
                  >
                    {state.language === 'ru' ? 'Настроить Sync' : 'Configure Sync'}
                  </button>
                </div>
              </motion.div>
            )}

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
              <Card 
                title={state.language === 'ru' ? 'Склад' : 'Stock'} 
                subtitle={`$${stockValue.toLocaleString()} (${devicesInStock.length} шт.)`} 
                icon={Box} 
                colorClass="bg-blue-50 text-blue-600" 
              />
              <Card title={t.totalSales} subtitle={state.sales.filter(s => s.status === 'Completed').length.toString()} icon={ShoppingCart} colorClass="bg-amber-50 text-amber-600" />
              <Card title={t.profit} subtitle={`$${totalProfit.toLocaleString()}`} icon={TrendingUp} colorClass="bg-purple-50 text-purple-600" />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                   <ShieldCheck size={14} className="text-brand-500" />
                   {state.language === 'ru' ? 'Безопасность данных' : 'Data Safety'}
                 </h3>
                 <div className="flex gap-2">
                    <button 
                      onClick={recoverLegacyData}
                      className="text-[9px] font-bold text-blue-500 uppercase tracking-widest hover:underline"
                    >
                      {state.language === 'ru' ? 'Поиск старых данных' : 'Search Legacy'}
                    </button>
                 </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={exportData}
                    className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100 transition-all group"
                  >
                    <Download size={24} className="text-slate-400 group-hover:text-brand-500 mb-2 transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{state.language === 'ru' ? 'Скачать копию' : 'Download Backup'}</span>
                    <span className="text-[8px] text-slate-400 mt-1">{state.language === 'ru' ? 'Сохранить JSON файл' : 'Save JSON file'}</span>
                  </button>
                  <label className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100 transition-all group cursor-pointer">
                    <Upload size={24} className="text-slate-400 group-hover:text-brand-500 mb-2 transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{state.language === 'ru' ? 'Восстановить' : 'Restore'}</span>
                    <span className="text-[8px] text-slate-400 mt-1">{state.language === 'ru' ? 'Загрузить JSON файл' : 'Upload JSON file'}</span>
                    <input type="file" className="hidden" accept=".json" onChange={importData} />
                  </label>
                  {state.syncSettings?.githubToken && state.syncSettings?.repoName ? (
                    <button 
                      onClick={() => syncToGithub()}
                      className="flex flex-col items-center justify-center p-6 bg-brand-600 rounded-2xl border border-brand-500 hover:bg-brand-700 transition-all group shadow-lg shadow-brand-500/20"
                    >
                      <RefreshCw size={24} className="text-white mb-2 transition-transform group-hover:rotate-180 duration-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white">{state.language === 'ru' ? 'Синхронизировать' : 'Sync Now'}</span>
                      <span className="text-[8px] text-brand-100 mt-1">{state.language === 'ru' ? 'Обновить облако' : 'Update cloud'}</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className="flex flex-col items-center justify-center p-6 bg-brand-50 dark:bg-brand-900/20 rounded-2xl border border-brand-100 dark:border-brand-800/50 hover:bg-brand-100 transition-all group"
                    >
                      <RefreshCw size={24} className="text-brand-400 group-hover:text-brand-600 mb-2 transition-colors" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600">{state.language === 'ru' ? 'Настроить Облако' : 'Configure Cloud'}</span>
                      <span className="text-[8px] text-brand-400 mt-1">{state.language === 'ru' ? 'GitHub Sync' : 'GitHub Sync'}</span>
                    </button>
                  )}
               </div>
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
                      <Area isAnimationActive={false} type="monotone" dataKey="profit" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" />
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
                  onClick={() => {
                    setBatteryHealth(100);
                    setModalSelectedBrand('iPhone');
                    setModalSelectedStorage('128Gb');
                    setShowAddModal(true);
                  }}
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
                        <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{state.language === 'ru' ? 'Дата прихода' : 'Arrival Date'}</th>
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
                           {device.batteryHealth && (
                             <p className="text-[9px] font-bold text-emerald-500 mt-1">BH: {device.batteryHealth}%</p>
                           )}
                        </td>
                        <td className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase">
                           {formatDate(device.purchaseDate, state.language)}
                        </td>
                        <td className="px-6 py-4">
                           <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{device.purchasedFrom}</p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-sm text-slate-900 dark:text-slate-100">${device.purchasePrice.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center space-x-3">
                              <button 
                                onClick={() => {
                                  setBatteryHealth(device.batteryHealth || 100);
                                  setEditingDevice(device);
                                }}
                                className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all active:scale-90"
                                title={state.language === 'ru' ? 'Редактировать' : 'Edit'}
                              >
                                <Edit size={18} />
                              </button>
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
          <div className="space-y-8 animate-in fade-in duration-300">
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
                            <Area isAnimationActive={false} type="monotone" dataKey="profit" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfitAnalytic)" />
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
                            <Bar isAnimationActive={false} dataKey="profit" fill="#10b981" radius={[6, 6, 0, 0]} barSize={12} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8">{t.monthlyTotals}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {lastThreeMonthsData.map((data, i) => (
                     <div key={i} className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] border border-slate-100 dark:border-slate-800/50">
                       <div className="relative w-28 h-28 mb-4">
                          <svg className="w-full h-full transform -rotate-90">
                             <circle
                               cx="56"
                               cy="56"
                               r="50"
                               stroke="currentColor"
                               strokeWidth="8"
                               fill="transparent"
                               className="text-slate-200 dark:text-slate-800"
                             />
                             <motion.circle
                               cx="56"
                               cy="56"
                               r="50"
                               stroke="currentColor"
                               strokeWidth="8"
                               fill="transparent"
                               strokeDasharray={314}
                               initial={{ strokeDashoffset: 314 }}
                               animate={{ strokeDashoffset: 314 - (314 * data.percent) / 100 }}
                               transition={{ duration: 1.5, ease: "circOut" }}
                               className="text-brand-500"
                               strokeLinecap="round"
                             />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                             <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">
                               {data.percent}%
                             </span>
                          </div>
                       </div>
                       <div className="text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{data.name}</p>
                          <p className="text-base font-bold text-brand-600 tracking-tight">${data.profit.toLocaleString()}</p>
                          <p className="text-[9px] font-medium text-slate-400 mt-0.5">
                            {state.language === 'ru' ? 'Выручка' : 'Rev'}: ${data.revenue.toLocaleString()}
                          </p>
                       </div>
                     </div>
                   ))}
                </div>
             </div>

             <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BarChart3 size={20} className="text-brand-500" />
                        AI Analytics Pro
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Интеллектуальный анализ вашего бизнеса</p>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={generateAiAnalytics}
                      disabled={isGeneratingAi}
                      className="flex items-center space-x-2 bg-brand-600 text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-brand-500/20 disabled:opacity-50"
                    >
                      {isGeneratingAi ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                      <span>{isGeneratingAi ? 'Анализирую...' : 'Обновить анализ'}</span>
                    </motion.button>
                 </div>
                 
                 {state.aiStructuredData && state.aiStructuredData.stats && state.aiStructuredData.chartData ? (
                   <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                     {/* Left Column: Summary & Main Stats */}
                     <div className="lg:col-span-3 space-y-8">
                       <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                         <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                           <Info size={14} className="text-brand-500" />
                           Обзор бизнеса
                         </h4>
                         <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                           {state.aiStructuredData.summary}
                         </p>
                       </div>

                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         {state.aiStructuredData.stats.map((stat, i) => (
                           <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                             <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">{stat.label}</p>
                             <p className="text-xl font-bold text-brand-600 tracking-tight">{stat.value}</p>
                           </div>
                         ))}
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">Продажи по моделям</h4>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={state.aiStructuredData.chartData || []}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.05} />
                                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '16px', fontSize: '11px', color: '#fff' }}
                                  />
                                  <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={30} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">Тренд прибыли</h4>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={state.aiStructuredData.profitTrend || []}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.05} />
                                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '16px', fontSize: '11px', color: '#fff' }}
                                  />
                                  <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                       </div>

                       <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">Распределение капитала по брендам</h4>
                          <div className="h-64 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={state.aiStructuredData.brandData || []}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {(state.aiStructuredData.brandData || []).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#10b981'} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '16px', fontSize: '11px', color: '#fff' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-col gap-2 ml-4">
                               {(state.aiStructuredData.brandData || []).map((entry, index) => (
                                 <div key={index} className="flex items-center gap-2">
                                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: index === 0 ? '#6366f1' : '#10b981' }} />
                                   <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{entry.name}: ${entry.value.toLocaleString()}</span>
                                 </div>
                               ))}
                            </div>
                          </div>
                       </div>
                     </div>

                     {/* Right Column: Recommendations & Chat */}
                     <div className="space-y-8">
                        <div className="bg-brand-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-brand-500/30">
                          <h4 className="text-base font-bold mb-6 flex items-center gap-2">
                            <CheckCircle size={20} />
                            Рекомендации
                          </h4>
                          <ul className="space-y-4">
                            {state.aiStructuredData.recommendations?.map((rec, i) => (
                              <li key={i} className="text-sm flex gap-3 leading-snug">
                                <span className="shrink-0 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px] font-bold">{i+1}</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-[550px]">
                          <h4 className="text-sm font-bold mb-6 flex items-center gap-2">
                            <Menu size={18} className="text-brand-500" />
                            Чат с ИИ
                          </h4>
                          <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 no-scrollbar">
                            {state.aiChatHistory?.length === 0 && (
                              <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-40">
                                <Smartphone size={32} className="text-slate-400 mb-4" />
                                <p className="text-xs font-medium">Задайте вопрос о продажах или стратегии развития</p>
                              </div>
                            )}
                            {state.aiChatHistory?.map((msg, i) => (
                              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] p-4 rounded-3xl text-xs leading-relaxed shadow-sm ${
                                  msg.role === 'user' 
                                    ? 'bg-brand-600 text-white rounded-tr-none' 
                                    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-tl-none'
                                }`}>
                                  {msg.text}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-3">
                            <input 
                              type="text" 
                              value={aiUserMessage}
                              onChange={(e) => setAiUserMessage(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && sendAiMessage()}
                              placeholder="Спроси аналитика..."
                              className="flex-1 px-5 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none text-xs font-semibold border border-transparent focus:border-brand-500/30 transition-all"
                            />
                            <button 
                              onClick={sendAiMessage}
                              className="p-3 bg-brand-600 text-white rounded-2xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 active:scale-95"
                            >
                              <ArrowRightLeft size={18} />
                            </button>
                          </div>
                        </div>
                     </div>
                   </div>
                 ) : (
                   <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
                     <div className="w-20 h-20 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                       <BarChart3 className="text-brand-600" size={40} />
                     </div>
                     <h4 className="text-lg font-bold mb-2">Аналитика Pro готова</h4>
                     <p className="text-xs font-medium text-slate-400 max-w-xs mx-auto">Нажмите кнопку выше, чтобы получить глубокий анализ с графиками и рекомендациями</p>
                   </div>
                 )}
              </div>
          </div>
        )}

        {/* Settings, Sales, Debtors remain similarly refined in App.tsx logic... */}
        {/* ... (Existing tabs logic but with refined typography classes applied) ... */}
        
        {activeTab === 'sales' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder={state.language === 'ru' ? 'Поиск по клиенту или модели...' : 'Search by customer or model...'}
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none shadow-sm focus:ring-2 ring-brand-500/20 transition-all text-sm font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/60">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.date}</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.model}</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.customer}</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{state.language === 'ru' ? 'Дата закупки' : 'Purchase Date'}</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.purchasePrice}</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.sellingPrice}</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{state.language === 'ru' ? 'Прибыль' : 'Profit'}</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.status}</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                    {state.sales
                      .filter(s => {
                        const device = state.devices.find(d => d.id === s.deviceId);
                        const searchLower = searchQuery.toLowerCase();
                        return (
                          s.customerName?.toLowerCase().includes(searchLower) || 
                          device?.model.toLowerCase().includes(searchLower) ||
                          device?.imei.toLowerCase().includes(searchLower)
                        );
                      })
                      .map(sale => {
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
                          <td className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase">
                            {device ? formatDate(device.purchaseDate, state.language) : '—'}
                          </td>
                          <td className="px-6 py-4 font-semibold text-xs text-slate-400">
                            ${(sale.purchasePrice ?? device?.purchasePrice ?? 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 font-semibold text-base text-brand-600">
                            ${sale.salePrice.toLocaleString()}
                          </td>
                          <td className={`px-6 py-4 font-bold ${(sale.salePrice - (sale.purchasePrice ?? device?.purchasePrice ?? 0)) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            ${(sale.salePrice - (sale.purchasePrice ?? device?.purchasePrice ?? 0)).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase tracking-widest ${
                             sale.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'
                           }`}>
                             {sale.status === 'Completed' ? (sale.isInstallment ? 'In Debt' : 'Paid') : 'Returned'}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-right">
                           {sale.status === 'Completed' && (
                             <div className="flex justify-end items-center space-x-2">
                               <button onClick={() => returnSale(sale.id)} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-rose-500 transition-all active:scale-90" title={state.language === 'ru' ? 'Возврат' : 'Return'}>
                                 <RotateCcw size={14} />
                               </button>
                               <button onClick={() => cancelSale(sale.id)} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-rose-500 transition-all active:scale-90" title={state.language === 'ru' ? 'Удалить' : 'Delete'}>
                                 <X size={14} />
                               </button>
                             </div>
                           )}
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
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
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">
                            {state.language === 'ru' ? 'Автообновление' : 'Auto Update'}
                          </span>
                          <span className="text-[8px] text-slate-400 font-medium uppercase tracking-tighter mt-0.5">
                            {state.language === 'ru' ? 'Обновлять курс автоматически' : 'Fetch rates automatically'}
                          </span>
                        </div>
                        <button 
                          onClick={() => setState(s => ({
                            ...s, 
                            currencySettings: { 
                              ...s.currencySettings, 
                              autoUpdate: !s.currencySettings?.autoUpdate 
                            }
                          }))}
                          className={`w-10 h-5 rounded-full transition-all relative ${state.currencySettings?.autoUpdate ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${state.currencySettings?.autoUpdate ? 'left-6' : 'left-1'}`} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{state.language === 'ru' ? 'Покупка (-)' : 'Buy Offset'}</label>
                          <input 
                            type="number" 
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none text-sm font-semibold border border-transparent focus:border-brand-500/30 transition-all" 
                            value={state.currencySettings?.buyOffset ?? 25} 
                            onChange={(e) => setState(s => ({
                              ...s, 
                              currencySettings: { 
                                ...s.currencySettings, 
                                buyOffset: Number(e.target.value) 
                              }
                            }))} 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{state.language === 'ru' ? 'Продажа (+)' : 'Sell Offset'}</label>
                          <input 
                            type="number" 
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none text-sm font-semibold border border-transparent focus:border-brand-500/30 transition-all" 
                            value={state.currencySettings?.sellOffset ?? 25} 
                            onChange={(e) => setState(s => ({
                              ...s, 
                              currencySettings: { 
                                ...s.currencySettings, 
                                sellOffset: Number(e.target.value) 
                              }
                            }))} 
                          />
                        </div>
                      </div>

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
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{state.language === 'ru' ? 'Банковский курс' : 'Bank Rate'}</label>
                        <div className="flex space-x-2">
                          <input type="number" step="1" className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none text-sm font-semibold border border-transparent focus:border-brand-500/30 transition-all" value={state.bankRate} onChange={(e) => setState(s => ({...s, bankRate: Number(e.target.value)}))} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                 {/* Backup & Restore Card */}
                 <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center">
                      <ShieldCheck className="mr-2 text-brand-500 opacity-70" size={16} />
                      {state.language === 'ru' ? 'Резервное копирование' : 'Backup & Recovery'}
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                       <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                         {state.language === 'ru' 
                           ? 'Экспортируйте данные в файл JSON для локального хранения или импортируйте их из ранее созданной копии.' 
                           : 'Export your data to a JSON file for local storage or import it from a previously created backup.'}
                       </p>
                       <div className="flex flex-col gap-3">
                          <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={exportData}
                            className="flex items-center justify-center space-x-2 bg-slate-900 dark:bg-slate-700 text-white px-4 py-4 rounded-2xl hover:bg-slate-800 transition-all font-semibold uppercase text-[10px] tracking-widest shadow-lg"
                          >
                            <Download size={14} />
                            <span>{t.exportData}</span>
                          </motion.button>
                          
                          <div className="relative">
                            <input 
                              type="file" 
                              accept=".json" 
                              onChange={importData} 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                            />
                            <motion.button 
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full flex items-center justify-center space-x-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-4 rounded-2xl hover:bg-slate-200 transition-all font-semibold uppercase text-[10px] tracking-widest border border-dashed border-slate-300 dark:border-slate-700"
                            >
                              <Upload size={14} />
                              <span>{t.importData}</span>
                            </motion.button>
                          </div>

                          <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={recoverLegacyData}
                            className="flex items-center justify-center space-x-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-4 py-4 rounded-2xl hover:bg-amber-100 transition-all font-semibold uppercase text-[10px] tracking-widest border border-amber-100 dark:border-amber-800/50"
                          >
                            <RotateCcw size={14} />
                            <span>{state.language === 'ru' ? 'Найти старые данные' : 'Find Legacy Data'}</span>
                          </motion.button>
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

                {/* Currency Settings Card */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                   <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center">
                        <Coins className="mr-2 text-brand-500 opacity-70" size={16} />
                        {state.language === 'ru' ? 'Настройки Валюты' : 'Currency Settings'}
                      </h3>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                           {state.language === 'ru' ? 'Авто-обновление' : 'Auto-Update'}
                         </span>
                         <button 
                           onClick={() => setState(s => ({ ...s, currencySettings: { ...s.currencySettings, autoUpdate: !s.currencySettings?.autoUpdate } }))}
                           className={`w-10 h-5 rounded-full transition-all relative ${state.currencySettings?.autoUpdate ? 'bg-emerald-500' : 'bg-slate-300'}`}
                         >
                           <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${state.currencySettings?.autoUpdate ? 'left-5.5' : 'left-0.5'}`} />
                         </button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                           {state.language === 'ru' ? 'Курс (Ручной)' : 'Exchange Rate (Manual)'}
                         </label>
                         <input 
                           type="number" 
                           disabled={state.currencySettings?.autoUpdate}
                           className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none text-sm font-semibold border border-transparent focus:border-brand-500/30 transition-all disabled:opacity-50"
                           value={state.currencySettings?.manualRate || state.exchangeRate}
                           onChange={(e) => {
                             const val = Number(e.target.value);
                             setState(s => ({
                               ...s,
                               exchangeRate: val,
                               buyRate: val - (s.currencySettings?.buyOffset || 25),
                               sellRate: val + (s.currencySettings?.sellOffset || 25),
                               currencySettings: { ...s.currencySettings, manualRate: val }
                             }));
                           }}
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                           {state.language === 'ru' ? 'Покупка (Отступ)' : 'Buy Offset'}
                         </label>
                         <input 
                           type="number" 
                           className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none text-sm font-semibold border border-transparent focus:border-brand-500/30 transition-all"
                           value={state.currencySettings?.buyOffset || 25}
                           onChange={(e) => {
                             const val = Number(e.target.value);
                             setState(s => ({
                               ...s,
                               buyRate: s.exchangeRate - val,
                               currencySettings: { ...s.currencySettings, buyOffset: val }
                             }));
                           }}
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                           {state.language === 'ru' ? 'Продажа (Отступ)' : 'Sell Offset'}
                         </label>
                         <input 
                           type="number" 
                           className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none text-sm font-semibold border border-transparent focus:border-brand-500/30 transition-all"
                           value={state.currencySettings?.sellOffset || 25}
                           onChange={(e) => {
                             const val = Number(e.target.value);
                             setState(s => ({
                               ...s,
                               sellRate: s.exchangeRate + val,
                               currencySettings: { ...s.currencySettings, sellOffset: val }
                             }));
                           }}
                         />
                      </div>
                   </div>
                   
                   <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                      <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">
                        {state.language === 'ru' 
                          ? '💡 Совет: Вы можете отключить авто-обновление и ввести курс вручную, если рыночный курс отображается неверно. Отступы определяют разницу между покупкой и продажей.' 
                          : '💡 Tip: You can disable auto-update and enter the rate manually if the market rate is incorrect. Offsets define the difference between buy and sell rates.'}
                      </p>
                   </div>
                </div>

                {/* Synchronization & API Card */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 md:col-span-2">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center">
                        <RefreshCw className="mr-2 text-brand-500 opacity-70" size={16} />
                        {t.sync} & {t.api}
                      </h3>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={async () => {
                            if ((window as any).aistudio?.openSelectKey) {
                              await (window as any).aistudio.openSelectKey();
                            } else {
                              alert(state.language === 'ru' ? 'Функция выбора ключа недоступна в этом окружении.' : 'Key selection is not available in this environment.');
                            }
                          }}
                          className="flex items-center space-x-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 px-4 py-2 rounded-xl hover:bg-brand-100 transition-all font-bold uppercase text-[9px] tracking-widest border border-brand-100 dark:border-brand-800/50"
                        >
                          <Key size={12} />
                          <span>{state.language === 'ru' ? 'Выбрать API Ключ Gemini' : 'Select Gemini API Key'}</span>
                        </motion.button>
                        <a 
                          href="https://ai.google.dev/gemini-api/docs/billing" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 text-slate-400 px-4 py-2 rounded-xl hover:bg-slate-100 transition-all font-bold uppercase text-[9px] tracking-widest border border-slate-100 dark:border-slate-800"
                        >
                          <Info size={12} />
                          <span>{state.language === 'ru' ? 'Инфо о биллинге' : 'Billing Info'}</span>
                        </a>
                      </div>
                   </div>
                   
                   <p className="text-[10px] text-slate-400 font-medium bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                     {state.language === 'ru' 
                       ? '💡 Gemini API предоставляет бесплатный уровень (Free Tier). Вы можете получить бесплатный ключ на aistudio.google.com и использовать его без оплаты.' 
                       : '💡 Gemini API provides a Free Tier. You can get a free key at aistudio.google.com and use it at no cost.'}
                   </p>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                          <Key size={12} className="text-brand-500" /> {state.language === 'ru' ? 'Персональный API Ключ Gemini (Ручной ввод)' : 'Personal Gemini API Key (Manual)'}
                        </label>
                        <input 
                          type="password" 
                          placeholder="AI Studio API Key" 
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none text-sm font-semibold border border-transparent focus:border-brand-500/30 transition-all"
                          value={state.geminiApiKey || ''}
                          onChange={(e) => setState(s => ({ ...s, geminiApiKey: e.target.value }))}
                        />
                        <p className="text-[9px] text-slate-500 ml-1">
                          {state.language === 'ru' 
                            ? 'Используйте этот вариант, если системный выбор ключа недоступен.' 
                            : 'Use this option if the system key selection is unavailable.'}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                          <Key size={12} className="text-brand-500" /> {t.githubToken}
                        </label>
                        <input 
                          type="password" 
                          placeholder="Ваш GitHub Токен (начинается с ghp_)" 
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
                          placeholder="username/repository" 
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none text-sm font-semibold border border-transparent focus:border-brand-500/30 transition-all"
                          value={state.syncSettings?.repoName || ''}
                          onChange={(e) => setState(s => ({ ...s, syncSettings: { ...s.syncSettings, repoName: e.target.value } }))}
                        />
                      </div>
                      <div className="md:col-span-2 flex flex-col md:flex-row gap-4">
                        <div className="flex-1 flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${state.syncSettings?.autoSync ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                              <RefreshCw size={16} className={state.syncSettings?.autoSync ? 'animate-spin-slow' : ''} />
                            </div>
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest">{state.language === 'ru' ? 'Авто-синхронизация' : 'Auto-Sync'}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{state.language === 'ru' ? 'Автоматически сохранять изменения в облако' : 'Automatically save changes to cloud'}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setState(s => ({ ...s, syncSettings: { ...s.syncSettings, autoSync: !s.syncSettings?.autoSync } }))}
                            className={`w-12 h-6 rounded-full transition-all relative ${state.syncSettings?.autoSync ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${state.syncSettings?.autoSync ? 'left-7' : 'left-1'}`} />
                          </button>
                        </div>
                        <div className="flex-1 flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-500">
                              <Cloud size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest">{state.language === 'ru' ? 'Облачный статус' : 'Cloud Status'}</p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {state.syncSettings?.lastSync 
                                  ? `${state.language === 'ru' ? 'Последняя копия:' : 'Last sync:'} ${new Date(state.syncSettings.lastSync).toLocaleTimeString()}`
                                  : (state.language === 'ru' ? 'Не синхронизировано' : 'Not synced')}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => restoreFromGithub()}
                            className="px-3 py-1.5 bg-white dark:bg-slate-800 text-[9px] font-bold uppercase tracking-widest rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 transition-all"
                          >
                            {state.language === 'ru' ? 'Загрузить' : 'Load'}
                          </button>
                        </div>
                      </div>
                   </div>
                   <div className="flex flex-col md:flex-row items-center justify-between pt-4 gap-4">
                       <div className="flex flex-col gap-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
                            {t.lastSync}: <span className="text-slate-900 dark:text-slate-100">{state.syncSettings?.lastSync ? new Date(state.syncSettings.lastSync).toLocaleString() : 'Never'}</span>
                          </div>
                          <button 
                            onClick={() => {
                              if(confirm(state.language === 'ru' ? 'Очистить все данные в браузере? Это не удалит данные в GitHub.' : 'Clear all local data? This will not delete data on GitHub.')) {
                                localStorage.clear();
                                window.location.reload();
                              }
                            }}
                            className="text-[9px] font-bold text-rose-500 uppercase tracking-widest hover:underline ml-1"
                          >
                            {state.language === 'ru' ? 'Очистить локальную память' : 'Clear local storage'}
                          </button>
                       </div>
                      <div className="grid grid-cols-2 md:flex md:flex-row gap-3 w-full md:w-auto">
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={testGithubConnection}
                          className="flex items-center justify-center space-x-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-4 py-4 rounded-2xl hover:bg-emerald-100 transition-all font-semibold uppercase text-[10px] tracking-widest border border-emerald-100 dark:border-emerald-800/50"
                        >
                          <CheckCircle size={14} />
                          <span>{state.language === 'ru' ? 'Проверить связь' : 'Test Link'}</span>
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => restoreFromGithub()}
                          className="flex items-center justify-center space-x-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 px-4 py-4 rounded-2xl hover:bg-slate-200 transition-all font-semibold uppercase text-[10px] tracking-widest"
                        >
                          <Download size={14} />
                          <span>{t.restore || (state.language === 'ru' ? 'Восстановить' : 'Restore')}</span>
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => syncToGithub()}
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
                      <select name="storage" required value={modalSelectedStorage} onChange={(e) => setModalSelectedStorage(e.target.value as Storage)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none border-none text-sm font-medium">
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
                {modalSelectedBrand === 'iPhone' && (
                  <div className="space-y-2 px-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex justify-between">
                      <span>{state.language === 'ru' ? 'Ёмкость батареи' : 'Battery Health'}</span>
                      <span className="text-brand-600">{batteryHealth}%</span>
                    </label>
                    <input 
                      type="range" 
                      name="batteryHealth" 
                      min="70" 
                      max="100" 
                      value={batteryHealth} 
                      onChange={(e) => setBatteryHealth(Number(e.target.value))}
                      className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-lg appearance-none cursor-pointer accent-brand-500"
                    />
                  </div>
                )}
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
      {/* EDIT MODAL */}
      {editingDevice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative border border-white/5">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-8 flex items-center gap-3">
               <div className="p-2.5 bg-brand-50 dark:bg-brand-900/30 rounded-xl text-brand-600">
                  <Edit size={18} />
               </div>
               {state.language === 'ru' ? 'Редактировать товар' : 'Edit Device'}
            </h2>
            
            <form onSubmit={updateDevice} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <InputWrapper label={t.brand}>
                      <select name="brand" required defaultValue={editingDevice.brand} className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none border-none text-sm font-medium">
                        <option value="iPhone">iPhone</option>
                        <option value="Samsung">Samsung</option>
                      </select>
                   </InputWrapper>
                   <InputWrapper label={t.storage}>
                      <select name="storage" required defaultValue={editingDevice.storage} className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none border-none text-sm font-medium">
                        {STORAGE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </InputWrapper>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <InputWrapper label={t.model}>
                      <input name="model" required defaultValue={editingDevice.model} className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none text-sm font-medium" />
                   </InputWrapper>
                   <InputWrapper label={t.imei} icon={Hash}>
                      <input name="imei" required defaultValue={editingDevice.imei} className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none text-sm font-medium" />
                   </InputWrapper>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                   <InputWrapper label={t.purchasedFrom} icon={Store}>
                      <input name="purchasedFrom" required defaultValue={editingDevice.purchasedFrom} className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none text-sm font-medium" />
                   </InputWrapper>
                   <InputWrapper label={t.purchaseDate}>
                      <input name="purchaseDate" type="date" defaultValue={editingDevice.purchaseDate} required className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none text-[11px] font-bold" />
                   </InputWrapper>
                </div>
                <InputWrapper label={t.purchasePrice} icon={DollarSign}>
                   <input name="purchasePrice" type="number" required defaultValue={editingDevice.purchasePrice} className="w-full p-4 bg-brand-500/5 dark:bg-brand-500/10 rounded-2xl outline-none text-xl font-bold text-brand-600 focus:ring-1 ring-brand-500/20" />
                </InputWrapper>
                {editingDevice.brand === 'iPhone' && (
                  <div className="space-y-2 px-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex justify-between">
                      <span>{state.language === 'ru' ? 'Ёмкость батареи' : 'Battery Health'}</span>
                      <span className="text-brand-600">{batteryHealth}%</span>
                    </label>
                    <input 
                      type="range" 
                      name="batteryHealth" 
                      min="70" 
                      max="100" 
                      value={batteryHealth}
                      onChange={(e) => setBatteryHealth(Number(e.target.value))}
                      className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-lg appearance-none cursor-pointer accent-brand-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setEditingDevice(null)} className="flex-1 py-3 font-semibold text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-brand-600 text-white font-semibold text-[10px] uppercase tracking-widest rounded-2xl shadow-lg">Update Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
