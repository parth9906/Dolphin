import Swal from "sweetalert2";

export interface ConfirmActionOptions {
  title: string;
  text: string;
  confirmButtonText: string;
  cancelButtonText: string;
}

export async function confirmAction({
  title,
  text,
  confirmButtonText,
  cancelButtonText,
}: ConfirmActionOptions): Promise<boolean> {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    focusCancel: true,
  });

  return result.isConfirmed;
}

export function showInformationDialog({
  title,
  text,
  confirmButtonText = "Understood",
}: {
  title: string;
  text: string;
  confirmButtonText?: string;
}): void {
  void Swal.fire({
    title,
    text,
    icon: "info",
    confirmButtonText,
  });
}
