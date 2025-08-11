import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/user';

const app = new Hono();

// 미들웨어
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:8080', 'https://your-frontend-domain.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// 헬스체크
app.get('/', (c) => {
  return c.json({ 
    message: 'Lean Stack BFF API', 
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 라우트
app.route('/auth', authRoutes);
app.route('/user', userRoutes);

// 404 핸들러
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// 에러 핸들러
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;
