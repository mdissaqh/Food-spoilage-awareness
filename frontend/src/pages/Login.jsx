import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Cpu } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationType: 'Hostel',
    uniqueID: '',
    mobileNumber: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (isRegister) {
        res = await api.post('/register', formData);
      } else {
        res = await api.post('/login', { uniqueID: formData.uniqueID });
      }
      
      const user = res.data;
      localStorage.setItem('user', JSON.stringify(user));
      
      if (user.organizationType === 'NGO') {
        navigate('/ngo');
      } else {
        navigate('/provider');
      }
    } catch (err) {
      alert(err.response?.data?.error || "An error occurred");
    }
  };

  return (
    <div className="app-container">
      <div className="auth-container glass-panel">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="title" style={{ justifyContent: 'center' }}>
            <Cpu color="#60a5fa" /> Quantum Knapsack
          </h1>
          <p className="subtitle">Spoilage-Aware Food Optimization</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <input 
            required 
            name="uniqueID" 
            placeholder="Unique Organization ID" 
            className="form-input" 
            value={formData.uniqueID} 
            onChange={handleChange} 
          />

          {isRegister && (
            <>
              <input required name="organizationName" placeholder="Organization Name" className="form-input" value={formData.organizationName} onChange={handleChange} />
              <select required name="organizationType" className="form-input form-select" value={formData.organizationType} onChange={handleChange}>
                <option value="Hostel">Hostel</option>
                <option value="Canteen">Canteen</option>
                <option value="PG">PG</option>
                <option value="Restaurant">Restaurant</option>
                <option value="NGO">NGO</option>
              </select>
              <input required name="mobileNumber" placeholder="Mobile Number" className="form-input" value={formData.mobileNumber} onChange={handleChange} />
              <input required name="addressLine" placeholder="Address Line" className="form-input" value={formData.addressLine} onChange={handleChange} />
              <input required name="city" placeholder="City" className="form-input" value={formData.city} onChange={handleChange} />
              <input required name="state" placeholder="State" className="form-input" value={formData.state} onChange={handleChange} />
              <input required name="pincode" placeholder="Pincode" className="form-input" value={formData.pincode} onChange={handleChange} />
            </>
          )}

          <button type="submit" className="glow-button" style={{ marginTop: '1rem' }}>
            {isRegister ? 'Register & Enter' : 'Login'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
          {isRegister ? "Already registered? " : "New organization? "}
          <span 
            style={{ color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? 'Login here' : 'Register here'}
          </span>
        </p>
      </div>
    </div>
  );
}