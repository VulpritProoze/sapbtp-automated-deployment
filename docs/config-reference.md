# Config reference

File: iflow.config.json

## Fields
- btpBaseUrl: Base API URL for SAP BTP Integration Suite.
- scriptCollectionsDir: Local folder for ScriptCollections.
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
  "scriptCollectionsDir": "./ScriptCollections",
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
