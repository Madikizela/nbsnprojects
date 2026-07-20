import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/learner_auth_service.dart';
import '../services/api_service.dart';
import '../services/local_database_service.dart';
import '../services/sync_service.dart';

class LearnerDashboardScreen extends StatefulWidget {
  final LearnerAuthService authService;
  const LearnerDashboardScreen({super.key, required this.authService});

  @override
  State<LearnerDashboardScreen> createState() => _LearnerDashboardScreenState();
}

class _LearnerDashboardScreenState extends State<LearnerDashboardScreen> {
  Map<String, dynamic>? _profile;
  List<dynamic> _classes = [];
  bool _loadingClasses = false;
  bool _syncing = false;
  int _pendingSyncCount = 0;

  final LocalDatabaseService _localDb = LocalDatabaseService.instance;
  final SyncService _syncService = SyncService.instance;

  @override
  void initState() {
    super.initState();
    _loadProfile();
    _loadClasses();
    _loadPendingSyncCount();

    // Listen to sync status
    _syncService.addStatusListener(_onSyncStatusChanged);
  }

  @override
  void dispose() {
    _syncService.removeStatusListener(_onSyncStatusChanged);
    super.dispose();
  }

  void _onSyncStatusChanged(SyncStatus status) {
    if (!mounted) return;
    setState(() {
      _syncing = status == SyncStatus.syncing;
    });
    _loadPendingSyncCount();
  }

  Future<void> _loadPendingSyncCount() async {
    final count = await _syncService.getPendingSyncCount();
    if (mounted) setState(() => _pendingSyncCount = count);
  }

  Future<void> _loadProfile() async {
    final id = widget.authService.learnerId;
    if (id == null) return;

    try {
      if (widget.authService.isOfflineMode) {
        // Load from local database
        final profile = await _localDb.getLearnerProfile(id);
        if (mounted) setState(() => _profile = profile);
      } else {
        // Load from API
        final api = ApiService();
        final r = await api.get('/api/Learners/$id');
        if (mounted) setState(() => _profile = r.data as Map<String, dynamic>?);
      }
    } catch (e) {
      // Fallback to local database on error
      final profile = await _localDb.getLearnerProfile(id);
      if (mounted) setState(() => _profile = profile);
    }
  }

  Future<void> _loadClasses() async {
    final id = widget.authService.learnerId;
    if (id == null) return;

    setState(() => _loadingClasses = true);
    try {
      if (widget.authService.isOfflineMode) {
        // Load from local database
        final classes = await _localDb.getClassesWithVideoConference();
        if (mounted) setState(() => _classes = classes);
      } else {
        // Load from API
        final api = ApiService();
        final r = await api.get('/api/Learners/$id');
        final learnerData = r.data as Map<String, dynamic>?;

        if (learnerData != null && learnerData['classEnrollments'] != null) {
          final enrollments = learnerData['classEnrollments'] as List<dynamic>;
          final List<dynamic> classesWithLinks = [];

          for (var enrollment in enrollments) {
            final classId = enrollment['siteClassId'] ?? enrollment['classId'];
            if (classId != null) {
              try {
                final classResponse =
                    await api.get('/api/SiteClasses/$classId');
                final classData = classResponse.data as Map<String, dynamic>?;
                if (classData != null &&
                    classData['videoConferenceLink'] != null &&
                    classData['videoConferenceLink'].toString().isNotEmpty) {
                  classesWithLinks.add(classData);
                }
              } catch (_) {}
            }
          }

          if (mounted) setState(() => _classes = classesWithLinks);
        }
      }
    } catch (e) {
      // Fallback to local database on error
      final classes = await _localDb.getClassesWithVideoConference();
      if (mounted) setState(() => _classes = classes);
    } finally {
      if (mounted) setState(() => _loadingClasses = false);
    }
  }

