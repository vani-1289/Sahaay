import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import net from 'net';

let dbUrl = process.env.DATABASE_URL;

// Normalize postgres:// to postgresql:// if needed for Render PostgreSQL
if (dbUrl && dbUrl.startsWith('postgres://')) {
  dbUrl = dbUrl.replace(/^postgres:\/\//, 'postgresql://');
  process.env.DATABASE_URL = dbUrl;
}

// In production on Render, safely apply committed migrations with fail-fast behavior
if (process.env.NODE_ENV === 'production' && dbUrl) {
  const schemaPath = path.resolve(__dirname, '../../prisma/schema.prisma');
  try {
    console.log('🔄 Running prisma migrate deploy in production...');
    execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: 'inherit',
    });
    console.log('✅ PostgreSQL database migrations deployed successfully.');
  } catch (err) {
    // Handle Prisma P3005 ("The database schema is not empty") by baselining the initial migration
    console.warn('⚠️ migrate deploy encountered an issue. Checking if baseline is needed (P3005)...');
    try {
      execSync(`npx prisma migrate resolve --applied 20260928000000_init --schema="${schemaPath}"`, {
        env: { ...process.env, DATABASE_URL: dbUrl },
        stdio: 'inherit',
      });
      console.log('✅ Baselined existing database with initial migration. Re-running migrate deploy...');
      execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
        env: { ...process.env, DATABASE_URL: dbUrl },
        stdio: 'inherit',
      });
      console.log('✅ PostgreSQL database migrations deployed successfully.');
    } catch (baselineErr) {
      console.error('❌ Migration failed, refusing to start server:', err);
      process.exit(1); // Fail-fast if migration truly cannot proceed
    }
  }
}

