# Sources & Methodology

_Illinois Nuclear Infrastructure Map — March 2026_

---

## Nuclear Generation Data

### Operating Reactors
- **Source:** NRC Reactor Information Finder + World Nuclear Association Reactor Database
- **Access date:** 2026-03-27
- **Scope:** All 6 operating nuclear generating stations in Illinois (11 units)
- **Fields:** Location (lat/lng), unit count, reactor type, design, net capacity (MWe), commercial operation date, license expiration date, NRC docket number, ISFSI status, RTO membership
- **Net capacity:** Post-uprate values from WNA. May differ slightly from NRC thermal ratings.
- **License dates:** Current as of March 2026, including subsequent renewals granted December 2025 for Dresden 2&3 and Clinton 1.
- **Known gaps:** Uprate history not included. Capacity factors not included.

### Decommissioned Sites
- **Source:** NRC Decommissioning Status Reports, WNA Reactor Database
- **Access date:** 2026-03-27
- **Scope:** Zion Nuclear Power Station (2 units), Dresden Unit 1
- **Zion status:** Site released for unrestricted use by NRC in 2023. ISFSI remains with spent fuel on site.
- **Dresden 1 status:** SAFSTOR, pending decommissioning with Units 2&3. First privately financed nuclear plant in the US (1960).

### Independent Spent Fuel Storage Installations (ISFSI)
- **Source:** NRC ISFSI Licensing Database, Federal Register 2022-24993
- **Access date:** 2026-03-27
- **Morris Operation:** GE-Hitachi Nuclear Energy Americas, LLC. NRC License SNM-2500 (Docket 72-0001). 772 metric tons stored. License renewed to 2042. Only licensed commercial away-from-reactor wet spent fuel storage facility in the US.
- **Zion ISFSI:** Docket 72-1037. Operated by Constellation Energy Generation, LLC.
- **Note:** Plant-site ISFSIs at all 6 operating stations are confirmed but exact cask counts and tonnage are not included.

### Generation Statistics
- **Source:** EIA-923, EIA Illinois Electricity Profile
- **Figure:** ~99 TWh nuclear generation in 2024, representing ~53% of Illinois electricity
- **Note:** 2024 figure from EIA Electricity Data Browser and state profiles. Figures from multiple secondary sources (Statista, EIA state analysis).

---

## National Labs & Research

- **Source:** DOE Office of Science, University of Illinois
- **Access date:** 2026-03-27
- **Scope:** Argonne National Laboratory (Lemont, IL), Fermi National Accelerator Laboratory (Batavia, IL), University of Illinois Urbana-Champaign
- **Coordinates:** Campus/complex centroids from Mapcarta and latitude.to, cross-referenced with DOE facility descriptions.

---

## Transmission Data

### 345kV+ Transmission Lines
- **Source:** Homeland Infrastructure Foundation-Level Data (HIFLD), via ArcGIS FeatureServer
- **Service URL:** `https://services2.arcgis.com/FiaPA4ga0iQKduv3/arcgis/rest/services/US_Electric_Power_Transmission_Lines/FeatureServer`
- **Access date:** 2026-03-27
- **Query:** `VOLTAGE >= 345`, spatial filter on Illinois bounding box (-91.5 to -87.5 lng, 36.97 to 42.51 lat)
- **Result:** 415 line features with geometry (~24,400 coordinates)
- **Fields:** Owner, voltage, voltage class, substation endpoints, status
- **Key owners:** Commonwealth Edison (111 segments), Ameren Illinois (92), Union Electric (46), MidAmerican Energy (15)
- **Known gaps:** Substation endpoint names not populated for all features.
- **Owner inference (105 segments):** HIFLD attributed 105 of 415 segments as "NOT AVAILABLE" for owner. We resolved all 105 using two methods: (1) **Substation matching** (75 segments): other segments sharing the same named substation endpoints had known owners — the most common owner at each substation was assigned. (2) **Geographic proximity** (30 segments): for segments with only UNKNOWN/TAP substation names, the 5 nearest segments with known owners were used to vote on likely owner. All inferred owners are tagged with `INFERRED_OWNER` and `OWNER_SOURCE` properties to distinguish from HIFLD-sourced attributions. Breakdown: Commonwealth Edison 70, Ameren Illinois 13, NIPSCO 7, Duke Energy Indiana 6, MidAmerican Energy 3, Union Electric 3, others 3.

---

## Transport Corridor Data

### Class I Railroads
- **Source:** USDOT Bureau of Transportation Statistics (BTS), North American Rail Network Lines — Class I Freight Railroads View
- **Service URL:** `https://services.arcgis.com/xOi1kZaI0eWDREZv/arcgis/rest/services/NTAD_North_American_Rail_Network_Lines_Class_I_Railroads/FeatureServer`
- **Access date:** 2026-03-27
- **Query:** `STATEAB = 'IL'`
- **Result:** 4,516 segments with geometry
- **Carriers represented:** Union Pacific (1,040), Canadian National (947), BNSF (731), Norfolk Southern (641), CSX (347), CPKC (173), plus regional/terminal carriers
- **Note:** Includes all Class I-owned track in Illinois, including yards and sidings.

### Navigable Waterways
- **Source:** U.S. Army Corps of Engineers (USACE) Waterway Network, via Esri Federal Data ArcGIS service
- **Service URL:** `https://services7.arcgis.com/n1YM8pTrFmm7L4hs/ArcGIS/rest/services/Waterway_Networks/FeatureServer/1`
- **Access date:** 2026-03-27
- **Query:** Spatial filter on Illinois bounding box
- **Result:** 130 waterway segments
- **Rivers represented:** Mississippi (43 segments), Ohio (20), Illinois (18), Lake Michigan (13), Chicago River (6), Tennessee (6), Cumberland (6), Chicago Ship Canal (4), Calumet-Sag Channel (3), Kaskaskia (3), others
- **Note:** Dataset represents navigable waterways as defined by USACE. Not all segments are rated for spent fuel cask barge transport. The Dresden/Morris and Quad Cities barge evaluations are site-specific (see DOE/IAEA Near-Site Transportation Infrastructure studies).

