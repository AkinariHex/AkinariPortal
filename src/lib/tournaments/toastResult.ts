import { toast } from "sonner";

type Result = { status: string; message?: string };

// Toast a server action result; true when it succeeded.
export function toastResult(result: Result, success: string): boolean {
  if (result.status === "done") {
    toast.success(result.message ?? success);
    return true;
  }
  toast.error(result.message ?? (result.status === "unauthorized" ? "Not allowed." : "Something went wrong."));
  return false;
}