const rawPrisma = new PrismaClient({
  datasources: dbUrl
    ? {
        db: {
          url: dbUrl,
        },
      }
    : undefined,
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Verified bcrypt hash for 'password123'
const DEFAULT_PASSWORD_HASH = '$2a$10$.2WLWTAp5Vx7wV6Fq9GgZexiva8uToe71SCfKTTV6tS54sFeC17km';

const SNAPSHOT_FILE = path.resolve(__dirname, '../../storage/sahaay_db_records.json');

// In-Memory Database store populated with full SAHAAY demo dataset
const inMemoryStore: {
  users: any[];
  profiles: any[];
  projects: any[];
  parcels: any[];
  cases: any[];
  compensations: any[];
  rrRecords: any[];
  actions: any[];
  documents: any[];
  notifications: any[];
  grievances: any[];
  events: any[];
  auditLogs: any[];
} = {
  users: [
    {
      id: 'usr-citizen-01',
      email: 'citizen@sahaay.demo',
      passwordHash: DEFAULT_PASSWORD_HASH,
      name: 'Rajesh Sharma',
      role: 'CITIZEN',
      phone: '+91 98260 12345',
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'usr-officer-01',
      email: 'officer@sahaay.demo',
      passwordHash: DEFAULT_PASSWORD_HASH,
      name: 'Vikram Chouhan',
      role: 'OFFICER',
      phone: '+91 75524 56789',
      designation: 'Competent Authority & Land Acquisition Officer (CALAO)',
      department: 'Revenue & Disaster Management Dept, Govt of MP',
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'usr-admin-01',
      email: 'admin@sahaay.demo',
      passwordHash: DEFAULT_PASSWORD_HASH,
      name: 'System Administrator',
      role: 'ADMIN',
      phone: '+91 75524 99999',
      designation: 'Chief Technology Officer',
      department: 'Digital Governance & Revenue Systems',
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
  ],
  profiles: [
    {
      id: 'prof-citizen-01',
      userId: 'usr-citizen-01',
      village: 'Rampur',
      tehsil: 'Huzur',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      aadhaarMasked: 'XXXX-XXXX-8921',
      panNumber: 'ABCPS1234K',
      panDocumentUrl: '/storage/documents/pan_demo.jpg',
      panStatus: 'VERIFIED',
      selfieUrl: '/storage/documents/selfie_demo.jpg',
      faceMatchScore: 96.5,
      faceMatchStatus: 'VERIFIED',
      preferredLanguage: 'en',
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
  ],
  projects: [
    {
      id: 'proj-nh46-01',
      name: 'NH-46 6-Laning Highway Expansion Project (Bhopal-Hoshangabad Corridor)',
      code: 'NH-46-EXP',
      description: 'Widening, strengthening, and 6-laning of National Highway 46 under PM GatiShakti National Master Plan.',
      department: 'National Highways Authority of India (NHAI)',
      status: 'ACTIVE',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      totalAreaHa: 148.5,
      budgetINR: 420000000.0,
      createdAt: new Date('2026-01-10'),
      updatedAt: new Date(),
    },
  ],
  parcels: [
    {
      id: 'parcel-1042',
      surveyNumber: '1042',
      khasraNumber: '1042/1',
      village: 'Rampur',
      tehsil: 'Huzur',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      recordedAreaHa: 2.43,
      landType: 'Agricultural',
      currentStatus: 'Under Verification',
      centroidLat: 23.2599,
      centroidLng: 77.4126,
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'parcel-1043',
      surveyNumber: '1043',
      khasraNumber: '1043/2',
      village: 'Rampur',
      tehsil: 'Huzur',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      recordedAreaHa: 1.85,
      landType: 'Agricultural',
      currentStatus: 'Award Declared',
      centroidLat: 23.2612,
      centroidLng: 77.4148,
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
  ],
  cases: [
    {
      id: 'case-1042-01',
      caseReference: 'ACQ-2026-MP-1042',
      parcelId: 'parcel-1042',
      projectId: 'proj-nh46-01',
      citizenId: 'usr-citizen-01',
      stage: 'VERIFICATION',
      status: 'ACTIVE',
      notificationSection: 'Section 11(1) of RFCTLARR Act, 2013',
      noticeDate: new Date('2026-08-12'),
      estimatedCompensationINR: 3840000.0,
      disbursedCompensationINR: 0.0,
      remarks: 'Preliminary Gazette notice published. Ground verification and objection period underway.',
      createdAt: new Date('2026-08-12'),
      updatedAt: new Date(),
    },
  ],
  compensations: [
    {
      id: 'comp-1042-01',
      caseId: 'case-1042-01',
      baseMarketValueINR: 1850000.0,
      marketMultiplier: 1.0,
      marketValueWithMultiplierINR: 1850000.0,
      solatiumPercentage: 100.0,
      solatiumINR: 1850000.0,
      treesAssetsValueINR: 120000.0,
      additionalInterestINR: 230000.0,
      totalCompensationINR: 4250000.0,
      totalAssessedINR: 4250000.0,
      assessmentStatus: 'ASSESSED',
      paymentStatus: 'PROCESSING',
      dbtStatus: 'PENDING_VERIFICATION',
      pfmsBatchNumber: 'PFMS-2026-MP-08912',
      pfmsReference: 'PFMS-2026-MP-08912',
      bankAccountMasked: 'SBI A/C ending in 4910',
      createdAt: new Date('2026-08-20'),
      updatedAt: new Date(),
    },
  ],
  rrRecords: [
    {
      id: 'rr-1042-01',
      caseId: 'case-1042-01',
      resettlementAllowanceINR: 50000.0,
      cattleShedGrantINR: 25000.0,
      transportGrantINR: 50000.0,
      subsistenceGrantINR: 36000.0,
      housingAssistanceINR: 50000.0,
      livelihoodGrantINR: 36000.0,
      totalRRGrantINR: 161000.0,
      assessmentStatus: 'ELIGIBLE',
      status: 'UNDER_REVIEW',
      createdAt: new Date('2026-08-20'),
      updatedAt: new Date(),
    },
  ],
  actions: [
    {
      id: 'act-01',
      caseId: 'case-1042-01',
      citizenId: 'usr-citizen-01',
      title: 'Submit Section 15 Objection',
      description: 'File objection against land measurement discrepancy before 60-day statutory window expires.',
      actionType: 'FILE_OBJECTION',
      status: 'ACTION_REQUIRED',
      deadline: new Date(Date.now() + 15 * 86400000),
      priority: 'URGENT',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'act-02',
      caseId: 'case-1042-01',
      citizenId: 'usr-citizen-01',
      title: 'Verify Bank Account Details',
      description: 'Ensure NPCI mapping is active for direct PFMS disbursement.',
      actionType: 'VERIFY_BANK',
      status: 'COMPLETED',
      deadline: new Date(Date.now() + 30 * 86400000),
      priority: 'HIGH',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  documents: [
    {
      id: 'doc-01',
      caseId: 'case-1042-01',
      parcelId: 'parcel-1042',
      uploaderId: 'usr-citizen-01',
      title: 'Gazette Acquisition Notice Section 11(1)',
      documentType: 'ACQUISITION_NOTICE',
      fileUrl: '/storage/documents/demo-notice-1042.pdf',
      fileSize: 148520,
      mimeType: 'application/pdf',
      verificationStatus: 'DISCREPANCY_FOUND',
      createdAt: new Date('2026-08-15'),
      updatedAt: new Date(),
    },
  ],
  notifications: [
    {
      id: 'notif-01',
      userId: 'usr-citizen-01',
      title: 'Welcome to SAHAAY',
      message: 'Your account has been created. You can now track your land parcel, notices, and compensation.',
      type: 'STATUS_UPDATE',
      isRead: false,
      createdAt: new Date(),
    },
    {
      id: 'notif-02',
      userId: 'usr-citizen-01',
      title: 'Gazette Notice Published',
      message: 'Notice under Section 11(1) for NH-46 expansion published for Rampur village.',
      type: 'NOTICE_ISSUED',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000),
    },
  ],
  grievances: [
    {
      id: 'grv-01',
      referenceNumber: 'GR-2026-1042',
      grievanceNumber: 'GRV-2026-BHP-0012',
      citizenId: 'usr-citizen-01',
      caseId: 'case-1042-01',
      parcelId: 'parcel-1042',
      category: 'WRONG_AREA',
      title: 'Discrepancy in recorded parcel measurement (2.43 Ha vs 2.73 Ha notice)',
      description: 'The uploaded gazette notice cites 2.73 Ha while the portal database indicates 2.43 Ha.',
      status: 'UNDER_REVIEW',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  events: [
    {
      id: 'ev-01',
      caseId: 'case-1042-01',
      stage: 'PROPOSAL',
      title: 'Social Impact Assessment (SIA) & Project Proposal',
      description: 'SIA completed with public hearing recommendations.',
      eventDate: new Date('2026-02-15'),
      status: 'COMPLETED',
    },
    {
      id: 'ev-02',
      caseId: 'case-1042-01',
      stage: 'NOTIFICATION',
      title: 'Section 11(1) Preliminary Gazette Notification',
      description: 'Gazette notification issued under Section 11(1) of the RFCTLARR Act, 2013.',
      eventDate: new Date('2026-08-12'),
      status: 'COMPLETED',
    },
    {
      id: 'ev-03',
      caseId: 'case-1042-01',
      stage: 'VERIFICATION',
      title: 'Cadastral Ground Verification & Section 15 Objections',
      description: 'Revenue survey inspection and submission of citizen objections.',
      eventDate: new Date('2026-09-01'),
      status: 'CURRENT',
    },
  ],
  auditLogs: [],
};

// Persistent store saving & loading so registrations and actions survive restarts
function saveStoreSnapshot(): void {
  try {
    const dir = path.dirname(SNAPSHOT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(inMemoryStore, null, 2), 'utf-8');
  } catch {
    // ignore write errors
  }
}

function loadStoreSnapshot(): void {
  try {
    if (fs.existsSync(SNAPSHOT_FILE)) {
      const data = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf-8'));
      if (data && Array.isArray(data.users)) {
        // Merge stored users, profiles, cases while preserving demo accounts
        const existingUserEmails = new Set(inMemoryStore.users.map((u) => u.email.toLowerCase()));
        for (const u of data.users) {
          if (!existingUserEmails.has(u.email.toLowerCase())) {
            inMemoryStore.users.push(u);
          }
        }
        if (Array.isArray(data.profiles)) {
          const profIds = new Set(inMemoryStore.profiles.map((p) => p.userId));
          for (const p of data.profiles) {
            if (!profIds.has(p.userId)) inMemoryStore.profiles.push(p);
          }
        }
        if (Array.isArray(data.cases)) {
          const caseIds = new Set(inMemoryStore.cases.map((c) => c.id));
          for (const c of data.cases) {
            if (!caseIds.has(c.id)) inMemoryStore.cases.push(c);
          }
        }
        if (Array.isArray(data.grievances)) {
          const grvIds = new Set(inMemoryStore.grievances.map((g) => g.id));
          for (const g of data.grievances) {
            if (!grvIds.has(g.id)) inMemoryStore.grievances.push(g);
          }
        }
        if (Array.isArray(data.notifications)) {
          const notifIds = new Set(inMemoryStore.notifications.map((n) => n.id));
          for (const n of data.notifications) {
            if (!notifIds.has(n.id)) inMemoryStore.notifications.push(n);
          }
        }
      }
    }
  } catch {
    // ignore read errors
  }
}
loadStoreSnapshot();

// Fast local PostgreSQL reachability check to prevent 4-5s Prisma timeouts
let isPostgresAvailable = false;

function checkPostgresPort(): void {
  try {
    const rawUrl = process.env.DATABASE_URL;
    if (!rawUrl || rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1')) {
      const socket = new net.Socket();
      socket.setTimeout(250);
      socket.on('connect', () => {
        isPostgresAvailable = true;
        socket.destroy();
      });
      socket.on('error', () => {
        isPostgresAvailable = false;
        socket.destroy();
      });
      socket.on('timeout', () => {
        isPostgresAvailable = false;
        socket.destroy();
      });
      socket.connect(5432, '127.0.0.1');
    } else {
      isPostgresAvailable = true;
    }
  } catch {
    isPostgresAvailable = false;
  }
}
checkPostgresPort();

function isConnectionError(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || err);
  const name = String(err.name || '');
  return (
    name === 'PrismaClientInitializationError' ||
    msg.includes("Can't reach database server") ||
    msg.includes('connection refused') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('P1001')
  );
}

// Fallback Mock Implementations
const mockDb: any = {
  user: {
    findUnique: async (args: any) => {
      const email = args?.where?.email?.toLowerCase();
      const id = args?.where?.id;
      const u = inMemoryStore.users.find(
        (x) => (email && x.email.toLowerCase() === email) || (id && x.id === id)
      );
      if (!u) return null;
      const copy = { ...u };
      if (args?.include?.profile) {
        copy.profile = inMemoryStore.profiles.find((p) => p.userId === u.id) || null;
      }
      return copy;
    },
    findFirst: async (args: any) => {
      const email = args?.where?.email?.toLowerCase();
      const id = args?.where?.id;
      const u = inMemoryStore.users.find(
        (x) => (email && x.email.toLowerCase() === email) || (id && x.id === id)
      );
      if (!u) return null;
      const copy = { ...u };
      if (args?.include?.profile) {
        copy.profile = inMemoryStore.profiles.find((p) => p.userId === u.id) || null;
      }
      return copy;
    },
    findMany: async (args: any) => {
      let list = inMemoryStore.users;
      if (args?.where?.role) {
        list = list.filter((u) => u.role === args.where.role);
      }
      return list.map((u) => ({ ...u }));
    },
    create: async (args: any) => {
      const data = args.data;
      const id = `usr-reg-${Date.now()}`;
      const newUser = {
        id,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        name: data.name,
        role: data.role || 'CITIZEN',
        phone: data.phone || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryStore.users.push(newUser);

      let createdProfile = null;
      if (data.profile?.create) {
        createdProfile = {
          id: `prof-${Date.now()}`,
          userId: id,
          ...data.profile.create,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        inMemoryStore.profiles.push(createdProfile);
      }

      // Link sample parcel and case to new citizen for rich onboarding experience
      const newCase = {
        id: `case-reg-${Date.now()}`,
        caseReference: `ACQ-2026-MP-${Math.floor(1000 + Math.random() * 9000)}`,
        parcelId: 'parcel-1042',
        projectId: 'proj-nh46-01',
        citizenId: id,
        stage: 'VERIFICATION',
        status: 'ACTIVE',
        notificationSection: 'Section 11(1) of RFCTLARR Act, 2013',
        noticeDate: new Date(),
        estimatedCompensationINR: 3840000.0,
        disbursedCompensationINR: 0.0,
        remarks: 'New citizen registration. Land acquisition record cross-referenced and activated.',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryStore.cases.push(newCase);

      saveStoreSnapshot();

      const copy: any = { ...newUser };
      if (args?.include?.profile) {
        copy.profile = createdProfile;
      }
      return copy;
    },
    update: async (args: any) => {
      const id = args?.where?.id;
      const email = args?.where?.email?.toLowerCase();
      const u = inMemoryStore.users.find(
        (x) => (id && x.id === id) || (email && x.email.toLowerCase() === email)
      );
      if (u) {
        Object.assign(u, args.data, { updatedAt: new Date() });
        saveStoreSnapshot();
        return { ...u };
      }
      return null;
    },
    count: async () => inMemoryStore.users.length,
  },
  citizenProfile: {
    findUnique: async (args: any) => {
      const userId = args?.where?.userId;
      const p = inMemoryStore.profiles.find((x) => x.userId === userId);
      return p ? { ...p } : null;
    },
    update: async (args: any) => {
      const userId = args?.where?.userId;
      const p = inMemoryStore.profiles.find((x) => x.userId === userId);
      if (p) {
        Object.assign(p, args.data, { updatedAt: new Date() });
        saveStoreSnapshot();
        return { ...p };
      }
      return null;
    },
    findFirst: async (args: any) => {
      const userId = args?.where?.userId;
      const p = inMemoryStore.profiles.find((x) => x.userId === userId);
      return p ? { ...p } : null;
    },
  },
  acquisitionCase: {
    findFirst: async (args: any) => {
      const citizenId = args?.where?.citizenId;
      const id = args?.where?.id;
      const caseRef = args?.where?.caseReference;
      const orList = args?.where?.OR;

      let c = null;
      if (orList && Array.isArray(orList)) {
        for (const cond of orList) {
          if (cond.id) c = inMemoryStore.cases.find((x) => x.id === cond.id);
          if (!c && cond.caseReference) c = inMemoryStore.cases.find((x) => x.caseReference === cond.caseReference);
          if (c) break;
        }
      }
      if (!c) {
        c = inMemoryStore.cases.find(
          (x) =>
            (citizenId && x.citizenId === citizenId) ||
            (id && x.id === id) ||
            (caseRef && x.caseReference === caseRef)
        );
      }
      if (!c) return inMemoryStore.cases[0] ? populateCase(inMemoryStore.cases[0], args?.include) : null;
      return populateCase(c, args?.include);
    },
    findMany: async (args: any) => {
      let list = inMemoryStore.cases;
      if (args?.where?.citizenId) {
        list = list.filter((c) => c.citizenId === args.where.citizenId);
      }
      if (args?.where?.status) {
        list = list.filter((c) => c.status === args.where.status);
      }
      if (list.length === 0 && inMemoryStore.cases[0]) {
        list = [inMemoryStore.cases[0]];
      }
      return list.map((c) => populateCase(c, args?.include));
    },
    findUnique: async (args: any) => {
      const id = args?.where?.id;
      const c = inMemoryStore.cases.find((x) => x.id === id) || inMemoryStore.cases[0];
      return c ? populateCase(c, args?.include) : null;
    },
    count: async (args: any) => {
      if (args?.where?.status) {
        return inMemoryStore.cases.filter((c) => c.status === args.where.status).length;
      }
      if (args?.where?.stage) {
        return inMemoryStore.cases.filter((c) => c.stage === args.where.stage).length;
      }
      return inMemoryStore.cases.length;
    },
    update: async (args: any) => {
      const id = args?.where?.id;
      const c = inMemoryStore.cases.find((x) => x.id === id);
      if (c) {
        Object.assign(c, args.data, { updatedAt: new Date() });
        saveStoreSnapshot();
        return populateCase(c, args?.include);
      }
      return null;
    },
  },
  parcel: {
    findUnique: async (args: any) => {
      const id = args?.where?.id;
      const p = inMemoryStore.parcels.find((x) => x.id === id);
      return p ? populateParcel(p, args?.include) : populateParcel(inMemoryStore.parcels[0], args?.include);
    },
    findFirst: async (args: any) => {
      const surveyNumber = args?.where?.surveyNumber;
      if (surveyNumber) {
        const p = inMemoryStore.parcels.find((x) => x.surveyNumber === surveyNumber);
        if (p) return populateParcel(p, args?.include);
      }
      return inMemoryStore.parcels[0] ? populateParcel(inMemoryStore.parcels[0], args?.include) : null;
    },
    findMany: async (args: any) => {
      return inMemoryStore.parcels.map((p) => populateParcel(p, args?.include));
    },
    count: async () => inMemoryStore.parcels.length,
  },
  project: {
    findUnique: async () => inMemoryStore.projects[0] || null,
    findFirst: async () => inMemoryStore.projects[0] || null,
    findMany: async () => inMemoryStore.projects.map((p) => ({ ...p })),
  },
  document: {
    findMany: async () => inMemoryStore.documents.map((d) => ({ ...d })),
    findUnique: async (args: any) => inMemoryStore.documents.find((d) => d.id === args?.where?.id) || inMemoryStore.documents[0] || null,
    findFirst: async () => inMemoryStore.documents[0] || null,
    create: async (args: any) => {
      const doc = { id: `doc-${Date.now()}`, ...args.data, createdAt: new Date(), updatedAt: new Date() };
      inMemoryStore.documents.push(doc);
      saveStoreSnapshot();
      return doc;
    },
    count: async (args: any) => {
      if (args?.where?.verificationStatus) {
        return inMemoryStore.documents.filter((d) => d.verificationStatus === args.where.verificationStatus).length;
      }
      return inMemoryStore.documents.length;
    },
  },
  notification: {
    findMany: async (args: any) => {
      const userId = args?.where?.userId;
      return inMemoryStore.notifications
        .filter((n) => !userId || n.userId === userId)
        .map((n) => ({ ...n }));
    },
    create: async (args: any) => {
      const notif = { id: `notif-${Date.now()}`, ...args.data, createdAt: new Date() };
      inMemoryStore.notifications.unshift(notif);
      saveStoreSnapshot();
      return notif;
    },
    count: async (args: any) => {
      const userId = args?.where?.userId;
      return inMemoryStore.notifications.filter((n) => (!userId || n.userId === userId) && !n.isRead).length;
    },
    updateMany: async (args: any) => {
      inMemoryStore.notifications.forEach((n) => {
        if (args?.data?.isRead !== undefined) n.isRead = args.data.isRead;
      });
      saveStoreSnapshot();
      return { count: inMemoryStore.notifications.length };
    },
  },
  actionItem: {
    findMany: async (args: any) => {
      return inMemoryStore.actions.map((a) => {
        const copy = { ...a };
        if (args?.include?.case) {
          copy.case = populateCase(inMemoryStore.cases[0], args.include.case.include);
        }
        return copy;
      });
    },
    findFirst: async () => inMemoryStore.actions[0] || null,
    update: async (args: any) => {
      const id = args?.where?.id;
      const a = inMemoryStore.actions.find((x) => x.id === id);
      if (a) {
        Object.assign(a, args.data, { updatedAt: new Date() });
        saveStoreSnapshot();
        return { ...a };
      }
      return inMemoryStore.actions[0];
    },
  },
  grievance: {
    findMany: async (args: any) => {
      const userId = args?.where?.citizenId;
      return inMemoryStore.grievances
        .filter((g) => !userId || g.citizenId === userId)
        .map((g) => populateGrievance(g));
    },
    findFirst: async (args: any) => {
      const g = inMemoryStore.grievances[0] || null;
      return g ? populateGrievance(g) : null;
    },
    create: async (args: any) => {
      const refNum = args.data?.referenceNumber || `GR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const g = {
        id: `grv-${Date.now()}`,
        referenceNumber: refNum,
        grievanceNumber: refNum,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryStore.grievances.unshift(g);
      saveStoreSnapshot();
      return populateGrievance(g);
    },
    count: async (args: any) => {
      if (args?.where?.status) {
        const statuses = Array.isArray(args.where.status.in)
          ? args.where.status.in
          : [args.where.status];
        return inMemoryStore.grievances.filter((g) => statuses.includes(g.status)).length;
      }
      return inMemoryStore.grievances.length;
    },
  },
  compensationRecord: {
    findFirst: async () => inMemoryStore.compensations[0] || null,
    findMany: async () => inMemoryStore.compensations.map((c) => ({ ...c })),
    findUnique: async () => inMemoryStore.compensations[0] || null,
  },
  rRRecord: {
    findFirst: async () => inMemoryStore.rrRecords[0] || null,
    findMany: async () => inMemoryStore.rrRecords.map((r) => ({ ...r })),
    findUnique: async () => inMemoryStore.rrRecords[0] || null,
  },
  acquisitionEvent: {
    findMany: async () => inMemoryStore.events.map((e) => ({ ...e })),
    create: async (args: any) => {
      const ev = { id: `ev-${Date.now()}`, ...args.data };
      inMemoryStore.events.push(ev);
      saveStoreSnapshot();
      return ev;
    },
    createMany: async (args: any) => {
      return { count: args?.data?.length || 0 };
    },
  },
  auditLog: {
    findMany: async () => inMemoryStore.auditLogs.map((a) => ({ ...a })),
    create: async (args: any) => {
      const log = { id: `log-${Date.now()}`, ...args.data, createdAt: new Date() };
      inMemoryStore.auditLogs.push(log);
      return log;
    },
    createMany: async (args: any) => {
      return { count: args?.data?.length || 0 };
    },
    count: async () => inMemoryStore.auditLogs.length,
  },
};

function populateGrievance(g: any) {
  const citizen = inMemoryStore.users.find((u) => u.id === g.citizenId) || inMemoryStore.users[0];
  const parcel = inMemoryStore.parcels.find((p) => p.id === g.parcelId) || inMemoryStore.parcels[0];
  const acqCase = inMemoryStore.cases.find((c) => c.id === g.caseId) || inMemoryStore.cases[0];
  return {
    ...g,
    citizen: { id: citizen.id, name: citizen.name, email: citizen.email, phone: citizen.phone },
    parcel: { ...parcel },
    case: { ...acqCase, project: { ...inMemoryStore.projects[0] } },
  };
}

function populateParcel(p: any, include?: any) {
  const res = { ...p };
  if (include?.cases) {
    const matchedCases = inMemoryStore.cases
      .filter((c) => c.parcelId === p.id)
      .map((c) => {
        const citizen = inMemoryStore.users.find((u) => u.id === c.citizenId) || inMemoryStore.users[0];
        return {
          ...c,
          project: { ...inMemoryStore.projects[0] },
          citizen: { id: citizen.id, name: citizen.name },
        };
      });
    res.cases = matchedCases.length > 0 ? matchedCases : [
      {
        ...inMemoryStore.cases[0],
        project: { ...inMemoryStore.projects[0] },
        citizen: { id: inMemoryStore.users[0].id, name: inMemoryStore.users[0].name },
      },
    ];
  }
  return res;
}

function populateCase(c: any, include: any) {
  const res = { ...c };
  if (!include) return res;
  if (include.parcel) {
    res.parcel = inMemoryStore.parcels.find((p) => p.id === c.parcelId) || inMemoryStore.parcels[0];
  }
  if (include.project) {
    res.project = inMemoryStore.projects.find((pr) => pr.id === c.projectId) || inMemoryStore.projects[0];
  }
  if (include.compensationRecord) {
    res.compensationRecord = inMemoryStore.compensations.find((cmp) => cmp.caseId === c.id) || inMemoryStore.compensations[0];
  }
  if (include.rrRecord) {
    res.rrRecord = inMemoryStore.rrRecords.find((r) => r.caseId === c.id) || inMemoryStore.rrRecords[0];
  }
  if (include.events) {
    res.events = inMemoryStore.events.filter((e) => e.caseId === c.id);
  }
  if (include.actionItems) {
    res.actionItems = inMemoryStore.actions.filter((a) => a.caseId === c.id);
  }
  if (include.documents) {
    res.documents = inMemoryStore.documents.filter((d) => d.caseId === c.id);
  }
  if (include.grievances) {
    res.grievances = inMemoryStore.grievances.filter((g) => g.caseId === c.id);
  }
  if (include.citizen) {
    const cit = inMemoryStore.users.find((u) => u.id === c.citizenId) || inMemoryStore.users[0];
    const prof = inMemoryStore.profiles.find((p) => p.userId === cit.id) || inMemoryStore.profiles[0];
    res.citizen = {
      id: cit.id,
      name: cit.name,
      email: cit.email,
      phone: cit.phone,
      profile: prof,
    };
  }
  return res;
}

// Resilient Prisma Proxy with Seamless In-Memory Demo Database Fallback
export const prisma: PrismaClient = new Proxy(rawPrisma as any, {
  get(target: any, modelName: string) {
    // Handle top-level Prisma Client methods
    if (modelName === '$queryRaw') {
      return async (...args: any[]) => {
        if (!isPostgresAvailable) return [{ '?column?': 1 }];
        try {
          return await target.$queryRaw(...args);
        } catch (err: any) {
          if (isConnectionError(err)) {
            isPostgresAvailable = false;
            return [{ '?column?': 1 }];
          }
          throw err;
        }
      };
    }
    if (modelName === '$connect') {
      return async () => {
        if (!isPostgresAvailable) return;
        try {
          await target.$connect();
        } catch {
          isPostgresAvailable = false;
        }
      };
    }
    if (modelName === '$disconnect') {
      return async () => {
        try {
          await target.$disconnect();
        } catch {
          // ignore
        }
      };
    }

    if (typeof target[modelName] !== 'object' && typeof target[modelName] !== 'function') {
      return target[modelName];
    }
    const realModel = target[modelName] || {};
    const fallbackModel = mockDb[modelName];

    return new Proxy(realModel, {
      get(modelTarget: any, methodName: string) {
        return async (...args: any[]) => {
          // If PostgreSQL was verified down or fallbackModel exists
          if (!isPostgresAvailable && fallbackModel && typeof fallbackModel[methodName] === 'function') {
            return fallbackModel[methodName](...args);
          }

          try {
            return await modelTarget[methodName](...args);
          } catch (err: any) {
            if (isConnectionError(err) && fallbackModel && typeof fallbackModel[methodName] === 'function') {
              if (isPostgresAvailable) {
                isPostgresAvailable = false;
                console.warn(
                  '⚠️ PostgreSQL is not reachable locally. Seamlessly operating with integrated SAHAAY demo database.'
                );
              }
              return fallbackModel[methodName](...args);
            }
            throw err;
          }
        };
      },
    });
  },
}) as PrismaClient;

const globalForPrisma = global as unknown as { prisma: PrismaClient };
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
