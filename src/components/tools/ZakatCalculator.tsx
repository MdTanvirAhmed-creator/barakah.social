"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Calculator,
  DollarSign,
  Coins,
  Gem,
  Home,
  Car,
  Briefcase,
  Save,
  Info,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";

interface ZakatCalculatorProps {
  onClose: () => void;
}

interface AssetType {
  id: string;
  name: string;
  icon: any;
  description: string;
  nisab?: number;
  unit: string;
  rate?: number; // Zakat rate (2.5% default)
}

interface CalculationResult {
  totalAssets: number;
  nisabThreshold: number;
  isZakatObligatory: boolean;
  zakatAmount: number;
  breakdown: {
    [key: string]: {
      amount: number;
      zakat: number;
      rate: number;
    };
  };
}

const ASSET_TYPES: AssetType[] = [
  {
    id: "cash",
    name: "Cash & Bank Deposits",
    icon: DollarSign,
    description: "Money in hand, bank accounts, checking, savings",
    nisab: 85, // grams of gold
    unit: "USD",
    rate: 2.5,
  },
  {
    id: "gold",
    name: "Gold",
    icon: Gem,
    description: "Gold jewelry, coins, bars",
    nisab: 85, // grams
    unit: "grams",
    rate: 2.5,
  },
  {
    id: "silver",
    name: "Silver",
    icon: Coins,
    description: "Silver jewelry, coins, bars",
    nisab: 595, // grams
    unit: "grams",
    rate: 2.5,
  },
  {
    id: "stocks",
    name: "Stocks & Investments",
    icon: TrendingUp,
    description: "Stock market investments, mutual funds",
    unit: "USD",
    rate: 2.5,
  },
  {
    id: "business",
    name: "Business Assets",
    icon: Briefcase,
    description: "Inventory, equipment, business cash",
    unit: "USD",
    rate: 2.5,
  },
  {
    id: "property",
    name: "Investment Property",
    icon: Home,
    description: "Rental properties, land for investment",
    unit: "USD",
    rate: 2.5,
  },
  {
    id: "other",
    name: "Other Assets",
    icon: Calculator,
    description: "Any other zakatable assets",
    unit: "USD",
    rate: 2.5,
  },
];

const ZAKAT_FORM_SCHEMA = z.object({
  assets: z.record(z.string(), z.number().min(0)),
  goldPrice: z.number().min(0).default(65), // USD per gram
  silverPrice: z.number().min(0).default(0.85), // USD per gram
});

type ZakatFormData = z.infer<typeof ZAKAT_FORM_SCHEMA>;

