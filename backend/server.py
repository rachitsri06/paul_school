from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import bcrypt
import jwt
import secrets
import uuid
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ── Helpers ──
def get_jwt_secret():
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    return jwt.encode({"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=120), "type": "access"}, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    return jwt.encode({"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def clean_mongo_doc(doc):
    """Recursively convert all ObjectId instances to strings in a document."""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [clean_mongo_doc(item) for item in doc]
    if isinstance(doc, dict):
        cleaned = {}
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                cleaned[key] = str(value)
            elif isinstance(value, dict):
                cleaned[key] = clean_mongo_doc(value)
            elif isinstance(value, list):
                cleaned[key] = clean_mongo_doc(value)
            else:
                cleaned[key] = value
        return cleaned
    if isinstance(doc, ObjectId):
        return str(doc)
    return doc

def serialize_doc(doc):
    return clean_mongo_doc(doc)

def serialize_docs(docs):
    return [clean_mongo_doc(d) for d in docs]

# ── Pydantic Models ──
class AuthLogin(BaseModel):
    email: str
    password: str

class AuthRegister(BaseModel):
    email: str
    password: str
    name: str
    role: str = "teacher"

class StudentCreate(BaseModel):
    name: str
    roll_no: str
    class_name: str
    section: str
    gender: str
    dob: str
    father_name: str
    mother_name: str
    phone: str
    address: str
    admission_date: str = ""
    blood_group: str = ""
    transport_route: str = ""
    photo_url: str = ""

class AttendanceRecord(BaseModel):
    student_id: str
    status: str  # Present/Absent/Late/Leave
    date: str
    class_name: str
    section: str

class AttendanceBulk(BaseModel):
    date: str
    class_name: str
    section: str
    records: list

class HomeworkCreate(BaseModel):
    title: str
    subject: str
    class_name: str
    section: str
    due_date: str
    description: str
    assigned_by: str = ""

class FeeCollect(BaseModel):
    student_id: str
    student_name: str
    class_name: str
    amount: float
    payment_mode: str
    fee_type: str
    month: str

class StaffCreate(BaseModel):
    name: str
    emp_id: str
    designation: str
    department: str
    phone: str
    email: str
    joining_date: str
    salary: float
    qualification: str
    gender: str
    address: str = ""
    photo_url: str = ""

class CommunicationCreate(BaseModel):
    type: str  # inbox/notice/sms/whatsapp
    title: str
    message: str
    recipients: str
    sender: str = ""

class BookCreate(BaseModel):
    title: str
    author: str
    isbn: str
    category: str
    total_copies: int
    available_copies: int

class BookIssue(BaseModel):
    book_id: str
    student_id: str
    student_name: str
    issue_date: str
    due_date: str

class AIReportRequest(BaseModel):
    report_type: str
    context: str = ""

# ── AUTH ROUTES ──
@api_router.post("/auth/login")
async def login(data: AuthLogin, response: Response):
    email = data.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    uid = str(user["_id"])
    access = create_access_token(uid, email)
    refresh = create_refresh_token(uid)
    response.set_cookie(key="access_token", value=access, httponly=True, secure=False, samesite="lax", max_age=7200, path="/")
    response.set_cookie(key="refresh_token", value=refresh, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": uid, "email": user["email"], "name": user.get("name", ""), "role": user.get("role", ""), "token": access}

@api_router.post("/auth/register")
async def register(data: AuthRegister, response: Response):
    email = data.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already exists")
    hashed = hash_password(data.password)
    doc = {"email": email, "password_hash": hashed, "name": data.name, "role": data.role, "created_at": datetime.now(timezone.utc).isoformat()}
    result = await db.users.insert_one(doc)
    uid = str(result.inserted_id)
    access = create_access_token(uid, email)
    refresh = create_refresh_token(uid)
    response.set_cookie(key="access_token", value=access, httponly=True, secure=False, samesite="lax", max_age=7200, path="/")
    response.set_cookie(key="refresh_token", value=refresh, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": uid, "email": email, "name": data.name, "role": data.role, "token": access}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

# ── DASHBOARD ──
@api_router.get("/dashboard/stats")
async def dashboard_stats():
    total_students = await db.students.count_documents({})
    total_staff = await db.staff.count_documents({})
    total_fees_collected = 0
    fees = await db.fee_payments.find({}, {"_id": 0, "amount": 1}).to_list(10000)
    for f in fees:
        total_fees_collected += f.get("amount", 0)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    present_today = await db.attendance.count_documents({"date": today, "status": "Present"})
    total_today = await db.attendance.count_documents({"date": today})
    notices = await db.communications.find({"type": "notice"}, {"_id": 0}).sort("created_at", -1).to_list(5)
    # Class-wise attendance
    classes = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
    class_attendance = []
    for c in classes:
        total_c = await db.students.count_documents({"class_name": c})
        present_c = await db.attendance.count_documents({"date": today, "class_name": c, "status": "Present"})
        class_attendance.append({"class_name": c, "total": total_c, "present": present_c})
    return {
        "total_students": total_students,
        "total_staff": total_staff,
        "total_fees_collected": total_fees_collected,
        "present_today": present_today,
        "total_today_records": total_today,
        "attendance_rate": round((present_today / total_today * 100) if total_today > 0 else 0, 1),
        "notices": notices,
        "class_attendance": class_attendance
    }

# ── STUDENTS ──
@api_router.get("/students")
async def get_students(search: str = "", class_name: str = "", section: str = ""):
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"roll_no": {"$regex": search, "$options": "i"}}
        ]
    if class_name:
        query["class_name"] = class_name
    if section:
        query["section"] = section
    students = await db.students.find(query).to_list(1000)
    return serialize_docs(students)

@api_router.get("/students/{student_id}")
async def get_student(student_id: str):
    student = await db.students.find_one({"_id": ObjectId(student_id)})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    # Get attendance history
    attendance = await db.attendance.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    # Get fee history
    fee_history = await db.fee_payments.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    # Get grades
    grades = await db.grades.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    result = serialize_doc(student)
    result["attendance_history"] = attendance
    result["fee_history"] = fee_history
    result["grades"] = grades
    return result

@api_router.post("/students")
async def create_student(data: StudentCreate, admin: dict = Depends(require_admin)):
    doc = data.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["id"] = str(uuid.uuid4())
    result = await db.students.insert_one(doc)
    return clean_mongo_doc(doc)

@api_router.put("/students/{student_id}")
async def update_student(student_id: str, data: dict):
    data.pop("_id", None)
    await db.students.update_one({"_id": ObjectId(student_id)}, {"$set": data})
    updated = await db.students.find_one({"_id": ObjectId(student_id)})
    return serialize_doc(updated)

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, admin: dict = Depends(require_admin)):
    await db.students.delete_one({"_id": ObjectId(student_id)})
    return {"message": "Student deleted"}

# ── ATTENDANCE ──
@api_router.get("/attendance")
async def get_attendance(date: str = "", class_name: str = "", section: str = ""):
    query = {}
    if date:
        query["date"] = date
    if class_name:
        query["class_name"] = class_name
    if section:
        query["section"] = section
    records = await db.attendance.find(query, {"_id": 0}).to_list(10000)
    return records

@api_router.post("/attendance/bulk")
async def bulk_attendance(data: AttendanceBulk):
    # Delete existing records for this date/class/section
    await db.attendance.delete_many({"date": data.date, "class_name": data.class_name, "section": data.section})
    docs = []
    for r in data.records:
        docs.append({
            "student_id": r["student_id"],
            "student_name": r.get("student_name", ""),
            "roll_no": r.get("roll_no", ""),
            "status": r["status"],
            "date": data.date,
            "class_name": data.class_name,
            "section": data.section,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    if docs:
        await db.attendance.insert_many(docs)
    # Return counters
    present = sum(1 for d in docs if d["status"] == "Present")
    absent = sum(1 for d in docs if d["status"] == "Absent")
    late = sum(1 for d in docs if d["status"] == "Late")
    leave = sum(1 for d in docs if d["status"] == "Leave")
    return {"message": "Attendance saved", "present": present, "absent": absent, "late": late, "leave": leave, "total": len(docs)}

# ── TIMETABLE ──
@api_router.get("/timetable")
async def get_timetable(class_name: str = "", section: str = ""):
    query = {}
    if class_name:
        query["class_name"] = class_name
    if section:
        query["section"] = section
    timetable = await db.timetable.find(query, {"_id": 0}).to_list(100)
    return timetable

@api_router.get("/timetable/exams")
async def get_exam_schedule():
    exams = await db.exam_schedule.find({}, {"_id": 0}).to_list(100)
    return exams

# ── GRADES ──
@api_router.get("/grades")
async def get_grades(class_name: str = "", section: str = "", exam: str = ""):
    query = {}
    if class_name:
        query["class_name"] = class_name
    if section:
        query["section"] = section
    if exam:
        query["exam"] = exam
    grades = await db.grades.find(query, {"_id": 0}).to_list(10000)
    return grades

@api_router.post("/grades/save")
async def save_grades(data: dict):
    records = data.get("records", [])
    for r in records:
        r.pop("_id", None)
        await db.grades.update_one(
            {"student_id": r["student_id"], "exam": r["exam"], "subject": r["subject"]},
            {"$set": r},
            upsert=True
        )
    return {"message": "Grades saved", "count": len(records)}

# ── HOMEWORK ──
@api_router.get("/homework")
async def get_homework(class_name: str = "", section: str = "", status: str = ""):
    query = {}
    if class_name:
        query["class_name"] = class_name
    if section:
        query["section"] = section
    if status:
        query["status"] = status
    homework = await db.homework.find(query).to_list(1000)
    return serialize_docs(homework)

@api_router.post("/homework")
async def create_homework(data: HomeworkCreate):
    doc = data.model_dump()
    doc["status"] = "Active"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["submissions"] = 0
    result = await db.homework.insert_one(doc)
    return clean_mongo_doc(doc)

@api_router.put("/homework/{hw_id}")
async def update_homework(hw_id: str, data: dict):
    data.pop("_id", None)
    await db.homework.update_one({"_id": ObjectId(hw_id)}, {"$set": data})
    updated = await db.homework.find_one({"_id": ObjectId(hw_id)})
    return serialize_doc(updated)

@api_router.delete("/homework/{hw_id}")
async def delete_homework(hw_id: str):
    await db.homework.delete_one({"_id": ObjectId(hw_id)})
    return {"message": "Homework deleted"}

# ── FEE MANAGEMENT ──
@api_router.get("/fees/payments")
async def get_fee_payments(class_name: str = "", status: str = ""):
    query = {}
    if class_name:
        query["class_name"] = class_name
    if status:
        query["status"] = status
    payments = await db.fee_payments.find(query).to_list(10000)
    return serialize_docs(payments)

@api_router.post("/fees/collect")
async def collect_fee(data: FeeCollect, admin: dict = Depends(require_admin)):
    doc = data.model_dump()
    doc["status"] = "Paid"
    doc["receipt_no"] = f"RCP-{uuid.uuid4().hex[:8].upper()}"
    doc["collected_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.fee_payments.insert_one(doc)
    return clean_mongo_doc(doc)

@api_router.get("/fees/structure")
async def get_fee_structure():
    structure = await db.fee_structure.find({}, {"_id": 0}).to_list(100)
    return structure

@api_router.get("/fees/student/{student_id}")
async def get_student_fees(student_id: str):
    payments = await db.fee_payments.find({"student_id": student_id}, {"_id": 0}).to_list(100)
    return payments

# ── STAFF ──
@api_router.get("/staff")
async def get_staff(search: str = "", department: str = ""):
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"emp_id": {"$regex": search, "$options": "i"}}
        ]
    if department:
        query["department"] = department
    staff = await db.staff.find(query).to_list(1000)
    return serialize_docs(staff)

@api_router.post("/staff")
async def create_staff(data: StaffCreate, admin: dict = Depends(require_admin)):
    doc = data.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.staff.insert_one(doc)
    return clean_mongo_doc(doc)

@api_router.put("/staff/{staff_id}")
async def update_staff(staff_id: str, data: dict):
    data.pop("_id", None)
    await db.staff.update_one({"_id": ObjectId(staff_id)}, {"$set": data})
    updated = await db.staff.find_one({"_id": ObjectId(staff_id)})
    return serialize_doc(updated)

@api_router.delete("/staff/{staff_id}")
async def delete_staff(staff_id: str, admin: dict = Depends(require_admin)):
    await db.staff.delete_one({"_id": ObjectId(staff_id)})
    return {"message": "Staff deleted"}

# ── PAYROLL ──
@api_router.get("/payroll")
async def get_payroll(month: str = ""):
    query = {}
    if month:
        query["month"] = month
    payroll = await db.payroll.find(query).to_list(1000)
    return serialize_docs(payroll)

@api_router.post("/payroll/process")
async def process_payroll(data: dict, admin: dict = Depends(require_admin)):
    month = data.get("month", datetime.now(timezone.utc).strftime("%Y-%m"))
    staff_list = await db.staff.find({}).to_list(1000)
    processed = []
    for s in staff_list:
        sid = str(s["_id"])
        existing = await db.payroll.find_one({"staff_id": sid, "month": month})
        if existing:
            continue
        days_present = data.get("attendance", {}).get(sid, 26)
        salary = s.get("salary", 0)
        net = round(salary * days_present / 30, 2)
        doc = {
            "staff_id": sid,
            "staff_name": s.get("name", ""),
            "emp_id": s.get("emp_id", ""),
            "designation": s.get("designation", ""),
            "month": month,
            "basic_salary": salary,
            "days_present": days_present,
            "deductions": round(salary - net, 2),
            "net_salary": net,
            "status": "Processed",
            "processed_at": datetime.now(timezone.utc).isoformat()
        }
        result = await db.payroll.insert_one(doc)
        processed.append(clean_mongo_doc(doc))
    return {"message": f"Payroll processed for {len(processed)} staff", "records": processed}

# ── COMMUNICATION ──
@api_router.get("/communications")
async def get_communications(type: str = ""):
    query = {}
    if type:
        query["type"] = type
    comms = await db.communications.find(query).sort("created_at", -1).to_list(1000)
    return serialize_docs(comms)

@api_router.post("/communications")
async def create_communication(data: CommunicationCreate):
    doc = data.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["status"] = "Sent"
    result = await db.communications.insert_one(doc)
    return clean_mongo_doc(doc)

# ── TRANSPORT ──
@api_router.get("/transport/routes")
async def get_transport_routes():
    routes = await db.transport_routes.find({}, {"_id": 0}).to_list(100)
    return routes

@api_router.get("/transport/students")
async def get_transport_students(route: str = ""):
    query = {}
    if route:
        query["transport_route"] = route
    students = await db.students.find(query, {"_id": 0, "name": 1, "class_name": 1, "section": 1, "transport_route": 1, "roll_no": 1}).to_list(1000)
    return students

# ── LIBRARY ──
@api_router.get("/library/books")
async def get_books(search: str = "", category: str = ""):
    query = {}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"author": {"$regex": search, "$options": "i"}},
            {"isbn": {"$regex": search, "$options": "i"}}
        ]
    if category:
        query["category"] = category
    books = await db.library_books.find(query).to_list(1000)
    return serialize_docs(books)

