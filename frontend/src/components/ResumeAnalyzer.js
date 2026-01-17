import React, { useState } from 'react';
import axios from 'axios';

const ResumeAnalyzer = () => {
    const [file, setFile] = useState(null);
    const [jd, setJd] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!file || !jd) return alert("Please upload resume and JD");
        setLoading(true);
        
        const token = localStorage.getItem('userToken'); // Token nikala
        const formData = new FormData();
        formData.append('resume', file);
        formData.append('jd', jd);

        try {
            const res = await axios.post('http://localhost:5000/analyze', formData, {
                headers: { 
                    'Authorization': `Bearer ${token}` // Backend ko token bheja
                }
            });
            setResult(res.data);
        } catch (err) {
            alert("Session Expired or Backend Error. Please login again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ color: 'white', padding: '20px' }}>
            <textarea placeholder="Paste Job Description here..." onChange={e => setJd(e.target.value)} style={{ width: '100%', height: '100px', marginBottom: '10px' }} />
            <input type="file" onChange={e => setFile(e.target.files[0])} />
            <button onClick={handleAnalyze} disabled={loading} style={{ padding: '10px 20px', marginLeft: '10px' }}>
                {loading ? "Analyzing..." : "Analyze Resume"}
            </button>

            {result && (
                <div style={{ marginTop: '20px', border: '1px solid green', padding: '10px' }}>
                    <h3>Score: {result.overallScore}</h3>
                    <p>Risk: {result.rejectionRisk}</p>
                    {/* Baaki results yahan map karein */}
                </div>
            )}
        </div>
    );
};

export default ResumeAnalyzer;