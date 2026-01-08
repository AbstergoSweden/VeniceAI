#!/usr/bin/env python3
"""
Faye Håkansdotter

Fetches the latest models from Venice.ai API and generates an OpenAI-compatible
providers.yaml-like configuration.

Usage:
  python3 venice_model_sync.py --output providers.yaml
  python3 venice_model_sync.py --format json --output models.json
  python3 venice_model_sync.py --dry-run
"""

from __future__ import annotations

import argparse
import io
import json
import logging
import os
import shutil
import sys
import tempfile
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
from functools import wraps

import requests

try:
    from rich.console import Console
    from rich.table import Table
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False

HARDCODED_API_KEY = "VENICE_API_KEY_HERE"
DEFAULT_BASE_URL = "https://api.venice.ai/api/v1"
DEFAULT_TIMEOUT = 30
DEFAULT_RETRIES = 3
DEFAULT_RETRY_DELAY = 1.0
CACHE_DIR = Path.home() / ".cache" / "venice_sync"
CACHE_FRESH_TTL = 300      # 5 minutes - prefer fresh
CACHE_STALE_TTL = 86400    # 24 hours - fallback if API fails

class OutputFormat(Enum):
    YAML = "yaml"
    JSON = "json"

class ModelType(Enum):
    TEXT = "text"
    IMAGE = "image"
    CODE = "code"
    ALL = "all"

def setup_logging(verbose: bool = False, quiet: bool = False) -> logging.Logger:
    """Configure logging without handler duplication."""
    level = logging.DEBUG if verbose else (logging.WARNING if quiet else logging.INFO)
    
    logger = logging.getLogger("venice_sync")
    logger.handlers.clear()        # Fix: prevent duplicate handlers
    logger.propagate = False       # Fix: don't bubble to root logger
    logger.setLevel(level)
    
    formatter = logging.Formatter(
        fmt="%(asctime)s │ %(levelname)-8s │ %(message)s",
        datefmt="%H:%M:%S"
    )
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    return logger

log = logging.getLogger("venice_sync")

def yaml_escape(s: str) -> str:
    """Escape string for YAML double quotes."""
    return (
        s.replace("\\", "\\\\")
         .replace("\"", "\\\"")
         .replace("\n", "\\n")
         .replace("\r", "\\r")
         .replace("\t", "\\t")
    )

def format_tokens(n: int) -> str:
    """Format token count with K/M suffix."""
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    elif n >= 1_000:
        return f"{n / 1_000:.0f}K"
    return str(n)

def format_price(usd: Optional[float]) -> str:
    """Format price per million tokens. Distinguishes None/missing from 0."""
    if usd is None:
        return "N/A"
    if usd == 0.0:
        return "$0.00/M"  # Explicitly zero, not "Free" (could be unpriced)
    return f"${usd:.2f}/M"

def atomic_write(path: Path, content: str, encoding: str = "utf-8") -> None:
    """Write file atomically using temp file + rename."""
    path.parent.mkdir(parents=True, exist_ok=True)
    
    fd, tmp_path = tempfile.mkstemp(
        dir=path.parent,
        prefix=f".{path.name}.",
        suffix=".tmp"
    )
    try:
        with os.fdopen(fd, "w", encoding=encoding) as f:
            f.write(content)
        os.replace(tmp_path, path)  # Atomic on POSIX and Windows
    except Exception:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise

class RetryableError(Exception):
    """Wrapper for retryable errors with optional delay."""
    def __init__(self, message: str, retry_after: Optional[float] = None):
        super().__init__(message)
        self.retry_after = retry_after

