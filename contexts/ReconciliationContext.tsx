import React, { createContext, useContext, ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Reconciliation } from '../types';
import { db } from '../services/dbService';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';

interface ReconciliationContextType {
    reconciliations: Reconciliation[];
    addReconciliation: (data: Omit<Reconciliation, 'id' | 'createdAt' | 'createdBy' | 'status'>) => Promise<string>;
    updateReconciliation: (id: string, updates: Partial<Reconciliation>) => Promise<void>;
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
            status: 'pending',
        };
        await db.reconciliations.add(newReconciliation);
        return newReconciliation.id;
    };
    
    const updateReconciliation = async (id: string, updates: Partial<Reconciliation>) => {
        await db.reconciliations.update(id, updates);
    };

    const value = { reconciliations, addReconciliation, updateReconciliation };

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