import sqlite3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import yfinance as yf
import urllib.request
import urllib.parse
import json

app = FastAPI()

# Ensure frontend can talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "portfolio.db")

# 1. Fixed Model with proper imports
class TransactionCreate(BaseModel):
    transaction_type: str = "BUY"
    symbol: str
    quantity: float
    price_per_unit: float
    transaction_date: Optional[str] = None

# 2. Added the missing market-data endpoint
@app.get("/api/market-data/{symbol}")
def get_market_data(symbol: str):
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period="1d")
        if not data.empty:
            return {"c": float(data['Close'].iloc[-1])}
        return {"c": 0}
    except Exception as e:
        print(f"Market data error for {symbol}: {e}")
        return {"c": 0}

@app.get("/api/search-symbols")
def search_symbols(query: str):
    if not query or len(query.strip()) < 1:
        return {"results": []}
    try:
        # Hit Yahoo Finance's live search API with a standard User-Agent
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={urllib.parse.quote(query)}&quotesCount=8"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            quotes = data.get("quotes", [])
            results = []
            for q in quotes:
                # Filter strictly for tradable securities (Stocks, ETFs, Mutual Funds, Indices)
                if q.get("quoteType") in ["EQUITY", "ETF", "MUTUALFUND", "INDEX", "CURRENCY"]:
                    results.append({
                        "symbol": q.get("symbol"),
                        "name": q.get("shortname") or q.get("longname") or q.get("symbol"),
                        "exchange": q.get("exchDisp") or q.get("exchange", "")
                    })
            return {"results": results}
    except Exception as e:
        print(f"Search API Error: {e}")
        return {"results": []}

@app.get("/api/portfolio")
def get_portfolio():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT
                a.asset_id,
                h.total_quantity,
                h.average_buy_price,
                a.symbol,
                a.asset_name
            FROM user_holdings h
            JOIN assets a
            ON h.asset_id = a.asset_id
            WHERE h.user_id = 1
            AND h.total_quantity > 0
        ''')
        rows = cursor.fetchall()
        
        holdings = []
        total_investment = 0.0
        total_current_value = 0.0
        
        for row in rows:
            symbol = row["symbol"]
            qty = float(row["total_quantity"])
            avg_price = float(row["average_buy_price"])
            
            live_price = avg_price
            try:
                ticker = yf.Ticker(symbol)
                data = ticker.history(period="1d")
                if not data.empty:
                    live_price = float(data['Close'].iloc[-1])
            except Exception:
                pass
            
            investment = qty * avg_price
            current_value = qty * live_price
            pnl = current_value - investment
            pnl_pct = (pnl / investment * 100) if investment > 0 else 0
            
            total_investment += investment
            total_current_value += current_value
            
            holdings.append({
                "id": row["asset_id"],  
                "symbol": symbol,
                "asset_name": row["asset_name"],
                "quantity": qty,
                "average_price": round(avg_price, 2),
                "live_price": round(live_price, 2),
                "investment": round(investment, 2),
                "current_value": round(current_value, 2),
                "pnl": round(pnl, 2),
                "pnl_pct": round(pnl_pct, 2)
            })
            
        total_pnl = total_current_value - total_investment
        total_pnl_pct = (total_pnl / total_investment * 100) if total_investment > 0 else 0
        
        conn.close()
        return {
            "holdings": holdings,
            "summary": {
                "total_investment": round(total_investment, 2),
                "total_current_value": round(total_current_value, 2),
                "total_pnl": round(total_pnl, 2),
                "total_pnl_pct": round(total_pnl_pct, 2)
            }
        }
    except Exception as e:
        return {"error": str(e), "holdings": [], "summary": {"total_investment": 0, "total_current_value": 0, "total_pnl": 0, "total_pnl_pct": 0}}

@app.post("/api/transactions")
def add_transaction(tx: TransactionCreate):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        symbol = tx.symbol.upper().strip()
        tx_date = tx.transaction_date if tx.transaction_date else datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.execute("SELECT asset_id FROM assets WHERE symbol = ?", (symbol,))
        asset_row = cursor.fetchone()
        if not asset_row:
            cursor.execute(
                "INSERT INTO assets (symbol, asset_name, asset_category) VALUES (?, ?, 'Stock')", 
                (symbol, symbol.split('.')[0])
            )
            asset_id = cursor.lastrowid
        else:
            asset_id = asset_row[0]
            
        cursor.execute('''
            INSERT INTO transactions (user_id, asset_id, transaction_type, quantity, price_per_unit, transaction_date)
            VALUES (1, ?, ?, ?, ?, ?)
        ''', (asset_id, tx.transaction_type, tx.quantity, tx.price_per_unit, tx_date))
        
        cursor.execute("SELECT total_quantity, average_buy_price FROM user_holdings WHERE user_id = 1 AND asset_id = ?", (asset_id,))
        holding_row = cursor.fetchone()
        
        if holding_row:
            current_qty, current_avg = float(holding_row[0]), float(holding_row[1])
            
            if tx.transaction_type == 'SELL':
                new_qty = current_qty - tx.quantity
                new_avg = current_avg # Selling doesn't change your average buy price
            else:
                new_qty = current_qty + tx.quantity
                new_avg = ((current_qty * current_avg) + (tx.quantity * tx.price_per_unit)) / new_qty if new_qty > 0 else 0
                
            cursor.execute('''
                UPDATE user_holdings 
                SET total_quantity = ?, average_buy_price = ?
                WHERE user_id = 1 AND asset_id = ?
            ''', (new_qty, new_avg, asset_id))
        else:
            cursor.execute('''
                INSERT INTO user_holdings (user_id, asset_id, total_quantity, average_buy_price)
                VALUES (1, ?, ?, ?)
            ''', (asset_id, tx.quantity, tx.price_per_unit))
            
        conn.commit()
        conn.close()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
    
@app.delete("/api/portfolio/{asset_id}")
def delete_asset(asset_id: int):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute(
            "DELETE FROM user_holdings WHERE user_id=1 AND asset_id=?",
            (asset_id,)
        )
        
        # Capture how many rows were actually removed
        rows_deleted = cursor.rowcount

        cursor.execute(
            "DELETE FROM transactions WHERE user_id=1 AND asset_id=?",
            (asset_id,)
        )

        if rows_deleted == 0:
            conn.rollback() # Abort the transaction
            conn.close()
            return {"success": False, "error": "Asset not found"}

        conn.commit()
        conn.close()

        return {"success": True}

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }