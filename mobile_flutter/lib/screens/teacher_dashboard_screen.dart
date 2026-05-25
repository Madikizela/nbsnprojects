import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import 'attendance_details_screen.dart';
import 'sick_note_upload_screen.dart';
import 'face_recognition_screen.dart';

class TeacherDashboardScreen extends StatefulWidget {
  const TeacherDashboardScreen({super.key});

  @override
  State<TeacherDashboardScreen> createState() => _TeacherDashboardScreenState();
}

class _TeacherDashboardScreenState extends State<TeacherDashboardScreen> {
  List<dynamic> classes = [];
  bool isLoading = true;
  String teacherName = '';
  int teacherId = 0;

  @override
  void initState() {
    super.initState();
    _loadTeacherData();
  }

  Future<void> _loadTeacherData() async {
    final authService = context.read<AuthService>();
    final user = authService.user;

    if (user != null) {
      setState(() {
        teacherName = user['name']?.toString() ?? 'Teacher';

        final rawId = user['id'];
        teacherId = rawId is int
            ? rawId
            : (rawId != null ? int.tryParse(rawId.toString()) ?? 0 : 0);
      });

      await fetchTeacherClasses();
    }
  }

  Future<void> fetchTeacherClasses() async {
    setState(() => isLoading = true);

    try {
      final apiService = context.read<ApiService>();
      final response =
          await apiService.get('/api/Attendance/teacher/$teacherId/classes');

      debugPrint('📍 [DEBUG] Raw API Response: ${response.data}');

      // Fetch attendance statistics for each class
      List<dynamic> classesWithStats = [];
      for (var classItem in response.data ?? []) {
        final classId = classItem['classId'];

        try {
          // Get daily attendance stats for this class
          final statsResponse =
              await apiService.get('/api/Attendance/daily-stats/$classId');
          final stats = statsResponse.data;

          // Merge class info with attendance stats
          classesWithStats.add({
            ...classItem,
            'totalLearners': stats['totalLearners'] ?? 0,
            'presentToday': stats['presentLearners'] ?? 0,
            'absentToday': stats['absentLearners'] ?? 0,
            'completedAttendance': stats['completedAttendance'] ?? 0,
            'averageContactTime': stats['averageContactTime'] ?? '0h 0m',
            'attendanceRate': stats['attendanceRate'] ?? 0.0,
          });
        } catch (e) {
          // If stats fail, use default values
          print('Failed to fetch stats for class $classId: $e');
          classesWithStats.add({
            ...classItem,
            'totalLearners': 0,
            'presentToday': 0,
            'absentToday': 0,
            'completedAttendance': 0,
            'averageContactTime': '0h 0m',
            'attendanceRate': 0.0,
          });
        }
      }

      setState(() {
        classes = classesWithStats;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load classes: $e')),
        );
      }
    }
  }

  Future<void> _handleLogout() async {
    final authService = context.read<AuthService>();
    await authService.logout();
    if (mounted) {
      context.go('/login');
    }
  }

