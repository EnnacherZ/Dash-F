import React from "react";
import { FaSpinner, FaTrash, FaTriangleExclamation } from "react-icons/fa6";
import ModalBackdrop from "./modalBackdrop";

interface ConfirmDeleteModalProps {
  open: boolean;
  title: string;
  message: string;
  itemLabel?: string;
  confirmLabel: string;
  cancelLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  open,
  title,
  message,
  itemLabel,
  confirmLabel,
  cancelLabel,
  loading = false,
  onConfirm,
  onClose,
}) => (
  <ModalBackdrop onOpen={open} onClose={() => !loading && onClose()}>
    <div className="confirm-modal confirm-modal--danger">
      <h2 className="confirm-modal__title">
        <FaTriangleExclamation aria-hidden />
        {title}
      </h2>
      <p className="confirm-modal__subtitle mt-3">{message}</p>
      {itemLabel && <div className="confirm-modal__target">{itemLabel}</div>}
      <div className="confirm-modal__actions">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? <FaSpinner className="confirm-modal__spinner" aria-hidden /> : <FaTrash aria-hidden />}
          {confirmLabel}
        </button>
      </div>
    </div>
  </ModalBackdrop>
);

export default ConfirmDeleteModal;
