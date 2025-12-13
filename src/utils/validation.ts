import { z } from 'zod';
import { AccountType, CategoryType, TransactionSource } from './types';

// Constants for validation limits
export const VALIDATION_LIMITS = {
  LABEL_MAX: 200,
  NAME_MAX: 100,
  NOTES_MAX: 1000,
  BANK_NAME_MAX: 100,
  ACCOUNT_NUMBER_MAX: 50,
  TAG_MAX: 50,
  AMOUNT_MAX: 999999999.99,
} as const;

// IBAN validation (basic format check for European IBANs)
const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/;

export const validateIBAN = (iban: string): boolean => {
  if (!iban) return true; // IBAN is optional
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  return ibanRegex.test(cleaned);
};

// Account form schema
export const accountFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Le nom est obligatoire')
    .max(VALIDATION_LIMITS.NAME_MAX, `Le nom ne peut pas dépasser ${VALIDATION_LIMITS.NAME_MAX} caractères`),
  type: z.enum(['checking', 'savings', 'cash', 'investment', 'custom'] as const),
  iban: z
    .string()
    .trim()
    .max(34, 'L\'IBAN ne peut pas dépasser 34 caractères')
    .refine((val) => !val || validateIBAN(val), 'Format IBAN invalide')
    .optional()
    .or(z.literal('')),
  number: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.ACCOUNT_NUMBER_MAX, `Le numéro ne peut pas dépasser ${VALIDATION_LIMITS.ACCOUNT_NUMBER_MAX} caractères`)
    .optional()
    .or(z.literal('')),
  bankName: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.BANK_NAME_MAX, `Le nom de la banque ne peut pas dépasser ${VALIDATION_LIMITS.BANK_NAME_MAX} caractères`)
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.NOTES_MAX, `Les notes ne peuvent pas dépasser ${VALIDATION_LIMITS.NOTES_MAX} caractères`)
    .optional()
    .or(z.literal('')),
});

export type AccountFormData = z.infer<typeof accountFormSchema>;

// Transaction form schema
export const transactionFormSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, 'Le libellé est obligatoire')
    .max(VALIDATION_LIMITS.LABEL_MAX, `Le libellé ne peut pas dépasser ${VALIDATION_LIMITS.LABEL_MAX} caractères`),
  amount: z
    .number()
    .positive('Le montant doit être positif')
    .max(VALIDATION_LIMITS.AMOUNT_MAX, 'Le montant est trop élevé'),
  category: z.string() as z.ZodType<CategoryType>,
  date: z.string().min(1, 'La date est obligatoire'),
  isIncome: z.boolean(),
  notes: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.NOTES_MAX, `Les notes ne peuvent pas dépasser ${VALIDATION_LIMITS.NOTES_MAX} caractères`)
    .optional()
    .or(z.literal('')),
  accountId: z.string().min(1, 'Veuillez sélectionner un compte'),
  tags: z.array(
    z.string().trim().max(VALIDATION_LIMITS.TAG_MAX, `Un tag ne peut pas dépasser ${VALIDATION_LIMITS.TAG_MAX} caractères`)
  ).optional(),
});

export type TransactionFormData = z.infer<typeof transactionFormSchema>;

// Backup data validation schemas
const transactionSchema = z.object({
  id: z.string(),
  accountId: z.string().optional(),
  label: z.string().max(VALIDATION_LIMITS.LABEL_MAX * 2), // Allow some flexibility for legacy data
  amount: z.number(),
  category: z.string(),
  date: z.union([z.string(), z.date()]),
  isIncome: z.boolean(),
  notes: z.string().max(VALIDATION_LIMITS.NOTES_MAX * 2).optional(),
  source: z.enum(['manual', 'csv', 'pdf']).optional(),
  createdAt: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const accountSchema = z.object({
  id: z.string(),
  name: z.string().max(VALIDATION_LIMITS.NAME_MAX * 2),
  type: z.enum(['checking', 'savings', 'cash', 'investment', 'custom']),
  iban: z.string().optional(),
  number: z.string().optional(),
  bankName: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
});

const goalSchema = z.object({
  id: z.string(),
  name: z.string(),
  targetAmount: z.number(),
  currentAmount: z.number(),
  deadline: z.string().optional(),
  category: z.string().optional(),
  color: z.string().optional(),
});

const budgetAlertSchema = z.object({
  id: z.string(),
  category: z.string(),
  limit: z.number(),
  enabled: z.boolean(),
});

const statementSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  openingBalanceMinor: z.number(),
  closingBalanceMinor: z.number(),
  sourceFileId: z.string().optional(),
  importedAt: z.string(),
  transactionIds: z.array(z.string()),
  currency: z.string().optional(),
});

const projectionYearSchema = z.object({
  year: z.number(),
  monthlyIncome: z.number(),
  monthlyExpenses: z.number(),
  events: z.array(z.object({
    month: z.number(),
    label: z.string(),
    amount: z.number(),
    isIncome: z.boolean(),
  })).optional(),
});

const rulesSchema = z.record(z.array(z.string()));

export const backupDataSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  data: z.object({
    transactions: z.array(transactionSchema).optional(),
    rules: rulesSchema.optional(),
    budgets: z.array(budgetAlertSchema).optional(),
    goals: z.array(goalSchema).optional(),
    projectionYears: z.array(projectionYearSchema).optional(),
    accounts: z.array(accountSchema).optional(),
    initialBalance: z.number().optional(),
    selectedAccountId: z.string().optional(),
    statements: z.array(statementSchema).optional(),
  }),
});

export type ValidatedBackupData = z.infer<typeof backupDataSchema>;

// Validate backup data with detailed error messages
export const validateBackupData = (data: unknown): { success: true; data: ValidatedBackupData } | { success: false; errors: string[] } => {
  const result = backupDataSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.issues.map(issue => {
    const path = issue.path.join('.');
    return `${path}: ${issue.message}`;
  });
  
  return { success: false, errors };
};
