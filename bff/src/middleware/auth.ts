import { Context, Next } from 'hono';
import { supabase } from '../lib/supabase';

export interface AuthContext extends Context {
  user?: {
    id: string;
    email: string;
  };
}

export const authMiddleware = async (c: AuthContext, next: Next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized - Invalid token' }, 401);
    }

    // 사용자 정보를 컨텍스트에 추가
    c.user = {
      id: user.id,
      email: user.email || '',
    };

    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Unauthorized - Token verification failed' }, 401);
  }
};
