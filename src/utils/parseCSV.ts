import Papa from 'papaparse';
import { Transaction, CategoryType } from './types';
import { categorizeTransaction } from './categorize';
import { localStore } from './localStore';
import { computeTransactionId } from './transactionId';
import { buildTransactionFingerprint, normalizeLabel, parseEuroToCents } from './normalization';

interface CSVColumnMapping {
  dateIndex: number;
  labelIndex: number;
  amountIndex?: number;
  debitIndex?: number;
  creditIndex?: number;
}

/**
 * Detects the column structure from CSV headers
 */
const detectColumnMapping = (headers: string[]): CSVColumnMapping | null => {
  const normalized = headers.map(h => h.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim());
  
  let dateIndex = -1;
  let labelIndex = -1;
  let amountIndex = -1;
  let debitIndex = -1;
  let creditIndex = -1;

  normalized.forEach((h, i) => {
    if (h.includes('date') || h === 'jour') dateIndex = i;
    if (h.includes('libelle') || h.includes('label') || h.includes('description') || h.includes('operation')) labelIndex = i;
    if (h.includes('montant') || h === 'amount' || h === 'valeur') amountIndex = i;
    if (h.includes('debit') || h === 'sortie' || h === 'depense') debitIndex = i;
    if (h.includes('credit') || h === 'entree' || h === 'recette') creditIndex = i;
  });

  // If we found debit/credit columns but no amount, that's the 4-column format
  if (dateIndex >= 0 && labelIndex >= 0 && (debitIndex >= 0 || creditIndex >= 0)) {
    return { dateIndex, labelIndex, debitIndex, creditIndex };
  }

  // Standard 3-column format
  if (dateIndex >= 0 && labelIndex >= 0 && amountIndex >= 0) {
    return { dateIndex, labelIndex, amountIndex };
  }

  return null;
};

/**
 * Parses a single amount from debit/credit columns
 * Debit = expense (negative), Credit = income (positive)
 */
const parseDebitCredit = (debitStr: string | undefined, creditStr: string | undefined): number => {
  const debit = debitStr?.trim();
  const credit = creditStr?.trim();

  // Try credit first (income = positive)
  if (credit && credit !== '' && credit !== '0' && credit !== '0,00' && credit !== '0.00') {
    try {
      const cents = parseEuroToCents(credit);
      return Math.abs(cents); // Credit is always positive
    } catch {
      // Continue to try debit
    }
  }

  // Try debit (expense = negative)
  if (debit && debit !== '' && debit !== '0' && debit !== '0,00' && debit !== '0.00') {
    try {
      const cents = parseEuroToCents(debit);
      return -Math.abs(cents); // Debit is always negative
    } catch {
      return 0;
    }
  }

  return 0;
};

export const parseCSV = (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rules = localStore.getRules();
          const transactions: Transaction[] = [];
          const now = new Date().toISOString();
          const rows = results.data as string[][];

          if (rows.length === 0) {
            resolve([]);
            return;
          }

          // Try to detect column mapping from first row
          let mapping: CSVColumnMapping | null = null;
          let startRow = 0;

          // Check if first row looks like headers
          const firstRow = rows[0];
          if (firstRow && firstRow.length > 0) {
            const firstCell = String(firstRow[0] || '').toLowerCase();
            if (firstCell.includes('date') || firstCell.includes('libelle') || firstCell.includes('libellé')) {
              mapping = detectColumnMapping(firstRow.map(String));
              startRow = 1; // Skip header row
            }
          }

          // Default mapping if no headers detected (assume standard 3-column format)
          if (!mapping) {
            mapping = { dateIndex: 0, labelIndex: 1, amountIndex: 2 };
          }

          console.log('[CSV Parser] Detected mapping:', mapping);

          for (let i = startRow; i < rows.length; i++) {
            let row = rows[i];
            
            // Handle case where row is a single string (semicolon separated)
            if (row.length === 1 && typeof row[0] === 'string' && row[0].includes(';')) {
              row = row[0].split(';');
            }

            if (row.length < 2) continue;

            const dateStr = String(row[mapping.dateIndex] || '').trim();
            const label = String(row[mapping.labelIndex] || '').trim();

            if (!dateStr || !label) continue;

            // Parse date (handle DD/MM/YYYY format)
            const dateParts = dateStr.split(/[\/\.\-]/);
            let date: Date;
            if (dateParts.length === 3) {
              let year = parseInt(dateParts[2]);
              if (year < 100) year += 2000;
              date = new Date(year, parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
            } else {
              date = new Date(dateStr);
            }

            if (isNaN(date.getTime())) continue;

            // Parse amount based on column format
            let amountMinor: number;
            
            if (mapping.amountIndex !== undefined) {
              // Single amount column
              const amountStr = String(row[mapping.amountIndex] || '').trim();
              if (!amountStr) continue;
              
              try {
                amountMinor = parseEuroToCents(amountStr);
              } catch (error) {
                console.warn(`[CSV Parser] Ignoring invalid amount "${amountStr}":`, error);
                continue;
              }
            } else {
              // Debit/Credit columns
              const debitStr = mapping.debitIndex !== undefined ? String(row[mapping.debitIndex] || '') : undefined;
              const creditStr = mapping.creditIndex !== undefined ? String(row[mapping.creditIndex] || '') : undefined;
              amountMinor = parseDebitCredit(debitStr, creditStr);
            }

            if (amountMinor === 0) continue;

            const isIncome = amountMinor > 0;
            const category = categorizeTransaction(label, rules);
            const normalizedLabel = normalizeLabel(label);
            const absAmount = Math.abs(amountMinor) / 100;

            // Generate deterministic ID for deduplication
            const id = computeTransactionId(date, label, absAmount, 'csv');
            const fingerprint = buildTransactionFingerprint({
              accountId: '',
              date,
              amountMinor,
              normalizedLabel,
              source: 'csv',
            });

            transactions.push({
              id,
              accountId: '', // Will be set during import
              date,
              label,
              normalizedLabel,
              amount: absAmount,
              amountMinor,
              category,
              isIncome,
              source: 'csv',
              dedupeHash: fingerprint,
              rawFingerprint: fingerprint,
              rawSource: Array.isArray(row) ? row.join(';') : String(row),
              createdAt: now,
              tags: [],
              status: 'posted',
              currency: 'EUR',
            });
          }

          console.log(`[CSV Parser] Parsed ${transactions.length} transactions`);
          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

export const generateSampleCSV = (): string => {
  const sampleData = `Date;Libellé;Montant
01/01/2025;Virement salaire;3200,00
02/01/2025;Loyer Habitat;-950,00
03/01/2025;EDF Facture;-85,50
05/01/2025;SFR Box Internet;-35,99
06/01/2025;Navigo Mensuel;-86,40
08/01/2025;Carrefour City;-45,30
10/01/2025;Deliveroo Restaurant;-25,90
12/01/2025;Netflix Abonnement;-15,99
15/01/2025;Assurance Habitation BPCE;-25,00
18/01/2025;Pharmacie Santé;-12,50
20/01/2025;Amazon Shopping;-89,99
22/01/2025;Versement PER Retraite;-200,00
25/01/2025;Auchan Courses;-120,00
28/01/2025;Uber Eats Pizza;-18,50
30/01/2025;Google Play;-4,99`;
  return sampleData;
};
