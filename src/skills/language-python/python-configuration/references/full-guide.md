# Python Configuration Management (Full Guide)

Externalize environment-specific values and validate configuration as typed data at startup.

## Core Principles

1. **Externalized configuration**: no environment-specific constants in code.
2. **Typed settings**: parse into one schema object.
3. **Fail fast**: boot should fail on invalid/missing required config.
4. **Sane defaults**: only for safe local-dev values.

## Quick Start

```python
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    database_url: str = Field(alias="DATABASE_URL")
    api_key: str = Field(alias="API_KEY")
    debug: bool = Field(default=False, alias="DEBUG")

settings = Settings()
```

## Pattern 1: Central Settings Object

```python
from pydantic_settings import BaseSettings
from pydantic import Field, ValidationError
import sys

class Settings(BaseSettings):
    db_host: str = Field(alias="DB_HOST")
    db_port: int = Field(default=5432, alias="DB_PORT")
    db_name: str = Field(alias="DB_NAME")
    db_user: str = Field(alias="DB_USER")
    db_password: str = Field(alias="DB_PASSWORD")

    redis_url: str = Field(default="redis://localhost:6379", alias="REDIS_URL")
    api_secret_key: str = Field(alias="API_SECRET_KEY")
    enable_new_feature: bool = Field(default=False, alias="ENABLE_NEW_FEATURE")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }

try:
    settings = Settings()
except ValidationError as e:
    print(f"Configuration error:\n{e}")
    sys.exit(1)
```

Use via import:

```python
from myapp.config import settings
```

## Pattern 2: Fail Fast Error Reporting

```python
from pydantic_settings import BaseSettings
from pydantic import Field, ValidationError
import sys

class Settings(BaseSettings):
    api_key: str = Field(alias="API_KEY")
    database_url: str = Field(alias="DATABASE_URL")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

try:
    settings = Settings()
except ValidationError as e:
    print("=" * 60)
    print("CONFIGURATION ERROR")
    print("=" * 60)
    for error in e.errors():
        field = error["loc"][0]
        print(f"  - {field}: {error['msg']}")
    print("\nPlease set the required environment variables.")
    sys.exit(1)
```

## Pattern 3: Dev Defaults + Required Secrets

```python
class Settings(BaseSettings):
    db_host: str = Field(default="localhost", alias="DB_HOST")
    db_port: int = Field(default=5432, alias="DB_PORT")

    db_password: str = Field(alias="DB_PASSWORD")
    api_secret_key: str = Field(alias="API_SECRET_KEY")
    debug: bool = Field(default=False, alias="DEBUG")

    model_config = {"env_file": ".env"}
```

`.env` sample (gitignored):

```bash
DB_PASSWORD=local_dev_password
API_SECRET_KEY=dev-secret-key
DEBUG=true
```

## Pattern 4: Namespaced Variables

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=admin
DB_PASSWORD=secret

REDIS_URL=redis://localhost:6379
REDIS_MAX_CONNECTIONS=10

AUTH_SECRET_KEY=your-secret-key
AUTH_TOKEN_EXPIRY_SECONDS=3600
AUTH_ALGORITHM=HS256

FEATURE_NEW_CHECKOUT=true
FEATURE_BETA_UI=false
```

## Pattern 5: Type Coercion + Custom Parsers

```python
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator

class Settings(BaseSettings):
    debug: bool = False
    max_connections: int = 100
    allowed_hosts: list[str] = Field(default_factory=list)

    @field_validator("allowed_hosts", mode="before")
    @classmethod
    def parse_allowed_hosts(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            return [host.strip() for host in v.split(",") if host.strip()]
        return v
```

## Pattern 6: Environment Switching

```python
from enum import Enum
from pydantic_settings import BaseSettings
from pydantic import Field, computed_field

class Environment(str, Enum):
    LOCAL = "local"
    STAGING = "staging"
    PRODUCTION = "production"

class Settings(BaseSettings):
    environment: Environment = Field(default=Environment.LOCAL, alias="ENVIRONMENT")
    log_level: str = Field(default="DEBUG", alias="LOG_LEVEL")

    @computed_field
    @property
    def is_production(self) -> bool:
        return self.environment == Environment.PRODUCTION
```

## Pattern 7: Nested Config Groups

```python
from pydantic import BaseModel
from pydantic_settings import BaseSettings

class DatabaseSettings(BaseModel):
    host: str = "localhost"
    port: int = 5432
    name: str
    user: str
    password: str

class RedisSettings(BaseModel):
    url: str = "redis://localhost:6379"
    max_connections: int = 10

class Settings(BaseSettings):
    database: DatabaseSettings
    redis: RedisSettings
    debug: bool = False

    model_config = {
        "env_nested_delimiter": "__",
        "env_file": ".env",
    }
```

Env variables:

```bash
DATABASE__HOST=db.example.com
DATABASE__PORT=5432
DATABASE__NAME=myapp
DATABASE__USER=admin
DATABASE__PASSWORD=secret
REDIS__URL=redis://redis.example.com:6379
```

## Pattern 8: Secret Files (`secrets_dir`)

```python
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    db_password: str = Field(alias="DB_PASSWORD")

    model_config = {
        "secrets_dir": "/run/secrets",
    }
```

## Pattern 9: Cross-Field Validation

```python
from pydantic_settings import BaseSettings
from pydantic import Field, model_validator

class Settings(BaseSettings):
    db_host: str = Field(alias="DB_HOST")
    db_port: int = Field(alias="DB_PORT")
    read_replica_host: str | None = Field(default=None, alias="READ_REPLICA_HOST")
    read_replica_port: int = Field(default=5432, alias="READ_REPLICA_PORT")

    @model_validator(mode="after")
    def validate_replica_settings(self):
        if self.read_replica_host and self.read_replica_port == self.db_port:
            if self.read_replica_host == self.db_host:
                raise ValueError("Read replica cannot be the same as primary database")
        return self
```

## Best Practices Summary

1. Never hardcode config/secrets.
2. Use one typed settings schema.
3. Fail fast at startup.
4. Separate required secrets from optional defaults.
5. Gitignore `.env` and use secret managers in prod.
6. Namespace env vars.
7. Import one settings singleton.
8. Document every required variable.
9. Validate complex constraints explicitly.
10. Support container secret file mounts where needed.
