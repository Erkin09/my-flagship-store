
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
  customModels: { [key in Brand]: string[] };
  syncSettings?: {
    githubToken?: string;
    repoName?: string;
    lastSync?: string;
    autoSync?: boolean;
  };
}
