import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="glass p-8 w-full max-w-md  ">
        
        <h1 className="text-2xl font-bold mb-6 text-white">Sign in to ContextOS</h1>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-400"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-400"
          />
          {/* BUG FIX: removed debug "TEST BUTTON" that was left inside the form */}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 font-semibold"
          >
            Sign In
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyan-400">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
