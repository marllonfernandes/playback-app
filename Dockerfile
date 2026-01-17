# Use an image that has Python (for Demucs) and we'll install Node.js
FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    sox \
    libsox-fmt-mp3 \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Verify versions
RUN node -v && npm -v && python3 --version && ffmpeg -version

# Install Demucs and yt-dlp
RUN pip install --no-cache-dir demucs yt-dlp

WORKDIR /app

# 1. Build Frontend
COPY ./frontend /app/frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# 2. Setup Backend
COPY ./backend /app/backend
WORKDIR /app/backend
RUN npm install

# 3. Move built frontend to backend static dir
# Assuming backend serves 'public' folder or similar. 
# Let's verify server.js logic, but usually we move to a 'public' or 'dist' folder inside backend.
# We will construct the server to look at 'public' folder.
RUN mkdir -p public
RUN cp -r /app/frontend/dist/* /app/backend/public/

# Clean up source frontend to save space (optional, skipping for now)

EXPOSE 3000

CMD ["npm", "start"]
