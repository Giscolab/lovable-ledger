import jsPDF from 'jspdf';
import { MonthlyStats, YearlyStats } from './types';
import { formatCurrency, getMonthName } from './computeStats';
import { CATEGORY_LABELS } from './categories';

export async function generateMonthlyReport(stats: MonthlyStats): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(30, 136, 255);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('Rapport Mensuel', 20, 25);
  
  doc.setFontSize(12);
  doc.text(`${getMonthName(stats.monthIndex)} ${stats.year}`, 20, 35);
  
  // Reset colors
  doc.setTextColor(0, 0, 0);
  
  let y = 60;
  
  // Summary section
  doc.setFontSize(16);
  doc.text('Résumé', 20, y);
  y += 10;
  
  doc.setFontSize(11);
  const summaryData = [
    ['Revenus totaux', formatCurrency(stats.totalIncome)],
    ['Dépenses totales', formatCurrency(stats.totalExpenses)],
    ['Charges fixes', formatCurrency(stats.incompressible)],
    ['Dépenses variables', formatCurrency(stats.variable)],
    ['Épargne', formatCurrency(stats.savings)],
    ['Reste à vivre', formatCurrency(stats.resteAVivre)],
  ];
  
  summaryData.forEach(([label, value]) => {
    doc.text(label, 20, y);
    doc.text(value, pageWidth - 20, y, { align: 'right' });
    y += 8;
  });
  
  y += 10;
  
  // Category breakdown
  doc.setFontSize(16);
  doc.text('Dépenses par catégorie', 20, y);
  y += 10;
  
  doc.setFontSize(11);
  const sortedCategories = Object.entries(stats.byCategory)
    .filter(([_, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a);
  
  sortedCategories.forEach(([category, amount]) => {
    const label = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category;
    doc.text(label, 20, y);
    doc.text(formatCurrency(amount), pageWidth - 20, y, { align: 'right' });
    y += 8;
    
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });
  
  // Footer
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 20, 285);
  
  // Save
  doc.save(`rapport-${getMonthName(stats.monthIndex).toLowerCase()}-${stats.year}.pdf`);
}

export async function generateYearlyReport(stats: YearlyStats): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(30, 136, 255);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('Rapport Annuel', 20, 25);
  
  doc.setFontSize(12);
  doc.text(`Année ${stats.year}`, 20, 35);
  
  doc.setTextColor(0, 0, 0);
  
  let y = 60;
  
  // Annual summary
  doc.setFontSize(16);
  doc.text('Synthèse annuelle', 20, y);
  y += 10;
  
  doc.setFontSize(11);
  const annualData = [
    ['Revenus totaux', formatCurrency(stats.totalIncome)],
    ['Dépenses totales', formatCurrency(stats.totalExpenses)],
    ['Épargne totale', formatCurrency(stats.totalSavings)],
    ['Revenu moyen/mois', formatCurrency(stats.averageMonthlyIncome)],
    ['Dépenses moyennes/mois', formatCurrency(stats.averageMonthlyExpenses)],
  ];
  
  annualData.forEach(([label, value]) => {
    doc.text(label, 20, y);
    doc.text(value, pageWidth - 20, y, { align: 'right' });
    y += 8;
  });
  
  y += 10;
  
  // Monthly breakdown
  doc.setFontSize(16);
  doc.text('Détail mensuel', 20, y);
  y += 10;
  
  doc.setFontSize(10);
  doc.text('Mois', 20, y);
  doc.text('Revenus', 70, y);
  doc.text('Dépenses', 110, y);
  doc.text('Épargne', 150, y);
  y += 8;
  
  stats.monthlyBreakdown.forEach((month) => {
    doc.text(getMonthName(month.monthIndex), 20, y);
    doc.text(formatCurrency(month.totalIncome), 70, y);
    doc.text(formatCurrency(month.totalExpenses), 110, y);
    doc.text(formatCurrency(month.savings), 150, y);
    y += 7;
    
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });
  
  // Footer
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 20, 285);
  
  doc.save(`rapport-annuel-${stats.year}.pdf`);
}
