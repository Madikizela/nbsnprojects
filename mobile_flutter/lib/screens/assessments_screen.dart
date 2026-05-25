import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';

class AssessmentsScreen extends StatefulWidget {
  final int learnerId;
  final int unitStandardId;
  final String learnerName;
  final String unitStandardName;
  final int? classId;
  
  const AssessmentsScreen({
    super.key, 
    required this.learnerId,
    required this.unitStandardId,
    required this.learnerName,
    required this.unitStandardName,
    this.classId,
  });

  @override
  State<AssessmentsScreen> createState() => _AssessmentsScreenState();
}

class _AssessmentsScreenState extends State<AssessmentsScreen> {
  List<dynamic> formativeAssessments = [];
  List<dynamic> summativeAssessments = [];
  dynamic learnerProgress;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchAssessments();
  }

  Future<void> fetchAssessments() async {
    setState(() => isLoading = true);
    
    try {
      final apiService = context.read<ApiService>();
      
      // Fetch both formative and summative assessments
      final formativeResponse = await apiService.get('/api/Assessments/formative/unit-standard/${widget.unitStandardId}');
      final summativeResponse = await apiService.get('/api/Assessments/summative/unit-standard/${widget.unitStandardId}');
      
      // Get learner progress for this unit standard
      final progressResponse = await apiService.get('/api/LearnerAssessmentAnswers/learner/${widget.learnerId}/progress');
      dynamic unitStandardProgress;
      if (progressResponse.data != null) {
        for (var progress in progressResponse.data) {
          if (progress['projectQualificationUnitStandardId'] == widget.unitStandardId) {
            unitStandardProgress = progress;
            break;
          }
        }
      }
      
      setState(() {
        formativeAssessments = formativeResponse.data ?? [];
        summativeAssessments = summativeResponse.data ?? [];
        learnerProgress = unitStandardProgress;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load assessments: $e')),
        );
      }
    }
  }

  void _selectAssessment(dynamic assessment, String type) {
    // Check if summative assessment is accessible (formative must be completed first)
    if (type == 'Summative') {
      final formativeCompleted = learnerProgress?['formativeCompleted'] ?? false;
      if (!formativeCompleted) {
        _showSummativeLockedDialog();
        return;
      }
    }
    
    context.push(
      '/learners/${widget.learnerId}/assessments/${assessment['id']}/questions'
      '?learnerName=${Uri.encodeComponent(widget.learnerName)}'
      '&assessmentName=${Uri.encodeComponent(assessment['title'] ?? '')}'
      '&assessmentType=${Uri.encodeComponent(type)}'
      '${widget.classId != null ? '&classId=${widget.classId}' : ''}'
    );
  }

  void _showSummativeLockedDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1e293b),
          title: const Text(
            'Summative Assessment Locked',
            style: TextStyle(color: Colors.white),
          ),
          content: const Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'You must complete the formative assessment first before accessing the summative assessment.',
                style: TextStyle(color: Colors.white70),
              ),
              SizedBox(height: 12),
              Text(
                'Complete all questions in the formative assessment to unlock the summative assessment.',
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

  Widget _buildAssessmentCard(dynamic assessment, String type, Color color) {
    final formativeCompleted = learnerProgress?['formativeCompleted'] ?? false;
    final summativeCompleted = learnerProgress?['summativeCompleted'] ?? false;
    
    bool isAccessible = true;
    bool isCompleted = false;
    
    if (type == 'Formative') {
      isCompleted = formativeCompleted;
    } else if (type == 'Summative') {
      isAccessible = formativeCompleted; // Summative only accessible after formative
      isCompleted = summativeCompleted;
    }
    
    Color cardColor = color;
    IconData cardIcon = type == 'Formative' ? Icons.quiz : Icons.assignment_turned_in;
    
    if (!isAccessible) {
      cardColor = Colors.grey;
      cardIcon = Icons.lock;
    } else if (isCompleted) {
      cardColor = Colors.green;
      cardIcon = Icons.check_circle;
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
            color: cardColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: cardColor.withOpacity(0.3)),
          ),
          child: Icon(
            cardIcon,
            color: cardColor,
            size: 24,
          ),
        ),
        title: Text(
          assessment['title'] ?? 'Unknown Assessment',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: isAccessible ? Colors.white : Colors.white54,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              type,
              style: TextStyle(
                fontSize: 12,
                color: cardColor,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              assessment['description'] ?? 'No description available',
              style: TextStyle(
                fontSize: 14,
                color: isAccessible ? Colors.white70 : Colors.white54,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            if (isCompleted) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  'Completed ✓',
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.green,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ] else if (!isAccessible) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.grey.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  'Locked - Complete formative first',
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
          color: cardColor,
          size: 16,
        ),
        onTap: () => _selectAssessment(assessment, type),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Select Assessment', style: TextStyle(fontSize: 20)),
            Text(
              widget.unitStandardName,
              style: const TextStyle(fontSize: 14, color: Colors.white70),
            ),
          ],
        ),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : (formativeAssessments.isEmpty && summativeAssessments.isEmpty)
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.quiz, size: 64, color: Colors.white54),
                      SizedBox(height: 16),
                      Text(
                        'No Assessments Found',
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
                  onRefresh: fetchAssessments,
                  child: ListView(
                    padding: const EdgeInsets.all(20),
                    children: [
                      if (formativeAssessments.isNotEmpty) ...[
                        const Text(
                          'Formative Assessments',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 16),
                        ...formativeAssessments.map((assessment) => 
                          _buildAssessmentCard(assessment, 'Formative', const Color(0xFF0EA5E9))
                        ),
                        const SizedBox(height: 24),
                      ],
                      if (summativeAssessments.isNotEmpty) ...[
                        const Text(
                          'Summative Assessments',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 16),
                        ...summativeAssessments.map((assessment) => 
                          _buildAssessmentCard(assessment, 'Summative', const Color(0xFFef4444))
                        ),
                      ],
                    ],
                  ),
                ),
    );
  }
}