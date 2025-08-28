// This service simulates fetching data from a remote ERP system by parsing a local CSV.
import { Customer, Invoice, Offer, IncomingInvoice, OutgoingInvoice } from '../types';
import { MOCK_ERP_OFFERS, MOCK_OUTGOING_INVOICES, MOCK_INCOMING_INVOICES } from '../constants';
import { v4 as uuidv4 } from 'uuid';


const SIMULATED_DELAY = 500; // ms

export const fetchIncomingInvoices = (): Promise<IncomingInvoice[]> => {
    console.log("Simulating ERP fetch for INCOMING invoices...");
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(MOCK_INCOMING_INVOICES.map(inv => ({...inv, id: uuidv4()})));
        }, SIMULATED_DELAY);
    });
};

export const fetchOutgoingInvoices = (): Promise<OutgoingInvoice[]> => {
    console.log("Simulating ERP fetch for OUTGOING invoices...");
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(MOCK_OUTGOING_INVOICES.map(inv => ({...inv, id: uuidv4()})));
        }, SIMULATED_DELAY);
    });
};


// --- The rest of the file is kept for compatibility with other ERP sync features ---

const CSV_DATA = `Fatura Türü;İptal;Cari Kodu;Ticari Unvanı;Yetkilisi;İlçesi;İli;Ülkesi;Fatura Seri;Fatura No;Fatura Tarihi;Fatura Saati;Vadesi;Vadesi; Genel Toplam ;Genel Toplam;Simge;Dvz.Kullan;İşlem;Açıklama;Grubu;Vergi Dairesi;Vergi No;Pazarlama Personeli;Miktar 1 Toplam;Miktar 2 Toplam
Alış Faturası;Hayır;CNKCK-1030847;SEYMEN İŞ SAĞLIĞI VE GÜVENLİĞİ DANIŞMANLIK SANAYİ VE TİCARET LİMİTED ŞİRKETİ;R E;YENİMAHALLE;ANKARA;TÜRKİYE;;SF02025000001949;7.08.2025;08:58;5.12.2025;08:58; ₺1.000,00 ;0;;Hayır;KPB;İŞ SAĞLIĞI HİZMETİ,İŞ GÜVENLİĞİ HİZMETİ;;YENİMAHALLE;4610455720;;2;2
Alış Faturası;Hayır;CR01332;EUROFER KESİCİ TAKIMLAR MAKİNA SANAYİ TİCARET LİMİTED ŞİRKETİ; ;YENİMAHALLE;ANKARA;TÜRKİYE;;EUR2025000009155;4.08.2025;13:46;2.12.2025;13:46; ₺3.288,00 ;0;;Hayır;KPB;CG35692,IAT206B-080;;İVEDİK;4641531636;;3;3
Alış Faturası;Hayır;CR00980;CUTRON KESİCİ TAKIMLAR END. VE TEK. HIR. MAK. İTH. İHR. SAN. TİC. LTD. ŞTİ.;METİN YALÇINDERE;YENİMAHALLE;ANKARA;TÜRKİYE;;CTR2025000002662;1.08.2025;10:56;29.11.2025;10:56; ₺13.566,24 ;0;;Hayır;KPB;Ø6,00 KARBÜR FREZE,Ø6,00 KARBÜR FREZE;;İVEDİK;2161201788;;20;20
Alıştan İadeler;Hayır;CR01332;EUROFER KESİCİ TAKIMLAR MAKİNA SANAYİ TİCARET LİMİTED ŞİRKETİ; ;YENİMAHALLE;ANKARA;TÜRKİYE;;CNK2025000000617;29.07.2025;12:33;27.09.2025;12:33; ₺12.144,00 ;256,14;€;Evet;KPB;SDMT120412;;İVEDİK;4641531636;;50;50
Alış Faturası;Hayır;5376;AK KESİCİ TAKIM HIRDAVAT SANAYİ TİCARET ANONİM ŞİRKETİ;AKIN İZDEŞ;YENİMAHALLE;ANKARA;TÜRKİYE;;AKH2025000000728;24.07.2025;14:18;21.11.2025;14:18; ₺2.169,60 ;0;;Hayır;KPB;2,50MM 14X50 Ø4 KARBÜR MATKAP;;ULUS;0111103590;;4;4
`;

const parseCurrency = (str: string): number => {
    if (!str) return 0;
    const num = parseFloat(str.replace('₺', '').replace(/\./g, '').replace(',', '.').trim());
    return isNaN(num) ? 0 : num;
};

const parseDate = (str: string): string => {
    if (!str || !str.includes('.')) return new Date().toISOString();
    const parts = str.split('.');
    if (parts.length !== 3) return new Date().toISOString();
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return new Date().toISOString();
    return new Date(year, month, day).toISOString();
};

const parseNumber = (str: string): number => {
    if (!str) return 0;
    const num = parseInt(str.trim(), 10);
    return isNaN(num) ? 0 : num;
};

