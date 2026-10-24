# Boston bicycle count dashboard

City bike-count charts. Confirm an export before you depend on one.

Use: Checking a corridor the sensor table does not cover.

- [Source](<https://www.arcgis.com/apps/dashboards/3491f78e46a545fe8186ad70ebe897aa>)
- Kind: guidance
- Portal challenge tags: V3
- Source request: HTTP 200; fetched; 2026-10-24T15:05:47.371077+00:00
- Retention: title_short_excerpt_and_link_inventory

## Source response

Page title: ArcGIS Dashboards

Short opening excerpt (may include navigation): ArcGIS Dashboards

## Inspected subsets and related requests

| Resource | Result | Local evidence |
|---|---|---|
| [Boston bicycle dashboard web map](<https://www.arcgis.com/sharing/rest/content/items/fa5bd7b3b6d245a9af16063635dd5391/data?f=json>) | fetched | [File](<../responses/arcgis-fa5bd7b3b6d245a9af16063635dd5391.json>) |
| [Boston bicycle dashboard web map](<https://www.arcgis.com/sharing/rest/content/items/35b5008743be439096ceebd61cf1bc17/data?f=json>) | fetched | [File](<../responses/arcgis-35b5008743be439096ceebd61cf1bc17.json>) |
| [Boston Bicycle Network (2016) schema](<https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/active_transportation_network_gdb/FeatureServer/0?f=pjson>) | fetched | [File](<../responses/layer-716971b29a5e-schema.json>) |
| [Boston Bicycle Network (2016) count](<https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/active_transportation_network_gdb/FeatureServer/0/query?where=1%3D1&returnCountOnly=true&f=json>) | fetched | [File](<../responses/layer-716971b29a5e-count.json>) |
| [Boston Bicycle Network (2016) preview](<https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/active_transportation_network_gdb/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&resultRecordCount=100&f=json>) | fetched | [File](<../responses/layer-716971b29a5e-preview.json>) |
| [Streets Hourly Bike Counts schema](<https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/Streets_Hourly_Bike_Counts/FeatureServer/0?f=pjson>) | fetched | [File](<../responses/layer-3e100ec62c11-schema.json>) |
| [Streets Hourly Bike Counts count](<https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/Streets_Hourly_Bike_Counts/FeatureServer/0/query?where=1%3D1&returnCountOnly=true&f=json>) | fetched | [File](<../responses/layer-3e100ec62c11-count.json>) |
| [Streets Hourly Bike Counts preview](<https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/Streets_Hourly_Bike_Counts/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&resultRecordCount=100&f=json>) | fetched | [File](<../responses/layer-3e100ec62c11-preview.json>) |
| [Streets Daily Motor Vehicle Counts schema](<https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/Streets_Daily_Bike_Counts/FeatureServer/0?f=pjson>) | fetched | [File](<../responses/layer-cf076aad2170-schema.json>) |
| [Streets Daily Motor Vehicle Counts count](<https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/Streets_Daily_Bike_Counts/FeatureServer/0/query?where=1%3D1&returnCountOnly=true&f=json>) | fetched | [File](<../responses/layer-cf076aad2170-count.json>) |
| [Streets Daily Motor Vehicle Counts preview](<https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/Streets_Daily_Bike_Counts/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&resultRecordCount=100&f=json>) | fetched | [File](<../responses/layer-cf076aad2170-preview.json>) |
| [Daily bicycle count records 0](<https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/Streets_Daily_Bike_Counts/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&orderByFields=OBJECTID&resultRecordCount=1000&resultOffset=0&f=json>) | fetched | [File](<../responses/boston-daily-bike-full-0.json>) |
| [Daily bicycle count records 1000](<https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/Streets_Daily_Bike_Counts/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&orderByFields=OBJECTID&resultRecordCount=1000&resultOffset=1000&f=json>) | fetched | [File](<../responses/boston-daily-bike-full-1000.json>) |
| [Daily bicycle count records 2000](<https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/Streets_Daily_Bike_Counts/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&orderByFields=OBJECTID&resultRecordCount=1000&resultOffset=2000&f=json>) | fetched | [File](<../responses/boston-daily-bike-full-2000.json>) |

## Limits

A successful GET verifies a response, not a working application integration. First-page previews are not representative samples. Counts, units, dates, license terms and missing values need to be interpreted for the chosen product.

All discovered page links, including navigation, are preserved in `requests` inside [manifest.json](../manifest.json). They are not all recursively downloaded.
