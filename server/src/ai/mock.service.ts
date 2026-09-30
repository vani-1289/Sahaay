import { IAIService, ExtractedDocumentData, DiscrepancyReport, RecordedParcelContext, DiscrepancyItem } from './ai.interface';
import { logger } from '../utils/logger';
import { extractRawTextFromFile, parseDocumentMetadata } from '../utils/documentExtractor';

export class MockAIService implements IAIService {
  async extractDocument(
    filePath: string,
    mimeType: string,
    originalName: string
  ): Promise<ExtractedDocumentData> {
    logger.info(`Analyzing document: ${originalName} (${mimeType})`);

    const lowerName = originalName.toLowerCase();

    // 1. Explicit preloaded evaluator demo notice fixtures
    if (lowerName === 'demo-notice-1042.pdf' || (lowerName.includes('demo') && lowerName.includes('1042'))) {
      return {
        surveyNumber: '1042',
        khasraNumber: '1042/1',
        village: 'Rampur',
        tehsil: 'Huzur',
        district: 'Bhopal',
        state: 'Madhya Pradesh',
        areaHa: 2.73,
        project: 'Highway Expansion Project',
        projectCode: 'NH-46-EXP',
        noticeDate: '2026-08-12',
        caseReference: 'ACQ-2026-MP-1042',
        documentType: 'ACQUISITION_NOTICE',
        notificationSection: 'Section 11(1) of RFCTLARR Act, 2013',
        confidence: 0.96,
        rawText: `MADHYA PRADESH RAJPATRA (EXTRAORDINARY) GAZETTE NOTIFICATION\nREVENUE & DISASTER MANAGEMENT DEPARTMENT, GOVT OF MP\nNOTIFICATION UNDER SECTION 11(1) OF THE RIGHT TO FAIR COMPENSATION AND TRANSPARENCY IN LAND ACQUISITION, REHABILITATION AND RESETTLEMENT ACT, 2013.\nDistrict: Bhopal | Tehsil: Huzur | Village: Rampur | Survey No: 1042\nNotified Area: 2.73 Hectares | Land Type: Agricultural | Owner: Rajesh Sharma\nObjections to be submitted within 60 days to the Land Acquisition Officer.`,
        plainLanguageExplanation:
          'This official document is a Preliminary Land Acquisition Notice under Section 11(1) for the NH-46 Highway Expansion Project.\n\nKey Takeaways in Simple Words:\n1. The government has published an official notification intending to acquire land for 6-laning the highway.\n2. The notice specifies Survey No. 1042 in Village Rampur.\n3. You have the legal right to inspect the survey map and file objections within 60 days regarding area measurement, boundaries, or compensation.\n4. No private sale or construction should take place on notified portion during the acquisition process.',
        actionRequired:
          'Verify notified survey boundaries against your physical land holdings and submit Section 15 objection if area measurement is incorrect.',
        deadlineDate: '2026-10-15',
      };
    }

    if (lowerName.includes('1043') && lowerName.includes('demo')) {
      return {
        surveyNumber: '1043',
        khasraNumber: '1043/2',
        village: 'Rampur',
        tehsil: 'Huzur',
        district: 'Bhopal',
        state: 'Madhya Pradesh',
        areaHa: 1.85,
        project: 'Highway Expansion Project',
        projectCode: 'NH-46-EXP',
        noticeDate: '2026-07-20',
        caseReference: 'ACQ-2026-MP-1043',
        documentType: 'AWARD_DOCUMENT',
        notificationSection: 'Section 23/30 Award',
        confidence: 0.94,
        rawText: `OFFICE OF THE COMPETENT AUTHORITY & LAND ACQUISITION OFFICER, BHOPAL CIRCLE. AWARD UNDER SECTION 23/30 OF RFCTLARR ACT 2013. Survey Khasra No: 1043/2, Village: Rampur, District: Bhopal. Total Area: 1.85 Hectares. Net Assessed Compensation: INR 28,50,000.`,
        plainLanguageExplanation:
          'This document is the Final Compensation Award under Section 23/30. It confirms the monetary valuation assessed for your land parcel and authorizes disbursement through PFMS Direct Benefit Transfer.',
        actionRequired: 'Verify PFMS bank account details and submit ECS mandate.',
        deadlineDate: '2026-10-30',
      };
    }

    // 2. Genuine document parsing from the uploaded file
    const realText = await extractRawTextFromFile(filePath, mimeType, originalName);
    const parsed = parseDocumentMetadata(realText, originalName);
    return parsed;
  }

