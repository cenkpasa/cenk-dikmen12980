import { Offer, Customer } from '../types';
import { api } from './apiService';

const callAI = async (prompt: string): Promise<{ success: boolean; text: string }> => {
    try {
        // This now calls our secure, simulated backend instead of Google GenAI directly
        const responseText = await api.generateText(prompt);
        return { success: true, text: responseText };
    } catch (error) {
        console.error("Error calling AI service:", error);
        const message = error instanceof Error ? error.message : "An unexpected error occurred while calling the AI service.";
        return { success: false, text: message };
    }
};

export const parseBusinessCard = async (base64Image: string): Promise<{ success: boolean; data?: any; text: string }> => {
     try {
        // This is a complex call, we'll simulate a successful response
        const responseData = await api.parseCard(base64Image);
        return { success: true, data: responseData, text: "Card parsed successfully." };
    } catch (error) {
        console.error("Error parsing business card:", error);
        const message = error instanceof Error ? error.message : "An unexpected error occurred while parsing the card.";
        return { success: false, text: message };
    }
};

export const summarizeText = (textToSummarize: string) => 
    callAI(`Aşağıdaki görüşme notlarını profesyonel bir dille, anahtar noktaları vurgulayarak özetle:\n\n---\n${textToSummarize}\n---\n\nÖzet:`);

export const enhanceDescription = (description: string) => 
    callAI(`Aşağıdaki ürün açıklamasını daha çekici ve profesyonel hale getirmek için metin önerileri sun:\n\n"${description}"`);

export const enhanceEmailBody = (emailBody: string) => 
    callAI(`Aşağıdaki e-posta metnini daha profesyonel, akıcı ve dilbilgisi açısından doğru hale getir. Metnin ana anlamını ve amacını koru:\n\n---\n${emailBody}\n---\n\nİyileştirilmiş Metin:`);

export const analyzeSentiment = (notes: string) => 
    callAI(`Aşağıdaki müşteri notlarındaki genel hissiyatı analiz et (örneğin, Olumlu, Olumsuz, Nötr) ve kısa bir gerekçe sun:\n\n---\n${notes}\n---`);

export const suggestNextStep = (customer: Customer) => {
    const prompt = `Sen, CNK Kesici Takım firmasında çalışan proaktif bir müşteri ilişkileri uzmanısın. Aşağıdaki müşteri için en mantıklı ve etkili bir sonraki adımı belirle. Müşterinin notlarındaki son etkileşimleri, şikayetleri veya taleplerini analiz ederek kişiselleştirilmiş ve spesifik bir eylem öner. Önerin "telefonla ara", "e-posta gönder", "ziyaret planla" gibi net bir eylem içermeli ve amacını belirtmeli (örneğin, "X projesindeki gecikme hakkında bilgi almak ve çözüm sunmak için ara", "Yeni Z serisi matkap uçları hakkında bir demo ayarlamak için e-posta gönder").\n\nMüşteri: ${customer.name}\nNotlar: ${customer.notes}\n\nÖnerilen Eylem:`;
    return callAI(prompt);
};

export const analyzeOpportunities = (customer: Customer) => {
    const prompt = `Sen, kesici takımlar (CNC, freze, matkap vb.) satan CNK firması için çalışan deneyimli bir satış stratejistisin. Aşağıdaki müşteri bilgilerini ve notlarını analiz et. Müşterinin ticari unvanını, potansiyel sektörünü (örn: makine imalatı, havacılık) ve notlardaki ipuçlarını (örn: "yeni makine aldılar", "üretim kapasitesini artırıyorlar") dikkate alarak firmamızın ürünleriyle ilgili somut, eyleme geçirilebilir satış fırsatları öner. Önerilerin çapraz satış (cross-sell), üst satış (up-sell) veya yeni ürün tanıtımı gibi spesifik olmalı. Önerilerini 2-3 madde halinde sun.\n\nMüşteri: ${customer.name}\nTicari Unvan: ${customer.commercialTitle}\nNotlar: ${customer.notes}\n\nSatış Fırsatları:`;
    return callAI(prompt);
};

