# Error handling

- Axios errors must be caught and re-thrown as IFlowError with code, message, and httpStatus.
- All commands wrap execution in try/catch and call logger.error() + process.exit(1) on failure.
- Network timeouts should produce: "Could not reach SAP BTP -- check btpBaseUrl and VPN".
