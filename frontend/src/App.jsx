import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProviderDashboard from './pages/ProviderDashboard';
import NGODashboard from './pages/NGODashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/provider" element={<ProviderDashboard />} />
      <Route path="/ngo" element={<NGODashboard />} />
    </Routes>
  );
}

export default App;