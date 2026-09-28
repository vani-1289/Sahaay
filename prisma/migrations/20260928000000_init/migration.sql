-- CreateTable User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CITIZEN',
    "phone" TEXT,
    "designation" TEXT,
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable CitizenProfile
CREATE TABLE "CitizenProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aadhaarMasked" TEXT,
    "panNumber" TEXT,
    "panDocumentUrl" TEXT,
    "panStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "selfieUrl" TEXT,
    "faceMatchScore" DOUBLE PRECISION,
    "faceMatchStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "village" TEXT,
    "tehsil" TEXT,
    "district" TEXT,
    "state" TEXT DEFAULT 'Madhya Pradesh',
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CitizenProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable Project
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "department" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Madhya Pradesh',
    "totalAreaHa" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "budgetINR" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "geometryGeoJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable Parcel
CREATE TABLE "Parcel" (
    "id" TEXT NOT NULL,
    "surveyNumber" TEXT NOT NULL,
    "khasraNumber" TEXT,
    "village" TEXT NOT NULL,
    "tehsil" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Madhya Pradesh',
    "recordedAreaHa" DOUBLE PRECISION NOT NULL,
    "landType" TEXT NOT NULL DEFAULT 'Agricultural',
    "currentStatus" TEXT NOT NULL DEFAULT 'Under Verification',
    "coordinatesJson" TEXT,
    "centroidLat" DOUBLE PRECISION,
    "centroidLng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parcel_pkey" PRIMARY KEY ("id")
);

-- CreateTable AcquisitionCase
CREATE TABLE "AcquisitionCase" (
    "id" TEXT NOT NULL,
    "caseReference" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'VERIFICATION',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notificationSection" TEXT NOT NULL DEFAULT 'Section 11(1)',
    "noticeDate" TIMESTAMP(3),
    "estimatedCompensationINR" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "disbursedCompensationINR" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcquisitionCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable AcquisitionEvent
CREATE TABLE "AcquisitionEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcquisitionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable Document
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "caseId" TEXT,
    "parcelId" TEXT,
    "uploaderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "documentType" TEXT NOT NULL DEFAULT 'ACQUISITION_NOTICE',
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "extractedDataJson" TEXT,
    "rawText" TEXT,
    "plainLanguageExplanation" TEXT,
    "hasDiscrepancy" BOOLEAN NOT NULL DEFAULT false,
    "discrepancySummary" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable CompensationRecord
CREATE TABLE "CompensationRecord" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "landAssessmentINR" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "assetAssessmentINR" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "solatiumINR" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "interestINR" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalAssessedINR" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "assessmentStatus" TEXT NOT NULL DEFAULT 'ASSESSED',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PROCESSING',
    "assessmentDate" TIMESTAMP(3),
    "paymentDate" TIMESTAMP(3),
    "pfmsReference" TEXT,
    "bankAccountMasked" TEXT,
    "ifscCode" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompensationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable RRRecord
CREATE TABLE "RRRecord" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "familyMembersCount" INTEGER NOT NULL DEFAULT 1,
    "displacedStatus" TEXT NOT NULL DEFAULT 'NOT_DISPLACED',
    "assessmentStatus" TEXT NOT NULL DEFAULT 'ELIGIBLE',
    "housingAssistanceINR" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "livelihoodGrantINR" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "resettlementSiteName" TEXT,
    "allottedPlotNumber" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RRRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable Grievance
CREATE TABLE "Grievance" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "caseId" TEXT,
    "parcelId" TEXT,
    "citizenId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'WRONG_AREA',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "detectedDiscrepancy" TEXT,
    "attachmentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "officerResponse" TEXT,
    "reviewedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grievance_pkey" PRIMARY KEY ("id")
);

-- CreateTable ActionItem
CREATE TABLE "ActionItem" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actionType" TEXT NOT NULL DEFAULT 'IDENTITY_VERIFICATION',
    "status" TEXT NOT NULL DEFAULT 'ACTION_REQUIRED',
    "deadline" TIMESTAMP(3),
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caseId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'STATUS_UPDATE',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");

