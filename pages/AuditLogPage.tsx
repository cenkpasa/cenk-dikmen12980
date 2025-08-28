import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/dbService';
import { AuditLog } from '../types';
import DataTable from '../components/common/DataTable';
import Loader from '../components/common/Loader';

const AuditLogPage = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const logs = useLiveQuery(() => db.auditLogs.orderBy('timestamp').reverse().toArray(), []);

    if (currentUser?.role !== 'admin') {
        return <p className="text-center p-4 bg-yellow-500/10 text-yellow-300 rounded-lg">{t('permissionDenied')}</p>;
    }

    if (!logs) {
        return <Loader fullScreen />;
    }

    const columns = [
        { 
            header: "Tarih", 
            accessor: (item: AuditLog) => new Date(item.timestamp).toLocaleString() 
        },
        { 
            header: "Kullanıcı", 
            accessor: (item: AuditLog) => item.userName 
        },
        { 
            header: "Eylem", 
            accessor: (item: AuditLog) => <span className="font-mono text-xs bg-cnk-bg-light px-2 py-1 rounded">{item.action}</span> 
        },
        { 
            header: "Varlık", 
            accessor: (item: AuditLog) => item.entity 
        },
        { 
            header: "Detaylar", 
            accessor: (item: AuditLog) => item.details || '-' 
        },
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">{t('auditLog')}</h1>
            <DataTable 
                columns={columns}
                data={logs}
                emptyStateMessage="Henüz bir denetim kaydı bulunmuyor."
            />
        </div>
    );
};

export default AuditLogPage;
