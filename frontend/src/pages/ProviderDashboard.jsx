import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { LogOut, Trash2, Plus } from 'lucide-react';

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({
    foodName: '', foodCategory: 'Produce', weight: '', nutritionScore: '', expectedExpiryHours: '', quantity: '1'
  });

  const fetchInventory = async (providerId) => {
    try {
      const res = await api.get(`/food/provider/${providerId}`);
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
      setUser(parsedUser);
      fetchInventory(parsedUser._id);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newItem,
        weight: Number(newItem.weight),
        nutritionScore: Number(newItem.nutritionScore),
        expectedExpiryHours: Number(newItem.expectedExpiryHours),
        quantity: Number(newItem.quantity),
        providerId: user._id,
        providerName: user.organizationName,
        addressLine: user.addressLine,
        city: user.city,
        state: user.state,
        pincode: user.pincode
      };
      await api.post('/food', payload);
      setIsAdding(false);
      setNewItem({ foodName: '', foodCategory: 'Produce', weight: '', nutritionScore: '', expectedExpiryHours: '', quantity: '1' });
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
          <button onClick={() => setIsAdding(!isAdding)} className="btn-outline" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> {isAdding ? 'Cancel' : 'Post Food'}
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleAddItem} className="add-form">
            <input required type="text" placeholder="Food Name" className="form-input" value={newItem.foodName} onChange={e => setNewItem({...newItem, foodName: e.target.value})} />
            <input required type="text" placeholder="Category" className="form-input" value={newItem.foodCategory} onChange={e => setNewItem({...newItem, foodCategory: e.target.value})} />
            <input required type="number" placeholder="Weight (kg)" className="form-input" value={newItem.weight} onChange={e => setNewItem({...newItem, weight: e.target.value})} />
            <input required type="number" placeholder="Nutrition Score (1-100)" className="form-input" value={newItem.nutritionScore} onChange={e => setNewItem({...newItem, nutritionScore: e.target.value})} />
            <input required type="number" placeholder="Expiry (Hours)" className="form-input" value={newItem.expectedExpiryHours} onChange={e => setNewItem({...newItem, expectedExpiryHours: e.target.value})} />
            <input required type="number" placeholder="Quantity" className="form-input" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} />
            <button type="submit" className="glow-button" style={{ gridColumn: 'span 2' }}>Add to Available Inventory</button>
          </form>
        )}

        <div className="inventory-list">
          {inventory.length === 0 ? <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>You have no active food listings.</p> : null}
          {inventory.map(item => (
            <div key={item._id} className="inventory-item">
              <div style={{ flex: 1 }}>
                <p className="item-name">{item.foodName}</p>
                <p className="item-meta">Weight: {item.weight}kg | Nutri-Score: {item.nutritionScore} | Quantity: {item.quantity}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className={`badge ${item.expectedExpiryHours <= 24 ? 'badge-danger' : 'badge-safe'}`}>
                  Expires in {item.expectedExpiryHours}h
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