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
    expiry_hours: int
    distance: float

class OptimizeRequest(BaseModel):
    capacity: float
    items: list[FoodItem]

@app.post("/optimize")
def optimize_knapsack(req: OptimizeRequest):
    if not req.items:
        return {"selected_ids": [], "total_weight": 0, "total_priority": 0}

    # Initialize Constrained Quadratic Model
    cqm = dimod.ConstrainedQuadraticModel()
    x = {item.id: dimod.Binary(item.id) for item in req.items}
    
    # NEW OBJECTIVE: Maximize Priority = (Nutrition * Weight) / (ExpiryHours * Distance)
    # We minimize the negative value because CQM minimizes energy by default.
    # Prevent division by zero using max(val, 1)
    objective = sum(
        - ((item.nutrition * item.weight) / (max(item.expiry_hours, 1) * max(item.distance, 1))) * x[item.id] 
        for item in req.items
    )
    cqm.set_objective(objective)
    
    # Constraint: Total weight <= Truck/Bike Capacity
    cqm.add_constraint(sum(item.weight * x[item.id] for item in req.items) <= req.capacity, label='capacity')
    
    # Convert to Binary Quadratic Model (BQM)
    try:
        bqm, invert = dimod.cqm_to_bqm(cqm)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to build quantum model.")

    # Solve using Simulated Annealing
    sampler = neal.SimulatedAnnealingSampler()
    sampleset = sampler.sample(bqm, num_reads=100) 
    
    feasible_samples = [s for s in sampleset.data(name='sample') if cqm.check_feasible(s.sample)]
    
    if not feasible_samples:
        return {"error": "No valid combination fits in this vehicle capacity."}
        
    best_sample = feasible_samples[0].sample
    selected_ids = [item_id for item_id, selected in best_sample.items() if selected == 1]
    
    return {"selected_ids": selected_ids}