@api_router.post("/library/books")
async def add_book(data: BookCreate):
    doc = data.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.library_books.insert_one(doc)
    return clean_mongo_doc(doc)

@api_router.get("/library/issued")
async def get_issued_books():
    issued = await db.library_issued.find({}).to_list(1000)
    return serialize_docs(issued)

@api_router.post("/library/issue")
async def issue_book(data: BookIssue):
    doc = data.model_dump()
    doc["status"] = "Issued"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.library_issued.insert_one(doc)
    await db.library_books.update_one({"_id": ObjectId(data.book_id)}, {"$inc": {"available_copies": -1}})
    return clean_mongo_doc(doc)

@api_router.post("/library/return/{issue_id}")
async def return_book(issue_id: str):
    issue = await db.library_issued.find_one({"_id": ObjectId(issue_id)})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue record not found")
    await db.library_issued.update_one({"_id": ObjectId(issue_id)}, {"$set": {"status": "Returned", "returned_at": datetime.now(timezone.utc).isoformat()}})
    await db.library_books.update_one({"_id": ObjectId(issue["book_id"])}, {"$inc": {"available_copies": 1}})
    return {"message": "Book returned"}

# ── REPORTS ──
@api_router.get("/reports/{report_type}")
async def get_report(report_type: str, class_name: str = "", month: str = ""):
    if report_type == "attendance_summary":
        pipeline = [{"$group": {"_id": {"class_name": "$class_name", "status": "$status"}, "count": {"$sum": 1}}}]
        if class_name:
            pipeline.insert(0, {"$match": {"class_name": class_name}})
        result = await db.attendance.aggregate(pipeline).to_list(1000)
        return clean_mongo_doc(result)
    elif report_type == "fee_collection":
        pipeline = [{"$group": {"_id": "$class_name", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}]
        result = await db.fee_payments.aggregate(pipeline).to_list(100)
        return clean_mongo_doc(result)
    elif report_type == "student_strength":
        pipeline = [{"$group": {"_id": {"class_name": "$class_name", "section": "$section"}, "count": {"$sum": 1}}}]
        result = await db.students.aggregate(pipeline).to_list(100)
        return clean_mongo_doc(result)
    elif report_type == "exam_results":
        grades = await db.grades.find({}, {"_id": 0}).to_list(10000)
        return grades
    elif report_type == "staff_attendance":
        staff = await db.staff.find({}, {"_id": 0, "name": 1, "emp_id": 1, "designation": 1, "department": 1}).to_list(100)
        return staff
    elif report_type == "library_report":
        issued = await db.library_issued.count_documents({"status": "Issued"})
        total = await db.library_books.count_documents({})
        return {"total_books": total, "currently_issued": issued}
    elif report_type == "transport_report":
        routes = await db.transport_routes.find({}, {"_id": 0}).to_list(100)
        return routes
    elif report_type == "fee_defaulters":
        # Students without recent payments
        students = await db.students.find({}, {"_id": 0, "name": 1, "class_name": 1, "section": 1, "roll_no": 1, "phone": 1}).to_list(1000)
        return students
    elif report_type == "homework_report":
        hw = await db.homework.find({}, {"_id": 0}).to_list(1000)
        return hw
    elif report_type == "payroll_report":
        payroll = await db.payroll.find({}, {"_id": 0}).to_list(1000)
        return payroll
    elif report_type == "class_performance":
        grades = await db.grades.find({}, {"_id": 0}).to_list(10000)
        return grades
    elif report_type == "daily_attendance":
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        records = await db.attendance.find({"date": today}, {"_id": 0}).to_list(10000)
        return records
    return []

# ── AI REPORTS ──
@api_router.post("/ai/generate-report")
async def generate_ai_report(data: AIReportRequest):
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        api_key = os.environ.get("EMERGENT_LLM_KEY", "")
        chat = LlmChat(api_key=api_key, session_id=f"report-{uuid.uuid4().hex[:8]}", system_message="You are an expert school administrator AI assistant for St. Paul's School, Maharajganj. Generate professional, detailed reports based on the data provided. Use proper formatting with headings and bullet points.")
        chat.with_model("openai", "gpt-5.2")
        # Gather context
        context = data.context
        if data.report_type == "school_overview":
            total_students = await db.students.count_documents({})
            total_staff = await db.staff.count_documents({})
            context += f"\nTotal students: {total_students}, Total staff: {total_staff}"
        user_msg = UserMessage(text=f"Generate a {data.report_type} report for St. Paul's School. Context: {context}. Make it detailed and professional.")
        response = await chat.send_message(user_msg)
        return {"report": response, "type": data.report_type}
    except Exception as e:
        logger.error(f"AI Report error: {e}")
        return {"report": f"AI report generation is currently unavailable. Error: {str(e)}", "type": data.report_type}

# ── SETTINGS ──
@api_router.get("/settings")
async def get_settings():
    settings = await db.settings.find_one({"type": "school"}, {"_id": 0})
    if not settings:
        settings = {
            "type": "school",
            "school_name": "St. Paul's School",
            "address": "Maharajganj, Uttar Pradesh",
            "phone": "+91 9876543210",
            "email": "info@stpauls.edu",
            "principal": "Fr. Thomas Joseph",
            "academic_year": "2025-2026",
            "classes": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
            "sections": ["A", "B"],
            "motto": "Study - Play - Serve",
            "notification_email": True,
            "notification_sms": True,
            "notification_whatsapp": False
        }
        await db.settings.insert_one(settings)
    return settings

@api_router.put("/settings")
async def update_settings(data: dict, admin: dict = Depends(require_admin)):
    data.pop("_id", None)
    data.pop("type", None)
    await db.settings.update_one({"type": "school"}, {"$set": data}, upsert=True)
    settings = await db.settings.find_one({"type": "school"}, {"_id": 0})
    return settings

# ── SEED DATA ──
async def seed_data():
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@stpauls.edu")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({"email": admin_email, "password_hash": hash_password(admin_password), "name": "Admin", "role": "admin", "created_at": datetime.now(timezone.utc).isoformat()})
        logger.info("Admin user seeded")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

    # Seed students (18)
    if await db.students.count_documents({}) == 0:
        students = [
            {"name": "Aarav Sharma", "roll_no": "001", "class_name": "10", "section": "A", "gender": "Male", "dob": "2010-03-15", "father_name": "Rajesh Sharma", "mother_name": "Sunita Sharma", "phone": "9876543201", "address": "12 MG Road, Maharajganj", "admission_date": "2020-04-01", "blood_group": "A+", "transport_route": "Route 1", "photo_url": ""},
            {"name": "Priya Singh", "roll_no": "002", "class_name": "10", "section": "A", "gender": "Female", "dob": "2010-07-22", "father_name": "Vikram Singh", "mother_name": "Meera Singh", "phone": "9876543202", "address": "45 Station Road, Maharajganj", "admission_date": "2020-04-01", "blood_group": "B+", "transport_route": "Route 2", "photo_url": ""},
            {"name": "Rohan Gupta", "roll_no": "003", "class_name": "10", "section": "A", "gender": "Male", "dob": "2010-01-10", "father_name": "Amit Gupta", "mother_name": "Neha Gupta", "phone": "9876543203", "address": "78 Civil Lines, Maharajganj", "admission_date": "2020-04-01", "blood_group": "O+", "transport_route": "Route 1", "photo_url": ""},
            {"name": "Ananya Verma", "roll_no": "004", "class_name": "10", "section": "B", "gender": "Female", "dob": "2010-11-05", "father_name": "Suresh Verma", "mother_name": "Kavita Verma", "phone": "9876543204", "address": "23 Nehru Nagar, Maharajganj", "admission_date": "2020-04-01", "blood_group": "AB+", "transport_route": "Route 3", "photo_url": ""},
            {"name": "Kunal Mishra", "roll_no": "005", "class_name": "9", "section": "A", "gender": "Male", "dob": "2011-05-18", "father_name": "Deepak Mishra", "mother_name": "Anita Mishra", "phone": "9876543205", "address": "56 Gandhi Road, Maharajganj", "admission_date": "2021-04-01", "blood_group": "B-", "transport_route": "Route 2", "photo_url": ""},
            {"name": "Sneha Pandey", "roll_no": "006", "class_name": "9", "section": "A", "gender": "Female", "dob": "2011-09-12", "father_name": "Manoj Pandey", "mother_name": "Ritu Pandey", "phone": "9876543206", "address": "89 Subhash Marg, Maharajganj", "admission_date": "2021-04-01", "blood_group": "A-", "transport_route": "Route 1", "photo_url": ""},
            {"name": "Aditya Kumar", "roll_no": "007", "class_name": "9", "section": "B", "gender": "Male", "dob": "2011-02-28", "father_name": "Ravi Kumar", "mother_name": "Sita Kumar", "phone": "9876543207", "address": "34 Patel Nagar, Maharajganj", "admission_date": "2021-04-01", "blood_group": "O-", "transport_route": "Route 3", "photo_url": ""},
            {"name": "Ishita Tiwari", "roll_no": "008", "class_name": "8", "section": "A", "gender": "Female", "dob": "2012-06-30", "father_name": "Alok Tiwari", "mother_name": "Pooja Tiwari", "phone": "9876543208", "address": "67 Azad Nagar, Maharajganj", "admission_date": "2022-04-01", "blood_group": "A+", "transport_route": "Route 2", "photo_url": ""},
            {"name": "Vivek Yadav", "roll_no": "009", "class_name": "8", "section": "A", "gender": "Male", "dob": "2012-12-14", "father_name": "Sanjay Yadav", "mother_name": "Rekha Yadav", "phone": "9876543209", "address": "90 Rajpur Road, Maharajganj", "admission_date": "2022-04-01", "blood_group": "B+", "transport_route": "Route 1", "photo_url": ""},
            {"name": "Nisha Agarwal", "roll_no": "010", "class_name": "8", "section": "B", "gender": "Female", "dob": "2012-04-08", "father_name": "Pramod Agarwal", "mother_name": "Geeta Agarwal", "phone": "9876543210", "address": "11 Shastri Nagar, Maharajganj", "admission_date": "2022-04-01", "blood_group": "O+", "transport_route": "Route 3", "photo_url": ""},
            {"name": "Rahul Dubey", "roll_no": "011", "class_name": "7", "section": "A", "gender": "Male", "dob": "2013-08-25", "father_name": "Vinod Dubey", "mother_name": "Saroj Dubey", "phone": "9876543211", "address": "44 Tilak Road, Maharajganj", "admission_date": "2023-04-01", "blood_group": "AB-", "transport_route": "Route 1", "photo_url": ""},
            {"name": "Kavya Saxena", "roll_no": "012", "class_name": "7", "section": "A", "gender": "Female", "dob": "2013-10-03", "father_name": "Harsh Saxena", "mother_name": "Nandini Saxena", "phone": "9876543212", "address": "77 Lajpat Nagar, Maharajganj", "admission_date": "2023-04-01", "blood_group": "A+", "transport_route": "Route 2", "photo_url": ""},
            {"name": "Arjun Tripathi", "roll_no": "013", "class_name": "7", "section": "B", "gender": "Male", "dob": "2013-01-17", "father_name": "Ashok Tripathi", "mother_name": "Lata Tripathi", "phone": "9876543213", "address": "22 Vikas Nagar, Maharajganj", "admission_date": "2023-04-01", "blood_group": "B+", "transport_route": "Route 3", "photo_url": ""},
            {"name": "Diya Rastogi", "roll_no": "014", "class_name": "6", "section": "A", "gender": "Female", "dob": "2014-05-20", "father_name": "Nitin Rastogi", "mother_name": "Pallavi Rastogi", "phone": "9876543214", "address": "55 Indira Nagar, Maharajganj", "admission_date": "2024-04-01", "blood_group": "O+", "transport_route": "Route 1", "photo_url": ""},
            {"name": "Mohit Chauhan", "roll_no": "015", "class_name": "6", "section": "A", "gender": "Male", "dob": "2014-11-11", "father_name": "Ramesh Chauhan", "mother_name": "Kamla Chauhan", "phone": "9876543215", "address": "88 Ambedkar Nagar, Maharajganj", "admission_date": "2024-04-01", "blood_group": "A-", "transport_route": "Route 2", "photo_url": ""},
            {"name": "Riya Jaiswal", "roll_no": "016", "class_name": "6", "section": "B", "gender": "Female", "dob": "2014-07-07", "father_name": "Pankaj Jaiswal", "mother_name": "Sarita Jaiswal", "phone": "9876543216", "address": "33 Saket Colony, Maharajganj", "admission_date": "2024-04-01", "blood_group": "B-", "transport_route": "Route 3", "photo_url": ""},
            {"name": "Siddharth Ojha", "roll_no": "017", "class_name": "5", "section": "A", "gender": "Male", "dob": "2015-03-02", "father_name": "Girish Ojha", "mother_name": "Uma Ojha", "phone": "9876543217", "address": "66 Kailash Nagar, Maharajganj", "admission_date": "2025-04-01", "blood_group": "O-", "transport_route": "Route 1", "photo_url": ""},
            {"name": "Tanvi Srivastava", "roll_no": "018", "class_name": "5", "section": "A", "gender": "Female", "dob": "2015-09-19", "father_name": "Arun Srivastava", "mother_name": "Deepa Srivastava", "phone": "9876543218", "address": "99 Ram Nagar, Maharajganj", "admission_date": "2025-04-01", "blood_group": "AB+", "transport_route": "Route 2", "photo_url": ""},
        ]
        await db.students.insert_many(students)
        logger.info("18 students seeded")

    # Seed staff (12)
    if await db.staff.count_documents({}) == 0:
        staff = [
            {"name": "Fr. Thomas Joseph", "emp_id": "EMP001", "designation": "Principal", "department": "Administration", "phone": "9876540001", "email": "principal@stpauls.edu", "joining_date": "2010-04-01", "salary": 85000, "qualification": "M.Ed, M.A.", "gender": "Male", "address": "School Campus, Maharajganj"},
            {"name": "Dr. Meena Kumari", "emp_id": "EMP002", "designation": "Vice Principal", "department": "Administration", "phone": "9876540002", "email": "vp@stpauls.edu", "joining_date": "2012-07-01", "salary": 72000, "qualification": "Ph.D Education", "gender": "Female", "address": "Civil Lines, Maharajganj"},
            {"name": "Mr. Rajendra Prasad", "emp_id": "EMP003", "designation": "Senior Teacher", "department": "Mathematics", "phone": "9876540003", "email": "rajendra@stpauls.edu", "joining_date": "2015-04-01", "salary": 55000, "qualification": "M.Sc Mathematics", "gender": "Male", "address": "Station Road, Maharajganj"},
            {"name": "Mrs. Sarita Devi", "emp_id": "EMP004", "designation": "Senior Teacher", "department": "Science", "phone": "9876540004", "email": "sarita@stpauls.edu", "joining_date": "2016-07-01", "salary": 52000, "qualification": "M.Sc Physics", "gender": "Female", "address": "Gandhi Road, Maharajganj"},
            {"name": "Mr. Anil Verma", "emp_id": "EMP005", "designation": "Teacher", "department": "English", "phone": "9876540005", "email": "anil@stpauls.edu", "joining_date": "2018-04-01", "salary": 45000, "qualification": "M.A. English", "gender": "Male", "address": "Nehru Nagar, Maharajganj"},
            {"name": "Mrs. Priya Nair", "emp_id": "EMP006", "designation": "Teacher", "department": "Hindi", "phone": "9876540006", "email": "priya.n@stpauls.edu", "joining_date": "2018-07-01", "salary": 43000, "qualification": "M.A. Hindi", "gender": "Female", "address": "Subhash Marg, Maharajganj"},
            {"name": "Mr. Suresh Chandra", "emp_id": "EMP007", "designation": "Teacher", "department": "Social Studies", "phone": "9876540007", "email": "suresh@stpauls.edu", "joining_date": "2019-04-01", "salary": 42000, "qualification": "M.A. History", "gender": "Male", "address": "Patel Nagar, Maharajganj"},
            {"name": "Mrs. Kavita Sharma", "emp_id": "EMP008", "designation": "Teacher", "department": "Computer Science", "phone": "9876540008", "email": "kavita@stpauls.edu", "joining_date": "2020-04-01", "salary": 48000, "qualification": "MCA", "gender": "Female", "address": "Rajpur Road, Maharajganj"},
            {"name": "Mr. Dinesh Pandey", "emp_id": "EMP009", "designation": "Sports Teacher", "department": "Physical Education", "phone": "9876540009", "email": "dinesh@stpauls.edu", "joining_date": "2017-04-01", "salary": 40000, "qualification": "B.P.Ed", "gender": "Male", "address": "Tilak Road, Maharajganj"},
            {"name": "Mrs. Asha Mishra", "emp_id": "EMP010", "designation": "Librarian", "department": "Library", "phone": "9876540010", "email": "asha@stpauls.edu", "joining_date": "2019-07-01", "salary": 38000, "qualification": "M.Lib.Sc", "gender": "Female", "address": "Lajpat Nagar, Maharajganj"},
            {"name": "Mr. Rakesh Singh", "emp_id": "EMP011", "designation": "Clerk", "department": "Administration", "phone": "9876540011", "email": "rakesh@stpauls.edu", "joining_date": "2015-07-01", "salary": 30000, "qualification": "B.Com", "gender": "Male", "address": "Vikas Nagar, Maharajganj"},
            {"name": "Mr. Harish Pal", "emp_id": "EMP012", "designation": "Peon", "department": "Support Staff", "phone": "9876540012", "email": "harish@stpauls.edu", "joining_date": "2014-04-01", "salary": 22000, "qualification": "10th Pass", "gender": "Male", "address": "Ambedkar Nagar, Maharajganj"},
        ]
        await db.staff.insert_many(staff)
        logger.info("12 staff seeded")

    # Seed timetable for Class 10-A
    if await db.timetable.count_documents({}) == 0:
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        periods = ["Period 1\n8:00-8:40", "Period 2\n8:40-9:20", "Period 3\n9:20-10:00", "Period 4\n10:20-11:00", "Period 5\n11:00-11:40", "Period 6\n11:40-12:20", "Period 7\n1:00-1:40"]
        subjects_map = {
            "Monday": ["Mathematics", "English", "Science", "Hindi", "Social Studies", "Computer", "Sports"],
            "Tuesday": ["English", "Mathematics", "Hindi", "Science", "Computer", "Social Studies", "Library"],
            "Wednesday": ["Science", "Hindi", "Mathematics", "English", "Sports", "Social Studies", "Computer"],
            "Thursday": ["Hindi", "Science", "English", "Mathematics", "Social Studies", "Sports", "Computer"],
            "Friday": ["Mathematics", "Science", "Hindi", "Computer", "English", "Social Studies", "Sports"],
            "Saturday": ["English", "Mathematics", "Science", "Hindi", "Social Studies", "Computer", "Library"],
        }
        teachers_map = {"Mathematics": "Mr. Rajendra Prasad", "Science": "Mrs. Sarita Devi", "English": "Mr. Anil Verma", "Hindi": "Mrs. Priya Nair", "Social Studies": "Mr. Suresh Chandra", "Computer": "Mrs. Kavita Sharma", "Sports": "Mr. Dinesh Pandey", "Library": "Mrs. Asha Mishra"}
        colors_map = {"Mathematics": "#3b82f6", "Science": "#10b981", "English": "#f59e0b", "Hindi": "#ef4444", "Social Studies": "#8b5cf6", "Computer": "#06b6d4", "Sports": "#f97316", "Library": "#ec4899"}
        timetable_docs = []
        for day in days:
            for i, period in enumerate(periods):
                subj = subjects_map[day][i]
                timetable_docs.append({
                    "class_name": "10", "section": "A", "day": day, "period": period, "period_num": i + 1,
                    "subject": subj, "teacher": teachers_map.get(subj, ""), "color": colors_map.get(subj, "#64748b")
                })
        await db.timetable.insert_many(timetable_docs)
        logger.info("Timetable seeded")

    # Seed exam schedule
    if await db.exam_schedule.count_documents({}) == 0:
        exams = [
            {"exam_name": "Mid-Term Examination", "class_name": "10", "start_date": "2025-09-15", "end_date": "2025-09-25", "subjects": [
                {"subject": "Mathematics", "date": "2025-09-15", "time": "9:00 AM - 12:00 PM"},
                {"subject": "Science", "date": "2025-09-17", "time": "9:00 AM - 12:00 PM"},
                {"subject": "English", "date": "2025-09-19", "time": "9:00 AM - 12:00 PM"},
                {"subject": "Hindi", "date": "2025-09-21", "time": "9:00 AM - 12:00 PM"},
                {"subject": "Social Studies", "date": "2025-09-23", "time": "9:00 AM - 12:00 PM"},
                {"subject": "Computer", "date": "2025-09-25", "time": "9:00 AM - 11:00 AM"},
            ]},
            {"exam_name": "Annual Examination", "class_name": "10", "start_date": "2026-03-01", "end_date": "2026-03-15", "subjects": [
                {"subject": "Mathematics", "date": "2026-03-01", "time": "9:00 AM - 12:00 PM"},
                {"subject": "Science", "date": "2026-03-03", "time": "9:00 AM - 12:00 PM"},
                {"subject": "English", "date": "2026-03-05", "time": "9:00 AM - 12:00 PM"},
                {"subject": "Hindi", "date": "2026-03-07", "time": "9:00 AM - 12:00 PM"},
                {"subject": "Social Studies", "date": "2026-03-10", "time": "9:00 AM - 12:00 PM"},
                {"subject": "Computer", "date": "2026-03-12", "time": "9:00 AM - 11:00 AM"},
            ]},
        ]
        await db.exam_schedule.insert_many(exams)
        logger.info("Exam schedule seeded")

    # Seed grades
    if await db.grades.count_documents({}) == 0:
        students = await db.students.find({"class_name": "10"}).to_list(100)
        subjects = ["Mathematics", "Science", "English", "Hindi", "Social Studies", "Computer"]
        grade_docs = []
        import random
        random.seed(42)
        for s in students:
            sid = str(s["_id"])
            for subj in subjects:
                marks = random.randint(45, 98)
                grade = "A+" if marks >= 90 else "A" if marks >= 80 else "B+" if marks >= 70 else "B" if marks >= 60 else "C" if marks >= 50 else "D"
                grade_docs.append({
                    "student_id": sid, "student_name": s["name"], "roll_no": s["roll_no"],
                    "class_name": "10", "section": s["section"], "exam": "Mid-Term",
                    "subject": subj, "max_marks": 100, "marks_obtained": marks, "grade": grade
                })
        if grade_docs:
            await db.grades.insert_many(grade_docs)
            logger.info("Grades seeded")

    # Seed fee structure
    if await db.fee_structure.count_documents({}) == 0:
        classes = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
        fee_docs = []
        for c in classes:
            base = 1500 + int(c) * 200
            fee_docs.append({
                "class_name": c,
                "tuition": base,
                "transport": 800,
                "books": 500 + int(c) * 50,
                "activity": 300,
                "total": base + 800 + 500 + int(c) * 50 + 300,
                "concessions": ["Sibling Discount: 10%", "Merit Scholarship: 15%", "Staff Ward: 25%"]
            })
        await db.fee_structure.insert_many(fee_docs)
        logger.info("Fee structure seeded")

    # Seed fee payments (12 records)
    if await db.fee_payments.count_documents({}) == 0:
        students = await db.students.find({}).to_list(18)
        months = ["April 2025", "May 2025", "June 2025"]
        fee_docs = []
        for i, s in enumerate(students[:12]):
            sid = str(s["_id"])
            m = months[i % 3]
            fee_docs.append({
                "student_id": sid, "student_name": s["name"], "class_name": s["class_name"],
                "amount": 3500 + int(s["class_name"]) * 200, "payment_mode": ["Cash", "Online", "Cheque"][i % 3],
                "fee_type": "Monthly", "month": m, "status": "Paid",
                "receipt_no": f"RCP-{uuid.uuid4().hex[:8].upper()}",
                "collected_at": datetime.now(timezone.utc).isoformat()
            })
        await db.fee_payments.insert_many(fee_docs)
        logger.info("Fee payments seeded")

    # Seed transport routes
    if await db.transport_routes.count_documents({}) == 0:
        routes = [
            {"route_name": "Route 1", "bus_number": "UP-54 T 1234", "driver": "Mr. Ram Bahadur", "driver_phone": "9876540020", "stops": ["School Gate", "MG Road", "Civil Lines", "Station Road", "Bus Stand"], "students_count": 6},
            {"route_name": "Route 2", "bus_number": "UP-54 T 5678", "driver": "Mr. Shyam Lal", "driver_phone": "9876540021", "stops": ["School Gate", "Gandhi Road", "Nehru Nagar", "Subhash Marg", "Rajpur Road"], "students_count": 6},
            {"route_name": "Route 3", "bus_number": "UP-54 T 9012", "driver": "Mr. Mohan Das", "driver_phone": "9876540022", "stops": ["School Gate", "Patel Nagar", "Tilak Road", "Vikas Nagar", "Ambedkar Nagar"], "students_count": 6},
        ]
        await db.transport_routes.insert_many(routes)
        logger.info("Transport routes seeded")

    # Seed library books
    if await db.library_books.count_documents({}) == 0:
        books = [
            {"title": "NCERT Mathematics X", "author": "NCERT", "isbn": "978-81-7450-001", "category": "Textbook", "total_copies": 50, "available_copies": 42},
            {"title": "NCERT Science X", "author": "NCERT", "isbn": "978-81-7450-002", "category": "Textbook", "total_copies": 50, "available_copies": 45},
            {"title": "Wings of Fire", "author": "APJ Abdul Kalam", "isbn": "978-81-7371-146", "category": "Biography", "total_copies": 10, "available_copies": 7},
            {"title": "The Story of My Experiments with Truth", "author": "M.K. Gandhi", "isbn": "978-81-7229-001", "category": "Biography", "total_copies": 8, "available_copies": 6},
            {"title": "Panchtantra Stories", "author": "Vishnu Sharma", "isbn": "978-81-8495-001", "category": "Fiction", "total_copies": 15, "available_copies": 12},
            {"title": "Godan", "author": "Munshi Premchand", "isbn": "978-81-2670-001", "category": "Fiction", "total_copies": 12, "available_copies": 10},
            {"title": "Discovery of India", "author": "Jawaharlal Nehru", "isbn": "978-01-4303-001", "category": "History", "total_copies": 6, "available_copies": 5},
            {"title": "A Brief History of Time", "author": "Stephen Hawking", "isbn": "978-05-5305-001", "category": "Science", "total_copies": 5, "available_copies": 4},
            {"title": "Oxford English Dictionary", "author": "Oxford", "isbn": "978-01-9861-001", "category": "Reference", "total_copies": 20, "available_copies": 18},
            {"title": "Bhagavad Gita", "author": "Vyasa", "isbn": "978-81-2910-001", "category": "Philosophy", "total_copies": 10, "available_copies": 9},
        ]
        await db.library_books.insert_many(books)
        logger.info("Library books seeded")

    # Seed homework
    if await db.homework.count_documents({}) == 0:
        homework_list = [
            {"title": "Quadratic Equations Practice", "subject": "Mathematics", "class_name": "10", "section": "A", "due_date": "2025-06-20", "description": "Solve exercises 4.1 and 4.2 from NCERT textbook", "assigned_by": "Mr. Rajendra Prasad", "status": "Active", "submissions": 12, "created_at": "2025-06-15T10:00:00Z"},
            {"title": "Chemical Reactions Lab Report", "subject": "Science", "class_name": "10", "section": "A", "due_date": "2025-06-18", "description": "Write a detailed lab report on the acid-base titration experiment", "assigned_by": "Mrs. Sarita Devi", "status": "Completed", "submissions": 15, "created_at": "2025-06-10T10:00:00Z"},
            {"title": "Essay on Climate Change", "subject": "English", "class_name": "10", "section": "A", "due_date": "2025-06-22", "description": "Write a 500-word essay on the effects of climate change", "assigned_by": "Mr. Anil Verma", "status": "Active", "submissions": 8, "created_at": "2025-06-16T10:00:00Z"},
            {"title": "Hindi Poem Analysis", "subject": "Hindi", "class_name": "9", "section": "A", "due_date": "2025-06-19", "description": "Analyze the poem 'Madhushala' by Harivansh Rai Bachchan", "assigned_by": "Mrs. Priya Nair", "status": "Active", "submissions": 5, "created_at": "2025-06-14T10:00:00Z"},
            {"title": "World War II Timeline", "subject": "Social Studies", "class_name": "9", "section": "A", "due_date": "2025-06-25", "description": "Create a detailed timeline of World War II events", "assigned_by": "Mr. Suresh Chandra", "status": "Pending", "submissions": 0, "created_at": "2025-06-17T10:00:00Z"},
        ]
        await db.homework.insert_many(homework_list)
        logger.info("Homework seeded")

    # Seed communications
    if await db.communications.count_documents({}) == 0:
        comms = [
            {"type": "notice", "title": "Annual Sports Day", "message": "Annual Sports Day will be held on 25th June 2025. All students must participate.", "recipients": "All Students", "sender": "Principal", "status": "Sent", "created_at": "2025-06-10T09:00:00Z"},
            {"type": "notice", "title": "PTM Schedule", "message": "Parent-Teacher Meeting scheduled for 28th June 2025, Saturday from 10 AM to 1 PM.", "recipients": "All Parents", "sender": "Vice Principal", "status": "Sent", "created_at": "2025-06-12T09:00:00Z"},
            {"type": "notice", "title": "Summer Vacation", "message": "School will remain closed from 1st July to 15th July for summer vacation.", "recipients": "All", "sender": "Administration", "status": "Sent", "created_at": "2025-06-15T09:00:00Z"},
            {"type": "inbox", "title": "Fee Reminder", "message": "Kindly clear the pending fees for the month of June before 25th June.", "recipients": "Class 10-A Parents", "sender": "Accounts", "status": "Sent", "created_at": "2025-06-14T09:00:00Z"},
            {"type": "inbox", "title": "Uniform Update", "message": "New winter uniform samples are available at the school store.", "recipients": "All Parents", "sender": "Administration", "status": "Sent", "created_at": "2025-06-13T09:00:00Z"},
        ]
        await db.communications.insert_many(comms)
        logger.info("Communications seeded")

    # Write test credentials
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"# Test Credentials\n\n## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n\n## Auth Endpoints\n- POST /api/auth/login\n- POST /api/auth/register\n- GET /api/auth/me\n- POST /api/auth/logout\n")


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await seed_data()
    logger.info("Server started and data seeded")

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
