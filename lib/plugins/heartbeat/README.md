## Hapi Plugin - Heartbeat
- [Options](#options)
- [Example Manifest Configuration](#example-manifest-configuration)

#### Options
- `path` - Sets a custom path. Defaults to `/heartbeat`.
- `message` - Sets a custom response message. Defaults to `{ "status": "ok" }`.

#### Example Manifest Configuration
```json
{
    "server": {},
    "connections": [{
        "port": 9000,
        "labels": ["api", "http"]
    }],
    "plugins": {
        "heartbeat": [{
            "select": "api",
            "options": { "path": "/custom/path", "message": { "custom": "message" } }
        }]
    }
}
```
