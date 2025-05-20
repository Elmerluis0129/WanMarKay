import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { Invoice } from '../../types/invoice';

const STATUS_COLORS: Record<string, string> = {
  'Retrasadas': '#F44336', // rojo
  'A tiempo': '#4CAF50',   // verde
  'Pagadas': '#E31C79',    // rosado
};

interface SummaryChartProps {
  invoices: Invoice[];
}

export const SummaryChart: React.FC<SummaryChartProps> = ({ invoices }) => {
  // Mapear estados técnicos a nombres en español
  const traducirEstado = (status: string): string => {
    switch (status) {
      case 'delayed':
        return 'Retrasadas';
      case 'on_time':
        return 'A tiempo';
      case 'paid':
        return 'Pagadas';
      default:
        return 'Otro';
    }
  };

  // Contar facturas por estado
  const statusCount = invoices.reduce((acc, inv) => {
    const estadoTraducido = traducirEstado(inv.status);
    acc[estadoTraducido] = (acc[estadoTraducido] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          dataKey="value"
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          label
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#9E9E9E'} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};
