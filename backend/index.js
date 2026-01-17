require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const PDFParser = require("pdf2json");
const Groq = require("groq-sdk");
const mongoose = require('mongoose');
const redis = require('redis'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully!"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));

const redisClient = redis.createClient({
    url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.log('❌ Redis Error', err));

(async () => {
    try {
        await redisClient.connect();
        console.log("⚡ Redis Cloud Connected!");
    } catch (err) {
        console.error("❌ Redis Connection Failed:", err);
    }
})();

// 2. Models
const User = mongoose.model('User', new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String }
}));

const Analysis = mongoose.model('Analysis', new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    jd: String,
    score: Number,
    analysis: Object,
    createdAt: { type: Date, default: Date.now }
}));

// 3. JWT Middleware
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ error: "No token provided" });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Unauthorized" });
        req.userId = decoded.id; 
        next();
    });
};

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const upload = multer({ storage: multer.memoryStorage() });

// --- ROUTES ---

app.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await User.create({ email: req.body.email, password: hashedPassword, name: req.body.name });
        res.status(201).json({ message: "Registered Successfully" });
    } catch (err) { res.status(500).json({ error: "Failed to register" }); }
});

app.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, name: user.name });
    } else { res.status(401).json({ error: "Invalid login" }); }
});

app.get('/my-history', verifyToken, async (req, res) => {
    try {
        const history = await Analysis.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch history" });
    }
});

app.delete('/delete-analysis/:id', verifyToken, async (req, res) => {
    try {
        const deletedItem = await Analysis.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.userId 
        });
        if (!deletedItem) return res.status(404).json({ error: "Item not found" });
        res.json({ message: "Record deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server Error during deletion" });
    }
});

// 6. Analysis Route (Advanced Prompt & Caching)
app.post('/analyze', verifyToken, upload.single('resume'), (req, res) => {
    const { jd } = req.body;
    console.log("📥 Request Received! Processing ATS Scan...");

    if (!req.file || !jd) {
        return res.status(400).json({ error: "Resume & JD required" });
    }

    const pdfParser = new PDFParser(null, 1);

    pdfParser.on("pdfParser_dataError", (errData) => {
        console.error("❌ PDF Error:", errData.parserError);
        res.status(500).json({ error: "PDF Error" });
    });

    pdfParser.on("pdfParser_dataReady", async () => {
        try {
            const resumeText = pdfParser.getRawTextContent();
            
            // Unique key for Redis
            const cacheKey = `analysis:${req.userId}:${jd.replace(/\s+/g, '_').slice(0, 30)}`;
            const cachedData = await redisClient.get(cacheKey);

            if (cachedData) {
                console.log("🚀 REDIS CACHE HIT!");
                return res.json(JSON.parse(cachedData));
            }

            console.log("🤖 CACHE MISS! Generating Deep Analysis...");

            const completion = await groq.chat.completions.create({
                messages: [
                    { 
                        role: "system", 
                        content: `Return ONLY JSON with these keys: 
                        overallScore (number 0-100), 
                        rejectionRisk (string), 
                        whyFit (array of exactly 5 strings), 
                        skillGapAnalysis (array of exactly 5 strings), 
                        interviewQuestions (array of exactly 5 strings), 
                        resumeFixes (array of exactly 5 strings). 
                        
                        Context: The overallScore is the ATS Score. Be strict but fair.` 
                    },
                    { role: "user", content: `JD: ${jd} \n\n RESUME: ${resumeText}` }
                ],
                model: "llama-3.3-70b-versatile",
                response_format: { type: "json_object" }
            });

            const aiResponse = JSON.parse(completion.choices[0].message.content);

            await Analysis.create({
                userId: req.userId,
                jd: jd,
                score: aiResponse.overallScore,
                analysis: aiResponse
            });

            await redisClient.setEx(cacheKey, 86400, JSON.stringify(aiResponse));
            console.log("✅ Analysis Complete & Cached");

            res.json(aiResponse);

        } catch (err) {
            console.error("❌ Error:", err);
            res.status(500).json({ error: "Processing Error" });
        }
    });

    pdfParser.parseBuffer(req.file.buffer);
});

app.listen(5000, () => console.log("🚀 Server Live on Port 5000"));