### Strategic Highway Network (STRAHNET)
- **Source:** Federal Highway Administration (FHWA), via USDOT BTS National Transportation Atlas Database
- **Service URL:** `https://services.arcgis.com/xOi1kZaI0eWDREZv/arcgis/rest/services/NTAD_Strategic_Highway_Network/FeatureServer`
- **Access date:** 2026-03-27
- **Query:** `STFIPS = 17` (Illinois FIPS code)
- **Result:** 1,719 segments
- **Major routes:** I-55 (284 segments), I-57 (191), I-90 (183), I-290 (146), I-74 (122), I-80 (114), I-94 (117), I-72 (79), I-39 (73), I-88 (68), I-64 (53)
- **Note:** STRAHNET is the DOD's designated network of highways rated for strategic defense transport. Characterizing these as "nuclear transport capable" is our analytical framing; STRAHNET's official purpose is defense logistics. IDOT issues oversize/overweight permits under 625 ILCS 5/15-301 for heavy haul on these and other routes.

---

## DOE NLIC RFI

- **Source:** U.S. Department of Energy, "Nuclear Lifecycle Innovation Campuses" Request for Information
- **Published:** January 28, 2026
- **Response deadline:** April 1, 2026
- **SAM.gov listing:** Solicitation available at sam.gov
- **Key coverage:**
  - ANS Nuclear Newswire, "DOE lays out fuel cycle goals in RFI to states" (January 2026)
  - Neutron Bytes, "DOE seeks homes for the elements of the nuclear fuel cycle" (January 31, 2026)
  - DOE official announcement at energy.gov

---

## Transport Capability Statistics (Sidebar)

- **6,769 miles Class I rail:** Association of American Railroads (AAR), "Freight Rail in Illinois" (2023 data)
- **1,095 navigable waterway miles:** Illinois Department of Transportation, Waterway System overview
- **6 Class I carriers:** AAR. Union Pacific, BNSF, Canadian National, Norfolk Southern, CSX, CPKC.
- **#2 state rail network:** AAR state comparison (Texas is #1)

---

## DOE/PNNL Nuclear Power Plant Transportation Infrastructure Evaluations

### Program Overview
- **Program:** Nuclear Power Plant Infrastructure Evaluations for Removal of Spent Nuclear Fuel
- **Lead:** Pacific Northwest National Laboratory (PNNL), for DOE Office of Nuclear Energy, Office of Integrated Waste Management
- **Report:** PNNL-30429 (April 2021; updated February 2024)
- **DOI:** https://doi.org/10.2172/1798213
- **Authors:** Maheras, S.J.; Rodman, L.S.; Best, R.E.; Levin, A.; Ross, S.B.; Massaro, L.M.; Jensen, P.J.
- **Scope:** Infrastructure evaluations of 20 NPP sites including Dresden and Morris

### Dresden/Morris In-Person Site Evaluation (May 2022)
- **Paper:** WM2023-23024, "Dresden Nuclear Power Plant and Morris ISFSI Site Infrastructure Evaluations"
- **Conference:** 49th Annual Waste Management Conference (WM2023), Phoenix, AZ, Feb 26–Mar 2, 2023
- **Authors:** Maheras (PNNL), Hobbs (Constellation), Walker (Constellation), Partney (GE-Hitachi), Bickford (DOE), Peoples (INL), Arvidson (CSG Midwest), Moore (FRA)
- **INIS:** https://inis.iaea.org/records/y7p4r-wx930
- **Key findings cited:** CN Railroad transload assessment, multimodal transport evaluation

### Morris Virtual Site Evaluation (June 2020)
- **Paper:** WM2021-21004, "GE-Hitachi Morris Operation ISFSI Virtual Site Evaluation"
- **Conference:** 47th Annual Waste Management Conference (WM2021), Phoenix, AZ, Mar 8–12, 2021
- **Authors:** Maheras, Rodman, Bickford, Janairo, Arvidson, McFadden, Hobbs
- **INIS:** https://inis.iaea.org/records/5egjm-99f78
- **Key findings cited:** First DOE drone survey of a commercial nuclear facility; Dresden Lock and Dam and barge area mapped for waterway viability

### Historical Predecessor
- **Report:** OCRWM Near Site Transportation Infrastructure (NSTI) Study (January 1991)
- **Author:** Conroy, M.
- **Publisher:** DOE Office of Civilian Radioactive Waste Management
- **OSTI:** https://www.osti.gov/biblio/5602055
- **Scope:** All 76 reactor sites assessed for rail, road, and barge access

### Note on "IAEA" Attribution
IAEA's INIS database indexes the WM conference papers, but IAEA is not a co-author or co-sponsor. The correct attribution is DOE/PNNL.

---

## Methodology Notes

1. **Coordinate precision:** Plant and facility coordinates are to 4 decimal places (~11 meters), representing site centroids rather than individual reactor buildings.
2. **Spatial queries:** All infrastructure layers were queried using the Illinois bounding box (-91.5 to -87.5 longitude, 36.97 to 42.51 latitude), which includes some features in neighboring states near the border.
3. **Data pipeline:** Raw GeoJSON from government ArcGIS services → validated for feature count and geometry type → served directly (no transformation applied to geometry). Manual GeoJSON files (reactors, decommissioned, ISFSI, national labs) were hand-built from cited sources.
4. **No interpolation or estimation** was applied to any data. All figures are from cited sources.
