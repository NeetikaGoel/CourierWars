
flowchart TD
  A["run scripts/start-all.sh"] --> B["set local env values"]
  B --> C["start cache server"]
  C --> D["check cache pid file exists"]
  D --> E["check cache process is alive with kill -0"]
  E --> F["call cache url with curl"]
  F --> G["bootstrap one map into cache"]
  G --> H["start backend in background"]
  H --> I["check backend process id is alive"]
  I --> J["call backend /api/v1/health with curl"]
  J --> K["start frontend"]
