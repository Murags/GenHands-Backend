import axios from 'axios';

// The base URL of your running backend application
const API_URL = 'http://localhost:3000/api/donations';

/**
 * This is a sample donation request payload.
 * You can modify this object to test different scenarios.
 * This example showcases a detailed donation from a business.
 */
const sampleDonation = {
  donorName: "Jane Smith",
  donorPhone: "098-765-4321",
  donorEmail: "jane.smith@example.com",
  organizationName: "Smith & Co.",
  organizationType: "business",
  pickupAddress: "789 Business Park, Suite 100, Workcity, USA 67890",
  pickupCoordinates: [-1.2921, 36.8219],
  accessNotes: "Please use the loading dock at the back of the building. Ring bell for assistance.",
  donationItems: [
    {
      category: "Furniture",
      description: "Office chairs",
      quantity: "5",
      condition: "good"
    },
    {
      category: "Electronics",
      description: "Computer monitors",
      quantity: "5",
      condition: "fair"
    }
  ],
  totalWeight: "150 lbs",
  requiresRefrigeration: false,
  fragileItems: true,
  preferredCharity: "Goodwill",
  deliveryInstructions: "Deliver to the main warehouse entrance.",
  availabilityType: "specific",
  preferredDate: "2024-08-15",
  preferredTimeStart: "10:00",
  preferredTimeEnd: "14:00",
  urgencyLevel: "medium",
  additionalNotes: "Items are packed and ready for pickup.",
  photoConsent: true,
  contactPreference: "email"
};

/**
 * Sends the donation request to the API.
 */
const sendDonationRequest = async () => {
  try {
    console.log('Sending donation request...');
    console.log('Payload:', JSON.stringify(sampleDonation, null, 2));

    const response = await axios.post(API_URL, sampleDonation);

    console.log('\nDonation request successful!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('\nError sending donation request:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
    console.error('Is the backend server running and accessible at the specified API_URL?');
  }
};

// Execute the function
sendDonationRequest();
