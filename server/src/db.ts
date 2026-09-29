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
      process.exit(1);
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

// In-Memory Database store populated with full SAHAAY Bhopal demo dataset matching Cadastral GIS & reference specs
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
      id: 'usr-geeta-01',
      email: 'geeta.singh@sahaay.demo',
      passwordHash: DEFAULT_PASSWORD_HASH,
      name: 'Geeta Singh',
      role: 'CITIZEN',
      phone: '+91 94250 88712',
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'usr-anita-01',
      email: 'anita.chouhan@sahaay.demo',
      passwordHash: DEFAULT_PASSWORD_HASH,
      name: 'Anita Chouhan',
      role: 'CITIZEN',
      phone: '+91 98270 45612',
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'usr-digvijay-01',
      email: 'digvijay.patel@sahaay.demo',
      passwordHash: DEFAULT_PASSWORD_HASH,
      name: 'Digvijay Singh Patel',
      role: 'CITIZEN',
      phone: '+91 97520 63489',
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'usr-ramesh-01',
      email: 'ramesh.yadav@sahaay.demo',
      passwordHash: DEFAULT_PASSWORD_HASH,
      name: 'Ramesh Yadav',
      role: 'CITIZEN',
      phone: '+91 98263 71829',
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'usr-manoj-01',
      email: 'manoj.tiwari@sahaay.demo',
      passwordHash: DEFAULT_PASSWORD_HASH,
      name: 'Manoj Tiwari',
      role: 'CITIZEN',
      phone: '+91 94251 63920',
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'usr-sunil-01',
      email: 'sunil.verma@sahaay.demo',
      passwordHash: DEFAULT_PASSWORD_HASH,
      name: 'Sunil Verma',
      role: 'CITIZEN',
      phone: '+91 97555 48190',
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'usr-pradeep-01',
      email: 'pradeep.meena@sahaay.demo',
      passwordHash: DEFAULT_PASSWORD_HASH,
      name: 'Pradeep Meena',
      role: 'CITIZEN',
      phone: '+91 98260 99412',
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'usr-kamlesh-01',
      email: 'kamlesh.sharma@sahaay.demo',
      passwordHash: DEFAULT_PASSWORD_HASH,
      name: 'Kamlesh Sharma',
      role: 'CITIZEN',
      phone: '+91 94254 38201',
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'usr-suresh-01',
      email: 'suresh.lodhi@sahaay.demo',
      passwordHash: DEFAULT_PASSWORD_HASH,
      name: 'Suresh Lodhi',
      role: 'CITIZEN',
      phone: '+91 98272 55019',
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'usr-bhupendra-01',
      email: 'bhupendra.singh@sahaay.demo',
      passwordHash: DEFAULT_PASSWORD_HASH,
      name: 'Bhupendra Singh',
      role: 'CITIZEN',
      phone: '+91 97531 22904',
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'usr-deepak-01',
      email: 'deepak.saxena@sahaay.demo',
      passwordHash: DEFAULT_PASSWORD_HASH,
      name: 'Deepak Saxena',
      role: 'CITIZEN',
      phone: '+91 98261 44782',
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
    {
      id: 'prof-geeta-01',
      userId: 'usr-geeta-01',
      village: 'Chandanpura (चंदनपुरा)',
      tehsil: 'Huzur',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      aadhaarMasked: 'XXXX-XXXX-4512',
      panNumber: 'BKLPS9821F',
      panStatus: 'VERIFIED',
      faceMatchStatus: 'VERIFIED',
      preferredLanguage: 'hi',
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
  ],
  projects: [
    {
      id: 'proj-nhai-stg8',
      name: 'National Highway Expansion (NHAI) — Stage 8',
      code: 'NHAI-STG8',
      description: 'National Highway corridor 4-to-6 laning and eco-buffer perimeter around outer Bhopal.',
      department: 'National Highways Authority of India (NHAI)',
      status: 'ACTIVE',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      totalAreaHa: 185.0,
      budgetINR: 580000000.0,
      createdAt: new Date('2026-01-10'),
      updatedAt: new Date(),
    },
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
    {
      id: 'proj-metro-ph2',
      name: 'Bhopal Metro Phase 2 (Orange Line Extension)',
      code: 'BMRCL-PH2',
      description: 'AIIMS to Karond via Misrod and Shahpura metro railway corridor.',
      department: 'Madhya Pradesh Metro Rail Corporation Limited (MPMRCL)',
      status: 'ACTIVE',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      totalAreaHa: 64.0,
      budgetINR: 690000000.0,
      createdAt: new Date('2026-02-01'),
      updatedAt: new Date(),
    },
    {
      id: 'proj-airport-logistics',
      name: 'Raja Bhoj Airport Multi-Modal Logistics Hub',
      code: 'RBA-LOGISTICS',
      description: 'Cargo and commercial freight transit zone expansion near Bairagarh Kalan.',
      department: 'Airports Authority of India & MPIDC',
      status: 'ACTIVE',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      totalAreaHa: 95.0,
      budgetINR: 310000000.0,
      createdAt: new Date('2026-03-01'),
      updatedAt: new Date(),
    },
  ],
  parcels: [
    {
      id: 'parcel-bh-558',
      surveyNumber: '558/3',
      khasraNumber: '558/3',
      parcelCode: 'MP-BH-031',
      village: 'Chandanpura (चंदनपुरा)',
      tehsil: 'Huzur',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      recordedAreaHa: 5.41,
      recordedAreaAcres: 13.37,
      landType: 'Forest Buffer (वन सीमावर्ती)',
      currentStatus: 'Approved',
      centroidLat: 23.1850,
      centroidLng: 77.3820,
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'parcel-1042',
      surveyNumber: '1042',
      khasraNumber: '1042/1',
      parcelCode: 'MP-BH-1042',
      village: 'Rampur',
      tehsil: 'Huzur',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      recordedAreaHa: 2.43,
      recordedAreaAcres: 6.00,
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
      parcelCode: 'MP-BH-1043',
      village: 'Rampur',
      tehsil: 'Huzur',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      recordedAreaHa: 1.85,
      recordedAreaAcres: 4.57,
      landType: 'Agricultural',
      currentStatus: 'Acquired',
      centroidLat: 23.2612,
      centroidLng: 77.4148,
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'parcel-bh-88',
      surveyNumber: '88/1',
      khasraNumber: '88/1',
      parcelCode: 'MP-BH-088',
      village: 'Kolar Kalan (कोलार कलां)',
      tehsil: 'Huzur',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      recordedAreaHa: 3.20,
      recordedAreaAcres: 7.90,
      landType: 'Residential Buffer (आवासीय क्षेत्र)',
      currentStatus: 'Under Acquisition',
      centroidLat: 23.1720,
      centroidLng: 77.4200,
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'parcel-bh-214',
      surveyNumber: '214/2',
      khasraNumber: '214/2',
      parcelCode: 'MP-BH-214',
      village: 'Misrod (मिसरोद)',
      tehsil: 'Huzur',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      recordedAreaHa: 1.65,
      recordedAreaAcres: 4.07,
      landType: 'Commercial (व्यावसायिक)',
      currentStatus: 'Compensation Pending',
      centroidLat: 23.1480,
      centroidLng: 77.4620,
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'parcel-bh-340',
      surveyNumber: '340/5',
      khasraNumber: '340/5',
      parcelCode: 'MP-BH-340',
      village: 'Sukhi Sewaniya (सूखी सेवनिया)',
      tehsil: 'Huzur',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      recordedAreaHa: 4.12,
      recordedAreaAcres: 10.18,
      landType: 'Agricultural (कृषि भूमि)',
      currentStatus: 'Acquired',
      centroidLat: 23.3350,
      centroidLng: 77.4850,
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'parcel-bh-142',
      surveyNumber: '142/3',
      khasraNumber: '142/3',
      parcelCode: 'MP-BH-142',
      village: 'Bairagarh Kalan (बैरागढ़ कलां)',
      tehsil: 'Huzur',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      recordedAreaHa: 2.80,
      recordedAreaAcres: 6.92,
      landType: 'Commercial Buffer (व्यावसायिक)',
      currentStatus: 'Available',
      centroidLat: 23.2920,
      centroidLng: 77.3310,
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'parcel-bh-402',
      surveyNumber: '402/1',
      khasraNumber: '402/1',
      parcelCode: 'MP-BH-402',
      village: 'Bilkhiriya (बिलखिरिया)',
      tehsil: 'Huzur',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      recordedAreaHa: 5.05,
      recordedAreaAcres: 12.48,
      landType: 'Industrial (औद्योगिक)',
      currentStatus: 'Utilized',
      centroidLat: 23.2450,
      centroidLng: 77.5320,
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'parcel-bh-719',
      surveyNumber: '719/2',
      khasraNumber: '719/2',
      parcelCode: 'MP-BH-719',
      village: 'Karond (करोंद)',
      tehsil: 'Huzur',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      recordedAreaHa: 1.95,
      recordedAreaAcres: 4.82,
      landType: 'Agricultural (कृषि भूमि)',
      currentStatus: 'Disputed',
      centroidLat: 23.3050,
      centroidLng: 77.4080,
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'parcel-bh-995',
      surveyNumber: '995/4',
      khasraNumber: '995/4',
      parcelCode: 'MP-BH-995',
      village: 'Mandideep (मंडीदीप)',
      tehsil: 'Huzur',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      recordedAreaHa: 3.75,
      recordedAreaAcres: 9.26,
      landType: 'Industrial Buffer (औद्योगिक)',
      currentStatus: 'Under Acquisition',
      centroidLat: 23.0850,
      centroidLng: 77.5250,
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'parcel-bh-631',
      surveyNumber: '631/1',
      khasraNumber: '631/1',
      parcelCode: 'MP-BH-631',
      village: 'Berasia Gram (बैरसिया)',
      tehsil: 'Berasia',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      recordedAreaHa: 6.20,
      recordedAreaAcres: 15.32,
      landType: 'Agricultural (कृषि भूमि)',
      currentStatus: 'Approved',
      centroidLat: 23.6300,
      centroidLng: 77.4320,
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'parcel-bh-185',
      surveyNumber: '185/2',
      khasraNumber: '185/2',
      parcelCode: 'MP-BH-185',
      village: 'Phanda Kalan (फंदा कलां)',
      tehsil: 'Huzur',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      recordedAreaHa: 4.50,
      recordedAreaAcres: 11.12,
      landType: 'Agricultural (कृषि भूमि)',
      currentStatus: 'Compensation Pending',
      centroidLat: 23.2380,
      centroidLng: 77.2450,
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
    {
      id: 'parcel-bh-512',
      surveyNumber: '512/7',
      khasraNumber: '512/7',
      parcelCode: 'MP-BH-512',
      village: 'Shahpura (शाहपुरा)',
      tehsil: 'Huzur',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      recordedAreaHa: 1.25,
      recordedAreaAcres: 3.09,
      landType: 'Urban Mixed (मिश्रित उपयोग)',
      currentStatus: 'Under Verification',
      centroidLat: 23.2050,
      centroidLng: 77.4390,
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date(),
    },
  ],
  cases: [
    {
      id: 'case-bh-558',
      caseReference: 'ACQ-2026-MP-5583',
      parcelId: 'parcel-bh-558',
      projectId: 'proj-nhai-stg8',
      citizenId: 'usr-geeta-01',
      stage: 'AWARD',
      status: 'ACTIVE',
      notificationSection: 'Section 19(1) Declaration (RFCTLARR Act, 2013)',
      noticeDate: new Date('2026-07-20'),
      estimatedCompensationINR: 4520000.0,
      disbursedCompensationINR: 0.0,
      remarks: 'Forest buffer parcel acquisition sanctioned under National Highway Expansion Stage 8. Joint cadastral survey verified.',
      createdAt: new Date('2026-07-20'),
      updatedAt: new Date(),
    },
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
    {
      id: 'case-1043-01',
      caseReference: 'ACQ-2026-MP-1043',
      parcelId: 'parcel-1043',
      projectId: 'proj-nh46-01',
      citizenId: 'usr-citizen-01',
      stage: 'COMPENSATION',
      status: 'COMPLETED',
      notificationSection: 'Section 23 Award Declared',
      noticeDate: new Date('2026-06-15'),
      estimatedCompensationINR: 3240000.0,
      disbursedCompensationINR: 3240000.0,
      remarks: 'Award declared and DBT disbursement completed via PFMS.',
      createdAt: new Date('2026-06-15'),
      updatedAt: new Date(),
    },
    {
      id: 'case-bh-88',
      caseReference: 'ACQ-2026-MP-0881',
      parcelId: 'parcel-bh-88',
      projectId: 'proj-nh46-01',
      citizenId: 'usr-anita-01',
      stage: 'VERIFICATION',
      status: 'ACTIVE',
      notificationSection: 'Section 11(1) Notice Issued',
      noticeDate: new Date('2026-08-18'),
      estimatedCompensationINR: 5800000.0,
      disbursedCompensationINR: 0.0,
      remarks: 'Kolar road widening alignment verification under progress.',
      createdAt: new Date('2026-08-18'),
      updatedAt: new Date(),
    },
    {
      id: 'case-bh-214',
      caseReference: 'ACQ-2026-MP-0214',
      parcelId: 'parcel-bh-214',
      projectId: 'proj-metro-ph2',
      citizenId: 'usr-digvijay-01',
      stage: 'AWARD',
      status: 'ACTIVE',
      notificationSection: 'Section 19 Declaration',
      noticeDate: new Date('2026-05-10'),
      estimatedCompensationINR: 7280000.0,
      disbursedCompensationINR: 0.0,
      remarks: 'Metro line commercial corridor compensation calculation under final review.',
      createdAt: new Date('2026-05-10'),
      updatedAt: new Date(),
    },
    {
      id: 'case-bh-340',
      caseReference: 'ACQ-2026-MP-0340',
      parcelId: 'parcel-bh-340',
      projectId: 'proj-nhai-stg8',
      citizenId: 'usr-ramesh-01',
      stage: 'POSSESSION',
      status: 'COMPLETED',
      notificationSection: 'Section 38 Possession Handover',
      noticeDate: new Date('2026-04-12'),
      estimatedCompensationINR: 6420000.0,
      disbursedCompensationINR: 6420000.0,
      remarks: 'Northern ring road bypass segment. Land possession completed.',
      createdAt: new Date('2026-04-12'),
      updatedAt: new Date(),
    },
    {
      id: 'case-bh-142',
      caseReference: 'ACQ-2026-MP-0142',
      parcelId: 'parcel-bh-142',
      projectId: 'proj-airport-logistics',
      citizenId: 'usr-manoj-01',
      stage: 'PROPOSAL',
      status: 'PENDING',
      notificationSection: 'Section 4 SIA Completed',
      noticeDate: new Date('2026-08-25'),
      estimatedCompensationINR: 4890000.0,
      disbursedCompensationINR: 0.0,
      remarks: 'Airport freight buffer assessment pending final notification.',
      createdAt: new Date('2026-08-25'),
      updatedAt: new Date(),
    },
    {
      id: 'case-bh-402',
      caseReference: 'ACQ-2026-MP-0402',
      parcelId: 'parcel-bh-402',
      projectId: 'proj-nhai-stg8',
      citizenId: 'usr-sunil-01',
      stage: 'CLOSURE',
      status: 'COMPLETED',
      notificationSection: 'Section 99 Project Completion',
      noticeDate: new Date('2026-01-20'),
      estimatedCompensationINR: 8800000.0,
      disbursedCompensationINR: 8800000.0,
      remarks: 'Industrial logistics parcel fully utilized and highway wing operational.',
      createdAt: new Date('2026-01-20'),
      updatedAt: new Date(),
    },
    {
      id: 'case-bh-719',
      caseReference: 'ACQ-2026-MP-0719',
      parcelId: 'parcel-bh-719',
      projectId: 'proj-nh46-01',
      citizenId: 'usr-pradeep-01',
      stage: 'VERIFICATION',
      status: 'DISPUTED',
      notificationSection: 'Section 15 Objection Filed',
      noticeDate: new Date('2026-08-05'),
      estimatedCompensationINR: 3950000.0,
      disbursedCompensationINR: 0.0,
      remarks: 'Dispute raised regarding boundary marker overlap with state road.',
      createdAt: new Date('2026-08-05'),
      updatedAt: new Date(),
    },
    {
      id: 'case-bh-995',
      caseReference: 'ACQ-2026-MP-0995',
      parcelId: 'parcel-bh-995',
      projectId: 'proj-nhai-stg8',
      citizenId: 'usr-kamlesh-01',
      stage: 'NOTIFICATION',
      status: 'ACTIVE',
      notificationSection: 'Section 11(1) Preliminary Gazette',
      noticeDate: new Date('2026-08-28'),
      estimatedCompensationINR: 6100000.0,
      disbursedCompensationINR: 0.0,
      remarks: 'Mandideep freight corridor notice issued. Joint inspection pending.',
      createdAt: new Date('2026-08-28'),
      updatedAt: new Date(),
    },
    {
      id: 'case-bh-631',
      caseReference: 'ACQ-2026-MP-0631',
      parcelId: 'parcel-bh-631',
      projectId: 'proj-nhai-stg8',
      citizenId: 'usr-suresh-01',
      stage: 'AWARD',
      status: 'ACTIVE',
      notificationSection: 'Section 23 Sanction Approved',
      noticeDate: new Date('2026-07-15'),
      estimatedCompensationINR: 5100000.0,
      disbursedCompensationINR: 0.0,
      remarks: 'Berasia agricultural bypass award finalized. Treasury token generated.',
      createdAt: new Date('2026-07-15'),
      updatedAt: new Date(),
    },
    {
      id: 'case-bh-185',
      caseReference: 'ACQ-2026-MP-0185',
      parcelId: 'parcel-bh-185',
      projectId: 'proj-nhai-stg8',
      citizenId: 'usr-bhupendra-01',
      stage: 'AWARD',
      status: 'ACTIVE',
      notificationSection: 'Section 23 Award Sanctioned',
      noticeDate: new Date('2026-06-30'),
      estimatedCompensationINR: 7640000.0,
      disbursedCompensationINR: 0.0,
      remarks: 'Phanda expressway greenfield link compensation awaiting PFMS clearance.',
      createdAt: new Date('2026-06-30'),
      updatedAt: new Date(),
    },
    {
      id: 'case-bh-512',
      caseReference: 'ACQ-2026-MP-0512',
      parcelId: 'parcel-bh-512',
      projectId: 'proj-metro-ph2',
      citizenId: 'usr-deepak-01',
      stage: 'VERIFICATION',
      status: 'ACTIVE',
      notificationSection: 'Section 11(1) Notice',
      noticeDate: new Date('2026-08-22'),
      estimatedCompensationINR: 4180000.0,
      disbursedCompensationINR: 0.0,
      remarks: 'Shahpura urban link verification in progress with town planning.',
      createdAt: new Date('2026-08-22'),
      updatedAt: new Date(),
    },
  ],
  compensations: [
    {
      id: 'comp-bh-558',
      caseId: 'case-bh-558',
      baseMarketValueINR: 2100000.0,
      marketMultiplier: 1.0,
      marketValueWithMultiplierINR: 2100000.0,
      landAssessmentINR: 2100000.0,
      assetAssessmentINR: 320000.0,
      treesAssetsValueINR: 320000.0,
      solatiumPercentage: 100.0,
      solatiumINR: 2100000.0,
      interestINR: 0.0,
      additionalInterestINR: 0.0,
      totalCompensationINR: 4520000.0,
      totalAssessedINR: 4520000.0,
      assessmentStatus: 'APPROVED',
      paymentStatus: 'SANCTIONED',
      dbtStatus: 'APPROVED',
      pfmsBatchNumber: 'PFMS-2026-MP-05583',
      pfmsReference: 'PFMS-2026-MP-05583',
      bankAccountMasked: 'HDFC A/C ending in 6641',
      ifscCode: 'HDFC0000214',
      createdAt: new Date('2026-07-25'),
      updatedAt: new Date(),
    },
    {
      id: 'comp-1042-01',
      caseId: 'case-1042-01',
      baseMarketValueINR: 1600000.0,
      marketMultiplier: 1.0,
      marketValueWithMultiplierINR: 1600000.0,
      landAssessmentINR: 1600000.0,
      assetAssessmentINR: 320000.0,
      treesAssetsValueINR: 320000.0,
      solatiumPercentage: 100.0,
      solatiumINR: 1600000.0,
      interestINR: 320000.0,
      additionalInterestINR: 320000.0,
      totalCompensationINR: 3840000.0,
      totalAssessedINR: 3840000.0,
      assessmentStatus: 'ASSESSED',
      paymentStatus: 'PROCESSING',
      dbtStatus: 'PENDING_VERIFICATION',
      pfmsBatchNumber: 'PFMS-2026-MP-08912',
      pfmsReference: 'PFMS-2026-MP-08912',
      bankAccountMasked: 'SBI A/C ending in 4910',
      ifscCode: 'SBIN0001042',
      createdAt: new Date('2026-08-20'),
      updatedAt: new Date(),
    },
    {
      id: 'comp-bh-88',
      caseId: 'case-bh-88',
      baseMarketValueINR: 2700000.0,
      marketMultiplier: 1.0,
      marketValueWithMultiplierINR: 2700000.0,
      landAssessmentINR: 2700000.0,
      assetAssessmentINR: 400000.0,
      solatiumPercentage: 100.0,
      solatiumINR: 2700000.0,
      interestINR: 0.0,
      totalCompensationINR: 5800000.0,
      totalAssessedINR: 5800000.0,
      assessmentStatus: 'ASSESSED',
      paymentStatus: 'PROCESSING',
      createdAt: new Date('2026-08-20'),
      updatedAt: new Date(),
    },
    {
      id: 'comp-bh-214',
      caseId: 'case-bh-214',
      baseMarketValueINR: 3400000.0,
      marketMultiplier: 1.0,
      marketValueWithMultiplierINR: 3400000.0,
      landAssessmentINR: 3400000.0,
      assetAssessmentINR: 480000.0,
      solatiumPercentage: 100.0,
      solatiumINR: 3400000.0,
      interestINR: 0.0,
      totalCompensationINR: 7280000.0,
      totalAssessedINR: 7280000.0,
      assessmentStatus: 'ASSESSED',
      paymentStatus: 'PENDING',
      createdAt: new Date('2026-05-15'),
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
    {
      id: 'rr-bh-558',
      caseId: 'case-bh-558',
      familyMembersCount: 4,
      resettlementAllowanceINR: 75000.0,
      transportGrantINR: 50000.0,
      subsistenceGrantINR: 50000.0,
      housingAssistanceINR: 150000.0,
      livelihoodGrantINR: 50000.0,
      totalRRGrantINR: 325000.0,
      assessmentStatus: 'SANCTIONED',
      status: 'APPROVED',
      createdAt: new Date('2026-07-25'),
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
  ],
  documents: [
    {
      id: 'doc-bh-558-1',
      caseId: 'case-bh-558',
      parcelId: 'parcel-bh-558',
      uploaderId: 'usr-geeta-01',
      title: 'Section 19 Declaration Gazette Notice (Chandanpura)',
      documentType: 'ACQUISITION_NOTICE',
      fileUrl: '/storage/documents/demo-notice-1042.pdf',
      fileSize: 218520,
      mimeType: 'application/pdf',
      verificationStatus: 'UNDER_REVIEW',
      createdAt: new Date('2026-07-22'),
      updatedAt: new Date(),
    },
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
// Always save updated Bhopal parcels to snapshot file immediately
saveStoreSnapshot();

// Fast synchronous PostgreSQL reachability check to eliminate async race condition between in-memory and PostgreSQL modes
function checkPostgresPortSync(): boolean {
  try {
    const rawUrl = process.env.DATABASE_URL;
    if (!rawUrl) return false;
    if (!rawUrl.includes('localhost') && !rawUrl.includes('127.0.0.1')) {
      return true;
    }
    const portMatch = rawUrl.match(/:(\d+)\//);
    const port = portMatch ? parseInt(portMatch[1], 10) : 5432;
    execSync(
      `node -e "const s = require('net').connect(${port}, '127.0.0.1', () => process.exit(0)).on('error', () => process.exit(1)); setTimeout(() => process.exit(1), 300);"`,
      { stdio: 'ignore', timeout: 600 }
    );
    return true;
  } catch {
    return false;
  }
}

let isPostgresAvailable = checkPostgresPortSync();

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
      if (!c) return null;
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
      return list.map((c) => populateCase(c, args?.include));
    },
    findUnique: async (args: any) => {
      const id = args?.where?.id;
      const c = inMemoryStore.cases.find((x) => x.id === id);
      return c ? populateCase(c, args?.include) : null;
    },
    count: async (args: any) => {
      if (args?.where?.citizenId) {
        return inMemoryStore.cases.filter((c) => c.citizenId === args.where.citizenId).length;
      }
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
      const surveyNumber = args?.where?.surveyNumber;
      let p = inMemoryStore.parcels.find((x) => (id && x.id === id) || (surveyNumber && x.surveyNumber === surveyNumber));
      if (!p && id) {
        p = inMemoryStore.parcels.find(
          (x) => x.surveyNumber === id || x.khasraNumber === id || (x.parcelCode && x.parcelCode === id)
        );
      }
      return p ? populateParcel(p, args?.include) : null;
    },
    findFirst: async (args: any) => {
      const surveyNumber = args?.where?.surveyNumber;
      const village = args?.where?.village?.contains;
      const id = args?.where?.id;
      const orList = args?.where?.OR;

      let p = null;
      if (orList && Array.isArray(orList)) {
        for (const cond of orList) {
          if (cond.id) p = inMemoryStore.parcels.find((x) => x.id === cond.id || x.surveyNumber === cond.id || (x.khasraNumber && x.khasraNumber === cond.id));
          if (!p && cond.surveyNumber) p = inMemoryStore.parcels.find((x) => x.surveyNumber === cond.surveyNumber || x.khasraNumber === cond.surveyNumber);
          if (p) break;
        }
      }
      if (!p) {
        p = inMemoryStore.parcels.find((x) => {
          if (id && x.id !== id && x.surveyNumber !== id && x.khasraNumber !== id) return false;
          if (surveyNumber && x.surveyNumber !== surveyNumber && x.khasraNumber !== surveyNumber) return false;
          if (village && !x.village.toLowerCase().includes(village.toLowerCase())) return false;
          return true;
        });
      }
      return p ? populateParcel(p, args?.include) : null;
    },
    findMany: async (args: any) => {
      let list = inMemoryStore.parcels;
      if (args?.where) {
        const w = args.where;
        list = list.filter((p) => {
          if (w.id?.in && Array.isArray(w.id.in)) {
            if (!w.id.in.includes(p.id)) return false;
          }
          if (w.cases?.some?.citizenId) {
            const pCases = inMemoryStore.cases.filter((c) => c.parcelId === p.id);
            if (!pCases.some((c) => c.citizenId === w.cases.some.citizenId)) return false;
          }
          if (w.surveyNumber?.contains) {
            const term = w.surveyNumber.contains.toLowerCase().trim();
            const matchSurvey = p.surveyNumber.toLowerCase().includes(term);
            const matchKhasra = p.khasraNumber && p.khasraNumber.toLowerCase().includes(term);
            const matchId = p.id.toLowerCase().includes(term);
            const matchCode = p.parcelCode && p.parcelCode.toLowerCase().includes(term);
            if (!matchSurvey && !matchKhasra && !matchId && !matchCode) return false;
          }
          if (w.village?.contains) {
            const term = w.village.contains.toLowerCase().trim();
            if (!p.village.toLowerCase().includes(term)) return false;
          }
          if (w.district?.contains) {
            const term = w.district.contains.toLowerCase().trim();
            if (!p.district.toLowerCase().includes(term)) return false;
          }
          if (w.OR && Array.isArray(w.OR)) {
            const matchesOr = w.OR.some((cond: any) => {
              if (cond.surveyNumber?.contains && p.surveyNumber.toLowerCase().includes(cond.surveyNumber.contains.toLowerCase())) return true;
              if (cond.khasraNumber?.contains && p.khasraNumber && p.khasraNumber.toLowerCase().includes(cond.khasraNumber.contains.toLowerCase())) return true;
              if (cond.village?.contains && p.village.toLowerCase().includes(cond.village.contains.toLowerCase())) return true;
              if (cond.district?.contains && p.district.toLowerCase().includes(cond.district.contains.toLowerCase())) return true;
              if (cond.cases?.some?.OR) {
                const pCases = inMemoryStore.cases.filter((c) => c.parcelId === p.id);
                return pCases.some((c) => {
                  const proj = inMemoryStore.projects.find((pr) => pr.id === c.projectId);
                  return cond.cases.some.OR.some((subCond: any) => {
                    if (subCond.caseReference?.contains && c.caseReference.toLowerCase().includes(subCond.caseReference.contains.toLowerCase())) return true;
                    if (subCond.project?.name?.contains && proj && proj.name.toLowerCase().includes(subCond.project.name.contains.toLowerCase())) return true;
                    return false;
                  });
                });
              }
              return false;
            });
            if (!matchesOr) return false;
          }
          return true;
        });
      }
      return list.map((p) => populateParcel(p, args?.include));
    },
    count: async () => inMemoryStore.parcels.length,
    update: async (args: any) => {
      const id = args?.where?.id;
      const p = inMemoryStore.parcels.find((x) => x.id === id || x.surveyNumber === id);
      if (p) {
        Object.assign(p, args.data, { updatedAt: new Date() });
        saveStoreSnapshot();
        return populateParcel(p, args?.include);
      }
      return null;
    },
  },
  project: {
    findUnique: async (args: any) => {
      const id = args?.where?.id;
      return inMemoryStore.projects.find((pr) => pr.id === id) || inMemoryStore.projects[0] || null;
    },
    findFirst: async () => inMemoryStore.projects[0] || null,
    findMany: async () => inMemoryStore.projects.map((p) => ({ ...p })),
  },
  document: {
    findMany: async (args: any) => {
      let list = inMemoryStore.documents;
      if (args?.where?.parcelId) list = list.filter((d) => d.parcelId === args.where.parcelId);
      if (args?.where?.caseId) list = list.filter((d) => d.caseId === args.where.caseId);
      return list.map((d) => ({ ...d }));
    },
    findUnique: async (args: any) => inMemoryStore.documents.find((d) => d.id === args?.where?.id) || inMemoryStore.documents[0] || null,
    findFirst: async (args: any) => {
      const id = args?.where?.id;
      const parcelId = args?.where?.parcelId;
      const caseId = args?.where?.caseId;
      return inMemoryStore.documents.find((d) => (id && d.id === id) || (parcelId && d.parcelId === parcelId) || (caseId && d.caseId === caseId)) || inMemoryStore.documents[0] || null;
    },
    create: async (args: any) => {
      const doc = { id: `doc-${Date.now()}`, ...args.data, createdAt: new Date(), updatedAt: new Date() };
      inMemoryStore.documents.push(doc);
      saveStoreSnapshot();
      return doc;
    },
    update: async (args: any) => {
      const id = args?.where?.id;
      const doc = inMemoryStore.documents.find((d) => d.id === id);
      if (doc) {
        Object.assign(doc, args.data, { updatedAt: new Date() });
        saveStoreSnapshot();
        return { ...doc };
      }
      return null;
    },
    delete: async (args: any) => {
      const id = args?.where?.id;
      const idx = inMemoryStore.documents.findIndex((d) => d.id === id);
      if (idx !== -1) {
        const deleted = inMemoryStore.documents.splice(idx, 1)[0];
        saveStoreSnapshot();
        return deleted;
      }
      return null;
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
    findFirst: async (args: any) => {
      const id = args?.where?.id;
      const userId = args?.where?.userId;
      return inMemoryStore.notifications.find((n) => (id && n.id === id) || (!userId || n.userId === userId)) || null;
    },
    findUnique: async (args: any) => {
      const id = args?.where?.id;
      return inMemoryStore.notifications.find((n) => n.id === id) || null;
    },
    create: async (args: any) => {
      const notif = { id: `notif-${Date.now()}`, ...args.data, createdAt: new Date() };
      inMemoryStore.notifications.unshift(notif);
      saveStoreSnapshot();
      return notif;
    },
    update: async (args: any) => {
      const id = args?.where?.id;
      const notif = inMemoryStore.notifications.find((n) => n.id === id);
      if (notif) {
        Object.assign(notif, args.data);
        saveStoreSnapshot();
        return { ...notif };
      }
      return null;
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
    findUnique: async (args: any) => {
      const id = args?.where?.id;
      return inMemoryStore.actions.find((x) => x.id === id) || inMemoryStore.actions[0] || null;
    },
    create: async (args: any) => {
      const act = { id: `act-${Date.now()}`, ...args.data, createdAt: new Date(), updatedAt: new Date() };
      inMemoryStore.actions.push(act);
      saveStoreSnapshot();
      return act;
    },
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
    count: async () => inMemoryStore.actions.length,
  },
  grievance: {
    findMany: async (args: any) => {
      const userId = args?.where?.citizenId;
      return inMemoryStore.grievances
        .filter((g) => !userId || g.citizenId === userId)
        .map((g) => populateGrievance(g));
    },
    findFirst: async (args?: any) => {
      const id = args?.where?.id;
      const ref = args?.where?.referenceNumber;
      const g = inMemoryStore.grievances.find((x) => (id && x.id === id) || (ref && x.referenceNumber === ref)) || inMemoryStore.grievances[0] || null;
      return g ? populateGrievance(g) : null;
    },
    findUnique: async (args: any) => {
      const id = args?.where?.id;
      const ref = args?.where?.referenceNumber;
      const g = inMemoryStore.grievances.find((x) => (id && x.id === id) || (ref && x.referenceNumber === ref));
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
    update: async (args: any) => {
      const id = args?.where?.id;
      const ref = args?.where?.referenceNumber;
      const g = inMemoryStore.grievances.find((x) => (id && x.id === id) || (ref && x.referenceNumber === ref));
      if (g) {
        Object.assign(g, args.data, { updatedAt: new Date() });
        saveStoreSnapshot();
        return populateGrievance(g);
      }
      return inMemoryStore.grievances[0] ? populateGrievance(inMemoryStore.grievances[0]) : null;
    },
    delete: async (args: any) => {
      const id = args?.where?.id;
      const idx = inMemoryStore.grievances.findIndex((x) => x.id === id);
      if (idx !== -1) {
        const deleted = inMemoryStore.grievances.splice(idx, 1)[0];
        saveStoreSnapshot();
        return populateGrievance(deleted);
      }
      return null;
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
    findFirst: async (args: any) => {
      const caseId = args?.where?.caseId;
      const comp = inMemoryStore.compensations.find((c) => !caseId || c.caseId === caseId) || inMemoryStore.compensations[0];
      return comp ? { ...comp } : null;
    },
    findMany: async () => inMemoryStore.compensations.map((c) => ({ ...c })),
    findUnique: async (args: any) => {
      const caseId = args?.where?.caseId;
      const id = args?.where?.id;
      const comp = inMemoryStore.compensations.find((c) => (caseId && c.caseId === caseId) || (id && c.id === id)) || inMemoryStore.compensations[0];
      return comp ? { ...comp } : null;
    },
    update: async (args: any) => {
      const caseId = args?.where?.caseId;
      const id = args?.where?.id;
      const comp = inMemoryStore.compensations.find((c) => (caseId && c.caseId === caseId) || (id && c.id === id));
      if (comp) {
        Object.assign(comp, args.data, { updatedAt: new Date() });
        saveStoreSnapshot();
        return { ...comp };
      }
      return null;
    },
    create: async (args: any) => {
      const comp = { id: `comp-${Date.now()}`, ...args.data, createdAt: new Date(), updatedAt: new Date() };
      inMemoryStore.compensations.push(comp);
      saveStoreSnapshot();
      return { ...comp };
    },
  },
  rRRecord: {
    findFirst: async (args: any) => {
      const caseId = args?.where?.caseId;
      const rr = inMemoryStore.rrRecords.find((r) => !caseId || r.caseId === caseId) || inMemoryStore.rrRecords[0];
      return rr ? { ...rr } : null;
    },
    findMany: async () => inMemoryStore.rrRecords.map((r) => ({ ...r })),
    findUnique: async (args: any) => {
      const caseId = args?.where?.caseId;
      const rr = inMemoryStore.rrRecords.find((r) => !caseId || r.caseId === caseId) || inMemoryStore.rrRecords[0];
      return rr ? { ...rr } : null;
    },
    update: async (args: any) => {
      const caseId = args?.where?.caseId;
      const rr = inMemoryStore.rrRecords.find((r) => !caseId || r.caseId === caseId);
      if (rr) {
        Object.assign(rr, args.data, { updatedAt: new Date() });
        saveStoreSnapshot();
        return { ...rr };
      }
      return null;
    },
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
  const matchedCases = inMemoryStore.cases
    .filter((c) => c.parcelId === p.id)
    .map((c) => {
      const citizen = inMemoryStore.users.find((u) => u.id === c.citizenId) || inMemoryStore.users[0];
      const proj = inMemoryStore.projects.find((pr) => pr.id === c.projectId) || inMemoryStore.projects[0];
      const comp = inMemoryStore.compensations.find((cmp) => cmp.caseId === c.id);
      const docs = inMemoryStore.documents.filter((d) => d.caseId === c.id || d.parcelId === p.id);
      return {
        ...c,
        project: { ...proj },
        citizen: { id: citizen.id, name: citizen.name, email: citizen.email, phone: citizen.phone },
        compensationRecord: comp ? { ...comp } : null,
        documents: docs.map((d) => ({ ...d })),
      };
    });

  res.cases = matchedCases;
  return res;
}

function populateCase(c: any, include: any) {
  const res = { ...c };
  res.parcel = inMemoryStore.parcels.find((p) => p.id === c.parcelId) || inMemoryStore.parcels[0];
  res.project = inMemoryStore.projects.find((pr) => pr.id === c.projectId) || inMemoryStore.projects[0];
  res.compensationRecord = inMemoryStore.compensations.find((cmp) => cmp.caseId === c.id) || inMemoryStore.compensations[0];
  res.rrRecord = inMemoryStore.rrRecords.find((r) => r.caseId === c.id) || inMemoryStore.rrRecords[0];
  res.events = inMemoryStore.events.filter((e) => e.caseId === c.id);
  res.actionItems = inMemoryStore.actions.filter((a) => a.caseId === c.id);
  res.documents = inMemoryStore.documents.filter((d) => d.caseId === c.id || d.parcelId === c.parcelId);
  res.grievances = inMemoryStore.grievances.filter((g) => g.caseId === c.id);
  const cit = inMemoryStore.users.find((u) => u.id === c.citizenId) || inMemoryStore.users[0];
  const prof = inMemoryStore.profiles.find((p) => p.userId === cit.id) || inMemoryStore.profiles[0];
  res.citizen = {
    id: cit.id,
    name: cit.name,
    email: cit.email,
    phone: cit.phone,
    profile: prof,
  };
  return res;
}

// Resilient Prisma Proxy with Seamless In-Memory Demo Database Fallback
export const prisma: PrismaClient = new Proxy(rawPrisma as any, {
  get(target: any, modelName: string) {
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
          if (!isPostgresAvailable) {
            if (fallbackModel && typeof fallbackModel[methodName] === 'function') {
              return fallbackModel[methodName](...args);
            }
            if (fallbackModel) {
              if (methodName === 'findMany') return [];
              if (methodName === 'findFirst' || methodName === 'findUnique') return null;
              if (methodName === 'count') return 0;
              if (methodName === 'create') return { id: `mock-${Date.now()}`, ...args[0]?.data, createdAt: new Date() };
              if (methodName === 'update') return { id: args[0]?.where?.id || `mock-${Date.now()}`, ...args[0]?.data, updatedAt: new Date() };
              if (methodName === 'delete' || methodName === 'deleteMany') return { count: 0 };
              if (methodName === 'updateMany') return { count: 0 };
            }
          }

          try {
            return await modelTarget[methodName](...args);
          } catch (err: any) {
            if (isConnectionError(err)) {
              if (isPostgresAvailable) {
                isPostgresAvailable = false;
                console.warn(
                  '⚠️ PostgreSQL is not reachable locally. Seamlessly operating with integrated SAHAAY demo database.'
                );
              }
              if (fallbackModel && typeof fallbackModel[methodName] === 'function') {
                return fallbackModel[methodName](...args);
              }
              if (methodName === 'findMany') return [];
              if (methodName === 'findFirst' || methodName === 'findUnique') return null;
              if (methodName === 'count') return 0;
              if (methodName === 'create') return { id: `mock-${Date.now()}`, ...args[0]?.data, createdAt: new Date() };
              if (methodName === 'update') return { id: args[0]?.where?.id || `mock-${Date.now()}`, ...args[0]?.data, updatedAt: new Date() };
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
