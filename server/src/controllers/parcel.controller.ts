import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export async function searchParcels(req: Request, res: Response, next: NextFunction) {
  try {
    const q = ((req.query.q as string) || '').trim();
    const survey = ((req.query.survey as string) || '').trim();
    const village = ((req.query.village as string) || '').trim();
    const district = ((req.query.district as string) || '').trim();
    const scopeAll = req.query.all === 'true';

    const whereClause: any = {};

    const andConditions: any[] = [];

    // Strict role-based scoping:
    // If authenticated user is CITIZEN (land owner), restrict view to only their own registered parcel(s)
    const isCitizen = req.user && req.user.role === 'CITIZEN';
    const isOfficer = req.user && (req.user.role === 'OFFICER' || req.user.role === 'ADMIN');

    if (isCitizen && !scopeAll) {
      andConditions.push({
        OR: [
          { ownerId: req.user!.userId },
          {
            cases: {
              some: {
                citizenId: req.user!.userId,
              },
            },
          },
        ],
      });
    }

    if (survey) {
      andConditions.push({
        OR: [
          { surveyNumber: { contains: survey } },
          { khasraNumber: { contains: survey } },
        ],
      });
    }
    if (village) {
      andConditions.push({ village: { contains: village } });
    }
    if (district) {
      andConditions.push({ district: { contains: district } });
    }

    if (q) {
      andConditions.push({
        OR: [
          { surveyNumber: { contains: q } },
          { khasraNumber: { contains: q } },
          { village: { contains: q } },
          { district: { contains: q } },
          {
            cases: {
              some: {
                OR: [
                  { caseReference: { contains: q } },
                  { project: { name: { contains: q } } },
                ],
              },
            },
          },
        ],
      });
    }

    const whereClause: any = andConditions.length > 0 ? { AND: andConditions } : {};

    const parcels = await prisma.parcel.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        cases: {
          include: {
            project: true,
            citizen: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
      take: 50,
    });

    return res.json({
      success: true,
      count: parcels.length,
      userRole: req.user?.role || 'PUBLIC',
      isOwnerScoped: Boolean(isCitizen && !scopeAll),
      data: parcels,
    });
  } catch (err) {
    next(err);
  }
}

export async function getParcelById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const parcel = await prisma.parcel.findFirst({
      where: {
        OR: [
          { id },
          { surveyNumber: id },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        cases: {
          include: {
            project: true,
            compensationRecord: true,
            rrRecord: true,
            citizen: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        documents: true,
        grievances: true,
      },
    });

    if (!parcel) {
      throw new NotFoundError(`Parcel '${id}' not found`, 'PARCEL_NOT_FOUND');
    }

    // Role-based protection: Citizens can only inspect their own parcels
    if (req.user && req.user.role === 'CITIZEN') {
      const isOwner =
        parcel.ownerId === req.user!.userId ||
        parcel.cases.some((c: any) => c.citizen?.id === req.user!.userId || c.citizenId === req.user!.userId);
      if (!isOwner) {
        throw new ForbiddenError(
          'Access Restricted: As a registered land owner, you are only authorized to view details of your own land parcel. Officer authorization is required to access other records.',
          'OWNER_ACCESS_ONLY'
        );
      }
    }

    return res.json({
      success: true,
      data: parcel,
    });
  } catch (err) {
    next(err);
  }
}

export async function getParcelCases(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const cases = await prisma.acquisitionCase.findMany({
      where: {
        OR: [
          { parcelId: id },
          { parcel: { surveyNumber: id } },
        ],
      },
      include: {
        parcel: true,
        project: true,
        events: true,
      },
    });

    return res.json({
      success: true,
      data: cases,
    });
  } catch (err) {
    next(err);
  }
}

export async function interactWithParcel(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { status, action } = req.body || {};

    const parcel = await prisma.parcel.findFirst({
      where: {
        OR: [{ id }, { surveyNumber: id }],
      },
    });

    if (!parcel) {
      throw new NotFoundError(`Parcel '${id}' not found`, 'PARCEL_NOT_FOUND');
    }

    const updateData: any = { updatedAt: new Date() };
    if (status) {
      updateData.currentStatus = status;
    }

    const updated = await prisma.parcel.update({
      where: { id: parcel.id },
      data: updateData,
    });

    // Also record audit log in database
    await prisma.auditLog.create({
      data: {
        action: action || 'PARCEL_INTERACTION',
        entityType: 'Parcel',
        entityId: parcel.id,
        userId: req.user?.userId || null,
        details: JSON.stringify({
          surveyNumber: parcel.surveyNumber,
          village: parcel.village,
          status: updated?.currentStatus || parcel.currentStatus,
          timestamp: new Date().toISOString(),
        }),
        ipAddress: req.ip || null,
      },
    });

    return res.json({
      success: true,
      message: 'Database updated for parcel interaction',
      data: updated || parcel,
    });
  } catch (err) {
    next(err);
  }
}

