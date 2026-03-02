import { Project, Transaction } from '../types';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const IR_DEDUCTIBLE_CATEGORIES = ['Saúde', 'Educação'];

interface ReportData {
  workspaceName: string;
  year: number;
  months: number[];
  transactions: Transaction[];
  fixedExpenses: { description: string; amount: number; payment_method: string }[];
  incomes: { description: string; amount: number }[];
  project?: Project | null;
  selectedCategories?: string[] | null;
  savingsGoalNames?: Record<string, string>;
  memberNames: Record<string, string>;
  generatedAt: string;
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

export function generateReportHtml(data: ReportData): string {
  const {
    workspaceName, year, months, transactions, fixedExpenses, incomes,
    project, selectedCategories, savingsGoalNames = {}, memberNames, generatedAt,
  } = data;

  const monthNames = months.sort((a, b) => a - b).map(m => MESES[m - 1]);
  const periodLabel = months.length === 12
    ? `Ano ${year}`
    : months.length === 1
      ? `${monthNames[0]} ${year}`
      : `${monthNames[0]} a ${monthNames[monthNames.length - 1]} ${year}`;

  const isProjectReport = !!project;
  const isCategoryReport = !!(selectedCategories && selectedCategories.length > 0);
  const numMonths = months.length;

  // ---- Separate savings withdrawals ----
  const savingsWithdrawals = transactions.filter(t => t.from_savings);
  const regularTx = transactions.filter(t => !t.from_savings);
  const totalSavingsWithdrawals = savingsWithdrawals.reduce((s, t) => s + (Number(t.amount) || 0), 0);

  // ---- Calculations (regular transactions only) ----
  const totalTxDebit = regularTx.filter(t => t.payment_method !== 'credit').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalTxCredit = regularTx.filter(t => t.payment_method === 'credit').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalTxAll = totalTxDebit + totalTxCredit;

  const totalIncomeMonthly = isProjectReport ? 0 : incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalFixedDebit = isProjectReport ? 0 : fixedExpenses.filter(f => f.payment_method !== 'credit').reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const totalFixedCredit = isProjectReport ? 0 : fixedExpenses.filter(f => f.payment_method === 'credit').reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const totalFixedPeriod = (totalFixedDebit + totalFixedCredit) * numMonths;
  const totalIncomePeriod = totalIncomeMonthly * numMonths;
  const totalExpenses = totalFixedPeriod + totalTxAll;
  const balance = totalIncomePeriod - totalExpenses;

  // By category (regular only)
  const byCategory: Record<string, { total: number; debit: number; credit: number; count: number }> = {};
  regularTx.forEach(t => {
    if (!byCategory[t.category]) byCategory[t.category] = { total: 0, debit: 0, credit: 0, count: 0 };
    const amt = Number(t.amount) || 0;
    byCategory[t.category].total += amt;
    byCategory[t.category].count++;
    if (t.payment_method === 'credit') byCategory[t.category].credit += amt;
    else byCategory[t.category].debit += amt;
  });
  const categorySorted = Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total);

  // Deductible
  const deductibleTx = regularTx.filter(t => IR_DEDUCTIBLE_CATEGORIES.includes(t.category));
  const totalDeductible = deductibleTx.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const deductibleByCategory: Record<string, number> = {};
  deductibleTx.forEach(t => {
    deductibleByCategory[t.category] = (deductibleByCategory[t.category] || 0) + (Number(t.amount) || 0);
  });

  // By month (regular only)
  const byMonth: Record<number, { debit: number; credit: number; savings: number; total: number }> = {};
  months.forEach(m => { byMonth[m] = { debit: 0, credit: 0, savings: 0, total: 0 }; });
  regularTx.forEach(t => {
    const m = new Date(t.transaction_date).getMonth() + 1;
    if (byMonth[m]) {
      const amt = Number(t.amount) || 0;
      byMonth[m].total += amt;
      if (t.payment_method === 'credit') byMonth[m].credit += amt;
      else byMonth[m].debit += amt;
    }
  });
  savingsWithdrawals.forEach(t => {
    const m = new Date(t.transaction_date).getMonth() + 1;
    if (byMonth[m]) byMonth[m].savings += Number(t.amount) || 0;
  });

