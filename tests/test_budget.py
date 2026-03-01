"""Tests for toolkit.budget."""

from decimal import Decimal

import pytest

from toolkit.budget import Budget, BudgetCategory


class TestBudgetCategory:
    def test_remaining(self):
        cat = BudgetCategory("Food", 600)
        cat.record_expense(Decimal("100"))
        assert cat.remaining == Decimal("500")

    def test_utilisation_pct(self):
        cat = BudgetCategory("Food", 600)
        cat.record_expense(Decimal("300"))
        assert cat.utilisation_pct == Decimal("50")

    def test_over_budget(self):
        cat = BudgetCategory("Food", 100)
        cat.record_expense(Decimal("150"))
        assert cat.is_over_budget

    def test_not_over_budget(self):
        cat = BudgetCategory("Food", 100)
        cat.record_expense(Decimal("50"))
        assert not cat.is_over_budget

    def test_expense_must_be_positive(self):
        cat = BudgetCategory("Food", 100)
        with pytest.raises(ValueError):
            cat.record_expense(Decimal("0"))

    def test_zero_allocated_utilisation(self):
        cat = BudgetCategory("Empty", 0)
        assert cat.utilisation_pct == Decimal("0")


class TestBudget:
    def _budget(self):
        b = Budget("March", total_income=Decimal("5000"))
        b.add_category(BudgetCategory("Rent", 1500))
        b.add_category(BudgetCategory("Food", 600))
        return b

    def test_total_allocated(self):
        b = self._budget()
        assert b.total_allocated == Decimal("2100")

    def test_unallocated(self):
        b = self._budget()
        assert b.unallocated == Decimal("2900")

    def test_record_expense(self):
        b = self._budget()
        b.record_expense("Food", Decimal("45.50"))
        assert b.get_category("Food").spent == Decimal("45.50")

    def test_record_expense_missing_category(self):
        b = Budget("Test")
        with pytest.raises(KeyError):
            b.record_expense("NonExistent", Decimal("10"))

    def test_total_spent(self):
        b = self._budget()
        b.record_expense("Rent", Decimal("1500"))
        b.record_expense("Food", Decimal("200"))
        assert b.total_spent == Decimal("1700")

    def test_remaining(self):
        b = self._budget()
        b.record_expense("Food", Decimal("200"))
        assert b.remaining == Decimal("1900")

    def test_over_budget_categories(self):
        b = self._budget()
        b.record_expense("Food", Decimal("800"))
        assert len(b.over_budget_categories) == 1
        assert b.over_budget_categories[0].name == "Food"

    def test_summary_keys(self):
        b = self._budget()
        s = b.summary()
        assert "total_income" in s
        assert "over_budget_categories" in s
