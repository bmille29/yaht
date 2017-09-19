# Yaht

### Basic usage
```
Usage: ./bin/yaht [options]

Options:

  -h, --help                       Show help
  -c, --config, --configuration    Configuration file selection
  -e, --env, --environment         Environment (shorthand for config file selection)
```


### APIs

- [Heartbeat](../lib/plugins/heartbeat/README.md)
    - `GET /heartbeat`
- [Services](../lib/plugins/services/README.md)
    - [Accounts](../lib/plugins/services/README.md)
        - `GET /services/account/logout`
        - `GET /services/account/status`
        - `POST /services/account/login`
        - `POST /services/account/signup`
    - [OAuth](../lib/plugins/services/README.md)
        - `POST /services/oauth/jira`
        - `POST /services/oauth/tokens`
