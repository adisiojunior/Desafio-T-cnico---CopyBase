// utils/formatUtils.js

// Função para formatar o valor de MRR com duas casas decimais
export function formatMRR(value) {
  if (typeof value !== 'number') {
    return 'N/A';
  }
  return value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Função para formatar o valor de Churn Rate com duas casas decimais
export function formatChurnRate(value) {
  if (typeof value !== 'number') {
    return 'N/A';
  }
  return value.toFixed(2);
}
