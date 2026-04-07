import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, DateTime, Boolean, ForeignKey, JSON, Enum as SQLEnum, Float, Integer, Text, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB

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
    protocolNumber: Mapped[Optional[str]] = mapped_column("protocolNumber", String(50), unique=True, nullable=True)
    status: Mapped[UserStatus] = mapped_column(SQLEnum(UserStatus, name="UserStatus"), default=UserStatus.PENDING)
    permissions: Mapped[dict] = mapped_column(JSONB, default={}, server_default="{}")
    
    approvedById: Mapped[Optional[str]] = mapped_column("approvedById", ForeignKey("User.id"), nullable=True)
    approvedAt: Mapped[Optional[datetime]] = mapped_column("approvedAt", DateTime, nullable=True)
    passwordHash: Mapped[str] = mapped_column("passwordHash", String(255))
    sector_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    loginAudits = relationship("LoginAudit", back_populates="user")
    auditLogs = relationship("AuditLog", back_populates="user")
    approvedBy = relationship("User", remote_side=[id], backref="approvedUsers")

class Session(Base):
    __tablename__ = "Session"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    userId: Mapped[str] = mapped_column(ForeignKey("User.id", ondelete="CASCADE"))
    sessionId: Mapped[str] = mapped_column("sessionId", String(255), unique=True)
    ipAddress: Mapped[Optional[str]] = mapped_column("ipAddress", String(45), nullable=True)
    userAgent: Mapped[Optional[str]] = mapped_column("userAgent", String(1024), nullable=True)
    isActive: Mapped[bool] = mapped_column("isActive", Boolean, default=True)
    terminatedByAdmin: Mapped[bool] = mapped_column("terminatedByAdmin", Boolean, default=False)
    terminatedAt: Mapped[Optional[datetime]] = mapped_column("terminatedAt", DateTime, nullable=True)
    
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="sessions")

class LoginAudit(Base):
    __tablename__ = "LoginAudit"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    userId: Mapped[Optional[str]] = mapped_column("userId", ForeignKey("User.id", ondelete="SET NULL"), nullable=True)
    email: Mapped[str] = mapped_column(String(255))
    ipAddress: Mapped[Optional[str]] = mapped_column("ipAddress", String(45), nullable=True)
    userAgent: Mapped[Optional[str]] = mapped_column("userAgent", String(1024), nullable=True)
    status: Mapped[LoginStatus] = mapped_column(SQLEnum(LoginStatus, name="LoginStatus"))
    loginAt: Mapped[datetime] = mapped_column("loginAt", DateTime, default=datetime.utcnow)
    
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="loginAudits")

class AuditLog(Base):
    __tablename__ = "AuditLog"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    userId: Mapped[Optional[str]] = mapped_column("userId", ForeignKey("User.id", ondelete="SET NULL"), nullable=True)
    userName: Mapped[Optional[str]] = mapped_column("userName", String(255), nullable=True)
    userEmail: Mapped[Optional[str]] = mapped_column("userEmail", String(255), nullable=True)
    action: Mapped[str] = mapped_column(String(255))
    module: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ipAddress: Mapped[Optional[str]] = mapped_column("ipAddress", String(45), nullable=True)
    userAgent: Mapped[Optional[str]] = mapped_column("userAgent", String(1024), nullable=True)
    metadata_json: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, nullable=True)
    
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="auditLogs")

demand_assignees = Table(
    'demand_assignees',
    Base.metadata,
    Column('demand_id', String(36), ForeignKey('demands.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', String(36), ForeignKey('User.id', ondelete='CASCADE'), primary_key=True)
)

class Demand(Base):
    __tablename__ = "demands"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default="pending")
    assignedTo: Mapped[Optional[str]] = mapped_column("assignedTo", String(255), nullable=True)
    dueDate: Mapped[Optional[datetime]] = mapped_column("dueDate", DateTime, nullable=True)
    createdBy: Mapped[str] = mapped_column("createdBy", String(255))
    completedAt: Mapped[Optional[datetime]] = mapped_column("completedAt", DateTime, nullable=True)
    
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assignedUsers = relationship("User", secondary=demand_assignees, lazy="selectin")

