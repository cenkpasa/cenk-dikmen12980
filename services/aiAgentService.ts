import { db } from './dbService';
import { Offer, Interview, Customer, EmailDraft, AISettings } from '../types';
import { type NewNotificationData } from '../contexts/NotificationCenterContext';
import { generateFollowUpEmail } from './aiService';
import { v4 as uuidv4 } from 'uuid';

export type Insight = NewNotificationData;

const findFollowUpOpportunitiesAndAct = async (settings: AISettings): Promise<Insight[]> => {
    if (!settings.enableFollowUpDrafts) return [];

    const insights: Insight[] = [];
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() - settings.followUpDays);

    const offersToFollowUp = await db.offers.where('createdAt').below(followUpDate.toISOString()).toArray();

    for (const offer of offersToFollowUp) {
        const existingDraft = await db.emailDrafts.where('relatedObjectId').equals(offer.id).first();
        if (existingDraft) continue;
        
        const hasFollowUpInterview = await db.interviews.where('customerId').equals(offer.customerId).and(i => new Date(i.createdAt) > new Date(offer.createdAt)).first();
        if (hasFollowUpInterview) continue;
        
        const customer = await db.customers.get(offer.customerId);
        if (!customer || !customer.email) continue;

        const emailResult = await generateFollowUpEmail(offer, customer);
        
        if (emailResult.success) {
            const newDraft: EmailDraft = {
                id: uuidv4(),
                createdAt: new Date().toISOString(),
                recipientEmail: customer.email,
                recipientName: customer.name,
                subject: `${offer.teklifNo} Numaralı Teklifimiz Hakkında`,
                body: emailResult.text,
                status: 'draft',
                relatedObjectType: 'offer',
                relatedObjectId: offer.id,
                generatedBy: 'ai_agent'
            };
            await db.emailDrafts.add(newDraft);

            insights.push({
                messageKey: 'aiInsightFollowUpWithDraft',
                replacements: {
                    teklifNo: offer.teklifNo,
                    customerName: customer.name
                },
                type: 'offer',
                link: { page: 'email-taslaklari', id: newDraft.id }
            });
        }
    }
    return insights;
};

const findAtRiskCustomers = async (settings: AISettings): Promise<Insight[]> => {
    if (!settings.enableAtRiskAlerts) return [];

    const insights: Insight[] = [];
    const atRiskDate = new Date();
    atRiskDate.setDate(atRiskDate.getDate() - settings.atRiskDays);
    
    const activeCustomers = await db.customers.where('status').equals('active').toArray();

    for (const customer of activeCustomers) {
        const [lastOffer, lastInterview, lastAppointment] = await Promise.all([
             db.offers.where('customerId').equals(customer.id).last(),
             db.interviews.where('customerId').equals(customer.id).last(),
             db.appointments.where('customerId').equals(customer.id).last()
        ]);

        const lastContactDate = [
            lastOffer?.createdAt,
            lastInterview?.createdAt,
            lastAppointment?.createdAt
        ].filter(Boolean).map(d => new Date(d!)).sort((a, b) => b.getTime() - a.getTime())[0];

        if (!lastContactDate || lastContactDate < atRiskDate) {
            insights.push({
                messageKey: 'aiInsightAtRiskCustomer',
                replacements: { customerName: customer.name, days: String(settings.atRiskDays) },
                type: 'customer',
                link: { page: 'customers', id: customer.id }
            });
        }
    }
    return insights;
};

export const runAIAgent = async (settings: AISettings | null): Promise<Insight[]> => {
    if (!settings || !settings.isAgentActive) {
        console.log("🤖 Proaktif AI Ajanı pasif durumda.");
        return [];
    }
    
    console.log("🤖 Proaktif AI Ajanı ÖZEL ayarlarla analizleri başlatıyor...");
    
    const [
        followUpActions,
        atRiskCustomers
    ] = await Promise.all([
        findFollowUpOpportunitiesAndAct(settings),
        findAtRiskCustomers(settings)
    ]);

    const allInsights = [...followUpActions, ...atRiskCustomers];
    console.log(`🤖 Analiz tamamlandı. ${allInsights.length} adet EYLEM/İÇGÖRÜ üretildi.`);
    return allInsights;
};
