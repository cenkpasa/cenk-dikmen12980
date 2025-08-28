export interface LeaveRequest {
    id: string;
    userId: string; 
    type: string;
    startDate: string;
    endDate: string;
    status: 'pending' | 'approved' | 'rejected';
    requestDate: string;
    reason: string;
}

export interface KmRecord {
    id: string;
    userId: string;
    date: string;
    km: number;
    type: 'morning' | 'evening';
}

export interface LocationRecord {
    id: string;
    userId: string;
    timestamp: string;
    latitude: number;
    longitude: number;
    isVisit?: boolean;
    customerId?: string;
}

export type UserRole = 'admin' | 'muhasebe' | 'saha';

export interface User {
    id:string;
    username:string;
    password?:string;
    role: UserRole;
    name:string;
    jobTitle?:string;
    avatar?:string;
    tcNo?:string;
    phone?:string;
    startDate?:string;
    employmentStatus?:string;
    bloodType?:string;
    licensePlate?:string;
    gender?: 'male' | 'female' | 'other';
    salary?: number;
    educationLevel?: string;
    address?: string;
    annualLeaveDays?: number;
    workType?: 'full-time' | 'part-time';
    vehicleModel?: string;
    vehicleInitialKm?: number;
    salesTarget?: number;
}

export interface Customer {
    id: string;
    name: string; 
    createdAt: string;
    status?: 'active' | 'passive';
    currentCode?: string;
    commercialTitle?: string;
    address?: string;
    country?: string;
    city?: string;
    district?: string;
    postalCode?: string;
    group?: string;
    subgroup1?: string;
    subgroup2?: string;
    phone1?: string;
    phone2?: string;
    homePhone?: string;
    mobilePhone1?: string;
    fax?: string;
    taxOffice?: string;
    taxNumber?: string;
    nationalId?: string;
    specialCode1?: string;
    specialCode2?: string;
    specialCode3?: string;
    registrationDate?: string;
    specialDate?: string;
    webcamImage?: string;
    notes?: string;
    email?: string;
    aiSentimentAnalysis?: { result: string; timestamp: string; };
    aiOpportunityAnalysis?: { result: string; timestamp: string; };
    aiNextStepSuggestion?: { result: string; timestamp: string; };
}

export interface Appointment {
    id: string;
    customerId: string;
    userId: string;
    title: string;
    start: string;
    end: string;
    allDay?: boolean;
    notes?: string;
    reminder?: string;
    createdAt?: string;
}

export interface Interview {
    id: string;
    customerId: string;
    formTarihi: string;
    fuar: string;
    sektor: string[];
    ziyaretci: {
        firmaAdi: string;
        adSoyad: string;
        bolumu: string;
        telefon: string;
        adres: string;
        email: string;
        web: string;
    };
    aksiyonlar: {
        katalogGonderilecek: boolean;
        teklifGonderilecek: boolean;
        ziyaretEdilecek: boolean;
        bizZiyaretEdecek: {
            tarih: string;
            adSoyad: string;
        };
    };
    notlar: string;
    gorusmeyiYapan: string;
    createdAt: string;
    aiSummary?: string;
}

export interface OfferItem {
    id: string;
    cins: string;
    miktar: number;
    birim: string;
    fiyat: number;
    tutar: number;
    teslimSuresi: string;
}

export interface Offer {
    id: string;
    teklifNo: string;
    createdAt: string;
    customerId: string;
    firma: {
        yetkili: string;
        telefon: string;
        eposta: string;
        vade: string;
        teklifTarihi: string;
    };
    teklifVeren: {
        yetkili: string;
        telefon: string;
        eposta: string;
    };
    items: OfferItem[];
    notlar: string;
    toplam: number;
    kdv: number;
    genelToplam: number;
    aiFollowUpEmail?: string;
}

export interface StockItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    lastSync: string;
}

export interface Invoice {
    id: string;
    customerId: string;
    userId: string;
    date: string;
    totalAmount: number;
    items: {
        stockId: string;
        quantity: number;
        price: number;
    }[];
    description?: string;
}

export interface IncomingInvoice {
    id: string;
    faturaNo: string;
    tedarikciAdi: string;
    vergiNo: string;
    tarih: string; // ISO format string
    tutar: number;
    description?: string;
}

export interface OutgoingInvoice {
    id: string;
    faturaNo: string;
    musteriAdi: string;
    vergiNo: string;
    tarih: string; // ISO format string
    tutar: number;
    description?: string;
}

export interface ErpSettings {
    id: 'default';
    server: string;
    databasePath: string;
    username: string;
    isConnected: boolean;
    lastSyncStock?: string;
    lastSyncInvoices?: string;
    lastSyncCustomers?: string;
    lastSyncOffers?: string;
    lastSyncIncomingInvoices?: string;
    lastSyncOutgoingInvoices?: string;
}

export type Page = 'dashboard' | 'customers' | 'email' | 'appointments' | 'gorusme-formu' | 'teklif-yaz' | 'personnel' | 'hesaplama-araclari' | 'profile' | 'yapay-zeka' | 'konum-takip' | 'erp-entegrasyonu' | 'ai-ayarlari' | 'raporlar' | 'email-taslaklari' | 'mutabakat' | 'audit-log';

export interface Notification {
    id: string;
    messageKey: string;
    replacements?: Record<string, string>;
    type: 'customer' | 'appointment' | 'offer' | 'interview' | 'system' | 'reconciliation';
    timestamp: string;
    isRead: boolean;
    link?: {
        page: Page;
        id?: string;
    };
}

export interface EmailDraft {
    id: string;
    createdAt: string;
    recipientEmail: string;
    recipientName: string;
    subject: string;
    body: string;
    status: 'draft' | 'sent';
    relatedObjectType: 'offer' | 'customer';
    relatedObjectId: string;
    generatedBy: 'ai_agent';
}

export interface AISettings {
    userId: string;
    isAgentActive: boolean;
    enableFollowUpDrafts: boolean;
    enableAtRiskAlerts: boolean;
    followUpDays: number;
    atRiskDays: number;
}

export type ReconciliationType = 'current_account' | 'ba' | 'bs';
export type ReconciliationStatus = 'draft' | 'in_review' | 'approved' | 'sent' | 'rejected';

export interface Reconciliation {
    id: string;
    customerId: string; // Can be derived from invoices' tax number
    type: ReconciliationType;
    period: string; // e.g., "2024-07"
    amount: number;
    status: ReconciliationStatus;
    createdAt: string;
    createdBy: string; // userId
    lastEmailSent?: string;
    customerResponse?: string;
    notes?: string;
    aiAnalysis?: string;
    incomingInvoiceId: string;
    outgoingInvoiceId: string;
}

export interface CalculatorState {
    id: 'default'; // Singleton state
    unit: 'metric' | 'inch';
    activeTab: string;
    inputs: Record<string, Record<string, string>>; // e.g., { turning: { Dm: '50' }, milling: { ... } }
}

export interface CalculationHistoryItem {
    id?: number;
    timestamp: number;
    module: string;
    unit: 'metric' | 'inch';
    summary: string;
}

export type ReportType = 
    'sales_performance' | 
    'customer_invoice_analysis' |
    'ai_analysis_summary' |
    'customer_segmentation' |
    'offer_success_analysis';
    
export interface AuditLog {
    id?: number;
    userId: string;
    userName: string;
    action: string;
    entity: string;
    entityId: string;
    timestamp: string;
    details?: string;
}