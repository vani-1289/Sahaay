import { IAIService } from './ai.interface';
import { MockAIService } from './mock.service';
import { OpenAIService } from './openai.service';
import { OcrAIService } from './ocr.service';
import { IFaceVerificationService } from './face.interface';
import { MockFaceVerificationService } from './mockFace.service';

let aiInstance: IAIService | null = null;
let faceVerificationInstance: IFaceVerificationService | null = null;

export function getAIService(): IAIService {
  if (!aiInstance) {
    const provider = process.env.AI_PROVIDER?.toLowerCase() || '';
    if (process.env.NVIDIA_API_KEY || provider === 'nvidia') {
      aiInstance = new OpenAIService(process.env.NVIDIA_API_KEY);
    } else if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      aiInstance = new OpenAIService(process.env.OPENAI_API_KEY);
    } else if (provider === 'ocr') {
      aiInstance = new OcrAIService();
    } else {
      aiInstance = new OpenAIService();
    }
  }
  return aiInstance;
}

export function getFaceVerificationService(): IFaceVerificationService {
  if (!faceVerificationInstance) {
    // Pluggable biometric verification provider
    faceVerificationInstance = new MockFaceVerificationService();
  }
  return faceVerificationInstance;
}

export * from './ai.interface';
export * from './face.interface';
export * from './ocr.service';
export * from './mock.service';