  // Installments
  const installmentTx = regularTx.filter(t => t.installment_total && t.installment_total > 1);
  const installmentGroups: Record<string, { description: string; current: number; total: number; amount: number; category: string }> = {};
  installmentTx.forEach(t => {
    if (t.installment_id && !installmentGroups[t.installment_id]) {
      installmentGroups[t.installment_id] = {
        description: t.description,
        current: t.installment_current || 1,
        total: t.installment_total || 1,
        amount: Number(t.amount) || 0,
        category: t.category,
      };
    }
  });

  const subscriptions = fixedExpenses.filter(f => f.payment_method === 'credit');
  const fixedBills = fixedExpenses.filter(f => f.payment_method !== 'credit');

  // By payment method
  const byPaymentMethod: Record<string, { total: number; count: number }> = {};
  regularTx.forEach(t => {
    const label = t.payment_method === 'credit' ? 'Crédito' : 'Débito/Pix';
    if (!byPaymentMethod[label]) byPaymentMethod[label] = { total: 0, count: 0 };
    byPaymentMethod[label].total += Number(t.amount) || 0;
    byPaymentMethod[label].count++;
  });

  const avgMonthly = numMonths > 1 ? totalTxAll / numMonths : 0;
  const avgMonthlyDebit = numMonths > 1 ? totalTxDebit / numMonths : 0;
  const avgMonthlyCredit = numMonths > 1 ? totalTxCredit / numMonths : 0;

  // By member
  const byMember: Record<string, number> = {};
  transactions.forEach(t => {
    const name = memberNames[t.user_id] || 'Desconhecido';
    byMember[name] = (byMember[name] || 0) + (Number(t.amount) || 0);
  });

  const hasSavings = savingsWithdrawals.length > 0;
  const hasMonthSavings = months.some(m => byMonth[m]?.savings > 0);

