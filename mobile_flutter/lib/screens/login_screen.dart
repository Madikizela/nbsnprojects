import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _isOnline = true;

  @override
  void initState() {
    super.initState();
    _checkConnectivity();
    // Listen for connectivity changes so the banner updates in real time
    Connectivity().onConnectivityChanged.listen((results) {
      final online = results.any((r) =>
          r == ConnectivityResult.mobile ||
          r == ConnectivityResult.wifi ||
          r == ConnectivityResult.ethernet);
      if (mounted) setState(() => _isOnline = online);
    });
  }

  Future<void> _checkConnectivity() async {
    final result = await Connectivity().checkConnectivity();
    final online = result.any((r) =>
        r == ConnectivityResult.mobile ||
        r == ConnectivityResult.wifi ||
        r == ConnectivityResult.ethernet);
    if (mounted) setState(() => _isOnline = online);
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    try {
      final authService = context.read<AuthService>();
      final success = await authService.login(
        _emailController.text.trim(),
        _passwordController.text,
      );

      if (!mounted) return;

      if (success) {
        final user = authService.user;
        final isOffline = authService.isOfflineMode;

        // Show offline mode notice
        if (isOffline) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Row(children: [
                Icon(Icons.wifi_off, color: Colors.white, size: 18),
                SizedBox(width: 8),
                Text('Offline mode — limited features available'),
              ]),
              backgroundColor: Color(0xFFF59E0B),
              duration: Duration(seconds: 4),
            ),
          );
        }

        final role = user?['role']?.toString() ?? '';
        if (role == 'Teacher' || role == '16') {
          context.go('/teacher-dashboard');
        } else if (role == 'LogisticsSupport' ||
            role == '12' ||
            role == 'SDPLogistics' ||
            role == '5') {
          context.go('/logistics-dashboard');
        } else {
          context.go('/projects');
        }
      } else {
        // Distinguish no-internet vs wrong password
        if (!_isOnline) {
          _showError(
            'No internet connection. '
            'To use offline mode, you must have logged in at least once while online.',
          );
        } else {
          _showError('Invalid email or password. Please try again.');
        }
      }
    } catch (e) {
      if (!mounted) return;
      // Any network error — try offline fallback message
      if (!_isOnline) {
        _showError(
          'No internet connection. '
          'Offline login requires a previous online session on this device.',
        );
      } else {
        _showError('Connection error. Please check your server settings.');
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 5),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28.0, vertical: 32),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // ── App Icon ──────────────────────────────────
                  ClipRRect(
                    borderRadius: BorderRadius.circular(24),
                    child: Image.asset(
                      'assets/app_icon.png',
                      width: 110,
                      height: 110,
                      fit: BoxFit.cover,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // ── Title ────────────────────────────────────
                  const Text(
                    'NBSN Mobile',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 6),

                  // ── Subtitle ─────────────────────────────────
                  const Text(
                    'Skills Development Management',
                    style: TextStyle(
                      fontSize: 15,
                      color: Color(0xFF94a3b8),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // ── Connectivity Banner ───────────────────────
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 300),
                    child: _isOnline
                        ? const SizedBox.shrink()
                        : Container(
                            key: const ValueKey('offline-banner'),
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: const Color(0xFF78350F),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                  color: const Color(0xFFF59E0B), width: 1),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.wifi_off,
                                    color: Color(0xFFFCD34D), size: 18),
                                SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    'No internet — offline mode available if '
                                    'you have logged in before on this device.',
                                    style: TextStyle(
                                        color: Color(0xFFFCD34D), fontSize: 13),
                                  ),
                                ),
                              ],
                            ),
                          ),
                  ),
                  const SizedBox(height: 28),

                  // ── Email Field ──────────────────────────────
                  TextFormField(
                    controller: _emailController,
                    enabled: !_isLoading,
                    keyboardType: TextInputType.emailAddress,
                    style: const TextStyle(color: Colors.white),
                    decoration: _inputDecoration('Email', Icons.email_outlined),
                    validator: (value) {
                      if (value == null || value.isEmpty)
                        return 'Please enter your email';
                      if (!value.contains('@'))
                        return 'Please enter a valid email';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // ── Password Field ───────────────────────────
                  TextFormField(
                    controller: _passwordController,
                    enabled: !_isLoading,
                    obscureText: _obscurePassword,
                    style: const TextStyle(color: Colors.white),
                    decoration: _inputDecoration('Password', Icons.lock_outline)
                        .copyWith(
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility
                              : Icons.visibility_off,
                          color: const Color(0xFF94a3b8),
                        ),
                        onPressed: () => setState(
                            () => _obscurePassword = !_obscurePassword),
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty)
                        return 'Please enter your password';
                      return null;
                    },
                  ),
                  const SizedBox(height: 28),

                  // ── Login Button ─────────────────────────────
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleLogin,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _isOnline
                            ? const Color(0xFF0EA5E9)
                            : const Color(0xFFF59E0B),
                        disabledBackgroundColor: _isOnline
                            ? const Color(0xFF0EA5E9).withValues(alpha: 0.6)
                            : const Color(0xFFF59E0B).withValues(alpha: 0.6),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                valueColor:
                                    AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  _isOnline ? Icons.login : Icons.offline_bolt,
                                  color: Colors.white,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  _isOnline ? 'Sign In' : 'Sign In Offline',
                                  style: const TextStyle(
                                    fontSize: 17,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),
                  const SizedBox(height: 36),

                  // ── Footer ───────────────────────────────────
                  const Text(
                    'National Building Skills Network',
                    style: TextStyle(fontSize: 12, color: Color(0xFF64748b)),
                  ),
                  const SizedBox(height: 14),

                  // ── Learner Login Link ───────────────────────
                  TextButton(
                    onPressed: () => context.go('/learner/login'),
                    child: const Text(
                      '🎓  Learner? Login here',
                      style: TextStyle(color: Color(0xFF10b981), fontSize: 14),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint, IconData icon) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Color(0xFF94a3b8)),
      prefixIcon: Icon(icon, color: const Color(0xFF64748b), size: 20),
      filled: true,
      fillColor: const Color(0xFF1e293b),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF334155)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF334155)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF0EA5E9), width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.redAccent),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
      ),
    );
  }
}
