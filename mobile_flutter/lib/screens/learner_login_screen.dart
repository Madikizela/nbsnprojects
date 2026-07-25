import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../services/learner_auth_service.dart';

class LearnerLoginScreen extends StatefulWidget {
  final LearnerAuthService authService;
  const LearnerLoginScreen({super.key, required this.authService});

  @override
  State<LearnerLoginScreen> createState() => _LearnerLoginScreenState();
}

class _LearnerLoginScreenState extends State<LearnerLoginScreen> {
  final _loginCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  bool _obscure = true;

  @override
  void dispose() {
    _loginCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_loginCtrl.text.trim().isEmpty || _passCtrl.text.isEmpty) return;
    setState(() => _loading = true);
    try {
      final ok = await widget.authService.learnerLogin(
        _loginCtrl.text.trim(),
        _passCtrl.text,
      );
      if (!mounted) return;
      if (ok) {
        if (widget.authService.mustChangePassword) {
          context.go('/learner/change-password');
        } else {
          context.go('/learner/dashboard');
        }
      } else {
        _showError('Invalid username or password.');
      }
    } on DioException catch (e) {
      if (!mounted) return;
      final msg = e.response?.data?['message'] ?? 'Connection error';
      _showError(msg.toString());
    } catch (e) {
      if (!mounted) return;
      _showError('An error occurred. Please try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: Colors.red),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 32),
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
                  'Learner Portal',
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
                  'National Building Skills Network',
                  style: TextStyle(fontSize: 14, color: Color(0xFF94a3b8)),
                ),
                const SizedBox(height: 44),

                // ── Username / Email Field ───────────────────
                _field(
                  _loginCtrl,
                  'Username or Email',
                  Icons.person_outline,
                ),
                const SizedBox(height: 16),

                // ── Password Field ───────────────────────────
                _field(
                  _passCtrl,
                  'Password',
                  Icons.lock_outline,
                  obscure: _obscure,
                  suffix: IconButton(
                    icon: Icon(
                      _obscure ? Icons.visibility : Icons.visibility_off,
                      color: const Color(0xFF94a3b8),
                    ),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),
                const SizedBox(height: 28),

                // ── Login Button ─────────────────────────────
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10b981),
                      disabledBackgroundColor:
                          const Color(0xFF10b981).withValues(alpha: 0.6),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: _loading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Colors.white,
                            ),
                          )
                        : const Text(
                            'Sign In',
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 36),

                // ── Back to Staff Login ──────────────────────
                TextButton.icon(
                  onPressed: () => context.go('/login'),
                  icon: const Icon(Icons.arrow_back,
                      size: 16, color: Color(0xFF64748b)),
                  label: const Text(
                    'Back to Staff Login',
                    style: TextStyle(color: Color(0xFF64748b), fontSize: 14),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController ctrl,
    String hint,
    IconData icon, {
    bool obscure = false,
    Widget? suffix,
  }) {
    return TextField(
      controller: ctrl,
      obscureText: obscure,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Color(0xFF94a3b8)),
        prefixIcon: Icon(icon, color: const Color(0xFF64748b), size: 20),
        suffixIcon: suffix,
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
          borderSide: const BorderSide(color: Color(0xFF10b981), width: 1.5),
        ),
      ),
    );
  }
}
