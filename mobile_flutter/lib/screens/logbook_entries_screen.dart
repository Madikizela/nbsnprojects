import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';

class LogbookEntriesScreen extends StatefulWidget {
  final int learnerId;
  final int unitStandardId;
  final String learnerName;
  final String unitStandardName;
  final int? classId;
  
  const LogbookEntriesScreen({
    super.key, 
    required this.learnerId,
    required this.unitStandardId,
    required this.learnerName,
    required this.unitStandardName,
    this.classId,
  });

  @override
  State<LogbookEntriesScreen> createState() => _LogbookEntriesScreenState();
}

class _LogbookEntriesScreenState extends State<LogbookEntriesScreen> {
  List<dynamic> logbookEntries = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchLogbookEntries();
  }

  Future<void> fetchLogbookEntries() async {
    setState(() => isLoading = true);
    
    try {
      final apiService = context.read<ApiService>();
      final response = await apiService.get('/api/Assessments/logbook/unit-standard/${widget.unitStandardId}');
      
      setState(() {
        logbookEntries = response.data ?? [];
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load logbook entries: $e')),
        );
      }
    }
  }

  void _addLogbookEntry() {
    // Navigate to add logbook entry screen
    context.push(
      '/learners/${widget.learnerId}/logbook/${widget.unitStandardId}/add'
      '?learnerName=${Uri.encodeComponent(widget.learnerName)}'
      '&unitStandardName=${Uri.encodeComponent(widget.unitStandardName)}'
      '${widget.classId != null ? '&classId=${widget.classId}' : ''}'
    ).then((_) {
      // Refresh entries when returning from add screen
      fetchLogbookEntries();
    });
  }

  void _scanEntryEvidence(dynamic entry) {
    // Navigate to document scanner for specific logbook entry evidence
    context.push(
      '/learners/${widget.learnerId}/scan-documents'
      '?name=${Uri.encodeComponent(widget.learnerName)}'
      '&type=logbook-entry'
      '&entryId=${entry['id']}'
      '&unitStandard=${Uri.encodeComponent(widget.unitStandardName)}'
    );
  }

  void _scanLogbookEvidence() {
    // Navigate to document scanner for logbook evidence
    context.push(
      '/learners/${widget.learnerId}/scan-documents'
      '?name=${Uri.encodeComponent(widget.learnerName)}'
      '&type=logbook'
      '&unitStandard=${Uri.encodeComponent(widget.unitStandardName)}'
    );
  }

  void _viewLogbookEntry(dynamic entry) {
    // Show entry details in a dialog
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1e293b),
          title: Text(
            'Logbook Entry #${entry['id']}',
            style: const TextStyle(color: Colors.white),
          ),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildDetailRow('Date Range', '${_formatDate(entry['startDate'])} - ${_formatDate(entry['endDate'])}'),
                const SizedBox(height: 12),
                _buildDetailRow('Hours Spent', '${entry['hoursSpent'] ?? 'Not specified'} hours'),
                const SizedBox(height: 12),
                _buildDetailRow('Activity Description', entry['activityDescription'] ?? 'No description'),
                if (entry['supervisorName'] != null) ...[
                  const SizedBox(height: 12),
                  _buildDetailRow('Supervisor', entry['supervisorName']),
                ],
                if (entry['comments'] != null) ...[
                  const SizedBox(height: 12),
                  _buildDetailRow('Comments', entry['comments']),
                ],
                const SizedBox(height: 12),
                _buildDetailRow('Status', entry['approved'] ? 'Approved' : 'Pending Approval'),
                if (entry['approvedDate'] != null) ...[
                  const SizedBox(height: 8),
                  _buildDetailRow('Approved Date', _formatDate(entry['approvedDate'])),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Close', style: TextStyle(color: Colors.white70)),
            ),
          ],
        );
      },
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return 'N/A';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateStr;
    }
  }

  String _formatDateTime(String? dateTimeStr) {
    if (dateTimeStr == null) return 'N/A';
    try {
      final dateTime = DateTime.parse(dateTimeStr);
      return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateTimeStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Logbook Entries', style: TextStyle(fontSize: 20)),
            Text(
              widget.unitStandardName,
              style: const TextStyle(fontSize: 14, color: Colors.white70),
            ),
          ],
        ),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Summary card
                Container(
                  margin: const EdgeInsets.all(20),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10b981).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF10b981).withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.book, color: Color(0xFF10b981), size: 24),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.learnerName,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${logbookEntries.length} entries recorded',
                              style: const TextStyle(
                                fontSize: 14,
                                color: Colors.white70,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Row(
                        children: [
                          ElevatedButton.icon(
                            onPressed: _addLogbookEntry,
                            icon: const Icon(Icons.add, size: 20),
                            label: const Text('Add Entry'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF10b981),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton.icon(
                            onPressed: () => _scanLogbookEvidence(),
                            icon: const Icon(Icons.camera_alt, size: 20),
                            label: const Text('Scan'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF0EA5E9),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                
                // Entries list
                Expanded(
                  child: logbookEntries.isEmpty
                      ? const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.note_add, size: 64, color: Colors.white54),
                              SizedBox(height: 16),
                              Text(
                                'No Logbook Entries',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              SizedBox(height: 8),
                              Text(
                                'Start recording your practical activities',
                                style: TextStyle(fontSize: 14, color: Colors.white70),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: fetchLogbookEntries,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            itemCount: logbookEntries.length,
                            itemBuilder: (context, index) {
                              final entry = logbookEntries[index];
                              final isApproved = entry['approved'] ?? false;
                              
                              return Card(
                                margin: const EdgeInsets.only(bottom: 16),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  side: BorderSide(
                                    color: isApproved ? Colors.green : const Color(0xFF10b981), 
                                    width: 2
                                  ),
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Container(
                                            width: 48,
                                            height: 48,
                                            decoration: BoxDecoration(
                                              color: (isApproved ? Colors.green : const Color(0xFF10b981)).withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(12),
                                              border: Border.all(
                                                color: (isApproved ? Colors.green : const Color(0xFF10b981)).withOpacity(0.3),
                                              ),
                                            ),
                                            child: Icon(
                                              isApproved ? Icons.check_circle : Icons.pending,
                                              color: isApproved ? Colors.green : const Color(0xFF10b981),
                                              size: 24,
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  'Entry #${entry['id']}',
                                                  style: const TextStyle(
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.bold,
                                                    color: Colors.white,
                                                  ),
                                                ),
                                                const SizedBox(height: 4),
                                                Text(
                                                  '${_formatDate(entry['startDate'])} - ${_formatDate(entry['endDate'])}',
                                                  style: const TextStyle(
                                                    fontSize: 14,
                                                    color: Colors.white70,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: (isApproved ? Colors.green : Colors.orange).withOpacity(0.2),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: Text(
                                              isApproved ? 'Approved' : 'Pending',
                                              style: TextStyle(
                                                fontSize: 10,
                                                color: isApproved ? Colors.green : Colors.orange,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 12),
                                      Text(
                                        entry['activityDescription'] ?? 'No description',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: Colors.white54,
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 12),
                                      Row(
                                        children: [
                                          Expanded(
                                            child: OutlinedButton.icon(
                                              onPressed: () => _viewLogbookEntry(entry),
                                              icon: const Icon(Icons.visibility, size: 16),
                                              label: const Text('View'),
                                              style: OutlinedButton.styleFrom(
                                                foregroundColor: Colors.white70,
                                                side: const BorderSide(color: Colors.white70),
                                                shape: RoundedRectangleBorder(
                                                  borderRadius: BorderRadius.circular(8),
                                                ),
                                                padding: const EdgeInsets.symmetric(vertical: 8),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: ElevatedButton.icon(
                                              onPressed: () => _scanEntryEvidence(entry),
                                              icon: const Icon(Icons.camera_alt, size: 16),
                                              label: const Text('Scan'),
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: const Color(0xFF0EA5E9),
                                                foregroundColor: Colors.white,
                                                shape: RoundedRectangleBorder(
                                                  borderRadius: BorderRadius.circular(8),
                                                ),
                                                padding: const EdgeInsets.symmetric(vertical: 8),
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
                ),
              ],
            ),
    );
  }
}