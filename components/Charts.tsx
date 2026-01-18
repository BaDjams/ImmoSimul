import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { SimulationResults } from '../types';

interface ChartsProps {
  results: SimulationResults;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const CostDistributionChart: React.FC<{ prix: number; fraisAgence: number; fraisNotaire: number }> = ({ prix, fraisAgence, fraisNotaire }) => {
  const data = [
    { name: 'Prix Net Vendeur', value: prix },
    { name: 'Frais Agence', value: fraisAgence },
    { name: 'Frais Notaire', value: fraisNotaire },
  ];

  return (
    <div className="h-64 w-full">
      <h3 className="text-sm font-medium text-slate-500 text-center mb-2">Répartition du Coût Total</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `${value.toLocaleString('fr-FR')} €`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CashflowChart: React.FC<{ revenus: number; credit: number; charges: number }> = ({ revenus, credit, charges }) => {
    const data = [
        {
            name: 'Flux Mensuel',
            Entrées: revenus,
            Sorties: credit + charges,
        }
    ];

    return (
        <div className="h-64 w-full mt-6">
            <h3 className="text-sm font-medium text-slate-500 text-center mb-2">Flux de Trésorerie Mensuel</h3>
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value.toFixed(0)} €`} />
                    <Legend />
                    <Bar dataKey="Entrées" fill="#10b981" />
                    <Bar dataKey="Sorties" fill="#ef4444" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
