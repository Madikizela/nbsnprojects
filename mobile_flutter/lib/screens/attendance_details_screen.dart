import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class AttendanceDetailsScreen extends StatefulWidget {
  final int classId;
  final String className;

  const AttendanceDetailsScreen({
    super.key,
    required this.classId,
    required this.className,
  });

  @override
  State<AttendanceDetailsScreen> createState() =>
      _AttendanceDetailsScreenState();
}

class _AttendanceDetailsScreenState extends State<AttendanceDetailsScreen> {
  bool isLoading = true;
  List<dynamic> attendanceData = [];
  String filterType = 'today'; // 'today' or 'week'
  DateTime startDate = DateTime.now();
  DateTime endDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _setDates();
    _fetchAttendanceDetails();
  }

  void _setDates() {
    final now = DateTime.now();
    if (filterType == 'today') {
      startDate = now;
      endDate = now;
    } else if (filterType == 'week') {
      // Get the start of the week (Monday)
      startDate = now.subtract(Duration(days: now.weekday - 1));
      endDate = now;
    }
  }

  Future<void> _fetchAttendanceDetails() async {
    setState(() => isLoading = true);
    try {
      final apiService = context.read<ApiService>();
      final startStr = DateFormat('yyyy-MM-dd').format(startDate);
      final endStr = DateFormat('yyyy-MM-dd').format(endDate);

      final response = await apiService.get(
          '/api/Attendance/class/${widget.classId}/details?startDate=$startStr&endDate=$endStr');

      setState(() {
        attendanceData = response.data;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load attendance details: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.className, style: const TextStyle(fontSize: 18)),
            const Text('Attendance Details',
                style: TextStyle(fontSize: 14, color: Colors.white70)),
          ],
        ),
      ),
      body: Column(
        children: [
          _buildFilterToggle(),
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : attendanceData.isEmpty
                    ? const Center(child: Text('No attendance records found'))
                    : _buildAttendanceTable(),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterToggle() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'today', label: Text('Today')),
                ButtonSegment(value: 'week', label: Text('This Week')),
              ],
              selected: {filterType},
              onSelectionChanged: (newSelection) {
                setState(() {
                  filterType = newSelection.first;
                  _setDates();
                });
                _fetchAttendanceDetails();
              },
              style: ButtonStyle(
                backgroundColor:
                    WidgetStateProperty.resolveWith<Color>((states) {
                  if (states.contains(WidgetState.selected)) {
                    return const Color(0xFF8B5CF6);
                  }
                  return const Color(0xFF1e293b);
                }),
                foregroundColor: WidgetStateProperty.all(Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceTable() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SingleChildScrollView(
        child: DataTable(
          headingRowColor: WidgetStateProperty.all(const Color(0xFF1e293b)),
          columns: const [
            DataColumn(
                label: Text('Learner',
                    style: TextStyle(fontWeight: FontWeight.bold))),
            DataColumn(
                label: Text('Date',
                    style: TextStyle(fontWeight: FontWeight.bold))),
            DataColumn(
                label: Text('Status',
                    style: TextStyle(fontWeight: FontWeight.bold))),
            DataColumn(
                label: Text('Clock In',
                    style: TextStyle(fontWeight: FontWeight.bold))),
            DataColumn(
                label: Text('Clock Out',
                    style: TextStyle(fontWeight: FontWeight.bold))),
            DataColumn(
                label: Text('Time',
                    style: TextStyle(fontWeight: FontWeight.bold))),
          ],
          rows: _buildRows(),
        ),
      ),
    );
  }

  List<DataRow> _buildRows() {
    List<DataRow> rows = [];

    for (var learner in attendanceData) {
      final name = '${learner['firstName']} ${learner['lastName']}';
      final attendances = learner['attendance'] as List<dynamic>;

      if (attendances.isEmpty) {
        // If filtering by today and learner is absent
        if (filterType == 'today') {
          rows.add(DataRow(cells: [
            DataCell(Text(name)),
            DataCell(Text(DateFormat('yyyy-MM-dd').format(startDate))),
            const DataCell(
                Text('Absent', style: TextStyle(color: Colors.redAccent))),
            const DataCell(Text('-')),
            const DataCell(Text('-')),
            const DataCell(Text('-')),
          ]));
        }
      } else {
        for (var att in attendances) {
          rows.add(DataRow(cells: [
            DataCell(Text(name)),
            DataCell(Text(att['date'])),
            DataCell(Text(
              att['status'] ?? 'Present',
              style: TextStyle(
                color: att['status'] == 'Absent'
                    ? Colors.redAccent
                    : Colors.greenAccent,
              ),
            )),
            DataCell(Text(att['clockIn'] ?? '-')),
            DataCell(Text(att['clockOut'] ?? '-')),
            DataCell(Text(att['contactTime'] ?? '-')),
          ]));
        }
      }
    }

    // Sort rows by date descending
    rows.sort((a, b) {
      final dateA = (a.cells[1].child as Text).data ?? '';
      final dateB = (b.cells[1].child as Text).data ?? '';
      return dateB.compareTo(dateA);
    });

    return rows;
  }
}
