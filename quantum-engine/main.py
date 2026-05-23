from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import dimod
import neal

app = FastAPI()

class FoodItem(BaseModel):
    id: str
    name: str
    weight: float
    nutrition: float
    expiry_days: int

class OptimizeRequest(BaseModel):
    capacity: float
    items: list[FoodItem]

@app.post("/optimize")
def optimize_knapsack(req: OptimizeRequest):
    if not req.items:
        return {"selected_ids": [], "total_weight": 0, "total_priority": 0}

    # 1. Initialize Constrained Quadratic Model
    cqm = dimod.ConstrainedQuadraticModel()
    
    # 2. Create binary variables (1 = pack in truck, 0 = leave in warehouse)
    x = {item.id: dimod.Binary(item.id) for item in req.items}
    
    # 3. Define Objective: Maximize Priority 
    # Priority formula = Nutrition / Expiry (We use negative because CQM minimizes by default)
    objective = sum(- (item.nutrition / max(item.expiry_days, 1)) * x[item.id] for item in req.items)
    cqm.set_objective(objective)
    
    # 4. Define Constraint: Total weight must be <= Truck Capacity
    cqm.add_constraint(sum(item.weight * x[item.id] for item in req.items) <= req.capacity, label='capacity')
    
    # 5. Convert to Binary Quadratic Model (BQM) to run on our solver
    try:
        bqm, invert = dimod.cqm_to_bqm(cqm)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to build quantum model.")

    # 6. Solve using Simulated Annealing (Quantum-Inspired)
    sampler = neal.SimulatedAnnealingSampler()
    sampleset = sampler.sample(bqm, num_reads=100) # Run 100 iterations
    
    # Extract the best solution that didn't break our weight constraint
    feasible_samples = [s for s in sampleset.data(name='sample') if cqm.check_feasible(s.sample)]
    
    if not feasible_samples:
        return {"error": "No valid combination fits in this truck."}
        
    best_sample = feasible_samples[0].sample
    selected_ids = [item_id for item_id, selected in best_sample.items() if selected == 1]
    
    return {"selected_ids": selected_ids}

# To run later: uvicorn main:app --reload --port 8000