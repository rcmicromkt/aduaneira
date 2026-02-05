import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCNPJ } from './utils';

export const generateInvoicePDF = (invoice: any, client: any, operation: any, items: any[], feesList: any[]) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Color Palette
    const primaryColor = [5, 150, 105]; // Emerald 600
    const secondaryColor = [16, 185, 129]; // Emerald 500
    const textColor = [17, 24, 39]; // Gray 900
    const lightTextColor = [107, 114, 128]; // Gray 500

    // Helper for currency formatting
    const formatCurrency = (val: string | number, currency: string = "BRL") => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency,
        }).format(num);
    };

    // Header / Header Table background
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('DEMONSTRATIVO DE TAXAS', 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestão Desembaraço Aduaneiro', 15, 28);

    // Invoice Info (Right side of header)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`Fatura: ${invoice.invoiceNumber}`, pageWidth - 15, 20, { align: 'right' });
    doc.text(`Data: ${format(new Date(invoice.createdAt), 'dd/MM/yyyy')}`, pageWidth - 15, 26, { align: 'right' });
    doc.text(`Ref: ${operation?.referenceNumber || 'N/A'}`, pageWidth - 15, 32, { align: 'right' });

    // SHIPMENT DETAILS (Shipper, Consignee, etc.)
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    let leftY = 50;
    doc.setFont('helvetica', 'bold');
    doc.text('Shipper:', 15, leftY);
    doc.setFont('helvetica', 'normal');
    doc.text(client?.shipper || 'N/A', 30, leftY);

    leftY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Consignee:', 15, leftY);
    doc.setFont('helvetica', 'normal');
    doc.text(client?.consignee || 'N/A', 35, leftY);

    leftY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('CNPJ:', 15, leftY);
    doc.setFont('helvetica', 'normal');
    doc.text(client?.cnpj ? formatCNPJ(client.cnpj) : 'N/A', 28, leftY);

    leftY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Notify:', 15, leftY);
    doc.setFont('helvetica', 'normal');
    doc.text(client?.notify || 'Same as cnee', 28, leftY);

    leftY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('BL:', 15, leftY);
    doc.setFont('helvetica', 'normal');
    doc.text(client?.bl || 'N/A', 22, leftY);

    // Right side shipment details
    let rightY = 62;
    doc.setFont('helvetica', 'bold');
    doc.text('Porto:', pageWidth / 2, rightY);
    doc.setFont('helvetica', 'normal');
    const portInfo = [client?.portOrigin, client?.portDestination].filter(Boolean).join(' / ');
    doc.text(portInfo || 'N/A', pageWidth / 2 + 12, rightY);

    rightY += 6;
    doc.setFont('helvetica', 'normal');
    const weightInfo = client?.weight ? `(peso: ${client.weight} // m3: N/A)` : '(peso: N/A // m3: N/A)';
    doc.text(weightInfo, pageWidth / 2, rightY);

    // Labels for Column (Right side)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Fatura: ${invoice.invoiceNumber}`, pageWidth - 15, 50, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Data: ${format(new Date(invoice.createdAt), 'dd/MM/yyyy')}`, pageWidth - 15, 56, { align: 'right' });
    doc.text(`Ref: ${operation?.referenceNumber || 'N/A'}`, pageWidth - 15, 62, { align: 'right' });

    // Fees Table
    const dollarValue = parseFloat(invoice.dollarValue) || 1;
    const tableData = items.map((item: any) => {
        const feeName = feesList.find(f => f.id === item.feeId)?.name || 'Taxa';
        const originalVal = item.currency === "USD" ? `US$ ${parseFloat(item.value).toFixed(2)}` : `R$ ${parseFloat(item.value).toFixed(2)}`;
        const exchangeRate = item.currency === "USD" ? dollarValue.toFixed(4) : "1,0000";
        const valInBRL = item.currency === "USD" ? parseFloat(item.value) * dollarValue : parseFloat(item.value);

        return [
            feeName,
            originalVal,
            exchangeRate,
            formatCurrency(valInBRL, 'BRL')
        ];
    });

    autoTable(doc, {
        startY: 85,
        head: [['TAXAS', 'VALOR ORIGINAL', 'TAXA', 'VALOR EM REAIS']],
        body: tableData,
        theme: 'plain',
        headStyles: {
            textColor: primaryColor as [number, number, number],
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        columnStyles: {
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' }
        }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 10;

    // Totals Section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.text('Valor total', pageWidth - 85, currentY);
    doc.text(formatCurrency(invoice.totalAmount), pageWidth - 15, currentY, { align: 'right' });

    if (invoice.iofAmount && parseFloat(invoice.iofAmount) > 0) {
        currentY += 6;
        doc.setFont('helvetica', 'italic');
        doc.text('IOF 3,5 – (frete + locais Brasil)', pageWidth - 85, currentY);
        doc.text(formatCurrency(invoice.iofAmount), pageWidth - 15, currentY, { align: 'right' });
    }

    currentY += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Totalidade', pageWidth - 85, currentY);
    doc.text(formatCurrency(invoice.finalAmount), pageWidth - 15, currentY, { align: 'right' });

    // Bank Details
    currentY += 15;
    doc.setFontSize(10);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('DADOS BANCÁRIOS PARA PAGAMENTO:', 15, currentY);

    doc.setFont('helvetica', 'normal');
    currentY += 6;
    doc.text('BANCO INTER', 15, currentY);
    currentY += 6;
    doc.text('AG: 0001 / CC: 36215776-6', 15, currentY);
    currentY += 6;
    doc.text('PIX: CNPJ: 39.344.589/0001-80', 15, currentY);

    currentY += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Enviar comprovante para baixa e desbloqueio da carga no terminal Bandeirantes.', 15, currentY);

    // Footer / Notes
    if (invoice.notes) {
        currentY += 10;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Obs.: ${invoice.notes}`, 15, currentY, { maxWidth: pageWidth - 30 });
    }

    // Save the PDF
    doc.save(`${invoice.invoiceNumber}_Demonstrativo.pdf`);
};
