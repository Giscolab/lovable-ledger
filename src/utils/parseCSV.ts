import Papa from 'papaparse';
import { Transaction, CategoryType } from './types';
import { categorizeTransaction } from './categorize';
import { localStore } from './localStore';
import { computeTransactionId } from './transactionId';
import { buildTransactionFingerprint, normalizeLabel, parseEuroToCents } from './normalization';

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

          results.data.forEach((row: any, index: number) => {
            // Skip header row if present
            if (index === 0) {
              const firstCell = String(row[0] || '').toLowerCase();
              if (firstCell.includes('date') || firstCell.includes('libellé') || firstCell.includes('libelle')) {
                return;
              }
            }

            // Handle both semicolon and comma separated values
            let dateStr: string, label: string, amountStr: string;

            if (row.length >= 3) {
              [dateStr, label, amountStr] = row;
            } else if (row.length === 1 && typeof row[0] === 'string') {
              // Try splitting by semicolon
              const parts = row[0].split(';');
              if (parts.length >= 3) {
                [dateStr, label, amountStr] = parts;
              } else {
                return;
              }
            } else {
              return;
            }

            // Clean and validate data
            if (!dateStr || !label || !amountStr) return;

            dateStr = dateStr.trim();
            label = label.trim();
            amountStr = String(amountStr).trim();

            // Parse date (handle DD/MM/YYYY format)
            const dateParts = dateStr.split('/');
            let date: Date;
            if (dateParts.length === 3) {
              date = new Date(
                parseInt(dateParts[2]),
                parseInt(dateParts[1]) - 1,
                parseInt(dateParts[0])
              );
            } else {
              date = new Date(dateStr);
            }

            if (isNaN(date.getTime())) return;

            let amountMinor: number;
            try {
              amountMinor = parseEuroToCents(amountStr);
            } catch (error) {
              console.warn(`[CSV Parser] Ignoring invalid amount "${amountStr}":`, error);
              return;
            }

            if (amountMinor === 0) return;

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
          });

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
