import { CategoryType } from '@/utils/types';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/utils/categories';
import { cn } from '@/lib/utils';

interface CategoryTagProps {
  category: CategoryType;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const categoryColorClasses: Record<CategoryType, string> = {
  rent: 'bg-category-rent/15 text-category-rent border-category-rent/30',
  utilities: 'bg-category-utilities/15 text-category-utilities border-category-utilities/30',
  electricity: 'bg-category-utilities/15 text-category-utilities border-category-utilities/30',
  water: 'bg-category-utilities/15 text-category-utilities border-category-utilities/30',
  insurance: 'bg-category-insurance/15 text-category-insurance border-category-insurance/30',
  home_insurance: 'bg-category-insurance/15 text-category-insurance border-category-insurance/30',
  internet: 'bg-category-internet/15 text-category-internet border-category-internet/30',
  mobile: 'bg-category-internet/15 text-category-internet border-category-internet/30',
  transport: 'bg-category-transport/15 text-category-transport border-category-transport/30',
  investments: 'bg-category-investments/15 text-category-investments border-category-investments/30',
  groceries: 'bg-category-groceries/15 text-category-groceries border-category-groceries/30',
  food: 'bg-category-food/15 text-category-food border-category-food/30',
  shopping: 'bg-category-shopping/15 text-category-shopping border-category-shopping/30',
  smoking: 'bg-category-smoking/15 text-category-smoking border-category-smoking/30',
  entertainment: 'bg-category-entertainment/15 text-category-entertainment border-category-entertainment/30',
  health: 'bg-category-health/15 text-category-health border-category-health/30',
  household: 'bg-category-other/15 text-category-other border-category-other/30',
  internal_transfer: 'bg-category-other/15 text-category-other border-category-other/30',
  streaming: 'bg-category-entertainment/15 text-category-entertainment border-category-entertainment/30',
  subscriptions: 'bg-category-other/15 text-category-other border-category-other/30',
  clothing: 'bg-category-shopping/15 text-category-shopping border-category-shopping/30',
  beauty: 'bg-category-health/15 text-category-health border-category-health/30',
  gifts: 'bg-category-other/15 text-category-other border-category-other/30',
  hobbies: 'bg-category-entertainment/15 text-category-entertainment border-category-entertainment/30',
  travel: 'bg-category-transport/15 text-category-transport border-category-transport/30',
  bank_fees: 'bg-category-other/15 text-category-other border-category-other/30',
  taxes: 'bg-category-other/15 text-category-other border-category-other/30',
  donations: 'bg-category-other/15 text-category-other border-category-other/30',
  unexpected: 'bg-category-other/15 text-category-other border-category-other/30',
  other: 'bg-category-other/15 text-category-other border-category-other/30',
};

export const CategoryTag = ({ category, size = 'md', showIcon = true }: CategoryTagProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-all',
        categoryColorClasses[category],
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {showIcon && <span>{CATEGORY_ICONS[category]}</span>}
      {CATEGORY_LABELS[category]}
    </span>
  );
};
