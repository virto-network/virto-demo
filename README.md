# Virto Demo

> **⚠️ PROOF OF CONCEPT**  
> This is a proof of concept implementation for demonstration purposes only. Not intended for production use.

## Overview

This demo NestJS server integrates four core services:

1. **Chopsticks** - A blockchain testing and development environment
2. **Passkeys Bot** - A service for signing and transferring memberships
3. **VOS Mock** - A service for authentication and registration with passkeys
4. **Matrix** - Integration with Matrix protocol for community membership verification

## Project Structure

```
virto-demo/
├── src/
│   ├── modules/
│   │   ├── chopsticks/      # Chopsticks integration
│   │   ├── passkeys-bot/    # Passkeys Bot integration
│   │   ├── vos-mock/        # VOS Mock integration
│   │   └── matrix/          # Matrix integration
│   ├── app.module.ts        # Main application module
│   └── main.ts              # Application entry point
├── .env                     # Environment variables
├── package.json             # Dependencies
└── tsconfig.json            # TypeScript configuration
```

## Prerequisites

- Node.js (latest LTS version recommended)
- npm or yarn

## Installation

```bash
make init # init submodule
# Install dependencies
npm install
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
# Server configuration
PORT=3000
NODE_ENV=development

# Blockchain provider URL
KREIVO_PROVIDER=wss://kreivo.kippu.rocks
WS_PROVIDER_URL=ws://127.0.0.1:12281

# Bot configuration for signing 
SEED=//Alice

# Chopsticks configuration
PUBLIC_IP=0.0.0.0

# VOS Mock configuration
RP_NAME=Virto Passkeys
SIGNING_SERVICE_URL=http://localhost:3000/passkeys/sign

# Matrix configuration
MATRIX_USER=@your_bot_user:matrix.org
MATRIX_PASS=your_bot_password
MATRIX_HOMESERVER=https://matrix.org
```

### Matrix Setup

The Matrix integration allows you to verify if users are members of the Kreivo community room (`#kreivo:virto.community`).

**Prerequisites:**
1. Create a Matrix bot account (or use an existing account)
2. Make sure the bot is invited and has joined the `#kreivo:virto.community` room
3. Set the environment variables `MATRIX_USER`, `MATRIX_PASS`, and optionally `MATRIX_HOMESERVER`

The Matrix client will automatically:
- Connect to the Matrix homeserver on server startup
- Load all members from the Kreivo room
- Refresh the member list every 5 minutes
- Provide endpoints to check membership status

## Running the Application

```bash
# Development mode
npm run start:dev

# Debug mode
npm run start:debug

# Production mode
npm run build
npm run start:prod
```

## Testing

```bash
# Run tests
npm test

# Run tests with watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

## API Endpoints

### Chopsticks

- `POST /chopsticks/start` - Start a Chopsticks instance
- `GET /chopsticks/session/:sessionId` - Get session information
- `POST /chopsticks/stop` - Stop a Chopsticks instance

### Passkeys Bot

- `POST /passkeys/sign` - Sign a transaction and transfer membership

### VOS Mock

- `POST /vos-mock/pre-register` - Prepare for passkey registration
- `POST /vos-mock/post-register` - Complete passkey registration
- `POST /vos-mock/pre-connect` - Prepare for passkey authentication

### Matrix

- `GET /api/matrix/check-member?username=<username>` - Check if a user is a member of the Kreivo Matrix room
- `GET /api/matrix/health` - Get Matrix client connection status

**Note:** The VOS Mock `add-member` endpoint now automatically verifies that the user is a member of the Matrix room `#kreivo:virto.community` before adding them to the blockchain community. This ensures only verified Matrix community members can be added.

## Development

```bash
# Format code
npm run format
```

## License

[License information]

## Contact

[Contact information]
