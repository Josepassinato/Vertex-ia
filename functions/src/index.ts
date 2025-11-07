import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenAI, Modality } from '@google/genai';
import { Storage } from '@google-cloud/storage';
import { VideoIntelligenceServiceClient } from '@google-cloud/video-intelligence';
import Busboy from 'busboy';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type { VideoAnalysisResult, ReportEvent, EventSeverity } from '../../types'; // Adjust path if necessary

admin.initializeApp();
const db = admin.firestore();
const storageClient = new Storage();
const videoIntelligenceClient = new VideoIntelligenceServiceClient();

// Access Gemini API Key from Firebase functions config
// Make sure to run: firebase functions:config:set genai.api_key="YOUR_GEMINI_API_KEY"
const geminiApiKey = functions.config().genai?.api_key;
if (!geminiApiKey) {
  functions.logger.error("Gemini API key not configured. Set 'genai.api_key' in Firebase functions config.");
}

// --- Helper Functions ---

// Function to convert data URL to base64 string without prefix
const parseBase64FromDataURL = (dataURL: string): string => {
  // Check if it's a data URL starting with 'data:image/jpeg;base64,'
  const dataUrlPrefix = 'data:image/jpeg;base64,';
  if (dataURL.startsWith(dataUrlPrefix)) {
    return dataURL.substring(dataUrlPrefix.length);
  }
  // Otherwise, assume it's already a plain base64 string or an invalid format
  return dataURL;
};

// --- 1. testGeminiConnectivity Cloud Function ---
// Tests basic connectivity to a Gemini text model.
export const testGeminiConnectivity = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const prompt = data.prompt as string;
  if (!prompt) {
    throw new functions.https.HttpsError('invalid-argument', 'The "prompt" parameter is required.');
  }

  if (!geminiApiKey) {
    throw new functions.https.HttpsError('failed-precondition', 'Gemini API key is not configured.');
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Basic text model
      contents: prompt,
    });
    return { response: response.text };
  } catch (error: any) {
    functions.logger.error("Error calling Gemini API:", error);
    throw new functions.https.HttpsError('internal', 'Failed to connect to Gemini API', error.message);
  }
});

