import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { User } from '../../types';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';

interface UserFormProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

const UserForm = ({ isOpen, onClose, user }: UserFormProps) => {
    const { addUser, updateUser, users } = useAuth();
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const [activeTab, setActiveTab] = useState('general');

    const getInitialState = (): Omit<User, 'id'> => ({
        // FIX: Changed default role from 'user' to 'saha' to match UserRole type.
        username: '', password: '', role: 'saha', name: '',
        jobTitle: '', avatar: '', tcNo: '', phone: '', startDate: '',
        employmentStatus: 'Aktif', bloodType: '', licensePlate: '', gender: 'male',
        salary: 0, educationLevel: '', address: '', annualLeaveDays: 14,
        workType: 'full-time', vehicleModel: '', vehicleInitialKm: 0
    });

    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            setActiveTab('general');
            if (user) {
                const userData = { ...user };
                const initialStateKeys = Object.keys(getInitialState());
                initialStateKeys.forEach(key => {
                    if ((userData as any)[key] === undefined || (userData as any)[key] === null) {
                        (userData as any)[key] = (getInitialState() as any)[key];
                    }
                });
                setFormData({
                    ...userData,
                    password: '',
                });
            } else {
                 setFormData(getInitialState());
            }
        }
    }, [user, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({...prev, [id]: type === 'number' ? (value === '' ? '' : Number(value)) : value}));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name || !formData.username || (!user && !formData.password)) {
            showNotification('fieldsRequired', 'error');
            return;
        }

        if (users.some(u => u.username.toLowerCase() === formData.username.toLowerCase() && u.id !== user?.id)) {
            showNotification('usernameInUse', 'error');
            return;
        }
        
        try {
            if(user) {
                const userToUpdate: User = { ...user, ...formData };
                await updateUser(userToUpdate);
                showNotification('userUpdated', 'success');
            } else {
                const newUser: Omit<User, 'id'> = { ...formData };
                await addUser(newUser);
                showNotification('userAdded', 'success');
            }
            onClose();
        } catch(err) {
            console.error(err);
            showNotification('genericError', 'error');
        }
    };

    const tabs = [
        { id: 'general', label: t('generalInfo') },
        { id: 'account', label: t('accountAndPermissions') },
        { id: 'vehicle', label: t('vehicleAssignmentInfo') },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={user ? t('editPersonnel') : t('addNewPersonnel')}
            size="3xl"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button variant="primary" onClick={handleSubmit}>{t('save')}</Button>
                </>
            }
        >
            <div className="border-b border-cnk-border-light mb-4">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium ${activeTab === tab.id ? 'border-b-2 border-cnk-accent-primary text-cnk-accent-primary' : 'text-cnk-txt-muted-light'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {activeTab === 'general' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        <Input id="name" label={t('fullName')} value={formData.name || ''} onChange={handleChange} required />
                        <Input id="tcNo" label="T.C. No" value={formData.tcNo || ''} onChange={handleChange} />
                        <Input id="jobTitle" label={t('jobTitle')} value={formData.jobTitle || ''} onChange={handleChange} />
                         <div>
                            <label htmlFor="employmentStatus" className="mb-2 block text-sm font-semibold">{t('status')}</label>
                            <select id="employmentStatus" value={formData.employmentStatus || 'Aktif'} onChange={handleChange} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2">
                                <option value="Aktif">{t('active')}</option>
                                <option value="Pasif">{t('passive')}</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="gender" className="mb-2 block text-sm font-semibold">{t('gender')}</label>
                            <select id="gender" value={formData.gender || 'male'} onChange={handleChange} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2">
                                <option value="male">{t('male')}</option>
                                <option value="female">{t('female')}</option>
                                <option value="other">{t('other')}</option>
                            </select>
                        </div>
                        <Input id="phone" label={t('phone')} value={formData.phone || ''} onChange={handleChange} />
                        <Input id="startDate" label={t('startDate')} type="date" value={formData.startDate || ''} onChange={handleChange} />
                         <div>
                            <label htmlFor="workType" className="mb-2 block text-sm font-semibold">{t('workType')}</label>
                            <select id="workType" value={formData.workType || 'full-time'} onChange={handleChange} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2">
                                <option value="full-time">{t('fullTime')}</option>
                                <option value="part-time">{t('partTime')}</option>
                            </select>
                        </div>
                        <Input id="annualLeaveDays" label={t('annualLeaveDays')} type="number" value={formData.annualLeaveDays === 0 ? '' : formData.annualLeaveDays} onChange={handleChange} />
                        <Input id="salary" label={t('salary')} type="number" value={formData.salary === 0 ? '' : formData.salary} onChange={handleChange} />
                        <Input id="bloodType" label={t('bloodType')} value={formData.bloodType || ''} onChange={handleChange} />
                        <Input id="educationLevel" label={t('educationLevel')} value={formData.educationLevel || ''} onChange={handleChange} />
                        <div className="sm:col-span-2">
                            <label htmlFor="address" className="mb-2 block text-sm font-semibold">{t('address')}</label>
                            <textarea id="address" value={formData.address || ''} onChange={handleChange} rows={2} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2"></textarea>
                        </div>
                    </div>
                )}
                {activeTab === 'account' && (
                     <div className="space-y-1">
                        <Input id="username" label={t('username')} value={formData.username || ''} onChange={handleChange} required />
                        <Input id="password" type="password" label={`${t('password')} (${user ? t('leaveBlankToKeep') : t('required')})`} value={formData.password || ''} onChange={handleChange} required={!user} />
                        <div>
                            <label htmlFor="role" className="mb-2 block text-sm font-semibold">{t('role')}</label>
                            {/* FIX: Replaced invalid 'user' role option with all valid UserRole options. */}
                            <select id="role" value={formData.role} onChange={handleChange} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2">
                                <option value="saha">{t('saha')}</option>
                                <option value="muhasebe">{t('muhasebe')}</option>
                                <option value="admin">{t('admin')}</option>
                            </select>
                        </div>
                    </div>
                )}
                 {activeTab === 'vehicle' && (
                     <div className="space-y-1">
                        <Input id="licensePlate" label={t('licensePlate')} value={formData.licensePlate || ''} onChange={handleChange} />
                        <Input id="vehicleModel" label={t('vehicleModel')} value={formData.vehicleModel || ''} onChange={handleChange} />
                        <Input id="vehicleInitialKm" type="number" label={t('initialKm')} value={formData.vehicleInitialKm === 0 ? '' : formData.vehicleInitialKm} onChange={handleChange} />
                    </div>
                )}
            </form>
        </Modal>
    );
};

export default UserForm;