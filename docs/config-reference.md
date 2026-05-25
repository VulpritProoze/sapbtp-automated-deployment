# Config reference

File: sapbtp.config.json (preferred) or iflow.config.json (fallback)

## Fields
- btpBaseUrl: Base API URL for SAP BTP Integration Suite.
- scriptCollectionsDir: Local folder for ScriptCollections. Optional — defaults to `ScriptCollections` when absent.
- collections: Array of script collection registrations.
- defaultVersion: Default version string (typically "active").

## collections entry
- id: Script collection Id in SAP BTP.
- name: Display name for the collection.
- iflowId: Associated iFlow Id.
- iflowVersion: iFlow version (typically "active").

## Example
{
  "btpBaseUrl": "https://<your-tenant>.it-cpi018-rt.cfapps.<region>.hana.ondemand.com/api/v1",
  "collections": [
    {
      "id": "Scripts_SAPtoWEBPOS",
      "name": "Scripts_SAPtoWEBPOS",
      "iflowId": "SAPtoWEBPOS",
      "iflowVersion": "active"
    }
  ],
  "defaultVersion": "active"
}

Note: omit `scriptCollectionsDir` to use default `ScriptCollections`, or set it to a relative path to override.
