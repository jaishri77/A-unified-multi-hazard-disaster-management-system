# ASTER — Multi-Hazard Intelligence

A working research prototype based on the supplied mini-project paper: risk prediction, dynamic region graphs, equitable relief planning, and offline information sharing.

## Run

Requires Node.js 22.13+ and pnpm 11.25.0.

```sh
pnpm install
pnpm dev
```

Open the Local URL printed by the server (normally http://localhost:5173).

```sh
pnpm build
pnpm start
```

## What works

- Six responsive workspaces: situation overview, risk intelligence, relief coordination, emergency network, model evaluation, API explorer.
- Editable regional features, road closures, additional regions, graph inference, and JSON report exports.
- A trained mean-aggregation graph neural network (GraphSAGE-style) and a 32-tree Random Forest. Python training exports portable inference weights. The graph model is the default because its held-out synthetic error is lower.
- Inventory-conserving allocation proposals with a vulnerability weighting control, access warnings, and Jain coverage index.
- Browser-persistent scenario and message queue, service-worker caching, offline model inference, and mesh-path simulation.
- Real same-origin API endpoints, with validation and bounded request sizes.

## Research limits

All regions, labels, capacities, impacts, and training targets are **synthetic**. This is a regional-priority model using already supplied impact features, not a satellite-image detector or a weather/event forecast. Metrics only measure approximation of the documented simulated generating process; they are not field validation. Uncertainty is not calibrated. Hazard category is a scenario label, not a predicted output.

The graph model is a compact baseline for the paper's GNN concept; it does not reproduce SSF-GNN or Evolve-DGN. Allocation is a documented heuristic, not a reinforcement-learning policy. Road travel estimates and radio reliability are illustrative assumptions. No emergency teams are dispatched. BLE / Wi-Fi Direct hardware transport is not implemented in the browser: a native bridge and physical-device tests are required. Message sync is stateless acknowledgement only, with no server persistence or responder delivery. Data persists only in the current browser; clearing site data removes it.

## Models and reproducibility

```sh
python -m pip install -r ml/requirements.txt
python ml/train.py
node scripts/verify.mjs
node node_modules/typescript/bin/tsc --noEmit
```

Training seed: 42. Split by complete graph: 1,000 training / 200 validation / 200 test scenarios, each with 12 regions. Eight normalized features: severity, population exposure, damage, accessibility, hospital capacity, communication quality, resource demand, vulnerability. The graph network uses mean aggregation, local projection, ReLU, and sigmoid output (8 → 24 → 1). Training: Adam, 400 epochs; checkpoint selected using validation loss. Random Forest: 32 trees, depth 8, minimum leaf 5.

The synthetic target combines weighted local impact with 21% mean-neighbor impact and small Gaussian noise. Full generating rule is in `ml/train.py`. Model weights are in `lib/models.json`; evaluation/provenance is in `ml/evaluation.json`; a sample dataset and cross-language inference fixture are included.

Held-out synthetic results (score scale 0–100):

| Model | MAE | RMSE | R² | Macro F1 |
|---|---:|---:|---:|---:|
| GNN | 0.961 | 1.206 | 0.9872 | 0.9106 |
| Random Forest | 2.587 | 3.230 | 0.9078 | 0.6323 |
| 70/30 ensemble | 1.189 | 1.495 | 0.9803 | 0.8420 |

Priority classes: low <40, moderate 40–59, high 60–74, critical ≥75. Input-driver displays are feature values, not causal feature attributions.

## API

| Method | Route | Purpose |
|---|---|---|
| GET | /api/health | Readiness and research mode |
| GET | /api/scenario | Default synthetic scenario |
| GET | /api/models | Provenance, metrics, limitations |
| POST | /api/predict | `{regions, roads, model: "gnn" \| "forest" \| "ensemble"}` |
| POST | /api/allocate | `{regions, roads, resources:{teams, ambulances, supplies}, fairness:0.35}` |
| POST | /api/mesh/simulate | `{regions, roads, source:"R12"}` |
| POST | /api/messages/sync | `{messages:[{id, text}]}`; returns acknowledged IDs |

Start with GET /api/scenario to obtain the complete graph schema. Features must be numeric in [0,1]. Graphs are limited to 80 regions and 1,000 roads. Region IDs must be unique; edges must reference existing regions. Resource counts are integers in [0,100000]. Request limit: 200,000 characters. Errors return JSON with appropriate 400/404/413 status.

## Architecture

Vinext / React interface → JSON API → portable model inference / graph processing → allocation and simulated communication. The client has the same inference engine for offline use. The Sites starter's private access integration is retained. API calls have no paid third-party dependencies or external credentials.

## Next research steps

Replace the simulated generator with permissioned, labelled event datasets; split by event and geography; compare risk baselines with calibrated uncertainty; add real satellite/weather ingestion and provenance; add database-backed authenticated coordination, audit history, verified routing, and a native mesh bridge. Validate under realistic emergency and communication conditions before any operational use.
