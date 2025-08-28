import React, { useState } from 'react';
import { EmailDraft } from '../../types';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { db } from '../../services/dbService';
import { useNotification } from '../../contexts/NotificationContext';


const EmailDraftModal = ({ isOpen, onClose, draft }: { isOpen: boolean, onClose: () => void, draft: EmailDraft }) => {
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const [subject, setSubject] = useState(draft.subject);
    const [body, setBody] = useState(draft.body);

    const handleSend = () => {
        const mailtoLink = `mailto:${draft.recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
        
        db.emailDrafts.update(draft.id, { status: 'sent' });
        showNotification('emailClientOpened', 'success');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="E-posta Taslağını Düzenle ve Gönder" size="2xl">
            <div className="space-y-4 p-4">
                <Input label={t('recipient')} value={draft.recipientEmail} readOnly />
                <Input label={t('subject')} value={subject} onChange={e => setSubject(e.target.value)} />
                <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={15}
                    className="w-full p-2 border rounded-md bg-cnk-bg-light"
                />
                <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button onClick={handleSend} icon="fas fa-paper-plane">{t('sendWithEmailClient')}</Button>
                </div>
            </div>
        </Modal>
    );
};

export default EmailDraftModal;
