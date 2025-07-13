# Roadkill Reporter App - Oak Ridge, TN

A mobile-first web application that allows users to report roadkill incidents and automatically forwards reports to the appropriate Oak Ridge city department for cleanup.

## 🚀 Features

- **Location-based Reporting**: GPS-enabled location detection with map integration
- **Photo Capture**: Take photos of incidents with camera or upload from gallery
- **Multi-step Form**: Intuitive 4-step reporting process
- **City Integration**: Automatic email notifications to Oak Ridge Public Works
- **Status Tracking**: Real-time status updates for submitted reports
- **Offline Support**: Queue reports when offline, sync when connected
- **Rate Limiting**: Prevents spam and duplicate submissions
- **Responsive Design**: Works on mobile and desktop devices

## 🛠 Tech Stack

### Frontend
- **React Native (Expo)**: Cross-platform mobile development
- **React Navigation**: Screen navigation and routing
- **Expo Location**: GPS and location services
- **Expo Camera**: Photo capture functionality
- **React Native Maps**: Map integration
- **Axios**: HTTP client for API communication

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **PostgreSQL**: Primary database
- **PostGIS**: Spatial database extension
- **Sequelize**: ORM for database operations
- **Nodemailer**: Email service
- **JWT**: Authentication tokens

### Infrastructure
- **Vercel**: Frontend hosting
- **Railway/Render**: Backend hosting
- **AWS S3**: Photo storage
- **SendGrid**: Email delivery

## 📱 App Screenshots

### Home Screen
- App logo and title
- Quick stats display
- Primary "Report Roadkill" button
- Secondary "View My Reports" button

### Report Screen
- 4-step form process:
  1. **Location**: GPS detection + map selection
  2. **Details**: Animal type, size, description, photo
  3. **Contact**: Email/phone for updates
  4. **Review**: Summary before submission

### Confirmation Screen
- Success message with report ID
- Report details summary
- Next steps explanation
- Action buttons for additional reports

### History Screen
- List of user's submitted reports
- Status indicators (pending, submitted, in-progress, resolved)
- Pull-to-refresh functionality
- Empty state for new users

## 🗄 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT FALSE
);
```

### Reports Table
```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    location GEOMETRY(POINT, 4326) NOT NULL,
    address TEXT,
    animal_type VARCHAR(100),
    size VARCHAR(20),
    description TEXT,
    photo_url TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    send_updates BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    submitted_to_city_at TIMESTAMP,
    resolved_at TIMESTAMP
);
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- PostgreSQL 12+ with PostGIS extension
- Expo CLI
- Git

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd roadkill-reporter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database and email settings
   ```

4. **Set up database**
   ```bash
   # Create PostgreSQL database with PostGIS
   createdb roadkill_reporter
   psql roadkill_reporter -c "CREATE EXTENSION postgis;"
   ```

5. **Run migrations**
   ```bash
   npm run migrate
   ```

6. **Start the server**
   ```bash
   npm run dev
   ```

## ⚙️ Configuration

### Environment Variables

#### Frontend (.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

#### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=roadkill_reporter
DB_USER=postgres
DB_PASSWORD=your_password

# Email (SendGrid recommended)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com

# JWT
JWT_SECRET=your_jwt_secret_key

# Environment
NODE_ENV=development
PORT=3000
```

## 📧 Email Integration

The app automatically sends formatted emails to Oak Ridge Public Works:

**Recipient**: `publicworks@oakridgetn.gov`

**Email Template Includes**:
- Report ID and timestamp
- GPS coordinates and address
- Animal type and size
- Description and photo (if provided)
- Contact information
- Professional formatting

## 🔒 Security Features

- **Input Validation**: All form inputs validated server-side
- **Rate Limiting**: 5 reports per hour per IP
- **Location Validation**: Ensures reports are within Oak Ridge city limits
- **Duplicate Detection**: Prevents multiple reports in same area
- **JWT Authentication**: Secure token-based auth
- **CORS Protection**: Configured for specific origins
- **Helmet.js**: Security headers

## 📊 Analytics & Monitoring

### Built-in Metrics
- Total reports submitted
- Monthly report counts
- Status distribution
- Response times

### Monitoring Points
- Email delivery success rates
- API response times
- Database performance
- Error tracking

## 🚀 Deployment

### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Configure build settings for Expo
3. Set environment variables
4. Deploy

### Backend (Railway/Render)
1. Connect GitHub repository
2. Configure PostgreSQL database
3. Set environment variables
4. Deploy

### Database Setup
1. Create PostgreSQL instance with PostGIS
2. Run database migrations
3. Seed initial data if needed

## 🧪 Testing

### Frontend Testing
```bash
npm test
```

### Backend Testing
```bash
cd backend
npm test
```

### API Testing
```bash
# Test report submission
curl -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"latitude": 36.0, "longitude": -84.3},
    "address": "123 Main St, Oak Ridge, TN",
    "animalType": "Deer",
    "size": "Large"
  }'
```

## 📈 Performance Requirements

- **App Startup**: < 3 seconds
- **Location Detection**: < 5 seconds
- **Form Submission**: < 10 seconds
- **Photo Upload**: < 30 seconds
- **Offline Mode**: Full functionality except submission

## 🔮 Future Enhancements

### Phase 2 Features
- Multi-city support
- City dashboard for report management
- Push notifications for status updates
- Analytics dashboard
- Integration with city 311 systems
- Gamification features

### Technical Improvements
- Real-time updates with WebSockets
- Advanced photo processing
- Machine learning for duplicate detection
- Mobile app stores deployment
- Advanced analytics and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support or questions:
- Email: support@roadkillreporter.com
- Phone: (865) 555-0123
- Website: https://roadkillreporter.com

## 🙏 Acknowledgments

- Oak Ridge Public Works Department
- React Native and Expo communities
- PostgreSQL and PostGIS teams
- Open source contributors

---

**Built with ❤️ for Oak Ridge, TN** 