import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { CheckCircle, AlertTriangle, Brain, Loader2, LogOut, Lightbulb, MessageSquare } from 'lucide-react';
import Login from './components/Login'; 
import History from './components/History'; 

function App() {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState(""); 
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('userToken'));
  const [userName, setUserName] = useState(localStorage.getItem('userName') || "");

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    setIsLoggedIn(false);
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!file || !jd) return alert("Select PDF and Paste JD!");
    setLoading(true);
    setResult(null);

    const token = localStorage.getItem('userToken'); 
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jd', jd);

    try {
      const res = await axios.post('http://localhost:5000/analyze', formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setResult(res.data);
      setRefreshHistory(prev => prev + 1); 
    } catch (err) { 
      alert("Error processing analysis!");
    }
    setLoading(false);
  };

  const renderList = (data) => {
    if (!data) return <p className="text-gray-600 text-sm">No data available</p>;
    
    if (Array.isArray(data)) {
      return data.map((item, i) => (
        <p key={i} className="bg-black/40 p-3 rounded-xl border border-gray-900 border-dashed mb-2 text-sm">
          • {item}
        </p>
      ));
    }
    
    if (typeof data === 'object') {
      return Object.entries(data).map(([key, value], i) => (
        <div key={i} className="bg-black/40 p-3 rounded-xl border border-gray-900 mb-2 text-sm">
          <strong className="text-green-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</strong> {Array.isArray(value) ? value.join(", ") : String(value)}
        </div>
      ));
    }

    return <p className="text-sm">{data}</p>;
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={(name) => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-green-500 p-2 rounded-lg text-black"><Brain size={30} /></div>
            <h1 className="text-3xl font-black italic uppercase">AI RESUME <span className="text-green-500">PRO</span></h1>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 font-bold uppercase text-xs">
            <LogOut size={18} /> Logout
          </button>
        </header>

        {/* Input Section */}
        <div className="bg-[#0a0a0a] border border-gray-800 p-8 rounded-[2rem] mb-12 shadow-2xl">
          <textarea 
            className="w-full h-32 bg-black border border-gray-800 rounded-2xl p-4 text-sm focus:border-green-500 outline-none mb-6"
            placeholder="Paste Job Description here..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="text-sm" />
            <button onClick={handleAnalyze} disabled={loading} className="w-full md:w-auto bg-green-600 px-10 py-4 rounded-full font-black uppercase tracking-widest hover:bg-green-500 transition-all">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : "GENERATE MATCH REPORT"}
            </button>
          </div>
        </div>

        {result && (
          <div className="space-y-10 mb-20">
            {/* ATS Score Header */}
            {/* ATS Score Header Section */}
<div className="bg-[#111] p-8 md:p-12 rounded-[2rem] border border-gray-800 shadow-[0_0_60px_-15px_rgba(34,197,94,0.15)] mb-10">
    <div className="flex flex-col md:flex-row items-center justify-around gap-10">
        
        {/* Left Side: Pie Chart Visualization */}
        <div className="relative w-[220px] h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={[
                            { value: result.overallScore },
                            { value: 100 - result.overallScore }
                        ]}
                        innerRadius={75}
                        outerRadius={95}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                    >
                        {/* Score Color (Green) */}
                        <Cell fill="#22c55e" />
                        {/* Background Track (Dark) */}
                        <Cell fill="#1a1a1a" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            {/* Center Percentage Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-white">{result.overallScore}%</span>
                <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Match</span>
            </div>
        </div>

        {/* Right Side: Detailed Stats */}
        <div className="text-center md:text-left space-y-4">
            <div>
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em] mb-1">ATS Optimization</h3>
                <h2 className="text-4xl font-black text-white italic uppercase">Analysis Report</h2>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <div className="bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-2xl">
                    <p className="text-[10px] text-green-500 font-bold uppercase">Status</p>
                    <p className="text-sm font-bold text-white">
                        {result.overallScore > 75 ? "Highly Compatible" : "Optimization Needed"}
                    </p>
                </div>
                
                <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-2xl">
                    <p className="text-[10px] text-red-500 font-bold uppercase">Rejection Risk</p>
                    <p className="text-sm font-bold text-white">{result.rejectionRisk}</p>
                </div>
            </div>

            <p className="text-gray-400 text-xs max-w-xs leading-relaxed">
                This score reflects how well your resume matches the job description based on keywords, skills, and formatting.
            </p>
        </div>

    </div>
</div>

            {/* Grid 1: Fit and Gaps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0f0f0f] p-8 rounded-[2rem] border border-gray-800 hover:border-green-500/50 transition-all">
                <h3 className="text-green-500 font-black text-xl mb-6 flex items-center gap-2 uppercase italic tracking-wider">
                    <CheckCircle size={24}/> Why You're a Fit
                </h3>
                {renderList(result.whyFit)}
              </div>
              
              <div className="bg-[#0f0f0f] p-8 rounded-[2rem] border border-gray-800 hover:border-yellow-500/50 transition-all">
                <h3 className="text-yellow-500 font-black text-xl mb-6 flex items-center gap-2 uppercase italic tracking-wider">
                    <AlertTriangle size={24}/> Skill Gaps Identified
                </h3>
                {renderList(result.skillGapAnalysis)}
              </div>
            </div>

            {/* Grid 2: Interview Prep and Improvement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0f0f0f] p-8 rounded-[2rem] border border-gray-800 hover:border-blue-500/50 transition-all">
                <h3 className="text-blue-500 font-black text-xl mb-6 flex items-center gap-2 uppercase italic tracking-wider">
                    <MessageSquare size={24}/> Interviewer Questions
                </h3>
                {renderList(result.interviewQuestions)}
              </div>

              <div className="bg-[#0f0f0f] p-8 rounded-[2rem] border border-gray-800 hover:border-purple-500/50 transition-all">
                <h3 className="text-purple-500 font-black text-xl mb-6 flex items-center gap-2 uppercase italic tracking-wider">
                    <Lightbulb size={24}/> Resume Improvement Tips
                </h3>
                {renderList(result.resumeFixes)}
              </div>
            </div>
          </div>
        )}

        <hr className="border-gray-900 mb-10" />
        <History refreshTrigger={refreshHistory} />
      </div>
    </div>
  );
}

export default App;