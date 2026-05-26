import React from 'react';
import { Circuit } from '../types';

interface FilterControlsProps {
  circuits: Circuit[];
  selectedCircuit: number;
  setSelectedCircuit: (circuitId: number) => void;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  circuits,
  selectedCircuit,
  setSelectedCircuit,
}) => {
  return (
    <div>
      <label htmlFor="circuit-select" className="block text-sm font-medium text-gray-300 mb-2">
        Select Circuit
      </label>
      <select
        id="circuit-select"
        value={selectedCircuit}
        onChange={(e) => setSelectedCircuit(Number(e.target.value))}
        className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
      >
        {circuits.map((circuit) => (
          <option key={circuit.id} value={circuit.id}>
            {circuit.country ? `${circuit.country} ${circuit.name}` : circuit.name}
          </option>
        ))}
      </select>
    </div>
  );
};
