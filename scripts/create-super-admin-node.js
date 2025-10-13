const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// SuperAdmin schema (simplified for this script)
const superAdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: String,
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  profileImage: String,
  canManageUsers: { type: Boolean, default: true },
  canManageVendors: { type: Boolean, default: true },
  canManageContent: { type: Boolean, default: true },
  canViewAnalytics: { type: Boolean, default: true },
  canManageSystemSettings: { type: Boolean, default: true },
}, { timestamps: true });

const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dream-weddings');
    console.log('Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await SuperAdmin.findOne({ email: 'admin@dreamweddings.com' });
    
    if (existingSuperAdmin) {
      console.log('Super admin already exists with email: admin@dreamweddings.com');
      console.log('Skipping creation...');
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash('Password123!', 12);
      
      // Create super admin
      const superAdmin = new SuperAdmin({
        email: 'admin@dreamweddings.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        phone: '+1234567890',
        isActive: true,
        isEmailVerified: true,
        canManageUsers: true,
        canManageVendors: true,
        canManageContent: true,
        canViewAnalytics: true,
        canManageSystemSettings: true,
      });

      const result = await superAdmin.save();
      
      console.log('Super admin created successfully!');
      console.log('Email: admin@dreamweddings.com');
      console.log('Password: Password123!');
      console.log('ID:', result._id);
    }

    // Verify creation
    const superAdminCount = await SuperAdmin.countDocuments();
    console.log('Total super admins in database:', superAdminCount);

  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createSuperAdmin();
