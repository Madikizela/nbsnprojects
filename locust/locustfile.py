"""
Locust load testing for NBSN Projects API
Run with: locust -f locustfile.py --host=https://your-api-url.com
Web UI available at: http://localhost:8089
"""

from locust import HttpUser, task, between, SequentialTaskSet
import json
import random

class UserBehavior(SequentialTaskSet):
    """Sequential user behavior mimicking real user flow"""
    
    def on_start(self):
        """Login before starting tasks"""
        self.login()
    
    def login(self):
        """Authenticate and store token"""
        response = self.client.post("/api/auth/login", 
            json={
                "username": "test@example.com",
                "password": "TestPassword123!"
            },
            name="/api/auth/login"
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("token", "")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.token = None
            self.headers = {}
    
    @task(1)
    def view_dashboard(self):
        """View dashboard / home page"""
        if self.token:
            self.client.get("/api/dashboard", 
                headers=self.headers,
                name="/api/dashboard"
            )
    
    @task(3)
    def list_projects(self):
        """List all projects"""
        if self.token:
            self.client.get("/api/projects", 
                headers=self.headers,
                name="/api/projects"
            )
    
    @task(2)
    def view_project_details(self):
        """View specific project details"""
        if self.token:
            project_id = random.randint(1, 100)
            self.client.get(f"/api/projects/{project_id}", 
                headers=self.headers,
                name="/api/projects/[id]"
            )
    
    @task(3)
    def list_learners(self):
        """List learners with pagination"""
        if self.token:
            page = random.randint(1, 10)
            self.client.get(f"/api/learners?page={page}&pageSize=20", 
                headers=self.headers,
                name="/api/learners?page=[x]"
            )
    
    @task(2)
    def view_attendance(self):
        """View attendance records"""
        if self.token:
            self.client.get("/api/attendance/summary", 
                headers=self.headers,
                name="/api/attendance/summary"
            )
    
    @task(1)
    def view_reports(self):
        """View reports"""
        if self.token:
            self.client.get("/api/reports/monthly", 
                headers=self.headers,
                name="/api/reports/monthly"
            )


class QuickUser(HttpUser):
    """Fast user with short wait times"""
    wait_time = between(1, 3)
    tasks = [UserBehavior]
    weight = 3


class NormalUser(HttpUser):
    """Normal user with moderate wait times"""
    wait_time = between(3, 7)
    tasks = [UserBehavior]
    weight = 5


class SlowUser(HttpUser):
    """Slow user with longer wait times"""
    wait_time = between(7, 15)
    tasks = [UserBehavior]
    weight = 2


class AdminUser(HttpUser):
    """Admin user performing administrative tasks"""
    wait_time = between(2, 5)
    weight = 1
    
    def on_start(self):
        """Admin login"""
        response = self.client.post("/api/auth/login", 
            json={
                "username": "admin@example.com",
                "password": "AdminPassword123!"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("token", "")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.token = None
            self.headers = {}
    
    @task(2)
    def manage_users(self):
        """View user management"""
        if self.token:
            self.client.get("/api/users", 
                headers=self.headers,
                name="/api/users (admin)"
            )
    
    @task(1)
    def view_system_logs(self):
        """View system logs"""
        if self.token:
            self.client.get("/api/logs", 
                headers=self.headers,
                name="/api/logs (admin)"
            )
    
    @task(1)
    def generate_reports(self):
        """Generate system reports"""
        if self.token:
            self.client.get("/api/reports/system", 
                headers=self.headers,
                name="/api/reports/system (admin)"
            )


# Event hooks for monitoring
from locust import events

@events.request.add_listener
def on_request(request_type, name, response_time, response_length, exception, **kwargs):
    """Log slow requests"""
    if response_time > 2000:  # Log if > 2 seconds
        print(f"⚠️  Slow request: {name} took {response_time}ms")

@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Called when test starts"""
    print("🚀 Starting load test...")
    print(f"Target: {environment.host}")

@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Called when test stops"""
    print("✅ Load test completed!")
    
    # Print summary statistics
    stats = environment.stats
    print(f"\n📊 Summary:")
    print(f"Total requests: {stats.total.num_requests}")
    print(f"Total failures: {stats.total.num_failures}")
    print(f"Average response time: {stats.total.avg_response_time:.2f}ms")
    print(f"Max response time: {stats.total.max_response_time:.2f}ms")
    print(f"Requests per second: {stats.total.total_rps:.2f}")