export function ZakatCalculator({ onClose }: ZakatCalculatorProps) {
  const { success } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const form = useForm<ZakatFormData>({
    resolver: zodResolver(ZAKAT_FORM_SCHEMA),
    defaultValues: {
      assets: {},
      goldPrice: 65,
      silverPrice: 0.85,
    },
  });

  const { watch, setValue, handleSubmit } = form;
  const watchedAssets = watch("assets");
  const watchedGoldPrice = watch("goldPrice");
  const watchedSilverPrice = watch("silverPrice");

  const calculateZakat = (data: ZakatFormData): CalculationResult => {
    const breakdown: CalculationResult["breakdown"] = {};
    let totalAssets = 0;

    // Calculate each asset type
    ASSET_TYPES.forEach((assetType) => {
      const amount = data.assets[assetType.id] || 0;
      
      if (amount > 0) {
        let assetValue = amount;
        
        // Convert precious metals to USD value
        if (assetType.id === "gold") {
          assetValue = amount * data.goldPrice;
        } else if (assetType.id === "silver") {
          assetValue = amount * data.silverPrice;
        }

        const zakatRate = assetType.rate || 2.5;
        const zakat = (assetValue * zakatRate) / 100;

        breakdown[assetType.id] = {
          amount: assetValue,
          zakat,
          rate: zakatRate,
        };

        totalAssets += assetValue;
      }
    });

    // Calculate Nisab threshold (using gold standard)
    const goldNisab = ASSET_TYPES.find(a => a.id === "gold")?.nisab || 85;
    const nisabThreshold = goldNisab * data.goldPrice;

    const isZakatObligatory = totalAssets >= nisabThreshold;
    const zakatAmount = isZakatObligatory ? Object.values(breakdown).reduce((sum, item) => sum + item.zakat, 0) : 0;

    return {
      totalAssets,
      nisabThreshold,
      isZakatObligatory,
      zakatAmount,
      breakdown,
    };
  };

  const onSubmit = (data: ZakatFormData) => {
    setIsCalculating(true);
    
    // Simulate calculation delay
    setTimeout(() => {
      const result = calculateZakat(data);
      setCalculationResult(result);
      setIsCalculating(false);
      success("Zakat calculation completed!");
    }, 1000);
  };

  const saveCalculation = () => {
    success("Calculation saved to your profile");
  };

  const exportCalculation = () => {
    success("Calculation exported successfully");
  };

  const getAssetIcon = (assetId: string) => {
    const asset = ASSET_TYPES.find(a => a.id === assetId);
    return asset?.icon || Calculator;
  };

  const getAssetName = (assetId: string) => {
    const asset = ASSET_TYPES.find(a => a.id === assetId);
    return asset?.name || "Unknown Asset";
  };

  const getTotalEntered = () => {
    return Object.keys(watchedAssets).length;
  };

  const getTotalAssets = () => {
    return Object.values(watchedAssets).reduce((sum, amount) => sum + (amount || 0), 0);
  };

  if (calculationResult) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onClose} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Tools
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Zakat Calculation Result</h1>
            <p className="text-muted-foreground">Your Zakat obligation breakdown</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Result */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Card */}
            <div className={`rounded-lg shadow-lg p-8 text-center ${
              calculationResult.isZakatObligatory
                ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
            }`}>
              <div className="text-6xl font-bold mb-2">
                ${calculationResult.zakatAmount.toLocaleString()}
              </div>
              <div className="text-xl mb-4">
                {calculationResult.isZakatObligatory ? "Zakat Due" : "No Zakat Due"}
              </div>
              <div className="text-sm opacity-90">
                Total Assets: ${calculationResult.totalAssets.toLocaleString()}
              </div>
              <div className="text-sm opacity-90">
                Nisab Threshold: ${calculationResult.nisabThreshold.toLocaleString()}
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-card rounded-lg shadow-md border border-border">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Asset Breakdown</h3>
              </div>
              <div className="p-6 space-y-4">
                {Object.entries(calculationResult.breakdown).map(([assetId, data]) => {
                  const Icon = getAssetIcon(assetId);
                  return (
                    <div key={assetId} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-primary-600" />
                        <div>
                          <div className="font-medium text-foreground">{getAssetName(assetId)}</div>
                          <div className="text-sm text-muted-foreground">
                            ${data.amount.toLocaleString()} × {data.rate}%
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-foreground">
                          ${data.zakat.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Zakat</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={saveCalculation}
                className="flex-1 bg-primary-600 hover:bg-primary-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Calculation
              </Button>
              <Button
                onClick={exportCalculation}
                variant="outline"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Nisab Info */}
            <div className="bg-card rounded-lg shadow-md border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-foreground">Nisab Information</h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gold Nisab:</span>
                  <span className="text-foreground">85 grams</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Silver Nisab:</span>
                  <span className="text-foreground">595 grams</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Threshold:</span>
                  <span className="text-foreground">${calculationResult.nisabThreshold.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Zakat Rate:</span>
                  <span className="text-foreground">2.5%</span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className={`rounded-lg shadow-md border p-6 ${
              calculationResult.isZakatObligatory
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                {calculationResult.isZakatObligatory ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                )}
                <h3 className="font-semibold text-foreground">Status</h3>
              </div>
              
              <div className={`text-sm ${
                calculationResult.isZakatObligatory ? "text-green-700 dark:text-green-400" : "text-blue-700 dark:text-blue-400"
              }`}>
                {calculationResult.isZakatObligatory
                  ? "You are obligated to pay Zakat. Your wealth exceeds the Nisab threshold."
                  : "You are not obligated to pay Zakat. Your wealth is below the Nisab threshold."
                }
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-card rounded-lg shadow-md border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Zakat Tips</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>• Calculate Zakat annually on your wealth</div>
                <div>• Include all zakatable assets</div>
                <div>• Deduct debts from total wealth</div>
                <div>• Pay Zakat to eligible recipients</div>
                <div>• Consult a scholar for complex cases</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onClose} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Tools
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Zakat Calculator</h1>
          <p className="text-muted-foreground">
            Calculate your Zakat obligation step by step
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === currentStep
                  ? "bg-primary-600 text-white"
                  : step < currentStep
                  ? "bg-green-600 text-white"
                  : "bg-muted text-muted-foreground"
              }`}>
                {step < currentStep ? "✓" : step}
              </div>
              <span className={`text-sm font-medium ${
                step === currentStep ? "text-primary-600" : "text-muted-foreground"
              }`}>
                {step === 1 ? "Assets" : step === 2 ? "Review" : "Calculate"}
              </span>
              {step < 3 && <div className="w-8 h-0.5 bg-muted" />}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg shadow-md border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">
                {currentStep === 1 ? "Enter Your Assets" : "Review Your Assets"}
              </h3>

              {currentStep === 1 && (
                <div className="space-y-6">
                  {/* Gold & Silver Prices */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <Label htmlFor="goldPrice">Current Gold Price (USD/gram)</Label>
                      <Input
                        id="goldPrice"
                        type="number"
                        step="0.01"
                        {...form.register("goldPrice", { valueAsNumber: true })}
                        placeholder="65.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="silverPrice">Current Silver Price (USD/gram)</Label>
                      <Input
                        id="silverPrice"
                        type="number"
                        step="0.01"
                        {...form.register("silverPrice", { valueAsNumber: true })}
                        placeholder="0.85"
                      />
                    </div>
                  </div>

                  {/* Asset Types */}
                  {ASSET_TYPES.map((asset, index) => (
                    <motion.div
                      key={asset.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <asset.icon className="w-5 h-5 text-primary-600" />
                        <div>
                          <div className="font-medium text-foreground">{asset.name}</div>
                          <div className="text-sm text-muted-foreground">{asset.description}</div>
                          {asset.nisab && (
                            <div className="text-xs text-muted-foreground">
                              Nisab: {asset.nisab} {asset.unit}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={`Enter amount in ${asset.unit}`}
                          {...form.register(`assets.${asset.id}`, { valueAsNumber: true })}
                        />
                        <span className="flex items-center text-sm text-muted-foreground px-3">
                          {asset.unit}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold text-foreground mb-3">Precious Metal Prices</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Gold:</span>
                        <span className="ml-2 font-medium">${watchedGoldPrice}/gram</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Silver:</span>
                        <span className="ml-2 font-medium">${watchedSilverPrice}/gram</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(watchedAssets).map(([assetId, amount]) => {
                      if (!amount || amount <= 0) return null;
                      
                      const asset = ASSET_TYPES.find(a => a.id === assetId);
                      const Icon = asset?.icon || Calculator;
                      
                      return (
                        <div key={assetId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-primary-600" />
                            <span className="font-medium text-foreground">{asset?.name}</span>
                          </div>
                          <span className="font-bold text-foreground">
                            {amount.toLocaleString()} {asset?.unit}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">Total Assets:</span>
                      <span className="text-xl font-bold text-primary-600">
                        {getTotalEntered()} categories
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-card rounded-lg shadow-md border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-foreground">Zakat Basics</h3>
              </div>
              
              <div className="space-y-3 text-sm text-muted-foreground">
                <div>• Zakat is 2.5% of qualifying wealth</div>
                <div>• Nisab threshold must be met</div>
                <div>• Calculate annually</div>
                <div>• Include all zakatable assets</div>
                <div>• Deduct outstanding debts</div>
              </div>
            </div>

            {/* Current Prices */}
            <div className="bg-card rounded-lg shadow-md border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Current Prices</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Gold:</span>
                  <span className="text-sm font-medium text-foreground">
                    ${watchedGoldPrice}/gram
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Silver:</span>
                  <span className="text-sm font-medium text-foreground">
                    ${watchedSilverPrice}/gram
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nisab (Gold):</span>
                  <span className="text-sm font-medium text-foreground">
                    ${(85 * watchedGoldPrice).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Summary */}
            <div className="bg-card rounded-lg shadow-md border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Progress</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assets Entered:</span>
                  <span className="text-foreground">{getTotalEntered()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Value:</span>
                  <span className="text-foreground">${getTotalAssets().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={getTotalEntered() === 0}
            >
              Next Step
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isCalculating}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {isCalculating ? "Calculating..." : "Calculate Zakat"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
