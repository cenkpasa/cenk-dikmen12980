import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Offer, Customer, Reconciliation, Invoice } from '../types';
import { COMPANY_INFO } from '../constants';

export const getOfferHtml = (offer: Offer, customer: Customer | undefined, t: (key: string, replacements?: Record<string, string>) => string, logoBase64: string): string => {
    const accentColor = '#3b82f6'; // blue-500
    const textColor = '#1e293b'; // slate-800
    const mutedColor = '#475569'; // slate-600
    return `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; width: 210mm; min-height: 297mm; background: white; color: ${textColor}; padding: 15mm; box-sizing: border-box; display: flex; flex-direction: column; font-size: 10pt; line-height: 1.5;">
        
        <!-- Header -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 12mm;">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <img src="${logoBase64}" style="max-width: 80mm; max-height: 25mm;"/>
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right; font-size: 9pt; color: ${mutedColor};">
              <p style="margin: 0;">İvedik OSB Melih Gökçek Blv. No:15/1</p>
              <p style="margin: 0;">Yenimahalle / ANKARA</p>
              <p style="margin: 0;">satis@cnkkesicitakim.com.tr</p>
              <p style="margin: 0; font-weight: bold; color: ${accentColor};">www.cnkkesicitakim.com.tr</p>
            </td>
          </tr>
        </table>

        <!-- Title & Info -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 8mm; font-size: 10pt;">
            <tr>
                <td style="width: 55%; vertical-align: top; border: 1px solid #e2e8f0; padding: 5mm; border-radius: 8px;">
                    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 11pt;">${t('offerTo')}:</p>
                    <p style="margin: 0; font-weight: bold; color: ${accentColor};">${customer?.name ?? ''}</p>
                    <p style="margin: 0;">${offer.firma.yetkili}</p>
                    <p style="margin: 0;">${offer.firma.telefon}</p>
                    <p style="margin: 0;">${offer.firma.eposta}</p>
                </td>
                <td style="width: 45%; vertical-align: top; padding-left: 8mm; text-align: right;">
                    <h1 style="font-size: 22pt; font-weight: 800; margin: 0 0 4mm 0; color: ${accentColor};">FİYAT TEKLİFİ</h1>
                    <p style="margin: 0;"><strong>${t('offerNo')}:</strong> ${offer.teklifNo}</p>
                    <p style="margin: 0;"><strong>${t('offerDate')}:</strong> ${offer.firma.teklifTarihi}</p>
                    <p style="margin: 0;"><strong>${t('validity')}:</strong> 10 Gün</p>
                    <p style="margin: 0;"><strong>${t('vade')}:</strong> ${offer.firma.vade}</p>
                </td>
            </tr>
        </table>
        
        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 5mm;">
          <thead style="background-color: #f1f5f9; color: ${mutedColor}; text-align: left; font-weight: bold; text-transform: uppercase;">
            <tr>
              <th style="padding: 4mm 3mm; border-bottom: 2px solid ${accentColor};">#</th>
              <th style="padding: 4mm 3mm; border-bottom: 2px solid ${accentColor};">${t('description')}</th>
              <th style="padding: 4mm 3mm; border-bottom: 2px solid ${accentColor}; text-align: center;">${t('quantity')}</th>
              <th style="padding: 4mm 3mm; border-bottom: 2px solid ${accentColor}; text-align: center;">${t('unit')}</th>
              <th style="padding: 4mm 3mm; border-bottom: 2px solid ${accentColor}; text-align: right;">${t('unitPrice')}</th>
              <th style="padding: 4mm 3mm; border-bottom: 2px solid ${accentColor}; text-align: right;">${t('total')}</th>
            </tr>
          </thead>
          <tbody>
            ${offer.items.map((item, index) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 3mm; text-align: center;">${index + 1}</td>
                <td style="padding: 3mm;">${item.cins}</td>
                <td style="padding: 3mm; text-align: center;">${item.miktar}</td>
                <td style="padding: 3mm; text-align: center;">${item.birim}</td>
                <td style="padding: 3mm; text-align: right;">${item.fiyat.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                <td style="padding: 3mm; text-align: right;">${item.tutar.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Totals -->
        <table style="width: 100%; margin-left: auto; margin-top: 8mm; max-width: 45%;">
            <tr>
                <td style="text-align: right; padding: 2mm 3mm;">${t('subtotal')}</td>
                <td style="text-align: right; padding: 2mm 3mm; width: 100px;">${offer.toplam.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
            </tr>
            <tr>
                <td style="text-align: right; padding: 2mm 3mm;">${t('vat')} (20%)</td>
                <td style="text-align: right; padding: 2mm 3mm;">${offer.kdv.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
            </tr>
            <tr style="background-color: #f1f5f9; font-weight: bold; font-size: 11pt;">
                <td style="text-align: right; padding: 3mm; border-top: 2px solid ${accentColor};">${t('grandTotal')}</td>
                <td style="text-align: right; padding: 3mm; border-top: 2px solid ${accentColor};">${offer.genelToplam.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
            </tr>
        </table>
        
        <div style="flex-grow: 1;"></div> <!-- Spacer -->

        <!-- Footer -->
        <div style="font-size: 8pt; color: ${mutedColor}; border-top: 1px solid #e2e8f0; padding-top: 4mm;">
          <p style="margin: 0 0 4px 0;"><strong>${t('notes')}:</strong> ${offer.notlar}</p>
          <p style="margin: 0;">* Verilen fiyatlar fatura tarihindeki TCMB Döviz Satış Kurundan TL'ye çevrilecektir.</p>
          <p style="margin: 0;">* Yurt dışı siparişler ve özel takımlar için iade söz konusu değildir.</p>
          <p style="margin: 0;">Saygılarımızla, ${offer.teklifVeren.yetkili}</p>
        </div>
      </div>
    `;
};