  // ---- HTML ----
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; font-size: 11px; padding: 24px; }
  h1 { font-size: 22px; color: #1e293b; margin-bottom: 4px; }
  h2 { font-size: 14px; color: #334155; margin: 20px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #e2e8f0; }
  h3 { font-size: 12px; color: #475569; margin: 12px 0 6px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 3px solid #3b82f6; }
  .header-left { flex: 1; }
  .header-right { text-align: right; font-size: 10px; color: #64748b; }
  .subtitle { font-size: 13px; color: #64748b; margin-top: 2px; }
  .badges { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .badge-green { background: #d1fae5; color: #065f46; }
  .badge-red { background: #fee2e2; color: #991b1b; }
  .badge-purple { background: #ede9fe; color: #5b21b6; }
  .badge-amber { background: #fef3c7; color: #92400e; }
  .badge-emerald { background: #d1fae5; color: #065f46; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0 12px; }
  th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
  th { background: #f8fafc; font-weight: 700; color: #475569; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
  td.right, th.right { text-align: right; }
  .summary-grid { display: flex; gap: 12px; margin: 8px 0 16px; }
  .summary-card { flex: 1; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
  .summary-card .label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .summary-card .value { font-size: 18px; font-weight: 700; margin-top: 4px; }
  .green { color: #059669; }
  .red { color: #dc2626; }
  .blue { color: #2563eb; }
  .amber { color: #d97706; }
  .purple { color: #7c3aed; }
  .emerald { color: #059669; }
  .deductible-section { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin: 8px 0 16px; }
  .deductible-header { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
  .deductible-title { font-size: 13px; font-weight: 700; color: #166534; }
  .savings-section { background: #ecfdf5; border: 1px solid #6ee7b7; border-left: 4px solid #10b981; border-radius: 8px; padding: 12px; margin: 8px 0 16px; }
  .savings-title { font-size: 13px; font-weight: 700; color: #065f46; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: center; }
  .page-break { page-break-before: always; }
  tr.savings-row { background: #f0fdf4; }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <h1>Relatório Financeiro</h1>
    <div class="subtitle">${workspaceName} · ${periodLabel}</div>
    <div class="badges">
      ${project ? `<span class="badge badge-purple">Projeto: ${project.name}</span>` : ''}
      ${isCategoryReport ? selectedCategories!.map(c => `<span class="badge badge-blue">${c}</span>`).join('') : ''}
    </div>
  </div>
  <div class="header-right">
    Gerado em: ${generatedAt}<br/>
    Transações: ${transactions.length}${hasSavings ? ` (${savingsWithdrawals.length} da poupança)` : ''}
  </div>
</div>

<!-- RESUMO GERAL -->
<h2>${isProjectReport ? 'Resumo do Projeto' : isCategoryReport ? 'Resumo da Seleção' : 'Resumo Geral'}</h2>
<div class="summary-grid">
  ${isProjectReport ? `
  <div class="summary-card">
    <div class="label">Total Gasto</div>
    <div class="value red">${fmt(totalTxAll)}</div>
  </div>
  <div class="summary-card">
    <div class="label">Débito/Pix</div>
    <div class="value blue">${fmt(totalTxDebit)}</div>
  </div>
  <div class="summary-card">
    <div class="label">Crédito</div>
    <div class="value amber">${fmt(totalTxCredit)}</div>
  </div>
  ${hasSavings ? `<div class="summary-card">
    <div class="label">Retiradas Poupança</div>
    <div class="value emerald">${fmt(totalSavingsWithdrawals)}</div>
  </div>` : ''}
  ` : `
  <div class="summary-card">
    <div class="label">Renda no Período</div>
    <div class="value blue">${fmt(totalIncomePeriod)}</div>
  </div>
  <div class="summary-card">
    <div class="label">Total Despesas</div>
    <div class="value red">${fmt(totalExpenses)}</div>
  </div>
  <div class="summary-card">
    <div class="label">Saldo Período</div>
    <div class="value ${balance >= 0 ? 'green' : 'red'}">${fmt(balance)}</div>
  </div>
  ${hasSavings ? `<div class="summary-card">
    <div class="label">Retiradas Poupança</div>
    <div class="value emerald">${fmt(totalSavingsWithdrawals)}</div>
  </div>` : ''}
  `}
</div>

${isProjectReport ? `
<table>
  <tr><th>Descrição</th><th class="right">Valor</th></tr>
  <tr><td>Gastos no projeto (Débito/Pix)</td><td class="right red">${fmt(totalTxDebit)}</td></tr>
  <tr><td>Gastos no projeto (Crédito)</td><td class="right amber">${fmt(totalTxCredit)}</td></tr>
  ${hasSavings ? `<tr><td>Retiradas da poupança</td><td class="right emerald">${fmt(totalSavingsWithdrawals)}</td></tr>` : ''}
  <tr style="font-weight:700;border-top:2px solid #cbd5e1"><td>Total</td><td class="right red">${fmt(totalTxAll + totalSavingsWithdrawals)}</td></tr>
  ${project?.budget ? `<tr><td>Orçamento</td><td class="right blue">${fmt(Number(project.budget))}</td></tr>
  <tr style="font-weight:700"><td>Saldo do orçamento</td><td class="right ${Number(project.budget) - totalTxAll >= 0 ? 'green' : 'red'}">${fmt(Number(project.budget) - totalTxAll)}</td></tr>` : ''}
</table>
` : `
<table>
  <tr><th>Descrição</th><th class="right">Valor</th></tr>
  <tr><td>Renda total (${numMonths} mês${numMonths > 1 ? 'es' : ''})</td><td class="right blue">${fmt(totalIncomePeriod)}</td></tr>
  <tr><td>Contas fixas (Débito/Pix) × ${numMonths}</td><td class="right red">${fmt(totalFixedDebit * numMonths)}</td></tr>
  <tr><td>Assinaturas / Recorrentes × ${numMonths}</td><td class="right amber">${fmt(totalFixedCredit * numMonths)}</td></tr>
  <tr><td>Gastos variáveis (Débito/Pix)</td><td class="right red">${fmt(totalTxDebit)}</td></tr>
  <tr><td>Gastos variáveis (Crédito)</td><td class="right amber">${fmt(totalTxCredit)}</td></tr>
  ${hasSavings ? `<tr><td>Retiradas da poupança <em>(não contam nas despesas)</em></td><td class="right emerald">${fmt(totalSavingsWithdrawals)}</td></tr>` : ''}
  <tr style="font-weight:700;border-top:2px solid #cbd5e1"><td>Saldo</td><td class="right ${balance >= 0 ? 'green' : 'red'}">${fmt(balance)}</td></tr>
</table>
`}

<!-- CONTAS FIXAS E ASSINATURAS -->
${!isProjectReport && !isCategoryReport && (fixedBills.length > 0 || subscriptions.length > 0) ? `
<h2>Gastos Recorrentes</h2>
${fixedBills.length > 0 ? `
<h3>Contas Fixas (Débito/Pix)</h3>
<table>
  <tr><th>Descrição</th><th class="right">Valor/mês</th><th class="right">Período (×${numMonths})</th></tr>
  ${fixedBills.map(f => `
    <tr>
      <td>${f.description}</td>
      <td class="right">${fmt(Number(f.amount))}</td>
      <td class="right" style="font-weight:700">${fmt(Number(f.amount) * numMonths)}</td>
    </tr>
  `).join('')}
  <tr style="font-weight:700;border-top:2px solid #cbd5e1">
    <td>Subtotal</td><td class="right">${fmt(totalFixedDebit)}</td><td class="right">${fmt(totalFixedDebit * numMonths)}</td>
  </tr>
</table>
` : ''}
${subscriptions.length > 0 ? `
<h3>Assinaturas / Recorrentes (Crédito)</h3>
<table>
  <tr><th>Descrição</th><th class="right">Valor/mês</th><th class="right">Período (×${numMonths})</th></tr>
  ${subscriptions.map(f => `
    <tr>
      <td>${f.description}</td>
      <td class="right">${fmt(Number(f.amount))}</td>
      <td class="right" style="font-weight:700">${fmt(Number(f.amount) * numMonths)}</td>
    </tr>
  `).join('')}
  <tr style="font-weight:700;border-top:2px solid #cbd5e1">
    <td>Subtotal</td><td class="right">${fmt(totalFixedCredit)}</td><td class="right">${fmt(totalFixedCredit * numMonths)}</td>
  </tr>
</table>
` : ''}
` : ''}

<!-- RETIRADAS DA POUPANÇA -->
${hasSavings ? `
<div class="savings-section">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
    <div class="savings-title">Retiradas da Poupança</div>
    <span style="font-size:14px;font-weight:700;color:#059669">${fmt(totalSavingsWithdrawals)}</span>
  </div>
  <table>
    <tr><th>Data</th><th>Descrição</th><th>Meta</th><th>Categoria</th><th>Membro</th><th class="right">Valor</th></tr>
    ${savingsWithdrawals.sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()).map(t => {
      const d = new Date(t.transaction_date);
      const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const goalName = t.savings_goal_id ? (savingsGoalNames[t.savings_goal_id] || '-') : '-';
      return `<tr>
        <td>${dateStr}</td>
        <td>${t.description}</td>
        <td><span class="badge badge-emerald">${goalName}</span></td>
        <td>${t.category}</td>
        <td>${memberNames[t.user_id] || '-'}</td>
        <td class="right emerald">${fmt(Number(t.amount))}</td>
      </tr>`;
    }).join('')}
  </table>
</div>
` : ''}

<!-- RESUMO POR MÉTODO DE PAGAMENTO -->
${Object.keys(byPaymentMethod).length > 0 ? `
<h2>Resumo por Método de Pagamento</h2>
<table>
  <tr><th>Método</th><th class="right">Transações</th><th class="right">Total</th><th class="right">%</th></tr>
  ${Object.entries(byPaymentMethod).sort((a, b) => b[1].total - a[1].total).map(([method, d]) => `
    <tr>
      <td><strong>${method}</strong></td>
      <td class="right">${d.count}</td>
      <td class="right" style="font-weight:700">${fmt(d.total)}</td>
      <td class="right">${totalTxAll > 0 ? ((d.total / totalTxAll) * 100).toFixed(1) : '0.0'}%</td>
    </tr>
  `).join('')}
  <tr style="font-weight:700;border-top:2px solid #cbd5e1">
    <td>Total</td><td class="right">${regularTx.length}</td>
    <td class="right">${fmt(totalTxAll)}</td><td class="right">100%</td>
  </tr>
</table>
` : ''}

<!-- MÉDIA MENSAL -->
${numMonths > 1 ? `
<h2>Média Mensal (${numMonths} meses)</h2>
<table>
  <tr><th>Descrição</th><th class="right">Média/mês</th></tr>
  <tr><td>Gastos variáveis (Débito/Pix)</td><td class="right">${fmt(avgMonthlyDebit)}</td></tr>
  <tr><td>Gastos variáveis (Crédito)</td><td class="right amber">${fmt(avgMonthlyCredit)}</td></tr>
  <tr style="font-weight:700;border-top:2px solid #cbd5e1"><td>Total médio/mês</td><td class="right">${fmt(avgMonthly)}</td></tr>
  ${!isProjectReport && !isCategoryReport ? `<tr><td>+ Gastos fixos/mês</td><td class="right">${fmt(totalFixedDebit + totalFixedCredit)}</td></tr>
  <tr style="font-weight:700"><td>Custo de vida médio/mês</td><td class="right red">${fmt(avgMonthly + totalFixedDebit + totalFixedCredit)}</td></tr>` : ''}
</table>
` : ''}

<!-- DESPESAS DEDUTÍVEIS IR -->
${totalDeductible > 0 ? `
<div class="deductible-section">
  <div class="deductible-header">
    <div class="deductible-title">Despesas Dedutíveis no IR</div>
    <span class="badge badge-green">Saúde + Educação</span>
  </div>
  <div style="font-size:9px;color:#166534;margin-bottom:8px">
    Saúde: sem limite de dedução · Educação: limite anual de R$ 3.561,50 por dependente (2024).
  </div>
  <table>
    <tr><th>Categoria</th><th class="right">Qtd</th><th class="right">Total</th></tr>
    ${Object.entries(deductibleByCategory).map(([cat, total]) => {
      const count = deductibleTx.filter(t => t.category === cat).length;
      return `<tr><td><strong>${cat}</strong></td><td class="right">${count}</td><td class="right" style="font-weight:700">${fmt(total)}</td></tr>`;
    }).join('')}
    <tr style="font-weight:700;border-top:2px solid #86efac"><td>Total Dedutível</td><td></td><td class="right green">${fmt(totalDeductible)}</td></tr>
  </table>
  <h3>Detalhamento</h3>
  <table>
    <tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Pagamento</th><th class="right">Valor</th></tr>
    ${deductibleTx.sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()).map(t => {
      const d = new Date(t.transaction_date);
      return `<tr>
        <td>${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
        <td>${t.description}</td>
        <td><span class="badge ${t.category === 'Saúde' ? 'badge-red' : 'badge-purple'}">${t.category}</span></td>
        <td>${t.payment_method === 'credit' ? 'Crédito' : 'Débito/Pix'}${t.installment_total && t.installment_total > 1 ? ` (${t.installment_current}/${t.installment_total}x)` : ''}</td>
        <td class="right">${fmt(Number(t.amount))}</td>
      </tr>`;
    }).join('')}
  </table>
</div>
` : ''}

<!-- POR CATEGORIA -->
${categorySorted.length > 0 ? `
<h2>Despesas por Categoria</h2>
<table>
  <tr><th>Categoria</th><th class="right">Transações</th><th class="right">Débito/Pix</th><th class="right">Crédito</th><th class="right">Total</th><th class="right">%</th></tr>
  ${categorySorted.map(([cat, d]) => `
    <tr>
      <td><strong>${cat}</strong> ${IR_DEDUCTIBLE_CATEGORIES.includes(cat) ? '<span class="badge badge-green">Dedutível</span>' : ''}</td>
      <td class="right">${d.count}</td>
      <td class="right">${fmt(d.debit)}</td>
      <td class="right amber">${fmt(d.credit)}</td>
      <td class="right" style="font-weight:700">${fmt(d.total)}</td>
      <td class="right">${totalTxAll > 0 ? ((d.total / totalTxAll) * 100).toFixed(1) : '0.0'}%</td>
    </tr>
  `).join('')}
  <tr style="font-weight:700;border-top:2px solid #cbd5e1">
    <td>Total</td><td class="right">${regularTx.length}</td>
    <td class="right">${fmt(totalTxDebit)}</td>
    <td class="right amber">${fmt(totalTxCredit)}</td>
    <td class="right">${fmt(totalTxAll)}</td>
    <td class="right">100%</td>
  </tr>
</table>
` : ''}

<!-- POR MÊS -->
<h2>Evolução Mensal</h2>
<table>
  <tr><th>Mês</th><th class="right">Débito/Pix</th><th class="right">Crédito</th>${hasMonthSavings ? '<th class="right emerald">Poupança</th>' : ''}<th class="right">Total</th></tr>
  ${months.sort((a, b) => a - b).map(m => `
    <tr>
      <td>${MESES[m - 1]}</td>
      <td class="right">${fmt(byMonth[m]?.debit || 0)}</td>
      <td class="right amber">${fmt(byMonth[m]?.credit || 0)}</td>
      ${hasMonthSavings ? `<td class="right emerald">${fmt(byMonth[m]?.savings || 0)}</td>` : ''}
      <td class="right" style="font-weight:700">${fmt(byMonth[m]?.total || 0)}</td>
    </tr>
  `).join('')}
</table>

<!-- PARCELAMENTOS -->
${Object.keys(installmentGroups).length > 0 ? `
<h2>Compras Parceladas Ativas</h2>
<table>
  <tr><th>Descrição</th><th>Categoria</th><th class="right">Parcela</th><th class="right">Valor/mês</th><th class="right">Restante</th></tr>
  ${Object.values(installmentGroups).map(g => {
    const remaining = (g.total - g.current) * g.amount;
    return `<tr>
      <td>${g.description}</td><td>${g.category}</td>
      <td class="right"><span class="badge ${g.current === g.total ? 'badge-green' : 'badge-amber'}">${g.current}/${g.total}x</span></td>
      <td class="right">${fmt(g.amount)}</td>
      <td class="right">${g.current === g.total ? '<span class="badge badge-green">Quitado</span>' : fmt(remaining)}</td>
    </tr>`;
  }).join('')}
</table>
` : ''}

<!-- POR MEMBRO -->
${Object.keys(byMember).length > 1 ? `
<h2>Gastos por Membro</h2>
<table>
  <tr><th>Membro</th><th class="right">Total</th><th class="right">%</th></tr>
  ${Object.entries(byMember).sort((a, b) => b[1] - a[1]).map(([name, total]) => {
    const grand = totalTxAll + totalSavingsWithdrawals;
    return `<tr>
      <td>${name}</td>
      <td class="right" style="font-weight:700">${fmt(total)}</td>
      <td class="right">${grand > 0 ? ((total / grand) * 100).toFixed(1) : '0.0'}%</td>
    </tr>`;
  }).join('')}
</table>
` : ''}

<!-- LISTAGEM COMPLETA -->
<div class="page-break"></div>
<h2>Listagem Completa de Transações</h2>
<table>
  <tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Pagamento / Tipo</th><th>Membro</th><th class="right">Valor</th></tr>
  ${transactions.sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()).map(t => {
    const d = new Date(t.transaction_date);
    const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const isDeductible = IR_DEDUCTIBLE_CATEGORIES.includes(t.category);
    const installmentLabel = t.installment_total && t.installment_total > 1 ? ` (${t.installment_current}/${t.installment_total}x)` : '';
    const isSavings = !!t.from_savings;
    const goalName = t.savings_goal_id ? (savingsGoalNames[t.savings_goal_id] || '') : '';
    const paymentLabel = isSavings
      ? `<span class="badge badge-emerald">Poupança${goalName ? ` · ${goalName}` : ''}</span>`
      : `${t.payment_method === 'credit' ? 'Crédito' : 'Débito/Pix'}${installmentLabel}`;
    return `<tr${isSavings ? ' class="savings-row"' : isDeductible ? ' style="background:#f0fdf4"' : ''}>
      <td>${dateStr}</td>
      <td>${t.description}</td>
      <td>${t.category}${isDeductible && !isSavings ? ' <span class="badge badge-green">IR</span>' : ''}</td>
      <td>${paymentLabel}</td>
      <td>${memberNames[t.user_id] || '-'}</td>
      <td class="right${isSavings ? ' emerald' : ''}">${fmt(Number(t.amount))}</td>
    </tr>`;
  }).join('')}
</table>

<div class="footer">
  Relatório gerado automaticamente · ${workspaceName} · ${generatedAt}
</div>

</body>
</html>`;
}
