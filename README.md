# Art with Heart & Gifts - Website

A beautiful, responsive website for a Florida-based artist offering healing-inspired original art, prints, murals, and gifts.

## 🎨 Features

- **Responsive Design**: Mobile-first approach with beautiful layouts
- **E-commerce Integration**: Shopping cart and payment processing via Swipe Simple
- **Email Notifications**: Contact forms and commission inquiries
- **Gallery System**: Showcase artwork with collections and filtering
- **Commission Requests**: Custom artwork and mural inquiries
- **SEO Optimized**: Search engine friendly with proper meta tags

## 🚀 Quick Start

### Frontend Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Backend Development

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start backend server
npm start

# Test email service
node test-email.js
```

## 📁 Project Structure

```
artwithheartandgifts/
├── src/                    # Frontend source code
│   ├── js/                # JavaScript modules
│   │   ├── app.js         # Main application logic
│   │   ├── cart.js        # Shopping cart functionality
│   │   └── products.js    # Product data management
│   └── styles/            # CSS styles
│       └── base.css       # Main stylesheet
├── backend/               # Backend API
│   ├── server.js          # Express server
│   ├── email-service-simple.js  # Email service
│   ├── payment-processor.js     # Payment handling
│   └── test-email.js      # Email testing script
├── images/                # Artwork images
├── data.json             # Product data
├── data-collections.json # Collection data
├── data-gallery.json     # Gallery data
└── data-story.json       # Story data
```

## 🔧 Configuration

### Email Service

The email service is configured in `backend/email-config.js`:

```javascript
module.exports = {
  emailUser: "artwithheartandgiftsllc@gmail.com",
  emailPass: "your_app_password_here",
  recipientEmail: "artwithheartandgifts@yahoo.com",
};
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
EMAIL_USER=artwithheartandgiftsllc@gmail.com
EMAIL_PASS=your_gmail_app_password
PORT=3001
```

## 📧 Email System

The website includes a robust email system for:

- **Contact Forms**: General inquiries and questions
- **Commission Requests**: Custom artwork and mural inquiries
- **Order Notifications**: Secure checkout and order confirmations
- **Newsletter Signups**: Email list subscriptions

### Testing Email Service

```bash
cd backend
node test-email.js
```

## 🛒 E-commerce Features

- **Shopping Cart**: Add/remove items, quantity management
- **Payment Processing**: Swipe Simple integration
- **Order Management**: Secure checkout with email notifications
- **Product Filtering**: By type, collection, price, etc.
- **Responsive Design**: Works on all devices

## 🎨 Artwork Management

- **Product Data**: Stored in JSON files for easy management
- **Image Optimization**: Responsive images with multiple formats
- **Collections**: Organized by themes (Healing, Florida, etc.)
- **Gallery System**: Showcase artwork with pagination

## 🚀 Deployment

### Frontend (Netlify/Vercel)

1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Configure redirects for SPA routing

### Backend (Railway/Heroku)

1. Deploy the `backend` folder
2. Set environment variables
3. Configure email service credentials

## 📱 Pages

- **Home** (`index.html`): Hero section, featured collections, new arrivals
- **Gallery** (`gallery.html`): Artwork showcase with filtering
- **Shop** (`shop.html`): E-commerce product listing
- **Collections** (`collections.html`): Themed artwork collections
- **Commissions** (`commissions.html`): Custom artwork requests
- **About** (`about.html`): Artist story and background
- **Contact** (`contact.html`): Contact form and information
- **Healing** (`healing.html`): Healing art focus page

## 🔧 Development

### Adding New Products

1. Add product data to `data.json`
2. Include image in `images/` directory
3. Update collections in `data-collections.json` if needed

### Styling

- Main stylesheet: `src/styles/base.css`
- Responsive design with CSS Grid and Flexbox
- Mobile-first approach

### JavaScript

- Modular ES6+ JavaScript
- Cart functionality with localStorage
- Form handling with fetch API
- Image optimization and lazy loading

## 📞 Support

For technical support or questions:

- Email: artwithheartandgifts@yahoo.com
- Phone: (239) 878-9849

## 📄 License

© 2024 Art with Heart and Gifts. All rights reserved.