export const generateFollowUpEmail = async (offer: Offer, customer: Customer | undefined): Promise<{ success: boolean; text: string }> => {
    const offerDetails = offer.items.map(item => `- ${item.miktar} ${item.birim} ${item.cins}`).join('\n');
    const prompt = `Bir CRM sistemi için yapay zeka asistanıyım. Aşağıdaki bilgilere göre, müşteriye gönderilecek profesyonel bir takip e-postası taslağı oluştur. E-posta sadece metin olarak oluşturulsun, imza veya "Konu:" başlığı ekleme.\n\nMüşteri: ${customer?.name}, Yetkili: ${offer.firma.yetkili}\nTeklif No: ${offer.teklifNo}, Toplam: ${offer.genelToplam} TL\nÜrünler: ${offerDetails}`;
    return callAI(prompt);
};

export const analyzeSalesPerformance = (userName: string, target: number, sales: number, daysLeft: number) => {
    const prompt = `Kullanıcı ${userName} için bu aylık satış performansını analiz et ve hedefe ulaşması için stratejiler öner. Mevcut Durum: Aylık Satış Hedefi: ${target.toLocaleString('tr-TR')} TL, Bu Ay Yapılan Satış: ${sales.toLocaleString('tr-TR')} TL, Kalan Gün: ${daysLeft}. Öneriler (3-4 madde halinde, kısa ve net):`;
    return callAI(prompt);
};

// AI Hub Specific Functions
export const generateMarketingEmail = (topic: string) => 
    callAI(`Bir satış ve pazarlama uzmanı olarak, "${topic}" konusuyla ilgili potansiyel müşterilere gönderilecek, dikkat çekici ve profesyonel bir pazarlama e-postası metni yaz.`);

export const analyzeCustomerInteractionForHub = (customerNotes: string) => 
    callAI(`Bir CRM uzmanı olarak, aşağıdaki müşteri notlarını analiz et. Müşterinin hissiyatını (pozitif, negatif, nötr), potansiyel satış fırsatlarını ve bir sonraki adım için önerilerini madde madde belirt.\n\nNotlar:\n${customerNotes}`);

export const createMarketReport = (topic: string) => 
    callAI(`Bir pazar araştırması uzmanı olarak, "${topic}" konusu hakkında kısa, öz ve bilgilendirici bir pazar araştırması raporu oluştur. Rapor, ana trendleri, fırsatları ve potansiyel zorlukları içermelidir.`);

export const getFinancialSummary = (financialData: string) => 
    callAI(`Bir finans uzmanı olarak, aşağıdaki finansal verileri analiz et, anahtar metrikleri özetle ve gelecek döneme yönelik basit bir tahmin yap.\n\nVeriler:\n${financialData}`);

export const answerTechnicalQuestion = (question: string) => 
    callAI(`Bir yazılım uzmanı olarak, aşağıdaki teknik soruyu anlaşılır ve doğru bir şekilde cevapla:\n\nSoru: ${question}`);

export const executeAgentTask = (task: string) => 
    callAI(`Bir proaktif yapay zeka ajanı olarak, aşağıdaki görevi anla ve tamamlamak için gereken adımları ve çıktıyı oluştur. Çıktı, görevin doğasına uygun olmalı (e-posta taslağı, yapılacaklar listesi, rapor vb.).\n\nGörev: ${task}`);

// Reconciliation specific functions
export const generateReconciliationEmail = (customer: Customer, type: string, period: string, amount: number) => {
    const prompt = `Bir CRM sistemi için yapay zeka asistanıyım. Aşağıdaki bilgilere göre, müşteriye gönderilecek profesyonel bir mutabakat e-postası taslağı oluştur. E-posta sadece metin olarak oluşturulsun, imza veya "Konu:" başlığı ekleme.\n\nMüşteri: ${customer.name}\nMutabakat Tipi: ${type}\nDönem: ${period}\nTutar: ${amount.toLocaleString('tr-TR')} TL`;
    return callAI(prompt);
};

export const analyzeDisagreement = (response: string) => {
    const prompt = `Bir müşteri mutabakatı reddetti ve şu açıklamayı yaptı: "${response}". Bu açıklamayı analiz et ve sorunun olası nedenlerini (örneğin, eksik fatura, tarih uyuşmazlığı, farklı kayıtlar) ve çözüm için atılması gereken adımları özetle.`;
    return callAI(prompt);
};
