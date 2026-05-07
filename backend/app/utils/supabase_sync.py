import logging
import os

logger = logging.getLogger(__name__)

try:
    from supabase import create_client
except ImportError:  # supabase package not installed
    create_client = None


class SupabaseSync:
    _client = None
    _checked = False

    @classmethod
    def get_client(cls):
        if cls._client is not None:
            return cls._client
        if cls._checked:
            return None
        cls._checked = True

        if create_client is None:
            logger.warning("supabase package not installed; skipping cloud sync.")
            return None

        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")
        if not (url and key):
            logger.info("SUPABASE_URL/SUPABASE_KEY not set; cloud sync disabled.")
            return None

        try:
            cls._client = create_client(url, key)
        except Exception as exc:
            logger.error("Failed to initialize Supabase client: %s", exc)
            cls._client = None
        return cls._client

    @classmethod
    def sync_record(cls, table_name, data):
        client = cls.get_client()
        if not client:
            return None
        try:
            if 'id' in data:
                return client.table(table_name).upsert(data).execute()
            return client.table(table_name).insert(data).execute()
        except Exception as exc:
            logger.error("Supabase sync failed for %s: %s", table_name, exc)
            return None