type ParsedInvoice = Omit<Invoice, 'customerId' | 'userId' | 'items'> & { customerCurrentCode: string, items: { stockId: string, quantity: number, price: number}[] };
type ParsedOffer = Omit<Offer, 'id' | 'createdAt' | 'customerId'> & { customerCurrentCode: string };

type ParsedResult = {
    customers: Map<string, Omit<Customer, 'id' | 'createdAt'>>;
    invoices: ParsedInvoice[];
    offers: ParsedOffer[];
};

let cachedData: ParsedResult | null = null;

const parseErpData = (csvText: string): ParsedResult => {
    if (cachedData) return cachedData;

    const lines = csvText.trim().split('\n').filter(line => line.trim() !== '');
    const headerLine = lines.shift()?.replace(/^\uFEFF/, '');
    if (!headerLine) return { customers: new Map(), invoices: [], offers: [] };
    
    const headers = headerLine.split(';').map(h => h.trim());
    const col = (name: string) => headers.indexOf(name);
    
    let totalAmountColIndex = -1;
    const generalTotalIndices = headers.map((h, i) => h === 'Genel Toplam' ? i : -1).filter(i => i !== -1);
    
    if (generalTotalIndices.length > 1 && lines.length > 0) {
        const firstDataRow = lines[0].split(';');
        for (const index of generalTotalIndices) {
            if (firstDataRow[index] && (firstDataRow[index].includes('₺') || firstDataRow[index].includes('$') || firstDataRow[index].includes('€'))) {
                totalAmountColIndex = index;
                break;
            }
        }
    }
    if (totalAmountColIndex === -1) {
        totalAmountColIndex = col('Genel Toplam');
    }

    const customers = new Map<string, Omit<Customer, 'id' | 'createdAt'>>();
    const invoices: ParsedInvoice[] = [];

    for (const line of lines) {
        const values = line.split(';');
        if (values.length < headers.length) continue;
        if (values[col('Fatura Türü')] !== 'Alış Faturası' || values[col('İptal')] === 'Evet') continue;
        const currentCode = values[col('Cari Kodu')]?.trim();
        if (!currentCode) continue;

        if (!customers.has(currentCode)) {
             customers.set(currentCode, {
                currentCode: currentCode,
                name: values[col('Ticari Unvanı')]?.trim(),
                commercialTitle: values[col('Ticari Unvanı')]?.trim(),
                city: values[col('İli')]?.trim(),
                district: values[col('İlçesi')]?.trim(),
                country: values[col('Ülkesi')]?.trim(),
                taxOffice: values[col('Vergi Dairesi')]?.trim(),
                taxNumber: values[col('Vergi No')]?.trim(),
                status: 'active',
            });
        }
        
        const totalAmount = parseCurrency(values[totalAmountColIndex]);
        const quantity = parseNumber(values[col('Miktar 1 Toplam')]);

        invoices.push({
            id: values[col('Fatura No')]?.trim(),
            customerCurrentCode: currentCode,
            date: parseDate(values[col('Fatura Tarihi')]?.trim()),
            totalAmount: totalAmount,
            description: values[col('Açıklama')]?.trim(),
            items: [{
                stockId: 'CSV_ITEM',
                quantity: quantity || 1,
                price: quantity > 0 ? totalAmount / quantity : totalAmount
            }],
        });
    }
    
    const offers: ParsedOffer[] = MOCK_ERP_OFFERS.map(offer => ({
        ...offer,
        toplam: offer.items.reduce((acc, item) => acc + item.tutar, 0),
        kdv: offer.items.reduce((acc, item) => acc + item.tutar, 0) * 0.20,
        genelToplam: offer.items.reduce((acc, item) => acc + item.tutar, 0) * 1.20,
    }));


    cachedData = { customers, invoices, offers };
    return cachedData;
};

export const fetchErpCsvData = (): Promise<ParsedResult> => {
    console.log("Simulating ERP CSV data parsing for Customers/Offers...");
    return new Promise(resolve => {
        setTimeout(() => {
            cachedData = null; 
            const data = parseErpData(CSV_DATA);
            resolve(data);
        }, SIMULATED_DELAY);
    });
};

export const getInvoicesForReconciliation = async (customerCurrentCode: string, period: string): Promise<Invoice[]> => {
    const { invoices: allInvoices } = parseErpData(CSV_DATA);
    const [year, month] = period.split('-').map(Number);

    return allInvoices
        .filter(inv => {
            const invDate = new Date(inv.date);
            return (
                inv.customerCurrentCode === customerCurrentCode &&
                invDate.getFullYear() === year &&
                invDate.getMonth() === month - 1
            );
        })
        .map(({ customerCurrentCode, ...rest }) => ({
             ...rest,
             customerId: '', // This will be filled by the calling context
             userId: '' // This will be filled by the calling context
        }));
};