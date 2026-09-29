import { prisma } from '../db';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

// Verified bcrypt hash for 'password123'
const DEFAULT_PASSWORD_HASH = '$2a$10$.2WLWTAp5Vx7wV6Fq9GgZexiva8uToe71SCfKTTV6tS54sFeC17km';

export async function autoSeedDatabase(): Promise<{ seeded: boolean; message: string }> {
  try {
    logger.info('🔍 Checking database demo accounts and records...');

    // 1. Check if demo user Geeta Singh exists
    const geetaExists = await prisma.user.findFirst({
      where: { email: 'geeta.singh@sahaay.demo' },
    });

    const citizenExists = await prisma.user.findFirst({
      where: { email: 'citizen@sahaay.demo' },
    });

    const officerExists = await prisma.user.findFirst({
      where: { email: 'officer@sahaay.demo' },
    });

    const adminExists = await prisma.user.findFirst({
      where: { email: 'admin@sahaay.demo' },
    });

    // 2. Ensure Project exists
    let project = await prisma.project.findFirst({
      where: { code: 'NH-46-EXP' },
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          name: 'NH-46 6-Laning Highway Expansion Project (Bhopal-Hoshangabad Corridor)',
          code: 'NH-46-EXP',
          description: 'Widening, strengthening, and 6-laning of National Highway 46 under PM GatiShakti National Master Plan.',
          department: 'National Highways Authority of India (NHAI)',
          status: 'ACTIVE',
          district: 'Bhopal',
          state: 'Madhya Pradesh',
          totalAreaHa: 148.5,
          budgetINR: 420000000.0,
          geometryGeoJson: JSON.stringify({
            type: 'Polygon',
            coordinates: [
              [
                [77.412, 23.258],
                [77.416, 23.259],
                [77.418, 23.264],
                [77.413, 23.263],
                [77.412, 23.258],
              ],
            ],
          }),
        },
      });
      logger.info('✅ Project NH-46-EXP created.');
    }

    // 3. Upsert / Ensure Rajesh Sharma (citizen@sahaay.demo)
    let citizen = citizenExists;
    if (!citizen) {
      citizen = await prisma.user.create({
        data: {
          email: 'citizen@sahaay.demo',
          passwordHash: DEFAULT_PASSWORD_HASH,
          name: 'Rajesh Sharma',
          role: 'CITIZEN',
          phone: '+91 98260 12345',
          profile: {
            create: {
              aadhaarMasked: 'XXXX-XXXX-8921',
              panNumber: 'ABCPS1234K',
              panDocumentUrl: '/storage/documents/pan_demo.jpg',
              panStatus: 'VERIFIED',
              selfieUrl: '/storage/documents/selfie_demo.jpg',
              faceMatchScore: 96.5,
              faceMatchStatus: 'VERIFIED',
              village: 'Rampur',
              tehsil: 'Huzur',
              district: 'Bhopal',
              state: 'Madhya Pradesh',
              preferredLanguage: 'en',
            },
          },
        },
      });
    } else if (citizen.name !== 'Rajesh Sharma') {
      await prisma.user.update({
        where: { id: citizen.id },
        data: {
          name: 'Rajesh Sharma',
          phone: '+91 98260 12345',
          passwordHash: DEFAULT_PASSWORD_HASH,
        },
      });
    }

    // 4. Ensure Geeta Singh (geeta.singh@sahaay.demo)
    let geeta = geetaExists;
    if (!geeta) {
      geeta = await prisma.user.create({
        data: {
          email: 'geeta.singh@sahaay.demo',
          passwordHash: DEFAULT_PASSWORD_HASH,
          name: 'Geeta Singh',
          role: 'CITIZEN',
          phone: '+91 94250 88712',
          profile: {
            create: {
              aadhaarMasked: 'XXXX-XXXX-4512',
              panNumber: 'BKLPS9821F',
              panStatus: 'VERIFIED',
              faceMatchScore: 94.2,
              faceMatchStatus: 'VERIFIED',
              village: 'Chandanpura',
              tehsil: 'Huzur',
              district: 'Bhopal',
              state: 'Madhya Pradesh',
              preferredLanguage: 'hi',
            },
          },
        },
      });
      logger.info('✅ Geeta Singh demo user created.');
    }

    // 5. Ensure Anita Chouhan (anita.chouhan@sahaay.demo)
    let anita = await prisma.user.findFirst({ where: { email: 'anita.chouhan@sahaay.demo' } });
    if (!anita) {
      anita = await prisma.user.create({
        data: {
          email: 'anita.chouhan@sahaay.demo',
          passwordHash: DEFAULT_PASSWORD_HASH,
          name: 'Anita Chouhan',
          role: 'CITIZEN',
          phone: '+91 98270 45612',
          profile: {
            create: {
              aadhaarMasked: 'XXXX-XXXX-7734',
              panNumber: 'CYZPC4412M',
              panStatus: 'VERIFIED',
              faceMatchScore: 97.1,
              faceMatchStatus: 'VERIFIED',
              village: 'Kolar Kalan',
              tehsil: 'Huzur',
              district: 'Bhopal',
              state: 'Madhya Pradesh',
              preferredLanguage: 'en',
            },
          },
        },
      });
      logger.info('✅ Anita Chouhan demo user created.');
    }

    // 6. Ensure Officer Vikram Chouhan (officer@sahaay.demo)
    let officer = officerExists;
    if (!officer) {
      officer = await prisma.user.create({
        data: {
          email: 'officer@sahaay.demo',
          passwordHash: DEFAULT_PASSWORD_HASH,
          name: 'Vikram Chouhan',
          role: 'OFFICER',
          phone: '+91 75524 56789',
          designation: 'Competent Authority & Land Acquisition Officer (CALAO)',
          department: 'Revenue & Disaster Management Dept, Govt of MP',
        },
      });
      logger.info('✅ Officer Vikram Chouhan created.');
    } else {
      await prisma.user.update({
        where: { id: officer.id },
        data: {
          name: 'Vikram Chouhan',
          role: 'OFFICER',
          designation: 'Competent Authority & Land Acquisition Officer (CALAO)',
          department: 'Revenue & Disaster Management Dept, Govt of MP',
          passwordHash: DEFAULT_PASSWORD_HASH,
        },
      });
    }

    // 7. Ensure System Admin (admin@sahaay.demo)
    if (!adminExists) {
      await prisma.user.create({
        data: {
          email: 'admin@sahaay.demo',
          passwordHash: DEFAULT_PASSWORD_HASH,
          name: 'System Administrator',
          role: 'ADMIN',
          phone: '+91 75524 99999',
          designation: 'Chief Technology Officer',
          department: 'Digital Governance & Revenue Systems',
        },
      });
      logger.info('✅ System Administrator created.');
    }

    // 8. Ensure Prajya account is configured properly
    const prajya = await prisma.user.findFirst({
      where: { email: 'prajya@gmail.com' },
      include: { profile: true },
    });

    if (prajya) {
      logger.info('Found Prajya user account, ensuring profile and access...');
      // Ensure Prajya has a profile
      if (!prajya.profile) {
        await prisma.citizenProfile.create({
          data: {
            userId: prajya.id,
            panNumber: 'ABCPS1234K',
            panStatus: 'VERIFIED',
            faceMatchScore: 96.5,
            faceMatchStatus: 'VERIFIED',
            village: 'Rampur',
            district: 'Bhopal',
            state: 'Madhya Pradesh',
          },
        });
      }
    }

    // 9. Ensure core land parcels exist
    const parcel1042 = await prisma.parcel.findFirst({ where: { surveyNumber: '1042' } });
    if (!parcel1042 && citizen) {
      await prisma.parcel.create({
        data: {
          ownerId: citizen.id,
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
        },
      });
    }

    const parcelGeeta = await prisma.parcel.findFirst({ where: { surveyNumber: '558/3' } });
    if (!parcelGeeta && geeta) {
      await prisma.parcel.create({
        data: {
          ownerId: geeta.id,
          surveyNumber: '558/3',
          khasraNumber: '558/3',
          village: 'Chandanpura',
          tehsil: 'Huzur',
          district: 'Bhopal',
          state: 'Madhya Pradesh',
          recordedAreaHa: 5.41,
          landType: 'Forest Buffer',
          currentStatus: 'Under Acquisition',
          centroidLat: 23.185,
          centroidLng: 77.382,
        },
      });
    }

    const parcelAnita = await prisma.parcel.findFirst({ where: { surveyNumber: '88/1' } });
    if (!parcelAnita && anita) {
      await prisma.parcel.create({
        data: {
          ownerId: anita.id,
          surveyNumber: '88/1',
          khasraNumber: '88/1',
          village: 'Kolar Kalan',
          tehsil: 'Huzur',
          district: 'Bhopal',
          state: 'Madhya Pradesh',
          recordedAreaHa: 3.2,
          landType: 'Residential Buffer',
          currentStatus: 'Under Acquisition',
          centroidLat: 23.172,
          centroidLng: 77.42,
        },
      });
    }

    logger.info('🎉 Auto-seed check completed successfully. All evaluator accounts are ready.');
    return { seeded: true, message: 'All demo and evaluation accounts verified.' };
  } catch (err: any) {
    logger.error('Error during auto-seed verification:', { err: err?.message || err });
    return { seeded: false, message: err?.message || 'Auto-seed failed' };
  }
}
