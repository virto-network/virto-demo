# Passkeys Connection Middleware

This middleware automatically handles Polkadot API connections for passkeys functionality.

## Features

- Automatically initializes ApiPromise and Pass objects based on request parameters
- Supports two connection methods:
  - Session ID: Connects to a local Chopsticks instance using the sessionId
  - WebSocket URL: Connects directly to a specified WebSocket endpoint
- Attaches the API and Pass objects to the request for use in controllers
- Automatically cleans up connections when the response is complete

## Usage

### In Requests

Include one of the following in your request:

#### Session ID

```
// Query parameter
GET /your-endpoint?sessionId=your-session-id

// Header
Headers: {
  'x-session-id': 'your-session-id'
}

// JSON body
{
  "sessionId": "your-session-id"
}
```

#### WebSocket URL

```
// Query parameter
GET /your-endpoint?wsUrl=ws://your-websocket-url

// Header
Headers: {
  'x-ws-url': 'ws://your-websocket-url'
}

// JSON body
{
  "wsUrl": "ws://your-websocket-url"
}
```

### In Controllers/Services

The middleware attaches `api` and `pass` objects to the request, which can be accessed in your controllers:

```typescript
@Controller('example')
export class ExampleController {
  @Get()
  exampleEndpoint(@Req() req: Request) {
    // Access the API and Pass objects
    const api = req.api;
    const pass = req.pass;
    
    // Use them in your endpoint logic
    if (api && pass) {
      // Do something with the API and Pass
    }
    
    return { success: true };
  }
}
```

In services, you can also access these objects by receiving the request object as a parameter:

```typescript
@Injectable()
export class ExampleService {
  async exampleMethod(param: string, req?: any): Promise<any> {
    if (req && req.api) {
      // Use the API from the request
      const api = req.api;
      // Do something with the API
    }
    
    return { success: true };
  }
}
``` 