// src/lib/data.ts

export const DB = {
  modelos: [
    { id: 'wave', nome: 'Wave', fator: 2.9 }, { id: 'unica', nome: 'Prega Única', fator: 2.1 },
    { id: 'dupla', nome: 'Pregas Duplas', fator: 2.7 }, { id: 'americana', nome: 'Pregas Americanas', fator: 2.85 },
    { id: 'macho', nome: 'Pregas Macho', fator: 2.85 }, { id: 'ilhos', nome: 'Ilhós', fator: 3.0 },
    { id: 'cos', nome: 'Cós', fator: 3.0 }, { id: 'franzida', nome: 'Franzida', fator: 3.0 }
  ],
  tecidos: [
    { id: 'nenhum', nome: 'Sem Tecido (Só Forro)', preco: 0 },
    { id: 'flame', nome: 'Flame (Linho)', preco: 35.00 },
    { id: 'voil', nome: 'Voil', preco: 21.70 }
  ],
  forros: [
    { id: 'nenhum', nome: 'Sem Forro', preco: 0, tipo: 'none' },
    { id: 'microfibra', nome: 'Microfibra', preco: 18.95, tipo: 'mult', fator: 1.6 },
    { id: 'bk70', nome: 'Blackout 70%', preco: 35.00, tipo: 'bk' },
    { id: 'bk100', nome: 'Blackout 100%', preco: 45.71, tipo: 'bk' }
  ],
  costuras: [
    { id: 'padrao', nome: 'Padrão / Simples', so_cort: 128, cort_forro: 135, so_forro: 50.18 },
    { id: 'bainha', nome: 'Bainha Superposta', so_cort: 141, cort_forro: 148.40, so_forro: 50.18 },
    { id: 'barra', nome: 'Barra', so_cort: 158, cort_forro: 166, so_forro: 50.18 },
    { id: 'palito', nome: 'Ponto Palito', so_cort: 189, cort_forro: 205, so_forro: 50.18 },
    { id: 'p1', nome: '1 Prega Religiosa', so_cort: 188.54, cort_forro: 195.54, so_forro: 50.18 },
    { id: 'p2', nome: '2 Pregas', so_cort: 249.08, cort_forro: 256.08, so_forro: 50.18 },
    { id: 'p3', nome: '3 Pregas', so_cort: 309.62, cort_forro: 316.62, so_forro: 50.18 },
    { id: 'p4', nome: '4 Pregas', so_cort: 370.16, cort_forro: 377.16, so_forro: 50.18 }
  ]
};

export const TAXAS = { 
  inst_padrao: 44.60, inst_alta: 60.21, min_resid: 120.00, 
  retirada: 27.88, pendurar_extra: 22.30, pendurar_misto: 80.00, 
  km_livre: 20, km_valor: 3.35 
};