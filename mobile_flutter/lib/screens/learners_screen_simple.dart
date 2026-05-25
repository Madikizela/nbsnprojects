import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';

class LearnersScreen extends StatefulWidget {
  final int classId;
  
  const LearnersScreen({super.key, required this.classId});

  @override
  State<LearnersScreen> createState() => _LearnersScreenState();
}

class _LearnersScreenState extends State<LearnersScreen> {
  List<dynamic> learners = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchLearners();
  }

  Future<void> fetchLearners() async {
    try {
      final apiService = context.read<ApiService>();
      final response = await apiService.get('/api/Learners/class/${widget.classId}');
      
      setState(() {
        learners = response.data ?? [];
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load learners: $e')),
        );
      }
    }
  }

  String getInitials(String firstName, String lastName) {
    return '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'.toUpperCase();
  }

  Color getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'active':
        return const Color(0xFF10b981);
      case 'completed':
        return const Color(0xFF3b82f6);
      default:
        return const Color(0xFF10b981);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Learners')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Learners', style: TextStyle(fontSize: 20)),
            Text('${learners.length} Learners', style: const TextStyle(fontSize: 14, color: Color(0xFF0EA5E9))),
          ],
        ),
      ),
      body: Column(
        children: [
          // Add Learner button removed - teachers view only
          Expanded(
            child: learners.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.school, size: 64, color: Colors.white54),
                        SizedBox(height: 16),
                        Text('No Learners Found', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
                        SizedBox(height: 8),
                        Text('No learners enrolled in this class yet', style: TextStyle(fontSize: 14, color: Colors.white70), textAlign: TextAlign.center),
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
                        final firstName = learner['firstName'] ?? '';
                        final lastName = learner['lastName'] ?? '';
                        final status = learner['status'] ?? 'Active';
                        
                        return Card(
                          margin: const EdgeInsets.only(bottom: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: const BorderSide(color: Color(0xFF334155)),
                          ),
                          child: InkWell(
                            onTap: () {
                              context.push(
                                '/learners/${learner['id']}/details',
                              );
                            },
                            borderRadius: BorderRadius.circular(12),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                children: [
                                  Row(
                                    children: [
                                      CircleAvatar(
                                        radius: 25,
                                        backgroundColor: const Color(0xFF0EA5E9),
                                        child: Text(
                                          getInitials(firstName, lastName),
                                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              '$firstName $lastName',
                                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            'ID: ${learner['idNumber'] ?? 'N/A'}',
                                            style: const TextStyle(fontSize: 12, color: Colors.white70),
                                          ),
                                          Text(
                                            '📞 ${learner['contactNumber'] ?? 'N/A'}',
                                            style: const TextStyle(fontSize: 12, color: Colors.white70),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: getStatusColor(status).withOpacity(0.2),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        status,
                                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: getStatusColor(status)),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                InkWell(
                                  onTap: () {
                                    context.push('/learners/${learner['id']}/scan-documents?name=${Uri.encodeComponent('$firstName $lastName')}');
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF334155),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Center(
                                      child: Text('📄 Scan Documents', style: TextStyle(color: Color(0xFF0EA5E9), fontSize: 14, fontWeight: FontWeight.w600)),
                                    ),
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
}
