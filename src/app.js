import express from 'express';
import connectDB from './config/db.js';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import charityRoutes from './routes/charityRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

connectDB();

const app = express();

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Generous Hands API',
            version: '1.0.0',
            description: 'API documentation for the Generous Hands donation platform.',
            contact: {
                name: 'API Support',
            },
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 5000}/api`,
                description: 'Development server',
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(cors());
app.use(express.json());

// Swagger UI Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/charity', charityRoutes);
app.use('/api/admin', adminRoutes);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/', (req, res) => res.send('API Running'));

app.get('/health', (req, res) => {
    res.status(200).json({
        message: 'Server is running',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}. API docs available at http://localhost:${PORT}/api-docs`));
