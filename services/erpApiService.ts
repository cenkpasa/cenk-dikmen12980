// This service simulates fetching data from a remote ERP system by parsing a local CSV.
import { Customer, Invoice, Offer } from '../types';
import { MOCK_ERP_OFFERS } from '../constants';

const CSV_DATA = `Fatura Türü;İptal;Cari Kodu;Ticari Unvanı;Yetkilisi;İlçesi;İli;Ülkesi;Fatura Seri;Fatura No;Fatura Tarihi;Fatura Saati;Vadesi;Vadesi; Genel Toplam ;Genel Toplam;Simge;Dvz.Kullan;İşlem;Açıklama;Grubu;Vergi Dairesi;Vergi No;Pazarlama Personeli;Miktar 1 Toplam;Miktar 2 Toplam
Alış Faturası;Hayır;CNKCK-1030847;SEYMEN İŞ SAĞLIĞI VE GÜVENLİĞİ DANIŞMANLIK SANAYİ VE TİCARET LİMİTED ŞİRKETİ;R E;YENİMAHALLE;ANKARA;TÜRKİYE;;SF02025000001949;7.08.2025;08:58;5.12.2025;08:58; ₺1.000,00 ;0;;Hayır;KPB;İŞ SAĞLIĞI HİZMETİ,İŞ GÜVENLİĞİ HİZMETİ;;YENİMAHALLE;4610455720;;2;2
Alış Faturası;Hayır;CR01332;EUROFER KESİCİ TAKIMLAR MAKİNA SANAYİ TİCARET LİMİTED ŞİRKETİ; ;YENİMAHALLE;ANKARA;TÜRKİYE;;EUR2025000009155;4.08.2025;13:46;2.12.2025;13:46; ₺3.288,00 ;0;;Hayır;KPB;CG35692,IAT206B-080;;İVEDİK;4641531636;;3;3
Alış Faturası;Hayır;CR00980;CUTRON KESİCİ TAKIMLAR END. VE TEK. HIR. MAK. İTH. İHR. SAN. TİC. LTD. ŞTİ.;METİN YALÇINDERE;YENİMAHALLE;ANKARA;TÜRKİYE;;CTR2025000002662;1.08.2025;10:56;29.11.2025;10:56; ₺13.566,24 ;0;;Hayır;KPB;Ø6,00 KARBÜR FREZE,Ø6,00 KARBÜR FREZE;;İVEDİK;2161201788;;20;20
Alıştan İadeler;Hayır;CR01332;EUROFER KESİCİ TAKIMLAR MAKİNA SANAYİ TİCARET LİMİTED ŞİRKETİ; ;YENİMAHALLE;ANKARA;TÜRKİYE;;CNK2025000000617;29.07.2025;12:33;27.09.2025;12:33; ₺12.144,00 ;256,14;€;Evet;KPB;SDMT120412;;İVEDİK;4641531636;;50;50
Alış Faturası;Hayır;5376;AK KESİCİ TAKIM HIRDAVAT SANAYİ TİCARET ANONİM ŞİRKETİ;AKIN İZDEŞ;YENİMAHALLE;ANKARA;TÜRKİYE;;AKH2025000000728;24.07.2025;14:18;21.11.2025;14:18; ₺2.169,60 ;0;;Hayır;KPB;2,50MM 14X50 Ø4 KARBÜR MATKAP;;ULUS;0111103590;;4;4
Alış Faturası;Hayır;CNK-CK001732025;BRKCAR TURİZM SANAYİ VE TİCARET;BURAK  ;ÇANKAYA;ANKARA;TÜRKİYE;;ANK2025000000743;24.07.2025;13:25;21.11.2025;13:25; ₺14.035,00 ;0;;Hayır;KPB;34KIZ308-11.07.2025-19.07.2025 Araç Kiralama Bedel,34KIZ308-Yakit Bedeli-Dosya:6909969 -;;MALTEPE;1871255590;;9;9
Alış Faturası;Hayır;CR01434;ERKAN MAKİNA METAL VE TEK.TİC.İTH.İHR.LTD.ŞTİ.; ;YENİMAHALLE;ANKARA;TÜRKİYE;;ERK2025000056498;24.07.2025;12:10;21.11.2025;12:10; ₺6.720,00 ;0;;Hayır;KPB;ESSENTİ SANAYİ TİPİ 30 240W AYAKLI VANTİLATÖR;;OSTİM;3610041091;;1;1
Alış Faturası;Hayır;CR01332;EUROFER KESİCİ TAKIMLAR MAKİNA SANAYİ TİCARET LİMİTED ŞİRKETİ; ;YENİMAHALLE;ANKARA;TÜRKİYE;;EUR2025000008676;24.07.2025;09:36;21.11.2025;09:36; ₺1.434,00 ;0;;Hayır;KPB;SP.0001774;;İVEDİK;4641531636;;1;1
Alış Faturası;Hayır;CR01454;ASLAN GRUP KESİCİ TAKIM TEKNİK HIRDAVAT LTD. ŞTİ.; ;YENİMAHALLE;ANKARA;TÜRKİYE;;ASL2025000002659;23.07.2025;21:15;20.11.2025;21:15; ₺7.333,62 ;0;;Hayır;KPB;M8X1,25-2.0D HELİCOİL YAY,M8X1,25 DÜZ HELİCOİL MAKİ,KARBÜR T FREZE,M3 DÜZ MAKİNA KLAVUZU PAS;;İVEDİK;0891305401;;108;108
Alış Faturası;Hayır;CR01332;EUROFER KESİCİ TAKIMLAR MAKİNA SANAYİ TİCARET LİMİTED ŞİRKETİ; ;YENİMAHALLE;ANKARA;TÜRKİYE;;EUR2025000008621;23.07.2025;11:03;20.11.2025;11:03; ₺4.204,80 ;0;;Hayır;KPB;SM11953,CG11815,RCP-12110;;İVEDİK;4641531636;;12;12
Alış Faturası;Hayır;CR01629;MURAT TEKNİK KESİCİ TAKIMLAR SANAYİ VE TİCARET ANONİM ŞİRKETİ;MURAT  AKSUNGUR;YENİMAHALLE;ANKARA;TÜRKİYE;;MRT2025000006934;21.07.2025;15:50;18.11.2025;15:50; ₺6.654,00 ;0;;Hayır;KPB;WELLCUT 3X9,WELLCUT  12,EVAR HSS DI,WELLCUT 3X6,MİATECH H. ,PROX-Y 5.8X,PROX-Y 10.2,PTG 8.2MM D,PTG ;;ivedik;6241470141;;10;10
Alıştan İadeler;Hayır;CR01332;EUROFER KESİCİ TAKIMLAR MAKİNA SANAYİ TİCARET LİMİTED ŞİRKETİ; ;YENİMAHALLE;ANKARA;TÜRKİYE;;CNK2025000000598;21.07.2025;10:15;19.09.2025;10:15; ₺12.144,00 ;258,66;€;Evet;KPB;SDMT120412;;İVEDİK;4641531636;;50;50
Alış Faturası;Hayır;CR00355;ÖZDİLEK PETROL ANONİM ŞİRKETİ;c ;Yenimahalle;ANKARA;TÜRKİYE;;OZD2025000003743;20.07.2025;03:00;17.11.2025;03:00; ₺10.556,89 ;0;;Hayır;KPB;FuelSave Diesel,V-Power Diesel;;OSTİM;6830027557;;199;199
Alış Faturası;Hayır;CNKCK-10307;Turkcell İletişim Hizmetleri A.Ş.; ;YENİMAHALLE;ANKARA;TÜRKİYE;;0012025143066121;20.07.2025;00:00;17.11.2025;00:00; ₺229,13 ;0;;Hayır;KPB;Tarife ve Paket Ücretleri,Diğer Ücretler,Düzeltmeler,Tahsilatına Aracılık Edil;;İVEDİK;8770013406;;4;4
Alış Faturası;Hayır;CNKCK-10307;Turkcell İletişim Hizmetleri A.Ş.; ;YENİMAHALLE;ANKARA;TÜRKİYE;;0012025143066120;20.07.2025;00:00;17.11.2025;00:00; ₺229,08 ;0;;Hayır;KPB;Tarife ve Paket Ücretleri,Diğer Ücretler,Düzeltmeler,Tahsilatına Aracılık Edil;;İVEDİK;8770013406;;4;4
Alış Faturası;Hayır;CNKCK-10307;Turkcell İletişim Hizmetleri A.Ş.; ;YENİMAHALLE;ANKARA;TÜRKİYE;;0012025143066119;20.07.2025;00:00;17.11.2025;00:00; ₺828,39 ;0;;Hayır;KPB;Tarife ve Paket Ücre,Kullanım Ücretleri,Diğer Ücretler,Düzeltmeler,Dijital Servis Ücret;;İVEDİK;8770013406;;5;5
Alış Faturası;Hayır;CR01046;Bert Oke Sert Maden Çeşit.San.Ve Tic.Ltd.Şti;ERTUĞRUL ÇAYIR;Eyüpsultan;İstanbul;TÜRKİYE;;BRT2025000000872;17.03.2023;11:36;15.07.2023;11:36; ₺19.750,56 ;541,45;$;Evet;KPB;SNMG190612,TCMT16T304,TCMT16T304,TNMG220404,TNMG220404,VBMT160404,CNMG120404;;BAYRAMPAŞA;1660460926;;220;220
Alış Faturası;Hayır;CR01054;ULUDAĞ KESİCİ TAKIM BİLEME METAL OTOMOTİV MAKİNA SANAYİ VE TİCARET LİMİTED ŞİRKETİ;MUZAFFER  ERDEM;Nilüfer;Bursa;TÜRKİYE;;UBL2024000001025;15.04.2024;17:24;13.08.2024;17:24; ₺4.266,58 ;112,22;€;Evet;KPB;POWERFULL PCX403055,POWERFULL P412065-W Ø12X30X65 Z4;;NİLÜFER;8880329217;;8;8
Alış Faturası;Hayır;CR01054;ULUDAĞ KESİCİ TAKIM BİLEME METAL OTOMOTİV MAKİNA SANAYİ VE TİCARET LİMİTED ŞİRKETİ;MUZAFFER  ERDEM;Nilüfer;Bursa;TÜRKİYE;;UBL2024000001024;15.04.2024;17:24;13.08.2024;17:24; ₺1.458,30 ;38,35;€;Evet;KPB;POWERFULL PCX403055;;NİLÜFER;8880329217;;5;5
Alış Faturası;Hayır;CR01332;EUROFER KESİCİ TAKIMLAR MAKİNA SANAYİ TİCARET LİMİTED ŞİRKETİ; ;YENİMAHALLE;ANKARA;TÜRKİYE;;EUR2024000004480;15.04.2024;16:51;13.08.2024;16:51; ₺4.212,00 ;110,8;€;Evet;KPB;06.100;;İVEDİK;4641531636;;26;26
Alış Faturası;Hayır;CR00003;ARTI MAKİNA ENDÜSTRİSİ SAN. TİC. LTD. ŞTİ.;MESUT BEY;Yenimahalle;Ankara;TÜRKİYE;;ARF2024000001374;15.04.2024;12:24;13.08.2024;12:24; ₺3.249,96 ;85,49;€;Evet;KPB;LT16ER16UNJ KC5025,16ER8RD;;OSTİM;0850055049;;8;8
Masraf Faturası;Hayır;CR00355;ÖZDİLEK PETROL ANONİM ŞİRKETİ;c ;Yenimahalle;ANKARA;TÜRKİYE;;OZD2024000001480;10.04.2024;03:00;8.08.2024;03:00; ₺17.588,59 ;0;;Hayır;KPB;V-Power Diesel,V-Power Kurşunsuz,Kurşunsuz 95;;OSTİM;6830027557;;399;398
Masraf Faturası;Hayır;CNKCK00113;YURTİÇİ KARGO SERVİSİ ANONİM ŞİRKETİ; ;YENİMAHALLE;ANKARA;TÜRKİYE;;YKA2024001646004;9.04.2024;12:08;7.08.2024;12:08; ₺303,12 ;0;;Hayır;KPB;Posta Hizmet Geliri,Alıcı Ödemeli Hizmet Geliri-BTK'ya Tabi;;İVEDİK;9860008925;;2;2
Alış Faturası;Hayır;CR01197;MAB KESİCİ TAKIM ENDÜSTRİYEL TEKNİK HIRDAVAT SANAYİ TİCARET LİMİTED ŞİRKETİ; ;YENİMAHALLE;ANKARA;TÜRKİYE;;MBE2024000000263;5.04.2024;16:05;3.08.2024;16:05; ₺8.397,90 ;220,9;€;Evet;KPB;SOMT140520-GM JN1005,HTK SO14 D63 A22 Z05-H,16 IR 24UN ISO JN1040 SM.UÇ;;İVEDİK;6091056926;;41;41
Alış Faturası;Hayır;CR01332;EUROFER KESİCİ TAKIMLAR MAKİNA SANAYİ TİCARET LİMİTED ŞİRKETİ; ;YENİMAHALLE;ANKARA;TÜRKİYE;;EUR2024000004392;5.04.2024;15:41;3.08.2024;15:41; ₺1.408,90 ;37,06;€;Evet;KPB;ART.1107,IZR333-315800;;İVEDİK;4641531636;;4;4
Alış Faturası;Hayır;CR01591;BENİCE HAVACILIK MÜHENDİSLİK SANAYİ VE TİCARET LİMİTED ŞİRKETİ;SEZGİN  KAYA;YENİMAHALLE;ANKARA;TÜRKİYE;;BNC2025200000064;8.02.2024;11:48;7.06.2024;11:48; ₺37.917,32 ;1.150,18;€;Evet;KPB;CNC MENGEN;;YENİMAHALLE;3780791878;;1;1
Alış Faturası;Hayır;CR01065;VATANSAV MÜHENDİSLİK SAN. VE TİC. LTD. ŞTİ.;MURAT  KÖSE;YENİMAHALLE;ANKARA;TÜRKİYE;;A0202500000001;2.01.2024;15:35;1.05.2024;15:35; ₺7.177,78 ;219,96;€;Evet;KPB;POWERFULL ;;OSTİM;9240776802;;5;5
`;

