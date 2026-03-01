"""Portfolio management for the financial toolkit."""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Dict, List, Optional


@dataclass
class Asset:
    """Represents a single financial asset (stock, bond, crypto, etc.)."""

    symbol: str
    name: str
    quantity: Decimal
    purchase_price: Decimal
    current_price: Decimal

    def __post_init__(self) -> None:
        self.quantity = Decimal(str(self.quantity))
        self.purchase_price = Decimal(str(self.purchase_price))
        self.current_price = Decimal(str(self.current_price))

    @property
    def cost_basis(self) -> Decimal:
        """Total amount originally invested in this asset."""
        return self.quantity * self.purchase_price

    @property
    def market_value(self) -> Decimal:
        """Current market value of the holding."""
        return self.quantity * self.current_price

    @property
    def unrealised_gain(self) -> Decimal:
        """Unrealised gain (positive) or loss (negative)."""
        return self.market_value - self.cost_basis

    @property
    def unrealised_gain_pct(self) -> Decimal:
        """Unrealised gain/loss as a percentage of cost basis."""
        if self.cost_basis == 0:
            return Decimal("0")
        return (self.unrealised_gain / self.cost_basis) * 100

    def update_price(self, new_price: Decimal) -> None:
        """Update the current market price for this asset."""
        self.current_price = Decimal(str(new_price))


class Portfolio:
    """A collection of :class:`Asset` holdings.

    Usage::

        p = Portfolio("My Portfolio")
        p.add_asset(Asset("AAPL", "Apple Inc.", 10, 150, 175))
        p.add_asset(Asset("BTC", "Bitcoin", "0.5", 30000, 45000))
        print(p.total_market_value)
    """

    def __init__(self, name: str = "Portfolio") -> None:
        self.name = name
        self._assets: Dict[str, Asset] = {}

    # ------------------------------------------------------------------
    # Asset management
    # ------------------------------------------------------------------

    def add_asset(self, asset: Asset) -> None:
        """Add or replace an asset in the portfolio."""
        self._assets[asset.symbol] = asset

    def remove_asset(self, symbol: str) -> Optional[Asset]:
        """Remove an asset by symbol and return it, or ``None`` if absent."""
        return self._assets.pop(symbol, None)

    def get_asset(self, symbol: str) -> Optional[Asset]:
        """Retrieve an asset by symbol."""
        return self._assets.get(symbol)

    def update_price(self, symbol: str, new_price: Decimal) -> None:
        """Update the current price for an asset.

        Raises :class:`KeyError` if the symbol is not in the portfolio.
        """
        if symbol not in self._assets:
            raise KeyError(f"Asset '{symbol}' not found in portfolio.")
        self._assets[symbol].update_price(new_price)

    # ------------------------------------------------------------------
    # Aggregate metrics
    # ------------------------------------------------------------------

    @property
    def assets(self) -> List[Asset]:
        """List of all assets (snapshot)."""
        return list(self._assets.values())

    @property
    def total_cost_basis(self) -> Decimal:
        """Sum of cost basis across all assets."""
        return sum((a.cost_basis for a in self._assets.values()), Decimal("0"))

    @property
    def total_market_value(self) -> Decimal:
        """Sum of current market value across all assets."""
        return sum((a.market_value for a in self._assets.values()), Decimal("0"))

    @property
    def total_unrealised_gain(self) -> Decimal:
        """Total unrealised gain/loss across all assets."""
        return self.total_market_value - self.total_cost_basis

    @property
    def total_unrealised_gain_pct(self) -> Decimal:
        """Portfolio-level unrealised gain/loss percentage."""
        if self.total_cost_basis == 0:
            return Decimal("0")
        return (self.total_unrealised_gain / self.total_cost_basis) * 100

    def allocation(self) -> Dict[str, Decimal]:
        """Return each asset's percentage of total market value."""
        total = self.total_market_value
        if total == 0:
            return {s: Decimal("0") for s in self._assets}
        return {
            symbol: (asset.market_value / total) * 100
            for symbol, asset in self._assets.items()
        }

    def summary(self) -> dict:
        """High-level portfolio summary."""
        return {
            "name": self.name,
            "asset_count": len(self._assets),
            "total_cost_basis": self.total_cost_basis,
            "total_market_value": self.total_market_value,
            "total_unrealised_gain": self.total_unrealised_gain,
            "total_unrealised_gain_pct": self.total_unrealised_gain_pct,
        }
