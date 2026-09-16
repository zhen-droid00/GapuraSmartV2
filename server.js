import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware untuk mem-parsing JSON dari request body
app.use(express.json());

// Sajikan file statis (Frontend) dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/data', async (req, res) => {
    try {
        // Membaca file data.json sebagai database lokal
        const dataPath = path.join(__dirname, 'data.json');
        const rawData = await fs.readFile(dataPath, 'utf-8');
        res.json(JSON.parse(rawData));
    } catch (error) {
        console.error("Gagal membaca database:", error);
        res.status(500).json({ error: "Gagal memuat data operasional." });
    }
});

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    
    // API Key Anda dimasukkan di sini. Jangan bagikan file ini ke publik jika sudah ada API key-nya.
    const apiKey = process.env.GEMINI_API_KEY || "MASUKKAN_API_KEY_ANDA_DISINI"; 
    
    if (!message) {
        return res.status(400).json({ error: "Pesan tidak boleh kosong." });
    }

    if (!apiKey || apiKey === "MASUKKAN_API_KEY_ANDA_DISINI") {
        return res.status(503).json({ error: "API Key AI belum dikonfigurasi di server." });
    }

    const systemPrompt = "Anda adalah instruktur/manajer operasional ground handling bandara (Gapura Angkasa) yang ahli. Berikan jawaban singkat, praktis, dan profesional kepada staf lapangan terkait operasional bandara, pelayanan penumpang, penyelesaian masalah, atau regulasi keselamatan penerbangan. Jawab dalam bahasa Indonesia. Jika pertanyaan di luar konteks penerbangan, arahkan mereka kembali ke topik operasional.";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: message }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
    };

    try {
        const aiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!aiResponse.ok) throw new Error(`Google API Error: ${aiResponse.status}`);
        
        const result = await aiResponse.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (text) {
            res.json({ reply: text });
        } else {
            throw new Error("Tidak ada teks yang dikembalikan oleh AI.");
        }
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Maaf, Asisten AI sedang mengalami kendala jaringan atau server." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server Gapura Smart berjalan di http://localhost:${PORT}`);
    console.log(`📁 Pastikan file frontend Anda (index.html) berada di dalam folder 'public/'`);
});