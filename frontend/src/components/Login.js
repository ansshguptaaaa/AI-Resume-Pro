import React, { useState } from 'react';
import axios from 'axios';
import { Brain, Mail, Lock, User, ArrowRight } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '', name: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const endpoint = isRegister ? 'register' : 'login';
        try {
            const res = await axios.post(`http://localhost:5000/${endpoint}`, formData);
            if (!isRegister) {
                localStorage.setItem('userToken', res.data.token);
                onLoginSuccess(res.data.name);
            } else {
                alert("Account Created! Please Login.");
                setIsRegister(false);
            }
        } catch (err) {
            alert(err.response?.data?.error || "Connection Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-[#0a0a0a] border border-gray-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                {/* Background Glow Effect */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/10 blur-[100px] rounded-full"></div>
                
                <div className="text-center mb-10">
                    <div className="inline-flex bg-green-500 p-3 rounded-2xl text-black mb-4 shadow-lg shadow-green-500/20">
                        <Brain size={32} />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                        AI RESUME <span className="text-green-500">PRO</span>
                    </h1>
                    <p className="text-gray-500 text-xs mt-2 font-bold tracking-widest uppercase">
                        {isRegister ? 'Join the Elite' : 'Welcome Back Agent'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegister && (
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input 
                                type="text" placeholder="Full Name" 
                                className="w-full bg-black border border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-green-500 outline-none transition-all placeholder:text-gray-700"
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                required
                            />
                        </div>
                    )}

                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            type="email" placeholder="Email Address" 
                            className="w-full bg-black border border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-green-500 outline-none transition-all placeholder:text-gray-700"
                            onChange={(e) => setFormData({...formData, email: e.target.value})} 
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            type="password" placeholder="Secure Password" 
                            className="w-full bg-black border border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-green-500 outline-none transition-all placeholder:text-gray-700"
                            onChange={(e) => setFormData({...formData, password: e.target.value})} 
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-green-500 hover:bg-green-400 text-black py-4 rounded-full font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 mt-6 shadow-lg shadow-green-900/20 disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : (
                            <>
                                {isRegister ? 'Create Account' : 'Initialize Session'}
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button 
                        onClick={() => setIsRegister(!isRegister)}
                        className="text-gray-500 text-xs font-bold uppercase tracking-wider hover:text-green-500 transition-colors"
                    >
                        {isRegister ? 'Already Registered? Login' : 'Need an Access Key? Register'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;