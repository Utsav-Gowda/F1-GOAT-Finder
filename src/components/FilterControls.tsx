import React from 'react';
import { Circuit } from '../types';
import { Flag } from './Flag';

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
  const current = circuits.find((c) => c.id === selectedCircuit);

  return (
    <div>
      <label htmlFor="circuit-select" className="block text-sm font-medium text-gray-300 mb-2">
        Select Circuit
      </label>

      {/* Flag preview of the currently selected circuit.
          Native <select><option> can't render images, so we show the flag separately. */}
      {current && (
        <div className="flex items-center mb-2 text-sm text-gray-300">
          <Flag emoji={current.country} className="w-5 h-5 mr-2" />
          <span className="truncate">{current.name}</span>
        </div>
      )}

      <select
        id="circuit-select"
        value={selectedCircuit}
        onChange={(e) => setSelectedCircuit(Number(e.target.value))}
        className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
      >
        {circuits.map((circuit) => (
          <option key={circuit.id} value={circuit.id}>
            {circuit.name}
          </option>
        ))}
      </select>
    </div>
  );
};
