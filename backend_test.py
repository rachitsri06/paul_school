#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for St. Paul's School Management System
Tests all 16 modules and their endpoints
"""

import requests
import sys
import json
from datetime import datetime, timedelta

class SchoolAPITester:
    def __init__(self, base_url="https://school-hub-495.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session = requests.Session()

    def log(self, message, level="INFO"):
        print(f"[{level}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}", "PASS")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}", "FAIL")
                try:
                    error_detail = response.json()
                    self.log(f"   Error: {error_detail}", "ERROR")
                except:
                    self.log(f"   Error: {response.text[:200]}", "ERROR")
                return False, {}

        except Exception as e:
            self.failed_tests.append(f"{name}: Exception - {str(e)}")
            self.log(f"❌ {name} - Exception: {str(e)}", "FAIL")
            return False, {}

    def test_auth(self):
        """Test authentication endpoints"""
        self.log("=== TESTING AUTHENTICATION ===")
        
        # Test login
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@stpauls.edu", "password": "admin123"}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.log(f"✅ Token obtained: {self.token[:20]}...")
            
            # Test get current user
            self.run_test("Get Current User", "GET", "auth/me", 200)
            
            return True
        else:
            self.log("❌ Failed to get auth token - stopping tests", "CRITICAL")
            return False

    def test_dashboard(self):
        """Test dashboard endpoints"""
        self.log("=== TESTING DASHBOARD ===")
        
        success, stats = self.run_test("Dashboard Stats", "GET", "dashboard/stats", 200)
        if success:
            # Verify expected stats structure
            expected_keys = ['total_students', 'total_staff', 'total_fees_collected', 'notices', 'class_attendance']
            for key in expected_keys:
                if key not in stats:
                    self.log(f"❌ Missing key in dashboard stats: {key}", "FAIL")
                else:
                    self.log(f"✅ Dashboard has {key}: {stats.get(key, 'N/A')}")

    def test_students(self):
        """Test student management endpoints"""
        self.log("=== TESTING STUDENTS ===")
        
        # Get all students
        success, students = self.run_test("Get All Students", "GET", "students", 200)
        if success:
            self.log(f"✅ Found {len(students)} students")
            
            # Test search
            self.run_test("Search Students", "GET", "students?search=Aarav", 200)
            self.run_test("Filter by Class", "GET", "students?class_name=10", 200)
            
            # Test individual student if we have students
            if students:
                student_id = students[0]['_id']
                self.run_test("Get Student Profile", "GET", f"students/{student_id}", 200)
                
                # Test student creation
                new_student = {
                    "name": "Test Student",
                    "roll_no": "999",
                    "class_name": "10",
                    "section": "A",
                    "gender": "Male",
                    "dob": "2010-01-01",
                    "father_name": "Test Father",
                    "mother_name": "Test Mother",
                    "phone": "9999999999",
                    "address": "Test Address"
                }
                success, created = self.run_test("Create Student", "POST", "students", 200, data=new_student)
                if success and '_id' in created:
                    # Test update
                    self.run_test("Update Student", "PUT", f"students/{created['_id']}", 200, 
                                data={"name": "Updated Test Student"})
                    # Test delete
                    self.run_test("Delete Student", "DELETE", f"students/{created['_id']}", 200)

    def test_attendance(self):
        """Test attendance endpoints"""
        self.log("=== TESTING ATTENDANCE ===")
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Get attendance
        self.run_test("Get Attendance", "GET", f"attendance?date={today}", 200)
        self.run_test("Get Class Attendance", "GET", f"attendance?class_name=10&section=A", 200)
        
        # Test bulk attendance
        bulk_data = {
            "date": today,
            "class_name": "10",
            "section": "A",
            "records": [
                {"student_id": "test123", "student_name": "Test Student", "roll_no": "001", "status": "Present"}
            ]
        }
        self.run_test("Bulk Attendance", "POST", "attendance/bulk", 200, data=bulk_data)

    def test_timetable(self):
        """Test timetable endpoints"""
        self.log("=== TESTING TIMETABLE ===")
        
        self.run_test("Get Timetable", "GET", "timetable", 200)
        self.run_test("Get Class Timetable", "GET", "timetable?class_name=10&section=A", 200)
        self.run_test("Get Exam Schedule", "GET", "timetable/exams", 200)

    def test_grades(self):
        """Test grades endpoints"""
        self.log("=== TESTING GRADES ===")
        
        self.run_test("Get Grades", "GET", "grades", 200)
        self.run_test("Get Class Grades", "GET", "grades?class_name=10&exam=Mid-Term", 200)
        
        # Test save grades
        grade_data = {
            "records": [
                {
                    "student_id": "test123",
                    "student_name": "Test Student",
                    "class_name": "10",
                    "section": "A",
                    "exam": "Test Exam",
                    "subject": "Mathematics",
                    "marks_obtained": 85,
                    "max_marks": 100,
                    "grade": "A"
                }
            ]
        }
        self.run_test("Save Grades", "POST", "grades/save", 200, data=grade_data)

    def test_homework(self):
        """Test homework endpoints"""
        self.log("=== TESTING HOMEWORK ===")
        
        success, homework = self.run_test("Get Homework", "GET", "homework", 200)
        
        # Create homework
        hw_data = {
            "title": "Test Assignment",
            "subject": "Mathematics",
            "class_name": "10",
            "section": "A",
            "due_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
            "description": "Test homework description",
            "assigned_by": "Test Teacher"
        }
        success, created = self.run_test("Create Homework", "POST", "homework", 200, data=hw_data)
        
        if success and '_id' in created:
            hw_id = created['_id']
            self.run_test("Update Homework", "PUT", f"homework/{hw_id}", 200, 
                        data={"status": "Completed"})
            self.run_test("Delete Homework", "DELETE", f"homework/{hw_id}", 200)

    def test_fees(self):
        """Test fee management endpoints"""
        self.log("=== TESTING FEE MANAGEMENT ===")
        
        self.run_test("Get Fee Payments", "GET", "fees/payments", 200)
        self.run_test("Get Fee Structure", "GET", "fees/structure", 200)
        
        # Test fee collection
        fee_data = {
            "student_id": "test123",
            "student_name": "Test Student",
            "class_name": "10",
            "amount": 3500,
            "payment_mode": "Cash",
            "fee_type": "Monthly",
            "month": "June 2025"
        }
        self.run_test("Collect Fee", "POST", "fees/collect", 200, data=fee_data)

    def test_staff(self):
        """Test staff management endpoints"""
        self.log("=== TESTING STAFF MANAGEMENT ===")
        
        success, staff = self.run_test("Get Staff", "GET", "staff", 200)
        if success:
            self.log(f"✅ Found {len(staff)} staff members")
        
        self.run_test("Search Staff", "GET", "staff?search=Thomas", 200)
        
        # Create staff
        staff_data = {
            "name": "Test Teacher",
            "emp_id": "EMP999",
            "designation": "Teacher",
            "department": "Mathematics",
            "phone": "9999999999",
            "email": "test@stpauls.edu",
            "joining_date": "2025-01-01",
            "salary": 45000,
            "qualification": "M.Sc",
            "gender": "Male"
        }
        success, created = self.run_test("Create Staff", "POST", "staff", 200, data=staff_data)
        
        if success and '_id' in created:
            staff_id = created['_id']
            self.run_test("Update Staff", "PUT", f"staff/{staff_id}", 200, 
                        data={"salary": 50000})
            self.run_test("Delete Staff", "DELETE", f"staff/{staff_id}", 200)

    def test_payroll(self):
        """Test payroll endpoints"""
        self.log("=== TESTING PAYROLL ===")
        
        self.run_test("Get Payroll", "GET", "payroll", 200)
        
        # Process payroll
        payroll_data = {
            "month": "2025-06",
            "attendance": {}
        }
        self.run_test("Process Payroll", "POST", "payroll/process", 200, data=payroll_data)

    def test_communication(self):
        """Test communication endpoints"""
        self.log("=== TESTING COMMUNICATION ===")
        
        self.run_test("Get Communications", "GET", "communications", 200)
        self.run_test("Get Notices", "GET", "communications?type=notice", 200)
        
        # Create communication
        comm_data = {
            "type": "notice",
            "title": "Test Notice",
            "message": "This is a test notice",
            "recipients": "All Students",
            "sender": "Test Admin"
        }
        self.run_test("Create Communication", "POST", "communications", 200, data=comm_data)

    def test_transport(self):
        """Test transport endpoints"""
        self.log("=== TESTING TRANSPORT ===")
        
        success, routes = self.run_test("Get Transport Routes", "GET", "transport/routes", 200)
        if success:
            self.log(f"✅ Found {len(routes)} transport routes")
        
        self.run_test("Get Transport Students", "GET", "transport/students", 200)
        self.run_test("Get Route Students", "GET", "transport/students?route=Route 1", 200)

    def test_library(self):
        """Test library endpoints"""
        self.log("=== TESTING LIBRARY ===")
        
        success, books = self.run_test("Get Library Books", "GET", "library/books", 200)
        if success:
            self.log(f"✅ Found {len(books)} library books")
        
        self.run_test("Search Books", "GET", "library/books?search=NCERT", 200)
        self.run_test("Get Issued Books", "GET", "library/issued", 200)
        
        # Add book
        book_data = {
            "title": "Test Book",
            "author": "Test Author",
            "isbn": "978-0000000000",
            "category": "Test",
            "total_copies": 5,
            "available_copies": 5
        }
        success, created = self.run_test("Add Book", "POST", "library/books", 200, data=book_data)
        
        if success and '_id' in created:
            book_id = created['_id']
            # Issue book
            issue_data = {
                "book_id": book_id,
                "student_id": "test123",
                "student_name": "Test Student",
                "issue_date": datetime.now().strftime("%Y-%m-%d"),
                "due_date": (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
            }
            success, issued = self.run_test("Issue Book", "POST", "library/issue", 200, data=issue_data)
            
            if success and '_id' in issued:
                issue_id = issued['_id']
                self.run_test("Return Book", "POST", f"library/return/{issue_id}", 200)

    def test_reports(self):
        """Test reports endpoints"""
        self.log("=== TESTING REPORTS ===")
        
        report_types = [
            "attendance_summary", "fee_collection", "student_strength", 
            "exam_results", "staff_attendance", "library_report",
            "transport_report", "fee_defaulters", "homework_report",
            "payroll_report", "class_performance", "daily_attendance"
        ]
        
        for report_type in report_types:
            self.run_test(f"Get {report_type.title()} Report", "GET", f"reports/{report_type}", 200)

    def test_ai_reports(self):
        """Test AI report generation"""
        self.log("=== TESTING AI REPORTS ===")
        
        ai_data = {
            "report_type": "school_overview",
            "context": "Generate a comprehensive school overview report"
        }
        self.run_test("Generate AI Report", "POST", "ai/generate-report", 200, data=ai_data)

    def test_settings(self):
        """Test settings endpoints"""
        self.log("=== TESTING SETTINGS ===")
        
        success, settings = self.run_test("Get Settings", "GET", "settings", 200)
        
        if success:
            # Update settings
            update_data = {
                "school_name": "St. Paul's School (Updated)",
                "notification_email": True
            }
            self.run_test("Update Settings", "PUT", "settings", 200, data=update_data)

    def run_all_tests(self):
        """Run all API tests"""
        self.log("🚀 Starting comprehensive API testing for St. Paul's School Management System")
        self.log(f"Base URL: {self.base_url}")
        
        # Test authentication first
        if not self.test_auth():
            return False
        
        # Test all modules
        test_modules = [
            self.test_dashboard,
            self.test_students,
            self.test_attendance,
            self.test_timetable,
            self.test_grades,
            self.test_homework,
            self.test_fees,
            self.test_staff,
            self.test_payroll,
            self.test_communication,
            self.test_transport,
            self.test_library,
            self.test_reports,
            self.test_ai_reports,
            self.test_settings
        ]
        
        for test_func in test_modules:
            try:
                test_func()
            except Exception as e:
                self.log(f"❌ Error in {test_func.__name__}: {str(e)}", "ERROR")
        
        # Print summary
        self.print_summary()
        return self.tests_passed == self.tests_run

    def print_summary(self):
        """Print test summary"""
        self.log("=" * 60)
        self.log("📊 TEST SUMMARY")
        self.log("=" * 60)
        self.log(f"Total Tests: {self.tests_run}")
        self.log(f"Passed: {self.tests_passed}")
        self.log(f"Failed: {len(self.failed_tests)}")
        self.log(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.failed_tests:
            self.log("\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                self.log(f"  - {failure}")
        
        self.log("=" * 60)

def main():
    tester = SchoolAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())