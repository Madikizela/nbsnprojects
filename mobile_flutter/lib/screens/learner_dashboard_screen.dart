import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/learner_auth_service.dart';
import '../services/api_service.dart';

class LearnerDashboardScreen extends StatefulWidget {
  final LearnerAuthService authService;
  const LearnerDashboardScreen({super.key, required this.authService});

  @override
  State<LearnerDashboardScreen> createState() => _LearnerDashboardScreenState();
}

class _LearnerDashboardScreenState extends State<LearnerDashboardScreen> {
  Map<String, dynamic>? _profile;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final id = widget.authService.learnerId;
    if (id == null) return;
    try {
      final api = ApiService();
      final r = await api.get('/api/Learners/$id');
      if (mounted) setState(() => _profile = r.data as Map<String, dynamic>?);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.authService.learnerName.split(' ').first;
    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1e293b),
        title:
            const Text('Learner Portal', style: TextStyle(color: Colors.white)),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: () async {
              await widget.authService.logout();
              if (mounted) context.go('/learner/login');
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF10b981), Color(0xFF059669)],
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Welcome back, $name! 👋',
                      style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Colors.white)),
                  if (_profile != null) ...[
                    const SizedBox(height: 6),
                    Text('ID: ${_profile!['idNumber'] ?? ''}',
                        style: const TextStyle(
                            color: Colors.white70, fontSize: 14)),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Quick actions grid
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.2,
              children: [
                _tile(context, '👤', 'My Profile', 'View & edit profile',
                    '/learner/profile', const Color(0xFF8b5cf6)),
                _tile(context, '📄', 'My Documents', 'Upload & manage docs',
                    '/learner/documents', const Color(0xFF0EA5E9)),
                _tile(context, '📝', 'Assessments', 'Answer questions',
                    '/learner/assessments', const Color(0xFF10b981)),
                _tile(context, '🔒', 'Change Password', 'Update your password',
                    '/learner/change-password', const Color(0xFFf59e0b)),
                _tile(context, '📢', 'Notice Board', 'Class announcements',
                    '/learner/noticeboard', const Color(0xFFec4899)),
              ],
            ),

            if (_profile != null) ...[
              const SizedBox(height: 24),
              _infoCard('Personal Info', [
                ['Email', _profile!['email'] ?? '—'],
                ['Contact', _profile!['contactNumber'] ?? '—'],
                ['Gender', _profile!['gender'] ?? '—'],
              ]),
            ],
          ],
        ),
      ),
    );
  }

  Widget _tile(BuildContext ctx, String icon, String title, String sub,
      String route, Color color) {
    return GestureDetector(
      onTap: () => ctx.push(route, extra: widget.authService),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1e293b),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(icon, style: const TextStyle(fontSize: 28)),
            const SizedBox(height: 8),
            Text(title,
                style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14)),
            Text(sub,
                style: const TextStyle(color: Color(0xFF94a3b8), fontSize: 11)),
          ],
        ),
      ),
    );
  }

  Widget _infoCard(String title, List<List<String>> rows) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1e293b),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  color: Color(0xFF94a3b8),
                  fontSize: 12,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          ...rows.map((r) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    SizedBox(
                        width: 80,
                        child: Text(r[0],
                            style: const TextStyle(
                                color: Color(0xFF64748b), fontSize: 13))),
                    Expanded(
                        child: Text(r[1],
                            style: const TextStyle(
                                color: Colors.white, fontSize: 13))),
                  ],
                ),
              )),
        ],
      ),
    );
  }
}
