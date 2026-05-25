import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';

class LogbookScreen extends StatefulWidget {
  final int learnerId;
  final String learnerName;
  final int? classId;
  
  const LogbookScreen({
    super.key, 
    required this.learnerId,
    required this.learnerName,
    this.classId,
  });

  @override
  State<LogbookScreen> createState() => _LogbookScreenState();
}

class _LogbookScreenState extends State<LogbookScreen> {
  List<dynamic> unitStandards = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchUnitStandards();
  }

  Future<void> fetchUnitStandards() async {
    setState(() => isLoading = true);
    
    try {
      final apiService = context.read<ApiService>();
      
      // Get the project ID for this class first
      int? projectId;
      
      try {
        final classResponse = await apiService.get('/api/SiteClasses/${widget.classId}');
        if (classResponse.data != null && classResponse.data['projectSiteId'] != null) {
          final siteResponse = await apiService.get('/api/ProjectSites/${classResponse.data['projectSiteId']}');
          if (siteResponse.data != null && siteResponse.data['projectId'] != null) {
            projectId = siteResponse.data['projectId'];
          }
        }
      } catch (e) {
        print('Could not get project ID from class: $e');
      }
      
      projectId ??= 3;
      
      // Get project details to find the qualification and its unit standards
      final response = await apiService.get('/api/Projects/$projectId/details');
      
      List<dynamic> qualificationUnitStandards = [];
      
      if (response.data != null && response.data['learningPathways'] != null) {
        // Extract all unit standards from all qualifications
        for (var pathway in response.data['learningPathways']) {
          if (pathway['qualifications'] != null) {
            for (var qual in pathway['qualifications']) {
              if (qual['unitStandards'] != null) {
                for (var unitStandard in qual['unitStandards']) {
                  qualificationUnitStandards.add({
                    'id': unitStandard['id'],
                    'unitStandardId': unitStandard['unitStandardId'],
                    'title': unitStandard['unitStandardName'] ?? 'Unknown Unit Standard',
                    'name': unitStandard['unitStandardName'] ?? 'Unknown Unit Standard',
                    'credits': unitStandard['credits'],
                    'level': unitStandard['level'],
                    'unitStandardType': unitStandard['unitStandardType'],
                    'qualificationName': qual['qualificationName'],
                  });
                }
              }
            }
          }
        }
      }
      
      setState(() {
        unitStandards = qualificationUnitStandards;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load unit standards: $e')),
        );
      }
    }
  }

  void _selectUnitStandard(dynamic unitStandard) {
    // Navigate to logbook entries for this unit standard
    context.push(
      '/learners/${widget.learnerId}/logbook/${unitStandard['id']}/entries'
      '?learnerName=${Uri.encodeComponent(widget.learnerName)}'
      '&unitStandardName=${Uri.encodeComponent(unitStandard['title'] ?? unitStandard['name'] ?? '')}'
      '${widget.classId != null ? '&classId=${widget.classId}' : ''}'
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Logbook', style: TextStyle(fontSize: 20)),
            Text(
              widget.learnerName,
              style: const TextStyle(fontSize: 14, color: Colors.white70),
            ),
          ],
        ),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : unitStandards.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.book, size: 64, color: Colors.white54),
                      SizedBox(height: 16),
                      Text(
                        'No Unit Standards Found',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: fetchUnitStandards,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: unitStandards.length,
                    itemBuilder: (context, index) {
                      final unitStandard = unitStandards[index];
                      
                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: const BorderSide(color: Color(0xFF10b981), width: 2),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(16),
                          leading: Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: const Color(0xFF10b981).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: const Color(0xFF10b981).withOpacity(0.3),
                              ),
                            ),
                            child: const Icon(
                              Icons.book,
                              color: Color(0xFF10b981),
                              size: 24,
                            ),
                          ),
                          title: Text(
                            unitStandard['title'] ?? unitStandard['name'] ?? 'Unknown Unit Standard',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (unitStandard['unitStandardId'] != null)
                                Text(
                                  'ID: ${unitStandard['unitStandardId']}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Colors.white54,
                                  ),
                                ),
                              const SizedBox(height: 4),
                              Text(
                                'Credits: ${unitStandard['credits'] ?? 'N/A'} | Level: ${unitStandard['level'] ?? 'N/A'}',
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: Colors.white70,
                                ),
                              ),
                              if (unitStandard['qualificationName'] != null) ...[
                                const SizedBox(height: 4),
                                Text(
                                  unitStandard['qualificationName'],
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Colors.white54,
                                    fontStyle: FontStyle.italic,
                                  ),
                                ),
                              ],
                            ],
                          ),
                          trailing: const Icon(
                            Icons.arrow_forward_ios,
                            color: Color(0xFF10b981),
                            size: 16,
                          ),
                          onTap: () => _selectUnitStandard(unitStandard),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}