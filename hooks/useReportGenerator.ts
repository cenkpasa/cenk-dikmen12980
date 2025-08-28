import { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useErp } from '../contexts/ErpContext';
import { User, Invoice, Interview, Customer, Offer, ReportType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export interface ReportFilters {
    reportType: ReportType;
    dateRange: { start: string, end: string };
    userId?: string;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
    'Araç Kiralama': ['kiralama', 'araç'],
    'Kesici Takım': ['takım', 'freze', 'matkap', 'uç', 'kesici', 'klavuz', 'pafta', 'kalem', 'kater', 'pens', 'matkap'],
    'Teknik Hırdavat': ['hırdavat', 'vantilatör', 'civata', 'yay', 'kumpas', 'mengen', 'aparat', 'testere', 'pim'],
    'Hizmet': ['hizmet', 'danışmanlık', 'bedeli', 'izleme', 'kontrol', 'e-fatura', 'kontör'],
    'Akaryakıt': ['petrol', 'diesel', 'yakıt', 'kurşunsuz', 'benzin'],
    'Kargo & Lojistik': ['kargo', 'posta', 'nakliyat'],
    'İletişim': ['turkcell', 'telekom', 'ttnet'],
    'Gıda & Market': ['gıda', 'market', 'migros', 'yemek'],
};

const determineCategory = (description: string): string => {
    if (!description) return 'Diğer';
    const lowerDesc = description.toLowerCase();
    for (const category in CATEGORY_KEYWORDS) {
        if (CATEGORY_KEYWORDS[category].some(keyword => lowerDesc.includes(keyword))) {
            return category;
        }
    }
    return 'Diğer';
};

export const useReportGenerator = (filters: ReportFilters) => {
    const { interviews, customers, offers, appointments } = useData();
    const { invoices } = useErp();
    const { users } = useAuth();
    const { t } = useLanguage();

    const generatedData = useMemo(() => {
        if (!filters.dateRange.start || !filters.dateRange.end) {
            return { columns: [], data: [], summary: {}, title: 'Rapor' };
        }

        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        endDate.setHours(23, 59, 59, 999);

        switch (filters.reportType) {
            case 'sales_performance': {
                const filteredInvoices = invoices.filter(inv => {
                    const invDate = new Date(inv.date);
                    const userMatch = !filters.userId || inv.userId === filters.userId;
                    return invDate >= startDate && invDate <= endDate && userMatch;
                });

                const salesByUser = users.map(user => {
                    const userInvoices = filteredInvoices.filter(inv => inv.userId === user.id);
                    const totalSales = userInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
                    return {
                        userId: user.id,
                        userName: user.name,
                        invoiceCount: userInvoices.length,
                        totalSales: totalSales,
                    };
                }).filter(u => u.invoiceCount > 0);

                const totalRevenue = salesByUser.reduce((sum, u) => sum + u.totalSales, 0);

                return {
                    title: 'Personel Satış Performansı Raporu',
                    columns: [
                        { header: 'personnel', accessor: (row: any) => row.userName },
                        { header: 'invoiceCountReport', accessor: (row: any) => row.invoiceCount },
                        { header: 'totalSpending', accessor: (row: any) => row.totalSales.toLocaleString('tr-TR') },
                    ],
                    data: salesByUser.sort((a, b) => b.totalSales - a.totalSales),
                    summary: { 'Toplam Ciro': `${totalRevenue.toLocaleString('tr-TR')} TL` },
                    chartData: null
                };
            }
             case 'customer_invoice_analysis': {
                const filteredInvoices = invoices.filter(inv => {
                    const invDate = new Date(inv.date);
                    return invDate >= startDate && invDate <= endDate;
                });

                const analysisByCustomer: Record<string, { total: number, count: number, categories: Record<string, number>, customerName: string }> = {};

                for (const invoice of filteredInvoices) {
                    if (!analysisByCustomer[invoice.customerId]) {
                        const customer = customers.find(c => c.id === invoice.customerId);
                        analysisByCustomer[invoice.customerId] = {
                            total: 0,
                            count: 0,
                            categories: {},
                            customerName: customer?.name || 'Bilinmeyen Müşteri'
                        };
                    }

                    const entry = analysisByCustomer[invoice.customerId];
                    entry.total += invoice.totalAmount;
                    entry.count++;
                    
                    const category = determineCategory(invoice.description || '');
                    entry.categories[category] = (entry.categories[category] || 0) + invoice.totalAmount;
                }
                
                const reportData = Object.entries(analysisByCustomer).map(([customerId, data]) => {
                    const topCategory = Object.entries(data.categories).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';
                    return {
                        customerId,
                        customerName: data.customerName,
                        totalSpending: data.total,
                        invoiceCount: data.count,
                        avgInvoiceAmount: data.total / data.count,
                        topCategory
                    };
                });
                
                const totalCustomers = reportData.length;
                const totalRevenue = reportData.reduce((sum, d) => sum + d.totalSpending, 0);
                const avgSpendPerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
                
                const monthlySpending: Record<string, number> = {};
                const categorySpending: Record<string, number> = {};

                filteredInvoices.forEach(inv => {
                    const month = new Date(inv.date).toISOString().slice(0, 7);
                    monthlySpending[month] = (monthlySpending[month] || 0) + inv.totalAmount;

                    const category = determineCategory(inv.description || '');
                    categorySpending[category] = (categorySpending[category] || 0) + inv.totalAmount;
                });
                
                const sortedMonths = Object.keys(monthlySpending).sort();
                const categoryArray = Object.entries(categorySpending).map(([name, value]) => ({ name, value }));

                return {
                    title: t('customer_invoice_analysis'),
                    columns: [
                        { header: 'customer', accessor: (row: any) => row.customerName },
                        { header: 'totalSpending', accessor: (row: any) => row.totalSpending.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                        { header: 'invoiceCountReport', accessor: (row: any) => row.invoiceCount },
                        { header: 'avgInvoiceAmount', accessor: (row: any) => row.avgInvoiceAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                        { header: 'topCategory', accessor: (row: any) => row.topCategory },
                    ],
                    data: reportData.sort((a, b) => b.totalSpending - a.totalSpending),
                    summary: {
                        'Toplam Ciro': `${totalRevenue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}`,
                        'totalCustomersInReport': totalCustomers,
                        'avgSpendPerCustomer': `${avgSpendPerCustomer.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}`,
                    },
                    chartData: {
                        monthly: {
                            labels: sortedMonths,
                            data: sortedMonths.map(month => monthlySpending[month])
                        },
                        categories: categoryArray.sort((a, b) => b.value - a.value),
                        summary: {
                            totalCustomers,
                            avgSpendPerCustomer
                        }
                    }
                };
            }
            case 'ai_analysis_summary': {
                const reportData: any[] = [];
                customers.forEach(customer => {
                    if (customer.aiSentimentAnalysis) {
                        reportData.push({
                            customerName: customer.name,
                            analysisType: 'Duygu Analizi',
                            analysisDate: new Date(customer.aiSentimentAnalysis.timestamp).toLocaleString(),
                            analysisResult: customer.aiSentimentAnalysis.result.substring(0, 100)
                        });
                    }
                    if (customer.aiOpportunityAnalysis) {
                         reportData.push({
                            customerName: customer.name,
                            analysisType: 'Fırsat Analizi',
                            analysisDate: new Date(customer.aiOpportunityAnalysis.timestamp).toLocaleString(),
                            analysisResult: customer.aiOpportunityAnalysis.result.substring(0, 100)
                        });
                    }
                    if (customer.aiNextStepSuggestion) {
                        reportData.push({
                            customerName: customer.name,
                            analysisType: 'Sonraki Adım Önerisi',
                            analysisDate: new Date(customer.aiNextStepSuggestion.timestamp).toLocaleString(),
                            analysisResult: customer.aiNextStepSuggestion.result.substring(0, 100)
                        });
                    }
                });

                return {
                    title: 'Yapay Zeka Analiz Özeti',
                    columns: [
                        { header: 'customer', accessor: (row: any) => row.customerName },
                        { header: 'analysisType', accessor: (row: any) => row.analysisType },
                        { header: 'analysisDate', accessor: (row: any) => row.analysisDate },
                        { header: 'analysisResult', accessor: (row: any) => row.analysisResult },
                    ],
                    data: reportData,
                    summary: { 'totalAnalyses': reportData.length },
                    chartData: null
                };
            }
            case 'customer_segmentation': {
                const ninetyDaysAgo = new Date();
                ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const customerData = customers.map(customer => {
                    const customerInvoices = invoices.filter(inv => inv.customerId === customer.id);
                    const totalSpending = customerInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

                    const allInteractions = [
                        ...customerInvoices.map(i => new Date(i.date)),
                        ...offers.filter(o => o.customerId === customer.id).map(o => new Date(o.createdAt)),
                        ...interviews.filter(i => i.customerId === customer.id).map(i => new Date(i.createdAt)),
                        ...appointments.filter(a => a.customerId === customer.id).map(a => new Date(a.start)),
                    ];
                    
                    const lastInteractionDate = allInteractions.length > 0
                        ? new Date(Math.max.apply(null, allInteractions.map(d => d.getTime())))
                        : new Date(customer.createdAt);
                    
                    return { ...customer, totalSpending, lastInteractionDate };
                });
                
                const sortedBySpending = [...customerData].sort((a,b) => b.totalSpending - a.totalSpending);
                const top20percentIndex = Math.floor(sortedBySpending.length * 0.2);
                const highSpenderIds = new Set(sortedBySpending.slice(0, top20percentIndex).map(c => c.id));
                
                const reportData = customerData.map(c => {
                    let segment = 'activeCustomer';
                    if (highSpenderIds.has(c.id) && c.totalSpending > 0) {
                        segment = 'highSpender';
                    } else if (c.lastInteractionDate < ninetyDaysAgo) {
                        segment = 'lowInteraction';
                    } else if (c.totalSpending === 0 && new Date(c.createdAt) > thirtyDaysAgo) {
                        segment = 'newPotential';
                    }
                    
                    return {
                        customerName: c.name,
                        segment: t(segment),
                        totalSpending: c.totalSpending,
                        lastInteractionDate: c.lastInteractionDate.toLocaleDateString(),
                    }
                });

                return {
                    title: 'Müşteri Segmentasyon Raporu',
                    columns: [
                        { header: 'customer', accessor: (row: any) => row.customerName },
                        { header: 'segment', accessor: (row: any) => row.segment },
                        { header: 'totalSpending', accessor: (row: any) => row.totalSpending.toLocaleString('tr-TR') + ' TL' },
                        { header: 'lastInteractionDate', accessor: (row: any) => row.lastInteractionDate },
                    ],
                    data: reportData,
                    summary: {
                        [t('highSpender')]: reportData.filter(r => r.segment === t('highSpender')).length,
                        [t('lowInteraction')]: reportData.filter(r => r.segment === t('lowInteraction')).length,
                        [t('newPotential')]: reportData.filter(r => r.segment === t('newPotential')).length,
                    },
                    chartData: null
                };
            }
            case 'offer_success_analysis': {
                const thirtyDays = 30 * 24 * 60 * 60 * 1000;
                
                const reportData = offers.map(offer => {
                    const offerDate = new Date(offer.createdAt);
                    const successInvoice = invoices.find(inv => 
                        inv.customerId === offer.customerId &&
                        new Date(inv.date) > offerDate &&
                        (new Date(inv.date).getTime() - offerDate.getTime()) <= thirtyDays
                    );
                    
                    const conversionTime = successInvoice 
                        ? Math.ceil((new Date(successInvoice.date).getTime() - offerDate.getTime()) / (1000 * 60 * 60 * 24))
                        : null;
                        
                    return {
                        teklifNo: offer.teklifNo,
                        customerName: customers.find(c => c.id === offer.customerId)?.name || t('unknownCustomer'),
                        offerAmount: offer.genelToplam,
                        isSuccessful: !!successInvoice,
                        conversionTime: conversionTime
                    };
                });
                
                const successfulOffers = reportData.filter(r => r.isSuccessful);
                const successRate = offers.length > 0 ? (successfulOffers.length / offers.length) * 100 : 0;
                const avgConversionTime = successfulOffers.length > 0
                    ? successfulOffers.reduce((sum, r) => sum + (r.conversionTime || 0), 0) / successfulOffers.length
                    : 0;
                const avgSuccessfulAmount = successfulOffers.length > 0
                    ? successfulOffers.reduce((sum, r) => sum + r.offerAmount, 0) / successfulOffers.length
                    : 0;

                return {
                    title: 'Teklif Başarı Analizi',
                    columns: [
                        { header: 'teklifNo', accessor: (row: any) => row.teklifNo },
                        { header: 'customer', accessor: (row: any) => row.customerName },
                        { header: 'amount', accessor: (row: any) => row.offerAmount.toLocaleString('tr-TR') + ' TL' },
                        { header: 'successStatus', accessor: (row: any) => t(row.isSuccessful ? 'successful' : 'unsuccessful') },
                        { header: 'conversionTime', accessor: (row: any) => row.conversionTime !== null ? `${row.conversionTime} gün` : '-' },
                    ],
                    data: reportData,
                    summary: {
                        'offerSuccessRate': `${successRate.toFixed(1)}%`,
                        'avgConversionTime': `${avgConversionTime.toFixed(1)} gün`,
                        'avgSuccessfulOfferAmount': `${avgSuccessfulAmount.toLocaleString('tr-TR')} TL`,
                    },
                    chartData: null
                };
            }
            default:
                return { columns: [], data: [], summary: {}, title: 'Rapor', chartData: null };
        }

    }, [filters, invoices, users, interviews, customers, offers, appointments, t]);

    return generatedData;
};