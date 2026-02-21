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
    const img = await loadImage('https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Coat_of_arms_of_Brazil.svg/150px-Coat_of_arms_of_Brazil.svg.png');
    doc.addImage(img, 'PNG', pageWidth / 2 - 12, 10, 24, 24);
  } catch (e) {
    console.warn('Could not load logo', e);
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('MINISTÉRIO DA DEFESA', pageWidth / 2, 42, { align: 'center' });
  doc.text('COMANDO DA AERONÁUTICA', pageWidth / 2, 47, { align: 'center' });
  doc.text('BANDA DE MÚSICA', pageWidth / 2, 52, { align: 'center' });
  
  doc.setFontSize(14);
  const title = type === 'Cautela' 
    ? 'TERMO DE RESPONSABILIDADE E CAUTELA DE MATERIAL' 
    : 'TERMO DE DEVOLUÇÃO E BAIXA DE MATERIAL';
  doc.text(title, pageWidth / 2, 68, { align: 'center' });
  
  // 1. IDENTIFICAÇÃO DO MILITAR
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. IDENTIFICAÇÃO DO MILITAR', 20, 85);
  doc.setFont('helvetica', 'normal');
  doc.rect(20, 90, pageWidth - 40, 25);
  doc.text(`Nome: ${cautela.militar_nome}`, 25, 97);
  doc.text(`SARAM: ${cautela.militar_saram}`, 120, 97);
  doc.text(`Posto/Graduação: ${cautela.militar_posto}`, 25, 107);
  doc.text(`Tipo de Cautela: ${cautela.tipo}`, 120, 107);
  
  if (type === 'Baixa') {
     doc.text(`Data da Cautela: ${format(new Date(cautela.data_cautela), 'dd/MM/yyyy')}`, 25, 117);
  }

  // 2. DESCRIÇÃO DO MATERIAL
  doc.setFont('helvetica', 'bold');
  doc.text('2. DESCRIÇÃO DO MATERIAL', 20, 130);
  
  const tableData = cautela.itens.map((item, index) => [
    (index + 1).toString().padStart(2, '0'),
    item.nome,
    item.bmp,
    item.marca || '-',
    type === 'Cautela' ? item.estado_na_cautela : item.estado
  ]);

  autoTable(doc, {
    startY: 140,
    head: [['Item', 'Descrição', 'BMP', 'Marca', type === 'Cautela' ? 'Estado (Retirada)' : 'Estado (Devolução)']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 9 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;

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
  // We'll use a slightly more robust way to render the paragraph.
  doc.text(responsibilityText, 20, finalY + 7, { 
    align: 'justify', 
    maxWidth: pageWidth - 40,
    lineHeightFactor: 1.5
  });

  // Calculate dynamic Y position based on text height
  // Approximate height: (number of characters / chars per line) * line height
  const textLines = doc.splitTextToSize(responsibilityText, pageWidth - 40);
  const textHeight = textLines.length * 7; // 7 is approx height with 1.5 line factor
  
  const signatureY = finalY + textHeight + 25;

  // Date and Signatures
  const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  doc.setFont('helvetica', 'bold');
  doc.text(`Local e Data: Guaratinguetá, ${dateStr}`, 20, signatureY);

  const militarNomeUpper = cautela.militar_nome.toUpperCase();

  doc.setFontSize(10);
  doc.line(20, signatureY + 35, 90, signatureY + 35);
  if (cautela.assinatura_militar) {
    doc.addImage(cautela.assinatura_militar, 'PNG', 30, signatureY + 5, 50, 25);
  }
  doc.text(type === 'Cautela' ? 'MILITAR RECEBEDOR' : 'MILITAR QUE DEVOLVEU', 55, signatureY + 40, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(militarNomeUpper, 55, signatureY + 45, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.line(120, signatureY + 35, 190, signatureY + 35);
  if (cautela.assinatura_encarregado) {
    doc.addImage(cautela.assinatura_encarregado, 'PNG', 130, signatureY + 5, 50, 25);
  }
  doc.text('ENCARREGADO DO MATERIAL', 155, signatureY + 40, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Banda de Música', 155, signatureY + 45, { align: 'center' });

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
