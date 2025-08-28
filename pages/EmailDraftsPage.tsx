import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/dbService';
import { EmailDraft } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import DataTable from '../components/common/DataTable';
import Button from '../components/common/Button';
import EmailDraftModal from '../components/email/EmailDraftModal';
import { ViewState } from '../App';

interface EmailDraftsPageProps {
    setView: (view: ViewState) => void;
}

const EmailDraftsPage = ({ setView }: EmailDraftsPageProps) => {
    const { t } = useLanguage();
    const drafts = useLiveQuery(() => db.emailDrafts.orderBy('createdAt').reverse().toArray(), []) || [];
    const [selectedDraft, setSelectedDraft] = useState<EmailDraft | null>(null);

    const columns = [
        { header: t('recipient'), accessor: (item: EmailDraft) => item.recipientName },
        { header: t('subject'), accessor: (item: EmailDraft) => item.subject },
        { header: t('creationDate'), accessor: (item: EmailDraft) => new Date(item.createdAt).toLocaleString() },
        { header: t('status'), accessor: (item: EmailDraft) => (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {t(item.status)}
            </span>
        )},
        {
            header: t('actions'),
            accessor: (item: EmailDraft) => (
                <Button variant="secondary" size="sm" onClick={() => setSelectedDraft(item)}>
                    {t('viewAndSend')}
                </Button>
            ),
        },
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">AI Tarafından Oluşturulan E-posta Taslakları</h1>
            <DataTable
                columns={columns}
                data={drafts}
                emptyStateMessage={t('noEmailDrafts')}
            />
            {selectedDraft && (
                <EmailDraftModal
                    isOpen={!!selectedDraft}
                    onClose={() => setSelectedDraft(null)}
                    draft={selectedDraft}
                />
            )}
        </div>
    );
};

export default EmailDraftsPage;
