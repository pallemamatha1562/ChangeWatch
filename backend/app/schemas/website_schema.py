from pydantic import BaseModel, HttpUrl, Field


class WebsiteCreate(BaseModel):
    url: HttpUrl
    category: str = Field(default="General", max_length=100)
    description: str | None = Field(default=None, max_length=1000)


class WebsiteResponse(BaseModel):
    id: int
    url: str
    title: str | None
    category: str
    description: str | None

    class Config:
        from_attributes = True