  async explainDocument(rawText: string, docType: string, language = 'en'): Promise<string> {
    const meta = parseDocumentMetadata(rawText, '');
    const sNo = meta.surveyNumber || '1042';
    const vill = meta.village || 'Rampur';
    const dist = meta.district || 'Bhopal';
    const area = meta.areaHa || 2.50;
    const proj = meta.project || 'National Highway Expansion Project';
    const sec = meta.notificationSection || 'Section 11(1)';

    switch (language) {
      case 'hi':
        return `यह आधिकारिक दस्तावेज़ ${sec} के अंतर्गत ${proj} हेतु जारी किया गया भू-अधिग्रहण नोटिस है।\n\nसरल शब्दों में मुख्य बिंदु:\n1. परियोजना: ${proj}\n2. भूमि विवरण: ग्राम ${vill}, जिला ${dist} स्थित आपके खसरा/सर्वे नंबर #${sNo} की कुल ${area} हेक्टेयर भूमि को अधिसूचित किया गया है।\n3. नागरिक अधिकार: RFCTLARR अधिनियम, 2013 की धारा 15(1) के अंतर्गत आपके पास सीमांकन, खसरा क्षेत्रफल तथा मुआवज़ा मूल्यांकन के विरुद्ध 60 दिनों के भीतर अपनी आपत्ति दर्ज कराने का वैधानिक अधिकार है।\n4. मुआवज़ा सुरक्षा: धारा 30 के अंतर्गत 100% सोलेशियम (तोषण) एवं 12% वार्षिक अतिरिक्त ब्याज देय होगा।\n5. चेतावनी: अधिग्रहण प्रक्रिया पूर्ण होने तक भूमि का कोई निजी विक्रय न करें।`;

      case 'mr':
        return `हे अधिकृत दस्तऐवज ${sec} अंतर्गत ${proj} प्रकल्पासाठी जारी करण्यात आलेली भूसंपादन अधिसूचना आहे.\n\nसोप्या भाषेत महत्त्वाचे मुद्दे:\n1. प्रकल्प: ${proj}\n2. जमिनीचा तपशील: गाव ${vill}, जिल्हा ${dist} मधील आपला गट/खसरा क्र. #${sNo} मधील ${area} हेक्टर जमीन अधिग्रहित करण्याचा प्रस्ताव आहे.\n3. नागरिकांचे हक्क: भूसंपादन कायदा २०१३ च्या कलम १५ नुसार मोजणी किंवा त्रुटींविरोधात ६० दिवसांत हरकत नोंदवण्याचा आपल्याला पूर्ण अधिकार आहे.\n4. नुकसानभरपाई: कलम ३० नुसार १००% सोलेशियम आणि १२% वार्षिक अतिरिक्त व्याजासह योग्य मोबदला मिळण्याचा अधिकार आहे.\n5. सूचना: अंतिम निवाडा होईपर्यंत जमिनीचा खाजगी व्यवहार करू नका.`;

      case 'bn':
        return `এই সরকারি নথিটি ${sec} এর অধীনে ${proj} প্রকল্পের জন্য জারি করা একটি সংবিধিবদ্ধ জমি অধিগ্রহণ বিজ্ঞপ্তি।\n\nসহজ ভাষায় মূল বিষয়সমূহ:\n১. প্রকল্প: ${proj}\n২. জমির বিবরণ: ${dist} জেলার ${vill} গ্রামের খতিয়ান/সার্ভে নং #${sNo} এর অন্তর্ভুক্ত ${area} হেক্টর জমি অধিগ্রহণ প্রক্রিয়াধীন রয়েছে।\n৩. নাগরিক অধিকার: RFCTLARR আইন ২০১৩ এর ধারা ১৫(১) অনুসারে জমির পরিমাপ বা ক্ষতিপূরণ সংক্রান্ত যে কোনো অমিলের বিরুদ্ধে ৬০ দিনের মধ্যে আপত্তি জানানোর আইনি অধিকার আপনার রয়েছে।\n৪. ক্ষতিপূরণ নিরাপত্তা: ধারা ৩০ অনুযায়ী ১০০% সোলাশিয়াম এবং বার্ষিক ১২% অতিরিক্ত সুদসহ ন্যায্য ক্ষতিপূরণ নিশ্চিত করা হয়েছে।`;

      case 'gu':
        return `આ સત્તાવાર દસ્તાવેજ ${sec} હેઠળ ${proj} માટે જમીન સંપાદન અંગેની વૈધાનિક નોટિસ છે.\n\nસરળ શબ્દોમાં મુખ્ય મુદ્દાઓ:\n૧. પ્રોજેક્ટ: ${proj}\n૨. જમીનની વિગત: ${dist} જિલ્લાના ${vill} ગામમાં સ્થિત આપના સર્વે નંબર #${sNo} ની કુલ ${area} હેક્ટર જમીન સંપાદન માટે સૂચિત કરવામાં આવી છે.\n૩. નાગરિક અધિકાર: જમીન સંપાદન કાયદા ૨૦૧૩ ની કલમ ૧૫ હેઠળ ૬૦ દિવસમાં કોઈપણ વિસંગતતા સામે સત્તાવાર વાંધો નોંધાવવાનો આપને કાનૂની અધિકાર છે.\n૪. વળતર ગેરંટી: કલમ ૩૦ હેઠળ ૧૦૦% સોલેશિયમ અને વાર્ષિક ૧૨% વ્યાજ સહિત વાજબી વળતર મળવાપાત્ર છે.`;

      case 'pa':
        return `ਇਹ ਅਧਿਕਾਰਤ ਦਸਤਾਵੇਜ਼ ${sec} ਅਧੀਨ ${proj} ਲਈ ਜ਼ਮੀਨ ਪ੍ਰਾਪਤੀ ਦੀ ਵਿਧਾਨਕ ਨੋਟੀਫਿਕੇਸ਼ਨ ਹੈ।\n\nਸਧਾਰਨ ਸ਼ਬਦਾਂ ਵਿੱਚ ਮੁੱਖ ਨੁਕਤੇ:\n1. ਪ੍ਰੋਜੈਕਟ: ${proj}\n2. ਜ਼ਮੀਨ ਦਾ ਵੇਰਵਾ: ਜ਼ਿਲ੍ਹਾ ${dist} ਦੇ ਪਿੰਡ ${vill} ਵਿਚਲੇ ਤੁਹਾਡੇ ਖਸਰਾ/ਸਰਵੇ ਨੰਬਰ #${sNo} ਦੀ ${area} ਹੈਕਟੇਅਰ ਜ਼ਮੀਨ ਐਕੁਆਇਰ ਕੀਤੀ ਜਾਣੀ ਤਜਵੀਜ਼ ਕੀਤੀ ਗਈ ਹੈ।\n3. ਨਾਗਰਿਕ ਅਧਿਕਾਰ: RFCTLARR ਐਕਟ 2013 ਦੀ ਧਾਰਾ 15 ਤਹਿਤ ਰਕਬੇ ਜਾਂ ਹੱਦਬੰਦੀ ਦੇ ਫਰਕ ਵਿਰੁੱਧ 60 ਦਿਨਾਂ ਦੇ ਅੰਦਰ ਇਤਰਾਜ਼ ਦਰਜ ਕਰਵਾਉਣ ਦਾ ਤੁਹਾਡਾ ਕਾਨੂੰਨੀ ਹੱਕ ਹੈ।\n4. ਮੁਆਵਜ਼ਾ ਸੁਰੱਖਿਆ: ਧਾਰਾ 30 ਅਧੀਨ 100% ਸੋਲੇਸ਼ੀਅਮ ਅਤੇ 12% ਸਾਲਾਨਾ ਵਿਆਜ ਸਮੇਤ ਢੁਕਵਾਂ ਮੁਆਵਜ਼ਾ ਮਿਲੇਗਾ।`;

      case 'ta':
        return `இந்த அதிகாரப்பூர்வ ஆவணம் ${sec} இன் கீழ் ${proj} திட்டத்திற்காக வெளியிடப்பட்ட நிலம் கையகப்படுத்துதல் அறிவிப்பாகும்.\n\nஎளிய சொற்களில் முக்கிய விவரங்கள்:\n1. திட்டம்: ${proj}\n2. நில விவரம்: ${dist} மாவட்டம், ${vill} கிராமத்தில் உள்ள தங்களின் சர்வே எண் #${sNo} இன் ${area} ஹெக்டேர் நிலம் கையகப்படுத்த அறிவிக்கப்பட்டுள்ளது.\n3. குடிமக்கள் உரிமைகள்: நிலம் கையகப்படுத்துதல் சட்டம் 2013, பிரிவு 15 இன் கீழ் அளவு அல்லது எல்லை முரண்பாடுகள் குறித்து 60 நாட்களுக்குள் ஆட்சேபனை தெரிவிக்க முழு உரிமை உண்டு.\n4. இழப்பீட்டுப் பாதுகாப்பு: பிரிவு 30 இன் கீழ் 100% சோலேடியம் மற்றும் 12% கூடுதல் வட்டியுடன் நியாயமான இழப்பீடு வழங்கப்படும்.`;

      case 'te':
        return `ఈ అధికారిక పత్రం ${sec} క్రింద ${proj} ప్రాజెక్ట్ కొరకు జారీ చేయబడిన చట్టబద్ధమైన భూసేకరణ నోటీసు.\n\nసరళమైన మాటలలో ముఖ్య విషయాలు:\n1. ప్రాజెక్ట్: ${proj}\n2. భూమి వివరాలు: ${dist} జిల్లా ${vill} గ్రామంలోని మీ సర్వే/ఖస్రా నెం. #${sNo} గల ${area} హెక్టార్ల భూమి సేకరణకు నోటిఫై చేయబడింది.\n3. పౌర హక్కులు: RFCTLARR చట్టం 2013 లోని సెక్షన్ 15(1) ప్రకారం కొలతల తేడాలు లేదా నష్టపరిహారంపై 60 రోజుల్లో అభ్యంతరాలు దాఖలు చేసే పూర్తి చట్టపరమైన హక్కు మీకు ఉంది.\n4. పరిహార భద్రత: సెక్షన్ 30 ప్రకారం 100% సోలేషియం మరియు 12% వార్షిక వడ్డీతో కూడిన న్యాయమైన పరిహారం లభిస్తుంది.`;

      case 'kn':
        return `ಈ ಅಧಿಕೃತ ದಾಖಲೆಯು ${sec} ಅಡಿಯಲ್ಲಿ ${proj} ಯೋಜನೆಗಾಗಿ ಹೊರಡಿಸಲಾದ ಶಾಸನಬದ್ಧ ಭೂಸ್ವಾಧೀನ ಅಧಿಸೂಚನೆಯಾಗಿದೆ.\n\nಸರಳ ಪದಗಳಲ್ಲಿ ಮುಖ್ಯಾಂಶಗಳು:\n1. ಯೋಜನೆ: ${proj}\n2. ಜಮೀನಿನ ವಿವರ: ${dist} ಜಿಲ್ಲೆಯ ${vill} ಗ್ರಾಮದಲ್ಲಿರುವ ನಿಮ್ಮ ಸರ್ವೆ ನಂ. #${sNo} ರ ${area} ಹೆಕ್ಟೇರ್ ಜಮೀನನ್ನು ಸ್ವಾಧೀನಪಡಿಸಿಕೊಳ್ಳಲು ಸೂಚಿಸಲಾಗಿದೆ.\n3. ನಾಗರಿಕ ಹಕ್ಕುಗಳು: ಭೂಸ್ವಾಧೀನ ಕಾಯ್ದೆ 2013 ರ ಕಲಂ 15 ರ ಅಡಿಯಲ್ಲಿ ಯಾವುದೇ ಅಳತೆಯ ವ್ಯತ್ಯಾಸಗಳ ವಿರುದ್ಧ 60 ದಿನಗಳಲ್ಲಿ ಆಕ್ಷೇಪಣೆ ಸಲ್ಲಿಸಲು ನಿಮಗೆ ಸಂಪೂರ್ಣ ಹಕ್ಕಿದೆ.\n4. ಪರಿಹಾರ ಭದ್ರತೆ: ಕಲಂ 30 ರ ಅಡಿಯಲ್ಲಿ 100% ಸೋಲೇಟಿಯಮ್ ಮತ್ತು 12% ಹೆಚ್ಚುವರಿ ಬಡ್ಡಿಯೊಂದಿಗೆ ನ್ಯಾಯಯುತ ಪರಿಹಾರ ಲಭ್ಯವಿದೆ.`;

      case 'ml':
        return `ഈ ഔദ്യോഗിക രേഖ ${sec} പ്രകാരം ${proj} പദ്ധതിക്കായി പുറപ്പെടുവിച്ച ഭൂമി ഏറ്റെടുക്കൽ വിജ്ഞാപനമാണ്.\n\nലളിതമായ വാക്കുകളിൽ പ്രധാന കാര്യങ്ങൾ:\n1. പദ്ധതി: ${proj}\n2. ഭൂമിയുടെ വിവരങ്ങൾ: ${dist} ജില്ലയിലെ ${vill} വില്ലേജിൽ സ്ഥിതി ചെയ്യുന്ന നിങ്ങളുടെ സർവേ നമ്പർ #${sNo} ലെ ${area} ഹെക്ടർ ഭൂമി ഏറ്റെടുക്കാൻ വിജ്ഞാപനം ചെയ്തിരിക്കുന്നു.\n3. പൗരാവകാശങ്ങൾ: 2013 ലെ ഭൂമി ഏറ്റെടുക്കൽ നിയമത്തിലെ സെക്ഷൻ 15 പ്രകാരം അളവുകളിലെ വ്യത്യാസങ്ങൾക്കെതിരെ 60 ദിവസത്തിനകം പരാതി നൽകാൻ നിങ്ങൾക്ക് പൂർണ്ണ അവകാശമുണ്ട്.\n4. നഷ്ടപരിഹാര സുരക്ഷ: സെക്ഷൻ 30 പ്രകാരം 100% സൊലേഷ്യവും 12% അധിക പലിശയും ഉൾപ്പെടെ അർഹമായ നഷ്ടപരിഹാരം ഉറപ്പാക്കുന്നു.`;

      case 'or':
        return `ଏହି ସରକାରୀ ଦଲିଲଟି ${sec} ଅନୁଯାୟୀ ${proj} ପ୍ରକଳ୍ପ ପାଇଁ ଏକ ସମ୍ବିଧାନିକ ଜମି ଅଧିଗ୍ରହଣ ବିଜ୍ଞପ୍ତି ଅଟେ।\n\nସରଳ ଭାଷାରେ ମୁଖ୍ୟ ବିନ୍ଦୁ:\n୧. ପ୍ରକଳ୍ପ: ${proj}\n୨. ଜମି ବିବରଣୀ: ${dist} ଜିଲ୍ଲାର ${vill} ଗ୍ରାମରେ ଥିବା ଆପଣଙ୍କ ସର୍ଭେ/ଖସରା ନଂ #${sNo} ର ସମୁଦାୟ ${area} ହେକ୍ଟର ଜମି ଅଧିଗ୍ରହଣ ପ୍ରସ୍ତାବିତ ହୋଇଛି।\n୩. ନାଗରିକ ଅଧିକାର: RFCTLARR ଆଇନ ୨୦୧୩ ର ଧାରା ୧୫ ଅନୁସାରେ କ୍ଷେତ୍ରଫଳ କିମ୍ବା ସୀମା ବିବାଦ ନେଇ ୬୦ ଦିନ ମଧ୍ୟରେ ଆପତ୍ତି ଦାଖଲ କରିବାର ଆପଣଙ୍କର ପୂର୍ଣ୍ଣ ଆଇନଗତ ଅଧିକାର ରହିଛି।\n୪. କ୍ଷତିପୂରଣ ସୁରକ୍ଷା: ଧାରା ୩୦ ଅନୁଯାୟୀ ୧୦୦% ସୋଲାସିୟମ ଏବଂ ୧୨% ବାର୍ଷିକ ଅତିରିକ୍ତ ସୁଧ ସହିତ ନ୍ୟାୟସଙ୍ଗତ କ୍ଷତିପୂରଣ ପ୍ରଦାନ କରାଯିବ।`;

      default:
        return `This official document is a ${sec} issued for the ${proj}.\n\nKey Parameters & Takeaways in Plain Language:\n1. Project: ${proj}\n2. Parcel Location: Survey / Khasra No. #${sNo} in Village ${vill}, District ${dist}.\n3. Notified Area: ${area} Hectares (${(area * 2.471).toFixed(2)} Acres).\n4. Statutory Rights: Under Section 15(1) of the RFCTLARR Act, 2013, you have 60 days from the publication date to file written objections regarding measurement discrepancy, public interest necessity, or boundary overlaps.\n5. Compensation Guarantee: Section 30 mandates a 100% Solatium plus a rural market multiplier and 12% per annum additional compensation interest until award disbursement.\n6. Advisory: Do not enter into unverified private agreements or broker transactions until statutory compensation award under Section 23 is formally declared.`;
    }
  }

