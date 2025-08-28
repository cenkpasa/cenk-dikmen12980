import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { LeaveRequest, KmRecord, LocationRecord } from '../types';
import { db } from '../services/dbService';
import { v4 as uuidv4 } from 'uuid';

interface PersonnelContextType {
    leaveRequests: LeaveRequest[];
    kmRecords: KmRecord[];
    locationHistory: LocationRecord[];
    getLeaveRequestsForUser: (userId: string) => LeaveRequest[];
    getKmRecordsForUser: (userId: string) => KmRecord[];
    getLocationHistoryForUser: (userId: string) => LocationRecord[];
    addLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'requestDate' | 'status'>) => Promise<void>;
    addKmRecord: (record: Omit<KmRecord, 'id' | 'date'> & { date?: string }) => Promise<void>;
    addLocationRecord: (record: Omit<LocationRecord, 'id' | 'timestamp'>) => Promise<void>;
}

const PersonnelContext = createContext<PersonnelContextType | undefined>(undefined);

export const PersonnelProvider = ({ children }: { children: ReactNode }) => {
    
    const leaveRequests = useLiveQuery(() => db.leaveRequests.toArray(), []) || [];
    const kmRecords = useLiveQuery(() => db.kmRecords.toArray(), []) || [];
    const locationHistory = useLiveQuery(() => db.locationHistory.toArray(), []) || [];

    const getLeaveRequestsForUser = useCallback((userId: string) => {
        return leaveRequests.filter(r => r.userId === userId);
    }, [leaveRequests]);

    const getKmRecordsForUser = useCallback((userId: string) => {
        return kmRecords.filter(r => r.userId === userId);
    }, [kmRecords]);
    
    const getLocationHistoryForUser = useCallback((userId: string) => {
        return locationHistory.filter(r => r.userId === userId);
    }, [locationHistory]);

    const addLeaveRequest = async (requestData: Omit<LeaveRequest, 'id' | 'requestDate' | 'status'>) => {
        const newRequest: LeaveRequest = {
            ...requestData,
            id: uuidv4(),
            requestDate: new Date().toISOString(),
            status: 'pending'
        };
        await db.leaveRequests.add(newRequest);
    };
    
    const addKmRecord = async (recordData: Omit<KmRecord, 'id' | 'date'> & { date?: string }) => {
        const newRecord: KmRecord = {
            ...recordData,
            id: uuidv4(),
            date: recordData.date || new Date().toISOString().slice(0, 10),
        };
        await db.kmRecords.add(newRecord);
    };

    const addLocationRecord = async (recordData: Omit<LocationRecord, 'id' | 'timestamp'>) => {
        const newRecord: LocationRecord = {
            ...recordData,
            id: uuidv4(),
            timestamp: new Date().toISOString(),
        };
       await db.locationHistory.add(newRecord);
    };

    const value = {
        leaveRequests,
        kmRecords,
        locationHistory,
        getLeaveRequestsForUser,
        getKmRecordsForUser,
        getLocationHistoryForUser,
        addLeaveRequest,
        addKmRecord,
        addLocationRecord,
    };

    return (
        <PersonnelContext.Provider value={value}>
            {children}
        </PersonnelContext.Provider>
    );
};

export const usePersonnel = (): PersonnelContextType => {
    const context = useContext(PersonnelContext);
    if (!context) {
        throw new Error('usePersonnel must be used within a PersonnelProvider');
    }
    return context;
};
