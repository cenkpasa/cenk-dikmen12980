import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { Appointment, Offer, Interview } from '../../types';

type TimelineItem = (Appointment | Offer | Interview) & { type: 'appointment' | 'offer' | 'interview' };

interface ActivityTimelineProps {
    customerId: string;
}

const getItemDate = (item: TimelineItem): Date => {
    switch(item.type) {
        case 'appointment': return new Date((item as Appointment).start);
        case 'interview': return new Date((item as Interview).formTarihi);
        case 'offer': return new Date((item as Offer).createdAt);
        default: return new Date(); // Fallback
    }
};

const ActivityTimeline = ({ customerId }: ActivityTimelineProps) => {
    const { appointments, offers, interviews } = useData();

    const timelineItems = useMemo(() => {
        const items: TimelineItem[] = [];

        appointments.filter(a => a.customerId === customerId).forEach(a => items.push({ ...a, type: 'appointment' }));
        offers.filter(o => o.customerId === customerId).forEach(o => items.push({ ...o, type: 'offer' }));
        interviews.filter(i => i.customerId === customerId).forEach(i => items.push({ ...i, type: 'interview' }));
        
        return items.sort((a, b) => getItemDate(b).getTime() - getItemDate(a).getTime());

    }, [customerId, appointments, offers, interviews]);

    const getIconForType = (type: TimelineItem['type']) => {
        const iconMap = {
            appointment: { icon: 'fa-calendar-check', bg: 'bg-green-100', text: 'text-green-600' },
            offer: { icon: 'fa-file-invoice-dollar', bg: 'bg-purple-100', text: 'text-purple-600' },
            interview: { icon: 'fa-file-signature', bg: 'bg-orange-100', text: 'text-orange-600' },
        };
        return iconMap[type];
    };
    
    const renderItemContent = (item: TimelineItem) => {
        switch (item.type) {
            case 'appointment':
                const app = item as Appointment;
                return (
                    <>
                        <p className="font-semibold">{app.title}</p>
                        <p className="text-xs text-cnk-txt-secondary-light">{new Date(app.start).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </>
                );
            case 'offer':
                const offer = item as Offer;
                return (
                    <>
                        <p className="font-semibold">Teklif Gönderildi - {offer.teklifNo}</p>
                        <p className="text-sm">Toplam: {offer.genelToplam.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})}</p>
                    </>
                );
            case 'interview':
                const interview = item as Interview;
                return (
                    <>
                        <p className="font-semibold">Görüşme Yapıldı</p>
                        <p className="text-xs text-cnk-txt-secondary-light">Görüşmeyi Yapan: {interview.gorusmeyiYapan}</p>
                    </>
                );
        }
    };


    if (timelineItems.length === 0) {
        return <div className="text-center p-4 text-sm text-cnk-txt-muted-light bg-cnk-bg-light rounded-md">Bu müşteri için henüz bir etkinlik kaydedilmemiş.</div>;
    }

    return (
        <div className="border-l-2 border-cnk-border-light pl-6 space-y-6 max-h-96 overflow-y-auto pr-2">
            {timelineItems.map((item, index) => {
                const iconInfo = getIconForType(item.type);
                const date = getItemDate(item);
                return (
                    <div key={`${item.type}-${item.id}-${index}`} className="relative">
                        <div className={`absolute -left-[34px] top-1 w-8 h-8 rounded-full ${iconInfo.bg} ${iconInfo.text} flex items-center justify-center`}>
                            <i className={`fas ${iconInfo.icon}`}></i>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-cnk-border-light">
                            {renderItemContent(item)}
                             <p className="text-xs text-cnk-txt-muted-light mt-1">{date.toLocaleDateString()}</p>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

export default ActivityTimeline;