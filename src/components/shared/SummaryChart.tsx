import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { Invoice } from '../../types/invoice';

const STATUS_COLORS: Record<string, string> = {
  delayed: '#FFC107', // Retrasadas - amarillo
  on_time: '#4CAF50',  // A tiempo - verde
  paid: '#E31C79',     // Pagadas - rosado
};

interface SummaryChartProps {
  invoices: Invoice[];
}

export const SummaryChart: React.FC<SummaryChartProps> = ({ invoices }) => {
  // Contar facturas por estado
  const statusCount = invoices.reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(statusCount).map(([status, value]) => ({ name: status, value }));

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