  Future<void> _handleSync() async {
    final id = widget.authService.learnerId;
    if (id == null) return;

    setState(() => _syncing = true);

    try {
      final result = await _syncService.syncAll(learnerId: id);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                result.success ? '✅ ${result.message}' : '❌ ${result.message}'),
            backgroundColor:
                result.success ? const Color(0xFF10b981) : Colors.red,
          ),
        );

        if (result.success) {
          // Reload data after successful sync
          await widget.authService.trySync();
          await _loadProfile();
          await _loadClasses();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ Sync failed: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _syncing = false);
        _loadPendingSyncCount();
      }
    }
  }

  Future<void> _launchUrl(String url) async {
    try {
      // Ensure URL has proper scheme
      String urlToLaunch = url.trim();
      if (!urlToLaunch.startsWith('http://') &&
          !urlToLaunch.startsWith('https://')) {
        urlToLaunch = 'https://$urlToLaunch';
      }

      final uri = Uri.parse(urlToLaunch);

      // Try to launch with platform default first (uses browser if no native app)
      // This works better for Teams, Zoom, Meet links when apps aren't installed
      bool launched = false;

      try {
        launched = await launchUrl(
          uri,
          mode: LaunchMode.platformDefault,
        );
      } catch (e) {
        // If platform default fails, try external application mode
        try {
          launched = await launchUrl(
            uri,
            mode: LaunchMode.externalApplication,
          );
        } catch (e) {
          launched = false;
        }
      }

      if (!launched && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Could not open: $urlToLaunch\n\n'
              'Please install a web browser (Chrome, Samsung Internet, etc.) to join video conferences.',
            ),
            duration: const Duration(seconds: 5),
            action: SnackBarAction(
              label: 'Copy Link',
              onPressed: () {
                // Future: Could implement clipboard copy here
              },
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.authService.learnerName.split(' ').first;
    final isOffline = widget.authService.isOfflineMode;

    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1e293b),
        title: Row(
          children: [
            const Text('Learner Portal', style: TextStyle(color: Colors.white)),
            if (isOffline) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: Colors.orange, width: 1),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.wifi_off, size: 14, color: Colors.orange),
                    SizedBox(width: 4),
                    Text('Offline',
                        style: TextStyle(color: Colors.orange, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ],
        ),
        actions: [
          // Sync button
          if (_pendingSyncCount > 0 || _syncing)
            Stack(
              children: [
                IconButton(
                  icon: _syncing
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Icon(Icons.sync, color: Colors.white),
                  onPressed: _syncing ? null : _handleSync,
                  tooltip: _syncing
                      ? 'Syncing...'
                      : 'Sync $_pendingSyncCount pending changes',
                ),
                if (_pendingSyncCount > 0 && !_syncing)
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '$_pendingSyncCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: () async {
              final router = GoRouter.of(context);
              await widget.authService.logout();
              if (mounted) router.go('/learner/login');
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await _handleSync();
          await _loadClasses();
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Offline mode banner
              if (widget.authService.isOfflineMode)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.orange.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.orange),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline, color: Colors.orange),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Working Offline',
                              style: TextStyle(
                                color: Colors.orange,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _pendingSyncCount > 0
                                  ? '$_pendingSyncCount changes will sync when online'
                                  : 'Connect to internet to sync your data',
                              style: const TextStyle(
                                color: Colors.orange,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (!_syncing)
                        TextButton.icon(
                          onPressed: _handleSync,
                          icon: const Icon(Icons.sync, size: 16),
                          label: const Text('Try Sync'),
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.orange,
                          ),
                        ),
                    ],
                  ),
                ),

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

              // Video Conferences
              if (_loadingClasses) ...[
                const Center(child: CircularProgressIndicator()),
                const SizedBox(height: 24),
              ] else if (_classes.isNotEmpty) ...[
                const Text(
                  '📹 Online Classes',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 12),
                ..._classes.map((classData) => _buildConferenceCard(classData)),
                const SizedBox(height: 24),
              ],

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
                  _tile(context, '📚', 'Study Materials', 'Learning resources',
                      '/learner/study-materials', const Color(0xFFf97316)),
                  _tile(
                      context,
                      '🔒',
                      'Change Password',
                      'Update your password',
                      '/learner/change-password',
                      const Color(0xFFf59e0b)),
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
      ),
    );
  }

  Widget _buildConferenceCard(Map<String, dynamic> classData) {
    final link = classData['videoConferenceLink'] as String;
    final type = classData['videoConferenceType'] as String? ?? 'Online';
    final description = classData['videoConferenceDescription'] as String?;
    final startTime = classData['videoConferenceStartTime'] as String?;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1e293b),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF10b981).withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  classData['className'] ?? 'Online Class',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF10b981).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  type,
                  style: const TextStyle(
                    color: Color(0xFF10b981),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          if (description != null && description.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              description,
              style: const TextStyle(color: Colors.white70, fontSize: 14),
            ),
          ],
          if (startTime != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.access_time, size: 16, color: Colors.white54),
                const SizedBox(width: 4),
                Text(
                  DateTime.parse(startTime)
                      .toLocal()
                      .toString()
                      .substring(0, 16),
                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                ),
              ],
            ),
          ],
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => _launchUrl(link),
              icon: const Icon(Icons.video_call, color: Colors.white),
              label: const Text('Join Class'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10b981),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        ],
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
