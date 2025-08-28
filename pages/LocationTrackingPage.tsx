import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePersonnel } from '../contexts/PersonnelContext';
import { User, LocationRecord } from '../types';
import { WORKPLACE_COORDS } from '../constants';
import Button from '../components/common/Button';

// Haversine formula to calculate distance between two lat/lon points in km
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

const MapView = ({ locations }: { locations: LocationRecord[] }) => {
    const mapUrl = useMemo(() => {
        // Default bbox for Turkey
        let bbox = "25.6,35.8,44.8,42.1";
        let marker = "39.92,32.85"; // Ankara

        if (locations.length > 0) {
            const lastLocation = locations[locations.length - 1];
            marker = `${lastLocation.latitude},${lastLocation.longitude}`;
            // Center on the last known location with a small bounding box
            bbox = `${lastLocation.longitude - 0.05},${lastLocation.latitude - 0.05},${lastLocation.longitude + 0.05},${lastLocation.latitude + 0.05}`;
        }
        
        return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
    }, [locations]);
    
    return (
        <div className="bg-cnk-panel-light rounded-lg shadow-inner flex-grow relative overflow-hidden">
             <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                src={mapUrl}
                style={{ border: 0 }}
                title="Konum Haritası"
             ></iframe>
        </div>
    );
};

