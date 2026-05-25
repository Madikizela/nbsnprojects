import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';

class SitesScreen extends StatefulWidget {
  final int projectId;
  final String projectName;

  const SitesScreen({
    super.key,
    required this.projectId,
    required this.projectName,
  });

  @override
  State<SitesScreen> createState() => _SitesScreenState();
}

class _SitesScreenState extends State<SitesScreen> {
  List<dynamic> _sites = [];
  bool _loading = true;
  bool _refreshing = false;

  @override
  void initState() {
    super.initState();
    _fetchSites();
  }

  Future<void> _fetchSites() async {
    try {
      final apiService = ApiService();
      final response =
          await apiService.get('/api/ProjectSites/project/${widget.projectId}');

      setState(() {
        _sites = response.data is List ? response.data : [];
        _loading = false;
        _refreshing = false;
      });
    } catch (e) {
      debugPrint('Error fetching sites: $e');
      setState(() {
        _loading = false;
        _refreshing = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load sites: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _onRefresh() async {
    setState(() => _refreshing = true);
    await _fetchSites();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        backgroundColor: const Color(0xFF0f172a),
        appBar: AppBar(
          backgroundColor: const Color(0xFF1e293b),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => context.pop(),
          ),
          title: Text(widget.projectName),
        ),
        body: const Center(
          child: CircularProgressIndicator(color: Color(0xFF0EA5E9)),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1e293b),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.projectName,
              style: const TextStyle(fontSize: 18, color: Colors.white),
            ),
            Text(
              '${_sites.length} Sites',
              style: const TextStyle(fontSize: 12, color: Color(0xFF94a3b8)),
            ),
          ],
        ),
      ),
      body: _sites.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('🏢', style: TextStyle(fontSize: 64)),
                  SizedBox(height: 16),
                  Text(
                    'No Sites Found',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Sites will appear here once they are created',
                    style: TextStyle(fontSize: 14, color: Color(0xFF94a3b8)),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _onRefresh,
              color: const Color(0xFF0EA5E9),
              child: ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: _sites.length,
                itemBuilder: (context, index) {
                  final site = _sites[index];
                  return _SiteCard(
                    site: site,
                    projectId: widget.projectId,
                  );
                },
              ),
            ),
    );
  }
}

class _SiteCard extends StatelessWidget {
  final dynamic site;
  final int projectId;

  const _SiteCard({
    required this.site,
    required this.projectId,
  });

  @override
  Widget build(BuildContext context) {
    final siteName = site['siteName'] ?? 'Unnamed Site';
    final totalClasses = site['totalClasses'] ?? 0;
    final province = site['province'] ?? 'N/A';
    final city = site['city'] ?? 'N/A';
    final capacity = site['capacity'] ?? 0;
    final status = site['status'] ?? 'Active';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF1e293b),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () {
            context.push('/projects/$projectId/sites/${site['id']}/classes');
          },
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        siteName,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0x2010b981),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        status,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF10b981),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Info Rows
                _InfoRow(
                    label: 'Total Classes', value: totalClasses.toString()),
                _InfoRow(label: 'Location', value: '$city, $province'),
                _InfoRow(label: 'Capacity', value: '$capacity learners'),

                const SizedBox(height: 16),

                // View Button
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0EA5E9),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'View Classes →',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            '$label:',
            style: const TextStyle(fontSize: 14, color: Color(0xFF94a3b8)),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              color: Colors.white,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
