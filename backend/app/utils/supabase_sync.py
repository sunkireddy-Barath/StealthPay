import os

try:
    from supabase import create_client
    _SUPABASE_AVAILABLE = True
except ImportError:
    _SUPABASE_AVAILABLE = False


class SupabaseSync:
    _client = None

    @classmethod
    def get_client(cls):
        if not _SUPABASE_AVAILABLE:
            return None
        if cls._client is None:
            url = os.environ.get("SUPABASE_URL")
            key = os.environ.get("SUPABASE_KEY")
            if url and key:
                cls._client = create_client(url, key)
        return cls._client

    @classmethod
    def sync_record(cls, table_name, data):
        client = cls.get_client()
        if client:
            try:
                if 'id' in data:
                    return client.table(table_name).upsert(data).execute()
                else:
                    return client.table(table_name).insert(data).execute()
            except Exception as e:
                print(f"Supabase sync failed for {table_name}: {e}")
        return None
