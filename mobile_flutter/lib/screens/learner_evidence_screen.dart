import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';

class LearnerEvidenceScreen extends StatefulWidget {
  final int classId;
  
  const LearnerEvidenceScreen({super.key, required this.classId});

  @override
  State<LearnerEvidenceScreen> createState() => _LearnerEvidenceScreenState();
}

class _LearnerEvidenceScreenState extends State<LearnerEvidenceScreen> {
  List<dynamic> learners = [];
  bool isLoading = true;
  String className = '';

  @override
  void initState() {
    super.initState();
    fetchLearners();
  }

  Future<void> fetchLearners() async {
    setState(() => isLoading = true);
    
    try {
      final apiService = context.read<ApiService>();
      final response = await apiService.get('/api/Learners/class/${widget.classId}');
      
      setState(() {
        learners = response.data ?? [];
        isLoading = false;
      });
      
      // Get class name for the title
      if (learners.isNotEmpty) {
        setState(() {
          className = learners.first['className'] ?? 'Class ${widget.classId}';
        });
      }
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load learners: $e')),
        );
      }
    }
  }

  Future<void> _scanPOE(dynamic learner) async {
    // Show POE scanning options
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1e293b),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (BuildContext context) {
        return Container(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Text(
                '${learner['firstName']} ${learner['lastName']}',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Portfolio of Evidence',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.white70,
                ),
              ),
              const SizedBox(height: 20),
              _buildPOEOption(
                icon: Icons.camera_alt,
                title: 'Scan Document',
                subtitle: 'Capture evidence using camera',
                onTap: () {
                  Navigator.pop(context);
                  _openDocumentScanner(learner);
                },
              ),
              _buildPOEOption(
                icon: Icons.folder,
                title: 'View Evidence',
                subtitle: 'Browse existing documents',
                onTap: () {
                  Navigator.pop(context);
                  _viewLearnerEvidence(learner);
                },
              ),
              _buildPOEOption(
                icon: Icons.upload_file,
                title: 'Upload File',
                subtitle: 'Upload from device storage',
                onTap: () {
                  Navigator.pop(context);
                  _uploadFile(learner);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPOEOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: const Color(0xFF8B5CF6).withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF8B5CF6).withOpacity(0.3)),
        ),
        child: Icon(icon, color: const Color(0xFF8B5CF6), size: 24),
      ),
      title: Text(
        title,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(
          color: Colors.white70,
          fontSize: 14,
        ),
      ),
      onTap: onTap,
    );
  }

  void _openLogbook(dynamic learner) {
    // Navigate to logbook screen for this learner
    context.push(
      '/learners/${learner['id']}/logbook'
      '?learnerName=${Uri.encodeComponent('${learner['firstName']} ${learner['lastName']}')}'
      '&classId=${widget.classId}'
    );
  }

  void _openDocumentScanner(dynamic learner) {
    // Navigate to qualifications screen to start POE assessment flow
    context.push(
      '/learners/${learner['id']}/qualifications'
      '?learnerName=${Uri.encodeComponent('${learner['firstName']} ${learner['lastName']}')}'
      '&classId=${widget.classId}'
    );
  }

  void _viewLearnerEvidence(dynamic learner) {
    // Show existing evidence for this learner
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Viewing evidence for ${learner['firstName']} ${learner['lastName']}'),
        backgroundColor: const Color(0xFF0EA5E9),
      ),
    );
  }

  void _uploadFile(dynamic learner) {
    // Handle file upload
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('File upload for ${learner['firstName']} ${learner['lastName']} - Coming Soon'),
        backgroundColor: const Color(0xFF10b981),
      ),
    );
  }

  String getInitials(String firstName, String lastName) {
    String firstInitial = '';
    String lastInitial = '';
    
    if (firstName.isNotEmpty) {
      firstInitial = firstName.substring(0, 1);
    }
    if (lastName.isNotEmpty) {
      lastInitial = lastName.substring(0, 1);
    }
    
    return '$firstInitial$lastInitial'.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Learner Evidence')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Learner Evidence', style: TextStyle(fontSize: 20)),
            Text(
              className.isNotEmpty ? className : 'Class ${widget.classId}',
              style: const TextStyle(fontSize: 14, color: Colors.white70),
            ),
          ],
        ),
      ),
      body: learners.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.folder_open, size: 64, color: Colors.white54),
                  SizedBox(height: 16),
                  Text(
                    'No Learners Found',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'No learners enrolled in this class yet',
                    style: TextStyle(fontSize: 14, color: Colors.white70),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: fetchLearners,
              child: ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: learners.length,
                itemBuilder: (context, index) {
                  final learner = learners[index];
                  final firstName = (learner['firstName'] ?? '').toString();
                  final lastName = (learner['lastName'] ?? '').toString();
                  
                  return Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: Color(0xFF8B5CF6), width: 2),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 30,
                                backgroundColor: const Color(0xFF8B5CF6),
                                child: Text(
                                  getInitials(firstName, lastName),
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '$firstName $lastName',
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'ID: ${learner['idNumber'] ?? 'N/A'}',
                                      style: const TextStyle(
                                        fontSize: 14,
                                        color: Colors.white70,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    const Row(
                                      children: [
                                        Icon(
                                          Icons.folder,
                                          size: 16,
                                          color: Colors.white54,
                                        ),
                                        SizedBox(width: 4),
                                        Text(
                                          'Portfolio of Evidence',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.white54,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: () => _scanPOE(learner),
                                  icon: const Icon(Icons.camera_alt, size: 20),
                                  label: const Text('POE'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF8B5CF6),
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 12,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: () => _openLogbook(learner),
                                  icon: const Icon(Icons.book, size: 20),
                                  label: const Text('Logbook'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF10b981),
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 12,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}