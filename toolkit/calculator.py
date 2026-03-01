"""Core financial calculations for the autonomous financial atomic toolkit.

All functions operate on :class:`decimal.Decimal` values for precision;
plain ``int`` and ``float`` inputs are automatically converted.
"""

from __future__ import annotations

from decimal import Decimal


def _d(value) -> Decimal:
    """Coerce *value* to :class:`Decimal`."""
    return Decimal(str(value))


def simple_interest(principal: Decimal, rate: Decimal, periods: int) -> Decimal:
    """Calculate simple interest.

    Args:
        principal: Starting amount.
        rate: Annual interest rate as a decimal (e.g. ``0.05`` for 5 %).
        periods: Number of periods (years).

    Returns:
        Interest earned (not the total; add *principal* for the total).
    """
    return _d(principal) * _d(rate) * _d(periods)


def compound_interest(
    principal: Decimal,
    rate: Decimal,
    periods: int,
    compounding_frequency: int = 1,
) -> Decimal:
    """Calculate compound interest earned over *periods* years.

    Args:
        principal: Starting amount.
        rate: Annual interest rate as a decimal.
        periods: Number of years.
        compounding_frequency: How many times interest is compounded per year
            (e.g. ``12`` for monthly, ``365`` for daily).

    Returns:
        Interest earned (not the total).
    """
    p = _d(principal)
    r = _d(rate)
    n = _d(compounding_frequency)
    t = _d(periods)
    total = p * (1 + r / n) ** (n * t)
    return total - p


def future_value(
    principal: Decimal,
    rate: Decimal,
    periods: int,
    compounding_frequency: int = 1,
) -> Decimal:
    """Return the future value of *principal* after *periods* years.

    Args:
        principal: Present value / initial investment.
        rate: Annual interest rate as a decimal.
        periods: Number of years.
        compounding_frequency: Times interest is compounded per year.
    """
    return _d(principal) + compound_interest(principal, rate, periods, compounding_frequency)


def present_value(
    future_amount: Decimal,
    rate: Decimal,
    periods: int,
    compounding_frequency: int = 1,
) -> Decimal:
    """Return the present value of a *future_amount*.

    This is the inverse of :func:`future_value`.

    Args:
        future_amount: Amount to be received in the future.
        rate: Annual discount rate as a decimal.
        periods: Number of years until the amount is received.
        compounding_frequency: Times interest is compounded per year.
    """
    r = _d(rate)
    n = _d(compounding_frequency)
    t = _d(periods)
    divisor = (1 + r / n) ** (n * t)
    return _d(future_amount) / divisor


def loan_payment(
    principal: Decimal,
    annual_rate: Decimal,
    num_payments: int,
) -> Decimal:
    """Calculate the fixed periodic payment for a fully amortising loan.

    Args:
        principal: Loan principal.
        annual_rate: Annual interest rate as a decimal.
        num_payments: Total number of monthly payments.

    Returns:
        Fixed payment amount per period.
    """
    p = _d(principal)
    r = _d(annual_rate) / 12  # monthly rate
    n = num_payments
    if r == 0:
        return p / _d(n)
    numerator = r * (1 + r) ** n
    denominator = (1 + r) ** n - 1
    return p * (numerator / denominator)


def roi(cost: Decimal, gain: Decimal) -> Decimal:
    """Return the return on investment as a percentage.

    Args:
        cost: Total cost / initial investment.
        gain: Net gain (revenue minus cost, *not* total revenue).

    Returns:
        ROI as a percentage (e.g. ``25`` for 25 %).
    """
    cost = _d(cost)
    if cost == 0:
        raise ValueError("Cost cannot be zero when calculating ROI.")
    return (_d(gain) / cost) * 100
