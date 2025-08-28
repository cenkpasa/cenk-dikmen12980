import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import Modal from '../common/Modal';
import Button from '../common/Button';

interface ImportConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    dataToImport: Omit<Customer, 'id' | 'createdAt'>[];
    onConfirm: (validData: Omit<Customer, 'id' | 'createdAt'>[]) => void;
}

interface ValidatedRow {
    data: Omit<Customer, 'id' | 'createdAt'>;
    errors: string[];
    originalIndex: number;
}


const ImportConfirmationModal = ({ isOpen, onClose, dataToImport, onConfirm }: ImportConfirmationModalProps) => {
    const { t } = useLanguage();
    const [validatedData, setValidatedData] = useState<ValidatedRow[]>([]);

    useEffect(() => {
        if (isOpen) {
            const seenNames = new Set<string>();
            const seenEmails = new Set<string>();

            const validated = dataToImport.map((row, index) => {
                const errors: string[] = [];
                // Email validation
                if (row.email && !/\S+@\S+\.\S+/.test(row.email)) {
                    errors.push(t('invalidEmailFormat'));
                }
                // Duplicate check within the file
                if (row.name) {
                    const lowerName = row.name.toLowerCase();
                    if (seenNames.has(lowerName)) { errors.push(t('duplicateInFile')); }
                    seenNames.add(lowerName);
                }
                if (row.email) {
                    const lowerEmail = row.email.toLowerCase();
                    if (seenEmails.has(lowerEmail)) { errors.push(t('duplicateInFile')); }
                    seenEmails.add(lowerEmail);
                }
                return { data: row, errors, originalIndex: index };
            });
            setValidatedData(validated);
        }
    }, [isOpen, dataToImport, t]);

    const handleConfirmClick = () => {
        const validData = validatedData
            .filter(row => row.errors.length === 0)
            .map(row => row.data);
        onConfirm(validData);
    };

    const hasErrors = validatedData.some(row => row.errors.length > 0);
    const validRowCount = validatedData.filter(row => row.errors.length === 0).length;
    const columns = [
        { key: 'name', label: t('nameCompanyName') },
        { key: 'email', label: t('email') },
        { key: 'phone1', label: t('phone1') },
        { key: 'address', label: t('address') },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('importConfirmation')}
            size="5xl"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button variant="success" onClick={handleConfirmClick} icon="fas fa-check">
                        {`${t('confirmAndSave')} (${validRowCount})`}
                    </Button>
                </>
            }
        >
            {hasErrors && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 mb-4 rounded-md" role="alert">
                    <p className="font-bold">{t('validationErrorsFound')}</p>
                    <p>{t('onlyValidRowsWillBeImported')}</p>
                </div>
            )}
            <p className="mb-4 text-cnk-txt-secondary-light">{t('recordsToBeImported')}</p>
            <div className="max-h-96 overflow-y-auto border border-cnk-border-light rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="bg-cnk-bg-light sticky top-0">
                        <tr>
                            {columns.map(col => <th key={col.key} className="p-3 font-semibold text-cnk-txt-primary-light">{col.label}</th>)}
                            <th className="p-3 font-semibold text-cnk-txt-primary-light">{t('errorColumnHeader')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {validatedData.map(row => (
                             <tr key={row.originalIndex} className={`border-t border-cnk-border-light ${row.errors.length > 0 ? 'bg-red-500/10' : ''}`}>
                                {columns.map(col => (
                                    <td key={col.key} className="p-3 text-cnk-txt-secondary-light">{(row.data as any)[col.key] || '-'}</td>
                                ))}
                                <td className="p-3">
                                    {row.errors.length > 0 && (
                                        <span className="text-red-600 font-medium text-xs">{row.errors.join(', ')}</span>
                                    )}
                                </td>
                             </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Modal>
    );
};

export default ImportConfirmationModal;
