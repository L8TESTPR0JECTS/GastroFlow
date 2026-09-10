import { Injectable } from "@nestjs/common";

export interface ReplenishmentPolicyInput {
  availableQuantity: number;
  lowStockThresholdQuantity: number;
  targetStockQuantity: number;
}

export interface ReplenishmentPolicyResult {
  shouldReplenish: boolean;
  suggestedOrderQuantity: number;
}

@Injectable()
export class ReplenishmentPolicyService {

  calculate(
    input: ReplenishmentPolicyInput
  ): ReplenishmentPolicyResult {

    if (
      input.targetStockQuantity <
      input.lowStockThresholdQuantity
    ) {
      throw new Error(
        'Target stock quantity must be greater than or equal to the low stock threshold'
      );
    }
    const shouldReplenish = input.availableQuantity < input.lowStockThresholdQuantity;

    if (!shouldReplenish) {
      return {
        shouldReplenish: false,
        suggestedOrderQuantity: 0
      };
    }

    return {
      shouldReplenish: true,
      suggestedOrderQuantity: input.targetStockQuantity - input.availableQuantity
    };
  }

}