import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import Button from '../components/common/Button';

const EmailPage = () => {
    const { t } = useLanguage();

    const openGmailInNewTab = () => {
        window.open('https://mail.google.com', '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="rounded-xl bg-white shadow-sm flex flex-col items-center justify-center p-8 text-center" style={{ height: 'calc(100vh - 120px)' }}>
            <i className="fas fa-exclamation-triangle text-5xl text-amber-400 mb-4"></i>
            <h3 className="text-xl font-bold text-slate-700">{t('gmailSecurityWarningTitle')}</h3>
            <p className="text-slate-500 my-2 max-w-md">{t('gmailSecurityWarningBody')}</p>
            <Button onClick={openGmailInNewTab} icon="fas fa-external-link-alt">
                {t('openGmailSecurely')}
            </Button>
        </div>
    );
};

export default EmailPage;