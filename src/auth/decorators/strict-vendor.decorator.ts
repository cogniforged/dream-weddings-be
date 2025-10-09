import { SetMetadata } from '@nestjs/common';

export const STRICT_VENDOR_ACCESS = 'strict_vendor_access';
export const StrictVendorAccess = () => SetMetadata(STRICT_VENDOR_ACCESS, true);

export const VENDOR_DASHBOARD_ACCESS = 'vendor_dashboard_access';
export const VendorDashboardAccess = () =>
  SetMetadata(VENDOR_DASHBOARD_ACCESS, true);

export const VENDOR_OPERATIONS_ACCESS = 'vendor_operations_access';
export const VendorOperationsAccess = () =>
  SetMetadata(VENDOR_OPERATIONS_ACCESS, true);
