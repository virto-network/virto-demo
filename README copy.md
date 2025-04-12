# Virto API Server

This NestJS server integrates three projects:

1. **Chopsticks** - A blockchain testing and development environment
2. **Passkeys Bot** - A service for signing and transferring memberships
3. **VOS Mock** - A service for authentication and registration with passkeys

## Project Structure

```
server/
├── src/
│   ├── modules/
│   │   ├── chopsticks/      # Chopsticks integration
│   │   ├── passkeys-bot/    # Passkeys Bot integration
│   │   └── vos-mock/        # VOS Mock integration
│   ├── app.module.ts        # Main application module
│   └── main.ts              # Application entry point
├── .env                     # Environment variables
├── package.json             # Dependencies
└── tsconfig.json            # TypeScript configuration
```

## Installation

```bash
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
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
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