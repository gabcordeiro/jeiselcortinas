"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Trash, MagnifyingGlass, Eye, X, Ruler, MathOperations, 
  CheckCircle, Clock, Prohibit, FilePdf, 
  CaretDown, Warning, FileXls, PencilSimple 
} from "@phosphor-icons/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx"; 

export default function Historico() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("USER");
  const [loading, setLoading] = useState(true);
  
  // Estados para Modais
  const [selectedPedido, setSelectedPedido] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({
    key: 'created_at',
    direction: 'desc'
  });

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setRole(user?.user_metadata?.role || "USER");
      fetchPedidos();
    };
    init();
  }, []);

  async function fetchPedidos() {
    const { data } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    setPedidos(data || []);
    setLoading(false);
  }

  // --- FUNÇÃO DE EXPORTAR EXCEL ---
  const exportarExcel = () => {
    const dadosExcel = pedidosProcessados.map(p => ({
      ID: p.id,
      Data: p.data,
      Cliente: p.cliente,
      Vendedor: p.vendedor || "Sistema",
      Qtd_Janelas: p.qtd_janelas,
      Status: p.status.toUpperCase(),
      Valor_Total: p.total
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");

    const dataAtual = new Date();
    const nomeArquivo = `Fechamento_Jeisel_${dataAtual.getMonth() + 1}_${dataAtual.getFullYear()}.xlsx`;

    XLSX.writeFile(wb, nomeArquivo);
  };

  const formatBRL = (v: number) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

  // --- FUNÇÃO DE PDF PREMIUM PARA WHATSAPP ---
  const emitirPDF = (p: any) => {
    const doc = new jsPDF();
    
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 15, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(37, 99, 235);
    doc.text("JC CORTINAS", 14, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("Orçamento Exclusivo sob Medida", 14, 36);
    
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(14, 42, 196, 42);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text("DADOS DO CLIENTE", 14, 52);
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${p.cliente}`, 14, 58);
    doc.text(`Data de Emissão: ${p.data}`, 14, 64);

    doc.setFont("helvetica", "bold");
    doc.text("INFORMAÇÕES DO PEDIDO", 120, 52);
    doc.setFont("helvetica", "normal");
    doc.text(`Código do Pedido: #${p.id}`, 120, 58);
    
    const tableBody: any[] = [];

    p.itens?.forEach((item: any, index: number) => {
      tableBody.push([
        { 
          content: `AMBIENTE ${index + 1}: ${item.nome.toUpperCase()} (${item.largura}m larg. x ${item.altura}m alt.)`, 
          colSpan: 3, 
          styles: { fillColor: [240, 245, 255], textColor: [37, 99, 235], fontStyle: 'bold' } 
        }
      ]);
      
      item.detalhes_array?.forEach((det: any) => {
        tableBody.push([det.tipo, det.nome, formatBRL(det.valor)]);
      });
      
      tableBody.push([
        { content: 'Subtotal do Ambiente:', colSpan: 2, styles: { halign: 'right', fontStyle: 'italic', textColor: [100, 100, 100] } }, 
        { content: formatBRL(item.mat_cost), styles: { fontStyle: 'bold', textColor: [50, 50, 50] } }
      ]);
    });

    if (p.totais_data?.globalDetalhes?.length > 0) {
      tableBody.push([
        { 
          content: `MÃO DE OBRA E DESLOCAMENTO`, 
          colSpan: 3, 
          styles: { fillColor: [236, 253, 245], textColor: [5, 150, 105], fontStyle: 'bold' } 
        }
      ]);

      p.totais_data.globalDetalhes.forEach((serv: any) => {
        tableBody.push([serv.nome, serv.desc || 'Serviço Adicional', formatBRL(serv.valor)]);
      });
    }

    autoTable(doc, {
      startY: 72,
      head: [['Item / Serviço', 'Descrição Técnica', 'Valor']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 35, halign: 'right' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(16, 185, 129);
    doc.rect(110, finalY - 8, 86, 20, 'FD');
    
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL GERAL:", 115, finalY + 4);
    
    doc.setFontSize(16);
    doc.setTextColor(5, 150, 105);
    doc.text(formatBRL(p.total), 190, finalY + 5, { align: "right" });

    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "italic");
    doc.text("Orçamento válido por 10 dias. Valores sujeitos a alteração após o prazo.", 105, 280, { align: "center" });
    doc.text("Agradecemos a preferência!", 105, 285, { align: "center" });

    doc.save(`Orcamento_Jeisel_${p.id}_${p.cliente.replace(/\s+/g, '_')}.pdf`);
  };

  async function updateStatus(id: number, newStatus: string) {
    const { error } = await supabase.from('pedidos').update({ status: newStatus }).eq('id', id);
    if (!error) setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
  }

  const executeDelete = async () => {
    if (!idToDelete) return;
    const { error } = await supabase.from('pedidos').delete().eq('id', idToDelete);
    if (!error) setPedidos(pedidos.filter(p => p.id !== idToDelete));
    setIsDeleteModalOpen(false);
  };

  // --- NOVA FUNÇÃO: CARREGAR PARA EDIÇÃO ---
  const carregarParaEdicao = (pedido: any) => {
    // Salva o pedido na memória do navegador para a página principal ler
    localStorage.setItem('jeisel_edit_pedido', JSON.stringify(pedido));
    // Redireciona para a tela inicial (Calculadora)
    router.push('/');
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const pedidosProcessados = useMemo(() => {
    let result = pedidos.filter(p => 
      p.cliente.toLowerCase().includes(search.toLowerCase()) || 
      p.id.toString().includes(search)
    );
    result.sort((a, b) => {
      const v1 = a[sortConfig.key];
      const v2 = b[sortConfig.key];
      if (v1 < v2) return sortConfig.direction === 'asc' ? -1 : 1;
      if (v1 > v2) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [search, pedidos, sortConfig]);

  if (loading) return <div className="p-10 text-center text-gray-400">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <h3 className="text-xl font-bold text-gray-800 whitespace-nowrap">Histórico</h3>
          <button 
            onClick={exportarExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition shadow-sm"
          >
            <FileXls size={20} /> Exportar Excel
          </button>
        </div>
        
        <div className="relative w-full md:w-96">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
        <span className="text-xs font-black text-gray-400 uppercase flex items-center px-2">Filtrar:</span>
        <SortButton label="Código" active={sortConfig.key === 'id'} onClick={() => handleSort('id')} />
        <SortButton label="Nome" active={sortConfig.key === 'cliente'} onClick={() => handleSort('cliente')} />
        <SortButton label="Valor" active={sortConfig.key === 'total'} onClick={() => handleSort('total')} />
        <SortButton label="Vendedor" active={sortConfig.key === 'vendedor'} onClick={() => handleSort('vendedor')} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 text-xs uppercase text-gray-400 font-black">
            <tr>
              <th className="p-5">Cód</th>
              <th className="p-5">Status</th>
              <th className="p-5">Cliente</th>
              {role === "ADMIN" && <th className="p-5">Vendedor</th>}
              <th className="p-5">Total</th>
              <th className="p-5 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pedidosProcessados.map(p => (
              <tr key={p.id} className="hover:bg-blue-50/20 transition-colors">
                <td className="p-5 font-mono text-gray-400 text-xs">#{p.id}</td>
                <td className="p-5">
                  <StatusDropdown status={p.status} onUpdate={(val) => updateStatus(p.id, val)} />
                </td>
                <td className="p-5 font-bold text-gray-800">{p.cliente}</td>
                {role === "ADMIN" && <td className="p-5 text-xs text-blue-500 font-bold">{p.vendedor || 'Padrão'}</td>}
                <td className="p-5 font-black text-emerald-600">{formatBRL(p.total)}</td>
                <td className="p-5">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => setSelectedPedido(p)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Eye size={18} /></button>
                    <button onClick={() => emitirPDF(p)} className="p-2 text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-600 hover:text-white transition-all"><FilePdf size={18} /></button>
                    
                    {/* BOTÃO DE EDITAR AGORA CHAMA A FUNÇÃO DE CARREGAR */}
                    <button onClick={() => carregarParaEdicao(p)} className="p-2 text-indigo-500 hover:bg-indigo-500 hover:text-white rounded-lg transition-all"><PencilSimple size={18} /></button>
                    
                    {role === "ADMIN" && (
                      <button onClick={() => { setIdToDelete(p.id); setIsDeleteModalOpen(true); }} className="p-2 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"><Trash size={18} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DETALHES */}
      {selectedPedido && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2"><MathOperations size={24}/> Memória #{selectedPedido.id}</h2>
              <button onClick={() => setSelectedPedido(null)} className="p-1 hover:bg-white/20 rounded"><X size={24}/></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {selectedPedido.itens?.map((it: any, i: number) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                  <p className="font-bold text-blue-600 mb-2">{it.nome}</p>
                  <div className="space-y-1">
                    {it.detalhes_array?.map((d: any, di: number) => (
                      <div key={di} className="flex justify-between text-xs text-gray-600">
                        <span>{d.tipo}: {d.nome}</span>
                        <span className="font-bold">{formatBRL(d.valor)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t flex justify-between items-center font-black">
                <span className="text-gray-400 uppercase text-xs">Total</span>
                <span className="text-2xl text-emerald-600">{formatBRL(selectedPedido.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DELETAR */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60]">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto"><Warning size={32} /></div>
            <h2 className="text-xl font-bold">Excluir Registro?</h2>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold">Não</button>
              <button onClick={executeDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">Sim, Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SortButton({ label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all border ${active ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
      {label}
    </button>
  );
}

function StatusDropdown({ status, onUpdate }: { status: string, onUpdate: (val: string) => void }) {
  const configs: any = { andamento: "bg-blue-100 text-blue-700", finalizado: "bg-emerald-100 text-emerald-700", cancelado: "bg-red-100 text-red-700" };
  return (
    <div className="relative">
      <select value={status} onChange={(e) => onUpdate(e.target.value)} className={`appearance-none pl-3 pr-8 py-1.5 rounded-full border text-[10px] font-black uppercase outline-none ${configs[status]}`}>
        <option value="andamento">Aberto</option>
        <option value="finalizado">Finalizado</option>
        <option value="cancelado">Cancelado</option>
      </select>
      <CaretDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
    </div>
  );
}