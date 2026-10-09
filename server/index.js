import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { analyzeWithGemini } from './gemini.js';
import { storage } from './storage.js';
import { runSeed } from './seed.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve static frontend build if present
const CLIENT_DIST = path.join(__dirname, '../client/dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
}

// Ensure upload directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure Multer for file uploads
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || (file.mimetype.includes('image') ? '.jpg' : '.webm');
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB max
});

// Seed data automatically if database is empty
if (storage.getAll().length === 0) {
  runSeed();
}

/**
 * HEALTH CHECK & METADATA
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'CivicLens API Server',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE'),
    recordsCount: storage.getAll().length
  });
});

/**
 * 1. MULTIMODAL GEMINI INTAKE ANALYSIS
 * Supports photo only, audio only, text only, or combined.
 */
app.post(
  '/api/analyze',
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const text = req.body.text || '';
      const languageHint = req.body.languageHint || '';
      const photoFile = req.files?.photo?.[0];
      const audioFile = req.files?.audio?.[0];

      let imageBuffer = null;
      let imageMimeType = 'image/jpeg';
      let imageUrl = null;

      if (photoFile) {
        imageBuffer = fs.readFileSync(photoFile.path);
        imageMimeType = photoFile.mimetype;
        imageUrl = `/uploads/${photoFile.filename}`;
      } else if (req.body.imageBase64) {
        // Support direct base64 from privacy blur canvas
        const base64Data = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
        imageBuffer = Buffer.from(base64Data, 'base64');
        const filename = `photo-canvas-${Date.now()}.jpg`;
        fs.writeFileSync(path.join(UPLOADS_DIR, filename), imageBuffer);
        imageUrl = `/uploads/${filename}`;
      }

      let audioBuffer = null;
      let audioMimeType = 'audio/webm';
      let audioUrl = null;

      if (audioFile) {
        audioBuffer = fs.readFileSync(audioFile.path);
        audioMimeType = audioFile.mimetype;
        audioUrl = `/uploads/${audioFile.filename}`;
      }

      // If user provided neither photo, nor audio, nor text
      if (!imageBuffer && !audioBuffer && !text.trim()) {
        return res.status(400).json({
          error: "Empty input. Please provide a photo, voice note, or text description of the civic problem."
        });
      }

      const analysis = await analyzeWithGemini({
        text,
        imageBuffer,
        imageMimeType,
        audioBuffer,
        audioMimeType,
        languageHint
      });

      res.json({
        ...analysis,
        uploadedMedia: {
          imageUrl,
          audioUrl
        }
      });
    } catch (err) {
      console.error('[API Analyze Error]', err);
      res.status(500).json({
        error: "Failed to analyze complaint intake",
        details: err.message
      });
    }
  }
);

/**
 * 2. COMPLAINT CREATION / SUBMISSION
 */
app.post('/api/complaints', (req, res) => {
  try {
    const payload = req.body;
    if (!payload.formal_complaint_draft && !payload.issue_category) {
      return res.status(400).json({ error: "Missing required complaint details." });
    }

    const created = storage.create(payload);
    res.status(201).json(created);
  } catch (err) {
    console.error('[API Complaint Create Error]', err);
    res.status(500).json({ error: "Failed to file complaint." });
  }
});

/**
 * 3. GET ALL COMPLAINTS
 */
app.get('/api/complaints', (req, res) => {
  const { status, category } = req.query;
  let items = storage.getAll();

  if (status) items = items.filter(c => c.status === status);
  if (category) items = items.filter(c => c.issue_category === category);

  res.json(items);
});

/**
 * 4. GET SINGLE COMPLAINT
 */
app.get('/api/complaints/:id', (req, res) => {
  const complaint = storage.getById(req.params.id);
  if (!complaint) {
    return res.status(400).json({ error: "Complaint not found." });
  }
  res.json(complaint);
});

/**
 * 5. UPDATE COMPLAINT STATUS (MUNICIPAL LIFECYCLE)
 * Submitted -> Acknowledged -> In Progress -> Resolved
 */
app.patch('/api/complaints/:id/status', (req, res) => {
  const { status, note } = req.body;
  const allowed = ['Submitted', 'Acknowledged', 'In Progress', 'Resolved'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
  }

  const updated = storage.updateStatus(req.params.id, status, note);
  if (!updated) {
    return res.status(404).json({ error: "Complaint not found." });
  }
  res.json(updated);
});

/**
 * 6. CITIZEN UPVOTE ("ME TOO" / ENDORSEMENT)
 */
app.post('/api/complaints/:id/upvote', (req, res) => {
  const updated = storage.upvote(req.params.id);
  if (!updated) {
    return res.status(404).json({ error: "Complaint not found." });
  }
  res.json({ id: updated.id, upvotes: updated.upvotes });
});

/**
 * 7. ADMIN CLUSTERS & PRIORITY QUEUE
 */
app.get('/api/admin/clusters', (req, res) => {
  const clusters = storage.getClusters();
  res.json(clusters);
});

/**
 * 8. ADMIN DASHBOARD METRICS
 */
app.get('/api/admin/metrics', (req, res) => {
  const metrics = storage.getMetrics();
  res.json(metrics);
});

/**
 * 9. GET EMERGENCY HELPLINES
 */
app.get('/api/helplines', (req, res) => {
  const raw = fs.readFileSync(path.join(__dirname, 'helplines.json'), 'utf-8');
  res.json(JSON.parse(raw));
});

/**
 * 10. GET VERIFIED DEPARTMENTS
 */
app.get('/api/departments', (req, res) => {
  const raw = fs.readFileSync(path.join(__dirname, 'departments.json'), 'utf-8');
  res.json(JSON.parse(raw));
});

/**
 * 11. RE-SEED ROUTE (FOR DEMO RESET)
 */
app.post('/api/seed/reset', (req, res) => {
  runSeed();
  res.json({ message: "Seed data successfully reloaded." });
});

/**
 * 12. CLIENT SPA FALLBACK ROUTE
 */
app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  const indexPath = path.join(CLIENT_DIST, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send("CivicLens API Server is online. Client build not found.");
  }
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`[CivicLens Backend] Server running on http://localhost:${PORT}`);
  console.log(`[CivicLens Backend] Ready for multimodal intake & triage`);
  console.log(`=======================================================`);
});
