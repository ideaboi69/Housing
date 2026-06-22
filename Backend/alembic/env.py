import sys
from pathlib import Path
from logging.config import fileConfig

from sqlalchemy import pool
from alembic import context

# Make sure the Backend/ directory is on sys.path so we can import tables, config, etc.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config import settings
from tables import Base, engine

# Alembic Config object
config = context.config

# Set up Python logging from the .ini file
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# This is what Alembic diffs against when you run --autogenerate
target_metadata = Base.metadata

# Tables managed by our SQLAlchemy models
MANAGED_TABLES = set(Base.metadata.tables.keys())

# Indexes declared in our SQLAlchemy models (so we don't drop hand-created DB indexes)
MANAGED_INDEXES = set()
for table in Base.metadata.tables.values():
    for idx in table.indexes:
        MANAGED_INDEXES.add(idx.name)

# Columns declared in our SQLAlchemy models (so we don't drop orphaned DB columns)
MANAGED_COLUMNS = {}
for table_name, table in Base.metadata.tables.items():
    MANAGED_COLUMNS[table_name] = set(c.name for c in table.columns)


def include_object(object, name, type_, reflected, compare_to):
    """Only include objects that belong to our SQLAlchemy models.

    This prevents Alembic from trying to drop tables, indexes, columns,
    or constraints that exist in the DB but were created outside of
    SQLAlchemy (raw SQL, legacy tables, hand-created indexes, etc.).
    """
    # Tables: only manage if defined in our models
    if type_ == "table":
        return name in MANAGED_TABLES

    # Indexes: only manage if declared in our models
    if type_ == "index":
        # Index exists in DB but not in models → skip (don't drop it)
        if reflected and compare_to is None:
            return False
        # Index exists in models but not in DB → create it
        if not reflected and compare_to is None:
            return True
        # Both sides exist → only touch if it's one of ours
        return name in MANAGED_INDEXES

    # Columns: skip DB columns that aren't in our models (don't drop them)
    if type_ == "column" and reflected and compare_to is None:
        table_name = getattr(object, "table", None)
        if table_name is not None:
            tname = table_name.name if hasattr(table_name, "name") else str(table_name)
            if tname in MANAGED_COLUMNS:
                return name in MANAGED_COLUMNS[tname]
        return False

    # Unique constraints: skip reflected ones not in our models
    if type_ == "unique_constraint":
        if reflected and compare_to is None:
            return False

    return True


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (generates SQL without connecting)."""
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (connects to the database)."""
    connectable = engine

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=include_object,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
