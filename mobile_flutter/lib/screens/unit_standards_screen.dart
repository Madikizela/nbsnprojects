import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';

class UnitStandardsScreen extends StatefulWidget {
  final int learnerId;
  final int qualificationId;
  final String learnerName;
  final String qualificationName;
  final String qualificationType;
  final int? classId;

  const UnitStandardsScreen({
    super.key,
    required this.learnerId,
    required this.qualificationId,
    required this.learnerName,
    required this.qualificationName,
    required this.qualificationType,
    this.classId,
  });

  @override
  State<UnitStandardsScreen> createState() => _UnitStandardsScreenState();
}

class _UnitStandardsScreenState extends State<UnitStandardsScreen> {
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
        final classResponse =
            await apiService.get('/api/SiteClasses/${widget.classId}');
        if (classResponse.data != null &&
            classResponse.data['projectSiteId'] != null) {
          final siteResponse = await apiService
              .get('/api/ProjectSites/${classResponse.data['projectSiteId']}');
          if (siteResponse.data != null &&
              siteResponse.data['projectId'] != null) {
            projectId = siteResponse.data['projectId'];
          }
        }
      } catch (e) {
        print('Could not get project ID from class: $e');
      }

      projectId ??= 3;

      // Get project details to find the qualification and its unit standards
      final response = await apiService.get('/api/Projects/$projectId/details');

      // Get learner progress
      final progressResponse = await apiService.get(
          '/api/LearnerAssessmentAnswers/learner/${widget.learnerId}/progress');
      Map<int, dynamic> progressMap = {};
      if (progressResponse.data != null) {
        for (var progress in progressResponse.data) {
          progressMap[progress['projectQualificationUnitStandardId']] =
              progress;
        }
      }

      List<dynamic> qualificationUnitStandards = [];

      if (response.data != null && response.data['learningPathways'] != null) {
        // Find the specific qualification by ID
        for (var pathway in response.data['learningPathways']) {
          if (pathway['qualifications'] != null) {
            for (var qual in pathway['qualifications']) {
              if (qual['id'] == widget.qualificationId) {
                // Found the qualification, extract its unit standards
                if (qual['unitStandards'] != null) {
                  for (int i = 0; i < qual['unitStandards'].length; i++) {
                    var unitStandard = qual['unitStandards'][i];
                    var progress = progressMap[unitStandard['id']];

                    // Determine if this unit standard is accessible
                    bool isAccessible =
                        i == 0; // First unit standard is always accessible

                    if (i > 0) {
                      // Unlock if previous unit standard has any uploads (progress record exists)
                      // i.e. formative has been uploaded, regardless of marking/summative status
                      var previousUnitStandard = qual['unitStandards'][i - 1];
                      var previousProgress =
                          progressMap[previousUnitStandard['id']];
                      isAccessible = previousProgress != null;
                    }

                    qualificationUnitStandards.add({
                      'id': unitStandard['id'],
                      'unitStandardId': unitStandard['unitStandardId'],
                      'title': unitStandard['unitStandardName'] ??
                          'Unknown Unit Standard',
                      'name': unitStandard['unitStandardName'] ??
                          'Unknown Unit Standard',
                      'credits': unitStandard['credits'],
                      'level': unitStandard['level'],
                      'unitStandardType': unitStandard['unitStandardType'],
                      'isAccessible': isAccessible,
                      'progress': progress,
                      'order': i + 1,
                    });
                  }
                }
                break;
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
    // Check if unit standard is accessible
    if (!unitStandard['isAccessible']) {
      _showUnitStandardLockedDialog(unitStandard);
      return;
    }

    // Use the ProjectQualificationUnitStandardId (the 'id' field) for the assessment endpoints
    final projectQualificationUnitStandardId = unitStandard['id'];

    context.push(
        '/learners/${widget.learnerId}/unit-standards/$projectQualificationUnitStandardId/assessments'
        '?learnerName=${Uri.encodeComponent(widget.learnerName)}'
        '&unitStandardName=${Uri.encodeComponent(unitStandard['title'] ?? unitStandard['name'] ?? '')}'
        '${widget.classId != null ? '&classId=${widget.classId}' : ''}');
  }

  void _showUnitStandardLockedDialog(dynamic unitStandard) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1e293b),
          title: const Text(
            'Unit Standard Locked',
            style: TextStyle(color: Colors.white),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'You must complete the previous unit standard before accessing "${unitStandard['title']}".',
                style: const TextStyle(color: Colors.white70),
              ),
              const SizedBox(height: 12),
              const Text(
                'Upload formative assessment answers for the previous unit standard to unlock this one.',
                style: TextStyle(color: Colors.white54, fontSize: 12),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('OK', style: TextStyle(color: Colors.white70)),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Select Unit Standard', style: TextStyle(fontSize: 20)),
            Text(
              widget.qualificationName,
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
                      Icon(Icons.assignment, size: 64, color: Colors.white54),
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
                      final isAccessible =
                          unitStandard['isAccessible'] ?? false;
                      final progress = unitStandard['progress'];
                      final formativeCompleted =
                          progress?['formativeCompleted'] ?? false;
                      final summativeCompleted =
                          progress?['summativeCompleted'] ?? false;

                      Color cardColor = const Color(0xFF8B5CF6);
                      Color iconColor = const Color(0xFF10b981);
                      IconData cardIcon = Icons.assignment;

                      if (!isAccessible) {
                        cardColor = Colors.grey;
                        iconColor = Colors.grey;
                        cardIcon = Icons.lock;
                      } else if (formativeCompleted && summativeCompleted) {
                        cardColor = Colors.green;
                        iconColor = Colors.green;
                        cardIcon = Icons.check_circle;
                      } else if (formativeCompleted || summativeCompleted) {
                        cardColor = Colors.orange;
                        iconColor = Colors.orange;
                        cardIcon = Icons.hourglass_empty;
                      }

                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(color: cardColor, width: 2),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(16),
                          leading: Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: iconColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: iconColor.withOpacity(0.3),
                              ),
                            ),
                            child: Stack(
                              children: [
                                Center(
                                  child: Icon(
                                    cardIcon,
                                    color: iconColor,
                                    size: 24,
                                  ),
                                ),
                                if (unitStandard['order'] != null)
                                  Positioned(
                                    top: 2,
                                    right: 2,
                                    child: Container(
                                      width: 16,
                                      height: 16,
                                      decoration: BoxDecoration(
                                        color: cardColor,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Center(
                                        child: Text(
                                          '${unitStandard['order']}',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          title: Text(
                            unitStandard['title'] ??
                                unitStandard['name'] ??
                                'Unknown Unit Standard',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color:
                                  isAccessible ? Colors.white : Colors.white54,
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (unitStandard['unitStandardId'] != null)
                                Text(
                                  'ID: ${unitStandard['unitStandardId']}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: isAccessible
                                        ? Colors.white54
                                        : Colors.white38,
                                  ),
                                ),
                              const SizedBox(height: 4),
                              Text(
                                'Credits: ${unitStandard['credits'] ?? 'N/A'} | Level: ${unitStandard['level'] ?? 'N/A'}',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: isAccessible
                                      ? Colors.white70
                                      : Colors.white54,
                                ),
                              ),
                              if (progress != null) ...[
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: formativeCompleted
                                            ? Colors.green.withOpacity(0.2)
                                            : Colors.orange.withOpacity(0.2),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        formativeCompleted
                                            ? 'Formative ✓'
                                            : 'Formative ○',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: formativeCompleted
                                              ? Colors.green
                                              : Colors.orange,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: summativeCompleted
                                            ? Colors.green.withOpacity(0.2)
                                            : Colors.orange.withOpacity(0.2),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        summativeCompleted
                                            ? 'Summative ✓'
                                            : 'Summative ○',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: summativeCompleted
                                              ? Colors.green
                                              : Colors.orange,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ] else if (!isAccessible) ...[
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: const Text(
                                    'Locked - Complete previous unit standard',
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: Colors.grey,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          trailing: Icon(
                            isAccessible ? Icons.arrow_forward_ios : Icons.lock,
                            color: isAccessible ? iconColor : Colors.grey,
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
