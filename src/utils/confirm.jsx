import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";

export const showConfirmation = (message, onConfirm) => {
  confirmAlert({
    customUI: ({ onClose }) => {
      return (
        <div className="bg-white p-6 rounded-lg shadow-lg text-gray-800 w-96">
          <h1 className="text-xl font-bold mb-4">{message}</h1>
          <p className="mb-6">Ova akcija je nepovratna.</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 font-semibold"
            >
              Otkaži
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white font-semibold"
            >
              Potvrdi
            </button>
          </div>
        </div>
      );
    },
    closeOnClickOutside: false,
  });
};

export const confirmAction = (message) => {
  return new Promise((resolve) => {
    confirmAlert({
      customUI: ({ onClose }) => (
        <div className="bg-white p-6 rounded-lg shadow-lg text-gray-800 w-96">
          <h1 className="text-xl font-bold mb-4">{message}</h1>
          <p className="mb-6">Da li ste sigurni da želite da nastavite?</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                onClose();
                resolve(false);
              }}
              className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 font-semibold"
            >
              Ne
            </button>
            <button
              onClick={() => {
                onClose();
                resolve(true);
              }}
              className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white font-semibold"
            >
              Da, siguran sam
            </button>
          </div>
        </div>
      ),
      closeOnClickOutside: false,
    });
  });
};
