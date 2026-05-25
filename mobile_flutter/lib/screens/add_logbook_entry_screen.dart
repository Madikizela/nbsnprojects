import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../services/api_service.dart';

class AddLogbookEntryScreen extends StatefulWidget {
  final int learnerId;
  final int unitStandardId;
  final String learnerName;
  final String unitStandardName;
  final int? classId;
  
  const AddLogbookEntryScreen({
    super.key, 
    required this.learnerId,
    required this.unitStandardId,
    required this.learnerName,
    required this.unitStandardName,
    this.classId,
  });

  @override
  State<AddLogbookEntryScreen> createState() => _AddLogbookEntryScreenState();
}

class _AddLogbookEntryScreenState extends State<AddLogbookEntryScreen> {
  final _formKey = GlobalKey<FormState>();
  final _activityController = TextEditingController();
  final _hoursController = TextEditingController();
  final _supervisorController = TextEditingController();
  final _commentsController = TextEditingController();
  
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _activityController.dispose();
    _hoursController.dispose();
    _supervisorController.dispose();
    _commentsController.dispose();
    super.dispose();
  }

  Future<void> _selectStartDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _startDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF10b981),
              onPrimary: Colors.white,
              surface: Color(0xFF1e293b),
              onSurface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _startDate) {
      setState(() {
        _startDate = picked;
        // Ensure end date is not before start date
        if (_endDate.isBefore(_startDate)) {
          _endDate = _startDate;
        }
      });
    }
  }

  Future<void> _selectEndDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _endDate,
      firstDate: _startDate,
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF10b981),
              onPrimary: Colors.white,
              surface: Color(0xFF1e293b),
              onSurface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _endDate) {
      setState(() {
        _endDate = picked;
      });
    }
  }

  Future<void> _submitLogbookEntry() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final apiService = context.read<ApiService>();
      
      final data = {
        'projectQualificationUnitStandardId': widget.unitStandardId,
        'startDate': _startDate.toIso8601String(),
        'endDate': _endDate.toIso8601String(),
        'activityDescription': _activityController.text.trim(),
        'hoursSpent': _hoursController.text.isNotEmpty ? double.tryParse(_hoursController.text) : null,
        'supervisorName': _supervisorController.text.trim().isNotEmpty ? _supervisorController.text.trim() : null,
        'comments': _commentsController.text.trim().isNotEmpty ? _commentsController.text.trim() : null,
        'entryDate': DateTime.now().toIso8601String(),
      };

      final response = await apiService.post('/api/Assessments/logbook', data: data);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Logbook entry added successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        
        // Go back to entries screen
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        String errorMessage = 'Failed to add logbook entry';
        if (e is DioException && e.response?.data != null) {
          errorMessage = e.response!.data['message'] ?? errorMessage;
        }
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(errorMessage)),
        );
      }
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Add Logbook Entry', style: TextStyle(fontSize: 20)),
            Text(
              widget.learnerName,
              style: const TextStyle(fontSize: 14, color: Colors.white70),
            ),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Unit Standard Info Card
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: const BorderSide(color: Color(0xFF10b981), width: 2),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: const Color(0xFF10b981).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFF10b981).withOpacity(0.3)),
                        ),
                        child: const Icon(
                          Icons.book,
                          color: Color(0xFF10b981),
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Unit Standard',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.white54,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            Text(
                              widget.unitStandardName,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Date Range Section
              const Text(
                'Activity Period',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Start Date',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.white70,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 8),
                        InkWell(
                          onTap: _selectStartDate,
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.white24),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.calendar_today, color: Color(0xFF10b981), size: 20),
                                const SizedBox(width: 12),
                                Text(
                                  _formatDate(_startDate),
                                  style: const TextStyle(
                                    fontSize: 16,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'End Date',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.white70,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 8),
                        InkWell(
                          onTap: _selectEndDate,
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.white24),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.calendar_today, color: Color(0xFF10b981), size: 20),
                                const SizedBox(width: 12),
                                Text(
                                  _formatDate(_endDate),
                                  style: const TextStyle(
                                    fontSize: 16,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 24),
              
              // Activity Description
              const Text(
                'Activity Description',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              
              TextFormField(
                controller: _activityController,
                maxLines: 4,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  hintText: 'Describe the practical activities performed...',
                  hintStyle: TextStyle(color: Colors.white54),
                  border: OutlineInputBorder(),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.white24),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Color(0xFF10b981)),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please describe the activity';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 24),
              
              // Hours Spent (Optional)
              const Text(
                'Hours Spent (Optional)',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              
              TextFormField(
                controller: _hoursController,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  hintText: 'e.g., 8.5',
                  hintStyle: TextStyle(color: Colors.white54),
                  suffixText: 'hours',
                  suffixStyle: TextStyle(color: Colors.white54),
                  border: OutlineInputBorder(),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.white24),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Color(0xFF10b981)),
                  ),
                ),
                validator: (value) {
                  if (value != null && value.isNotEmpty) {
                    final hours = double.tryParse(value);
                    if (hours == null || hours <= 0) {
                      return 'Please enter a valid number of hours';
                    }
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 24),
              
              // Supervisor Name (Optional)
              const Text(
                'Supervisor Name (Optional)',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              
              TextFormField(
                controller: _supervisorController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  hintText: 'Name of supervising person',
                  hintStyle: TextStyle(color: Colors.white54),
                  border: OutlineInputBorder(),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.white24),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Color(0xFF10b981)),
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Comments (Optional)
              const Text(
                'Comments (Optional)',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              
              TextFormField(
                controller: _commentsController,
                maxLines: 3,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  hintText: 'Additional notes or observations...',
                  hintStyle: TextStyle(color: Colors.white54),
                  border: OutlineInputBorder(),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.white24),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Color(0xFF10b981)),
                  ),
                ),
              ),
              
              const SizedBox(height: 32),
              
              // Submit Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _isSubmitting ? null : _submitLogbookEntry,
                  icon: _isSubmitting 
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Icon(Icons.save, size: 24),
                  label: Text(
                    _isSubmitting ? 'Saving...' : 'Save Logbook Entry',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10b981),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}