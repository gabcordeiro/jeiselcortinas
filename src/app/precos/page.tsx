"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  CurrencyDollar, 
  Tag, 
  ArrowsDownUp, 
  FloppyDiskBack, 
  Plus, 
  Trash,
  X,
  Palette,
  Warning
} from "@phosphor-icons/react";

export default function GestorPrecos() {
  const [materiais, setMateriais] = useState<any[]>([]);
  const [taxas, setTaxas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para o Modal de Cadastro
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("tecido");
  const [novoPreco, setNovoPreco] = useState("");
  const [novoFator, setNovoFator] = useState("3");

  // Estados para o Modal de Confirmação de Exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: mat } = await supabase.from('materiais').select('*').order('nome');
    const { data: tax } = await supabase.from('configuracoes_globais').select('*');
    setMateriais(mat || []);
    setTaxas(tax || []);
    setLoading(false);
  }

  // --- FUNÇÕES DE AÇÃO ---

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('materiais').insert([
      { 
        nome: novoNome, 
        categoria: novaCategoria, 
        preco: novaCategoria === 'modelo' ? 0 : Number(novoPreco), // Modelos não têm preço, só fator
        fator: Number(novoFator) 
      }
    ]);

    if (!error) {
      setIsAddModalOpen(false);
      setNovoNome("");
      setNovoPreco("");
      fetchData();
    } else {
      alert("Erro ao salvar: " + error.message);
    }
  };

  const updatePrecoMaterial = async (id: string, novoValor: number) => {
    await supabase.from('materiais').update({ preco: novoValor }).eq('id', id);
  };

  // NOVA FUNÇÃO: Atualiza o Fator do Modelo
  const updateFatorMaterial = async (id: string, novoFator: number) => {
    await supabase.from('materiais').update({ fator: novoFator }).eq('id', id);
  };

  const updateTaxaGlobal = async (chave: string, novoValor: number) => {
    await supabase.from('configuracoes_globais').update({ valor: novoValor }).eq('chave', chave);
  };

  const executeDelete = async () => {
    if (!idToDelete) return;
    await supabase.from('materiais').delete().eq('id', idToDelete);
    setMateriais(materiais.filter(m => m.id !== idToDelete));
    setIsDeleteModalOpen(false);
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Sincronizando tabelas...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <header className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg">
            <CurrencyDollar size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">Gestor de Preços</h1>
            <p className="text-sm text-gray-400">Controle financeiro da Jeisel Cortinas</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
        >
          <Plus size={20} weight="bold" /> Adicionar Material
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
        
        {/* Materiais e Modelos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400 tracking-widest">
              <tr>
                <th className="p-5">Nome</th>
                <th className="p-5">Categoria</th>
                <th className="p-5">Valor / Fator</th>
                <th className="p-5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {materiais.map(m => (
                <tr key={m.id} className="hover:bg-blue-50/10 transition-colors">
                  <td className="p-5 font-bold text-gray-700">{m.nome}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase 
                      ${m.categoria === 'tecido' ? 'bg-blue-100 text-blue-700' : 
                        m.categoria === 'forro' ? 'bg-purple-100 text-purple-700' : 
                        'bg-amber-100 text-amber-700'}`}>
                      {m.categoria}
                    </span>
                  </td>
                  <td className="p-5">
                    {/* Se for modelo, edita o Fator. Se for tecido/forro, edita o Preço. */}
                    {m.categoria === 'modelo' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-bold uppercase">Fator:</span>
                        <input 
                          type="number" 
                          step="0.1"
                          defaultValue={m.fator} 
                          onBlur={(e) => updateFatorMaterial(m.id, Number(e.target.value))}
                          className="w-20 p-2 bg-gray-50 border border-gray-100 rounded-lg focus:border-amber-500 focus:bg-white outline-none font-bold text-sm transition-all"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-bold uppercase">R$</span>
                        <input 
                          type="number" 
                          defaultValue={m.preco} 
                          onBlur={(e) => updatePrecoMaterial(m.id, Number(e.target.value))}
                          className="w-24 p-2 bg-gray-50 border border-gray-100 rounded-lg focus:border-emerald-500 focus:bg-white outline-none font-bold text-sm transition-all"
                        />
                      </div>
                    )}
                  </td>
                  <td className="p-5 text-center">
                    <button 
                      onClick={() => { setIdToDelete(m.id); setIsDeleteModalOpen(true); }}
                      className="text-red-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Taxas Globais */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <h2 className="font-black text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wider"><ArrowsDownUp /> Taxas de Serviço</h2>
            <div className="space-y-5">
              {taxas.map(t => (
                <div key={t.chave} className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase">{t.descricao}</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      defaultValue={t.valor}
                      id={`taxa-${t.chave}`}
                      className="flex-1 p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-blue-600 font-bold text-gray-700"
                    />
                    <button 
                      onClick={() => {
                        const val = (document.getElementById(`taxa-${t.chave}`) as HTMLInputElement).value;
                        updateTaxaGlobal(t.chave, Number(val));
                      }}
                      className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                    >
                      <FloppyDiskBack size={20} weight="bold" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL DE CADASTRO --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <h2 className="text-xl font-black flex items-center gap-2"><Palette size={24} weight="bold" /> Novo Item</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleAddMaterial} className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase">Nome / Descrição</label>
                <input 
                  autoFocus
                  type="text" 
                  value={novoNome} 
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: Linho Nobre ou Prega Fêmea"
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-blue-600 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase">Categoria</label>
                  <select 
                    value={novaCategoria} 
                    onChange={(e) => setNovaCategoria(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-blue-600 font-bold text-sm"
                  >
                    <option value="tecido">Tecido</option>
                    <option value="forro">Forro</option>
                    <option value="modelo">Modelo de Prega</option>
                  </select>
                </div>
                
                {/* Se for Modelo, esconde o campo de Preço, pois Modelos só usam Fator */}
                <div className={`space-y-1.5 ${novaCategoria === 'modelo' ? 'opacity-30 pointer-events-none' : ''}`}>
                  <label className="text-[10px] font-black text-gray-400 uppercase">Preço (R$/m)</label>
                  <input 
                    type="number" 
                    value={novoPreco} 
                    onChange={(e) => setNovoPreco(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-blue-600 font-bold"
                    required={novaCategoria !== 'modelo'}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase">Fator de Consumo Padrão</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={novoFator} 
                  onChange={(e) => setNovoFator(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-blue-600 font-bold"
                  required
                />
              </div>

              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all">
                Salvar no Banco
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE EXCLUSÃO --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-xs w-full text-center space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Warning size={32} weight="bold" />
            </div>
            <h2 className="text-xl font-black text-gray-800">Remover Item?</h2>
            <p className="text-gray-500 text-xs">Isso pode afetar orçamentos futuros que usem este item.</p>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition">Não</button>
              <button onClick={executeDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition">Sim, Sair</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}