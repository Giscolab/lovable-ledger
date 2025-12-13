import * as pdfjsLib from 'pdfjs-dist';
import { Transaction } from './types';
import { categorizeTransaction } from './categorize';
import { localStore } from './localStore';
import { computeTransactionId } from './transactionId';
import { buildTransactionFingerprint, normalizeLabel, toMinorUnits } from './normalization';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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
  
  console.log(`[PDF Parser] Processing ${pdf.numPages} pages`);
  
  let allLines: ParsedLine[] = [];
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    const pageLines: ParsedLine[] = [];
    
    textContent.items.forEach((item: any) => {
      if (!item.str || item.str.trim() === '') return;
      
      const textItem = item as TextItem;
      const y = Math.round(textItem.transform[5]);
      const x = Math.round(textItem.transform[4]);
      
      let line = pageLines.find(l => Math.abs(l.y - y) < 5);
      if (!line) {
        line = { y, items: [] };
        pageLines.push(line);
      }
      line.items.push({ x, text: textItem.str.trim() });
    });
    
    pageLines.sort((a, b) => b.y - a.y);
    pageLines.forEach(line => {
      line.items.sort((a, b) => a.x - b.x);
    });
    
    allLines = [...allLines, ...pageLines];
  }
  
  console.log(`[PDF Parser] Found ${allLines.length} lines`);
  
  const transactions: Transaction[] = [];
  const rules = localStore.getRules();
  const now = new Date().toISOString();
  
  // Try to parse each line for transactions
  for (const line of allLines) {
    const fullText = line.items.map(i => i.text).join(' ');
    const transaction = parseTransactionLine(fullText, rules, now);
    
    if (transaction) {
      const isDuplicate = transactions.some(t => 
        t.id === transaction.id || 
        (t.date.getTime() === transaction.date.getTime() && 
         t.label === transaction.label && 
         t.amount === transaction.amount)
      );
      
      if (!isDuplicate) {
        transactions.push(transaction);
      }
    }
  }
  
  console.log(`[PDF Parser] Found ${transactions.length} transactions with primary parser`);
  
  // If no transactions found, try alternative parsing
  if (transactions.length === 0) {
    console.log('[PDF Parser] Trying alternative parsing...');
    const altTransactions = await parsePDFAlternative(file);
    if (altTransactions.length > 0) {
      return altTransactions;
    }
  }
  
  transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return transactions;
};

function parseTransactionLine(text: string, rules: any[], now: string): Transaction | null {
  // Enhanced date patterns for French bank statements
  const datePatterns = [
    /^(\d{2}[\/\.]\d{2}[\/\.]\d{4})/,
    /^(\d{2}[\/\.]\d{2}[\/\.]\d{2})(?!\d)/,
    /(\d{2}[\/\.]\d{2}[\/\.]\d{4})/,
    /(\d{2}[\/\.]\d{2}[\/\.]\d{2})(?!\d)/,
    /^(\d{2}\s\w+\s\d{4})/i, // 01 janvier 2024
  ];
  
  let dateStr: string | null = null;
  let dateMatchIndex = 0;
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      dateStr = match[1];
      dateMatchIndex = match.index || 0;
      break;
    }
  }
  
  if (!dateStr) return null;
  
  // Parse date
  let date: Date;
  const numericDateParts = dateStr.split(/[\/\.]/);
  
  if (numericDateParts.length === 3 && numericDateParts.every(p => /^\d+$/.test(p))) {
    let year = parseInt(numericDateParts[2]);
    if (year < 100) year += 2000;
    date = new Date(year, parseInt(numericDateParts[1]) - 1, parseInt(numericDateParts[0]));
  } else {
    // Try parsing text date
    date = new Date(dateStr);
  }
  
  if (isNaN(date.getTime())) return null;
  
  // Get text after date
  const restOfLine = text.slice(dateMatchIndex + dateStr.length).trim();
  
  // Enhanced amount patterns for French format
  const amountPatterns = [
    // With thousands separator (space or non-breaking space)
    /-?\d{1,3}(?:[\s\u00A0]\d{3})*[,\.]\d{2}/g,
    // Simple format with comma
    /-?\d+,\d{2}/g,
    // Simple format with dot
    /-?\d+\.\d{2}/g,
    // Euro symbol attached
    /-?\d{1,3}(?:[\s\u00A0]\d{3})*[,\.]\d{2}\s?€/g,
    /€\s?-?\d{1,3}(?:[\s\u00A0]\d{3})*[,\.]\d{2}/g,
  ];
  
  let amounts: string[] = [];
  for (const pattern of amountPatterns) {
    const matches = restOfLine.match(pattern);
    if (matches && matches.length > 0) {
      amounts = matches;
      break;
    }
  }
  
  if (amounts.length === 0) return null;
  
  // Parse and clean amounts
  const cleanAmount = (raw: string): number => {
    const cleaned = raw
      .replace(/[\s\u00A0]/g, '')
      .replace('€', '')
      .replace(',', '.');
    return parseFloat(cleaned);
  };
  
  const parsedAmounts = amounts
    .map(cleanAmount)
    .filter(a => !isNaN(a) && a !== 0);
  
  if (parsedAmounts.length === 0) return null;
  
  // Determine amount and direction
  let amount = 0;
  let isIncome = false;
  
  // Caisse d'Épargne format: DEBIT | CREDIT columns
  if (parsedAmounts.length >= 2) {
    const first = parsedAmounts[0];
    const second = parsedAmounts[1];
    
    // Usually debit is negative or in first column, credit in second
    if (Math.abs(first) > 0 && first < 0) {
      amount = Math.abs(first);
      isIncome = false;
    } else if (Math.abs(second) > 0) {
      amount = Math.abs(second);
      isIncome = second > 0;
    } else {
      amount = Math.abs(first);
      isIncome = first > 0;
    }
  } else {
    amount = Math.abs(parsedAmounts[0]);
    isIncome = parsedAmounts[0] > 0;
  }
  
  if (amount === 0 || amount > 1000000) return null; // Sanity check
  
  // Extract label
  let label = restOfLine;
  amounts.forEach(a => {
    label = label.replace(a, '');
  });
  label = label
    .replace(/€/g, '')
    .replace(/EUR/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Skip invalid labels
  if (label.length < 3) return null;
  
  // Skip headers and totals
  const skipPatterns = [
    /^(total|solde|report|ancien|nouveau|date|libelle|libellé)/i,
    /^(débit|debit|crédit|credit|valeur|montant)/i,
    /^(page|relevé|compte|iban|bic)/i,
    /^(banque|agence|caisse)/i,
  ];
  
  if (skipPatterns.some(p => p.test(label))) return null;
  
  const category = categorizeTransaction(label, rules);
  const id = computeTransactionId(date, label, amount, 'pdf');
  const normalizedLabel = normalizeLabel(label);
  const amountMinor = toMinorUnits(isIncome ? amount : -amount);
  const fingerprint = buildTransactionFingerprint({
    accountId: '',
    date,
    amountMinor,
    normalizedLabel,
    source: 'pdf',
  });

  return {
    id,
    accountId: '', // Will be set during import
    date,
    label,
    normalizedLabel,
    amount,
    amountMinor,
    category,
    isIncome,
    source: 'pdf',
    dedupeHash: fingerprint,
    rawFingerprint: fingerprint,
    rawSource: text,
    status: 'posted',
    currency: 'EUR',
    createdAt: now,
    tags: [],
  };
}

