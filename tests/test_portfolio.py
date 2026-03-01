"""Tests for toolkit.portfolio."""

from decimal import Decimal

import pytest

from toolkit.portfolio import Asset, Portfolio


class TestAsset:
    def _asset(self, qty=10, buy=100, cur=120):
        return Asset("TST", "Test Corp", qty, buy, cur)

    def test_cost_basis(self):
        a = self._asset(qty=10, buy=100)
        assert a.cost_basis == Decimal("1000")

    def test_market_value(self):
        a = self._asset(qty=10, cur=150)
        assert a.market_value == Decimal("1500")

    def test_unrealised_gain_positive(self):
        a = self._asset(qty=10, buy=100, cur=120)
        assert a.unrealised_gain == Decimal("200")

    def test_unrealised_gain_negative(self):
        a = self._asset(qty=10, buy=100, cur=80)
        assert a.unrealised_gain == Decimal("-200")

    def test_unrealised_gain_pct(self):
        a = self._asset(qty=10, buy=100, cur=110)
        assert a.unrealised_gain_pct == Decimal("10")

    def test_update_price(self):
        a = self._asset(cur=100)
        a.update_price(200)
        assert a.current_price == Decimal("200")


class TestPortfolio:
    def _portfolio(self):
        p = Portfolio("Test")
        p.add_asset(Asset("AAPL", "Apple", 10, 150, 175))
        p.add_asset(Asset("GOOG", "Google", 5, 2000, 2200))
        return p

    def test_total_cost_basis(self):
        p = self._portfolio()
        assert p.total_cost_basis == Decimal("10") * 150 + Decimal("5") * 2000

    def test_total_market_value(self):
        p = self._portfolio()
        assert p.total_market_value == Decimal("10") * 175 + Decimal("5") * 2200

    def test_total_unrealised_gain(self):
        p = self._portfolio()
        expected = p.total_market_value - p.total_cost_basis
        assert p.total_unrealised_gain == expected

    def test_remove_asset(self):
        p = self._portfolio()
        removed = p.remove_asset("AAPL")
        assert removed is not None
        assert p.get_asset("AAPL") is None

    def test_remove_nonexistent_asset_returns_none(self):
        p = Portfolio()
        assert p.remove_asset("XYZ") is None

    def test_update_price(self):
        p = self._portfolio()
        p.update_price("AAPL", Decimal("200"))
        assert p.get_asset("AAPL").current_price == Decimal("200")

    def test_update_price_missing_symbol_raises(self):
        p = Portfolio()
        with pytest.raises(KeyError):
            p.update_price("MISSING", Decimal("100"))

    def test_allocation_sums_to_100(self):
        p = self._portfolio()
        alloc = p.allocation()
        total = sum(alloc.values())
        assert abs(total - 100) < Decimal("0.0001")

    def test_empty_portfolio_allocation(self):
        p = Portfolio()
        alloc = p.allocation()
        assert alloc == {}

    def test_summary_keys(self):
        p = self._portfolio()
        s = p.summary()
        assert "total_market_value" in s
        assert "total_unrealised_gain_pct" in s
