import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Cpu, Truck, Package, AlertTriangle, LogOut, MapPin } from 'lucide-react';

// Custom Tooltip component to show Provider details safely
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <p style={{ fontWeight: 'bold', color: '#60a5fa', marginBottom: '0.5rem' }}>{label}</p>
        <p style={{ color: '#fff' }}>Nutrition: {data.nutritionScore}</p>
        <p style={{ color: '#fff' }}>Weight: {data.weight}kg</p>
        <p style={{ color: '#f87171' }}>Expires: {data.expectedExpiryHours}h</p>
        <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />
        <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}><MapPin size={12} style={{display:'inline'}}/> Pickup From:</p>
        <p style={{ color: '#fff', fontSize: '0.85rem' }}>{data.providerName}</p>
        <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{data.addressLine}, {data.city}</p>
      </div>
    );
  }
  return null;
};

export default function NGODashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [capacity, setCapacity] = useState(300);
  const [optimizedLoad, setOptimizedLoad] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/food');
      setInventory(res.data);
    } catch (err) {
      console.error("Failed to fetch inventory", err);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.organizationType !== 'NGO') {
        navigate('/provider');
      } else {
        setUser(parsedUser);
        fetchInventory();
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
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
  const highRiskSaved = optimizedLoad ? optimizedLoad.filter(i => i.expectedExpiryHours <= 24).length : 0;

  if (!user) return null;

  return (
    <div className="app-container">
      <header className="header">
        <div>
          <h1 className="title"><Cpu color="#60a5fa" /> NGO Optimization Center</h1>
          <p className="subtitle">{user.organizationName} | {user.city}</p>
        </div>
        <button onClick={handleLogout} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogOut size={16} /> Logout
        </button>
      </header>

      <div className="dashboard-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-panel">
            <h2 className="panel-title"><Truck color="#34d399" /> Truck Configuration</h2>
            <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              Maximum Capacity (kg): <strong>{capacity}</strong>
            </label>
            <input 
              type="range" min="50" max="1000" step="50"
              value={capacity} onChange={(e) => setCapacity(Number(e.target.value))}
              className="input-range"
            />
            
            <button onClick={handleOptimize} disabled={isOptimizing || inventory.length === 0} className="glow-button">
              {isOptimizing ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <Cpu size={20} />
                </motion.div>
              ) : (
                <Cpu size={20} />
              )}
              {isOptimizing ? 'Running Quantum Optimization...' : 'Run Optimization'}
            </button>
          </div>

          <div className="glass-panel">
            <h2 className="panel-title">City-Wide Available Donations</h2>
            <div className="inventory-list">
              {inventory.length === 0 ? <p style={{color: '#94a3b8'}}>No active donations in your city.</p> : null}
              {inventory.map(item => (
                <div key={item._id} className="inventory-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '0.5rem' }}>
                    <p className="item-name">{item.foodName}</p>
                    <div className={`badge ${item.expectedExpiryHours <= 24 ? 'badge-danger' : 'badge-safe'}`}>
                      {item.expectedExpiryHours}h left
                    </div>
                  </div>
                  <p className="item-meta">Weight: {item.weight}kg | Nutri-Score: {item.nutritionScore}</p>
                  <div className="provider-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                    <MapPin size={12} /> {item.providerName} - {item.addressLine}, {item.city}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
          {optimizedLoad ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="glass-panel"
              style={{ background: 'linear-gradient(135deg, rgba(30,58,138,0.2), rgba(6,78,59,0.2))', border: '1px solid rgba(59,130,246,0.3)' }}
            >
              <h2 className="panel-title"><Package color="#60a5fa" /> Optimal Pickup Manifest</h2>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <p className="stat-label">Pickups Scheduled</p>
                  <p className="stat-value">{optimizedLoad.length}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Total Load</p>
                  <p className="stat-value text-emerald">{totalWeight} / {capacity} kg</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">High-Risk Saved</p>
                  <p className="stat-value text-red">{highRiskSaved} Items</p>
                </div>
              </div>

              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={optimizedLoad} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <XAxis dataKey="foodName" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                    <Bar dataKey="nutritionScore" name="Nutrition Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="weight" name="Weight (kg)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          ) : (
            <div className="glass-panel empty-state">
              <AlertTriangle size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
              <p>Configure truck capacity and run the optimization engine to generate a pickup manifest with provider locations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}