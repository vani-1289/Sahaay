import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

import { getAIService, OcrAIService } from '../ai';
import { prisma } from '../db';
import { getStorageService, LocalStorageService, S3StorageService } from '../storage';
import { apiLimiter, authLimiter } from '../middleware/rateLimiter';

async function runTests() {
  console.log('🧪 Starting SAHAAY Automated End-to-End Test Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
    }
  }

  try {
    // 1. Database Connectivity & Demo Seed Verification
    console.log('1. Database & Demo Seed Checks:');
    const citizen = await prisma.user.findUnique({
      where: { email: 'citizen@sahaay.demo' },
      include: { profile: true },
    });
    assert(citizen !== null, 'Citizen user exists in database');
    assert(citizen?.name === 'Rajesh Sharma', 'Primary demo citizen is Rajesh Sharma');

    const officer = await prisma.user.findUnique({
      where: { email: 'officer@sahaay.demo' },
    });
    assert(officer !== null && officer.role === 'OFFICER', 'Land Officer user exists with ROLE=OFFICER');

    // 2. Parcel & Case Retrieval
    console.log('\n2. Cadastral Parcel & Acquisition Case:');
    const parcel1042 = await prisma.parcel.findFirst({
      where: { surveyNumber: '1042' },
      include: { cases: { include: { project: true, compensationRecord: true } } },
    });
    assert(parcel1042 !== null, 'Primary parcel #1042 found');
    assert(parcel1042?.recordedAreaHa === 2.43, 'Primary parcel recorded area is 2.43 ha');
    assert((parcel1042?.cases?.length ?? 0) > 0, 'Acquisition case linked to parcel #1042');

    const acqCase = parcel1042?.cases[0];
    assert(acqCase?.caseReference === 'ACQ-2026-MP-1042', 'Case reference is ACQ-2026-MP-1042');
    assert(acqCase?.stage === 'VERIFICATION', 'Acquisition stage is VERIFICATION');
    const assessedCompensation = acqCase?.compensationRecord?.totalAssessedINR ?? acqCase?.estimatedCompensationINR;
    assert(assessedCompensation === 3840000.0, 'Total assessed compensation is ₹38,40,000');

    // 3. AI Document Intelligence & Extraction
    console.log('\n3. AI Extraction & OCR Pipeline:');
    const ai = getAIService();
    const extractedNotice = await ai.extractDocument('', 'application/pdf', 'Gazette_Notice_Sec11_Survey1042.pdf');
    assert(extractedNotice.surveyNumber === '1042', 'Extracted survey number is 1042');
    assert(extractedNotice.areaHa === 2.73, 'Extracted notice area is 2.73 ha');
    assert(Boolean(extractedNotice.notificationSection?.includes('Section 11(1)')), 'Extracted section is Section 11(1)');

    // 4. Discrepancy Detection Engine
    console.log('\n4. Discrepancy Detection:');
    const discrepancy = await ai.detectDiscrepancies(extractedNotice, {
      surveyNumber: parcel1042?.surveyNumber,
      village: parcel1042?.village,
      district: parcel1042?.district,
      recordedAreaHa: parcel1042?.recordedAreaHa,
    });
    assert(discrepancy.hasDiscrepancy === true, 'Discrepancy detected between notice and database');
    assert(discrepancy.discrepancies.some(d => d.field === 'area'), 'Area mismatch discrepancy identified');
    assert(discrepancy.discrepancies[0].documentValue === '2.73 ha', 'Document area identified as 2.73 ha');
    assert(discrepancy.discrepancies[0].recordedValue === '2.43 ha', 'Recorded area identified as 2.43 ha');

    // 5. Citizen Grievance Workflow:
    console.log('\n5. Citizen Grievance Workflow:');
    const newRef = `GR-TEST-${Date.now()}`;
    const grievance = await prisma.grievance.create({
      data: {
        referenceNumber: newRef,
        citizenId: citizen!.id,
        caseId: acqCase!.id,
        parcelId: parcel1042!.id,
        category: 'WRONG_AREA',
        title: 'Area Discrepancy for Survey 1042 Test',
        description: 'Notice states 2.73 ha but revenue record is 2.43 ha.',
        status: 'SUBMITTED',
      },
    });
    assert(grievance !== null, 'Grievance record created with reference code');
    assert(grievance.status === 'SUBMITTED', 'Grievance initial status is SUBMITTED');

    // 6. Officer Resolution & Notification Workflow
    console.log('\n6. Officer Redressal & Notification:');
    let updatedGrievance: any;
    try {
      updatedGrievance = await prisma.grievance.update({
        where: { id: grievance.id },
        data: {
          status: 'RESOLVED',
          officerResponse: 'Field survey completed. Area verified as 2.43 ha and corrigendum published.',
          reviewedBy: 'Vikram Chouhan (LAO)',
          resolvedAt: new Date(),
        },
      });
    } catch {
      updatedGrievance = await prisma.grievance.update({
        where: { referenceNumber: grievance.referenceNumber || newRef },
        data: {
          status: 'RESOLVED',
          officerResponse: 'Field survey completed. Area verified as 2.43 ha and corrigendum published.',
          reviewedBy: 'Vikram Chouhan (LAO)',
          resolvedAt: new Date(),
        },
      });
    }
    assert(updatedGrievance.status === 'RESOLVED', 'Officer updated grievance status to RESOLVED');
    assert(updatedGrievance.officerResponse !== null, 'Officer response attached to grievance');

    // 7. PAN Card Verification Pipeline
    console.log('\n7. PAN Card Verification:');
    const { getFaceVerificationService } = await import('../ai');
    const faceService = getFaceVerificationService();
    const validPanCheck = await faceService.validatePan('ABCPS1234K');
    assert(validPanCheck.valid === true, 'Valid PAN format correctly recognized (ABCPS1234K)');
    assert(validPanCheck.entityType === 'Individual (Person)', '4th character P identified as Individual (Person)');

    const invalidPanCheck = await faceService.validatePan('INVALID123');
    assert(invalidPanCheck.valid === false, 'Invalid PAN format rejected');

    // 8. Biometric Face Match & Identity Status
    console.log('\n8. Biometric Face Match & Identity Status:');
    const faceMatch = await faceService.verifyFaceMatch(
      '/storage/documents/pan_demo.jpg',
      '/storage/documents/selfie_demo.jpg',
      { panNumber: 'ABCPS1234K' }
    );
    assert(faceMatch.status === 'VERIFIED', 'Face verification status is VERIFIED');
    assert(faceMatch.matchScore >= 80, `Biometric match score is above threshold (${faceMatch.matchScore}%)`);
    assert(faceMatch.panFaceDetected === true, 'Face successfully detected in PAN document');
    assert(faceMatch.selfieFaceDetected === true, 'Face successfully detected in Selfie photo');

    // 9. Role-Based Authorization & Session Security
    console.log('\n9. Role-Based Authorization & JWT Session Security:');
    const { generateToken } = await import('../utils/jwt');
    const { requireRole } = await import('../middleware/auth');

    const citizenToken = generateToken({
      userId: citizen!.id,
      email: citizen!.email,
      role: 'CITIZEN',
      name: citizen!.name,
    });
    assert(Boolean(citizenToken), 'JWT token generated for Citizen role');

    const officerToken = generateToken({
      userId: officer!.id,
      email: officer!.email,
      role: 'OFFICER',
      name: officer!.name,
    });
    assert(Boolean(officerToken), 'JWT token generated for Officer role');

    // Test requireRole middleware behavior
    const citizenReq: any = { user: { role: 'CITIZEN' } };
    const officerReq: any = { user: { role: 'OFFICER' } };
    let officerRoutePassed = false;
    let citizenBlockedOnOfficerRoute = false;

    const officerGuard = requireRole('OFFICER', 'ADMIN');
    officerGuard(officerReq, {} as any, () => {
      officerRoutePassed = true;
    });
    assert(Boolean(officerRoutePassed), 'Officer is authorized for Officer routes');

    officerGuard(citizenReq, {} as any, (err?: any) => {
      if (err && err.statusCode === 403) {
        citizenBlockedOnOfficerRoute = true;
      }
    });
    assert(Boolean(citizenBlockedOnOfficerRoute), 'Citizen is rejected with 403 Forbidden on Officer routes');

    // 10. Real OCR & Bilingual Document Parsing Engine
    console.log('\n10. Real OCR & Regex Land Record Extraction Engine:');
    const ocrService = new OcrAIService();
    const parsedNoticeText = ocrService.parseDocumentText(
      `GOVERNMENT OF MADHYA PRADESH - REVENUE DEPARTMENT\n` +
      `NOTIFICATION UNDER SECTION 11(1) OF RFCTLARR ACT, 2013\n` +
      `Case Ref: ACQ-2026-MP-1042 | Project: National Highway 46 (NH-46-EXP)\n` +
      `District: Bhopal | Tehsil: Huzur | Village: Rampur | Survey No: 1042\n` +
      `Notified Area: 2.73 Hectares | Owner: Rajesh Sharma`
    );
    assert(parsedNoticeText.surveyNumber === '1042', 'OCR Regex parsed Survey #1042');
    assert(parsedNoticeText.village === 'Rampur', 'OCR Regex parsed Village Rampur');
    assert(parsedNoticeText.district === 'Bhopal', 'OCR Regex parsed District Bhopal');
    assert(parsedNoticeText.areaHa === 2.73, 'OCR Regex parsed Area as 2.73 ha');
    assert(parsedNoticeText.notificationSection?.includes('11(1)') === true, 'OCR Regex identified Section 11(1)');

    const parsedHindiText = ocrService.parseDocumentText(
      `मध्य प्रदेश शासन - राजस्व विभाग अधिसूचना धारा 11(1)\n` +
      `सर्वे नं: 1042, ग्राम: Rampur, जिला: Bhopal, रकबा: 2.73 हेक्टेयर`
    );
    assert(parsedHindiText.surveyNumber === '1042', 'Hindi land notice: extracted Survey No. 1042');
    assert(parsedHindiText.areaHa === 2.73, 'Hindi land notice: extracted 2.73 हेक्टेयर');

    // 11. Cloud Storage Layer (S3 / R2 / Supabase Storage Support)
    console.log('\n11. Pluggable Cloud Storage Provider:');
    const storageService = getStorageService();
    assert(storageService !== null, 'Storage service instantiated successfully');
    assert(
      storageService instanceof LocalStorageService || storageService instanceof S3StorageService,
      'Storage service implements IStorageService interface'
    );

    // 12. Rate Limiting Middleware
    console.log('\n12. API & Auth Rate Limiting:');
    assert(typeof apiLimiter === 'function', 'General API rate limiter middleware initialized');
    assert(typeof authLimiter === 'function', 'Auth strict rate limiter middleware initialized');

    console.log('\n=======================================================');
    console.log(`🏁 TEST RESULTS: ${passed}/${total} checks passed!`);
    console.log('=======================================================\n');

    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
