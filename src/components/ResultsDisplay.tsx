import React from 'react';
import { DriverScore } from '../types';

interface ResultsDisplayProps {
  isLoading: boolean;
  results: DriverScore[] | null;
}

const TrophyIcon: React.FC<{ rank: number }> = ({ rank }) => {
  let colorClass = 'text-gray-500';
  if (rank === 1) colorClass = 'text-yellow-400';
  if (rank === 2) colorClass = 'text-gray-300';
  if (rank === 3) colorClass = 'text-yellow-600';

  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${colorClass}`} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
      <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2 1a1 1 0 00-1 1v1a1 1 0 001 1h8a1 1 0 001-1V7a1 1 0 00-1-1H6zm1 6a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
      <path d="M4 11a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" />
    </svg>
  );
};

const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex justify-center items-center h-full min-h-[400px] bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700">
    <div className="text-center">{children}</div>
  </div>
);

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ isLoading, results }) => {
  if (isLoading) {
    return (
      <Container>
        <svg className="animate-spin mx-auto h-12 w-12 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h3 className="mt-4 text-xl font-semibold">Running Simulation...</h3>
        <p className="text-gray-400">Calculating driver performance based on selected parameters.</p>
      </Container>
    );
  }

  if (results === null) {
    return (
      <Container>
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="mt-4 text-xl font-semibold">Awaiting Analysis</h3>
        <p className="text-gray-400">Select at least two drivers and a circuit, then press "Analyze" to see the results.</p>
      </Container>
    );
  }

  // The backend returned an empty array — none of the selected drivers raced at this circuit.
  if (results.length === 0) {
    return (
      <Container>
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <h3 className="mt-4 text-xl font-semibold">No Race Data Found</h3>
        <p className="text-gray-400 max-w-md">
          None of the selected drivers have competed at this circuit. Try picking a different circuit, or selecting drivers from overlapping eras.
        </p>
      </Container>
    );
  }

  return (
    <div className="bg-gray-800/50 p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-700">
      <h2 className="text-2xl font-bold text-red-500 mb-4">Analysis Results</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b-2 border-gray-600">
            <tr>
              <th className="p-3 text-sm font-semibold tracking-wide text-center">Rank</th>
              <th className="p-3 text-sm font-semibold tracking-wide">Driver</th>
              <th className="p-3 text-sm font-semibold tracking-wide text-center">Races</th>
              <th className="p-3 text-sm font-semibold tracking-wide text-right">Performance Score</th>
            </tr>
          </thead>
          <tbody>
            {results.map(({ driver, score, rank, races }) => (
              <tr key={driver.id} className="border-b border-gray-700 last:border-none hover:bg-gray-700/50 transition-colors">
                <td className="p-3 text-lg font-bold text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <TrophyIcon rank={rank} />
                    <span>{rank}</span>
                  </div>
                </td>
                <td className="p-3 font-medium">
                  <span className="mr-3 text-2xl">{driver.country}</span>
                  {driver.name}
                </td>
                <td className="p-3 text-center text-gray-400">{races}</td>
                <td className="p-3 text-right">
                  <span className="font-mono text-lg bg-gray-700 px-3 py-1 rounded-md">{score.toFixed(2)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
