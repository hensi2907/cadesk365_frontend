import { callMethod } from "./client";
import type { ComplianceTracker, Customer } from "@/types/api";

export function sendOtp(
  phone: string
): Promise<{ status: string; message: string; dev_otp?: string }> {
  return callMethod(
    "cadesk365.api.get_client_portal_data.send_otp",
    { phone }
  );
}

export function verifyOtp(phone: string, otp: string): Promise<boolean> {
  return callMethod(
    "cadesk365.api.get_client_portal_data.verify_otp",
    { phone, otp }
  );
}

export function getClientPortalData(phone: string): Promise<{
  customer: Customer;
  records: ComplianceTracker[];
  documents: Array<any>;
}> {
  return callMethod(
    "cadesk365.api.get_client_portal_data.get_client_portal_data",
    { phone }
  );
}
