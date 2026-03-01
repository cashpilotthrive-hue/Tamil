"""Atomic transaction management for the financial toolkit.

All ledger mutations are atomic: either every step of a transaction
succeeds and is permanently recorded, or the ledger is left completely
unchanged (rolled back).
"""

from __future__ import annotations

import threading
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import List, Optional


class TransactionType(str, Enum):
    CREDIT = "credit"
    DEBIT = "debit"
    TRANSFER = "transfer"


@dataclass
class Transaction:
    """Represents a single financial transaction."""

    amount: Decimal
    transaction_type: TransactionType
    description: str = ""
    category: str = ""
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    transaction_id: str = field(default_factory=lambda: str(uuid.uuid4()))

    def __post_init__(self) -> None:
        self.amount = Decimal(str(self.amount))
        if self.amount <= 0:
            raise ValueError("Transaction amount must be positive.")


class InsufficientFundsError(Exception):
    """Raised when a debit would result in a negative balance."""


class TransactionLedger:
    """Thread-safe ledger that records transactions atomically.

    Usage::

        ledger = TransactionLedger()
        ledger.credit(100, "initial deposit")
        ledger.debit(30, "groceries")
        print(ledger.balance)   # Decimal('70')
    """

    def __init__(self, initial_balance: Decimal = Decimal("0")) -> None:
        self._balance: Decimal = Decimal(str(initial_balance))
        self._transactions: List[Transaction] = []
        self._lock = threading.Lock()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @property
    def balance(self) -> Decimal:
        """Current account balance (read-only snapshot)."""
        with self._lock:
            return self._balance

    @property
    def transactions(self) -> List[Transaction]:
        """Immutable snapshot of the transaction history."""
        with self._lock:
            return list(self._transactions)

    def credit(
        self,
        amount: Decimal,
        description: str = "",
        category: str = "",
    ) -> Transaction:
        """Add funds atomically and return the recorded transaction."""
        txn = Transaction(
            amount=Decimal(str(amount)),
            transaction_type=TransactionType.CREDIT,
            description=description,
            category=category,
        )
        with self._lock:
            self._balance += txn.amount
            self._transactions.append(txn)
        return txn

    def debit(
        self,
        amount: Decimal,
        description: str = "",
        category: str = "",
        allow_overdraft: bool = False,
    ) -> Transaction:
        """Remove funds atomically and return the recorded transaction.

        Raises :class:`InsufficientFundsError` when *allow_overdraft* is
        ``False`` (the default) and the balance would go negative.
        """
        txn = Transaction(
            amount=Decimal(str(amount)),
            transaction_type=TransactionType.DEBIT,
            description=description,
            category=category,
        )
        with self._lock:
            if not allow_overdraft and self._balance < txn.amount:
                raise InsufficientFundsError(
                    f"Balance {self._balance} is insufficient for debit of {txn.amount}."
                )
            self._balance -= txn.amount
            self._transactions.append(txn)
        return txn

    def transfer(
        self,
        target: "TransactionLedger",
        amount: Decimal,
        description: str = "",
    ) -> tuple[Transaction, Transaction]:
        """Atomically transfer *amount* from this ledger to *target*.

        Both the debit and the credit are recorded together; if either step
        fails the ledgers are left unchanged.
        """
        amount = Decimal(str(amount))
        # Always acquire locks in a consistent order to avoid deadlocks.
        first, second = sorted([self, target], key=id)
        with first._lock:
            with second._lock:
                if self._balance < amount:
                    raise InsufficientFundsError(
                        f"Balance {self._balance} is insufficient for transfer of {amount}."
                    )
                debit_txn = Transaction(
                    amount=amount,
                    transaction_type=TransactionType.TRANSFER,
                    description=description,
                )
                credit_txn = Transaction(
                    amount=amount,
                    transaction_type=TransactionType.TRANSFER,
                    description=description,
                )
                self._balance -= amount
                self._transactions.append(debit_txn)
                target._balance += amount
                target._transactions.append(credit_txn)
        return debit_txn, credit_txn

    def summary(self) -> dict:
        """Return a summary dict with balance and transaction counts."""
        with self._lock:
            credits = sum(
                t.amount
                for t in self._transactions
                if t.transaction_type == TransactionType.CREDIT
            )
            debits = sum(
                t.amount
                for t in self._transactions
                if t.transaction_type in (TransactionType.DEBIT, TransactionType.TRANSFER)
            )
            return {
                "balance": self._balance,
                "total_credits": credits,
                "total_debits": debits,
                "transaction_count": len(self._transactions),
            }

    def get_transactions_by_category(self, category: str) -> List[Transaction]:
        """Return all transactions matching *category*."""
        with self._lock:
            return [t for t in self._transactions if t.category == category]
