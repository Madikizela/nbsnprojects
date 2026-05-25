import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../services/auth_service.dart';

class LogisticsDashboardScreen extends StatelessWidget {
  const LogisticsDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = context.watch<AuthService>();
    final userName = authService.user?['name'] ?? 'Logistics Manager';

    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        title: const Text('Logistics Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await authService.logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Welcome back, $userName',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 24),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              children: [
                _buildDashboardCard(
                  context,
                  title: 'Inventory',
                  icon: Icons.inventory,
                  color: Colors.blue,
                  onTap: () => context.push('/projects'), // Temporary routing
                ),
                _buildDashboardCard(
                  context,
                  title: 'Supply Chain',
                  icon: Icons.local_shipping,
                  color: Colors.cyan,
                  onTap: () => context.push('/projects'),
                ),
                _buildDashboardCard(
                  context,
                  title: 'Procurement',
                  icon: Icons.shopping_cart,
                  color: Colors.green,
                  onTap: () => context.push('/projects'),
                ),
                _buildDashboardCard(
                  context,
                  title: 'Warehouse',
                  icon: Icons.store,
                  color: Colors.orange,
                  onTap: () => context.push('/projects'),
                ),
                _buildDashboardCard(
                  context,
                  title: 'Tracking',
                  icon: Icons.location_on,
                  color: Colors.purple,
                  onTap: () => context.push('/projects'),
                ),
                _buildDashboardCard(
                  context,
                  title: 'Reports',
                  icon: Icons.bar_chart,
                  color: Colors.red,
                  onTap: () => context.push('/projects'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDashboardCard(
    BuildContext context, {
    required String title,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF1e293b),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48, color: color),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
