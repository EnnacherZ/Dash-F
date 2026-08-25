import React, { useEffect, useState } from "react";
import { FaSpinner, FaTrash, FaTriangleExclamation } from "react-icons/fa6";
import ModalBackdrop from "./ModalBackdrop";

interface ConfirmDeleteModalProps {
  open: boolean;
  title: string;
  message: string;
  itemLabel?: string;
  confirmLabel: string;
  cancelLabel: string;
  loading?: boolean;
  requireText?: string;
  requireTextLabel?: string;
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
  requireText,
  requireTextLabel,
  onConfirm,
  onClose,
}) => {
  const [confirmation, setConfirmation] = useState("");
  const confirmed = !requireText || confirmation === requireText;

  useEffect(() => {
    if (open) setConfirmation("");
  }, [open]);

  return (
  <ModalBackdrop
    onOpen={open}
    onClose={onClose}
    dismissible={!loading}
    size="sm"
    label={title}
  >
    <div className="confirm-modal confirm-modal--danger">
      <h2 className="confirm-modal__title">
        <FaTriangleExclamation aria-hidden />
        {title}
      </h2>
      <p className="confirm-modal__subtitle mt-3">{message}</p>
      {itemLabel && <div className="confirm-modal__target">{itemLabel}</div>}
      {requireText && (
        <label className="confirm-modal__verification">
          <span>{requireTextLabel}</span>
          <strong>{requireText}</strong>
          <input
            type="text"
            className="form-control"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            disabled={loading}
          />
        </label>
      )}
      <div className="confirm-modal__actions">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={loading || !confirmed}>
          {loading ? <FaSpinner className="confirm-modal__spinner" aria-hidden /> : <FaTrash aria-hidden />}
          {confirmLabel}
        </button>
      </div>
    </div>
  </ModalBackdrop>
  );
};

export default ConfirmDeleteModal;