// --- 2. analyzeVideoFile Cloud Function ---
// Analyzes an uploaded video file using Google Cloud Video Intelligence API and Gemini Vision.
export const analyzeVideoFile = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // Authentication: Verify Firebase ID token if the client sends one
  // const idToken = req.headers.authorization?.split('Bearer ')[1];
  // if (!idToken) {
  //   return res.status(401).send('Unauthorized: No token provided');
  // }
  // try {
  //   await admin.auth().verifyIdToken(idToken);
  // } catch (error) {
  //   return res.status(401).send('Unauthorized: Invalid token');
  // }

  const uploadPromise = new Promise<{ filePath: string; fileName: string; contentType: string }>((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const tmpdir = os.tmpdir();
    let fileWriteFinished = false;

    let fileName: string | null = null;
    let filePath: string | null = null;
    let contentType: string | null = null;

    busboy.on('file', (fieldname, file, info) => {
      // Ensure the fieldname matches what the frontend is sending ('video')
      if (fieldname !== 'video') {
        file.resume(); // Consume the stream to prevent hanging
        return reject(new functions.https.HttpsError('invalid-argument', 'Unexpected fieldname. Expected "video".'));
      }

      fileName = `video-${uuidv4()}-${info.filename}`;
      filePath = path.join(tmpdir, fileName);
      contentType = info.mimeType;

      const writeStream = fs.createWriteStream(filePath);
      file.pipe(writeStream);

      file.on('end', () => {
        writeStream.end();
      });

      writeStream.on('finish', () => {
        fileWriteFinished = true;
        if (filePath && fileName && contentType) {
          resolve({ filePath, fileName, contentType });
        } else {
          reject(new Error('File details missing after write finish.'));
        }
      });
      writeStream.on('error', (err) => {
        functions.logger.error('Error writing file to temp:', err);
        reject(new functions.https.HttpsError('internal', 'Failed to write file to temporary storage.'));
      });
    });

    busboy.on('finish', () => {
      if (!fileWriteFinished) {
        // If finish is called but no file was written (e.g., empty request body or wrong fieldname)
        reject(new functions.https.HttpsError('invalid-argument', 'No video file uploaded or incorrect fieldname. Expected "video".'));
      }
    });

    busboy.on('error', (err) => {
      functions.logger.error('Busboy error:', err);
      reject(new functions.https.HttpsError('internal', 'Failed to parse form data.'));
    });

    req.pipe(busboy);
  });

  let tempFilePath: string | undefined;
  let gcsFileDestination: string | undefined;
  try {
    const { filePath, fileName, contentType } = await uploadPromise;
    tempFilePath = filePath; // Store for cleanup
    
    const bucketName = process.env.GCLOUD_PROJECT ? `${process.env.GCLOUD_PROJECT}.appspot.com` : 'your-project-id.appspot.com';
    const bucket = storageClient.bucket(bucketName);
    gcsFileDestination = `temp_videos/${fileName}`;

    // Upload the file to Google Cloud Storage
    await bucket.upload(filePath, {
      destination: gcsFileDestination,
      metadata: { contentType: contentType },
    });
    functions.logger.log(`Video uploaded to gs://${bucketName}/${gcsFileDestination}`);

    // Call Video Intelligence API
    const [operation] = await videoIntelligenceClient.annotateVideo({
      inputUri: `gs://${bucketName}/${gcsFileDestination}`,
      features: ['LABEL_DETECTION', 'SHOT_CHANGE_DETECTION', 'EXPLICIT_CONTENT_DETECTION'], // Added more features
    });

    functions.logger.log('Waiting for video analysis operation to complete...');
    const [operationResult] = await operation.promise();
    functions.logger.log('Video analysis complete.');

    const videoAnalysis: VideoAnalysisResult[] = [];
    if (operationResult.annotationResults && operationResult.annotationResults.length > 0) {
      const annotationResult = operationResult.annotationResults[0];

      // Process shot changes for keyframes
      if (annotationResult.shotAnnotations && annotationResult.shotAnnotations.length > 0) {
        for (const shot of annotationResult.shotAnnotations) {
          const startTimeSeconds = shot.startTimeOffset?.seconds || 0;
          // For simplicity, we'll take the start of each shot as a keyframe timestamp.
          // In a real app, you would extract an actual frame thumbnail or use the Gemini Vision model here.
          videoAnalysis.push({
            frameNumber: videoAnalysis.length + 1,
            timestamp: startTimeSeconds,
            imageUrl: `data:image/png;base64,`, // Placeholder - no actual image extracted here
            description: `Shot detected starting at ${startTimeSeconds} seconds.`,
          });
        }
      }

      // Process general labels detected
      if (annotationResult.segmentLabelAnnotations && annotationResult.segmentLabelAnnotations.length > 0) {
        for (const segmentLabel of annotationResult.segmentLabelAnnotations) {
          const description = `Overall video contains: ${segmentLabel.entity?.description}`;
          // Add this as a general result or append to an existing one
          if (videoAnalysis.length === 0) {
            videoAnalysis.push({
              frameNumber: 1,
              timestamp: 0,
              imageUrl: `data:image/png;base64,`, // Placeholder
              description: description,
            });
          } else {
            videoAnalysis[0].description += `; ${segmentLabel.entity?.description}`;
          }
        }
      }
      
      // Process explicit content detection
      if (annotationResult.explicitAnnotation?.frames && annotationResult.explicitAnnotation.frames.length > 0) {
          const likelyExplicitFrames = annotationResult.explicitAnnotation.frames.filter(
              (frame) => frame.pornographyLikelihood && ['POSSIBLE', 'LIKELY', 'VERY_LIKELY'].includes(frame.pornographyLikelihood)
          );
          if (likelyExplicitFrames.length > 0) {
              const explicitTime = likelyExplicitFrames[0].timeOffset?.seconds || 0;
              videoAnalysis.push({
                  frameNumber: videoAnalysis.length + 1,
                  timestamp: explicitTime,
                  imageUrl: `data:image/png;base64,`,
                  description: `Potentially explicit content detected at ${explicitTime} seconds.`
              });
          }
      }


      // If no specific analysis results, provide a default
      if (videoAnalysis.length === 0) {
        videoAnalysis.push({
          frameNumber: 1,
          timestamp: 0,
          imageUrl: `data:image/png;base64,`,
          description: 'No specific visual insights found by Video Intelligence API for this video. Consider adding more detection features.'
        });
      }
    } else {
        videoAnalysis.push({
            frameNumber: 1,
            timestamp: 0,
            imageUrl: `data:image/png;base64,`,
            description: 'No annotation results returned from Video Intelligence API. The video might be too short or have no detectable content for the selected features.'
        });
    }

    res.status(200).send({ results: videoAnalysis });

  } catch (error: any) {
    functions.logger.error("Video analysis failed:", error);
    res.status(500).send({ error: error.message, details: error.details });
  } finally {
    // Clean up temporary files regardless of success or failure
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      functions.logger.log(`Cleaned up local temporary file: ${tempFilePath}`);
    }
    if (gcsFileDestination) {
      const bucketName = process.env.GCLOUD_PROJECT ? `${process.env.GCLOUD_PROJECT}.appspot.com` : 'your-project-id.appspot.com';
      storageClient.bucket(bucketName).file(gcsFileDestination).delete().catch(err => {
        functions.logger.error(`Failed to delete GCS temporary file ${gcsFileDestination}:`, err);
      });
      functions.logger.log(`Initiated deletion of GCS temporary file: ${gcsFileDestination}`);
    }
  }
});


