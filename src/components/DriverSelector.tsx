import React, { useState, useRef, useEffect } from 'react';
import { Driver } from '../types';
import { Flag } from './Flag';

interface DriverSelectorProps {
  allDrivers: Driver[];
  selectedDrivers: Driver[];
  setSelectedDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
}

export const DriverSelector: React.FC<DriverSelectorProps> = ({ allDrivers, selectedDrivers, setSelectedDrivers }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDriver = (driver: Driver) => {
    if (selectedDrivers.some(d => d.id === driver.id)) {
      setSelectedDrivers(selectedDrivers.filter(d => d.id !== driver.id));
    } else {
      setSelectedDrivers([...selectedDrivers, driver]);
    }
  };

  const filteredDrivers = allDrivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGridColsClass = (count: number) => {
    if (count <= 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2 sm:grid-cols-4';
    return 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-5';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-300 mb-2">Select Drivers</label>
      <div className="border border-gray-600 bg-gray-900 rounded-lg p-2 min-h-[50px]">
        <div className={`grid gap-2 ${getGridColsClass(selectedDrivers.length)}`}>
          {selectedDrivers.map(driver => (
            <div key={driver.id} className="flex items-center justify-between bg-red-600/50 text-white text-xs rounded-md px-2 py-1">
              <span className="flex items-center min-w-0">
                <Flag emoji={driver.country} className="w-4 h-4 mr-1.5 flex-shrink-0" />
                <span className="truncate">{driver.name}</span>
              </span>
              <button onClick={() => toggleDriver(driver)} className="ml-1 text-white hover:text-red-200 flex-shrink-0">
                &times;
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left mt-2 text-gray-400 hover:text-white transition">
          {selectedDrivers.length > 0 ? 'Add or remove drivers...' : 'Select drivers to compare...'}
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <input
            type="text"
            placeholder="Search drivers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sticky top-0 w-full p-2 bg-gray-900 border-b border-gray-700 focus:outline-none"
          />
          <ul>
            {filteredDrivers.map(driver => (
              <li
                key={driver.id}
                className="p-2 hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                onClick={() => toggleDriver(driver)}
              >
                <div className="flex items-center">
                  <Flag emoji={driver.country} className="w-5 h-5 mr-3" />
                  <span>{driver.name}</span>
                </div>
                <input
                  type="checkbox"
                  readOnly
                  checked={selectedDrivers.some(d => d.id === driver.id)}
                  className="form-checkbox h-5 w-5 text-red-600 bg-gray-800 border-gray-600 rounded focus:ring-red-500"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
