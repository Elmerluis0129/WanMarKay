import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { Invoice } from '../../types/invoice';

const COLORS = ['#FFC107', '#4CAF50', '#F44336', '#9E9E9E'];

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
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}; 