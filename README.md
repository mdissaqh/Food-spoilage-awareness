# 🍱 Spoilage-Aware Quantum Knapsack ⚛️

> **An AI-powered, quantum-inspired logistics platform designed to eliminate food waste in NGO supply chains.**

---

## 🚨 Problem Statement
Every day, NGOs and food banks lose tons of highly nutritious, donated food to spoilage. When delivery trucks arrive at college hostels, canteens, or PGs, volunteers manually pack items based on proximity or guesswork. Because human workers cannot calculate complex multidimensional arrays (weight vs. nutritional value vs. remaining expiry hours) on the fly, near-expiry, high-value food gets left behind and spoils in the warehouse.

## 💡 Solution Overview
The **Spoilage-Aware Quantum Knapsack** solves this by treating truck loading as an NP-Hard Knapsack Problem. We combine **Mistral AI** to dynamically infer food perishability with a **Quantum-Inspired Simulated Annealing** microservice to calculate the mathematically perfect truck manifest in milliseconds. 

If the total city-wide donation weight drops below 10kg, the system intelligently recommends an eco-friendly **Bike Pickup** instead of deploying a heavy truck.

---

## ✨ Features
*   **Dual Dashboards:** Passwordless, role-based access for Food Providers (Hostels, Canteens, PGs) and NGOs.
*   **AI Food Analysis:** Providers simply enter the food name and weight. Mistral AI (via LangChain JS) dynamically calculates the estimated total shelf life and nutritional score.
*   **Dynamic Time Math:** The backend calculates the *exact remaining safe shelf life* based on the provider's listing timestamp compared to the current time.
*   **Quantum Optimization:** Fast, local optimization using D-Wave's Ocean SDK to maximize nutritional impact while strictly adhering to vehicle weight limits.
*   **Eco-Friendly Bike Recommendation:** Automatically scales down the vehicle requirement and adjusts algorithms for lightweight (≤10kg) total loads.
*   **Premium Glassmorphism UI:** Built with React, Vite, Framer Motion, and pure CSS for a stunning, modern aesthetic.

---

## 🛠️ Tech Stack
*   **Frontend:** React 18, Vite, Recharts, Framer Motion, Lucide React, Pure CSS.
*   **Backend:** Node.js, Express.js, MongoDB, Mongoose.
*   **AI Integration:** LangChain JS (`@langchain/mistralai`), Mistral API (`mistral-small-latest`).
*   **Quantum Microservice:** Python 3.14, FastAPI, `dimod`, `dwave-neal`, Uvicorn.

---

## 🏗️ Architecture Diagram

```mermaid
graph TD
    A[Provider Dashboard] -->|Submits Food Name & Weight| B(Node.js Backend)
    B -->|LangChain JS Request| C{Mistral AI API}
    C -->|Returns Nutrition & Shelf Life| B
    B -->|Saves Listing| D[(MongoDB)]
    E[NGO Dashboard] -->|Requests Optimization| B
    B -->|Sends Warehouse Data + Capacity| F[Python FastAPI]
    F -->|Constructs QUBO Matrix| G((Simulated Annealing))
    G -->|Returns Optimal IDs| F
    F -->|Passes IDs| B
    B -->|Returns Populated Manifest| E

---

## 🔐 Environment Variables (`.env`)

Create a `.env` file inside the `backend/` folder.

Example:

```env
# Network configuration for the Express server
PORT=5000

# Database connection string for your local MongoDB instance
MONGO_URI=mongodb://127.0.0.1:27017/quantum_knapsack

# Secure token for Mistral AI Studio text generation models
# Obtain this token directly from your dashboard at console.mistral.ai
MISTRAL_API_KEY=your_actual_mistral_api_key_here
```

---