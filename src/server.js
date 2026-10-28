require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit'); // <-- NEW IMPORT

const { errorHandler } = require('./middleware/errorHandler');

const authRoutes       = require('./routes/auth');
const studentRoutes    = require('./routes/students');
const teacherRoutes    = require('./routes/teachers');
const courseRoutes     = require('./routes/courses');
const enrollmentRoutes = require('./routes/enrollments');
const assessmentRoutes = require('./routes/assessments');
const noticeRoutes     = require('./routes/notices');

const app = express();

app.use(helmet());
app.use(cors({
  
  origin: ['http://localhost:5173', 'http://localhost:8081'], // <-- Added Expo default port
  credentials: true
}));
app.use(express.json());

// --- RATE LIMITING SETUP ---

// 1. Global Limiter: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// 2. Auth Limiter: 5 login attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: { error: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply the global limiter to all requests
app.use(globalLimiter);

// --- ROUTES ---

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Apply the strict authLimiter specifically to the login route
app.use('/api/auth/login', authLimiter); 

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/notices', noticeRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));