// Helper functions for parsing
const parseCurrency = (str: string): number => {
    if (!str) return 0;
    const num = parseFloat(str.replace('₺', '').replace(/\./g, '').replace(',', '.').trim());
    return isNaN(num) ? 0 : num;
};

const parseDate = (str: string): string => {
    if (!str || !str.includes('.')) return new Date().toISOString();
    const parts = str.split('.');
    if (parts.length !== 3) return new Date().toISOString();
    // Assuming d.m.y format
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

// FIX: Define a more specific type for parsed invoices to include the temporary linking key.
type ParsedInvoice = Omit<Invoice, 'customerId' | 'userId' | 'items'> & { customerCurrentCode: string, items: { stockId: string, quantity: number, price: number}[] };
// FIX: Define a type for parsed offers.
type ParsedOffer = Omit<Offer, 'id' | 'createdAt' | 'customerId'> & { customerCurrentCode: string };

type ParsedResult = {
    customers: Map<string, Omit<Customer, 'id' | 'createdAt'>>;
    invoices: ParsedInvoice[];
    offers: ParsedOffer[]; // Add offers to the result
};

let cachedData: ParsedResult | null = null;

const parseErpData = (csvText: string): ParsedResult => {
    if (cachedData) return cachedData;

    const lines = csvText.trim().split('\n').filter(line => line.trim() !== '');
    const headerLine = lines.shift()?.replace(/^\uFEFF/, ''); // Remove BOM character
    if (!headerLine) return { customers: new Map(), invoices: [], offers: [] };
    
    const headers = headerLine.split(';').map(h => h.trim());
    const col = (name: string) => headers.indexOf(name);
    
    // Smartly find the correct 'Genel Toplam' column index
    let totalAmountColIndex = -1;
    const generalTotalIndices = headers.map((h, i) => h === 'Genel Toplam' ? i : -1).filter(i => i !== -1);
    
    if (generalTotalIndices.length > 1 && lines.length > 0) {
        const firstDataRow = lines[0].split(';');
        for (const index of generalTotalIndices) {
            // Find the column that actually contains the currency symbol, indicating it's the correct total amount.
            if (firstDataRow[index] && (firstDataRow[index].includes('₺') || firstDataRow[index].includes('$') || firstDataRow[index].includes('€'))) {
                totalAmountColIndex = index;
                break;
            }
        }
    }
    // Fallback if the smart check fails or there's only one column with that name.
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


const SIMULATED_DELAY = 500; // ms

export const fetchErpCsvData = (): Promise<ParsedResult> => {
    console.log("Simulating ERP CSV data parsing...");
    return new Promise(resolve => {
        setTimeout(() => {
            cachedData = null; // Ensure fresh parse on each sync
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
