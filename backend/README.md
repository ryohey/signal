# AI Music Composer Backend

FastAPI backend for generating MIDI music from natural language prompts using Claude AI.

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Copy `.env.example` to `.env` and fill in your OpenRouter API key:
   ```bash
   cp .env.example .env
   ```

4. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/generate` - Generate a multi-track song from a text prompt
- `POST /api/regenerate` - Regenerate a single track with instructions

## Environment Variables

- `OPENROUTER_API_KEY` - Your OpenRouter API key
- `OPENROUTER_MODEL` - Model to use (default: `anthropic/claude-sonnet-4`)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins
- `DEBUG` - Enable debug mode (default: false)
