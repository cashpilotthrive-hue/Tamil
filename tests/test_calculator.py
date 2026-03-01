"""Tests for toolkit.calculator."""

from decimal import Decimal

import pytest

from toolkit.calculator import (
    compound_interest,
    future_value,
    loan_payment,
    present_value,
    roi,
    simple_interest,
)


class TestSimpleInterest:
    def test_basic(self):
        result = simple_interest(1000, 0.05, 3)
        assert result == Decimal("150")

    def test_zero_rate(self):
        assert simple_interest(1000, 0, 5) == Decimal("0")


class TestCompoundInterest:
    def test_annual_compounding(self):
        result = compound_interest(1000, 0.1, 1, 1)
        assert result == Decimal("100")

    def test_monthly_compounding_greater_than_annual(self):
        annual = compound_interest(1000, 0.12, 1, 1)
        monthly = compound_interest(1000, 0.12, 1, 12)
        assert monthly > annual


class TestFutureValue:
    def test_no_growth(self):
        fv = future_value(1000, 0, 5)
        assert fv == Decimal("1000")

    def test_doubles_at_100_pct(self):
        fv = future_value(1000, 1.0, 1)
        assert fv == Decimal("2000")


class TestPresentValue:
    def test_inverse_of_future_value(self):
        principal = Decimal("1000")
        rate = Decimal("0.05")
        periods = 10
        fv = future_value(principal, rate, periods)
        pv = present_value(fv, rate, periods)
        assert abs(pv - principal) < Decimal("0.0001")


class TestLoanPayment:
    def test_zero_interest_rate(self):
        payment = loan_payment(1200, 0, 12)
        assert payment == Decimal("100")

    def test_positive_rate(self):
        payment = loan_payment(100000, 0.06, 360)
        # Standard 30-year mortgage at 6% should be ~$599.55
        assert Decimal("590") < payment < Decimal("610")


class TestROI:
    def test_positive_roi(self):
        result = roi(1000, 250)
        assert result == Decimal("25")

    def test_negative_roi(self):
        result = roi(1000, -100)
        assert result == Decimal("-10")

    def test_zero_cost_raises(self):
        with pytest.raises(ValueError):
            roi(0, 100)
