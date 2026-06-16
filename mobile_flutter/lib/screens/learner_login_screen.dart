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
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: const BoxDecoration(
                    color: Color(0xFF10b981),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Text('🎓', style: TextStyle(fontSize: 36)),
                  ),
                ),
                const SizedBox(height: 16),
                const Text('Learner Portal',
                    style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white)),
                const SizedBox(height: 4),
                const Text('National Building Skills Network',
                    style: TextStyle(fontSize: 14, color: Color(0xFF94a3b8))),
                const SizedBox(height: 40),
                _field(_loginCtrl, 'Username or Email', Icons.person_outline),
                const SizedBox(height: 16),
                _field(_passCtrl, 'Password', Icons.lock_outline,
                    obscure: _obscure,
                    suffix: IconButton(
                      icon: Icon(
                          _obscure ? Icons.visibility : Icons.visibility_off,
                          color: const Color(0xFF94a3b8)),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    )),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10b981),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8)),
                    ),
                    child: _loading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white))
                        : const Text('Login',
                            style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.white)),
                  ),
                ),
                const SizedBox(height: 24),
                TextButton(
                  onPressed: () => context.go('/login'),
                  child: const Text('← Back to Staff Login',
                      style: TextStyle(color: Color(0xFF64748b))),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _field(TextEditingController ctrl, String hint, IconData icon,
      {bool obscure = false, Widget? suffix}) {
    return TextFormField(
      controller: ctrl,
      obscureText: obscure,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Color(0xFF94a3b8)),
        prefixIcon: Icon(icon, color: const Color(0xFF94a3b8)),
        suffixIcon: suffix,
        filled: true,
        fillColor: const Color(0xFF1e293b),
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Color(0xFF334155))),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Color(0xFF334155))),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Color(0xFF10b981))),
      ),
    );
  }
}
