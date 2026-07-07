import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Search from './pages/Search';
import Chat from './pages/Chat';
import History from './pages/History';
import Layout from './components/layout/Layout';
import './index.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <WorkspaceProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/*" element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route index element={<Dashboard />} />
                    <Route path="documents" element={<Documents />} />
                    <Route path="search" element={<Search />} />
                    <Route path="chat" element={<Chat />} />
                    <Route path="history/:type" element={<History />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            }/>
          </Routes>
        </WorkspaceProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;