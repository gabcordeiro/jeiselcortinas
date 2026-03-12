import { create } from 'zustand';

export type Pedido = {
  id: number;
  cliente: string;
  data: string;
  qtdJanelas: number;
  total: number;
  status: 'andamento' | 'processado' | 'montagem' | 'finalizado';
};

interface LojaDePedidos {
  pedidos: Pedido[];
  adicionarPedido: (pedido: Pedido) => void;
  atualizarStatus: (id: number, novoStatus: Pedido['status']) => void;
  excluirPedido: (id: number) => void;
}

export const useStore = create<LojaDePedidos>((set) => ({
  pedidos: [],
  
  adicionarPedido: (pedido) => set((state) => ({ 
    pedidos: [pedido, ...state.pedidos] 
  })),
  
  atualizarStatus: (id, novoStatus) => set((state) => ({
    pedidos: state.pedidos.map(p => p.id === id ? { ...p, status: novoStatus } : p)
  })),
  
  excluirPedido: (id) => set((state) => ({
    pedidos: state.pedidos.filter(p => p.id !== id)
  }))
}));