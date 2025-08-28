import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePersonnel } from '../contexts/PersonnelContext';
import { User, LeaveRequest, KmRecord } from '../types';
import Button from '../components/common/Button';
import UserForm from '../components/forms/UserForm';
import DataTable from '../components/common/DataTable';
import { useNotification } from '../contexts/NotificationContext';

const InfoItem = ({ label, value }: { label: string, value?: string | number }) => (
    <div>
        <p className="text-xs text-cnk-txt-muted-light">{label}</p>
        <p className="font-medium text-cnk-txt-secondary-light">{value || '-'}</p>
    </div>
);

const PerformanceCard = ({ label, value, color }: { label: string, value: string | number, color: 'blue' | 'orange' | 'green' | 'indigo' }) => {
    const colorClasses = {
        blue: 'bg-blue-500/10 text-blue-800',
        orange: 'bg-orange-500/10 text-orange-800',
        green: 'bg-green-500/10 text-green-800',
        indigo: 'bg-indigo-500/10 text-indigo-800',
    };
    return (
        <div className={`${colorClasses[color]} p-4 rounded-lg text-center`}>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
};

const PersonnelLeavesTab = ({ personnel }: { personnel: User }) => {
    const { t } = useLanguage();
    const { addLeaveRequest, getLeaveRequestsForUser } = usePersonnel();
    const { showNotification } = useNotification();
    const [leaveType, setLeaveType] = useState('Yıllık İzin');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    
    const leaveHistory = useMemo(() => getLeaveRequestsForUser(personnel.id), [getLeaveRequestsForUser, personnel.id]);

    const handleLeaveRequest = async () => {
        if (!startDate || !endDate) {
            showNotification('fieldsRequired', 'error');
            return;
        }
        await addLeaveRequest({ userId: personnel.id, type: leaveType, startDate, endDate, reason });
        showNotification('leaveRequestSent', 'success');
        setStartDate('');
        setEndDate('');
        setReason('');
    };

    const usedLeaveDays = useMemo(() => {
        return leaveHistory
            .filter(req => req.status === 'approved')
            .reduce((total, req) => {
                const start = new Date(req.startDate);
                const end = new Date(req.endDate);
                if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return total;
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                return total + diffDays;
            }, 0);
    }, [leaveHistory]);

    const remainingLeaveDays = (personnel.annualLeaveDays || 14) - usedLeaveDays;

    const getStatusClass = (status: LeaveRequest['status']) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'pending':
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    const leaveHistoryColumns = [
        { header: t('date'), accessor: (item: LeaveRequest) => new Date(item.requestDate).toLocaleDateString() },
        { header: "Tür", accessor: (item: LeaveRequest) => item.type },
        { header: "Tarih Aralığı", accessor: (item: LeaveRequest) => `${new Date(item.startDate).toLocaleDateString()} - ${new Date(item.endDate).toLocaleDateString()}` },
        { 
            header: t('status'), 
            accessor: (item: LeaveRequest) => (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(item.status)}`}>
                    {t(item.status)}
                </span>
            )
        }
    ];

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <PerformanceCard label="Yıllık İzin Hakkı" value={personnel.annualLeaveDays || 14} color="blue" />
                <PerformanceCard label={t('usedLeave')} value={usedLeaveDays} color="orange" />
                <PerformanceCard label={t('remainingLeave')} value={remainingLeaveDays} color="green" />
            </div>

            <div className="bg-cnk-panel-light p-4 rounded-lg mb-6 border border-cnk-border-light">
                <h4 className="font-bold text-lg mb-3">Yeni İzin Talebi Oluştur</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm font-medium">İzin Tipi</label>
                        <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className="w-full mt-1 p-2 border border-cnk-border-light bg-cnk-bg-light rounded-md">
                            <option>Yıllık İzin</option>
                            <option>Raporlu</option>
                            <option>Ücretsiz İzin</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Başlangıç Tarihi</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 p-2 border border-cnk-border-light bg-cnk-bg-light rounded-md"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Bitiş Tarihi</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mt-1 p-2 border border-cnk-border-light bg-cnk-bg-light rounded-md"/>
                    </div>
                    <div className="md:col-span-3">
                        <label className="text-sm font-medium">Açıklama (İsteğe Bağlı)</label>
                        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full mt-1 p-2 border border-cnk-border-light bg-cnk-bg-light rounded-md"></textarea>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button onClick={handleLeaveRequest}>{t('sendRequest')}</Button>
                </div>
            </div>
            
            <h4 className="font-bold text-lg mb-3">İzin Geçmişi</h4>
            <DataTable columns={leaveHistoryColumns} data={[...leaveHistory].reverse()} emptyStateMessage="İzin geçmişi bulunmuyor." />
        </div>
    );
};

const VehicleKmTab = ({ personnel }: { personnel: User }) => {
    const { t } = useLanguage();
    const { addKmRecord, getKmRecordsForUser } = usePersonnel();
    const [currentKm, setCurrentKm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'morning' | 'evening'>('all');

    const kmRecords = useMemo(() => getKmRecordsForUser(personnel.id), [getKmRecordsForUser, personnel.id]);

    const handleKmEntry = (type: 'morning' | 'evening') => {
        if (!currentKm) return;
        addKmRecord({ userId: personnel.id, km: Number(currentKm), type });
        setCurrentKm('');
    };
    
    const { dailyDistance, weeklyDistance } = useMemo(() => {
        if (!kmRecords || kmRecords.length === 0) {
            return { dailyDistance: 0, weeklyDistance: 0 };
        }

        const recordsByDate = [...kmRecords]
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .reduce((acc, record) => {
                (acc[record.date] = acc[record.date] || []).push(record);
                return acc;
        }, {} as Record<string, KmRecord[]>);

        let dailyDist = 0;
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayRecords = recordsByDate[todayStr];
        if (todayRecords) {
            const morning = todayRecords.find(r => r.type === 'morning');
            const evening = todayRecords.find(r => r.type === 'evening');
            if (morning && evening && evening.km > morning.km) {
                dailyDist = evening.km - morning.km;
            }
        }
        
        let weeklyDist = 0;
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const day = new Date(today);
            day.setDate(today.getDate() - i);
            const dayStr = day.toISOString().slice(0, 10);
            
            const dayRecords = recordsByDate[dayStr];
            if (dayRecords) {
                const morning = dayRecords.find(r => r.type === 'morning');
                const evening = dayRecords.find(r => r.type === 'evening');
                if (morning && evening && evening.km > morning.km) {
                    weeklyDist += (evening.km - morning.km);
                }
            }
        }

        return { dailyDistance: dailyDist, weeklyDistance: weeklyDist };
    }, [kmRecords]);

    const filteredKmRecords = useMemo(() => {
        return kmRecords.filter(record => {
            const dateMatch = !dateFilter || record.date === dateFilter;
            const typeMatch = typeFilter === 'all' || record.type === typeFilter;
            return dateMatch && typeMatch;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [kmRecords, dateFilter, typeFilter]);

    const kmRecordsColumns = [
        { header: "Tarih", accessor: (item: KmRecord) => new Date(item.date).toLocaleDateString()},
        { header: "Kilometre", accessor: (item: KmRecord) => item.km.toLocaleString('tr-TR')},
        { header: "Giriş Tipi", accessor: (item: KmRecord) => item.type === 'morning' ? 'Sabah' : 'Akşam'}
    ];

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <PerformanceCard label={t('dailyDistance')} value={`${dailyDistance.toLocaleString('tr-TR')} ${t('kmUnit')}`} color="blue" />
                <PerformanceCard label={t('weeklyDistance')} value={`${weeklyDistance.toLocaleString('tr-TR')} ${t('kmUnit')}`} color="indigo" />
            </div>

            <div className="bg-cnk-panel-light p-4 rounded-lg mb-6 border border-cnk-border-light">
                <h4 className="font-bold text-lg mb-3">Araç Bilgileri ve KM Girişi</h4>
                <p><strong>Plaka:</strong> {personnel.licensePlate} | <strong>Model:</strong> {personnel.vehicleModel} | <strong>İlk KM:</strong> {personnel.vehicleInitialKm}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mt-4">
                    <div className="md:col-span-1"><label className="text-sm font-medium">Güncel Kilometre</label><input type="number" value={currentKm} onChange={e => setCurrentKm(e.target.value)} className="w-full mt-1 p-2 border border-cnk-border-light bg-cnk-bg-light rounded-md" placeholder="örn. 25000"/></div>
                    <div className="md:col-span-2 flex gap-2">
                        <Button onClick={() => handleKmEntry('morning')} className="w-full">{t('morningEntry')}</Button>
                        <Button onClick={() => handleKmEntry('evening')} className="w-full" variant='secondary'>{t('eveningExit')}</Button>
                    </div>
                </div>
            </div>

            <div className="bg-cnk-panel-light p-4 rounded-lg mb-6 border border-cnk-border-light">
                <h4 className="font-bold text-lg mb-3">KM Kayıtları Filtrele</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="dateFilter" className="text-sm font-medium">Tarih</label>
                        <input type="date" id="dateFilter" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full mt-1 p-2 border border-cnk-border-light bg-cnk-bg-light rounded-md"/>
                    </div>
                    <div>
                        <label htmlFor="typeFilter" className="text-sm font-medium">Giriş Tipi</label>
                        <select id="typeFilter" value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="w-full mt-1 p-2 border border-cnk-border-light bg-cnk-bg-light rounded-md">
                            <option value="all">Tümü</option>
                            <option value="morning">Sabah</option>
                            <option value="evening">Akşam</option>
                        </select>
                    </div>
                     <div>
                        <Button onClick={() => { setDateFilter(''); setTypeFilter('all'); }} variant="secondary">Filtreyi Temizle</Button>
                    </div>
                </div>
            </div>
            
            <h4 className="font-bold text-lg mb-3">KM Kayıt Geçmişi</h4>
            <DataTable columns={kmRecordsColumns} data={filteredKmRecords} emptyStateMessage="Filtrelere uygun KM kaydı bulunmuyor."/>
        </div>
    );
};

const PersonnelDetail = ({ personnel, onEdit }: { personnel: User, onEdit: () => void }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('info');

    const tabs = [
        { id: 'info', label: t('personnelInfo') },
        { id: 'leaves', label: t('personnelLeaves') },
        { id: 'vehicle', label: t('vehicleKmTracking') }
    ];

    return (
        <div className="bg-cnk-panel-light rounded-lg shadow-lg">
            {/* Header */}
            <div className="bg-cnk-accent-primary/10 p-6 rounded-t-lg flex items-center space-x-6">
                <img src={personnel.avatar || `https://ui-avatars.com/api/?name=${personnel.name}&background=random`} alt={personnel.name} className="w-20 h-20 rounded-full border-4 border-cnk-accent-primary/50 object-cover"/>
                <div>
                    <h2 className="text-2xl font-bold text-cnk-txt-primary-light">{personnel.name}</h2>
                    <p className="text-cnk-accent-primary">{personnel.jobTitle || t('user')}</p>
                </div>
            </div>
            
            {/* Tabs */}
            <div className="border-b border-cnk-border-light px-6">
                <nav className="flex space-x-8 -mb-px">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === tab.id ? 'border-cnk-accent-primary text-cnk-accent-primary' : 'border-transparent text-cnk-txt-muted-light hover:text-cnk-txt-secondary-light hover:border-cnk-border-light'}`}>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
                {activeTab === 'info' && (
                     <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-cnk-txt-primary-light">{t('generalInfo')}</h3>
                            <Button onClick={onEdit} icon="fas fa-pencil-alt" size="sm">{t('edit')}</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-y-6 gap-x-4">
                                <InfoItem label="T.C No" value={personnel.tcNo} />
                                <InfoItem label={t('fullName')} value={personnel.name} />
                                <InfoItem label={t('jobTitle')} value={personnel.jobTitle} />
                                <InfoItem label={t('email')} value={personnel.username} />
                                <InfoItem label={t('phone')} value={personnel.phone} />
                                <InfoItem label={t('startDate')} value={personnel.startDate} />
                                <InfoItem label={t('workType')} value={personnel.workType} />
                                <InfoItem label={t('status')} value={personnel.employmentStatus} />
                                <InfoItem label={t('bloodType')} value={personnel.bloodType} />
                                <InfoItem label={t('licensePlate')} value={personnel.licensePlate} />
                            </div>
                            <div className="md:col-span-4 flex justify-center md:justify-end mt-4 md:mt-0">
                                <img src={personnel.avatar || `https://ui-avatars.com/api/?name=${personnel.name}&background=random`} alt={personnel.name} className="w-32 h-32 rounded-full object-cover shadow-md"/>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'leaves' && <PersonnelLeavesTab personnel={personnel} />}
                {activeTab === 'vehicle' && <VehicleKmTab personnel={personnel} />}
            </div>
        </div>
    );
};

const Users = () => {
    const { users, currentUser } = useAuth();
    const { t } = useLanguage();
    const [selectedPersonnelId, setSelectedPersonnelId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [personnelToEdit, setPersonnelToEdit] = useState<User | null>(null);

    useEffect(() => {
        if (users.length > 0 && !selectedPersonnelId) {
            setSelectedPersonnelId(users[0].id);
        }
    }, [users, selectedPersonnelId]);

    const handleAddNew = () => {
        setPersonnelToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (personnel: User) => {
        setPersonnelToEdit(personnel);
        setIsModalOpen(true);
    };

    if (currentUser?.role !== 'admin') {
        return (
            <div>
                <p className="mt-4 rounded-lg bg-yellow-500/10 p-4 text-yellow-300">{t('adminPrivilegeRequired')}</p>
            </div>
        );
    }
    
    const selectedPersonnel = users.find(u => u.id === selectedPersonnelId);

    return (
        <div>
            <div className="flex justify-end items-center mb-6">
                <Button onClick={handleAddNew} icon="fas fa-plus">{t('addNewPersonnel')}</Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Panel: Personnel List */}
                <div className="lg:col-span-4 xl:col-span-3">
                    <div className="bg-cnk-panel-light rounded-lg shadow-lg p-3 space-y-2 max-h-[75vh] overflow-y-auto">
                        {users.map(p => (
                            <div key={p.id} onClick={() => setSelectedPersonnelId(p.id)}
                                 className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${selectedPersonnelId === p.id ? 'bg-cnk-accent-primary text-white shadow-md' : 'hover:bg-cnk-bg-light'}`}>
                                <div className="flex items-center overflow-hidden">
                                    <img src={p.avatar || `https://ui-avatars.com/api/?name=${p.name.replace(/\s/g, "+")}&background=random`} alt={p.name} className="w-12 h-12 rounded-full mr-4 object-cover flex-shrink-0"/>
                                    <div className="truncate">
                                        <p className="font-semibold truncate">{p.name}</p>
                                        <p className={`${selectedPersonnelId === p.id ? 'text-blue-100' : 'text-cnk-txt-muted-light'} text-sm truncate`}>{p.jobTitle || t(p.role)}</p>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 ml-2">
                                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.employmentStatus === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {p.employmentStatus}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Details */}
                <div className="lg:col-span-8 xl:col-span-9">
                    {selectedPersonnel ? (
                        <PersonnelDetail personnel={selectedPersonnel} onEdit={() => handleEdit(selectedPersonnel)} />
                    ) : (
                        <div className="bg-cnk-panel-light rounded-lg shadow-lg p-8 text-center text-cnk-txt-muted-light h-full flex items-center justify-center">
                            <p>{t('selectPersonnelToView')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Add/Edit */}
            {isModalOpen && <UserForm 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={personnelToEdit}
            />}
        </div>
    );
};

export default Users;
