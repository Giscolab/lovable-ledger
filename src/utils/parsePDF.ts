import * as pdfjsLib from 'pdfjs-dist';
import { Transaction } from './types';
import { categorizeTransaction } from './categorize';
import { localStore } from './localStore';

// Configure PDF.js worker - use unpkg CDN which is more reliable
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
  
  // First, extract all text to understand the structure
  let allLines: ParsedLine[] = [];
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Group text items by Y position (same line)
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
    
    // Sort lines by Y (descending = top to bottom)
    pageLines.sort((a, b) => b.y - a.y);
    pageLines.forEach(line => {
      line.items.sort((a, b) => a.x - b.x);
    });
    
    allLines = [...allLines, ...pageLines];
  }
  
  console.log(`[PDF Parser] Found ${allLines.length} lines`);
  
  // Debug: show first 20 lines
  allLines.slice(0, 20).forEach((line, i) => {
    const text = line.items.map(it => it.text).join(' | ');
    console.log(`[PDF Line ${i}] ${text}`);
  });
  
  const transactions: Transaction[] = [];
  const rules = localStore.getRules();
  
  // Try to parse each line for transactions
  for (const line of allLines) {
    const fullText = line.items.map(i => i.text).join(' ');
    const transaction = parseTransactionLine(fullText, rules);
    
    if (transaction) {
      // Check for duplicates
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
  
  // Sort by date
  transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return transactions;
};

function parseTransactionLine(text: string, rules: any[]): Transaction | null {
  // Date patterns: DD/MM/YYYY, DD/MM/YY, DD.MM.YYYY, DD.MM.YY
  const datePatterns = [
    /^(\d{2}[\/\.]\d{2}[\/\.]\d{4})/,
    /^(\d{2}[\/\.]\d{2}[\/\.]\d{2})(?!\d)/,
    /(\d{2}[\/\.]\d{2}[\/\.]\d{4})/,
    /(\d{2}[\/\.]\d{2}[\/\.]\d{2})(?!\d)/,
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
  const dateParts = dateStr.split(/[\/\.]/);
  if (dateParts.length !== 3) return null;
  
  let year = parseInt(dateParts[2]);
  if (year < 100) year += 2000;
  
  const date = new Date(year, parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
  if (isNaN(date.getTime())) return null;
  
  // Get text after date
  const restOfLine = text.slice(dateMatchIndex + dateStr.length).trim();
  
  // Extract amounts - multiple patterns for French format
  // Patterns: 1 234,56 or 1234,56 or -1 234,56 or 1.234,56
  const amountPatterns = [
    /-?\d{1,3}(?:[\s\u00A0]\d{3})*[,\.]\d{2}/g,  // With thousands separator
    /-?\d+[,\.]\d{2}/g,  // Simple format
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
  
  // Parse amounts
  const parsedAmounts = amounts.map(a => {
    const cleaned = a.replace(/[\s\u00A0]/g, '').replace(',', '.');
    return parseFloat(cleaned);
  }).filter(a => !isNaN(a) && a !== 0);
  
  if (parsedAmounts.length === 0) return null;
  
  // Determine amount and direction
  let amount = 0;
  let isIncome = false;
  
  // Caisse d'Épargne: usually DEBIT | CREDIT columns
  // Or single signed amount
  if (parsedAmounts.length >= 2) {
    // Two columns: debit (usually negative/first), credit (usually positive/second)
    const first = parsedAmounts[0];
    const second = parsedAmounts[1];
    
    if (Math.abs(first) > 0) {
      amount = Math.abs(first);
      isIncome = first > 0;
    } else {
      amount = Math.abs(second);
      isIncome = second > 0;
    }
  } else {
    amount = Math.abs(parsedAmounts[0]);
    isIncome = parsedAmounts[0] > 0;
  }
  
  if (amount === 0) return null;
  
  // Extract label (text between date and amounts)
  let label = restOfLine;
  amounts.forEach(a => {
    label = label.replace(a, '');
  });
  label = label.replace(/\s+/g, ' ').trim();
  
  // Clean up label - remove common artifacts
  label = label.replace(/€/g, '').replace(/EUR/gi, '').trim();
  
  // Skip if label is too short or is a header/total
  if (label.length < 3) return null;
  if (/^(total|solde|report|ancien|nouveau|date|libelle|débit|crédit|valeur)/i.test(label)) return null;
  
  const category = categorizeTransaction(label, rules);
  const id = `${date.getTime()}-${label.slice(0, 10)}-${amount}`.replace(/\s/g, '');
  
  return {
    id,
    date,
    label,
    amount,
    category,
    isIncome,
  };
}

// Alternative parser - tries line-by-line with more relaxed matching
async function parsePDFAlternative(file: File): Promise<Transaction[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Try to reconstruct lines based on position
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
    
    // Group by Y and join
    const lineMap = new Map<number, { x: number; text: string }[]>();
    items.forEach(item => {
      const roundedY = Math.round(item.y / 5) * 5;
      if (!lineMap.has(roundedY)) {
        lineMap.set(roundedY, []);
      }
      lineMap.get(roundedY)!.push({ x: item.x, text: item.text });
    });
    
    // Sort and concatenate
    Array.from(lineMap.entries())
      .sort((a, b) => b[0] - a[0])
      .forEach(([, lineItems]) => {
        lineItems.sort((a, b) => a.x - b.x);
        fullText += lineItems.map(i => i.text).join(' ') + '\n';
      });
  }
  
  console.log('[PDF Alt Parser] Full text sample:', fullText.slice(0, 1000));
  
  const transactions: Transaction[] = [];
  const rules = localStore.getRules();
  const lines = fullText.split('\n');
  
  for (const line of lines) {
    const transaction = parseTransactionLine(line, rules);
    if (transaction) {
      const isDuplicate = transactions.some(t => t.id === transaction.id);
      if (!isDuplicate) {
        transactions.push(transaction);
      }
    }
  }
  
  console.log(`[PDF Alt Parser] Found ${transactions.length} transactions`);
  
  return transactions;
}