CREATE UNIQUE INDEX "CitizenProfile_userId_key" ON "CitizenProfile"("userId");
CREATE INDEX "CitizenProfile_village_idx" ON "CitizenProfile"("village");
CREATE INDEX "CitizenProfile_district_idx" ON "CitizenProfile"("district");
CREATE INDEX "CitizenProfile_panNumber_idx" ON "CitizenProfile"("panNumber");

CREATE UNIQUE INDEX "Project_code_key" ON "Project"("code");
CREATE INDEX "Project_code_idx" ON "Project"("code");
CREATE INDEX "Project_district_idx" ON "Project"("district");

CREATE INDEX "Parcel_surveyNumber_idx" ON "Parcel"("surveyNumber");
CREATE INDEX "Parcel_village_idx" ON "Parcel"("village");
CREATE INDEX "Parcel_district_idx" ON "Parcel"("district");

CREATE UNIQUE INDEX "AcquisitionCase_caseReference_key" ON "AcquisitionCase"("caseReference");
CREATE INDEX "AcquisitionCase_caseReference_idx" ON "AcquisitionCase"("caseReference");
CREATE INDEX "AcquisitionCase_parcelId_idx" ON "AcquisitionCase"("parcelId");
CREATE INDEX "AcquisitionCase_projectId_idx" ON "AcquisitionCase"("projectId");
CREATE INDEX "AcquisitionCase_citizenId_idx" ON "AcquisitionCase"("citizenId");
CREATE INDEX "AcquisitionCase_stage_idx" ON "AcquisitionCase"("stage");
CREATE INDEX "AcquisitionCase_status_idx" ON "AcquisitionCase"("status");

CREATE INDEX "AcquisitionEvent_caseId_idx" ON "AcquisitionEvent"("caseId");
CREATE INDEX "AcquisitionEvent_stage_idx" ON "AcquisitionEvent"("stage");

CREATE INDEX "Document_caseId_idx" ON "Document"("caseId");
CREATE INDEX "Document_parcelId_idx" ON "Document"("parcelId");
CREATE INDEX "Document_uploaderId_idx" ON "Document"("uploaderId");
CREATE INDEX "Document_documentType_idx" ON "Document"("documentType");

CREATE UNIQUE INDEX "CompensationRecord_caseId_key" ON "CompensationRecord"("caseId");
CREATE INDEX "CompensationRecord_caseId_idx" ON "CompensationRecord"("caseId");

CREATE UNIQUE INDEX "RRRecord_caseId_key" ON "RRRecord"("caseId");
CREATE INDEX "RRRecord_caseId_idx" ON "RRRecord"("caseId");

CREATE UNIQUE INDEX "Grievance_referenceNumber_key" ON "Grievance"("referenceNumber");
CREATE INDEX "Grievance_referenceNumber_idx" ON "Grievance"("referenceNumber");
CREATE INDEX "Grievance_caseId_idx" ON "Grievance"("caseId");
CREATE INDEX "Grievance_citizenId_idx" ON "Grievance"("citizenId");
CREATE INDEX "Grievance_status_idx" ON "Grievance"("status");

CREATE INDEX "ActionItem_caseId_idx" ON "ActionItem"("caseId");
CREATE INDEX "ActionItem_citizenId_idx" ON "ActionItem"("citizenId");
CREATE INDEX "ActionItem_status_idx" ON "ActionItem"("status");

CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- AddForeignKeys
ALTER TABLE "CitizenProfile" ADD CONSTRAINT "CitizenProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AcquisitionCase" ADD CONSTRAINT "AcquisitionCase_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "Parcel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AcquisitionCase" ADD CONSTRAINT "AcquisitionCase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AcquisitionCase" ADD CONSTRAINT "AcquisitionCase_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AcquisitionEvent" ADD CONSTRAINT "AcquisitionEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "AcquisitionCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AcquisitionEvent" ADD CONSTRAINT "AcquisitionEvent_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Document" ADD CONSTRAINT "Document_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "AcquisitionCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "Parcel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CompensationRecord" ADD CONSTRAINT "CompensationRecord_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "AcquisitionCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RRRecord" ADD CONSTRAINT "RRRecord_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "AcquisitionCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "AcquisitionCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "Parcel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "AcquisitionCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "AcquisitionCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