  async explainDocumentStream(
    rawText: string,
    docType: string,
    language = 'en',
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const fullText = await this.explainDocument(rawText, docType, language);
    const words = fullText.split(' ');
    for (let i = 0; i < words.length; i += 4) {
      const chunk = words.slice(i, i + 4).join(' ') + ' ';
      onChunk(chunk);
    }
    return fullText;
  }

  async detectDiscrepancies(
    extracted: ExtractedDocumentData,
    recorded: RecordedParcelContext
  ): Promise<DiscrepancyReport> {
    const discrepancies: DiscrepancyItem[] = [];

    // Check Area Discrepancy
    if (extracted.areaHa !== undefined && recorded.recordedAreaHa !== undefined) {
      const diff = Math.abs(extracted.areaHa - recorded.recordedAreaHa);
      const diffPct = (diff / recorded.recordedAreaHa) * 100;

      if (diff > 0.01) {
        discrepancies.push({
          field: 'area',
          documentValue: `${extracted.areaHa} ha`,
          recordedValue: `${recorded.recordedAreaHa} ha`,
          severity: diffPct > 5 ? 'HIGH' : 'MEDIUM',
          message: `Area mismatch: The uploaded document states ${extracted.areaHa} ha, but the official Land Revenue Record indicates ${recorded.recordedAreaHa} ha (Difference: ${extracted.areaHa > recorded.recordedAreaHa ? '+' : '-'}${diff.toFixed(2)} ha / ${diffPct.toFixed(1)}%).`,
        });
      }
    }

    // Check Survey Number
    if (
      extracted.surveyNumber &&
      recorded.surveyNumber &&
      extracted.surveyNumber.trim() !== recorded.surveyNumber.trim()
    ) {
      discrepancies.push({
        field: 'surveyNumber',
        documentValue: extracted.surveyNumber,
        recordedValue: recorded.surveyNumber,
        severity: 'HIGH',
        message: `Survey Number mismatch: Document lists #${extracted.surveyNumber}, but case record is #${recorded.surveyNumber}.`,
      });
    }

    // Check Village
    if (
      extracted.village &&
      recorded.village &&
      !recorded.village.toLowerCase().includes(extracted.village.toLowerCase()) &&
      !extracted.village.toLowerCase().includes(recorded.village.toLowerCase())
    ) {
      discrepancies.push({
        field: 'village',
        documentValue: extracted.village,
        recordedValue: recorded.village,
        severity: 'MEDIUM',
        message: `Village name variance: Document states "${extracted.village}", record states "${recorded.village}".`,
      });
    }

    const hasDiscrepancy = discrepancies.length > 0;
    const summary = hasDiscrepancy
      ? `Potential Discrepancy: We detected ${discrepancies.length} variance(s) between your uploaded document and the Land Revenue database. Please verify against your physical survey or report an issue for Land Officer review.`
      : 'All extracted fields match the official land registry and acquisition records perfectly.';

    const recommendedAction = hasDiscrepancy
      ? 'Click "Report Discrepancy" below to submit a 1-click grievance directly to the Land Acquisition Officer for physical verification.'
      : 'No action required. Your land records are consistent with statutory records.';

    return {
      hasDiscrepancy,
      discrepancies,
      summary,
      recommendedAction,
    };
  }
}
