"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, MagnifyingGlass, Check, XCircle, X, MathOperations, Palette, Scissors, Wrench, Ruler, HardHat, PencilSimple } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { DB } from "@/lib/data";

// --- Funções Auxiliares de Cálculo ---
function calcularConsumoBK(largura: number) {
  if (largura <= 4.5) return largura + 0.90;
  if (largura <= 6.0) return largura + 1.35;
  const extraParts = Math.ceil((largura - 6.0) / 1.50);
  return largura + 1.35 + (extraParts * 0.45);
}

const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

export default function Orcamentos() {
  const router = useRouter();

  // Estados dos Dados Dinâmicos do Banco
  const [dbTecidos, setDbTecidos] = useState<any[]>([]);
  const [dbForros, setDbForros] = useState<any[]>([]);
  const [dbModelos, setDbModelos] = useState<any[]>([]);
  const [dbTaxas, setDbTaxas] = useState<any>({});
  const [pricesLoaded, setPricesLoaded] = useState(false);

  // Estados do Formulário e Carrinho
  const [cliente, setCliente] = useState("");
  const [km, setKm] = useState(0);
  const [cart, setCart] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado de Edição do Pedido Global (Vindo do Histórico)
  const [editId, setEditId] = useState<number | null>(null);

  // Estado de Edição do Item do Carrinho
  const [editingCartItemId, setEditingCartItemId] = useState<number | null>(null);

  const [nomeAmbiente, setNomeAmbiente] = useState("");
  const [largura, setLargura] = useState("");
  const [altura, setAltura] = useState("");
  const [modeloId, setModeloId] = useState("");
  const [costuraId, setCosturaId] = useState("padrao");
  const [tecidoId, setTecidoId] = useState("nenhum");
  const [forroId, setForroId] = useState("nenhum");
  const [servicoId, setServicoId] = useState("padrao");
  const [ferragemPreco, setFerragemPreco] = useState(0);

  // --- BUSCA PREÇOS NO BANCO ---
  useEffect(() => {
    async function loadPrices() {
      const { data: mats } = await supabase.from('materiais').select('*').order('nome');
      const { data: taxes } = await supabase.from('configuracoes_globais').select('*');

      if (mats) {
        setDbTecidos([{ id: 'nenhum', nome: 'Sem Tecido', preco: 0 }, ...mats.filter(m => m.categoria === 'tecido')]);
        setDbForros([{ id: 'nenhum', nome: 'Sem Forro', preco: 0 }, ...mats.filter(m => m.categoria === 'forro')]);

        const modelosBanco = mats.filter(m => m.categoria === 'modelo');
        setDbModelos(modelosBanco);
        if (modelosBanco.length > 0) setModeloId(modelosBanco[0].id);
      }

      if (taxes) {
        const taxObj = taxes.reduce((acc: any, t) => { acc[t.chave] = Number(t.valor); return acc; }, {});
        setDbTaxas(taxObj);
      }
      setPricesLoaded(true);
    }
    loadPrices();
  }, []);

  // --- CARREGA DADOS PARA EDIÇÃO (SE HOUVER DO HISTÓRICO) ---
  useEffect(() => {
    const editData = localStorage.getItem('jeisel_edit_pedido');
    if (editData) {
      const pedido = JSON.parse(editData);
      setCart(pedido.itens || []);
      setCliente(pedido.cliente || "");
      setEditId(pedido.id);
      localStorage.removeItem('jeisel_edit_pedido');
    }
  }, []);

  // --- CÁLCULO DE FERRAGENS (DINÂMICO) ---
  const ferragensOptions = useMemo(() => {
    let options = [{ id: 'nenhum', nome: 'Cliente já possui trilho/varão', preco: 0 }];
    const temTecido = tecidoId !== 'nenhum';
    const temForro = forroId !== 'nenhum';

    const modeloAtual = dbModelos.find(m => m.id === modeloId);
    const isIlhos = modeloAtual?.nome.toLowerCase().includes('ilhós');

    if (temTecido && temForro) {
      options.push({ id: 't_var_sui', nome: 'TETO: Varão 28mm + Suíço', preco: 69.13 });
      options.push({ id: 't_2sui', nome: 'TETO: 2 Trilhos Suíços', preco: 25.86 });
      options.push({ id: 'p_var_luxo', nome: `PAREDE: Varão + Luxo ${isIlhos ? '(Ilhós)' : ''}`, preco: isIlhos ? 145.92 : 106.32 });
    } else {
      options.push({ id: 't_var', nome: 'TETO: Varão 28mm', preco: 56.20 });
      options.push({ id: 't_sui', nome: 'TETO: Trilho Suíço', preco: 12.93 });
      options.push({ id: 'p_var', nome: 'PAREDE: Varão 28mm', preco: 79.56 });
    }
    return options;
  }, [modeloId, tecidoId, forroId, dbModelos]);

  // --- ADICIONAR OU ATUALIZAR ITEM NO CARRINHO ---
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const largNum = parseFloat(largura);
    const altNum = parseFloat(altura);

    const modObj = dbModelos.find(m => m.id === modeloId);
    const tecObj = dbTecidos.find(t => t.id === tecidoId);
    const forObj = dbForros.find(f => f.id === forroId);
    const cstObj = DB.costuras.find(c => c.id === costuraId)!;

    if (!tecObj || !forObj || !modObj) return alert("Selecione os materiais e o modelo.");
    if (tecObj.id === 'nenhum' && forObj.id === 'nenhum') return alert("Selecione tecido ou forro.");

    let detalhes = [];

    // 1. Cálculo Tecido (METRO LINEAR: Largura x Fator)
    let custoTec = 0;
    if (tecObj.id !== 'nenhum') {
      let metTec = largNum * modObj.fator;
      custoTec = metTec * tecObj.preco;
      detalhes.push({
        tipo: 'Tecido',
        icon: <Palette size={20} className="text-blue-500" />,
        nome: tecObj.nome,
        equacao: `${largNum}m × ${modObj.fator} (Fator) = ${metTec.toFixed(2)}m lineares`,
        valor: custoTec
      });
    }

    // 2. Cálculo Forro (METRO LINEAR)
    let custoFor = 0;
    if (forObj.id !== 'nenhum') {
      let metForro = 0;
      let eqForro = "";

      if (forObj.tipo_bk) {
        // Se for Blackout, calcula as partes necessárias de acordo com a função especial
        metForro = calcularConsumoBK(largNum);
        eqForro = `Cálculo de Emendas (Blackout) = ${metForro.toFixed(2)}m lineares`;
      } else {
        // Forro comum usa o fator de franzimento
        let fatorForro = forObj.fator || 1;
        metForro = largNum * fatorForro;
        eqForro = `${largNum}m × ${fatorForro} (Fator) = ${metForro.toFixed(2)}m lineares`;
      }

      custoFor = metForro * forObj.preco;
      detalhes.push({ tipo: 'Forro', icon: <Palette size={20} className="text-purple-500" />, nome: forObj.nome, equacao: eqForro, valor: custoFor });
    }

    // 3. Cálculo Confecção (Mantido por metro linear da janela)
    let baseCustoCst = (tecObj.id !== 'nenhum' && forObj.id !== 'nenhum') ? cstObj.cort_forro : (tecObj.id !== 'nenhum' ? cstObj.so_cort : cstObj.so_forro);
    let custoCst = baseCustoCst * largNum;
    detalhes.push({ tipo: 'Confecção', icon: <Scissors size={20} className="text-orange-500" />, nome: cstObj.nome, equacao: `${largNum}m × ${formatBRL(baseCustoCst)}/m`, valor: custoCst });

    // 4. Cálculo Ferragem (Mantido por metro linear da janela)
    let custoFer = servicoId !== 'nenhum' ? (largNum * ferragemPreco) : 0;
    if (custoFer > 0) {
      detalhes.push({ tipo: 'Ferragem', icon: <Wrench size={20} className="text-gray-500" />, nome: "Suporte/Trilho", equacao: `${largNum}m × ${formatBRL(ferragemPreco)}/m`, valor: custoFer });
    }

    // Objeto do Item Finalizado
    const newItem = {
      id: editingCartItemId || Date.now(),
      nome: nomeAmbiente, largura: largNum, altura: altNum, servico: servicoId,
      desc: `${modObj.nome} | ${tecObj.nome} | ${forObj.nome}`,
      mat_cost: custoTec + custoFor + custoCst + custoFer,
      detalhes_array: detalhes,
      tecidoId: tecObj.id,
      forroId: forObj.id,
      modeloId: modObj.id,
      ferragemPreco: ferragemPreco
    };

    if (editingCartItemId) {
      setCart(cart.map(i => i.id === editingCartItemId ? newItem : i));
      setEditingCartItemId(null);
    } else {
      setCart([...cart, newItem]);
    }

    setNomeAmbiente(""); setLargura(""); setAltura("");
  };

  const delItem = (id: number) => setCart(cart.filter(i => i.id !== id));

  // --- PUXAR ITEM DO CARRINHO PRO FORMULÁRIO ---
  const editCartItem = (item: any) => {
    setNomeAmbiente(item.nome);
    setLargura(item.largura.toString());
    setAltura(item.altura.toString());

    if (item.tecidoId) setTecidoId(item.tecidoId);
    if (item.forroId) setForroId(item.forroId);
    if (item.modeloId) setModeloId(item.modeloId);
    if (item.ferragemPreco !== undefined) setFerragemPreco(item.ferragemPreco);

    setEditingCartItemId(item.id);
  };

  const cancelCartItemEdit = () => {
    setEditingCartItemId(null);
    setNomeAmbiente(""); setLargura(""); setAltura("");
  };

  // --- TOTAIS GLOBAIS (USANDO TAXAS DO BANCO) ---
  const totais = useMemo(() => {
    if (!pricesLoaded) return { mat: 0, inst: 0, desl: 0, total: 0, globalDetalhes: [] };

    let totalMat = 0, mtPadrao = 0, mtAlta = 0, mtPendurar = 0, mtRetirada = 0;
    let globalDetalhes = [];

    cart.forEach(item => {
      totalMat += item.mat_cost;
      if (item.servico === 'padrao') { if (item.altura > 3.50) mtAlta += item.largura; else mtPadrao += item.largura; }
      if (item.servico === 'so_pendurar') mtPendurar += item.largura;
      if (item.servico === 'retirar') { mtPadrao += item.largura; mtRetirada += item.largura; }
    });

    let calcInst = (mtPadrao * dbTaxas.inst_padrao) + (mtAlta * dbTaxas.inst_alta) + (mtRetirada * dbTaxas.retirada);
    if (mtPadrao > 0) globalDetalhes.push({ nome: 'Instalação Padrão', desc: `${mtPadrao.toFixed(2)}m`, valor: mtPadrao * dbTaxas.inst_padrao });
    if (mtAlta > 0) globalDetalhes.push({ nome: 'Pé Direito Alto', desc: `${mtAlta.toFixed(2)}m`, valor: mtAlta * dbTaxas.inst_alta });
    if (mtRetirada > 0) globalDetalhes.push({ nome: 'Taxa de Retirada', desc: `${mtRetirada.toFixed(2)}m`, valor: mtRetirada * dbTaxas.retirada });

    let totalInst = calcInst;
    let taxaMinimaAplicada = false;
    if (totalInst > 0 && totalInst < dbTaxas.min_resid) {
      totalInst = dbTaxas.min_resid;
      taxaMinimaAplicada = true;
    }

    let totalDesloc = 0;
    let kmTotal = km * 2;
    if (kmTotal > dbTaxas.km_livre) {
      totalDesloc = (kmTotal - dbTaxas.km_livre) * dbTaxas.km_valor;
      globalDetalhes.push({ nome: 'Deslocamento Extra', desc: `${(kmTotal - dbTaxas.km_livre).toFixed(2)}km`, valor: totalDesloc });
    }

    return { mat: totalMat, inst: totalInst, desl: totalDesloc, total: totalMat + totalInst + totalDesloc, globalDetalhes, taxaMinimaAplicada };
  }, [cart, km, dbTaxas, pricesLoaded]);

  // --- FINALIZAR OU EDITAR PEDIDO ---
  const finalizarPedido = async () => {
    if (cart.length === 0) return alert("Adicione itens!");
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      cliente: cliente || "Consumidor",
      total: totais.total,
      vendedor: user?.email,
      status: 'andamento',
      qtd_janelas: cart.length,
      itens: cart,
      totais_data: {
        mat: totais.mat, inst: totais.inst, desl: totais.desl,
        globalDetalhes: totais.globalDetalhes, taxaMinimaAplicada: totais.taxaMinimaAplicada
      },
      data: new Date().toLocaleDateString('pt-BR')
    };

    let error;

    if (editId) {
      const res = await supabase.from('pedidos').update(payload).eq('id', editId);
      error = res.error;
    } else {
      const res = await supabase.from('pedidos').insert([payload]);
      error = res.error;
    }

    if (!error) {
      setCart([]);
      setCliente("");
      setKm(0);
      setEditId(null);
      router.push('/historico');
    }
    else alert("Erro: " + error.message);
  };

  if (!pricesLoaded) return <div className="p-10 text-center animate-pulse">Sincronizando preços com o banco...</div>;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        <div className="space-y-6">

          {editId && (
            <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 p-4 rounded-lg flex items-center justify-between shadow-sm">
              <div>
                <strong className="block text-sm">Modo de Edição Ativo</strong>
                <span className="text-xs">Você está a editar o Pedido #{editId}. As suas alterações irão substituir o pedido original.</span>
              </div>
              <button
                onClick={() => { setEditId(null); setCart([]); setCliente(""); }}
                className="px-3 py-1.5 bg-indigo-200 text-indigo-800 rounded-md text-xs font-bold hover:bg-indigo-300 transition"
              >
                Cancelar Edição
              </button>
            </div>
          )}

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-blue-600 mb-4 pb-2 border-b">Dados do Cliente</h3>
            <div className="flex flex-wrap gap-4">
              <input type="text" placeholder="Nome do Cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} className="flex-1 p-2.5 border rounded-md" />
              <input type="number" placeholder="KM (Ida)" value={km} onChange={(e) => setKm(Number(e.target.value))} className="w-32 p-2.5 border rounded-md" />
            </div>
          </div>

          <div className={`bg-white p-6 rounded-lg border shadow-sm transition-all duration-300 ${editingCartItemId ? 'border-indigo-400 ring-4 ring-indigo-50' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className={`text-lg font-semibold ${editingCartItemId ? 'text-indigo-600' : 'text-blue-600'}`}>
                {editingCartItemId ? 'A Editar Ambiente...' : 'Janela/Ambiente'}
              </h3>
              {editingCartItemId && (
                <button onClick={cancelCartItemEdit} className="text-xs text-gray-400 hover:text-red-500 font-bold">
                  Cancelar Edição
                </button>
              )}
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <input type="text" value={nomeAmbiente} onChange={(e)=>setNomeAmbiente(e.target.value)} placeholder="Ambiente (Ex: Sala)" className="p-2.5 border rounded-md focus:border-indigo-500" required />
                <input type="number" step="0.01" value={largura} onChange={(e)=>setLargura(e.target.value)} placeholder="Largura (m)" className="p-2.5 border rounded-md focus:border-indigo-500" required />
                <input type="number" step="0.01" value={altura} onChange={(e)=>setAltura(e.target.value)} placeholder="Altura (m)" className="p-2.5 border rounded-md focus:border-indigo-500" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Repare que retirei o "m²" das opções de seleção para não causar confusão */}
                <select value={tecidoId} onChange={(e)=>setTecidoId(e.target.value)} className="p-2.5 border rounded-md bg-white focus:border-indigo-500">
                  {dbTecidos.map(t => <option key={t.id} value={t.id}>{t.nome} (R$ {t.preco}/m)</option>)}
                </select>
                <select value={forroId} onChange={(e)=>setForroId(e.target.value)} className="p-2.5 border rounded-md bg-white focus:border-indigo-500">
                  {dbForros.map(f => <option key={f.id} value={f.id}>{f.nome} (R$ {f.preco}/m)</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <select value={modeloId} onChange={(e)=>setModeloId(e.target.value)} className="p-2.5 border rounded-md bg-white focus:border-indigo-500">
                  {dbModelos.map(m => <option key={m.id} value={m.id}>{m.nome} (Fator {m.fator})</option>)}
                </select>
                <select value={ferragemPreco} onChange={(e)=>setFerragemPreco(Number(e.target.value))} className="p-2.5 border rounded-md bg-white focus:border-indigo-500">
                  {ferragensOptions.map(f => <option key={f.id} value={f.preco}>{f.nome}</option>)}
                </select>
              </div>

              <button type="submit" className={`w-full p-3 text-white rounded-md font-bold flex items-center justify-center gap-2 transition-colors ${editingCartItemId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {editingCartItemId ? <><Check size={20} weight="bold" /> Atualizar Ambiente</> : <><Plus size={20} weight="bold" /> Adicionar Ambiente</>}
              </button>
            </form>
          </div>
        </div>

        {/* Resumo Lateral e Botão do Modal */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm sticky top-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-4 border-b pb-2">Resumo do Pedido</h3>

          <div className="max-h-[300px] overflow-y-auto mb-4 space-y-3 px-1">
            {cart.length === 0 ? (
              <div className="text-sm text-gray-500 italic text-center py-4">Nenhum item adicionado ainda.</div>
            ) : (
              cart.map(item => (
                <div key={item.id} className={`border p-3 rounded-md relative group transition-colors ${editingCartItemId === item.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-gray-50 hover:bg-white'}`}>
                  <h4 className="font-semibold text-sm text-gray-800">{item.nome} ({item.largura}x{item.altura}m)</h4>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                  <p className="text-sm mt-1 text-gray-700">Materiais: <strong className="text-blue-600">{formatBRL(item.mat_cost)}</strong></p>

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                    <button type="button" onClick={() => editCartItem(item)} className="p-1 bg-white text-indigo-500 border border-indigo-200 rounded hover:bg-indigo-500 hover:text-white transition shadow-sm">
                      <PencilSimple size={16} weight="bold" />
                    </button>
                    <button type="button" onClick={() => delItem(item.id)} className="p-1 bg-white text-red-500 border border-red-200 rounded hover:bg-red-500 hover:text-white transition shadow-sm">
                      <X size={16} weight="bold" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2 mb-6 text-sm text-gray-600">
            <div className="flex justify-between"><span>Materiais:</span> <span className="font-medium">{formatBRL(totais.mat)}</span></div>
            <div className="flex justify-between"><span>Instalação:</span> <span className="font-medium">{formatBRL(totais.inst)}</span></div>
            <div className="flex justify-between"><span>Deslocamento:</span> <span className="font-medium">{formatBRL(totais.desl)}</span></div>
            <div className="flex justify-between text-xl font-bold text-emerald-600 pt-4 border-t border-dashed">
              <span>Total Geral</span> <span>{formatBRL(totais.total)}</span>
            </div>
          </div>

          <button onClick={() => { if (cart.length === 0) return alert("Adicione itens primeiro!"); setIsModalOpen(true); }} className="w-full mt-6 p-3 bg-transparent border border-gray-300 text-gray-700 rounded-md font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition">
            <MagnifyingGlass size={20} /> Ver Detalhes do Cálculo
          </button>

          <button onClick={finalizarPedido} className={`w-full mt-3 p-3 text-white rounded-md font-bold shadow-md transition flex items-center justify-center gap-2 ${editId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
            <Check size={20} weight="bold" /> {editId ? `Salvar Alterações (#${editId})` : "Finalizar Pedido"}
          </button>
        </div>
      </div>

      {/* --- MODAL MEMÓRIA DE CÁLCULO --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl relative">
            <div className="sticky top-0 bg-white px-8 py-6 border-b flex justify-between items-center z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <MathOperations size={28} className="text-blue-600" /> Memória de Cálculo
                </h2>
                <p className="text-sm text-gray-500 mt-1">Detalhamento completo de materiais e serviços.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 rounded-full hover:text-red-500 transition"><X size={20} weight="bold" /></button>
            </div>

            <div className="p-8 space-y-8">
              {cart.map((item, idx) => (
                <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-5 py-3 border-b flex justify-between items-center">
                    <strong className="text-blue-700 flex items-center gap-2"><Ruler size={20} /> [Janela {idx + 1}] {item.nome}</strong>
                    <span className="text-sm text-gray-500 font-medium">{item.largura}m Largura × {item.altura}m Altura</span>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {item.detalhes_array?.map((det: any, i: number) => (
                      <div key={i} className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50 transition">
                        <div className="p-2 bg-white border border-gray-100 rounded-md shadow-sm">{det.icon}</div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-gray-800">{det.tipo}: <span className="font-normal text-gray-600">{det.nome}</span></h4>
                          <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 inline-block px-2 py-1 rounded">{det.equacao}</p>
                        </div>
                        <div className="text-sm font-semibold text-gray-800">{formatBRL(det.valor)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-50/50 px-5 py-3 border-t flex justify-end items-center gap-4">
                    <span className="text-sm text-gray-600">Subtotal Materiais:</span>
                    <strong className="text-lg text-blue-700">{formatBRL(item.mat_cost)}</strong>
                  </div>
                </div>
              ))}

              <div className="border border-emerald-200 rounded-lg overflow-hidden">
                <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-200">
                  <strong className="text-emerald-800 flex items-center gap-2"><HardHat size={20} /> Mão de Obra e Deslocamento</strong>
                </div>

                <div className="divide-y divide-emerald-100 bg-white">
                  {totais.globalDetalhes.length === 0 ? (
                    <div className="px-5 py-4 text-sm text-gray-500 italic">Nenhum serviço extra acionado.</div>
                  ) : (
                    totais.globalDetalhes.map((serv: any, i: number) => (
                      <div key={i} className="px-5 py-4 flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-gray-800">{serv.nome}</h4>
                          <p className="text-xs text-gray-500 mt-1">{serv.desc}</p>
                        </div>
                        <div className="text-sm font-semibold text-gray-800">{formatBRL(serv.valor)}</div>
                      </div>
                    ))
                  )}

                  {totais.taxaMinimaAplicada && (
                    <div className="px-5 py-3 bg-amber-50 text-amber-800 text-xs font-medium flex items-center gap-2">
                        ⚠️ Valor ajustado para o Piso Mínimo Residencial ({formatBRL(dbTaxas.min_resid)}).
                    </div>
                  )}
                </div>

                <div className="bg-emerald-50/50 px-5 py-3 border-t border-emerald-200 flex justify-end items-center gap-4">
                  <span className="text-sm text-gray-600">Subtotal Serviços:</span>
                  <strong className="text-lg text-emerald-700">{formatBRL(totais.inst + totais.desl)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
