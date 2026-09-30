import { Request, Response, NextFunction } from 'express';
import { getAIService } from '../ai';
import { prisma } from '../db';

export async function directExtractDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const ai = getAIService();
    const { rawText, filename = 'Notice.pdf' } = req.body;

    const extracted = await ai.extractDocument('', 'application/pdf', filename);

    return res.json({
      success: true,
      data: extracted,
    });
  } catch (err) {
    next(err);
  }
}

export async function explainDocumentText(req: Request, res: Response, next: NextFunction) {
  try {
    const ai = getAIService();
    const { rawText, docType = 'ACQUISITION_NOTICE', language = 'en' } = req.body;

    const explanation = await ai.explainDocument(rawText || '', docType, language);

    return res.json({
      success: true,
      data: { explanation },
    });
  } catch (err) {
    next(err);
  }
}

export async function explainDocumentStreamApi(req: Request, res: Response, next: NextFunction) {
  try {
    const ai = getAIService();
    const { rawText, docType = 'ACQUISITION_NOTICE', language = 'en' } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    if (ai.explainDocumentStream) {
      await ai.explainDocumentStream(rawText || '', docType, language, (chunk: string) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      });
    } else {
      const full = await ai.explainDocument(rawText || '', docType, language);
      res.write(`data: ${JSON.stringify({ chunk: full })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    next(err);
  }
}

export async function detectDiscrepancyApi(req: Request, res: Response, next: NextFunction) {
  try {
    const ai = getAIService();
    const { extractedData, parcelId, surveyNumber } = req.body;

    let parcel = null;
    if (parcelId) {
      parcel = await prisma.parcel.findUnique({ where: { id: parcelId } });
    } else if (surveyNumber) {
      parcel = await prisma.parcel.findFirst({ where: { surveyNumber } });
    }

    if (!parcel) {
      return res.status(404).json({
        success: false,
        message: 'Parcel record not found for comparison',
      });
    }

    const result = await ai.detectDiscrepancies(extractedData, {
      surveyNumber: parcel.surveyNumber,
      village: parcel.village,
      district: parcel.district,
      recordedAreaHa: parcel.recordedAreaHa,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
