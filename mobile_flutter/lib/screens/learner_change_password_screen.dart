import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/learner_auth_service.dart';
import '../services/api_service.dart';

class LearnerChangePasswordScreen extends StatefulWidget {
  final LearnerAuthService authService;
  const LearnerChangePasswordScreen({super.key, required this.authService});

  @override
  State<LearnerChangePasswordScreen> createState() =>
      _LearnerChangePasswordScreenState();
}

class _LearnerChangePasswordScreenState
    extends State<LearnerChangePasswordScreen> {
  final _curCtrl = TextEditingController();
  final _newCtrl = TextEditingController();
  final _conCtrl = TextEditingController();
  bool _saving = false;
  String _msg = '';

  @override
  void dispose() {
    _curCtrl.dispose();
    _newCtrl.dispose();
    _conCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_newCtrl.text != _conCtrl.text) {
      setState(() => _msg = 'Passwords do not match');
      return;
    }
    if (_newCtrl.text.length < 8) {
      setState(() => _msg = 'Password must be at least 8 characters');
      return;
    }
    setState(() {
      _saving = true;
      _msg = '';
    });
    try {
      final api = ApiService();
      final r = await api.post('/api/Auth/learner-change-password', data: {
        'currentPassword': _curCtrl.text,
        'newPassword': _newCtrl.text,
      });
      if (r.statusCode == 200) {
        if (mounted) context.go('/learner/dashboard');
      } else {
        setState(() => _msg = r.data?['message'] ?? 'Failed');
      }
    } catch (e) {
      setState(() => _msg = 'Error: $e');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        title: const Text('Change Password'),
        backgroundColor: const Color(0xFF1e293b),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Icon(Icons.lock_reset, color: Color(0xFF10b981), size: 56),
            const SizedBox(height: 12),
            const Text('Set Your New Password',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text(
                'You must change your temporary password before continuing.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Color(0xFF94a3b8), fontSize: 13)),
            const SizedBox(height: 32),
            _field('Current (temporary) password', _curCtrl),
            const SizedBox(height: 16),
            _field('New password', _newCtrl),
            const SizedBox(height: 16),
            _field('Confirm new password', _conCtrl),
            if (_msg.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(_msg,
                  style: TextStyle(
                      color: _msg.startsWith('✅') ? Colors.green : Colors.red)),
            ],
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _saving ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10b981),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
                child: _saving
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Save Password',
                        style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _field(String label, TextEditingController ctrl) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label,
          style: const TextStyle(color: Color(0xFF94a3b8), fontSize: 13)),
      const SizedBox(height: 6),
      TextFormField(
        controller: ctrl,
        obscureText: true,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
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
      ),
    ]);
  }
}
