import React, { useState, useMemo } from 'react';
import { useErp, SyncResult } from '../contexts/ErpContext';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { User, ErpSettings, StockItem, Customer, Offer, Invoice } from '../types';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import DataTable from '../components/common/DataTable';

const TargetEditModal = ({ isOpen, onClose, user, onSave }: { isOpen: boolean, onClose: () => void, user: User, onSave: (target: number) => void }) => {
    const { t } = useLanguage();
    const [target, setTarget] = useState(user.salesTarget || 0);

    const handleSave = () => {
        onSave(Number(target));
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('salesTargetFor', { name: user.name })} footer={
            <>
                <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                <Button onClick={handleSave}>{t('save')}</Button>
            </>
        }>
            <Input
                label={t('targetAmount')}
                id="salesTarget"
                type="number"
                value={String(target)}
                onChange={(e) => setTarget(Number(e.target.value))}
            />
        </Modal>
    );
};

const SyncSummaryModal = ({ isOpen, onClose, result }: { isOpen: boolean, onClose: () => void, result: SyncResult | null }) => {
    const { t } = useLanguage();
    if (!result) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('syncSummaryTitle', {type: result.type})} footer={
            <Button onClick={onClose}>{t('close')}</Button>
        }>
            <div className="space-y-3 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <i className="fas fa-check-circle text-2xl text-green-600"></i>
                </div>
                <h3 className="text-lg font-medium leading-6 text-cnk-txt-primary-light">{t('syncSuccessTitle')}</h3>
                <div className="mt-2 text-sm text-cnk-txt-secondary-light">
                    <p dangerouslySetInnerHTML={{ __html: t('syncSummaryBody', { fetched: String(result.fetched), added: String(result.added), updated: String(result.updated) }) }} />
                </div>
                <div className="mt-4 flex justify-around rounded-lg bg-cnk-bg-light p-4">
                    <div>
                        <div className="text-2xl font-bold text-green-600">{result.added}</div>
                        <div className="text-sm font-medium text-cnk-txt-muted-light">{t('newRecordsAdded')}</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-blue-600">{result.updated}</div>
                        <div className="text-sm font-medium text-cnk-txt-muted-light">{t('recordsUpdated')}</div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};


