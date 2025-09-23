# The 60-Second Script Spinner 🎬

An AI-powered video script generation app for content creators of all niches. Create compelling, engaging video scripts in seconds with an intuitive, adaptive interface that provides dynamic suggestions based on your topic.

## 🌟 Features

- **Adaptive Interface**: Smart, conversational UI that guides you through script creation
- **Dynamic Suggestions**: AI-powered topic suggestions that adapt to what you're typing
- **Real-time Prompt Preview**: See exactly what's being sent to the AI as you build your script
- **Multiple Style Options**: Choose from Authoritative, Humorous, Casual, or Formal tones
- **Instant Variations**: Generate shorter, more engaging, or social media versions with one click
- **Universal Topics**: Works for any niche - fitness, cooking, business, tech, lifestyle, and more
- **Modern UI**: Beautiful, responsive design with gradient styling

## 🚀 Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful, customizable icons
- **Axios** - HTTP client for API requests

### Backend
- **FastAPI** - Modern, fast Python web framework
- **OpenAI API** - Direct integration with GPT-4 and other OpenAI models
- **Pydantic** - Data validation and serialization
- **OpenAI Python Library** - Official OpenAI client library

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- OpenAI API key (optional - app works with mock data)

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
```

### 2. Environment Configuration

```bash
# Copy the environment template
cd backend
cp .env.example .env

# Edit .env and add your OpenAI API key (optional)
# Get your key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=your_api_key_here
```

### 3. Start the Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
# Backend runs on http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Frontend runs on http://localhost:3000
```

## 🎯 How to Use

### Step 1: Define Your Topic
- Enter your main video topic (e.g., "How to be more productive at work")
- Get dynamic AI-generated suggestions as you type
- Select from contextual refinements that match your niche

### Step 2: Craft Your Hook
- Define the core message or hook for your video
- Example: "Anyone can master this skill with the right approach"

### Step 3: Choose Your Style
- **Authoritative**: Expert and confident tone
- **Humorous**: Fun and entertaining approach
- **Casual**: Friendly and approachable style
- **Formal**: Professional and structured delivery

### Step 4: Generate & Refine
- Click "Generate Script" to create your 60-second video script
- Use variation buttons to create different versions:
  - **Shorter Version**: 30-40 second condensed script
  - **More Engaging**: Enhanced with personality and social media flair
  - **Social Media Post**: Optimized for Instagram, TikTok, etc.

## 🔧 API Configuration

The app uses OpenAI's API with support for multiple models:

- **GPT-4** (default) - Most capable model, best quality
- **GPT-4 Turbo** - Faster and more cost-effective than GPT-4
- **GPT-3.5 Turbo** - Fast and economical option

To change models, update the `DEFAULT_MODEL` in your `.env` file:
```bash
DEFAULT_MODEL=gpt-4-turbo-preview  # or gpt-3.5-turbo for faster/cheaper option
```

## 📁 Project Structure

```
coffeeapp/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles with Tailwind
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Main application page
├── backend/               # FastAPI backend
│   ├── main.py           # Main FastAPI application
│   ├── requirements.txt  # Python dependencies
│   └── .env.example      # Environment template
├── package.json          # Node.js dependencies
├── tailwind.config.js    # Tailwind CSS configuration
└── README.md             # This file
```

## 🎨 Customization

### Adding New Topics
Edit the `topicSuggestions` array in `app/page.tsx`:

```typescript
const topicSuggestions = [
  'Pour-over techniques',
  'Grind size guide',
  'Must-have brewing tools',
  // Add your suggestions here
]
```

### Adding New Styles
Extend the `styles` array in `app/page.tsx`:

```typescript
const styles = [
  { name: 'Authoritative', description: 'Expert and confident' },
  // Add new styles here
]
```

### Customizing Prompts
Modify the `build_prompt()` function in `backend/main.py` to adjust how prompts are constructed.

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy the .next folder
```

### Backend (Railway/Heroku/DigitalOcean)
```bash
# The backend is ready for containerization
# Dockerfile can be added for Docker deployment
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- Check the console for error messages
- Ensure both frontend and backend servers are running
- Verify your OpenAI API key if using real AI generation
- The app includes fallback mock responses for demo purposes

## 🔮 Future Enhancements

- [ ] User authentication and saved scripts
- [ ] More AI model options
- [ ] Script analytics and performance tracking
- [ ] Team collaboration features
- [ ] Export to various video platforms
- [ ] Advanced customization options

---

Built with ❤️ for coffee content creators
