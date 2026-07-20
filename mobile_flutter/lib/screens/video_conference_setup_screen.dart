import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';

class VideoConferenceSetupScreen extends StatefulWidget {
  final int classId;
  final String className;

  const VideoConferenceSetupScreen({
    super.key,
    required this.classId,
    required this.className,
  });

  @override
  State<VideoConferenceSetupScreen> createState() =>
      _VideoConferenceSetupScreenState();
}

class _VideoConferenceSetupScreenState
    extends State<VideoConferenceSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _linkController = TextEditingController();
  final _descriptionController = TextEditingController();
  
  String _selectedType = 'Teams';
  DateTime? _startTime;
  bool _sendAnnouncement = true;
  bool _isLoading = false;
  bool _isSaving = false;
  
  final List<String> _conferenceTypes = [
    'Teams',
    'Zoom',
    'Google Meet',
    'Other',
  ];

  @override
  void initState() {
    super.initState();
    _loadCurrentDetails();
  }

  Future<void> _loadCurrentDetails() async {
    setState(() => _isLoading = true);
    try {
      final apiService = context.read<ApiService>();
      final response = await apiService.get('/api/SiteClasses/${widget.classId}');
      
      if (mounted && response.data != null) {
        final data = response.data;
        setState(() {
          _linkController.text = data['videoConferenceLink'] ?? '';
          _descriptionController.text = data['videoConferenceDescription'] ?? '';
          _selectedType = data['videoConferenceType'] ?? 'Teams';
          
          if (data['videoConferenceStartTime'] != null) {
            _startTime = DateTime.tryParse(data['videoConferenceStartTime']);
          }
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load details: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _saveConferenceDetails() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isSaving = true);
    
    try {
      final apiService = context.read<ApiService>();
      
      final payload = {
        'videoConferenceLink': _linkController.text,
        'videoConferenceType': _selectedType,
        'videoConferenceDescription': _descriptionController.text,
        'sendAnnouncement': _sendAnnouncement,
      };
      
      if (_startTime != null) {
        payload['videoConferenceStartTime'] = _startTime!.toIso8601String();
      }
      
      await apiService.put(
        '/api/SiteClasses/${widget.classId}/video-conference',
        data: payload,
      );
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Video conference details saved!'),
            backgroundColor: Color(0xFF10b981),
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  Future<void> _pickDateTime() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: _startTime ?? now,
      firstDate: now,
      lastDate: DateTime(now.year + 1),
    );
    
    if (date != null && mounted) {
      final time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.fromDateTime(_startTime ?? now),
      );
      
      if (time != null) {
        setState(() {
          _startTime = DateTime(
            date.year,
            date.month,
            date.day,
            time.hour,
            time.minute,
          );
        });
      }
    }
  }

  @override
  void dispose() {
    _linkController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        title: Text('Video Conference - ${widget.className}'),
        backgroundColor: const Color(0xFF1e293b),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Set Online Class Link',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Enter video conference details for your class',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white70,
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    // Conference Type
                    const Text(
                      'Conference Type',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1e293b),
                        border: Border.all(color: Colors.white24),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedType,
                          dropdownColor: const Color(0xFF1e293b),
                          isExpanded: true,
                          style: const TextStyle(color: Colors.white),
                          items: _conferenceTypes.map((type) {
                            return DropdownMenuItem(
                              value: type,
                              child: Text(type),
                            );
                          }).toList(),
                          onChanged: (value) {
                            if (value != null) {
                              setState(() => _selectedType = value);
                            }
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Conference Link
                    const Text(
                      'Meeting Link',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _linkController,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'https://teams.microsoft.com/...',
                        hintStyle: const TextStyle(color: Colors.white54),
                        filled: true,
                        fillColor: const Color(0xFF1e293b),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: Colors.white24),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: Colors.white24),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: Color(0xFF0EA5E9)),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter a meeting link';
                        }
                        if (!value.startsWith('http')) {
                          return 'Link should start with http:// or https://';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    
                    // Start Time (optional)
                    const Text(
                      'Start Time (Optional)',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    InkWell(
                      onTap: _pickDateTime,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 16,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1e293b),
                          border: Border.all(color: Colors.white24),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              _startTime == null
                                  ? 'Select date and time'
                                  : '${_startTime!.day}/${_startTime!.month}/${_startTime!.year} ${_startTime!.hour.toString().padLeft(2, '0')}:${_startTime!.minute.toString().padLeft(2, '0')}',
                              style: TextStyle(
                                color: _startTime == null
                                    ? Colors.white54
                                    : Colors.white,
                              ),
                            ),
                            const Icon(Icons.calendar_today, color: Colors.white54),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Description
                    const Text(
                      'Description (Optional)',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _descriptionController,
                      maxLines: 3,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'What this online class is about...',
                        hintStyle: const TextStyle(color: Colors.white54),
                        filled: true,
                        fillColor: const Color(0xFF1e293b),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: Colors.white24),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: Colors.white24),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: Color(0xFF0EA5E9)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Send Announcement Checkbox
                    SwitchListTile(
                      value: _sendAnnouncement,
                      onChanged: (value) {
                        setState(() => _sendAnnouncement = value);
                      },
                      title: const Text(
                        'Send announcement to learners',
                        style: TextStyle(color: Colors.white),
                      ),
                      subtitle: const Text(
                        'Notify learners about the new link',
                        style: TextStyle(color: Colors.white54),
                      ),
                      activeColor: const Color(0xFF10b981),
                      contentPadding: EdgeInsets.zero,
                    ),
                    const SizedBox(height: 24),
                    
                    // Save Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isSaving ? null : _saveConferenceDetails,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10b981),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: _isSaving
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text(
                                'Save & Share Link',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
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
