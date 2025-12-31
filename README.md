<div align="center">
  <h1>👗 SvelTech</h1>
  <p>Your AI-Powered Personal Stylist</p>
  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#contributing">Contributing</a>
  </p>
</div>

## ✨ Features

- **AI-Powered Styling**: Get personalized outfit recommendations using Google's Gemini AI
- **Digital Wardrobe**: Organize your clothing items with smart categorization
- **Weather-Aware Suggestions**: Outfits tailored to current weather conditions
- **Smart Search**: Find items using natural language queries
- **Outfit Planning**: Plan your outfits for different occasions
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Mode**: Choose your preferred theme

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **AI/ML**: Google Gemini API
- **Media Handling**: Cloudinary
- **Deployment**: Vercel/Netlify ready

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or later
- npm v9+ or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sveltech.git
   cd sveltech
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the project root with your API keys:
   ```env
   # Supabase
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Google Gemini
   VITE_GEMINI_API_KEY=your_gemini_api_key
   
   # Cloudinary
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open in browser**
   The app will be available at [http://localhost:5173](http://localhost:5173)

## 🏗️ Building for Production

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run end-to-end tests
npm run test:e2e
```

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) to get started.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) for the powerful AI capabilities
- [Supabase](https://supabase.com/) for the amazing backend services
- [Cloudinary](https://cloudinary.com/) for media management
- All the open-source libraries that made this project possible
