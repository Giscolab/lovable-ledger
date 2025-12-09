import * as pdfjsLib from 'pdfjs-dist';
import { Transaction } from './types';
import { categorizeTransaction } from './categorize';
import { localStore } from './localStore';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

interface ParsedLine {
  y: number;
  items: { x: number; text: string }[];
}

export const parsePDF = async (file: File): Promise<Transaction[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const transactions: Transaction[] = [];
  const rules = localStore.getRules();
  
  // Process each page
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Group text items by Y position (same line)
    const lines: ParsedLine[] = [];
    
    textContent.items.forEach((item: any) => {
      if (!item.str || item.str.trim() === '') return;
      
      const textItem = item as TextItem;
      const y = Math.round(textItem.transform[5]); // Y position
      const x = Math.round(textItem.transform[4]); // X position
      
      let line = lines.find(l => Math.abs(l.y - y) < 5);
      if (!line) {
        line = { y, items: [] };
        lines.push(line);
      }
      line.items.push({ x, text: textItem.str.trim() });
    });
    
    // Sort lines by Y (descending = top to bottom in PDF)
    lines.sort((a, b) => b.y - a.y);
    
    // Sort items within each line by X
    lines.forEach(line => {
      line.items.sort((a, b) => a.x - b.x);
    });
    
    // Parse Caisse d'Épargne format
    // Typical format: DATE | LIBELLÉ | DÉBIT | CRÉDIT
    for (const line of lines) {
      const fullText = line.items.map(i => i.text).join(' ');
      
      // Look for date pattern at start (DD/MM/YYYY or DD/MM/YY or DD.MM.YYYY)
      const dateMatch = fullText.match(/^(\d{2}[\/\.]\d{2}[\/\.]\d{2,4})/);
      if (!dateMatch) continue;
      
      const dateStr = dateMatch[1];
      const restOfLine = fullText.slice(dateMatch[0].length).trim();
      
      // Parse date
      const dateParts = dateStr.split(/[\/\.]/);
      if (dateParts.length !== 3) continue;
      
      let year = parseInt(dateParts[2]);
      if (year < 100) year += 2000; // Handle 2-digit year
      
      const date = new Date(year, parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
      if (isNaN(date.getTime())) continue;
      
      // Extract amounts (look for patterns like -123,45 or 123,45)
      const amountPattern = /-?\d+[\s\u00A0]?\d*[,\.]\d{2}/g;
      const amounts = restOfLine.match(amountPattern) || [];
      
      if (amounts.length === 0) continue;
      
      // Parse amounts
      const parsedAmounts = amounts.map(a => {
        const cleaned = a.replace(/[\s\u00A0]/g, '').replace(',', '.');
        return parseFloat(cleaned);
      });
      
      // Determine the transaction amount
      // Caisse d'Épargne typically has DEBIT (negative) and CREDIT (positive) columns
      let amount = 0;
      let isIncome = false;
      
      if (parsedAmounts.length >= 2) {
        // If we have two amounts, one is debit, one is credit
        // Usually debit is first (negative), credit is second (positive)
        const debit = parsedAmounts[0];
        const credit = parsedAmounts[1];
        
        if (debit !== 0 && !isNaN(debit)) {
          amount = Math.abs(debit);
          isIncome = debit > 0;
        } else if (credit !== 0 && !isNaN(credit)) {
          amount = Math.abs(credit);
          isIncome = credit > 0;
        }
      } else if (parsedAmounts.length === 1) {
        amount = Math.abs(parsedAmounts[0]);
        isIncome = parsedAmounts[0] > 0;
      }
      
      if (amount === 0) continue;
      
      // Extract label (everything between date and first amount)
      let label = restOfLine;
      amounts.forEach(a => {
        label = label.replace(a, '');
      });
      label = label.replace(/\s+/g, ' ').trim();
      
      // Skip if label is too short or looks like a header/total
      if (label.length < 3) continue;
      if (/^(total|solde|report|ancien)/i.test(label)) continue;
      
      const category = categorizeTransaction(label, rules);
      const id = `${date.getTime()}-${label.slice(0, 10)}-${amount}`.replace(/\s/g, '');
      
      // Check for duplicates
      const isDuplicate = transactions.some(t => 
        t.id === id || 
        (t.date.getTime() === date.getTime() && t.label === label && t.amount === amount)
      );
      
      if (!isDuplicate) {
        transactions.push({
          id,
          date,
          label,
          amount,
          category,
          isIncome,
        });
      }
    }
  }
  
  // Sort by date
  transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return transactions;
};

// Alternative parser for different PDF layouts
export const parsePDFGeneric = async (file: File): Promise<Transaction[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  const transactions: Transaction[] = [];
  const rules = localStore.getRules();
  
  // Generic pattern: look for dates followed by text and amounts
  const lines = fullText.split('\n');
  
  for (const line of lines) {
    // Match pattern: DD/MM/YYYY ... amount
    const match = line.match(/(\d{2}[\/\.]\d{2}[\/\.]\d{2,4})\s+(.+?)\s+(-?\d+[\s]?\d*[,\.]\d{2})/);
    if (!match) continue;
    
    const [, dateStr, label, amountStr] = match;
    
    // Parse date
    const dateParts = dateStr.split(/[\/\.]/);
    if (dateParts.length !== 3) continue;
    
    let year = parseInt(dateParts[2]);
    if (year < 100) year += 2000;
    
    const date = new Date(year, parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
    if (isNaN(date.getTime())) continue;
    
    // Parse amount
    const cleanAmount = amountStr.replace(/[\s\u00A0]/g, '').replace(',', '.');
    const amount = parseFloat(cleanAmount);
    if (isNaN(amount) || amount === 0) continue;
    
    const isIncome = amount > 0;
    const category = categorizeTransaction(label.trim(), rules);
    const id = `${date.getTime()}-${label.slice(0, 10)}-${Math.abs(amount)}`.replace(/\s/g, '');
    
    transactions.push({
      id,
      date,
      label: label.trim(),
      amount: Math.abs(amount),
      category,
      isIncome,
    });
  }
  
  return transactions;
};
