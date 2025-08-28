import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { useNotification } from './NotificationContext';
import { db } from '../services/dbService';
import { api } from '../services/apiService';
import { v4 as uuidv4 } from 'uuid';

interface AuthContextType {
    currentUser: User | null;
    login: (username: string, password: string, keepSignedIn: boolean) => Promise<{ success: boolean; messageKey: string }>;
    register: (username: string, password: string) => Promise<{ success: boolean; messageKey: string }>;
    logout: () => void;
    loading: boolean;
    users: User[];
    updateUser: (user: User) => Promise<{ success: boolean, messageKey: string }>;
    addUser: (user: Omit<User, 'id'>) => Promise<{ success: boolean, messageKey: string }>;
    deleteUser: (userId: string) => Promise<void>;
    changePassword: (userId: string, oldPass: string, newPass: string) => Promise<{ success: boolean, messageKey: string }>;
    resetPassword: (email: string, newPass: string, code: string) => Promise<{ success: boolean, messageKey: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

const storage = (keepSignedIn: boolean): Storage => {
    return keepSignedIn ? localStorage : sessionStorage;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();

    useEffect(() => {
        const initialize = async () => {
            setLoading(true);
            const allUsers = await db.users.toArray();
            setUsers(allUsers);

            try {
                const sessionUserJson = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
                if (sessionUserJson) {
                    const sessionUser = JSON.parse(sessionUserJson);
                    const fullUser = allUsers.find(u => u.id === sessionUser.id);
                    setCurrentUser(fullUser || null);
                }
            } catch (error) {
                console.error("Failed to parse user from storage", error);
                sessionStorage.removeItem('currentUser');
                localStorage.removeItem('currentUser');
            }
            
            setLoading(false);
        };

        initialize();
    }, []);

    const refreshUsers = async () => {
        const allUsers = await db.users.toArray();
        setUsers(allUsers);
        return allUsers;
    };

    const login = async (username: string, password: string, keepSignedIn: boolean): Promise<{ success: boolean; messageKey: string }> => {
        const { success, messageKey } = await api.login(username, password);
        if (!success) {
            return { success, messageKey };
        }

        const user = await db.users.where('username').equalsIgnoreCase(username).first();
        if (!user) return { success: false, messageKey: 'userNotFound' };
        
        const { password: _, ...userToStore } = user;
        const storageToUse = storage(keepSignedIn);
        // Clear the other storage to prevent conflicts
        if (keepSignedIn) {
            sessionStorage.removeItem('currentUser');
        } else {
            localStorage.removeItem('currentUser');
        }
        storageToUse.setItem('currentUser', JSON.stringify(userToStore));
        setCurrentUser(user);
        return { success: true, messageKey: 'loggedInWelcome' };
    };

    const register = async (username: string, password: string): Promise<{ success: boolean; messageKey: string }> => {
        const existingUser = await db.users.where('username').equalsIgnoreCase(username).first();
        if (existingUser) {
            return { success: false, messageKey: 'usernameExists' };
        }

        const newUser: User = { 
            id: uuidv4(), 
            username, 
            password: password, 
            role: 'user', 
            name: username 
        };
        await db.users.add(newUser);
        await refreshUsers();
        return { success: true, messageKey: 'registrationSuccess' };
    };

    const logout = () => {
        sessionStorage.removeItem('currentUser');
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
        showNotification('loggedOut', 'info');
    };

    const updateUser = async (userToUpdate: User): Promise<{ success: boolean, messageKey: string }> => {
        try {
            const existingUser = await db.users.get(userToUpdate.id);
            if (!existingUser) {
                return { success: false, messageKey: 'userNotFound' };
            }

            const finalUser = { ...userToUpdate };
            if (!finalUser.password || finalUser.password.length === 0) {
                finalUser.password = existingUser.password;
            }

            await db.users.put(finalUser);
            const updatedUsers = await refreshUsers();

            if (currentUser?.id === finalUser.id) {
                const fullUser = updatedUsers.find(u => u.id === finalUser.id);
                if (fullUser) {
                    const { password: _, ...userToStore } = fullUser;
                    if (localStorage.getItem('currentUser')) {
                        localStorage.setItem('currentUser', JSON.stringify(userToStore));
                    } else {
                        sessionStorage.setItem('currentUser', JSON.stringify(userToStore));
                    }
                    setCurrentUser(fullUser);
                }
            }
            return { success: true, messageKey: 'userUpdatedSuccess' };
        } catch (error) {
            return { success: false, messageKey: 'genericError' };
        }
    };

    const addUser = async (userToAdd: Omit<User, 'id'>): Promise<{ success: boolean, messageKey: string }> => {
        if (!userToAdd.password) {
            return { success: false, messageKey: 'passwordRequired' };
        }
        const existingUser = await db.users.where('username').equalsIgnoreCase(userToAdd.username).first();
        if(existingUser) {
            return { success: false, messageKey: 'usernameExists' };
        }
        
         const newUser: User = { 
             ...userToAdd,
             id: uuidv4(),
         };
         await db.users.add(newUser);
         await refreshUsers();
         return { success: true, messageKey: 'userAddedSuccess' };
    };
    
    const deleteUser = async (userId: string) => {
        if (currentUser?.id === userId) {
            showNotification('cannotDeleteSelf', 'error');
            return;
        }
        await db.users.delete(userId);
        await refreshUsers();
        showNotification('userDeleted', 'success');
    };
    
    const changePassword = async (userId: string, oldPass: string, newPass: string): Promise<{success: boolean, messageKey: string}> => {
        const user = await db.users.get(userId);
        if (!user || !user.password) return { success: false, messageKey: 'userNotFound' };

        if (user.password !== oldPass) {
            return { success: false, messageKey: 'wrongOldPassword' };
        }
        
        await db.users.update(userId, { password: newPass });
        await refreshUsers();
        return { success: true, messageKey: 'passwordChanged' };
    };

    const resetPassword = async (email: string, newPass: string, code: string): Promise<{success: boolean, messageKey: string}> => {
        // In a real app, the backend would re-verify the code here before changing the password.
        // We simulate this check was already done in the LoginPage via apiService.
        console.log(`Resetting password for ${email} with verification code ${code}.`);
        
        const user = await db.users.where('username').equalsIgnoreCase(email).first();
        if (!user || !user.id) {
            return { success: false, messageKey: 'userNotFound' };
        }

        await db.users.update(user.id, { password: newPass });
        await refreshUsers();
        return { success: true, messageKey: 'resetPasswordSuccess' };
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, register, logout, loading, users, updateUser, addUser, deleteUser, changePassword, resetPassword }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
