import { CategoryRule, CategoryType } from './types';

export const categorizeTransaction = (
  label: string,
  rules: CategoryRule[]
): CategoryType => {
  const normalizedLabel = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (const rule of rules) {
    for (const keyword of rule.keywords) {
      const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalizedLabel.includes(normalizedKeyword)) {
        return rule.category;
      }
    }
  }

  return 'other';
};