// Alternative parser with more relaxed matching
async function parsePDFAlternative(file: File): Promise<Transaction[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    const items: { y: number; x: number; text: string }[] = [];
    textContent.items.forEach((item: any) => {
      if (item.str && item.str.trim()) {
        items.push({
          y: Math.round(item.transform[5]),
          x: Math.round(item.transform[4]),
          text: item.str.trim()
        });
      }
    });
    
    const lineMap = new Map<number, { x: number; text: string }[]>();
    items.forEach(item => {
      const roundedY = Math.round(item.y / 5) * 5;
      if (!lineMap.has(roundedY)) {
        lineMap.set(roundedY, []);
      }
      lineMap.get(roundedY)!.push({ x: item.x, text: item.text });
    });
    
    Array.from(lineMap.entries())
      .sort((a, b) => b[0] - a[0])
      .forEach(([, lineItems]) => {
        lineItems.sort((a, b) => a.x - b.x);
        fullText += lineItems.map(i => i.text).join(' ') + '\n';
      });
  }
  
  const transactions: Transaction[] = [];
  const rules = localStore.getRules();
  const now = new Date().toISOString();
  const lines = fullText.split('\n');
  
  // Also try regex-based extraction on full text
  const transactionRegex = /(\d{2}[\/\.]\d{2}[\/\.]\d{2,4})\s+(.+?)\s+(-?\d[\d\s,]*[,\.]\d{2})\s*€?/g;
  
  let match;
  while ((match = transactionRegex.exec(fullText)) !== null) {
    const [, dateStr, label, amountStr] = match;
    
    const dateParts = dateStr.split(/[\/\.]/);
    if (dateParts.length !== 3) continue;
    
    let year = parseInt(dateParts[2]);
    if (year < 100) year += 2000;
    
    const date = new Date(year, parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
    if (isNaN(date.getTime())) continue;
    
    const amount = parseFloat(amountStr.replace(/\s/g, '').replace(',', '.'));
    if (isNaN(amount) || amount === 0) continue;
    
    const cleanLabel = label.trim();
    if (cleanLabel.length < 3) continue;
    
    const category = categorizeTransaction(cleanLabel, rules);
    const absAmount = Math.abs(amount);
    const normalizedLabel = normalizeLabel(cleanLabel);
    const amountMinor = toMinorUnits(amount);
    const id = computeTransactionId(date, cleanLabel, absAmount, 'pdf');

    const isDuplicate = transactions.some(t => t.id === id);
    if (!isDuplicate) {
      const fingerprint = buildTransactionFingerprint({
        accountId: '',
        date,
        amountMinor,
        normalizedLabel,
        source: 'pdf',
      });
      transactions.push({
        id,
        accountId: '', // Will be set during import
        date,
        label: cleanLabel,
        normalizedLabel,
        amount: absAmount,
        amountMinor,
        category,
        isIncome: amount > 0,
        source: 'pdf',
        dedupeHash: fingerprint,
        rawFingerprint: fingerprint,
        rawSource: match[0],
        status: 'posted',
        currency: 'EUR',
        createdAt: now,
        tags: [],
      });
    }
  }
  
  // Fallback: line-by-line parsing
  if (transactions.length === 0) {
    for (const line of lines) {
      const transaction = parseTransactionLine(line, rules, now);
      if (transaction) {
        const isDuplicate = transactions.some(t => t.id === transaction.id);
        if (!isDuplicate) {
          transactions.push(transaction);
        }
      }
    }
  }
  
  console.log(`[PDF Alt Parser] Found ${transactions.length} transactions`);
  
  return transactions;
}
