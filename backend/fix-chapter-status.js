/**
 * Re-seeds chapter status for user@gmail.com
 * Run: node fix-chapter-status.js
 */

const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

let serviceAccount
try {
  serviceAccount = require('./firebase-service-account.json')
} catch {
  console.error('❌ No service account key found')
  process.exit(1)
}

initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id })

const db = getFirestore()

async function fixChapterStatus() {
  const targetEmail = 'user@gmail.com'

  // Find user by email
  const userSnap = await db.collection('users').where('email', '==', targetEmail).limit(1).get()
  if (userSnap.empty) {
    console.error(`❌ User ${targetEmail} not found in Firestore`)
    process.exit(1)
  }
  const userDoc = userSnap.docs[0]
  const userId = userDoc.id
  console.log(`✅ Found user: ${userId}`)

  // Get Unit 1 (order == 1)
  const unitsSnap = await db.collection('units').where('order', '==', 1).limit(1).get()
  if (unitsSnap.empty) {
    console.error('❌ No unit with order=1 found')
    process.exit(1)
  }
  const unit = unitsSnap.docs[0]
  const unitId = unit.id
  console.log(`✅ Found unit: ${unit.data().title}`)

  // Get chapters for this unit
  const chapSnap = await db.collection('chapters').where('unitId', '==', unitId).where('isActive', '==', true).get()
  const chapters = chapSnap.docs.sort((a, b) => a.data().order - b.data().order)
  console.log(`✅ Found ${chapters.length} chapters`)

  // Check if chapterStatus already exists
  const existingSnap = await db.collection('chapterStatus').where('userId', '==', userId).get()
  if (!existingSnap.empty) {
    console.log(`ℹ️  chapterStatus already exists (${existingSnap.size} records). Overwriting...`)
  }

  // Write chapterStatus: first chapter = available, rest = locked
  const batch = db.batch()
  chapters.forEach((ch, i) => {
    const docId = `${userId}_${ch.id}`
    const ref = db.collection('chapterStatus').doc(docId)
    batch.set(ref, {
      userId,
      chapterId: ch.id,
      unitId,
      status: i === 0 ? 'available' : 'locked',
      bestScore: 0,
      bestStars: 0,
      completedAt: null,
    })
    console.log(`  ${i === 0 ? '🔓' : '🔒'} Chapter ${i + 1}: ${ch.data().title} → ${i === 0 ? 'available' : 'locked'}`)
  })

  await batch.commit()
  console.log('\n🎉 Chapter status initialized successfully!')
  console.log(`User: ${targetEmail}`)
  console.log(`Chapter 1 is unlocked. User can now start quizzes.`)
  process.exit(0)
}

fixChapterStatus().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
