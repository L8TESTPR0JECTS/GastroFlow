import { useEffect, useMemo, useState } from 'react';
import './App.css';
import type { DashboardData } from './api/dashboardData';
import { gastroflowApi } from './api/gastroflowApi';
import type {
  CreateRecipeSaleConsumptionDto,
  CreateWasteEventDto,
  Ingredient,
  InventoryBatch,
  Recommendation,
  Recipe,
  RunSimulationDto,
  SimulationResult,
  WasteReason,
} from './api/types';
import { useDashboardSocket } from './realtime/useDashboardSocket';
import { fetchDashboardData, setRestaurantId as setDashboardRestaurantId } from './store/dashboardSlice';
import { useAppDispatch, useAppSelector } from './store/hooks';

const simulationOptions = [
  { label: 'Full day', path: '/simulations/timeline/full-day' },
  { label: 'Week', path: '/simulations/timeline/week' },
  { label: 'Lunch rush', path: '/simulations/timeline/lunch-rush' },
  { label: 'Supplier delivery', path: '/simulations/scenario/supplier-delivery' },
  { label: 'Waste spike', path: '/simulations/scenario/waste-spike' },
  { label: 'Overbuying', path: '/simulations/scenario/overbuying' },
  { label: 'Follow recommendations', path: '/simulations/scenario/follow-recommendations' },
  { label: 'Ignore recommendations', path: '/simulations/scenario/ignore-recommendations' },
];

const wasteReasons: WasteReason[] = ['EXPIRED', 'SPOILED', 'DAMAGED', 'OVERPRODUCED', 'MANUAL_DISCARD'];

interface MenuCartItem {
  recipe: Recipe;
  quantity: number;
}

interface MenuIngredientTotal {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
}

interface InventoryIngredientRow {
  ingredient: Ingredient;
  availableQuantity: number;
  inventoryValue: number;
  activeBatchCount: number;
  nextExpirationAt?: string;
  status: 'NO_STOCK' | 'LOW_STOCK' | 'AVAILABLE';
}

type ActionResult = string | { message: string; refreshRestaurantId?: string };

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(value);
}

function formatDate(value?: string) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function EmptyState({ message }: { message: string }) {
  return <p className="empty-state">{message}</p>;
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section className="panel error-panel">
      <div>
        <h2>Unable to load dashboard</h2>
        <p>{message}</p>
      </div>
      <button type="button" onClick={onRetry}>
        Retry
      </button>
    </section>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {helper ? <small>{helper}</small> : null}
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  return <span className={`status-badge status-${value.toLowerCase().replaceAll('_', '-')}`}>{value}</span>;
}

