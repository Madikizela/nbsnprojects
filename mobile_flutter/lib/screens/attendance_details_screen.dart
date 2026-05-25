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
  String filterType = 'week'; // Default to week for the grid view
  DateTime startDate = DateTime.now();
  DateTime endDate = DateTime.now();
  List<DateTime> weekDays = [];

  bool _isHoliday(DateTime date) {
    // South African Public Holidays 2026
    final holidays = {
      '2026-01-01', // New Year's Day
      '2026-03-21', // Human Rights Day
      '2026-04-03', // Good Friday
      '2026-04-06', // Family Day
      '2026-04-27', // Freedom Day
      '2026-05-01', // Workers' Day
      '2026-06-16', // Youth Day
      '2026-08-09', // National Women's Day
      '2026-08-10', // Public Holiday (Women's Day observed)
      '2026-09-24', // Heritage Day
      '2026-12-16', // Day of Reconciliation
      '2026-12-25', // Christmas Day
      '2026-12-26', // Day of Goodwill
    };
    return holidays.contains(DateFormat('yyyy-MM-dd').format(date));
  }

  @override
  void initState() {
    super.initState();
    _setDates();
    _fetchAttendanceDetails();
  }

  void _setDates() {
    final now = DateTime.now();
    // Get the start of the current week (Monday)
    final monday = now.subtract(Duration(days: now.weekday - 1));
    startDate = monday;
    endDate = monday.add(const Duration(days: 4)); // Friday

    // Generate list of days for the table headers
    weekDays = List.generate(5, (index) => monday.add(Duration(days: index)));
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
            const Text('Weekly Attendance Grid',
                style: TextStyle(fontSize: 14, color: Colors.white70)),
          ],
        ),
      ),
      body: Column(
        children: [
          _buildWeekHeader(),
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : attendanceData.isEmpty
                    ? const Center(
                        child: Text('No learners found in this class'))
                    : _buildAttendanceTable(),
          ),
        ],
      ),
    );
  }

  Widget _buildWeekHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      width: double.infinity,
      color: const Color(0xFF1e293b),
      child: Center(
        child: Text(
          'Week of ${DateFormat('MMM dd').format(startDate)} - ${DateFormat('MMM dd, yyyy').format(endDate)}',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
      ),
    );
  }

  Widget _buildAttendanceTable() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SingleChildScrollView(
        child: DataTable(
          headingRowColor: WidgetStateProperty.all(const Color(0xFF1e293b)),
          columnSpacing: 24,
          columns: [
            const DataColumn(
                label: Text('Learner',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.cyanAccent,
                      fontSize: 16,
                    ))),
            ...weekDays.map((date) => DataColumn(
                  label: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(DateFormat('E').format(date),
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.cyanAccent,
                          )),
                      Text(DateFormat('dd/MM').format(date),
                          style: const TextStyle(
                              fontSize: 10, color: Colors.white)),
                    ],
                  ),
                )),
          ],
          rows: _buildRows(),
        ),
      ),
    );
  }

  List<DataRow> _buildRows() {
    return attendanceData.map((learner) {
      final name = '${learner['firstName']} ${learner['lastName']}';
      final attendances = learner['attendance'] as List<dynamic>;

      // Create a map of date -> status for quick lookup
      final attendanceMap = {
        for (var att in attendances) att['date']: att['status'] ?? 'Present'
      };

      return DataRow(cells: [
        DataCell(
            Text(name, style: const TextStyle(fontWeight: FontWeight.w500))),
        ...weekDays.map((date) {
          final dateStr = DateFormat('yyyy-MM-dd').format(date);
          final status = attendanceMap[dateStr];
          final isHoliday = _isHoliday(date);

          if (isHoliday) {
            return const DataCell(Center(
                child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.beach_access, color: Colors.orangeAccent, size: 18),
                Text('Holiday',
                    style: TextStyle(fontSize: 8, color: Colors.orangeAccent)),
              ],
            )));
          }

          if (status == null) {
            // Check if date is in the future
            if (date.isAfter(DateTime.now())) {
              return const DataCell(Center(
                  child: Text('-', style: TextStyle(color: Colors.white24))));
            }
            // If it's today or past and no record, it's an X (Absent)
            return const DataCell(Center(
                child: Icon(Icons.close, color: Colors.redAccent, size: 20)));
          }

          if (status == 'Present' || status == 'ClockedIn') {
            return const DataCell(Center(
                child: Icon(Icons.check, color: Colors.greenAccent, size: 20)));
          } else if (status == 'Excused') {
            return const DataCell(Center(
                child: Icon(Icons.medical_services,
                    color: Colors.blueAccent, size: 20)));
          } else {
            return const DataCell(Center(
                child: Icon(Icons.close, color: Colors.redAccent, size: 20)));
          }
        }),
      ]);
    }).toList();
  }
}
