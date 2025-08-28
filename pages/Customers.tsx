import React, { useState, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { Customer } from '../types';
import DataTable from '../components/common/DataTable';
import Button from '../components/common/Button';
import CustomerForm from '../components/forms/CustomerForm';
import Modal from '../components/common/Modal';
import CustomerDetailModal from '../components/customers/CustomerDetailModal';
import { ViewState } from '../App';
import * as XLSX from 'xlsx';
import ExcelMappingModal from '../components/customers/ExcelMappingModal';
import ImportConfirmationModal from '../components/customers/ImportConfirmationModal';

const Customers = ({ setView }: { setView: (view: ViewState) => void; }) => {
    const { customers, deleteCustomer, bulkAddCustomers } = useData();
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const { currentUser } = useAuth();
    
    // State for modals
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

    // State for Excel Import Flow
    const [isMapperModalOpen, setIsMapperModalOpen] = useState(false);
    const [isConfirmImportModalOpen, setIsConfirmImportModalOpen] = useState(false);
    const [excelData, setExcelData] = useState<{jsonData: any[], headers: string[]}>({jsonData: [], headers: []});
    const [mappedCustomers, setMappedCustomers] = useState<Omit<Customer, 'id' | 'createdAt'>[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'muhasebe';

    const handleAdd = () => {
        setSelectedCustomer(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        if (!canEdit) {
            showNotification('permissionDenied', 'error');
            return;
        }
        setSelectedCustomer(customer);
        setIsFormModalOpen(true);
    };
    
    const handleView = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDetailModalOpen(true);
    };
    
    const openDeleteConfirm = (customerId: string) => {
        if (!canEdit) {
            showNotification('permissionDenied', 'error');
            return;
        }
        setCustomerToDelete(customerId);
        setIsConfirmDeleteOpen(true);
    };

    const handleDelete = () => {
        if (customerToDelete) {
            deleteCustomer(customerToDelete);
            showNotification('customerDeleted', 'success');
        }
        setIsConfirmDeleteOpen(false);
        setCustomerToDelete(null);
    };

    // --- Excel Import Handlers ---
    const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                const headers: string[] = (XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][])[0] || [];
                
                setExcelData({ jsonData, headers });
                setIsMapperModalOpen(true);

            } catch (error) {
                console.error("Excel upload error:", error);
                showNotification('excelUploadError', 'error');
            }
        };
        reader.readAsArrayBuffer(file);
        event.target.value = ''; // Reset file input
    };

    const handleMappingConfirmed = (mappedData: Omit<Customer, 'id' | 'createdAt'>[]) => {
        setMappedCustomers(mappedData);
        setIsMapperModalOpen(false);
        setIsConfirmImportModalOpen(true);
    };

    const handleImportConfirmed = async (validData: Omit<Customer, 'id' | 'createdAt'>[]) => {
        if (validData.length === 0) {
            showNotification('noValidDataToImport', 'warning');
            setIsConfirmImportModalOpen(false);
            return;
        }
        const addedCount = await bulkAddCustomers(validData);
        showNotification('excelUploadSuccess', 'success', { count: String(addedCount) });
        setIsConfirmImportModalOpen(false);
        setMappedCustomers([]);
    };

    // --- Table Columns ---
    const columns = [
        { header: t('nameCompanyName'), accessor: (item: Customer) => <span className="font-medium text-cnk-accent-primary">{item.name}</span> },
        { header: t('email'), accessor: (item: Customer) => item.email || '-' },
        { header: t('phone'), accessor: (item: Customer) => item.phone1 || '-' },
        { header: t('createdAt'), accessor: (item: Customer) => new Date(item.createdAt).toLocaleDateString() },
        {
            header: t('actions'),
            accessor: (item: Customer) => (
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleView(item)} icon="fas fa-eye" title={t('view')} />
                    {canEdit && (
                        <>
                           <Button variant="info" size="sm" onClick={() => handleEdit(item)} icon="fas fa-edit" title={t('edit')} />
                           <Button variant="danger" size="sm" onClick={() => openDeleteConfirm(item.id)} icon="fas fa-trash" title={t('delete')} />
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">{t('customerList')}</h1>
                <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleExcelUpload} accept=".xlsx, .xls" className="hidden"/>
                    {canEdit && <Button variant="secondary" onClick={() => fileInputRef.current?.click()} icon="fas fa-upload">{t('addFromExcel')}</Button>}
                    <Button variant="primary" onClick={handleAdd} icon="fas fa-plus">{t('addNewCustomer')}</Button>
                </div>
            </div>
            <DataTable
                columns={columns}
                data={customers}
                emptyStateMessage={t('noCustomerYet')}
            />
            
            {/* --- Modals --- */}
            <CustomerForm
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                customer={selectedCustomer}
            />
            {selectedCustomer && (
                <CustomerDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    customer={selectedCustomer}
                    onEdit={handleEdit}
                    setView={setView}
                />
            )}
             <Modal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                title={t('areYouSure')}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsConfirmDeleteOpen(false)}>{t('cancel')}</Button>
                        <Button variant="danger" onClick={handleDelete}>{t('delete')}</Button>
                    </>
                }
            >
                <p>{t('deleteConfirmation')}</p>
            </Modal>
            {isMapperModalOpen && (
                <ExcelMappingModal 
                    isOpen={isMapperModalOpen}
                    onClose={() => setIsMapperModalOpen(false)}
                    jsonData={excelData.jsonData}
                    headers={excelData.headers}
                    onConfirm={handleMappingConfirmed}
                />
            )}
            {isConfirmImportModalOpen && (
                 <ImportConfirmationModal
                    isOpen={isConfirmImportModalOpen}
                    onClose={() => setIsConfirmImportModalOpen(false)}
                    dataToImport={mappedCustomers}
                    onConfirm={handleImportConfirmed}
                />
            )}
        </div>
    );
};

export default Customers;