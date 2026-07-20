import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/learner_auth_service.dart';
import '../services/api_service.dart';

class LearnerStudyMaterialsScreen extends StatefulWidget {
  final LearnerAuthService authService;
  const LearnerStudyMaterialsScreen({super.key, required this.authService});

  @override
  State<LearnerStudyMaterialsScreen> createState() =>
      _LearnerStudyMaterialsScreenState();
}

class _LearnerStudyMaterialsScreenState
    extends State<LearnerStudyMaterialsScreen> {
  final _api = ApiService();
  List<Map<String, dynamic>> _materials = [];
  bool _loading = true;
  String _msg = '';
  bool _downloading = false;
  Map<int, double> _downloadProgress = {};

  @override
  void initState() {
    super.initState();
    _loadMaterials();
  }

  Future<void> _loadMaterials() async {
    final id = widget.authService.learnerId;
    if (id == null) return;

    setState(() {
      _loading = true;
      _msg = '';
    });

    try {
      final r = await _api.get('/api/LearningMaterials/learner/$id/materials');
      final materials = (r.data as List).cast<Map<String, dynamic>>();

      if (mounted) {
        setState(() {
          _materials = materials;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _msg = '❌ Failed to load materials: ${ApiService.getErrorMessage(e)}';
          _loading = false;
        });
      }
    }
  }

  Future<void> _openMaterial(Map<String, dynamic> material) async {
    final materialType = material['materialType'] as String;
    final id = material['id'] as int;

    if (materialType == 'Link') {
      // Open external URL
      final url = material['externalUrl'] as String?;
      if (url != null && url.isNotEmpty) {
        final uri = Uri.tryParse(url);
        if (uri != null && await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        } else {
          setState(() => _msg = '❌ Cannot open link');
        }
      }
    } else {
      // Download and open file
      await _downloadAndOpenFile(id, material);
    }
  }

  Future<void> _downloadAndOpenFile(
      int id, Map<String, dynamic> material) async {
    setState(() {
      _downloading = true;
      _downloadProgress[id] = 0.0;
      _msg = 'Downloading ${material['fileName']}...';
    });

    try {
      // Download file with progress
      final response = await _api.downloadLearningMaterial(
        id: id,
        onProgress: (progress) {
          if (mounted) {
            setState(() => _downloadProgress[id] = progress);
          }
        },
      );

      if (response != null && mounted) {
        setState(() {
          _msg = '✅ Download complete. Opening...';
          _downloadProgress.remove(id);
        });

        // Open the downloaded file
        // Note: The actual file opening depends on the platform and file type
        // For now, we'll just show a success message
        // In production, you'd use a package like open_file to open the downloaded file
        await Future.delayed(const Duration(seconds: 1));

        if (mounted) {
          setState(() => _msg = '');
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _msg = '❌ Download failed: ${ApiService.getErrorMessage(e)}';
          _downloadProgress.remove(id);
        });
      }
    } finally {
      if (mounted) {
        setState(() => _downloading = false);
      }
    }
  }

  String _formatFileSize(int? bytes) {
    if (bytes == null) return '';
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  IconData _getIconForMaterialType(String type) {
    switch (type) {
      case 'PDF':
        return Icons.picture_as_pdf;
      case 'Video':
        return Icons.play_circle_outline;
      case 'Link':
        return Icons.link;
      case 'Document':
        return Icons.description;
      default:
        return Icons.file_present;
    }
  }

  Color _getColorForMaterialType(String type) {
    switch (type) {
      case 'PDF':
        return Colors.red.shade400;
      case 'Video':
        return Colors.purple.shade400;
      case 'Link':
        return Colors.blue.shade400;
      case 'Document':
        return Colors.green.shade400;
      default:
        return Colors.grey.shade400;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1e293b),
        elevation: 0,
        title: const Text(
          '📚 Study Materials',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _loading ? null : _loadMaterials,
          ),
        ],
      ),
      body: Column(
        children: [
          // Message bar
          if (_msg.isNotEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              color: _msg.startsWith('✅')
                  ? Colors.green.shade900
                  : _msg.startsWith('❌')
                      ? Colors.red.shade900
                      : Colors.blue.shade900,
              child: Text(
                _msg,
                style: const TextStyle(color: Colors.white),
                textAlign: TextAlign.center,
              ),
            ),

          // Loading indicator
          if (_loading)
            const Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(color: Colors.white),
                    SizedBox(height: 16),
                    Text(
                      'Loading study materials...',
                      style: TextStyle(color: Color(0xFF94a3b8)),
                    ),
                  ],
                ),
              ),
            )
          // Empty state
          else if (_materials.isEmpty)
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.school_outlined,
                        size: 80, color: Colors.grey.shade700),
                    const SizedBox(height: 16),
                    Text(
                      'No study materials available yet',
                      style:
                          TextStyle(color: Colors.grey.shade500, fontSize: 16),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Your training manager will upload materials soon',
                      style:
                          TextStyle(color: Colors.grey.shade600, fontSize: 14),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            )
          // Materials list
          else
            Expanded(
              child: RefreshIndicator(
                onRefresh: _loadMaterials,
                color: Colors.white,
                backgroundColor: const Color(0xFF1e293b),
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _materials.length,
                  itemBuilder: (context, index) {
                    final material = _materials[index];
                    final materialType = material['materialType'] as String;
                    final id = material['id'] as int;
                    final isDownloading = _downloadProgress.containsKey(id);
                    final progress = _downloadProgress[id] ?? 0.0;

                    return Card(
                      color: const Color(0xFF1e293b),
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: const BorderSide(
                            color: Color(0xFF334155), width: 1),
                      ),
                      child: InkWell(
                        onTap: isDownloading || _downloading
                            ? null
                            : () => _openMaterial(material),
                        borderRadius: BorderRadius.circular(12),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Header: Icon + Type badge
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color:
                                          _getColorForMaterialType(materialType)
                                              .withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Icon(
                                      _getIconForMaterialType(materialType),
                                      color: _getColorForMaterialType(
                                          materialType),
                                      size: 28,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          material['title'] ?? 'Untitled',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 16,
                                            fontWeight: FontWeight.w600,
                                          ),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 4),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: _getColorForMaterialType(
                                                    materialType)
                                                .withOpacity(0.3),
                                            borderRadius:
                                                BorderRadius.circular(4),
                                          ),
                                          child: Text(
                                            materialType,
                                            style: TextStyle(
                                              color: _getColorForMaterialType(
                                                  materialType),
                                              fontSize: 11,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Icon(
                                    materialType == 'Link'
                                        ? Icons.open_in_new
                                        : Icons.download,
                                    color: const Color(0xFF94a3b8),
                                    size: 20,
                                  ),
                                ],
                              ),

                              // Description
                              if (material['description'] != null &&
                                  (material['description'] as String)
                                      .isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(top: 12),
                                  child: Text(
                                    material['description'],
                                    style: const TextStyle(
                                      color: Color(0xFF94a3b8),
                                      fontSize: 14,
                                      height: 1.4,
                                    ),
                                    maxLines: 3,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),

                              const SizedBox(height: 12),

                              // Metadata
                              Wrap(
                                spacing: 16,
                                runSpacing: 8,
                                children: [
                                  if (material['qualificationName'] != null)
                                    _buildMetadataChip(
                                      Icons.school,
                                      material['qualificationName'],
                                    ),
                                  if (material['unitStandardName'] != null)
                                    _buildMetadataChip(
                                      Icons.menu_book,
                                      material['unitStandardName'],
                                    ),
                                  if (material['fileSize'] != null)
                                    _buildMetadataChip(
                                      Icons.storage,
                                      _formatFileSize(material['fileSize']),
                                    ),
                                ],
                              ),

                              // Download progress
                              if (isDownloading)
                                Padding(
                                  padding: const EdgeInsets.only(top: 12),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Downloading... ${(progress * 100).toStringAsFixed(0)}%',
                                        style: const TextStyle(
                                          color: Color(0xFF94a3b8),
                                          fontSize: 12,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      LinearProgressIndicator(
                                        value: progress,
                                        backgroundColor:
                                            const Color(0xFF334155),
                                        valueColor:
                                            AlwaysStoppedAnimation<Color>(
                                          _getColorForMaterialType(
                                              materialType),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMetadataChip(IconData icon, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: const Color(0xFF64748b)),
        const SizedBox(width: 4),
        Flexible(
          child: Text(
            label,
            style: const TextStyle(
              color: Color(0xFF64748b),
              fontSize: 12,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
