import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

/// Teacher Notice Board — post announcements to a class.
/// Learners receive the notice via WhatsApp + email instantly,
/// and can also read it in their learner portal.
class NoticeBoardScreen extends StatefulWidget {
  final int classId;
  final String className;

  const NoticeBoardScreen({
    super.key,
    required this.classId,
    required this.className,
  });

  @override
  State<NoticeBoardScreen> createState() => _NoticeBoardScreenState();
}

class _NoticeBoardScreenState extends State<NoticeBoardScreen> {
  List<dynamic> _notices = [];
  bool _loading = true;
  bool _posting = false;

  // form fields
  final _titleCtrl = TextEditingController();
  final _messageCtrl = TextEditingController();
  String _priority = 'Normal';

  @override
  void initState() {
    super.initState();
    _loadNotices();
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _messageCtrl.dispose();
    super.dispose();
  }

  // ── Data ─────────────────────────────────────────────────────────────────

  Future<void> _loadNotices() async {
    setState(() => _loading = true);
    try {
      final api = context.read<ApiService>();
      final res = await api.get('/api/Announcements/class/${widget.classId}');
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

  Future<void> _postNotice() async {
    final title = _titleCtrl.text.trim();
    final message = _messageCtrl.text.trim();
    if (title.isEmpty || message.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Title and message are required.')),
      );
      return;
    }

    setState(() => _posting = true);
    try {
      final api = context.read<ApiService>();
      final res = await api.post('/api/Announcements', data: {
        'classId': widget.classId,
        'title': title,
        'message': message,
        'priority': _priority,
      });

      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final emails = data['emailsSent'] ?? 0;
        final wa = data['waSent'] ?? 0;
        final total = data['recipientsCount'] ?? 0;
        _titleCtrl.clear();
        _messageCtrl.clear();
        setState(() => _priority = 'Normal');
        await _loadNotices();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                '✅ Notice posted to $total learner(s). '
                '$emails email(s), $wa WhatsApp message(s) sent.',
              ),
              backgroundColor: const Color(0xFF10b981),
              duration: const Duration(seconds: 5),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Failed to post notice: $e'),
              backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _posting = false);
    }
  }

  Future<void> _deleteNotice(int id) async {
    final api = context.read<ApiService>();
    final messenger = ScaffoldMessenger.of(context);

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF1e293b),
        title:
            const Text('Delete Notice', style: TextStyle(color: Colors.white)),
        content: const Text('Are you sure you want to delete this notice?',
            style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child:
                const Text('Cancel', style: TextStyle(color: Colors.white54)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete',
                style: TextStyle(color: Color(0xFFef4444))),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await api.delete('/api/Announcements/$id');
      await _loadNotices();
    } catch (e) {
      if (mounted) {
        messenger.showSnackBar(
          SnackBar(
              content: Text('Failed to delete: $e'),
              backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Notice Board', style: TextStyle(fontSize: 20)),
            Text(widget.className,
                style: const TextStyle(fontSize: 13, color: Color(0xFF0EA5E9))),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadNotices,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildComposeCard(),
            const SizedBox(height: 24),
            Text(
              'Posted Notices (${_notices.length})',
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16),
            ),
            const SizedBox(height: 12),
            if (_loading)
              const Center(child: CircularProgressIndicator())
            else if (_notices.isEmpty)
              _buildEmptyState()
            else
              ..._notices.map((n) => _buildNoticeCard(n)),
          ],
        ),
      ),
    );
  }

  Widget _buildComposeCard() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1e293b),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Icon(Icons.campaign, color: Color(0xFF0EA5E9), size: 22),
            const SizedBox(width: 8),
            const Text('Post New Notice',
                style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16)),
          ]),
          const SizedBox(height: 16),

          // Title
          _label('Title'),
          const SizedBox(height: 6),
          TextField(
            controller: _titleCtrl,
            style: const TextStyle(color: Colors.white),
            decoration: _inputDeco('e.g. Class cancelled tomorrow'),
          ),
          const SizedBox(height: 14),

          // Message
          _label('Message'),
          const SizedBox(height: 6),
          TextField(
            controller: _messageCtrl,
            style: const TextStyle(color: Colors.white),
            maxLines: 4,
            decoration: _inputDeco('Write your announcement here…'),
          ),
          const SizedBox(height: 14),

          // Priority
          _label('Priority'),
          const SizedBox(height: 6),
          Row(
            children: ['Normal', 'Important', 'Urgent'].map((p) {
              final selected = _priority == p;
              final color = _priorityColor(p);
              return Padding(
                padding: const EdgeInsets.only(right: 10),
                child: GestureDetector(
                  onTap: () => setState(() => _priority = p),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: selected
                          ? color.withAlpha(40)
                          : const Color(0xFF0f172a),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: selected ? color : const Color(0xFF475569),
                        width: selected ? 2 : 1,
                      ),
                    ),
                    child: Text(p,
                        style: TextStyle(
                            color: selected ? color : const Color(0xFF94a3b8),
                            fontWeight:
                                selected ? FontWeight.bold : FontWeight.normal,
                            fontSize: 13)),
                  ),
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 20),

          // Submit button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _posting ? null : _postNotice,
              icon: _posting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : const Icon(Icons.send, size: 18),
              label: Text(_posting ? 'Posting…' : 'Post & Notify Learners'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0EA5E9),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
                disabledBackgroundColor: const Color(0xFF334155),
              ),
            ),
          ),

          const SizedBox(height: 10),
          const Row(children: [
            Icon(Icons.info_outline, size: 13, color: Color(0xFF64748b)),
            SizedBox(width: 6),
            Flexible(
              child: Text(
                'Learners will receive this notice via WhatsApp, email, and in their learner portal.',
                style: TextStyle(color: Color(0xFF64748b), fontSize: 12),
              ),
            ),
          ]),
        ],
      ),
    );
  }

  Widget _buildNoticeCard(dynamic notice) {
    final priority = notice['priority'] as String? ?? 'Normal';
    final color = _priorityColor(priority);
    final dt = DateTime.tryParse(notice['createdAt']?.toString() ?? '');
    final formatted = dt != null
        ? DateFormat('dd MMM yyyy, HH:mm').format(dt.toLocal())
        : '—';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1e293b),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withAlpha(80)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 8, 0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
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
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            notice['title'] as String? ?? '',
                            style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 15),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ]),
                      const SizedBox(height: 4),
                      Text(
                        '${notice['teacherName'] ?? 'Teacher'} · $formatted',
                        style: const TextStyle(
                            color: Color(0xFF64748b), fontSize: 12),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline,
                      color: Color(0xFF64748b), size: 20),
                  onPressed: () => _deleteNotice(notice['id'] as int),
                  tooltip: 'Delete',
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            child: Text(
              notice['message'] as String? ?? '',
              style: const TextStyle(
                  color: Color(0xFFcbd5e1), fontSize: 14, height: 1.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 40),
      alignment: Alignment.center,
      child: Column(children: [
        const Icon(Icons.campaign_outlined, size: 56, color: Color(0xFF334155)),
        const SizedBox(height: 12),
        const Text('No notices yet',
            style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 16)),
        const SizedBox(height: 4),
        Text('Post a notice above to notify your learners.',
            style: const TextStyle(color: Color(0xFF64748b), fontSize: 13)),
      ]),
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  Color _priorityColor(String priority) {
    return switch (priority) {
      'Urgent' => const Color(0xFFef4444),
      'Important' => const Color(0xFFf59e0b),
      _ => const Color(0xFF0EA5E9),
    };
  }

  Widget _label(String text) => Text(text,
      style: const TextStyle(
          color: Color(0xFF94a3b8), fontSize: 13, fontWeight: FontWeight.w500));

  InputDecoration _inputDeco(String hint) => InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Color(0xFF475569)),
        filled: true,
        fillColor: const Color(0xFF0f172a),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFF334155)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFF334155)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFF0EA5E9)),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      );
}
