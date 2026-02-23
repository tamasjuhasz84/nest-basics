# nest-basics (minimal)

Minimal NestJS REST API for learning the basics.
- Only `items` module (controller + service)
- In-memory storage (no DB)
- No DTOs, no validation pipes, no guards/interceptors

## Install & run
```bash
npm install
npm run start:dev
```

Server: http://localhost:3000

## Endpoints
- GET    /items/health
- GET    /items
- GET    /items/:id
- POST   /items
- PATCH  /items/:id
- DELETE /items/:id
- GET    /items/search?q=term

### Example body (POST /items)
```json
{ "name": "Buy milk", "done": false }
```

### Example body (PATCH /items/1)
```json
{ "done": true }
```
