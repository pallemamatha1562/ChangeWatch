import sys
from pathlib import Path

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1] / "backend")
)

from app.services.website_service import fetch_website


def test_fetch_website():
    result = fetch_website("https://example.com")

    assert result["url"] == "https://example.com"
    assert result["title"]
    assert result["content"]
    assert result["content_hash"]

    print("\nWebsite title:", result["title"])
    print("Extracted content:", result["content"][:300])
    print("Content hash:", result["content_hash"])


if __name__ == "__main__":
    test_fetch_website()
    print("\nChangeWatch website fetching test passed!")