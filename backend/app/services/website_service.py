import hashlib
import ipaddress
import socket

import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse


def validate_url(url: str):
    """Validate a URL before requesting a public webpage."""

    parsed = urlparse(url)

    if parsed.scheme not in ("http", "https"):
        raise ValueError("Only HTTP and HTTPS URLs are allowed.")

    if not parsed.hostname:
        raise ValueError("Invalid URL.")

    if parsed.username or parsed.password:
        raise ValueError("URLs containing credentials are not allowed.")

    hostname = parsed.hostname.lower()

    if hostname == "localhost" or hostname.endswith(".localhost"):
        raise ValueError("Local addresses are not allowed.")

    try:
        addresses = socket.getaddrinfo(
            hostname,
            parsed.port or (443 if parsed.scheme == "https" else 80),
            type=socket.SOCK_STREAM
        )
    except socket.gaierror:
        raise ValueError("Could not resolve the website address.")

    for address in addresses:
        ip = ipaddress.ip_address(address[4][0])

        if not ip.is_global:
            raise ValueError("Private or non-public addresses are not allowed.")

    return url


def fetch_website(url: str):
    """Fetch a public webpage and extract readable text."""

    validate_url(url)

    response = requests.get(
        url,
        timeout=10,
        headers={
            "User-Agent": "ChangeWatch/1.0 (Website monitoring prototype)"
        },
        allow_redirects=False
    )

    response.raise_for_status()

    if "text/html" not in response.headers.get("Content-Type", "").lower():
        raise ValueError("The URL did not return an HTML webpage.")

    if len(response.content) > 2_000_000:
        raise ValueError("Webpage is too large to process.")

    soup = BeautifulSoup(response.text, "html.parser")

    for element in soup(["script", "style", "noscript", "svg"]):
        element.decompose()

    title = soup.title.string.strip() if soup.title and soup.title.string else "Untitled"

    content = soup.get_text(separator=" ", strip=True)

    content = " ".join(content.split())

    content_hash = hashlib.sha256(
        content.encode("utf-8")
    ).hexdigest()

    return {
        "url": url,
        "title": title,
        "content": content,
        "content_hash": content_hash
    }