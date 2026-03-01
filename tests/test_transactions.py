"""Tests for toolkit.transactions."""

import threading
from decimal import Decimal

import pytest

from toolkit.transactions import (
    InsufficientFundsError,
    Transaction,
    TransactionLedger,
    TransactionType,
)


class TestTransaction:
    def test_amount_converted_to_decimal(self):
        txn = Transaction(amount=100, transaction_type=TransactionType.CREDIT)
        assert isinstance(txn.amount, Decimal)
        assert txn.amount == Decimal("100")

    def test_positive_amount_required(self):
        with pytest.raises(ValueError):
            Transaction(amount=0, transaction_type=TransactionType.CREDIT)

    def test_negative_amount_rejected(self):
        with pytest.raises(ValueError):
            Transaction(amount=-50, transaction_type=TransactionType.DEBIT)

    def test_unique_transaction_ids(self):
        t1 = Transaction(amount=1, transaction_type=TransactionType.CREDIT)
        t2 = Transaction(amount=1, transaction_type=TransactionType.CREDIT)
        assert t1.transaction_id != t2.transaction_id


class TestTransactionLedger:
    def test_initial_balance_zero(self):
        ledger = TransactionLedger()
        assert ledger.balance == Decimal("0")

    def test_custom_initial_balance(self):
        ledger = TransactionLedger(initial_balance=Decimal("500"))
        assert ledger.balance == Decimal("500")

    def test_credit_increases_balance(self):
        ledger = TransactionLedger()
        ledger.credit(200, "deposit")
        assert ledger.balance == Decimal("200")

    def test_debit_decreases_balance(self):
        ledger = TransactionLedger(initial_balance=Decimal("100"))
        ledger.debit(30)
        assert ledger.balance == Decimal("70")

    def test_debit_raises_on_insufficient_funds(self):
        ledger = TransactionLedger(initial_balance=Decimal("50"))
        with pytest.raises(InsufficientFundsError):
            ledger.debit(100)

    def test_debit_allows_overdraft_when_flag_set(self):
        ledger = TransactionLedger(initial_balance=Decimal("10"))
        ledger.debit(50, allow_overdraft=True)
        assert ledger.balance == Decimal("-40")

    def test_transaction_history_recorded(self):
        ledger = TransactionLedger()
        ledger.credit(100)
        ledger.debit(40)
        assert len(ledger.transactions) == 2

    def test_transactions_snapshot_is_copy(self):
        ledger = TransactionLedger()
        ledger.credit(100)
        snapshot = ledger.transactions
        ledger.credit(50)
        assert len(snapshot) == 1

    def test_transfer_moves_funds(self):
        src = TransactionLedger(initial_balance=Decimal("200"))
        dst = TransactionLedger()
        src.transfer(dst, Decimal("75"), "test transfer")
        assert src.balance == Decimal("125")
        assert dst.balance == Decimal("75")

    def test_transfer_raises_on_insufficient_funds(self):
        src = TransactionLedger(initial_balance=Decimal("10"))
        dst = TransactionLedger()
        with pytest.raises(InsufficientFundsError):
            src.transfer(dst, Decimal("100"))

    def test_transfer_is_atomic_on_failure(self):
        src = TransactionLedger(initial_balance=Decimal("10"))
        dst = TransactionLedger()
        try:
            src.transfer(dst, Decimal("100"))
        except InsufficientFundsError:
            pass
        assert src.balance == Decimal("10")
        assert dst.balance == Decimal("0")

    def test_summary(self):
        ledger = TransactionLedger()
        ledger.credit(300)
        ledger.debit(100)
        s = ledger.summary()
        assert s["balance"] == Decimal("200")
        assert s["total_credits"] == Decimal("300")
        assert s["total_debits"] == Decimal("100")
        assert s["transaction_count"] == 2

    def test_get_transactions_by_category(self):
        ledger = TransactionLedger()
        ledger.credit(100, category="salary")
        ledger.debit(20, category="food")
        ledger.debit(15, category="food")
        food_txns = ledger.get_transactions_by_category("food")
        assert len(food_txns) == 2

    def test_thread_safety_concurrent_credits(self):
        ledger = TransactionLedger()
        threads = [
            threading.Thread(target=lambda: ledger.credit(1))
            for _ in range(100)
        ]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        assert ledger.balance == Decimal("100")
        assert len(ledger.transactions) == 100
