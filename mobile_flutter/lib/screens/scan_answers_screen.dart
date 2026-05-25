import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ScanAnswersScreen extends StatefulWidget {
  final int learnerId;
  final int assessmentId;
  final String learnerName;
  final String assessmentName;
  final String assessmentType;
  final int? classId;
  
  const ScanAnswersScreen({
    super.key, 
    required this.learnerId,
    required this.assessmentId,
    required this.learnerName,
    required this.assessmentName,
    required this.assessmentType,
    this.classId,
  });

  @override
  State<ScanAnswersScreen> createState() => _ScanAnswersScreenState();
}

class _ScanAnswersScreenState extends State<ScanAnswersScreen> {
  List<String> scannedAnswers = [];
  bool isScanning = false;

  Color _getTypeColor() {
    return widget.assessmentType == 'Formative' 
        ? const Color(0xFF0EA5E9) 
        : const Color(0xFFef4444);
  }

  Future<void> _scanAnswerSheet() async {
    setState(() => isScanning = true);
    
    try {
      // Simulate scanning process
      await Future.delayed(const Duration(seconds: 2));
      
      // Add a mock scanned answer
      setState(() {
        scannedAnswers.add('Answer Sheet ${scannedAnswers.length + 1} - ${DateTime.now().toString().substring(11, 19)}');
        isScanning = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Answer sheet ${scannedAnswers.length} scanned successfully'),
            backgroundColor: const Color(0xFF10b981),
          ),
        );
      }
    } catch (e) {
      setState(() => isScanning = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to scan answer sheet: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _submitAnswers() async {
    if (scannedAnswers.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please scan at least one answer sheet'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    try {
      // For now, just show success message - backend endpoint needs to be implemented
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Answers scanned successfully! (Submit feature coming soon)'),
            backgroundColor: Color(0xFF10b981),
          ),
        );
        
        // Navigate back to learner evidence screen
        if (widget.classId != null) {
          context.go('/classes/${widget.classId}/learner-evidence');
        } else {
          context.go('/classes/4/learner-evidence'); // Default to class 4 as fallback
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to submit answers: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _removeAnswer(int index) {
    setState(() {
      scannedAnswers.removeAt(index);
    });
  }

  @override
  Widget build(BuildContext context) {
    final typeColor = _getTypeColor();
    
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Scan Answers', style: TextStyle(fontSize: 20)),
            Text(
              '${widget.learnerName} - ${widget.assessmentType}',
              style: const TextStyle(fontSize: 14, color: Colors.white70),
            ),
          ],
        ),
        actions: [
          if (scannedAnswers.isNotEmpty)
            TextButton(
              onPressed: _submitAnswers,
              child: const Text(
                'Submit',
                style: TextStyle(
                  color: Color(0xFF10b981),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          // Assessment info card
          Container(
            margin: const EdgeInsets.all(20),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1e293b),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: typeColor, width: 2),
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: typeColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: typeColor.withOpacity(0.3)),
                  ),
                  child: Icon(
                    widget.assessmentType == 'Formative' ? Icons.quiz : Icons.assignment_turned_in,
                    color: typeColor,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.assessmentName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${widget.assessmentType} Assessment',
                        style: TextStyle(
                          fontSize: 14,
                          color: typeColor,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Scanned answers list
          Expanded(
            child: scannedAnswers.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.document_scanner,
                          size: 64,
                          color: Colors.white54,
                        ),
                        SizedBox(height: 16),
                        Text(
                          'No Answer Sheets Scanned',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Tap the scan button to capture answer sheets',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.white70,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: scannedAnswers.length,
                    itemBuilder: (context, index) {
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: const BorderSide(color: Color(0xFF10b981), width: 1),
                        ),
                        child: ListTile(
                          leading: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: const Color(0xFF10b981).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFF10b981).withOpacity(0.3)),
                            ),
                            child: const Icon(
                              Icons.check_circle,
                              color: Color(0xFF10b981),
                              size: 20,
                            ),
                          ),
                          title: Text(
                            scannedAnswers[index],
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: Colors.white,
                            ),
                          ),
                          trailing: IconButton(
                            onPressed: () => _removeAnswer(index),
                            icon: const Icon(
                              Icons.delete_outline,
                              color: Colors.red,
                              size: 20,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
          
          // Scan button
          Container(
            padding: const EdgeInsets.all(20),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: isScanning ? null : _scanAnswerSheet,
                icon: isScanning 
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Icon(Icons.document_scanner, size: 24),
                label: Text(
                  isScanning ? 'Scanning...' : 'Scan Answer Sheet',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: typeColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}