function App() {
  const dispatch = useAppDispatch();
  const activeRestaurantId = useAppSelector((state) => state.dashboard.restaurantId);
  const data = useAppSelector((state) => state.dashboard.data);
  const dashboardStatus = useAppSelector((state) => state.dashboard.status);
  const error = useAppSelector((state) => state.dashboard.error);
  const lastLoadedAt = useAppSelector((state) => state.dashboard.lastLoadedAt);
  const socketStatus = useAppSelector((state) => state.dashboard.socketStatus);
  const socketError = useAppSelector((state) => state.dashboard.socketError);
  const lastSocketEvent = useAppSelector((state) => state.dashboard.lastSocketEvent);
  const [restaurantId, setRestaurantIdInput] = useState(activeRestaurantId);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActionRunning, setIsActionRunning] = useState(false);
  const [saleForm, setSaleForm] = useState({ recipeId: '', quantitySold: 1, notes: '' });
  const [wasteForm, setWasteForm] = useState({ inventoryBatchId: '', quantityWasted: 1, reason: 'SPOILED' as WasteReason, notes: '' });
  const [simulationPath, setSimulationPath] = useState(simulationOptions[0].path);
  const [simulationIntensity, setSimulationIntensity] = useState<RunSimulationDto['intensity']>('NORMAL');
  const [simulationSeed, setSimulationSeed] = useState('');
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isMenuPlannerOpen, setIsMenuPlannerOpen] = useState(false);
  const [menuCart, setMenuCart] = useState<MenuCartItem[]>([]);
  const isLoading = dashboardStatus === 'idle' || dashboardStatus === 'loading';
  const isRefreshing = dashboardStatus === 'refreshing';

  useDashboardSocket(activeRestaurantId);

  const activeBatches = useMemo(
    () =>
      (data?.inventoryBatches ?? []).filter(
        (batch) => batch.isActive && batch.quantityAvailable > 0 && batch.status !== 'DEPLETED',
      ),
    [data?.inventoryBatches],
  );

  const activeRecipes = useMemo(
    () => (data?.recipes ?? []).filter((recipe) => recipe.isActive && recipe.status === 'ACTIVE'),
    [data?.recipes],
  );

  const menuTotals = useMemo(() => {
    return menuCart.reduce(
      (totals, item) => {
        const revenue = item.recipe.menuPrice * item.quantity;
        const inventoryCost = item.recipe.estimatedIngredientCost * item.quantity;
        return {
          revenue: totals.revenue + revenue,
          inventoryCost: totals.inventoryCost + inventoryCost,
          grossProfit: totals.grossProfit + revenue - inventoryCost,
        };
      },
      { revenue: 0, inventoryCost: 0, grossProfit: 0 },
    );
  }, [menuCart]);

  const menuIngredientTotals = useMemo(() => {
    const totalsByIngredient = new Map<string, MenuIngredientTotal>();

    menuCart.forEach((item) => {
      item.recipe.ingredients.forEach((ingredient) => {
        const current = totalsByIngredient.get(ingredient.ingredientId) ?? {
          ingredientId: ingredient.ingredientId,
          ingredientName: ingredient.ingredientName,
          quantity: 0,
          unit: ingredient.unit,
          estimatedCost: 0,
        };

        const quantity = ingredient.quantity * item.quantity;
        current.quantity += quantity;
        current.estimatedCost += quantity * resolveIngredientCostPerUnit(ingredient.ingredientId, data?.ingredients ?? []);
        totalsByIngredient.set(ingredient.ingredientId, current);
      });
    });

    return Array.from(totalsByIngredient.values()).sort((left, right) =>
      left.ingredientName.localeCompare(right.ingredientName),
    );
  }, [data?.ingredients, menuCart]);

  const menuCartCount = useMemo(
    () => menuCart.reduce((total, item) => total + item.quantity, 0),
    [menuCart],
  );

  async function refresh(targetRestaurantId = activeRestaurantId) {
    await dispatch(fetchDashboardData(targetRestaurantId)).unwrap();
  }

  useEffect(() => {
    void dispatch(fetchDashboardData(activeRestaurantId));
  }, [activeRestaurantId, dispatch]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setRestaurantIdInput(activeRestaurantId);
  }, [activeRestaurantId]);

  useEffect(() => {
    if (!data) {
      return;
    }

    const firstActiveRecipeId = data.recipes.find((recipe) => recipe.isActive)?.id ?? '';
    const firstActiveBatchId =
      data.inventoryBatches.find((batch) => batch.isActive && batch.quantityAvailable > 0)?.id ?? '';

    // oxlint-disable-next-line react/set-state-in-effect
    setSaleForm((current) => ({
      ...current,
      recipeId: data.recipes.some((recipe) => recipe.id === current.recipeId) ? current.recipeId : firstActiveRecipeId,
    }));
    // oxlint-disable-next-line react/set-state-in-effect
    setWasteForm((current) => ({
      ...current,
      inventoryBatchId: data.inventoryBatches.some((batch) => batch.id === current.inventoryBatchId)
        ? current.inventoryBatchId
        : firstActiveBatchId,
    }));
  }, [data]);

  async function runAction(label: string, action: () => Promise<ActionResult>) {
    setIsActionRunning(true);
    setActionMessage(null);
    setActionError(null);
    try {
      const result = await action();
      const message = typeof result === 'string' ? result : result.message;
      const refreshRestaurantId = typeof result === 'string' ? activeRestaurantId : result.refreshRestaurantId ?? activeRestaurantId;
      setActionMessage(message);
      await refresh(refreshRestaurantId);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : `${label} failed`);
    } finally {
      setIsActionRunning(false);
    }
  }

  function applyRestaurantId() {
    const nextRestaurantId = restaurantId.trim();
    if (nextRestaurantId && nextRestaurantId !== activeRestaurantId) {
      dispatch(setDashboardRestaurantId(nextRestaurantId));
      setActionMessage(null);
      setActionError(null);
      setSimulationResult(null);
      setMenuCart([]);
      setSaleForm({ recipeId: '', quantitySold: 1, notes: '' });
      setWasteForm({ inventoryBatchId: '', quantityWasted: 1, reason: 'SPOILED', notes: '' });
    }
  }

  function addMenuCartItem(recipe: Recipe) {
    setMenuCart((current) => {
      const existing = current.find((item) => item.recipe.id === recipe.id);
      if (existing) {
        return current.map((item) =>
          item.recipe.id === recipe.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [...current, { recipe, quantity: 1 }];
    });
  }

  function updateMenuCartItemQuantity(recipeId: string, quantity: number) {
    const nextQuantity = Math.max(0, Math.floor(Number(quantity) || 0));
    if (nextQuantity === 0) {
      removeMenuCartItem(recipeId);
      return;
    }

    setMenuCart((current) =>
      current.map((item) => (item.recipe.id === recipeId ? { ...item, quantity: nextQuantity } : item)),
    );
  }

  function removeMenuCartItem(recipeId: string) {
    setMenuCart((current) => current.filter((item) => item.recipe.id !== recipeId));
  }

  async function recordMenuCartSale() {
    if (menuCart.length === 0) {
      return;
    }

    const cartSnapshot = [...menuCart];

    await runAction('Record cart sale', async () => {
      const results = await Promise.all(
        cartSnapshot.map((item) =>
          gastroflowApi.consumeRecipeSale(activeRestaurantId, {
            recipeId: item.recipe.id,
            quantitySold: item.quantity,
            notes: 'Recorded from menu planner cart.',
          }),
        ),
      );
      const totalQuantity = results.reduce((total, result) => total + result.quantitySold, 0);
      const totalRevenue = results.reduce((total, result) => total + result.totalSalesRevenue, 0);
      setMenuCart([]);
      return `Recorded ${totalQuantity} item(s) from the menu cart, revenue ${formatCurrency(totalRevenue)}.`;
    });
  }

  async function seedDemoData() {
    await runAction('Seed demo data', async () => {
      const seededRestaurant = await gastroflowApi.seedDemoRestaurant();
      const nextRestaurantId = seededRestaurant.restaurant.id;
      setRestaurantIdInput(nextRestaurantId);
      await gastroflowApi.seedDemoIngredients(nextRestaurantId);
      await gastroflowApi.seedDemoInventoryBatches(nextRestaurantId);
      await gastroflowApi.seedDemoRecipes(nextRestaurantId);
      dispatch(setDashboardRestaurantId(nextRestaurantId));
      return {
        message: 'Demo restaurant, ingredients, inventory batches, and recipes were seeded.',
        refreshRestaurantId: nextRestaurantId,
      };
    });
  }

  async function recordSale() {
    const payload: CreateRecipeSaleConsumptionDto = {
      recipeId: saleForm.recipeId,
      quantitySold: Number(saleForm.quantitySold),
      notes: saleForm.notes || undefined,
    };

    await runAction('Record recipe sale', async () => {
      const result = await gastroflowApi.consumeRecipeSale(activeRestaurantId, payload);
      return `Recorded ${result.quantitySold} ${result.recipeName} sale(s), revenue ${formatCurrency(
        result.totalSalesRevenue,
      )}.`;
    });
  }

  async function recordWaste() {
    const payload: CreateWasteEventDto = {
      inventoryBatchId: wasteForm.inventoryBatchId,
      quantityWasted: Number(wasteForm.quantityWasted),
      reason: wasteForm.reason,
      notes: wasteForm.notes || undefined,
    };

    await runAction('Record waste', async () => {
      const result = await gastroflowApi.createWasteEvent(activeRestaurantId, payload);
      return `Recorded ${formatNumber(result.wasteEvent.quantityWasted)} ${result.wasteEvent.unit} wasted. Remaining batch quantity: ${formatNumber(
        result.remainingQuantityAvailable,
      )}.`;
    });
  }

  async function generateRecommendations() {
    await runAction('Generate recommendations', async () => {
      const result = await gastroflowApi.generateRecommendations(activeRestaurantId, 'Generated from dashboard.');
      return `Generated ${result.generatedCount} recommendation(s).`;
    });
  }

  async function updateRecommendation(recommendation: Recommendation, action: 'apply' | 'dismiss') {
    await runAction(`${action} recommendation`, async () => {
      const result =
        action === 'apply'
          ? await gastroflowApi.applyRecommendation(activeRestaurantId, recommendation.id)
          : await gastroflowApi.dismissRecommendation(activeRestaurantId, recommendation.id);
      return `${result.title} is now ${result.status.toLowerCase()}.`;
    });
  }

  async function runSimulation() {
    await runAction('Run simulation', async () => {
      const result = await gastroflowApi.runSimulation(activeRestaurantId, simulationPath, {
        intensity: simulationIntensity,
        seed: simulationSeed || undefined,
        notes: 'Triggered from GastroFlow dashboard.',
      });
      setSimulationResult(result);
      return `${result.simulationType} completed with ${result.summary.timelineEventCount} timeline event(s).`;
    });
  }

  const summary = data?.summary;

  return (
    <main className="app-shell">
      <button
        type="button"
        className="menu-planner-trigger"
        aria-label="Open menu order planner"
        onClick={() => setIsMenuPlannerOpen(true)}
      >
        <span className="book-icon" aria-hidden="true" />
        {menuCartCount > 0 ? <b>{menuCartCount}</b> : null}
      </button>

      <header className="app-header">
        <div>
          <p className="eyebrow">GastroFlow operations</p>
          <h1>Restaurant dashboard</h1>
          <p className="header-copy">
            Inventory, sales, profit, waste, recipes, recommendations, and simulation tools wired to implemented API contracts.
          </p>
        </div>

        <div className="connection-panel">
          <label>
            API base URL
            <input value={gastroflowApi.baseUrl} disabled />
          </label>
          <label>
            Restaurant ID
            <input value={restaurantId} onChange={(event) => setRestaurantIdInput(event.target.value)} />
          </label>
          <div className={`live-status live-status-${socketStatus}`}>
            <span aria-hidden="true" />
            <div>
              <strong>Live refresh: {socketStatus}</strong>
              <small>
                {lastSocketEvent
                  ? `Last stock update ${formatDate(lastSocketEvent.occurredAt)}`
                  : socketError || (lastLoadedAt ? `Dashboard loaded ${formatDate(lastLoadedAt)}` : 'Waiting for dashboard load')}
              </small>
            </div>
          </div>
          <div className="button-row">
            <button type="button" onClick={applyRestaurantId}>
              Load
            </button>
            <button type="button" onClick={() => void refresh()} disabled={isLoading || isRefreshing}>
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button type="button" onClick={() => void seedDemoData()} disabled={isActionRunning}>
              Seed demo
            </button>
          </div>
        </div>
      </header>

      {actionMessage ? <div className="notice success">{actionMessage}</div> : null}
      {actionError ? <div className="notice failure">{actionError}</div> : null}

      {isLoading ? (
        <section className="panel loading-panel">
          <div className="loader" aria-hidden="true" />
          <p>Loading restaurant operating data...</p>
        </section>
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => void refresh()} />
      ) : data && summary ? (
        <>
          <section className="metric-grid" aria-label="Dashboard metrics">
            <MetricCard
              label="Revenue"
              value={formatCurrency(summary.finance.totalSalesRevenue)}
              helper={`${summary.finance.unitsSold} units sold`}
            />
            <MetricCard
              label="Estimated gross profit"
              value={formatCurrency(summary.finance.estimatedGrossProfit)}
              helper={`${formatNumber(summary.finance.estimatedGrossMarginPercentage)}% margin`}
            />
            <MetricCard
              label="Inventory value"
              value={formatCurrency(summary.inventory.totalInventoryValue)}
              helper={`${summary.inventory.activeBatchCount} active batches`}
            />
            <MetricCard
              label="Waste cost"
              value={formatCurrency(summary.waste.totalWasteCost)}
              helper={`${summary.waste.wasteEventCount} waste events`}
            />
            <MetricCard
              label="Open recommendations"
              value={formatNumber(summary.recommendations.openRecommendationCount, 0)}
              helper={`${summary.recommendations.highPriorityRecommendationCount} high priority`}
            />
          </section>

          <section className="dashboard-grid">
            <InventoryPanel ingredients={data.ingredients} batches={data.inventoryBatches} />
            <SalesPanel recipes={activeRecipes} saleForm={saleForm} setSaleForm={setSaleForm} onSubmit={recordSale} disabled={isActionRunning} />
            <WastePanel
              batches={activeBatches}
              wasteForm={wasteForm}
              setWasteForm={setWasteForm}
              onSubmit={recordWaste}
              disabled={isActionRunning}
            />
            <RecommendationsPanel
              recommendations={data.recommendations}
              onGenerate={generateRecommendations}
              onUpdate={updateRecommendation}
              disabled={isActionRunning}
            />
            <RecipesPanel recipes={data.recipes} />
            <IngredientsPanel ingredients={data.ingredients} />
            <SimulationPanel
              simulationPath={simulationPath}
              setSimulationPath={setSimulationPath}
              simulationIntensity={simulationIntensity}
              setSimulationIntensity={setSimulationIntensity}
              simulationSeed={simulationSeed}
              setSimulationSeed={setSimulationSeed}
              simulationResult={simulationResult}
              onRun={runSimulation}
              disabled={isActionRunning}
            />
            <ActivityPanel data={data} />
            <InventoryBatchesPanel batches={data.inventoryBatches} />
          </section>
        </>
      ) : (
        <EmptyState message="No dashboard data returned for this restaurant." />
      )}

      {isMenuPlannerOpen ? (
        <MenuPlannerModal
          recipes={activeRecipes}
          cart={menuCart}
          totals={menuTotals}
          ingredientTotals={menuIngredientTotals}
          onAdd={addMenuCartItem}
          onClose={() => setIsMenuPlannerOpen(false)}
          onClear={() => setMenuCart([])}
          onRecordSale={recordMenuCartSale}
          onRemove={removeMenuCartItem}
          onUpdateQuantity={updateMenuCartItemQuantity}
          disabled={isActionRunning}
        />
      ) : null}
    </main>
  );
}

