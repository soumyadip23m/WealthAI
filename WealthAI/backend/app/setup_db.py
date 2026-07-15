import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "portfolio.db")

def build_database():
    print("Connecting to database...")
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DB_PATH = os.path.join(BASE_DIR, "portfolio.db")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("Creating relational schema tables...")

    # 1. Users Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 2. Assets Master Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS assets (
        asset_id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT UNIQUE NOT NULL,
        asset_name TEXT NOT NULL,
        asset_category TEXT CHECK(asset_category IN ('Stock', 'ETF', 'Mutual Fund', 'Crypto')) NOT NULL,
        risk_level TEXT DEFAULT 'Medium'
    )
    ''')

    # 3. User Holdings Aggregate Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_holdings (
        holding_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        asset_id INTEGER NOT NULL,
        total_quantity NUMERIC NOT NULL DEFAULT 0,
        average_buy_price NUMERIC NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
        UNIQUE (user_id, asset_id)
    )
    ''')

    # 4. Transaction Immutable Ledger
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS transactions (
        transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        asset_id INTEGER NOT NULL,
        transaction_type TEXT CHECK(transaction_type IN ('BUY', 'SELL', 'SIP')) NOT NULL,
        quantity NUMERIC NOT NULL,
        price_per_unit NUMERIC NOT NULL,
        total_amount NUMERIC,
        transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (asset_id) REFERENCES assets(asset_id)
    )
    ''')

    # Insert default root user profile context
    try:
        cursor.execute("INSERT INTO users (full_name, email) VALUES ('Test User', 'test@wealthai.com')")
    except sqlite3.IntegrityError:
        pass 

    conn.commit()
    conn.close()
    print("✅ Database structural schema generated successfully.")

if __name__ == "__main__":
    build_database()