const LocationTrackingPage = () => {
    const { users, currentUser } = useAuth();
    const { customers } = useData();
    const { t } = useLanguage();
    const { addLocationRecord, getLocationHistoryForUser } = usePersonnel();

    const [selectedPersonnelId, setSelectedPersonnelId] = useState<string | null>(currentUser?.id || null);
    const [filter, setFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [isLiveTracking, setIsLiveTracking] = useState(false);
    
    // Live tracking simulation effect
    useEffect(() => {
        let intervalId: number | undefined;
        if (isLiveTracking && selectedPersonnelId) {
            const userLocationHistory = getLocationHistoryForUser(selectedPersonnelId);
            intervalId = window.setInterval(() => {
                const lastLocation = userLocationHistory?.[userLocationHistory.length - 1];
                const newLat = (lastLocation?.latitude || WORKPLACE_COORDS.latitude) + (Math.random() - 0.5) * 0.001;
                const newLon = (lastLocation?.longitude || WORKPLACE_COORDS.longitude) + (Math.random() - 0.5) * 0.001;
                addLocationRecord({ userId: selectedPersonnelId, latitude: newLat, longitude: newLon });
            }, 5000); // Update every 5 seconds
        }
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isLiveTracking, selectedPersonnelId, addLocationRecord, getLocationHistoryForUser]);

    const filteredLocationHistory = useMemo(() => {
        if (!selectedPersonnelId) return [];
        const locationHistory = getLocationHistoryForUser(selectedPersonnelId);

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        return locationHistory.filter(record => {
            const recordDate = new Date(record.timestamp);
            if (filter === 'daily') {
                return recordDate >= startOfToday;
            }
            if (filter === 'weekly') {
                const startOfWeek = new Date(startOfToday);
                startOfWeek.setDate(startOfToday.getDate() - (startOfToday.getDay() === 0 ? 6 : startOfToday.getDay() - 1) );
                return recordDate >= startOfWeek;
            }
            if (filter === 'monthly') {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                return recordDate >= startOfMonth;
            }
            return false;
        }).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [selectedPersonnelId, filter, getLocationHistoryForUser]);

    const report = useMemo(() => {
        if (filteredLocationHistory.length < 1) return null;
        
        const sortedHistory = filteredLocationHistory;
        const startTime = new Date(sortedHistory[0].timestamp);
        const endTime = new Date(sortedHistory[sortedHistory.length - 1].timestamp);
        const totalDurationMs = endTime.getTime() - startTime.getTime();
        const totalHours = Math.floor(totalDurationMs / (1000 * 60 * 60));
        const totalMinutes = Math.floor((totalDurationMs % (1000 * 60 * 60)) / (1000 * 60));

        const visits = sortedHistory.filter(r => r.isVisit).map(r => ({
            time: new Date(r.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            customer: customers.find(c => c.id === r.customerId)
        }));

        const isAtWork = getDistance(sortedHistory[0].latitude, sortedHistory[0].longitude, WORKPLACE_COORDS.latitude, WORKPLACE_COORDS.longitude) < 1; // within 1km radius

        return {
            startTime: startTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            endTime: endTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            totalHours,
            totalMinutes,
            visits,
            isAtWork
        };

    }, [filteredLocationHistory, customers]);
    
     if (currentUser?.role !== 'admin') {
        return <p className="text-center p-4 bg-yellow-500/10 text-yellow-300 rounded-lg">{t('adminPrivilegeRequired')}</p>;
    }

    return (
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-150px)]">
                {/* Personnel List */}
                <div className="lg:col-span-3">
                    <div className="bg-cnk-panel-light rounded-lg shadow-lg p-3 space-y-2 h-full overflow-y-auto">
                        {users.map(p => (
                            <div key={p.id} onClick={() => setSelectedPersonnelId(p.id)}
                                 className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${selectedPersonnelId === p.id ? 'bg-cnk-accent-primary text-white shadow-md' : 'hover:bg-cnk-bg-light'}`}>
                                <img src={p.avatar || `https://ui-avatars.com/api/?name=${p.name.replace(/\s/g, "+")}&background=random`} alt={p.name} className="w-10 h-10 rounded-full mr-3 object-cover"/>
                                <div><p className="font-semibold text-sm">{p.name}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Map and Report */}
                <div className="lg:col-span-9">
                    {selectedPersonnelId ? (
                        <div className="flex flex-col h-full gap-4">
                           <MapView locations={filteredLocationHistory} />
                            <div className="bg-cnk-panel-light rounded-lg shadow-lg p-4 h-auto">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                         <Button onClick={() => setIsLiveTracking(!isLiveTracking)} variant={isLiveTracking ? 'danger' : 'success'} size="sm">
                                            <i className={`fas fa-circle mr-2 ${isLiveTracking ? 'animate-pulse' : ''}`}></i>
                                            {isLiveTracking ? 'Takibi Durdur' : 'Anlık Takip'}
                                        </Button>
                                    </div>
                                    <div className="flex gap-1">
                                        {(['daily', 'weekly', 'monthly'] as const).map(f => (
                                            <Button key={f} size="sm" variant={filter === f ? 'primary' : 'secondary'} onClick={() => setFilter(f)}>{t(`${f}Report`)}</Button>
                                        ))}
                                    </div>
                                </div>
                                {report ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="bg-cnk-bg-light p-3 rounded-md">
                                            <h4 className="font-semibold mb-2 text-cnk-txt-secondary-light">{t('workHours')}</h4>
                                            <p className="text-cnk-txt-muted-light"><strong>{t('start')}:</strong> {report.startTime} ({report.isAtWork ? t('atWork') : t('outsideWork')})</p>
                                            <p className="text-cnk-txt-muted-light"><strong>{t('end')}:</strong> {report.endTime}</p>
                                            <p className="text-cnk-txt-muted-light"><strong>{t('totalDuration')}:</strong> {report.totalHours} saat {report.totalMinutes} dakika</p>
                                        </div>
                                        <div className="bg-cnk-bg-light p-3 rounded-md">
                                            <h4 className="font-semibold mb-2 text-cnk-txt-secondary-light">{t('customerVisits')}</h4>
                                            {report.visits.length > 0 ? (
                                                <ul className="text-cnk-txt-muted-light">{report.visits.map((v, i) => <li key={`${v.customer?.id}-${i}`}>- {v.time} @ {v.customer?.name}</li>)}</ul>
                                            ) : <p className="text-cnk-txt-muted-light">{t('noVisits')}</p>}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-cnk-txt-muted-light text-center p-4">{t('noLocationData')}</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-cnk-panel-light rounded-lg shadow-lg p-8 text-center text-cnk-txt-muted-light h-full flex items-center justify-center">
                            <p>{t('selectPersonnelToTrack')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LocationTrackingPage;