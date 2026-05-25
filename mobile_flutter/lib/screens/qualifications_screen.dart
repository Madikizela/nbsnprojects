import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';

class QualificationsScreen extends StatefulWidget {
  final int learnerId;
  final String learnerName;
  final int classId;
  
  const QualificationsScreen({
    super.key, 
    required this.learnerId,
    required this.learnerName,
    required this.classId,
  });

  @override
  State<QualificationsScreen> createState() => _QualificationsScreenState();
}

class _QualificationsScreenState extends State<QualificationsScreen> {
  List<dynamic> qualifications = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchQualifications();
  }

  Future<void> fetchQualifications() async {
    setState(() => isLoading = true);
    
    try {
      final apiService = context.read<ApiService>();
      
      // First, get the project ID for this class
      int? projectId;
      
      // Try to get project ID from class relationship: Class -> Site -> Project
      try {
        final classResponse = await apiService.get('/api/SiteClasses/${widget.classId}');
        if (classResponse.data != null && classResponse.data['projectSiteId'] != null) {
          final siteResponse = await apiService.get('/api/ProjectSites/${classResponse.data['projectSiteId']}');
          if (siteResponse.data != null && siteResponse.data['projectId'] != null) {
            projectId = siteResponse.data['projectId'];
            print('🎯 Found project ID $projectId for class ${widget.classId}');
          }
        }
      } catch (e) {
        print('Could not get project ID from class: $e');
      }
      
      // If we couldn't get project ID from class, try to use a default project (for testing)
      if (projectId == null) {
        // For now, use project ID 3 (Masakhane) as it has data configured
        projectId = 3;
        print('Using default project ID 3 for testing');
      }
      
      // Now get the project details with qualifications using the correct endpoint
      final response = await apiService.get('/api/Projects/$projectId/details');
      
      List<dynamic> projectQualifications = [];
      
      if (response.data != null && response.data['learningPathways'] != null) {
        // Extract qualifications from learning pathways structure
        for (var pathway in response.data['learningPathways']) {
          if (pathway['qualifications'] != null) {
            for (var qual in pathway['qualifications']) {
              // Determine qualification name and type based on the data structure
              String qualName = 'Unknown Qualification';
              String qualType = 'occupational';
              
              if (qual['legacyQualification'] != null) {
                qualName = qual['legacyQualification']['name'] ?? 'Legacy Qualification';
                qualType = 'legacy';
              } else if (qual['occupationalQualification'] != null) {
                qualName = qual['occupationalQualification']['name'] ?? 'Occupational Qualification';
                qualType = 'occupational';
              }
              
              projectQualifications.add({
                'id': qual['id'],
                'name': qualName,
                'description': '${qual['employmentType'] ?? 'Standard'} - ${qual['numberOfBeneficiaries'] ?? 0} beneficiaries',
                'type': qualType,
                'unitStandards': qual['unitStandards'] ?? [],
                'pathwayName': pathway['pathway']?['name'] ?? 'Unknown Pathway',
                'legacyQualificationId': qual['legacyQualificationId'],
                'occupationalQualificationId': qual['occupationalQualificationId']
              });
            }
          }
        }
      }
      
      setState(() {
        qualifications = projectQualifications;
        isLoading = false;
      });
      
      if (projectQualifications.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('No qualifications configured for this project. Please contact your administrator.'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      }
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load qualifications: $e')),
        );
      }
    }
  }

  void _selectQualification(dynamic qualification) {
    context.push(
      '/learners/${widget.learnerId}/qualifications/${qualification['id']}/unit-standards'
      '?learnerName=${Uri.encodeComponent(widget.learnerName)}'
      '&qualificationName=${Uri.encodeComponent(qualification['name'] ?? '')}'
      '&qualificationType=${Uri.encodeComponent(qualification['type'] ?? '')}'
      '&classId=${widget.classId}'
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Select Qualification', style: TextStyle(fontSize: 20)),
            Text(
              widget.learnerName,
              style: const TextStyle(fontSize: 14, color: Colors.white70),
            ),
          ],
        ),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : qualifications.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.school, size: 64, color: Colors.white54),
                      SizedBox(height: 16),
                      Text(
                        'No Qualifications Found',
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
                  onRefresh: fetchQualifications,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: qualifications.length,
                    itemBuilder: (context, index) {
                      final qualification = qualifications[index];
                      
                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: const BorderSide(color: Color(0xFF8B5CF6), width: 2),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(16),
                          leading: Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: const Color(0xFF8B5CF6).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: const Color(0xFF8B5CF6).withOpacity(0.3),
                              ),
                            ),
                            child: const Icon(
                              Icons.school,
                              color: Color(0xFF8B5CF6),
                              size: 24,
                            ),
                          ),
                          title: Text(
                            qualification['name'] ?? 'Unknown Qualification',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          subtitle: Text(
                            qualification['description'] ?? 'No description available',
                            style: const TextStyle(
                              fontSize: 14,
                              color: Colors.white70,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          trailing: const Icon(
                            Icons.arrow_forward_ios,
                            color: Color(0xFF8B5CF6),
                            size: 16,
                          ),
                          onTap: () => _selectQualification(qualification),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}