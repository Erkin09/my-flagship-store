
export type Brand = 'iPhone' | 'Samsung';
export type Storage = '64Gb' | '128Gb' | '256Gb' | '512Gb' | '1Tb';
export type DeviceStatus = 'In Stock' | 'Sold' | 'Returned';

export interface Device {
  id: string;
  brand: Brand;
  model: string;
  storage: Storage;
  imei: string;
  purchasePrice: number;
  purchasedFrom: string;
  purchaseDate: string;
  batteryHealth?: number;
  status: DeviceStatus;
  dateAdded: string;
}

export interface Installment {
  months: 1 | 2 | 3;
  paidAmount: number;
  dueDate: string;
}

export interface Sale {
  id: string;
  deviceId?: string;
  customerName?: string;
  customerPhone?: string;
  salePrice: number;
  purchasePrice?: number;
  date: string;
  isInstallment: boolean;
  installmentPlan?: Installment;
  status: 'Completed' | 'Returned';
}

export interface AppState {
  devices: Device[];
  sales: Sale[];
  language: 'ru' | 'en';
  theme: 'light' | 'dark';
  cashBalance: number;
  exchangeRate: number;
  buyRate: number;
  sellRate: number;
  bankRate: number;
  prevExchangeRate: number;
  customModels: { [key in Brand]: string[] };
  aiChatHistory?: { role: 'user' | 'model', text: string }[];
  aiStructuredData?: {
    summary: string;
    stats: { label: string, value: string | number }[];
    chartData: { name: string, value: number }[];
    brandData: { name: string, value: number }[];
    profitTrend: { date: string, profit: number }[];
    recommendations: string[];
  };
  syncSettings?: {
    githubToken?: string;
    repoName?: string;
    lastSync?: string;
    autoSync?: boolean;
  };
  currencySettings?: {
    manualRate?: number;
    buyOffset?: number;
    sellOffset?: number;
    autoUpdate?: boolean;
  };
  geminiApiKey?: string;
}
