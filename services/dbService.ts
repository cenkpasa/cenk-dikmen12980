import Dexie, { type Table } from 'dexie';
import { User, Customer, Appointment, Interview, Offer, ErpSettings, StockItem, Invoice, Notification, LeaveRequest, KmRecord, LocationRecord, AISettings, EmailDraft, Reconciliation, CalculatorState, CalculationHistoryItem } from '../types';
import { DEFAULT_ADMIN, MOCK_APPOINTMENTS, MOCK_CUSTOMERS } from '../constants';

export class AppDatabase extends Dexie {
    users!: Table<User, string>;
    customers!: Table<Customer, string>;
    appointments!: Table<Appointment, string>;
    interviews!: Table<Interview, string>;
    offers!: Table<Offer, string>;
    erpSettings!: Table<ErpSettings, 'default'>;
    stockItems!: Table<StockItem, string>;
    invoices!: Table<Invoice, string>;
    notifications!: Table<Notification, string>;
    leaveRequests!: Table<LeaveRequest, string>;
    kmRecords!: Table<KmRecord, string>;
    locationHistory!: Table<LocationRecord, string>;
    aiSettings!: Table<AISettings, string>;
    emailDrafts!: Table<EmailDraft, string>;
    reconciliations!: Table<Reconciliation, string>;
    calculatorState!: Table<CalculatorState, 'default'>;
    calculationHistory!: Table<CalculationHistoryItem, number>;

    constructor() {
        super('CnkCrmDatabase');
        (this as Dexie).version(22).stores({
            users: 'id, &username',
            customers: 'id, &currentCode, name, createdAt, status',
            appointments: 'id, customerId, start, userId',
            interviews: 'id, customerId, formTarihi',
            offers: 'id, customerId, teklifNo, createdAt',
            erpSettings: 'id',
            stockItems: 'id, name',
            invoices: 'id, customerId, userId, date',
            notifications: 'id, timestamp, isRead',
            leaveRequests: 'id, userId, requestDate',
            kmRecords: 'id, userId, date',
            locationHistory: 'id, userId, timestamp',
            aiSettings: 'userId',
            emailDrafts: 'id, createdAt, status, relatedObjectId',
            reconciliations: 'id, customerId, status, period, createdAt',
            calculatorState: 'id',
            calculationHistory: '++id, timestamp',
        });
    }
}

export const db = new AppDatabase();

export const seedDatabase = async () => {
    try {
        const userCount = await db.users.count();
        if (userCount > 0) {
            console.log("Database already contains data. Skipping seed.");
            return;
        }

        console.log("Database is empty. Initializing with default data...");

        const adminUser: User = { 
            id: 'admin-default', 
            ...DEFAULT_ADMIN, 
            password: DEFAULT_ADMIN.password || '1234',
        };
        
        const crmUser: User = {
            id: 'user-cnk',
            username: 'cnk',
            password: '1234',
            role: 'admin',
            name: 'CNK Satış Temsilcisi',
            jobTitle: 'Satış Temsilcisi',
            avatar: 'https://randomuser.me/api/portraits/women/76.jpg',
            salesTarget: 75000,
        };

        await (db as Dexie).transaction('rw', (db as Dexie).tables, async () => {
            await db.users.bulkPut([adminUser, crmUser]);

            if (MOCK_CUSTOMERS.length > 0) {
                const customersToSeed: Customer[] = MOCK_CUSTOMERS.map((c, i) => ({
                    ...c,
                    id: (i + 1).toString(),
                    createdAt: new Date().toISOString(),
                }));
                await db.customers.bulkAdd(customersToSeed);
            }
            if (MOCK_APPOINTMENTS.length > 0) {
              const appointmentsToSeed: Appointment[] = MOCK_APPOINTMENTS.map((a, i) => ({
                  ...a,
                  id: `mock-apt-${i + 1}`,
                  userId: 'user-cnk',
                  createdAt: new Date().toISOString()
              }));
              await db.appointments.bulkAdd(appointmentsToSeed);
            }
            await db.erpSettings.put({ id: 'default', server: '192.168.1.100', databasePath: 'C:\\WOLVOX8\\WOLVOX.FDB', username: 'SYSDBA', isConnected: false });
        });

        console.log("Database seeded successfully.");

    } catch (error) {
        console.error("Failed to seed database:", error);
        throw error;
    }
};