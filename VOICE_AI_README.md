# Voice AI Widget - Shopify App

A floating Voice AI assistant widget that can be embedded on any website, similar to JotForm AI. The widget provides voice and text-based chat functionality with customizable design options.

## Features

- 🎤 **Voice Input**: Uses browser speech recognition for hands-free interaction
- 💬 **Text Chat**: Traditional text-based chat interface
- 🎨 **Customizable Design**: Change colors, position, and appearance
- 📱 **Mobile Responsive**: Works seamlessly on all devices
- ⚡ **Easy Installation**: Simple embed code or theme extension
- 🛠️ **Shopify Integration**: Full dashboard for configuration

## Installation Methods

### Method 1: Theme Extension (Recommended)
1. Install the Voice AI theme extension
2. Go to your Shopify admin → Online Store → Themes
3. Click "Customize" on your active theme
4. Add the "Voice AI Widget" block
5. Configure settings and save

### Method 2: Embed Code
1. Go to the Widget Settings page in your app
2. Copy the embed code
3. Add it to your website's HTML

```html
<script src="YOUR_APP_URL/embed?shop=YOUR_SHOP_NAME"></script>
```

## Configuration Options

### Dashboard Settings
Access the Widget Settings page to customize:

- **Background Color**: Choose the widget's background color
- **Icon Color**: Set the microphone icon color
- **Position**: Place widget on left or right side
- **Enable/Disable**: Toggle widget visibility

### Theme Extension Settings
When using the theme extension, you can configure:

- Enable/disable the widget
- Background color picker
- Icon color picker
- Position selector (left/right)

## Technical Details

### Database Schema
The app uses Prisma with SQLite to store widget settings:

```prisma
model WidgetSettings {
  id             String   @id @default(cuid())
  shop           String   @unique
  backgroundColor String  @default("#007bff")
  iconColor      String   @default("#ffffff")
  position       String   @default("right")
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

### API Endpoints

- `GET /embed?shop=SHOP_NAME` - Returns the widget JavaScript
- `GET /app/widget-settings` - Widget configuration dashboard
- `POST /app/widget-settings` - Save widget settings

### Widget Features

- **Floating Design**: Fixed position widget that stays visible while scrolling
- **Modal Interface**: Full-screen chat interface when clicked
- **Voice Recognition**: Uses Web Speech API for voice input
- **Responsive**: Adapts to different screen sizes
- **Customizable**: Colors and position can be changed via dashboard

## Development

### Prerequisites
- Node.js 18+ 
- Shopify CLI
- Prisma

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Run database migrations: `npx prisma migrate dev`
4. Start development server: `npm run dev`

### File Structure
```
app/
├── routes/
│   ├── embed.jsx              # Widget JavaScript endpoint
│   ├── app.widget-settings.jsx # Configuration dashboard
│   └── demo.jsx               # Demo page
├── db.server.js               # Database connection
└── shopify.server.js          # Shopify app configuration

extensions/voice-ai/
├── blocks/star_rating.liquid  # Theme extension block
├── assets/voice-ai-widget.js  # Widget JavaScript
└── locales/en.default.json    # Localization
```

## Usage Examples

### Basic Implementation
```html
<!DOCTYPE html>
<html>
<head>
    <title>My Store</title>
</head>
<body>
    <!-- Your website content -->
    
    <!-- Voice AI Widget -->
    <script src="https://your-app-url.com/embed?shop=your-shop-name"></script>
</body>
</html>
```

### Custom Configuration
The widget automatically loads settings from the database based on the shop parameter. Users can customize the appearance through the Shopify dashboard.

## Browser Support

- **Voice Recognition**: Chrome, Safari, Edge (desktop and mobile)
- **Widget Display**: All modern browsers
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet

## Security

- CORS enabled for embed script
- Shop validation for widget loading
- Secure session management via Prisma
- Shopify OAuth integration

## Support

For issues or questions:
1. Check the Widget Settings page for configuration options
2. Review the theme extension installation guide
3. Test the demo page at `/demo?shop=your-shop-name`

## License

This project is part of a Shopify app template and follows Shopify's development guidelines.
