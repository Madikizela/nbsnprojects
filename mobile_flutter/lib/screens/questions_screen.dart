import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';

class QuestionsScreen extends StatefulWidget {
  final int learnerId;
  final int assessmentId;
  final String learnerName;
  final String assessmentName;
  final String assessmentType;
  final int? classId;

  const QuestionsScreen({
    super.key,
    required this.learnerId,
    required this.assessmentId,
    required this.learnerName,
    required this.assessmentName,
    required this.assessmentType,
    this.classId,
  });

  @override
  State<QuestionsScreen> createState() => _QuestionsScreenState();
}

class _QuestionsScreenState extends State<QuestionsScreen> {
  List<dynamic> questions = [];
  Map<int, dynamic> existingAnswers = {}; // questionId -> answer data
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchQuestionsAndAnswers();
  }

  Future<void> fetchQuestionsAndAnswers() async {
    setState(() => isLoading = true);

    try {
      final apiService = context.read<ApiService>();

      // Fetch questions
      String endpoint;
      if (widget.assessmentType.toLowerCase() == 'formative') {
        endpoint =
            '/api/Assessments/formative/${widget.assessmentId}/questions';
      } else {
        endpoint =
            '/api/Assessments/summative/${widget.assessmentId}/questions';
      }

      final questionsResponse = await apiService.get(endpoint);

      // Fetch existing answers for this learner and assessment
      final answersResponse = await apiService.get(
          '/api/LearnerAssessmentAnswers/learner/${widget.learnerId}/assessment/${widget.assessmentId}/${widget.assessmentType}');

      // Create a map of existing answers by questionId
      // Store both original and remedial answers
      Map<int, Map<String, dynamic>> answersMap = {};
      if (answersResponse.data != null) {
        for (var answer in answersResponse.data) {
          int qId = answer['questionId'];
          if (!answersMap.containsKey(qId)) {
            answersMap[qId] = {};
          }
          if (answer['isRemedial'] == true) {
            answersMap[qId]!['remedial'] = answer;
          } else {
            answersMap[qId]!['original'] = answer;
          }
        }
      }

      setState(() {
        questions = questionsResponse.data ?? [];
        existingAnswers = answersMap;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load questions: $e')),
        );
      }
    }
  }

  void _scanQuestionAnswer(dynamic question) {
    // Check if answer already exists
    if (existingAnswers.containsKey(question['id'])) {
      final answers = existingAnswers[question['id']]!;
      // If only original exists and it's not failed, or if remedial already exists, show dialog
      if (answers.containsKey('remedial')) {
        _showAnswerExistsDialog(question);
        return;
      }

      final original = answers['original']!;
      final mark = original['mark'];
      final allocatedMarks = question['allocatedMarks'] ?? 1.0;
      bool isFailed = mark != null && (mark / allocatedMarks) < 0.5;

      if (!isFailed) {
        _showAnswerExistsDialog(question);
        return;
      }

      // If it's failed, we might want to automatically offer remedial or show dialog
      _showAnswerExistsDialog(question);
      return;
    }

    // SEQUENTIAL LOGIC: Check if previous questions are completed
    final questionIndex =
        questions.indexWhere((q) => q['id'] == question['id']);
    if (questionIndex > 0) {
      // Check if all previous questions have been answered
      for (int i = 0; i < questionIndex; i++) {
        final prevQuestion = questions[i];
        if (!existingAnswers.containsKey(prevQuestion['id'])) {
          _showSequentialLockDialog(questionIndex + 1, i + 1);
          return;
        }
      }
    }

    // Navigate to scan screen for this specific question
    context
        .push(
            '/learners/${widget.learnerId}/assessments/${widget.assessmentId}/questions/${question['id']}/scan'
            '?learnerName=${Uri.encodeComponent(widget.learnerName)}'
            '&assessmentName=${Uri.encodeComponent(widget.assessmentName)}'
            '&assessmentType=${Uri.encodeComponent(widget.assessmentType)}'
            '&questionNumber=${question['questionNumber']}'
            '&questionText=${Uri.encodeComponent(question['questionText'] ?? '')}'
            '${widget.classId != null ? '&classId=${widget.classId}' : ''}')
        .then((_) {
      // Refresh the screen when returning from scan
      fetchQuestionsAndAnswers();
    });
  }

  void _showSequentialLockDialog(
      int currentQuestionNumber, int requiredQuestionNumber) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1e293b),
          title: const Text(
            'Question Locked',
            style: TextStyle(color: Colors.white),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'You must complete questions in order.',
                style: TextStyle(
                    color: Colors.white70, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Text(
                'Please complete Question $requiredQuestionNumber first before accessing Question $currentQuestionNumber.',
                style: const TextStyle(color: Colors.white70),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange.withOpacity(0.3)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.orange, size: 16),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Sequential completion ensures proper assessment flow',
                        style: TextStyle(
                          color: Colors.orange,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
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

  void _showAnswerExistsDialog(dynamic question) {
    final answers = existingAnswers[question['id']]!;
    // Prefer remedial answer for display if it exists
    final answer = answers['remedial'] ?? answers['original'];
    final mark = answer['mark'];
    final allocatedMarks = question['allocatedMarks'] ?? 1.0;
    final isRemedial = answer['isRemedial'] ?? false;

    // Check if it's a fail (NYC) - less than 50%
    bool isFailed = false;
    if (mark != null) {
      isFailed = (mark / allocatedMarks) < 0.5;
    }

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1e293b),
          title: Text(
            isRemedial ? 'Remedial Answer Exists' : 'Answer Already Exists',
            style: const TextStyle(color: Colors.white),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Question ${question['questionNumber']} already has a scanned answer.',
                style: const TextStyle(color: Colors.white70),
              ),
              const SizedBox(height: 8),
              if (mark != null) ...[
                Text(
                  'Mark: $mark / $allocatedMarks (${((mark / allocatedMarks) * 100).toStringAsFixed(1)}%)',
                  style: TextStyle(
                      color: isFailed ? Colors.red : Colors.green,
                      fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
              ],
              Text(
                'Scanned: ${_formatDateTime(answer['scannedAt'])}',
                style: const TextStyle(color: Colors.white54, fontSize: 12),
              ),
              if (answers.containsKey('original') &&
                  answers.containsKey('remedial')) ...[
                const SizedBox(height: 8),
                const Text(
                  'Both original and remedial answers are stored.',
                  style: TextStyle(color: Colors.orange, fontSize: 10),
                ),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child:
                  const Text('Close', style: TextStyle(color: Colors.white70)),
            ),
            if (isFailed && !isRemedial)
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  _startRemedialScan(question);
                },
                style: TextButton.styleFrom(foregroundColor: Colors.orange),
                child: const Text('Do Remedial'),
              ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                _deleteAnswer(question['id'], answer['id']);
              },
              child: const Text('Delete & Rescan',
                  style: TextStyle(color: Colors.red)),
            ),
          ],
        );
      },
    );
  }

  void _startRemedialScan(dynamic question) {
    context
        .push(
            '/learners/${widget.learnerId}/assessments/${widget.assessmentId}/questions/${question['id']}/scan'
            '?learnerName=${Uri.encodeComponent(widget.learnerName)}'
            '&assessmentName=${Uri.encodeComponent(widget.assessmentName)}'
            '&assessmentType=${Uri.encodeComponent(widget.assessmentType)}'
            '&questionNumber=${question['questionNumber']}'
            '&questionText=${Uri.encodeComponent(question['questionText'] ?? '')}'
            '&isRemedial=true'
            '${widget.classId != null ? '&classId=${widget.classId}' : ''}')
        .then((_) {
      fetchQuestionsAndAnswers();
    });
  }

  Future<void> _deleteAnswer(int questionId, int answerId) async {
    try {
      final apiService = context.read<ApiService>();
      await apiService.delete('/api/LearnerAssessmentAnswers/$answerId');

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Answer deleted successfully'),
            backgroundColor: Colors.green,
          ),
        );

        // Refresh the screen
        fetchQuestionsAndAnswers();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete answer: $e')),
        );
      }
    }
  }

  String _formatDateTime(String dateTimeStr) {
    try {
      final dateTime = DateTime.parse(dateTimeStr);
      return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateTimeStr;
    }
  }

  Color _getTypeColor() {
    return widget.assessmentType == 'Formative'
        ? const Color(0xFF0EA5E9)
        : const Color(0xFFef4444);
  }

  @override
  Widget build(BuildContext context) {
    final typeColor = _getTypeColor();

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${widget.assessmentType} Questions',
                style: const TextStyle(fontSize: 20)),
            Text(
              widget.assessmentName,
              style: const TextStyle(fontSize: 14, color: Colors.white70),
            ),
          ],
        ),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : questions.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.help_outline, size: 64, color: Colors.white54),
                      SizedBox(height: 16),
                      Text(
                        'No Questions Found',
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
                  onRefresh: fetchQuestionsAndAnswers,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: questions.length,
                    itemBuilder: (context, index) {
                      final question = questions[index];
                      final answers = existingAnswers[question['id']];
                      final hasAnswer = answers != null &&
                          (answers.containsKey('original') ||
                              answers.containsKey('remedial'));
                      final isRemedial =
                          answers != null && answers.containsKey('remedial');
                      final originalFailed = answers != null &&
                          answers.containsKey('original') &&
                          answers['original']!['mark'] != null &&
                          (answers['original']!['mark'] /
                                  (question['allocatedMarks'] ?? 1.0)) <
                              0.5;

                      // SEQUENTIAL LOGIC: Check if this question is accessible
                      bool isAccessible = true;
                      if (index > 0) {
                        // Check if all previous questions have been answered
                        for (int i = 0; i < index; i++) {
                          final prevQuestion = questions[i];
                          if (!existingAnswers
                              .containsKey(prevQuestion['id'])) {
                            isAccessible = false;
                            break;
                          }
                        }
                      }

                      // Determine colors and icons based on state
                      Color cardColor = typeColor;

                      if (!isAccessible) {
                        cardColor = Colors.grey;
                      } else if (isRemedial) {
                        cardColor = Colors.orange; // Remedial color
                      } else if (hasAnswer) {
                        cardColor = originalFailed ? Colors.red : Colors.green;
                      }

                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(color: cardColor, width: 2),
                        ),
                        child: InkWell(
                          onTap: isAccessible
                              ? () => _scanQuestionAnswer(question)
                              : null,
                          borderRadius: BorderRadius.circular(12),
                          child: Opacity(
                            opacity: isAccessible ? 1.0 : 0.6,
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        width: 32,
                                        height: 32,
                                        decoration: BoxDecoration(
                                          color: cardColor.withOpacity(0.1),
                                          borderRadius:
                                              BorderRadius.circular(8),
                                          border: Border.all(
                                              color:
                                                  cardColor.withOpacity(0.3)),
                                        ),
                                        child: Center(
                                          child: !isAccessible
                                              ? Icon(Icons.lock,
                                                  color: cardColor, size: 18)
                                              : hasAnswer
                                                  ? Icon(Icons.check,
                                                      color: cardColor,
                                                      size: 18)
                                                  : Text(
                                                      '${index + 1}',
                                                      style: TextStyle(
                                                        color: cardColor,
                                                        fontWeight:
                                                            FontWeight.bold,
                                                        fontSize: 14,
                                                      ),
                                                    ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Text(
                                          'Question ${index + 1}',
                                          style: TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                            color: isAccessible
                                                ? Colors.white
                                                : Colors.white54,
                                          ),
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: cardColor.withOpacity(0.1),
                                          borderRadius:
                                              BorderRadius.circular(12),
                                          border: Border.all(
                                              color:
                                                  cardColor.withOpacity(0.3)),
                                        ),
                                        child: Text(
                                          '${question['allocatedMarks'] ?? question['marks'] ?? 1} marks',
                                          style: TextStyle(
                                            color: cardColor,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    question['questionText'] ??
                                        'No question text available',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: isAccessible
                                          ? Colors.white70
                                          : Colors.white54,
                                      height: 1.4,
                                    ),
                                  ),
                                  if (isRemedial) ...[
                                    const SizedBox(height: 8),
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: Colors.orange.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                            color:
                                                Colors.orange.withOpacity(0.3)),
                                      ),
                                      child: Row(
                                        children: [
                                          const Icon(Icons.history,
                                              color: Colors.orange, size: 16),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              'Remedial scanned: ${_formatDateTime(answers!['remedial']!['scannedAt'])}',
                                              style: const TextStyle(
                                                color: Colors.orange,
                                                fontSize: 12,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ] else if (hasAnswer) ...[
                                    const SizedBox(height: 8),
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: (originalFailed
                                                ? Colors.red
                                                : Colors.green)
                                            .withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                            color: (originalFailed
                                                    ? Colors.red
                                                    : Colors.green)
                                                .withOpacity(0.3)),
                                      ),
                                      child: Row(
                                        children: [
                                          Icon(
                                              originalFailed
                                                  ? Icons.error_outline
                                                  : Icons.check_circle,
                                              color: originalFailed
                                                  ? Colors.red
                                                  : Colors.green,
                                              size: 16),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              '${originalFailed ? 'NYC' : 'Competent'} - scanned: ${_formatDateTime(answers!['original']!['scannedAt'])}',
                                              style: TextStyle(
                                                color: originalFailed
                                                    ? Colors.red
                                                    : Colors.green,
                                                fontSize: 12,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ] else if (!isAccessible) ...[
                                    const SizedBox(height: 8),
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: Colors.grey.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                            color:
                                                Colors.grey.withOpacity(0.3)),
                                      ),
                                      child: const Row(
                                        children: [
                                          Icon(Icons.lock,
                                              color: Colors.grey, size: 16),
                                          SizedBox(width: 8),
                                          Text(
                                            'Complete previous questions first',
                                            style: TextStyle(
                                              color: Colors.grey,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ] else ...[
                                    const SizedBox(height: 8),
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: typeColor.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                            color: typeColor.withOpacity(0.3)),
                                      ),
                                      child: Row(
                                        children: [
                                          Icon(Icons.camera_alt,
                                              color: typeColor, size: 16),
                                          const SizedBox(width: 8),
                                          Text(
                                            'Tap to scan answer',
                                            style: TextStyle(
                                              color: typeColor,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
