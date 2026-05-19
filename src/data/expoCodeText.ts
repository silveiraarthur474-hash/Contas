export const expoCodeText = `import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';

// Interfaces
interface Account {
  id: string;
  description: string;
  value: number;
  type: 'paying' | 'receiving'; // paying = A Pagar, receiving = A Receber
  dueDate: string;
  status: 'pending' | 'completed'; // pending = Pendente, completed = Pago/Recebido
  category: string;
}

// Inicial Mock Data
const INITIAL_ACCOUNTS: Account[] = [
  {
    id: '1',
    description: 'Salário Mensal',
    value: 5000.00,
    type: 'receiving',
    dueDate: '2026-06-05',
    status: 'completed',
    category: 'Salário',
  },
  {
    id: '2',
    description: 'Freelance Design',
    value: 1200.00,
    type: 'receiving',
    dueDate: '2026-06-12',
    status: 'pending',
    category: 'Freelance',
  },
  {
    id: '3',
    description: 'Aluguel da Casa',
    value: 1500.00,
    type: 'paying',
    dueDate: '2026-06-10',
    status: 'pending',
    category: 'Moradia',
  },
  {
    id: '4',
    description: 'Conta de Luz',
    value: 250.00,
    type: 'paying',
    dueDate: '2026-05-28',
    status: 'completed',
    category: 'Moradia',
  },
];

const PRESET_CATEGORIES = ['Moradia', 'Transporte', 'Lazer', 'Alimentação', 'Salário', 'Freelance', 'Outros'];

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [filter, setFilter] = useState<'all' | 'paying' | 'receiving'>('all');
  
  // Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState<'paying' | 'receiving'>('paying');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('Moradia');
  const [customCategory, setCustomCategory] = useState('');

  // 1. Cálculos de Saldo e Totais (Dynamic Dashboard state)
  const dashboardStats = useMemo(() => {
    let toReceive = 0;
    let toPay = 0;
    
    accounts.forEach((acc) => {
      if (acc.type === 'receiving') {
        toReceive += acc.value;
      } else {
        toPay += acc.value;
      }
    });

    const totalReceivedPaid = accounts.reduce((acc, current) => {
      if (current.status === 'completed') {
        return current.type === 'receiving' ? acc + current.value : acc - current.value;
      }
      return acc;
    }, 0);

    const expectedBalance = toReceive - toPay;

    return {
      toReceive,
      toPay,
      totalReceivedPaid,
      expectedBalance,
    };
  }, [accounts]);

  // 2. Resumo por Categoria
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

  // 3. Filtros de Lista
  const filteredAccounts = useMemo(() => {
    if (filter === 'all') return accounts;
    return accounts.filter((acc) => acc.type === filter);
  }, [accounts, filter]);

  // Função para dar baixa em uma conta (Alternar Status)
  const handleToggleStatus = (id: string) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === id) {
          const nextStatus = acc.status === 'pending' ? 'completed' : 'pending';
          return { ...acc, status: nextStatus };
        }
        return acc;
      })
    );
  };

  // Função para excluir uma conta da lista
  const handleDeleteAccount = (id: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Deseja realmente remover esta conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => {
            setAccounts((prev) => prev.filter((acc) => acc.id !== id));
          }
        }
      ]
    );
  };

  // Adicionar Nova Conta
  const handleAddAccount = () => {
    if (!description.trim() || !value.trim() || !dueDate.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const numericValue = parseFloat(value.replace(',', '.'));
    if (isNaN(numericValue) || numericValue <= 0) {
      Alert.alert('Erro', 'Por favor, digite um valor numérico válido.');
      return;
    }

    const finalCategory = category === 'Outros' && customCategory.trim() 
      ? customCategory.trim() 
      : category;

    const newAccount: Account = {
      id: Date.now().toString(),
      description: description.trim(),
      value: numericValue,
      type,
      dueDate,
      status: 'pending',
      category: finalCategory,
    };

    setAccounts((prev) => [newAccount, ...prev]);
    
    // Reset Form
    setDescription('');
    setValue('');
    setType('paying');
    setDueDate('');
    setCategory('Moradia');
    setCustomCategory('');
    setModalVisible(false);
  };

  // Formatadores Auxiliares
  const formatCurrency = (val: number) => {
    return 'R$ ' + val.toFixed(2).replace('.', ',').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.');
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return \`\${parts[2]}/\${parts[1]}/\${parts[0]}\`;
    }
    return dateStr;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B192C" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Controle Financeiro</Text>
          <Text style={styles.headerTitle}>BudgetMaster</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Nova Conta</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Dashboard Superior */}
        <View style={styles.dashboard}>
          <Text style={styles.sectionTitle}>Resumo Financeiro</Text>
          
          {/* Card Principal de Saldo */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Saldo das Contas Efetuadas</Text>
            <Text style={[
              styles.balanceValue,
              { color: dashboardStats.totalReceivedPaid >= 0 ? '#10B981' : '#EF4444' }
            ]}>
              {formatCurrency(dashboardStats.totalReceivedPaid)}
            </Text>
            <View style={styles.divider} />
            <View style={styles.expectedRow}>
              <Text style={styles.expectedLabel}>Saldo Previsto Total:</Text>
              <Text style={styles.expectedValue}>
                {formatCurrency(dashboardStats.expectedBalance)}
              </Text>
            </View>
          </View>

          {/* Cards Rápidos Lado a Lado */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, styles.statBoxReceive]}>
              <Text style={styles.statLabel}>A Receber</Text>
              <Text style={styles.statValueGreen}>
                {formatCurrency(dashboardStats.toReceive)}
              </Text>
            </View>

            <View style={[styles.statBox, styles.statBoxPay]}>
              <Text style={styles.statLabel}>A Pagar</Text>
              <Text style={styles.statValueRed}>
                {formatCurrency(dashboardStats.toPay)}
              </Text>
            </View>
          </View>

          {/* NOVO: Resumo de Despesas/Receitas por Categoria */}
          <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Resumo por Categoria</Text>
          <View style={styles.categorySummaryCard}>
            {categoryStats.length === 0 ? (
              <Text style={styles.emptyText}>Sem categorias registradas.</Text>
            ) : (
              categoryStats.map((item, idx) => {
                const totalInCat = item.receiving + item.paying;
                const recPct = totalInCat > 0 ? (item.receiving / totalInCat) * 100 : 0;
                return (
                  <View key={idx} style={styles.categoryStatRow}>
                    <View style={styles.catInfoRow}>
                      <Text style={styles.categoryNameText}>{item.name}</Text>
                      <View style={styles.catValues}>
                        {item.receiving > 0 && (
                          <Text style={styles.catGreenText}>+{formatCurrency(item.receiving)}</Text>
                        )}
                        {item.paying > 0 && (
                          <Text style={styles.catRedText}>-{formatCurrency(item.paying)}</Text>
                        )}
                      </View>
                    </View>
                    {/* Visual Bar Indicator */}
                    <View style={styles.barContainer}>
                      <View style={[styles.barValueReceive, { width: \`\${recPct}%\` }]} />
                      <View style={[styles.barValuePay, { width: \`\${100 - recPct}%\` }]} />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Filtros Rápidos */}
        <View style={styles.filterContainer}>
          <Text style={styles.sectionTitle}>Minhas Contas</Text>
          <View style={styles.filterRow}>
            {(['all', 'receiving', 'paying'] as const).map((item) => {
              const label = item === 'all' ? 'Todas' : item === 'receiving' ? 'A Receber' : 'A Pagar';
              const isSelected = filter === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.filterButton, isSelected && styles.filterButtonActive]}
                  onPress={() => setFilter(item)}
                >
                  <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Lista de Contas */}
        {filteredAccounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma conta encontrada neste filtro.</Text>
          </View>
        ) : (
          filteredAccounts.map((account) => {
            const isReceiving = account.type === 'receiving';
            const isCompleted = account.status === 'completed';

            return (
              <View key={account.id} style={styles.accountCard}>
                <View style={[
                  styles.cardIndicator, 
                  { backgroundColor: isReceiving ? '#10B981' : '#EF4444' }
                ]} />
                
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.accountDescription} numberOfLines={1}>
                        {account.description}
                      </Text>
                      {/* Badge de Categoria */}
                      <View style={styles.miniCategoryBadge}>
                        <Text style={styles.miniCategoryText}>{account.category || 'Geral'}</Text>
                      </View>
                    </View>
                    <Text style={[
                      styles.accountValue,
                      { color: isReceiving ? '#10B981' : '#EF4444' }
                    ]}>
                      {isReceiving ? '+' : '-'} {formatCurrency(account.value)}
                    </Text>
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.cardMeta}>
                      <Text style={styles.dueLabel}>Vencimento:</Text>
                      <Text style={styles.dueDateText}>{formatDate(account.dueDate)}</Text>
                    </View>

                    {/* Status Badge */}
                    <View style={[
                      styles.statusBadge,
                      isCompleted ? styles.badgeCompleted : styles.badgePending
                    ]}>
                      <Text style={[
                        styles.badgeText,
                        isCompleted ? styles.badgeTextCompleted : styles.badgeTextPending
                      ]}>
                        {isCompleted ? (isReceiving ? 'Recebido' : 'Pago') : 'Pendente'}
                      </Text>
                    </View>
                  </View>

                  {/* Ações */}
                  <View style={styles.actionRowContainer}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        isCompleted ? styles.actionButtonRevert : styles.actionButtonComplete
                      ]}
                      onPress={() => handleToggleStatus(account.id)}
                    >
                      <Text style={styles.actionButtonText}>
                        {isCompleted ? 'Reabrir Conta' : (isReceiving ? 'Dar Baixa (Receber)' : 'Dar Baixa (Pagar)')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteAccount(account.id)}
                    >
                      <Text style={styles.deleteButtonText}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal de Cadastro */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Nova Conta</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Inputs */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Descrição *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Conta de Internet, Cliente X..."
                  placeholderTextColor="#A0AEC0"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Valor (R$) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#A0AEC0"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={setValue}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Vencimento (AAAA-MM-DD) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2026-06-15"
                  placeholderTextColor="#A0AEC0"
                  value={dueDate}
                  onChangeText={setDueDate}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Categoria *</Text>
                <View style={styles.categoryPresetContainer}>
                  {PRESET_CATEGORIES.map((catName) => (
                    <TouchableOpacity
                      key={catName}
                      style={[
                        styles.categoryPresetButton,
                        category === catName && styles.categoryPresetButtonActive
                      ]}
                      onPress={() => setCategory(catName)}
                    >
                      <Text style={[
                        styles.categoryPresetText,
                        category === catName && styles.categoryPresetTextActive
                      ]}>
                        {catName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {category === 'Outros' && (
                  <TextInput
                    style={[styles.input, { marginTop: 10 }]}
                    placeholder="Digite o nome da outra categoria..."
                    placeholderTextColor="#A0AEC0"
                    value={customCategory}
                    onChangeText={setCustomCategory}
                  />
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Tipo de Lançamento</Text>
                <View style={styles.typeSelectorRow}>
                  <TouchableOpacity
                    style={[
                      styles.typeSelector,
                      type === 'receiving' && styles.typeSelectorActiveGreen
                    ]}
                    onPress={() => setType('receiving')}
                  >
                    <Text style={[
                      styles.typeSelectorText,
                      type === 'receiving' && styles.typeSelectorTextActive
                    ]}>
                      A Receber (Receita)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeSelector,
                      type === 'paying' && styles.typeSelectorActiveRed
                    ]}
                    onPress={() => setType('paying')}
                  >
                    <Text style={[
                      styles.typeSelectorText,
                      type === 'paying' && styles.typeSelectorTextActive
                    ]}>
                      A Pagar (Despesa)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleAddAccount}>
                <Text style={styles.submitButtonText}>Salvar Conta</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    backgroundColor: '#0B192C',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: 'System',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'System',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  dashboard: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  expectedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expectedLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  expectedValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  statBoxReceive: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  statBoxPay: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValueGreen: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  statValueRed: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  categorySummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryStatRow: {
    marginBottom: 14,
  },
  catInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  catValues: {
    flexDirection: 'row',
    gap: 8,
  },
  catGreenText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#10B981',
  },
  catRedText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  barContainer: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barValueReceive: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  barValuePay: {
    height: '100%',
    backgroundColor: '#EF4444',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  filterButtonTextActive: {
    color: '#0B192C',
    fontWeight: '700',
  },
  accountCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardIndicator: {
    width: 6,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  miniCategoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  miniCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  accountValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginRight: 4,
  },
  dueDateText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeCompleted: {
    backgroundColor: '#D1FAE5',
  },
  badgePending: {
    backgroundColor: '#FFEDD5',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextCompleted: {
    color: '#065F46',
  },
  badgeTextPending: {
    color: '#9A3412',
  },
  actionRowContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonComplete: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionButtonRevert: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B192C',
  },
  closeModalText: {
    fontSize: 20,
    color: '#64748B',
    fontWeight: 'bold',
    padding: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  categoryPresetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  categoryPresetButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  categoryPresetButtonActive: {
    backgroundColor: '#EBF5FF',
    borderColor: '#3B82F6',
  },
  categoryPresetText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  categoryPresetTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  typeSelector: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  typeSelectorActiveGreen: {
    borderColor: '#10B981',
    backgroundColor: '#E6F4EA',
  },
  typeSelectorActiveRed: {
    borderColor: '#EF4444',
    backgroundColor: '#FCE8E6',
  },
  typeSelectorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  typeSelectorTextActive: {
    color: '#0B192C',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
`;
