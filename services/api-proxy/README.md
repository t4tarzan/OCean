# OCEAN API Proxy

API proxy service for Claude, Gemini, and OpenAI with usage tracking and rate limiting.

## Features

- **API Proxying**: Routes requests to Claude, Gemini, and OpenAI APIs
- **Usage Tracking**: Logs all API calls with token counts and costs
- **Rate Limiting**: Prevents abuse with configurable rate limits
- **Authentication**: Verifies user tokens before proxying requests
- **Cost Calculation**: Automatically calculates costs based on model pricing

## Setup

1. Install dependencies:
```bash
cd /opt/ocean/services/api-proxy
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure API keys in `.env`:
```
CLAUDE_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
OPENAI_API_KEY=sk-...
```

4. Run the service:
```bash
npm run dev
```

The proxy runs on port 3001.

## API Endpoints

### Claude
```
POST /api/claude/messages
Authorization: Bearer <user_token>

{
  "model": "claude-3-sonnet-20240229",
  "messages": [{"role": "user", "content": "Hello"}],
  "max_tokens": 1024
}
```

### Gemini
```
POST /api/gemini/generate
Authorization: Bearer <user_token>

{
  "model": "gemini-pro",
  "prompt": "Hello",
  "maxOutputTokens": 1024
}
```

### OpenAI
```
POST /api/openai/chat/completions
Authorization: Bearer <user_token>

{
  "model": "gpt-3.5-turbo",
  "messages": [{"role": "user", "content": "Hello"}],
  "max_tokens": 1024
}
```

## Rate Limits

- Default: 100 requests per minute per IP
- Configurable per endpoint

## Usage Tracking

All API calls are logged to the `api_usage` table with:
- User ID
- Service (claude/gemini/openai)
- Model
- Token counts (input/output)
- Cost
- Duration
- Timestamp

## Production

```bash
npm run build
npm start
```
