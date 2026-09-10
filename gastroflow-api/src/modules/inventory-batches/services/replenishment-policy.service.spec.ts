import { ReplenishmentPolicyService } from './replenishment-policy.service';

describe('ReplenishmentPolicyService', () => {
  it('recommends enough stock to reach the target quantity when stock is low', () => {
    const service = new ReplenishmentPolicyService();

    const result = service.calculate({
      availableQuantity: 1500,
      lowStockThresholdQuantity: 2000,
      targetStockQuantity: 10000
    });

    expect(result.shouldReplenish).toBe(true);
    expect(result.suggestedOrderQuantity).toBe(8500);
  });

  it('rejects a target stock quantity below the low stock threshold', () => {
    const service = new ReplenishmentPolicyService();

    expect(() => {
      service.calculate({
        availableQuantity: 1500,
        lowStockThresholdQuantity: 2000,
        targetStockQuantity: 1000
      });
    }).toThrow('Target stock quantity must be greater than or equal to the low stock threshold');
  });


  it('does not replentish when available stock is exactly at te low stock threshold', () => {
    const service = new ReplenishmentPolicyService();
    const result = service.calculate({
      availableQuantity: 2000,
      lowStockThresholdQuantity: 2000,
      targetStockQuantity: 10000
    })

    expect(result.shouldReplenish).toBe(false);
    expect(result.suggestedOrderQuantity).toBe(0);
  });

  it('recommends the full target quantity when stock is zero', () => {
    const service = new ReplenishmentPolicyService();

    const result = service.calculate({
      availableQuantity: 0,
      lowStockThresholdQuantity: 2000,
      targetStockQuantity: 10000
    });

    expect(result.shouldReplenish).toBe(true);
    expect(result.suggestedOrderQuantity).toBe(10000);
  });

  it('calls the replenishment policy when calculating suggestions', async () => {
    const policy = new ReplenishmentPolicyService();

    const calculateSpy = jest.spyOn(
      policy,
      'calculate'
    );

    policy.calculate({
      availableQuantity: 1500,
      lowStockThresholdQuantity: 2000,
      targetStockQuantity: 10000
    });

    expect(calculateSpy).toHaveBeenCalledWith({
      availableQuantity: 1500,
      lowStockThresholdQuantity: 2000,
      targetStockQuantity: 10000
    });
  });

});