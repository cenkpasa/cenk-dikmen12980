import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import Button from '../components/common/Button';
import { ASSETS, PASSWORD_MIN_LENGTH } from '../constants';
import { api } from '../services/apiService';
import Input from '../components/common/Input';
import UserAvatar from '../components/assets/UserAvatar';

type View = 'login' | 'forgot_password' | 'verify_code' | 'reset_password';

const LoginPage = () => {
    const { login, resetPassword } = useAuth();
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    
    const [view, setView] = useState<View>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const result = await login(username, password, rememberMe);
        if (result.success) {
            showNotification(result.messageKey, 'success', { username: username });
        } else {
            setError(t(result.messageKey));
        }
        setIsLoading(false);
    };
    
    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const result = await api.sendPasswordResetCode(email);
        if (result.success) {
            showNotification(result.messageKey, 'success');
            setView('verify_code');
        } else {
            setError(t(result.messageKey));
        }
        setIsLoading(false);
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const result = await api.verifyPasswordResetCode(email, code);
        if (result.success) {
            showNotification(result.messageKey, 'info');
            setView('reset_password');
        } else {
            setError(t(result.messageKey));
        }
        setIsLoading(false);
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) {
            setError(t('passwordsDoNotMatch'));
            return;
        }
        if (newPassword.length < PASSWORD_MIN_LENGTH) {
            setError(t('passwordTooShort', { minLength: String(PASSWORD_MIN_LENGTH) }));
            return;
        }
        setIsLoading(true);
        // Pass the code for a more secure flow
        const result = await resetPassword(email, newPassword, code);
        if (result.success) {
            showNotification(result.messageKey, 'success');
            // Reset state and go back to login
            setEmail('');
            setCode('');
            setNewPassword('');
            setConfirmPassword('');
            setView('login');
        } else {
            setError(t(result.messageKey));
        }
        setIsLoading(false);
    };
    
    const changeView = (newView: View) => {
        setError('');
        setUsername('');
        setPassword('');
        setEmail(view === 'login' ? username : ''); // Pre-fill email if available
        setCode('');
        setNewPassword('');
        setConfirmPassword('');
        setView(newView);
    }

    const renderContent = () => {
        switch (view) {
            case 'forgot_password':
                return (
                    <>
                        <h2 className="text-xl text-slate-200 mb-2 text-center font-semibold">{t('forgotPassword')}</h2>
                        <p className="text-slate-300 text-sm mb-6 text-center">{t('forgotPasswordPrompt')}</p>
                        <form onSubmit={handleSendCode}>
                           <Input variant="transparent" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('enterYourEmail')} required />
                           <Button type="submit" isLoading={isLoading} variant="login" className="w-full !py-3">{t('sendResetCode')}</Button>
                           <button type="button" onClick={() => changeView('login')} className="block w-full text-center text-sm text-slate-300 mt-4 hover:underline">{t('backToLogin')}</button>
                        </form>
                    </>
                );
            case 'verify_code':
                 return (
                    <>
                        <h2 className="text-xl text-slate-200 mb-2 text-center font-semibold">{t('verifyCode')}</h2>
                        <p className="text-slate-300 text-sm mb-6 text-center">{t('enterResetCode')}</p>
                        <form onSubmit={handleVerifyCode}>
                            <Input variant="transparent" type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('verificationCode')} required />
                            <Button type="submit" isLoading={isLoading} variant="login" className="w-full !py-3">{t('verifyCode')}</Button>
                        </form>
                    </>
                );
            case 'reset_password':
                 return (
                     <>
                        <h2 className="text-xl text-slate-200 mb-2 text-center font-semibold">{t('setNewPassword')}</h2>
                        <form onSubmit={handleResetPassword}>
                            <Input variant="transparent" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('newPassword')} required />
                            <Input variant="transparent" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t('confirmNewPassword')} required />
                            <Button type="submit" isLoading={isLoading} variant="login" className="w-full !py-3">{t('save')}</Button>
                        </form>
                    </>
                );
            case 'login':
            default:
                return (
                    <>
                        <h2 className="text-2xl text-slate-200 mb-6 text-center font-bold tracking-wider">{t('loginFormTitle')}</h2>
                        <form onSubmit={handleLogin}>
                            <Input variant="transparent" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t('username')} required autoComplete="username" />
                            <Input variant="transparent" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('password')} required autoComplete="current-password" />
                            <div className="flex items-center justify-between text-sm my-4">
                                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-500 bg-transparent text-emerald-400 focus:ring-emerald-400"/>
                                    {t('keepSignedIn')}
                                </label>
                                <button type="button" onClick={() => changeView('forgot_password')} className="text-slate-300 hover:underline bg-transparent border-none cursor-pointer">{t('forgotPassword')}</button>
                            </div>
                            <Button type="submit" isLoading={isLoading} variant="login" className="w-full !py-3">{t('loginBtn')}</Button>
                        </form>
                    </>
                );
        }
    };
    
    return (
        <div 
            className="flex min-h-screen items-center justify-center bg-cover bg-center p-4"
            style={{ backgroundImage: `url(${ASSETS.LOGIN_BG_CNK_OFFICE})` }}
        >
             <div className="absolute inset-0 bg-black/50"></div>
            <div className="w-full max-w-sm z-10">
                <div className="relative rounded-lg bg-slate-800/60 backdrop-blur-sm p-8 shadow-2xl pt-16">
                     <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                        <UserAvatar className="h-24 w-24 border-4 border-slate-600 shadow-lg"/>
                    </div>
                    {error && <p className="text-center text-sm text-red-400 mb-4 bg-red-500/10 p-2 rounded-md border border-red-500/20">{error}</p>}
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
