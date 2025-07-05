import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixGeospatialIndex = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('pickuprequests');

    // Drop existing indexes on pickupCoordinates if they exist
    try {
      const indexes = await collection.indexes();
      console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));

      // Check if there are any problematic indexes
      for (const index of indexes) {
        if (index.name.includes('pickupCoordinates') ||
            (index.key && index.key['pickupCoordinates.coordinates'])) {
          console.log(`Dropping index: ${index.name}`);
          await collection.dropIndex(index.name);
        }
      }
    } catch (error) {
      console.log('No existing pickupCoordinates indexes to drop, or error dropping:', error.message);
    }

    // Create the correct geospatial index
    console.log('Creating 2dsphere index on pickupCoordinates...');
    await collection.createIndex(
      { "pickupCoordinates": "2dsphere" },
      { name: "pickupCoordinates_2dsphere" }
    );

    // Also create compound indexes for better query performance
    console.log('Creating compound indexes...');

    // Status + geospatial index for filtered location queries
    await collection.createIndex(
      { "status": 1, "pickupCoordinates": "2dsphere" },
      { name: "status_1_pickupCoordinates_2dsphere" }
    );

    // Priority + status + geospatial for sorted location queries
    await collection.createIndex(
      { "priority": -1, "status": 1, "pickupCoordinates": "2dsphere" },
      { name: "priority_-1_status_1_pickupCoordinates_2dsphere" }
    );

    // Verify the indexes were created
    const newIndexes = await collection.indexes();
    console.log('Updated indexes:');
    newIndexes.forEach(idx => {
      console.log(`- ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('Geospatial indexes fixed successfully!');

    // Test a simple geospatial query
    console.log('Testing geospatial query...');
    const testQuery = {
      status: 'available',
      pickupCoordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [36.8219, -1.2921] // Nairobi coordinates
          },
          $maxDistance: 5000 // 5km
        }
      }
    };

    const testResult = await collection.find(testQuery).limit(1).toArray();
    console.log(`Test query returned ${testResult.length} results`);

  } catch (error) {
    console.error('Error fixing geospatial index:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

fixGeospatialIndex();