def retry_with_backoff(
    retries: int = DEFAULT_RETRIES,
    delay: float = DEFAULT_RETRY_DELAY,
    backoff: float = 2.0,
    max_delay: float = 60.0,
) -> Callable:
    """
    Decorator for retry logic with exponential backoff.
    Catches RequestException, ValueError (JSON decode), and RetryableError.
    Respects Retry-After header on 429.
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception: Optional[Exception] = None
            current_delay = delay
            
            for attempt in range(retries + 1):
                try:
                    return func(*args, **kwargs)
                except RetryableError as e:
                    last_exception = e
                    wait = e.retry_after if e.retry_after else current_delay
                except (requests.exceptions.RequestException, ValueError, json.JSONDecodeError) as e:
                    last_exception = e
                    wait = current_delay
                else:
                    break
                
                if attempt < retries:
                    wait = min(wait, max_delay)
                    log.warning(f"Attempt {attempt + 1}/{retries + 1} failed: {last_exception}. Retrying in {wait:.1f}s...")
                    time.sleep(wait)
                    current_delay = min(current_delay * backoff, max_delay)
            
            if last_exception:
                raise last_exception
        return wrapper
    return decorator

@dataclass
class ModelCapabilities:
    """Model capability flags."""
    vision: bool = False
    reasoning: bool = False
    function_calling: bool = False
    web_search: bool = False
    code_optimized: bool = False
    response_schema: bool = False
    
    @classmethod
    def from_dict(cls, data: Any) -> "ModelCapabilities":
        if not isinstance(data, dict):
            return cls()
        return cls(
            vision=bool(data.get("supportsVision")),
            reasoning=bool(data.get("supportsReasoning")),
            function_calling=bool(data.get("supportsFunctionCalling")),
            web_search=bool(data.get("supportsWebSearch")),
            code_optimized=bool(data.get("optimizedForCode")),
            response_schema=bool(data.get("supportsResponseSchema")),
        )
    
    def to_list(self) -> List[str]:
        """Return list of enabled capabilities."""
        caps = []
        if self.vision: caps.append("Vision")
        if self.reasoning: caps.append("Reasoning")
        if self.function_calling: caps.append("Tools")
        if self.web_search: caps.append("Web Search")
        if self.code_optimized: caps.append("Code")
        if self.response_schema: caps.append("Structured Output")
        return caps
    
    def to_dict(self) -> Dict[str, bool]:
        """Return dict for serialization."""
        return {
            "vision": self.vision,
            "reasoning": self.reasoning,
            "tools": self.function_calling,
            "web_search": self.web_search,
            "code_optimized": self.code_optimized,
            "response_schema": self.response_schema,
        }

@dataclass
class ModelPricing:
    """Model pricing information. None = unknown/missing."""
    input_usd: Optional[float] = None
    output_usd: Optional[float] = None
    
    @classmethod
    def from_dict(cls, data: Any) -> "ModelPricing":
        if not isinstance(data, dict):
            return cls()
        
        def extract_price(key: str) -> Optional[float]:
            sub = data.get(key)
            if not isinstance(sub, dict):
                return None
            val = sub.get("usd")
            if val is None:
                return None
            try:
                return float(val)
            except (TypeError, ValueError):
                return None
        
        return cls(
            input_usd=extract_price("input"),
            output_usd=extract_price("output"),
        )
    
    def to_dict(self) -> Dict[str, Optional[float]]:
        return {
            "input_per_million": self.input_usd,
            "output_per_million": self.output_usd,
        }

@dataclass
class Model:
    """Represents a Venice.ai model."""
    id: str
    name: str
    model_type: str = "text"
    context_tokens: int = 32768
    default_temperature: float = 0.7
    capabilities: ModelCapabilities = field(default_factory=ModelCapabilities)
    pricing: ModelPricing = field(default_factory=ModelPricing)
    
    @classmethod
    def from_api_response(
        cls,
        data: Dict[str, Any],
        fallback_type: str = "text"  # Fix: pass type from caller
    ) -> Optional["Model"]:
        """Parse a model from API response."""
        model_id = data.get("id")
        if not model_id or not isinstance(model_id, str):
            return None
        
        spec = data.get("model_spec") or {}
        if not isinstance(spec, dict):
            spec = {}
        
        # Model type: use API value if present, else fallback
        model_type = data.get("type") or fallback_type
        
        context = spec.get("availableContextTokens", 32768)
        try:
            context = int(context)
        except (TypeError, ValueError):
            context = 32768
        
        constraints = spec.get("constraints") or {}
        temp_obj = constraints.get("temperature") or {}
        default_temp = 0.7
        if isinstance(temp_obj, dict):
            dt = temp_obj.get("default")
            if isinstance(dt, (int, float)):
                default_temp = float(dt)
        
        return cls(
            id=model_id,
            name=str(spec.get("name") or model_id),
            model_type=model_type,
            context_tokens=context,
            default_temperature=default_temp,
            capabilities=ModelCapabilities.from_dict(spec.get("capabilities")),
            pricing=ModelPricing.from_dict(spec.get("pricing")),
        )
    
    def get_description(self) -> str:
        """Generate description string."""
        caps = self.capabilities.to_list()
        return f"{self.name} - {', '.join(caps)}" if caps else self.name

@dataclass
class CacheEntry:
    """Cache entry with timestamp."""
    data: Any
    timestamp: float

class CacheManager:
    """File-based cache with fresh TTL and stale fallback."""
    
    def __init__(
        self,
        cache_dir: Path = CACHE_DIR,
        fresh_ttl: int = CACHE_FRESH_TTL,
        stale_ttl: int = CACHE_STALE_TTL,
    ):
        self.cache_dir = cache_dir
        self.fresh_ttl = fresh_ttl
        self.stale_ttl = stale_ttl
    
    def _cache_path(self, key: str) -> Path:
        return self.cache_dir / f"{key}.json"
    
    def get(self, key: str) -> Tuple[Optional[Any], bool]:
        """
        Get cached data.
        Returns (data, is_fresh) or (None, False) if not found/expired.
        """
        path = self._cache_path(key)
        if not path.exists():
            return None, False
        
        try:
            mtime = path.stat().st_mtime
            age = time.time() - mtime
            
            with path.open("r") as f:
                data = json.load(f)
            
            if age <= self.fresh_ttl:
                log.debug(f"Cache hit (fresh) for {key}")
                return data, True
            elif age <= self.stale_ttl:
                log.debug(f"Cache hit (stale) for {key}")
                return data, False
            else:
                log.debug(f"Cache expired for {key}")
                return None, False
                
        except Exception as e:
            log.debug(f"Cache read error: {e}")
            return None, False
    
    def get_stale(self, key: str) -> Optional[Any]:
        """Get stale cache as fallback when API fails."""
        path = self._cache_path(key)
        if not path.exists():
            return None
        
        try:
            mtime = path.stat().st_mtime
            age = time.time() - mtime
            
            if age <= self.stale_ttl:
                with path.open("r") as f:
                    log.warning(f"Using stale cache for {key} (age: {age/60:.1f}min)")
                    return json.load(f)
        except Exception as e:
            log.debug(f"Stale cache read error: {e}")
        
        return None
    
    def set(self, key: str, data: Any) -> None:
        """Store data in cache."""
        try:
            self.cache_dir.mkdir(parents=True, exist_ok=True)
            path = self._cache_path(key)
            
            content = json.dumps(data)
            atomic_write(path, content)
            log.debug(f"Cached {key}")
        except Exception as e:
            log.debug(f"Cache write error: {e}")
    
    def clear(self) -> None:
        """Clear all cached data."""
        if self.cache_dir.exists():
            shutil.rmtree(self.cache_dir)
            log.info("Cache cleared")

class VeniceClient:
    """Venice.ai API client with retry and caching."""
    
    def __init__(
        self,
        base_url: str = DEFAULT_BASE_URL,
        timeout: int = DEFAULT_TIMEOUT,
        use_cache: bool = True,
    ):
        self.api_key = HARDCODED_API_KEY
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.cache = CacheManager() if use_cache else None
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "VeniceModelSync/2.1",
        })
    
    @retry_with_backoff(retries=DEFAULT_RETRIES)
    def _fetch(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Fetch data from API with retry logic."""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        log.debug(f"Fetching {url}")
        
        resp = self.session.get(url, params=params, timeout=self.timeout)
        
        # Handle rate limiting with Retry-After
        if resp.status_code == 429:
            retry_after = None
            if "Retry-After" in resp.headers:
                try:
                    retry_after = float(resp.headers["Retry-After"])
                except ValueError:
                    pass
            raise RetryableError(f"Rate limited (429)", retry_after=retry_after)
        
        resp.raise_for_status()
        return resp.json()  # Can raise ValueError/JSONDecodeError
    
    def _fetch_models_for_type(self, model_type: str) -> List[Dict[str, Any]]:
        """Fetch models for a specific type."""
        try:
            data = self._fetch("models", {"type": model_type})
            models = data.get("data", [])
            if not isinstance(models, list):
                return []
            return models
        except Exception as e:
            log.warning(f"Failed to fetch {model_type} models: {e}")
            return []
    
    def fetch_models(self, model_type: ModelType = ModelType.TEXT) -> List[Model]:
        """Fetch models from Venice.ai API with cache support."""
        cache_key = f"models_{model_type.value}"
        
        if self.cache:
            cached_data, is_fresh = self.cache.get(cache_key)
            if cached_data and is_fresh:
                return self._parse_cached_models(cached_data, model_type)
        
        raw_models: List[Dict[str, Any]] = []
        fetch_error: Optional[Exception] = None
        
        try:
            if model_type == ModelType.ALL:
                for mt in [ModelType.TEXT, ModelType.IMAGE, ModelType.CODE]:
                    fetched = self._fetch_models_for_type(mt.value)
                    for m in fetched:
                        if "type" not in m:
                            m["_fallback_type"] = mt.value
                    raw_models.extend(fetched)
            else:
                raw_models = self._fetch_models_for_type(model_type.value)
                for m in raw_models:
                    if "type" not in m:
                        m["_fallback_type"] = model_type.value
            
            if raw_models and self.cache:
                self.cache.set(cache_key, raw_models)
                
        except Exception as e:
            fetch_error = e
            log.error(f"API fetch failed: {e}")
        
        if not raw_models and self.cache:
            stale_data = self.cache.get_stale(cache_key)
            if stale_data:
                raw_models = stale_data
            elif fetch_error:
                raise fetch_error
        
        return self._parse_models(raw_models, model_type)
    
    def _parse_cached_models(self, cached: List[Dict], model_type: ModelType) -> List[Model]:
        """Parse models from cache (Fix: no double parsing)."""
        return self._parse_models(cached, model_type)
    
    def _parse_models(self, raw_models: List[Dict], model_type: ModelType) -> List[Model]:
        """Parse raw model dicts into Model objects."""
        models: List[Model] = []
        default_type = model_type.value if model_type != ModelType.ALL else "text"
        
        for raw in raw_models:
            fallback = raw.pop("_fallback_type", default_type)
            model = Model.from_api_response(raw, fallback_type=fallback)
            if model:
                models.append(model)
        
        log.info(f"Parsed {len(models)} models")
        return sorted(models, key=lambda m: m.id)
    
    def get_api_status(self) -> Dict[str, Any]:
        """Check API status."""
        try:
            data = self._fetch("models", {"type": "text"})
            return {
                "status": "ok",
                "models_available": len(data.get("data", [])),
            }
        except requests.exceptions.HTTPError as e:
            return {
                "status": "error",
                "code": e.response.status_code if e.response else None,
                "message": str(e),
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

class OutputGenerator:
    """Base class for output generation."""
    
    def __init__(self, base_url: str, embed_key: bool = False):
        self.base_url = base_url
        self.embed_key = embed_key
        self.timestamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    
    def _get_key_value(self) -> str:
        return HARDCODED_API_KEY if self.embed_key else "${VENICE_API_KEY}"
    
    def generate_content(self, models: List[Model]) -> str:
        """Generate output content as string."""
        raise NotImplementedError
    
    def write(self, models: List[Model], output_path: Path) -> bool:
        """Write content to file atomically."""
        try:
            content = self.generate_content(models)
            atomic_write(output_path, content)
            return True
        except Exception as e:
            log.error(f"Failed to write output: {e}")
            return False

class YAMLGenerator(OutputGenerator):
    """Generate YAML configuration."""
    
    def generate_content(self, models: List[Model]) -> str:
        buf = io.StringIO()
        
        buf.write("---\n")
        buf.write(f"# Venice.ai Provider Configuration\n")
        buf.write(f"# Generated: {self.timestamp} (UTC)\n")
        buf.write(f"# Models: {len(models)}\n\n")
        buf.write("providers:\n")
        buf.write("  - id: venice\n")
        buf.write("    name: Venice.ai\n")
        buf.write(f"    base_url: {self.base_url}\n")
        buf.write("    api_keys:\n")
        buf.write(f"      openai: {self._get_key_value()}\n")
        buf.write("    models:\n")
        
        for model in models:
            caps = model.capabilities
            buf.write(f"\n      # {model.get_description()}\n")
            buf.write(f"      - id: {model.id}\n")
            buf.write(f"        name: \"{yaml_escape(model.name)}\"\n")
            buf.write(f"        type: {model.model_type}\n")
            buf.write(f"        context: {model.context_tokens}\n")
            buf.write("        provider: venice\n")
            buf.write("        abilities:\n")
            buf.write(f"          temperature: {{ supported: true, default: {model.default_temperature} }}\n")
            buf.write(f"          vision: {{ supported: {str(caps.vision).lower()} }}\n")
            buf.write(f"          tools: {{ supported: {str(caps.function_calling).lower()} }}\n")
            buf.write(f"          web_search: {{ supported: {str(caps.web_search).lower()} }}\n")
            buf.write(f"          reasoning: {{ supported: {str(caps.reasoning).lower()} }}\n")
            buf.write(f"          code_optimized: {{ supported: {str(caps.code_optimized).lower()} }}\n")
            buf.write(f"          response_schema: {{ supported: {str(caps.response_schema).lower()} }}\n")
            
            price_in = format_price(model.pricing.input_usd)
            price_out = format_price(model.pricing.output_usd)
            buf.write(f"        # pricing: {price_in} in / {price_out} out\n")
        
        return buf.getvalue()

class JSONGenerator(OutputGenerator):
    """Generate JSON configuration."""
    
    def generate_content(self, models: List[Model]) -> str:
        config = {
            "metadata": {
                "generated": self.timestamp,
                "generator": "VeniceModelSync/2.1",
                "model_count": len(models),
            },
            "providers": [{
                "id": "venice",
                "name": "Venice.ai",
                "base_url": self.base_url,
                "api_key": self._get_key_value(),
                "models": [
                    {
                        "id": m.id,
                        "name": m.name,
                        "type": m.model_type,
                        "context": m.context_tokens,
                        "default_temperature": m.default_temperature,
                        "capabilities": m.capabilities.to_dict(),
                        "pricing": m.pricing.to_dict(),
                    }
                    for m in models
                ]
            }]
        }
        return json.dumps(config, indent=2)

def print_model_summary(models: List[Model]) -> None:
    """Print model summary."""
    if RICH_AVAILABLE:
        _print_summary_rich(models)
    else:
        _print_summary_plain(models)

def _print_summary_rich(models: List[Model]) -> None:
    console = Console()
    table = Table(
        title=f"🚀 Venice.ai Models ({len(models)})",
        show_header=True,
        header_style="bold magenta",
    )
    
    table.add_column("Model ID", style="cyan", no_wrap=True)
    table.add_column("Name", style="white")
    table.add_column("Type", style="dim")
    table.add_column("Context", justify="right", style="green")
    table.add_column("Pricing (in/out)", justify="right", style="yellow")
    table.add_column("Capabilities", style="blue")
    
    for m in models:
        caps = ", ".join(m.capabilities.to_list()) or "—"
        pricing = f"{format_price(m.pricing.input_usd)}/{format_price(m.pricing.output_usd)}"
        table.add_row(m.id, m.name, m.model_type, format_tokens(m.context_tokens), pricing, caps)
    
    console.print()
    console.print(table)
    console.print()

def _print_summary_plain(models: List[Model]) -> None:
    print("\n" + "=" * 95)
    print(f"  Venice.ai Models ({len(models)})")
    print("=" * 95)
    
    for m in models:
        caps = m.capabilities.to_list()
        print(f"\n📦 {m.name} [{m.model_type}]")
        print(f"   ID:      {m.id}")
        print(f"   Context: {format_tokens(m.context_tokens)} tokens")
        print(f"   Pricing: {format_price(m.pricing.input_usd)} in / {format_price(m.pricing.output_usd)} out")
        if caps:
            print(f"   Caps:    {', '.join(caps)}")
    
    print("\n" + "=" * 95 + "\n")

def create_backup(path: Path) -> Optional[Path]:
    """Create backup of existing file."""
    if not path.exists():
        return None
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = path.with_suffix(f".{timestamp}.bak")
    shutil.copy2(path, backup_path)
    log.info(f"Created backup: {backup_path}")
    return backup_path

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Sync Venice.ai models and generate provider configuration",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                           # Generate YAML with model summary
  %(prog)s -o config.yaml            # Custom output path
  %(prog)s -f json -o models.json    # Generate JSON
  %(prog)s --dry-run                 # Preview generated content
  %(prog)s --no-cache                # Force fresh API fetch
  %(prog)s -t all                    # Fetch all model types
"""
    )
    
    parser.add_argument("-o", "--output", default="providers.yaml", help="Output file (default: providers.yaml)")
    parser.add_argument("-f", "--format", choices=["yaml", "json"], default="yaml", help="Output format")
    parser.add_argument("-t", "--type", choices=["text", "image", "code", "all"], default="text", help="Model type")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="API base URL")
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT, help="HTTP timeout (seconds)")
    parser.add_argument("--embed-key", action="store_true", help="Embed API key in output")
    parser.add_argument("--no-summary", action="store_true", help="Skip model summary")
    parser.add_argument("--no-backup", action="store_true", help="Don't backup existing file")
    parser.add_argument("--no-cache", action="store_true", help="Disable caching")
    parser.add_argument("--clear-cache", action="store_true", help="Clear cache and exit")
    parser.add_argument("--dry-run", action="store_true", help="Preview output without writing")
    parser.add_argument("--check", action="store_true", help="Check API status and exit")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose logging")
    parser.add_argument("-q", "--quiet", action="store_true", help="Quiet mode")
    
    return parser.parse_args()

def main() -> int:
    args = parse_args()
    setup_logging(verbose=args.verbose, quiet=args.quiet)
    
    if args.clear_cache:
        CacheManager().clear()
        return 0
    
    client = VeniceClient(
        base_url=args.base_url,
        timeout=args.timeout,
        use_cache=not args.no_cache,
    )
    
    if args.check:
        status = client.get_api_status()
        if status["status"] == "ok":
            print(f"✅ API OK - {status['models_available']} models available")
            return 0
        print(f"❌ API Error: {status.get('message', 'Unknown')}")
        return 1
    
    model_type = ModelType(args.type)
    log.info(f"Fetching {model_type.value} models...")
    
    try:
        models = client.fetch_models(model_type)
    except Exception as e:
        log.error(f"Failed to fetch models: {e}")
        return 1
    
    if not models:
        log.error("No models found")
        return 1
    
    if not args.no_summary and not args.quiet:
        print_model_summary(models)
    
    generator: OutputGenerator
    if args.format == "json":
        generator = JSONGenerator(args.base_url, args.embed_key)
    else:
        generator = YAMLGenerator(args.base_url, args.embed_key)
    
    content = generator.generate_content(models)
    
    # Dry run: print content and exit
    if args.dry_run:
        print(f"\n{'─' * 60}")
        print(f"DRY RUN - Would write to: {args.output}")
        print(f"{'─' * 60}\n")
        print(content)
        return 0
    
    output_path = Path(args.output)
    
    if not args.no_backup:
        create_backup(output_path)
    
    try:
        atomic_write(output_path, content)
        if not args.quiet:
            print(f"✅ Wrote {output_path} ({len(models)} models)")
        return 0
    except Exception as e:
        log.error(f"Failed to write file: {e}")
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
