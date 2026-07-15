import sqlite3

def seed_database():
    print("Populating database with mock transactional assets...")
    conn = sqlite3.connect('portfolio.db')
    cursor = conn.cursor()

    # Seed core global tracking target indices without Crypto
    cursor.executescript('''
        INSERT OR IGNORE INTO assets (asset_id, symbol, asset_name, asset_category) VALUES 
        (1, 'RELIANCE', 'Reliance Industries', 'Stock'),
        (2, 'HDFCMID', 'HDFC Midcap Opp', 'Mutual Fund');
    ''')

    # Assign dynamic portfolio metrics mirroring explicit system design specifications
    cursor.executescript('''
        INSERT OR IGNORE INTO user_holdings (user_id, asset_id, total_quantity, average_buy_price) VALUES 
        (1, 1, 500, 2490.00),     -- Stocks aggregate total target: ₹1,245,000
        (1, 2, 10000, 85.00);     -- Mutual Funds aggregate total target: ₹850,000
    ''')

    conn.commit()
    conn.close()
    print("✅ Transactional seed matrices deployed successfully.")

if __name__ == "__main__":
    seed_database()