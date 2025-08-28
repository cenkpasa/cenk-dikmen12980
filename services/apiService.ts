// src/services/apiService.ts
// IMPORTANT: This file simulates communication with a backend server.
// In a real application, this would make fetch/axios requests to a real API.

import { db } from './dbService';

export const api = {
  /**
   * Authenticates a user against the local database (simulating an API call).
   */
  async login(username: string, password: string): Promise<{ success: boolean; messageKey: string }> {
    console.log(`Simulating API login for user: ${username}`);
    // In a real app, this would be a POST request to '/api/login'.
    // Here, we check against our local Dexie DB.
    const user = await db.users.where('username').equalsIgnoreCase(username).first();
    if (!user) {
        return { success: false, messageKey: 'userNotFound' };
    }
    // This check is simplified. A real backend would use bcrypt.compare().
    if (user.password !== password) {
        return { success: false, messageKey: 'invalidPassword' };
    }
    return { success: true, messageKey: 'loggedInWelcome' };
  },

  /**
   * Simulates a user registration API call.
   */
  async register(username: string, password: string): Promise<{ success: boolean; messageKey: string }> {
    // In a real app, this would be a POST request to '/api/register'.
    console.log(`Simulating API registration for: ${username}`);
    // The actual user creation is handled in AuthContext, which calls this.
    // This is just a placeholder for the API layer.
    return { success: true, messageKey: 'registrationSuccess' };
  },

  /**
   * Securely sends a text generation request via the simulated backend.
   */
  async generateText(prompt: string): Promise<string> {
    // In a real app, this would be a POST request to '/api/generate-text'.
    // The backend would then use its secret API key to call the Gemini API.
    console.log(`Simulating Gemini API call with prompt: "${prompt.substring(0, 50)}..."`);
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    return `"${prompt.substring(0, 30)}..." istemi için sunucudan gelen yapay zeka cevabı.`;
  },
  
   /**
   * Simulates parsing a business card via the backend.
   */
  async parseCard(base64Image: string): Promise<any> {
    console.log('Simulating business card parsing via API.');
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Return mock data
    return {
        name: 'Simüle Edilmiş İsim',
        company: 'Simülasyon A.Ş.',
        title: 'Yazılım Geliştirici',
        email: 'test@simulasyon.com',
        phone: '0312 555 1234',
        mobile: '0555 987 6543',
        address: 'Simülasyon Vadisi, Teknokent, Ankara',
        website: 'www.simulasyon.com'
    };
  },
  
  async sendPasswordResetCode(email: string): Promise<{ success: boolean; messageKey: string }> {
    console.log(`Simulating sending password reset code to: ${email}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const user = await db.users.where('username').equalsIgnoreCase(email).first();
    if (!user) {
        // To prevent user enumeration, a real API might always return success.
        // For this simulation, returning failure is clearer for development.
        return { success: false, messageKey: 'userNotFound' };
    }
    // In a real app, the backend would generate a code, store it with an expiry, and send an email.
    console.log(`Simulated code for ${email} is 123456`);
    return { success: true, messageKey: 'resetCodeSent' };
  },

  async verifyPasswordResetCode(email: string, code: string): Promise<{ success: boolean; messageKey: string }> {
    console.log(`Simulating verifying code ${code} for email ${email}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Simple simulation: the correct code is '123456'
    if (code === '123456') {
        return { success: true, messageKey: 'codeVerified' };
    }
    return { success: false, messageKey: 'invalidCode' };
  }
};
