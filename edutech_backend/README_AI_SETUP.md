# EduTech AI Assistant Setup

## Overview
The EduTech AI Assistant is an integrated ChatGPT-like interface that helps students with programming, economics, and general learning topics.

## Features
- ChatGPT-like UI with conversation history
- Educational focus on programming and economics
- Token optimization for cost efficiency
- Conversation management (create, rename, delete, archive)
- User-specific chat history
- Real-time messaging

## Backend Setup

### 1. Install Dependencies
```bash
pip install openai==1.51.0
```

### 2. Environment Configuration
Add these variables to your `.env` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=150
OPENAI_TEMPERATURE=0.7
```

### 3. Database Migration
The chat tables are automatically created with the migration:
```bash
alembic upgrade head
```

### 4. API Endpoints
The following endpoints are available:

- `POST /api/chat/send` - Send message to AI
- `GET /api/chat/conversations` - Get user conversations
- `POST /api/chat/conversations` - Create new conversation
- `GET /api/chat/conversations/{id}` - Get conversation with messages
- `PUT /api/chat/conversations/{id}` - Update conversation
- `DELETE /api/chat/conversations/{id}` - Delete conversation
- `GET /api/chat/health` - Check AI service status

## Frontend Setup

### 1. Install Dependencies
```bash
npm install react-hot-toast
```

### 2. Access the AI Assistant
Navigate to `/chat` in the application to access the AI assistant.

## Usage

### Getting Your OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Go to API Keys section
4. Create a new API key
5. Copy the key to your `.env` file

### Using the AI Assistant
1. Navigate to the "AI Assistant" in the sidebar
2. Start a new conversation or continue an existing one
3. Ask questions about:
   - Programming concepts and debugging
   - Economics theories and applications
   - General learning topics
4. Manage conversations with rename, delete, and archive features

## Cost Optimization
- Token limit set to 150 per response for cost efficiency
- Conversation history limited to last 10 messages
- Educational system prompt optimizes for relevant responses
- GPT-3.5-turbo model for cost-effective operation

## Technical Details

### Models
- `Conversation`: Stores chat conversations with titles and metadata
- `Message`: Stores individual messages with role (user/assistant/system)

### Token Usage
- Messages track token usage for analytics
- Configurable limits prevent excessive API costs
- Efficient conversation context management

### Security
- User authentication required for all chat endpoints
- User isolation - users can only access their own conversations
- Input validation and rate limiting

## Troubleshooting

### "AI service not configured" Error
- Check that `OPENAI_API_KEY` is set in your `.env` file
- Verify the API key is valid and has sufficient credits
- Check the health endpoint: `GET /api/chat/health`

### Database Issues
- Ensure migrations are applied: `alembic upgrade head`
- Check database connection in `DATABASE_URL`

### Frontend Issues
- Ensure `react-hot-toast` is installed
- Check browser console for JavaScript errors
- Verify API endpoints are accessible 