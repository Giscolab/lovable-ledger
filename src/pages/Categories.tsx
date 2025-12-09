import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Tag,
  Lock,
  Unlock,
  Search
} from 'lucide-react';
import { CategoryRule, CategoryType } from '@/utils/types';
import { localStore } from '@/utils/localStore';
import { CATEGORY_LABELS, CATEGORY_ICONS, DEFAULT_CATEGORY_RULES, INCOMPRESSIBLE_CATEGORIES } from '@/utils/categories';
import { cn } from '@/lib/utils';

const ALL_CATEGORIES: CategoryType[] = [
  'rent', 'utilities', 'insurance', 'internet', 'transport', 'investments',
  'groceries', 'food', 'shopping', 'smoking', 'entertainment', 'health', 'other'
];

const Categories = () => {
  const [rules, setRules] = useState<CategoryRule[]>([]);
  const [editingRule, setEditingRule] = useState<CategoryRule | null>(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);

  useEffect(() => {
    setRules(localStore.getRules());
  }, []);

  const saveRules = (updatedRules: CategoryRule[]) => {
    setRules(updatedRules);
    localStore.setRules(updatedRules);
  };

  const handleAddKeyword = (category: CategoryType, keyword?: string) => {
    const keywordToAdd = keyword || newKeyword;
    if (!keywordToAdd.trim()) return;
    
    const updatedRules = rules.map(rule => {
      if (rule.category === category) {
        const newKw = keywordToAdd.trim().toLowerCase();
        if (rule.keywords.includes(newKw)) return rule;
        return {
          ...rule,
          keywords: [...rule.keywords, newKw]
        };
      }
      return rule;
    });
    
    saveRules(updatedRules);
    setNewKeyword('');
  };

  const handleRemoveKeyword = (category: CategoryType, keyword: string) => {
    const updatedRules = rules.map(rule => {
      if (rule.category === category) {
        return {
          ...rule,
          keywords: rule.keywords.filter(k => k !== keyword)
        };
      }
      return rule;
    });
    
    saveRules(updatedRules);
  };

  const handleToggleIncompressible = (category: CategoryType) => {
    const updatedRules = rules.map(rule => {
      if (rule.category === category) {
        return { ...rule, isIncompressible: !rule.isIncompressible };
      }
      return rule;
    });
    
    saveRules(updatedRules);
  };

  const handleResetToDefault = () => {
    if (confirm('Réinitialiser toutes les catégories aux valeurs par défaut ?')) {
      saveRules(DEFAULT_CATEGORY_RULES);
    }
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = searchTerm === '' || 
      CATEGORY_LABELS[rule.category].toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.keywords.some(k => k.includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || rule.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const incompressibleRules = filteredRules.filter(r => r.isIncompressible);
  const variableRules = filteredRules.filter(r => !r.isIncompressible);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catégories</h1>
          <p className="text-muted-foreground">Gérez les règles de catégorisation automatique</p>
        </div>
        <button
          onClick={handleResetToDefault}
          className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-all"
        >
          Réinitialiser
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une catégorie ou mot-clé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border bg-card pl-11 pr-4 py-3 focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value as CategoryType || null)}
          className="rounded-xl border border-border bg-card px-4 py-3 focus:border-primary focus:outline-none"
        >
          <option value="">Toutes les catégories</option>
          {ALL_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>
              {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-card p-5 shadow-card text-center">
          <div className="text-3xl font-bold text-primary">{rules.length}</div>
          <p className="text-sm text-muted-foreground mt-1">Catégories</p>
        </div>
        <div className="rounded-2xl bg-card p-5 shadow-card text-center">
          <div className="text-3xl font-bold text-warning">
            {rules.filter(r => r.isIncompressible).length}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Incompressibles</p>
        </div>
        <div className="rounded-2xl bg-card p-5 shadow-card text-center">
          <div className="text-3xl font-bold text-success">
            {rules.reduce((sum, r) => sum + r.keywords.length, 0)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Mots-clés</p>
        </div>
      </div>

      {/* Incompressible Categories */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-warning" />
          <h2 className="text-lg font-semibold text-foreground">Charges fixes (incompressibles)</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {incompressibleRules.map(rule => (
            <CategoryCard 
              key={rule.category}
              rule={rule}
              onAddKeyword={handleAddKeyword}
              onRemoveKeyword={handleRemoveKeyword}
              onToggleIncompressible={handleToggleIncompressible}
            />
          ))}
        </div>
      </div>

      {/* Variable Categories */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Unlock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Dépenses variables</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {variableRules.map(rule => (
            <CategoryCard 
              key={rule.category}
              rule={rule}
              onAddKeyword={handleAddKeyword}
              onRemoveKeyword={handleRemoveKeyword}
              onToggleIncompressible={handleToggleIncompressible}
            />
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-2xl bg-muted/50 p-6">
        <h3 className="font-semibold text-foreground mb-3">💡 Conseils</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• Les mots-clés sont insensibles à la casse</li>
          <li>• Ajoutez des mots-clés spécifiques à vos transactions habituelles</li>
          <li>• Les charges incompressibles sont utilisées pour calculer votre "reste à vivre"</li>
          <li>• Vous pouvez changer une catégorie de fixe à variable en cliquant sur l'icône cadenas</li>
        </ul>
      </div>
    </div>
  );
};

interface CategoryCardProps {
  rule: CategoryRule;
  onAddKeyword: (category: CategoryType, keyword?: string) => void;
  onRemoveKeyword: (category: CategoryType, keyword: string) => void;
  onToggleIncompressible: (category: CategoryType) => void;
}

const CategoryCard = ({ rule, onAddKeyword, onRemoveKeyword, onToggleIncompressible }: CategoryCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyword.trim()) {
      onAddKeyword(rule.category, newKeyword.trim());
      setNewKeyword('');
    }
  };

  return (
    <div className="rounded-2xl glass p-5 shadow-card hover:shadow-card-hover transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{CATEGORY_ICONS[rule.category]}</span>
          <div>
            <h3 className="font-semibold text-foreground">{CATEGORY_LABELS[rule.category]}</h3>
            <p className="text-xs text-muted-foreground">{rule.keywords.length} mots-clés</p>
          </div>
        </div>
        <button
          onClick={() => onToggleIncompressible(rule.category)}
          className={cn(
            'p-2 rounded-lg transition-all',
            rule.isIncompressible 
              ? 'bg-warning/10 text-warning hover:bg-warning/20' 
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
          title={rule.isIncompressible ? 'Marquer comme variable' : 'Marquer comme fixe'}
        >
          {rule.isIncompressible ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {rule.keywords.slice(0, isExpanded ? undefined : 5).map(keyword => (
          <span 
            key={keyword}
            className="group inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
          >
            {keyword}
            <button
              onClick={() => onRemoveKeyword(rule.category, keyword)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {!isExpanded && rule.keywords.length > 5 && (
          <button
            onClick={() => setIsExpanded(true)}
            className="text-xs text-primary hover:underline"
          >
            +{rule.keywords.length - 5} autres
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Nouveau mot-clé..."
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={!newKeyword.trim()}
          className="rounded-lg bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

export default Categories;
