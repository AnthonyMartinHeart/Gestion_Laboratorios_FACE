import Swal from 'sweetalert2';

export async function deleteDataAlert() {
  return Swal.fire({
    title: "¿Estás seguro?",
    text: "¡No podrás revertir esto!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Si, eliminar!"
  })
}

export const showSuccessAlert = (titleMessage, message) => {
  Swal.fire(
    titleMessage,
    message,
    'success'
  );
};

export const showErrorAlert = (titleMessage, message) => {
  Swal.fire(
    titleMessage,
    message,
    'error'
  );
};

export const showConfirmAlert = async (title, text, confirmText = 'Confirmar', cancelText = 'Cancelar') => {
  const result = await Swal.fire({
    title: title,
    text: text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText
  });

  return result.isConfirmed;
};
