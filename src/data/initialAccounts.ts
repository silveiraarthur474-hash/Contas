import { Account } from '../types';

export const initialAccounts: Account[] = [
  {
    id: '1',
    description: 'Salário Mensal',
    value: 5000.00,
    type: 'receiving',
    dueDate: '2026-06-05',
    status: 'completed', // Recebido
    category: 'Salário',
  },
  {
    id: '2',
    description: 'Freelance Design',
    value: 1200.00,
    type: 'receiving',
    dueDate: '2026-06-12',
    status: 'pending', // Pendente
    category: 'Freelance',
  },
  {
    id: '3',
    description: 'Aluguel da Casa',
    value: 1500.00,
    type: 'paying',
    dueDate: '2026-06-10',
    status: 'pending', // Pendente
    category: 'Moradia',
  },
  {
    id: '4',
    description: 'Conta de Luz',
    value: 250.00,
    type: 'paying',
    dueDate: '2026-05-28',
    status: 'completed', // Pago
    category: 'Moradia',
  },
];
