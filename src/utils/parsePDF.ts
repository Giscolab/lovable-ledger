import * as pdfjsLib from 'pdfjs-dist';
import { Transaction } from './types';
import { categorizeTransaction } from './categorize';
import { localStore } from './localStore';
import { computeTransactionId } from './transactionId';
import { buildTransactionFingerprint, normalizeLabel, parseEuroToCents } from './normalization';

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

/**
 * Detects if the PDF uses separate Debit/Credit columns based on X positions
 * Returns column boundaries for debit and credit if detected
 */
const detectDebitCreditColumns = (lines: ParsedLine[]): { debitMinX: number; debitMaxX: number; creditMinX: number; creditMaxX: number } | null => {
  // Look for header lines containing "DEBIT" and "CREDIT"
  for (const line of lines.slice(0, 30)) { // Check first 30 lines for headers
    const items = line.items;
    let debitX = -1;
    let creditX = -1;

    for (const item of items) {
      const text = item.text.toUpperCase();
      if (text.includes('DEBIT') || text.includes('DÉBIT')) {
        debitX = item.x;
      }
      if (text.includes('CREDIT') || text.includes('CRÉDIT')) {
        creditX = item.x;
      }
    }

    if (debitX >= 0 && creditX >= 0) {
      console.log(`[PDF Parser] Detected Debit/Credit columns at X: debit=${debitX}, credit=${creditX}`);
      return {
        debitMinX: debitX - 50,
        debitMaxX: debitX + 80,
        creditMinX: creditX - 50,
        creditMaxX: creditX + 80,
      };
    }
  }
  return null;
};

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
  
  // Detect column structure
  const columnLayout = detectDebitCreditColumns(allLines);
  
  const transactions: Transaction[] = [];
  const rules = localStore.getRules();
  const now = new Date().toISOString();
  
  // Try to parse each line for transactions
  for (const line of allLines) {
    const transaction = parseTransactionLineWithLayout(line, rules, now, columnLayout);
    
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

/**
 * Parse a transaction line using column layout information
 */
function parseTransactionLineWithLayout(
  line: ParsedLine, 
  rules: any[], 
  now: string,
  columnLayout: { debitMinX: number; debitMaxX: number; creditMinX: number; creditMaxX: number } | null
): Transaction | null {
  const fullText = line.items.map(i => i.text).join(' ');

  const hasExplicitSign = line.items.some(i =>
    /^[+\-−]\s*\d/.test(i.text)
  );
  
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
    const match = fullText.match(pattern);
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
    date = new Date(dateStr);
  }
  
  if (isNaN(date.getTime())) return null;
  
  // If we have column layout, use it to determine debit/credit
  let amountMinor = 0;
  let isIncome = false;
  
  if (columnLayout && !hasExplicitSign) {
    // Find amounts in debit and credit columns based on X position
    let debitAmount = 0;
    let creditAmount = 0;
    
    for (const item of line.items) {
      const amountMatch = item.text.match(/^[+\-−]?\s*\d[\d\s,]*[,\.]\d{2}$/);
      if (amountMatch) {
        try {
          const cents = parseEuroToCents(item.text);
          if (item.x >= columnLayout.debitMinX && item.x <= columnLayout.debitMaxX) {
            debitAmount = Math.abs(cents);
          } else if (item.x >= columnLayout.creditMinX && item.x <= columnLayout.creditMaxX) {
            creditAmount = Math.abs(cents);
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
    
    if (debitAmount > 0) {
      amountMinor = -debitAmount; // Debit is always negative (expense)
      isIncome = false;
    } else if (creditAmount > 0) {
      amountMinor = creditAmount; // Credit is always positive (income)
      isIncome = true;
    }
  }
  
  // Fallback to text-based parsing if column layout didn't work
  if (amountMinor === 0) {
    if (/solde|total|report|frais/i.test(fullText)) return null;

    const signedAmountMatch =
      fullText.match(/([+\-−])\s*([0-9][0-9\s]*[,\.]\d{2})\s*$/);

    if (!signedAmountMatch) return null;

    amountMinor = parseEuroToCents(
      signedAmountMatch[1] + signedAmountMatch[2]
    );
    isIncome = amountMinor > 0;
  }

  if (amountMinor === 0 || Math.abs(amountMinor) > 100000000) return null;

  const amount = Math.abs(amountMinor) / 100;
  
  // Extract label (everything between date and amounts)
  const restOfLine = fullText.slice(dateMatchIndex + dateStr.length).trim();
  let label = restOfLine;
  
  // Remove all amount-like patterns
  label = label
    .replace(/-?\d{1,3}(?:[\s\u00A0]\d{3})*[,\.]\d{2}/g, '')
    .replace(/€/g, '')
    .replace(/EUR/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
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
  const fingerprint = buildTransactionFingerprint({
    accountId: '',
    date,
    amountMinor,
    normalizedLabel,
    source: 'pdf',
  });

  return {
    id,
    accountId: '',
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
    rawSource: fullText,
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
    
    let amountMinor: number;
    try {
      amountMinor = parseEuroToCents(amountStr);
    } catch (error) {
      console.warn(`[PDF Alt Parser] Ignoring invalid amount "${amountStr}":`, error);
      continue;
    }

    if (amountMinor === 0) continue;
    
    const cleanLabel = label.trim();
    if (cleanLabel.length < 3) continue;
    
    const category = categorizeTransaction(cleanLabel, rules);
    const absAmount = Math.abs(amountMinor) / 100;
    const normalizedLabel = normalizeLabel(cleanLabel);
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
        isIncome: amountMinor > 0,
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
    for (const lineText of lines) {
      const parsedLine: ParsedLine = { y: 0, items: [{ x: 0, text: lineText }] };
      const transaction = parseTransactionLineWithLayout(parsedLine, rules, now, null);
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
