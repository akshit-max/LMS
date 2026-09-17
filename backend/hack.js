const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  const req = {
    id: require('crypto').randomUUID(),
    userId: 'zq7eRC825Uchit5Jena0wZqfPAP2',
    unitId: 'unit-2',
    completedQuizIds: ['quiz-2-1', 'quiz-2-2'],
    quizScores: {'quiz-2-1': 100, 'quiz-2-2': 100},
    lowestScore: 100,
    totalRetries: 0,
    toUnitId: '',
    status: 'pending',
    idempotencyKey: 'zq7eRC825Uchit5Jena0wZqfPAP2_unit-2',
    requestedAt: admin.firestore.FieldValue.serverTimestamp(),
    reviewedAt: null,
    reviewedBy: '',
    adminNote: ''
  };

  await db.collection('unlockRequests').doc(req.id).set(req);
  console.log('Unlock request created for unit 2');
  process.exit(0);
}

run();
