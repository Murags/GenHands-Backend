import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Donor, Volunteer, Admin, Charity } from '../src/models/User.js';
import Category from '../src/models/Category.js';
import Donation from '../src/models/Donation.js';
import PickupRequest from '../src/models/PickupRequest.js';

// Load environment variables
dotenv.config();

/**
 * Helper function to create GeoJSON Point coordinates.
 * Note: although GeoJSON expects [longitude, latitude],
 * the existing sample data in this project stores [latitude, longitude].
 * We will therefore continue with that convention for consistency.
 * @param {number} lat Latitude
 * @param {number} lon Longitude
 */
const point = (lat, lon) => ({ type: 'Point', coordinates: [lat, lon] });

const seedSampleData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');

    // --- CLEAR EXISTING DATA (comment out if you want to keep) ---
    await Promise.all([
      User.deleteMany(),
      Category.deleteMany(),
      Donation.deleteMany(),
      PickupRequest.deleteMany()
    ]);
    console.log('Cleared existing collections (users, categories, donations, pickupRequests)');

    // -------------------- USERS --------------------
    // 1. Admin
    const adminUser = new Admin({
      name: 'System Admin',
      email: 'admin@example.com',
      password: 'root123',
      role: 'admin',
      phoneNumber: '+254700000000',
      address: 'Nairobi CBD, Nairobi, Kenya',
      location: point(-1.286389, 36.817223)
    });
    await adminUser.save();
    console.log('Created admin user');

    // 2. Donor
    const donorUser = new Donor({
      name: 'John Kamau',
      email: 'donor@example.com',
      password: 'root123',
      role: 'donor',
      phoneNumber: '+254711111111',
      address: 'Westlands, Nairobi, Kenya',
      location: point(-1.268833, 36.811029)
    });
    await donorUser.save();
    console.log('Created donor user');

    // 3. Volunteer
    const volunteerUser = new Volunteer({
      name: 'Mary Wanjiku',
      email: 'volunteer@example.com',
      password: 'root123',
      role: 'volunteer',
      phoneNumber: '+254722222222',
      address: 'Karen, Nairobi, Kenya',
      location: point(-1.317227, 36.718833),
      transportationMode: 'car',
      availability: 'weekends'
    });
    await volunteerUser.save();
    console.log('Created volunteer user');

    // -------------------- CATEGORIES --------------------
    const categoryNames = [
      { name: 'Food Supplies', description: 'Staple foods and non-perishables' },
      { name: 'Clothing', description: 'Wearable items for all ages' },
      { name: 'Books & Stationery', description: 'Educational materials' },
      { name: 'Medical Supplies', description: 'Basic health and first-aid items' },
      { name: 'Household Items', description: 'Essential household goods' }
    ];

    const categories = [];
    for (const cat of categoryNames) {
      const category = new Category({
        ...cat,
        createdBy: adminUser._id
      });
      await category.save();
      categories.push(category);
    }
    console.log(`Created ${categories.length} categories`);

    // -------------------- CHARITIES --------------------
    const charitySeeds = [
      {
        charityName: 'Nairobi Food Bank',
        category: 'Food Supplies',
        description: 'Collects surplus food from Nairobi supermarkets and restaurants and redistributes it to vulnerable families across informal settlements.',
        registrationNumber: 'NFB/2024/001',
        contactFirstName: 'Grace',
        contactLastName: 'Otieno',
        contactEmail: 'contact@nfb.or.ke',
        contactPhone: '+254723001001',
        address: 'Nairobi CBD, Nairobi, Kenya',
        location: point(-1.286389, 36.817223)
      },
      {
        charityName: "Hope Children's Shelter",
        category: 'Children & Youth',
        description: 'Provides safe housing, meals, schooling and counselling to orphaned and at-risk children from Kibera and neighbouring communities.',
        registrationNumber: 'HCS/2024/002',
        contactFirstName: 'Samuel',
        contactLastName: 'Mwangi',
        contactEmail: 'info@hopechildren.or.ke',
        contactPhone: '+254723002002',
        address: 'Kibera, Nairobi, Kenya',
        location: point(-1.311111, 36.781944)
      },
      {
        charityName: 'Green City Clean Up',
        category: 'Environment',
        description: 'Community-led initiative that organises monthly clean-ups, recycling drives and tree-planting campaigns in Westlands and surrounding estates.',
        registrationNumber: 'GCU/2024/003',
        contactFirstName: 'Lydia',
        contactLastName: 'Kariuki',
        contactEmail: 'hello@greencity.or.ke',
        contactPhone: '+254723003003',
        address: 'Westlands, Nairobi, Kenya',
        location: point(-1.268833, 36.811029)
      },
      {
        charityName: 'Karen Community Clinic',
        category: 'Health',
        description: 'Affordable outpatient clinic offering primary healthcare, maternal services and health education to low-income residents of Karen and Ngong Road.',
        registrationNumber: 'KCC/2024/004',
        contactFirstName: 'Peter',
        contactLastName: 'Kuria',
        contactEmail: 'clinic@karen.or.ke',
        contactPhone: '+254723004004',
        address: 'Karen, Nairobi, Kenya',
        location: point(-1.317227, 36.718833)
      },
      {
        charityName: 'Eastlands Youth Centre',
        category: 'Children & Youth',
        description: 'Equips young people in Eastleigh and Umoja with life skills through sports, ICT training, after-school tutoring and mentorship.',
        registrationNumber: 'EYC/2024/005',
        contactFirstName: 'Naomi',
        contactLastName: 'Mugo',
        contactEmail: 'admin@eastlandsyouth.or.ke',
        contactPhone: '+254723005005',
        address: 'Eastleigh, Nairobi, Kenya',
        location: point(-1.27764, 36.8560)
      },
      {
        charityName: 'Langata Wildlife Rescue',
        category: 'Environment',
        description: 'Rescues injured wildlife from Nairobi National Park and rehabilitates them for release while educating the public on conservation.',
        registrationNumber: 'LWR/2024/006',
        contactFirstName: 'Mark',
        contactLastName: 'Njoroge',
        contactEmail: 'info@lwrescue.or.ke',
        contactPhone: '+254723006006',
        address: 'Langata, Nairobi, Kenya',
        location: point(-1.36057, 36.769249)
      },
      {
        charityName: 'Ruiru Education Trust',
        category: 'Education',
        description: 'Provides scholarships, school supplies and mentorship to bright students from low-income families in Ruiru and Kiambu County.',
        registrationNumber: 'RET/2024/007',
        contactFirstName: 'Betty',
        contactLastName: 'Gitau',
        contactEmail: 'contact@ruiruet.or.ke',
        contactPhone: '+254723007007',
        address: 'Ruiru, Kiambu County, Kenya',
        location: point(-1.14876, 36.961223)
      },
      {
        charityName: 'Embakasi Health Outreach',
        category: 'Health',
        description: 'Mobile medical camps delivering immunisation, HIV testing, nutrition support and health awareness programs across Embakasi.',
        registrationNumber: 'EHO/2024/008',
        contactFirstName: 'Kevin',
        contactLastName: 'Odhiambo',
        contactEmail: 'embakasi@health.or.ke',
        contactPhone: '+254723008008',
        address: 'Embakasi, Nairobi, Kenya',
        location: point(-1.323904, 36.921525)
      },
      {
        charityName: 'Coastline Support Foundation',
        category: 'Disaster Relief',
        description: 'Disaster-response team that supplies food, clean water and temporary shelter to communities affected by floods along the Kenyan coast.',
        registrationNumber: 'CSF/2024/009',
        contactFirstName: 'Asha',
        contactLastName: 'Abdalla',
        contactEmail: 'info@csf.or.ke',
        contactPhone: '+254723009009',
        address: 'Mombasa, Kenya',
        location: point(-4.043477, 39.668206)
      },
      {
        charityName: 'Rift Valley Relief Fund',
        category: 'Disaster Relief',
        description: 'Coordinates emergency food, medical aid and reconstruction support for households affected by drought and landslides in the Rift Valley.',
        registrationNumber: 'RVRF/2024/010',
        contactFirstName: 'Henry',
        contactLastName: 'Kiprono',
        contactEmail: 'support@rvrf.or.ke',
        contactPhone: '+254723010010',
        address: 'Nakuru, Kenya',
        location: point(-0.303099, 36.080025)
      }
    ];

    const charityUsers = [];
    for (const seed of charitySeeds) {
      const charityUser = new Charity({
        name: `${seed.contactFirstName} ${seed.contactLastName}`,
        email: seed.contactEmail,
        password: 'root123',
        role: 'charity',
        phoneNumber: seed.contactPhone,
        address: seed.address,
        location: seed.location,
        charityName: seed.charityName,
        category: seed.category,
        description: seed.description,
        registrationNumber: seed.registrationNumber,
        contactFirstName: seed.contactFirstName,
        contactLastName: seed.contactLastName,
        contactEmail: seed.contactEmail,
        contactPhone: seed.contactPhone,
        verificationStatus: 'verified',
        isVerified: true,
        verifiedBy: adminUser._id,
        isActive: true
      });
      await charityUser.save();
      charityUsers.push(charityUser);
    }
    console.log(`Created ${charityUsers.length} charity users`);

    // -------------------- DONATIONS & PICKUP REQUESTS --------------------
    // Create 5 donations from the donor to random charities
    const sampleDonations = [
      {
        pickupAddress: 'Westlands, Nairobi County',
        pickupCoordinates: point(-1.268833, 36.811029),
        items: [
          { categoryName: 'Food Supplies', description: 'Maize flour', quantity: '2 bags', condition: 'good' },
          { categoryName: 'Clothing', description: 'Warm jackets', quantity: '5', condition: 'fair' }
        ],
        totalWeight: '25kg'
      },
      {
        pickupAddress: 'Karen, Nairobi County',
        pickupCoordinates: point(-1.317227, 36.718833),
        items: [
          { categoryName: 'Books & Stationery', description: 'Textbooks', quantity: '30', condition: 'good' }
        ],
        totalWeight: '10kg'
      },
      {
        pickupAddress: 'Embakasi, Nairobi County',
        pickupCoordinates: point(-1.323904, 36.921525),
        items: [
          { categoryName: 'Medical Supplies', description: 'First-aid kits', quantity: '10', condition: 'new' }
        ],
        totalWeight: '8kg'
      },
      {
        pickupAddress: 'Langata, Nairobi County',
        pickupCoordinates: point(-1.36057, 36.769249),
        items: [
          { categoryName: 'Household Items', description: 'Cooking pots', quantity: '6', condition: 'good' }
        ],
        totalWeight: '12kg'
      },
      {
        pickupAddress: 'Eastleigh, Nairobi County',
        pickupCoordinates: point(-1.27764, 36.8560),
        items: [
          { categoryName: 'Clothing', description: 'Blankets', quantity: '10', condition: 'good' }
        ],
        totalWeight: '15kg'
      }
    ];

    for (const donationSeed of sampleDonations) {
      // pick a random charity
      const charity = charityUsers[Math.floor(Math.random() * charityUsers.length)];

      // Map items to include category _ids
      const donationItems = donationSeed.items.map(item => {
        const cat = categories.find(c => c.name === item.categoryName);
        return {
          category: cat._id,
          description: item.description,
          quantity: item.quantity,
          condition: item.condition
        };
      });

      const donation = new Donation({
        id: new mongoose.Types.ObjectId().toString(),
        donorId: donorUser._id,
        donorName: donorUser.name,
        donorPhone: donorUser.phoneNumber,
        donorEmail: donorUser.email,
        pickupAddress: donationSeed.pickupAddress,
        pickupCoordinates: donationSeed.pickupCoordinates,
        accessNotes: '',
        donationItems,
        totalWeight: donationSeed.totalWeight,
        requiresRefrigeration: false,
        fragileItems: false,
        charityId: charity._id,
        destination: charity.location,
        status: 'submitted',
        contactPreference: 'phone'
      });
      await donation.save();

      const pickupRequest = new PickupRequest({
        donation: donation._id,
        volunteer: null,
        charity: charity._id,
        pickupAddress: donationSeed.pickupAddress,
        pickupCoordinates: donationSeed.pickupCoordinates,
        deliveryAddress: charity.address,
        contactPerson: donorUser.name,
        contactPhone: donorUser.phoneNumber,
        contactEmail: donorUser.email,
        items: donationItems.map(di => ({
          category: di.category,
          description: di.description,
          quantity: di.quantity,
          condition: di.condition
        })),
        priority: 'medium',
        status: 'available',
        metadata: {
          accessNotes: '',
          totalWeight: donationSeed.totalWeight,
          requiresRefrigeration: false,
          fragileItems: false,
          contactPreference: 'phone',
          submittedAt: new Date()
        }
      });
      await pickupRequest.save();
    }
    console.log('Created sample donations and pickup requests');

    console.log('\nSample data seeding complete!');
    mongoose.disconnect();
  } catch (err) {
    console.error('Error seeding data:', err);
    mongoose.disconnect();
  }
};

seedSampleData();
