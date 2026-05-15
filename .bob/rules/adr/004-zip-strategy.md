# ADR 004: ZIP strategy

## Status
Accepted

## Context
Script collection uploads require a ZIP with flat .groovy files and a base64url payload.

## Decision
Use adm-zip for ZIP handling and keep all files at the ZIP root.

## Rationale
- adm-zip provides a simple, dependency-light API.
- Flat ZIP contents match SAP BTP expectations.
- Base64url encoding avoids unsafe URL characters in the payload.

## Consequences
- zip/handler.ts is the only place that manages ZIP encoding and decoding.
- Commands use zip helpers instead of touching ZIPs directly.
