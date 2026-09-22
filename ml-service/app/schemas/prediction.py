"""
FastAPI Pydantic Schemas for Internal ML Inference API
Conforms to OpenAPI 3.0.3 specification schemas.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field

class FeaturePayload(BaseModel):
    monthlyIncome: float = Field(..., ge=0, description="Monthly income in INR")
    monthlyExpenses: float = Field(..., ge=0, description="Monthly non-debt expenses")
    monthlyEmi: float = Field(default=0.0, ge=0, description="Monthly EMI obligations")
    averageBalance: float = Field(default=0.0, description="Average account balance")
    incomeStability: Optional[float] = Field(default=0.85, ge=0, le=1)
    incomeVolatility: Optional[float] = Field(default=0.15, ge=0)
    expenseVolatility: Optional[float] = Field(default=0.12, ge=0)
    cashFlowSurplus: Optional[float] = Field(default=None)
    debtToIncome: Optional[float] = Field(default=None, ge=0)
    transactionRegularity: Optional[float] = Field(default=0.85, ge=0, le=1)
    savingsRate: Optional[float] = Field(default=None)
    failedPaymentCount: Optional[int] = Field(default=0, ge=0)
    recurringObligationAmount: Optional[float] = Field(default=0.0, ge=0)
    nonDebtRecurringObligations: Optional[float] = Field(default=0.0, ge=0)
    existingDebtAmount: Optional[float] = Field(default=0.0, ge=0)
    observationMonths: Optional[int] = Field(default=24, ge=1, le=60)
    bureauHistoryAvailable: Optional[bool] = Field(default=False)
    creditHistoryLengthMonths: Optional[int] = Field(default=0, ge=0)
    # V2 24-Month Temporal and Behavioral Features
    minimumBalanceRatio: Optional[float] = Field(default=0.20, ge=0)
    negativeCashflowMonths: Optional[int] = Field(default=0, ge=0, le=60)
    incomeTrend3m: Optional[float] = Field(default=0.0)
    utilityPaymentConsistency: Optional[float] = Field(default=0.88, ge=0, le=1)
    digitalTransactionRatio: Optional[float] = Field(default=0.82, ge=0, le=1)

class MLPredictionRequest(BaseModel):
    applicationId: str = Field(..., description="Unique application identifier")
    modelVersion: Optional[str] = Field(default="logistic_regression_v2.0.0")
    featureSetVersion: Optional[str] = Field(default="feature_set_v2")
    features: Dict[str, Any] = Field(..., description="Financial feature dictionary")

class RiskFactor(BaseModel):
    feature: str
    value: Any
    contribution: float = Field(..., ge=0)
    direction: str = Field(..., pattern="^(POSITIVE|NEGATIVE|NEUTRAL)$")
    impact: Optional[str] = None

class FactorsPayload(BaseModel):
    positive: List[RiskFactor] = Field(default_factory=list)
    negative: List[RiskFactor] = Field(default_factory=list)

class ModelMetadata(BaseModel):
    name: str
    version: str
    featureSetVersion: str
    algorithm: str = "LOGISTIC_REGRESSION"
    trainedAt: Optional[str] = None
    trainingDataType: str = "SYNTHETIC"

class MLPredictionResponse(BaseModel):
    applicationId: str
    model: ModelMetadata
    defaultProbability: float = Field(..., ge=0.0, le=1.0)
    riskScore: int = Field(..., ge=0, le=100)
    riskBand: str = Field(..., pattern="^(LOW|MODERATE|HIGH)$")
    factors: FactorsPayload
    generatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ReadinessResponse(BaseModel):
    status: str
    checks: Dict[str, str]
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
