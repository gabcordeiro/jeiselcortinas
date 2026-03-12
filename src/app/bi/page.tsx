"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, PieChart, Pie, Cell, Legend 
} from "recharts";
// Corrigido: TrendUp em vez de TrendingUp
import { CurrencyDollar, Package, Receipt, ChartPieSlice, TrendUp } from "@phosphor-icons/react"; 

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444'];

export default function DashboardBI() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) console.error("Erro ao carregar BI:", error);
      else setPedidos(data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Cálculos de KPI
  const stats = useMemo(() => {
    const total = pedidos.reduce((acc, p) => acc + Number(p.total), 0);
    const qtd = pedidos.length;
    const ticketMedio = qtd > 0 ? total / qtd : 0;
    
    // Agrupar por Cliente para o Gráfico de Barras
    const vendasPorCliente = pedidos.reduce((acc: any, p) => {
      acc[p.cliente] = (acc[p.cliente] || 0) + Number(p.total);
      return acc;
    }, {});

    const chartData = Object.keys(vendasPorCliente).map(key => ({
      name: key,
      total: vendasPorCliente[key]
    })).sort((a, b) => b.total - a.total).slice(0, 5); // Top 5 clientes

    // Agrupar por Status para o Gráfico de Pizza
    const statusData = pedidos.reduce((acc: any, p) => {
      const statusLabel = p.status.charAt(0).toUpperCase() + p.status.slice(1);
      const existing = acc.find((item: any) => item.name === statusLabel);
      if (existing) existing.value++;
      else acc.push({ name: statusLabel, value: 1 });
      return acc;
    }, []);

    return { total, qtd, ticketMedio, chartData, statusData };
  }, [pedidos]);

  const formatBRL = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  if (loading) return <div className="p-10 text-center animate-pulse">Carregando métricas...</div>;

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">Inteligência de Vendas</h1>
        <p className="text-gray-500 text-sm">Visão geral do desempenho da Jeisel Cortinas</p>
      </header>

      {/* Cards de KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-lg"><CurrencyDollar size={32} weight="duotone" /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Faturamento</p>
            <p className="text-2xl font-black text-gray-800">{formatBRL(stats.total)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-lg"><Package size={32} weight="duotone" /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Pedidos</p>
            <p className="text-2xl font-black text-gray-800">{stats.qtd}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-lg"><Receipt size={32} weight="duotone" /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ticket Médio</p>
            <p className="text-2xl font-black text-gray-800">{formatBRL(stats.ticketMedio)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Barras: Top Clientes */}
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
            <TrendUp size={22} className="text-blue-600" /> Top 5 Clientes (R$)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} layout="vertical" margin={{ left: 40, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} style={{ fontSize: '12px', fontWeight: 'bold' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value: number) => formatBRL(value)} />
                <Bar dataKey="total" fill="#2563EB" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Pizza: Status dos Pedidos */}
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
            <ChartPieSlice size={22} className="text-emerald-600" /> Distribuição de Status
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusData}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.statusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}