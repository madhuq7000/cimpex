import { useEffect } from "react";
import type { FC } from "react";

interface ConfirmModalProps {
  show: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: FC<ConfirmModalProps> = ({
  show,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  confirming = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!show) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("modal-open");

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove("modal-open");
    };
  }, [show]);

  if (!show) {
    return null;
  }

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmModalTitle"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="confirmModalTitle">
                {title}
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                disabled={confirming}
                onClick={onCancel}
              ></button>
            </div>
            <div className="modal-body">
              <p className="mb-0">{message}</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={confirming}
                onClick={onCancel}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={confirming}
                onClick={onConfirm}
              >
                {confirming ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    {confirmLabel}
                  </>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        className="modal-backdrop fade show"
        onClick={() => {
          if (!confirming) {
            onCancel();
          }
        }}
      ></div>
    </>
  );
};

export default ConfirmModal;