  void _showMenuOptions(BuildContext context, dynamic classItem) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1e293b),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (BuildContext context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          expand: false,
          builder: (_, scrollController) {
            return SingleChildScrollView(
              controller: scrollController,
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      color: Colors.white24,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  Text(
                    classItem['className'] ?? 'Menu',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 20),
                  _buildMenuItem(
                    icon: Icons.person,
                    title: 'Teacher Profile',
                    onTap: () {
                      Navigator.pop(context);
                      context.push('/teacher-profile');
                    },
                  ),
                  _buildMenuItem(
                    icon: Icons.fingerprint,
                    title: 'Learner Fingerprint Clocking',
                    onTap: () {
                      Navigator.pop(context);
                      final classId = classItem['classId'];

                      // Try multiple common naming conventions
                      final lat = classItem['latitude'] ??
                          classItem['Latitude'] ??
                          classItem['lat'];
                      final lng = classItem['longitude'] ??
                          classItem['Longitude'] ??
                          classItem['lng'];

                      debugPrint('📍 [DEBUG] Full ClassItem Data: $classItem');
                      debugPrint('📍 [DEBUG] Extracted Lat: $lat, Lng: $lng');

                      context.push(
                          '/classes/${classId.toString()}/attendance-clocking?lat=${lat ?? ""}&lng=${lng ?? ""}');
                    },
                  ),
                  _buildMenuItem(
                    icon: Icons.face,
                    title: 'Learner Face Clocking',
                    onTap: () {
                      Navigator.pop(context);
                      final rawClassId = classItem['classId'];
                      final int? classId = rawClassId is int
                          ? rawClassId
                          : (rawClassId != null
                              ? int.tryParse(rawClassId.toString())
                              : null);

                      if (classId != null) {
                        final lat = classItem['latitude'] ??
                            classItem['Latitude'] ??
                            classItem['lat'];
                        final lng = classItem['longitude'] ??
                            classItem['Longitude'] ??
                            classItem['lng'];

                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => FaceRecognitionScreen(
                              mode: FaceMode.verify,
                              classId: classId,
                              latitude: lat != null
                                  ? double.tryParse(lat.toString())
                                  : null,
                              longitude: lng != null
                                  ? double.tryParse(lng.toString())
                                  : null,
                            ),
                          ),
                        );
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                              content: Text('Error: Invalid Class ID')),
                        );
                      }
                    },
                  ),
                  _buildMenuItem(
                    icon: Icons.history,
                    title: 'Attendance History',
                    onTap: () {
                      Navigator.pop(context);
                      final classId = classItem['classId'];
                      context.push('/classes/$classId/attendance-history');
                    },
                  ),
                  _buildMenuItem(
                    icon: Icons.medical_services,
                    title: 'Upload Sick Note',
                    onTap: () {
                      Navigator.pop(context);
                      final rawClassId = classItem['classId'];
                      final int classId = rawClassId is int
                          ? rawClassId
                          : (rawClassId != null
                              ? int.tryParse(rawClassId.toString()) ?? 0
                              : 0);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) =>
                              SickNoteUploadScreen(classId: classId),
                        ),
                      );
                    },
                  ),
                  _buildMenuItem(
                    icon: Icons.assignment,
                    title: 'Attendance Details',
                    onTap: () {
                      Navigator.pop(context);
                      final rawClassId = classItem['classId'];
                      final int classId = rawClassId is int
                          ? rawClassId
                          : (rawClassId != null
                              ? int.tryParse(rawClassId.toString()) ?? 0
                              : 0);
                      final className =
                          classItem['className'] ?? 'Unknown Class';
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => AttendanceDetailsScreen(
                            classId: classId,
                            className: className,
                          ),
                        ),
                      );
                    },
                  ),
                  _buildMenuItem(
                    icon: Icons.folder_shared,
                    title: 'POE Evidence',
                    color: const Color(0xFF10b981),
                    onTap: () {
                      Navigator.pop(context);
                      final classId = classItem['classId'];
                      context.push('/classes/$classId/learner-evidence');
                    },
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    Color? color,
  }) {
    return ListTile(
      leading: Icon(icon, color: color ?? const Color(0xFF8B5CF6)),
      title: Text(
        title,
        style: TextStyle(
          color: color ?? Colors.white,
          fontSize: 16,
        ),
      ),
      onTap: onTap,
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Teacher Dashboard'),
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Teacher Dashboard', style: TextStyle(fontSize: 20)),
            Text(
              teacherName,
              style: const TextStyle(fontSize: 14, color: Colors.white70),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _handleLogout,
            tooltip: 'Logout',
          ),
        ],
      ),
      body: classes.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.school, size: 64, color: Colors.white54),
                  SizedBox(height: 16),
                  Text(
                    'No Classes Assigned',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'You have not been assigned to any classes yet',
                    style: TextStyle(fontSize: 14, color: Colors.white70),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: fetchTeacherClasses,
              child: ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: classes.length,
                itemBuilder: (context, index) {
                  final classItem = classes[index];
                  return _buildClassSummaryCard(classItem);
                },
              ),
            ),
    );
  }

  Widget _buildClassSummaryCard(dynamic classItem) {
    final totalLearners = classItem['totalLearners'] as int? ?? 0;
    final presentToday = classItem['presentToday'] as int? ?? 0;
    final absentToday = classItem['absentToday'] as int? ?? 0;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFF8B5CF6), width: 2),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Class Name and Menu Button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        classItem['className'] ?? 'Unknown Class',
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(
                            Icons.location_on,
                            size: 16,
                            color: Colors.white54,
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              classItem['siteName'] ?? 'Unknown Site',
                              style: const TextStyle(
                                fontSize: 14,
                                color: Colors.white70,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.menu,
                      color: Color(0xFF8B5CF6), size: 28),
                  onPressed: () => _showMenuOptions(context, classItem),
                  tooltip: 'Menu',
                ),
              ],
            ),
            const SizedBox(height: 20),
            const Divider(color: Colors.white24),
            const SizedBox(height: 20),

            // Summary Statistics
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () {
                      final rawId = classItem['classId'];
                      final int classId = rawId is int
                          ? rawId
                          : (rawId != null
                              ? int.tryParse(rawId.toString()) ?? 0
                              : 0);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => AttendanceDetailsScreen(
                            classId: classId,
                            className: classItem['className'] ?? 'Class',
                          ),
                        ),
                      );
                    },
                    child: _buildStatCard(
                      icon: Icons.people,
                      label: 'Total Learners',
                      value: totalLearners.toString(),
                      color: const Color(0xFF0EA5E9),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () {
                      final rawId = classItem['classId'];
                      final int classId = rawId is int
                          ? rawId
                          : (rawId != null
                              ? int.tryParse(rawId.toString()) ?? 0
                              : 0);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => AttendanceDetailsScreen(
                            classId: classId,
                            className: classItem['className'] ?? 'Class',
                          ),
                        ),
                      );
                    },
                    child: _buildStatCard(
                      icon: Icons.check_circle,
                      label: 'Present Today',
                      value: presentToday.toString(),
                      color: const Color(0xFF10b981),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: InkWell(
                    onTap: () {
                      final rawId = classItem['classId'];
                      final int classId = rawId is int
                          ? rawId
                          : (rawId != null
                              ? int.tryParse(rawId.toString()) ?? 0
                              : 0);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => AttendanceDetailsScreen(
                            classId: classId,
                            className: classItem['className'] ?? 'Class',
                          ),
                        ),
                      );
                    },
                    child: _buildStatCard(
                      icon: Icons.cancel,
                      label: 'Absent Today',
                      value: absentToday.toString(),
                      color: const Color(0xFFef4444),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      final classId = classItem['classId'];
                      context.push('/classes/$classId/learner-evidence');
                    },
                    icon: const Icon(Icons.assignment, color: Colors.white),
                    label: const Text('POE Evidence →'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10b981),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3), width: 1),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 32),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: Colors.white70,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
