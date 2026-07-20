import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class AttendanceHistoryScreen extends StatefulWidget {
  final int classId;
  final String className;

  const AttendanceHistoryScreen({
    super.key,
    required this.classId,
    required this.className,
  });

  @override
  State<AttendanceHistoryScreen> createState() =>
      _AttendanceHistoryScreenState();
}

class _AttendanceHistoryScreenState extends State<AttendanceHistoryScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _attendanceData = [];
  bool _isLoading = true;
  String? _error;
  DateTime _startDate = DateTime.now().subtract(const Duration(days: 30));
  DateTime _endDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _loadAttendanceHistory();
  }

  Future<void> _loadAttendanceHistory() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final startDateStr = DateFormat('yyyy-MM-dd').format(_startDate);
      final endDateStr = DateFormat('yyyy-MM-dd').format(_endDate);

      final response = await _apiService.get(
        '/api/Attendance/class/${widget.classId}/details?startDate=$startDateStr&endDate=$endDateStr',
      );

      if (response.statusCode == 200 && response.data != null) {
        setState(() {
          _attendanceData = response.data as List;
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = 'Failed to load attendance history';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error loading attendance history: $e';
        _isLoading = false;
      });
      debugPrint('❌ Error loading attendance history: $e');
    }
  }

  Future<void> _selectDateRange() async {
    final pickedRange = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now(),
      initialDateRange: DateTimeRange(start: _startDate, end: _endDate),
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF4A90E2),
              onPrimary: Colors.white,
              surface: Color(0xFF1E2A38),
              onSurface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );

    if (pickedRange != null) {
      setState(() {
        _startDate = pickedRange.start;
        _endDate = pickedRange.end;
      });
      _loadAttendanceHistory();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A1628),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E2A38),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Attendance History',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              widget.className,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 14,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.date_range, color: Colors.white),
            onPressed: _selectDateRange,
            tooltip: 'Select Date Range',
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _loadAttendanceHistory,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: Column(
        children: [
          // Date Range Display
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            color: const Color(0xFF1E2A38),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.calendar_today,
                    color: Colors.white70, size: 16),
                const SizedBox(width: 8),
                Text(
                  '${DateFormat('MMM dd, yyyy').format(_startDate)} - ${DateFormat('MMM dd, yyyy').format(_endDate)}',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),

          // Content
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: Color(0xFF4A90E2)),
                  )
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.error_outline,
                              color: Colors.red,
                              size: 64,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              _error!,
                              style: const TextStyle(color: Colors.red),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: _loadAttendanceHistory,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF4A90E2),
                              ),
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      )
                    : _attendanceData.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.history,
                                  color: Colors.white.withOpacity(0.3),
                                  size: 64,
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'No attendance records found',
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.5),
                                    fontSize: 16,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _attendanceData.length,
                            itemBuilder: (context, index) {
                              final learner = _attendanceData[index];
                              final attendance =
                                  learner['attendance'] as List? ?? [];

                              return _buildLearnerCard(learner, attendance);
                            },
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildLearnerCard(Map<String, dynamic> learner, List attendance) {
    final totalDays = attendance.length;
    final presentDays =
        attendance.where((a) => a['status'] == 'Present').length;
    final attendanceRate =
        totalDays > 0 ? (presentDays / totalDays * 100) : 0.0;

    return Card(
      color: const Color(0xFF1E2A38),
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.all(16),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        leading: CircleAvatar(
          backgroundColor: _getAttendanceColor(attendanceRate),
          child: Text(
            '${attendanceRate.toStringAsFixed(0)}%',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(
          '${learner['firstName']} ${learner['lastName']}',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              'ID: ${learner['idNumber']}',
              style: const TextStyle(color: Colors.white70, fontSize: 12),
            ),
            const SizedBox(height: 4),
            Text(
              '$presentDays present out of $totalDays days',
              style: const TextStyle(color: Colors.white60, fontSize: 12),
            ),
          ],
        ),
        children: [
          if (attendance.isEmpty)
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text(
                'No attendance records',
                style: TextStyle(color: Colors.white60),
              ),
            )
          else
            ...attendance
                .map((record) => _buildAttendanceRecord(record))
                .toList(),
        ],
      ),
    );
  }

  Widget _buildAttendanceRecord(Map<String, dynamic> record) {
    final status = record['status'] as String?;
    final date = record['date'] as String?;
    final clockIn = record['clockIn'] as String?;
    final clockOut = record['clockOut'] as String?;
    final contactTime = record['contactTime'] as String?;

    final isPresent = status == 'Present';
    final color = isPresent ? Colors.green : Colors.red;
    final icon = isPresent ? Icons.check_circle : Icons.cancel;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF0A1628),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: color.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  date != null
                      ? DateFormat('EEE, MMM dd, yyyy')
                          .format(DateTime.parse(date))
                      : 'Unknown date',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                if (isPresent && clockIn != null) ...[
                  Row(
                    children: [
                      const Icon(Icons.login, color: Colors.green, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        'In: $clockIn',
                        style: const TextStyle(
                            color: Colors.white70, fontSize: 12),
                      ),
                      if (clockOut != null) ...[
                        const SizedBox(width: 16),
                        const Icon(Icons.logout,
                            color: Colors.orange, size: 16),
                        const SizedBox(width: 4),
                        Text(
                          'Out: $clockOut',
                          style: const TextStyle(
                              color: Colors.white70, fontSize: 12),
                        ),
                      ],
                    ],
                  ),
                  if (contactTime != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.timer,
                            color: Color(0xFF4A90E2), size: 16),
                        const SizedBox(width: 4),
                        Text(
                          'Contact time: $contactTime',
                          style: const TextStyle(
                            color: Color(0xFF4A90E2),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ] else ...[
                  Text(
                    status ?? 'Unknown status',
                    style: const TextStyle(color: Colors.white60, fontSize: 12),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getAttendanceColor(double rate) {
    if (rate >= 80) return Colors.green;
    if (rate >= 60) return Colors.orange;
    return Colors.red;
  }
}
