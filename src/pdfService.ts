import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Cautela } from './types';

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

export const generateTermoDoc = async (cautela: Cautela, type: 'Cautela' | 'Baixa') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header with Logo
  try {
    const img = await loadImage('/brasao.png');
    doc.addImage(img, 'PNG', pageWidth / 2 - 12, 10, 24, 24);
  } catch (e) {
    console.warn('Could not load logo', e);
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('MINISTÉRIO DA DEFESA', pageWidth / 2, 42, { align: 'center' });
  doc.text('COMANDO DA AERONÁUTICA', pageWidth / 2, 47, { align: 'center' });
  doc.text('ESCOLA DE ESPECIALISTAS DE AERONÁUTICA', pageWidth / 2, 52, { align: 'center' });
  doc.text('BANDA DE MÚSICA', pageWidth / 2, 57, { align: 'center' });

  doc.setFontSize(14);
  const title = type === 'Cautela'
    ? 'TERMO DE RESPONSABILIDADE E CAUTELA DE MATERIAL'
    : 'TERMO DE DEVOLUÇÃO E BAIXA DE MATERIAL';
  doc.text(title, pageWidth / 2, 73, { align: 'center' });

  // 1. IDENTIFICAÇÃO DO MILITAR
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. IDENTIFICAÇÃO DO MILITAR', 20, 90);
  doc.setFont('helvetica', 'normal');
  const rectHeight = type === 'Baixa' ? 35 : 25;
  doc.rect(20, 95, pageWidth - 40, rectHeight);
  doc.text(`Nome: ${cautela.militar_nome}`, 25, 102);
  doc.text(`SARAM: ${cautela.militar_saram}`, 120, 102);
  doc.text(`Posto/Graduação: ${cautela.militar_posto}`, 25, 112);


  if (type === 'Baixa') {
    doc.text(`Data da Cautela: ${format(new Date(cautela.data_cautela), 'dd/MM/yyyy')}`, 25, 122);
  }

  // 2. DESCRIÇÃO DO MATERIAL
  const section2Y = 95 + rectHeight + 8; // reduced gap
  doc.setFont('helvetica', 'bold');
  doc.text('2. DESCRIÇÃO DO MATERIAL', 20, section2Y);

  const tableData = cautela.itens.map((item, index) => [
    (index + 1).toString().padStart(2, '0'),
    item.nome,
    item.bmp,
    item.marca || '-',
    type === 'Cautela' ? item.estado_na_cautela : item.estado
  ]);

  autoTable(doc, {
    startY: section2Y + 5, // reduced gap
    head: [['Item', 'Descrição', 'BMP', 'Marca', type === 'Cautela' ? 'Estado (Retirada)' : 'Estado (Devolução)']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 9 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8; // reduced gap

  // 3. TERMO DE RESPONSABILIDADE / DECLARAÇÃO
  doc.setFont('helvetica', 'bold');
  doc.text(type === 'Cautela' ? '3. TERMO DE RESPONSABILIDADE' : '3. DECLARAÇÃO DE DEVOLUÇÃO', 20, finalY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const textCautela = `Declaro ter recebido os materiais acima discriminados, em perfeitas condições de uso e conservação, pelo que assumo total responsabilidade pela sua guarda e manutenção. Comprometo-me a zelar pela integridade do material, utilizando-o exclusivamente em missões oficiais da Banda de Música. Estou ciente de que qualquer dano, extravio ou negligência decorrente do uso indevido implicará na aplicação das sanções administrativas e disciplinares previstas no Regulamento Disciplinar da Aeronáutica (RDAER) e no ressarcimento ao erário, conforme legislação vigente.`;

  const textBaixa = `Declaro que os materiais acima discriminados foram devolvidos ao almoxarifado da Banda de Música nas condições descritas neste termo. O recebedor atesta a conferência dos itens, encerrando a responsabilidade do militar sobre a guarda dos mesmos a partir desta data. Eventuais danos não relatados anteriormente poderão ser objeto de apuração posterior.`;

  const responsibilityText = type === 'Cautela' ? textCautela : textBaixa;

  // Better text formatting with justification
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // jsPDF text with maxWidth and align justify can be tricky with the last line.
  doc.text(responsibilityText, 20, finalY + 5, {
    align: 'justify',
    maxWidth: pageWidth - 40,
    lineHeightFactor: 1.5
  });

  // Calculate dynamic Y position based on text height
  const textLines = doc.splitTextToSize(responsibilityText, pageWidth - 40);
  const textHeight = textLines.length * 6; // slightly tighter line height estimation

  let signatureY = finalY + textHeight + 6; // reduced gap

  // Check if we need a new page for signatures
  // A4 height is 297mm.
  // The threshold is tightened so it only breaks when truly near the bottom edge.
  if (signatureY + 40 > 285) {
    doc.addPage();
    signatureY = 15; // Reset Y for new page
  } else {
    // If it's very high up (e.g. only 1 item), we can push it down slightly to look better,
    // but the user wants it to NOT have huge gaps.
    // We will just let it be right after the text.
  }

  // Date and Signatures
  const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  doc.setFont('helvetica', 'bold');
  doc.text(`Local e Data: Guaratinguetá, ${dateStr}`, 20, signatureY);

  const militarNomeUpper = cautela.militar_nome.toUpperCase();

  // ----- ROW 1: Militar (Left) & Conferente (Right) -----
  const row1Y = signatureY + 18; // Line position (tightened)
  doc.setFontSize(9);

  // Signature 1: Militar (Left)
  doc.line(20, row1Y, 90, row1Y);
  if (cautela.assinatura_militar) {
    doc.addImage(cautela.assinatura_militar, 'PNG', 30, signatureY + 2, 50, 15);
  }
  doc.setFont('helvetica', 'bold');
  doc.text(type === 'Cautela' ? 'MILITAR RECEBEDOR' : 'MILITAR QUE DEVOLVEU', 55, row1Y + 3, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(militarNomeUpper, 55, row1Y + 7, { align: 'center' });

  // Signature 2: Conferente (Right)
  doc.setFont('helvetica', 'bold');
  doc.line(120, row1Y, 190, row1Y);
  if (cautela.assinatura_encarregado) {
    doc.addImage(cautela.assinatura_encarregado, 'PNG', 130, signatureY + 2, 50, 15);
  }
  doc.text('CONFERENTE', 155, row1Y + 3, { align: 'center' });

  // ----- ROW 2: Chefe da Banda de Música (Center, properly spaced below) -----
  // Placed right below the first two signatures.
  const row2Y = row1Y + 24; // 24 units below the first row of signatures (tightened)
  const centerX = pageWidth / 2;

  let commanderSignature = null;
  let commanderName = "CAP VALDECI";
  let conferenteName = "1S ARTHUR";

  try {
    const [sigRes, namesRes] = await Promise.all([
      fetch('/api/config/commander-signature'),
      fetch('/api/config/names')
    ]);

    if (sigRes.ok) {
      const data = await sigRes.json();
      commanderSignature = data.signature;
    }

    if (namesRes.ok) {
      const namesData = await namesRes.json();
      if (namesData.commander_name) commanderName = namesData.commander_name;
      if (namesData.conferente_name) conferenteName = namesData.conferente_name;
    }
  } catch (e) {
    console.warn('Could not fetch commander signature or names', e);
  }

  // Render conferente name
  doc.setFont('helvetica', 'normal');
  doc.text(conferenteName.toUpperCase(), 155, row1Y + 7, { align: 'center' });

  if (commanderSignature) {
    try {
      doc.addImage(commanderSignature, 'PNG', centerX - 25, row2Y - 14, 50, 15);
    } catch (e) {
      console.warn('Could not add commander signature image to PDF', e);
    }
  }

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.line(centerX - 35, row2Y, centerX + 35, row2Y);
  doc.text('CHEFE DA BANDA DE MÚSICA', centerX, row2Y + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(commanderName.toUpperCase(), centerX, row2Y + 8, { align: 'center' });

  return doc;
};

export const downloadTermoCautela = async (cautela: Cautela) => {
  const doc = await generateTermoDoc(cautela, 'Cautela');
  doc.save(`Termo_Cautela_${cautela.militar_saram}_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const previewTermoCautela = async (cautela: Cautela) => {
  const doc = await generateTermoDoc(cautela, 'Cautela');
  return doc.output('bloburl');
};

export const downloadTermoBaixa = async (cautela: Cautela) => {
  const doc = await generateTermoDoc(cautela, 'Baixa');
  doc.save(`Termo_Baixa_${cautela.militar_saram}_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const previewTermoBaixa = async (cautela: Cautela) => {
  const doc = await generateTermoDoc(cautela, 'Baixa');
  return doc.output('bloburl');
};
