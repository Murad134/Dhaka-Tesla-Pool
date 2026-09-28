import Swal from "sweetalert2";

export function showSuccess(title, text) {
  return Swal.fire({
    icon: "success",
    title,
    text,
    timer: 2200,
    showConfirmButton: false
  });
}

export function showError(error, fallback = "Something went wrong. Please try again.") {
  const message = error?.message || fallback;
  return Swal.fire({
    icon: "error",
    title: error?.status ? `Request failed (${error.status})` : "Request failed",
    text: message,
    confirmButtonText: "Close"
  });
}