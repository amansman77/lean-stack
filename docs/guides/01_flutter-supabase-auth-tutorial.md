# Flutter Web + Supabase Auth 개발 가이드

## 📋 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택](#기술-스택)
3. [환경 설정](#환경-설정)
4. [Supabase 설정](#supabase-설정)
5. [Flutter 프로젝트 구조](#flutter-프로젝트-구조)
6. [인증 시스템 구현](#인증-시스템-구현)
7. [UI 구현](#ui-구현)
8. [테스트 및 실행](#테스트-및-실행)
9. [배포](#배포)
10. [문제 해결](#문제-해결)

## 프로젝트 개요

이 가이드는 Flutter Web을 사용하여 Supabase Auth와 연계된 회원가입/로그인 시스템을 구축하는 방법을 설명합니다.

### 구현된 기능
- ✅ 회원가입 (이메일/비밀번호)
- ✅ 로그인/로그아웃
- ✅ 비밀번호 재설정
- ✅ JWT 토큰 기반 인증
- ✅ 사용자 프로필 관리
- ✅ 반응형 웹 UI

## 기술 스택

| 계층 | 기술 | 버전 | 역할 |
|------|------|------|------|
| **프론트엔드** | Flutter | 3.32.8+ | 크로스 플랫폼 UI |
| **상태 관리** | Provider | 6.1.5 | 상태 관리 |
| **인증/DB** | Supabase | 최신 | 인증 및 데이터베이스 |
| **개발 도구** | Flutter Web | - | 웹 개발 |

## 환경 설정

### 1. Flutter SDK 설치

```bash
# macOS (Homebrew)
brew install flutter

# 설치 확인
flutter doctor
```

### 2. 프로젝트 생성

```bash
# Flutter 프로젝트 생성
flutter create leanstack_auth
cd leanstack_auth

# 의존성 추가
flutter pub add supabase_flutter provider
```

### 3. 개발 환경 확인

```bash
# 사용 가능한 디바이스 확인
flutter devices

# 웹 지원 확인
flutter config --enable-web
```

## Supabase 설정

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 접속
2. 새 프로젝트 생성
3. 프로젝트 URL과 API 키 복사

### 2. 데이터베이스 스키마 설정

SQL Editor에서 다음 스키마 실행:

```sql
-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles(created_at);
```

### 3. 인증 설정

1. **Authentication > Settings**에서 이메일 템플릿 설정
2. **Site URL** 설정: `http://localhost:8080`
3. **Redirect URLs** 설정: `http://localhost:8080/**`

## Flutter 프로젝트 구조

```
lib/
├── config/
│   └── app_config.dart          # 환경 설정
├── services/
│   └── supabase_service.dart    # Supabase 클라이언트
├── providers/
│   └── auth_provider.dart       # 인증 상태 관리
├── screens/
│   ├── signin_screen.dart       # 로그인 화면
│   ├── signup_screen.dart       # 회원가입 화면
│   └── home_screen.dart         # 홈 화면
└── main.dart                    # 앱 진입점
```

## 인증 시스템 구현

### 1. 환경 설정 (`lib/config/app_config.dart`)

```dart
import 'package:flutter/foundation.dart';

class AppConfig {
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://your-project.supabase.co',
  );
  
  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'your-anon-key',
  );
  
  static bool get isDebug => kDebugMode;
  static bool get isRelease => kReleaseMode;
  static bool get isProfile => kProfileMode;
}
```

### 2. Supabase 서비스 (`lib/services/supabase_service.dart`)

```dart
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/app_config.dart';

class SupabaseService {
  static final SupabaseService _instance = SupabaseService._internal();
  factory SupabaseService() => _instance;
  SupabaseService._internal();

  late final SupabaseClient _client;

  Future<void> initialize() async {
    await Supabase.initialize(
      url: AppConfig.supabaseUrl,
      anonKey: AppConfig.supabaseAnonKey,
      debug: AppConfig.isDebug,
    );
    _client = Supabase.instance.client;
  }

  SupabaseClient get client => _client;
  User? get currentUser => _client.auth.currentUser;
  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  // 회원가입
  Future<AuthResponse> signUp({
    required String email,
    required String password,
    String? fullName,
  }) async {
    return await _client.auth.signUp(
      email: email,
      password: password,
      data: {'full_name': fullName},
    );
  }

  // 로그인
  Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) async {
    return await _client.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  // 로그아웃
  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  // 비밀번호 재설정
  Future<void> resetPassword(String email) async {
    await _client.auth.resetPasswordForEmail(email);
  }
}
```

### 3. 인증 Provider (`lib/providers/auth_provider.dart`)

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/supabase_service.dart';

class AuthProvider extends ChangeNotifier {
  final SupabaseService _supabaseService = SupabaseService();
  
  User? _currentUser;
  bool _isLoading = false;
  String? _error;

  User? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _currentUser != null;

  AuthProvider() {
    _initializeAuth();
  }

  void _initializeAuth() {
    _currentUser = _supabaseService.currentUser;
    
    _supabaseService.authStateChanges.listen((data) {
      _currentUser = data.session?.user;
      _error = null;
      notifyListeners();
    });
  }

  Future<bool> signUp({
    required String email,
    required String password,
    String? fullName,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      final response = await _supabaseService.signUp(
        email: email,
        password: password,
        fullName: fullName,
      );

      if (response.user != null) {
        _currentUser = response.user;
        _setLoading(false);
        return true;
      } else {
        _setError('회원가입에 실패했습니다.');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    }
  }

  Future<bool> signIn({
    required String email,
    required String password,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      final response = await _supabaseService.signIn(
        email: email,
        password: password,
      );

      if (response.user != null) {
        _currentUser = response.user;
        _setLoading(false);
        return true;
      } else {
        _setError('로그인에 실패했습니다.');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    }
  }

  Future<void> signOut() async {
    _setLoading(true);
    
    try {
      await _supabaseService.signOut();
      _currentUser = null;
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    _isLoading = false;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }
}
```

## UI 구현

### 1. 메인 앱 (`lib/main.dart`)

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/supabase_service.dart';
import 'providers/auth_provider.dart';
import 'screens/signin_screen.dart';
import 'screens/signup_screen.dart';
import 'screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Supabase 초기화
  try {
    await SupabaseService().initialize();
    print('Supabase initialized successfully');
  } catch (e) {
    print('Supabase initialization failed: $e');
    print('App will continue without Supabase connection');
  }
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: MaterialApp(
        title: 'Lean Stack Auth',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
          useMaterial3: true,
        ),
        initialRoute: '/',
        routes: {
          '/': (context) => const AuthWrapper(),
          '/signin': (context) => const SignInScreen(),
          '/signup': (context) => const SignUpScreen(),
          '/home': (context) => const HomeScreen(),
        },
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        if (authProvider.isLoading) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (authProvider.isAuthenticated) {
          return const HomeScreen();
        }

        return const SignInScreen();
      },
    );
  }
}
```

### 2. 로그인 화면 (`lib/screens/signin_screen.dart`)

주요 특징:
- 이메일/비밀번호 입력 필드
- 비밀번호 표시/숨김 토글
- 폼 유효성 검사
- 로딩 상태 표시
- 에러 메시지 표시
- 비밀번호 재설정 다이얼로그
- 회원가입 페이지 링크

### 3. 회원가입 화면 (`lib/screens/signup_screen.dart`)

주요 특징:
- 이름, 이메일, 비밀번호, 비밀번호 확인 입력
- 실시간 폼 유효성 검사
- 비밀번호 일치 확인
- 이메일 형식 검증
- 로딩 상태 및 에러 처리

### 4. 홈 화면 (`lib/screens/home_screen.dart`)

주요 특징:
- 사용자 정보 표시
- 환영 메시지
- 기능 카드 그리드
- 로그아웃 기능
- 앱 정보 다이얼로그

## 테스트 및 실행

### 1. 환경 변수 설정

```bash
# .env 파일 생성
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 2. Flutter 앱 실행

```bash
# 의존성 설치
flutter pub get

# 웹 서버로 실행
flutter run -d web-server --web-port 8080 \
  --dart-define=SUPABASE_URL=$SUPABASE_URL \
  --dart-define=SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
```

### 3. 브라우저에서 확인

- **http://localhost:8080** 접속
- 회원가입 → 로그인 → 홈 화면 순서로 테스트
- 로그아웃 기능 확인

### 4. 기능 테스트 체크리스트

- [ ] 회원가입 (이메일, 비밀번호, 이름)
- [ ] 이메일 인증 (Supabase 대시보드에서 확인)
- [ ] 로그인 (이메일, 비밀번호)
- [ ] 비밀번호 재설정
- [ ] 로그아웃
- [ ] 사용자 정보 표시
- [ ] 반응형 UI (다양한 화면 크기)

## 배포

### 1. Flutter Web 빌드

```bash
# 프로덕션 빌드
flutter build web --release

# 환경 변수와 함께 빌드
flutter build web --release \
  --dart-define=SUPABASE_URL=$SUPABASE_URL \
  --dart-define=SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
```

### 2. 배포 옵션

#### Vercel 배포
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

#### Netlify 배포
```bash
# build/web 폴더를 Netlify에 업로드
# 또는 GitHub 연동으로 자동 배포
```

#### Firebase Hosting
```bash
# Firebase CLI 설치
npm install -g firebase-tools

# 초기화 및 배포
firebase init hosting
firebase deploy
```

### 3. Supabase 프로덕션 설정

1. **Site URL** 업데이트: 실제 도메인으로 변경
2. **Redirect URLs** 업데이트: `https://yourdomain.com/**`
3. **CORS 설정** 확인

## 문제 해결

### 1. 일반적인 오류

#### Supabase 연결 오류
```
Error: Supabase initialization failed
```
**해결책:**
- 환경 변수 확인
- Supabase 프로젝트 URL/키 확인
- 네트워크 연결 확인

#### CORS 오류
```
CORS policy: No 'Access-Control-Allow-Origin' header
```
**해결책:**
- Supabase 대시보드에서 CORS 설정 확인
- Site URL 설정 확인

#### 인증 오류
```
Invalid login credentials
```
**해결책:**
- 이메일 인증 완료 확인
- 비밀번호 정확성 확인
- Supabase Auth 설정 확인

### 2. 디버깅 팁

#### Flutter Web 디버깅
```bash
# 개발자 도구 열기
flutter run -d web-server --web-port 8080

# 브라우저 개발자 도구에서 확인
# Console 탭에서 오류 메시지 확인
```

#### Supabase 디버깅
```dart
// 디버그 모드 활성화
await Supabase.initialize(
  url: AppConfig.supabaseUrl,
  anonKey: AppConfig.supabaseAnonKey,
  debug: true, // 디버그 모드
);
```

### 3. 성능 최적화

#### 빌드 최적화
```bash
# 압축된 빌드
flutter build web --release --dart-define=FLUTTER_WEB_USE_SKIA=true

# 캐시 최적화
flutter build web --release --web-renderer html
```

#### 코드 분할
```dart
// 지연 로딩으로 초기 로딩 시간 단축
final SignInScreen = () => import('./screens/signin_screen.dart');
```

---

## 📚 추가 리소스

### 공식 문서
- [Flutter Web](https://flutter.dev/web)
- [Supabase Flutter](https://supabase.com/docs/reference/dart)
- [Provider](https://pub.dev/packages/provider)

### 유용한 패키지
- `flutter_secure_storage`: 민감한 데이터 저장
- `go_router`: 고급 라우팅
- `flutter_hooks`: 상태 관리 개선
- `json_annotation`: JSON 직렬화

### 개발 도구
- [Flutter Inspector](https://flutter.dev/docs/development/tools/flutter-inspector)
- [Supabase Dashboard](https://app.supabase.com)
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools)

## 완료!

이제 Flutter Web과 Supabase Auth를 연계한 완전한 회원가입/로그인 시스템을 구축했습니다. 

### 다음 단계 제안:
1. **프로필 관리 기능** 추가
2. **소셜 로그인** (Google, GitHub) 구현
3. **이메일 템플릿** 커스터마이징
4. **보안 강화** (2FA, 세션 관리)
5. **모니터링 및 로깅** 추가

Happy Coding! 🚀
