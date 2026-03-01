"""Budget management for the financial toolkit."""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Dict, List, Optional


@dataclass
class BudgetCategory:
    """A named spending category with an allocated limit."""

    name: str
    allocated: Decimal
    spent: Decimal = Decimal("0")

    def __post_init__(self) -> None:
        self.allocated = Decimal(str(self.allocated))
        self.spent = Decimal(str(self.spent))

    @property
    def remaining(self) -> Decimal:
        """Amount remaining to spend in this category."""
        return self.allocated - self.spent

    @property
    def utilisation_pct(self) -> Decimal:
        """Percentage of the allocated budget that has been spent."""
        if self.allocated == 0:
            return Decimal("0")
        return (self.spent / self.allocated) * 100

    @property
    def is_over_budget(self) -> bool:
        """``True`` if spending has exceeded the allocation."""
        return self.spent > self.allocated

    def record_expense(self, amount: Decimal) -> None:
        """Record an expense against this category."""
        amount = Decimal(str(amount))
        if amount <= 0:
            raise ValueError("Expense amount must be positive.")
        self.spent += amount


class Budget:
    """A period budget composed of :class:`BudgetCategory` items.

    Usage::

        b = Budget("Monthly - March 2024", total_income=Decimal("5000"))
        b.add_category(BudgetCategory("Rent", 1500))
        b.add_category(BudgetCategory("Food", 600))
        b.record_expense("Food", 45.50)
        print(b.summary())
    """

    def __init__(
        self,
        name: str,
        total_income: Decimal = Decimal("0"),
    ) -> None:
        self.name = name
        self.total_income = Decimal(str(total_income))
        self._categories: Dict[str, BudgetCategory] = {}

    # ------------------------------------------------------------------
    # Category management
    # ------------------------------------------------------------------

    def add_category(self, category: BudgetCategory) -> None:
        """Add or replace a budget category."""
        self._categories[category.name] = category

    def remove_category(self, name: str) -> Optional[BudgetCategory]:
        """Remove a category by name and return it, or ``None``."""
        return self._categories.pop(name, None)

    def get_category(self, name: str) -> Optional[BudgetCategory]:
        """Retrieve a category by name."""
        return self._categories.get(name)

    def record_expense(self, category_name: str, amount: Decimal) -> None:
        """Record an expense in a specific category.

        Raises :class:`KeyError` if *category_name* is not found.
        """
        if category_name not in self._categories:
            raise KeyError(f"Category '{category_name}' not found in budget.")
        self._categories[category_name].record_expense(amount)

    # ------------------------------------------------------------------
    # Aggregate metrics
    # ------------------------------------------------------------------

    @property
    def categories(self) -> List[BudgetCategory]:
        """List of all categories (snapshot)."""
        return list(self._categories.values())

    @property
    def total_allocated(self) -> Decimal:
        """Sum of all category allocations."""
        return sum((c.allocated for c in self._categories.values()), Decimal("0"))

    @property
    def total_spent(self) -> Decimal:
        """Sum of all category spending so far."""
        return sum((c.spent for c in self._categories.values()), Decimal("0"))

    @property
    def unallocated(self) -> Decimal:
        """Income not yet assigned to any category."""
        return self.total_income - self.total_allocated

    @property
    def remaining(self) -> Decimal:
        """Total budget remaining (allocated but not yet spent)."""
        return self.total_allocated - self.total_spent

    @property
    def over_budget_categories(self) -> List[BudgetCategory]:
        """All categories where spending exceeds the allocation."""
        return [c for c in self._categories.values() if c.is_over_budget]

    def summary(self) -> dict:
        """High-level budget summary."""
        return {
            "name": self.name,
            "total_income": self.total_income,
            "total_allocated": self.total_allocated,
            "unallocated": self.unallocated,
            "total_spent": self.total_spent,
            "remaining": self.remaining,
            "category_count": len(self._categories),
            "over_budget_categories": [c.name for c in self.over_budget_categories],
        }