export const downloadOfferAsPdf = async (offer: Offer, customer: Customer | undefined, t: (key: string, replacements?: Record<string, string>) => string, logoBase64: string): Promise<{success: boolean}> => {
    
    const offerContentHtml = getOfferHtml(offer, customer, t, logoBase64);

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.innerHTML = offerContentHtml;
    document.body.appendChild(container);

    try {
        const canvas = await html2canvas(container.firstChild as HTMLElement, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        let heightLeft = pdfHeight;
        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();

        while (heightLeft > 0) {
            position = -heightLeft;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();
        }

        pdf.save(`Teklif_${offer.teklifNo}.pdf`);
        return { success: true };
    } catch (error) {
        console.error('PDF generation error:', error);
        return { success: false };
    } finally {
        document.body.removeChild(container);
    }
};

const InfoRow = (label: string, value: string) => `
    <tr>
        <td style="padding: 2px 0; font-weight: normal; width: 100px;">${label}</td>
        <td style="padding: 2px 0; font-weight: normal; width: 10px;">:</td>
        <td style="padding: 2px 0; font-weight: normal;">${value || ''}</td>
    </tr>
`;

export const getReconciliationHtml = (reconciliation: Reconciliation, customer: Customer, invoices: Invoice[], t: (key: string) => string): string => {
    const today = new Date().toLocaleDateString('tr-TR');
    
    return `
    <div style="font-family: Arial, sans-serif; width: 210mm; min-height: 297mm; padding: 15mm; box-sizing: border-box; font-size: 11pt; color: #333; display: flex; flex-direction: column;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
                <td style="text-align: center; font-size: 16pt; font-weight: bold; padding-bottom: 20px;" colspan="2">Mutabakat Mektubu</td>
            </tr>
            <tr>
                 <td style="width: 50%;"></td>
                 <td style="text-align: right; font-size: 11pt;">Tarih : ${today}</td>
            </tr>
        </table>
        
        <p style="margin-top: 30px; margin-bottom: 10px;">Sayın ,</p>
        <p style="line-height: 1.5; margin: 0;">Dönemi Formlarına ilişkin fatura sayısı ve KDV hariç tutarlarına ait bilgiler aşağıda yer almaktadır.Mutabık olup olmadığınızı bildirmenizi rica ederiz.</p>
        <p style="margin-top: 10px; margin-bottom: 30px;">Saygılarımızla</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 10pt;">
            <tr>
                <td style="width: 50%; vertical-align: top; padding-right: 20px;">
                    <h3 style="font-size: 12pt; font-weight:bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">Gönderen</h3>
                    <table style="width: 100%;">
                        ${InfoRow('Vergi Dairesi', COMPANY_INFO.taxOffice)}
                        ${InfoRow('Vergi Numarası', COMPANY_INFO.taxNumber)}
                        ${InfoRow('Telefon', COMPANY_INFO.phone)}
                        ${InfoRow('Faks', COMPANY_INFO.fax)}
                        ${InfoRow('Yetkili', COMPANY_INFO.authorizedPerson)}
                        ${InfoRow('E-Posta', COMPANY_INFO.email)}
                    </table>
                </td>
                <td style="width: 50%; vertical-align: top; padding-left: 20px;">
                    <h3 style="font-size: 12pt; font-weight:bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">Cari Hesap Bilgileriniz</h3>
                     <table style="width: 100%;">
                        ${InfoRow('Vergi Dairesi', customer.taxOffice || '')}
                        ${InfoRow('Vergi Numarası', customer.taxNumber || '')}
                        ${InfoRow('Telefon', customer.phone1 || '')}
                        ${InfoRow('Faks', customer.fax || '')}
                        ${InfoRow('Yetkili', '')}
                        ${InfoRow('E-Posta', customer.email || '')}
                    </table>
                </td>
            </tr>
        </table>

        <table style="width: 100%; border-collapse: collapse; text-align: center; border: 1px solid #000; font-size: 10pt;">
            <thead style="background-color: #f2f2f2;">
                <tr>
                    <th style="border: 1px solid #000; padding: 8px; font-weight: bold;">Mutabakat</th>
                    <th style="border: 1px solid #000; padding: 8px; font-weight: bold;">Dönem</th>
                    <th style="border: 1px solid #000; padding: 8px; font-weight: bold;">Belge Sayısı</th>
                    <th style="border: 1px solid #000; padding: 8px; font-weight: bold;">Toplam Tutar</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border: 1px solid #000; padding: 8px;">${t(reconciliation.type)}</td>
                    <td style="border: 1px solid #000; padding: 8px;">${reconciliation.period}</td>
                    <td style="border: 1px solid #000; padding: 8px;">${invoices.length}</td>
                    <td style="border: 1px solid #000; padding: 8px;">${reconciliation.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                </tr>
            </tbody>
        </table>

        <h3 style="margin-top: 25px; font-size: 12pt; font-weight: bold;">Notlar</h3>
        <div style="border: 1px solid #ccc; min-height: 60px; padding: 5px; font-size: 10pt;">${reconciliation.notes || ''}</div>
        
        <div style="flex-grow: 1;"></div> <!-- Pushes content to bottom -->

        <table style="width: 100%; margin-top: 80px; text-align: center; font-size: 10pt;">
            <tr>
                <td style="width: 50%;">Kaşe / İmza</td>
                <td style="width: 50%;">Kaşe / İmza</td>
            </tr>
        </table>
        
        <div style="text-align: center; font-size: 9pt; color: #888; margin-top: 30px;">
            Bu mutabakat mektubu e-crm üzerinden oluşturulmuştur.
        </div>
    </div>
    `;
};

export const downloadReconciliationAsPdf = async (reconciliation: Reconciliation, customer: Customer, invoices: Invoice[], t: (key: string) => string): Promise<{success: boolean}> => {
    const htmlContent = getReconciliationHtml(reconciliation, customer, invoices, t);

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    try {
        const canvas = await html2canvas(container.firstChild as HTMLElement, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Mutabakat_${customer.name}_${reconciliation.period}.pdf`);
        return { success: true };
    } catch (error) {
        console.error('Reconciliation PDF generation error:', error);
        return { success: false };
    } finally {
        document.body.removeChild(container);
    }
};
