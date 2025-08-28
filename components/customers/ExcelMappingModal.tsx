import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Customer } from '../../types';
import Modal from '../common/Modal';
import Button from '../common/Button';

interface ExcelMappingModalProps {
    isOpen: boolean;
    onClose: () => void;
    jsonData: any[];
    headers: string[];
    onConfirm: (mappedData: Omit<Customer, 'id' | 'createdAt'>[]) => void;
}

const ExcelMappingModal = ({ isOpen, onClose, jsonData, headers, onConfirm }: ExcelMappingModalProps) => {
    const { t } = useLanguage();
    const { showNotification } = useNotification();

    const crmFields = [
        { key: 'name', label: t('nameCompanyName'), required: true },
        { key: 'commercialTitle', label: t('commercialTitle') },
        { key: 'email', label: t('email') },
        { key: 'phone1', label: t('phone1') },
        { key: 'mobilePhone1', label: t('mobilePhone1') },
        { key: 'address', label: t('address') },
        { key: 'taxOffice', label: t('taxOffice') },
        { key: 'taxNumber', label: t('taxNumber') },
        { key: 'notes', label: t('notes') },
        { key: 'status', label: t('status'), defaultSuggestion: t('active') }
    ];

    const [mapping, setMapping] = useState<Record<string, string>>(() => {
        const initialMap: Record<string, string> = {};
        crmFields.forEach(field => {
            const foundHeader = headers.find(h => 
                h.toLowerCase().replace(/\s/g, '').includes(field.label.toLowerCase().replace(/\s/g, '')) ||
                h.toLowerCase().replace(/\s/g, '').includes(field.key.toLowerCase().replace(/\s/g, ''))
            );
            initialMap[field.key] = foundHeader || '';
        });
        return initialMap;
    });

    const handleMappingChange = (crmKey: string, excelHeader: string) => {
        setMapping(prev => ({ ...prev, [crmKey]: excelHeader }));
    };

    const handleConfirm = () => {
        if (!mapping['name']) {
            showNotification('nameRequired', 'error');
            return;
        }

        const newCustomers = jsonData.map(row => {
            const customer: Partial<Omit<Customer, 'id' | 'createdAt'>> = {
                status: 'active',
                registrationDate: new Date().toISOString().slice(0, 10),
            };
            for (const key in mapping) {
                if (mapping[key] && row[mapping[key]] !== undefined) {
                    (customer as any)[key] = String(row[mapping[key]]);
                }
            }
            return customer as Omit<Customer, 'id' | 'createdAt'>;
        }).filter(c => c.name && c.name.trim() !== '');

        onConfirm(newCustomers);
    };
    
    const previewData = jsonData.slice(0, 5);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('excelColumnMapping')} size="4xl" footer={
            <>
                <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                <Button onClick={handleConfirm}>{t('confirmMappingAndPreview')}</Button>
            </>
        }>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-semibold mb-2 text-cnk-txt-primary-light">{t('crmField')} &rarr; {t('excelColumn')}</h3>
                    <div className="space-y-3">
                        {crmFields.map(field => (
                            <div key={field.key} className="grid grid-cols-2 items-center gap-3">
                                <label className="font-medium text-sm text-cnk-txt-secondary-light">{field.label} {field.required && '*'}</label>
                                <div className="flex items-center gap-2">
                                    <select 
                                        value={mapping[field.key]} 
                                        onChange={e => handleMappingChange(field.key, e.target.value)} 
                                        className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light px-3 py-2 text-sm text-cnk-txt-primary-light shadow-sm focus:border-cnk-accent-primary focus:outline-none focus:ring-1 focus:ring-cnk-accent-primary"
                                    >
                                        <option value="">Seçiniz</option>
                                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                    {!mapping[field.key] && field.defaultSuggestion && (
                                        <span className="text-xs text-cnk-txt-muted-light whitespace-nowrap">({t('defaultValue')}: {field.defaultSuggestion})</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold mb-2 text-cnk-txt-primary-light">{t('dataPreview')}</h3>
                    <div className="overflow-x-auto border rounded-lg border-cnk-border-light max-h-72">
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-cnk-bg-light">
                                <tr>{headers.map(h => <th key={h} className="p-2 font-semibold text-left text-cnk-txt-secondary-light">{h}</th>)}</tr>
                            </thead>
                            <tbody className="bg-cnk-panel-light">
                                {previewData.map((row, i) => (
                                    <tr key={i} className="border-t border-cnk-border-light">
                                        {headers.map(h => <td key={h} className="p-2 truncate max-w-xs text-cnk-txt-secondary-light">{String(row[h] || '')}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ExcelMappingModal;
