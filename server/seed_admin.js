require('dotenv').config({ path: __dirname + '/.env' })
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('./src/models/User')

const mongoUri = process.env.MONGO_URI

async function seedAdmin() {
  try {
    await mongoose.connect(mongoUri, { dbName: 'ck_classes' })
    console.log('Connected to MongoDB Atlas dbName: ck_classes')

    const adminEmail = 'admin@ckclasses.com'
    const adminPassword = 'admin123'

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(adminPassword, salt)

    let user = await User.findOne({ email: adminEmail })

    if (user) {
      // Use updateOne without $set wrapper for direct field update
      await User.updateOne(
        { _id: user._id },
        { passwordHash: passwordHash, isActive: true }
      )
      console.log(`Updated existing Admin user in ck_classes: ${adminEmail} / ${adminPassword}`)
    } else {
      user = await User.create({
        email: adminEmail,
        passwordHash,
        role: 'admin',
        firstName: 'System',
        lastName: 'Admin',
        phone: '9876543210',
        isActive: true
      })
      console.log(`Created new Admin user in ck_classes: ${adminEmail} / ${adminPassword}`)
    }

    // Verify
    const verify = await User.findOne({ email: adminEmail })
    const match = await bcrypt.compare(adminPassword, verify.passwordHash)
    console.log(`Password verification: ${match ? 'PASS ✓' : 'FAIL ✗'}`)

    await mongoose.disconnect()
    console.log('Database seeding complete for ck_classes.')
  } catch (err) {
    console.error('Error seeding admin user:', err)
    process.exit(1)
  }
}

seedAdmin()
