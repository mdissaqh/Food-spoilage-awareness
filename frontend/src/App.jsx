import React, { useState, useEffect } from 'react';
import api from './api';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Cpu, Truck, Package, AlertTriangle } from 'lucide-react';
import './App.css';

function App() {
  const [inventory, setInventory] = useState([]);
  const [capacity, setCapacity] = useState(300);
  const [optimizedLoad, setOptimizedLoad] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/food');
      setInventory(res.data);
    } catch (err) {
      console.error("Failed to fetch inventory", err);
    }
  };

  const seedData = async () => {
    try {
      await api.post('/seed');
      fetchInventory();
      setOptimizedLoad(null);
    } catch (err) {
      console.error("Failed to seed", err);
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      // Simulate quantum processing time for UX effect (1.5 seconds)
      await new Promise(r => setTimeout(r, 1500)); 
      const res = await api.post('/optimize', { capacity });
      setOptimizedLoad(res.data);
    } catch (err) {
      console.error(err);
      alert("Optimization failed. Check if Python server is running.");
    }
    setIsOptimizing(false);
  };

  const totalWeight = optimizedLoad ? optimizedLoad.reduce((acc, curr) => acc + curr.weight, 0) : 0;
  const highRiskSaved = optimizedLoad ? optimizedLoad.filter(i => i.expiry_days <= 3).length : 0;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div>
          <h1 className="title">
            <Cpu color="#60a5fa" /> Quantum Knapsack
          </h1>
          <p className="subtitle">Spoilage-Aware Food Optimization Engine</p>
        </div>
        <button onClick={seedData} className="btn-outline">
          Reset Mock Data
        </button>
      </header>

      <div className="dashboard-grid">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Truck Config Panel */}
          <div className="glass-panel">
            <h2 className="panel-title"><Truck color="#34d399" /> Truck Configuration</h2>
            <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              Maximum Capacity (kg): <strong>{capacity}</strong>
            </label>
            <input 
              type="range" 
              min="50" 
              max="1000" 
              step="50"
              value={capacity} 
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="input-range"
            />
            
            <button 
              onClick={handleOptimize}
              disabled={isOptimizing || inventory.length === 0}
              className="glow-button"
            >
              {isOptimizing ? (
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <Cpu size={20} />
                </motion.div>
              ) : (
                <Cpu size={20} />
              )}
              {isOptimizing ? 'Running Quantum Optimization...' : 'Run Optimization'}
            </button>
          </div>

          {/* Warehouse Inventory Panel */}
          <div className="glass-panel">
            <h2 className="panel-title">Warehouse Inventory</h2>
            <div className="inventory-list">
              {inventory.length === 0 ? <p style={{color: '#94a3b8'}}>No items. Click Reset Mock Data.</p> : null}
              {inventory.map(item => (
                <div key={item._id} className="inventory-item">
                  <div>
                    <p className="item-name">{item.name}</p>
                    <p className="item-meta">Weight: {item.weight}kg | Nutri-Score: {item.nutrition}</p>
                  </div>
                  <div className={`badge ${item.expiry_days <= 3 ? 'badge-danger' : 'badge-safe'}`}>
                    {item.expiry_days} Days
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Visualization */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
          {optimizedLoad ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel"
              style={{ background: 'linear-gradient(135deg, rgba(30,58,138,0.2), rgba(6,78,59,0.2))', border: '1px solid rgba(59,130,246,0.3)' }}
            >
              <h2 className="panel-title"><Package color="#60a5fa" /> Optimized Truck Load</h2>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <p className="stat-label">Items Loaded</p>
                  <p className="stat-value">{optimizedLoad.length}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Total Weight</p>
                  <p className="stat-value text-emerald">
                    {totalWeight} / {capacity} kg
                  </p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">High-Risk Saved</p>
                  <p className="stat-value text-red">
                    {highRiskSaved} Items
                  </p>
                </div>
              </div>

              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={optimizedLoad} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                    <Bar dataKey="nutrition" name="Nutrition Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="weight" name="Weight (kg)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          ) : (
            <div className="glass-panel empty-state">
              <AlertTriangle size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
              <p>Configure truck capacity and run the optimization engine to see results.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;