# Illinois Nuclear Infrastructure Map

## Purpose
Interactive map making the case that Illinois is the strongest candidate for a DOE Nuclear Lifecycle Innovation Campus (NLIC). Built in response to the DOE's January 2026 RFI (responses due April 1, 2026).

## Audience
DOE officials, journalists, energy enthusiasts, congressional staffers.

## Architecture
- Vanilla JS + MapLibre GL JS (CDN, no build step)
- Penney Design System (1940s trade journal aesthetic)
- Ultan data framework (sourcing, uncertainty, gap labeling)
- Static hosting (GitHub Pages)
- Same architecture as IL O&G (ILOG)

## Data Sources
All data must follow Ultan pipeline rules:
- `source_url` or publication reference
- `access_date` (ISO 8601)
- `known_gaps`
- `notes` for anomalies

### Source Hierarchy
1. NRC, EIA, DOE, USACE, USDOT BTS (primary government)
2. World Nuclear Association, Constellation filings (industry)
3. News reporting (secondary — flag publication and date)

## Key Files
- `data/reactors.geojson` — 6 operating plants, 11 units (NRC/WNA)
- `data/decommissioned.geojson` — Zion + Dresden 1 (NRC)
- `data/isfsi.geojson` — spent fuel storage including Morris (NRC)
- `data/national-labs.geojson` — Argonne, Fermilab, UIUC
- `data/transmission/il_transmission_345kv.geojson` — HIFLD 345kV+ lines
- `data/transport/il_class1_railroads.geojson` — USDOT BTS Class I rail
- `data/transport/il_waterways.geojson` — USACE navigable waterways
- `data/transport/il_strahnet.geojson` — FHWA Strategic Highway Network

## Design System
Penney Design System v1.0. All colors, typography, spacing from the system.
No raw hex values outside the palette. No animation libraries.
