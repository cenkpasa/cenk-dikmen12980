import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Appointment } from '../../types';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { useAuth } from '../../contexts/AuthContext';
import Autocomplete from '../common/Autocomplete';

interface AppointmentFormProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment | null | undefined;
    defaultDate?: Date;
}

const AppointmentForm = ({ isOpen, onClose, appointment, defaultDate }: AppointmentFormProps) => {
    const { customers, addAppointment, updateAppointment } = useData();
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const { currentUser } = useAuth();
    
    const getInitialState = () => {
        const startDate = defaultDate || new Date();
        const endDate = new Date(startDate.getTime() + 30 * 60000); // 30 mins later
        return {
            customerId: '',
            title: '',
            startDate: startDate.toISOString().slice(0, 10),
            startTime: startDate.toTimeString().slice(0, 5),
            endDate: endDate.toISOString().slice(0, 10),
            endTime: endDate.toTimeString().slice(0, 5),
            allDay: false,
            notes: '',
            reminder: '15m'
        };
    };

    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            if (appointment) {
                const start = new Date(appointment.start);
                const end = new Date(appointment.end);
                setFormData({
                    customerId: appointment.customerId,
                    title: appointment.title,
                    startDate: start.toISOString().slice(0, 10),
                    startTime: start.toTimeString().slice(0, 5),
                    endDate: end.toISOString().slice(0, 10),
                    endTime: end.toTimeString().slice(0, 5),
                    allDay: appointment.allDay || false,
                    notes: appointment.notes || '',
                    reminder: appointment.reminder || '15m'
                });
            } else {
                setFormData(getInitialState());
            }
        }
    }, [appointment, isOpen, defaultDate]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({...prev, [id]: type === 'checkbox' ? checked : value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.customerId || !formData.title) {
            showNotification('fieldsRequired', 'error');
            return;
        }
        if (!currentUser) return;

        const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
        const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

        const appointmentData: Omit<Appointment, 'id' | 'createdAt'> = {
            customerId: formData.customerId,
            userId: currentUser.id,
            title: formData.title,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            allDay: formData.allDay,
            notes: formData.notes,
            reminder: formData.reminder,
        };

        if(appointment) {
            updateAppointment({ ...appointment, ...appointmentData });
            showNotification('appointmentUpdated', 'success');
        } else {
            addAppointment(appointmentData);
            showNotification('appointmentAdded', 'success');
        }
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={appointment ? t('appointmentEdit') : t('appointmentCreate')}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button variant="primary" onClick={handleSubmit}>{t('save')}</Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input id="title" placeholder={t('addTitle')} value={formData.title} onChange={handleChange} required containerClassName="!mb-0" className="!text-lg !font-semibold !border-0 !border-b-2 !rounded-none" />
                 <div>
                    <label htmlFor="customerId" className="mb-2 block text-sm font-semibold text-text-dark">{t('selectCustomer')}</label>
                    <Autocomplete
                        items={customers.map(c => ({ id: c.id, name: c.name }))}
                        onSelect={(id) => setFormData(prev => ({...prev, customerId: id}))}
                        placeholder={t('searchCustomer')}
                        initialValue={customers.find(c => c.id === formData.customerId)?.name || ''}
                    />
                </div>
                 <div className="flex items-center gap-4">
                    <i className="fas fa-clock text-slate-500"></i>
                    <Input id="startDate" type="date" value={formData.startDate} onChange={handleChange} required containerClassName="!mb-0 flex-grow" />
                    <Input id="startTime" type="time" value={formData.startTime} onChange={handleChange} required containerClassName="!mb-0" />
                    <span>-</span>
                    <Input id="endTime" type="time" value={formData.endTime} onChange={handleChange} required containerClassName="!mb-0" />
                    <Input id="endDate" type="date" value={formData.endDate} onChange={handleChange} required containerClassName="!mb-0 flex-grow" />
                     <label className="flex items-center gap-2"><input type="checkbox" id="allDay" checked={formData.allDay} onChange={handleChange}/>{t('allDay')}</label>
                </div>
                 <div className="flex items-center gap-4">
                    <i className="fas fa-bell text-slate-500"></i>
                    <select id="reminder" value={formData.reminder} onChange={handleChange} className="flex-grow rounded-lg border border-slate-300 bg-white px-3 py-2 text-text-dark shadow-sm">
                        <option value="none">{t('noReminder')}</option>
                        <option value="15m">{t('reminder15m')}</option>
                        <option value="1h">{t('reminder1h')}</option>
                        <option value="1d">{t('reminder1d')}</option>
                    </select>
                </div>
                 <div className="flex items-start gap-4">
                    <i className="fas fa-align-left text-slate-500 mt-2"></i>
                     <textarea id="notes" placeholder={t('addDescription')} value={formData.notes} onChange={handleChange} rows={3} className="w-full flex-grow rounded-lg border border-slate-300 bg-white px-3 py-2 text-text-dark shadow-sm" />
                </div>
            </form>
        </Modal>
    );
};

export default AppointmentForm;