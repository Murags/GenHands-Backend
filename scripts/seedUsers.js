import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Donor, Volunteer, Admin, Charity } from '../src/models/User.js'; // Adjust the path if necessary

dotenv.config();

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        // Optional: Clear existing users before seeding
        // await User.deleteMany();
        // console.log('Existing users cleared');

        const rolesToSeed = {
            donor: 10,
            volunteer: 15, // More volunteers for testing verification
            charity: 15,   // More charities for testing verification
            admin: 2,
        };

        const generatedUsers = [];

        for (const role in rolesToSeed) {
            const count = rolesToSeed[role];
            for (let i = 1; i <= count; i++) {
                const userData = {
                    name: `${role.charAt(0).toUpperCase()}${role.slice(1)} ${i}`,
                    email: `${role}${i}@example.com`,
                    password: 'root123', // Passwords will be hashed by the model's pre-save hook
                    role: role,
                };

                if (role === 'charity') {
                    userData.charityName = `Charity Org ${i}`;
                }

                if (role === 'volunteer' || role === 'charity') {
                    userData.verificationStatus = 'pending';
                }

                generatedUsers.push(userData);
            }
        }

        console.log(`Generating ${generatedUsers.length} dummy users...`);

        for (const userData of generatedUsers) {
            let newUser;
            switch (userData.role.toLowerCase()) {
                case 'donor':
                    newUser = new Donor(userData);
                    break;
                case 'volunteer':
                    newUser = new Volunteer(userData);
                    break;
                case 'admin':
                    newUser = new Admin(userData);
                    break;
                case 'charity':
                     newUser = new Charity(userData);
                    break;
                default:
                    console.log(`Skipping invalid role: ${userData.role}`);
                    continue;
            }
             try {
                 await newUser.save();
                 console.log(`Created user: ${newUser.email} with role ${newUser.role}${newUser.verificationStatus ? ` (status: ${newUser.verificationStatus})` : ''}`);
             } catch (saveError) {
                 // Handle potential duplicate key errors gracefully
                 if (saveError.code === 11000) {
                     console.log(`User already exists: ${userData.email}`);
                 } else {
                     console.error(`Error saving user ${userData.email}:`, saveError);
                 }
             }
        }

        console.log('User seeding complete.');

    } catch (error) {
        console.error('Error during user seeding:', error);
        process.exit(1);
    } finally {
        mongoose.disconnect();
        console.log('MongoDB Disconnected.');
    }
};

seedUsers();
