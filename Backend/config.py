from pydantic_settings import BaseSettings
from pydantic import computed_field

class Settings(BaseSettings):
    HGUSER: str
    HGPASSWORD: str
    HGDB: str
    HGHOST: str
    HGPORT: int = 5432

    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql://{self.HGUSER}:"
            f"{self.HGPASSWORD}@"
            f"{self.HGHOST}:"
            f"{self.HGPORT}/"
            f"{self.HGDB}"
            "?sslmode=require"
        )

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()