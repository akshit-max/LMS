const { initializeApp, cert } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore } = require('firebase-admin/firestore')

const SERVICE_ACCOUNT_PATH = './firebase-service-account.json'

let serviceAccount
try {
  serviceAccount = require(SERVICE_ACCOUNT_PATH)
} catch {
  console.error('❌ No service account key found')
  process.exit(1)
}

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
})

const auth = getAuth()
const db = getFirestore()

async function createUser() {
  const email = 'user@gmail.com'
  const password = 'lms@2026'
  
  let userRecord;
  try {
    // Check if user already exists
    userRecord = await auth.getUserByEmail(email)
    console.log(`User ${email} already exists. Updating password...`)
    userRecord = await auth.updateUser(userRecord.uid, { password })
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      // Create new user
      console.log(`Creating new user ${email}...`)
      userRecord = await auth.createUser({
        email,
        password,
        displayName: 'Test Student',
      })
    } else {
      console.error('Error fetching/creating user:', error)
      process.exit(1)
    }
  }

  // Set the student role in Firestore
  const userRef = db.collection('users').doc(userRecord.uid)
  await userRef.set({
    email,
    name: 'Test Student',
    role: 'student',
    createdAt: new Date(),
    updatedAt: new Date(),
    avatarUrl: '',
    xp: 0,
    stars: 0,
    rankTitle: 'Beginner',
    streakDays: 0,
    status: 'approved', // So they don't have to wait for admin approval to test
  }, { merge: true })

  console.log('✅ Student user created successfully!')
  console.log(`Email: ${email}`)
  console.log(`UID: ${userRecord.uid}`)
  process.exit(0)
}

createUser().catch(console.error)
