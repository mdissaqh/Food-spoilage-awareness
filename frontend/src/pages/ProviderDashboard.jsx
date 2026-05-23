import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { LogOut, Trash2, Plus, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  
  const [isAdding, setIsAdding] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiData, setAiData] = useState(null);
  
  // Format current datetime for initial state
  const getLocalDate = () => new Date().toISOString().split('T')[0];
  const getLocalTime = () => new Date().toTimeString().slice(0, 5);

  const [newItem, setNewItem] = useState({
    foodName: '', 
    weight: '',
    createdDate: getLocalDate(),
    createdTime: getLocalTime()
  });

  const fetchInventory = useCallback(async (providerId) => {
    try {
      const res = await api.get(`/food/provider/${providerId}`);
      setInventory(res.data);
    } catch (err) {
      console.error("Failed to fetch inventory", err);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchInventory(parsedUser._id);
    }
  }, [navigate, fetchInventory]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!newItem.foodName || !newItem.weight || !newItem.createdDate || !newItem.createdTime) {
      return alert("Enter food name, weight, date, and time first.");
    }
    
    setIsAnalyzing(true);
    try {
      // Combine date and time to ISO format for the backend
      const combinedDateTime = new Date(`${newItem.createdDate}T${newItem.createdTime}`).toISOString();

      const res = await api.post('/analyze-food', { 
        foodName: newItem.foodName,
        createdAt: combinedDateTime
      });
      setAiData(res.data);
    } catch (err) {
      console.error("AI Analysis failed", err);
      alert("AI Analysis failed. Check backend logs and Mistral API Key.");
    }
    setIsAnalyzing(false);
  };

  const handleSaveFood = async () => {
    try {
      const combinedDateTime = new Date(`${newItem.createdDate}T${newItem.createdTime}`).toISOString();

      const payload = {
        foodName: newItem.foodName,
        weight: Number(newItem.weight),
        createdAt: combinedDateTime,
        nutritionScore: aiData.nutritionScore,
        expectedExpiryHours: aiData.expectedExpiryHours, // This is dynamic remaining hours
        providerId: user._id,
        providerName: user.organizationName,
        addressLine: user.addressLine,
        city: user.city,
        state: user.state,
        pincode: user.pincode
      };
      
      await api.post('/food', payload);
      
      setIsAdding(false);
      setAiData(null);
      setNewItem({ 
        foodName: '', 
        weight: '', 
        createdDate: getLocalDate(), 
        createdTime: getLocalTime() 
      });
      fetchInventory(user._id);
    } catch (err) {
      console.error("Failed to add item", err);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await api.delete(`/food/${id}`);
      fetchInventory(user._id);
    } catch (err) {
      console.error("Failed to delete item", err);
    }
  };

  const cancelAdding = () => {
    setIsAdding(!isAdding);
    setAiData(null);
    setNewItem({ 
      foodName: '', 
      weight: '', 
      createdDate: getLocalDate(), 
      createdTime: getLocalTime() 
    });
  };

  if (!user) return null;

  return (
    <div className="app-container">
      <header className="header">
        <div>
          <h1 className="title">{user.organizationName} Dashboard</h1>
          <p className="subtitle">Provider Type: {user.organizationType} | {user.city}</p>
        </div>
        <button onClick={handleLogout} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogOut size={16} /> Logout
        </button>
      </header>

      <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="panel-title" style={{ marginBottom: 0 }}>My Active Food Listings</h2>
          <button onClick={cancelAdding} className="btn-outline" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> {isAdding ? 'Cancel' : 'Add Food'}
          </button>
        </div>

        {isAdding && (
          <div className="add-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input 
                required 
                type="text" 
                placeholder="Food Name (e.g., Milk, Pizza)" 
                className="form-input" 
                value={newItem.foodName} 
                onChange={e => setNewItem({...newItem, foodName: e.target.value})} 
                disabled={aiData !== null}
              />
              <input 
                required 
                type="number" 
                placeholder="Total Weight (kg)" 
                className="form-input" 
                value={newItem.weight} 
                onChange={e => setNewItem({...newItem, weight: e.target.value})} 
                disabled={aiData !== null}
              />
              <input 
                required 
                type="date" 
                className="form-input" 
                value={newItem.createdDate} 
                onChange={e => setNewItem({...newItem, createdDate: e.target.value})} 
                disabled={aiData !== null}
              />
              <input 
                required 
                type="time" 
                className="form-input" 
                value={newItem.createdTime} 
                onChange={e => setNewItem({...newItem, createdTime: e.target.value})} 
                disabled={aiData !== null}
              />
            </div>

            {!aiData ? (
              <button onClick={handleAnalyze} disabled={isAnalyzing} className="glow-button">
                {isAnalyzing ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Cpu size={20} />
                  </motion.div>
                ) : (
                  <Cpu size={20} />
                )}
                {isAnalyzing ? 'Mistral AI Analyzing...' : 'Analyze with AI'}
              </button>
            ) : (
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', padding: '1rem', borderRadius: '0.5rem' }}>
                <p style={{ color: '#60a5fa', fontWeight: 'bold', marginBottom: '0.5rem' }}>AI Analysis Complete</p>
                <p style={{ fontSize: '0.9rem' }}>Estimated Nutrition Score: <strong>{aiData.nutritionScore}/100</strong></p>
                <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Remaining Safe Shelf Life: <strong>{aiData.expectedExpiryHours} hours</strong></p>
                <button onClick={handleSaveFood} className="glow-button" style={{ background: 'linear-gradient(90deg, #10b981, #059669)' }}>
                  Save Food to Inventory
                </button>
              </div>
            )}
          </div>
        )}

        <div className="inventory-list">
          {inventory.length === 0 ? <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>You have no active food listings.</p> : null}
          {inventory.map(item => (
            <div key={item._id} className="inventory-item">
              <div style={{ flex: 1 }}>
                <p className="item-name">{item.foodName}</p>
                <p className="item-meta">Weight: {item.weight}kg | AI Nutri-Score: {item.nutritionScore}</p>
                <p className="item-meta" style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8 }}>
                  Listed: {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className={`badge ${item.expectedExpiryHours <= 24 ? 'badge-danger' : 'badge-safe'}`}>
                  {item.expectedExpiryHours}h left
                </div>
                <button onClick={() => handleDeleteItem(item._id)} className="btn-danger">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}