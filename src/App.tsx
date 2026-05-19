/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  X, 
  Check, 
  Trash2, 
  Smartphone, 
  Code, 
  Copy, 
  Calendar, 
  TrendingUp, 
  CheckCircle,
  AlertCircle,
  Info,
  CalendarDays,
  Menu,
  CheckCircle2,
  Lock,
  RefreshCw,
  Github
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initialAccounts } from './data/initialAccounts';
import { expoCodeText } from './data/expoCodeText';
import { Account } from './types';

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [filter, setFilter] = useState<'all' | 'paying' | 'receiving'>('all');
  const [activeTab, setActiveTab] = useState<'simulator' | 'code'>('simulator');
  
  const PRESET_CATEGORIES = ['Moradia', 'Transporte', 'Lazer', 'Alimentação', 'Salário', 'Freelance', 'Outros'];

  // Modal / Form state inside Simulator
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState<'paying' | 'receiving'>('paying');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('Moradia');
  const [customCategory, setCustomCategory] = useState('');
  
  // App Notification state
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  
  // Code Copy State
  const [copied, setCopied] = useState(false);

  // Show notification
  const triggerNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Toggle status of account
  const handleToggleStatus = (id: string) => {
    setAccounts(prev => 
      prev.map(acc => {
        if (acc.id === id) {
          const nextStatus = acc.status === 'pending' ? 'completed' : 'pending';
          const msg = acc.type === 'receiving' 
            ? `Baixa dada: ${acc.description} marcada como recebida!` 
            : `Baixa dada: ${acc.description} marcada como paga!`;
          const revertMsg = `Status de ${acc.description} alterado para Pendente.`;
          
          triggerNotification(nextStatus === 'completed' ? msg : revertMsg, 'success');
          return { ...acc, status: nextStatus };
        }
        return acc;
      })
    );
  };

  // Delete account
  const handleDeleteAccount = (id: string, name: string) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
    triggerNotification(`Lançamento "${name}" excluído com sucesso.`, 'info');
  };

  // Add account from Form
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !value.trim() || !dueDate.trim()) {
      triggerNotification('Preencha todos os campos obrigatórios!', 'error');
      return;
    }

    const numericVal = parseFloat(value.replace(',', '.'));
    if (isNaN(numericVal) || numericVal <= 0) {
      triggerNotification('Insira um valor financeiro válido!', 'error');
      return;
    }

    const finalCategory = category === 'Outros' && customCategory.trim() 
      ? customCategory.trim() 
      : category;

    const newAccount: Account = {
      id: Date.now().toString(),
      description: description.trim(),
      value: numericVal,
      type,
      dueDate,
      status: 'pending',
      category: finalCategory,
    };

    setAccounts(prev => [newAccount, ...prev]);
    triggerNotification(`Lançamento "${newAccount.description}" adicionado!`, 'success');
    
    // Clear inputs
    setDescription('');
    setValue('');
    setType('paying');
    setDueDate('');
    setCategory('Moradia');
    setCustomCategory('');
    setIsModalOpen(false);
  };

  // Calculate statistics (Realized balance, future balances, and quick tabs totals)
  const stats = useMemo(() => {
    let receivingTotal = 0; // Total a receber cadastrado
    let payingTotal = 0;    // Total a pagar cadastrado
    
    accounts.forEach(acc => {
      if (acc.type === 'receiving') {
        receivingTotal += acc.value;
      } else {
        payingTotal += acc.value;
      }
    });

    // Realized Balance (Soma Tudo que foi Recebido meno tudo que foi Pago)
    const realizedBalance = accounts.reduce((total, cur) => {
      if (cur.status === 'completed') {
        return cur.type === 'receiving' ? total + cur.value : total - cur.value;
      }
      return total;
    }, 0);

    // Expected Balance (Total Geral planejado se tudo for cumprido)
    const expectedBalance = receivingTotal - payingTotal;

    return {
      receivingTotal,
      payingTotal,
      realizedBalance,
      expectedBalance
    };
  }, [accounts]);

  // Resumo por Categoria
  const categoryStats = useMemo(() => {
    const summary: { [key: string]: { paying: number; receiving: number } } = {};
    accounts.forEach((acc) => {
      const cat = acc.category || 'Outros';
      if (!summary[cat]) {
        summary[cat] = { paying: 0, receiving: 0 };
      }
      if (acc.type === 'paying') {
        summary[cat].paying += acc.value;
      } else {
        summary[cat].receiving += acc.value;
      }
    });
    return Object.keys(summary).map((key) => ({
      name: key,
      ...summary[key],
    }));
  }, [accounts]);

  // Filter accounts for rendering
  const filteredAccounts = useMemo(() => {
    if (filter === 'all') return accounts;
    return accounts.filter(acc => acc.type === filter);
  }, [accounts, filter]);

  // Copy code helper
  const handleCopyCode = () => {
    navigator.clipboard.writeText(expoCodeText);
    setCopied(true);
    triggerNotification('Código copiado com sucesso para a área de transferência!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Restore initial mock states
  const handleResetData = () => {
    setAccounts(initialAccounts);
    setFilter('all');
    triggerNotification('Dados de exemplo restaurados ao padrão.', 'info');
  };

  // Formatter helpers
  const formatPercentage = (numerator: number, denominator: number) => {
    if (denominator === 0) return '0%';
    return `${Math.round((numerator / denominator) * 100)}%`;
  };

  const getPaidPercentage = useMemo(() => {
    const paidCount = accounts.filter(a => a.type === 'paying' && a.status === 'completed').length;
    const totalPay = accounts.filter(a => a.type === 'paying').length;
    return { count: paidCount, total: totalPay, pct: formatPercentage(paidCount, totalPay) };
  }, [accounts]);

  const getReceivedPercentage = useMemo(() => {
    const recCount = accounts.filter(a => a.type === 'receiving' && a.status === 'completed').length;
    const totalRec = accounts.filter(a => a.type === 'receiving').length;
    return { count: recCount, total: totalRec, pct: formatPercentage(recCount, totalRec) };
  }, [accounts]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none antialiased">
      
      {/* Dynamic Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl backdrop-blur-md border ${
              notification.type === 'success' ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30' :
              notification.type === 'info' ? 'bg-sky-950/90 text-sky-200 border-sky-500/30' :
              'bg-rose-950/90 text-rose-200 border-rose-500/30'
            }`}
          >
            {notification.type === 'success' && <CheckCircle size={18} className="text-emerald-400 shrink-0" />}
            {notification.type === 'info' && <Info size={18} className="text-sky-400 shrink-0" />}
            {notification.type === 'error' && <AlertCircle size={18} className="text-rose-400 shrink-0" />}
            <span className="text-sm font-medium tracking-wide font-sans">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Premium Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-2.5 rounded-xl shadow-lg shadow-blue-500/10">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">EP-01</span>
              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase font-semibold">Workspace</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white mt-0.5">Controle de Contas a Pagar e Receber</h1>
          </div>
        </div>

        {/* View Selection Controls */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-full">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'simulator'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone size={14} />
            Simulador Mobile
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'code'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code size={14} />
            Código Expo TS
          </button>
        </div>

        {/* Action Controls for Workspace */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={handleResetData}
            id="workspace-reset-data"
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-colors"
          >
            <RefreshCw size={13} className="text-slate-400" />
            Restaurar Dados Fictícios
          </button>
          <div className="text-slate-500 text-xs font-mono">
            Local: <span className="text-slate-300 font-semibold">BRL R$</span>
          </div>
        </div>
      </header>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col xl:flex-row bg-slate-900 overflow-hidden">
        
        {/* LEFT COLUMN: THE MOBILE SIMULATOR */}
        <div className={`p-4 md:p-8 flex-1 flex flex-col justify-center items-center bg-slate-900 border-r border-slate-850 overflow-y-auto ${
          activeTab === 'code' ? 'hidden xl:flex' : 'flex'
        }`}>
          <div className="w-full max-w-lg mb-4 flex flex-col text-center xl:text-left">
            <span className="text-xs text-blue-400 uppercase tracking-widest font-mono font-bold">Protótipo Funcional</span>
            <h2 className="text-xl md:text-2xl font-black text-white mt-1">Ambiente Mobile Virtual</h2>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              O simulador abaixo roda o código Expo exatamente como projetado para o dispositivo. Simule inclusões, filtros e liquidações de faturas instantaneamente.
            </p>
          </div>

          {/* Interactive Mobile Device Frame */}
          <div className="relative w-full max-w-[390px] h-[780px] bg-slate-950 rounded-[50px] shadow-[0_0_80px_rgba(37,99,235,0.08)] border-[10px] border-slate-950 flex flex-col overflow-hidden ring-4 ring-slate-800/50">
            
            {/* Phone Top Speaker and Camera Notch */}
            <div className="absolute top-0 inset-x-0 h-8 bg-slate-950 flex justify-center items-center z-30 select-none">
              <div className="w-24 h-4 bg-slate-950 rounded-b-2xl flex items-center justify-between px-3">
                <div className="w-10 h-1 bg-neutral-850 rounded-full"></div>
                <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-850"></div>
              </div>
            </div>

            {/* Simulated Operating System Header */}
            <div className="bg-[#0B192C] px-6 pt-9 pb-1 flex justify-between items-center text-[10px] font-bold text-slate-400 font-mono z-20">
              <span>09:41</span>
              <div className="flex items-center gap-1.5">
                <span>5G</span>
                <div className="w-5 h-2.5 rounded border border-slate-400/50 flex items-center p-0.5">
                  <div className="h-full w-4 bg-slate-400 rounded-sm"></div>
                </div>
              </div>
            </div>

            {/* APP WRAPPER */}
            <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative text-slate-900">
              
              {/* Simulated Mobile Header */}
              <div className="bg-[#0B192C] px-5 pt-3 pb-6 rounded-b-[24px] shadow-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Controle Financeiro</span>
                  <h3 className="text-lg font-black text-white mt-0.5">BudgetMaster</h3>
                </div>
                
                {/* Simulated Nova Conta Trigger */}
                <button
                  onClick={() => setIsModalOpen(true)}
                  id="mobile-add-bill-button"
                  className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-md shadow-blue-500/20"
                >
                  <Plus size={14} className="stroke-[3]" />
                  <span>Nova Conta</span>
                </button>
              </div>

              {/* Scrollable Mobile Canvas */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                
                {/* Dynamic Summary Cards */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">Resumo Financeiro</h4>
                  
                  {/* Balance Card Container */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
                    <span className="text-[11px] font-semibold text-slate-400 tracking-wide uppercase">Saldo das Contas Efetuadas</span>
                    <span className={`text-2xl font-black font-mono tracking-tight mt-1 ${
                      stats.realizedBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {stats.realizedBalance < 0 ? '-' : ''}R$ {Math.abs(stats.realizedBalance).toFixed(2).replace('.', ',')}
                    </span>
                    
                    <div className="h-px bg-slate-100 my-3"></div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Lançamentos Gerais Previstos:</span>
                      <span className="font-bold text-slate-700 font-mono">
                        {stats.expectedBalance < 0 ? '-' : ''}BRL {Math.abs(stats.expectedBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Lado a Lado Highlights */}
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    
                    {/* Receitas Badge */}
                    <div className="bg-white rounded-2xl p-3 border border-slate-100 border-l-4 border-l-emerald-500 flex flex-col shadow-sm">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">A Receber</span>
                      <span className="text-sm font-black text-emerald-600 font-mono mt-0.5">
                        R$ {stats.receivingTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400">
                        <span>Efetuado:</span>
                        <span className="font-semibold text-emerald-600 font-mono">{getReceivedPercentage.pct}</span>
                      </div>
                    </div>

                    {/* Despesas Badge */}
                    <div className="bg-white rounded-2xl p-3 border border-slate-100 border-l-4 border-l-rose-500 flex flex-col shadow-sm">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">A Pagar</span>
                      <span className="text-sm font-black text-rose-600 font-mono mt-0.5">
                        R$ {stats.payingTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400">
                        <span>Pago:</span>
                        <span className="font-semibold text-rose-600 font-mono">{getPaidPercentage.pct}</span>
                      </div>
                    </div>

                  </div>

                  {/* Resumo de Despesas/Receitas por Categoria */}
                  <div className="mt-3 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
                    <span className="text-[11px] font-bold text-slate-400 tracking-wide uppercase">Resumo por Categoria</span>
                    <div className="space-y-3 mt-2.5">
                      {categoryStats.length === 0 ? (
                        <p className="text-[11px] text-slate-400">Nenhuma categoria registrada.</p>
                      ) : (
                        categoryStats.map((item, idx) => {
                          const total = item.receiving + item.paying;
                          const recPct = total > 0 ? (item.receiving / total) * 100 : 0;
                          return (
                            <div key={idx} className="flex flex-col gap-1">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="font-bold text-slate-700">{item.name}</span>
                                <div className="flex gap-2">
                                  {item.receiving > 0 && <span className="text-emerald-500 font-mono font-extrabold">+{item.receiving.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                                  {item.paying > 0 && <span className="text-rose-500 font-mono font-extrabold">-{item.paying.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                                </div>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                <div className="bg-emerald-500 h-full" style={{ width: `${recPct}%` }}></div>
                                <div className="bg-rose-500 h-full" style={{ width: `${100 - recPct}%` }}></div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>

                {/* Filter Selector Row */}
                <div>
                  <div className="flex justify-between items-center mb-2.5 px-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Minhas Contas</h4>
                    <span className="text-[10px] text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-full font-bold">
                      {filteredAccounts.length} item(s)
                    </span>
                  </div>
                  
                  {/* Visual Filter Buttons */}
                  <div className="bg-slate-200/60 p-1 rounded-xl flex items-center">
                    <button
                      onClick={() => setFilter('all')}
                      className={`flex-1 py-1.5 text-center rounded-lg text-xs font-bold transition-all ${
                        filter === 'all' 
                          ? 'bg-white text-[#0B192C] shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Todas
                    </button>
                    <button
                      onClick={() => setFilter('receiving')}
                      className={`flex-1 py-1.5 text-center rounded-lg text-xs font-bold transition-all ${
                        filter === 'receiving' 
                          ? 'bg-white text-[#0B192C] shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      A Receber
                    </button>
                    <button
                      onClick={() => setFilter('paying')}
                      className={`flex-1 py-1.5 text-center rounded-lg text-xs font-bold transition-all ${
                        filter === 'paying' 
                          ? 'bg-white text-[#0B192C] shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      A Pagar
                    </button>
                  </div>
                </div>

                {/* Account list container */}
                <div className="space-y-3 pb-8">
                  {filteredAccounts.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80">
                      <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                        Nenhuma conta encontrada neste filtro. Adicione novas clicando em "+ Nova Conta".
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {filteredAccounts.map(account => {
                        const isReceiving = account.type === 'receiving';
                        const isCompleted = account.status === 'completed';
                        
                        return (
                          <motion.div
                            key={account.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl overflow-hidden border border-slate-100 flex shadow-sm hover:shadow-md transition-shadow"
                          >
                            {/* Colorful Left indicator */}
                            <div className={`w-1.5 shrink-0 ${
                              isReceiving ? 'bg-emerald-500' : 'bg-rose-500'
                            }`} />

                            {/* Card Content block */}
                            <div className="flex-1 p-3.5 flex flex-col">
                              {/* Title and Cash row */}
                              <div className="flex items-start justify-between">
                                <div className="flex flex-col">
                                  <span className="font-bold text-[13px] text-slate-800 leading-tight block mr-2 break-words text-left" title={account.description}>
                                    {account.description}
                                  </span>
                                  {/* Badge de Categoria */}
                                  <span className="mt-1 self-start inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100/80 text-slate-500">
                                    {account.category || 'Geral'}
                                  </span>
                                </div>
                                <span className={`font-extrabold font-mono text-[13px] tracking-tight shrink-0 ${
                                  isReceiving ? 'text-emerald-500' : 'text-rose-500'
                                }`}>
                                  {isReceiving ? '+' : '-'} R$ {account.value.toFixed(2).replace('.', ',')}
                                </span>
                              </div>

                              {/* Due date and Badge Info */}
                              <div className="flex justify-between items-center mt-2 pb-2.5 border-b border-dashed border-slate-100">
                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                                  <CalendarDays size={11} className="text-slate-300" />
                                  <span>Vence em: {account.dueDate.split('-').reverse().join('/')}</span>
                                </div>

                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                  isCompleted 
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                                }`}>
                                  {isCompleted ? (isReceiving ? 'Recebido' : 'Pago') : 'Pendente'}
                                </span>
                              </div>

                              {/* Mobile actions footer */}
                              <div className="flex items-center gap-2 mt-2.5">
                                <button
                                  onClick={() => handleToggleStatus(account.id)}
                                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                                    isCompleted 
                                      ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' 
                                      : 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100'
                                  }`}
                                >
                                  {isCompleted ? (
                                    <>
                                      <RefreshCw size={10} className="stroke-[2.5]" />
                                      <span>Reabrir Lançamento</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check size={10} className="stroke-[2.5]" />
                                      <span>Dar Baixa (Receber/Pagar)</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={() => handleDeleteAccount(account.id, account.description)}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-100 transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>

                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>

              </div>

              {/* Simulated iPhone Home Bar */}
              <div className="absolute bottom-0 inset-x-0 h-4 bg-slate-950 flex justify-center items-center select-none z-30">
                <div className="w-28 h-1 bg-slate-500/50 rounded-full"></div>
              </div>

              {/* BOTTOM SLIDE-UP CADASTRO MODAL */}
              <AnimatePresence>
                {isModalOpen && (
                  <motion.div
                    key="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/60 z-40 flex flex-col justify-end"
                    onClick={() => setIsModalOpen(false)}
                  >
                    <motion.div
                      key="modal-body"
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-t-3xl p-5 shadow-2xl max-h-[85%] overflow-y-auto block relative"
                    >
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                        <span className="font-extrabold text-sm text-[#0B192C]">Adicionar Nova Conta</span>
                        <button 
                          onClick={() => setIsModalOpen(false)}
                          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400/80 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <form onSubmit={handleAddAccount} className="space-y-4">
                        
                        {/* Descricao */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Descrição do Lançamento *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Aluguel, Proj. Freelance"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800"
                          />
                        </div>

                        {/* Valor */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Valor do Título (R$) *</label>
                          <input
                            type="text"
                            required
                            pattern="[0-9]*[.,]?[0-9]*"
                            placeholder="0.00"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full text-xs font-mono font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800"
                          />
                        </div>

                        {/* Data Vencimento */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Data de Vencimento *</label>
                          <input
                            type="date"
                            required
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800"
                          />
                        </div>

                        {/* Categoria */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Categoria *</label>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {PRESET_CATEGORIES.map((catName) => (
                              <button
                                type="button"
                                key={catName}
                                onClick={() => setCategory(catName)}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                                  category === catName
                                    ? 'bg-blue-50 border-blue-400 text-blue-600'
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                }`}
                              >
                                {catName}
                              </button>
                            ))}
                          </div>
                          {category === 'Outros' && (
                            <input
                              type="text"
                              required
                              placeholder="Digite a categoria personalizada..."
                              value={customCategory}
                              onChange={(e) => setCustomCategory(e.target.value)}
                              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800"
                            />
                          )}
                        </div>

                        {/* Tipo de Lançamento Toggle */}
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tipo de Fluxo</span>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setType('receiving')}
                              className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                                type === 'receiving' 
                                  ? 'bg-emerald-50 border-emerald-400 text-emerald-600' 
                                  : 'bg-slate-50 border-slate-250 text-slate-500'
                              }`}
                            >
                              Receber (Receita)
                            </button>
                            <button
                              type="button"
                              onClick={() => setType('paying')}
                              className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                                type === 'paying' 
                                  ? 'bg-rose-50 border-rose-400 text-rose-600' 
                                  : 'bg-slate-50 border-slate-250 text-slate-500'
                              }`}
                            >
                              Pagar (Despesa)
                            </button>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-colors cursor-pointer"
                        >
                          Adicionar à Minha Lista
                        </button>

                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: CODE VIEWER & USER INSTRUCTIONS */}
        <div className={`flex-1 p-6 md:p-8 flex flex-col bg-slate-950/40 overflow-y-auto ${
          activeTab === 'simulator' ? 'hidden xl:flex' : 'flex'
        }`}>
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-blue-400 uppercase tracking-widest font-mono font-bold">Arquitetura de Exportação</span>
              <h2 className="text-xl md:text-2xl font-black text-white mt-1">Código-Fonte React Native (Expo)</h2>
              <p className="text-slate-400 text-xs mt-1">
                Implementação nativa do BudgetMaster modularizada com StyleSheet, TypeScript, Hooks e Modals dinâmicos.
              </p>
            </div>

            <button
              onClick={handleCopyCode}
              id="copy-expo-source-code-button"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-colors shrink-0 shadow-lg shadow-blue-500/10"
            >
              {copied ? <Check size={14} className="stroke-[2.5]" /> : <Copy size={14} />}
              {copied ? 'Copiado!' : 'Copiar Código'}
            </button>
          </div>

          {/* Code Viewer Sandbox */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden max-h-[580px]">
            {/* Window bar */}
            <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800 select-none">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-rose-500/85"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-amber-500/85"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/85"></div>
                <span className="text-xs text-slate-400 ml-2 font-mono">App.tsx</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                <Lock size={10} />
                <span>ReadOnly</span>
              </div>
            </div>

            {/* Actual Code Area */}
            <div className="flex-1 overflow-auto p-4 md:p-6 text-xs font-mono text-slate-300 leading-relaxed bg-[#0F172A]">
              <pre className="font-mono text-[11px] select-text">
                <code>
                  {expoCodeText.split('\n').map((line, idx) => {
                    // Quick coloring rules for code presentation in UI
                    let className = "text-slate-300";
                    if (line.match(/^\/\/.*$/)) {
                      className = "text-green-500";
                    } else if (line.match(/(import|const|interface|export|default|function|return|let|if)/)) {
                      className = "text-indigo-400";
                    }
                    return (
                      <div key={idx} className="hover:bg-slate-800/40 px-1 rounded flex">
                        <span className="w-8 shrink-0 select-none text-slate-500/80 text-right pr-3">{idx + 1}</span>
                        <span className={className}>{line}</span>
                      </div>
                    );
                  })}
                </code>
              </pre>
            </div>
          </div>

          {/* Quick Setup Instructions Cards */}
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Guia de Implementação Rápida</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/60 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                    <span className="bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-md font-mono text-[10px]">1</span>
                    Instalação da CLI Expo
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Abra o seu terminal no computador e execute o comando abaixo para iniciar um projeto Expo TypeScript:
                  </p>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg text-[10px] text-blue-400 font-mono mt-3 break-all select-text">
                  npx create-expo-app MyFinanceApp --template tabs
                </div>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/60 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                    <span className="bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-md font-mono text-[10px]">2</span>
                    Importar do App.tsx
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Crie ou substitua o seu arquivo principal <span className="font-mono text-slate-300">App.tsx</span> na raiz do seu projeto criado pelo código fornecido acima.
                  </p>
                </div>
                <div className="bg-slate-950/80 px-2 py-1.5 rounded text-[11px] border border-slate-850/60 text-slate-400 font-mono mt-3 select-none">
                  ✔ Suporta iOS, Android e Web
                </div>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/60 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                    <span className="bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-md font-mono text-[10px]">3</span>
                    Visualizar no Celular
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Baixe o aplicativo "Expo Go" na loja do seu smartphone (App Store ou Google Play), rode `npx expo start` e escaneie o código QR!
                  </p>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg text-[10px] text-blue-400 font-mono mt-3 select-all">
                  npx expo start --go
                </div>
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* Footer statistics and metadata indicators */}
      <footer className="border-t border-slate-850 bg-slate-950/60 p-4 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 animate-pulse"></span>
          <span>Ambiente Virtual Conectado</span>
          <span className="text-slate-700">|</span>
          <span>Sucesso de Compilação React (Vite/TS)</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-400">Desenvolvimento com Design Inteligente</span>
          <span className="text-slate-700">|</span>
          <span className="font-mono text-[10px]">Ver. 1.0.4 (Expo SDK 51)</span>
        </div>
      </footer>

    </div>
  );
}
