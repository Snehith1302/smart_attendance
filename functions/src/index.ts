import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { VertexAI } from "@google-cloud/vertexai";

admin.initializeApp();

export const generateAISummary = functions.https.onCall(async (data, context) => {
  // Check auth
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Request must be authenticated."
    );
  }

  const studentId = data.studentId;
  if (!studentId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "studentId parameter is required."
    );
  }

  const db = admin.firestore();

  try {
    // 1. Get student user details
    const userSnap = await db.collection("users").doc(studentId).get();
    if (!userSnap.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Student record not found."
      );
    }
    const userData = userSnap.data();
    const studentName = userData?.displayName || "Student";

    // 2. Fetch class lists to cross-reference
    const classesSnap = await db.collection("classes")
      .where("studentIds", "array-contains", studentId)
      .get();
    
    // Map class names and calculate stats
    const courseStats: any[] = [];
    
    for (const doc of classesSnap.docs) {
      const classData = doc.data();
      const classId = doc.id;

      // Count records
      const recordsSnap = await db.collection("attendance_records")
        .where("classId", "==", classId)
        .where("studentId", "==", studentId)
        .get();

      const total = recordsSnap.docs.length;
      const present = recordsSnap.docs.filter(
        d => d.data().status === "present" || d.data().status === "late"
      ).length;

      const rate = total > 0 ? Math.round((present / total) * 100) : 100;
      courseStats.push({
        name: classData.name,
        code: classData.code,
        present,
        total,
        rate
      });
    }

    // 3. Setup Vertex AI Gemini call
    // Set project credentials. Functions default credentials will auto-authorize
    const projectId = admin.instanceId().app.options.projectId || "smart-attendance-2026-a2419";
    const vertexAI = new VertexAI({ project: projectId, location: "us-central1" });
    const generativeModel = vertexAI.preview.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const statsSummary = courseStats
      .map(s => `- ${s.name} (${s.code}): ${s.rate}% (${s.present}/${s.total} sessions)`)
      .join("\n");

    const prompt = `
Analyze the university attendance performance of student: ${studentName}.
Overall course records:
${statsSummary}

Generate a concise monthly performance evaluation. Outline their standing relative to the 75% minimum university requirement. Offer concrete improvement advice for any courses below 75% and commend high scores. Format the response in standard Markdown.
    `;

    const resp = await generativeModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const resultText = resp.response.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to parse AI response.";

    // 4. Cache report in DB
    const reportId = `${studentId}_summary`;
    await db.collection("ai_summaries").doc(reportId).set({
      studentId,
      studentName,
      summaryText: resultText,
      generatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return { success: true, summary: resultText };

  } catch (err: any) {
    console.error("AI Generation Exception:", err);
    throw new functions.https.HttpsError(
      "internal",
      err.message || "An internal error occurred while generating reports."
    );
  }
});
