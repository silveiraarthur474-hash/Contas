/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Account {
  id: string;
  description: string;
  value: number;
  type: 'paying' | 'receiving'; // paying = A Pagar, receiving = A Receber
  dueDate: string;
  status: 'pending' | 'completed'; // pending = Pendente, completed = Pago/Recebido
  category: string;
}
