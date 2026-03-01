# Tamil — Autonomous Financial Atomic Toolkit

A lightweight, pure-Python toolkit for autonomous financial management with **atomic** transaction guarantees.

## Features

| Module | Description |
|---|---|
| `toolkit.transactions` | Thread-safe ledger with atomic credit / debit / transfer operations |
| `toolkit.portfolio` | Multi-asset portfolio tracking with unrealised P&L and allocation |
| `toolkit.budget` | Period budgeting with per-category expense tracking |
| `toolkit.calculator` | Core financial calculations (compound interest, PV/FV, loan payments, ROI) |

## Quick Start

```python
from decimal import Decimal
from toolkit.transactions import TransactionLedger
from toolkit.portfolio import Asset, Portfolio
from toolkit.budget import Budget, BudgetCategory
from toolkit import compound_interest, loan_payment

# --- Atomic Transactions ---
ledger = TransactionLedger(initial_balance=Decimal("1000"))
ledger.credit(500, description="Freelance invoice", category="income")
ledger.debit(200, description="Rent", category="housing")
print(ledger.balance)        # Decimal('1300')
print(ledger.summary())

# --- Atomic Transfer between ledgers ---
savings = TransactionLedger()
ledger.transfer(savings, Decimal("300"), description="Monthly savings")

# --- Portfolio Tracking ---
portfolio = Portfolio("My Investments")
portfolio.add_asset(Asset("AAPL", "Apple Inc.", 10, Decimal("150"), Decimal("175")))
portfolio.add_asset(Asset("BTC",  "Bitcoin",    1,  Decimal("30000"), Decimal("45000")))
print(portfolio.total_market_value)        # Decimal('46750')
print(portfolio.total_unrealised_gain_pct) # ~47 %

# --- Budget Management ---
budget = Budget("March 2024", total_income=Decimal("5000"))
budget.add_category(BudgetCategory("Rent", Decimal("1500")))
budget.add_category(BudgetCategory("Food", Decimal("600")))
budget.record_expense("Food", Decimal("45.50"))
print(budget.summary())

# --- Financial Calculations ---
interest = compound_interest(principal=10000, rate=0.07, periods=10, compounding_frequency=12)
payment  = loan_payment(principal=200000, annual_rate=0.065, num_payments=360)
```

## Running Tests

```bash
python -m pytest tests/ -v
```

## License

Apache 2.0 — see [LICENSE](LICENSE).
