import React, { createContext, useContext, ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ErpSettings, StockItem, Invoice, Customer, Offer, IncomingInvoice, OutgoingInvoice } from '../types';
import { db } from '../services/dbService';
import * as erpApiService from '../services/erpApiService';
import type { Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

export interface SyncResult {
    type: string;
    fetched: number;
    added: number;
    updated: number;
}

interface ErpContextType {
    erpSettings: ErpSettings | undefined;
    updateErpSettings: (settings: ErpSettings) => Promise<void>;
    stockItems: StockItem[];
    invoices: Invoice[];
    syncStock: () => Promise<SyncResult>;
    syncInvoices: () => Promise<SyncResult>;
    syncCustomers: () => Promise<SyncResult>;
    syncOffers: () => Promise<SyncResult>;
    syncIncomingInvoices: () => Promise<SyncResult>;
    syncOutgoingInvoices: () => Promise<SyncResult>;
}

const ErpContext = createContext<ErpContextType | undefined>(undefined);

interface ErpProviderProps {
    children: ReactNode;
}

export const ErpProvider = ({ children }: ErpProviderProps) => {
    const erpSettings = useLiveQuery(() => db.erpSettings.get('default'), []);
    const stockItems = useLiveQuery(() => db.stockItems.toArray(), []) || [];
    const invoices = useLiveQuery(() => db.invoices.toArray(), []) || [];

    const updateErpSettings = async (settings: ErpSettings) => {
        await db.erpSettings.put(settings);
    };
    
    const syncIncomingInvoices = async (): Promise<SyncResult> => {
        const fetchedInvoices = await erpApiService.fetchIncomingInvoices();
        await db.incomingInvoices.clear();
        await db.incomingInvoices.bulkAdd(fetchedInvoices);
        await updateErpSettings({ ...erpSettings!, lastSyncIncomingInvoices: new Date().toISOString() });
        return { type: 'Gelen Fatura', fetched: fetchedInvoices.length, added: fetchedInvoices.length, updated: 0 };
    };
    
    const syncOutgoingInvoices = async (): Promise<SyncResult> => {
        const fetchedInvoices = await erpApiService.fetchOutgoingInvoices();
        await db.outgoingInvoices.clear();
        await db.outgoingInvoices.bulkAdd(fetchedInvoices);
        await updateErpSettings({ ...erpSettings!, lastSyncOutgoingInvoices: new Date().toISOString() });
        return { type: 'Giden Fatura', fetched: fetchedInvoices.length, added: fetchedInvoices.length, updated: 0 };
    };


    const _syncCustomersFromCSV = async (): Promise<{ newCount: number, updatedCount: number, totalCount: number, customerMap: Map<string, string> }> => {
        const { customers: parsedCustomersMap } = await erpApiService.fetchErpCsvData();
        const parsedCustomers = Array.from(parsedCustomersMap.values());
        
        const existingCustomers = await db.customers.where('currentCode').anyOf(Array.from(parsedCustomersMap.keys())).toArray();
        const existingCustomerMap = new Map(existingCustomers.map(c => [c.currentCode, c]));

        let addedCount = 0;
        let updatedCount = 0;

        const customersToUpsert: Customer[] = parsedCustomers.map(parsedCust => {
            const existing = existingCustomerMap.get(parsedCust.currentCode!);
            if (existing) {
                updatedCount++;
                return { ...existing, ...parsedCust }; // Merge, keeping existing ID and other CRM data
            } else {
                addedCount++;
                return {
                    ...parsedCust,
                    id: uuidv4(),
                    createdAt: new Date().toISOString()
                };
            }
        });
        
        if (customersToUpsert.length > 0) {
            await db.customers.bulkPut(customersToUpsert);
        }
        
        // After upserting, we need the final map of currentCode -> crmId
        const allRelevantCustomers = await db.customers.where('currentCode').anyOf(Array.from(parsedCustomersMap.keys())).toArray();
        const finalCustomerMap = new Map<string, string>();
        allRelevantCustomers.forEach(c => finalCustomerMap.set(c.currentCode!, c.id));

        return { newCount: addedCount, updatedCount, totalCount: parsedCustomers.length, customerMap: finalCustomerMap };
    };

    const syncCustomers = async (): Promise<SyncResult> => {
        const { newCount, updatedCount, totalCount } = await _syncCustomersFromCSV();
        await updateErpSettings({ ...erpSettings!, lastSyncCustomers: new Date().toISOString() });
        return { type: 'Müşteri', fetched: totalCount, added: newCount, updated: updatedCount };
    };

    const syncInvoices = async (): Promise<SyncResult> => {
        // Step 1: Ensure customers are synced and get an up-to-date map
        const { customerMap } = await _syncCustomersFromCSV();
        
        // Step 2: Fetch and process invoices
        const { invoices: parsedInvoices } = await erpApiService.fetchErpCsvData();
        
        const existingInvoiceIds = new Set((await db.invoices.toCollection().primaryKeys()).map(String));
        let addedCount = 0;
        let updatedCount = 0;

        const invoicesToUpsert: Invoice[] = parsedInvoices
            .map(parsedInv => {
                const customerId = customerMap.get(parsedInv.customerCurrentCode);
                if (!customerId) return null; // Skip invoice if customer not found
                
                const isUpdate = existingInvoiceIds.has(parsedInv.id);
                if(isUpdate) updatedCount++; else addedCount++;
                
                const { customerCurrentCode, ...invoiceData } = parsedInv;

                return {
                    ...invoiceData,
                    customerId,
                    userId: 'user-cnk', // Default user for ERP sync
                };
            })
            .filter((inv): inv is Invoice => inv !== null);

        if (invoicesToUpsert.length > 0) {
            await db.invoices.bulkPut(invoicesToUpsert);
        }

        await updateErpSettings({ ...erpSettings!, lastSyncInvoices: new Date().toISOString() });

        return { type: 'Fatura', fetched: parsedInvoices.length, added: addedCount, updated: updatedCount };
    };

    // Keep old sync functions as no-ops for now to avoid breaking UI if called
    const syncStock = async (): Promise<SyncResult> => {
        console.warn("Stock sync from CSV is not implemented.");
        return { type: 'Stok', fetched: 0, added: 0, updated: 0 };
    };

    const syncOffers = async (): Promise<SyncResult> => {
        // Step 1: Ensure customers are synced and get an up-to-date map
        const { customerMap } = await _syncCustomersFromCSV();

        // Step 2: Fetch and process offers
        const { offers: parsedOffers } = await erpApiService.fetchErpCsvData();

        const existingOffers = await db.offers.where('teklifNo').anyOf(parsedOffers.map(o => o.teklifNo)).toArray();
        const existingOfferMap = new Map(existingOffers.map(o => [o.teklifNo, o]));
        
        let addedCount = 0;
        let updatedCount = 0;

        const offersToUpsert: Offer[] = parsedOffers.map(parsedOffer => {
            const customerId = customerMap.get(parsedOffer.customerCurrentCode);
            if (!customerId) return null;

            const existing = existingOfferMap.get(parsedOffer.teklifNo);
            const { customerCurrentCode, ...offerData } = parsedOffer;

            if (existing) {
                updatedCount++;
                return { ...existing, ...offerData, customerId };
            } else {
                addedCount++;
                return {
                    ...offerData,
                    id: uuidv4(),
                    createdAt: new Date().toISOString(),
                    customerId,
                };
            }
        }).filter((o): o is Offer => o !== null);

        if (offersToUpsert.length > 0) {
            await db.offers.bulkPut(offersToUpsert);
        }

        await updateErpSettings({ ...erpSettings!, lastSyncOffers: new Date().toISOString() });
        return { type: 'Teklif', fetched: parsedOffers.length, added: addedCount, updated: updatedCount };
    };
    
    const value = {
        erpSettings,
        updateErpSettings,
        stockItems,
        invoices,
        syncStock,
        syncInvoices,
        syncCustomers,
        syncOffers,
        syncIncomingInvoices,
        syncOutgoingInvoices,
    };

    return <ErpContext.Provider value={value}>{children}</ErpContext.Provider>;
};

export const useErp = (): ErpContextType => {
    const context = useContext(ErpContext);
    if (!context) {
        throw new Error('useErp must be used within an ErpProvider');
    }
    return context;
};