function resolveIngredientCostPerUnit(ingredientId: string, ingredients: DashboardData['ingredients']) {
  return ingredients.find((ingredient) => ingredient.id === ingredientId)?.defaultCostPerUnit ?? 0;
}

function MenuPlannerModal({
  recipes,
  cart,
  totals,
  ingredientTotals,
  onAdd,
  onClose,
  onClear,
  onRecordSale,
  onRemove,
  onUpdateQuantity,
  disabled,
}: {
  recipes: Recipe[];
  cart: MenuCartItem[];
  totals: { revenue: number; inventoryCost: number; grossProfit: number };
  ingredientTotals: MenuIngredientTotal[];
  onAdd: (recipe: Recipe) => void;
  onClose: () => void;
  onClear: () => void;
  onRecordSale: () => Promise<void>;
  onRemove: (recipeId: string) => void;
  onUpdateQuantity: (recipeId: string, quantity: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="menu-planner-backdrop" role="presentation" onClick={onClose}>
      <section
        className="menu-planner-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Menu order planner"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="menu-planner-header">
          <div>
            <p className="eyebrow">Live menu planner</p>
            <h2>Order visibility</h2>
            <p>
              Add recipes to the cart to estimate inventory consumption, revenue, ingredient cost, and gross profit.
            </p>
          </div>
          <button type="button" className="icon-button" aria-label="Close menu planner" onClick={onClose}>
            ×
          </button>
        </header>

        <section className="menu-planner-summary" aria-label="Order totals">
          <MetricCard label="Projected revenue" value={formatCurrency(totals.revenue)} />
          <MetricCard label="Inventory consumed" value={formatCurrency(totals.inventoryCost)} />
          <MetricCard label="Gross profit" value={formatCurrency(totals.grossProfit)} />
        </section>

        <div className="menu-planner-layout">
          <section className="menu-planner-menu">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Menu</p>
                <h3>Recipes</h3>
              </div>
              <span>{recipes.length} active</span>
            </div>

            {recipes.length === 0 ? (
              <EmptyState message="No active recipes returned by the backend." />
            ) : (
              <div className="menu-item-list">
                {recipes.map((recipe) => (
                  <article className="menu-item" key={recipe.id}>
                    <div>
                      <div className="inline-meta">
                        <StatusBadge value={recipe.category} />
                        <span>{recipe.ingredients.length} ingredients</span>
                      </div>
                      <h4>{recipe.name}</h4>
                      <p>{recipe.description}</p>
                      <div className="menu-item-economics">
                        <span>{formatCurrency(recipe.menuPrice)} price</span>
                        <span>{formatCurrency(recipe.estimatedIngredientCost)} cost</span>
                        <span>{formatNumber(recipe.estimatedGrossMarginPercentage)}% margin</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => onAdd(recipe)}>
                      Add
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="menu-planner-cart">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Cart</p>
                <h3>Current order</h3>
              </div>
              <button type="button" className="secondary compact-button" onClick={onClear} disabled={cart.length === 0}>
                Clear
              </button>
            </div>

            {cart.length === 0 ? (
              <EmptyState message="Add menu items to start calculating." />
            ) : (
              <div className="cart-list">
                {cart.map((item) => (
                  <div className="cart-line" key={item.recipe.id}>
                    <div>
                      <strong>{item.recipe.name}</strong>
                      <span>{formatCurrency(item.recipe.menuPrice * item.quantity)}</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      aria-label={`${item.recipe.name} quantity`}
                      value={item.quantity}
                      onChange={(event) => onUpdateQuantity(item.recipe.id, Number(event.target.value))}
                    />
                    <button type="button" className="icon-button danger" aria-label={`Remove ${item.recipe.name}`} onClick={() => onRemove(item.recipe.id)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              className="record-cart-sale-button"
              onClick={() => void onRecordSale()}
              disabled={disabled || cart.length === 0}
            >
              {disabled ? 'Recording...' : 'Record sale'}
            </button>

            <div className="panel-heading ingredient-total-heading">
              <div>
                <p className="eyebrow">Consumption</p>
                <h3>Ingredient totals</h3>
              </div>
              <span>{ingredientTotals.length} ingredients</span>
            </div>

            {ingredientTotals.length === 0 ? (
              <EmptyState message="No ingredient usage calculated yet." />
            ) : (
              <div className="ingredient-total-list">
                {ingredientTotals.map((ingredient) => (
                  <div className="ingredient-total-line" key={ingredient.ingredientId}>
                    <div>
                      <strong>{ingredient.ingredientName}</strong>
                      <span>{formatCurrency(ingredient.estimatedCost)} estimated cost</span>
                    </div>
                    <b>
                      {formatNumber(ingredient.quantity)} {ingredient.unit}
                    </b>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}

function InventoryPanel({ ingredients, batches }: { ingredients: Ingredient[]; batches: InventoryBatch[] }) {
  const rows = useMemo<InventoryIngredientRow[]>(() => {
    return ingredients
      .filter((ingredient) => ingredient.isActive)
      .map((ingredient) => {
        const ingredientBatches = batches.filter(
          (batch) =>
            batch.ingredientId === ingredient.id &&
            batch.isActive &&
            batch.quantityAvailable > 0 &&
            batch.status !== 'DEPLETED' &&
            batch.status !== 'WASTED',
        );
        const availableQuantity = ingredientBatches.reduce((total, batch) => total + batch.quantityAvailable, 0);
        const inventoryValue = ingredientBatches.reduce(
          (total, batch) => total + batch.quantityAvailable * batch.unitCost,
          0,
        );
        const nextExpirationAt = ingredientBatches
          .map((batch) => batch.expiresAt)
          .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0];
        const status: InventoryIngredientRow['status'] =
          availableQuantity <= 0
            ? 'NO_STOCK'
            : availableQuantity <= ingredient.lowStockThresholdQuantity
              ? 'LOW_STOCK'
              : 'AVAILABLE';

        return {
          ingredient,
          availableQuantity,
          inventoryValue,
          activeBatchCount: ingredientBatches.length,
          nextExpirationAt,
          status,
        };
      })
      .sort((left, right) => left.ingredient.name.localeCompare(right.ingredient.name));
  }, [batches, ingredients]);

  return (
    <section className="panel panel-wide">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Inventory</p>
          <h2>Ingredient position</h2>
        </div>
        <span>{rows.length} ingredients</span>
      </div>
      {rows.length === 0 ? (
        <EmptyState message="No active ingredients returned. Seed or create ingredients in the API first." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Total available</th>
                <th>Value</th>
                <th>Threshold</th>
                <th>Next expiry</th>
                <th>Batches</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.ingredient.id}>
                  <td>{row.ingredient.name}</td>
                  <td>
                    {formatNumber(row.availableQuantity)} {row.ingredient.baseUnit}
                  </td>
                  <td>{formatCurrency(row.inventoryValue)}</td>
                  <td>
                    {formatNumber(row.ingredient.lowStockThresholdQuantity)} {row.ingredient.baseUnit}
                  </td>
                  <td>{formatDate(row.nextExpirationAt)}</td>
                  <td>{row.activeBatchCount}</td>
                  <td>
                    <StatusBadge value={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function InventoryBatchesPanel({ batches }: { batches: InventoryBatch[] }) {
  const sortedBatches = useMemo(
    () =>
      [...batches].sort((left, right) => {
        const ingredientComparison = left.ingredientName.localeCompare(right.ingredientName);
        if (ingredientComparison !== 0) {
          return ingredientComparison;
        }

        return new Date(left.expiresAt).getTime() - new Date(right.expiresAt).getTime();
      }),
    [batches],
  );

  return (
    <section className="panel panel-full">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Inventory batches</p>
          <h2>All batch records</h2>
        </div>
        <span>{sortedBatches.length} batches</span>
      </div>
      {sortedBatches.length === 0 ? (
        <EmptyState message="No inventory batches returned. Seed or create batches in the API first." />
      ) : (
        <div className="table-wrap table-wrap-scroll-y">
          <table>
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Available</th>
                <th>Received</th>
                <th>Value</th>
                <th>Expires</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedBatches.map((batch) => (
                <tr key={batch.id}>
                  <td>{batch.ingredientName}</td>
                  <td>
                    {formatNumber(batch.quantityAvailable)} {batch.unit}
                  </td>
                  <td>
                    {formatNumber(batch.quantityReceived)} {batch.unit}
                  </td>
                  <td>{formatCurrency(batch.quantityAvailable * batch.unitCost)}</td>
                  <td>{formatDate(batch.expiresAt)}</td>
                  <td>
                    <StatusBadge value={batch.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SalesPanel({
  recipes,
  saleForm,
  setSaleForm,
  onSubmit,
  disabled,
}: {
  recipes: Recipe[];
  saleForm: { recipeId: string; quantitySold: number; notes: string };
  setSaleForm: (value: { recipeId: string; quantitySold: number; notes: string }) => void;
  onSubmit: () => Promise<void>;
  disabled: boolean;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Sales</p>
          <h2>Record recipe sale</h2>
        </div>
      </div>
      {recipes.length === 0 ? (
        <EmptyState message="No active recipes available for sale recording." />
      ) : (
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          <label>
            Recipe
            <select value={saleForm.recipeId} onChange={(event) => setSaleForm({ ...saleForm, recipeId: event.target.value })}>
              {recipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.name} - {formatCurrency(recipe.menuPrice)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantity sold
            <input
              type="number"
              min="1"
              step="1"
              value={saleForm.quantitySold}
              onChange={(event) => setSaleForm({ ...saleForm, quantitySold: Number(event.target.value) })}
            />
          </label>
          <label>
            Notes
            <input value={saleForm.notes} onChange={(event) => setSaleForm({ ...saleForm, notes: event.target.value })} />
          </label>
          <button type="submit" disabled={disabled || !saleForm.recipeId}>
            Record sale
          </button>
        </form>
      )}
    </section>
  );
}

function WastePanel({
  batches,
  wasteForm,
  setWasteForm,
  onSubmit,
  disabled,
}: {
  batches: InventoryBatch[];
  wasteForm: { inventoryBatchId: string; quantityWasted: number; reason: WasteReason; notes: string };
  setWasteForm: (value: { inventoryBatchId: string; quantityWasted: number; reason: WasteReason; notes: string }) => void;
  onSubmit: () => Promise<void>;
  disabled: boolean;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Waste</p>
          <h2>Record waste</h2>
        </div>
      </div>
      {batches.length === 0 ? (
        <EmptyState message="No active inventory batches can receive a waste event." />
      ) : (
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          <label>
            Batch
            <select
              value={wasteForm.inventoryBatchId}
              onChange={(event) => setWasteForm({ ...wasteForm, inventoryBatchId: event.target.value })}
            >
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.ingredientName} - {formatNumber(batch.quantityAvailable)} {batch.unit}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantity wasted
            <input
              type="number"
              min="0.0001"
              step="0.0001"
              value={wasteForm.quantityWasted}
              onChange={(event) => setWasteForm({ ...wasteForm, quantityWasted: Number(event.target.value) })}
            />
          </label>
          <label>
            Reason
            <select value={wasteForm.reason} onChange={(event) => setWasteForm({ ...wasteForm, reason: event.target.value as WasteReason })}>
              {wasteReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </label>
          <label>
            Notes
            <input value={wasteForm.notes} onChange={(event) => setWasteForm({ ...wasteForm, notes: event.target.value })} />
          </label>
          <button type="submit" disabled={disabled || !wasteForm.inventoryBatchId}>
            Record waste
          </button>
        </form>
      )}
    </section>
  );
}

function RecommendationsPanel({
  recommendations,
  onGenerate,
  onUpdate,
  disabled,
}: {
  recommendations: Recommendation[];
  onGenerate: () => Promise<void>;
  onUpdate: (recommendation: Recommendation, action: 'apply' | 'dismiss') => Promise<void>;
  disabled: boolean;
}) {
  return (
    <section className="panel panel-wide">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Recommendations</p>
          <h2>Open actions</h2>
        </div>
        <button type="button" onClick={() => void onGenerate()} disabled={disabled}>
          Generate
        </button>
      </div>
      {recommendations.length === 0 ? (
        <EmptyState message="No open recommendations. Generate them after inventory, sales, or waste activity exists." />
      ) : (
        <div className="recommendation-list">
          {recommendations.slice(0, 6).map((recommendation) => (
            <article key={recommendation.id} className="recommendation-item">
              <div>
                <div className="inline-meta">
                  <StatusBadge value={recommendation.priority} />
                  <span>{recommendation.type}</span>
                </div>
                <h3>{recommendation.title}</h3>
                <p>{recommendation.message}</p>
              </div>
              <div className="button-row">
                <button type="button" onClick={() => void onUpdate(recommendation, 'apply')} disabled={disabled}>
                  Apply
                </button>
                <button type="button" className="secondary" onClick={() => void onUpdate(recommendation, 'dismiss')} disabled={disabled}>
                  Dismiss
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function RecipesPanel({ recipes }: { recipes: Recipe[] }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Recipes</p>
          <h2>Menu economics</h2>
        </div>
      </div>
      {recipes.length === 0 ? (
        <EmptyState message="No recipes returned for this restaurant." />
      ) : (
        <div className="stack-list">
          {recipes.slice(0, 7).map((recipe) => (
            <div className="stack-row" key={recipe.id}>
              <div>
                <strong>{recipe.name}</strong>
                <span>{recipe.category}</span>
              </div>
              <div className="right-align">
                <strong>{formatCurrency(recipe.menuPrice)}</strong>
                <span>{formatNumber(recipe.estimatedGrossMarginPercentage)}% margin</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function IngredientsPanel({ ingredients }: { ingredients: DashboardData['ingredients'] }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Ingredients</p>
          <h2>Catalog health</h2>
        </div>
      </div>
      {ingredients.length === 0 ? (
        <EmptyState message="No ingredients returned for this restaurant." />
      ) : (
        <div className="stack-list">
          {ingredients.slice(0, 8).map((ingredient) => (
            <div className="stack-row" key={ingredient.id}>
              <div>
                <strong>{ingredient.name}</strong>
                <span>{ingredient.category}</span>
              </div>
              <div className="right-align">
                <StatusBadge value={ingredient.wasteRiskLevel} />
                <span>{formatCurrency(ingredient.defaultCostPerUnit)}/{ingredient.baseUnit}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SimulationPanel({
  simulationPath,
  setSimulationPath,
  simulationIntensity,
  setSimulationIntensity,
  simulationSeed,
  setSimulationSeed,
  simulationResult,
  onRun,
  disabled,
}: {
  simulationPath: string;
  setSimulationPath: (value: string) => void;
  simulationIntensity: RunSimulationDto['intensity'];
  setSimulationIntensity: (value: RunSimulationDto['intensity']) => void;
  simulationSeed: string;
  setSimulationSeed: (value: string) => void;
  simulationResult: SimulationResult | null;
  onRun: () => Promise<void>;
  disabled: boolean;
}) {
  return (
    <section className="panel panel-wide">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Simulation</p>
          <h2>Run scenario</h2>
        </div>
      </div>
      <form
        className="form-grid form-grid-inline"
        onSubmit={(event) => {
          event.preventDefault();
          void onRun();
        }}
      >
        <label>
          Scenario
          <select value={simulationPath} onChange={(event) => setSimulationPath(event.target.value)}>
            {simulationOptions.map((option) => (
              <option key={option.path} value={option.path}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Intensity
          <select value={simulationIntensity} onChange={(event) => setSimulationIntensity(event.target.value as RunSimulationDto['intensity'])}>
            <option value="QUIET">QUIET</option>
            <option value="NORMAL">NORMAL</option>
            <option value="BUSY">BUSY</option>
            <option value="CHAOS">CHAOS</option>
          </select>
        </label>
        <label>
          Seed
          <input value={simulationSeed} onChange={(event) => setSimulationSeed(event.target.value)} />
        </label>
        <button type="submit" disabled={disabled}>
          Run simulation
        </button>
      </form>
      {simulationResult ? (
        <div className="simulation-summary">
          <MetricCard label="Timeline events" value={formatNumber(simulationResult.summary.timelineEventCount, 0)} />
          <MetricCard label="Estimated sales" value={formatCurrency(simulationResult.summary.totalEstimatedSales)} />
          <MetricCard label="Waste cost" value={formatCurrency(simulationResult.summary.totalWasteCost)} />
          <MetricCard label="Generated recommendations" value={formatNumber(simulationResult.summary.recommendationsGeneratedCount, 0)} />
        </div>
      ) : (
        <EmptyState message="Run a supported simulation endpoint to see its summary." />
      )}
    </section>
  );
}

function ActivityPanel({ data }: { data: DashboardData }) {
  const recentMovements = data.summary.activity.recentStockMovements.length
    ? data.summary.activity.recentStockMovements
    : data.stockMovements.slice(0, 5);
  const recentWaste = data.summary.activity.recentWasteEvents.length
    ? data.summary.activity.recentWasteEvents
    : data.wasteEvents.slice(0, 5);

  return (
    <section className="panel panel-wide">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Activity</p>
          <h2>Recent movement and waste</h2>
        </div>
      </div>
      <div className="activity-grid">
        <div>
          <h3>Stock movements</h3>
          {recentMovements.length === 0 ? (
            <EmptyState message="No stock movements returned." />
          ) : (
            <div className="stack-list">
              {recentMovements.map((movement) => (
                <div className="stack-row" key={movement.id}>
                  <div>
                    <strong>{movement.ingredientName}</strong>
                    <span>{movement.recipeName || movement.source}</span>
                  </div>
                  <div className="right-align">
                    <span>
                      {formatNumber(movement.quantity)} {movement.unit}
                    </span>
                    <span>{formatDate(movement.occurredAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3>Waste events</h3>
          {recentWaste.length === 0 ? (
            <EmptyState message="No waste events returned." />
          ) : (
            <div className="stack-list">
              {recentWaste.map((waste) => (
                <div className="stack-row" key={waste.id}>
                  <div>
                    <strong>{waste.ingredientName}</strong>
                    <span>{waste.reason}</span>
                  </div>
                  <div className="right-align">
                    <span>{formatCurrency(waste.totalCost)}</span>
                    <span>{formatDate(waste.occurredAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default App;