const ErpIntegrationPage = () => {
    const { t } = useLanguage();
    const { erpSettings, updateErpSettings, syncStock, syncInvoices, stockItems, invoices, syncCustomers, syncOffers, syncIncomingInvoices, syncOutgoingInvoices } = useErp();
    const { customers, offers } = useData();
    const { users, updateUser, currentUser } = useAuth();
    const { showNotification } = useNotification();

    const [settings, setSettings] = useState<ErpSettings | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState('connection');
    const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

    React.useEffect(() => {
        if (erpSettings) {
            setSettings(erpSettings);
        }
    }, [erpSettings]);

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (settings) {
            setSettings({ ...settings, [e.target.id]: e.target.value });
        }
    };

    const handleToggleConnection = async () => {
        if (!settings) return;
        setIsLoading(true);
        // Simulate connection logic
        await new Promise(res => setTimeout(res, 1000));
        // Save settings along with connection status
        await updateErpSettings({ ...settings, isConnected: !settings.isConnected });
        setIsLoading(false);
    };

    const handleSync = async (type: 'stock' | 'invoices' | 'customers' | 'offers' | 'incoming' | 'outgoing') => {
        setIsSyncing(type);
        try {
            let result;
            switch(type) {
                case 'stock': result = await syncStock(); break;
                case 'invoices': result = await syncInvoices(); break;
                case 'customers': result = await syncCustomers(); break;
                case 'offers': result = await syncOffers(); break;
                case 'incoming': result = await syncIncomingInvoices(); break;
                case 'outgoing': result = await syncOutgoingInvoices(); break;
            }
            setSyncResult(result);
        } catch (error) {
            console.error("Sync failed:", error);
            showNotification('genericError', 'error');
        } finally {
            setIsSyncing(null);
        }
    };

    const handleSaveTarget = async (user: User, target: number) => {
        await updateUser({ ...user, salesTarget: target });
        showNotification('userUpdated', 'success');
        setEditingUser(null);
    };

    const salesData = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return users.map(user => {
            const monthlySales = invoices
                .filter(inv => {
                    const invDate = new Date(inv.date);
                    return inv.userId === user.id && invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
                })
                .reduce((sum, inv) => sum + inv.totalAmount, 0);
            
            const progress = (user.salesTarget && user.salesTarget > 0) ? (monthlySales / user.salesTarget) * 100 : 0;

            return { ...user, monthlySales, progress };
        });
    }, [users, invoices]);
    
    // --- Table Columns Definitions ---
    const salesColumns = [
        { header: t('personnel'), accessor: (item: any) => item.name },
        { header: t('monthlyTarget'), accessor: (item: any) => `${(item.salesTarget || 0).toLocaleString('tr-TR')} TL` },
        { header: t('thisMonthSales'), accessor: (item: any) => `${item.monthlySales.toLocaleString('tr-TR')} TL` },
        { header: t('progress'), accessor: (item: any) => (
            <div className="w-full bg-cnk-bg-light rounded-full h-4"><div className="bg-cnk-accent-primary h-4 rounded-full text-white text-xs flex items-center justify-center" style={{ width: `${Math.min(item.progress, 100)}%`}}>{item.progress.toFixed(0)}%</div></div>
        )},
        { header: t('actions'), accessor: (item: User) => <Button size="sm" onClick={() => setEditingUser(item)}>{t('editTarget')}</Button>},
    ];

    const stockColumns = [
        { header: t('stockCode'), accessor: (item: StockItem) => item.id },
        { header: t('stockName'), accessor: (item: StockItem) => item.name },
        { header: t('stockQuantity'), accessor: (item: StockItem) => item.quantity },
        { header: t('stockPrice'), accessor: (item: StockItem) => `${item.price.toLocaleString('tr-TR')} TL` },
    ];
    
    const customerColumns = [
        { header: t('nameCompanyName'), accessor: (item: Customer) => item.name },
        { header: t('email'), accessor: (item: Customer) => item.email || '-' },
        { header: t('phone'), accessor: (item: Customer) => item.phone1 || '-' },
        { header: t('taxOffice'), accessor: (item: Customer) => item.taxOffice || '-' },
    ];
    
    const offerColumns = [
        { header: t('teklifNo'), accessor: (item: Offer) => item.teklifNo },
        { header: t('customer'), accessor: (item: Offer) => customers.find(c => c.id === item.customerId)?.name || t('unknownCustomer')},
        { header: t('date'), accessor: (item: Offer) => new Date(item.createdAt).toLocaleDateString() },
        { header: t('totalAmount'), accessor: (item: Offer) => `${item.genelToplam.toLocaleString('tr-TR')} TL` },
    ];

    const invoiceColumns = [
        { header: t('invoiceNo'), accessor: (item: Invoice) => item.id },
        { header: t('customer'), accessor: (item: Invoice) => customers.find(c => c.id === item.customerId)?.name || t('unknownCustomer') },
        { header: t('date'), accessor: (item: Invoice) => new Date(item.date).toLocaleDateString() },
        { header: t('totalAmount'), accessor: (item: Invoice) => `${item.totalAmount.toLocaleString('tr-TR')} TL` },
    ];
    
    const canAccess = currentUser?.role === 'admin' || currentUser?.role === 'muhasebe';

    if (!canAccess) {
        return <p className="text-center p-4 bg-yellow-500/10 text-yellow-300 rounded-lg">{t('permissionDenied')}</p>;
    }

    if (!settings) {
        return <Loader fullScreen />;
    }

    const tabs = [
        { id: 'connection', labelKey: 'erpConnectionTab' },
        { id: 'targets', labelKey: 'erpSalesTargetsTab' },
        { id: 'customers', labelKey: 'erpCustomersTab' },
        { id: 'offers', labelKey: 'erpOffersTab' },
        { id: 'stock', labelKey: 'erpStockStatusTab' },
        { id: 'invoices', labelKey: 'erpInvoicesTab' },
    ];

    return (
        <div>
            {editingUser && <TargetEditModal isOpen={true} onClose={() => setEditingUser(null)} user={editingUser} onSave={(target) => handleSaveTarget(editingUser, target)} />}
            <SyncSummaryModal isOpen={!!syncResult} onClose={() => setSyncResult(null)} result={syncResult} />
            
            <div className="border-b border-cnk-border-light mb-6">
                <nav className="flex space-x-4">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === tab.id ? 'bg-cnk-panel-light border border-cnk-border-light border-b-cnk-panel-light text-cnk-accent-primary -mb-px' : 'text-cnk-txt-muted-light hover:text-cnk-accent-primary'}`}>
                            {t(tab.labelKey)}
                        </button>
                    ))}
                </nav>
            </div>

            <div className={`${activeTab === 'connection' ? 'block' : 'hidden'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="rounded-xl border border-cnk-border-light bg-cnk-panel-light p-6 shadow-sm lg:col-span-1">
                        <h2 className="text-xl font-semibold text-cnk-accent-primary mb-4">{t('databaseConnection')}</h2>
                        <div className="space-y-4">
                            <Input label={t('server')} id="server" value={settings.server} onChange={handleSettingsChange} disabled={settings.isConnected}/>
                            <Input label="Database Path" id="databasePath" value={settings.databasePath} onChange={handleSettingsChange} disabled={settings.isConnected}/>
                            <Input label={t('username')} id="username" value={settings.username} onChange={handleSettingsChange} disabled={settings.isConnected}/>
                            <Input label={t('password')} id="password" type="password" value="••••••••" disabled={true} />
                            <div className="flex items-center justify-between pt-4">
                                <div className="flex items-center gap-2 font-semibold">
                                    <span className={`h-3 w-3 rounded-full ${settings.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                    <span className={settings.isConnected ? 'text-green-600' : 'text-red-600'}>{settings.isConnected ? t('connected') : t('notConnected')}</span>
                                </div>
                                <Button onClick={handleToggleConnection} isLoading={isLoading} variant={settings.isConnected ? 'danger' : 'success'}>
                                    {settings.isConnected ? t('disconnect') : t('connect')}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <h2 className="text-xl font-semibold text-cnk-accent-primary mb-4">{t('dataSync')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <SyncCard titleKey="incomingInvoices" descriptionKey="erpIncomingInvoiceSyncDesc" lastSync={settings.lastSyncIncomingInvoices} type="incoming" onSync={handleSync} isSyncing={isSyncing} isConnected={settings.isConnected} />
                           <SyncCard titleKey="outgoingInvoices" descriptionKey="erpOutgoingInvoiceSyncDesc" lastSync={settings.lastSyncOutgoingInvoices} type="outgoing" onSync={handleSync} isSyncing={isSyncing} isConnected={settings.isConnected} />
                           <SyncCard titleKey="customerListTitle" descriptionKey="erpCustomerSyncDesc" lastSync={settings.lastSyncCustomers} type="customers" onSync={handleSync} isSyncing={isSyncing} isConnected={settings.isConnected} />
                           <SyncCard titleKey="offerManagementTitle" descriptionKey="erpOfferSyncDesc" lastSync={settings.lastSyncOffers} type="offers" onSync={handleSync} isSyncing={isSyncing} isConnected={settings.isConnected} />
                        </div>
                    </div>
                </div>
            </div>
            
            <TabContent isVisible={activeTab === 'targets'} title={t('erpSalesTargetsTab')}>
                <DataTable columns={salesColumns} data={salesData} />
            </TabContent>
            
            <TabContent isVisible={activeTab === 'customers'} title={t('erpCustomersTab')}>
                <DataTable columns={customerColumns} data={customers} emptyStateMessage={t('noCustomerData')} />
            </TabContent>

            <TabContent isVisible={activeTab === 'offers'} title={t('erpOffersTab')}>
                <DataTable columns={offerColumns} data={offers} emptyStateMessage={t('noOfferData')} />
            </TabContent>

            <TabContent isVisible={activeTab === 'stock'} title={t('erpStockStatusTab')}>
                <DataTable columns={stockColumns} data={stockItems} emptyStateMessage={t('noStockData')} />
            </TabContent>
            
            <TabContent isVisible={activeTab === 'invoices'} title={t('erpInvoicesTab')}>
                <DataTable columns={invoiceColumns} data={invoices} emptyStateMessage={t('noInvoiceData')} />
            </TabContent>
        </div>
    );
};

const TabContent = ({ isVisible, title, children }: { isVisible: boolean, title: string, children: React.ReactNode }) => {
    if (!isVisible) return null;
    return (
        <div className="rounded-xl border border-cnk-border-light bg-cnk-panel-light p-6 shadow-sm">
             <h2 className="text-xl font-semibold text-cnk-accent-primary mb-4">{title}</h2>
             {children}
        </div>
    );
};

const SyncCard = ({ titleKey, descriptionKey, lastSync, type, onSync, isSyncing, isConnected } : { titleKey: string, descriptionKey: string, lastSync?: string, type: 'customers' | 'offers' | 'stock' | 'invoices' | 'incoming' | 'outgoing', onSync: (type: any) => void, isSyncing: string | null, isConnected: boolean }) => {
    const { t } = useLanguage();
    const syncKeyMap = { customers: 'syncCustomers', offers: 'syncOffers', stock: 'syncStock', invoices: 'syncInvoices', incoming: 'syncIncomingInvoices', outgoing: 'syncOutgoingInvoices' };
    return (
        <div className="flex flex-col justify-between p-4 bg-cnk-bg-light rounded-lg border border-cnk-border-light">
            <div>
                <h3 className="font-semibold text-lg text-cnk-txt-secondary-light">{t(titleKey)}</h3>
                <p className="text-xs text-cnk-txt-muted-light mt-1 mb-2 h-8">{t(descriptionKey)}</p>
                <p className="text-xs text-cnk-txt-muted-light/50">Son Senk: {lastSync ? new Date(lastSync).toLocaleString() : 'N/A'}</p>
            </div>
            <div className="flex gap-2 mt-3">
                <Button onClick={() => onSync(type)} isLoading={isSyncing === type} disabled={!isConnected || (isSyncing !== null && isSyncing !== type)} className="w-full">{t(syncKeyMap[type])}</Button>
            </div>
        </div>
    );
};

export default ErpIntegrationPage;