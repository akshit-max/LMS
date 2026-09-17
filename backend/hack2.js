const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./firebase-service-account.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  const q = await db.collection('unlockRequests').where('userId', '==', 'zq7eRC825Uchit5Jena0wZqfPAP2').get();
  q.forEach(doc => console.log(doc.id, doc.data().status));
  process.exit(0);
}
run();
