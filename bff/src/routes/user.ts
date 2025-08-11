import { Hono } from 'hono';
import { authMiddleware, AuthContext } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const user = new Hono();

// 인증 미들웨어 적용
user.use('*', authMiddleware);

// 프로필 조회
user.get('/profile', async (c: AuthContext) => {
  try {
    if (!c.user) {
      return c.json({ error: 'User not found' }, 401);
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', c.user.id)
      .single();

    if (error) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    return c.json({ profile });

  } catch (error) {
    console.error('Get profile error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// 프로필 업데이트
user.put('/profile', async (c: AuthContext) => {
  try {
    if (!c.user) {
      return c.json({ error: 'User not found' }, 401);
    }

    const { full_name, avatar_url } = await c.req.json();

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        full_name: full_name || null,
        avatar_url: avatar_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', c.user.id)
      .select()
      .single();

    if (error) {
      return c.json({ error: error.message }, 400);
    }

    return c.json({ 
      message: 'Profile updated successfully',
      profile 
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// 계정 삭제
user.delete('/account', async (c: AuthContext) => {
  try {
    if (!c.user) {
      return c.json({ error: 'User not found' }, 401);
    }

    // 프로필 삭제
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', c.user.id);

    if (profileError) {
      console.error('Profile deletion error:', profileError);
    }

    // Supabase Auth에서 사용자 삭제
    const { error } = await supabase.auth.admin.deleteUser(c.user.id);

    if (error) {
      return c.json({ error: error.message }, 400);
    }

    return c.json({ message: 'Account deleted successfully' });

  } catch (error) {
    console.error('Delete account error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { user as userRoutes };
