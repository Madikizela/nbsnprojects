import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../services/learner_auth_service.dart';

/// Read-only notice board for learners — shows all announcements
/// posted to their enrolled class(es).
class LearnerNoticeboardScreen extends StatefulWidget {
  final LearnerAuthService authService;

  const LearnerNoticeboardScreen({super.key, required this.authService});

  @override
  State<LearnerNoticeboardScreen> createState() =>
      _LearnerNoticeboardScreenState();
}

class _LearnerNoticeboardScreenState extends State<LearnerNoticeboardScreen> {
  List<dynamic> _notices = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final learnerId = widget.authService.learnerId;
      if (learnerId == null) return;
      final api = context.read<ApiService>();
      final res = await api.get('/api/Announcements/learner/$learnerId');
      setState(() => _notices = (res.data as List?) ?? []);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load notices: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Color _priorityColor(String priority) => switch (priority) {
        'Urgent' => const Color(0xFFef4444),
        'Important' => const Color(0xFFf59e0b),
        _ => const Color(0xFF0EA5E9),
      };

  String _priorityEmoji(String priority) => switch (priority) {
        'Urgent' => '🚨',
        'Important' => '⚠️',
        _ => '📢',
      };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notice Board'),
        actions: [
          IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _load,
              tooltip: 'Refresh'),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _notices.isEmpty
              ? _buildEmpty()
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _notices.length,
                    itemBuilder: (_, i) => _buildCard(_notices[i]),
                  ),
                ),
    );
  }

  Widget _buildCard(dynamic notice) {
    final priority = notice['priority'] as String? ?? 'Normal';
    final color = _priorityColor(priority);
    final emoji = _priorityEmoji(priority);
    final dt = DateTime.tryParse(notice['createdAt']?.toString() ?? '');
    final formatted = dt != null
        ? DateFormat('dd MMM yyyy, HH:mm').format(dt.toLocal())
        : '—';

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: const Color(0xFF1e293b),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withAlpha(80)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Coloured top bar
          Container(
            height: 4,
            decoration: BoxDecoration(
              color: color,
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(14)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Text(emoji, style: const TextStyle(fontSize: 18)),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      notice['title'] as String? ?? '',
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: color.withAlpha(30),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: color.withAlpha(100)),
                    ),
                    child: Text(priority,
                        style: TextStyle(
                            color: color,
                            fontSize: 10,
                            fontWeight: FontWeight.bold)),
                  ),
                ]),
                const SizedBox(height: 6),
                Text(
                  '${notice['className'] ?? ''} · ${notice['teacherName'] ?? 'Teacher'}',
                  style:
                      const TextStyle(color: Color(0xFF64748b), fontSize: 12),
                ),
                Text(formatted,
                    style: const TextStyle(
                        color: Color(0xFF475569), fontSize: 11)),
                const SizedBox(height: 12),
                Text(
                  notice['message'] as String? ?? '',
                  style: const TextStyle(
                      color: Color(0xFFcbd5e1), fontSize: 14, height: 1.6),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        const Icon(Icons.campaign_outlined, size: 64, color: Color(0xFF334155)),
        const SizedBox(height: 16),
        const Text('No notices yet',
            style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const Text('Your teacher hasn\'t posted any notices yet.',
            style: TextStyle(color: Color(0xFF64748b), fontSize: 14)),
        const SizedBox(height: 24),
        ElevatedButton.icon(
          onPressed: _load,
          icon: const Icon(Icons.refresh),
          label: const Text('Refresh'),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF0EA5E9),
            foregroundColor: Colors.white,
          ),
        ),
      ]),
    );
  }
}