ticket_assignees = Table(
    'ticket_assignees',
    Base.metadata,
    Column('ticket_id', String(36), ForeignKey('tickets.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', String(36), ForeignKey('User.id', ondelete='CASCADE'), primary_key=True)
)

class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    requesterName: Mapped[Optional[str]] = mapped_column("requesterName", String(255), default="Usuário")
    assignedToId: Mapped[Optional[str]] = mapped_column("assignedToId", ForeignKey("User.id"), nullable=True)
    priority: Mapped[str] = mapped_column(String(20), default="MEDIUM")
    category: Mapped[str] = mapped_column(String(100))
    subSector: Mapped[str] = mapped_column("subSector", String(100), default="support")
    status: Mapped[str] = mapped_column(String(20), default="OPEN")
    accumulatedTimeMs: Mapped[int] = mapped_column("accumulatedTimeMs", Integer, default=0)
    lastStartedAt: Mapped[Optional[datetime]] = mapped_column("lastStartedAt", DateTime, nullable=True)
    pauseReason: Mapped[Optional[str]] = mapped_column("pauseReason", Text, nullable=True)
    resolvedAt: Mapped[Optional[datetime]] = mapped_column("resolvedAt", DateTime, nullable=True)
    
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assignedTo = relationship("User", foreign_keys=[assignedToId])
    assignedUsers = relationship("User", secondary=ticket_assignees, lazy="selectin")

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
    totalAllocated: Mapped[float] = mapped_column("totalAllocated", Float, default=0.0)
    
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class FinanceTransaction(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    description: Mapped[str] = mapped_column(String(255))
    amount: Mapped[float] = mapped_column(Float)
    date: Mapped[datetime] = mapped_column(DateTime)
    supplier: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(20), default="pending")
    attachmentUrl: Mapped[Optional[str]] = mapped_column("attachmentUrl", String(1024), nullable=True)
    categoryId: Mapped[str] = mapped_column("categoryId", ForeignKey("budget_categories.id"))
    beneficiaries: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    passenger: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    route: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Sector(Base):
    __tablename__ = "sectors"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(50), nullable=True) # Adicionado slug
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Process(Base):
    __tablename__ = "processes"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    processNumber: Mapped[str] = mapped_column("processNumber", String(50), unique=True)
    title: Mapped[str] = mapped_column(String(255))
    partyName: Mapped[Optional[str]] = mapped_column("partyName", String(255), nullable=True)
    court: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    deadlineDate: Mapped[Optional[datetime]] = mapped_column("deadlineDate", DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="OPEN")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Contract(Base):
    __tablename__ = "contracts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255))
    supplier: Mapped[str] = mapped_column(String(255))
    value: Mapped[float] = mapped_column(Float)
    startDate: Mapped[Optional[datetime]] = mapped_column("startDate", DateTime, nullable=True)
    endDate: Mapped[Optional[datetime]] = mapped_column("endDate", DateTime, nullable=True)
    sectorId: Mapped[Optional[str]] = mapped_column("sectorId", String(36), nullable=True)
    contractNumber: Mapped[Optional[str]] = mapped_column("contractNumber", String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE")
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Employee(Base):
    __tablename__ = "employees"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    fullName: Mapped[str] = mapped_column("fullName", String(255))
    position: Mapped[str] = mapped_column(String(255))
    department: Mapped[str] = mapped_column(String(255))
    admissionDate: Mapped[Optional[datetime]] = mapped_column("admissionDate", DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE")
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

project_assignees = Table(
    'project_assignees',
    Base.metadata,
    Column('project_id', String(36), ForeignKey('projects.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', String(36), ForeignKey('User.id', ondelete='CASCADE'), primary_key=True)
)

class Project(Base):
    __tablename__ = "projects"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(String(20), default="MEDIUM")
    status: Mapped[str] = mapped_column(String(20), default="PLANNING")
    startDate: Mapped[Optional[datetime]] = mapped_column("startDate", DateTime, nullable=True)
    endDate: Mapped[Optional[datetime]] = mapped_column("endDate", DateTime, nullable=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assignedUsers = relationship("User", secondary=project_assignees, lazy="selectin")

class RegistryEntry(Base):
    __tablename__ = "registry_entries"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    protocolNumber: Mapped[str] = mapped_column("protocolNumber", String(50))
    documentType: Mapped[str] = mapped_column("documentType", String(100))
    partyName: Mapped[str] = mapped_column("partyName", String(255))
    deadlineDate: Mapped[Optional[datetime]] = mapped_column("deadlineDate", DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="PENDING")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class RegistryReport(Base):
    __tablename__ = "registry_reports"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    month: Mapped[int] = mapped_column(Integer)
    year: Mapped[int] = mapped_column(Integer)
    data: Mapped[dict] = mapped_column(JSONB)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AdminConfig(Base):
    __tablename__ = "admin_configs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    key: Mapped[str] = mapped_column(String(100), unique=True)
    value: Mapped[dict] = mapped_column(JSONB)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class WeeklyDemand(Base):
    __tablename__ = "weekly_demands"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sector: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    lastUpdatedBy: Mapped[str] = mapped_column("lastUpdatedBy", String(255))
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ItReportDirectory(Base):
    __tablename__ = "it_report_directories"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255))
    parentId: Mapped[Optional[str]] = mapped_column("parentId", String(36), ForeignKey("it_report_directories.id", ondelete="CASCADE"), nullable=True)
    createdBy: Mapped[Optional[str]] = mapped_column("createdBy", String(255), nullable=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships (self-referential)
    children = relationship("ItReportDirectory", cascade="all, delete-orphan",
                            primaryjoin="ItReportDirectory.parentId == ItReportDirectory.id",
                            foreign_keys="ItReportDirectory.parentId")
    files = relationship("ItReport", back_populates="directory", cascade="all, delete-orphan")

class ItReport(Base):
    __tablename__ = "it_reports"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255))
    originalName: Mapped[str] = mapped_column("originalName", String(255))
    filePath: Mapped[str] = mapped_column("filePath", String(1024))
    fileSize: Mapped[int] = mapped_column("fileSize", Integer, default=0)
    mimeType: Mapped[Optional[str]] = mapped_column("mimeType", String(255), nullable=True)
    directoryId: Mapped[Optional[str]] = mapped_column("directoryId", String(36), ForeignKey("it_report_directories.id", ondelete="SET NULL"), nullable=True)
    uploadedBy: Mapped[Optional[str]] = mapped_column("uploadedBy", String(255), nullable=True)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    directory = relationship("ItReportDirectory", back_populates="files")
