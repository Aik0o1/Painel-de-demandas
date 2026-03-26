import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, DateTime, Boolean, ForeignKey, JSON, Enum as SQLEnum, Float, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database_sql import Base

import enum

class UserStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    REJECTED = "REJECTED"
    BLOCKED = "BLOCKED"

class LoginStatus(str, enum.Enum):
    SUCCESS = "SUCCESS"
    BLOCKED = "BLOCKED"
    LOGOUT = "LOGOUT"
    TERMINATED_BY_ADMIN = "TERMINATED_BY_ADMIN"

class User(Base):
    __tablename__ = "User"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    image: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    role: Mapped[str] = mapped_column(String(50), default="user")
    cpf: Mapped[Optional[str]] = mapped_column(String(14), unique=True, nullable=True)
    position: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    function: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    protocolNumber: Mapped[Optional[str]] = mapped_column("protocol_number", String(50), unique=True, nullable=True)
    status: Mapped[UserStatus] = mapped_column(SQLEnum(UserStatus, name="UserStatus"), default=UserStatus.PENDING)
    permissions: Mapped[dict] = mapped_column(JSON, default={}, server_default="{}")
    
    approvedById: Mapped[Optional[str]] = mapped_column("approved_by_id", ForeignKey("User.id"), nullable=True)
    approvedAt: Mapped[Optional[datetime]] = mapped_column("approved_at", DateTime, nullable=True)
    passwordHash: Mapped[str] = mapped_column("password_hash", String(255))
    sector_id: Mapped[Optional[str]] = mapped_column(ForeignKey("sectors.id"), nullable=True)
    
    createdAt: Mapped[datetime] = mapped_column("created_at", DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column("updated_at", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    loginAudits = relationship("LoginAudit", back_populates="user")
    auditLogs = relationship("AuditLog", back_populates="user")
    approvedBy = relationship("User", remote_side=[id], backref="approvedUsers")

class Session(Base):
    __tablename__ = "Session"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    userId: Mapped[str] = mapped_column(ForeignKey("User.id", ondelete="CASCADE"))
    sessionId: Mapped[str] = mapped_column(String(255), unique=True)
    ipAddress: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    userAgent: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    isActive: Mapped[bool] = mapped_column(Boolean, default=True)
    terminatedByAdmin: Mapped[bool] = mapped_column(Boolean, default=False)
    terminatedAt: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="sessions")

class LoginAudit(Base):
    __tablename__ = "LoginAudit"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    userId: Mapped[Optional[str]] = mapped_column(ForeignKey("User.id", ondelete="SET NULL"), nullable=True)
    email: Mapped[str] = mapped_column(String(255))
    ipAddress: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    userAgent: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    status: Mapped[LoginStatus] = mapped_column(SQLEnum(LoginStatus, name="LoginStatus"))
    loginAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="loginAudits")

class AuditLog(Base):
    __tablename__ = "AuditLog"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    userId: Mapped[Optional[str]] = mapped_column(ForeignKey("User.id", ondelete="SET NULL"), nullable=True)
    userName: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    userEmail: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    action: Mapped[str] = mapped_column(String(255))
    module: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ipAddress: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    userAgent: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    metadata_json: Mapped[Optional[dict]] = mapped_column("metadata", JSON, nullable=True)
    
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="auditLogs")

class Demand(Base):
    __tablename__ = "demands"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default="pending")
    assignedTo: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    dueDate: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    createdBy: Mapped[str] = mapped_column(String(255))
    completedAt: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    requesterName: Mapped[Optional[str]] = mapped_column("requester_name", String(255), default="Usuário")
    assignedToId: Mapped[Optional[str]] = mapped_column("assigned_to_id", ForeignKey("User.id"), nullable=True)
    priority: Mapped[str] = mapped_column(String(20), default="MEDIUM")
    category: Mapped[str] = mapped_column(String(100))
    subSector: Mapped[str] = mapped_column("sub_sector", String(100), default="support")
    status: Mapped[str] = mapped_column(String(20), default="OPEN")
    accumulatedTimeMs: Mapped[int] = mapped_column("accumulated_time_ms", Integer, default=0)
    lastStartedAt: Mapped[Optional[datetime]] = mapped_column("last_started_at", DateTime, nullable=True)
    pauseReason: Mapped[Optional[str]] = mapped_column("pause_reason", Text, nullable=True)
    resolvedAt: Mapped[Optional[datetime]] = mapped_column("resolved_at", DateTime, nullable=True)
    
    createdAt: Mapped[datetime] = mapped_column("created_at", DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column("updated_at", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assignedTo = relationship("User", foreign_keys=[assignedToId])

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String(50), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(100))
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="GOOD")
    
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class BudgetCategory(Base):
    __tablename__ = "budget_categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255))
    totalAllocated: Mapped[float] = mapped_column(Float, default=0.0)
    
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class FinanceTransaction(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    description: Mapped[str] = mapped_column(String(255))
    amount: Mapped[float] = mapped_column(Float)
    date: Mapped[datetime] = mapped_column(DateTime)
    supplier: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(20), default="pending")
    attachmentUrl: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    categoryId: Mapped[str] = mapped_column(ForeignKey("budget_categories.id"))
    beneficiaries: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    passenger: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    route: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Sector(Base):
    __tablename__ = "sectors"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(50), nullable=True) # Adicionado slug
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Process(Base):
    __tablename__ = "processes"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    processNumber: Mapped[str] = mapped_column(String(50), unique=True)
    title: Mapped[str] = mapped_column(String(255))
    partyName: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    court: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    deadlineDate: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="OPEN")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Contract(Base):
    __tablename__ = "contracts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255))
    supplier: Mapped[str] = mapped_column(String(255))
    value: Mapped[float] = mapped_column(Float)
    endDate: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    sectorId: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE")
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Employee(Base):
    __tablename__ = "employees"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    fullName: Mapped[str] = mapped_column(String(255))
    position: Mapped[str] = mapped_column(String(255))
    department: Mapped[str] = mapped_column(String(255))
    admissionDate: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE")
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Project(Base):
    __tablename__ = "projects"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(String(20), default="MEDIUM")
    status: Mapped[str] = mapped_column(String(20), default="PLANNING")
    startDate: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    endDate: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class RegistryEntry(Base):
    __tablename__ = "registry_entries"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    protocolNumber: Mapped[str] = mapped_column(String(50))
    documentType: Mapped[str] = mapped_column(String(100))
    partyName: Mapped[str] = mapped_column(String(255))
    deadlineDate: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="PENDING")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class RegistryReport(Base):
    __tablename__ = "registry_reports"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    month: Mapped[int] = mapped_column(Integer)
    year: Mapped[int] = mapped_column(Integer)
    data: Mapped[dict] = mapped_column(JSON)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AdminConfig(Base):
    __tablename__ = "admin_configs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    key: Mapped[str] = mapped_column(String(100), unique=True)
    value: Mapped[dict] = mapped_column(JSON)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class WeeklyDemand(Base):
    __tablename__ = "weekly_demands"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sector: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    lastUpdatedBy: Mapped[str] = mapped_column(String(255))
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
