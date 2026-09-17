const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./firebase-service-account.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

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
    requestedAt: new Date(),
    reviewedAt: null,
    reviewedBy: '',
    adminNote: ''
  };

  await db.collection('unlockRequests').doc(req.id).set(req);
  console.log('Unlock request created for unit 2');
  process.exit(0);
}

run();
