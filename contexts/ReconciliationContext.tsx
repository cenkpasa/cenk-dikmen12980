import React, { createContext, useContext, ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Reconciliation } from '../types';
import { db } from '../services/dbService';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { auditLogService } from '../services/auditLogService';

interface ReconciliationContextType {
    reconciliations: Reconciliation[];
    addReconciliation: (data: Omit<Reconciliation, 'id' | 'createdAt' | 'createdBy' | 'status'>) => Promise<string>;
    updateReconciliation: (id: string, updates: Partial<Reconciliation>) => Promise<void>;
    approveReconciliation: (id: string) => Promise<void>;
    rejectReconciliation: (id: string, reason: string) => Promise<void>;
}

const ReconciliationContext = createContext<ReconciliationContextType | undefined>(undefined);

export const ReconciliationProvider = ({ children }: { children: ReactNode }) => {
    const { currentUser } = useAuth();
    const reconciliations = useLiveQuery(() => db.reconciliations.orderBy('createdAt').reverse().toArray(), []) || [];

    const addReconciliation = async (data: Omit<Reconciliation, 'id' | 'createdAt' | 'createdBy' | 'status'>): Promise<string> => {
        if (!currentUser) throw new Error("User not authenticated");
        
        const newReconciliation: Reconciliation = {
            ...data,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            createdBy: currentUser.id,
            status: 'draft',
        };
        await db.reconciliations.add(newReconciliation);
        await auditLogService.logAction(currentUser, 'CREATE_RECONCILIATION', 'reconciliation', newReconciliation.id, `Reconciliation for period ${newReconciliation.period} created.`);
        return newReconciliation.id;
    };
    
    const updateReconciliation = async (id: string, updates: Partial<Reconciliation>) => {
        if (!currentUser) throw new Error("User not authenticated");
        await db.reconciliations.update(id, updates);
        await auditLogService.logAction(currentUser, 'UPDATE_RECONCILIATION', 'reconciliation', id, `Updated fields: ${Object.keys(updates).join(', ')}`);
    };

    const approveReconciliation = async (id: string) => {
        if (!currentUser) throw new Error("User not authenticated");
        await db.reconciliations.update(id, { status: 'approved' });
        await auditLogService.logAction(currentUser, 'APPROVE_RECONCILIATION', 'reconciliation', id, 'Status changed to Approved.');
    };

    const rejectReconciliation = async (id: string, reason: string) => {
        if (!currentUser) throw new Error("User not authenticated");
        await db.reconciliations.update(id, { status: 'rejected', notes: reason });
         await auditLogService.logAction(currentUser, 'REJECT_RECONCILIATION', 'reconciliation', id, `Status changed to Rejected. Reason: ${reason}`);
    };

    const value = { reconciliations, addReconciliation, updateReconciliation, approveReconciliation, rejectReconciliation };

    return (
        <ReconciliationContext.Provider value={value}>
            {children}
        </ReconciliationContext.Provider>
    );
};

export const useReconciliation = (): ReconciliationContextType => {
    const context = useContext(ReconciliationContext);
    if (!context) {
        throw new Error('useReconciliation must be used within a ReconciliationProvider');
    }
    return context;
};