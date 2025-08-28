import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { Appointment } from '../types';
import Button from '../components/common/Button';
import AppointmentForm from '../components/forms/AppointmentForm';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';

type ViewMode = 'day' | 'work-week' | 'week' | 'month';

const Appointments = () => {
    const { t, language } = useLanguage();
    const { appointments, customers, deleteAppointment, updateAppointment } = useData();
    const { showNotification } = useNotification();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
    const [modalData, setModalData] = useState<{ appointment?: Appointment | null, defaultDate?: Date }>({});
    const [draggedAppId, setDraggedAppId] = useState<string | null>(null);


    if(!appointments) return <Loader fullScreen />;

    const handleOpenModal = (appointment?: Appointment | null, defaultDate?: Date) => {
        setModalData({ appointment, defaultDate });
        setIsFormModalOpen(true);
    };
    
    const openDeleteConfirm = (appointmentId: string) => {
        setAppointmentToDelete(appointmentId);
        setIsConfirmDeleteOpen(true);
    };

    const handleDelete = () => {
        if(appointmentToDelete) {
            deleteAppointment(appointmentToDelete);
            showNotification('appointmentDeleted', 'success');
        }
        setIsConfirmDeleteOpen(false);
        setAppointmentToDelete(null);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, appId: string) => {
        e.dataTransfer.setData('text/plain', appId);
        setDraggedAppId(appId);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newDate: Date) => {
        e.preventDefault();
        const appId = e.dataTransfer.getData('text/plain');
        if (!appId) return;

        const appointmentToMove = appointments.find(app => app.id === appId);
        if (appointmentToMove) {
            const originalStartDate = new Date(appointmentToMove.start);
            const originalEndDate = new Date(appointmentToMove.end);
            const duration = originalEndDate.getTime() - originalStartDate.getTime();
            
            const newStartDate = new Date(newDate);
            newStartDate.setHours(originalStartDate.getHours(), originalStartDate.getMinutes(), originalStartDate.getSeconds());

            const newEndDate = new Date(newStartDate.getTime() + duration);

            const updatedAppointment: Appointment = {
                ...appointmentToMove,
                start: newStartDate.toISOString(),
                end: newEndDate.toISOString(),
            };

            await updateAppointment(updatedAppointment);
            showNotification('appointmentUpdated', 'success');
        }
        setDraggedAppId(null);
    };
    
    const Header = () => (
        <div className="p-2 border-b border-cnk-border-light flex flex-wrap justify-between items-center gap-2 bg-cnk-panel-light">
            <div className="flex items-center gap-2">
                <Button variant="primary" onClick={() => handleOpenModal(null, new Date())} icon="fas fa-plus">{t('appointmentCreate')}</Button>
                 <span className="border-l border-cnk-border-light h-8 mx-2"></span>
                <Button size="sm" variant="secondary" onClick={() => setCurrentDate(new Date())}>{t('today')}</Button>
                <div className="flex items-center">
                    <Button size="sm" variant="secondary" icon="fas fa-chevron-left" onClick={() => {
                        const newDate = new Date(currentDate);
                        if(viewMode === 'month') newDate.setMonth(currentDate.getMonth() - 1);
                        else if(viewMode === 'week' || viewMode === 'work-week') newDate.setDate(currentDate.getDate() - 7);
                        else newDate.setDate(currentDate.getDate() - 1);
                        setCurrentDate(newDate);
                    }}/>
                    <Button size="sm" variant="secondary" icon="fas fa-chevron-right" onClick={() => {
                        const newDate = new Date(currentDate);
                        if(viewMode === 'month') newDate.setMonth(currentDate.getMonth() + 1);
                        else if(viewMode === 'week' || viewMode === 'work-week') newDate.setDate(currentDate.getDate() + 7);
                        else newDate.setDate(currentDate.getDate() - 1);
                        setCurrentDate(newDate);
                    }}/>
                </div>
                 <h2 className="text-lg font-semibold text-cnk-txt-primary-light">{currentDate.toLocaleDateString(language, { year: 'numeric', month: 'long' })}</h2>
            </div>
            <div className="flex items-center gap-1 bg-cnk-bg-light p-1 rounded-lg">
                {(['day', 'work-week', 'week', 'month'] as ViewMode[]).map(v => (
                    <Button key={v} size="sm" variant={viewMode === v ? 'primary' : 'secondary'} className={viewMode === v ? '' : '!bg-transparent shadow-none'} onClick={() => setViewMode(v)}>
                        {t(v.replace('-', ''))}
                    </Button>
                ))}
            </div>
        </div>
    );
    
    const MonthView = () => {
        const monthAppointments = useMemo(() => {
            return appointments.filter(app => {
                const appDate = new Date(app.start);
                return appDate.getMonth() === currentDate.getMonth() && appDate.getFullYear() === currentDate.getFullYear();
            });
        }, [appointments, currentDate]);

        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        const weekDays = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

        const blanks = Array(firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1).fill(null);
        const days = Array.from({length: daysInMonth}, (_, i) => i + 1);

        return (
            <div className="flex-grow grid grid-cols-7 grid-rows-6">
                {weekDays.map(day => (
                    <div key={day} className="text-center font-bold p-2 border-b border-r border-cnk-border-light text-cnk-txt-muted-light">{day}</div>
                ))}
                {blanks.map((_, i) => <div key={`blank-${i}`} className="border-b border-r border-cnk-border-light"></div>)}
                {days.map(d => {
                    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
                    const isToday = d === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();
                    const dayApps = monthAppointments.filter(app => new Date(app.start).getDate() === d);

                    return (
                        <div 
                            key={d} 
                            className="border-b border-r border-cnk-border-light p-1 overflow-y-auto" 
                            onClick={() => handleOpenModal(null, dayDate)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, dayDate)}
                        >
                            <p className={`text-sm text-right ${isToday ? 'font-bold text-cnk-accent-primary' : 'text-cnk-txt-muted-light'}`}>{d}</p>
                            <div className="space-y-1">
                                {dayApps.map(app => (
                                    <div 
                                        key={app.id} 
                                        onClick={(e) => { e.stopPropagation(); handleOpenModal(app)}} 
                                        className="bg-cnk-accent-primary/80 text-white rounded p-1 text-xs cursor-pointer truncate"
                                        draggable={true}
                                        onDragStart={(e) => handleDragStart(e, app.id)}
                                    >
                                        {app.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };


    const CalendarView = () => {
        if (viewMode === 'month') {
            return <MonthView />;
        }

        const isWorkWeek = viewMode === 'work-week';
        const daysToShow = isWorkWeek ? 5 : (viewMode === 'week' ? 7 : 1);
        const startOfWeek = new Date(currentDate);
        if (viewMode !== 'day') {
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1)); // Monday as start of week
        }

        const days = Array.from({ length: daysToShow }, (_, i) => {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            return day;
        });
        
        const dayAppointments = (day: Date) => appointments.filter(app => new Date(app.start).toDateString() === day.toDateString());

        return (
            <div className="flex-grow overflow-auto">
                <div className="grid grid-cols-[60px_1fr] h-full">
                     {/* Header */}
                    <div className="col-start-2 grid sticky top-0 bg-cnk-panel-light z-10" style={{ gridTemplateColumns: `repeat(${daysToShow}, minmax(0, 1fr))` }}>
                        {days.map(day => (
                            <div key={day.toISOString()} className="p-2 border-b border-l border-cnk-border-light text-center">
                                <p className="font-semibold text-sm text-cnk-txt-muted-light">{day.toLocaleDateString(language, { weekday: 'short' })}</p>
                                <p className={`text-2xl font-bold ${day.toDateString() === new Date().toDateString() ? 'text-white bg-cnk-accent-primary rounded-full w-10 h-10 flex items-center justify-center mx-auto' : 'text-cnk-txt-primary-light'}`}>{day.getDate()}</p>
                            </div>
                        ))}
                    </div>
                    {/* All-day section */}
                    <div className="row-start-2 text-xs text-center border-r border-cnk-border-light p-1">{t('allDay')}</div>
                    <div className="col-start-2 row-start-2 grid border-b border-cnk-border-light min-h-[4rem]" style={{ gridTemplateColumns: `repeat(${daysToShow}, minmax(0, 1fr))` }}>
                        {days.map((day, i) => (
                            <div key={day.toISOString()} className={`p-1 border-l border-cnk-border-light`}>
                                {dayAppointments(day).filter(a => a.allDay).map(app => (
                                    <div key={app.id} onClick={() => handleOpenModal(app)} className="bg-cnk-accent-primary text-white rounded p-1 text-xs cursor-pointer truncate">{app.title}</div>
                                ))}
                            </div>
                        ))}
                    </div>
                     {/* Body */}
                    <div className="row-start-3 overflow-y-auto">
                        <div className="grid grid-cols-[60px_1fr] relative">
                            <div className="col-start-1 row-start-1">
                                 {Array.from({ length: 24 }, (_, i) => <div key={i} className="h-16 text-right pr-2 text-xs text-cnk-txt-muted-light border-r border-cnk-border-light">{`${i}:00`}</div>)}
                            </div>
                            <div className="col-start-2 row-start-1 grid relative" style={{ gridTemplateColumns: `repeat(${daysToShow}, minmax(0, 1fr))` }}>
                                {Array.from({ length: 24 }, (_, i) => <div key={i} className="h-16 border-b border-cnk-border-light pointer-events-none" style={{ gridColumn: `span ${daysToShow} / span ${daysToShow}` }}></div>)}
                                {days.map((day, i) => <div key={i} className="row-span-full h-full" style={{ gridColumnStart: i+1, gridRowStart: 1, gridRowEnd: 25 }} onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const hour = Math.floor((e.clientY - rect.top) / 64 * 2) / 2;
                                    const newDate = new Date(day);
                                    newDate.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);
                                    handleOpenModal(null, newDate);
                                }}></div>)}
                                {appointments.filter(a => !a.allDay).map(app => {
                                    const start = new Date(app.start);
                                    const end = new Date(app.end);
                                    const dayIndex = days.findIndex(d => d.toDateString() === start.toDateString());
                                    if (dayIndex === -1) return null;
    
                                    const top = (start.getHours() + start.getMinutes() / 60) * 4; // 4rem (h-16) per hour
                                    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                                    const height = duration * 4;
                                    
                                    return (
                                        <div key={app.id} 
                                            className="absolute p-2 rounded-lg bg-cnk-accent-primary/80 text-white overflow-hidden cursor-pointer hover:bg-cnk-accent-hover"
                                            style={{ top: `${top}rem`, left: `${dayIndex * (100/daysToShow)}%`, width: `${100/daysToShow}%`, height: `${height}rem`, minHeight: '2rem' }}
                                            onClick={() => handleOpenModal(app)}
                                            >
                                             <p className="font-bold text-xs truncate">{app.title}</p>
                                             <p className="text-xs truncate">{customers.find(c => c.id === app.customerId)?.name}</p>
                                        </div>
                                    );
                                 })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col flex-grow border border-cnk-border-light rounded-xl overflow-hidden shadow-lg bg-cnk-panel-light">
                <Header />
                <CalendarView />
            </div>
            <AppointmentForm 
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                appointment={modalData.appointment}
                defaultDate={modalData.defaultDate}
            />
             <Modal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                title={t('deleteAppointmentConfirm')}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsConfirmDeleteOpen(false)}>{t('cancel')}</Button>
                        <Button variant="danger" onClick={handleDelete}>{t('delete')}</Button>
                    </>
                }
            >
                <p>{t('deleteConfirmation')}</p>
            </Modal>
        </div>
    );
};

export default Appointments;