// --- 3. analyzeLiveFrame Cloud Function ---
// Analyzes a single base64 image frame from a live stream using Gemini Vision,
// and can optionally log events to Firestore.
export const analyzeLiveFrame = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const cameraId = data.cameraId as string;
  const base64Image = data.base64Image as string;
  const analyticsToApply = data.analyticsToApply as string[]; // List of analytic IDs from frontend

  if (!cameraId || !base64Image || !Array.isArray(analyticsToApply)) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters: cameraId, base64Image, analyticsToApply.');
  }

  if (!geminiApiKey) {
    throw new functions.https.HttpsError('failed-precondition', 'Gemini API key is not configured.');
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: parseBase64FromDataURL(base64Image), // Ensure it's just the base64 string
      },
    };

    // Construct a more dynamic prompt based on the analytics selected by the user
    let promptText = 'Describe the main objects, people, and activities in this image. ';
    if (analyticsToApply.includes('FaceRecognition')) { // Assuming analytic IDs are simple names
        promptText += 'Focus on any faces visible and try to identify emotions or characteristics. ';
    }
    if (analyticsToApply.includes('LPR')) {
        promptText += 'Look for vehicles and their license plates. ';
    }
    if (analyticsToApply.includes('ObjectDetection')) {
        promptText += 'Identify specific objects present. ';
    }
    if (analyticsToApply.includes('AnomalyDetection')) {
        promptText += 'Note any unusual or anomalous behaviors or situations. ';
    }
    // Add more conditions for other analytics

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Gemini model capable of understanding images
      contents: [{ parts: [imagePart, { text: promptText }] }],
    });
    
    const description = response.text;

    // Optional: Logic to create a ReportEvent based on Gemini's description.
    // This is a simple heuristic for demonstration. In a real app, you might use function calling,
    // a more sophisticated NLP analysis, or a structured JSON response from Gemini.
    if (description && (description.toLowerCase().includes('unusual') ||
                        description.toLowerCase().includes('alert') ||
                        description.toLowerCase().includes('intruder') ||
                        description.toLowerCase().includes('fire') ||
                        description.toLowerCase().includes('smoke') ||
                        description.toLowerCase().includes('suspicious'))) {
      
      const cameraDoc = await db.collection('cameras').doc(cameraId).get();
      const cameraName = cameraDoc.exists ? cameraDoc.data()?.name : `Camera ${cameraId}`;

      // Pick one of the applied analytics or a generic one for the event
      const eventAnalyticId = analyticsToApply.length > 0 ? analyticsToApply[0] : 'General Anomaly';
      const eventAnalyticDoc = await db.collection('analytics').doc(eventAnalyticId).get();
      const analyticName = eventAnalyticDoc.exists ? eventAnalyticDoc.data()?.name : eventAnalyticId;

      const severity: EventSeverity = description.toLowerCase().includes('critical') || description.toLowerCase().includes('fire') ? 'Critical' :
                                      description.toLowerCase().includes('high priority') || description.toLowerCase().includes('intruder') ? 'High' :
                                      'Medium'; // Default or based on keywords

      const newEvent: Omit<ReportEvent, 'id'> = {
        timestamp: new Date().toISOString(),
        cameraName: cameraName,
        analyticName: analyticName,
        severity: severity,
        videoUrl: `[Live Stream of ${cameraName}]`, // Placeholder, consider saving a screenshot to GCS
        details: `Live AI observation: ${description}`,
      };
      await db.collection('events').add(newEvent);
      functions.logger.log(`New event logged for camera ${cameraId}: ${description}`);
    }

    return { description: description };
  } catch (error: any) {
    functions.logger.error("Error calling Gemini Vision API:", error);
    throw new functions.https.HttpsError('internal', 'Failed to analyze live frame with Gemini API', error.message);
  }
});