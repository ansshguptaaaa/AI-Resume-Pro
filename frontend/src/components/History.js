import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Clock, Download, BarChart2, Loader2, RefreshCcw, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';

const History = ({ refreshTrigger }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        try {
            const token = localStorage.getItem('userToken');
            if (!token) return;

            const res = await axios.get('http://localhost:5000/my-history', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log("History Received:", res.data);
            setHistory(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory, refreshTrigger]);

    const downloadPDF = (item) => {
        const doc = new jsPDF();
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, 210, 297, 'F');
        doc.setTextColor(34, 197, 94);
        doc.setFontSize(22);
        doc.text("AI RESUME PRO REPORT", 20, 30);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.text(`Date: ${new Date(item.createdAt).toLocaleDateString()}`, 20, 45);
        doc.text(`Score: ${item.score}%`, 20, 55);
        doc.save(`Report_${item.score}.pdf`);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Kya aap is report ko delete karna chahte hain?")) return;

        try {
            const token = localStorage.getItem('userToken');
            await axios.delete(`http://localhost:5000/delete-analysis/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // UI refresh karne ke liye
            fetchHistory(); 
        } catch (err) {
            alert("Delete nahi ho paya! Backend check karein.");
            console.error(err);
        }
    };

    if (loading) return (
        <div className="flex justify-center p-10">
            <Loader2 className="animate-spin text-green-500" size={32} />
        </div>
    );

    return (
        <div className="mt-10 max-w-5xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black italic text-green-500 uppercase flex items-center gap-2">
                    <Clock size={28} /> YOUR SCAN HISTORY
                </h2>
                <button onClick={fetchHistory} className="text-xs text-gray-500 hover:text-green-500 flex items-center gap-1 uppercase font-bold">
                    <RefreshCcw size={14} /> Refresh
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {history.length > 0 ? history.map((item) => (
                    <div key={item._id} className="bg-[#0a0a0a] border border-gray-800 p-8 rounded-[2rem] hover:border-green-500/50 transition-all text-left group">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Score</p>
                                <p className="text-5xl font-black text-white">{item.score}%</p>
                            </div>
                            
                            {/* Icons Container */}
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => downloadPDF(item)} 
                                    className="bg-green-500/10 p-3 rounded-xl text-green-500 hover:bg-green-500 hover:text-black transition-all"
                                    title="Download PDF"
                                >
                                    <Download size={20} />
                                </button>
                                
                                <button 
                                    onClick={() => handleDelete(item._id)} 
                                    className="bg-red-500/10 p-3 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                    title="Delete Report"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>

                        <p className="text-gray-400 text-sm line-clamp-2 italic mb-4">JD: {item.jd}</p>
                        
                        <div className="pt-4 border-t border-gray-900 flex justify-between items-center">
                            <p className="text-[10px] text-gray-600 font-mono">{new Date(item.createdAt).toLocaleDateString()}</p>
                            <BarChart2 size={16} className="text-gray-800 group-hover:text-green-500" />
                        </div>
                    </div>
                )) : (
                    <p className="col-span-full text-gray-600 italic">No scans found yet. Analyze a resume to see history!</p>
                )}
            </div>
        </div>
    );
};

export default History;