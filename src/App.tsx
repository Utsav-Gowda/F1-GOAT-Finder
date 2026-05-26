import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { DriverSelector } from './components/DriverSelector';
import { FilterControls } from './components/FilterControls';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Driver, Circuit, DriverScore } from './types';

const API_BASE_URL = import.meta.env.PROD
  ? 'https://YOUR-RENDER-URL.onrender.com'  // <-- update after deploying backend
  : 'http://127.0.0.1:5000';

const App: React.FC = () => {
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [allCircuits, setAllCircuits] = useState<Circuit[]>([]);

  const [selectedDrivers, setSelectedDrivers] = useState<Driver[]>([]);
  const [selectedCircuit, setSelectedCircuit] = useState<number>(0);

  const [results, setResults] = useState<DriverScore[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);

  // Split error states: fetchError blocks the whole form; analyzeError doesn't.
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setFetchError(null);
        setIsDataLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/initial-data`);
        if (!response.ok) {
          throw new Error('Failed to load initial data from the server.');
        }
        const data = await response.json();

        // Backend sends drivers as objects with numeric IDs; we cast to string
        // because the Driver interface uses string IDs throughout the UI.
        const drivers: Driver[] = (data.drivers || []).map((d: any) => ({
          id: String(d.id),
          name: d.name,
          country: d.country,
        }));

        const circuits: Circuit[] = data.circuits || [];

        setAllDrivers(drivers);
        setAllCircuits(circuits);
        if (circuits.length > 0) {
          setSelectedCircuit(circuits[0].id);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setFetchError(`Could not connect to the backend: ${msg}. The server may be waking up — try again in 30 seconds.`);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (selectedDrivers.length < 2) {
      setAnalyzeError('Please select at least two drivers to compare.');
      return;
    }
    setAnalyzeError(null);
    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drivers: selectedDrivers,
          circuitId: selectedCircuit,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Analysis failed on the server.');
      }

      const scores = await response.json();
      setResults(scores);
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : 'Unknown error during analysis.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDrivers, selectedCircuit]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        <main className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700">
            <h2 className="text-2xl font-bold text-red-500 mb-6">Simulation Setup</h2>
            {isDataLoading ? (
              <div className="text-center text-gray-400">
                <div className="animate-pulse">Loading drivers and circuits...</div>
                <div className="text-xs mt-2 text-gray-500">First load may take 30+ seconds if the backend is waking up.</div>
              </div>
            ) : fetchError ? (
              <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">{fetchError}</div>
            ) : (
              <div className="space-y-6">
                <DriverSelector
                  allDrivers={allDrivers}
                  selectedDrivers={selectedDrivers}
                  setSelectedDrivers={setSelectedDrivers}
                />
                <FilterControls
                  circuits={allCircuits}
                  selectedCircuit={selectedCircuit}
                  setSelectedCircuit={setSelectedCircuit}
                />
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading || selectedDrivers.length < 2 || isDataLoading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-500/50 flex items-center justify-center text-lg"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    'Analyze'
                  )}
                </button>
                {selectedDrivers.length < 2 && (
                  <p className="text-xs text-gray-500 text-center -mt-2">
                    Select at least 2 drivers to enable analysis.
                  </p>
                )}
                {analyzeError && (
                  <div className="text-sm text-red-400 bg-red-900/30 p-3 rounded-lg">
                    {analyzeError}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="lg:col-span-2">
            <ResultsDisplay isLoading={isLoading} results={results} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
