import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';

class ClassesScreen extends StatefulWidget {
  final int siteId;

  const ClassesScreen({super.key, required this.siteId});

  @override
  State<ClassesScreen> createState() => _ClassesScreenState();
}

class _ClassesScreenState extends State<ClassesScreen> {
  List<dynamic> classes = [];
  bool isLoading = true;
  String siteName = '';

  @override
  void initState() {
    super.initState();
    fetchClasses();
  }

  Future<void> fetchClasses() async {
    try {
      final apiService = context.read<ApiService>();
      final response =
          await apiService.get('/api/SiteClasses/site/${widget.siteId}');

      setState(() {
        classes = response.data ?? [];
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ApiService.getErrorMessage(e))),
        );
      }
    }
  }

  Future<void> _showAddTeacherDialog(dynamic classItem) async {
    try {
      final apiService = context.read<ApiService>();

      // First, check if class already has teachers
      final response = await apiService
          .get('/api/Attendance/class/${classItem['id']}/teachers');
      final teachers = response.data as List<dynamic>;

      if (!mounted) return;

      // If class has teachers, show their information
      if (teachers.isNotEmpty) {
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              backgroundColor: const Color(0xFF1E293B),
              title: Text(
                'Teachers for ${classItem['className']}',
                style: const TextStyle(color: Colors.white, fontSize: 18),
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Assigned Teachers:',
                      style: TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                          fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 16),
                    ...teachers.map((teacher) => Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFF334155),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                                color: const Color(0xFF8B5CF6), width: 1),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.person,
                                      color: Color(0xFF8B5CF6), size: 20),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      teacher['teacherName'] ?? 'Unknown',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  const Icon(Icons.email,
                                      color: Colors.white54, size: 16),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      teacher['teacherEmail'] ?? 'No email',
                                      style: const TextStyle(
                                          color: Colors.white70, fontSize: 14),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  const Icon(Icons.calendar_today,
                                      color: Colors.white54, size: 16),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Assigned: ${teacher['assignedDate'] != null ? DateTime.parse(teacher['assignedDate']).toLocal().toString().split(' ')[0] : 'N/A'}',
                                    style: const TextStyle(
                                        color: Colors.white70, fontSize: 12),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.red,
                                  minimumSize: const Size(double.infinity, 36),
                                ),
                                icon: const Icon(Icons.delete, size: 18),
                                label: const Text('Remove Teacher'),
                                onPressed: () async {
                                  Navigator.pop(context);
                                  await _removeTeacher(
                                      teacher['id'], teacher['teacherName']);
                                },
                              ),
                            ],
                          ),
                        )),
                    const SizedBox(height: 16),
                    const Divider(color: Colors.white24),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF8B5CF6),
                        minimumSize: const Size(double.infinity, 44),
                      ),
                      icon: const Icon(Icons.person_add),
                      label: const Text('Add Another Teacher'),
                      onPressed: () {
                        Navigator.pop(context);
                        _showCreateTeacherForm(classItem);
                      },
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Close',
                      style: TextStyle(color: Colors.white70)),
                ),
              ],
            );
          },
        );
      } else {
        // No teachers assigned, show create form
        _showCreateTeacherForm(classItem);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load teacher information: $e')),
        );
      }
    }
  }

  Future<void> _removeTeacher(int assignmentId, String teacherName) async {
    try {
      final apiService = context.read<ApiService>();

      await apiService.delete('/api/Attendance/class-teacher/$assignmentId');

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$teacherName removed successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to remove teacher: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showCreateTeacherForm(dynamic classItem) {
    final TextEditingController firstNameController = TextEditingController();
    final TextEditingController lastNameController = TextEditingController();
    final TextEditingController emailController = TextEditingController();

    String? firstNameError;
    String? lastNameError;
    String? emailError;

    showDialog(
      context: context,
      builder: (BuildContext dialogContext) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              backgroundColor: const Color(0xFF1E293B),
              title: Text(
                'Add Teacher to ${classItem['className']}',
                style: const TextStyle(color: Colors.white, fontSize: 18),
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Enter teacher details:',
                      style: TextStyle(color: Colors.white70, fontSize: 14),
                    ),
                    const SizedBox(height: 16),

                    // First Name
                    TextField(
                      controller: firstNameController,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        labelText: 'First Name *',
                        labelStyle: const TextStyle(color: Colors.white70),
                        hintText: 'Enter first name',
                        hintStyle: const TextStyle(color: Colors.white38),
                        errorText: firstNameError,
                        enabledBorder: const OutlineInputBorder(
                          borderSide: BorderSide(color: Color(0xFF334155)),
                        ),
                        focusedBorder: const OutlineInputBorder(
                          borderSide: BorderSide(color: Color(0xFF8B5CF6)),
                        ),
                        errorBorder: const OutlineInputBorder(
                          borderSide: BorderSide(color: Colors.red),
                        ),
                        focusedErrorBorder: const OutlineInputBorder(
                          borderSide: BorderSide(color: Colors.red),
                        ),
                      ),
                      onChanged: (value) {
                        setState(() {
                          if (value.isEmpty) {
                            firstNameError = 'First name is required';
                          } else if (!RegExp(r'^[a-zA-Z\s]+$')
                              .hasMatch(value)) {
                            firstNameError = 'Only letters and spaces allowed';
                          } else {
                            firstNameError = null;
                          }
                        });
                      },
                    ),
                    const SizedBox(height: 16),

                    // Last Name
                    TextField(
                      controller: lastNameController,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        labelText: 'Last Name *',
                        labelStyle: const TextStyle(color: Colors.white70),
                        hintText: 'Enter last name',
                        hintStyle: const TextStyle(color: Colors.white38),
                        errorText: lastNameError,
                        enabledBorder: const OutlineInputBorder(
                          borderSide: BorderSide(color: Color(0xFF334155)),
                        ),
                        focusedBorder: const OutlineInputBorder(
                          borderSide: BorderSide(color: Color(0xFF8B5CF6)),
                        ),
                        errorBorder: const OutlineInputBorder(
                          borderSide: BorderSide(color: Colors.red),
                        ),
                        focusedErrorBorder: const OutlineInputBorder(
                          borderSide: BorderSide(color: Colors.red),
                        ),
                      ),
                      onChanged: (value) {
                        setState(() {
                          if (value.isEmpty) {
                            lastNameError = 'Last name is required';
                          } else if (!RegExp(r'^[a-zA-Z\s]+$')
                              .hasMatch(value)) {
                            lastNameError = 'Only letters and spaces allowed';
                          } else {
                            lastNameError = null;
                          }
                        });
                      },
                    ),
                    const SizedBox(height: 16),

                    // Email
                    TextField(
                      controller: emailController,
                      style: const TextStyle(color: Colors.white),
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        labelText: 'Email *',
                        labelStyle: const TextStyle(color: Colors.white70),
                        hintText: 'teacher@example.com',
                        hintStyle: const TextStyle(color: Colors.white38),
                        errorText: emailError,
                        enabledBorder: const OutlineInputBorder(
                          borderSide: BorderSide(color: Color(0xFF334155)),
                        ),
                        focusedBorder: const OutlineInputBorder(
                          borderSide: BorderSide(color: Color(0xFF8B5CF6)),
                        ),
                        errorBorder: const OutlineInputBorder(
                          borderSide: BorderSide(color: Colors.red),
                        ),
                        focusedErrorBorder: const OutlineInputBorder(
                          borderSide: BorderSide(color: Colors.red),
                        ),
                      ),
                      onChanged: (value) {
                        setState(() {
                          if (value.isEmpty) {
                            emailError = 'Email is required';
                          } else if (!RegExp(
                                  r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
                              .hasMatch(value)) {
                            emailError = 'Enter a valid email address';
                          } else {
                            emailError = null;
                          }
                        });
                      },
                    ),
                    const SizedBox(height: 16),

                    const Text(
                      'A system-generated password will be sent to the teacher\'s email.',
                      style: TextStyle(
                          color: Colors.white54,
                          fontSize: 12,
                          fontStyle: FontStyle.italic),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext),
                  child: const Text('Cancel',
                      style: TextStyle(color: Colors.white70)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF8B5CF6),
                  ),
                  onPressed: () async {
                    // Validate all fields
                    final firstName = firstNameController.text.trim();
                    final lastName = lastNameController.text.trim();
                    final email = emailController.text.trim();

                    bool hasErrors = false;

                    setState(() {
                      if (firstName.isEmpty) {
                        firstNameError = 'First name is required';
                        hasErrors = true;
                      } else if (!RegExp(r'^[a-zA-Z\s]+$')
                          .hasMatch(firstName)) {
                        firstNameError = 'Only letters and spaces allowed';
                        hasErrors = true;
                      }

                      if (lastName.isEmpty) {
                        lastNameError = 'Last name is required';
                        hasErrors = true;
                      } else if (!RegExp(r'^[a-zA-Z\s]+$').hasMatch(lastName)) {
                        lastNameError = 'Only letters and spaces allowed';
                        hasErrors = true;
                      }

                      if (email.isEmpty) {
                        emailError = 'Email is required';
                        hasErrors = true;
                      } else if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
                          .hasMatch(email)) {
                        emailError = 'Enter a valid email address';
                        hasErrors = true;
                      }
                    });

                    if (!hasErrors) {
                      Navigator.pop(dialogContext);
                      await _createAndAssignTeacher(
                        classItem['id'],
                        firstName,
                        lastName,
                        email,
                        classItem['className'],
                      );
                    }
                  },
                  child: const Text('Add Teacher',
                      style: TextStyle(color: Colors.white)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _createAndAssignTeacher(
    int classId,
    String firstName,
    String lastName,
    String email,
    String className,
  ) async {
    try {
      // Show loading
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Creating teacher account...'),
            duration: Duration(seconds: 2),
          ),
        );
      }

      final apiService = context.read<ApiService>();

      final response = await apiService
          .post('/api/Attendance/create-and-assign-teacher', data: {
        'classId': classId,
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                'Teacher $firstName $lastName added successfully!\nLogin credentials sent to $email'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to add teacher: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop(),
          ),
          title: const Text('Classes'),
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Classes', style: TextStyle(fontSize: 20)),
            Text('${classes.length} Classes',
                style: const TextStyle(fontSize: 14, color: Colors.white70)),
          ],
        ),
      ),
      body: classes.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('🎓', style: TextStyle(fontSize: 64)),
                  SizedBox(height: 16),
                  Text('No Classes Found',
                      style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white)),
                  SizedBox(height: 8),
                  Text('Classes will appear here once they are created',
                      style: TextStyle(fontSize: 14, color: Colors.white70),
                      textAlign: TextAlign.center),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: fetchClasses,
              child: ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: classes.length,
                itemBuilder: (context, index) {
                  final classItem = classes[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: Color(0xFF334155)),
                    ),
                    child: InkWell(
                      onTap: () =>
                          context.push('/classes/${classItem['id']}/learners'),
                      borderRadius: BorderRadius.circular(12),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    classItem['className'] ?? 'Unknown Class',
                                    style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0x2010b981),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    classItem['status'] ?? 'Active',
                                    style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF10b981)),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Current Learners:',
                                    style: TextStyle(
                                        fontSize: 14, color: Colors.white70)),
                                Text('${classItem['currentLearners'] ?? 0}',
                                    style: const TextStyle(
                                        fontSize: 14,
                                        color: Color(0xFF10b981),
                                        fontWeight: FontWeight.bold)),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Max Learners:',
                                    style: TextStyle(
                                        fontSize: 14, color: Colors.white70)),
                                Text('${classItem['maxLearners'] ?? 0}',
                                    style: const TextStyle(
                                        fontSize: 14,
                                        color: Colors.white,
                                        fontWeight: FontWeight.w500)),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Created:',
                                    style: TextStyle(
                                        fontSize: 14, color: Colors.white70)),
                                Text(
                                  classItem['createdAt'] != null
                                      ? DateTime.parse(classItem['createdAt'])
                                          .toLocal()
                                          .toString()
                                          .split(' ')[0]
                                      : 'N/A',
                                  style: const TextStyle(
                                      fontSize: 14,
                                      color: Colors.white,
                                      fontWeight: FontWeight.w500),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 12),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF0EA5E9),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: InkWell(
                                      onTap: () => context.push(
                                          '/classes/${classItem['id']}/learners'),
                                      child: const Center(
                                        child: Text('View Learners →',
                                            style: TextStyle(
                                                color: Colors.white,
                                                fontSize: 14,
                                                fontWeight: FontWeight.w600)),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF8B5CF6),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: IconButton(
                                    icon: const Icon(Icons.person_add,
                                        color: Colors.white),
                                    onPressed: () =>
                                        _showAddTeacherDialog(classItem),
                                    tooltip: 'Add Teacher',
                                  ),
                                ),
                              ],
                            ),
                          ],
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
